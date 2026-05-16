import {
  createNotification,
  getParticipantUserIds,
  getRecipientUserIdsFromMentionText,
  getReviewerUserIds,
  removeNotificationsBySource,
  removeNotificationsByTask
} from "./chunk-VXIKIDMW.js";
import {
  getApprovalGroups,
  getCurrentUserTaskRecords,
  getDashboardStats,
  getDepartmentContribution,
  getFilteredMarketTasks,
  getFilteredMembers,
  getJoinActionLabel,
  getLeaderboard,
  getMarketTasks,
  getMemberLoads,
  getMemberPointSummary,
  getMemberTimeline,
  getRobotContribution,
  getVisibleTaskManagementTasks,
  isUrgentMarketTask
} from "./chunk-UKTXZA3P.js";
import {
  canCreateTask,
  canDeleteAllGeneratedData,
  canDeleteApprovalRecord,
  canDeletePointTransaction,
  canDeleteTask,
  canDeleteTaskGeneratedData,
  canEditTask,
  canInteractWithTasks,
  canMemberAccruePoints,
  canMemberBeAddedToTask,
  canReview,
  clamp,
  createComment,
  getActiveParticipantCount,
  getCurrentMember,
  getInitials,
  getMemberById,
  getTaskById,
  getTaskParticipantRecords,
  getTaskParticipantRecordsByMember,
  isAdmin,
  isDisabledMember,
  isMemberIncludedInWorkspaceStats,
  isRetiredMember,
  joinOr,
  parseList,
  roundPointFromSettings,
  toArray,
  truncate
} from "./chunk-SXRKLTAB.js";
import {
  escapeAttribute,
  escapeHtml,
  uid
} from "./chunk-UQLSNBUY.js";
import {
  clearSession,
  deleteLocalAttachments,
  fetchDatabaseSnapshot,
  loadApiKey,
  loadSession,
  requestJson,
  saveSession,
  uploadLocalAttachments,
  writeDatabaseSnapshot
} from "./chunk-54LJH7SJ.js";
import {
  LEGACY_STORAGE_KEY,
  SHARED_SYNC_INTERVAL_MS,
  appRoot,
  dictionaries,
  options,
  routes,
  setSharedSyncTimer,
  state
} from "./chunk-5IOWRUG7.js";

// client/core/data-access.js
var VALID_COLLECTIONS = /* @__PURE__ */ new Set([
  "users",
  "members",
  "tasks",
  "taskParticipants",
  "approvals",
  "pointTransactions",
  "notifications",
  "robotProjects"
]);
function guardCollection(key) {
  if (!VALID_COLLECTIONS.has(key)) {
    throw new TypeError(`Invalid collection "${key}".`);
  }
  if (!state.database) {
    throw new Error("Database is not initialized.");
  }
  if (!Array.isArray(state.database[key])) {
    state.database[key] = [];
  }
  return state.database[key];
}
function addRecord(collection, record) {
  const list = guardCollection(collection);
  list.unshift(record);
  return record;
}
function removeRecord(collection, id) {
  const list = guardCollection(collection);
  const idx = list.findIndex((item) => item.id === id);
  if (idx === -1) return false;
  list.splice(idx, 1);
  return true;
}
function removeWhere(collection, predicate) {
  const list = guardCollection(collection);
  const removed = [];
  for (let i = list.length - 1; i >= 0; i--) {
    if (predicate(list[i])) {
      removed.push(list[i]);
      list.splice(i, 1);
    }
  }
  return removed;
}

// client/core/services.js
var _pushFlash = () => {
};
var _renderApp = () => {
};
function pushFlash(message, tone = "info") {
  _pushFlash(message, tone);
}
function renderApp() {
  _renderApp();
}
function setServices(services) {
  if (services.pushFlash) _pushFlash = services.pushFlash;
  if (services.renderApp) _renderApp = services.renderApp;
}

// client/core/format.js
function addDays(days) {
  const next = /* @__PURE__ */ new Date();
  next.setDate(next.getDate() + days);
  return next.toISOString();
}
function toDateTimeLocalValue(value) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 6e4);
  return local.toISOString().slice(0, 16);
}
function formatDateTime(value) {
  if (!value) {
    return "-";
  }
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}
function formatShortDate(value) {
  if (!value) {
    return "-";
  }
  return new Intl.DateTimeFormat("zh-CN", { month: "numeric", day: "numeric" }).format(new Date(value));
}

