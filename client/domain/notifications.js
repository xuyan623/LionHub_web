import { state } from "../core/state.js";
import { uid } from "../core/security.js";
import { getCurrentUser, getMemberById } from "./query.js";

export function ensureNotificationsArray() {
  if (!Array.isArray(state.database.notifications)) {
    state.database.notifications = [];
  }
}

/**
 * Create a notification tied to a source event.
 * When the source event is deleted, its notifications are automatically removed.
 *
 * @param {string} recipientUserId - The user who should receive this notification.
 * @param {string} text - Notification text.
 * @param {object} meta - Metadata object.
 *   @param {string} meta.sourceId - ID of the entity that triggered this notification.
 *   @param {string} meta.sourceType - Type of the source entity: "comment", "approval", "participant", "task".
 *   @param {string} [meta.taskId] - Related task ID for navigation.
 *   @param {string} [meta.memberId] - Related member ID for navigation.
 *   @param {string} [meta.type="info"] - Notification subtype.
 */
export function createNotification(recipientUserId, text, meta = {}) {
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
    createdAt: new Date().toISOString(),
  });
}

/** Remove all notifications tied to a specific source entity. */
export function removeNotificationsBySource(sourceType, sourceId) {
  ensureNotificationsArray();
  state.database.notifications = state.database.notifications.filter(
    (n) => n.sourceType !== sourceType || n.sourceId !== sourceId
  );
}

/** Remove all notifications related to a specific task. */
export function removeNotificationsByTask(taskId) {
  ensureNotificationsArray();
  state.database.notifications = state.database.notifications.filter(
    (n) => n.taskId !== taskId
  );
}

/** Remove all notifications for a specific user (used when user/member is deleted). */
export function removeNotificationsByUser(userId) {
  ensureNotificationsArray();
  state.database.notifications = state.database.notifications.filter(
    (n) => n.userId !== userId
  );
}

/**
 * Clean up orphaned notifications whose source entity no longer exists.
 * Run this on database load to ensure consistency.
 */
export function cleanupOrphanedNotifications() {
  ensureNotificationsArray();
  const taskIds = new Set(state.database.tasks.map((t) => t.id));
  const approvalIds = new Set(state.database.approvals.map((a) => a.id));
  const commentIds = new Set();
  state.database.tasks.forEach((task) => {
    (task.comments || []).forEach((comment) => commentIds.add(comment.id));
  });
  const participantIds = new Set(state.database.taskParticipants.map((p) => p.id));
  const userIds = new Set(state.database.users.map((u) => u.id));

  state.database.notifications = state.database.notifications.filter((n) => {
    // If notification has no source binding, keep it (legacy compatibility).
    if (!n.sourceType || !n.sourceId) {
      return true;
    }
    // If recipient user no longer exists, remove it.
    if (!userIds.has(n.userId)) {
      return false;
    }
    // Verify source entity still exists.
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

export function getNotificationsForCurrentUser() {
  ensureNotificationsArray();
  const user = getCurrentUser();
  if (!user) return [];
  const sevenDaysAgo = Date.now() - 86400000 * 7;
  return state.database.notifications
    .filter((n) => n.userId === user.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 20)
    .filter((n) => new Date(n.createdAt).getTime() > sevenDaysAgo);
}

export function getUnreadNotificationCount() {
  ensureNotificationsArray();
  const user = getCurrentUser();
  if (!user) return 0;
  return state.database.notifications.filter((n) => n.userId === user.id && !n.read).length;
}

export function markAllNotificationsRead() {
  ensureNotificationsArray();
  const user = getCurrentUser();
  if (!user) return;
  state.database.notifications.forEach((n) => {
    if (n.userId === user.id) n.read = true;
  });
}

export function getRecipientUserIdsFromMentionText(content) {
  const mentions = content.match(/@(\S+)/g) || [];
  const ids = [];
  mentions.forEach((mention) => {
    const name = mention.slice(1);
    const member = state.database.members.find((m) => m.name === name);
    if (member && member.userId) ids.push(member.userId);
  });
  return [...new Set(ids)];
}

/** Get all user IDs of members who have review/admin permissions. */
export function getReviewerUserIds() {
  const ids = [];
  state.database.members.forEach((member) => {
    if (member.role === "admin" || member.role === "leader") {
      if (member.userId) ids.push(member.userId);
    }
  });
  return [...new Set(ids)];
}

export function getParticipantUserIds(taskId, excludeUserId = "") {
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
