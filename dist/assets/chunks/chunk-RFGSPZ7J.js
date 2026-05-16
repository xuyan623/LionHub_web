import {
  uid
} from "./chunk-UQLSNBUY.js";
import {
  dictionaries,
  routes,
  state
} from "./chunk-NDL62ULM.js";

// client/core/member-state.js
function getCurrentUser() {
  return state.database?.users.find((user) => user.id === state.currentUserId) || null;
}
function getCurrentMember() {
  const user = getCurrentUser();
  if (!user?.memberId) {
    return null;
  }
  return getMemberById(user.memberId);
}
function getTaskById(taskId) {
  return state.database.tasks.find((task) => task.id === taskId) || null;
}
function getMemberById(memberId) {
  const persistedMember = state.database.members.find((member) => member.id === memberId);
  if (persistedMember) {
    return persistedMember;
  }
  const hiddenAccount = getHiddenAccountUserByMemberId(memberId);
  return hiddenAccount ? buildHiddenAccountMember(hiddenAccount) : null;
}
function getApprovalById(approvalId) {
  return state.database.approvals.find((approval) => approval.id === approvalId) || null;
}
function getHiddenAccountUserByMemberId(memberId) {
  if (!memberId) {
    return null;
  }
  return state.database.users.find(
    (user) => user.memberId === memberId && user.hiddenFromDirectory === true && Boolean(user.role)
  ) || null;
}
function buildHiddenAccountMember(user) {
  return {
    id: user.memberId,
    userId: user.id,
    name: user.name || user.username || user.email,
    avatar: "",
    phone: user.phone || "",
    identity: user.identity || "captain",
    role: user.role || "admin",
    departments: Array.isArray(user.departments) ? [...user.departments] : [],
    directions: Array.isArray(user.directions) ? [...user.directions] : [],
    robotGroups: Array.isArray(user.robotGroups) ? [...user.robotGroups] : [],
    positions: Array.isArray(user.positions) ? [...user.positions] : [],
    skillTags: Array.isArray(user.skillTags) ? [...user.skillTags] : [],
    joinDate: user.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
    memberStatus: "normal",
    bio: user.bio || "\u7AD9\u70B9\u9690\u85CF\u7BA1\u7406\u5458\u8D26\u53F7",
    hiddenFromDirectory: true
  };
}
function updateMemberProfileFields(memberId, profileFields) {
  const persistedMember = state.database.members.find((member) => member.id === memberId);
  if (persistedMember) {
    Object.assign(persistedMember, profileFields);
    return true;
  }
  const hiddenAccount = getHiddenAccountUserByMemberId(memberId);
  if (!hiddenAccount) {
    return false;
  }
  Object.assign(hiddenAccount, profileFields);
  return true;
}
function getTaskParticipantRecords(taskId) {
  return state.database.taskParticipants.filter((participant) => participant.taskId === taskId);
}
function getTaskParticipantRecordsByMember(memberId) {
  return state.database.taskParticipants.filter((participant) => participant.memberId === memberId);
}
function getActiveParticipantCount(taskId) {
  return getTaskParticipantRecords(taskId).filter((item) => item.status === "involved").length;
}