// client/render/components.js
function renderSelectOptions(values, selectedValue = "", labels = null) {
  return values.map((value) => {
    const selected = value === selectedValue ? "selected" : "";
    const label = labels ? labels[value] : value;
    return `<option value="${escapeAttribute(value)}" ${selected}>${escapeHtml(label)}</option>`;
  }).join("");
}
function renderMultiSelectOptions(values, selectedValues = [], labels = null) {
  const selected = new Set(Array.isArray(selectedValues) ? selectedValues : selectedValues ? [selectedValues] : []);
  return values.map((value) => {
    const isSelected = selected.has(value) ? "selected" : "";
    const label = labels ? labels[value] : value;
    return `<option value="${escapeAttribute(value)}" ${isSelected}>${escapeHtml(label)}</option>`;
  }).join("");
}
function renderEmpty(text) {
  return `<div class="empty-state">${escapeHtml(text)}</div>`;
}
function renderStatusBadge(status) {
  const normalized = status === "approved" ? "completed" : status === "returned" ? "pending_review" : status === "rejected" ? "overdue" : status;
  const label = dictionaries.taskStatuses[status] || dictionaries.approvalStatuses[status] || dictionaries.taskStatuses[normalized] || status;
  const cssClass = String(normalized).toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9_-]/g, "");
  return `<span class="status-badge status-${escapeAttribute(cssClass)}">${escapeHtml(label)}</span>`;
}
function renderPointPill(label, value) {
  return `<span class="point-pill">${escapeHtml(label)} ${escapeHtml(String(value))}</span>`;
}
function renderMetricCard(label, value, detail) {
  return `
    <div class="metric-card">
      <small>${escapeHtml(label)}</small>
      <strong>${escapeHtml(String(value))}</strong>
      <span>${escapeHtml(detail)}</span>
    </div>
  `;
}
function renderChartRow(label, value, max) {
  const percentage = Math.round(value / max * 100);
  return `
    <div class="chart-row">
      <span>${escapeHtml(label)}</span>
      <div class="chart-rail"><span style="width:${percentage}%"></span></div>
      <strong>${value}</strong>
    </div>
  `;
}
function renderSubProgress(label, value) {
  return `
    <div class="point-row">
      <header><span>${escapeHtml(label)}</span><strong>${value}%</strong></header>
      <div class="progress-bar"><span style="width:${value}%"></span></div>
    </div>
  `;
}
function renderTimelineCard(title, description) {
  return `
    <div class="timeline-card">
      <strong>${escapeHtml(title)}</strong>
      <p>${escapeHtml(description)}</p>
    </div>
  `;
}
function renderTaskCard(task, config = {}) {
  const actionLabel = config.showAction ? getJoinActionLabel(task) : "";
  const className = ["task-card", config.highlightSelected ? "is-selected" : "", config.waterfall ? "is-waterfall" : ""].filter(Boolean).join(" ");
  return `
    <div class="${className}">
      <div class="task-top">
        <div>
          <div class="task-meta">${renderStatusBadge(task.status)}<span>${escapeHtml(dictionaries.taskTypes[task.type])}</span></div>
          <h4>${escapeHtml(task.title)}</h4>
        </div>
        <button class="button-ghost" type="button" data-action="open-task" data-task-id="${task.id}">\u8BE6\u60C5</button>
      </div>
      <div class="task-meta">
        <span>${escapeHtml(joinOr(task.departments || task.department, "\u672A\u6307\u5B9A"))}</span><span>${escapeHtml(joinOr(task.directions || task.direction, "\u672A\u6307\u5B9A\u65B9\u5411"))}</span><span>${escapeHtml(joinOr(task.robotGroups || task.robotGroup, "\u901A\u7528"))}</span><span>${escapeHtml(dictionaries.difficulties[task.difficulty])}</span>
      </div>
      ${config.compact ? "" : `<p class="text-block">${escapeHtml(truncate(task.description, 92))}</p>`}
      <div class="task-points">
        ${renderPointPill("\u7814\u4E60\u70B9", task.studyPoints)}
        ${renderPointPill("\u5DE5\u65F6\u70B9", task.laborPoints)}
        ${renderPointPill("\u7BA1\u7406\u70B9", task.managementPoints)}
      </div>
      <div class="task-meta">
        <span>\u63A8\u8350 ${escapeHtml(task.recommendedFor)}</span>
        <span>${formatShortDate(task.dueAt)}</span>
        <span>${getActiveParticipantCount(task.id)} / ${task.maxParticipants}</span>
      </div>
      ${actionLabel ? `<div class="button-row"><button class="button-secondary" type="button" data-action="claim-task" data-task-id="${task.id}">${actionLabel}</button></div>` : ""}
    </div>
  `;
}
function renderMemberCard(member, config = {}) {
  const summary = getMemberPointSummary(member.id);
  const load = getMemberLoads().find((entry) => entry.member.id === member.id);
  const className = ["member-card", config.selected ? "is-selected" : "", config.waterfall ? "is-waterfall" : ""].filter(Boolean).join(" ");
  return `
    <button class="${className}" type="button" data-action="open-member" data-member-id="${member.id}">
      <div class="member-top">
        <div>
          <h4>${escapeHtml(member.name)}</h4>
          <div class="member-meta"><span>${escapeHtml(dictionaries.roles[member.role])}</span><span>${escapeHtml(member.departments.join(" / "))}</span></div>
        </div>
        <div class="avatar">${escapeHtml(getInitials(member.name))}</div>
      </div>
      <div class="tag-row">${member.skillTags.slice(0, 4).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>
      <div class="task-points">
        ${renderPointPill("\u7EFC\u5408\u8D21\u732E", summary.composite)}
        ${renderPointPill("\u5F53\u524D\u4EFB\u52A1", getTaskParticipantRecordsByMember(member.id).filter((participant) => participant.status === "involved").length)}
      </div>
      <div class="member-meta">
        <span>${escapeHtml(member.robotGroups.join(" / ") || "\u901A\u7528\u652F\u6301")}</span>
        <span>${escapeHtml(load ? dictionaries.loadLevels[load.loadLevel] : "\u672A\u8BC4\u4F30")}</span>
      </div>
    </button>
  `;
}
function renderProjectCard(project, expanded = false) {
  const relatedTasks = state.database.tasks.filter((task) => toArray(task.robotGroups || task.robotGroup).includes(project.name)).slice(0, expanded ? 4 : 2);
  return `
    <div class="project-card">
      <div class="project-top">
        <div>
          <h4>${escapeHtml(project.name)}</h4>
          <div class="task-meta">
            <span>\u8D1F\u8D23\u4EBA ${escapeHtml(getMemberById(project.ownerId)?.name || "\u672A\u8BBE\u7F6E")}</span>
            <span>\u963B\u585E\u9879 ${escapeHtml(project.blockerCount.toString())}</span>
          </div>
        </div>
        <span class="mini-pill">${project.progress}%</span>
      </div>
      <div class="progress-wrap"><div class="progress-bar"><span style="width:${project.progress}%"></span></div></div>
      <div class="stacked-points">
        ${renderSubProgress("\u673A\u68B0", project.mechanicalProgress)}
        ${renderSubProgress("\u7535\u63A7", project.controlProgress)}
        ${renderSubProgress("\u7B97\u6CD5", project.algorithmProgress)}
      </div>
      <div class="comment-card"><strong>\u5F53\u524D\u963B\u585E\u9879</strong><p>${escapeHtml(project.blocker)}</p></div>
      <div class="task-stack">${relatedTasks.map((task) => renderTaskCard(task, { compact: true })).join("")}</div>
    </div>
  `;
}
function renderApprovalCard(approval) {
  const target = resolveApprovalTarget(approval);
  const isPending = approval.status === "pending";
  const detailButton = renderApprovalDetailButton(approval);
  const helperText = resolveApprovalHelperText(approval);
  return `
    <div class="approval-card">
      <div class="section-header">
        <div>
          <h4>${escapeHtml(dictionaries.approvalTypes[approval.type])}</h4>
          <div class="review-meta">
            <span>${escapeHtml(target.title)}</span>
            <span>${escapeHtml(dictionaries.approvalStatuses[approval.status])}</span>
            <span>${formatDateTime(approval.createdAt)}</span>
          </div>
        </div>
        ${renderStatusBadge(approval.statusToTaskStatus || approval.status.replace("approved", "completed").replace("returned", "pending_review"))}
      </div>
      <p>${escapeHtml(target.subtitle)}</p>
      <div class="button-row">
        ${approval.type === "registration" && isPending && canReview() ? `<button class="button-primary" type="button" data-action="open-registration-review" data-approval-id="${approval.id}">\u5BA1\u6838</button>` : isPending && canReview() ? `<button class="button-primary" type="button" data-action="open-approval-action" data-approval-id="${approval.id}">\u5BA1\u6838</button>` : detailButton}
        ${approval.type === "completion" && isPending ? `<button class="button-secondary" type="button" data-action="return-completion" data-approval-id="${approval.id}">\u9A73\u56DE\u4FEE\u6539</button>` : ""}
        ${canDeleteApprovalRecord(approval) ? `<button class="button-danger" type="button" data-action="delete-approval" data-approval-id="${approval.id}">\u5220\u9664\u8BB0\u5F55</button>` : ""}
      </div>
      ${helperText ? `<div class="helper-text">${escapeHtml(helperText)}</div>` : ""}
    </div>
  `;
}
function renderApprovalDetailButton(approval) {
  if (approval.type === "registration") {
    if (approval.status === "pending" && canReview()) return `<button class="button-secondary" type="button" data-action="open-registration-review" data-approval-id="${approval.id}">\u8BE6\u60C5</button>`;
    return `<button class="button-secondary" type="button" data-action="open-member" data-member-id="${approval.targetId}">\u8BE6\u60C5</button>`;
  }
  if (["join", "completion", "settlement"].includes(approval.type)) {
    return `<button class="button-secondary" type="button" data-action="open-task" data-task-id="${approval.targetId}">\u8BE6\u60C5</button>`;
  }
  if (["compensation", "promotion", "status_change"].includes(approval.type)) {
    return `<button class="button-secondary" type="button" data-action="open-member" data-member-id="${approval.targetId}">\u8BE6\u60C5</button>`;
  }
  return "";
}
function resolveApprovalHelperText(approval) {
  if (approval.type === "completion") {
    const task = getTaskById(approval.targetId);
    return task ? getLatestSubmissionSummary(task) || approval.comment || "" : approval.comment || "";
  }
  return approval.comment || "";
}
function renderLoadRow(entry) {
  return `
    <div class="member-card">
      <div class="member-top">
        <div>
          <h4>${escapeHtml(entry.member.name)}</h4>
          <div class="member-meta">
            <span>${escapeHtml(entry.member.departments.join(" / "))}</span>
            <span>${escapeHtml(entry.member.robotGroups.join(" / ") || "\u901A\u7528\u652F\u6301")}</span>
          </div>
        </div>
        <span class="chip load-chip ${entry.loadLevel}">${escapeHtml(dictionaries.loadLevels[entry.loadLevel])}</span>
      </div>
      <div class="task-points">
        ${renderPointPill("\u8FDB\u884C\u4E2D", entry.activeCount)}
        ${renderPointPill("\u5F85\u5BA1\u6838", entry.pendingReview)}
        ${renderPointPill("\u4E34\u8FD1\u622A\u6B62", entry.dueSoon)}
        ${renderPointPill("\u903E\u671F", entry.overdue)}
      </div>
    </div>
  `;
}
function renderRankingCard(entry, rank, tab) {
  return `
    <div class="ranking-card">
      <div class="member-top">
        <div>
          <h4>#${rank} ${escapeHtml(entry.member.name)}</h4>
          <div class="member-meta">
            <span>${escapeHtml(entry.member.departments.join(" / "))}</span>
            <span>${escapeHtml(dictionaries.identities[entry.member.identity])}</span>
          </div>
        </div>
        <span class="rank-badge">${tab === "study" ? entry.values.study : tab === "labor" ? entry.values.labor : tab === "management" ? entry.values.management : entry.values.composite}</span>
      </div>
      <div class="task-points">
        ${renderPointPill("\u7814\u4E60\u70B9", entry.values.study)}
        ${renderPointPill("\u5DE5\u65F6\u70B9", entry.values.labor)}
        ${renderPointPill("\u7BA1\u7406\u70B9", entry.values.management)}
        ${renderPointPill("\u7EFC\u5408\u8D21\u732E", entry.values.composite)}
      </div>
    </div>
  `;
}
function renderRankingRow(entry, rank) {
  return `
    <div class="member-card">
      <div class="member-top">
        <div>
          <h4>#${rank} ${escapeHtml(entry.member.name)}</h4>
          <div class="member-meta">
            <span>${escapeHtml(entry.member.departments.join(" / "))}</span>
            <span>${escapeHtml(dictionaries.identities[entry.member.identity])}</span>
          </div>
        </div>
        <span class="rank-badge">${entry.values.composite}</span>
      </div>
    </div>
  `;
}
function renderParticipantRow(participant) {
  const member = getMemberById(participant.memberId);
  return `
    <div class="member-card">
      <div class="member-top">
        <div>
          <h4>${escapeHtml(member?.name || "\u672A\u77E5\u6210\u5458")}</h4>
          <div class="member-meta">
            <span>${escapeHtml(participant.role)}</span>
            <span>${escapeHtml(participant.joinType === "middle" ? "\u4E2D\u9014\u52A0\u5165" : "\u521D\u59CB\u53C2\u4E0E")}</span>
            <span>${escapeHtml(participant.status === "exited" ? "\u5DF2\u9000\u51FA" : "\u53C2\u4E0E\u4E2D")}</span>
          </div>
        </div>
        <span class="point-pill">\u6BD4\u4F8B ${participant.contributionRatio}</span>
      </div>
    </div>
  `;
}
function renderCommentCard(comment, taskId = "") {
  const renderedContent = escapeHtml(comment.content).replace(/@(\S+)/g, '<span style="color:var(--text);background:rgba(255,255,255,0.08);border-radius:4px;padding:0 4px">@$1</span>');
  return `
    <div class="comment-card">
      <strong>${escapeHtml(comment.title)} \xB7 ${escapeHtml(comment.authorName)}</strong>
      <p>${renderedContent}</p>
      <div class="helper-text">${formatDateTime(comment.createdAt)}</div>
      ${taskId && canDeleteTaskGeneratedData(getTaskById(taskId), comment.authorId) ? `<div class="button-row"><button class="button-danger" type="button" data-action="delete-comment" data-task-id="${taskId}" data-comment-id="${comment.id}">\u5220\u9664\u8BC4\u8BBA</button></div>` : ""}
    </div>
  `;
}
function renderProgressNodeCard(node, taskId = "") {
  const author = getMemberById(node.authorId);
  const canDelete = taskId && canDeleteTaskGeneratedData(getTaskById(taskId), node.authorId);
  return `
    <div class="comment-card">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px">
        <strong>\u8FDB\u5EA6\u8282\u70B9 \xB7 ${node.percent}% \xB7 ${escapeHtml(author?.name || "\u672A\u77E5\u6210\u5458")}</strong>
        ${canDelete ? `<button class="button-danger" type="button" data-action="delete-progress-node" data-task-id="${taskId}" data-node-id="${node.id}" style="padding:4px 10px;font-size:0.8rem">\u5220\u9664\u8BB0\u5F55</button>` : ""}
      </div>
      ${node.note ? `<p>${escapeHtml(node.note)}</p>` : ""}
      ${node.attachments?.length ? `<div class="comment-list">${node.attachments.map((attachment) => renderProgressNodeAttachmentCard(attachment, taskId, node.id, canDelete)).join("")}</div>` : ""}
      <div class="helper-text">${formatDateTime(node.createdAt)}</div>
    </div>
  `;
}
function renderProgressNodeAttachmentCard(attachment, taskId, nodeId, canDelete) {
  const attachmentName = attachment.name || "\u9644\u4EF6\u8D44\u6599";
  const attachmentUrl = attachment.url ? `${attachment.url}${attachment.url.includes("?") ? "&" : "?"}downloadName=${encodeURIComponent(attachmentName)}` : "#";
  return `
    <div class="comment-card" style="padding:8px 12px">
      <a class="attachment-link" href="${escapeAttribute(attachmentUrl)}" target="_blank" rel="noreferrer" download="${escapeAttribute(attachmentName)}"><strong>${escapeHtml(attachmentName)}</strong></a>
      ${canDelete ? `<div class="button-row"><button class="button-danger" type="button" data-action="delete-progress-node-attachment" data-task-id="${taskId}" data-node-id="${nodeId}" data-attachment-id="${attachment.id}" style="padding:4px 10px;font-size:0.8rem">\u5220\u9664\u9644\u4EF6</button></div>` : ""}
    </div>
  `;
}
function renderAttachmentCard(attachment, taskId = "") {
  const attachmentName = attachment.name || "\u9644\u4EF6\u8D44\u6599";
  const attachmentUrl = attachment.url ? `${attachment.url}${attachment.url.includes("?") ? "&" : "?"}downloadName=${encodeURIComponent(attachmentName)}` : "#";
  const sourceLabel = resolveAttachmentSourceLabel(attachment);
  return `
    <div class="comment-card">
      <a class="attachment-link" href="${escapeAttribute(attachmentUrl)}" target="_blank" rel="noreferrer" download="${escapeAttribute(attachmentName)}"><strong>${escapeHtml(attachmentName)}</strong></a>
      ${sourceLabel ? `<div class="helper-text">${escapeHtml(sourceLabel)}</div>` : ""}
      ${taskId && canDeleteTaskGeneratedData(getTaskById(taskId)) ? `<div class="button-row"><button class="button-danger" type="button" data-action="delete-attachment" data-task-id="${taskId}" data-attachment-id="${attachment.id}">\u5220\u9664\u9644\u4EF6</button></div>` : ""}
    </div>
  `;
}
function resolveAttachmentSourceLabel(attachment) {
  const uploader = attachment?.uploadedByName ? ` \xB7 ${attachment.uploadedByName}` : "";
  if (attachment?.source === "submission") return `\u6210\u679C\u63D0\u4EA4\u9644\u4EF6${uploader}`;
  if (attachment?.source === "progress") return `\u8FDB\u5EA6\u66F4\u65B0\u9644\u4EF6${uploader}`;
  if (attachment?.source === "progress_note") return `\u8FDB\u5EA6\u8BF4\u660E\u9644\u4EF6${uploader}`;
  if (attachment?.source === "task_attachment") return `\u4EFB\u52A1\u8D44\u6599\u9644\u4EF6${uploader}`;
  if (attachment?.source === "promotion") return `\u8F6C\u6B63\u7533\u8BF7\u9644\u4EF6${uploader}`;
  return uploader ? `\u4E0A\u4F20\u8005\uFF1A${attachment.uploadedByName}` : "";
}
function renderReviewTabButton(tab, label, count) {
  return `<button class="button-secondary ${state.reviewTab === tab ? "is-active" : ""}" type="button" data-action="set-review-tab" data-tab="${tab}">${label} ${count ? `(${count})` : ""}</button>`;
}
function renderFilterField(label, group, key, value, type, placeholder) {
  return `
    <label class="field-group">
      <span class="field-label">${label}</span>
      <input class="field-input" type="${type}" value="${escapeAttribute(value)}" placeholder="${escapeAttribute(placeholder)}" data-filter-group="${group}" data-filter-key="${key}">
    </label>
  `;
}
function renderFilterSelect(label, group, key, value, sourceOptions, labels = null) {
  return `
    <label class="field-group">
      <span class="field-label">${label}</span>
      <select class="field-select" data-filter-group="${group}" data-filter-key="${key}">
        <option value="all">\u5168\u90E8</option>
        ${sourceOptions.map((option) => {
    const selected = option === value ? "selected" : "";
    const labelText = labels ? labels[option] : option;
    return `<option value="${escapeAttribute(option)}" ${selected}>${escapeHtml(labelText)}</option>`;
  }).join("")}
      </select>
    </label>
  `;
}
function getPendingApprovalCount() {
  return state.database.approvals.filter((approval) => approval.status === "pending").length;
}
function renderMemberDetail(member) {
  const summary = getMemberPointSummary(member.id);
  const load = getMemberLoads().find((entry) => entry.member.id === member.id);
  return `
    <div class="definition-list">
      <div class="definition-row"><span>\u59D3\u540D</span><strong>${escapeHtml(member.name)}</strong></div>
      <div class="definition-row"><span>\u6210\u5458\u8EAB\u4EFD</span><strong>${escapeHtml(dictionaries.identities[member.identity])}</strong></div>
      <div class="definition-row"><span>\u6743\u9650\u89D2\u8272</span><strong>${escapeHtml(dictionaries.roles[member.role])}</strong></div>
      <div class="definition-row"><span>\u90E8\u95E8 / \u65B9\u5411</span><strong>${escapeHtml(member.departments.join(" / "))} / ${escapeHtml(member.directions.join(" / ") || "\u672A\u8BBE\u7F6E")}</strong></div>
      <div class="definition-row"><span>\u5175\u79CD\u7EC4</span><strong>${escapeHtml(member.robotGroups.join(" / ") || "\u672A\u8BBE\u7F6E")}</strong></div>
      <div class="definition-row"><span>\u6280\u80FD\u6807\u7B7E</span><strong>${escapeHtml(member.skillTags.join("\u3001") || "\u6682\u65E0")}</strong></div>
      <div class="definition-row"><span>\u4E2A\u4EBA\u7B80\u4ECB</span><strong>${escapeHtml(member.bio || "\u672A\u586B\u5199")}</strong></div>
      <div class="definition-row"><span>\u8D1F\u8F7D</span><strong>${escapeHtml(load ? dictionaries.loadLevels[load.loadLevel] : "\u672A\u8BC4\u4F30")}</strong></div>
    </div>
    <div class="task-points">
      ${renderPointPill("\u7814\u4E60\u70B9", summary.study)}
      ${renderPointPill("\u5DE5\u65F6\u70B9", summary.labor)}
      ${renderPointPill("\u7BA1\u7406\u70B9", summary.management)}
      ${renderPointPill("\u7EFC\u5408\u8D21\u732E", summary.composite)}
    </div>
  `;
}
function resolveApprovalTarget(approval) {
  if (approval.type === "registration") {
    const member = getMemberById(approval.targetId);
    return { title: member ? member.name : "\u5F85\u5BA1\u6838\u6210\u5458", subtitle: member ? `${member.departments.join(" / ")} \xB7 ${member.skillTags.join("\u3001") || "\u6682\u65E0\u6280\u80FD\u6807\u7B7E"}` : "\u6CE8\u518C\u7533\u8BF7" };
  }
  if (["join", "completion", "settlement"].includes(approval.type)) {
    const task = getTaskById(approval.targetId);
    const submitter = getMemberById(approval.submitterId);
    return {
      title: task ? task.title : "\u672A\u77E5\u4EFB\u52A1",
      subtitle: `${submitter?.name || "\u672A\u77E5\u6210\u5458"} \u63D0\u4EA4 \xB7 ${joinOr(task?.departments || task?.department, "\u672A\u6307\u5B9A\u90E8\u95E8")} / ${joinOr(task?.robotGroups || task?.robotGroup, "\u901A\u7528")}`
    };
  }
  if (["compensation", "promotion", "status_change"].includes(approval.type)) {
    const member = getMemberById(approval.targetId);
    if (approval.requestedIdentity) {
      return { title: member ? member.name : "\u672A\u77E5\u6210\u5458", subtitle: `${escapeHtml(dictionaries.identities[member?.identity] || "")} \u2192 ${escapeHtml(dictionaries.identities[approval.requestedIdentity] || "")} \xB7 ${approval.comment}` };
    }
    return { title: member ? member.name : "\u672A\u77E5\u6210\u5458", subtitle: approval.comment };
  }
  return { title: "\u672A\u77E5\u8BB0\u5F55", subtitle: approval.comment || "" };
}
function renderReviewStack(items) {
  if (!items.length) return renderEmpty("\u5F53\u524D\u5206\u7C7B\u4E0B\u6CA1\u6709\u8BB0\u5F55\u3002");
  return items.map((approval) => renderApprovalCard(approval)).join("");
}
function renderMemberTable(members) {
  if (!members.length) return renderEmpty("\u6CA1\u6709\u5339\u914D\u7B5B\u9009\u6761\u4EF6\u7684\u6210\u5458\u3002");
  const rows = members.map((m) => {
    const summary = getMemberPointSummary(m.id);
    const load = getMemberLoads().find((entry) => entry.member.id === m.id);
    return `
      <tr>
        <td><button class="button-ghost" type="button" data-action="open-member" data-member-id="${m.id}" style="padding:4px 8px;font-size:0.9rem">${escapeHtml(m.name)}</button></td>
        <td>${escapeHtml(dictionaries.identities[m.identity])}</td>
        <td>${escapeHtml(dictionaries.roles[m.role])}</td>
        <td>${escapeHtml(m.departments.join(" / "))}</td>
        <td>${escapeHtml(m.robotGroups.join(" / ") || "\u901A\u7528")}</td>
        <td>${escapeHtml(m.skillTags.join("\u3001") || "-")}</td>
        <td>${escapeHtml(dictionaries.loadLevels[load?.loadLevel] || "-")}</td>
        <td>${summary.composite}</td>
        <td><span class="status-badge status-${escapeAttribute(m.memberStatus)}">${escapeHtml(dictionaries.memberStatuses[m.memberStatus] || m.memberStatus)}</span></td>
      </tr>
    `;
  }).join("");
  return `<div class="table-wrap"><table class="data-table"><thead><tr><th>\u59D3\u540D</th><th>\u8EAB\u4EFD</th><th>\u89D2\u8272</th><th>\u90E8\u95E8</th><th>\u5175\u79CD</th><th>\u6280\u80FD</th><th>\u8D1F\u8F7D</th><th>\u7EFC\u5408\u8D21\u732E</th><th>\u72B6\u6001</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

// client/render/task-detail.js
function renderTaskManageBody(tasks) {
  if (state.taskManageView === "table") return renderTaskTable(tasks);
  if (state.taskManageView === "calendar") return renderTaskCalendar(tasks);
  if (state.taskManageView === "robot") return renderTaskRobotView(tasks);
  return renderTaskKanban(tasks);
}
function renderTaskKanban(tasks) {
  const columns = ["todo", "in_progress", "pending_review", "completed", "overdue"];
  return `<div class="kanban-board">${columns.map((status) => {
    const items = tasks.filter((task) => task.status === status);
    return `<section class="board-column"><strong>${escapeHtml(dictionaries.taskStatuses[status])} \xB7 ${items.length}</strong>${items.length ? items.map((task) => renderTaskCard(task, { compact: true })).join("") : renderEmpty("\u6682\u65E0\u4EFB\u52A1")}</section>`;
  }).join("")}</div>`;
}
function renderTaskTable(tasks) {
  const { column, direction } = state.tableSort;
  const columns = [
    { key: "title", label: "\u4EFB\u52A1" },
    { key: "status", label: "\u72B6\u6001" },
    { key: "priority", label: "\u4F18\u5148\u7EA7" },
    { key: "difficulty", label: "\u96BE\u5EA6" },
    { key: "department", label: "\u90E8\u95E8 / \u5175\u79CD" },
    { key: "dueAt", label: "\u622A\u6B62\u65E5\u671F" },
    { key: "participants", label: "\u53C2\u4E0E\u4EBA\u6570" },
    { key: "", label: "\u64CD\u4F5C" }
  ];
  if (column) {
    tasks = [...tasks].sort((a, b) => {
      let va = column === "participants" ? getActiveParticipantCount(a.id) : a[column] || "";
      let vb = column === "participants" ? getActiveParticipantCount(b.id) : b[column] || "";
      if (typeof va === "string") va = va.toLowerCase();
      if (typeof vb === "string") vb = vb.toLowerCase();
      if (va < vb) return direction === "asc" ? -1 : 1;
      if (va > vb) return direction === "asc" ? 1 : -1;
      return 0;
    });
  }
  return `
    <div class="table-wrap">
      <table class="data-table">
        <thead><tr>${columns.map(
    (col) => col.key ? `<th style="cursor:pointer" data-action="table-sort" data-column="${col.key}">${col.label} ${column === col.key ? direction === "asc" ? "\u25B2" : "\u25BC" : ""}</th>` : `<th>${col.label}</th>`
  ).join("")}</tr></thead>
        <tbody>${tasks.length ? tasks.map((task) => `
          <tr>
            <td><strong>${escapeHtml(task.title)}</strong><div class="helper-text">${escapeHtml(dictionaries.taskTypes[task.type])}</div></td>
            <td>${renderStatusBadge(task.status)}</td>
            <td><span class="priority-pill">${escapeHtml(dictionaries.priorities[task.priority])}</span></td>
            <td><span class="mini-pill">${escapeHtml(dictionaries.difficulties[task.difficulty])}</span></td>
            <td>${escapeHtml(joinOr(task.departments || task.department, "\u672A\u6307\u5B9A"))} / ${escapeHtml(joinOr(task.robotGroups || task.robotGroup, "\u901A\u7528"))}</td>
            <td>${formatShortDate(task.dueAt)}</td>
            <td>${getActiveParticipantCount(task.id)} / ${task.maxParticipants}</td>
            <td><button class="button-ghost" type="button" data-action="open-task" data-task-id="${task.id}">\u67E5\u770B</button></td>
          </tr>`).join("") : `<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--text-soft)">\u5F53\u524D\u6CA1\u6709\u5339\u914D\u7684\u4EFB\u52A1\u3002</td></tr>`}</tbody>
      </table>
    </div>`;
}
function renderTaskCalendar(tasks) {
  const dayNames = ["\u5468\u65E5", "\u5468\u4E00", "\u5468\u4E8C", "\u5468\u4E09", "\u5468\u56DB", "\u5468\u4E94", "\u5468\u516D"];
  const today = /* @__PURE__ */ new Date();
  today.setHours(0, 0, 0, 0);
  const days = [];
  for (let i = -1; i <= 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  return `<div style="display:grid;gap:8px">${days.map((d) => {
    const datestr = d.toISOString().slice(0, 10);
    const dayTasks = tasks.filter((task) => task.dueAt && task.dueAt.slice(0, 10) === datestr);
    const isToday = d.toDateString() === today.toDateString();
    const isPast = d < today;
    return `
      <div style="display:flex;gap:12px;align-items:flex-start;padding:8px 12px;border-radius:12px;border:1px solid ${isToday ? "var(--line-strong)" : "var(--line)"};background:${isToday ? "rgba(255,255,255,0.06)" : "transparent"}">
        <div style="min-width:80px;text-align:center">
          <div style="font-size:0.8rem;color:var(--text-faint)">${dayNames[d.getDay()]}</div>
          <div style="font-size:1.3rem;font-weight:600;color:${isPast ? "var(--text-faint)" : isToday ? "var(--text)" : "var(--text-soft)"}">${d.getDate()}</div>
        </div>
        <div style="flex:1;min-width:0">
          ${dayTasks.length ? dayTasks.slice(0, 3).map((task) => `
            <div style="display:flex;justify-content:space-between;gap:8px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.06)">
              <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1">${escapeHtml(task.title)}</span>
              ${renderStatusBadge(task.status)}
            </div>
          `).join("") : '<div style="color:var(--text-faint);font-size:0.85rem;padding:6px 0">\u6682\u65E0\u4EFB\u52A1</div>'}
          ${dayTasks.length > 3 ? `<div style="color:var(--text-faint);font-size:0.8rem;padding:4px 0">\u8FD8\u6709 ${dayTasks.length - 3} \u4E2A\u4EFB\u52A1</div>` : ""}
        </div>
      </div>`;
  }).join("")}</div>`;
}
function renderTaskRobotView(tasks) {
  return `<div class="robot-grid">${options.robotGroups.map((robotGroup) => {
    const items = tasks.filter((task) => toArray(task.robotGroups || task.robotGroup).includes(robotGroup));
    return `<section class="panel robot-column"><div class="section-header"><div><h3>${robotGroup}</h3><p>\u6309\u5175\u79CD\u805A\u5408\u4EFB\u52A1\u3002</p></div></div>${items.length ? items.map((task) => renderTaskCard(task, { compact: true })).join("") : renderEmpty("\u6682\u65E0\u5173\u8054\u4EFB\u52A1")}</section>`;
  }).join("")}</div>`;
}
function renderTaskDetail(task) {
  const participants = getTaskParticipantRecords(task.id);
  const member = getCurrentMember();
  const isParticipant = participants.some((item) => item.memberId === member.id && item.status === "involved");
  return `
    <div class="detail-grid">
      <div class="task-top">
        <div style="flex:1;min-width:0">
          <div class="task-meta">
            ${renderStatusBadge(task.status)}
            <span class="priority-pill">${escapeHtml(dictionaries.priorities[task.priority])}</span>
            <span class="mini-pill">${escapeHtml(dictionaries.difficulties[task.difficulty])}</span>
          </div>
          <h3>${escapeHtml(task.title)}</h3>
          <label class="field-group"><span class="field-label">\u4EFB\u52A1\u63CF\u8FF0</span><textarea class="field-textarea" readonly style="resize:none;min-height:100px" onclick="this.select()">${escapeHtml(task.description)}</textarea></label>
          ${task.acceptanceCriteria ? `<label class="field-group" style="margin-top:16px"><span class="field-label">\u9A8C\u6536\u6807\u51C6</span><textarea class="field-textarea" readonly style="resize:none;min-height:80px" onclick="this.select()">${escapeHtml(task.acceptanceCriteria)}</textarea></label>` : ""}
        </div>
      </div>
      <div class="definition-list">
        <div class="definition-row"><span>\u4EFB\u52A1\u7C7B\u578B</span><strong>${escapeHtml(dictionaries.taskTypes[task.type])}</strong></div>
        <div class="definition-row"><span>\u90E8\u95E8 / \u65B9\u5411 / \u5175\u79CD</span><strong>${escapeHtml(joinOr(task.departments || task.department, "\u672A\u6307\u5B9A"))} / ${escapeHtml(joinOr(task.directions || task.direction, "\u672A\u6307\u5B9A"))} / ${escapeHtml(joinOr(task.robotGroups || task.robotGroup, "\u901A\u7528"))}</strong></div>
        <div class="definition-row"><span>\u8D1F\u8D23\u4EBA</span><strong>${escapeHtml(getMemberById(task.ownerId)?.name || "\u672A\u8BBE\u7F6E")}</strong></div>
        <div class="definition-row"><span>\u622A\u6B62\u65E5\u671F</span><strong>${formatDateTime(task.dueAt)}</strong></div>
        <div class="definition-row"><span>\u63A8\u8350\u4EBA\u7FA4</span><strong>${escapeHtml(task.recommendedFor)}</strong></div>
      </div>
      <div class="task-points">
        ${renderPointPill("\u7814\u4E60\u70B9", task.studyPoints)}
        ${renderPointPill("\u5DE5\u65F6\u70B9", task.laborPoints)}
        ${renderPointPill("\u7BA1\u7406\u70B9", task.managementPoints)}
        ${renderPointPill("\u4EBA\u6570", `${getActiveParticipantCount(task.id)} / ${task.maxParticipants}`)}
      </div>
      <div class="progress-wrap">
        <div class="progress-head"><span>\u8FDB\u5EA6</span><strong>${task.progressPercent}%</strong></div>
        <div class="progress-bar"><span style="width:${task.progressPercent}%"></span></div>
      </div>
      <section class="panel">
        <div class="section-header"><div><h3>\u8FDB\u5EA6\u8282\u70B9</h3><p>\u6BCF\u4E2A\u5E26\u6709\u8FDB\u5EA6\u8BF4\u660E\u6216\u9644\u4EF6\u7684\u91CC\u7A0B\u7891\u8BB0\u5F55\u3002</p></div></div>
        <div class="comment-list">${(task.progressNodes || []).length ? [...task.progressNodes].sort((a, b) => b.percent - a.percent).map((node) => renderProgressNodeCard(node, task.id)).join("") : renderEmpty("\u8FD8\u6CA1\u6709\u8FDB\u5EA6\u8282\u70B9\u8BB0\u5F55\u3002")}</div>
      </section>
      <section class="panel">
        <div class="section-header"><div><h3>\u9644\u4EF6\u8D44\u6599</h3><p>\u4EFB\u52A1\u8D44\u6599\u3001\u6210\u679C\u9644\u4EF6\u548C\u5386\u53F2\u5916\u94FE\u90FD\u4F1A\u5C55\u793A\u5728\u8FD9\u91CC\u3002</p></div></div>
        <div class="comment-list">${(task.attachments || []).length ? task.attachments.map((attachment) => renderAttachmentCard(attachment, task.id)).join("") : renderEmpty("\u5F53\u524D\u6CA1\u6709\u9644\u4EF6\u8D44\u6599\u3002")}</div>
      </section>
      <section class="panel">
        <div class="section-header"><div><h3>\u53C2\u4E0E\u6210\u5458</h3><p>\u663E\u793A\u8D1F\u8D23\u4EBA\u3001\u534F\u4F5C\u8005\u4E0E\u9000\u51FA\u8BB0\u5F55\u3002</p></div></div>
        <div class="member-stack">${participants.map((participant) => renderParticipantRow(participant)).join("")}</div>
      </section>
      <section class="panel">
        <div class="section-header"><div><h3>\u8BC4\u8BBA\u4E0E\u6210\u679C</h3><p>\u4EFB\u52A1\u8BA8\u8BBA\u3001\u8FDB\u5EA6\u66F4\u65B0\u4E0E\u6210\u679C\u63D0\u4EA4\u8BB0\u5F55\u3002</p></div></div>
        <div class="comment-list">${(task.comments || []).length ? task.comments.map((comment) => renderCommentCard(comment, task.id)).join("") : renderEmpty("\u8FD8\u6CA1\u6709\u8BC4\u8BBA\u8BB0\u5F55\u3002")}</div>
      </section>
      ${canInteractWithTasks() ? renderTaskActionPanel(task, isParticipant) : renderTaskReadOnlyNotice(task)}
      ${canDeleteAllGeneratedData() ? renderRatioPanel(task, participants) : ""}
      ${canDeleteAllGeneratedData() ? renderCompensationPanel(task, participants) : ""}
    </div>
  `;
}
function renderTaskActionPanel(task, isParticipant) {
  const member = getCurrentMember();
  const canSubmit = isParticipant || task.ownerId === member.id || isAdmin();
  const joinAction = getJoinActionLabel(task);
  const isLocked = task.status === "completed" || task.status === "pending_review";
  return `
    <section class="panel">
      <div class="section-header"><div><h3>\u4EFB\u52A1\u64CD\u4F5C</h3><p>\u9886\u53D6\u3001\u7533\u8BF7\u52A0\u5165\u3001\u66F4\u65B0\u8FDB\u5EA6\u3001\u9000\u51FA\u4EFB\u52A1\u3002\u8FDB\u5EA6\u5230 100% \u65F6\u4F1A\u5F39\u51FA\u5B8C\u6210\u63D0\u4EA4\u7A97\u3002</p></div></div>
      <div class="button-row">
        ${joinAction ? `<button class="button-primary" type="button" data-action="claim-task" data-task-id="${task.id}">${joinAction}</button>` : ""}
        ${isParticipant ? `<button class="button-danger" type="button" data-action="exit-task" data-task-id="${task.id}">\u9000\u51FA\u4EFB\u52A1</button>` : ""}
      </div>
      ${canSubmit && !isLocked ? `
        <form class="auth-form" data-form="task-progress" data-task-id="${task.id}">
          <div class="field-grid">
            <label class="field-group"><span class="field-label">\u5F53\u524D\u8FDB\u5EA6\u767E\u5206\u6BD4</span><input class="field-input" type="range" name="progressPercent" min="0" max="100" step="1" value="${escapeAttribute(String(task.progressPercent))}" oninput="this.nextElementSibling.textContent = this.value + '%'"><span style="min-width:40px;text-align:right;font-weight:600">${task.progressPercent}%</span></label>
          </div>
          <div class="button-row"><button class="button-secondary" type="submit" ${state.formLoading === "task-progress" ? "disabled" : ""}>\u66F4\u65B0\u8FDB\u5EA6</button></div>
        </form>
        <div class="button-row">
          <button class="button-secondary" type="button" data-action="open-progress-note" data-task-id="${task.id}">\u6DFB\u52A0\u8FDB\u5EA6\u8BF4\u660E</button>
          <button class="button-secondary" type="button" data-action="open-task-attachment" data-task-id="${task.id}">\u4E0A\u4F20\u9644\u4EF6</button>
        </div>
        <form class="auth-form" data-form="task-comment" data-task-id="${task.id}">
          <label class="field-group"><span class="field-label">\u6DFB\u52A0\u8BC4\u8BBA</span><textarea class="field-textarea" name="comment" required placeholder="\u8BB0\u5F55\u8BA8\u8BBA\u7ED3\u8BBA\u3001\u5BA1\u6838\u610F\u89C1\u6216\u534F\u4F5C\u8BF4\u660E"></textarea></label>
          <div class="button-row"><button class="button-secondary" type="submit" ${state.formLoading === "task-comment" ? "disabled" : ""}>\u53D1\u5E03\u8BC4\u8BBA</button></div>
        </form>
      ` : ""}
      ${isLocked ? `<div class="helper-text">\u5F53\u524D\u4EFB\u52A1\u5DF2${task.status === "completed" ? "\u5B8C\u6210" : "\u8FDB\u5165\u5BA1\u6838\u6D41\u7A0B"}\uFF0C\u64CD\u4F5C\u5DF2\u9501\u5B9A\u3002</div>` : ""}
    </section>
  `;
}
function renderRatioPanel(task, participants) {
  const activeParticipants = participants.filter((item) => item.status !== "exited");
  return `
    <section class="panel">
      <div class="section-header"><div><h3>\u70B9\u6570\u5206\u914D\u9884\u89C8</h3><p>\u7BA1\u7406\u5458\u53EF\u624B\u52A8\u8C03\u6574\u8D21\u732E\u6BD4\u4F8B\u3002\u4E2D\u9014\u52A0\u5165\u6210\u5458\u4F1A\u6309\u7CFB\u7EDF\u6298\u6263\u81EA\u52A8\u6298\u534A\u3002</p></div></div>
      <form class="auth-form" data-form="task-ratios" data-task-id="${task.id}">
        ${activeParticipants.map((participant) => {
    const member = getMemberById(participant.memberId);
    return `
            <div class="field-grid">
              <label class="field-group">
                <span class="field-label">${escapeHtml(member?.name || "\u672A\u77E5\u6210\u5458")} \xB7 ${escapeHtml(participant.joinType === "middle" ? "\u4E2D\u9014\u52A0\u5165" : "\u521D\u59CB\u53C2\u4E0E")}</span>
                <input class="field-input" type="number" name="ratio_${participant.id}" min="0.1" step="0.1" required value="${escapeAttribute(String(participant.contributionRatio))}">
              </label>
              <div class="point-pill">\u9884\u8BA1\u6743\u91CD ${(participant.contributionRatio * (participant.joinType === "middle" ? state.database.settings.middleJoinDiscount : 1)).toFixed(1)}</div>
            </div>`;
  }).join("")}
        <div class="button-row"><button class="button-secondary" type="submit" ${state.formLoading === "task-ratios" ? "disabled" : ""}>\u4FDD\u5B58\u5206\u914D\u6BD4\u4F8B</button></div>
      </form>
    </section>
  `;
}
function renderCompensationPanel(task, participants) {
  const availableMembers = participants.map((participant) => getMemberById(participant.memberId)).filter(Boolean);
  return `
    <section class="panel">
      <div class="section-header"><div><h3>\u8865\u507F\u70B9\u6570</h3><p>\u7528\u4E8E\u9000\u51FA\u4EFB\u52A1\u4F46\u5DF2\u6709\u8D21\u732E\u3001\u4EFB\u52A1\u5173\u95ED\u4F46\u5B58\u5728\u6709\u6548\u6295\u5165\u7B49\u7279\u6B8A\u60C5\u51B5\u3002</p></div></div>
<form class="auth-form" data-form="task-compensation" data-task-id="${task.id}">
         <div class="field-grid">
           <label class="field-group"><span class="field-label">\u8865\u507F\u5BF9\u8C61</span><select class="field-select" name="memberId" required>${availableMembers.map((member) => `<option value="${member.id}">${escapeHtml(member.name)}</option>`).join("")}</select></label>
           <label class="field-group"><span class="field-label">\u8865\u507F\u7C7B\u578B</span><select class="field-select" name="pointType" required><option value="compensation">\u8865\u507F\u70B9</option><option value="study">\u7814\u4E60\u70B9</option><option value="labor">\u5DE5\u65F6\u70B9</option><option value="management">\u7BA1\u7406\u70B9</option></select></label>
         </div>
         <div class="field-grid">
           <label class="field-group"><span class="field-label">\u8865\u507F\u6570\u503C</span><input class="field-input" type="number" min="0" step="0.5" name="amount" required></label>
           <label class="field-group"><span class="field-label">\u8865\u507F\u539F\u56E0</span><input class="field-input" type="text" name="reason" required placeholder="\u4F8B\u5982\uFF1A\u4E2D\u9014\u9000\u51FA\u4F46\u5DF2\u5B8C\u6210\u7EBF\u675F\u6392\u67E5"></label>
         </div>
         <div class="button-row"><button class="button-primary" type="submit" ${state.formLoading === "task-compensation" ? "disabled" : ""}>\u53D1\u653E\u8865\u507F</button></div>
       </form>
    </section>
  `;
}
function renderTaskReadOnlyNotice(task) {
  const message = getReadOnlyTaskActionMessage();
  return `
    <section class="panel">
      <div class="section-header"><div><h3>\u4EFB\u52A1\u64CD\u4F5C\u5DF2\u9501\u5B9A</h3><p>${escapeHtml(message)}</p></div></div>
      <div class="helper-text">\u4F60\u4ECD\u7136\u53EF\u4EE5\u67E5\u770B\u4EFB\u52A1\u8BE6\u60C5\u3001\u9644\u4EF6\u3001\u8BC4\u8BBA\u548C\u5386\u53F2\u8BB0\u5F55\uFF0C\u4F46\u4E0D\u80FD\u7EE7\u7EED\u53C2\u4E0E\u5F53\u524D\u4EFB\u52A1\u64CD\u4F5C\u3002</div>
    </section>
  `;
}
function getReadOnlyTaskActionMessage(member = getCurrentMember()) {
  if (!member) return "\u5F53\u524D\u8D26\u53F7\u6CA1\u6709\u4EFB\u52A1\u64CD\u4F5C\u6743\u9650\u3002";
  if (isRetiredMember(member)) return "\u5F53\u524D\u8D26\u53F7\u5DF2\u9000\u4F11\uFF0C\u4EC5\u4FDD\u7559\u53EA\u8BFB\u6D4F\u89C8\u80FD\u529B\uFF0C\u4E0D\u518D\u53C2\u4E0E\u4EFB\u52A1\u534F\u4F5C\u548C\u79EF\u5206\u7ED3\u7B97\u3002";
  if (isDisabledMember(member)) return "\u5F53\u524D\u8D26\u53F7\u5DF2\u505C\u7528\uFF0C\u4E0D\u80FD\u6267\u884C\u4EFB\u52A1\u534F\u4F5C\u64CD\u4F5C\u3002";
  if (member.role === "teacher") return "\u6307\u5BFC\u8001\u5E08\u8D26\u53F7\u4EC5\u7528\u4E8E\u67E5\u770B\uFF0C\u4E0D\u53C2\u4E0E\u666E\u901A\u4EFB\u52A1\u534F\u4F5C\u3002";
  return "\u5F53\u524D\u8D26\u53F7\u6CA1\u6709\u4EFB\u52A1\u64CD\u4F5C\u6743\u9650\u3002";
}

// client/render/pages.js
function renderDashboardPage() {
  const stats = getDashboardStats();
  const featuredTasks = getMarketTasks().slice(0, 4);
  const myTasks = getCurrentUserTaskRecords().active.slice(0, 4);
  const loads = getMemberLoads().slice(0, 6);
  const ranking = getLeaderboard("composite", "total").slice(0, 5);
  const departments = getDepartmentContribution();
  const projects = state.database.robotProjects.slice(0, 4);
  return `
    <section>
      <div class="page-header">
        <div><h2>\u4EEA\u8868\u76D8</h2><p>\u603B\u89C8\u6210\u5458\u8D1F\u8F7D\u3001\u7CBE\u9009\u4EFB\u52A1\u3001\u79EF\u5206\u6392\u884C\u4E0E\u5175\u79CD\u9879\u76EE\u8FDB\u5C55\uFF0C\u4F18\u5148\u66B4\u9732\u7BA1\u7406\u5C42\u6700\u5173\u5FC3\u7684\u8FD0\u884C\u4FE1\u53F7\u3002</p></div>
      </div>
      <div class="metric-grid">
        ${renderMetricCard("\u5F53\u524D\u6210\u5458\u6570", stats.memberCount, "\u5305\u542B\u6B63\u5E38\u72B6\u6001\u6210\u5458")}
        ${renderMetricCard("\u8FDB\u884C\u4E2D\u4EFB\u52A1", stats.inProgressCount, "\u5F53\u524D\u6B63\u5728\u63A8\u8FDB\u7684\u516C\u5F00\u4EFB\u52A1\u4E0E\u9879\u76EE\u4EFB\u52A1")}
        ${renderMetricCard("\u5F85\u5BA1\u6838\u4EFB\u52A1", stats.pendingReviewCount, "\u5DF2\u63D0\u4EA4\u6210\u679C\u7B49\u5F85\u5BA1\u6838\u4E0E\u7ED3\u7B97")}
        ${renderMetricCard("\u5DF2\u903E\u671F\u4EFB\u52A1", stats.overdueCount, "\u622A\u6B62\u65E5\u671F\u5DF2\u8FC7\u4E14\u672A\u5B8C\u6210\u7684\u4EFB\u52A1")}
        ${renderMetricCard("\u672C\u6708\u5B8C\u6210\u4EFB\u52A1", stats.completedThisMonth, "\u7528\u4E8E\u89C2\u5BDF\u5F53\u524D\u8282\u594F\u4E0E\u4EA7\u51FA\u5BC6\u5EA6")}
      </div>
      <div class="page-grid columns-3">
        <section class="panel">
          <div class="section-header"><div><h3>\u6211\u7684\u4EFB\u52A1</h3><p>\u5F53\u524D\u7528\u6237\u8D1F\u8D23\u3001\u53C2\u4E0E\u6216\u5F85\u63D0\u4EA4\u7684\u4EFB\u52A1\u3002</p></div><button class="button-ghost" type="button" data-action="navigate" data-route="myTasks">\u67E5\u770B\u5168\u90E8</button></div>
          <div class="task-stack">${myTasks.length ? myTasks.map(({ task }) => renderTaskCard(task, { compact: true })).join("") : renderEmpty("\u5F53\u524D\u6CA1\u6709\u8FDB\u884C\u4E2D\u7684\u4E2A\u4EBA\u4EFB\u52A1\u3002")}</div>
        </section>
        <section class="panel">
          <div class="section-header"><div><h3>\u4EFB\u52A1\u5E02\u573A\u7CBE\u9009</h3><p>\u9762\u5411\u5F53\u524D\u6210\u5458\u753B\u50CF\u7684\u6700\u65B0\u516C\u5F00\u4EFB\u52A1\u3002</p></div><button class="button-ghost" type="button" data-action="navigate" data-route="market">\u8FDB\u5165\u5E02\u573A</button></div>
          <div class="task-stack">${featuredTasks.map((task) => renderTaskCard(task, { showAction: true, compact: true })).join("")}</div>
        </section>
        <section class="panel">
          <div class="section-header"><div><h3>\u79EF\u5206\u6392\u884C</h3><p>\u7EFC\u5408\u8D21\u732E Top 5\u3002</p></div><button class="button-ghost" type="button" data-action="navigate" data-route="rankings">\u5B8C\u6574\u699C\u5355</button></div>
          <div class="ranking-stack">${ranking.map((entry, index) => renderRankingRow(entry, index + 1)).join("")}</div>
        </section>
      </div>
      <div class="page-grid columns-2">
        <section class="panel">
          <div class="section-header"><div><h3>\u6210\u5458\u8D1F\u8F7D</h3><p>\u7528\u4E8E\u4EFB\u52A1\u5206\u914D\u4E0E\u5E02\u573A\u63A8\u8350\u7684\u8D1F\u8F7D\u5FEB\u7167\u3002</p></div></div>
          <div class="member-stack">${loads.map((entry) => renderLoadRow(entry)).join("")}</div>
        </section>
        <section class="panel">
          <div class="section-header"><div><h3>\u90E8\u95E8\u8D21\u732E</h3><p>\u6309\u7814\u4E60\u70B9\u3001\u5DE5\u65F6\u70B9\u3001\u7BA1\u7406\u70B9\u5408\u8BA1\u8D21\u732E\u503C\u6BD4\u8F83\u3002</p></div></div>
          <div class="chart-bars">${departments.map((item) => renderChartRow(item.label, item.value, departments[0]?.value || 1)).join("")}</div>
        </section>
      </div>
      <section class="panel">
        <div class="section-header"><div><h3>\u5175\u79CD\u9879\u76EE\u8FDB\u5EA6\u603B\u89C8</h3><p>\u6B65\u5175\u3001\u54E8\u5175\u3001\u82F1\u96C4\u3001\u5DE5\u7A0B\u3001\u65E0\u4EBA\u673A\u3001\u98DE\u9556\u3001\u96F7\u8FBE\u7684\u5F53\u524D\u8FDB\u5EA6\u3001\u963B\u585E\u9879\u4E0E\u8D1F\u8D23\u4EBA\u3002</p></div><button class="button-ghost" type="button" data-action="navigate" data-route="projects">\u8FDB\u5165\u5175\u79CD\u9875</button></div>
        <div class="project-grid">${projects.map((project) => renderProjectCard(project)).join("")}</div>
      </section>
    </section>
  `;
}
function renderMarketPage() {
  const tasks = getFilteredMarketTasks();
  const marketStatusLabels = { market_open: "\u672A\u5B8C\u6210", ...dictionaries.taskStatuses };
  return `
    <section>
      <div class="panel market-board">
        <div class="market-stage">
          <div class="market-stage-copy">
            <div class="market-stage-badge">Open Task Market</div>
            <h2>\u4EFB\u52A1\u5E02\u573A</h2>
            <p>\u5B8C\u5168\u516C\u5F00\u7684\u4EFB\u52A1\u5E7F\u573A\u3002\u652F\u6301\u641C\u7D22\u3001\u7B5B\u9009\u3001\u76F4\u63A5\u9886\u53D6\u6216\u5BF9\u9AD8\u96BE\u4EFB\u52A1\u53D1\u8D77\u5BA1\u6279\u7533\u8BF7\u3002</p>
          </div>
          <div class="market-stage-meta">
            ${renderPointPill("\u516C\u5F00\u4EFB\u52A1", tasks.length)}
            ${renderPointPill("\u9AD8\u96BE\u4EFB\u52A1", tasks.filter((task) => ["hard", "core"].includes(task.difficulty)).length)}
            ${renderPointPill("\u7D27\u6025\u4EFB\u52A1", tasks.filter((task) => isUrgentMarketTask(task)).length)}
            ${renderPointPill("\u5F85\u5BA1\u6838", tasks.filter((task) => task.status === "pending_review").length)}
          </div>
        </div>
        <div class="market-filter-shell">
          <div class="field-grid">
            ${renderFilterField("\u4EFB\u52A1\u641C\u7D22", "market", "query", state.marketFilters.query, "text", "\u641C\u7D22\u6807\u9898\u3001\u63CF\u8FF0\u3001\u63A8\u8350\u4EBA\u7FA4")}
            ${renderFilterSelect("\u4EFB\u52A1\u7C7B\u578B", "market", "type", state.marketFilters.type, options.taskTypes, dictionaries.taskTypes)}
          </div>
          <div class="field-grid-3">
            ${renderFilterSelect("\u90E8\u95E8", "market", "department", state.marketFilters.department, options.departments)}
            ${renderFilterSelect("\u65B9\u5411", "market", "direction", state.marketFilters.direction, options.directions)}
            ${renderFilterSelect("\u5175\u79CD", "market", "robotGroup", state.marketFilters.robotGroup, options.robotGroups)}
          </div>
          <div class="field-grid-3">
            ${renderFilterSelect("\u96BE\u5EA6", "market", "difficulty", state.marketFilters.difficulty, options.difficulties, dictionaries.difficulties)}
            ${renderFilterSelect("\u72B6\u6001", "market", "status", state.marketFilters.status, options.marketTaskStatuses, marketStatusLabels)}
            ${renderFilterField("\u63A8\u8350\u9002\u5408\u4EBA\u7FA4", "market", "audience", state.marketFilters.audience, "text", "\u5982 \u673A\u68B0\u7EC4\u65B0\u4EBA / \u7B97\u6CD5\u68AF\u961F")}
          </div>
        </div>
        <div class="market-waterfall">
          ${tasks.length ? tasks.map((task) => renderTaskCard(task, { showAction: canInteractWithTasks(), compact: false, waterfall: true })).join("") : renderEmpty("\u6CA1\u6709\u5339\u914D\u7B5B\u9009\u6761\u4EF6\u7684\u4EFB\u52A1\u3002")}
        </div>
      </div>
    </section>
  `;
}
function renderMyTasksPage() {
  const buckets = getCurrentUserTaskRecords();
  return `
    <section>
      <div class="page-header"><div><h2>\u6211\u7684\u4EFB\u52A1</h2><p>\u7BA1\u7406\u5F53\u524D\u7528\u6237\u8D1F\u8D23\u3001\u53C2\u4E0E\u3001\u7533\u8BF7\u4E2D\u3001\u5F85\u63D0\u4EA4\u3001\u5DF2\u5B8C\u6210\u4E0E\u9690\u79C1\u8BB0\u5F55\u4E2D\u7684\u4EFB\u52A1\u3002</p></div></div>
      <div class="page-grid columns-2">
        <section class="panel">
          <div class="section-header"><div><h3>\u6211\u8D1F\u8D23\u7684\u4EFB\u52A1</h3><p>\u8D1F\u8D23\u63A8\u8FDB\u4E0E\u9A8C\u6536\u8282\u594F\u7684\u4EFB\u52A1\u3002</p></div></div>
          <div class="task-stack">${buckets.owned.length ? buckets.owned.map(({ task }) => renderTaskCard(task, { compact: true })).join("") : renderEmpty("\u5F53\u524D\u6CA1\u6709\u8D1F\u8D23\u4E2D\u7684\u4EFB\u52A1\u3002")}</div>
        </section>
        <section class="panel">
          <div class="section-header"><div><h3>\u6211\u53C2\u4E0E\u7684\u4EFB\u52A1</h3><p>\u5DF2\u52A0\u5165\u5E76\u4ECD\u5728\u53C2\u4E0E\u4E2D\u7684\u4EFB\u52A1\u3002</p></div></div>
          <div class="task-stack">${buckets.active.length ? buckets.active.map(({ task }) => renderTaskCard(task, { compact: true })).join("") : renderEmpty("\u5F53\u524D\u6CA1\u6709\u53C2\u4E0E\u4E2D\u7684\u4EFB\u52A1\u3002")}</div>
        </section>
      </div>
      <div class="page-grid columns-2">
        <section class="panel">
          <div class="section-header"><div><h3>\u6211\u7533\u8BF7\u4E2D\u7684\u4EFB\u52A1</h3><p>\u7B49\u5F85\u7EC4\u957F\u6216\u7BA1\u7406\u5458\u5BA1\u6279\u7684\u9AD8\u96BE\u4EFB\u52A1\u3002</p></div></div>
          <div class="task-stack">${buckets.pendingJoin.length ? buckets.pendingJoin.map((approval) => renderApprovalPreview(approval)).join("") : renderEmpty("\u5F53\u524D\u6CA1\u6709\u5F85\u5BA1\u6279\u7684\u52A0\u5165\u7533\u8BF7\u3002")}</div>
        </section>
        <section class="panel">
          <div class="section-header"><div><h3>\u5F85\u6211\u63D0\u4EA4\u7684\u4EFB\u52A1</h3><p>\u5DF2\u5B8C\u6210\u4E3B\u8981\u5DE5\u4F5C\u4F46\u8FD8\u672A\u63D0\u4EA4\u6210\u679C\u7684\u4EFB\u52A1\u3002</p></div></div>
          <div class="task-stack">${buckets.needsSubmit.length ? buckets.needsSubmit.map(({ task }) => renderTaskCard(task, { compact: true })).join("") : renderEmpty("\u5F53\u524D\u6CA1\u6709\u5F85\u63D0\u4EA4\u6210\u679C\u7684\u4EFB\u52A1\u3002")}</div>
        </section>
      </div>
      <div class="page-grid columns-2">
        <section class="panel">
          <div class="section-header"><div><h3>\u6211\u5DF2\u5B8C\u6210\u7684\u4EFB\u52A1</h3><p>\u5DF2\u901A\u8FC7\u5BA1\u6838\u5E76\u5B8C\u6210\u7ED3\u7B97\u3002</p></div></div>
          <div class="task-stack">${buckets.completed.length ? buckets.completed.map(({ task }) => renderTaskCard(task, { compact: true })).join("") : renderEmpty("\u5F53\u524D\u6CA1\u6709\u5DF2\u5B8C\u6210\u4EFB\u52A1\u3002")}</div>
        </section>
        <section class="panel">
          <div class="section-header"><div><h3>\u9690\u79C1\u8BB0\u5F55</h3><p>\u9000\u51FA\u4EFB\u52A1\u4E0E\u903E\u671F\u4EFB\u52A1\u4EC5\u672C\u4EBA\u53CA\u7BA1\u7406\u5C42\u53EF\u89C1\u3002</p></div></div>
          <div class="timeline-grid">
            ${buckets.exited.length ? buckets.exited.map(({ task, participant }) => renderTimelineCard(task.title, `\u5DF2\u9000\u51FA \xB7 ${formatDateTime(participant.exitedAt)}`)).join("") : renderTimelineCard("\u9000\u51FA\u8BB0\u5F55", "\u6682\u65E0\u9000\u51FA\u4EFB\u52A1\u8BB0\u5F55")}
            ${buckets.overdue.length ? buckets.overdue.map(({ task }) => renderTimelineCard(task.title, `\u903E\u671F\u4EFB\u52A1 \xB7 \u622A\u6B62\u4E8E ${formatShortDate(task.dueAt)}`)).join("") : renderTimelineCard("\u903E\u671F\u8BB0\u5F55", "\u6682\u65E0\u903E\u671F\u4EFB\u52A1\u8BB0\u5F55")}
          </div>
        </section>
      </div>
    </section>
  `;
}
function renderTaskManagementPage() {
  const tasks = getVisibleTaskManagementTasks();
  return `
    <section>
      <div class="page-header">
        <div><h2>\u4EFB\u52A1\u7BA1\u7406</h2><p>\u9762\u5411\u7BA1\u7406\u5458\u3001\u7EC4\u957F\u4E0E\u6B63\u5F0F\u961F\u5458\u7684\u4EFB\u52A1\u603B\u89C8\u3002\u652F\u6301\u770B\u677F\u3001\u8868\u683C\u3001\u65E5\u5386\u4E0E\u5175\u79CD\u56DB\u79CD\u89C6\u56FE\u3002</p></div>
        <div class="page-actions">
          <button class="button-ghost" type="button" data-action="export-tasks-csv">\u5BFC\u51FA CSV</button>
          <button class="button-secondary ${state.taskManageView === "kanban" ? "is-active" : ""}" type="button" data-action="set-task-view" data-view="kanban">\u770B\u677F</button>
          <button class="button-secondary ${state.taskManageView === "table" ? "is-active" : ""}" type="button" data-action="set-task-view" data-view="table">\u8868\u683C</button>
          <button class="button-secondary ${state.taskManageView === "calendar" ? "is-active" : ""}" type="button" data-action="set-task-view" data-view="calendar">\u65E5\u5386</button>
          <button class="button-secondary ${state.taskManageView === "robot" ? "is-active" : ""}" type="button" data-action="set-task-view" data-view="robot">\u5175\u79CD</button>
        </div>
      </div>
      <section class="panel">${renderTaskManageBody(tasks)}</section>
    </section>
  `;
}
function renderMembersPage() {
  const members = getFilteredMembers();
  const activeMembers = state.database.members.filter((member) => isMemberIncludedInWorkspaceStats(member));
  const leaderCount = activeMembers.filter((member) => ["admin", "leader"].includes(member.role)).length;
  const overloadedCount = getMemberLoads().filter((entry) => entry.loadLevel === "overload").length;
  const pendingCount = state.database.members.filter((member) => member.memberStatus === "pending_review").length;
  return `
    <section>
      <div class="panel member-board">
        <div class="member-stage">
          <div class="member-stage-copy">
            <div class="market-stage-badge">Member Directory</div>
            <h2>\u6210\u5458\u7BA1\u7406</h2>
            <p>\u6309\u8EAB\u4EFD\u3001\u90E8\u95E8\u3001\u5175\u79CD\u548C\u72B6\u6001\u67E5\u770B\u6210\u5458\u516C\u5F00\u8D44\u6599\u3001\u8D1F\u8F7D\u4E0E\u8D21\u732E\u6570\u636E\u3002\u7BA1\u7406\u5458\u53EF\u4EE5\u76F4\u63A5\u7EF4\u62A4\u6210\u5458\u6863\u6848\u3002</p>
          </div>
          <div class="market-stage-meta">
            ${renderPointPill("\u6210\u5458\u603B\u6570", activeMembers.length)}
            ${renderPointPill("\u7BA1\u7406\u4E0E\u7EC4\u957F", leaderCount)}
            ${renderPointPill("\u8FC7\u8F7D\u6210\u5458", overloadedCount)}
            ${renderPointPill("\u5F85\u5BA1\u6838", pendingCount)}
          </div>
        </div>
        <div class="market-filter-shell">
          <div class="field-grid">
            ${renderFilterField("\u641C\u7D22\u6210\u5458", "member", "query", state.memberFilters.query, "text", "\u641C\u7D22\u59D3\u540D\u3001\u6280\u80FD\u3001\u90E8\u95E8")}
            ${renderFilterSelect("\u6743\u9650\u89D2\u8272", "member", "role", state.memberFilters.role, options.roles, dictionaries.roles)}
          </div>
          <div class="field-grid-3">
            ${renderFilterSelect("\u90E8\u95E8", "member", "department", state.memberFilters.department, options.departments)}
            ${renderFilterSelect("\u5175\u79CD", "member", "robotGroup", state.memberFilters.robotGroup, options.robotGroups)}
            ${renderFilterSelect("\u72B6\u6001", "member", "status", state.memberFilters.status, options.memberStatuses, dictionaries.memberStatuses)}
          </div>
        </div>
        <div class="toolbar-row"><button class="button-ghost" type="button" data-action="export-members-csv">\u5BFC\u51FA CSV</button><button class="button-secondary ${state.memberView === "cards" ? "is-active" : ""}" type="button" data-action="set-member-view" data-view="cards">\u5361\u7247</button><button class="button-secondary ${state.memberView === "table" ? "is-active" : ""}" type="button" data-action="set-member-view" data-view="table">\u8868\u683C</button></div>
        ${state.memberView === "table" ? renderMemberTable(members) : `<div class="member-waterfall">${members.length ? members.map((member) => renderMemberCard(member, { waterfall: true })).join("") : renderEmpty("\u6CA1\u6709\u5339\u914D\u7B5B\u9009\u6761\u4EF6\u7684\u6210\u5458\u3002")}</div>`}
      </div>
    </section>
  `;
}
function renderProjectsPage() {
  const projects = state.database.robotProjects;
  return `
    <section>
      <div class="page-header"><div><h2>\u5175\u79CD\u9879\u76EE</h2><p>\u96C6\u4E2D\u67E5\u770B\u4E03\u4E2A\u5175\u79CD\u673A\u5668\u4EBA\u7684\u603B\u8FDB\u5EA6\u3001\u5B50\u65B9\u5411\u8FDB\u5EA6\u3001\u963B\u585E\u9879\u3001\u5173\u8054\u4EFB\u52A1\u4E0E\u9636\u6BB5\u590D\u76D8\u3002</p></div></div>
      <div class="project-grid">${projects.length ? projects.map((project) => renderProjectCard(project, true)).join("") : renderEmpty("\u5F53\u524D\u6CA1\u6709\u5175\u79CD\u9879\u76EE\u6570\u636E\uFF0C\u8BF7\u5728\u7CFB\u7EDF\u8BBE\u7F6E\u4E2D\u521D\u59CB\u5316\u3002")}</div>
    </section>
  `;
}
function renderRankingsPage() {
  const leaderboard = getLeaderboard(state.rankingTab, state.rankingRange);
  const departmentBoard = getDepartmentContribution();
  const robotBoard = getRobotContribution();
  return `
    <section>
        <div class="page-header"><div><h2>\u79EF\u5206\u6392\u884C</h2><p>\u652F\u6301\u7814\u4E60\u70B9\u3001\u5DE5\u65F6\u70B9\u3001\u7BA1\u7406\u70B9\u3001\u7EFC\u5408\u8D21\u732E\u3001\u90E8\u95E8\u8D21\u732E\u4E0E\u5175\u79CD\u8D21\u732E\u7684\u591A\u7EF4\u699C\u5355\u3002</p></div><button class="button-ghost" type="button" data-action="export-rankings-csv">\u5BFC\u51FA CSV</button></div>
      <div class="toolbar-row">
        ${[["study", "\u7814\u4E60\u70B9\u699C"], ["labor", "\u5DE5\u65F6\u70B9\u699C"], ["management", "\u7BA1\u7406\u70B9\u699C"], ["composite", "\u7EFC\u5408\u8D21\u732E\u699C"]].map(([tab, label]) => `<button class="button-secondary ${state.rankingTab === tab ? "is-active" : ""}" type="button" data-action="set-ranking-tab" data-tab="${tab}">${label}</button>`).join("")}
        <button class="button-ghost ${state.rankingRange === "month" ? "is-active" : ""}" type="button" data-action="set-ranking-range" data-range="month">\u6708\u5EA6\u699C</button>
        <button class="button-ghost ${state.rankingRange === "total" ? "is-active" : ""}" type="button" data-action="set-ranking-range" data-range="total">\u603B\u699C</button>
      </div>
      <div class="page-grid columns-2">
        <section class="panel">
          <div class="section-header"><div><h3>${escapeHtml(state.rankingRange === "month" ? "\u6708\u5EA6\u699C\u5355" : "\u603B\u699C\u699C\u5355")}</h3><p>\u6309\u5F53\u524D\u9009\u4E2D\u7684\u79EF\u5206\u7EF4\u5EA6\u6392\u5E8F\u3002</p></div></div>
          <div class="task-stack">${leaderboard.length ? leaderboard.map((entry, index) => renderRankingCard(entry, index + 1, state.rankingTab)).join("") : renderEmpty("\u6682\u65E0\u6392\u884C\u6570\u636E\u3002")}</div>
        </section>
        <div class="page-grid">
          <section class="panel">
            <div class="section-header"><div><h3>\u90E8\u95E8\u8D21\u732E\u699C</h3><p>\u6309\u7D2F\u8BA1\u70B9\u6570\u805A\u5408\u3002</p></div></div>
            <div class="chart-bars">${departmentBoard.length ? departmentBoard.map((item) => renderChartRow(item.label, item.value, departmentBoard[0]?.value || 1)).join("") : renderEmpty("\u6682\u65E0\u6570\u636E\u3002")}</div>
          </section>
          <section class="panel">
            <div class="section-header"><div><h3>\u5175\u79CD\u8D21\u732E\u699C</h3><p>\u6309\u5173\u8054\u4EFB\u52A1\u70B9\u6570\u805A\u5408\u3002</p></div></div>
            <div class="chart-bars">${robotBoard.length ? robotBoard.map((item) => renderChartRow(item.label, item.value, robotBoard[0]?.value || 1)).join("") : renderEmpty("\u6682\u65E0\u6570\u636E\u3002")}</div>
          </section>
        </div>
      </div>
    </section>
  `;
}
function renderReviewsPage() {
  const groups = getApprovalGroups();
  return `
    <section>
      <div class="page-header"><div><h2>\u5BA1\u6838\u4E2D\u5FC3</h2><p>\u96C6\u4E2D\u5904\u7406\u6CE8\u518C\u5BA1\u6838\u3001\u9AD8\u96BE\u4EFB\u52A1\u52A0\u5165\u5BA1\u6279\u3001\u4EFB\u52A1\u5B8C\u6210\u5BA1\u6838\u3001\u70B9\u6570\u7ED3\u7B97\u4E0E\u8865\u507F\u8BB0\u5F55\u3002</p></div></div>
      <div class="toolbar-row">
        ${renderReviewTabButton("registration", "\u6CE8\u518C\u5BA1\u6838", groups.registration.length)}
        ${renderReviewTabButton("join", "\u52A0\u5165\u5BA1\u6279", groups.join.length)}
        ${renderReviewTabButton("completion", "\u5B8C\u6210\u5BA1\u6838", groups.completion.length)}
        ${renderReviewTabButton("settlement", "\u70B9\u6570\u7ED3\u7B97", groups.settlement.length)}
        ${renderReviewTabButton("compensation", "\u8865\u507F\u8BB0\u5F55", groups.compensation.length)}
        ${renderReviewTabButton("promotion", "\u664B\u5347\u8BB0\u5F55", groups.promotion.length)}
        ${renderReviewTabButton("status_change", "\u53D8\u5C97\u7533\u8BF7", groups.status_change.length)}
      </div>
      <section class="panel"><div class="approval-stack">${renderReviewStack(groups[state.reviewTab])}</div></section>
    </section>
  `;
}
function renderProfilePage() {
  const member = getCurrentMember();
  const stats = getMemberPointSummary(member.id);
  const history2 = getMemberTimeline(member.id);
  const tasks = getCurrentUserTaskRecords();
  return `
    <section>
      <div class="page-header"><div><h2>\u4E2A\u4EBA\u4E2D\u5FC3</h2><p>\u67E5\u770B\u4E2A\u4EBA\u6863\u6848\u3001\u4EFB\u52A1\u8F68\u8FF9\u3001\u79EF\u5206\u6784\u6210\u3001\u9690\u79C1\u8BB0\u5F55\u4E0E\u664B\u5347\u8DEF\u5F84\u3002</p></div></div>
      <div class="page-grid columns-2">
        <section class="panel">
          <div class="section-header"><div><h3>\u57FA\u672C\u4FE1\u606F</h3><p>\u89D2\u8272\u3001\u90E8\u95E8\u3001\u65B9\u5411\u3001\u5175\u79CD\u3001\u6280\u80FD\u6807\u7B7E\u4E0E\u4E2A\u4EBA\u7B80\u4ECB\u3002</p></div></div>
          <div class="definition-list">
            <div class="definition-row"><span>\u59D3\u540D</span><strong>${escapeHtml(member.name)}</strong></div>
            <div class="definition-row"><span>\u6210\u5458\u8EAB\u4EFD</span><strong>${escapeHtml(dictionaries.identities[member.identity])}</strong></div>
            <div class="definition-row"><span>\u90E8\u95E8 / \u65B9\u5411</span><strong>${escapeHtml(member.departments.join(" / "))} / ${escapeHtml(member.directions.join(" / ") || "\u672A\u8BBE\u7F6E")}</strong></div>
            <div class="definition-row"><span>\u5175\u79CD\u7EC4</span><strong>${escapeHtml(member.robotGroups.join(" / ") || "\u672A\u8BBE\u7F6E")}</strong></div>
            <div class="definition-row"><span>\u6280\u80FD\u6807\u7B7E</span><strong>${escapeHtml(member.skillTags.join("\u3001") || "\u6682\u65E0")}</strong></div>
            <div class="definition-row"><span>\u4E2A\u4EBA\u7B80\u4ECB</span><strong>${escapeHtml(member.bio || "\u672A\u586B\u5199")}</strong></div>
          </div>
          <div class="button-row">
            <button class="button-secondary" type="button" data-action="open-profile-content">\u4FEE\u6539\u4E2A\u6027\u5185\u5BB9</button>
            <button class="button-ghost" type="button" data-action="open-password-change">\u4FEE\u6539\u5BC6\u7801</button>
          </div>
          ${member.memberStatus === "retired" ? '<div class="helper-text">\u5F53\u524D\u8D26\u53F7\u5DF2\u9000\u4F11\uFF0C\u4FDD\u7559\u5386\u53F2\u8BB0\u5F55\u5E76\u53EF\u53EA\u8BFB\u6D4F\u89C8\uFF0C\u4F46\u4E0D\u518D\u53C2\u4E0E\u4EFB\u52A1\u3001\u79EF\u5206\u4E0E\u6392\u884C\u3002</div>' : ""}
        </section>
        <section class="panel">
          <div class="section-header"><div><h3>\u79EF\u5206\u603B\u89C8</h3><p>\u7814\u4E60\u70B9\u3001\u5DE5\u65F6\u70B9\u3001\u7BA1\u7406\u70B9\u4E0E\u7EFC\u5408\u8D21\u732E\u3002</p></div></div>
          <div class="metric-grid metric-grid-profile">
            ${renderMetricCard("\u7814\u4E60\u70B9", stats.study, "\u6280\u672F\u5B66\u4E60\u3001\u6587\u6863\u4E0E\u7814\u53D1\u6210\u957F")}
            ${renderMetricCard("\u5DE5\u65F6\u70B9", stats.labor, "\u6267\u884C\u52B3\u52A8\u3001\u8FD0\u7EF4\u4E0E\u8FD0\u8425\u6295\u5165")}
            ${renderMetricCard("\u7BA1\u7406\u70B9", stats.management, "\u8D1F\u8D23\u4EBA\u7EC4\u7EC7\u534F\u8C03\u4E0E\u9A8C\u6536\u8D21\u732E")}
            ${renderMetricCard("\u7EFC\u5408\u8D21\u732E", stats.composite, "\u4E09\u7C7B\u70B9\u6570\u4E4B\u548C")}
            ${renderMetricCard("\u672C\u6708\u5B8C\u6210", tasks.completed.length, "\u672C\u6708\u5DF2\u7ECF\u5B8C\u6210\u5E76\u7ED3\u7B97\u7684\u4EFB\u52A1")}
          </div>
        </section>
      </div>
      <div class="page-grid columns-2">
        <section class="panel">
          <div class="section-header"><div><h3>\u6210\u957F\u4E0E\u8BB0\u5F55</h3><p>\u664B\u5347\u3001\u8865\u507F\u70B9\u3001\u9000\u51FA\u4EFB\u52A1\u4E0E\u903E\u671F\u4EFB\u52A1\u4F1A\u7EDF\u4E00\u8FDB\u5165\u4E2A\u4EBA\u65F6\u95F4\u7EBF\u3002</p></div></div>
          <div class="timeline-grid">${history2.length ? history2.map((item) => renderTimelineCard(item.title, item.description)).join("") : renderEmpty("\u6682\u65E0\u6210\u957F\u8BB0\u5F55\u3002")}</div>
        </section>
        <section class="panel">
          <div class="section-header"><div><h3>\u5F53\u524D\u4EFB\u52A1\u5FEB\u7167</h3><p>\u5FEB\u901F\u67E5\u770B\u6B63\u5728\u8FDB\u884C\u548C\u6700\u8FD1\u5B8C\u6210\u7684\u4EFB\u52A1\u3002</p></div></div>
          <div class="task-stack">
            ${tasks.active.length ? tasks.active.slice(0, 3).map(({ task }) => renderTaskCard(task, { compact: true })).join("") : renderEmpty("\u6682\u65E0\u8FDB\u884C\u4E2D\u7684\u4EFB\u52A1\u3002")}
            ${tasks.completed.length ? tasks.completed.slice(0, 2).map(({ task }) => renderTaskCard(task, { compact: true })).join("") : ""}
          </div>
        </section>
      </div>
      <div class="button-row" style="margin-top:24px;justify-content:flex-start">
        <button class="button-danger" type="button" data-action="open-retire-self">\u7533\u8BF7\u9000\u5F79</button>
        <span class="helper-text">\u9000\u5F79\u540E\u8D26\u53F7\u53D8\u4E3A\u53EA\u8BFB\uFF0C\u4E0D\u518D\u53C2\u4E0E\u4EFB\u52A1\u3001\u79EF\u5206\u4E0E\u6392\u884C\uFF0C\u4F46\u5386\u53F2\u8BB0\u5F55\u4FDD\u7559\u3002</span>
      </div>
    </section>
  `;
}
function renderSettingsPage() {
  const settings = state.database.settings;
  return `
    <section>
      <div class="page-header"><div><h2>\u7CFB\u7EDF\u8BBE\u7F6E</h2><p>\u7BA1\u7406\u5458\u53EF\u7EF4\u62A4\u4EFB\u52A1\u7ED3\u7B97\u4E0E\u5BA1\u6838\u76F8\u5173\u89C4\u5219\uFF0C\u786E\u4FDD\u7AD9\u5185\u6D41\u7A0B\u4E0E\u5B9E\u9645\u5236\u5EA6\u4FDD\u6301\u4E00\u81F4\u3002</p></div></div>
      <form class="panel" data-form="settings">
        <div class="field-grid">
          <label class="field-group"><span class="field-label">\u4E2D\u9014\u52A0\u5165\u6298\u6263</span><input class="field-input" type="number" min="0" max="1" step="0.1" name="middleJoinDiscount" required value="${escapeAttribute(String(settings.middleJoinDiscount))}"></label>
          <label class="field-group"><span class="field-label">\u903E\u671F\u4EFB\u52A1\u79EF\u5206\u6298\u6263</span><input class="field-input" type="number" min="0" max="1" step="0.1" name="overduePointDiscount" required value="${escapeAttribute(String(settings.overduePointDiscount ?? 0.5))}"></label>
          <label class="field-group"><span class="field-label">\u70B9\u6570\u4FDD\u7559\u4F4D\u6570</span><input class="field-input" type="number" min="0" max="2" step="1" name="pointPrecision" required value="${escapeAttribute(String(settings.pointPrecision))}"></label>
        </div>
        <div class="field-grid">
          <label class="field-group"><span class="field-label">\u662F\u5426\u5BF9\u9AD8\u96BE\u4EFB\u52A1\u5F3A\u5236\u5BA1\u6279</span><select class="field-select" name="hardTaskNeedsApproval" required><option value="true" ${settings.hardTaskNeedsApproval ? "selected" : ""}>\u5F3A\u5236\u5BA1\u6279</option><option value="false" ${!settings.hardTaskNeedsApproval ? "selected" : ""}>\u53EF\u624B\u52A8\u5173\u95ED</option></select></label>
        </div>
        <div class="button-row"><button class="button-primary" type="submit" ${state.formLoading === "settings" ? "disabled" : ""}>\u4FDD\u5B58\u8BBE\u7F6E</button></div>
      </form>
      <div class="button-row"><button class="button-secondary" type="button" data-action="load-file-manager">\u6587\u4EF6\u7BA1\u7406</button></div>
    </section>
  `;
}

// client/core/runtime-loader.js
var routeLoaders = {
  dashboard: () => import("./dashboard-P2TDQ7SU.js"),
  market: () => Promise.resolve({ render: renderMarketPage }),
  myTasks: () => import("./my-tasks-RB3BODJQ.js"),
  taskManagement: () => import("./task-management-VU7VD3VI.js"),
  members: () => import("./members-S5UPBFXI.js"),
  projects: () => import("./projects-NFOCANZC.js"),
  rankings: () => import("./rankings-I5RCA57G.js"),
  reviews: () => import("./reviews-3XX3PKN3.js"),
  profile: () => import("./profile-QT5EIKSG.js"),
  settings: () => import("./settings-MXRO2WTK.js")
};
var modalGroupLoaders = {
  approval: () => import("./approval-AO2W3KXY.js"),
  member: () => import("./member-YJ2CQZPC.js"),
  settings: () => import("./settings-WCOF7ZNQ.js"),
  task: () => import("./task-GEGPDETB.js")
};
var modalGroupsByType = {
  "approval-action": "approval",
  "password-change": "approval",
  "promotion-detail": "approval",
  "registration-edit": "approval",
  "registration-review": "approval",
  "role-change-request": "approval",
  "promotion-request": "approval",
  "sensitive-action": "approval",
  "file-manager": "settings",
  "member-detail": "member",
  "member-form": "member",
  "profile-content": "member",
  "retire-form": "member",
  "progress-note-form": "task",
  "share-task": "task",
  "task-attachment-form": "task",
  "task-completion": "task",
  "task-detail": "task",
  "task-form": "task",
  "task-owner-reassign": "task"
};
var workspaceRuntimeModule = null;
var workspaceRuntimePromise = null;
var routeModules = /* @__PURE__ */ new Map();
var routePromises = /* @__PURE__ */ new Map();
var modalGroupModules = /* @__PURE__ */ new Map();
var modalGroupPromises = /* @__PURE__ */ new Map();
function hasCallableExport(module) {
  if (!module) {
    return false;
  }
  if (typeof module.render === "function") {
    return true;
  }
  if (typeof module.default === "function") {
    return true;
  }
  if (module.default && typeof module.default.render === "function") {
    return true;
  }
  return Object.values(module).some((value) => typeof value === "function");
}
function getLoadedWorkspaceRuntime() {
  return workspaceRuntimeModule;
}
function loadWorkspaceRuntime() {
  if (workspaceRuntimeModule) {
    return Promise.resolve(workspaceRuntimeModule);
  }
  if (workspaceRuntimePromise) {
    return workspaceRuntimePromise;
  }
  workspaceRuntimePromise = import("./workspace-runtime-375ASHQK.js").then((module) => {
    workspaceRuntimeModule = module;
    renderApp();
    return module;
  }).catch((error) => {
    workspaceRuntimePromise = null;
    throw error;
  });
  return workspaceRuntimePromise;
}
function getLoadedRouteChunk(routeId) {
  return routeModules.get(routeId) || null;
}
function loadRouteChunk(routeId) {
  const normalizedRoute = routeLoaders[routeId] ? routeId : "dashboard";
  if (routeModules.has(normalizedRoute)) {
    return Promise.resolve(routeModules.get(normalizedRoute));
  }
  if (routePromises.has(normalizedRoute)) {
    return routePromises.get(normalizedRoute);
  }
  const promise = routeLoaders[normalizedRoute]().then((module) => {
    if (!hasCallableExport(module)) {
      throw new Error(`Route chunk "${normalizedRoute}" loaded without callable exports.`);
    }
    routeModules.set(normalizedRoute, module);
    renderApp();
    return module;
  }).catch((error) => {
    routeModules.delete(normalizedRoute);
    throw error;
  }).finally(() => {
    routePromises.delete(normalizedRoute);
  });
  routePromises.set(normalizedRoute, promise);
  return promise;
}
function getModalGroup(modalType) {
  return modalGroupsByType[modalType] || "task";
}
function getLoadedModalChunk(modalType) {
  const groupName = getModalGroup(modalType);
  return modalGroupModules.get(groupName) || null;
}
function loadModalChunk(modalType) {
  const groupName = getModalGroup(modalType);
  if (modalGroupModules.has(groupName)) {
    return Promise.resolve(modalGroupModules.get(groupName));
  }
  if (modalGroupPromises.has(groupName)) {
    return modalGroupPromises.get(groupName);
  }
  const promise = modalGroupLoaders[groupName]().then((module) => {
    if (!hasCallableExport(module)) {
      throw new Error(`Modal chunk "${groupName}" loaded without callable exports.`);
    }
    modalGroupModules.set(groupName, module);
    renderApp();
    return module;
  }).catch((error) => {
    modalGroupModules.delete(groupName);
    throw error;
  }).finally(() => {
    modalGroupPromises.delete(groupName);
  });
  modalGroupPromises.set(groupName, promise);
  return promise;
}

// client/render/core.js
function dismissFlashDom() {
  state.flash = "";
  const element = document.querySelector(".flash-toast");
  if (element) {
    element.classList.remove("is-visible");
    element.style.display = "none";
  }
  state.flashTimer = null;
}
function pushFlashImpl(message, tone = "info") {
  if (state.flashTimer !== null) {
    clearTimeout(state.flashTimer);
  }
  state.flash = message;
  state.flashTone = tone;
  let element = document.querySelector(".flash-toast");
  if (!element) {
    renderAppImpl();
    element = document.querySelector(".flash-toast");
  }
  if (element) {
    element.style.display = "";
    element.className = `flash-toast flash-${tone} is-visible`;
    const textElement = element.querySelector(".flash-text");
    if (textElement) {
      textElement.textContent = message;
    }
  }
  state.flashTimer = setTimeout(() => dismissFlashDom(), 5e3);
}
function renderApp2() {
  renderAppImpl();
}
function renderAppImpl() {
  try {
    if (state.initError) {
      appRoot.innerHTML = renderInitializationErrorShell();
      return;
    }
    if (!state.currentUserId) {
      appRoot.innerHTML = renderAuthShell();
      return;
    }
    if (!state.databaseReady) {
      void loadWorkspaceRuntime();
      void loadRouteChunk(state.route);
      appRoot.innerHTML = renderWorkspaceLoadingShell();
      return;
    }
    const user = getCurrentUserRecord();
    if (!user) {
      state.currentUserId = null;
      saveSession(state.currentUserId);
      appRoot.innerHTML = renderAuthShell();
      return;
    }
    if (user.status !== "active") {
      appRoot.innerHTML = renderWaitingShell(user);
      return;
    }
    const runtime = getLoadedWorkspaceRuntime();
    if (!runtime) {
      void loadWorkspaceRuntime();
      void loadRouteChunk(state.route);
      appRoot.innerHTML = renderWorkspaceLoadingShell(getMemberRecord(user.memberId));
      return;
    }
    runtime.renderWorkspaceRoot(appRoot);
  } catch (error) {
    appRoot.innerHTML = `
      <div style="padding:40px;color:#ff6666">
        <h2>\u6E32\u67D3\u9519\u8BEF</h2>
        <pre style="white-space:pre-wrap">${escapeHtml(error.stack || error.message || String(error))}</pre>
      </div>
    `;
    console.error("renderApp error:", error);
  }
}
function getCurrentUserRecord() {
  return state.database?.users.find((user) => user.id === state.currentUserId) || null;
}
function getMemberRecord(memberId) {
  return state.database?.members.find((member) => member.id === memberId) || null;
}
function renderInitializationErrorShell() {
  const secureContextTip = window.isSecureContext ? "\u5F53\u524D\u5DF2\u662F\u5B89\u5168\u4E0A\u4E0B\u6587\uFF0C\u542F\u52A8\u5931\u8D25\u66F4\u53EF\u80FD\u6765\u81EA\u6D4F\u89C8\u5668\u7F13\u5B58\u6216\u672C\u5730\u6570\u636E\u5F02\u5E38\u3002" : "\u5F53\u524D\u7F51\u5740\u4E0D\u662F\u5B89\u5168\u4E0A\u4E0B\u6587\u3002\u90E8\u5206\u79FB\u52A8\u7AEF\u6D4F\u89C8\u5668\u5728\u666E\u901A HTTP \u7F51\u7A7F\u5730\u5740\u4E0B\u4F1A\u9650\u5236 Web Crypto\uFF0C\u5EFA\u8BAE\u4F18\u5148\u6539\u7528 HTTPS \u7F51\u7A7F\u5730\u5740\u3002";
  return `
    <div class="auth-layout">
      <section class="auth-panel">
        <div class="auth-card glass-card">
          <div class="boot-mark">Lion Hub</div>
          <h1>\u5E94\u7528\u542F\u52A8\u5931\u8D25</h1>
          <p>\u521D\u59CB\u5316\u6210\u5458\u3001\u4EFB\u52A1\u4E0E\u767B\u5F55\u6570\u636E\u65F6\u53D1\u751F\u9519\u8BEF\uFF0C\u9875\u9762\u5DF2\u505C\u6B62\u5728\u5B89\u5168\u9519\u8BEF\u6001\u3002</p>
          <div class="panel">
            <div class="definition-list">
              <div class="definition-row"><span>\u9519\u8BEF\u4FE1\u606F</span><strong>${escapeHtml(state.initError)}</strong></div>
              <div class="definition-row"><span>\u5F53\u524D\u73AF\u5883</span><strong>${window.isSecureContext ? "\u5B89\u5168\u4E0A\u4E0B\u6587" : "\u975E\u5B89\u5168\u4E0A\u4E0B\u6587"}</strong></div>
            </div>
          </div>
          <div class="feedback error">${escapeHtml(secureContextTip)}</div>
        </div>
      </section>
      <aside class="auth-aside">
        <div class="hero-panel glass-card">
          <div class="brand-badge">Startup Diagnostics</div>
          <h2>\u5982\u679C\u4F60\u662F\u901A\u8FC7\u7F51\u7A7F\u5730\u5740\u5728\u624B\u673A\u4E0A\u6253\u5F00\uFF0C\u8FD9\u91CC\u6700\u5E38\u89C1\u7684\u95EE\u9898\u662F\u4F7F\u7528\u4E86 HTTP \u800C\u4E0D\u662F HTTPS\u3002</h2>
          <p>\u82E5\u4ECD\u5931\u8D25\uFF0C\u8BF7\u5F3A\u5236\u5237\u65B0\u9875\u9762\uFF0C\u6216\u6E05\u6389\u6D4F\u89C8\u5668\u7AD9\u70B9\u7F13\u5B58\u540E\u91CD\u8BD5\u3002</p>
        </div>
      </aside>
    </div>
  `;
}
function renderAuthShell() {
  const hydrationMessage = state.databaseHydrating ? "\u6B63\u5728\u8FDE\u63A5\u5171\u4EAB\u670D\u52A1\u3002\u63D0\u4EA4\u6CE8\u518C\u6216\u767B\u5F55\u540E\u4F1A\u7EE7\u7EED\u540C\u6B65\u6240\u9700\u6570\u636E\u3002" : "\u9996\u5C4F\u4E0D\u4F1A\u81EA\u52A8\u62C9\u53D6\u5168\u91CF\u5171\u4EAB\u6570\u636E\uFF0C\u53EA\u6709\u767B\u5F55\u6210\u529F\u6216\u63D0\u4EA4\u6CE8\u518C\u65F6\u624D\u4F1A\u540C\u6B65\u3002";
  return `
    <div class="auth-layout">
      <section class="auth-panel">
        <div class="auth-card glass-card">
          <div class="auth-meta">
            <span>RoboMaster \u5185\u90E8\u534F\u4F5C\u5E73\u53F0</span>
            <span>Team Workspace</span>
          </div>
          <div class="boot-mark">Lion Hub</div>
          <h1>${state.authMode === "login" ? "\u8FDB\u5165\u6218\u961F\u534F\u4F5C\u4E2D\u67A2" : "\u63D0\u4EA4\u6CE8\u518C\u8FDB\u5165\u5BA1\u6838\u6D41"}</h1>
          <p>${state.authMode === "login" ? "\u652F\u6301\u90AE\u7BB1 + \u5BC6\u7801\u767B\u5F55\u3002\u5F85\u5BA1\u6838\u8D26\u53F7\u767B\u5F55\u540E\u4F1A\u8FDB\u5165\u5BA1\u6838\u4E2D\u9875\u9762\u3002" : "\u6CE8\u518C\u540E\u81EA\u52A8\u8FDB\u5165\u5F85\u5BA1\u6838\u72B6\u6001\uFF0C\u7531\u7BA1\u7406\u5458\u5206\u914D\u8EAB\u4EFD\u3001\u90E8\u95E8\u4E0E\u7CFB\u7EDF\u6743\u9650\u3002"}</p>
          ${state.authMode === "login" ? renderLoginForm() : renderRegisterForm()}
          <div class="helper-text" style="margin-top:12px">${escapeHtml(hydrationMessage)}</div>
          <div class="feedback ${state.authFeedback ? "error" : ""}">${escapeHtml(state.authFeedback || "")}</div>
        </div>
      </section>
      <aside class="auth-aside">
        <div class="hero-panel glass-card">
          <div class="brand-badge">Lion Hub Workspace</div>
          <h2>\u4EFB\u52A1\u534F\u4F5C\u3001\u5BA1\u6838\u6D41\u8F6C\u3001\u79EF\u5206\u8BB0\u5F55\u548C\u5175\u79CD\u8FDB\u5EA6\u7EDF\u4E00\u5728\u4E00\u4E2A\u5DE5\u4F5C\u53F0\u91CC\u5B8C\u6210\u3002</h2>
          <p>\u8FD9\u91CC\u7528\u4E8E\u6218\u961F\u65E5\u5E38\u534F\u4F5C\u4E0E\u4EFB\u52A1\u63A8\u8FDB\u3002\u961F\u5458\u53EF\u4EE5\u67E5\u770B\u516C\u5F00\u4EFB\u52A1\u3001\u53C2\u4E0E\u6267\u884C\u3001\u63D0\u4EA4\u6210\u679C\u3001\u8DDF\u8FDB\u5BA1\u6838\uFF0C\u4E5F\u53EF\u4EE5\u5728\u4E2A\u4EBA\u4E2D\u5FC3\u7EF4\u62A4\u81EA\u5DF1\u7684\u4E2A\u6027\u5185\u5BB9\u3001\u4EFB\u52A1\u8BB0\u5F55\u548C\u6210\u957F\u8F68\u8FF9\u3002</p>
          <div class="hero-grid">
            <div class="hero-block"><h3>\u516C\u5F00\u4EFB\u52A1\u5E02\u573A</h3><p>\u652F\u6301\u6309\u4EFB\u52A1\u7C7B\u578B\u3001\u90E8\u95E8\u3001\u65B9\u5411\u548C\u5175\u79CD\u7B5B\u9009\uFF0C\u5FEB\u901F\u627E\u5230\u9002\u5408\u81EA\u5DF1\u7684\u4EFB\u52A1\u5E76\u67E5\u770B\u8BE6\u60C5\u3002</p></div>
            <div class="hero-block"><h3>\u5B8C\u6574\u534F\u4F5C\u94FE\u8DEF</h3><p>\u4ECE\u9886\u53D6\u4EFB\u52A1\u3001\u66F4\u65B0\u8FDB\u5EA6\u3001\u4E0A\u4F20\u9644\u4EF6\u5230\u63D0\u4EA4\u5BA1\u6838\uFF0C\u6240\u6709\u5173\u952E\u52A8\u4F5C\u90FD\u4F1A\u5728\u7AD9\u5185\u7559\u75D5\u3002</p></div>
            <div class="hero-block"><h3>\u5BA1\u6838\u4E0E\u79EF\u5206</h3><p>\u9AD8\u96BE\u4EFB\u52A1\u5BA1\u6279\u3001\u5B8C\u6210\u5BA1\u6838\u3001\u70B9\u6570\u7ED3\u7B97\u548C\u8865\u507F\u8BB0\u5F55\u4F1A\u7EDF\u4E00\u5F52\u6863\uFF0C\u65B9\u4FBF\u540E\u7EED\u590D\u76D8\u548C\u7EDF\u8BA1\u3002</p></div>
            <div class="hero-block"><h3>\u4E2A\u4EBA\u6210\u957F\u89C6\u56FE</h3><p>\u6BCF\u4F4D\u6210\u5458\u90FD\u53EF\u4EE5\u5728\u4E2A\u4EBA\u4E2D\u5FC3\u67E5\u770B\u4E2A\u6027\u5185\u5BB9\u3001\u53C2\u4E0E\u8BB0\u5F55\u3001\u79EF\u5206\u6784\u6210\u548C\u6700\u8FD1\u5B8C\u6210\u7684\u4EFB\u52A1\u5FEB\u7167\u3002</p></div>
          </div>
        </div>
      </aside>
    </div>
  `;
}
function renderLoginForm() {
  return `
    <form class="auth-form" data-form="login">
      <label class="field-group"><span class="field-label">\u90AE\u7BB1</span><input class="field-input" type="email" name="email" placeholder="name@example.com" required></label>
      <label class="field-group"><span class="field-label">\u5BC6\u7801</span><input class="field-input" type="password" name="password" placeholder="\u8BF7\u8F93\u5165\u5BC6\u7801" required></label>
      <label class="field-group" style="flex-direction:row;align-items:center;gap:8px"><input type="checkbox" name="rememberMe" checked ${state.rememberMe ? "checked" : ""} style="width:18px;height:18px;accent-color:white"> <span class="helper-text">\u8BB0\u4F4F\u767B\u5F55\u72B6\u6001</span></label>
      <div class="button-row"><button class="button-primary" type="submit" ${state.formLoading === "login" ? "disabled" : ""}>\u767B\u5F55</button><button class="button-ghost" type="button" data-action="switch-auth" data-mode="register">\u6CE8\u518C\u65B0\u8D26\u53F7</button></div>
    </form>
  `;
}
function renderRegisterForm() {
  return `
    <form class="auth-form" data-form="register">
      <div class="field-grid">
        <label class="field-group"><span class="field-label">\u7528\u6237\u540D</span><input class="field-input" type="text" name="username" placeholder="\u7528\u4E8E\u7CFB\u7EDF\u5C55\u793A" required></label>
        <label class="field-group"><span class="field-label">\u59D3\u540D</span><input class="field-input" type="text" name="name" placeholder="\u771F\u5B9E\u59D3\u540D\u6216\u6218\u961F\u5185\u59D3\u540D" required></label>
      </div>
      <div class="field-grid">
        <label class="field-group"><span class="field-label">\u90AE\u7BB1</span><input class="field-input" type="email" name="email" placeholder="\u7528\u4E8E\u767B\u5F55" required></label>
        <label class="field-group"><span class="field-label">\u624B\u673A\u53F7</span><input class="field-input" type="tel" name="phone" placeholder="\u7528\u4E8E\u8054\u7CFB" required></label>
      </div>
      <label class="field-group"><span class="field-label">\u5BC6\u7801</span><input class="field-input" type="password" name="password" placeholder="\u8BBE\u7F6E\u767B\u5F55\u5BC6\u7801" required></label>
      <label class="field-group"><span class="field-label">\u786E\u8BA4\u5BC6\u7801</span><input class="field-input" type="password" name="confirmPassword" placeholder="\u518D\u6B21\u8F93\u5165\u5BC6\u7801" required></label>
      <div class="field-grid">
        <label class="field-group"><span class="field-label">\u610F\u5411\u7EC4\u522B</span><select class="field-select" name="department" required>${renderSelectOptions2(options.departments)}</select></label>
        <label class="field-group"><span class="field-label">\u6280\u80FD\u6807\u7B7E</span><input class="field-input" type="text" name="skills" placeholder="\u7528\u9017\u53F7\u5206\u9694\uFF0C\u4F8B\u5982 C, ROS, OpenCV"></label>
      </div>
      <label class="field-group"><span class="field-label">\u4E2A\u4EBA\u7B80\u4ECB</span><textarea class="field-textarea" name="bio" placeholder="\u7B80\u5355\u4ECB\u7ECD\u64C5\u957F\u65B9\u5411\u3001\u53C2\u4E0E\u7ECF\u5386\u6216\u5E0C\u671B\u627F\u62C5\u7684\u5DE5\u4F5C"></textarea></label>
      <div class="button-row"><button class="button-primary" type="submit" ${state.formLoading === "register" ? "disabled" : ""}>\u63D0\u4EA4\u6CE8\u518C</button><button class="button-ghost" type="button" data-action="switch-auth" data-mode="login">\u8FD4\u56DE\u767B\u5F55</button></div>
    </form>
  `;
}
function renderWaitingShell(user) {
  const member = getMemberRecord(user.memberId);
  const isRejected = user.status === "rejected";
  const isDisabled = user.status === "disabled";
  return `
    <div class="auth-layout">
      <section class="auth-panel">
        <div class="auth-card glass-card">
          <div class="boot-mark">${isDisabled ? "Account Disabled" : isRejected ? "Review Result" : "Pending Review"}</div>
          <h1>${isDisabled ? "\u8D26\u53F7\u5DF2\u505C\u7528" : isRejected ? "\u5BA1\u6838\u672A\u901A\u8FC7" : "\u8D26\u53F7\u5BA1\u6838\u4E2D"}</h1>
          <p>${isDisabled ? "\u5F53\u524D\u8D26\u53F7\u5DF2\u88AB\u7BA1\u7406\u5458\u505C\u7528\uFF0C\u6682\u65F6\u4E0D\u80FD\u8FDB\u5165\u5DE5\u4F5C\u53F0\u3002\u5982\u9700\u6062\u590D\uFF0C\u8BF7\u8054\u7CFB\u7BA1\u7406\u5458\u5904\u7406\u3002" : isRejected ? "\u5F53\u524D\u8D26\u53F7\u5C1A\u672A\u8FDB\u5165\u6B63\u5F0F\u7CFB\u7EDF\uFF0C\u8BF7\u8054\u7CFB\u7BA1\u7406\u5458\u4FEE\u6B63\u8D44\u6599\u540E\u91CD\u65B0\u63D0\u4EA4\u3002" : "\u7BA1\u7406\u5458\u4F1A\u5728\u5BA1\u6838\u4E2D\u5FC3\u5206\u914D\u6210\u5458\u8EAB\u4EFD\u3001\u90E8\u95E8\u3001\u5175\u79CD\u4E0E\u7CFB\u7EDF\u6743\u9650\uFF0C\u5BA1\u6838\u901A\u8FC7\u540E\u5373\u53EF\u8FDB\u5165\u5B8C\u6574\u5DE5\u4F5C\u53F0\u3002"}</p>
          <div class="panel">
            <div class="definition-list">
              <div class="definition-row"><span>\u7533\u8BF7\u4EBA</span><strong>${escapeHtml(member?.name || user.username)}</strong></div>
              <div class="definition-row"><span>\u90AE\u7BB1</span><strong>${escapeHtml(user.email)}</strong></div>
              <div class="definition-row"><span>\u610F\u5411\u7EC4\u522B</span><strong>${escapeHtml((member?.departments || []).join(" / ") || "\u672A\u586B\u5199")}</strong></div>
            </div>
          </div>
          <div class="button-row">
            ${!isDisabled ? '<button class="button-primary" type="button" data-action="open-registration-edit">\u4FEE\u6539\u4FE1\u606F</button>' : ""}
            ${!isDisabled ? '<button class="button-danger" type="button" data-action="cancel-registration">\u53D6\u6D88\u6CE8\u518C</button>' : ""}
            <button class="button-secondary" type="button" data-action="logout">\u9000\u51FA\u8D26\u53F7</button>
          </div>
        </div>
      </section>
      <aside class="auth-aside">
        <div class="hero-panel glass-card">
          <div class="brand-badge">Approval Pipeline</div>
          <h2>\u6CE8\u518C\u7533\u8BF7\u4F1A\u76F4\u63A5\u8FDB\u5165\u5BA1\u6838\u4E2D\u5FC3\u3002</h2>
          <p>\u7BA1\u7406\u5458\u53EF\u5728\u5BA1\u6838\u4E2D\u5FC3\u67E5\u770B\u6CE8\u518C\u7533\u8BF7\uFF0C\u5E76\u4E3A\u4F60\u8BBE\u7F6E\u6210\u5458\u8EAB\u4EFD\u3001\u6743\u9650\u89D2\u8272\u3001\u6240\u5C5E\u90E8\u95E8\u3001\u65B9\u5411\u4E0E\u5175\u79CD\u6807\u7B7E\u3002</p>
        </div>
      </aside>
    </div>
  `;
}
function renderWorkspaceLoadingShell(member = null) {
  const currentRoute = routes.find((route) => route.id === state.route);
  const routeLabel = currentRoute ? currentRoute.label : "\u5F53\u524D\u9875\u9762";
  const routeButtons = routes.map((route) => `<button type="button" class="nav-item ${route.id === state.route ? "is-active" : ""}" data-action="navigate" data-route="${route.id}"><span>${route.label}</span></button>`).join("");
  return `
    <div class="workspace">
      <aside class="sidebar ${state.mobileNavOpen ? "is-open" : ""}">
        <div class="brand">
          <div class="brand-badge">Lion Hub</div>
          <h1>\u9192\u72EE\u6218\u961F\u534F\u4F5C\u4E2D\u67A2</h1>
          <p>\u6210\u5458\u3001\u4EFB\u52A1\u3001\u5BA1\u6838\u3001\u79EF\u5206\u4E0E\u5175\u79CD\u8FDB\u5EA6\u7684\u4E00\u4F53\u5316\u5DE5\u4F5C\u53F0\u3002</p>
        </div>
        <div class="nav-group">
          <div class="nav-label">Workspace</div>
          ${routeButtons}
        </div>
        <div class="sidebar-footer">
          <strong>${escapeHtml(member?.name || "\u6B63\u5728\u6062\u590D\u4F1A\u8BDD")}</strong>
          <span>${escapeHtml(member ? `${dictionaries.identities[member.identity]} \xB7 ${dictionaries.roles[member.role]}` : "\u540C\u6B65\u6210\u5458\u8D44\u6599\u4E2D")}</span>
          <span class="helper-text">${escapeHtml(member?.departments?.join(" / ") || "\u9996\u6B21\u8FDB\u5165\u4F1A\u5148\u52A0\u8F7D\u5DE5\u4F5C\u53F0\u6570\u636E")}</span>
          <div class="button-row">
            <button class="button-secondary" type="button" data-action="navigate" data-route="profile">\u4E2A\u4EBA\u4E2D\u5FC3</button>
            <button class="button-ghost" type="button" data-action="logout">\u9000\u51FA</button>
          </div>
        </div>
      </aside>
      <main class="main-area">
        <div class="topbar">
          <div class="search-shell">
            <button class="button-ghost mobile-toggle" type="button" data-action="toggle-nav">\u83DC\u5355</button>
            <input type="text" placeholder="\u6B63\u5728\u88C5\u8F7D\u5DE5\u4F5C\u53F0\u6570\u636E\u2026" value="" disabled>
          </div>
          <div class="topbar-actions">
            <span class="topbar-chip">\u540C\u6B65\u4E2D</span>
          </div>
        </div>
        <div class="page-content">
          <section>
            <div class="page-header">
              <div><h2>${escapeHtml(routeLabel)}</h2><p>\u6B63\u5728\u540C\u6B65\u9996\u5C4F\u6570\u636E\u4E0E\u9875\u9762\u8D44\u6E90\uFF0C\u5DE5\u4F5C\u53F0\u58F3\u5C42\u5DF2\u5148\u663E\u793A\u3002</p></div>
            </div>
            <section class="panel">
              <div class="empty-state">\u6B63\u5728\u52A0\u8F7D\u5F53\u524D\u9875\u9762\u5185\u5BB9\u2026</div>
            </section>
          </section>
        </div>
      </main>
      <div class="backdrop ${state.mobileNavOpen ? "is-open" : ""}" data-action="close-overlay"></div>
    </div>
  `;
}
function renderSelectOptions2(values, selectedValue = "", labels = null) {
  return values.map((value) => {
    const selected = value === selectedValue ? "selected" : "";
    const label = labels ? labels[value] : value;
    return `<option value="${escapeAttribute(value)}" ${selected}>${escapeHtml(label)}</option>`;
  }).join("");
}
setServices({ pushFlash: pushFlashImpl, renderApp: renderAppImpl });

// client/core/modal.js
function pushModal(nextModal) {
  if (state.modal) {
    state.modalStack.push(state.modal);
  }
  state.modal = nextModal;
  renderApp2();
}
function replaceModal(nextModal) {
  state.modal = nextModal;
  renderApp2();
}
function popModal() {
  if (state.modalStack.length > 0) {
    state.modal = state.modalStack.pop();
  } else {
    state.modal = null;
  }
  window.scrollTo(0, state.modalScrollY || 0);
  renderApp2();
}
function clearModalStack() {
  state.modalStack = [];
  state.modal = null;
  renderApp2();
}
function isModalOpen() {
  return Boolean(state.modal);
}

// client/core/router.js
var _initialized = false;
function initRouter() {
  if (_initialized) return;
  _initialized = true;
  window.addEventListener("popstate", (event) => {
    if (isModalOpen()) {
      popModal();
      const currentRoute = state.route;
      history.pushState({ route: currentRoute, modal: false }, "", `#${currentRoute}`);
      renderApp2();
      return;
    }
    const route = _readHashRoute();
    if (route && route !== state.route) {
      _applyRoute(route, { pushState: false });
    }
  });
}
function navigateTo(routeId, options2 = {}) {
  const { clearModals = true, pushState = true } = options2;
  if (clearModals) {
    clearModalStack();
  }
  _applyRoute(routeId, { pushState });
}
function _readHashRoute() {
  const hash = window.location.hash.replace("#", "").trim();
  return routes.some((route) => route.id === hash) ? hash : "";
}
function _applyRoute(routeId, { pushState = true } = {}) {
  state.route = routeId;
  state.mobileNavOpen = false;
  state.loadingRoute = true;
  if (pushState && window.location.hash !== `#${routeId}`) {
    history.pushState({ route: routeId, modal: false }, "", `#${routeId}`);
  }
  renderApp2();
  requestAnimationFrame(() => {
    state.loadingRoute = false;
  });
}

