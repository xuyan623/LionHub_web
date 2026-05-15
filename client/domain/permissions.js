import { state, dictionaries, routes } from "../core/state.js";
import { getCurrentMember, getTaskById, getMemberById, getTaskParticipantRecordsByMember } from "../core/member-state.js";
import { toArray } from "../core/utils.js";

export function getRoleForIdentity(identity) {
  return dictionaries.identityRoleMap[identity] || "seedling";
}

export function getRoleHierarchy() {
  return ["admin", "leader", "formal_member", "reserve", "seedling", "teacher"];
}

function getRolePriority(role) {
  const index = getRoleHierarchy().indexOf(role);
  return index === -1 ? 99 : index;
}

export function canApproveRoleChange(targetIdentity) {
  const member = getCurrentMember();
  if (!member || !canReview()) {
    return false;
  }
  const targetRole = getRoleForIdentity(targetIdentity);
  return getRolePriority(member.role) <= getRolePriority(targetRole);
}

export function canRequestRoleChange(member = getCurrentMember()) {
  if (!member || member.hiddenFromDirectory || !canMemberParticipateInTasks(member)) {
    return false;
  }
  const pendingChange = state.database.approvals.find(
    (approval) => approval.type === "status_change" && approval.targetId === member.id && approval.status === "pending"
  );
  return !pendingChange;
}

export function canMemberParticipateInTasks(member = getCurrentMember()) {
  return Boolean(member)
    && !isRetiredMember(member)
    && !isDisabledMember(member)
    && member.role !== "teacher";
}

export function canMemberAccruePoints(member) {
  return Boolean(member) && !isRetiredMember(member) && !isDisabledMember(member);
}

export function canEditTask(task, member = getCurrentMember()) {
  if (!task || !member || !canMemberParticipateInTasks(member)) {
    return false;
  }
  return isAdmin() || task.creatorId === member.id || task.ownerId === member.id;
}

export function canMemberBeAddedToTask(member) {
  return Boolean(member)
    && !isPendingReviewMember(member)
    && !isRetiredMember(member)
    && !isDisabledMember(member)
    && member.role !== "teacher";
}

export function canCreateTask() {
  const member = getCurrentMember();
  return canMemberParticipateInTasks(member) && ["admin", "leader", "formal_member", "reserve"].includes(member?.role);
}

export function canReview() {
  const member = getCurrentMember();
  return canMemberParticipateInTasks(member) && ["admin", "leader"].includes(member?.role);
}

export function canInteractWithTasks() {
  return canMemberParticipateInTasks(getCurrentMember());
}

export function isAdmin() {
  return getCurrentMember()?.role === "admin";
}

export function isLeader() {
  return getCurrentMember()?.role === "leader";
}

export function canDeleteAllGeneratedData() {
  return isAdmin() && !isRetiredMember(getCurrentMember()) && !isDisabledMember(getCurrentMember());
}

export function canDeleteTaskGeneratedData(task, authorId = "") {
  const member = getCurrentMember();
  if (!member || !task || (authorId && authorId !== member.id && !canMemberParticipateInTasks(member))) {
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

export function canDeleteApprovalRecord(approval) {
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

export function canDeletePointTransaction(transaction) {
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

export function canDeleteTask(task) {
  const member = getCurrentMember();
  if (!member || !task || !canMemberParticipateInTasks(member)) {
    return false;
  }
  return canDeleteAllGeneratedData() || task.creatorId === member.id || canDeleteTaskGeneratedData(task);
}

export function doesTaskFallWithinMemberScope(task, member = getCurrentMember()) {
  if (!task || !member) {
    return false;
  }
  if (task.ownerId === member.id || task.creatorId === member.id) {
    return true;
  }
  return toArray(task.departments || task.department).some((d) => matchesSingleScopeValue(d, member.departments))
    || toArray(task.directions || task.direction).some((d) => matchesSingleScopeValue(d, member.directions))
    || toArray(task.robotGroups || task.robotGroup).some((d) => matchesSingleScopeValue(d, member.robotGroups));
}

export function doesMemberFallWithinMemberScope(targetMember, member = getCurrentMember()) {
  if (!targetMember || !member) {
    return false;
  }
  if (targetMember.id === member.id) {
    return true;
  }
  return haveScopeIntersection(targetMember.departments, member.departments)
    || haveScopeIntersection(targetMember.directions, member.directions)
    || haveScopeIntersection(targetMember.robotGroups, member.robotGroups);
}

function matchesSingleScopeValue(value, scopeValues) {
  return Boolean(value && Array.isArray(scopeValues) && scopeValues.includes(value));
}

function haveScopeIntersection(leftValues, rightValues) {
  return (leftValues || []).some((value) => (rightValues || []).includes(value));
}

export function getVisibleRoutes() {
  const member = getCurrentMember();
  const role = member?.role;
  if (!role) {
    return [];
  }
  const visibleRoutes = routes.filter((route) => route.audience.includes(role));
  if (isRetiredMember(member)) {
    const allowedRouteIds = new Set(["dashboard", "market", "members", "projects", "rankings", "profile"]);
    return visibleRoutes.filter((route) => allowedRouteIds.has(route.id));
  }
  return visibleRoutes;
}

export function ensureVisibleRoute() {
  if (!state.currentUserId) {
    return;
  }
  const visible = getVisibleRoutes();
  if (!visible.some((route) => route.id === state.route)) {
    state.route = visible[0]?.id || "dashboard";
  }
}

export function isPendingReviewMember(member) {
  return member?.memberStatus === "pending_review";
}

export function isRetiredMember(member) {
  return member?.memberStatus === "retired";
}

export function isDisabledMember(member) {
  return member?.memberStatus === "disabled";
}

export function isTaskOpenStatus(status) {
  return ["todo", "in_progress", "pending_review", "overdue"].includes(status);
}

export function isMemberIncludedInWorkspaceStats(member) {
  return Boolean(member) && !isPendingReviewMember(member) && !isRetiredMember(member) && !isDisabledMember(member);
}

export function isMemberIncludedInRankings(member) {
  return isMemberIncludedInWorkspaceStats(member);
}

export function getLifecycleBlockingTasks(memberId) {
  const taskIds = new Set();
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

export function getMemberPendingRoleChange(memberId) {
  return state.database.approvals.find(
    (approval) => approval.type === "status_change" && approval.targetId === memberId && approval.status === "pending" && approval.requestedIdentity
  ) || null;
}
