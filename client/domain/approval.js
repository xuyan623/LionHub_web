import { state, dictionaries } from "../core/state.js";
import { uid } from "../core/security.js";
import { addRecord, removeWhere } from "../core/data-access.js";
import { saveDatabase } from "../core/database.js";
import { clearModalStack } from "../core/modal.js";
import { getRoleForIdentity, canApproveRoleChange, canRequestRoleChange, canReview, canDeleteAllGeneratedData, canMemberBeAddedToTask, canMemberParticipateInTasks, canDeleteApprovalRecord } from "./permissions.js";
import { getCurrentMember, getCurrentUser, getTaskById, getMemberById, getApprovalById, getTaskParticipantRecords } from "./query.js";
import { pushFlash } from "../core/services.js";
import { settleTaskPoints } from "./task.js";
import { createNotification, getParticipantUserIds, getReviewerUserIds, removeNotificationsBySource, removeNotificationsByTask } from "./notifications.js";

export async function handleRegistrationReview(form) {
  const formData = new FormData(form);
  const approvalId = String(formData.get("approvalId") || "");
  const approval = getApprovalById(approvalId);
  if (!approval || !canReview()) return;
  const member = getMemberById(String(formData.get("memberId") || approval.targetId));
  if (!member) return;

  const direction = String(formData.get("direction") || "").trim();
  const robotGroup = String(formData.get("robotGroup") || "").trim();
  const department = String(formData.get("departments") || "").trim();
  const identity = String(formData.get("identity") || "seedling").trim();
  if (!direction || !robotGroup) { pushFlash("请选择方向和兵种组。", "info"); return; }

  member.directions = [direction];
  member.robotGroups = [robotGroup];
  if (department) member.departments = [department];
  member.memberStatus = member.memberStatus === "pending_review" ? "normal" : (member.memberStatus || "normal");
  member.identity = identity;
  member.role = getRoleForIdentity(identity);
  member.bio = String(formData.get("bio") || member.bio || "").trim();

  const user = state.database.users.find((item) => item.memberId === member.id);
  if (user) { user.identity = member.identity; user.role = member.role; user.status = "active"; }

  approval.status = "approved";
  approval.approverId = getCurrentMember().id;
  approval.reviewedAt = new Date().toISOString();
  approval.comment = "注册审核通过，已分配身份。";

  // Notify the newly approved member
  const approvedUser = member.userId ? state.database.users.find((item) => item.id === member.userId) : null;
  if (approvedUser) {
    createNotification(approvedUser.id, "你的注册申请已通过审核，欢迎加入战队工作台", { sourceId: approval.id, sourceType: "approval", memberId: member.id, type: "info" });
  }

  if (!(await saveDatabase())) {
    pushFlash("保存失败，可能是数据版本冲突，请刷新页面后重试。", "error");
    return;
  }
  clearModalStack();
  pushFlash("注册审核通过，成员已激活并可进入工作台。", "info");
}

export async function approveJoinRequest(approvalId) {
  const approval = getApprovalById(approvalId);
  if (!approval || !canReview()) return;
  const task = getTaskById(approval.targetId);
  const member = getMemberById(approval.submitterId);
  if (!task || !member) return;
  if (!canMemberBeAddedToTask(member)) { pushFlash("该成员当前不能加入任务。", "info"); return; }

  approval.status = "approved";
  approval.approverId = getCurrentMember().id;
  approval.reviewedAt = new Date().toISOString();
  approval.comment = "加入审批通过";
  const newParticipant = { id: uid("participant"), taskId: task.id, memberId: member.id, role: "协作者", joinType: task.status === "todo" ? "initial" : "middle", status: "involved", joinedAt: new Date().toISOString(), exitedAt: null, contributionRatio: 1 };
  addRecord("taskParticipants", newParticipant);
  if (member.userId) {
    createNotification(member.userId, `你加入《${task.title}》的申请已通过`, { sourceId: approval.id, sourceType: "approval", taskId: task.id, memberId: member.id, type: "task_assign" });
  }
  if (!(await saveDatabase())) return;
  pushFlash(`已通过 ${member.name} 的加入申请。`, "info");
}