// client/core/database.js
var hydrationPromise = null;
var sharedSyncTimer = null;
function initialize() {
  const rememberedUserId = loadSession();
  if (rememberedUserId && !loadApiKey()) {
    clearSession();
    state.currentUserId = null;
    state.authFeedback = "\u767B\u5F55\u72B6\u6001\u5DF2\u8FC7\u671F\uFF0C\u8BF7\u91CD\u65B0\u767B\u5F55\u3002";
  } else {
    state.currentUserId = rememberedUserId;
  }
  state.route = _readHashRoute2() || "dashboard";
  state.initError = "";
  state.databaseReady = false;
  state.databaseHydrating = false;
  clearLegacyLocalDatabase();
  initRouter();
  if (state.currentUserId) {
    void hydrateDatabase();
  }
}
function ensureDatabaseReady() {
  return hydrateDatabase();
}
function ensureSharedDataSync() {
  if (state.currentUserId) {
    startSharedDataSync();
  }
}
async function hydrateDatabase() {
  if (state.databaseReady) {
    return state.database;
  }
  if (hydrationPromise) {
    return hydrationPromise;
  }
  state.databaseHydrating = true;
  hydrationPromise = loadDatabase().then(async (database) => {
    state.database = database;
    state.databaseReady = true;
    state.databaseHydrating = false;
    state.initError = "";
    await runPostHydrationTasks();
    ensureSharedDataSync();
    renderApp();
    return database;
  }).catch((error) => {
    console.error("Failed to hydrate application database:", error);
    state.databaseReady = false;
    state.databaseHydrating = false;
    state.initError = formatInitializationError(error);
    renderApp();
    throw error;
  }).finally(() => {
    hydrationPromise = null;
  });
  renderApp();
  return hydrationPromise;
}
async function runPostHydrationTasks() {
  if (!state.currentUserId) {
    return;
  }
  const [{ cleanupOrphanedNotifications }, { ensureVisibleRoute }] = await Promise.all([
    import("./notifications-RXPTLCLF.js"),
    import("./permissions-IRK45WAC.js")
  ]);
  cleanupOrphanedNotifications();
  ensureVisibleRoute();
}
function formatInitializationError(error) {
  return error instanceof Error ? error.message : String(error);
}
async function loadDatabase() {
  const snapshot = await fetchDatabaseSnapshot();
  if (snapshot.database) {
    state.databaseVersion = Number(snapshot.version || 0);
    normalizeDatabaseRoles(snapshot.database);
    migrateProgressNodes(snapshot.database);
    return snapshot.database;
  }
  throw new Error("\u670D\u52A1\u5668\u672A\u8FD4\u56DE\u521D\u59CB\u5316\u6570\u636E\uFF0C\u8BF7\u68C0\u67E5\u672C\u5730\u670D\u52A1\u662F\u5426\u5DF2\u5B8C\u6210\u7AD9\u70B9\u521D\u59CB\u5316\u3002");
}
function normalizeDatabaseRoles(database) {
  if (!database || !Array.isArray(database.members)) {
    return;
  }
  for (const member of database.members) {
    const expectedRole = dictionaries.identityRoleMap[member.identity] || member.role;
    if (member.role !== expectedRole) {
      member.role = expectedRole;
    }
  }
}
function migrateProgressNodes(database) {
  if (!database || !Array.isArray(database.tasks)) return;
  for (const task of database.tasks) {
    if (!Array.isArray(task.progressNodes)) {
      task.progressNodes = [];
    }
    if (!Array.isArray(task.comments)) continue;
    const progressComments = task.comments.filter((comment) => comment.title === "\u8FDB\u5EA6\u66F4\u65B0");
    for (const comment of progressComments) {
      const existing = task.progressNodes.some((node) => node.id === comment.id);
      if (!existing) {
        task.progressNodes.push({
          id: comment.id,
          taskId: task.id,
          percent: task.progressPercent || 0,
          note: comment.content || "",
          attachments: [],
          createdAt: comment.createdAt,
          authorId: comment.authorId
        });
      }
    }
  }
}
async function saveDatabase(database = state.database) {
  try {
    const savedSnapshot = await writeDatabaseSnapshot(database, state.databaseVersion);
    if (!savedSnapshot) {
      throw new Error("\u670D\u52A1\u5668\u8FD4\u56DE\u6570\u636E\u4E3A\u7A7A\uFF0C\u8BF7\u5237\u65B0\u9875\u9762\u540E\u91CD\u8BD5\u3002");
    }
    state.databaseVersion = savedSnapshot.version;
    return true;
  } catch (error) {
    await recoverFromPersistenceFailure(error);
    return false;
  }
}
function clearLegacyLocalDatabase() {
  localStorage.removeItem(LEGACY_STORAGE_KEY);
}
async function synchronizeDatabaseFromServer() {
  try {
    const snapshot = await fetchDatabaseSnapshot();
    if (!snapshot.database) {
      return false;
    }
    state.database = snapshot.database;
    normalizeDatabaseRoles(state.database);
    migrateProgressNodes(state.database);
    state.databaseVersion = Number(snapshot.version || 0);
    return true;
  } catch (error) {
    console.error("Failed to synchronize database:", error);
    return false;
  }
}
function startSharedDataSync() {
  if (sharedSyncTimer !== null) {
    return;
  }
  const timer = window.setInterval(() => {
    void refreshDatabaseQuietly();
  }, SHARED_SYNC_INTERVAL_MS);
  sharedSyncTimer = timer;
  setSharedSyncTimer(timer);
}
async function refreshDatabaseQuietly() {
  if (!state.currentUserId || !state.databaseReady || !state.database || state.initError || shouldPauseSharedSync()) {
    return;
  }
  try {
    const diffResult = await requestJson(`/api/database/diff?from_version=${state.databaseVersion}`);
    const serverVersion = Number(diffResult.version || 0);
    if (!serverVersion || serverVersion <= state.databaseVersion) {
      return;
    }
    if (diffResult.database) {
      state.database = diffResult.database;
      normalizeDatabaseRoles(state.database);
      migrateProgressNodes(state.database);
    } else if (diffResult.diff) {
      applyDiff(state.database, diffResult.diff);
    }
    state.databaseVersion = serverVersion;
    renderApp();
  } catch (error) {
    console.error("Shared sync skipped:", error);
  }
}
function applyDiff(database, diff) {
  const collectionKeys = ["users", "members", "tasks", "taskParticipants", "approvals", "pointTransactions", "notifications", "robotProjects"];
  for (const key of collectionKeys) {
    const changes = diff[key];
    if (!changes) continue;
    const list = database[key];
    if (!Array.isArray(list)) continue;
    for (const id of changes.removed || []) {
      const index = list.findIndex((item) => item.id === id);
      if (index !== -1) {
        list.splice(index, 1);
      }
    }
    for (const item of changes.updated || []) {
      const existing = list.find((current) => current.id === item.id);
      if (existing) {
        Object.assign(existing, item);
      }
    }
    for (const item of changes.added || []) {
      if (!list.some((current) => current.id === item.id)) {
        list.unshift(item);
      }
    }
  }
  if (diff.settings) {
    database.settings = diff.settings;
  }
}
function shouldPauseSharedSync() {
  if (document.hidden) {
    return true;
  }
  const activeElement = document.activeElement;
  if (activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement || activeElement instanceof HTMLSelectElement) {
    return true;
  }
  return state.modal?.type === "task-form" || state.modal?.type === "task-detail" || state.modal?.type === "member-form" || state.modal?.type === "profile-content" || state.modal?.type === "registration-edit" || state.modal?.type === "sensitive-action" || state.modal?.type === "task-owner-reassign" || state.modal?.type === "registration-review" || state.modal?.type === "task-completion" || state.modal?.type === "progress-note-form" || state.modal?.type === "task-attachment-form";
}
async function recoverFromPersistenceFailure(error) {
  console.error("Failed to persist shared database:", error);
  const synchronized = await synchronizeDatabaseFromServer();
  if (error.status === 401) {
    state.currentUserId = null;
    state.databaseReady = false;
    clearSession();
    state.authFeedback = "\u767B\u5F55\u72B6\u6001\u5DF2\u5931\u6548\uFF0C\u8BF7\u91CD\u65B0\u767B\u5F55\u540E\u518D\u7EE7\u7EED\u64CD\u4F5C\u3002";
    renderApp();
    pushFlash("\u767B\u5F55\u51ED\u636E\u5DF2\u5931\u6548\uFF0C\u5F53\u524D\u5DF2\u9000\u51FA\u767B\u5F55\u3002", "info");
    return;
  }
  if (error.status === 409) {
    pushFlash(
      synchronized ? "\u5171\u4EAB\u6570\u636E\u5DF2\u88AB\u5176\u4ED6\u8BBE\u5907\u66F4\u65B0\uFF0C\u5F53\u524D\u9875\u9762\u5DF2\u81EA\u52A8\u540C\u6B65\uFF0C\u8BF7\u91CD\u65B0\u6267\u884C\u521A\u624D\u64CD\u4F5C\u3002" : "\u5171\u4EAB\u6570\u636E\u5DF2\u88AB\u5176\u4ED6\u8BBE\u5907\u66F4\u65B0\uFF0C\u8BF7\u5237\u65B0\u9875\u9762\u540E\u91CD\u8BD5\u3002",
      "info"
    );
    return;
  }
  const message = error instanceof Error && error.message ? error.message : "\u672A\u77E5\u9519\u8BEF";
  pushFlash(
    synchronized ? `\u4FDD\u5B58\u5931\u8D25\uFF0C\u5DF2\u6062\u590D\u5230\u7535\u8111\u4E0A\u7684\u6700\u65B0\u6570\u636E\uFF1A${message}` : `\u4FDD\u5B58\u5931\u8D25\uFF1A${message}`,
    "info"
  );
}
function _readHashRoute2() {
  const hash = window.location.hash.replace("#", "").trim();
  const validRoutes = ["dashboard", "market", "myTasks", "taskManagement", "members", "projects", "rankings", "reviews", "profile", "settings"];
  return validRoutes.includes(hash) ? hash : "";
}

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
  if (task.status === "completed") {
    pushFlash("\u5DF2\u5B8C\u6210\u4EFB\u52A1\u4E0D\u80FD\u518D\u9886\u53D6\u3002", "info");
    return;
  }
  if (task.status === "pending_review") {
    pushFlash("\u5F53\u524D\u4EFB\u52A1\u6B63\u5728\u5BA1\u6838\u4E2D\uFF0C\u4E0D\u80FD\u518D\u9886\u53D6\u3002", "info");
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
function getTaskSettlementPreview(task) {
  const preview = buildTaskSettlementPreview(task);
  return {
    memberSettlements: preview.memberSettlements,
    middleJoinDiscount: preview.middleJoinDiscount,
    overdueDiscount: preview.overdueDiscount,
    pendingTransactions: preview.pendingTransactions,
    totalWeight: preview.totalWeight,
    totals: preview.totals,
    wasOverdue: preview.wasOverdue
  };
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
      wasOverdue: false
    };
  }
  const wasOverdue = task.dueAt && new Date(task.dueAt).getTime() < new Date(task.submittedAt || task.completedAt || (/* @__PURE__ */ new Date()).toISOString()).getTime();
  const overdueDiscount = wasOverdue ? state.database.settings.overduePointDiscount ?? 0.5 : 1;
  const middleJoinDiscount = state.database.settings.middleJoinDiscount ?? 0.5;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const operatorId = getCurrentMember().id;
  const weightedParticipants = participants.map((participant) => ({
    participant,
    member: getMemberById(participant.memberId),
    weight: participant.contributionRatio * (participant.joinType === "middle" ? middleJoinDiscount : 1) * overdueDiscount
  }));
  const totalWeight = weightedParticipants.reduce((sum, item) => sum + item.weight, 0);
  const pendingTransactions = [];
  const memberSettlements = [];
  for (const { participant, member, weight } of weightedParticipants) {
    const eligible = canMemberAccruePoints(member);
    const studyAmount = eligible && totalWeight > 0 ? roundPointFromSettings(task.studyPoints * weight / totalWeight) : 0;
    const laborAmount = eligible && totalWeight > 0 ? roundPointFromSettings(task.laborPoints * weight / totalWeight) : 0;
    if (studyAmount < 0 || laborAmount < 0) {
      console.error("buildTaskSettlementPreview: negative amount detected, aborting preview.");
      return {
        memberSettlements: [],
        middleJoinDiscount,
        overdueDiscount,
        pendingTransactions: [],
        totalWeight: 0,
        totals: { study: 0, labor: 0, management: 0, total: 0 },
        wasOverdue
      };
    }
    if (eligible) {
      pendingTransactions.push(
        { id: uid("point"), memberId: participant.memberId, taskId: task.id, type: "study", amount: studyAmount, reason: `${task.title} \u7814\u4E60\u70B9\u7ED3\u7B97`, operatorId, createdAt: now },
        { id: uid("point"), memberId: participant.memberId, taskId: task.id, type: "labor", amount: laborAmount, reason: `${task.title} \u5DE5\u65F6\u70B9\u7ED3\u7B97`, operatorId, createdAt: now }
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
      totalAmount: roundPointFromSettings(studyAmount + laborAmount)
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
        wasOverdue
      };
    }
    if (ownerEligible) {
      pendingTransactions.push(
        { id: uid("point"), memberId: task.ownerId, taskId: task.id, type: "management", amount: managementAmount, reason: `${task.title} \u7BA1\u7406\u70B9\u7ED3\u7B97`, operatorId, createdAt: now }
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
        totalAmount: managementAmount
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
    wasOverdue
  };
}

export {
  pushFlash,
  renderApp,
  addDays,
  toDateTimeLocalValue,
  formatDateTime,
  addRecord,
  removeWhere,
  pushModal,
  replaceModal,
  popModal,
  clearModalStack,
  navigateTo,
  initialize,
  ensureDatabaseReady,
  ensureSharedDataSync,
  saveDatabase,
  refreshDatabaseQuietly,
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
  getTaskSettlementPreview,
  handleCompensationForm,
  handleRatioForm,
  deletePointTransaction,
  renderSelectOptions,
  renderMultiSelectOptions,
  renderEmpty,
  renderPointPill,
  renderTimelineCard,
  renderAttachmentCard,
  renderFilterField,
  renderFilterSelect,
  getPendingApprovalCount,
  renderMemberDetail,
  renderTaskDetail,
  renderDashboardPage,
  renderMyTasksPage,
  renderTaskManagementPage,
  renderMembersPage,
  renderProjectsPage,
  renderRankingsPage,
  renderReviewsPage,
  renderProfilePage,
  renderSettingsPage,
  getLoadedRouteChunk,
  loadRouteChunk,
  getLoadedModalChunk,
  loadModalChunk,
  renderApp2
};
