import {
  addRecord,
  removeRecord,
  removeWhere
} from "./chunk-GTV4JDSP.js";
import {
  deleteLocalAttachments,
  uploadLocalAttachments
} from "./chunk-URJPZTLH.js";
import {
  createNotification,
  getParticipantUserIds,
  getRecipientUserIdsFromMentionText,
  getReviewerUserIds,
  removeNotificationsBySource,
  removeNotificationsByTask
} from "./chunk-SNLC6MV6.js";
import {
  clearModalStack,
  popModal,
  pushModal,
  saveDatabase
} from "./chunk-6CQGROI4.js";
import {
  pushFlash,
  renderApp
} from "./chunk-DI5EFKKB.js";
import {
  canCreateTask,
  canDeleteAllGeneratedData,
  canDeletePointTransaction,
  canDeleteTask,
  canDeleteTaskGeneratedData,
  canEditTask,
  canInteractWithTasks,
  canMemberAccruePoints,
  canMemberBeAddedToTask,
  clamp,
  createComment,
  getActiveParticipantCount,
  getCurrentMember,
  getMemberById,
  getTaskById,
  getTaskParticipantRecords,
  parseList,
  roundPointFromSettings
} from "./chunk-IKVMAO7C.js";
import {
  state
} from "./chunk-NDL62ULM.js";
import {
  uid
} from "./chunk-UQLSNBUY.js";

