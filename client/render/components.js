import { state, dictionaries, options, FILES_PER_PAGE } from "../core/state.js";
import { escapeHtml, escapeAttribute } from "../core/security.js";
import { formatDateTime, formatShortDate } from "../core/format.js";
import { truncate, getInitials, toArray, joinOr } from "../core/utils.js";
import { getCurrentMember, getTaskById, getMemberById, getTaskParticipantRecords, getTaskParticipantRecordsByMember, getMemberPointSummary, getMemberLoads, getActiveParticipantCount, getJoinActionLabel, getApprovalById, getAttachmentsIndex } from "../domain/query.js";
import { canReview, canDeleteAllGeneratedData, canDeleteTaskGeneratedData, canInteractWithTasks, canDeletePointTransaction, canDeleteApprovalRecord, isAdmin, isRetiredMember, isDisabledMember, canMemberBeAddedToTask, getLifecycleBlockingTasks, isTaskOpenStatus } from "../domain/permissions.js";
import { getLatestSubmissionSummary } from "../domain/task.js";

export function renderSelectOptions(values, selectedValue = "", labels = null) {
  return values.map((value) => {
    const selected = value === selectedValue ? "selected" : "";
    const label = labels ? labels[value] : value;
    return `<option value="${escapeAttribute(value)}" ${selected}>${escapeHtml(label)}</option>`;
  }).join("");
}

export function renderMultiSelectOptions(values, selectedValues = [], labels = null) {
  const selected = new Set(Array.isArray(selectedValues) ? selectedValues : (selectedValues ? [selectedValues] : []));
  return values.map((value) => {
    const isSelected = selected.has(value) ? "selected" : "";
    const label = labels ? labels[value] : value;
    return `<option value="${escapeAttribute(value)}" ${isSelected}>${escapeHtml(label)}</option>`;
  }).join("");
}

export function renderEmpty(text) {
  return `<div class="empty-state">${escapeHtml(text)}</div>`;
}

export function renderDrawerEmpty(text) {
  return `<div class="drawer-empty">${escapeHtml(text)}</div>`;
}

export function renderStatusBadge(status) {
  const normalized = status === "approved" ? "completed" : status === "returned" ? "pending_review" : status === "rejected" ? "overdue" : status;
  const label = dictionaries.taskStatuses[status] || dictionaries.approvalStatuses[status] || dictionaries.taskStatuses[normalized] || status;
  const cssClass = String(normalized).toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9_-]/g, "");
  return `<span class="status-badge status-${escapeAttribute(cssClass)}">${escapeHtml(label)}</span>`;
}

export function renderPointPill(label, value) {
  return `<span class="point-pill">${escapeHtml(label)} ${escapeHtml(String(value))}</span>`;
}

export function renderMetricCard(label, value, detail) {
  return `
    <div class="metric-card">
      <small>${escapeHtml(label)}</small>
      <strong>${escapeHtml(String(value))}</strong>
      <span>${escapeHtml(detail)}</span>
    </div>
  `;
}

export function renderChartRow(label, value, max) {
  const percentage = Math.round((value / max) * 100);
  return `
    <div class="chart-row">
      <span>${escapeHtml(label)}</span>
      <div class="chart-rail"><span style="width:${percentage}%"></span></div>
      <strong>${value}</strong>
    </div>
  `;
}

export function renderSubProgress(label, value) {
  return `
    <div class="point-row">
      <header><span>${escapeHtml(label)}</span><strong>${value}%</strong></header>
      <div class="progress-bar"><span style="width:${value}%"></span></div>
    </div>
  `;
}

export function renderTimelineCard(title, description) {
  return `
    <div class="timeline-card">
      <strong>${escapeHtml(title)}</strong>
      <p>${escapeHtml(description)}</p>
    </div>
  `;
}

