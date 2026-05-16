import {
  getCurrentUser,
  getMemberById
} from "./chunk-IKVMAO7C.js";
import {
  state
} from "./chunk-NDL62ULM.js";
import {
  uid
} from "./chunk-UQLSNBUY.js";

// client/domain/notifications.js
function ensureNotificationsArray() {
  if (!Array.isArray(state.database.notifications)) {
    state.database.notifications = [];
  }
}
function createNotification(recipientUserId, text, meta = {}) {
  ensureNotificationsArray();
  state.database.notifications.push({
    id: uid("notif"),
    userId: recipientUserId,
    text,
    sourceId: meta.sourceId || "",
    sourceType: meta.sourceType || "",
    taskId: meta.taskId || "",
    memberId: meta.memberId || "",
    type: meta.type || "info",
    read: false,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  });
}
function removeNotificationsBySource(sourceType, sourceId) {
  ensureNotificationsArray();
  state.database.notifications = state.database.notifications.filter(
    (n) => n.sourceType !== sourceType || n.sourceId !== sourceId
  );
}
function removeNotificationsByTask(taskId) {
  ensureNotificationsArray();
  state.database.notifications = state.database.notifications.filter(
    (n) => n.taskId !== taskId
  );
}
function removeNotificationsByUser(userId) {
  ensureNotificationsArray();
  state.database.notifications = state.database.notifications.filter(
    (n) => n.userId !== userId
  );
}
function cleanupOrphanedNotifications() {
  ensureNotificationsArray();
  const taskIds = new Set(state.database.tasks.map((t) => t.id));
  const approvalIds = new Set(state.database.approvals.map((a) => a.id));
  const commentIds = /* @__PURE__ */ new Set();
  state.database.tasks.forEach((task) => {
    (task.comments || []).forEach((comment) => commentIds.add(comment.id));
  });
  const participantIds = new Set(state.database.taskParticipants.map((p) => p.id));
  const userIds = new Set(state.database.users.map((u) => u.id));
  state.database.notifications = state.database.notifications.filter((n) => {
    if (!n.sourceType || !n.sourceId) {
      return true;
    }
    if (!userIds.has(n.userId)) {
      return false;
    }
    switch (n.sourceType) {
      case "task":
        return taskIds.has(n.sourceId);
      case "comment":
        return commentIds.has(n.sourceId);
      case "approval":
        return approvalIds.has(n.sourceId);
      case "participant":
        return participantIds.has(n.sourceId);
      default:
        return true;
    }
  });
}
function getNotificationsForCurrentUser() {
  ensureNotificationsArray();
  const user = getCurrentUser();
  if (!user) return [];
  const sevenDaysAgo = Date.now() - 864e5 * 7;
  return state.database.notifications.filter((n) => n.userId === user.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 20).filter((n) => new Date(n.createdAt).getTime() > sevenDaysAgo);
}
function getUnreadNotificationCount() {
  ensureNotificationsArray();
  const user = getCurrentUser();
  if (!user) return 0;
  return state.database.notifications.filter((n) => n.userId === user.id && !n.read).length;
}
function markAllNotificationsRead() {
  ensureNotificationsArray();
  const user = getCurrentUser();
  if (!user) return;
  state.database.notifications.forEach((n) => {
    if (n.userId === user.id) n.read = true;
  });
}
function getRecipientUserIdsFromMentionText(content) {
  const mentions = content.match(/@(\S+)/g) || [];
  const ids = [];
  mentions.forEach((mention) => {
    const name = mention.slice(1);
    const member = state.database.members.find((m) => m.name === name);
    if (member && member.userId) ids.push(member.userId);
  });
  return [...new Set(ids)];
}
function getReviewerUserIds() {
  const ids = [];
  state.database.members.forEach((member) => {
    if (member.role === "admin" || member.role === "leader") {
      if (member.userId) ids.push(member.userId);
    }
  });
  return [...new Set(ids)];
}
function getParticipantUserIds(taskId, excludeUserId = "") {
  const ids = [];
  const participants = state.database.taskParticipants.filter((p) => p.taskId === taskId);
  participants.forEach((p) => {
    const member = getMemberById(p.memberId);
    if (member && member.userId && member.userId !== excludeUserId) {
      ids.push(member.userId);
    }
  });
  const task = state.database.tasks.find((t) => t.id === taskId);
  if (task) {
    const owner = getMemberById(task.ownerId);
    if (owner && owner.userId && owner.userId !== excludeUserId) {
      ids.push(owner.userId);
    }
  }
  return [...new Set(ids)];
}

export {
  ensureNotificationsArray,
  createNotification,
  removeNotificationsBySource,
  removeNotificationsByTask,
  removeNotificationsByUser,
  cleanupOrphanedNotifications,
  getNotificationsForCurrentUser,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  getRecipientUserIdsFromMentionText,
  getReviewerUserIds,
  getParticipantUserIds
};
