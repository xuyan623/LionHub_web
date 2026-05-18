import { state } from "../core/state.js";
import { uid } from "../core/security.js";
import { createComment, parseList, clamp, roundPointFromSettings, toArray } from "../core/utils.js";
import { addRecord, removeRecord, removeWhere } from "../core/data-access.js";
import { saveDatabase } from "../core/database.js";
import { pushModal, popModal, clearModalStack } from "../core/modal.js";
import { uploadLocalAttachments, deleteLocalAttachments } from "../core/upload.js";
import { canEditTask, canCreateTask, canDeleteTask, canMemberParticipateInTasks, canDeleteAllGeneratedData, canDeleteTaskGeneratedData, canReview, canMemberBeAddedToTask, canInteractWithTasks, canMemberAccruePoints, isTaskOpenStatus, getLifecycleBlockingTasks } from "./permissions.js";
import { getCurrentMember, getTaskById, getMemberById, getTaskParticipantRecords, getActiveParticipantCount, getApprovalById } from "./query.js";
import { pushFlash, renderApp } from "../core/services.js";
import { canDeletePointTransaction } from "./permissions.js";
import { createNotification, getRecipientUserIdsFromMentionText, getParticipantUserIds, getReviewerUserIds, removeNotificationsBySource, removeNotificationsByTask } from "./notifications.js";

export function deriveTaskStatus(task) {
  if (task.status === "completed" || task.status === "pending_review") {
    return task.status;
  }
  const now = Date.now();
  const due = task.dueAt ? new Date(task.dueAt).getTime() : Infinity;
  if (task.progressPercent >= 100) {
    return "pending_review";
  }
  if (due < now && task.progressPercent < 100) {
    return "overdue";
  }
  if (task.progressPercent === 0) {
    return "todo";
  }
  return "in_progress";
}

export async function handleTaskForm(form) {
  const formData = new FormData(form);
  const taskId = String(formData.get("taskId") || "").trim();
  const editing = Boolean(taskId);
  const ownerId = String(formData.get("ownerId") || "").trim() || getCurrentMember().id;
  const task = editing ? getTaskById(taskId) : null;
  const now = new Date().toISOString();

  if (task && task.id !== taskId) task.id = taskId;
  if (editing && task && !canEditTask(task)) { pushFlash("当前没有权限修改该任务。", "info"); return; }
  if (!editing && !canCreateTask()) { pushFlash("当前身份没有发布任务权限。", "info"); return; }

  const submittedStatus = String(formData.get("status") || "").trim();
  const payload = {
    title: String(formData.get("title") || "").trim(),
    type: String(formData.get("type") || "research"),
    departments: formData.getAll("departments").filter(Boolean),
    directions: formData.getAll("directions").filter(Boolean),
    robotGroups: formData.getAll("robotGroups").filter(Boolean),
    priority: String(formData.get("priority") || "medium"),
    difficulty: String(formData.get("difficulty") || "normal"),
    dueAt: String(formData.get("dueAt") || "").trim(),
    recommendedFor: String(formData.get("recommendedFor") || "").trim(),
    studyPoints: Number(formData.get("studyPoints") || 0),
    laborPoints: Number(formData.get("laborPoints") || 0),
    managementPoints: Number(formData.get("managementPoints") || 0),
    maxParticipants: Number(formData.get("maxParticipants") || 1),
    approvalRequired: String(formData.get("approvalRequired") || "false") === "true",
    description: String(formData.get("description") || "").trim(),
    acceptanceCriteria: String(formData.get("acceptanceCriteria") || "").trim(),
    tags: parseList(String(formData.get("tags") || "")),
  };

  if (!payload.title || !payload.departments.length || !payload.dueAt || !payload.description || !payload.recommendedFor) {
    pushFlash("任务字段未填写完整，无法保存。", "info"); return;
  }

  if (editing && task) {
    Object.assign(task, payload);
    if (canDeleteAllGeneratedData() && submittedStatus) {
      task.status = submittedStatus;
    } else {
      task.status = deriveTaskStatus(task);
    }
  } else {
    const createdTask = {
      id: uid("task"), ownerId, creatorId: getCurrentMember().id, createdAt: now,
      submittedAt: null, completedAt: null,
      progressPercent: 0,
      status: "todo",
      blockers: "", attachments: [], comments: [], progressNodes: [], publicToMarket: true, ...payload,
    };
    addRecord("tasks", createdTask);
    addRecord("taskParticipants", {
      id: uid("participant"), taskId: createdTask.id, memberId: ownerId, role: "负责人",
      joinType: "initial", status: "involved", joinedAt: now, exitedAt: null, contributionRatio: 1,
    });
  }

  if (!(await saveDatabase())) return;
  clearModalStack();
  pushFlash(editing ? "任务已更新。" : "任务已创建并发布到任务市场。", "info");
}

