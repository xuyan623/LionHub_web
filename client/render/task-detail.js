import { state, dictionaries, options } from "../core/state.js";
import { escapeHtml, escapeAttribute } from "../core/security.js";
import { formatDateTime, formatShortDate } from "../core/format.js";
import { toArray, joinOr } from "../core/utils.js";
import { getCurrentMember, getTaskById, getMemberById, getTaskParticipantRecords, getActiveParticipantCount, getJoinActionLabel } from "../domain/query.js";
import { canEditTask, canDeleteAllGeneratedData, canInteractWithTasks, isAdmin, isRetiredMember, isDisabledMember, canMemberBeAddedToTask, canDeleteTaskGeneratedData } from "../domain/permissions.js";
import { renderStatusBadge, renderPointPill, renderEmpty, renderCommentCard, renderAttachmentCard, renderParticipantRow, renderTaskCard, renderProgressNodeCard } from "./components.js";

export function renderTaskManageBody(tasks) {
  if (state.taskManageView === "table") return renderTaskTable(tasks);
  if (state.taskManageView === "calendar") return renderTaskCalendar(tasks);
  if (state.taskManageView === "robot") return renderTaskRobotView(tasks);
  return renderTaskKanban(tasks);
}

function renderTaskKanban(tasks) {
  const columns = ["todo", "in_progress", "pending_review", "completed", "overdue"];
  return `<div class="kanban-board">${columns.map((status) => {
    const items = tasks.filter((task) => task.status === status);
    return `<section class="board-column"><strong>${escapeHtml(dictionaries.taskStatuses[status])} · ${items.length}</strong>${items.length ? items.map((task) => renderTaskCard(task, { compact: true })).join("") : renderEmpty("暂无任务")}</section>`;
  }).join("")}</div>`;
}

function renderTaskTable(tasks) {
  const { column, direction } = state.tableSort;
  const columns = [
    { key: "title", label: "任务" },
    { key: "status", label: "状态" },
    { key: "priority", label: "优先级" },
    { key: "difficulty", label: "难度" },
    { key: "department", label: "部门 / 兵种" },
    { key: "dueAt", label: "截止日期" },
    { key: "participants", label: "参与人数" },
    { key: "", label: "操作" },
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
        <thead><tr>${columns.map((col) =>
          col.key
            ? `<th style="cursor:pointer" data-action="table-sort" data-column="${col.key}">${col.label} ${column === col.key ? (direction === "asc" ? "▲" : "▼") : ""}</th>`
            : `<th>${col.label}</th>`
        ).join("")}</tr></thead>
        <tbody>${tasks.length ? tasks.map((task) => `
          <tr>
            <td><strong>${escapeHtml(task.title)}</strong><div class="helper-text">${escapeHtml(dictionaries.taskTypes[task.type])}</div></td>
            <td>${renderStatusBadge(task.status)}</td>
            <td><span class="priority-pill">${escapeHtml(dictionaries.priorities[task.priority])}</span></td>
            <td><span class="mini-pill">${escapeHtml(dictionaries.difficulties[task.difficulty])}</span></td>
            <td>${escapeHtml(joinOr(task.departments || task.department, "未指定"))} / ${escapeHtml(joinOr(task.robotGroups || task.robotGroup, "通用"))}</td>
            <td>${formatShortDate(task.dueAt)}</td>
            <td>${getActiveParticipantCount(task.id)} / ${task.maxParticipants}</td>
            <td><button class="button-ghost" type="button" data-action="open-task" data-task-id="${task.id}">查看</button></td>
          </tr>`).join("") : `<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--text-soft)">当前没有匹配的任务。</td></tr>`}</tbody>
      </table>
    </div>`;
}

function renderTaskCalendar(tasks) {
  const dayNames = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  const today = new Date();
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
          `).join("") : '<div style="color:var(--text-faint);font-size:0.85rem;padding:6px 0">暂无任务</div>'}
          ${dayTasks.length > 3 ? `<div style="color:var(--text-faint);font-size:0.8rem;padding:4px 0">还有 ${dayTasks.length - 3} 个任务</div>` : ""}
        </div>
      </div>`;
  }).join("")}</div>`;
}

function renderTaskRobotView(tasks) {
  return `<div class="robot-grid">${options.robotGroups.map((robotGroup) => {
    const items = tasks.filter((task) => toArray(task.robotGroups || task.robotGroup).includes(robotGroup));
    return `<section class="panel robot-column"><div class="section-header"><div><h3>${robotGroup}</h3><p>按兵种聚合任务。</p></div></div>${items.length ? items.map((task) => renderTaskCard(task, { compact: true })).join("") : renderEmpty("暂无关联任务")}</section>`;
  }).join("")}</div>`;
}

function daysUntil(dateString) {
  if (!dateString) return 99;
  return Math.ceil((new Date(dateString).getTime() - Date.now()) / 86400000);
}