// client/domain/task.js
function deriveTaskStatus(task) {
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
async function handleTaskForm(form) {
  const formData = new FormData(form);
  const taskId = String(formData.get("taskId") || "").trim();
  const editing = Boolean(taskId);
  const ownerId = String(formData.get("ownerId") || "").trim() || getCurrentMember().id;
  const task = editing ? getTaskById(taskId) : null;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  if (task && task.id !== taskId) task.id = taskId;
  if (editing && task && !canEditTask(task)) {
    pushFlash("\u5F53\u524D\u6CA1\u6709\u6743\u9650\u4FEE\u6539\u8BE5\u4EFB\u52A1\u3002", "info");
    return;
  }
  if (!editing && !canCreateTask()) {
    pushFlash("\u5F53\u524D\u8EAB\u4EFD\u6CA1\u6709\u53D1\u5E03\u4EFB\u52A1\u6743\u9650\u3002", "info");
    return;
  }
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
    tags: parseList(String(formData.get("tags") || ""))
  };
  if (!payload.title || !payload.departments.length || !payload.dueAt || !payload.description || !payload.recommendedFor) {
    pushFlash("\u4EFB\u52A1\u5B57\u6BB5\u672A\u586B\u5199\u5B8C\u6574\uFF0C\u65E0\u6CD5\u4FDD\u5B58\u3002", "info");
    return;
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
      id: uid("task"),
      ownerId,
      creatorId: getCurrentMember().id,
      createdAt: now,
      submittedAt: null,
      completedAt: null,
      progressPercent: 0,
      status: "todo",
      blockers: "",
      attachments: [],
      comments: [],
      progressNodes: [],
      publicToMarket: true,
      ...payload
    };
    addRecord("tasks", createdTask);
    addRecord("taskParticipants", {
      id: uid("participant"),
      taskId: createdTask.id,
      memberId: ownerId,
      role: "\u8D1F\u8D23\u4EBA",
      joinType: "initial",
      status: "involved",
      joinedAt: now,
      exitedAt: null,
      contributionRatio: 1
    });
  }
  if (!await saveDatabase()) return;
  clearModalStack();
  pushFlash(editing ? "\u4EFB\u52A1\u5DF2\u66F4\u65B0\u3002" : "\u4EFB\u52A1\u5DF2\u521B\u5EFA\u5E76\u53D1\u5E03\u5230\u4EFB\u52A1\u5E02\u573A\u3002", "info");
}
async function deleteTask(taskId) {
  const task = getTaskById(taskId);
  if (!task) {
    pushFlash("\u4EFB\u52A1\u4E0D\u5B58\u5728\uFF0C\u65E0\u6CD5\u5220\u9664\u3002", "info");
    return;
  }
  if (!canDeleteTask(task)) {
    pushFlash("\u53EA\u6709\u4EFB\u52A1\u53D1\u5E03\u8005\u6216\u7BA1\u7406\u5458\u53EF\u4EE5\u5220\u9664\u4EFB\u52A1\u3002", "info");
    return;
  }
  const confirmed = window.confirm(`\u786E\u8BA4\u5220\u9664\u4EFB\u52A1\u300A${task.title}\u300B\uFF1F\u8FD9\u4F1A\u540C\u65F6\u79FB\u9664\u76F8\u5173\u53C2\u4E0E\u8BB0\u5F55\u3001\u5BA1\u6838\u8BB0\u5F55\u548C\u79EF\u5206\u6D41\u6C34\u3002`);
  if (!confirmed) return;
  const taskAttachments = [...task.attachments || []];
  removeWhere("tasks", (item) => item.id === taskId);
  removeWhere("taskParticipants", (participant) => participant.taskId === taskId);
  removeWhere("approvals", (approval) => approval.targetId === taskId);
  removeWhere("pointTransactions", (transaction) => transaction.taskId === taskId);
  removeNotificationsByTask(taskId);
  if (state.modal?.taskId === taskId) clearModalStack();
  if (!await saveDatabase()) return;
  await deleteLocalAttachments(taskAttachments);
  pushFlash(`\u4EFB\u52A1\u300A${task.title}\u300B\u5DF2\u5220\u9664\u3002`, "info");
}
async function handleProgressForm(form) {
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
    createNotification(owner.userId, `${updater.name} \u66F4\u65B0\u4E86\u300A${task.title}\u300B\u7684\u8FDB\u5EA6\u5230 ${progressPercent}%`, { sourceId: task.id, sourceType: "task", taskId: task.id, memberId: updater.id, type: "progress" });
  }
  if (!await saveDatabase()) return;
  if (progressPercent === 100 && previousPercent < 100) {
    pushFlash("\u8FDB\u5EA6\u5DF2\u8FBE 100%\uFF0C\u8BF7\u586B\u5199\u6210\u679C\u8BF4\u660E\u5E76\u63D0\u4EA4\u5BA1\u6838\u3002", "info");
    pushModal({ type: "task-completion", taskId: task.id, pendingFiles: [] });
  } else {
    pushFlash("\u8FDB\u5EA6\u5DF2\u66F4\u65B0\u3002", "info");
  }
}
async function handleProgressNoteForm(form) {
  const task = getTaskById(String(form.dataset.taskId || ""));
  if (!task || !canInteractWithTasks()) return;
  const formData = new FormData(form);
  const note = String(formData.get("note") || "").trim();
  if (!note) {
    pushFlash("\u8BF7\u586B\u5199\u8FDB\u5EA6\u8BF4\u660E\u3002", "info");
    return;
  }
  const node = {
    id: uid("node"),
    taskId: task.id,
    percent: task.progressPercent,
    note,
    attachments: [],
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    authorId: getCurrentMember().id
  };
  if (!Array.isArray(task.progressNodes)) task.progressNodes = [];
  task.progressNodes.unshift(node);
  const owner = getMemberById(task.ownerId);
  const updater = getCurrentMember();
  if (owner && owner.userId && owner.userId !== updater.userId) {
    createNotification(owner.userId, `${updater.name} \u4E3A\u300A${task.title}\u300B\u6DFB\u52A0\u4E86\u8FDB\u5EA6\u8BF4\u660E`, { sourceId: node.id, sourceType: "progress_node", taskId: task.id, memberId: updater.id, type: "progress" });
  }
  if (!await saveDatabase()) return;
  popModal();
  pushFlash("\u8FDB\u5EA6\u8BF4\u660E\u5DF2\u6DFB\u52A0\u3002", "info");
}
async function handleTaskAttachmentForm(form) {
  const task = getTaskById(String(form.dataset.taskId || ""));
  if (!task || !canInteractWithTasks()) return;
  const formData = new FormData(form);
  const selectedFiles = getSelectedUploadFiles(formData.getAll("attachments"));
  if (!selectedFiles.length) {
    pushFlash("\u8BF7\u9009\u62E9\u8981\u4E0A\u4F20\u7684\u9644\u4EF6\u3002", "info");
    return;
  }
  try {
    const uploadedAttachments = await uploadLocalAttachments(task.id, selectedFiles, "task_attachment");
    for (const attachment of uploadedAttachments) {
      task.attachments.push(attachment);
    }
  } catch (error) {
    pushFlash(error instanceof Error ? error.message : "\u9644\u4EF6\u4E0A\u4F20\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5\u3002", "info");
    return;
  }
  if (!await saveDatabase()) return;
  popModal();
  pushFlash("\u9644\u4EF6\u5DF2\u4E0A\u4F20\u3002", "info");
}
async function deleteProgressNode(taskId, nodeId) {
  const task = getTaskById(taskId);
  const node = task?.progressNodes?.find((n) => n.id === nodeId);
  if (!task || !node || !canDeleteTaskGeneratedData(task, node.authorId)) {
    pushFlash("\u5F53\u524D\u6CA1\u6709\u6743\u9650\u5220\u9664\u8BE5\u8FDB\u5EA6\u8282\u70B9\u3002", "info");
    return;
  }
  if (!window.confirm("\u786E\u8BA4\u5220\u9664\u8FD9\u6761\u8FDB\u5EA6\u8BB0\u5F55\uFF1F")) return;
  const nodeAttachments = [...node.attachments || []];
  task.progressNodes = (task.progressNodes || []).filter((n) => n.id !== nodeId);
  const migratedComment = task.comments?.find((c) => c.id === nodeId);
  if (migratedComment) {
    task.comments = task.comments.filter((c) => c.id !== nodeId);
    removeNotificationsBySource("comment", nodeId);
  }
  removeNotificationsBySource("progress_node", nodeId);
  if (!await saveDatabase()) return;
  await deleteLocalAttachments(nodeAttachments);
  renderApp();
  pushFlash("\u8FDB\u5EA6\u8BB0\u5F55\u5DF2\u5220\u9664\u3002", "info");
}
async function handleCommentForm(form) {
  const task = getTaskById(String(form.dataset.taskId || ""));
  if (!task || !canInteractWithTasks()) return;
  const content = String(new FormData(form).get("comment") || "").trim();
  if (!content) {
    pushFlash("\u8BC4\u8BBA\u5185\u5BB9\u4E0D\u80FD\u4E3A\u7A7A\u3002", "info");
    return;
  }
  const member = getCurrentMember();
  const comment = createComment("\u8BC4\u8BBA", content, member);
  task.comments.unshift(comment);
  const mentionedUserIds = getRecipientUserIdsFromMentionText(content);
  mentionedUserIds.forEach((userId) => {
    createNotification(userId, `${member.name} \u5728\u300A${task.title}\u300B\u4E2D\u63D0\u5230\u4E86\u4F60`, { sourceId: comment.id, sourceType: "comment", taskId: task.id, memberId: member.id, type: "mention" });
  });
  const participantUserIds = getParticipantUserIds(task.id, member.userId || "");
  participantUserIds.forEach((userId) => {
    if (!mentionedUserIds.includes(userId)) {
      createNotification(userId, `${member.name} \u8BC4\u8BBA\u4E86\u300A${task.title}\u300B`, { sourceId: comment.id, sourceType: "comment", taskId: task.id, memberId: member.id, type: "comment" });
    }
  });
  if (!await saveDatabase()) return;
  pushFlash("\u8BC4\u8BBA\u5DF2\u6DFB\u52A0\u3002", "info");
}
async function handleSubmissionForm(form) {
  const task = getTaskById(String(form.dataset.taskId || ""));
  if (!task) return;
  if (!canInteractWithTasks()) {
    pushFlash("\u5F53\u524D\u6210\u5458\u72B6\u6001\u4E3A\u53EA\u8BFB\uFF0C\u4E0D\u80FD\u63D0\u4EA4\u6210\u679C\u3002", "info");
    return;
  }
  if (task.progressPercent < 100) {
    pushFlash("\u4EFB\u52A1\u8FDB\u5EA6\u5FC5\u987B\u8FBE\u5230 100% \u624D\u80FD\u63D0\u4EA4\u6210\u679C\u3002", "info");
    return;
  }
  const formData = new FormData(form);
  const summary = String(formData.get("summary") || "").trim();
  const stagedFiles = Array.isArray(state.modal?.pendingFiles) ? state.modal.pendingFiles : [];
  const selectedFiles = [...stagedFiles, ...getSelectedUploadFiles(formData.getAll("attachments"))];
  if (!summary) {
    pushFlash("\u63D0\u4EA4\u6210\u679C\u65F6\u5FC5\u987B\u586B\u5199\u6210\u679C\u8BF4\u660E\u3002", "info");
    return;
  }
  let uploadedAttachments = [];
  if (selectedFiles.length) {
    try {
      uploadedAttachments = await uploadLocalAttachments(task.id, selectedFiles, "submission");
    } catch (error) {
      pushFlash(error instanceof Error ? error.message : "\u9644\u4EF6\u4E0A\u4F20\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5\u3002", "info");
      return;
    }
  }
  task.status = "pending_review";
  task.submittedAt = (/* @__PURE__ */ new Date()).toISOString();
  const submitter = getCurrentMember();
  const submissionComment = createComment("\u6210\u679C\u63D0\u4EA4", summary, submitter);
  task.comments.unshift(submissionComment);
  if (uploadedAttachments.length) replaceSubmissionAttachments(task, uploadedAttachments);
  ensureCompletionApproval(task, "\u63D0\u4EA4\u6210\u679C\u7B49\u5F85\u5BA1\u6838");
  const owner = getMemberById(task.ownerId);
  if (owner && owner.userId && owner.userId !== submitter.userId) {
    createNotification(owner.userId, `${submitter.name} \u63D0\u4EA4\u4E86\u300A${task.title}\u300B\u7684\u6210\u679C\uFF0C\u7B49\u5F85\u5BA1\u6838`, { sourceId: submissionComment.id, sourceType: "comment", taskId: task.id, memberId: submitter.id, type: "task_review" });
  }
  if (!await saveDatabase()) return;
  clearModalStack();
  pushFlash("\u6210\u679C\u5DF2\u63D0\u4EA4\uFF0C\u7B49\u5F85\u5BA1\u6838\u3002", "info");
}
function ensureCompletionApproval(task, comment) {
  removePendingCompletionApprovals(task.id);
  state.database.approvals.unshift({
    id: uid("approval"),
    type: "completion",
    targetId: task.id,
    submitterId: getCurrentMember().id,
    approverId: null,
    status: "pending",
    comment,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    reviewedAt: null
  });
}
function removePendingCompletionApprovals(taskId) {
  state.database.approvals = state.database.approvals.filter(
    (approval) => !(approval.type === "completion" && approval.targetId === taskId && approval.status === "pending")
  );
}
function isSubmissionAttachment(attachment) {
  return attachment?.source === "submission";
}
function getSubmissionAttachments(task) {
  return (task.attachments || []).filter(isSubmissionAttachment);
}
function getLatestSubmissionSummary(task) {
  const submissionComment = [...task.comments || []].reverse().find((comment) => comment.title === "\u6210\u679C\u63D0\u4EA4");
  return submissionComment?.content || "";
}
function replaceSubmissionAttachments(task, attachments) {
  task.attachments = [...(task.attachments || []).filter((attachment) => !isSubmissionAttachment(attachment)), ...attachments];
}
function appendTaskAttachments(task, attachments) {
  for (const attachment of attachments) {
    task.attachments.push(attachment);
  }
}
async function deleteTaskComment(taskId, commentId) {
  const task = getTaskById(taskId);
  const comment = task?.comments?.find((item) => item.id === commentId);
  if (!task || !comment || !canDeleteTaskGeneratedData(task, comment.authorId)) {
    pushFlash("\u5F53\u524D\u6CA1\u6709\u6743\u9650\u5220\u9664\u8FD9\u6761\u8BC4\u8BBA\u3002", "info");
    return;
  }
  if (!window.confirm("\u786E\u8BA4\u5220\u9664\u8FD9\u6761\u8BC4\u8BBA\uFF1F\u5220\u9664\u540E\u4E0D\u53EF\u6062\u590D\u3002")) return;
  task.comments = (task.comments || []).filter((item) => item.id !== commentId);
  removeNotificationsBySource("comment", commentId);
  if (!await saveDatabase()) return;
  renderApp();
  pushFlash("\u8BC4\u8BBA\u5DF2\u5220\u9664\u3002", "info");
}
async function deleteTaskAttachment(taskId, attachmentId) {
  const task = getTaskById(taskId);
  const attachment = task?.attachments?.find((item) => item.id === attachmentId);
  if (!task || !attachment || !canDeleteTaskGeneratedData(task)) {
    pushFlash("\u5F53\u524D\u6CA1\u6709\u6743\u9650\u5220\u9664\u8BE5\u9644\u4EF6\u3002", "info");
    return;
  }
  if (!window.confirm(`\u786E\u8BA4\u5220\u9664\u9644\u4EF6\u300A${attachment.name}\u300B\uFF1F\u5220\u9664\u540E\u4E0D\u53EF\u6062\u590D\u3002`)) return;
  task.attachments = (task.attachments || []).filter((item) => item.id !== attachmentId);
  if (!await saveDatabase()) return;
  await deleteLocalAttachments([attachment]);
  if (state.settingsFiles) {
    state.settingsFiles = state.settingsFiles.filter((file) => file.path !== attachment.storagePath);
  }
  renderApp();
  pushFlash("\u9644\u4EF6\u5DF2\u5220\u9664\u3002", "info");
}
async function deleteProgressNodeAttachment(taskId, nodeId, attachmentId) {
  const task = getTaskById(taskId);
  const node = task?.progressNodes?.find((n) => n.id === nodeId);
  const attachment = node?.attachments?.find((a) => a.id === attachmentId);
  if (!task || !node || !attachment || !canDeleteTaskGeneratedData(task, node.authorId)) {
    pushFlash("\u5F53\u524D\u6CA1\u6709\u6743\u9650\u5220\u9664\u8BE5\u9644\u4EF6\u3002", "info");
    return;
  }
  if (!window.confirm(`\u786E\u8BA4\u5220\u9664\u9644\u4EF6\u300A${attachment.name}\u300B\uFF1F\u5220\u9664\u540E\u4E0D\u53EF\u6062\u590D\u3002`)) return;
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
  if (!await saveDatabase()) return;
  await deleteLocalAttachments([attachment]);
  if (state.settingsFiles) {
    state.settingsFiles = state.settingsFiles.filter((file) => file.path !== attachment.storagePath);
  }
  renderApp();
  pushFlash(node.attachments.length || node.note ? "\u9644\u4EF6\u5DF2\u5220\u9664\u3002" : "\u8FDB\u5EA6\u8BB0\u5F55\u5DF2\u6E05\u7A7A\u5E76\u81EA\u52A8\u5220\u9664\u3002", "info");
}
async function joinTask(taskId) {
  const task = getTaskById(taskId);
  const member = getCurrentMember();
  if (!task || !member) return;
  if (!canInteractWithTasks()) {
    pushFlash("\u5F53\u524D\u6210\u5458\u72B6\u6001\u4E3A\u53EA\u8BFB\uFF0C\u4E0D\u53C2\u4E0E\u666E\u901A\u4EFB\u52A1\u64CD\u4F5C\u3002", "info");
    return;
  }
  if (getActiveParticipantCount(task.id) >= task.maxParticipants) {
    pushFlash("\u4EFB\u52A1\u4EBA\u6570\u5DF2\u6EE1\uFF0C\u5F53\u524D\u7248\u672C\u4E0D\u63D0\u4F9B\u5019\u8865\u673A\u5236\u3002", "info");
    return;
  }
  const existing = getTaskParticipantRecords(task.id).find((item) => item.memberId === member.id && item.status !== "exited");
  if (existing) {
    pushFlash("\u4F60\u5DF2\u7ECF\u5728\u8BE5\u4EFB\u52A1\u4E2D\u3002", "info");
    return;
  }
  const exited = getTaskParticipantRecords(task.id).find((item) => item.memberId === member.id && item.status === "exited");
  if (exited) {
    exited.status = "involved";
    exited.exitedAt = null;
    exited.joinedAt = (/* @__PURE__ */ new Date()).toISOString();
    removeWhere("taskParticipants", (item) => item.taskId === task.id && item.memberId === member.id && item.status === "exited" && item.id !== exited.id);
    if (!await saveDatabase()) return;
    pushFlash("\u5DF2\u91CD\u65B0\u52A0\u5165\u4EFB\u52A1\u3002", "info");
    return;
  }
  const needsApproval = task.approvalRequired || state.database.settings.hardTaskNeedsApproval && ["hard", "core"].includes(task.difficulty);
  if (needsApproval) {
    const pending = state.database.approvals.find((approval2) => approval2.type === "join" && approval2.status === "pending" && approval2.targetId === task.id && approval2.submitterId === member.id);
    if (pending) {
      pushFlash("\u8BE5\u9AD8\u96BE\u4EFB\u52A1\u5DF2\u5B58\u5728\u5F85\u5BA1\u6279\u7533\u8BF7\u3002", "info");
      return;
    }
    const approval = { id: uid("approval"), type: "join", targetId: task.id, submitterId: member.id, approverId: null, status: "pending", comment: "\u7533\u8BF7\u52A0\u5165\u9AD8\u96BE\u4EFB\u52A1", createdAt: (/* @__PURE__ */ new Date()).toISOString(), reviewedAt: null };
    addRecord("approvals", approval);
    const reviewerUserIds = getReviewerUserIds();
    reviewerUserIds.forEach((reviewerId) => {
      createNotification(reviewerId, `${member.name} \u7533\u8BF7\u52A0\u5165\u4EFB\u52A1\u300A${task.title}\u300B`, { sourceId: approval.id, sourceType: "approval", taskId: task.id, memberId: member.id, type: "info" });
    });
    if (!await saveDatabase()) return;
    pushFlash("\u5DF2\u63D0\u4EA4\u52A0\u5165\u7533\u8BF7\uFF0C\u7B49\u5F85\u7EC4\u957F\u6216\u7BA1\u7406\u5458\u5BA1\u6279\u3002", "info");
    return;
  }
  const newParticipant = { id: uid("participant"), taskId: task.id, memberId: member.id, role: "\u534F\u4F5C\u8005", joinType: task.status === "todo" ? "initial" : "middle", status: "involved", joinedAt: (/* @__PURE__ */ new Date()).toISOString(), exitedAt: null, contributionRatio: 1 };
  addRecord("taskParticipants", newParticipant);
  const owner = getMemberById(task.ownerId);
  if (owner && owner.userId && owner.userId !== member.userId) {
    createNotification(owner.userId, `${member.name} \u9886\u53D6\u4E86\u4EFB\u52A1\u300A${task.title}\u300B`, { sourceId: newParticipant.id, sourceType: "participant", taskId: task.id, memberId: member.id, type: "task_assign" });
  }
  if (!await saveDatabase()) return;
  pushFlash("\u4EFB\u52A1\u9886\u53D6\u6210\u529F\uFF0C\u5DF2\u52A0\u5165\u6211\u7684\u4EFB\u52A1\u3002", "info");
}
async function exitTask(taskId) {
  const member = getCurrentMember();
  if (!canInteractWithTasks()) {
    pushFlash("\u5F53\u524D\u6210\u5458\u72B6\u6001\u4E3A\u53EA\u8BFB\uFF0C\u4E0D\u80FD\u9000\u51FA\u4EFB\u52A1\u3002", "info");
    return;
  }
  const task = getTaskById(taskId);
  const participant = getTaskParticipantRecords(taskId).find((item) => item.memberId === member.id && item.status === "involved");
  if (!participant) {
    pushFlash("\u5F53\u524D\u672A\u53C2\u4E0E\u8BE5\u4EFB\u52A1\uFF0C\u65E0\u6CD5\u9000\u51FA\u3002", "info");
    return;
  }
  if (task && task.ownerId === member.id) {
    pushFlash("\u5F53\u524D\u8D1F\u8D23\u4EBA\u4E0D\u80FD\u76F4\u63A5\u9000\u51FA\u4EFB\u52A1\uFF0C\u8BF7\u5148\u6539\u6D3E\u65B0\u7684\u8D1F\u8D23\u4EBA\u3002", "info");
    return;
  }
  if (!window.confirm("\u786E\u8BA4\u9000\u51FA\u8BE5\u4EFB\u52A1\uFF1F\u9000\u51FA\u540E\u9ED8\u8BA4\u4E0D\u83B7\u5F97\u70B9\u6570\u3002")) return;
  if (task && task.status === "todo") {
    removeRecord("taskParticipants", participant.id);
  } else {
    participant.status = "exited";
    participant.exitedAt = (/* @__PURE__ */ new Date()).toISOString();
  }
  if (!await saveDatabase()) return;
  pushFlash("\u5DF2\u9000\u51FA\u8BE5\u4EFB\u52A1\u3002\u6839\u636E\u89C4\u5219\u9ED8\u8BA4\u4E0D\u83B7\u5F97\u70B9\u6570\u3002", "info");
}
async function handleTaskParticipantAddAction(form) {
  const task = getTaskById(String(form.dataset.taskId || ""));
  if (!task || !canEditTask(task)) {
    pushFlash("\u5F53\u524D\u6CA1\u6709\u6743\u9650\u4FEE\u6539\u8BE5\u4EFB\u52A1\u6210\u5458\u3002", "info");
    return;
  }
  const memberId = String(new FormData(form).get("memberId") || "").trim();
  const member = getMemberById(memberId);
  if (!member || !canMemberBeAddedToTask(member)) {
    pushFlash("\u5F53\u524D\u9009\u62E9\u7684\u6210\u5458\u4E0D\u80FD\u88AB\u52A0\u5165\u8BE5\u4EFB\u52A1\u3002", "info");
    return;
  }
  if (getTaskParticipantRecords(task.id).some((participant) => participant.memberId === memberId && participant.status === "involved")) {
    pushFlash("\u8BE5\u6210\u5458\u5DF2\u7ECF\u5728\u5F53\u524D\u4EFB\u52A1\u4E2D\u3002", "info");
    return;
  }
  const exited = getTaskParticipantRecords(task.id).find((participant) => participant.memberId === memberId && participant.status === "exited");
  if (exited) {
    exited.status = "involved";
    exited.exitedAt = null;
    removeWhere("taskParticipants", (item) => item.taskId === task.id && item.memberId === memberId && item.status === "exited" && item.id !== exited.id);
    if (!await saveDatabase()) return;
    pushFlash(`\u5DF2\u5C06 ${member.name} \u91CD\u65B0\u52A0\u5165\u4EFB\u52A1\u3002`, "info");
    return;
  }
  if (getActiveParticipantCount(task.id) >= task.maxParticipants) {
    pushFlash("\u5F53\u524D\u4EFB\u52A1\u4EBA\u6570\u5DF2\u6EE1\uFF0C\u8BF7\u5148\u8C03\u6574\u4EBA\u6570\u4E0A\u9650\u6216\u79FB\u9664\u5176\u4ED6\u6210\u5458\u3002", "info");
    return;
  }
  const newParticipant = { id: uid("participant"), taskId: task.id, memberId, role: "\u534F\u4F5C\u8005", joinType: task.status === "todo" ? "initial" : "middle", status: "involved", joinedAt: (/* @__PURE__ */ new Date()).toISOString(), exitedAt: null, contributionRatio: 1 };
  addRecord("taskParticipants", newParticipant);
  if (member.userId) {
    createNotification(member.userId, `${getCurrentMember().name} \u5C06\u4F60\u52A0\u5165\u4E86\u4EFB\u52A1\u300A${task.title}\u300B`, { sourceId: newParticipant.id, sourceType: "participant", taskId: task.id, memberId: getCurrentMember().id, type: "task_assign" });
  }
  if (!await saveDatabase()) return;
  pushFlash(`\u5DF2\u5C06 ${member.name} \u52A0\u5165\u4EFB\u52A1\u3002`, "info");
}
async function removeTaskParticipantAction(taskId, memberId) {
  const task = getTaskById(taskId);
  if (!task || !canEditTask(task)) {
    pushFlash("\u5F53\u524D\u6CA1\u6709\u6743\u9650\u4FEE\u6539\u8BE5\u4EFB\u52A1\u6210\u5458\u3002", "info");
    return;
  }
  const participant = getTaskParticipantRecords(taskId).find((item) => item.memberId === memberId && item.status === "involved");
  if (!participant) {
    pushFlash("\u8BE5\u6210\u5458\u5F53\u524D\u4E0D\u5728\u4EFB\u52A1\u53C2\u4E0E\u5217\u8868\u4E2D\u3002", "info");
    return;
  }
  if (task.ownerId === memberId) {
    pushFlash("\u5F53\u524D\u8D1F\u8D23\u4EBA\u4E0D\u80FD\u76F4\u63A5\u79FB\u9664\uFF0C\u8BF7\u5148\u6539\u6D3E\u65B0\u7684\u8D1F\u8D23\u4EBA\u3002", "info");
    return;
  }
  const member = getMemberById(memberId);
  if (!window.confirm(`\u786E\u8BA4\u5C06 ${member?.name || "\u8BE5\u6210\u5458"} \u79FB\u51FA\u4EFB\u52A1\uFF1F`)) return;
  if (task.status === "todo") {
    removeRecord("taskParticipants", participant.id);
    removeNotificationsBySource("participant", participant.id);
  } else {
    participant.status = "exited";
    participant.exitedAt = (/* @__PURE__ */ new Date()).toISOString();
  }
  if (!await saveDatabase()) return;
  pushFlash("\u5DF2\u79FB\u9664\u8BE5\u4EFB\u52A1\u534F\u4F5C\u8005\u3002", "info");
}
async function handleTaskOwnerReassignFormAction(form) {
  const task = getTaskById(String(form.dataset.taskId || ""));
  if (!task || !canEditTask(task)) {
    pushFlash("\u5F53\u524D\u6CA1\u6709\u6743\u9650\u6539\u6D3E\u8D1F\u8D23\u4EBA\u3002", "info");
    return;
  }
  const nextOwnerId = String(new FormData(form).get("memberId") || "").trim();
  const nextOwner = getMemberById(nextOwnerId);
  if (!nextOwner) {
    pushFlash("\u65B0\u7684\u8D1F\u8D23\u4EBA\u4E0D\u5B58\u5728\u3002", "info");
    return;
  }
  if (!canMemberBeAddedToTask(nextOwner)) {
    pushFlash("\u5F53\u524D\u9009\u62E9\u7684\u6210\u5458\u4E0D\u80FD\u62C5\u4EFB\u8D1F\u8D23\u4EBA\u3002", "info");
    return;
  }
  const nextOwnerParticipant = getTaskParticipantRecords(task.id).find((item) => item.memberId === nextOwnerId && item.status === "involved");
  if (!nextOwnerParticipant) {
    pushFlash("\u65B0\u7684\u8D1F\u8D23\u4EBA\u5FC5\u987B\u5DF2\u7ECF\u5728\u5F53\u524D\u4EFB\u52A1\u53C2\u4E0E\u5217\u8868\u4E2D\u3002", "info");
    return;
  }
  const previousOwnerParticipant = getTaskParticipantRecords(task.id).find((item) => item.memberId === task.ownerId && item.status === "involved");
  task.ownerId = nextOwnerId;
  nextOwnerParticipant.role = "\u8D1F\u8D23\u4EBA";
  if (previousOwnerParticipant && previousOwnerParticipant.id !== nextOwnerParticipant.id) previousOwnerParticipant.role = "\u534F\u4F5C\u8005";
  if (nextOwner.userId) {
    createNotification(nextOwner.userId, `\u4F60\u5DF2\u88AB\u4EFB\u547D\u4E3A\u4EFB\u52A1\u300A${task.title}\u300B\u7684\u8D1F\u8D23\u4EBA`, { sourceId: task.id, sourceType: "task", taskId: task.id, memberId: getCurrentMember().id, type: "task_assign" });
  }
  if (!await saveDatabase()) return;
  popModal();
  pushFlash(`\u8D1F\u8D23\u4EBA\u5DF2\u6539\u6D3E\u7ED9 ${nextOwner.name}\u3002`, "info");
}
async function handleTaskParticipantAdd(form) {
  return handleTaskParticipantAddAction(form);
}
async function removeTaskParticipant(taskId, memberId) {
  return removeTaskParticipantAction(taskId, memberId);
}
async function handleTaskOwnerReassignForm(form) {
  return handleTaskOwnerReassignFormAction(form);
}
function settleTaskPoints(task) {
  const participants = getTaskParticipantRecords(task.id).filter((item) => item.status !== "exited");
  if (!participants.length) return;
  const wasOverdue = task.dueAt && new Date(task.dueAt).getTime() < new Date(task.submittedAt || task.completedAt || (/* @__PURE__ */ new Date()).toISOString()).getTime();
  const overdueDiscount = wasOverdue ? state.database.settings.overduePointDiscount ?? 0.5 : 1;
  const middleJoinDiscount = state.database.settings.middleJoinDiscount ?? 0.5;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const operatorId = getCurrentMember().id;
  const weighted = participants.map((participant) => ({
    participant,
    weight: participant.contributionRatio * (participant.joinType === "middle" ? middleJoinDiscount : 1) * overdueDiscount
  }));
  const totalWeight = weighted.reduce((sum, item) => sum + item.weight, 0);
  if (!totalWeight || totalWeight <= 0) {
    console.error("settleTaskPoints: totalWeight is zero or invalid, aborting.");
    return;
  }
  const pendingTransactions = [];
  for (const { participant, weight } of weighted) {
    const targetMember = getMemberById(participant.memberId);
    if (!canMemberAccruePoints(targetMember)) continue;
    const studyAmount = roundPointFromSettings(task.studyPoints * weight / totalWeight);
    const laborAmount = roundPointFromSettings(task.laborPoints * weight / totalWeight);
    if (studyAmount < 0 || laborAmount < 0) {
      console.error("settleTaskPoints: negative amount detected, aborting.");
      return;
    }
    pendingTransactions.push(
      { id: uid("point"), memberId: participant.memberId, taskId: task.id, type: "study", amount: studyAmount, reason: `${task.title} \u7814\u4E60\u70B9\u7ED3\u7B97`, operatorId, createdAt: now },
      { id: uid("point"), memberId: participant.memberId, taskId: task.id, type: "labor", amount: laborAmount, reason: `${task.title} \u5DE5\u65F6\u70B9\u7ED3\u7B97`, operatorId, createdAt: now }
    );
  }
  if (task.managementPoints > 0) {
    const ownerMember = getMemberById(task.ownerId);
    if (canMemberAccruePoints(ownerMember)) {
      const managementAmount = roundPointFromSettings(task.managementPoints * overdueDiscount);
      if (managementAmount < 0) {
        console.error("settleTaskPoints: negative management amount detected, aborting.");
        return;
      }
      pendingTransactions.push(
        { id: uid("point"), memberId: task.ownerId, taskId: task.id, type: "management", amount: managementAmount, reason: `${task.title} \u7BA1\u7406\u70B9\u7ED3\u7B97`, operatorId, createdAt: now }
      );
    }
  }
  for (const transaction of pendingTransactions) {
    addRecord("pointTransactions", transaction);
  }
}
async function handleCompensationForm(form) {
  if (!canDeleteAllGeneratedData()) {
    pushFlash("\u53EA\u6709\u7BA1\u7406\u5458\u53EF\u4EE5\u53D1\u653E\u8865\u507F\u70B9\u3002", "info");
    return;
  }
  const formData = new FormData(form);
  const task = getTaskById(String(form.dataset.taskId || ""));
  const memberId = String(formData.get("memberId") || "");
  const type = String(formData.get("pointType") || "compensation");
  const amount = Number(formData.get("amount") || 0);
  const reason = String(formData.get("reason") || "").trim();
  if (!task || !memberId || !amount || !reason) {
    pushFlash("\u8865\u507F\u70B9\u5B57\u6BB5\u672A\u586B\u5199\u5B8C\u6574\u3002", "info");
    return;
  }
  if (!canMemberAccruePoints(getMemberById(memberId))) {
    pushFlash("\u9000\u4F11\u6216\u505C\u7528\u6210\u5458\u4E0D\u80FD\u65B0\u589E\u79EF\u5206\u3002", "info");
    return;
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  addRecord("pointTransactions", { id: uid("point"), memberId, taskId: task.id, type, amount: roundPointFromSettings(amount), reason, operatorId: getCurrentMember().id, createdAt: now });
  addRecord("approvals", { id: uid("approval"), type: "compensation", targetId: memberId, submitterId: getCurrentMember().id, approverId: getCurrentMember().id, status: "approved", comment: `${task.title} \u8865\u507F\u70B9\uFF1A${reason}`, createdAt: now, reviewedAt: now });
  if (!await saveDatabase()) return;
  pushFlash("\u8865\u507F\u70B9\u5DF2\u8BB0\u5F55\u3002", "info");
}
async function handleRatioForm(form) {
  const task = getTaskById(String(form.dataset.taskId || ""));
  if (!task || !canDeleteAllGeneratedData()) return;
  const participants = getTaskParticipantRecords(task.id).filter((item) => item.status !== "exited");
  participants.forEach((participant) => {
    const raw = Number(new FormData(form).get(`ratio_${participant.id}`) || participant.contributionRatio);
    participant.contributionRatio = Math.max(0.1, raw);
  });
  if (!await saveDatabase()) return;
  pushFlash("\u8D21\u732E\u6BD4\u4F8B\u5DF2\u66F4\u65B0\u3002", "info");
}
async function deletePointTransaction(pointId) {
  const transaction = state.database.pointTransactions.find((item) => item.id === pointId);
  if (!transaction || !canDeletePointTransaction(transaction)) {
    pushFlash("\u5F53\u524D\u6CA1\u6709\u6743\u9650\u5220\u9664\u8BE5\u79EF\u5206\u6D41\u6C34\u3002", "info");
    return;
  }
  if (!window.confirm("\u786E\u8BA4\u5220\u9664\u8FD9\u6761\u79EF\u5206\u6D41\u6C34\uFF1F\u5220\u9664\u540E\u4E0D\u53EF\u6062\u590D\u3002")) return;
  removeWhere("pointTransactions", (item) => item.id === pointId);
  if (!await saveDatabase()) return;
  pushFlash("\u79EF\u5206\u6D41\u6C34\u5DF2\u5220\u9664\u3002", "info");
}
function getSelectedUploadFiles(values) {
  return values.filter((value) => value instanceof File && value.size > 0);
}

export {
  deriveTaskStatus,
  handleTaskForm,
  deleteTask,
  handleProgressForm,
  handleProgressNoteForm,
  handleTaskAttachmentForm,
  deleteProgressNode,
  handleCommentForm,
  handleSubmissionForm,
  isSubmissionAttachment,
  getSubmissionAttachments,
  getLatestSubmissionSummary,
  appendTaskAttachments,
  deleteTaskComment,
  deleteTaskAttachment,
  deleteProgressNodeAttachment,
  joinTask,
  exitTask,
  handleTaskParticipantAdd,
  removeTaskParticipant,
  handleTaskOwnerReassignForm,
  settleTaskPoints,
  handleCompensationForm,
  handleRatioForm,
  deletePointTransaction
};