export async function rejectApproval(approvalId, comment) {
  const approval = getApprovalById(approvalId);
  if (!approval) return;
  approval.status = "rejected";
  approval.approverId = getCurrentMember().id;
  approval.reviewedAt = new Date().toISOString();
  approval.comment = comment;
  const member = getMemberById(approval.submitterId) || getMemberById(approval.targetId);
  const task = getTaskById(approval.targetId);
  if (approval.type === "join" && member?.userId && task) {
    createNotification(member.userId, `你加入《${task.title}》的申请被拒绝：${comment}`, { sourceId: approval.id, sourceType: "approval", taskId: task.id, memberId: member.id, type: "task_review" });
  }
  if (approval.type === "promotion" && member?.userId) {
    createNotification(member.userId, `你的转正申请未通过：${comment}`, { sourceId: approval.id, sourceType: "approval", memberId: member.id, type: "task_review" });
  }
  if (approval.type === "status_change" && member?.userId) {
    createNotification(member.userId, `你的变岗申请未通过：${comment}`, { sourceId: approval.id, sourceType: "approval", memberId: member.id, type: "task_review" });
  }
  if (!(await saveDatabase())) return;
  pushFlash("审批已拒绝。", "info");
}

export async function rejectRegistration(approvalId, comment = "注册审核未通过") {
  const approval = getApprovalById(approvalId);
  if (!approval) return;
  const member = getMemberById(approval.targetId);
  const user = member ? state.database.users.find((item) => item.memberId === member.id) : null;
  approval.status = "rejected";
  approval.approverId = getCurrentMember().id;
  approval.reviewedAt = new Date().toISOString();
  approval.comment = comment;
  if (user) user.status = "rejected";
  // Notify the rejected applicant
  if (user) {
    createNotification(user.id, `你的注册申请未通过审核：${comment}`, { sourceId: approval.id, sourceType: "approval", memberId: member?.id, type: "task_review" });
  }
  if (!(await saveDatabase())) return;
  clearModalStack();
  pushFlash("注册申请已拒绝。", "info");
}

export async function approveCompletion(approvalId) {
  const approval = getApprovalById(approvalId);
  if (!approval || !canDeleteAllGeneratedData()) { pushFlash("只有管理员可以完成任务结算。", "info"); return; }
  const task = getTaskById(approval.targetId);
  if (!task) return;
  approval.status = "approved";
  approval.approverId = getCurrentMember().id;
  approval.reviewedAt = new Date().toISOString();
  approval.comment = "任务完成审核通过";
  task.status = "completed";
  task.completedAt = new Date().toISOString();
  task.progressPercent = 100;

  const existingTransactions = state.database.pointTransactions.some((item) => item.taskId === task.id);
  if (!existingTransactions) settleTaskPoints(task);

  // Notify all participants
  const participantUserIds = getParticipantUserIds(task.id);
  participantUserIds.forEach((userId) => {
    createNotification(userId, `任务《${task.title}》审核通过，积分已结算`, { sourceId: approval.id, sourceType: "approval", taskId: task.id, type: "task_review" });
  });

  addRecord("approvals", { id: uid("approval"), type: "settlement", targetId: task.id, submitterId: getCurrentMember().id, approverId: getCurrentMember().id, status: "approved", comment: "任务点数已结算", createdAt: new Date().toISOString(), reviewedAt: new Date().toISOString() });
  if (!(await saveDatabase())) return;
  pushFlash("任务审核通过并完成点数结算。", "info");
}

export async function approvePromotionRequest(approvalId) {
  const approval = getApprovalById(approvalId);
  const member = approval ? getMemberById(approval.targetId) : null;
  if (!approval || !member || !canReview()) return;
  approval.status = "approved";
  approval.approverId = getCurrentMember().id;
  approval.reviewedAt = new Date().toISOString();
  member.identity = "formal";
  member.role = getRoleForIdentity("formal");
  const user = state.database.users.find((item) => item.memberId === member.id);
  if (user) {
    createNotification(user.id, "你的转正申请已通过，当前身份已更新为正式成员", { sourceId: approval.id, sourceType: "approval", memberId: member.id, type: "info" });
  }
  if (!(await saveDatabase())) return;
  pushFlash(`已通过 ${member.name} 的转正申请。`, "info");
}

export async function returnCompletion(approvalId, comment = "请补充成果后重新提交") {
  const approval = getApprovalById(approvalId);
  if (!approval || !canReview()) return;
  const task = getTaskById(approval.targetId);
  if (task) {
    task.status = "in_progress";
    task.progressPercent = Math.min(task.progressPercent, 92);
    task.submittedAt = null;
  }
  approval.status = "returned";
  approval.approverId = getCurrentMember().id;
  approval.reviewedAt = new Date().toISOString();
  approval.comment = comment;
  if (task) {
    const participantUserIds = getParticipantUserIds(task.id);
    participantUserIds.forEach((userId) => {
      createNotification(userId, `任务《${task.title}》被退回：${comment}`, { sourceId: approval.id, sourceType: "approval", taskId: task.id, type: "task_review" });
    });
  }
  if (!(await saveDatabase())) return;
  pushFlash("任务已退回修改。", "info");
}

