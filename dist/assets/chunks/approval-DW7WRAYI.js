import {
  settleTaskPoints
} from "./chunk-Q5GMJ24T.js";
import {
  addRecord,
  removeWhere
} from "./chunk-GTV4JDSP.js";
import "./chunk-URJPZTLH.js";
import {
  createNotification,
  getParticipantUserIds,
  getReviewerUserIds,
  removeNotificationsBySource
} from "./chunk-SNLC6MV6.js";
import {
  clearModalStack,
  saveDatabase
} from "./chunk-KX6RKBAB.js";
import "./chunk-AFQ47FFH.js";
import {
  pushFlash
} from "./chunk-5PJ3LKYU.js";
import "./chunk-XS6Z5SGI.js";
import {
  canApproveRoleChange,
  canDeleteAllGeneratedData,
  canDeleteApprovalRecord,
  canMemberBeAddedToTask,
  canRequestRoleChange,
  canReview,
  getApprovalById,
  getCurrentMember,
  getMemberById,
  getRoleForIdentity,
  getTaskById
} from "./chunk-IKVMAO7C.js";
import {
  dictionaries,
  state
} from "./chunk-NDL62ULM.js";
import {
  uid
} from "./chunk-UQLSNBUY.js";

// client/domain/approval.js
async function handleRegistrationReview(form) {
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
  const memberStatus = String(formData.get("memberStatus") || "normal").trim();
  if (!direction || !robotGroup) {
    pushFlash("\u8BF7\u9009\u62E9\u65B9\u5411\u548C\u5175\u79CD\u7EC4\u3002", "info");
    return;
  }
  member.directions = [direction];
  member.robotGroups = [robotGroup];
  if (department) member.departments = [department];
  member.memberStatus = memberStatus;
  member.identity = identity;
  member.role = getRoleForIdentity(identity);
  member.bio = String(formData.get("bio") || member.bio || "").trim();
  const user = state.database.users.find((item) => item.memberId === member.id);
  if (user) {
    user.identity = member.identity;
    user.role = member.role;
    user.status = "active";
  }
  approval.status = "approved";
  approval.approverId = getCurrentMember().id;
  approval.reviewedAt = (/* @__PURE__ */ new Date()).toISOString();
  approval.comment = "\u6CE8\u518C\u5BA1\u6838\u901A\u8FC7\uFF0C\u5DF2\u5206\u914D\u8EAB\u4EFD\u3002";
  const approvedUser = member.userId ? state.database.users.find((item) => item.id === member.userId) : null;
  if (approvedUser) {
    createNotification(approvedUser.id, "\u4F60\u7684\u6CE8\u518C\u7533\u8BF7\u5DF2\u901A\u8FC7\u5BA1\u6838\uFF0C\u6B22\u8FCE\u52A0\u5165\u6218\u961F\u5DE5\u4F5C\u53F0", { sourceId: approval.id, sourceType: "approval", memberId: member.id, type: "info" });
  }
  if (!await saveDatabase()) {
    pushFlash("\u4FDD\u5B58\u5931\u8D25\uFF0C\u53EF\u80FD\u662F\u6570\u636E\u7248\u672C\u51B2\u7A81\uFF0C\u8BF7\u5237\u65B0\u9875\u9762\u540E\u91CD\u8BD5\u3002", "error");
    return;
  }
  clearModalStack();
  pushFlash("\u6CE8\u518C\u5BA1\u6838\u901A\u8FC7\uFF0C\u6210\u5458\u5DF2\u6FC0\u6D3B\u5E76\u53EF\u8FDB\u5165\u5DE5\u4F5C\u53F0\u3002", "info");
}
async function approveJoinRequest(approvalId) {
  const approval = getApprovalById(approvalId);
  if (!approval || !canReview()) return;
  const task = getTaskById(approval.targetId);
  const member = getMemberById(approval.submitterId);
  if (!task || !member) return;
  if (!canMemberBeAddedToTask(member)) {
    pushFlash("\u8BE5\u6210\u5458\u5F53\u524D\u72B6\u6001\u4E0D\u80FD\u52A0\u5165\u4EFB\u52A1\u3002", "info");
    return;
  }
  approval.status = "approved";
  approval.approverId = getCurrentMember().id;
  approval.reviewedAt = (/* @__PURE__ */ new Date()).toISOString();
  approval.comment = "\u52A0\u5165\u5BA1\u6279\u901A\u8FC7";
  const newParticipant = { id: uid("participant"), taskId: task.id, memberId: member.id, role: "\u534F\u4F5C\u8005", joinType: task.status === "todo" ? "initial" : "middle", status: "involved", joinedAt: (/* @__PURE__ */ new Date()).toISOString(), exitedAt: null, contributionRatio: 1 };
  addRecord("taskParticipants", newParticipant);
  if (member.userId) {
    createNotification(member.userId, `\u4F60\u52A0\u5165\u300A${task.title}\u300B\u7684\u7533\u8BF7\u5DF2\u901A\u8FC7`, { sourceId: approval.id, sourceType: "approval", taskId: task.id, memberId: member.id, type: "task_assign" });
  }
  if (!await saveDatabase()) return;
  pushFlash(`\u5DF2\u901A\u8FC7 ${member.name} \u7684\u52A0\u5165\u7533\u8BF7\u3002`, "info");
}
async function rejectApproval(approvalId, comment) {
  const approval = getApprovalById(approvalId);
  if (!approval) return;
  approval.status = "rejected";
  approval.approverId = getCurrentMember().id;
  approval.reviewedAt = (/* @__PURE__ */ new Date()).toISOString();
  approval.comment = comment;
  if (approval.type === "join") {
    const member = getMemberById(approval.submitterId);
    const task = getTaskById(approval.targetId);
    if (member?.userId && task) {
      createNotification(member.userId, `\u4F60\u52A0\u5165\u300A${task.title}\u300B\u7684\u7533\u8BF7\u88AB\u62D2\u7EDD\uFF1A${comment}`, { sourceId: approval.id, sourceType: "approval", taskId: task.id, memberId: member.id, type: "task_review" });
    }
  }
  if (!await saveDatabase()) return;
  pushFlash("\u5BA1\u6279\u5DF2\u62D2\u7EDD\u3002", "info");
}
async function rejectRegistration(approvalId) {
  const approval = getApprovalById(approvalId);
  if (!approval) return;
  const member = getMemberById(approval.targetId);
  const user = member ? state.database.users.find((item) => item.memberId === member.id) : null;
  approval.status = "rejected";
  approval.approverId = getCurrentMember().id;
  approval.reviewedAt = (/* @__PURE__ */ new Date()).toISOString();
  approval.comment = "\u6CE8\u518C\u5BA1\u6838\u672A\u901A\u8FC7";
  if (user) user.status = "rejected";
  if (user) {
    createNotification(user.id, "\u4F60\u7684\u6CE8\u518C\u7533\u8BF7\u672A\u901A\u8FC7\u5BA1\u6838\uFF0C\u8BF7\u8054\u7CFB\u7BA1\u7406\u5458\u4E86\u89E3\u8BE6\u60C5", { sourceId: approval.id, sourceType: "approval", memberId: member?.id, type: "task_review" });
  }
  if (!await saveDatabase()) return;
  clearModalStack();
  pushFlash("\u6CE8\u518C\u7533\u8BF7\u5DF2\u62D2\u7EDD\u3002", "info");
}
async function approveCompletion(approvalId) {
  const approval = getApprovalById(approvalId);
  if (!approval || !canDeleteAllGeneratedData()) {
    pushFlash("\u53EA\u6709\u7BA1\u7406\u5458\u53EF\u4EE5\u5B8C\u6210\u4EFB\u52A1\u7ED3\u7B97\u3002", "info");
    return;
  }
  const task = getTaskById(approval.targetId);
  if (!task) return;
  approval.status = "approved";
  approval.approverId = getCurrentMember().id;
  approval.reviewedAt = (/* @__PURE__ */ new Date()).toISOString();
  approval.comment = "\u4EFB\u52A1\u5B8C\u6210\u5BA1\u6838\u901A\u8FC7";
  task.status = "completed";
  task.completedAt = (/* @__PURE__ */ new Date()).toISOString();
  task.progressPercent = 100;
  const existingTransactions = state.database.pointTransactions.some((item) => item.taskId === task.id);
  if (!existingTransactions) settleTaskPoints(task);
  const participantUserIds = getParticipantUserIds(task.id);
  participantUserIds.forEach((userId) => {
    createNotification(userId, `\u4EFB\u52A1\u300A${task.title}\u300B\u5BA1\u6838\u901A\u8FC7\uFF0C\u79EF\u5206\u5DF2\u7ED3\u7B97`, { sourceId: approval.id, sourceType: "approval", taskId: task.id, type: "task_review" });
  });
  addRecord("approvals", { id: uid("approval"), type: "settlement", targetId: task.id, submitterId: getCurrentMember().id, approverId: getCurrentMember().id, status: "approved", comment: "\u4EFB\u52A1\u70B9\u6570\u5DF2\u7ED3\u7B97", createdAt: (/* @__PURE__ */ new Date()).toISOString(), reviewedAt: (/* @__PURE__ */ new Date()).toISOString() });
  if (!await saveDatabase()) return;
  pushFlash("\u4EFB\u52A1\u5BA1\u6838\u901A\u8FC7\u5E76\u5B8C\u6210\u70B9\u6570\u7ED3\u7B97\u3002", "info");
}
async function approvePromotionRequest(approvalId) {
  const approval = getApprovalById(approvalId);
  const member = approval ? getMemberById(approval.targetId) : null;
  if (!approval || !member || !canReview()) return;
  approval.status = "approved";
  approval.approverId = getCurrentMember().id;
  approval.reviewedAt = (/* @__PURE__ */ new Date()).toISOString();
  member.identity = "formal";
  member.role = getRoleForIdentity("formal");
  const user = state.database.users.find((item) => item.memberId === member.id);
  if (user) {
    createNotification(user.id, "\u4F60\u7684\u8F6C\u6B63\u7533\u8BF7\u5DF2\u901A\u8FC7\uFF0C\u5F53\u524D\u8EAB\u4EFD\u5DF2\u66F4\u65B0\u4E3A\u6B63\u5F0F\u6210\u5458", { sourceId: approval.id, sourceType: "approval", memberId: member.id, type: "info" });
  }
  if (!await saveDatabase()) return;
  pushFlash(`\u5DF2\u901A\u8FC7 ${member.name} \u7684\u8F6C\u6B63\u7533\u8BF7\u3002`, "info");
}
async function returnCompletion(approvalId) {
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
  approval.reviewedAt = (/* @__PURE__ */ new Date()).toISOString();
  approval.comment = "\u8BF7\u8865\u5145\u6210\u679C\u540E\u91CD\u65B0\u63D0\u4EA4";
  if (task) {
    const participantUserIds = getParticipantUserIds(task.id);
    participantUserIds.forEach((userId) => {
      createNotification(userId, `\u4EFB\u52A1\u300A${task.title}\u300B\u88AB\u9000\u56DE\uFF0C\u8BF7\u8865\u5145\u6210\u679C`, { sourceId: approval.id, sourceType: "approval", taskId: task.id, type: "task_review" });
    });
  }
  if (!await saveDatabase()) return;
  pushFlash("\u4EFB\u52A1\u5DF2\u9000\u56DE\u4FEE\u6539\u3002", "info");
}
async function approveStatusChangeRequest(approvalId) {
  const approval = getApprovalById(approvalId);
  const member = approval ? getMemberById(approval.targetId) : null;
  if (!approval || !member) return;
  const targetIdentity = approval.requestedIdentity;
  if (!targetIdentity) return;
  if (!canApproveRoleChange(targetIdentity)) {
    pushFlash("\u5F53\u524D\u6743\u9650\u4E0D\u8DB3\u4EE5\u5BA1\u6279\u8BE5\u53D8\u5C97\u7533\u8BF7\u3002", "info");
    return;
  }
  approval.status = "approved";
  approval.approverId = getCurrentMember().id;
  approval.reviewedAt = (/* @__PURE__ */ new Date()).toISOString();
  member.identity = targetIdentity;
  member.role = getRoleForIdentity(targetIdentity);
  const user = state.database.users.find((item) => item.memberId === member.id);
  if (user) {
    createNotification(user.id, `\u4F60\u7684\u53D8\u5C97\u7533\u8BF7\u5DF2\u901A\u8FC7\uFF0C\u5F53\u524D\u8EAB\u4EFD\u5DF2\u66F4\u65B0\u4E3A ${dictionaries.identities[targetIdentity]}`, { sourceId: approval.id, sourceType: "approval", memberId: member.id, type: "info" });
  }
  if (!await saveDatabase()) return;
  const { escapeHtml } = await import("./security-BIYYAXRK.js");
  pushFlash(`\u5DF2\u901A\u8FC7 ${member.name} \u7684\u53D8\u5C97\u7533\u8BF7\uFF0C\u5F53\u524D\u8EAB\u4EFD\u5DF2\u66F4\u65B0\u4E3A ${escapeHtml(dictionaries.identities[targetIdentity])}\u3002`, "info");
}
async function handleRoleChangeRequestForm(form) {
  const member = getCurrentMember();
  if (!member) {
    pushFlash("\u8BF7\u5148\u767B\u5F55\u3002", "info");
    return;
  }
  if (!canRequestRoleChange(member)) {
    pushFlash("\u60A8\u5DF2\u6709\u4E00\u4E2A\u5F85\u5BA1\u6838\u7684\u53D8\u5C97\u7533\u8BF7\uFF0C\u8BF7\u7B49\u5F85\u5BA1\u6838\u5B8C\u6210\u540E\u518D\u63D0\u4EA4\u3002", "info");
    return;
  }
  const formData = new FormData(form);
  const requestedIdentity = String(formData.get("requestedIdentity") || "");
  const reason = String(formData.get("reason") || "").trim();
  if (!requestedIdentity || !dictionaries.identityRoleMap[requestedIdentity]) {
    pushFlash("\u8BF7\u9009\u62E9\u6709\u6548\u7684\u76EE\u6807\u8EAB\u4EFD\u3002", "info");
    return;
  }
  if (requestedIdentity === member.identity) {
    pushFlash("\u76EE\u6807\u8EAB\u4EFD\u4E0E\u5F53\u524D\u8EAB\u4EFD\u76F8\u540C\uFF0C\u65E0\u9700\u53D8\u66F4\u3002", "info");
    return;
  }
  if (!reason) {
    pushFlash("\u8BF7\u586B\u5199\u53D8\u5C97\u539F\u56E0\u3002", "info");
    return;
  }
  const approvalId = uid("approval");
  const approval = { id: approvalId, type: "status_change", targetId: member.id, submitterId: member.id, approverId: null, status: "pending", comment: reason, requestedIdentity, createdAt: (/* @__PURE__ */ new Date()).toISOString(), reviewedAt: null };
  addRecord("approvals", approval);
  const reviewerUserIds = getReviewerUserIds();
  reviewerUserIds.forEach((reviewerId) => {
    createNotification(reviewerId, `${member.name} \u63D0\u4EA4\u4E86\u53D8\u5C97\u7533\u8BF7\uFF0C\u7B49\u5F85\u5BA1\u6838`, { sourceId: approval.id, sourceType: "approval", memberId: member.id, type: "info" });
  });
  if (!await saveDatabase()) {
    removeWhere("approvals", (item) => item.id === approvalId);
    return;
  }
  clearModalStack();
  pushFlash("\u53D8\u5C97\u7533\u8BF7\u5DF2\u63D0\u4EA4\uFF0C\u7B49\u5F85\u5BA1\u6838\u3002", "info");
}
async function deleteApprovalRecord(approvalId) {
  const approval = getApprovalById(approvalId);
  if (!approval || !canDeleteApprovalRecord(approval)) {
    pushFlash("\u5F53\u524D\u6CA1\u6709\u6743\u9650\u5220\u9664\u8BE5\u5BA1\u6838\u8BB0\u5F55\u3002", "info");
    return;
  }
  if (!window.confirm("\u786E\u8BA4\u5220\u9664\u8FD9\u6761\u5BA1\u6838\u8BB0\u5F55\uFF1F\u5220\u9664\u540E\u4E0D\u53EF\u6062\u590D\u3002")) return;
  removeWhere("approvals", (item) => item.id === approvalId);
  removeNotificationsBySource("approval", approvalId);
  if (!await saveDatabase()) return;
  if (approval.attachments?.length) {
    const { deleteLocalAttachments } = await import("./upload-FM77GBYH.js");
    await deleteLocalAttachments(approval.attachments);
  }
  if (state.modal?.approvalId === approvalId) {
    clearModalStack();
  }
  pushFlash("\u5BA1\u6838\u8BB0\u5F55\u5DF2\u5220\u9664\u3002", "info");
}
export {
  approveCompletion,
  approveJoinRequest,
  approvePromotionRequest,
  approveStatusChangeRequest,
  deleteApprovalRecord,
  handleRegistrationReview,
  handleRoleChangeRequestForm,
  rejectApproval,
  rejectRegistration,
  returnCompletion
};