export function renderTaskCard(task, config = {}) {
  const actionLabel = config.showAction ? getJoinActionLabel(task) : "";
  const className = ["task-card", config.highlightSelected ? "is-selected" : "", config.waterfall ? "is-waterfall" : ""].filter(Boolean).join(" ");
  return `
    <div class="${className}">
      <div class="task-top">
        <div>
          <div class="task-meta">${renderStatusBadge(task.status)}<span>${escapeHtml(dictionaries.taskTypes[task.type])}</span></div>
          <h4>${escapeHtml(task.title)}</h4>
        </div>
        <button class="button-ghost" type="button" data-action="open-task" data-task-id="${task.id}">详情</button>
      </div>
      <div class="task-meta">
        <span>${escapeHtml(joinOr(task.departments || task.department, "未指定"))}</span><span>${escapeHtml(joinOr(task.directions || task.direction, "未指定方向"))}</span><span>${escapeHtml(joinOr(task.robotGroups || task.robotGroup, "通用"))}</span><span>${escapeHtml(dictionaries.difficulties[task.difficulty])}</span>
      </div>
      ${config.compact ? "" : `<p class="text-block">${escapeHtml(truncate(task.description, 92))}</p>`}
      <div class="task-points">
        ${renderPointPill("研习点", task.studyPoints)}
        ${renderPointPill("工时点", task.laborPoints)}
        ${renderPointPill("管理点", task.managementPoints)}
      </div>
      <div class="task-meta">
        <span>推荐 ${escapeHtml(task.recommendedFor)}</span>
        <span>${formatShortDate(task.dueAt)}</span>
        <span>${getActiveParticipantCount(task.id)} / ${task.maxParticipants}</span>
      </div>
      ${actionLabel ? `<div class="button-row"><button class="button-secondary" type="button" data-action="claim-task" data-task-id="${task.id}">${actionLabel}</button></div>` : ""}
    </div>
  `;
}

export function renderMemberCard(member, config = {}) {
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
        ${renderPointPill("综合贡献", summary.composite)}
        ${renderPointPill("当前任务", getTaskParticipantRecordsByMember(member.id).filter((participant) => participant.status === "involved").length)}
      </div>
      <div class="member-meta">
        <span>${escapeHtml(member.robotGroups.join(" / ") || "通用支持")}</span>
        <span>${escapeHtml(load ? dictionaries.loadLevels[load.loadLevel] : "未评估")}</span>
      </div>
    </button>
  `;
}

export function renderProjectCard(project, expanded = false) {
  const relatedTasks = state.database.tasks.filter((task) => toArray(task.robotGroups || task.robotGroup).includes(project.name)).slice(0, expanded ? 4 : 2);
  return `
    <div class="project-card">
      <div class="project-top">
        <div>
          <h4>${escapeHtml(project.name)}</h4>
          <div class="task-meta">
            <span>负责人 ${escapeHtml(getMemberById(project.ownerId)?.name || "未设置")}</span>
            <span>阻塞项 ${escapeHtml(project.blockerCount.toString())}</span>
          </div>
        </div>
        <span class="mini-pill">${project.progress}%</span>
      </div>
      <div class="progress-wrap"><div class="progress-bar"><span style="width:${project.progress}%"></span></div></div>
      <div class="stacked-points">
        ${renderSubProgress("机械", project.mechanicalProgress)}
        ${renderSubProgress("电控", project.controlProgress)}
        ${renderSubProgress("算法", project.algorithmProgress)}
      </div>
      <div class="comment-card"><strong>当前阻塞项</strong><p>${escapeHtml(project.blocker)}</p></div>
      <div class="task-stack">${relatedTasks.map((task) => renderTaskCard(task, { compact: true })).join("")}</div>
    </div>
  `;
}

export function renderApprovalCard(approval) {
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
        ${approval.type === "registration" && isPending && canReview() ? `<button class="button-primary" type="button" data-action="open-registration-review" data-approval-id="${approval.id}">审核</button>` : isPending && canReview() ? `<button class="button-primary" type="button" data-action="open-approval-action" data-approval-id="${approval.id}">审核</button>` : detailButton}
        ${approval.type === "completion" && isPending ? `<button class="button-secondary" type="button" data-action="return-completion" data-approval-id="${approval.id}">驳回修改</button>` : ""}
        ${canDeleteApprovalRecord(approval) ? `<button class="button-danger" type="button" data-action="delete-approval" data-approval-id="${approval.id}">删除记录</button>` : ""}
      </div>
      ${helperText ? `<div class="helper-text">${escapeHtml(helperText)}</div>` : ""}
    </div>
  `;
}

function renderApprovalDetailButton(approval) {
  if (approval.type === "registration") {
    if (approval.status === "pending" && canReview()) return `<button class="button-secondary" type="button" data-action="open-registration-review" data-approval-id="${approval.id}">详情</button>`;
    return `<button class="button-secondary" type="button" data-action="open-member" data-member-id="${approval.targetId}">详情</button>`;
  }
  if (["join", "completion", "settlement"].includes(approval.type)) {
    return `<button class="button-secondary" type="button" data-action="open-task" data-task-id="${approval.targetId}">详情</button>`;
  }
  if (["compensation", "promotion", "status_change"].includes(approval.type)) {
    return `<button class="button-secondary" type="button" data-action="open-member" data-member-id="${approval.targetId}">详情</button>`;
  }
  return "";
}