export async function deleteTask(taskId) {
  const task = getTaskById(taskId);
  if (!task) { pushFlash("任务不存在，无法删除。", "info"); return; }
  if (!canDeleteTask(task)) { pushFlash("只有任务发布者或管理员可以删除任务。", "info"); return; }
  const confirmed = window.confirm(`确认删除任务《${task.title}》？这会同时移除相关参与记录、审核记录和积分流水。`);
  if (!confirmed) return;

  const taskAttachments = [...(task.attachments || [])];
  removeWhere("tasks", (item) => item.id === taskId);
  removeWhere("taskParticipants", (participant) => participant.taskId === taskId);
  removeWhere("approvals", (approval) => approval.targetId === taskId);
  removeWhere("pointTransactions", (transaction) => transaction.taskId === taskId);
  removeNotificationsByTask(taskId);
  if (state.modal?.taskId === taskId) clearModalStack();
  if (!(await saveDatabase())) return;
  await deleteLocalAttachments(taskAttachments);
  pushFlash(`任务《${task.title}》已删除。`, "info");
}

export async function handleProgressForm(form) {
  const task = getTaskById(String(form.dataset.taskId || ""));
  if (!task || !canInteractWithTasks()) return;
  const formData = new FormData(form);
  const progressPercent = clamp(Number(formData.get("progressPercent") || 0), 0, 100);
  const previousPercent = task.progressPercent;

  task.progressPercent = progressPercent;
  task.status = deriveTaskStatus(task);

  const owner = getMemberById(task.ownerId);
  const updater = getCurrentMember();
  if (owner && owner.userId && owner.userId !== updater.userId) {
    createNotification(owner.userId, `${updater.name} 更新了《${task.title}》的进度到 ${progressPercent}%`, { sourceId: task.id, sourceType: "task", taskId: task.id, memberId: updater.id, type: "progress" });
  }

  if (!(await saveDatabase())) return;

  if (progressPercent === 100 && previousPercent < 100) {
    pushFlash("进度已达 100%，请填写成果说明并提交审核。", "info");
    pushModal({ type: "task-completion", taskId: task.id, pendingFiles: [], initialSummary: "" });
  } else {
    pushFlash("进度已更新。", "info");
  }
}

export async function handleProgressNoteForm(form) {
  const task = getTaskById(String(form.dataset.taskId || ""));
  if (!task || !canInteractWithTasks()) return;
  const formData = new FormData(form);
  const note = String(formData.get("note") || "").trim();
  if (!note) { pushFlash("请填写进度说明。", "info"); return; }

  const node = {
    id: uid("node"),
    taskId: task.id,
    percent: task.progressPercent,
    note,
    attachments: [],
    createdAt: new Date().toISOString(),
    authorId: getCurrentMember().id,
  };
  if (!Array.isArray(task.progressNodes)) task.progressNodes = [];
  task.progressNodes.unshift(node);

  const owner = getMemberById(task.ownerId);
  const updater = getCurrentMember();
  if (owner && owner.userId && owner.userId !== updater.userId) {
    createNotification(owner.userId, `${updater.name} 为《${task.title}》添加了进度说明`, { sourceId: node.id, sourceType: "progress_node", taskId: task.id, memberId: updater.id, type: "progress" });
  }

  if (!(await saveDatabase())) return;
  popModal();
  pushFlash("进度说明已添加。", "info");
}

export async function handleTaskAttachmentForm(form) {
  const task = getTaskById(String(form.dataset.taskId || ""));
  if (!task || !canInteractWithTasks()) return;
  const formData = new FormData(form);
  const selectedFiles = getSelectedUploadFiles(formData.getAll("attachments"));
  if (!selectedFiles.length) { pushFlash("请选择要上传的附件。", "info"); return; }

  let uploadedAttachments = [];
  try {
    uploadedAttachments = await uploadLocalAttachments(task.id, selectedFiles, "task_attachment");
    for (const attachment of uploadedAttachments) {
      task.attachments.push(attachment);
    }
  } catch (error) {
    pushFlash(error instanceof Error ? error.message : "附件上传失败，请稍后重试。", "info");
    return;
  }

  if (!(await saveDatabase())) {
    await cleanupUploadedAttachmentsAfterFailedSave(uploadedAttachments);
    return;
  }
  popModal();
  pushFlash("附件已上传。", "info");
}

