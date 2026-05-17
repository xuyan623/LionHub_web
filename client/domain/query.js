import { state, dictionaries, routes, FILES_PER_PAGE } from "../core/state.js";
import { escapeHtml } from "../core/security.js";
import { parseList, clamp, roundPointFromSettings, toArray } from "../core/utils.js";
import {
  getCurrentUser,
  getCurrentMember,
  getTaskById,
  getMemberById,
  getApprovalById,
  updateMemberProfileFields,
  getTaskParticipantRecords,
  getTaskParticipantRecordsByMember,
  getActiveParticipantCount,
} from "../core/member-state.js";
import {
  isMemberIncludedInWorkspaceStats,
  isMemberIncludedInRankings,
  isPendingReviewMember,
  isRetiredMember,
  isDisabledMember,
  canMemberParticipateInTasks,
  canReview,
  isAdmin,
  doesTaskFallWithinMemberScope,
  doesMemberFallWithinMemberScope,
  canMemberAccruePoints,
} from "./permissions.js";

export {
  getCurrentUser,
  getCurrentMember,
  getTaskById,
  getMemberById,
  getApprovalById,
  updateMemberProfileFields,
  getTaskParticipantRecords,
  getTaskParticipantRecordsByMember,
  getActiveParticipantCount,
};

export function getLoadLevel(activeCount, dueSoon, overdue) {
  if (activeCount <= 1) {
    return "idle";
  }
  if (activeCount <= 3 && overdue === 0) {
    return "normal";
  }
  if (activeCount <= 5 || dueSoon >= 2) {
    return overdue >= 2 ? "overload" : "busy";
  }
  return overdue >= 1 ? "overload" : "busy";
}

export function loadLevelOrder(level) {
  return { idle: 1, normal: 2, busy: 3, overload: 4 }[level] || 0;
}

export function getSearchPlaceholder() {
  const current = routes.find((route) => route.id === state.route);
  return current ? `搜索${current.label}中的任务、成员或标签` : "搜索";
}

export function getAttachmentsIndex() {
  const index = {};
  (state.database.tasks || []).forEach((task) => {
    (task.attachments || []).forEach((attachment) => {
      if (attachment.storagePath) {
        index[attachment.storagePath] = { type: "task", id: task.id, title: task.title || "未知任务", name: attachment.name, uploadedByName: attachment.uploadedByName, uploadedAt: attachment.uploadedAt, source: attachment.source };
      }
    });
  });
  (state.database.approvals || []).forEach((approval) => {
    (approval.attachments || []).forEach((attachment) => {
      if (attachment.storagePath) {
        index[attachment.storagePath] = { type: "approval", id: approval.id, title: dictionaries.approvalTypes[approval.type] || "审批记录", name: attachment.name, uploadedByName: attachment.uploadedByName, uploadedAt: attachment.uploadedAt, source: attachment.source };
      }
    });
  });
  return index;
}

export function getLifecycleActionDefinition(actionKey, memberId) {
  const member = getMemberById(memberId);
  if (!actionKey || !member) {
    return null;
  }

  const definitions = {
    "retire-self": {
      title: "确认退休",
      description: "退休后仍可登录查看历史记录和个人资料，但不再参与任务、不再得分，也不会进入排行榜。",
      submitLabel: "确认退休",
      successMessage: "已退休，当前账号已切换为只读状态。",
      targetStatus: "retired",
      targetUserStatus: "active",
    },
    "force-retire-member": {
      title: "确认强制退休",
      description: "该成员退休后仍会保留历史记录，但不再参与任务、不再得分，也不会进入排行榜。",
      submitLabel: "执行强制退休",
      successMessage: `已将 ${member.name} 标记为退休。`,
      targetStatus: "retired",
      targetUserStatus: "active",
    },
    "disable-member": {
      title: "确认停用账号",
      description: "停用后，成员将无法正常进入工作台；账号和历史记录会被保留，只能由管理员恢复旧账号。",
      submitLabel: "确认停用",
      successMessage: `已停用 ${member.name} 的账号。`,
      targetStatus: "disabled",
      targetUserStatus: "disabled",
    },
    "restore-member": {
      title: "确认恢复账号",
      description: "恢复后，成员会重新获得登录能力，并恢复为正常状态。",
      submitLabel: "确认恢复",
      successMessage: `已恢复 ${member.name} 的账号。`,
      targetStatus: "normal",
      targetUserStatus: "active",
    },
  };

  const definition = definitions[actionKey];
  if (!definition) {
    return null;
  }

  return { ...definition, actionKey, member };
}