export function renderApprovalPreview(approval) {
  const task = getTaskById(approval.targetId);
  return `
    <div class="approval-card">
      <h4>${escapeHtml(task?.title || "未知任务")}</h4>
      <div class="review-meta">
        <span>${formatDateTime(approval.createdAt)}</span>
        <span>${escapeHtml(dictionaries.approvalStatuses[approval.status])}</span>
      </div>
      <p>${escapeHtml(approval.comment)}</p>
    </div>
  `;
}

function resolveApprovalHelperText(approval) {
  if (approval.type === "completion") {
    const task = getTaskById(approval.targetId);
    return task ? getLatestSubmissionSummary(task) || approval.comment || "" : approval.comment || "";
  }
  return approval.comment || "";
}

export function renderLoadRow(entry) {
  return `
    <div class="member-card">
      <div class="member-top">
        <div>
          <h4>${escapeHtml(entry.member.name)}</h4>
          <div class="member-meta">
            <span>${escapeHtml(entry.member.departments.join(" / "))}</span>
            <span>${escapeHtml(entry.member.robotGroups.join(" / ") || "通用支持")}</span>
          </div>
        </div>
        <span class="chip load-chip ${entry.loadLevel}">${escapeHtml(dictionaries.loadLevels[entry.loadLevel])}</span>
      </div>
      <div class="task-points">
        ${renderPointPill("进行中", entry.activeCount)}
        ${renderPointPill("待审核", entry.pendingReview)}
        ${renderPointPill("临近截止", entry.dueSoon)}
        ${renderPointPill("逾期", entry.overdue)}
      </div>
    </div>
  `;
}

