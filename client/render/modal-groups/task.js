import { state, dictionaries, options } from "../../core/state.js";
import { escapeAttribute, escapeHtml } from "../../core/security.js";
import { addDays, formatDateTime, toDateTimeLocalValue } from "../../core/format.js";
import { getDraftKey, loadDraft } from "../../core/drafts.js";
import { getActiveParticipantCount, getCurrentMember, getMemberById, getTaskById, getTaskParticipantRecords } from "../../domain/query.js";
import { getTaskMaterialAttachments } from "../../domain/task.js";
import { canDeleteAllGeneratedData, canDeleteTask, canDeleteTaskGeneratedData, canEditTask, canMemberBeAddedToTask } from "../../domain/permissions.js";
import { renderAttachmentCard, renderAttachmentList, renderEmpty, renderExpandableCollection, renderMemberDetail, renderMultiSelectOptions, renderPointPill, renderSelectOptions, renderTaskCard, renderTimelineCard } from "../components.js";
import { renderTaskDetail } from "../task-detail.js";
import { joinOr, toArray } from "../../core/utils.js";

export function render(modalType) {
  switch (modalType) {
    case "progress-note-form":
      return renderProgressNoteFormModal();
    case "share-task":
      return renderShareTaskModal();
    case "task-attachment-form":
      return renderTaskAttachmentFormModal();
    case "task-completion":
      return renderTaskCompletionModal();
    case "task-detail":
      return renderTaskDetailModal();
    case "task-form":
      return renderTaskFormModal();
    case "task-owner-reassign":
      return renderTaskOwnerReassignModal();
    default:
      return "";
  }
}

export function renderTaskCompletionModal() {
  const task = getTaskById(state.modal.taskId);
  if (!task) return "";
  const taskMaterialAttachments = getTaskMaterialAttachments(task);
  const stagedProgressFiles = Array.isArray(state.modal.pendingFiles) ? state.modal.pendingFiles : [];
  const initialSummary = typeof state.modal.initialSummary === "string" ? state.modal.initialSummary : "";
  return `
    <div class="modal">
      <div class="modal-card modal-card-completion glass-card">
        <div class="section-header">
          <div><h3>完成提交</h3><p>任务进度到 100% 后，需要填写成果说明并上传附件，才能进入待审核状态。</p></div>
          <button class="button-ghost" type="button" data-action="close-overlay">取消</button>
        </div>
        <form class="auth-form" data-form="task-submit" data-task-id="${task.id}">
          <label class="field-group"><span class="field-label">成果说明</span><textarea class="field-textarea" name="summary" placeholder="描述完成内容、验收方式与产出结论" required>${escapeHtml(initialSummary)}</textarea></label>
          <label class="field-group"><span class="field-label">上传审核材料</span><input class="field-input field-file-input" type="file" name="attachments" multiple onchange="this.nextElementSibling.textContent = this.files.length > 5 ? '单次最多上传 5 个文件。' : ''"><span class="helper-text file-count-warn" style="color:var(--danger)"></span></label>
          <div class="helper-text">这里上传的文件只进入本次审核材料，不会混进任务资料区。</div>
          ${stagedProgressFiles.length ? `<div class="helper-text">当前有 ${stagedProgressFiles.length} 个带入文件，会在提交审核时一并作为审核材料上传。</div>` : ""}
          ${taskMaterialAttachments.length ? `
            <div class="field-group">
              <span class="field-label">勾选任务资料作为审核材料</span>
              <div class="selection-stack">
                ${taskMaterialAttachments.map((attachment) => `
                  <label class="selection-card">
                    <input type="checkbox" name="selectedTaskMaterialIds" value="${escapeAttribute(attachment.id)}">
                    <div class="selection-copy">
                      <strong>${escapeHtml(attachment.name || "任务资料")}</strong>
                      <span>${escapeHtml(attachment.uploadedByName || "未记录上传者")}</span>
                    </div>
                  </label>
                `).join("")}
              </div>
            </div>
          ` : ""}
          <div class="modal-actions-sticky">
            <div class="helper-text">提交后任务会进入审核流程，期间不再允许继续编辑进度。</div>
            <div class="button-row">
              <button class="button-primary" type="submit" ${state.formLoading === "task-submit" ? "disabled" : ""}>提交审核</button>
              <button class="button-ghost" type="button" data-action="close-overlay">取消</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  `;
}