export async function deleteProgressNode(taskId, nodeId) {
  const task = getTaskById(taskId);
  const node = task?.progressNodes?.find((n) => n.id === nodeId);
  if (!task || !node || !canDeleteTaskGeneratedData(task, node.authorId)) {
    pushFlash("当前没有权限删除该进度节点。", "info"); return;
  }
  if (!window.confirm("确认删除这条进度记录？")) return;
  const nodeAttachments = [...(node.attachments || [])];
  task.progressNodes = (task.progressNodes || []).filter((n) => n.id !== nodeId);
  // Also remove the underlying historical comment to prevent migration from re-creating it
  const migratedComment = task.comments?.find((c) => c.id === nodeId);
  if (migratedComment) {
    task.comments = task.comments.filter((c) => c.id !== nodeId);
    removeNotificationsBySource("comment", nodeId);
  }
  removeNotificationsBySource("progress_node", nodeId);
  if (!(await saveDatabase())) return;
  await deleteLocalAttachments(nodeAttachments);
  renderApp();
  pushFlash("进度记录已删除。", "info");
}

export async function handleCommentForm(form) {
  const task = getTaskById(String(form.dataset.taskId || ""));
  if (!task || !canInteractWithTasks()) return;
  const content = String(new FormData(form).get("comment") || "").trim();
  if (!content) { pushFlash("评论内容不能为空。", "info"); return; }
  const member = getCurrentMember();
  const comment = createComment("评论", content, member);
  task.comments.unshift(comment);
  // @mention notifications
  const mentionedUserIds = getRecipientUserIdsFromMentionText(content);
  mentionedUserIds.forEach((userId) => {
    createNotification(userId, `${member.name} 在《${task.title}》中提到了你`, { sourceId: comment.id, sourceType: "comment", taskId: task.id, memberId: member.id, type: "mention" });
  });
  // Notify other participants of new comment
  const participantUserIds = getParticipantUserIds(task.id, member.userId || "");
  participantUserIds.forEach((userId) => {
    if (!mentionedUserIds.includes(userId)) {
      createNotification(userId, `${member.name} 评论了《${task.title}》`, { sourceId: comment.id, sourceType: "comment", taskId: task.id, memberId: member.id, type: "comment" });
    }
  });
  if (!(await saveDatabase())) return;
  pushFlash("评论已添加。", "info");
}

export async function handleSubmissionForm(form) {
  const task = getTaskById(String(form.dataset.taskId || ""));
  if (!task) return;
  if (!canInteractWithTasks()) { pushFlash("当前成员状态为只读，不能提交成果。", "info"); return; }
  if (task.progressPercent < 100) { pushFlash("任务进度必须达到 100% 才能提交成果。", "info"); return; }
  const formData = new FormData(form);
  const summary = String(formData.get("summary") || "").trim();
  const selectedTaskMaterialIds = new Set(formData.getAll("selectedTaskMaterialIds").map((value) => String(value || "").trim()).filter(Boolean));
  const stagedFiles = Array.isArray(state.modal?.pendingFiles) ? state.modal.pendingFiles : [];
  const selectedFiles = [...stagedFiles, ...getSelectedUploadFiles(formData.getAll("attachments"))];
  if (!summary) { pushFlash("提交成果时必须填写成果说明。", "info"); return; }

  let uploadedAttachments = [];
  if (selectedFiles.length) {
    try {
      uploadedAttachments = await uploadLocalAttachments(task.id, selectedFiles, "review_material");
    } catch (error) {
      pushFlash(error instanceof Error ? error.message : "附件上传失败，请稍后重试。", "info");
      return;
    }
  }

  const selectedTaskMaterials = getTaskMaterialAttachments(task)
    .filter((attachment) => selectedTaskMaterialIds.has(attachment.id))
    .map(cloneTaskMaterialAsReviewAttachment);
  const reviewAttachments = [...uploadedAttachments, ...selectedTaskMaterials];

  task.status = "pending_review";
  task.submittedAt = new Date().toISOString();
  const submitter = getCurrentMember();
  const submissionComment = createComment("成果提交", summary, submitter);
  task.comments.unshift(submissionComment);
  ensureCompletionApproval(task, "提交成果等待审核", reviewAttachments);
  const owner = getMemberById(task.ownerId);
  if (owner && owner.userId && owner.userId !== submitter.userId) {
    createNotification(owner.userId, `${submitter.name} 提交了《${task.title}》的成果，等待审核`, { sourceId: submissionComment.id, sourceType: "comment", taskId: task.id, memberId: submitter.id, type: "task_review" });
  }
  if (!(await saveDatabase())) {
    await cleanupUploadedAttachmentsAfterFailedSave(uploadedAttachments);
    return;
  }
  clearModalStack();
  pushFlash("成果已提交，等待审核。", "info");
}

function ensureCompletionApproval(task, comment, attachments = []) {
  removePendingCompletionApprovals(task.id);
  state.database.approvals.unshift({
    id: uid("approval"), type: "completion", targetId: task.id,
    submitterId: getCurrentMember().id, approverId: null, status: "pending",
    comment, createdAt: new Date().toISOString(), reviewedAt: null,
    attachments,
  });
}