export function renderRankingCard(entry, rank, tab) {
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
        ${renderPointPill("研习点", entry.values.study)}
        ${renderPointPill("工时点", entry.values.labor)}
        ${renderPointPill("管理点", entry.values.management)}
        ${renderPointPill("综合贡献", entry.values.composite)}
      </div>
    </div>
  `;
}

export function renderRankingRow(entry, rank) {
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

export function renderParticipantRow(participant) {
  const member = getMemberById(participant.memberId);
  return `
    <div class="member-card">
      <div class="member-top">
        <div>
          <h4>${escapeHtml(member?.name || "未知成员")}</h4>
          <div class="member-meta">
            <span>${escapeHtml(participant.role)}</span>
            <span>${escapeHtml(participant.joinType === "middle" ? "中途加入" : "初始参与")}</span>
            <span>${escapeHtml(participant.status === "exited" ? "已退出" : "参与中")}</span>
          </div>
        </div>
        <span class="point-pill">比例 ${participant.contributionRatio}</span>
      </div>
    </div>
  `;
}

export function renderCommentCard(comment, taskId = "") {
  const renderedContent = escapeHtml(comment.content).replace(/@(\S+)/g, '<span style="color:var(--text);background:rgba(255,255,255,0.08);border-radius:4px;padding:0 4px">@$1</span>');
  return `
    <div class="comment-card">
      <strong>${escapeHtml(comment.title)} · ${escapeHtml(comment.authorName)}</strong>
      <p>${renderedContent}</p>
      <div class="helper-text">${formatDateTime(comment.createdAt)}</div>
      ${taskId && canDeleteTaskGeneratedData(getTaskById(taskId), comment.authorId) ? `<div class="button-row"><button class="button-danger" type="button" data-action="delete-comment" data-task-id="${taskId}" data-comment-id="${comment.id}">删除评论</button></div>` : ""}
    </div>
  `;
}

export function renderProgressNodeCard(node, taskId = "") {
  const author = getMemberById(node.authorId);
  const canDelete = taskId && canDeleteTaskGeneratedData(getTaskById(taskId), node.authorId);
  return `
    <div class="comment-card">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px">
        <strong>进度节点 · ${node.percent}% · ${escapeHtml(author?.name || "未知成员")}</strong>
        ${canDelete ? `<button class="button-danger" type="button" data-action="delete-progress-node" data-task-id="${taskId}" data-node-id="${node.id}" style="padding:4px 10px;font-size:0.8rem">删除记录</button>` : ""}
      </div>
      ${node.note ? `<p>${escapeHtml(node.note)}</p>` : ""}
      ${node.attachments?.length ? `<div class="comment-list">${node.attachments.map((attachment) => renderProgressNodeAttachmentCard(attachment, taskId, node.id, canDelete)).join("")}</div>` : ""}
      <div class="helper-text">${formatDateTime(node.createdAt)}</div>
    </div>
  `;
}

function renderProgressNodeAttachmentCard(attachment, taskId, nodeId, canDelete) {
  const attachmentName = attachment.name || "附件资料";
  const attachmentUrl = attachment.url ? `${attachment.url}${attachment.url.includes("?") ? "&" : "?"}downloadName=${encodeURIComponent(attachmentName)}` : "#";
  return `
    <div class="comment-card" style="padding:8px 12px">
      <a class="attachment-link" href="${escapeAttribute(attachmentUrl)}" target="_blank" rel="noreferrer" download="${escapeAttribute(attachmentName)}"><strong>${escapeHtml(attachmentName)}</strong></a>
      ${canDelete ? `<div class="button-row"><button class="button-danger" type="button" data-action="delete-progress-node-attachment" data-task-id="${taskId}" data-node-id="${nodeId}" data-attachment-id="${attachment.id}" style="padding:4px 10px;font-size:0.8rem">删除附件</button></div>` : ""}
    </div>
  `;
}

export function renderAttachmentCard(attachment, taskId = "") {
  const attachmentName = attachment.name || "附件资料";
  const attachmentUrl = attachment.url ? `${attachment.url}${attachment.url.includes("?") ? "&" : "?"}downloadName=${encodeURIComponent(attachmentName)}` : "#";
  const sourceLabel = resolveAttachmentSourceLabel(attachment);
  return `
    <div class="comment-card">
      <a class="attachment-link" href="${escapeAttribute(attachmentUrl)}" target="_blank" rel="noreferrer" download="${escapeAttribute(attachmentName)}"><strong>${escapeHtml(attachmentName)}</strong></a>
      ${sourceLabel ? `<div class="helper-text">${escapeHtml(sourceLabel)}</div>` : ""}
      ${taskId && canDeleteTaskGeneratedData(getTaskById(taskId)) ? `<div class="button-row"><button class="button-danger" type="button" data-action="delete-attachment" data-task-id="${taskId}" data-attachment-id="${attachment.id}">删除附件</button></div>` : ""}
    </div>
  `;
}

function resolveAttachmentSourceLabel(attachment) {
  const uploader = attachment?.uploadedByName ? ` · ${attachment.uploadedByName}` : "";
  if (attachment?.source === "submission") return `成果提交附件${uploader}`;
  if (attachment?.source === "progress") return `进度更新附件${uploader}`;
  if (attachment?.source === "progress_note") return `进度说明附件${uploader}`;
  if (attachment?.source === "task_attachment") return `任务资料附件${uploader}`;
  if (attachment?.source === "promotion") return `转正申请附件${uploader}`;
  return uploader ? `上传者：${attachment.uploadedByName}` : "";
}

export function renderPointTransactionCard(transaction) {
  const task = transaction.taskId ? getTaskById(transaction.taskId) : null;
  return `
    <div class="comment-card">
      <strong>${escapeHtml(dictionaries.pointTypes[transaction.type] || transaction.type)} · ${transaction.amount}</strong>
      <p>${escapeHtml(transaction.reason)}</p>
      <div class="helper-text">${formatDateTime(transaction.createdAt)}${task ? ` · ${escapeHtml(task.title)}` : ""}</div>
      ${canDeletePointTransaction(transaction) ? `<div class="button-row"><button class="button-danger" type="button" data-action="delete-point-transaction" data-point-id="${transaction.id}">删除流水</button></div>` : ""}
    </div>
  `;
}

export function renderReviewTabButton(tab, label, count) {
  return `<button class="button-secondary ${state.reviewTab === tab ? "is-active" : ""}" type="button" data-action="set-review-tab" data-tab="${tab}">${label} ${count ? `(${count})` : ""}</button>`;
}

export function renderFilterField(label, group, key, value, type, placeholder) {
  return `
    <label class="field-group">
      <span class="field-label">${label}</span>
      <input class="field-input" type="${type}" value="${escapeAttribute(value)}" placeholder="${escapeAttribute(placeholder)}" data-filter-group="${group}" data-filter-key="${key}">
    </label>
  `;
}

export function renderFilterSelect(label, group, key, value, sourceOptions, labels = null) {
  return `
    <label class="field-group">
      <span class="field-label">${label}</span>
      <select class="field-select" data-filter-group="${group}" data-filter-key="${key}">
        <option value="all">全部</option>
        ${sourceOptions.map((option) => {
          const selected = option === value ? "selected" : "";
          const labelText = labels ? labels[option] : option;
          return `<option value="${escapeAttribute(option)}" ${selected}>${escapeHtml(labelText)}</option>`;
        }).join("")}
      </select>
    </label>
  `;
}

export function getPendingApprovalCount() {
  return state.database.approvals.filter((approval) => approval.status === "pending").length;
}

export function renderMemberDetail(member) {
  const summary = getMemberPointSummary(member.id);
  const load = getMemberLoads().find((entry) => entry.member.id === member.id);
  return `
    <div class="definition-list">
      <div class="definition-row"><span>姓名</span><strong>${escapeHtml(member.name)}</strong></div>
      <div class="definition-row"><span>成员身份</span><strong>${escapeHtml(dictionaries.identities[member.identity])}</strong></div>
      <div class="definition-row"><span>权限角色</span><strong>${escapeHtml(dictionaries.roles[member.role])}</strong></div>
      <div class="definition-row"><span>部门 / 方向</span><strong>${escapeHtml(member.departments.join(" / "))} / ${escapeHtml(member.directions.join(" / ") || "未设置")}</strong></div>
      <div class="definition-row"><span>兵种组</span><strong>${escapeHtml(member.robotGroups.join(" / ") || "未设置")}</strong></div>
      <div class="definition-row"><span>技能标签</span><strong>${escapeHtml(member.skillTags.join("、") || "暂无")}</strong></div>
      <div class="definition-row"><span>个人简介</span><strong>${escapeHtml(member.bio || "未填写")}</strong></div>
      <div class="definition-row"><span>负载</span><strong>${escapeHtml(load ? dictionaries.loadLevels[load.loadLevel] : "未评估")}</strong></div>
    </div>
    <div class="task-points">
      ${renderPointPill("研习点", summary.study)}
      ${renderPointPill("工时点", summary.labor)}
      ${renderPointPill("管理点", summary.management)}
      ${renderPointPill("综合贡献", summary.composite)}
    </div>
  `;
}

function resolveApprovalTarget(approval) {
  if (approval.type === "registration") {
    const member = getMemberById(approval.targetId);
    return { title: member ? member.name : "待审核成员", subtitle: member ? `${member.departments.join(" / ")} · ${member.skillTags.join("、") || "暂无技能标签"}` : "注册申请" };
  }
  if (["join", "completion", "settlement"].includes(approval.type)) {
    const task = getTaskById(approval.targetId);
    const submitter = getMemberById(approval.submitterId);
    return {
      title: task ? task.title : "未知任务",
      subtitle: `${submitter?.name || "未知成员"} 提交 · ${joinOr(task?.departments || task?.department, "未指定部门")} / ${joinOr(task?.robotGroups || task?.robotGroup, "通用")}`,
    };
  }
  if (["compensation", "promotion", "status_change"].includes(approval.type)) {
    const member = getMemberById(approval.targetId);
    if (approval.requestedIdentity) {
      return { title: member ? member.name : "未知成员", subtitle: `${escapeHtml(dictionaries.identities[member?.identity] || "")} → ${escapeHtml(dictionaries.identities[approval.requestedIdentity] || "")} · ${approval.comment}` };
    }
    return { title: member ? member.name : "未知成员", subtitle: approval.comment };
  }
  return { title: "未知记录", subtitle: approval.comment || "" };
}

export function renderReviewStack(items) {
  if (!items.length) return renderEmpty("当前分类下没有记录。");
  return items.map((approval) => renderApprovalCard(approval)).join("");
}

export function renderMemberTable(members) {
  if (!members.length) return renderEmpty("没有匹配筛选条件的成员。");
  const rows = members.map((m) => {
    const summary = getMemberPointSummary(m.id);
    const load = getMemberLoads().find((entry) => entry.member.id === m.id);
    return `
      <tr>
        <td><button class="button-ghost" type="button" data-action="open-member" data-member-id="${m.id}" style="padding:4px 8px;font-size:0.9rem">${escapeHtml(m.name)}</button></td>
        <td>${escapeHtml(dictionaries.identities[m.identity])}</td>
        <td>${escapeHtml(dictionaries.roles[m.role])}</td>
        <td>${escapeHtml(m.departments.join(" / "))}</td>
        <td>${escapeHtml(m.robotGroups.join(" / ") || "通用")}</td>
        <td>${escapeHtml(m.skillTags.join("、") || "-")}</td>
        <td>${escapeHtml(dictionaries.loadLevels[load?.loadLevel] || "-")}</td>
        <td>${summary.composite}</td>
      </tr>
    `;
  }).join("");
  return `<div class="table-wrap"><table class="data-table"><thead><tr><th>姓名</th><th>身份</th><th>角色</th><th>部门</th><th>兵种</th><th>技能</th><th>负载</th><th>综合贡献</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}