export function renderTaskDetail(task) {
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
          <label class="field-group"><span class="field-label">任务描述</span><textarea class="field-textarea" readonly style="resize:none;min-height:100px" onclick="this.select()">${escapeHtml(task.description)}</textarea></label>
          ${task.acceptanceCriteria ? `<label class="field-group" style="margin-top:16px"><span class="field-label">验收标准</span><textarea class="field-textarea" readonly style="resize:none;min-height:80px" onclick="this.select()">${escapeHtml(task.acceptanceCriteria)}</textarea></label>` : ""}
        </div>
      </div>
      <div class="definition-list">
        <div class="definition-row"><span>任务类型</span><strong>${escapeHtml(dictionaries.taskTypes[task.type])}</strong></div>
        <div class="definition-row"><span>部门 / 方向 / 兵种</span><strong>${escapeHtml(joinOr(task.departments || task.department, "未指定"))} / ${escapeHtml(joinOr(task.directions || task.direction, "未指定"))} / ${escapeHtml(joinOr(task.robotGroups || task.robotGroup, "通用"))}</strong></div>
        <div class="definition-row"><span>负责人</span><strong>${escapeHtml(getMemberById(task.ownerId)?.name || "未设置")}</strong></div>
        <div class="definition-row"><span>截止日期</span><strong>${formatDateTime(task.dueAt)}</strong></div>
        <div class="definition-row"><span>推荐人群</span><strong>${escapeHtml(task.recommendedFor)}</strong></div>
      </div>
      <div class="task-points">
        ${renderPointPill("研习点", task.studyPoints)}
        ${renderPointPill("工时点", task.laborPoints)}
        ${renderPointPill("管理点", task.managementPoints)}
        ${renderPointPill("人数", `${getActiveParticipantCount(task.id)} / ${task.maxParticipants}`)}
      </div>
      <div class="progress-wrap">
        <div class="progress-head"><span>进度</span><strong>${task.progressPercent}%</strong></div>
        <div class="progress-bar"><span style="width:${task.progressPercent}%"></span></div>
      </div>
      <section class="panel">
        <div class="section-header"><div><h3>进度节点</h3><p>每个带有进度说明或附件的里程碑记录。</p></div></div>
        <div class="comment-list">${(task.progressNodes || []).length ? [...task.progressNodes].sort((a, b) => b.percent - a.percent).map((node) => renderProgressNodeCard(node, task.id)).join("") : renderEmpty("还没有进度节点记录。")}</div>
      </section>
      <section class="panel">
        <div class="section-header"><div><h3>附件资料</h3><p>任务资料、成果附件和历史外链都会展示在这里。</p></div></div>
        <div class="comment-list">${(task.attachments || []).length ? task.attachments.map((attachment) => renderAttachmentCard(attachment, task.id)).join("") : renderEmpty("当前没有附件资料。")}</div>
      </section>
      <section class="panel">
        <div class="section-header"><div><h3>参与成员</h3><p>显示负责人、协作者与退出记录。</p></div></div>
        <div class="member-stack">${participants.map((participant) => renderParticipantRow(participant)).join("")}</div>
      </section>
      <section class="panel">
        <div class="section-header"><div><h3>评论与成果</h3><p>任务讨论、进度更新与成果提交记录。</p></div></div>
        <div class="comment-list">${(task.comments || []).length ? task.comments.map((comment) => renderCommentCard(comment, task.id)).join("") : renderEmpty("还没有评论记录。")}</div>
      </section>
      ${canInteractWithTasks() ? renderTaskActionPanel(task, isParticipant) : renderTaskReadOnlyNotice(task)}
      ${canDeleteAllGeneratedData() ? renderRatioPanel(task, participants) : ""}
      ${canDeleteAllGeneratedData() ? renderCompensationPanel(task, participants) : ""}
    </div>
  `;
}

export function renderTaskActionPanel(task, isParticipant) {
  const member = getCurrentMember();
  const canSubmit = isParticipant || task.ownerId === member.id || isAdmin();
  const joinAction = getJoinActionLabel(task);
  const isLocked = task.status === "completed" || task.status === "pending_review";
  return `
    <section class="panel">
      <div class="section-header"><div><h3>任务操作</h3><p>领取、申请加入、更新进度、退出任务。进度到 100% 时会弹出完成提交窗。</p></div></div>
      <div class="button-row">
        ${joinAction ? `<button class="button-primary" type="button" data-action="claim-task" data-task-id="${task.id}">${joinAction}</button>` : ""}
        ${isParticipant ? `<button class="button-danger" type="button" data-action="exit-task" data-task-id="${task.id}">退出任务</button>` : ""}
      </div>
      ${canSubmit && !isLocked ? `
        <form class="auth-form" data-form="task-progress" data-task-id="${task.id}">
          <div class="field-grid">
            <label class="field-group"><span class="field-label">当前进度百分比</span><input class="field-input" type="range" name="progressPercent" min="0" max="100" step="1" value="${escapeAttribute(String(task.progressPercent))}" oninput="this.nextElementSibling.textContent = this.value + '%'"><span style="min-width:40px;text-align:right;font-weight:600">${task.progressPercent}%</span></label>
          </div>
          <div class="button-row"><button class="button-secondary" type="submit" ${state.formLoading === 'task-progress' ? 'disabled' : ''}>更新进度</button></div>
        </form>
        <div class="button-row">
          <button class="button-secondary" type="button" data-action="open-progress-note" data-task-id="${task.id}">添加进度说明</button>
          <button class="button-secondary" type="button" data-action="open-task-attachment" data-task-id="${task.id}">上传附件</button>
        </div>
        <form class="auth-form" data-form="task-comment" data-task-id="${task.id}">
          <label class="field-group"><span class="field-label">添加评论</span><textarea class="field-textarea" name="comment" required placeholder="记录讨论结论、审核意见或协作说明"></textarea></label>
          <div class="button-row"><button class="button-secondary" type="submit" ${state.formLoading === 'task-comment' ? 'disabled' : ''}>发布评论</button></div>
        </form>
      ` : ""}
      ${isLocked ? `<div class="helper-text">当前任务已${task.status === "completed" ? "完成" : "进入审核流程"}，操作已锁定。</div>` : ""}
    </section>
  `;
}

export function renderRatioPanel(task, participants) {
  const activeParticipants = participants.filter((item) => item.status !== "exited");
  return `
    <section class="panel">
      <div class="section-header"><div><h3>点数分配预览</h3><p>管理员可手动调整贡献比例。中途加入成员会按系统折扣自动折半。</p></div></div>
      <form class="auth-form" data-form="task-ratios" data-task-id="${task.id}">
        ${activeParticipants.map((participant) => {
          const member = getMemberById(participant.memberId);
          return `
            <div class="field-grid">
              <label class="field-group">
                <span class="field-label">${escapeHtml(member?.name || "未知成员")} · ${escapeHtml(participant.joinType === "middle" ? "中途加入" : "初始参与")}</span>
                <input class="field-input" type="number" name="ratio_${participant.id}" min="0.1" step="0.1" required value="${escapeAttribute(String(participant.contributionRatio))}">
              </label>
              <div class="point-pill">预计权重 ${(participant.contributionRatio * (participant.joinType === "middle" ? state.database.settings.middleJoinDiscount : 1)).toFixed(1)}</div>
            </div>`;
        }).join("")}
        <div class="button-row"><button class="button-secondary" type="submit" ${state.formLoading === 'task-ratios' ? 'disabled' : ''}>保存分配比例</button></div>
      </form>
    </section>
  `;
}

export function renderCompensationPanel(task, participants) {
  const availableMembers = participants.map((participant) => getMemberById(participant.memberId)).filter(Boolean);
  return `
    <section class="panel">
      <div class="section-header"><div><h3>补偿点数</h3><p>用于退出任务但已有贡献、任务关闭但存在有效投入等特殊情况。</p></div></div>
<form class="auth-form" data-form="task-compensation" data-task-id="${task.id}">
         <div class="field-grid">
           <label class="field-group"><span class="field-label">补偿对象</span><select class="field-select" name="memberId" required>${availableMembers.map((member) => `<option value="${member.id}">${escapeHtml(member.name)}</option>`).join("")}</select></label>
           <label class="field-group"><span class="field-label">补偿类型</span><select class="field-select" name="pointType" required><option value="compensation">补偿点</option><option value="study">研习点</option><option value="labor">工时点</option><option value="management">管理点</option></select></label>
         </div>
         <div class="field-grid">
           <label class="field-group"><span class="field-label">补偿数值</span><input class="field-input" type="number" min="0" step="0.5" name="amount" required></label>
           <label class="field-group"><span class="field-label">补偿原因</span><input class="field-input" type="text" name="reason" required placeholder="例如：中途退出但已完成线束排查"></label>
         </div>
         <div class="button-row"><button class="button-primary" type="submit" ${state.formLoading === 'task-compensation' ? 'disabled' : ''}>发放补偿</button></div>
       </form>
    </section>
  `;
}

function renderTaskReadOnlyNotice(task) {
  const message = getReadOnlyTaskActionMessage();
  return `
    <section class="panel">
      <div class="section-header"><div><h3>任务操作已锁定</h3><p>${escapeHtml(message)}</p></div></div>
      <div class="helper-text">你仍然可以查看任务详情、附件、评论和历史记录，但不能继续参与当前任务操作。</div>
    </section>
  `;
}

function getReadOnlyTaskActionMessage(member = getCurrentMember()) {
  if (!member) return "当前账号没有任务操作权限。";
  if (isRetiredMember(member)) return "当前账号已退休，仅保留只读浏览能力，不再参与任务协作和积分结算。";
  if (isDisabledMember(member)) return "当前账号已停用，不能执行任务协作操作。";
  if (member.role === "teacher") return "指导老师账号仅用于查看，不参与普通任务协作。";
  return "当前账号没有任务操作权限。";
}