// client/core/utils.js
function createComment(title, content, member) {
  return {
    id: uid("comment"),
    title,
    content,
    authorId: member.id,
    authorName: member.name,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function truncate(value, maxLength) {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength)}...`;
}
function getInitials(name) {
  return String(name || "?").trim().slice(0, 1).toUpperCase();
}
function parseList(value = "") {
  return String(value).split(/[,，、\s]+/).map((item) => item.trim()).filter(Boolean);
}
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
function roundPointFromSettings(value) {
  const precision = state?.database?.settings?.pointPrecision ?? 1;
  return parseFloat(value.toFixed(precision));
}
function toArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value) return [value];
  return [];
}
function joinOr(arr, fallback = "\u901A\u7528") {
  const list = toArray(arr);
  return list.length ? list.join(" / ") : fallback;
}

// client/domain/permissions.js
function getRoleForIdentity(identity) {
  return dictionaries.identityRoleMap[identity] || "seedling";
}
function getRoleHierarchy() {
  return ["admin", "leader", "formal_member", "reserve", "seedling", "teacher"];
}
function getRolePriority(role) {
  const index = getRoleHierarchy().indexOf(role);
  return index === -1 ? 99 : index;
}
function canApproveRoleChange(targetIdentity) {
  const member = getCurrentMember();
  if (!member || !canReview()) {
    return false;
  }
  const targetRole = getRoleForIdentity(targetIdentity);
  return getRolePriority(member.role) <= getRolePriority(targetRole);
}
function canRequestRoleChange(member = getCurrentMember()) {
  if (!member || member.hiddenFromDirectory || !canMemberParticipateInTasks(member)) {
    return false;
  }
  const pendingChange = state.database.approvals.find(
    (approval) => approval.type === "status_change" && approval.targetId === member.id && approval.status === "pending"
  );
  return !pendingChange;
}
function canMemberParticipateInTasks(member = getCurrentMember()) {
  return Boolean(member) && !isRetiredMember(member) && !isDisabledMember(member) && member.role !== "teacher";
}
function canMemberAccruePoints(member) {
  return Boolean(member) && !isRetiredMember(member) && !isDisabledMember(member);
}
function canEditTask(task, member = getCurrentMember()) {
  if (!task || !member || !canMemberParticipateInTasks(member)) {
    return false;
  }
  return isAdmin() || task.creatorId === member.id || task.ownerId === member.id;
}
function canMemberBeAddedToTask(member) {
  return Boolean(member) && !isPendingReviewMember(member) && !isRetiredMember(member) && !isDisabledMember(member) && member.role !== "teacher";
}
function canCreateTask() {
  const member = getCurrentMember();
  return canMemberParticipateInTasks(member) && ["admin", "leader", "formal_member", "reserve"].includes(member?.role);
}
function canReview() {
  const member = getCurrentMember();
  return canMemberParticipateInTasks(member) && ["admin", "leader"].includes(member?.role);
}
function canInteractWithTasks() {
  return canMemberParticipateInTasks(getCurrentMember());
}
function isAdmin() {
  return getCurrentMember()?.role === "admin";
}
function isLeader() {
  return getCurrentMember()?.role === "leader";
}
function canDeleteAllGeneratedData() {
  return isAdmin() && !isRetiredMember(getCurrentMember()) && !isDisabledMember(getCurrentMember());
}
function canDeleteTaskGeneratedData(task, authorId = "") {
  const member = getCurrentMember();
  if (!member || !task || authorId && authorId !== member.id && !canMemberParticipateInTasks(member)) {
    return false;
  }
  if (canDeleteAllGeneratedData()) {
    return true;
  }
  if (authorId && authorId === member.id) {
    return true;
  }
  if (!isLeader() || !canMemberParticipateInTasks(member)) {
    return false;
  }
  return doesTaskFallWithinMemberScope(task, member);
}
function canDeleteApprovalRecord(approval) {
  const member = getCurrentMember();
  if (!member || !approval || !canMemberParticipateInTasks(member)) {
    return false;
  }
  if (canDeleteAllGeneratedData()) {
    return true;
  }
  if (!isLeader()) {
    return false;
  }
  if (["join", "completion", "settlement"].includes(approval.type)) {
    return canDeleteTaskGeneratedData(getTaskById(approval.targetId));
  }
  if (["registration", "promotion", "compensation", "status_change"].includes(approval.type)) {
    return doesMemberFallWithinMemberScope(getMemberById(approval.targetId), member);
  }
  return false;
}
function canDeletePointTransaction(transaction) {
  const member = getCurrentMember();
  if (!member || !transaction || !canMemberParticipateInTasks(member)) {
    return false;
  }
  if (canDeleteAllGeneratedData()) {
    return true;
  }
  if (!isLeader()) {
    return false;
  }
  const task = transaction.taskId ? getTaskById(transaction.taskId) : null;
  if (task) {
    return doesTaskFallWithinMemberScope(task, member);
  }
  const targetMember = getMemberById(transaction.memberId);
  return doesMemberFallWithinMemberScope(targetMember, member);
}
function canDeleteTask(task) {
  const member = getCurrentMember();
  if (!member || !task || !canMemberParticipateInTasks(member)) {
    return false;
  }
  return canDeleteAllGeneratedData() || task.creatorId === member.id || canDeleteTaskGeneratedData(task);
}
function doesTaskFallWithinMemberScope(task, member = getCurrentMember()) {
  if (!task || !member) {
    return false;
  }
  if (task.ownerId === member.id || task.creatorId === member.id) {
    return true;
  }
  return toArray(task.departments || task.department).some((d) => matchesSingleScopeValue(d, member.departments)) || toArray(task.directions || task.direction).some((d) => matchesSingleScopeValue(d, member.directions)) || toArray(task.robotGroups || task.robotGroup).some((d) => matchesSingleScopeValue(d, member.robotGroups));
}
function doesMemberFallWithinMemberScope(targetMember, member = getCurrentMember()) {
  if (!targetMember || !member) {
    return false;
  }
  if (targetMember.id === member.id) {
    return true;
  }
  return haveScopeIntersection(targetMember.departments, member.departments) || haveScopeIntersection(targetMember.directions, member.directions) || haveScopeIntersection(targetMember.robotGroups, member.robotGroups);
}
function matchesSingleScopeValue(value, scopeValues) {
  return Boolean(value && Array.isArray(scopeValues) && scopeValues.includes(value));
}
function haveScopeIntersection(leftValues, rightValues) {
  return (leftValues || []).some((value) => (rightValues || []).includes(value));
}
function getVisibleRoutes() {
  const member = getCurrentMember();
  const role = member?.role;
  if (!role) {
    return [];
  }
  const visibleRoutes = routes.filter((route) => route.audience.includes(role));
  if (isRetiredMember(member)) {
    const allowedRouteIds = /* @__PURE__ */ new Set(["dashboard", "market", "members", "projects", "rankings", "profile"]);
    return visibleRoutes.filter((route) => allowedRouteIds.has(route.id));
  }
  return visibleRoutes;
}
function ensureVisibleRoute() {
  if (!state.currentUserId) {
    return;
  }
  const visible = getVisibleRoutes();
  if (!visible.some((route) => route.id === state.route)) {
    state.route = visible[0]?.id || "dashboard";
  }
}
function isPendingReviewMember(member) {
  return member?.memberStatus === "pending_review";
}
function isRetiredMember(member) {
  return member?.memberStatus === "retired";
}
function isDisabledMember(member) {
  return member?.memberStatus === "disabled";
}
function isTaskOpenStatus(status) {
  return ["todo", "in_progress", "pending_review", "overdue"].includes(status);
}
function isMemberIncludedInWorkspaceStats(member) {
  return Boolean(member) && !isPendingReviewMember(member) && !isRetiredMember(member) && !isDisabledMember(member);
}
function isMemberIncludedInRankings(member) {
  return isMemberIncludedInWorkspaceStats(member);
}
function getLifecycleBlockingTasks(memberId) {
  const taskIds = /* @__PURE__ */ new Set();
  state.database.tasks.forEach((task) => {
    if (task.ownerId === memberId && isTaskOpenStatus(task.status)) {
      taskIds.add(task.id);
    }
  });
  getTaskParticipantRecordsByMember(memberId).forEach((participant) => {
    if (participant.status !== "involved") {
      return;
    }
    const task = getTaskById(participant.taskId);
    if (task && isTaskOpenStatus(task.status)) {
      taskIds.add(task.id);
    }
  });
  return [...taskIds].map((taskId) => getTaskById(taskId)).filter(Boolean);
}
function getMemberPendingRoleChange(memberId) {
  return state.database.approvals.find(
    (approval) => approval.type === "status_change" && approval.targetId === memberId && approval.status === "pending" && approval.requestedIdentity
  ) || null;
}

export {
  createComment,
  truncate,
  getInitials,
  parseList,
  clamp,
  roundPointFromSettings,
  toArray,
  joinOr,
  getCurrentUser,
  getCurrentMember,
  getTaskById,
  getMemberById,
  getApprovalById,
  updateMemberProfileFields,
  getTaskParticipantRecords,
  getTaskParticipantRecordsByMember,
  getActiveParticipantCount,
  getRoleForIdentity,
  getRoleHierarchy,
  canApproveRoleChange,
  canRequestRoleChange,
  canMemberParticipateInTasks,
  canMemberAccruePoints,
  canEditTask,
  canMemberBeAddedToTask,
  canCreateTask,
  canReview,
  canInteractWithTasks,
  isAdmin,
  isLeader,
  canDeleteAllGeneratedData,
  canDeleteTaskGeneratedData,
  canDeleteApprovalRecord,
  canDeletePointTransaction,
  canDeleteTask,
  doesTaskFallWithinMemberScope,
  doesMemberFallWithinMemberScope,
  getVisibleRoutes,
  ensureVisibleRoute,
  isPendingReviewMember,
  isRetiredMember,
  isDisabledMember,
  isTaskOpenStatus,
  isMemberIncludedInWorkspaceStats,
  isMemberIncludedInRankings,
  getLifecycleBlockingTasks,
  getMemberPendingRoleChange
};