export function renderTaskDetailModal() {
  const task = getTaskById(state.modal.taskId);
  if (!task) return "";
  return `
    <div class="modal">
      <div class="modal-card modal-card-task glass-card">
        <div class="section-header">
          <div><h3>任务详情</h3><p>查看完整任务信息、参与成员、评论、成果与操作区。</p></div>
          <button class="button-ghost" type="button" data-action="close-overlay">关闭</button>
        </div>
        ${renderTaskDetail(task)}
        <div class="modal-actions-sticky">
          <div class="helper-text">高频操作固定在底部，减少来回滚动查找。</div>
          <div class="button-row">
            ${canEditTask(task) ? `<button class="button-secondary" type="button" data-action="open-edit-task" data-task-id="${task.id}">编辑任务</button>` : ""}
            <button class="button-secondary" type="button" data-action="open-share-task" data-task-id="${task.id}">分享任务</button>
            <button class="button-ghost" type="button" data-action="close-overlay">关闭</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function renderShareTaskModal() {
  const task = getTaskById(state.modal.taskId);
  if (!task) return "";
  const owner = getMemberById(task.ownerId);
  const statusText = dictionaries.taskStatuses[task.status] || task.status;
  const priorityText = dictionaries.priorities[task.priority] || task.priority;
  const difficultyText = dictionaries.difficulties[task.difficulty] || task.difficulty;
  const typeText = dictionaries.taskTypes[task.type] || task.type;
  const tagsText = (task.tags || []).join("、") || "无";
  const dueText = task.dueAt ? new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(task.dueAt)) : "未设置";
  const shareText = [
    `📋 ${task.title}`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `状态：${statusText}`,
    `优先级：${priorityText}　难度：${difficultyText}`,
    `类型：${typeText}`,
    `部门：${joinOr(task.departments || task.department, "未指定")}　方向：${joinOr(task.directions || task.direction, "未指定")}　兵种：${joinOr(task.robotGroups || task.robotGroup, "通用")}`,
    `负责人：${owner?.name || "未设置"}`,
    `截止日期：${dueText}`,
    `人数：${getActiveParticipantCount(task.id)} / ${task.maxParticipants}`,
    `推荐人群：${task.recommendedFor || "无"}`,
    `标签：${tagsText}`,
    `━━━━━━━━━━━━━━━━━━━━`,
    task.description,
    ``,
    task.acceptanceCriteria ? `验收标准：\n${task.acceptanceCriteria}\n` : "",
    `━━━━━━━━━━━━━━━━━━━━`,
    `来自：醒狮战队协作中枢`,
  ].join("\n");
  return `
    <div class="modal">
      <div class="modal-card glass-card">
        <div class="section-header">
          <div><h3>分享任务</h3><p>复制下方文本即可粘贴到其他平台分享。</p></div>
          <button class="button-ghost" type="button" data-action="close-overlay">关闭</button>
        </div>
        <textarea class="field-textarea share-textarea" readonly onclick="this.select();this.setSelectionRange(0,this.value.length)">${escapeHtml(shareText)}</textarea>
        <div class="modal-actions-sticky">
          <div class="helper-text">复制文本后可直接转发到群聊、私聊或其他协作工具。</div>
          <div class="button-row">
            <button class="button-primary" type="button" onclick="var t=this.parentElement.parentElement.previousElementSibling;t.select();t.setSelectionRange(0,t.value.length);navigator.clipboard?.writeText(t.value).then(function(){alert('已复制到剪贴板')})">复制到剪贴板</button>
            <button class="button-ghost" type="button" data-action="close-overlay">关闭</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function renderTaskFormModal() {
  const taskId = state.modal.taskId || state.modal.cloneFromTaskId;
  const task = taskId ? getTaskById(taskId) : null;
  const editing = Boolean(state.modal.taskId);
  const cloning = Boolean(state.modal.cloneFromTaskId);
  const canDelete = editing && canDeleteTask(task);
  const taskMaterialAttachments = task ? getTaskMaterialAttachments(task) : [];
  const currentMember = getCurrentMember();
  const draft = loadDraft(getDraftKey("task-form", taskId || ""));
  const d = draft || {};
  const baseTitle = d.title ?? task?.title ?? "";
  const baseDescription = d.description ?? task?.description ?? "";
  const baseAcceptance = d.acceptanceCriteria ?? task?.acceptanceCriteria ?? "";
  const baseRecommended = d.recommendedFor ?? task?.recommendedFor ?? "";
  const baseTags = d.tags ?? (task?.tags ? task.tags.join(", ") : "");
  return `
    <div class="modal">
      <div class="modal-card glass-card">
        <div class="section-header">
          <div><h3>${cloning ? "复制任务" : editing ? "编辑任务" : "新建任务"}</h3><p>${cloning ? `基于《${task?.title}》创建副本，可修改字段后保存为新任务。` : editing ? "修改任务信息、截止日期、点数和公开属性。" : "按 PRD 字段创建公开任务，并自动同步到任务市场和任务管理。"}</p></div>
          <button class="button-ghost" type="button" data-action="close-overlay">关闭</button>
        </div>
        <form class="auth-form" data-form="task-form" data-draft-key="${escapeAttribute(getDraftKey("task-form", taskId || ""))}">
          <input type="hidden" name="taskId" value="${escapeAttribute(task?.id || "")}">
          <div class="field-grid">
            <label class="field-group"><span class="field-label">任务标题</span><input class="field-input" type="text" name="title" required value="${escapeAttribute(baseTitle)}"></label>
            <label class="field-group"><span class="field-label">任务类型</span><select class="field-select" name="type" required>${renderSelectOptions(options.taskTypes, task?.type, dictionaries.taskTypes)}</select></label>
          </div>
          <div class="field-grid-3">
            <label class="field-group"><span class="field-label">所属部门</span><select class="field-select" name="departments" multiple required>${renderMultiSelectOptions(options.departments, toArray(task?.departments || task?.department))}</select></label>
            <label class="field-group"><span class="field-label">所属方向</span><select class="field-select" name="directions" multiple>${renderMultiSelectOptions(options.directions, toArray(task?.directions || task?.direction))}</select></label>
            <label class="field-group"><span class="field-label">所属兵种</span><select class="field-select" name="robotGroups" multiple>${renderMultiSelectOptions(options.robotGroups, toArray(task?.robotGroups || task?.robotGroup))}</select></label>
          </div>
          <div class="field-grid-3">
            ${canDeleteAllGeneratedData() ? `
              <label class="field-group"><span class="field-label">状态${editing ? "（管理员强制覆盖）" : ""}</span><select class="field-select" name="status">${renderSelectOptions(options.taskStatuses, task?.status || "todo", dictionaries.taskStatuses)}</select></label>
            ` : editing ? `
              <div class="field-group"><span class="field-label">状态（自动推导）</span><div class="field-input" style="display:flex;align-items:center">${dictionaries.taskStatuses[task?.status] || task?.status}</div></div>
            ` : `
              <input type="hidden" name="status" value="todo">
              <div class="field-group"><span class="field-label">状态</span><div class="field-input" style="display:flex;align-items:center">${dictionaries.taskStatuses.todo}</div></div>
            `}
            <label class="field-group"><span class="field-label">优先级</span><select class="field-select" name="priority" required>${renderSelectOptions(options.priorities, task?.priority, dictionaries.priorities)}</select></label>
            <label class="field-group"><span class="field-label">难度等级</span><select class="field-select" name="difficulty" required>${renderSelectOptions(options.difficulties, task?.difficulty, dictionaries.difficulties)}</select></label>
          </div>
          <div class="field-grid">
            <label class="field-group"><span class="field-label">截止日期</span><input class="field-input" type="datetime-local" name="dueAt" required value="${escapeAttribute(toDateTimeLocalValue(task?.dueAt || addDays(7)))}"></label>
            <label class="field-group"><span class="field-label">推荐适合人群</span><input class="field-input" type="text" name="recommendedFor" required value="${escapeAttribute(baseRecommended)}"></label>
          </div>
          <div class="field-grid-3">
            <label class="field-group"><span class="field-label">研习点总额</span><input class="field-input" type="number" min="0" step="0.5" name="studyPoints" required value="${escapeAttribute(String(task?.studyPoints ?? 0))}"></label>
            <label class="field-group"><span class="field-label">工时点总额</span><input class="field-input" type="number" min="0" step="0.5" name="laborPoints" required value="${escapeAttribute(String(task?.laborPoints ?? 0))}"></label>
            <label class="field-group"><span class="field-label">管理点</span><input class="field-input" type="number" min="0" step="0.5" name="managementPoints" required value="${escapeAttribute(String(task?.managementPoints ?? 0))}"></label>
          </div>
          <div class="field-grid">
            <label class="field-group"><span class="field-label">人数上限</span><input class="field-input" type="number" min="1" step="1" name="maxParticipants" required value="${escapeAttribute(String(task?.maxParticipants ?? 2))}"></label>
            <label class="field-group"><span class="field-label">是否需要审批</span><select class="field-select" name="approvalRequired" required><option value="true" ${(task?.approvalRequired ?? false) ? "selected" : ""}>需要审批</option><option value="false" ${!(task?.approvalRequired ?? false) ? "selected" : ""}>可直接领取</option></select></label>
          </div>
          <label class="field-group"><span class="field-label">任务描述</span><textarea class="field-textarea" name="description" required>${escapeHtml(baseDescription)}</textarea></label>
          <label class="field-group"><span class="field-label">验收标准</span><textarea class="field-textarea" name="acceptanceCriteria" placeholder="描述任务完成的验收条件，例如：代码通过编译、文档评审通过等">${escapeHtml(baseAcceptance)}</textarea></label>
          <label class="field-group"><span class="field-label">标签</span><input class="field-input" type="text" name="tags" placeholder="用逗号分隔，例如 步兵, 控制, 新人可参与" value="${escapeAttribute(baseTags)}"></label>
          <input type="hidden" name="ownerId" value="${escapeAttribute(task?.ownerId || currentMember.id)}">
          <div class="modal-actions-sticky">
            <div class="helper-text">${editing ? "修改会即时影响任务市场、任务管理和任务详情。" : "创建后会立刻进入任务市场与任务管理。"}</div>
            <div class="button-row">
              <button class="button-primary" type="submit" ${state.formLoading === "task-form" ? "disabled" : ""}>${editing ? "保存任务" : "创建任务"}</button>
              ${canDelete ? `<button class="button-danger" type="button" data-action="delete-task" data-task-id="${task.id}">删除任务</button>` : ""}
              ${editing ? `<button class="button-ghost" type="button" data-action="clone-task" data-task-id="${task.id}">复制任务</button>` : ""}
              <button class="button-ghost" type="button" data-action="close-overlay">取消</button>
            </div>
          </div>
        </form>
        ${editing && taskMaterialAttachments.length ? `
          <section class="panel">
            <div class="section-header"><div><h3>已有任务资料</h3><p>${taskMaterialAttachments.length} 个文件，可逐个删除。</p></div></div>
            ${renderAttachmentList(taskMaterialAttachments, (attachment) => renderAttachmentCard(attachment, task.id), "当前没有任务资料。")}
          </section>
        ` : ""}
        ${editing ? renderTaskParticipantManagementSection(task) : ""}
      </div>
    </div>
  `;
}

function renderTaskParticipantManagementSection(task) {
  const activeParticipants = getTaskParticipantRecords(task.id).filter((participant) => participant.status === "involved");
  const candidateMembers = getTaskParticipantAddCandidates(task);
  const seatsRemaining = Math.max(task.maxParticipants - activeParticipants.length, 0);
  return `
    <section class="panel">
      <div class="section-header"><div><h3>参与成员管理</h3><p>当前 ${activeParticipants.length} / ${task.maxParticipants} 人。可添加协作者、移除协作者，并在负责人变更时改派新的负责人。</p></div></div>
      <form class="auth-form" data-form="task-participant-add" data-task-id="${task.id}">
        <div class="field-grid">
          <label class="field-group">
            <span class="field-label">添加协作者</span>
            <input class="field-input" type="text" data-participant-search="${escapeAttribute(task.id)}" placeholder="输入姓名搜索..." style="margin-bottom:6px">
            <select class="field-select" name="memberId" data-participant-select="${escapeAttribute(task.id)}" ${candidateMembers.length && seatsRemaining > 0 ? "required" : "disabled"}>
              ${candidateMembers.length && seatsRemaining > 0 ? candidateMembers.map((member) => `<option value="${member.id}">${escapeHtml(member.name)} · ${escapeHtml(member.departments[0] || "未分组")}</option>`).join("") : '<option value="">当前没有可加入成员</option>'}
            </select>
          </label>
          <div class="button-row"><button class="button-secondary" type="submit" ${state.formLoading === "task-participant-add" ? "disabled" : ""} ${candidateMembers.length && seatsRemaining > 0 ? "" : "disabled"}>添加成员</button></div>
        </div>
      </form>
      ${seatsRemaining === 0 ? '<div class="helper-text">当前任务人数已满。如需新增成员，请先提高人数上限或移除现有协作者。</div>' : ""}
      ${!candidateMembers.length && seatsRemaining > 0 ? '<div class="helper-text">当前没有符合条件的新成员。待审核、退休、停用或指导老师账号不会出现在可加入列表中。</div>' : ""}
      ${renderExpandableCollection(activeParticipants, (participant) => renderTaskEditParticipantRow(task, participant), {
        emptyText: "当前没有参与成员。",
        listClass: "member-stack",
        previewLimit: 4,
        itemUnit: "名",
        itemLabel: "成员",
      })}
    </section>
  `;
}

function getTaskParticipantAddCandidates(task) {
  const activeParticipants = getTaskParticipantRecords(task.id).filter((participant) => participant.status === "involved");
  return state.database.members
    .filter((member) => canMemberBeAddedToTask(member))
    .filter((member) => !activeParticipants.some((participant) => participant.memberId === member.id))
    .sort((left, right) => left.name.localeCompare(right.name, "zh-CN"));
}

function renderTaskEditParticipantRow(task, participant) {
  const member = getMemberById(participant.memberId);
  const isOwner = task.ownerId === participant.memberId;
  return `
    <div class="member-card">
      <div class="member-top">
        <div>
          <h4>${escapeHtml(member?.name || "未知成员")}</h4>
          <div class="member-meta">
            <span>${escapeHtml(participant.role)}</span>
            <span>${escapeHtml(participant.joinType === "middle" ? "中途加入" : "初始参与")}</span>
            <span>${escapeHtml(member?.departments?.[0] || "未分组")}</span>
          </div>
        </div>
        <span class="point-pill">比例 ${participant.contributionRatio}</span>
      </div>
      <div class="button-row">
        ${!isOwner ? `<button class="button-secondary" type="button" data-action="open-owner-reassign" data-task-id="${task.id}" data-member-id="${participant.memberId}">设为负责人</button>` : '<button class="button-secondary" type="button" disabled>当前负责人</button>'}
        ${!isOwner ? `<button class="button-danger" type="button" data-action="remove-task-participant" data-task-id="${task.id}" data-member-id="${participant.memberId}">移除协作者</button>` : ""}
      </div>
    </div>
  `;
}

export function renderTaskOwnerReassignModal() {
  const task = getTaskById(state.modal.taskId);
  if (!task) return "";
  const candidateParticipants = getTaskOwnerReassignCandidates(task);
  return `
    <div class="modal">
      <div class="modal-card modal-card-completion glass-card">
        <div class="section-header">
          <div><h3>改派负责人</h3><p>负责人不能为空。请选择新的负责人后保存，当前负责人会自动转为协作者。</p></div>
          <button class="button-ghost" type="button" data-action="close-overlay">关闭</button>
        </div>
        <form class="auth-form" data-form="task-owner-reassign" data-task-id="${task.id}">
          <label class="field-group">
            <span class="field-label">新的负责人</span>
            <select class="field-select" name="memberId" required ${candidateParticipants.length ? "" : "disabled"}>
              ${candidateParticipants.length ? candidateParticipants.map((entry) => `<option value="${entry.member.id}" ${state.modal.nextOwnerId === entry.member.id ? "selected" : ""}>${escapeHtml(entry.member.name)} · ${escapeHtml(entry.participant.role)}</option>`).join("") : '<option value="">当前没有可改派的候选成员</option>'}
            </select>
          </label>
          ${!candidateParticipants.length ? '<div class="helper-text">请先在任务编辑中添加至少一位可参与任务的协作者，再执行负责人改派。</div>' : ""}
          <div class="modal-actions-sticky">
            <div class="helper-text">改派后，新负责人会立即成为任务负责人与默认管理点归属对象。</div>
            <div class="button-row">
              <button class="button-primary" type="submit" ${candidateParticipants.length ? "" : "disabled"}>确认改派</button>
              <button class="button-ghost" type="button" data-action="close-overlay">取消</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  `;
}

export function renderProgressNoteFormModal() {
  const task = getTaskById(state.modal.taskId);
  if (!task) return "";
  return `
    <div class="modal">
      <div class="modal-card glass-card">
        <div class="section-header">
          <div><h3>添加进度说明</h3><p>当前进度 ${task.progressPercent}%。记录当前阶段的完成内容与遇到的问题。</p></div>
          <button class="button-ghost" type="button" data-action="close-overlay">关闭</button>
        </div>
        <form class="auth-form" data-form="progress-note-form" data-task-id="${task.id}">
          <input type="hidden" name="progressPercent" value="${task.progressPercent}">
          <label class="field-group"><span class="field-label">进度说明</span><textarea class="field-textarea" name="note" placeholder="描述当前完成的工作、遇到的问题或下一步计划" style="min-height:100px"></textarea></label>
          <div class="modal-actions-sticky">
            <div class="helper-text">进度说明会进入任务时间线，便于后续复盘和接手。</div>
            <div class="button-row">
              <button class="button-primary" type="submit" ${state.formLoading === "progress-note-form" ? "disabled" : ""}>保存进度说明</button>
              <button class="button-ghost" type="button" data-action="close-overlay">取消</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  `;
}

export function renderTaskAttachmentFormModal() {
  const task = getTaskById(state.modal.taskId);
  if (!task) return "";
  return `
    <div class="modal">
      <div class="modal-card glass-card">
        <div class="section-header">
          <div><h3>上传任务附件</h3><p>上传资料文件到任务资料区，供所有参与者查看。</p></div>
          <button class="button-ghost" type="button" data-action="close-overlay">关闭</button>
        </div>
        <form class="auth-form" data-form="task-attachment-form" data-task-id="${task.id}">
          <label class="field-group"><span class="field-label">选择文件</span><input class="field-input field-file-input" type="file" name="attachments" multiple onchange="this.nextElementSibling.textContent = this.files.length > 5 ? '单次最多上传 5 个文件。' : ''"><span class="helper-text file-count-warn" style="color:var(--danger)"></span></label>
          <div class="modal-actions-sticky">
            <div class="helper-text">附件会进入任务资料区，并出现在任务详情与文件管理中。</div>
            <div class="button-row">
              <button class="button-primary" type="submit" ${state.formLoading === "task-attachment-form" ? "disabled" : ""}>上传附件</button>
              <button class="button-ghost" type="button" data-action="close-overlay">取消</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  `;
}

function getTaskOwnerReassignCandidates(task) {
  return getTaskParticipantRecords(task.id)
    .filter((participant) => participant.status === "involved")
    .map((participant) => ({ participant, member: getMemberById(participant.memberId) }))
    .filter((entry) => entry.member && canMemberBeAddedToTask(entry.member))
    .filter((entry) => entry.member.id !== task.ownerId);
}