function daysUntil(dateString) {
  if (!dateString) return 99;
  return Math.ceil((new Date(dateString).getTime() - Date.now()) / 86400000);
}

function isThisMonth(dateString) {
  if (!dateString) {
    return false;
  }
  const date = new Date(dateString);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

function formatShortDate(dateString) {
  if (!dateString) {
    return "";
  }
  const date = new Date(dateString);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export function getDashboardStats() {
  const members = state.database.members.filter((member) => isMemberIncludedInWorkspaceStats(member));
  const tasks = state.database.tasks;
  return {
    memberCount: members.length,
    inProgressCount: tasks.filter((task) => task.status === "in_progress").length,
    pendingReviewCount: tasks.filter((task) => task.status === "pending_review").length,
    overdueCount: tasks.filter((task) => task.status === "overdue").length,
    completedThisMonth: tasks.filter((task) => isThisMonth(task.completedAt)).length,
  };
}

export function getMarketTasks() {
  return state.database.tasks
    .filter((task) => task.publicToMarket)
    .sort((left, right) => new Date(left.dueAt).getTime() - new Date(right.dueAt).getTime());
}

export function isUrgentMarketTask(task) {
  return task.type === "emergency" || task.priority === "urgent";
}

export function getFilteredMarketTasks() {
  return getMarketTasks().filter((task) => {
    const query = `${task.title} ${task.description} ${task.acceptanceCriteria || ""} ${task.recommendedFor} ${(task.tags || []).join(" ")}`.toLowerCase();
    const filterQuery = `${state.marketFilters.query} ${state.globalSearch}`.trim().toLowerCase();
    const audienceQuery = state.marketFilters.audience.trim().toLowerCase();
    if (filterQuery && !query.includes(filterQuery)) {
      return false;
    }
    if (state.marketFilters.type !== "all" && !((state.marketFilters.type === "emergency" && isUrgentMarketTask(task)) || task.type === state.marketFilters.type)) {
      return false;
    }
    if (state.marketFilters.department !== "all" && !toArray(task.departments || task.department).includes(state.marketFilters.department)) return false;
    if (state.marketFilters.direction !== "all" && !toArray(task.directions || task.direction).includes(state.marketFilters.direction)) return false;
    if (state.marketFilters.robotGroup !== "all" && !toArray(task.robotGroups || task.robotGroup).includes(state.marketFilters.robotGroup)) return false;
    if (state.marketFilters.difficulty !== "all" && task.difficulty !== state.marketFilters.difficulty) return false;
    if (state.marketFilters.status === "market_open" && task.status === "completed") return false;
    if (state.marketFilters.status !== "all" && state.marketFilters.status !== "market_open" && task.status !== state.marketFilters.status) return false;
    if (audienceQuery && !task.recommendedFor.toLowerCase().includes(audienceQuery)) return false;
    return true;
  });
}

export function getCurrentUserTaskRecords() {
  const member = getCurrentMember();
  const participantRecords = state.database.taskParticipants.filter((item) => item.memberId === member.id);
  const tasksById = Object.fromEntries(state.database.tasks.map((task) => [task.id, task]));
  const approvals = state.database.approvals.filter((approval) => approval.submitterId === member.id && approval.type === "join" && approval.status === "pending");
  const owned = state.database.tasks.filter((task) => task.ownerId === member.id && task.status !== "completed").map((task) => ({ task }));
  const active = participantRecords.filter((item) => item.status === "involved" && tasksById[item.taskId] && tasksById[item.taskId].status !== "completed").map((participant) => ({ task: tasksById[participant.taskId], participant }));
  const needsSubmit = active.filter(({ task }) => task.progressPercent >= 70 || task.status === "pending_review");
  const completed = participantRecords.filter((item) => tasksById[item.taskId]?.status === "completed").map((participant) => ({ task: tasksById[participant.taskId], participant }));
  const exited = participantRecords.filter((item) => item.status === "exited").map((participant) => ({ task: tasksById[participant.taskId], participant }));
  const overdue = active.filter(({ task }) => task.status === "overdue");
  return { owned, active, pendingJoin: approvals, needsSubmit, completed, exited, overdue };
}

export function getVisibleTaskManagementTasks() {
  const member = getCurrentMember();
  if (member.role === "admin") return [...state.database.tasks];
  if (member.role === "leader") return state.database.tasks.filter((task) => toArray(task.departments || task.department).some((d) => member.departments.includes(d)) || toArray(task.directions || task.direction).some((d) => member.directions.includes(d)));
  return state.database.tasks.filter((task) => task.creatorId === member.id || task.ownerId === member.id);
}

export function getFilteredMembers() {
  return state.database.members.filter((member) => {
    if (!isMemberIncludedInWorkspaceStats(member)) {
      return false;
    }
    const query = `${member.name} ${member.bio} ${member.departments.join(" ")} ${member.skillTags.join(" ")}`.toLowerCase();
    const mergedQuery = `${state.memberFilters.query} ${state.globalSearch}`.trim().toLowerCase();
    if (mergedQuery && !query.includes(mergedQuery)) return false;
    if (state.memberFilters.role !== "all" && member.role !== state.memberFilters.role) return false;
    if (state.memberFilters.department !== "all" && !member.departments.includes(state.memberFilters.department)) return false;
    if (state.memberFilters.robotGroup !== "all" && !member.robotGroups.includes(state.memberFilters.robotGroup)) return false;
    return true;
  });
}

export function getMemberLoads() {
  return state.database.members
    .filter((member) => isMemberIncludedInWorkspaceStats(member))
    .map((member) => {
      const activeTasks = getTaskParticipantRecordsByMember(member.id).filter(
        (participant) => participant.status === "involved" && ["todo", "in_progress", "pending_review", "overdue"].includes(getTaskById(participant.taskId)?.status)
      );
      const pendingReview = activeTasks.filter((participant) => getTaskById(participant.taskId)?.status === "pending_review").length;
      const overdue = activeTasks.filter((participant) => getTaskById(participant.taskId)?.status === "overdue").length;
      const dueSoon = activeTasks.filter((participant) => daysUntil(getTaskById(participant.taskId)?.dueAt) <= 3).length;
      const loadLevel = getLoadLevel(activeTasks.length, dueSoon, overdue);
      return { member, activeCount: activeTasks.length, pendingReview, dueSoon, overdue, loadLevel };
    })
    .sort((left, right) => loadLevelOrder(right.loadLevel) - loadLevelOrder(left.loadLevel) || right.activeCount - left.activeCount);
}

export function getDepartmentContribution() {
  const totals = new Map();
  state.database.members.filter((member) => isMemberIncludedInRankings(member)).forEach((member) => {
    const summary = getMemberPointSummary(member.id);
    const department = member.departments[0] || "未分组";
    totals.set(department, (totals.get(department) || 0) + summary.composite);
  });
  return [...totals.entries()].map(([label, value]) => ({ label, value: roundPointFromSettings(value) })).sort((left, right) => right.value - left.value);
}

export function getRobotContribution() {
  const totals = new Map();
  state.database.tasks.forEach((task) => {
    const groups = toArray(task.robotGroups || task.robotGroup);
    const keys = groups.length ? groups : ["通用"];
    const sum = task.studyPoints + task.laborPoints + task.managementPoints;
    keys.forEach((key) => {
      totals.set(key, (totals.get(key) || 0) + sum);
    });
  });
  return [...totals.entries()].map(([label, value]) => ({ label, value: roundPointFromSettings(value) })).sort((left, right) => right.value - left.value);
}

export function getLeaderboard(type, range) {
  return state.database.members
    .filter((member) => isMemberIncludedInRankings(member))
    .map((member) => {
      const summary = getMemberPointSummary(member.id, range === "month");
      return { member, values: summary, score: type === "study" ? summary.study : type === "labor" ? summary.labor : type === "management" ? summary.management : summary.composite };
    })
    .sort((left, right) => right.score - left.score);
}

export function getApprovalGroups() {
  const currentMember = getCurrentMember();
  if (!currentMember || !canReview()) {
    return { registration: [], join: [], completion: [], settlement: [], compensation: [], promotion: [], status_change: [] };
  }
  const relevant = state.database.approvals.filter((approval) => {
    if (isAdmin()) return true;
    if (currentMember.role === "leader") {
      if (approval.type === "join" || approval.type === "completion") {
        const task = getTaskById(approval.targetId);
        return task && (toArray(task.departments || task.department).some((d) => currentMember.departments.includes(d)) || toArray(task.directions || task.direction).some((d) => currentMember.directions.includes(d)));
      }
      return approval.type === "promotion" || approval.type === "status_change";
    }
    return false;
  });
  return {
    registration: relevant.filter((item) => item.type === "registration"),
    join: relevant.filter((item) => item.type === "join"),
    completion: relevant.filter((item) => item.type === "completion"),
    settlement: relevant.filter((item) => item.type === "settlement"),
    compensation: relevant.filter((item) => item.type === "compensation"),
    promotion: relevant.filter((item) => item.type === "promotion"),
    status_change: relevant.filter((item) => item.type === "status_change"),
  };
}

export function getMemberPointSummary(memberId, monthOnly = false) {
  const summary = { study: 0, labor: 0, management: 0, compensation: 0, composite: 0 };
  state.database.pointTransactions.forEach((transaction) => {
    if (transaction.memberId !== memberId) return;
    if (monthOnly && !isThisMonth(transaction.createdAt)) return;
    if (transaction.type === "study") summary.study += transaction.amount;
    if (transaction.type === "labor") summary.labor += transaction.amount;
    if (transaction.type === "management") summary.management += transaction.amount;
    if (transaction.type === "compensation") summary.compensation += transaction.amount;
  });
  summary.study = roundPointFromSettings(summary.study);
  summary.labor = roundPointFromSettings(summary.labor);
  summary.management = roundPointFromSettings(summary.management);
  summary.compensation = roundPointFromSettings(summary.compensation);
  summary.composite = roundPointFromSettings(summary.study + summary.labor + summary.management + summary.compensation);
  return summary;
}

export function getMemberTimeline(memberId) {
  const items = [];
  const member = getMemberById(memberId);
  if (!member) return [];
  items.push({ title: "加入战队", description: `${formatShortDate(member.joinDate)} 加入系统，初始身份为 ${dictionaries.identities[member.identity]}` });
  state.database.approvals.filter((approval) => approval.type === "promotion" && approval.targetId === memberId).forEach((approval) => {
    items.push({ title: "晋升记录", description: approval.comment });
  });
  state.database.pointTransactions.filter((transaction) => transaction.memberId === memberId && transaction.type === "compensation").forEach((transaction) => {
    items.push({ title: "补偿点数", description: `${formatShortDate(transaction.createdAt)} · ${transaction.reason} · +${transaction.amount}` });
  });
  getTaskParticipantRecordsByMember(memberId).filter((participant) => participant.status === "exited").forEach((participant) => {
    const task = getTaskById(participant.taskId);
    if (task) items.push({ title: "退出任务", description: `${formatShortDate(participant.exitedAt)} 退出《${task.title}》` });
  });
  getTaskParticipantRecordsByMember(memberId).filter((participant) => getTaskById(participant.taskId)?.status === "overdue").forEach((participant) => {
    const task = getTaskById(participant.taskId);
    if (task) items.push({ title: "逾期任务", description: `《${task.title}》 已逾期，截止日期为 ${formatShortDate(task.dueAt)}` });
  });
  return items.slice(0, 8);
}

export function getPendingPromotionApproval(memberId) {
  return state.database.approvals.find((approval) => approval.type === "promotion" && approval.targetId === memberId && approval.status === "pending") || null;
}

export function getMemberPointTransactions(memberId) {
  return state.database.pointTransactions.filter((transaction) => transaction.memberId === memberId).sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()).slice(0, 10);
}

export function getJoinActionLabel(task) {
  const currentMember = getCurrentMember();
  if (!currentMember || currentMember.role === "teacher") return "";
  if (task.status === "completed" || task.status === "pending_review") return "";
  const participant = getTaskParticipantRecords(task.id).find((item) => item.memberId === currentMember.id && item.status !== "exited");
  if (participant) return "";
  const pendingApproval = state.database.approvals.find((approval) => approval.type === "join" && approval.targetId === task.id && approval.submitterId === currentMember.id && approval.status === "pending");
  if (pendingApproval) return "审批中";
  return task.approvalRequired || (state.database.settings.hardTaskNeedsApproval && ["hard", "core"].includes(task.difficulty)) ? "申请加入" : "直接领取";
}
