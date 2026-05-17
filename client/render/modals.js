import { state, dictionaries, options, FILES_PER_PAGE } from "../core/state.js";
import { escapeHtml, escapeAttribute } from "../core/security.js";
import { formatDateTime, toDateTimeLocalValue, addDays } from "../core/format.js";
import { loadDraft, getDraftKey } from "../core/drafts.js";
import { getCurrentUser, getCurrentMember, getMemberById, getTaskById, getApprovalById, getTaskParticipantRecords, getActiveParticipantCount, getMemberPointSummary, getMemberLoads, getMemberTimeline, getTaskParticipantRecordsByMember, getJoinActionLabel, getLifecycleActionDefinition } from "../domain/query.js";
import { getLatestSubmissionSummary, getSubmissionAttachments, getTaskSettlementPreview } from "../domain/task.js";
import { canReview, canDeleteAllGeneratedData, canEditTask, canDeleteTask, canDeleteApprovalRecord, canInteractWithTasks, canMemberBeAddedToTask, isRetiredMember, isDisabledMember, getLifecycleBlockingTasks, canRequestRoleChange, isAdmin } from "../domain/permissions.js";
import { renderEmpty, renderTimelineCard, renderTaskCard, renderAttachmentCard, renderStatusBadge, renderPointPill, renderMemberDetail, renderSelectOptions, renderMultiSelectOptions, renderFilterField, renderFilterSelect } from "./components.js";
import { renderTaskDetail, renderCompensationPanel, renderRatioPanel } from "./task-detail.js";
import { toArray, joinOr } from "../core/utils.js";

export function renderModal() {
  switch (state.modal.type) {
    case "member-detail": return renderMemberDetailModal();
    case "sensitive-action": return renderSensitiveActionModal();
    case "profile-content": return renderProfileContentModal();
    case "promotion-request": case "role-change-request": return renderRoleChangeRequestModal();
    case "promotion-detail": return renderPromotionDetailModal();
    case "task-owner-reassign": return renderTaskOwnerReassignModal();
    case "task-completion": return renderTaskCompletionModal();
    case "task-detail": return renderTaskDetailModal();
    case "share-task": return renderShareTaskModal();
    case "task-form": return renderTaskFormModal();
    case "member-form": return renderMemberFormModal();
    case "registration-edit": return renderRegistrationEditModal();
    case "registration-review": return renderRegistrationReviewModal();
    case "approval-action": return renderApprovalActionModal();
    case "password-change": return renderPasswordChangeModal();
    case "file-manager": return renderFileManagerModal();
    case "retire-form": return renderRetireFormModal();
    case "progress-note-form": return renderProgressNoteFormModal();
    case "task-attachment-form": return renderTaskAttachmentFormModal();
    default: return "";
  }
}

export function renderMemberDetailModal() {
  const member = getMemberById(state.modal.memberId);
  if (!member) return "";
  return `
    <div class="modal">
      <div class="modal-card modal-card-member glass-card">
        <div class="section-header">
          <div><h3>成员详情</h3><p>查看成员档案、技能、负载、贡献和近期任务。</p></div>
          <button class="button-ghost" type="button" data-action="close-overlay">关闭</button>
        </div>
        ${renderMemberDetail(member)}
      </div>
    </div>
  `;
}