function removePendingCompletionApprovals(taskId) {
  state.database.approvals = state.database.approvals.filter(
    (approval) => !(approval.type === "completion" && approval.targetId === taskId && approval.status === "pending")
  );
}

export function isTaskMaterialAttachment(attachment) {
  return attachment?.source === "task_attachment";
}

export function getTaskMaterialAttachments(task) {
  return (task.attachments || []).filter(isTaskMaterialAttachment);
}

function cloneTaskMaterialAsReviewAttachment(attachment) {
  return {
    ...attachment,
    source: "review_material",
    reviewMaterialOrigin: "task_attachment",
    originalAttachmentId: attachment.id,
  };
}

export function getTaskReviewAttachments(approval) {
  return approval?.attachments || [];
}

function getCommentTimestamp(comment) {
  const timestamp = Date.parse(comment?.createdAt || "");
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

export function getLatestSubmissionComment(task) {
  const submissionComments = (task.comments || []).filter((comment) => comment.title === "成果提交");
  if (!submissionComments.length) {
    return null;
  }
  return submissionComments.reduce((latestComment, currentComment) => {
    if (!latestComment) {
      return currentComment;
    }
    return getCommentTimestamp(currentComment) > getCommentTimestamp(latestComment)
      ? currentComment
      : latestComment;
  }, null);
}

export function getLatestSubmissionSummary(task) {
  return getLatestSubmissionComment(task)?.content || "";
}

export function appendTaskAttachments(task, attachments) {
  for (const attachment of attachments) {
    task.attachments.push(attachment);
  }
}

async function cleanupUploadedAttachmentsAfterFailedSave(attachments) {
  if (!attachments.length) {
    return;
  }
  await deleteLocalAttachments(attachments);
}

export async function deleteTaskComment(taskId, commentId) {
  const task = getTaskById(taskId);
  const comment = task?.comments?.find((item) => item.id === commentId);
  if (!task || !comment || !canDeleteTaskGeneratedData(task, comment.authorId)) {
    pushFlash("当前没有权限删除这条评论。", "info"); return;
  }
  if (!window.confirm("确认删除这条评论？删除后不可恢复。")) return;
  task.comments = (task.comments || []).filter((item) => item.id !== commentId);
  removeNotificationsBySource("comment", commentId);
  if (!(await saveDatabase())) return;
  renderApp();
  pushFlash("评论已删除。", "info");
}

export async function deleteTaskAttachment(taskId, attachmentId) {
  const task = getTaskById(taskId);
  const attachment = task?.attachments?.find((item) => item.id === attachmentId);
  if (!task || !attachment || !canDeleteTaskGeneratedData(task, attachment.uploadedBy || "")) {
    pushFlash("当前没有权限删除该附件。", "info"); return;
  }
  if (!window.confirm(`确认删除附件《${attachment.name}》？删除后不可恢复。`)) return;
  task.attachments = (task.attachments || []).filter((item) => item.id !== attachmentId);
  state.database.approvals = (state.database.approvals || []).map((approval) => {
    if (!Array.isArray(approval.attachments) || !approval.attachments.length) {
      return approval;
    }
    return {
      ...approval,
      attachments: approval.attachments.filter((item) => {
        if (item.originalAttachmentId && item.originalAttachmentId === attachment.id) {
          return false;
        }
        if (item.reviewMaterialOrigin === "task_attachment" && item.storagePath && item.storagePath === attachment.storagePath) {
          return false;
        }
        return true;
      }),
    };
  });
  if (!(await saveDatabase())) return;
  await deleteLocalAttachments([attachment]);
  if (state.settingsFiles) {
    state.settingsFiles = state.settingsFiles.filter((file) => file.path !== attachment.storagePath);
  }
  renderApp();
  pushFlash("附件已删除。", "info");
}

export async function deleteProgressNodeAttachment(taskId, nodeId, attachmentId) {
  const task = getTaskById(taskId);
  const node = task?.progressNodes?.find((n) => n.id === nodeId);
  const attachment = node?.attachments?.find((a) => a.id === attachmentId);
  if (!task || !node || !attachment || !canDeleteTaskGeneratedData(task, node.authorId)) {
    pushFlash("当前没有权限删除该附件。", "info"); return;
  }
  if (!window.confirm(`确认删除附件《${attachment.name}》？删除后不可恢复。`)) return;
  node.attachments = (node.attachments || []).filter((a) => a.id !== attachmentId);
  if (!node.note && !node.attachments.length) {
    task.progressNodes = (task.progressNodes || []).filter((n) => n.id !== nodeId);
    const migratedComment = task.comments?.find((c) => c.id === nodeId);
    if (migratedComment) {
      task.comments = task.comments.filter((c) => c.id !== nodeId);
      removeNotificationsBySource("comment", nodeId);
    }
    removeNotificationsBySource("progress_node", nodeId);
  }
  if (!(await saveDatabase())) return;
  await deleteLocalAttachments([attachment]);
  if (state.settingsFiles) {
    state.settingsFiles = state.settingsFiles.filter((file) => file.path !== attachment.storagePath);
  }
  renderApp();
  pushFlash(node.attachments.length || node.note ? "附件已删除。" : "进度记录已清空并自动删除。", "info");
}

export async function joinTask(taskId) {
  const task = getTaskById(taskId);
  const member = getCurrentMember();
  if (!task || !member) return;
  if (!canInteractWithTasks()) { pushFlash("当前成员状态为只读，不参与普通任务操作。", "info"); return; }
  if (task.status === "completed") {
    pushFlash("已完成任务不能再领取。", "info");
    return;
  }
  if (task.status === "pending_review") {
    pushFlash("当前任务正在审核中，不能再领取。", "info");
    return;
  }
  if (getActiveParticipantCount(task.id) >= task.maxParticipants) {
    pushFlash("任务人数已满，当前版本不提供候补机制。", "info"); return;
  }
  const existing = getTaskParticipantRecords(task.id).find((item) => item.memberId === member.id && item.status !== "exited");
  if (existing) { pushFlash("你已经在该任务中。", "info"); return; }

  const exited = getTaskParticipantRecords(task.id).find((item) => item.memberId === member.id && item.status === "exited");
  if (exited) {
    exited.status = "involved"; exited.exitedAt = null; exited.joinedAt = new Date().toISOString();
    removeWhere("taskParticipants", (item) => item.taskId === task.id && item.memberId === member.id && item.status === "exited" && item.id !== exited.id);
    if (!(await saveDatabase())) return;
    pushFlash("已重新加入任务。", "info"); return;
  }

  const isMiddleJoinTask = task.status !== "todo";
  const needsApproval = isMiddleJoinTask || task.approvalRequired || (state.database.settings.hardTaskNeedsApproval && ["hard", "core"].includes(task.difficulty));
  if (needsApproval) {
    const pending = state.database.approvals.find((approval) => approval.type === "join" && approval.status === "pending" && approval.targetId === task.id && approval.submitterId === member.id);
    if (pending) { pushFlash(isMiddleJoinTask ? "当前任务已存在你的中途加入申请。": "该任务已存在你的待审批加入申请。", "info"); return; }
    const approval = { id: uid("approval"), type: "join", targetId: task.id, submitterId: member.id, approverId: null, status: "pending", comment: isMiddleJoinTask ? "申请中途加入任务" : "申请加入高难任务", createdAt: new Date().toISOString(), reviewedAt: null };
    addRecord("approvals", approval);
    // Notify reviewers of new join request
    const reviewerUserIds = getReviewerUserIds();
    reviewerUserIds.forEach((reviewerId) => {
      createNotification(reviewerId, `${member.name} 申请${isMiddleJoinTask ? "中途加入" : "加入"}任务《${task.title}》`, { sourceId: approval.id, sourceType: "approval", taskId: task.id, memberId: member.id, type: "info" });
    });
    if (!(await saveDatabase())) return;
    pushFlash(isMiddleJoinTask ? "已提交中途加入申请，等待组长或管理员审批。" : "已提交加入申请，等待组长或管理员审批。", "info"); return;
  }

  const newParticipant = { id: uid("participant"), taskId: task.id, memberId: member.id, role: "协作者", joinType: task.status === "todo" ? "initial" : "middle", status: "involved", joinedAt: new Date().toISOString(), exitedAt: null, contributionRatio: 1 };
  addRecord("taskParticipants", newParticipant);
  // Notify task owner of new participant
  const owner = getMemberById(task.ownerId);
  if (owner && owner.userId && owner.userId !== member.userId) {
    createNotification(owner.userId, `${member.name} 领取了任务《${task.title}》`, { sourceId: newParticipant.id, sourceType: "participant", taskId: task.id, memberId: member.id, type: "task_assign" });
  }
  if (!(await saveDatabase())) return;
  pushFlash("任务领取成功，已加入我的任务。", "info");
}

export async function exitTask(taskId) {
  const member = getCurrentMember();
  if (!canInteractWithTasks()) { pushFlash("当前成员状态为只读，不能退出任务。", "info"); return; }
  const task = getTaskById(taskId);
  const participant = getTaskParticipantRecords(taskId).find((item) => item.memberId === member.id && item.status === "involved");
  if (!participant) { pushFlash("当前未参与该任务，无法退出。", "info"); return; }
  if (task && task.ownerId === member.id) { pushFlash("当前负责人不能直接退出任务，请先改派新的负责人。", "info"); return; }
  if (!window.confirm("确认退出该任务？退出后默认不获得点数。")) return;
  if (task && task.status === "todo") {
    removeRecord("taskParticipants", participant.id);
  } else {
    participant.status = "exited";
    participant.exitedAt = new Date().toISOString();
  }
  if (!(await saveDatabase())) return;
  pushFlash("已退出该任务。根据规则默认不获得点数。", "info");
}

async function handleTaskParticipantAddAction(form) {
  const task = getTaskById(String(form.dataset.taskId || ""));
  if (!task || !canEditTask(task)) { pushFlash("当前没有权限修改该任务成员。", "info"); return; }
  const memberId = String(new FormData(form).get("memberId") || "").trim();
  const member = getMemberById(memberId);
  if (!member || !canMemberBeAddedToTask(member)) { pushFlash("当前选择的成员不能被加入该任务。", "info"); return; }
  if (getTaskParticipantRecords(task.id).some((participant) => participant.memberId === memberId && participant.status === "involved")) {
    pushFlash("该成员已经在当前任务中。", "info"); return;
  }

  const exited = getTaskParticipantRecords(task.id).find((participant) => participant.memberId === memberId && participant.status === "exited");
  if (exited) {
    exited.status = "involved"; exited.exitedAt = null;
    removeWhere("taskParticipants", (item) => item.taskId === task.id && item.memberId === memberId && item.status === "exited" && item.id !== exited.id);
    if (!(await saveDatabase())) return;
    pushFlash(`已将 ${member.name} 重新加入任务。`, "info"); return;
  }

  if (getActiveParticipantCount(task.id) >= task.maxParticipants) { pushFlash("当前任务人数已满，请先调整人数上限或移除其他成员。", "info"); return; }
  const newParticipant = { id: uid("participant"), taskId: task.id, memberId, role: "协作者", joinType: task.status === "todo" ? "initial" : "middle", status: "involved", joinedAt: new Date().toISOString(), exitedAt: null, contributionRatio: 1 };
  addRecord("taskParticipants", newParticipant);
  if (member.userId) {
    createNotification(member.userId, `${getCurrentMember().name} 将你加入了任务《${task.title}》`, { sourceId: newParticipant.id, sourceType: "participant", taskId: task.id, memberId: getCurrentMember().id, type: "task_assign" });
  }
  if (!(await saveDatabase())) return;
  pushFlash(`已将 ${member.name} 加入任务。`, "info");
}

async function removeTaskParticipantAction(taskId, memberId) {
  const task = getTaskById(taskId);
  if (!task || !canEditTask(task)) { pushFlash("当前没有权限修改该任务成员。", "info"); return; }
  const participant = getTaskParticipantRecords(taskId).find((item) => item.memberId === memberId && item.status === "involved");
  if (!participant) { pushFlash("该成员当前不在任务参与列表中。", "info"); return; }
  if (task.ownerId === memberId) { pushFlash("当前负责人不能直接移除，请先改派新的负责人。", "info"); return; }
  const member = getMemberById(memberId);
  if (!window.confirm(`确认将 ${member?.name || "该成员"} 移出任务？`)) return;
  if (task.status === "todo") {
    removeRecord("taskParticipants", participant.id);
    // Clean up notifications tied to this participant record
    removeNotificationsBySource("participant", participant.id);
  } else { participant.status = "exited"; participant.exitedAt = new Date().toISOString(); }
  if (!(await saveDatabase())) return;
  pushFlash("已移除该任务协作者。", "info");
}

async function handleTaskOwnerReassignFormAction(form) {
  const task = getTaskById(String(form.dataset.taskId || ""));
  if (!task || !canEditTask(task)) { pushFlash("当前没有权限改派负责人。", "info"); return; }
  const nextOwnerId = String(new FormData(form).get("memberId") || "").trim();
  const nextOwner = getMemberById(nextOwnerId);
  if (!nextOwner) { pushFlash("新的负责人不存在。", "info"); return; }
  if (!canMemberBeAddedToTask(nextOwner)) { pushFlash("当前选择的成员不能担任负责人。", "info"); return; }
  const nextOwnerParticipant = getTaskParticipantRecords(task.id).find((item) => item.memberId === nextOwnerId && item.status === "involved");
  if (!nextOwnerParticipant) { pushFlash("新的负责人必须已经在当前任务参与列表中。", "info"); return; }
  const previousOwnerParticipant = getTaskParticipantRecords(task.id).find((item) => item.memberId === task.ownerId && item.status === "involved");
  task.ownerId = nextOwnerId;
  nextOwnerParticipant.role = "负责人";
  if (previousOwnerParticipant && previousOwnerParticipant.id !== nextOwnerParticipant.id) previousOwnerParticipant.role = "协作者";
  if (nextOwner.userId) {
    createNotification(nextOwner.userId, `你已被任命为任务《${task.title}》的负责人`, { sourceId: task.id, sourceType: "task", taskId: task.id, memberId: getCurrentMember().id, type: "task_assign" });
  }
  if (!(await saveDatabase())) return;
  popModal();
  pushFlash(`负责人已改派给 ${nextOwner.name}。`, "info");
}

export async function handleTaskParticipantAdd(form) { return handleTaskParticipantAddAction(form); }
export async function removeTaskParticipant(taskId, memberId) { return removeTaskParticipantAction(taskId, memberId); }
export async function handleTaskOwnerReassignForm(form) { return handleTaskOwnerReassignFormAction(form); }

export function settleTaskPoints(task) {
  const preview = buildTaskSettlementPreview(task);
  if (!preview.memberSettlements.length) {
    return;
  }
  if (!preview.totalWeight || preview.totalWeight <= 0) {
    console.error("settleTaskPoints: totalWeight is zero or invalid, aborting.");
    return;
  }

  for (const transaction of preview.pendingTransactions) {
    addRecord("pointTransactions", transaction);
  }
}

export function getTaskSettlementPreview(task) {
  const preview = buildTaskSettlementPreview(task);
  return {
    memberSettlements: preview.memberSettlements,
    middleJoinDiscount: preview.middleJoinDiscount,
    overdueDiscount: preview.overdueDiscount,
    pendingTransactions: preview.pendingTransactions,
    totalWeight: preview.totalWeight,
    totals: preview.totals,
    wasOverdue: preview.wasOverdue,
  };
}

export async function handleCompensationForm(form) {
  if (!canDeleteAllGeneratedData()) { pushFlash("只有管理员可以发放补偿点。", "info"); return; }
  const formData = new FormData(form);
  const task = getTaskById(String(form.dataset.taskId || ""));
  const memberId = String(formData.get("memberId") || "");
  const type = String(formData.get("pointType") || "compensation");
  const amount = Number(formData.get("amount") || 0);
  const reason = String(formData.get("reason") || "").trim();
  if (!task || !memberId || !amount || !reason) { pushFlash("补偿点字段未填写完整。", "info"); return; }
  if (!canMemberAccruePoints(getMemberById(memberId))) { pushFlash("退休或停用成员不能新增积分。", "info"); return; }

  const now = new Date().toISOString();
  addRecord("pointTransactions", { id: uid("point"), memberId, taskId: task.id, type, amount: roundPointFromSettings(amount), reason, operatorId: getCurrentMember().id, createdAt: now });
  addRecord("approvals", { id: uid("approval"), type: "compensation", targetId: memberId, submitterId: getCurrentMember().id, approverId: getCurrentMember().id, status: "approved", comment: `${task.title} 补偿点：${reason}`, createdAt: now, reviewedAt: now });
  if (!(await saveDatabase())) return;
  pushFlash("补偿点已记录。", "info");
}

export async function handleRatioForm(form) {
  const task = getTaskById(String(form.dataset.taskId || ""));
  if (!task || !canDeleteAllGeneratedData()) return;
  const participants = getTaskParticipantRecords(task.id).filter((item) => item.status !== "exited");
  participants.forEach((participant) => {
    const raw = Number(new FormData(form).get(`ratio_${participant.id}`) || participant.contributionRatio);
    participant.contributionRatio = Math.max(0.1, raw);
  });
  if (!(await saveDatabase())) return;
  pushFlash("贡献比例已更新。", "info");
}

export async function deletePointTransaction(pointId) {
  const transaction = state.database.pointTransactions.find((item) => item.id === pointId);
  if (!transaction || !canDeletePointTransaction(transaction)) {
    pushFlash("当前没有权限删除该积分流水。", "info");
    return;
  }
  if (!window.confirm("确认删除这条积分流水？删除后不可恢复。")) return;
  removeWhere("pointTransactions", (item) => item.id === pointId);
  if (!(await saveDatabase())) return;
  pushFlash("积分流水已删除。", "info");
}

function getSelectedUploadFiles(values) {
  return values.filter((value) => value instanceof File && value.size > 0);
}

function buildTaskSettlementPreview(task) {
  const participants = getTaskParticipantRecords(task.id).filter((item) => item.status !== "exited");
  if (!participants.length) {
    return {
      memberSettlements: [],
      middleJoinDiscount: state.database.settings.middleJoinDiscount ?? 0.5,
      overdueDiscount: 1,
      pendingTransactions: [],
      totalWeight: 0,
      totals: { study: 0, labor: 0, management: 0, total: 0 },
      wasOverdue: false,
    };
  }

  const wasOverdue = task.dueAt && new Date(task.dueAt).getTime() < new Date(task.submittedAt || task.completedAt || new Date().toISOString()).getTime();
  const overdueDiscount = wasOverdue ? (state.database.settings.overduePointDiscount ?? 0.5) : 1;
  const middleJoinDiscount = state.database.settings.middleJoinDiscount ?? 0.5;
  const now = new Date().toISOString();
  const operatorId = getCurrentMember().id;

  const weightedParticipants = participants.map((participant) => ({
    participant,
    member: getMemberById(participant.memberId),
    weight: participant.contributionRatio * (participant.joinType === "middle" ? middleJoinDiscount : 1) * overdueDiscount,
  }));
  const totalWeight = weightedParticipants.reduce((sum, item) => sum + item.weight, 0);
  const pendingTransactions = [];
  const memberSettlements = [];

  for (const { participant, member, weight } of weightedParticipants) {
    const eligible = canMemberAccruePoints(member);
    const studyAmount = eligible && totalWeight > 0 ? roundPointFromSettings((task.studyPoints * weight) / totalWeight) : 0;
    const laborAmount = eligible && totalWeight > 0 ? roundPointFromSettings((task.laborPoints * weight) / totalWeight) : 0;

    if (studyAmount < 0 || laborAmount < 0) {
      console.error("buildTaskSettlementPreview: negative amount detected, aborting preview.");
      return {
        memberSettlements: [],
        middleJoinDiscount,
        overdueDiscount,
        pendingTransactions: [],
        totalWeight: 0,
        totals: { study: 0, labor: 0, management: 0, total: 0 },
        wasOverdue,
      };
    }

    if (eligible) {
      pendingTransactions.push(
        { id: uid("point"), memberId: participant.memberId, taskId: task.id, type: "study", amount: studyAmount, reason: `${task.title} 研习点结算`, operatorId, createdAt: now },
        { id: uid("point"), memberId: participant.memberId, taskId: task.id, type: "labor", amount: laborAmount, reason: `${task.title} 工时点结算`, operatorId, createdAt: now }
      );
    }

    memberSettlements.push({
      adjustedWeight: roundPointFromSettings(weight),
      eligible,
      joinType: participant.joinType,
      laborAmount,
      managementAmount: 0,
      member,
      participant,
      studyAmount,
      totalAmount: roundPointFromSettings(studyAmount + laborAmount),
    });
  }

  if (task.managementPoints > 0) {
    const ownerMember = getMemberById(task.ownerId);
    const ownerEligible = canMemberAccruePoints(ownerMember);
    const managementAmount = ownerEligible ? roundPointFromSettings(task.managementPoints * overdueDiscount) : 0;
    if (managementAmount < 0) {
      console.error("buildTaskSettlementPreview: negative management amount detected, aborting preview.");
      return {
        memberSettlements: [],
        middleJoinDiscount,
        overdueDiscount,
        pendingTransactions: [],
        totalWeight: 0,
        totals: { study: 0, labor: 0, management: 0, total: 0 },
        wasOverdue,
      };
    }
    if (ownerEligible) {
      pendingTransactions.push(
        { id: uid("point"), memberId: task.ownerId, taskId: task.id, type: "management", amount: managementAmount, reason: `${task.title} 管理点结算`, operatorId, createdAt: now }
      );
    }

    const ownerSettlement = memberSettlements.find((item) => item.member?.id === task.ownerId);
    if (ownerSettlement) {
      ownerSettlement.managementAmount = managementAmount;
      ownerSettlement.totalAmount = roundPointFromSettings(ownerSettlement.studyAmount + ownerSettlement.laborAmount + managementAmount);
    } else if (ownerMember) {
      memberSettlements.push({
        adjustedWeight: 0,
        eligible: ownerEligible,
        joinType: "initial",
        laborAmount: 0,
        managementAmount,
        member: ownerMember,
        participant: null,
        studyAmount: 0,
        totalAmount: managementAmount,
      });
    }
  }

  const totals = memberSettlements.reduce(
    (summary, item) => {
      summary.study = roundPointFromSettings(summary.study + item.studyAmount);
      summary.labor = roundPointFromSettings(summary.labor + item.laborAmount);
      summary.management = roundPointFromSettings(summary.management + item.managementAmount);
      summary.total = roundPointFromSettings(summary.total + item.totalAmount);
      return summary;
    },
    { study: 0, labor: 0, management: 0, total: 0 }
  );

  return {
    memberSettlements,
    middleJoinDiscount,
    overdueDiscount,
    pendingTransactions,
    totalWeight,
    totals,
    wasOverdue,
  };
}
