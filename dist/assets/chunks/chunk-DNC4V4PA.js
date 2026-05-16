import {
  formatDateTime,
  formatShortDate,
  renderAttachmentCard,
  renderCommentCard,
  renderEmpty,
  renderParticipantRow,
  renderPointPill,
  renderProgressNodeCard,
  renderStatusBadge,
  renderTaskCard
} from "./chunk-IIX4FKHB.js";
import {
  getJoinActionLabel
} from "./chunk-XS6Z5SGI.js";
import {
  canDeleteAllGeneratedData,
  canInteractWithTasks,
  getActiveParticipantCount,
  getCurrentMember,
  getMemberById,
  getTaskParticipantRecords,
  isAdmin,
  isDisabledMember,
  isRetiredMember,
  joinOr,
  toArray
} from "./chunk-IKVMAO7C.js";
import {
  dictionaries,
  options,
  state
} from "./chunk-NDL62ULM.js";
import {
  escapeAttribute,
  escapeHtml
} from "./chunk-UQLSNBUY.js";

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

export {
  renderTaskManageBody,
  renderTaskDetail
};