export function renderSensitiveActionModal() {
  const actionDefinition = getLifecycleActionDefinition(state.modal.actionKey, state.modal.memberId);
  const currentUser = getCurrentUser();
  if (!actionDefinition || !currentUser) return "";
  const { actionKey, member, title, description, submitLabel } = actionDefinition;
  const blockers = actionKey === "restore-member" ? [] : getLifecycleBlockingTasks(member.id);
  return `
    <div class="modal">
      <div class="modal-card modal-card-completion glass-card">
        <div class="section-header">
          <div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(description)}</p></div>
          <button class="button-ghost" type="button" data-action="close-overlay">关闭</button>
        </div>
        <div class="panel">
          <div class="definition-list">
            <div class="definition-row"><span>目标成员</span><strong>${escapeHtml(member.name)}</strong></div>
            <div class="definition-row"><span>操作者</span><strong>${escapeHtml(currentUser.email)}</strong></div>
          </div>
        </div>
        ${blockers.length ? `
          <section class="panel">
            <div class="section-header"><div><h3>当前仍有关联任务</h3><p>这类操作会被阻塞。请先进入任务详情调整负责人或参与成员，再回来执行。</p></div></div>
            <div class="timeline-grid">${blockers.map((task) => renderTimelineCard(task.title, `${escapeHtml(dictionaries.taskStatuses[task.status])} · 负责人 ${escapeHtml(getMemberById(task.ownerId)?.name || "未设置")}`)).join("")}</div>
          </section>
        ` : ""}
        <form class="auth-form" data-form="sensitive-action">
          <label class="field-group"><span class="field-label">确认当前操作者账号</span><input class="field-input" type="email" name="operatorEmail" required placeholder="请输入当前登录账号邮箱"></label>
          <label class="field-group"><span class="field-label">确认当前操作者密码</span><input class="field-input" type="password" name="password" required placeholder="请输入当前登录账号密码"></label>
          <div class="button-row">
            <button class="button-danger" type="submit">${escapeHtml(submitLabel)}</button>
            <button class="button-ghost" type="button" data-action="close-overlay">取消</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

export function renderRegistrationEditModal() {
  const user = getCurrentUser();
  const member = user ? getMemberById(user.memberId) : null;
  if (!user || user.status === "active" || !member) return "";
  return `
    <div class="modal">
      <div class="modal-card glass-card">
        <div class="section-header">
          <div><h3>修改注册信息</h3><p>在审核完成前，你可以修正注册资料。保存后会同步更新当前审核申请。</p></div>
          <button class="button-ghost" type="button" data-action="close-overlay">关闭</button>
        </div>
        <form class="auth-form" data-form="registration-edit">
          <div class="field-grid">
            <label class="field-group"><span class="field-label">用户名</span><input class="field-input" type="text" name="username" value="${escapeAttribute(user.username || "")}" required></label>
            <label class="field-group"><span class="field-label">姓名</span><input class="field-input" type="text" name="name" value="${escapeAttribute(member.name || "")}" required></label>
          </div>
          <div class="field-grid">
            <label class="field-group"><span class="field-label">邮箱</span><input class="field-input" type="email" name="email" value="${escapeAttribute(user.email || "")}" required></label>
            <label class="field-group"><span class="field-label">手机号</span><input class="field-input" type="tel" name="phone" value="${escapeAttribute(member.phone || "")}" required></label>
          </div>
          <div class="field-grid">
            <label class="field-group"><span class="field-label">意向组别</span><select class="field-select" name="department" required>${renderSelectOptions(options.departments, member.departments[0] || "")}</select></label>
            <label class="field-group"><span class="field-label">技能标签</span><input class="field-input" type="text" name="skills" value="${escapeAttribute(member.skillTags.join(", "))}" placeholder="用逗号分隔，例如 C, ROS, OpenCV"></label>
          </div>
          <label class="field-group"><span class="field-label">个人简介</span><textarea class="field-textarea" name="bio" placeholder="简单介绍擅长方向、参与经历或希望承担的工作">${escapeHtml(member.bio || "")}</textarea></label>
<div class="button-row">
             <button class="button-primary" type="submit" ${state.formLoading === 'registration-edit' ? 'disabled' : ''}>保存修改</button>
             <button class="button-ghost" type="button" data-action="close-overlay">取消</button>
           </div>
         </form>
         </div>
       </div>
     </div>
   `;
 }

export function renderProfileContentModal() {
  const member = getCurrentMember();
  if (!member) return "";
  return `
    <div class="modal">
      <div class="modal-card glass-card">
        <div class="section-header">
          <div><h3>修改个性内容</h3><p>在个人中心维护技能标签和个人简介，方便任务推荐、成员识别与协作分工更准确。</p></div>
          <button class="button-ghost" type="button" data-action="close-overlay">关闭</button>
        </div>
        <form class="auth-form" data-form="profile-content">
          <label class="field-group"><span class="field-label">技能标签</span><input class="field-input" type="text" name="skillTags" value="${escapeAttribute(member.skillTags.join(", "))}" placeholder="用逗号分隔，例如 STM32, OpenCV, SolidWorks"></label>
          <label class="field-group"><span class="field-label">个人简介</span><textarea class="field-textarea" name="bio" placeholder="简单介绍擅长方向、参与经历或当前更想承担的工作">${escapeHtml(member.bio || "")}</textarea></label>
<div class="button-row">
             <button class="button-primary" type="submit" ${state.formLoading === 'profile-content' ? 'disabled' : ''}>保存个性内容</button>
             <button class="button-ghost" type="button" data-action="close-overlay">取消</button>
           </div>
        </form>
      </div>
    </div>
  `;
}

export function renderRoleChangeRequestModal() {
  const member = getCurrentMember();
  if (!member) return "";
  const currentIdentityLabel = dictionaries.identities[member.identity];
  const identityOptions = Object.entries(dictionaries.identities).filter(([key]) => key !== member.identity).map(([key, label]) => `<option value="${key}">${escapeHtml(label)}</option>`).join("");
  return `
    <div class="modal">
      <div class="modal-card glass-card">
        <div class="section-header">
          <div><h3>请求变岗</h3><p>当前身份：${escapeHtml(currentIdentityLabel)}。选择目标身份并说明原因，由目标岗位及以上权限的管理人员审核。</p></div>
          <button class="button-ghost" type="button" data-action="close-overlay">关闭</button>
        </div>
        <form class="auth-form" data-form="role-change-request">
          <label class="field-group"><span class="field-label">目标身份</span><select class="field-select" name="requestedIdentity" required>${identityOptions}</select></label>
          <label class="field-group"><span class="field-label">变岗原因</span><textarea class="field-textarea" name="reason" required placeholder="说明变岗理由，例如完成培训、能力提升、承担新职责或个人调整等"></textarea></label>
<div class="button-row">
             <button class="button-primary" type="submit" ${state.formLoading === 'role-change-request' ? 'disabled' : ''}>提交变岗申请</button>
             <button class="button-ghost" type="button" data-action="close-overlay">取消</button>
           </div>
        </form>
      </div>
    </div>
  `;
}

export function renderPromotionDetailModal() {
  const approval = getApprovalById(state.modal.approvalId);
  const member = approval ? getMemberById(approval.targetId) : null;
  if (!approval || !member) return "";
  return `
    <div class="modal">
      <div class="modal-card modal-card-completion glass-card">
        <div class="section-header">
          <div><h3>转正申请详情</h3><p>查看育苗成员提交的转正说明与附件材料。</p></div>
          <button class="button-ghost" type="button" data-action="close-overlay">关闭</button>
        </div>
        <div class="definition-list">
          <div class="definition-row"><span>申请成员</span><strong>${escapeHtml(member.name)}</strong></div>
          <div class="definition-row"><span>申请时间</span><strong>${formatDateTime(approval.createdAt)}</strong></div>
        </div>
        <section class="panel">
          <div class="section-header"><div><h3>说明</h3><p>申请人提交的转正说明。</p></div></div>
          <div class="comment-card"><p>${escapeHtml(approval.comment || "暂无说明")}</p></div>
        </section>
        <section class="panel">
          <div class="section-header"><div><h3>附件资料</h3><p>申请时上传的附件材料。</p></div></div>
          <div class="comment-list">${(approval.attachments || []).length ? approval.attachments.map((attachment) => renderAttachmentCard(attachment)).join("") : renderEmpty("当前没有上传附件。")}</div>
        </section>
        <div class="button-row">
          ${approval.status === "pending" && canReview() ? `<button class="button-primary" type="button" data-action="approve-promotion" data-approval-id="${approval.id}">通过转正</button>` : ""}
          ${approval.status === "pending" && canReview() ? `<button class="button-danger" type="button" data-action="reject-promotion" data-approval-id="${approval.id}">拒绝申请</button>` : ""}
          ${canDeleteApprovalRecord(approval) ? `<button class="button-danger" type="button" data-action="delete-approval" data-approval-id="${approval.id}">删除记录</button>` : ""}
        </div>
      </div>
    </div>
  `;
}

export function renderTaskCompletionModal() {
  const task = getTaskById(state.modal.taskId);
  if (!task) return "";
  const latestSubmissionSummary = getLatestSubmissionSummary(task);
  const existingSubmissionAttachments = getSubmissionAttachments(task);
  const stagedProgressFiles = Array.isArray(state.modal.pendingFiles) ? state.modal.pendingFiles : [];
  return `
    <div class="modal">
      <div class="modal-card modal-card-completion glass-card">
        <div class="section-header">
          <div><h3>完成提交</h3><p>任务进度到 100% 后，需要填写成果说明并上传附件，才能进入待审核状态。</p></div>
          <button class="button-ghost" type="button" data-action="close-overlay">取消</button>
        </div>
        <form class="auth-form" data-form="task-submit" data-task-id="${task.id}">
          <input type="hidden" name="progressNote" value="${escapeAttribute(state.modal.progressNote || "")}">
          <label class="field-group"><span class="field-label">成果说明</span><textarea class="field-textarea" name="summary" placeholder="描述完成内容、验收方式与产出结论" required>${escapeHtml(latestSubmissionSummary)}</textarea></label>
          <label class="field-group"><span class="field-label">上传附件</span><input class="field-input field-file-input" type="file" name="attachments" multiple onchange="this.nextElementSibling.textContent = this.files.length > 5 ? '单次最多上传 5 个文件。' : ''"><span class="helper-text file-count-warn" style="color:var(--danger)"></span></label>
          <div class="helper-text">附件会上传到当前任务的共享附件区。可一次选择多个文件；如果本次不重新选择，将保留当前已上传的附件。</div>
          ${stagedProgressFiles.length ? `<div class="helper-text">当前有 ${stagedProgressFiles.length} 个从"更新进度"带入的附件，会在提交审核时一并上传。</div>` : ""}
          ${existingSubmissionAttachments.length ? `<div class="attachment-list-inline">${existingSubmissionAttachments.map((attachment) => `<span class="attachment-chip">${escapeHtml(attachment.name || "已上传附件")}</span>`).join("")}</div>` : ""}
<div class="button-row">
             <button class="button-primary" type="submit" ${state.formLoading === 'task-submit' ? 'disabled' : ''}>提交审核</button>
            <button class="button-ghost" type="button" data-action="close-overlay">取消</button>
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
          <div class="button-row">
            ${canEditTask(task) ? `<button class="button-ghost" type="button" data-action="open-edit-task" data-task-id="${task.id}">编辑</button>` : ""}
            <button class="button-ghost" type="button" data-action="open-share-task" data-task-id="${task.id}">分享</button>
            <button class="button-ghost" type="button" data-action="close-overlay">关闭</button>
          </div>
        </div>
        ${renderTaskDetail(task)}
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
        <div class="button-row">
          <button class="button-primary" type="button" onclick="var t=this.parentElement.previousElementSibling;t.select();t.setSelectionRange(0,t.value.length);navigator.clipboard?.writeText(t.value).then(function(){alert('已复制到剪贴板')})">复制到剪贴板</button>
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
              <label class="field-group"><span class="field-label">状态${editing ? '（管理员强制覆盖）' : ''}</span><select class="field-select" name="status">${renderSelectOptions(options.taskStatuses, task?.status || "todo", dictionaries.taskStatuses)}</select></label>
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
<div class="button-row">
             <button class="button-primary" type="submit" ${state.formLoading === 'task-form' ? 'disabled' : ''}>${editing ? "保存任务" : "创建任务"}</button>
            ${canDelete ? `<button class="button-danger" type="button" data-action="delete-task" data-task-id="${task.id}">删除任务</button>` : ""}
            ${editing ? `<button class="button-ghost" type="button" data-action="clone-task" data-task-id="${task.id}">复制任务</button>` : ""}
            <button class="button-ghost" type="button" data-action="close-overlay">取消</button>
          </div>
        </form>
        ${editing && (task.attachments || []).length ? `
          <section class="panel">
            <div class="section-header"><div><h3>已有附件</h3><p>${task.attachments.length} 个文件，可逐个删除。</p></div></div>
            <div class="comment-list">${task.attachments.map((attachment) => renderAttachmentCard(attachment, task.id)).join("")}</div>
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
          <div class="button-row"><button class="button-secondary" type="submit" ${state.formLoading === 'task-participant-add' ? 'disabled' : ''} ${candidateMembers.length && seatsRemaining > 0 ? "" : "disabled"}>添加成员</button></div>
        </div>
      </form>
      ${seatsRemaining === 0 ? '<div class="helper-text">当前任务人数已满。如需新增成员，请先提高人数上限或移除现有协作者。</div>' : ""}
      ${!candidateMembers.length && seatsRemaining > 0 ? '<div class="helper-text">当前没有符合条件的新成员。待审核、退休、停用或指导老师账号不会出现在可加入列表中。</div>' : ""}
      <div class="member-stack">${activeParticipants.map((participant) => renderTaskEditParticipantRow(task, participant)).join("")}</div>
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
            <span>${escapeHtml(dictionaries.memberStatuses[member?.memberStatus] || "正常")}</span>
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

export function renderMemberFormModal() {
  const member = getMemberById(state.modal.memberId);
  if (!member) return "";
  const lifecycleExplanation = !member.hiddenFromDirectory && member.memberStatus === "normal" ? getLifecycleActionDefinition("force-retire-member", member.id)?.description || "" : "";
  const blockingTasks = member.hiddenFromDirectory ? [] : getLifecycleBlockingTasks(member.id);
  return `
    <div class="modal">
      <div class="modal-card glass-card">
        <div class="section-header">
          <div><h3>编辑成员</h3><p>管理员可直接修改成员身份、角色、部门、方向、兵种与状态。</p></div>
          <button class="button-ghost" type="button" data-action="close-overlay">关闭</button>
        </div>
        ${blockingTasks.length ? `
          <section class="panel">
            <div class="section-header"><div><h3>生命周期操作前置提醒</h3><p>当前成员仍有关联中的任务。强制退休或停用前，必须先完成负责人改派或移除参与关系。</p></div></div>
            <div class="timeline-grid">${blockingTasks.map((task) => renderTimelineCard(task.title, `${escapeHtml(dictionaries.taskStatuses[task.status])} · 负责人 ${escapeHtml(getMemberById(task.ownerId)?.name || "未设置")}`)).join("")}</div>
          </section>
        ` : ""}
        <form class="auth-form" data-form="member-form">
          <input type="hidden" name="memberId" value="${escapeAttribute(member.id)}">
          <div class="field-grid">
            <label class="field-group"><span class="field-label">姓名</span><input class="field-input" type="text" name="name" value="${escapeAttribute(member.name)}" required></label>
            <label class="field-group"><span class="field-label">手机号</span><input class="field-input" type="text" name="phone" value="${escapeAttribute(member.phone || "")}"></label>
          </div>
          <div class="field-grid-3">
            <label class="field-group"><span class="field-label">成员身份</span><select class="field-select" name="identity" required>${renderSelectOptions(options.identities, member.identity, dictionaries.identities)}</select></label>
            <label class="field-group"><span class="field-label">成员状态</span><select class="field-select" name="memberStatus" required>${renderSelectOptions(options.memberStatuses.filter((status) => !["retired", "disabled"].includes(status)), member.memberStatus, dictionaries.memberStatuses)}</select></label>
          </div>
          <div class="field-grid">
            <label class="field-group"><span class="field-label">部门</span><select class="field-select" name="departments" required>${renderSelectOptions(options.departments, member.departments[0] || "")}</select></label>
            <label class="field-group"><span class="field-label">方向</span><select class="field-select" name="directions"><option value="">未指定</option>${renderSelectOptions(options.directions, member.directions[0] || "")}</select></label>
          </div>
          <div class="field-grid">
            <label class="field-group"><span class="field-label">兵种组</span><select class="field-select" name="robotGroups"><option value="">未指定</option>${renderSelectOptions(options.robotGroups, member.robotGroups[0] || "")}</select></label>
            <label class="field-group"><span class="field-label">技能标签</span><input class="field-input" type="text" name="skillTags" value="${escapeAttribute(member.skillTags.join(", "))}"></label>
          </div>
          <label class="field-group"><span class="field-label">个人简介</span><textarea class="field-textarea" name="bio">${escapeHtml(member.bio || "")}</textarea></label>
<div class="button-row">
             <button class="button-primary" type="submit" ${state.formLoading === 'member-form' ? 'disabled' : ''}>保存成员资料</button>
            ${!member.hiddenFromDirectory && member.memberStatus !== "retired" && member.memberStatus !== "disabled" ? `<button class="button-danger" type="button" data-action="open-force-retire-member" data-member-id="${member.id}">强制退休</button>` : ""}
            ${!member.hiddenFromDirectory && member.memberStatus !== "disabled" ? `<button class="button-danger" type="button" data-action="open-disable-member" data-member-id="${member.id}">注销 / 停用</button>` : ""}
            ${!member.hiddenFromDirectory && member.memberStatus === "disabled" ? `<button class="button-secondary" type="button" data-action="open-restore-member" data-member-id="${member.id}">恢复账号</button>` : ""}
            <button class="button-ghost" type="button" data-action="close-overlay">取消</button>
          </div>
        </form>
        ${lifecycleExplanation ? `<div class="helper-text">${escapeHtml(lifecycleExplanation)}</div>` : ""}
      </div>
    </div>
  `;
}

export function renderApprovalActionModal() {
  const approval = getApprovalById(state.modal.approvalId);
  if (!approval) return "";
  const target = resolveApprovalTarget(approval);
  const isApprovable = approval.status === "pending" && canReview();
  const actionMap = { join: "approve-join", completion: "approve-completion", promotion: "approve-promotion", status_change: "approve-status-change" };
  const approveAction = actionMap[approval.type];
  const isCompletionApproval = approval.type === "completion";
  const task = isCompletionApproval ? getTaskById(approval.targetId) : null;
  const submissionSummary = task ? getLatestSubmissionSummary(task) : "";
  const submissionAttachments = task ? getSubmissionAttachments(task) : [];
  const settlementPreview = task ? getTaskSettlementPreview(task) : null;
  return `
    <div class="modal">
      <div class="modal-card glass-card">
        <div class="section-header">
          <div><h3>${escapeHtml(dictionaries.approvalTypes[approval.type] || "审核")}</h3><p>${escapeHtml(target.subtitle)}</p></div>
          <button class="button-ghost" type="button" data-action="close-overlay">关闭</button>
        </div>
        ${isCompletionApproval && task ? `
          <section class="panel">
            <div class="definition-list">
              <div class="definition-row"><span>任务标题</span><strong>${escapeHtml(task.title)}</strong></div>
              <div class="definition-row"><span>提交成员</span><strong>${escapeHtml(getMemberById(approval.submitterId)?.name || "未知成员")}</strong></div>
              <div class="definition-row"><span>部门 / 方向 / 兵种</span><strong>${escapeHtml(joinOr(task.departments || task.department, "未指定部门"))} / ${escapeHtml(joinOr(task.directions || task.direction, "未指定方向"))} / ${escapeHtml(joinOr(task.robotGroups || task.robotGroup, "通用"))}</strong></div>
            </div>
          </section>
          <section class="panel">
            <div class="section-header"><div><h3>成果说明</h3><p>这里展示成员提交审核时填写的真实成果说明，而不是固定审核文案。</p></div></div>
            <div class="comment-card"><p>${escapeHtml(submissionSummary || "当前没有找到成果说明。")}</p></div>
          </section>
          <section class="panel">
            <div class="section-header"><div><h3>提交附件</h3><p>如果成员在提交审核时上传了附件，会在这里展示。</p></div></div>
            <div class="comment-list">${submissionAttachments.length ? submissionAttachments.map((attachment) => renderAttachmentCard(attachment)).join("") : renderEmpty("当前没有提交附件。")}</div>
          </section>
          ${renderSettlementPreviewPanel(task, settlementPreview)}
        ` : approval.comment ? `<section class="panel"><div class="comment-card"><p>${escapeHtml(approval.comment)}</p></div></section>` : ""}
        <div class="button-row">
          ${isApprovable && approveAction ? `<button class="button-primary" type="button" data-action="${approveAction}" data-approval-id="${approval.id}">通过</button>` : ""}
          ${isApprovable && isCompletionApproval ? `<button class="button-danger" type="button" data-action="return-completion" data-approval-id="${approval.id}">驳回修改</button>` : ""}
          ${isApprovable && !isCompletionApproval ? `<button class="button-danger" type="button" data-action="reject-approval" data-approval-id="${approval.id}">拒绝</button>` : ""}
          <button class="button-ghost" type="button" data-action="close-overlay">关闭</button>
        </div>
      </div>
    </div>
  `;
}

function renderSettlementPreviewPanel(task, settlementPreview) {
  if (!task || !settlementPreview) {
    return "";
  }

  const participantCards = settlementPreview.memberSettlements
    .map((entry) => renderSettlementPreviewCard(entry))
    .join("");

  return `
    <section class="panel">
      <div class="section-header">
        <div>
          <h3>积分分配预览</h3>
          <p>审核通过后会立即按当前比例结算。这里展示的预估值与实际入账使用同一套规则。</p>
        </div>
      </div>
      <div class="task-points">
        ${renderPointPill("总研习点", settlementPreview.totals.study)}
        ${renderPointPill("总工时点", settlementPreview.totals.labor)}
        ${renderPointPill("总管理点", settlementPreview.totals.management)}
        ${renderPointPill("总计", settlementPreview.totals.total)}
      </div>
      <div class="helper-text" style="margin-top:12px">
        ${escapeHtml(`中途加入折扣 ${settlementPreview.middleJoinDiscount}x`)}
        ${settlementPreview.wasOverdue ? ` · ${escapeHtml(`逾期折扣 ${settlementPreview.overdueDiscount}x`)}` : ""}
      </div>
      <div class="comment-list" style="margin-top:16px">
        ${participantCards || renderEmpty("当前没有可结算的参与成员。")}
      </div>
    </section>
  `;
}

function renderSettlementPreviewCard(entry) {
  const memberName = entry.member?.name || "未知成员";
  const roleLabel = entry.participant?.role || (entry.managementAmount > 0 ? "负责人" : "参与成员");
  const joinTypeLabel = entry.participant
    ? (entry.joinType === "middle" ? "中途加入" : "初始参与")
    : "负责人结算";
  const statusText = entry.eligible ? "正常参与结算" : "当前状态不参与积分累计";

  return `
    <div class="comment-card">
      <div class="section-header" style="margin-bottom:8px">
        <div>
          <strong>${escapeHtml(memberName)}</strong>
          <div class="helper-text">${escapeHtml(roleLabel)} · ${escapeHtml(joinTypeLabel)} · ${escapeHtml(statusText)}</div>
        </div>
        ${entry.participant ? `<span class="point-pill">权重 ${escapeHtml(String(entry.adjustedWeight))}</span>` : ""}
      </div>
      <div class="task-points">
        ${renderPointPill("研习点", entry.studyAmount)}
        ${renderPointPill("工时点", entry.laborAmount)}
        ${renderPointPill("管理点", entry.managementAmount)}
        ${renderPointPill("合计", entry.totalAmount)}
      </div>
      ${entry.participant ? `<div class="helper-text">贡献比例 ${escapeHtml(String(entry.participant.contributionRatio))}</div>` : ""}
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

export function renderRegistrationReviewModal() {
  const approval = getApprovalById(state.modal.approvalId);
  const pendingMember = approval ? getMemberById(approval.targetId) : null;
  if (!approval || !pendingMember) return "";
  return `
    <div class="modal">
      <div class="modal-card glass-card">
        <div class="section-header">
          <div><h3>注册审核</h3><p>为待审核成员分配身份、权限、部门和方向，审核通过后即可进入系统。</p></div>
          <button class="button-ghost" type="button" data-action="close-overlay">关闭</button>
        </div>
        <form class="auth-form" data-form="registration-review">
          <input type="hidden" name="approvalId" value="${escapeAttribute(approval.id)}">
          <input type="hidden" name="memberId" value="${escapeAttribute(pendingMember.id)}">
          <div class="field-grid">
            <label class="field-group"><span class="field-label">姓名</span><input class="field-input" type="text" value="${escapeAttribute(pendingMember.name)}" disabled></label>
            <label class="field-group"><span class="field-label">意向组别</span><input class="field-input" type="text" value="${escapeAttribute(pendingMember.departments.join(" / "))}" disabled></label>
          </div>
          <div class="field-grid-3">
            <label class="field-group"><span class="field-label">成员身份</span><select class="field-select" name="identity" required>${renderSelectOptions(options.identities, "seedling", dictionaries.identities)}</select></label>
            <label class="field-group"><span class="field-label">状态</span><select class="field-select" name="memberStatus" required>${renderSelectOptions(options.memberStatuses.filter((status) => !["retired", "disabled"].includes(status)), "normal", dictionaries.memberStatuses)}</select></label>
          </div>
          <div class="field-grid">
            <label class="field-group"><span class="field-label">部门</span><select class="field-select" name="departments" required>${renderSelectOptions(options.departments, pendingMember.departments[0] || options.departments[0])}</select></label>
            <label class="field-group"><span class="field-label">方向</span><select class="field-select" name="direction" required><option value="">请选择方向</option>${renderSelectOptions(options.directions, pendingMember.directions[0] || "")}</select></label>
          </div>
          <div class="field-grid">
            <label class="field-group"><span class="field-label">兵种组</span><select class="field-select" name="robotGroup" required><option value="">请选择兵种组</option>${renderSelectOptions(options.robotGroups, pendingMember.robotGroups[0] || "")}</select></label>
          </div>
          <label class="field-group"><span class="field-label">个人简介</span><textarea class="field-textarea" disabled>${escapeHtml(pendingMember.bio || "未填写")}</textarea></label>
<div class="button-row">
             <button class="button-primary" type="submit" ${state.formLoading === 'registration-review' ? 'disabled' : ''}>审核通过</button>
            <button class="button-danger" type="button" data-action="reject-registration" data-approval-id="${approval.id}">拒绝申请</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

export function renderFileManagerModal() {
  const files = state.settingsFiles;
  const fileIndex = state.attachmentsIndex || {};
  return `
    <div class="modal">
      <div class="modal-card modal-card-completion glass-card">
        <div class="section-header">
          <div><h3>文件管理</h3><p>${files ? `共 ${files.length} 个上传文件` : "加载后即可查看和管理所有共享附件。"}</p></div>
          <button class="button-ghost" type="button" data-action="close-overlay">关闭</button>
        </div>
        ${!files ? `
          <div class="button-row"><button class="button-primary" type="button" data-action="load-file-manager">加载文件列表</button></div>
        ` : state.settingsFileLoading ? '<div class="helper-text">加载中...</div>' : files.length === 0 ? renderEmpty("当前没有上传文件。") : (() => {
          const q = (state.fileFilters.query || "").toLowerCase();
          const sourceFilter = state.fileFilters.source || "all";
          const filtered = files.filter((file) => {
            const ref = fileIndex[file.path];
            const nameMatch = (ref?.name || file.name).toLowerCase().includes(q);
            const uploaderMatch = (ref?.uploadedByName || "").toLowerCase().includes(q);
            const titleMatch = (ref?.title || "").toLowerCase().includes(q);
            if (q && !nameMatch && !uploaderMatch && !titleMatch) return false;
            if (sourceFilter !== "all") {
              if (sourceFilter === "orphan" && ref) return false;
              if (sourceFilter !== "orphan" && (!ref || ref.source !== sourceFilter)) return false;
            }
            return true;
          }).sort((a, b) => {
            const ta = (fileIndex[a.path]?.uploadedAt || a.modifiedAt || "");
            const tb = (fileIndex[b.path]?.uploadedAt || b.modifiedAt || "");
            return tb.localeCompare(ta);
          });
          if (state.settingsFilePage > 0 && filtered.length <= state.settingsFilePage * FILES_PER_PAGE) state.settingsFilePage = 0;
          const page = state.settingsFilePage;
          const totalPages = Math.max(1, Math.ceil(filtered.length / FILES_PER_PAGE));
          const pageFiles = filtered.slice(page * FILES_PER_PAGE, (page + 1) * FILES_PER_PAGE);
          return `
            <div class="toolbar-row">
              ${renderFilterField("搜索文件", "files", "query", state.fileFilters.query, "text", "搜索文件名、任务、上传者")}
              ${renderFilterSelect("来源", "files", "source", state.fileFilters.source, ["submission", "progress", "progress_note", "task_attachment", "promotion", "orphan"], { submission: "成果提交", progress: "进度更新", progress_note: "进度说明", task_attachment: "任务资料", promotion: "变岗申请", orphan: "孤立文件" })}
            </div>
            <div class="task-stack">
              ${pageFiles.length ? pageFiles.map((file) => {
                const ref = fileIndex[file.path];
                const originalName = ref?.name || file.name;
                const fileSizeLabel = file.size > 1048576 ? `${(file.size / 1048576).toFixed(1)} MB` : file.size > 1024 ? `${(file.size / 1024).toFixed(1)} KB` : `${file.size} B`;
                const timeLabel = formatDateTime(ref?.uploadedAt || file.modifiedAt);
                const downloadUrl = `/uploads/${encodeURI(file.path)}?downloadName=${encodeURIComponent(originalName)}`;
                return `
                  <div class="comment-card">
                    <strong><a class="attachment-link" href="${escapeAttribute(downloadUrl)}" target="_blank" rel="noreferrer" download="${escapeAttribute(originalName)}">${escapeHtml(originalName)}</a></strong>
                    <div class="helper-text">${timeLabel} · ${fileSizeLabel} · ${ref ? `${escapeHtml(ref.title)}${ref.uploadedByName ? ` · ${escapeHtml(ref.uploadedByName)}` : ""}` : "孤立文件"}</div>
                    <div class="button-row"><button class="button-danger" type="button" data-action="delete-upload-file" data-storage-path="${escapeAttribute(file.path)}" data-file-name="${escapeAttribute(originalName)}">删除</button></div>
                  </div>
                `;
              }).join("") : renderEmpty("没有匹配筛选条件的文件。")}
            </div>
            ${totalPages > 1 ? `
              <div class="button-row" style="justify-content:center;margin-top:16px">
                <button class="button-secondary" type="button" data-action="settings-file-page" data-page="${page - 1}" ${page === 0 ? "disabled" : ""}>< 上一页</button>
                <span class="helper-text" style="margin:0 12px">第 ${page + 1} / ${totalPages} 页</span>
                <button class="button-secondary" type="button" data-action="settings-file-page" data-page="${page + 1}" ${page + 1 >= totalPages ? "disabled" : ""}>下一页 ></button>
              </div>` : ""}`;
        })()}
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
          ${!candidateParticipants.length ? '<div class="helper-text">请先在任务编辑中添加至少一位正常状态的协作者，再执行负责人改派。</div>' : ""}
          <div class="button-row">
            <button class="button-primary" type="submit" ${candidateParticipants.length ? "" : "disabled"}>确认改派</button>
            <button class="button-ghost" type="button" data-action="close-overlay">取消</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

export function renderPasswordChangeModal() {
  return `
    <div class="modal">
      <div class="modal-card glass-card">
        <div class="section-header">
          <div><h3>修改密码</h3><p>输入当前密码和新密码完成修改。</p></div>
          <button class="button-ghost" type="button" data-action="close-overlay">关闭</button>
        </div>
        <form class="auth-form" data-form="password-change">
          <label class="field-group"><span class="field-label">当前密码</span><input class="field-input" type="password" name="oldPassword" required placeholder="输入当前登录密码"></label>
          <label class="field-group"><span class="field-label">新密码</span><input class="field-input" type="password" name="newPassword" required placeholder="至少 6 位" minlength="6"></label>
          <label class="field-group"><span class="field-label">确认新密码</span><input class="field-input" type="password" name="confirmPassword" required placeholder="再次输入新密码"></label>
          <div class="button-row">
            <button class="button-primary" type="submit" ${state.formLoading === 'password-change' ? 'disabled' : ''}>修改密码</button>
            <button class="button-ghost" type="button" data-action="close-overlay">取消</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

export function renderRetireFormModal() {
  const member = getCurrentMember();
  if (!member) return "";
  return `
    <div class="modal">
      <div class="modal-card glass-card">
        <div class="section-header">
          <div><h3>申请退役</h3><p>填写退役原因和留言，确认后账号将切换为只读状态。</p></div>
          <button class="button-ghost" type="button" data-action="close-overlay">关闭</button>
        </div>
        <form class="auth-form" data-form="retire-form">
          <label class="field-group">
            <span class="field-label">退役原因（必填）</span>
            <textarea class="field-textarea" name="reason" required placeholder="请简要说明退役原因，例如：学业压力、时间不足等" style="min-height:80px"></textarea>
          </label>
          <label class="field-group">
            <span class="field-label">想留下的话（选填）</span>
            <textarea class="field-textarea" name="message" placeholder="可以写下对战队、队友的寄语或建议" style="min-height:80px"></textarea>
          </label>
          <div class="button-row">
            <button class="button-danger" type="submit" ${state.formLoading === 'retire-form' ? 'disabled' : ''}>提交退役申请</button>
            <button class="button-ghost" type="button" data-action="close-overlay">取消</button>
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
          <div class="button-row">
            <button class="button-primary" type="submit" ${state.formLoading === 'progress-note-form' ? 'disabled' : ''}>保存进度说明</button>
            <button class="button-ghost" type="button" data-action="close-overlay">取消</button>
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
          <div class="button-row">
            <button class="button-primary" type="submit" ${state.formLoading === 'task-attachment-form' ? 'disabled' : ''}>上传附件</button>
            <button class="button-ghost" type="button" data-action="close-overlay">取消</button>
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