export async function approveStatusChangeRequest(approvalId) {
  const approval = getApprovalById(approvalId);
  const member = approval ? getMemberById(approval.targetId) : null;
  if (!approval || !member) return;
  const targetIdentity = approval.requestedIdentity;
  if (!targetIdentity) return;
  if (!canApproveRoleChange(targetIdentity)) { pushFlash("当前权限不足以审批该变岗申请。", "info"); return; }
  approval.status = "approved";
  approval.approverId = getCurrentMember().id;
  approval.reviewedAt = new Date().toISOString();
  member.identity = targetIdentity;
  member.role = getRoleForIdentity(targetIdentity);
  const user = state.database.users.find((item) => item.memberId === member.id);
  if (user) {
    createNotification(user.id, `你的变岗申请已通过，当前身份已更新为 ${dictionaries.identities[targetIdentity]}`, { sourceId: approval.id, sourceType: "approval", memberId: member.id, type: "info" });
  }
  if (!(await saveDatabase())) return;
  const { escapeHtml } = await import("../core/security.js");
  pushFlash(`已通过 ${member.name} 的变岗申请，当前身份已更新为 ${escapeHtml(dictionaries.identities[targetIdentity])}。`, "info");
}

export async function handleRoleChangeRequestForm(form) {
  const member = getCurrentMember();
  if (!member) { pushFlash("请先登录。", "info"); return; }
  if (!canRequestRoleChange(member)) { pushFlash("您已有一个待审核的变岗申请，请等待审核完成后再提交。", "info"); return; }

  const formData = new FormData(form);
  const requestedIdentity = String(formData.get("requestedIdentity") || "");
  const reason = String(formData.get("reason") || "").trim();
  if (!requestedIdentity || !dictionaries.identityRoleMap[requestedIdentity]) { pushFlash("请选择有效的目标身份。", "info"); return; }
  if (requestedIdentity === member.identity) { pushFlash("目标身份与当前身份相同，无需变更。", "info"); return; }
  if (!reason) { pushFlash("请填写变岗原因。", "info"); return; }

  const approvalId = uid("approval");
  const approval = { id: approvalId, type: "status_change", targetId: member.id, submitterId: member.id, approverId: null, status: "pending", comment: reason, requestedIdentity, createdAt: new Date().toISOString(), reviewedAt: null };
  addRecord("approvals", approval);
  // Notify reviewers of new role change request
  const reviewerUserIds = getReviewerUserIds();
  reviewerUserIds.forEach((reviewerId) => {
    createNotification(reviewerId, `${member.name} 提交了变岗申请，等待审核`, { sourceId: approval.id, sourceType: "approval", memberId: member.id, type: "info" });
  });
  if (!(await saveDatabase())) { removeWhere("approvals", (item) => item.id === approvalId); return; }
  clearModalStack();
  pushFlash("变岗申请已提交，等待审核。", "info");
}

export async function handleApprovalRejectionForm(form) {
  const formData = new FormData(form);
  const approvalId = String(formData.get("approvalId") || "").trim();
  const decisionType = String(formData.get("decisionType") || "reject").trim();
  const reason = String(formData.get("reason") || "").trim();
  if (!approvalId) {
    pushFlash("缺少审核记录，无法提交。", "info");
    return;
  }
  if (!reason) {
    pushFlash("请填写处理原因。", "info");
    return;
  }
  if (decisionType === "registration") {
    await rejectRegistration(approvalId, reason);
    return;
  }
  if (decisionType === "return") {
    await returnCompletion(approvalId, reason);
    return;
  }
  await rejectApproval(approvalId, reason);
}

export async function deleteApprovalRecord(approvalId) {
  const approval = getApprovalById(approvalId);
  if (!approval || !canDeleteApprovalRecord(approval)) { pushFlash("当前没有权限删除该审核记录。", "info"); return; }
  if (!window.confirm("确认删除这条审核记录？删除后不可恢复。")) return;
  removeWhere("approvals", (item) => item.id === approvalId);
  removeNotificationsBySource("approval", approvalId);
  if (!(await saveDatabase())) return;
  if (approval.attachments?.length) {
    const { deleteLocalAttachments } = await import("../core/upload.js");
    await deleteLocalAttachments(approval.attachments);
  }
  if (state.modal?.approvalId === approvalId) { clearModalStack(); }
  pushFlash("审核记录已删除。", "info");
}
