import {
  getLatestSubmissionSummary
} from "./chunk-EY4W4HEE.js";
import {
  getJoinActionLabel,
  getMemberLoads,
  getMemberPointSummary
} from "./chunk-4ZHULIGH.js";
import {
  canDeleteApprovalRecord,
  canDeleteTaskGeneratedData,
  canReview,
  getActiveParticipantCount,
  getInitials,
  getMemberById,
  getTaskById,
  getTaskParticipantRecordsByMember,
  joinOr,
  toArray,
  truncate
} from "./chunk-RFGSPZ7J.js";
import {
  escapeAttribute,
  escapeHtml
} from "./chunk-UQLSNBUY.js";
import {
  dictionaries,
  state
} from "./chunk-NDL62ULM.js";

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

export {
  addDays,
  toDateTimeLocalValue,
  formatDateTime,
  formatShortDate,
  renderSelectOptions,
  renderMultiSelectOptions,
  renderEmpty,
  renderStatusBadge,
  renderPointPill,
  renderMetricCard,
  renderChartRow,
  renderTimelineCard,
  renderTaskCard,
  renderMemberCard,
  renderProjectCard,
  renderLoadRow,
  renderRankingCard,
  renderRankingRow,
  renderParticipantRow,
  renderCommentCard,
  renderProgressNodeCard,
  renderAttachmentCard,
  renderReviewTabButton,
  renderFilterField,
  renderFilterSelect,
  getPendingApprovalCount,
  renderMemberDetail,
  renderReviewStack,
  renderMemberTable
};
