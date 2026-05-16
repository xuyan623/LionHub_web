import {
  canReview,
  getCurrentMember,
  getMemberById,
  getTaskById,
  getTaskParticipantRecords,
  getTaskParticipantRecordsByMember,
  isAdmin,
  isMemberIncludedInRankings,
  isMemberIncludedInWorkspaceStats,
  roundPointFromSettings,
  toArray
} from "./chunk-IKVMAO7C.js";
import {
  dictionaries,
  routes,
  state
} from "./chunk-NDL62ULM.js";

// client/domain/query.js
function getLoadLevel(activeCount, dueSoon, overdue) {
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
function loadLevelOrder(level) {
  return { idle: 1, normal: 2, busy: 3, overload: 4 }[level] || 0;
}
function getSearchPlaceholder() {
  const current = routes.find((route) => route.id === state.route);
  return current ? `\u641C\u7D22${current.label}\u4E2D\u7684\u4EFB\u52A1\u3001\u6210\u5458\u6216\u6807\u7B7E` : "\u641C\u7D22";
}
function getAttachmentsIndex() {
  const index = {};
  (state.database.tasks || []).forEach((task) => {
    (task.attachments || []).forEach((attachment) => {
      if (attachment.storagePath) {
        index[attachment.storagePath] = { type: "task", id: task.id, title: task.title || "\u672A\u77E5\u4EFB\u52A1", name: attachment.name, uploadedByName: attachment.uploadedByName, uploadedAt: attachment.uploadedAt, source: attachment.source };
      }
    });
  });
  (state.database.approvals || []).forEach((approval) => {
    (approval.attachments || []).forEach((attachment) => {
      if (attachment.storagePath) {
        index[attachment.storagePath] = { type: "approval", id: approval.id, title: dictionaries.approvalTypes[approval.type] || "\u5BA1\u6279\u8BB0\u5F55", name: attachment.name, uploadedByName: attachment.uploadedByName, uploadedAt: attachment.uploadedAt, source: attachment.source };
      }
    });
  });
  return index;
}
function getLifecycleActionDefinition(actionKey, memberId) {
  const member = getMemberById(memberId);
  if (!actionKey || !member) {
    return null;
  }
  const definitions = {
    "retire-self": {
      title: "\u786E\u8BA4\u9000\u4F11",
      description: "\u9000\u4F11\u540E\u4ECD\u53EF\u767B\u5F55\u67E5\u770B\u5386\u53F2\u8BB0\u5F55\u548C\u4E2A\u4EBA\u8D44\u6599\uFF0C\u4F46\u4E0D\u518D\u53C2\u4E0E\u4EFB\u52A1\u3001\u4E0D\u518D\u5F97\u5206\uFF0C\u4E5F\u4E0D\u4F1A\u8FDB\u5165\u6392\u884C\u699C\u3002",
      submitLabel: "\u786E\u8BA4\u9000\u4F11",
      successMessage: "\u5DF2\u9000\u4F11\uFF0C\u5F53\u524D\u8D26\u53F7\u5DF2\u5207\u6362\u4E3A\u53EA\u8BFB\u72B6\u6001\u3002",
      targetStatus: "retired",
      targetUserStatus: "active"
    },
    "force-retire-member": {
      title: "\u786E\u8BA4\u5F3A\u5236\u9000\u4F11",
      description: "\u8BE5\u6210\u5458\u9000\u4F11\u540E\u4ECD\u4F1A\u4FDD\u7559\u5386\u53F2\u8BB0\u5F55\uFF0C\u4F46\u4E0D\u518D\u53C2\u4E0E\u4EFB\u52A1\u3001\u4E0D\u518D\u5F97\u5206\uFF0C\u4E5F\u4E0D\u4F1A\u8FDB\u5165\u6392\u884C\u699C\u3002",
      submitLabel: "\u6267\u884C\u5F3A\u5236\u9000\u4F11",
      successMessage: `\u5DF2\u5C06 ${member.name} \u6807\u8BB0\u4E3A\u9000\u4F11\u3002`,
      targetStatus: "retired",
      targetUserStatus: "active"
    },
    "disable-member": {
      title: "\u786E\u8BA4\u505C\u7528\u8D26\u53F7",
      description: "\u505C\u7528\u540E\uFF0C\u6210\u5458\u5C06\u65E0\u6CD5\u6B63\u5E38\u8FDB\u5165\u5DE5\u4F5C\u53F0\uFF1B\u8D26\u53F7\u548C\u5386\u53F2\u8BB0\u5F55\u4F1A\u88AB\u4FDD\u7559\uFF0C\u53EA\u80FD\u7531\u7BA1\u7406\u5458\u6062\u590D\u65E7\u8D26\u53F7\u3002",
      submitLabel: "\u786E\u8BA4\u505C\u7528",
      successMessage: `\u5DF2\u505C\u7528 ${member.name} \u7684\u8D26\u53F7\u3002`,
      targetStatus: "disabled",
      targetUserStatus: "disabled"
    },
    "restore-member": {
      title: "\u786E\u8BA4\u6062\u590D\u8D26\u53F7",
      description: "\u6062\u590D\u540E\uFF0C\u6210\u5458\u4F1A\u91CD\u65B0\u83B7\u5F97\u767B\u5F55\u80FD\u529B\uFF0C\u5E76\u6062\u590D\u4E3A\u6B63\u5E38\u72B6\u6001\u3002",
      submitLabel: "\u786E\u8BA4\u6062\u590D",
      successMessage: `\u5DF2\u6062\u590D ${member.name} \u7684\u8D26\u53F7\u3002`,
      targetStatus: "normal",
      targetUserStatus: "active"
    }
  };
  const definition = definitions[actionKey];
  if (!definition) {
    return null;
  }
  return { ...definition, actionKey, member };
}
function daysUntil(dateString) {
  if (!dateString) return 99;
  return Math.ceil((new Date(dateString).getTime() - Date.now()) / 864e5);
}
function isThisMonth(dateString) {
  if (!dateString) {
    return false;
  }
  const date = new Date(dateString);
  const now = /* @__PURE__ */ new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}
function formatShortDate(dateString) {
  if (!dateString) {
    return "";
  }
  const date = new Date(dateString);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}
function getDashboardStats() {
  const members = state.database.members.filter((member) => isMemberIncludedInWorkspaceStats(member));
  const tasks = state.database.tasks;
  return {
    memberCount: members.length,
    inProgressCount: tasks.filter((task) => task.status === "in_progress").length,
    pendingReviewCount: tasks.filter((task) => task.status === "pending_review").length,
    overdueCount: tasks.filter((task) => task.status === "overdue").length,
    completedThisMonth: tasks.filter((task) => isThisMonth(task.completedAt)).length
  };
}
function getMarketTasks() {
  return state.database.tasks.filter((task) => task.publicToMarket).sort((left, right) => new Date(left.dueAt).getTime() - new Date(right.dueAt).getTime());
}
function isUrgentMarketTask(task) {
  return task.type === "emergency" || task.priority === "urgent";
}
function getFilteredMarketTasks() {
  return getMarketTasks().filter((task) => {
    const query = `${task.title} ${task.description} ${task.acceptanceCriteria || ""} ${task.recommendedFor} ${(task.tags || []).join(" ")}`.toLowerCase();
    const filterQuery = `${state.marketFilters.query} ${state.globalSearch}`.trim().toLowerCase();
    const audienceQuery = state.marketFilters.audience.trim().toLowerCase();
    if (filterQuery && !query.includes(filterQuery)) {
      return false;
    }
    if (state.marketFilters.type !== "all" && !(state.marketFilters.type === "emergency" && isUrgentMarketTask(task) || task.type === state.marketFilters.type)) {
      return false;
    }
    if (state.marketFilters.department !== "all" && !toArray(task.departments || task.department).includes(state.marketFilters.department)) return false;
    if (state.marketFilters.direction !== "all" && !toArray(task.directions || task.direction).includes(state.marketFilters.direction)) return false;
    if (state.marketFilters.robotGroup !== "all" && !toArray(task.robotGroups || task.robotGroup).includes(state.marketFilters.robotGroup)) return false;
    if (state.marketFilters.difficulty !== "all" && task.difficulty !== state.marketFilters.difficulty) return false;
    if (state.marketFilters.status !== "all" && task.status !== state.marketFilters.status) return false;
    if (audienceQuery && !task.recommendedFor.toLowerCase().includes(audienceQuery)) return false;
    return true;
  });
}
function getCurrentUserTaskRecords() {
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
function getVisibleTaskManagementTasks() {
  const member = getCurrentMember();
  if (member.role === "admin") return [...state.database.tasks];
  if (member.role === "leader") return state.database.tasks.filter((task) => toArray(task.departments || task.department).some((d) => member.departments.includes(d)) || toArray(task.directions || task.direction).some((d) => member.directions.includes(d)));
  return state.database.tasks.filter((task) => task.creatorId === member.id || task.ownerId === member.id);
}
function getFilteredMembers() {
  return state.database.members.filter((member) => {
    const query = `${member.name} ${member.bio} ${member.departments.join(" ")} ${member.skillTags.join(" ")}`.toLowerCase();
    const mergedQuery = `${state.memberFilters.query} ${state.globalSearch}`.trim().toLowerCase();
    if (mergedQuery && !query.includes(mergedQuery)) return false;
    if (state.memberFilters.role !== "all" && member.role !== state.memberFilters.role) return false;
    if (state.memberFilters.department !== "all" && !member.departments.includes(state.memberFilters.department)) return false;
    if (state.memberFilters.robotGroup !== "all" && !member.robotGroups.includes(state.memberFilters.robotGroup)) return false;
    if (state.memberFilters.status !== "all" && member.memberStatus !== state.memberFilters.status) return false;
    return true;
  });
}
function getMemberLoads() {
  return state.database.members.filter((member) => isMemberIncludedInWorkspaceStats(member)).map((member) => {
    const activeTasks = getTaskParticipantRecordsByMember(member.id).filter(
      (participant) => participant.status === "involved" && ["todo", "in_progress", "pending_review", "overdue"].includes(getTaskById(participant.taskId)?.status)
    );
    const pendingReview = activeTasks.filter((participant) => getTaskById(participant.taskId)?.status === "pending_review").length;
    const overdue = activeTasks.filter((participant) => getTaskById(participant.taskId)?.status === "overdue").length;
    const dueSoon = activeTasks.filter((participant) => daysUntil(getTaskById(participant.taskId)?.dueAt) <= 3).length;
    const loadLevel = getLoadLevel(activeTasks.length, dueSoon, overdue);
    return { member, activeCount: activeTasks.length, pendingReview, dueSoon, overdue, loadLevel };
  }).sort((left, right) => loadLevelOrder(right.loadLevel) - loadLevelOrder(left.loadLevel) || right.activeCount - left.activeCount);
}
function getDepartmentContribution() {
  const totals = /* @__PURE__ */ new Map();
  state.database.members.filter((member) => isMemberIncludedInRankings(member)).forEach((member) => {
    const summary = getMemberPointSummary(member.id);
    const department = member.departments[0] || "\u672A\u5206\u7EC4";
    totals.set(department, (totals.get(department) || 0) + summary.composite);
  });
  return [...totals.entries()].map(([label, value]) => ({ label, value: roundPointFromSettings(value) })).sort((left, right) => right.value - left.value);
}
function getRobotContribution() {
  const totals = /* @__PURE__ */ new Map();
  state.database.tasks.forEach((task) => {
    const groups = toArray(task.robotGroups || task.robotGroup);
    const keys = groups.length ? groups : ["\u901A\u7528"];
    const sum = task.studyPoints + task.laborPoints + task.managementPoints;
    keys.forEach((key) => {
      totals.set(key, (totals.get(key) || 0) + sum);
    });
  });
  return [...totals.entries()].map(([label, value]) => ({ label, value: roundPointFromSettings(value) })).sort((left, right) => right.value - left.value);
}
function getLeaderboard(type, range) {
  return state.database.members.filter((member) => isMemberIncludedInRankings(member)).map((member) => {
    const summary = getMemberPointSummary(member.id, range === "month");
    return { member, values: summary, score: type === "study" ? summary.study : type === "labor" ? summary.labor : type === "management" ? summary.management : summary.composite };
  }).sort((left, right) => right.score - left.score);
}
function getApprovalGroups() {
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
    status_change: relevant.filter((item) => item.type === "status_change")
  };
}
function getMemberPointSummary(memberId, monthOnly = false) {
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
function getMemberTimeline(memberId) {
  const items = [];
  const member = getMemberById(memberId);
  if (!member) return [];
  items.push({ title: "\u52A0\u5165\u6218\u961F", description: `${formatShortDate(member.joinDate)} \u52A0\u5165\u7CFB\u7EDF\uFF0C\u521D\u59CB\u8EAB\u4EFD\u4E3A ${dictionaries.identities[member.identity]}` });
  state.database.approvals.filter((approval) => approval.type === "promotion" && approval.targetId === memberId).forEach((approval) => {
    items.push({ title: "\u664B\u5347\u8BB0\u5F55", description: approval.comment });
  });
  state.database.pointTransactions.filter((transaction) => transaction.memberId === memberId && transaction.type === "compensation").forEach((transaction) => {
    items.push({ title: "\u8865\u507F\u70B9\u6570", description: `${formatShortDate(transaction.createdAt)} \xB7 ${transaction.reason} \xB7 +${transaction.amount}` });
  });
  getTaskParticipantRecordsByMember(memberId).filter((participant) => participant.status === "exited").forEach((participant) => {
    const task = getTaskById(participant.taskId);
    if (task) items.push({ title: "\u9000\u51FA\u4EFB\u52A1", description: `${formatShortDate(participant.exitedAt)} \u9000\u51FA\u300A${task.title}\u300B` });
  });
  getTaskParticipantRecordsByMember(memberId).filter((participant) => getTaskById(participant.taskId)?.status === "overdue").forEach((participant) => {
    const task = getTaskById(participant.taskId);
    if (task) items.push({ title: "\u903E\u671F\u4EFB\u52A1", description: `\u300A${task.title}\u300B \u5DF2\u903E\u671F\uFF0C\u622A\u6B62\u65E5\u671F\u4E3A ${formatShortDate(task.dueAt)}` });
  });
  return items.slice(0, 8);
}
function getPendingPromotionApproval(memberId) {
  return state.database.approvals.find((approval) => approval.type === "promotion" && approval.targetId === memberId && approval.status === "pending") || null;
}
function getMemberPointTransactions(memberId) {
  return state.database.pointTransactions.filter((transaction) => transaction.memberId === memberId).sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()).slice(0, 10);
}
function getJoinActionLabel(task) {
  const currentMember = getCurrentMember();
  if (!currentMember || currentMember.role === "teacher") return "";
  const participant = getTaskParticipantRecords(task.id).find((item) => item.memberId === currentMember.id && item.status !== "exited");
  if (participant) return "";
  const pendingApproval = state.database.approvals.find((approval) => approval.type === "join" && approval.targetId === task.id && approval.submitterId === currentMember.id && approval.status === "pending");
  if (pendingApproval) return "\u5BA1\u6279\u4E2D";
  return task.approvalRequired || state.database.settings.hardTaskNeedsApproval && ["hard", "core"].includes(task.difficulty) ? "\u7533\u8BF7\u52A0\u5165" : "\u76F4\u63A5\u9886\u53D6";
}

export {
  getLoadLevel,
  loadLevelOrder,
  getSearchPlaceholder,
  getAttachmentsIndex,
  getLifecycleActionDefinition,
  getDashboardStats,
  getMarketTasks,
  isUrgentMarketTask,
  getFilteredMarketTasks,
  getCurrentUserTaskRecords,
  getVisibleTaskManagementTasks,
  getFilteredMembers,
  getMemberLoads,
  getDepartmentContribution,
  getRobotContribution,
  getLeaderboard,
  getApprovalGroups,
  getMemberPointSummary,
  getMemberTimeline,
  getPendingPromotionApproval,
  getMemberPointTransactions,
  getJoinActionLabel
};
