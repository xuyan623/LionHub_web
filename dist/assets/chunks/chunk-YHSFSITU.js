import {
  getDraftKey,
  loadDraft
} from "./chunk-OANHKQRB.js";
import {
  addDays,
  formatDateTime,
  getLatestSubmissionSummary,
  getSubmissionAttachments,
  getTaskSettlementPreview,
  renderAttachmentCard,
  renderEmpty,
  renderFilterField,
  renderFilterSelect,
  renderMemberDetail,
  renderMultiSelectOptions,
  renderPointPill,
  renderSelectOptions,
  renderTaskDetail,
  renderTimelineCard,
  toDateTimeLocalValue
} from "./chunk-NDS5IZL5.js";
import {
  getLifecycleActionDefinition
} from "./chunk-UKTXZA3P.js";
import {
  canDeleteAllGeneratedData,
  canDeleteApprovalRecord,
  canDeleteTask,
  canEditTask,
  canMemberBeAddedToTask,
  canReview,
  getActiveParticipantCount,
  getApprovalById,
  getCurrentMember,
  getCurrentUser,
  getLifecycleBlockingTasks,
  getMemberById,
  getTaskById,
  getTaskParticipantRecords,
  joinOr,
  toArray
} from "./chunk-SXRKLTAB.js";
import {
  escapeAttribute,
  escapeHtml
} from "./chunk-UQLSNBUY.js";
import {
  FILES_PER_PAGE,
  dictionaries,
  options,
  state
} from "./chunk-5IOWRUG7.js";

// client/render/modals.js
function renderMemberDetailModal() {
  const member = getMemberById(state.modal.memberId);
  if (!member) return "";
  return `
    <div class="modal">
      <div class="modal-card modal-card-member glass-card">
        <div class="section-header">
          <div><h3>\u6210\u5458\u8BE6\u60C5</h3><p>\u67E5\u770B\u6210\u5458\u6863\u6848\u3001\u6280\u80FD\u3001\u8D1F\u8F7D\u3001\u8D21\u732E\u548C\u8FD1\u671F\u4EFB\u52A1\u3002</p></div>
          <button class="button-ghost" type="button" data-action="close-overlay">\u5173\u95ED</button>
        </div>
        ${renderMemberDetail(member)}
      </div>
    </div>
  `;
}
function renderSensitiveActionModal() {
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
          <button class="button-ghost" type="button" data-action="close-overlay">\u5173\u95ED</button>
        </div>
        <div class="panel">
          <div class="definition-list">
            <div class="definition-row"><span>\u76EE\u6807\u6210\u5458</span><strong>${escapeHtml(member.name)}</strong></div>
            <div class="definition-row"><span>\u64CD\u4F5C\u8005</span><strong>${escapeHtml(currentUser.email)}</strong></div>
          </div>
        </div>
        ${blockers.length ? `
          <section class="panel">
            <div class="section-header"><div><h3>\u5F53\u524D\u4ECD\u6709\u5173\u8054\u4EFB\u52A1</h3><p>\u8FD9\u7C7B\u64CD\u4F5C\u4F1A\u88AB\u963B\u585E\u3002\u8BF7\u5148\u8FDB\u5165\u4EFB\u52A1\u8BE6\u60C5\u8C03\u6574\u8D1F\u8D23\u4EBA\u6216\u53C2\u4E0E\u6210\u5458\uFF0C\u518D\u56DE\u6765\u6267\u884C\u3002</p></div></div>
            <div class="timeline-grid">${blockers.map((task) => renderTimelineCard(task.title, `${escapeHtml(dictionaries.taskStatuses[task.status])} \xB7 \u8D1F\u8D23\u4EBA ${escapeHtml(getMemberById(task.ownerId)?.name || "\u672A\u8BBE\u7F6E")}`)).join("")}</div>
          </section>
        ` : ""}
        <form class="auth-form" data-form="sensitive-action">
          <label class="field-group"><span class="field-label">\u786E\u8BA4\u5F53\u524D\u64CD\u4F5C\u8005\u8D26\u53F7</span><input class="field-input" type="email" name="operatorEmail" required placeholder="\u8BF7\u8F93\u5165\u5F53\u524D\u767B\u5F55\u8D26\u53F7\u90AE\u7BB1"></label>
          <label class="field-group"><span class="field-label">\u786E\u8BA4\u5F53\u524D\u64CD\u4F5C\u8005\u5BC6\u7801</span><input class="field-input" type="password" name="password" required placeholder="\u8BF7\u8F93\u5165\u5F53\u524D\u767B\u5F55\u8D26\u53F7\u5BC6\u7801"></label>
          <div class="button-row">
            <button class="button-danger" type="submit">${escapeHtml(submitLabel)}</button>
            <button class="button-ghost" type="button" data-action="close-overlay">\u53D6\u6D88</button>
          </div>
        </form>
      </div>
    </div>
  `;
}
function renderRegistrationEditModal() {
  const user = getCurrentUser();
  const member = user ? getMemberById(user.memberId) : null;
  if (!user || user.status === "active" || !member) return "";
  return `
    <div class="modal">
      <div class="modal-card glass-card">
        <div class="section-header">
          <div><h3>\u4FEE\u6539\u6CE8\u518C\u4FE1\u606F</h3><p>\u5728\u5BA1\u6838\u5B8C\u6210\u524D\uFF0C\u4F60\u53EF\u4EE5\u4FEE\u6B63\u6CE8\u518C\u8D44\u6599\u3002\u4FDD\u5B58\u540E\u4F1A\u540C\u6B65\u66F4\u65B0\u5F53\u524D\u5BA1\u6838\u7533\u8BF7\u3002</p></div>
          <button class="button-ghost" type="button" data-action="close-overlay">\u5173\u95ED</button>
        </div>
        <form class="auth-form" data-form="registration-edit">
          <div class="field-grid">
            <label class="field-group"><span class="field-label">\u7528\u6237\u540D</span><input class="field-input" type="text" name="username" value="${escapeAttribute(user.username || "")}" required></label>
            <label class="field-group"><span class="field-label">\u59D3\u540D</span><input class="field-input" type="text" name="name" value="${escapeAttribute(member.name || "")}" required></label>
          </div>
          <div class="field-grid">
            <label class="field-group"><span class="field-label">\u90AE\u7BB1</span><input class="field-input" type="email" name="email" value="${escapeAttribute(user.email || "")}" required></label>
            <label class="field-group"><span class="field-label">\u624B\u673A\u53F7</span><input class="field-input" type="tel" name="phone" value="${escapeAttribute(member.phone || "")}" required></label>
          </div>
          <div class="field-grid">
            <label class="field-group"><span class="field-label">\u610F\u5411\u7EC4\u522B</span><select class="field-select" name="department" required>${renderSelectOptions(options.departments, member.departments[0] || "")}</select></label>
            <label class="field-group"><span class="field-label">\u6280\u80FD\u6807\u7B7E</span><input class="field-input" type="text" name="skills" value="${escapeAttribute(member.skillTags.join(", "))}" placeholder="\u7528\u9017\u53F7\u5206\u9694\uFF0C\u4F8B\u5982 C, ROS, OpenCV"></label>
          </div>
          <label class="field-group"><span class="field-label">\u4E2A\u4EBA\u7B80\u4ECB</span><textarea class="field-textarea" name="bio" placeholder="\u7B80\u5355\u4ECB\u7ECD\u64C5\u957F\u65B9\u5411\u3001\u53C2\u4E0E\u7ECF\u5386\u6216\u5E0C\u671B\u627F\u62C5\u7684\u5DE5\u4F5C">${escapeHtml(member.bio || "")}</textarea></label>
<div class="button-row">
             <button class="button-primary" type="submit" ${state.formLoading === "registration-edit" ? "disabled" : ""}>\u4FDD\u5B58\u4FEE\u6539</button>
             <button class="button-ghost" type="button" data-action="close-overlay">\u53D6\u6D88</button>
           </div>
         </form>
         </div>
       </div>
     </div>
   `;
}
function renderProfileContentModal() {
  const member = getCurrentMember();
  if (!member) return "";
  return `
    <div class="modal">
      <div class="modal-card glass-card">
        <div class="section-header">
          <div><h3>\u4FEE\u6539\u4E2A\u6027\u5185\u5BB9</h3><p>\u5728\u4E2A\u4EBA\u4E2D\u5FC3\u7EF4\u62A4\u6280\u80FD\u6807\u7B7E\u548C\u4E2A\u4EBA\u7B80\u4ECB\uFF0C\u65B9\u4FBF\u4EFB\u52A1\u63A8\u8350\u3001\u6210\u5458\u8BC6\u522B\u4E0E\u534F\u4F5C\u5206\u5DE5\u66F4\u51C6\u786E\u3002</p></div>
          <button class="button-ghost" type="button" data-action="close-overlay">\u5173\u95ED</button>
        </div>
        <form class="auth-form" data-form="profile-content">
          <label class="field-group"><span class="field-label">\u6280\u80FD\u6807\u7B7E</span><input class="field-input" type="text" name="skillTags" value="${escapeAttribute(member.skillTags.join(", "))}" placeholder="\u7528\u9017\u53F7\u5206\u9694\uFF0C\u4F8B\u5982 STM32, OpenCV, SolidWorks"></label>
          <label class="field-group"><span class="field-label">\u4E2A\u4EBA\u7B80\u4ECB</span><textarea class="field-textarea" name="bio" placeholder="\u7B80\u5355\u4ECB\u7ECD\u64C5\u957F\u65B9\u5411\u3001\u53C2\u4E0E\u7ECF\u5386\u6216\u5F53\u524D\u66F4\u60F3\u627F\u62C5\u7684\u5DE5\u4F5C">${escapeHtml(member.bio || "")}</textarea></label>
<div class="button-row">
             <button class="button-primary" type="submit" ${state.formLoading === "profile-content" ? "disabled" : ""}>\u4FDD\u5B58\u4E2A\u6027\u5185\u5BB9</button>
             <button class="button-ghost" type="button" data-action="close-overlay">\u53D6\u6D88</button>
           </div>
        </form>
      </div>
    </div>
  `;
}
function renderRoleChangeRequestModal() {
  const member = getCurrentMember();
  if (!member) return "";
  const currentIdentityLabel = dictionaries.identities[member.identity];
  const identityOptions = Object.entries(dictionaries.identities).filter(([key]) => key !== member.identity).map(([key, label]) => `<option value="${key}">${escapeHtml(label)}</option>`).join("");
  return `
    <div class="modal">
      <div class="modal-card glass-card">
        <div class="section-header">
          <div><h3>\u8BF7\u6C42\u53D8\u5C97</h3><p>\u5F53\u524D\u8EAB\u4EFD\uFF1A${escapeHtml(currentIdentityLabel)}\u3002\u9009\u62E9\u76EE\u6807\u8EAB\u4EFD\u5E76\u8BF4\u660E\u539F\u56E0\uFF0C\u7531\u76EE\u6807\u5C97\u4F4D\u53CA\u4EE5\u4E0A\u6743\u9650\u7684\u7BA1\u7406\u4EBA\u5458\u5BA1\u6838\u3002</p></div>
          <button class="button-ghost" type="button" data-action="close-overlay">\u5173\u95ED</button>
        </div>
        <form class="auth-form" data-form="role-change-request">
          <label class="field-group"><span class="field-label">\u76EE\u6807\u8EAB\u4EFD</span><select class="field-select" name="requestedIdentity" required>${identityOptions}</select></label>
          <label class="field-group"><span class="field-label">\u53D8\u5C97\u539F\u56E0</span><textarea class="field-textarea" name="reason" required placeholder="\u8BF4\u660E\u53D8\u5C97\u7406\u7531\uFF0C\u4F8B\u5982\u5B8C\u6210\u57F9\u8BAD\u3001\u80FD\u529B\u63D0\u5347\u3001\u627F\u62C5\u65B0\u804C\u8D23\u6216\u4E2A\u4EBA\u8C03\u6574\u7B49"></textarea></label>
<div class="button-row">
             <button class="button-primary" type="submit" ${state.formLoading === "role-change-request" ? "disabled" : ""}>\u63D0\u4EA4\u53D8\u5C97\u7533\u8BF7</button>
             <button class="button-ghost" type="button" data-action="close-overlay">\u53D6\u6D88</button>
           </div>
        </form>
      </div>
    </div>
  `;
}
function renderPromotionDetailModal() {
  const approval = getApprovalById(state.modal.approvalId);
  const member = approval ? getMemberById(approval.targetId) : null;
  if (!approval || !member) return "";
  return `
    <div class="modal">
      <div class="modal-card modal-card-completion glass-card">
        <div class="section-header">
          <div><h3>\u8F6C\u6B63\u7533\u8BF7\u8BE6\u60C5</h3><p>\u67E5\u770B\u80B2\u82D7\u6210\u5458\u63D0\u4EA4\u7684\u8F6C\u6B63\u8BF4\u660E\u4E0E\u9644\u4EF6\u6750\u6599\u3002</p></div>
          <button class="button-ghost" type="button" data-action="close-overlay">\u5173\u95ED</button>
        </div>
        <div class="definition-list">
          <div class="definition-row"><span>\u7533\u8BF7\u6210\u5458</span><strong>${escapeHtml(member.name)}</strong></div>
          <div class="definition-row"><span>\u7533\u8BF7\u65F6\u95F4</span><strong>${formatDateTime(approval.createdAt)}</strong></div>
        </div>
        <section class="panel">
          <div class="section-header"><div><h3>\u8BF4\u660E</h3><p>\u7533\u8BF7\u4EBA\u63D0\u4EA4\u7684\u8F6C\u6B63\u8BF4\u660E\u3002</p></div></div>
          <div class="comment-card"><p>${escapeHtml(approval.comment || "\u6682\u65E0\u8BF4\u660E")}</p></div>
        </section>
        <section class="panel">
          <div class="section-header"><div><h3>\u9644\u4EF6\u8D44\u6599</h3><p>\u7533\u8BF7\u65F6\u4E0A\u4F20\u7684\u672C\u5730\u9644\u4EF6\u3002</p></div></div>
          <div class="comment-list">${(approval.attachments || []).length ? approval.attachments.map((attachment) => renderAttachmentCard(attachment)).join("") : renderEmpty("\u5F53\u524D\u6CA1\u6709\u4E0A\u4F20\u9644\u4EF6\u3002")}</div>
        </section>
        <div class="button-row">
          ${approval.status === "pending" && canReview() ? `<button class="button-primary" type="button" data-action="approve-promotion" data-approval-id="${approval.id}">\u901A\u8FC7\u8F6C\u6B63</button>` : ""}
          ${approval.status === "pending" && canReview() ? `<button class="button-danger" type="button" data-action="reject-promotion" data-approval-id="${approval.id}">\u62D2\u7EDD\u7533\u8BF7</button>` : ""}
          ${canDeleteApprovalRecord(approval) ? `<button class="button-danger" type="button" data-action="delete-approval" data-approval-id="${approval.id}">\u5220\u9664\u8BB0\u5F55</button>` : ""}
        </div>
      </div>
    </div>
  `;
}
function renderTaskCompletionModal() {
  const task = getTaskById(state.modal.taskId);
  if (!task) return "";
  const latestSubmissionSummary = getLatestSubmissionSummary(task);
  const existingSubmissionAttachments = getSubmissionAttachments(task);
  const stagedProgressFiles = Array.isArray(state.modal.pendingFiles) ? state.modal.pendingFiles : [];
  return `
    <div class="modal">
      <div class="modal-card modal-card-completion glass-card">
        <div class="section-header">
          <div><h3>\u5B8C\u6210\u63D0\u4EA4</h3><p>\u4EFB\u52A1\u8FDB\u5EA6\u5230 100% \u540E\uFF0C\u9700\u8981\u586B\u5199\u6210\u679C\u8BF4\u660E\u5E76\u628A\u9644\u4EF6\u4E0A\u4F20\u5230\u8FD9\u53F0\u7535\u8111\u7684\u672C\u5730\u76EE\u5F55\u540E\u624D\u80FD\u8FDB\u5165\u5F85\u5BA1\u6838\u3002</p></div>
          <button class="button-ghost" type="button" data-action="close-overlay">\u53D6\u6D88</button>
        </div>
        <form class="auth-form" data-form="task-submit" data-task-id="${task.id}">
          <input type="hidden" name="progressNote" value="${escapeAttribute(state.modal.progressNote || "")}">
          <label class="field-group"><span class="field-label">\u6210\u679C\u8BF4\u660E</span><textarea class="field-textarea" name="summary" placeholder="\u63CF\u8FF0\u5B8C\u6210\u5185\u5BB9\u3001\u9A8C\u6536\u65B9\u5F0F\u4E0E\u4EA7\u51FA\u7ED3\u8BBA" required>${escapeHtml(latestSubmissionSummary)}</textarea></label>
          <label class="field-group"><span class="field-label">\u672C\u5730\u9644\u4EF6\u4E0A\u4F20</span><input class="field-input field-file-input" type="file" name="attachments" multiple onchange="this.nextElementSibling.textContent = this.files.length > 5 ? '\u5355\u6B21\u6700\u591A\u4E0A\u4F20 5 \u4E2A\u6587\u4EF6\u3002' : ''"><span class="helper-text file-count-warn" style="color:var(--danger)"></span></label>
          <div class="helper-text">\u9644\u4EF6\u4F1A\u4E0A\u4F20\u5230\u4F60\u7535\u8111\u7684 data/uploads/${escapeHtml(task.id)} \u76EE\u5F55\u3002\u53EF\u4E00\u6B21\u9009\u62E9\u591A\u4E2A\u6587\u4EF6\uFF1B\u5982\u679C\u672C\u6B21\u4E0D\u91CD\u65B0\u9009\u62E9\uFF0C\u5C06\u4FDD\u7559\u5F53\u524D\u5DF2\u4E0A\u4F20\u7684\u9644\u4EF6\u3002</div>
          ${stagedProgressFiles.length ? `<div class="helper-text">\u5F53\u524D\u6709 ${stagedProgressFiles.length} \u4E2A\u4ECE"\u66F4\u65B0\u8FDB\u5EA6"\u5E26\u5165\u7684\u9644\u4EF6\uFF0C\u4F1A\u5728\u63D0\u4EA4\u5BA1\u6838\u65F6\u4E00\u5E76\u4E0A\u4F20\u3002</div>` : ""}
          ${existingSubmissionAttachments.length ? `<div class="attachment-list-inline">${existingSubmissionAttachments.map((attachment) => `<span class="attachment-chip">${escapeHtml(attachment.name || "\u5DF2\u4E0A\u4F20\u9644\u4EF6")}</span>`).join("")}</div>` : ""}
<div class="button-row">
             <button class="button-primary" type="submit" ${state.formLoading === "task-submit" ? "disabled" : ""}>\u63D0\u4EA4\u5BA1\u6838</button>
            <button class="button-ghost" type="button" data-action="close-overlay">\u53D6\u6D88</button>
          </div>
        </form>
      </div>
    </div>
  `;
}
function renderTaskDetailModal() {
  const task = getTaskById(state.modal.taskId);
  if (!task) return "";
  return `
    <div class="modal">
      <div class="modal-card modal-card-task glass-card">
        <div class="section-header">
          <div><h3>\u4EFB\u52A1\u8BE6\u60C5</h3><p>\u67E5\u770B\u5B8C\u6574\u4EFB\u52A1\u4FE1\u606F\u3001\u53C2\u4E0E\u6210\u5458\u3001\u8BC4\u8BBA\u3001\u6210\u679C\u4E0E\u64CD\u4F5C\u533A\u3002</p></div>
          <div class="button-row">
            ${canEditTask(task) ? `<button class="button-ghost" type="button" data-action="open-edit-task" data-task-id="${task.id}">\u7F16\u8F91</button>` : ""}
            <button class="button-ghost" type="button" data-action="open-share-task" data-task-id="${task.id}">\u5206\u4EAB</button>
            <button class="button-ghost" type="button" data-action="close-overlay">\u5173\u95ED</button>
          </div>
        </div>
        ${renderTaskDetail(task)}
      </div>
    </div>
  `;
}
function renderShareTaskModal() {
  const task = getTaskById(state.modal.taskId);
  if (!task) return "";
  const owner = getMemberById(task.ownerId);
  const statusText = dictionaries.taskStatuses[task.status] || task.status;
  const priorityText = dictionaries.priorities[task.priority] || task.priority;
  const difficultyText = dictionaries.difficulties[task.difficulty] || task.difficulty;
  const typeText = dictionaries.taskTypes[task.type] || task.type;
  const tagsText = (task.tags || []).join("\u3001") || "\u65E0";
  const dueText = task.dueAt ? new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(task.dueAt)) : "\u672A\u8BBE\u7F6E";
  const shareText = [
    `\u{1F4CB} ${task.title}`,
    `\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501`,
    `\u72B6\u6001\uFF1A${statusText}`,
    `\u4F18\u5148\u7EA7\uFF1A${priorityText}\u3000\u96BE\u5EA6\uFF1A${difficultyText}`,
    `\u7C7B\u578B\uFF1A${typeText}`,
    `\u90E8\u95E8\uFF1A${joinOr(task.departments || task.department, "\u672A\u6307\u5B9A")}\u3000\u65B9\u5411\uFF1A${joinOr(task.directions || task.direction, "\u672A\u6307\u5B9A")}\u3000\u5175\u79CD\uFF1A${joinOr(task.robotGroups || task.robotGroup, "\u901A\u7528")}`,
    `\u8D1F\u8D23\u4EBA\uFF1A${owner?.name || "\u672A\u8BBE\u7F6E"}`,
    `\u622A\u6B62\u65E5\u671F\uFF1A${dueText}`,
    `\u4EBA\u6570\uFF1A${getActiveParticipantCount(task.id)} / ${task.maxParticipants}`,
    `\u63A8\u8350\u4EBA\u7FA4\uFF1A${task.recommendedFor || "\u65E0"}`,
    `\u6807\u7B7E\uFF1A${tagsText}`,
    `\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501`,
    task.description,
    ``,
    task.acceptanceCriteria ? `\u9A8C\u6536\u6807\u51C6\uFF1A
${task.acceptanceCriteria}
` : "",
    `\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501`,
    `\u6765\u81EA\uFF1A\u9192\u72EE\u6218\u961F\u534F\u4F5C\u4E2D\u67A2`
  ].join("\n");
  return `
    <div class="modal">
      <div class="modal-card glass-card">
        <div class="section-header">
          <div><h3>\u5206\u4EAB\u4EFB\u52A1</h3><p>\u590D\u5236\u4E0B\u65B9\u6587\u672C\u5373\u53EF\u7C98\u8D34\u5230\u5176\u4ED6\u5E73\u53F0\u5206\u4EAB\u3002</p></div>
          <button class="button-ghost" type="button" data-action="close-overlay">\u5173\u95ED</button>
        </div>
        <textarea class="field-textarea share-textarea" readonly onclick="this.select();this.setSelectionRange(0,this.value.length)">${escapeHtml(shareText)}</textarea>
        <div class="button-row">
          <button class="button-primary" type="button" onclick="var t=this.parentElement.previousElementSibling;t.select();t.setSelectionRange(0,t.value.length);navigator.clipboard?.writeText(t.value).then(function(){alert('\u5DF2\u590D\u5236\u5230\u526A\u8D34\u677F')})">\u590D\u5236\u5230\u526A\u8D34\u677F</button>
        </div>
      </div>
    </div>
  `;
}
function renderTaskFormModal() {
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
          <div><h3>${cloning ? "\u590D\u5236\u4EFB\u52A1" : editing ? "\u7F16\u8F91\u4EFB\u52A1" : "\u65B0\u5EFA\u4EFB\u52A1"}</h3><p>${cloning ? `\u57FA\u4E8E\u300A${task?.title}\u300B\u521B\u5EFA\u526F\u672C\uFF0C\u53EF\u4FEE\u6539\u5B57\u6BB5\u540E\u4FDD\u5B58\u4E3A\u65B0\u4EFB\u52A1\u3002` : editing ? "\u4FEE\u6539\u4EFB\u52A1\u4FE1\u606F\u3001\u622A\u6B62\u65E5\u671F\u3001\u70B9\u6570\u548C\u516C\u5F00\u5C5E\u6027\u3002" : "\u6309 PRD \u5B57\u6BB5\u521B\u5EFA\u516C\u5F00\u4EFB\u52A1\uFF0C\u5E76\u81EA\u52A8\u540C\u6B65\u5230\u4EFB\u52A1\u5E02\u573A\u548C\u4EFB\u52A1\u7BA1\u7406\u3002"}</p></div>
          <button class="button-ghost" type="button" data-action="close-overlay">\u5173\u95ED</button>
        </div>
        <form class="auth-form" data-form="task-form" data-draft-key="${escapeAttribute(getDraftKey("task-form", taskId || ""))}">
          <input type="hidden" name="taskId" value="${escapeAttribute(task?.id || "")}">
          <div class="field-grid">
            <label class="field-group"><span class="field-label">\u4EFB\u52A1\u6807\u9898</span><input class="field-input" type="text" name="title" required value="${escapeAttribute(baseTitle)}"></label>
            <label class="field-group"><span class="field-label">\u4EFB\u52A1\u7C7B\u578B</span><select class="field-select" name="type" required>${renderSelectOptions(options.taskTypes, task?.type, dictionaries.taskTypes)}</select></label>
          </div>
          <div class="field-grid-3">
            <label class="field-group"><span class="field-label">\u6240\u5C5E\u90E8\u95E8</span><select class="field-select" name="departments" multiple required>${renderMultiSelectOptions(options.departments, toArray(task?.departments || task?.department))}</select></label>
            <label class="field-group"><span class="field-label">\u6240\u5C5E\u65B9\u5411</span><select class="field-select" name="directions" multiple>${renderMultiSelectOptions(options.directions, toArray(task?.directions || task?.direction))}</select></label>
            <label class="field-group"><span class="field-label">\u6240\u5C5E\u5175\u79CD</span><select class="field-select" name="robotGroups" multiple>${renderMultiSelectOptions(options.robotGroups, toArray(task?.robotGroups || task?.robotGroup))}</select></label>
          </div>
          <div class="field-grid-3">
            ${canDeleteAllGeneratedData() ? `
              <label class="field-group"><span class="field-label">\u72B6\u6001${editing ? "\uFF08\u7BA1\u7406\u5458\u5F3A\u5236\u8986\u76D6\uFF09" : ""}</span><select class="field-select" name="status">${renderSelectOptions(options.taskStatuses, task?.status || "todo", dictionaries.taskStatuses)}</select></label>
            ` : editing ? `
              <div class="field-group"><span class="field-label">\u72B6\u6001\uFF08\u81EA\u52A8\u63A8\u5BFC\uFF09</span><div class="field-input" style="display:flex;align-items:center">${dictionaries.taskStatuses[task?.status] || task?.status}</div></div>
            ` : `
              <input type="hidden" name="status" value="todo">
              <div class="field-group"><span class="field-label">\u72B6\u6001</span><div class="field-input" style="display:flex;align-items:center">${dictionaries.taskStatuses.todo}</div></div>
            `}
            <label class="field-group"><span class="field-label">\u4F18\u5148\u7EA7</span><select class="field-select" name="priority" required>${renderSelectOptions(options.priorities, task?.priority, dictionaries.priorities)}</select></label>
            <label class="field-group"><span class="field-label">\u96BE\u5EA6\u7B49\u7EA7</span><select class="field-select" name="difficulty" required>${renderSelectOptions(options.difficulties, task?.difficulty, dictionaries.difficulties)}</select></label>
          </div>
          <div class="field-grid">
            <label class="field-group"><span class="field-label">\u622A\u6B62\u65E5\u671F</span><input class="field-input" type="datetime-local" name="dueAt" required value="${escapeAttribute(toDateTimeLocalValue(task?.dueAt || addDays(7)))}"></label>
            <label class="field-group"><span class="field-label">\u63A8\u8350\u9002\u5408\u4EBA\u7FA4</span><input class="field-input" type="text" name="recommendedFor" required value="${escapeAttribute(baseRecommended)}"></label>
          </div>
          <div class="field-grid-3">
            <label class="field-group"><span class="field-label">\u7814\u4E60\u70B9\u603B\u989D</span><input class="field-input" type="number" min="0" step="0.5" name="studyPoints" required value="${escapeAttribute(String(task?.studyPoints ?? 0))}"></label>
            <label class="field-group"><span class="field-label">\u5DE5\u65F6\u70B9\u603B\u989D</span><input class="field-input" type="number" min="0" step="0.5" name="laborPoints" required value="${escapeAttribute(String(task?.laborPoints ?? 0))}"></label>
            <label class="field-group"><span class="field-label">\u7BA1\u7406\u70B9</span><input class="field-input" type="number" min="0" step="0.5" name="managementPoints" required value="${escapeAttribute(String(task?.managementPoints ?? 0))}"></label>
          </div>
          <div class="field-grid">
            <label class="field-group"><span class="field-label">\u4EBA\u6570\u4E0A\u9650</span><input class="field-input" type="number" min="1" step="1" name="maxParticipants" required value="${escapeAttribute(String(task?.maxParticipants ?? 2))}"></label>
            <label class="field-group"><span class="field-label">\u662F\u5426\u9700\u8981\u5BA1\u6279</span><select class="field-select" name="approvalRequired" required><option value="true" ${task?.approvalRequired ?? false ? "selected" : ""}>\u9700\u8981\u5BA1\u6279</option><option value="false" ${!(task?.approvalRequired ?? false) ? "selected" : ""}>\u53EF\u76F4\u63A5\u9886\u53D6</option></select></label>
          </div>
          <label class="field-group"><span class="field-label">\u4EFB\u52A1\u63CF\u8FF0</span><textarea class="field-textarea" name="description" required>${escapeHtml(baseDescription)}</textarea></label>
          <label class="field-group"><span class="field-label">\u9A8C\u6536\u6807\u51C6</span><textarea class="field-textarea" name="acceptanceCriteria" placeholder="\u63CF\u8FF0\u4EFB\u52A1\u5B8C\u6210\u7684\u9A8C\u6536\u6761\u4EF6\uFF0C\u4F8B\u5982\uFF1A\u4EE3\u7801\u901A\u8FC7\u7F16\u8BD1\u3001\u6587\u6863\u8BC4\u5BA1\u901A\u8FC7\u7B49">${escapeHtml(baseAcceptance)}</textarea></label>
          <label class="field-group"><span class="field-label">\u6807\u7B7E</span><input class="field-input" type="text" name="tags" placeholder="\u7528\u9017\u53F7\u5206\u9694\uFF0C\u4F8B\u5982 \u6B65\u5175, \u63A7\u5236, \u65B0\u4EBA\u53EF\u53C2\u4E0E" value="${escapeAttribute(baseTags)}"></label>
          <input type="hidden" name="ownerId" value="${escapeAttribute(task?.ownerId || currentMember.id)}">
<div class="button-row">
             <button class="button-primary" type="submit" ${state.formLoading === "task-form" ? "disabled" : ""}>${editing ? "\u4FDD\u5B58\u4EFB\u52A1" : "\u521B\u5EFA\u4EFB\u52A1"}</button>
            ${canDelete ? `<button class="button-danger" type="button" data-action="delete-task" data-task-id="${task.id}">\u5220\u9664\u4EFB\u52A1</button>` : ""}
            ${editing ? `<button class="button-ghost" type="button" data-action="clone-task" data-task-id="${task.id}">\u590D\u5236\u4EFB\u52A1</button>` : ""}
            <button class="button-ghost" type="button" data-action="close-overlay">\u53D6\u6D88</button>
          </div>
        </form>
        ${editing && (task.attachments || []).length ? `
          <section class="panel">
            <div class="section-header"><div><h3>\u5DF2\u6709\u9644\u4EF6</h3><p>${task.attachments.length} \u4E2A\u6587\u4EF6\uFF0C\u53EF\u9010\u4E2A\u5220\u9664\u3002</p></div></div>
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
      <div class="section-header"><div><h3>\u53C2\u4E0E\u6210\u5458\u7BA1\u7406</h3><p>\u5F53\u524D ${activeParticipants.length} / ${task.maxParticipants} \u4EBA\u3002\u53EF\u6DFB\u52A0\u534F\u4F5C\u8005\u3001\u79FB\u9664\u534F\u4F5C\u8005\uFF0C\u5E76\u5728\u8D1F\u8D23\u4EBA\u53D8\u66F4\u65F6\u6539\u6D3E\u65B0\u7684\u8D1F\u8D23\u4EBA\u3002</p></div></div>
      <form class="auth-form" data-form="task-participant-add" data-task-id="${task.id}">
        <div class="field-grid">
          <label class="field-group">
            <span class="field-label">\u6DFB\u52A0\u534F\u4F5C\u8005</span>
            <input class="field-input" type="text" data-participant-search="${escapeAttribute(task.id)}" placeholder="\u8F93\u5165\u59D3\u540D\u641C\u7D22..." style="margin-bottom:6px">
            <select class="field-select" name="memberId" data-participant-select="${escapeAttribute(task.id)}" ${candidateMembers.length && seatsRemaining > 0 ? "required" : "disabled"}>
              ${candidateMembers.length && seatsRemaining > 0 ? candidateMembers.map((member) => `<option value="${member.id}">${escapeHtml(member.name)} \xB7 ${escapeHtml(member.departments[0] || "\u672A\u5206\u7EC4")}</option>`).join("") : '<option value="">\u5F53\u524D\u6CA1\u6709\u53EF\u52A0\u5165\u6210\u5458</option>'}
            </select>
          </label>
          <div class="button-row"><button class="button-secondary" type="submit" ${state.formLoading === "task-participant-add" ? "disabled" : ""} ${candidateMembers.length && seatsRemaining > 0 ? "" : "disabled"}>\u6DFB\u52A0\u6210\u5458</button></div>
        </div>
      </form>
      ${seatsRemaining === 0 ? '<div class="helper-text">\u5F53\u524D\u4EFB\u52A1\u4EBA\u6570\u5DF2\u6EE1\u3002\u5982\u9700\u65B0\u589E\u6210\u5458\uFF0C\u8BF7\u5148\u63D0\u9AD8\u4EBA\u6570\u4E0A\u9650\u6216\u79FB\u9664\u73B0\u6709\u534F\u4F5C\u8005\u3002</div>' : ""}
      ${!candidateMembers.length && seatsRemaining > 0 ? '<div class="helper-text">\u5F53\u524D\u6CA1\u6709\u7B26\u5408\u6761\u4EF6\u7684\u65B0\u6210\u5458\u3002\u5F85\u5BA1\u6838\u3001\u9000\u4F11\u3001\u505C\u7528\u6216\u6307\u5BFC\u8001\u5E08\u8D26\u53F7\u4E0D\u4F1A\u51FA\u73B0\u5728\u53EF\u52A0\u5165\u5217\u8868\u4E2D\u3002</div>' : ""}
      <div class="member-stack">${activeParticipants.map((participant) => renderTaskEditParticipantRow(task, participant)).join("")}</div>
    </section>
  `;
}
function getTaskParticipantAddCandidates(task) {
  const activeParticipants = getTaskParticipantRecords(task.id).filter((participant) => participant.status === "involved");
  return state.database.members.filter((member) => canMemberBeAddedToTask(member)).filter((member) => !activeParticipants.some((participant) => participant.memberId === member.id)).sort((left, right) => left.name.localeCompare(right.name, "zh-CN"));
}
function renderTaskEditParticipantRow(task, participant) {
  const member = getMemberById(participant.memberId);
  const isOwner = task.ownerId === participant.memberId;
  return `
    <div class="member-card">
      <div class="member-top">
        <div>
          <h4>${escapeHtml(member?.name || "\u672A\u77E5\u6210\u5458")}</h4>
          <div class="member-meta">
            <span>${escapeHtml(participant.role)}</span>
            <span>${escapeHtml(participant.joinType === "middle" ? "\u4E2D\u9014\u52A0\u5165" : "\u521D\u59CB\u53C2\u4E0E")}</span>
            <span>${escapeHtml(member?.departments?.[0] || "\u672A\u5206\u7EC4")}</span>
            <span>${escapeHtml(dictionaries.memberStatuses[member?.memberStatus] || "\u6B63\u5E38")}</span>
          </div>
        </div>
        <span class="point-pill">\u6BD4\u4F8B ${participant.contributionRatio}</span>
      </div>
      <div class="button-row">
        ${!isOwner ? `<button class="button-secondary" type="button" data-action="open-owner-reassign" data-task-id="${task.id}" data-member-id="${participant.memberId}">\u8BBE\u4E3A\u8D1F\u8D23\u4EBA</button>` : '<button class="button-secondary" type="button" disabled>\u5F53\u524D\u8D1F\u8D23\u4EBA</button>'}
        ${!isOwner ? `<button class="button-danger" type="button" data-action="remove-task-participant" data-task-id="${task.id}" data-member-id="${participant.memberId}">\u79FB\u9664\u534F\u4F5C\u8005</button>` : ""}
      </div>
    </div>
  `;
}
function renderMemberFormModal() {
  const member = getMemberById(state.modal.memberId);
  if (!member) return "";
  const lifecycleExplanation = !member.hiddenFromDirectory && member.memberStatus === "normal" ? getLifecycleActionDefinition("force-retire-member", member.id)?.description || "" : "";
  const blockingTasks = member.hiddenFromDirectory ? [] : getLifecycleBlockingTasks(member.id);
  return `
    <div class="modal">
      <div class="modal-card glass-card">
        <div class="section-header">
          <div><h3>\u7F16\u8F91\u6210\u5458</h3><p>\u7BA1\u7406\u5458\u53EF\u76F4\u63A5\u4FEE\u6539\u6210\u5458\u8EAB\u4EFD\u3001\u89D2\u8272\u3001\u90E8\u95E8\u3001\u65B9\u5411\u3001\u5175\u79CD\u4E0E\u72B6\u6001\u3002</p></div>
          <button class="button-ghost" type="button" data-action="close-overlay">\u5173\u95ED</button>
        </div>
        ${blockingTasks.length ? `
          <section class="panel">
            <div class="section-header"><div><h3>\u751F\u547D\u5468\u671F\u64CD\u4F5C\u524D\u7F6E\u63D0\u9192</h3><p>\u5F53\u524D\u6210\u5458\u4ECD\u6709\u5173\u8054\u4E2D\u7684\u4EFB\u52A1\u3002\u5F3A\u5236\u9000\u4F11\u6216\u505C\u7528\u524D\uFF0C\u5FC5\u987B\u5148\u5B8C\u6210\u8D1F\u8D23\u4EBA\u6539\u6D3E\u6216\u79FB\u9664\u53C2\u4E0E\u5173\u7CFB\u3002</p></div></div>
            <div class="timeline-grid">${blockingTasks.map((task) => renderTimelineCard(task.title, `${escapeHtml(dictionaries.taskStatuses[task.status])} \xB7 \u8D1F\u8D23\u4EBA ${escapeHtml(getMemberById(task.ownerId)?.name || "\u672A\u8BBE\u7F6E")}`)).join("")}</div>
          </section>
        ` : ""}
        <form class="auth-form" data-form="member-form">
          <input type="hidden" name="memberId" value="${escapeAttribute(member.id)}">
          <div class="field-grid">
            <label class="field-group"><span class="field-label">\u59D3\u540D</span><input class="field-input" type="text" name="name" value="${escapeAttribute(member.name)}" required></label>
            <label class="field-group"><span class="field-label">\u624B\u673A\u53F7</span><input class="field-input" type="text" name="phone" value="${escapeAttribute(member.phone || "")}"></label>
          </div>
          <div class="field-grid-3">
            <label class="field-group"><span class="field-label">\u6210\u5458\u8EAB\u4EFD</span><select class="field-select" name="identity" required>${renderSelectOptions(options.identities, member.identity, dictionaries.identities)}</select></label>
            <label class="field-group"><span class="field-label">\u6210\u5458\u72B6\u6001</span><select class="field-select" name="memberStatus" required>${renderSelectOptions(options.memberStatuses.filter((status) => !["retired", "disabled"].includes(status)), member.memberStatus, dictionaries.memberStatuses)}</select></label>
          </div>
          <div class="field-grid">
            <label class="field-group"><span class="field-label">\u90E8\u95E8</span><select class="field-select" name="departments" required>${renderSelectOptions(options.departments, member.departments[0] || "")}</select></label>
            <label class="field-group"><span class="field-label">\u65B9\u5411</span><select class="field-select" name="directions"><option value="">\u672A\u6307\u5B9A</option>${renderSelectOptions(options.directions, member.directions[0] || "")}</select></label>
          </div>
          <div class="field-grid">
            <label class="field-group"><span class="field-label">\u5175\u79CD\u7EC4</span><select class="field-select" name="robotGroups"><option value="">\u672A\u6307\u5B9A</option>${renderSelectOptions(options.robotGroups, member.robotGroups[0] || "")}</select></label>
            <label class="field-group"><span class="field-label">\u6280\u80FD\u6807\u7B7E</span><input class="field-input" type="text" name="skillTags" value="${escapeAttribute(member.skillTags.join(", "))}"></label>
          </div>
          <label class="field-group"><span class="field-label">\u4E2A\u4EBA\u7B80\u4ECB</span><textarea class="field-textarea" name="bio">${escapeHtml(member.bio || "")}</textarea></label>
<div class="button-row">
             <button class="button-primary" type="submit" ${state.formLoading === "member-form" ? "disabled" : ""}>\u4FDD\u5B58\u6210\u5458\u8D44\u6599</button>
            ${!member.hiddenFromDirectory && member.memberStatus !== "retired" && member.memberStatus !== "disabled" ? `<button class="button-danger" type="button" data-action="open-force-retire-member" data-member-id="${member.id}">\u5F3A\u5236\u9000\u4F11</button>` : ""}
            ${!member.hiddenFromDirectory && member.memberStatus !== "disabled" ? `<button class="button-danger" type="button" data-action="open-disable-member" data-member-id="${member.id}">\u6CE8\u9500 / \u505C\u7528</button>` : ""}
            ${!member.hiddenFromDirectory && member.memberStatus === "disabled" ? `<button class="button-secondary" type="button" data-action="open-restore-member" data-member-id="${member.id}">\u6062\u590D\u8D26\u53F7</button>` : ""}
            <button class="button-ghost" type="button" data-action="close-overlay">\u53D6\u6D88</button>
          </div>
        </form>
        ${lifecycleExplanation ? `<div class="helper-text">${escapeHtml(lifecycleExplanation)}</div>` : ""}
      </div>
    </div>
  `;
}
function renderApprovalActionModal() {
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
          <div><h3>${escapeHtml(dictionaries.approvalTypes[approval.type] || "\u5BA1\u6838")}</h3><p>${escapeHtml(target.subtitle)}</p></div>
          <button class="button-ghost" type="button" data-action="close-overlay">\u5173\u95ED</button>
        </div>
        ${isCompletionApproval && task ? `
          <section class="panel">
            <div class="definition-list">
              <div class="definition-row"><span>\u4EFB\u52A1\u6807\u9898</span><strong>${escapeHtml(task.title)}</strong></div>
              <div class="definition-row"><span>\u63D0\u4EA4\u6210\u5458</span><strong>${escapeHtml(getMemberById(approval.submitterId)?.name || "\u672A\u77E5\u6210\u5458")}</strong></div>
              <div class="definition-row"><span>\u90E8\u95E8 / \u65B9\u5411 / \u5175\u79CD</span><strong>${escapeHtml(joinOr(task.departments || task.department, "\u672A\u6307\u5B9A\u90E8\u95E8"))} / ${escapeHtml(joinOr(task.directions || task.direction, "\u672A\u6307\u5B9A\u65B9\u5411"))} / ${escapeHtml(joinOr(task.robotGroups || task.robotGroup, "\u901A\u7528"))}</strong></div>
            </div>
          </section>
          <section class="panel">
            <div class="section-header"><div><h3>\u6210\u679C\u8BF4\u660E</h3><p>\u8FD9\u91CC\u5C55\u793A\u6210\u5458\u63D0\u4EA4\u5BA1\u6838\u65F6\u586B\u5199\u7684\u771F\u5B9E\u6210\u679C\u8BF4\u660E\uFF0C\u800C\u4E0D\u662F\u56FA\u5B9A\u5BA1\u6838\u6587\u6848\u3002</p></div></div>
            <div class="comment-card"><p>${escapeHtml(submissionSummary || "\u5F53\u524D\u6CA1\u6709\u627E\u5230\u6210\u679C\u8BF4\u660E\u3002")}</p></div>
          </section>
          <section class="panel">
            <div class="section-header"><div><h3>\u63D0\u4EA4\u9644\u4EF6</h3><p>\u5982\u679C\u6210\u5458\u5728\u63D0\u4EA4\u5BA1\u6838\u65F6\u4E0A\u4F20\u4E86\u9644\u4EF6\uFF0C\u4F1A\u5728\u8FD9\u91CC\u5C55\u793A\u3002</p></div></div>
            <div class="comment-list">${submissionAttachments.length ? submissionAttachments.map((attachment) => renderAttachmentCard(attachment)).join("") : renderEmpty("\u5F53\u524D\u6CA1\u6709\u63D0\u4EA4\u9644\u4EF6\u3002")}</div>
          </section>
          ${renderSettlementPreviewPanel(task, settlementPreview)}
        ` : approval.comment ? `<section class="panel"><div class="comment-card"><p>${escapeHtml(approval.comment)}</p></div></section>` : ""}
        <div class="button-row">
          ${isApprovable && approveAction ? `<button class="button-primary" type="button" data-action="${approveAction}" data-approval-id="${approval.id}">\u901A\u8FC7</button>` : ""}
          ${isApprovable && isCompletionApproval ? `<button class="button-danger" type="button" data-action="return-completion" data-approval-id="${approval.id}">\u9A73\u56DE\u4FEE\u6539</button>` : ""}
          ${isApprovable && !isCompletionApproval ? `<button class="button-danger" type="button" data-action="reject-approval" data-approval-id="${approval.id}">\u62D2\u7EDD</button>` : ""}
          <button class="button-ghost" type="button" data-action="close-overlay">\u5173\u95ED</button>
        </div>
      </div>
    </div>
  `;
}
function renderSettlementPreviewPanel(task, settlementPreview) {
  if (!task || !settlementPreview) {
    return "";
  }
  const participantCards = settlementPreview.memberSettlements.map((entry) => renderSettlementPreviewCard(entry)).join("");
  return `
    <section class="panel">
      <div class="section-header">
        <div>
          <h3>\u79EF\u5206\u5206\u914D\u9884\u89C8</h3>
          <p>\u5BA1\u6838\u901A\u8FC7\u540E\u4F1A\u7ACB\u5373\u6309\u5F53\u524D\u6BD4\u4F8B\u7ED3\u7B97\u3002\u8FD9\u91CC\u5C55\u793A\u7684\u9884\u4F30\u503C\u4E0E\u5B9E\u9645\u5165\u8D26\u4F7F\u7528\u540C\u4E00\u5957\u89C4\u5219\u3002</p>
        </div>
      </div>
      <div class="task-points">
        ${renderPointPill("\u603B\u7814\u4E60\u70B9", settlementPreview.totals.study)}
        ${renderPointPill("\u603B\u5DE5\u65F6\u70B9", settlementPreview.totals.labor)}
        ${renderPointPill("\u603B\u7BA1\u7406\u70B9", settlementPreview.totals.management)}
        ${renderPointPill("\u603B\u8BA1", settlementPreview.totals.total)}
      </div>
      <div class="helper-text" style="margin-top:12px">
        ${escapeHtml(`\u4E2D\u9014\u52A0\u5165\u6298\u6263 ${settlementPreview.middleJoinDiscount}x`)}
        ${settlementPreview.wasOverdue ? ` \xB7 ${escapeHtml(`\u903E\u671F\u6298\u6263 ${settlementPreview.overdueDiscount}x`)}` : ""}
      </div>
      <div class="comment-list" style="margin-top:16px">
        ${participantCards || renderEmpty("\u5F53\u524D\u6CA1\u6709\u53EF\u7ED3\u7B97\u7684\u53C2\u4E0E\u6210\u5458\u3002")}
      </div>
    </section>
  `;
}
function renderSettlementPreviewCard(entry) {
  const memberName = entry.member?.name || "\u672A\u77E5\u6210\u5458";
  const roleLabel = entry.participant?.role || (entry.managementAmount > 0 ? "\u8D1F\u8D23\u4EBA" : "\u53C2\u4E0E\u6210\u5458");
  const joinTypeLabel = entry.participant ? entry.joinType === "middle" ? "\u4E2D\u9014\u52A0\u5165" : "\u521D\u59CB\u53C2\u4E0E" : "\u8D1F\u8D23\u4EBA\u7ED3\u7B97";
  const statusText = entry.eligible ? "\u6B63\u5E38\u53C2\u4E0E\u7ED3\u7B97" : "\u5F53\u524D\u72B6\u6001\u4E0D\u53C2\u4E0E\u79EF\u5206\u7D2F\u8BA1";
  return `
    <div class="comment-card">
      <div class="section-header" style="margin-bottom:8px">
        <div>
          <strong>${escapeHtml(memberName)}</strong>
          <div class="helper-text">${escapeHtml(roleLabel)} \xB7 ${escapeHtml(joinTypeLabel)} \xB7 ${escapeHtml(statusText)}</div>
        </div>
        ${entry.participant ? `<span class="point-pill">\u6743\u91CD ${escapeHtml(String(entry.adjustedWeight))}</span>` : ""}
      </div>
      <div class="task-points">
        ${renderPointPill("\u7814\u4E60\u70B9", entry.studyAmount)}
        ${renderPointPill("\u5DE5\u65F6\u70B9", entry.laborAmount)}
        ${renderPointPill("\u7BA1\u7406\u70B9", entry.managementAmount)}
        ${renderPointPill("\u5408\u8BA1", entry.totalAmount)}
      </div>
      ${entry.participant ? `<div class="helper-text">\u8D21\u732E\u6BD4\u4F8B ${escapeHtml(String(entry.participant.contributionRatio))}</div>` : ""}
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
function renderRegistrationReviewModal() {
  const approval = getApprovalById(state.modal.approvalId);
  const pendingMember = approval ? getMemberById(approval.targetId) : null;
  if (!approval || !pendingMember) return "";
  return `
    <div class="modal">
      <div class="modal-card glass-card">
        <div class="section-header">
          <div><h3>\u6CE8\u518C\u5BA1\u6838</h3><p>\u4E3A\u5F85\u5BA1\u6838\u6210\u5458\u5206\u914D\u8EAB\u4EFD\u3001\u6743\u9650\u3001\u90E8\u95E8\u548C\u65B9\u5411\uFF0C\u5BA1\u6838\u901A\u8FC7\u540E\u5373\u53EF\u8FDB\u5165\u7CFB\u7EDF\u3002</p></div>
          <button class="button-ghost" type="button" data-action="close-overlay">\u5173\u95ED</button>
        </div>
        <form class="auth-form" data-form="registration-review">
          <input type="hidden" name="approvalId" value="${escapeAttribute(approval.id)}">
          <input type="hidden" name="memberId" value="${escapeAttribute(pendingMember.id)}">
          <div class="field-grid">
            <label class="field-group"><span class="field-label">\u59D3\u540D</span><input class="field-input" type="text" value="${escapeAttribute(pendingMember.name)}" disabled></label>
            <label class="field-group"><span class="field-label">\u610F\u5411\u7EC4\u522B</span><input class="field-input" type="text" value="${escapeAttribute(pendingMember.departments.join(" / "))}" disabled></label>
          </div>
          <div class="field-grid-3">
            <label class="field-group"><span class="field-label">\u6210\u5458\u8EAB\u4EFD</span><select class="field-select" name="identity" required>${renderSelectOptions(options.identities, "seedling", dictionaries.identities)}</select></label>
            <label class="field-group"><span class="field-label">\u72B6\u6001</span><select class="field-select" name="memberStatus" required>${renderSelectOptions(options.memberStatuses.filter((status) => !["retired", "disabled"].includes(status)), "normal", dictionaries.memberStatuses)}</select></label>
          </div>
          <div class="field-grid">
            <label class="field-group"><span class="field-label">\u90E8\u95E8</span><select class="field-select" name="departments" required>${renderSelectOptions(options.departments, pendingMember.departments[0] || options.departments[0])}</select></label>
            <label class="field-group"><span class="field-label">\u65B9\u5411</span><select class="field-select" name="direction" required><option value="">\u8BF7\u9009\u62E9\u65B9\u5411</option>${renderSelectOptions(options.directions, pendingMember.directions[0] || "")}</select></label>
          </div>
          <div class="field-grid">
            <label class="field-group"><span class="field-label">\u5175\u79CD\u7EC4</span><select class="field-select" name="robotGroup" required><option value="">\u8BF7\u9009\u62E9\u5175\u79CD\u7EC4</option>${renderSelectOptions(options.robotGroups, pendingMember.robotGroups[0] || "")}</select></label>
          </div>
          <label class="field-group"><span class="field-label">\u4E2A\u4EBA\u7B80\u4ECB</span><textarea class="field-textarea" disabled>${escapeHtml(pendingMember.bio || "\u672A\u586B\u5199")}</textarea></label>
<div class="button-row">
             <button class="button-primary" type="submit" ${state.formLoading === "registration-review" ? "disabled" : ""}>\u5BA1\u6838\u901A\u8FC7</button>
            <button class="button-danger" type="button" data-action="reject-registration" data-approval-id="${approval.id}">\u62D2\u7EDD\u7533\u8BF7</button>
          </div>
        </form>
      </div>
    </div>
  `;
}
function renderFileManagerModal() {
  const files = state.settingsFiles;
  const fileIndex = state.attachmentsIndex || {};
  return `
    <div class="modal">
      <div class="modal-card modal-card-completion glass-card">
        <div class="section-header">
          <div><h3>\u6587\u4EF6\u7BA1\u7406</h3><p>${files ? `\u5171 ${files.length} \u4E2A\u4E0A\u4F20\u6587\u4EF6` : "\u52A0\u8F7D\u540E\u5373\u53EF\u67E5\u770B\u548C\u7BA1\u7406\u6240\u6709\u4E0A\u4F20\u5230\u670D\u52A1\u5668\u7684\u672C\u5730\u9644\u4EF6\u3002"}</p></div>
          <button class="button-ghost" type="button" data-action="close-overlay">\u5173\u95ED</button>
        </div>
        ${!files ? `
          <div class="button-row"><button class="button-primary" type="button" data-action="load-file-manager">\u52A0\u8F7D\u6587\u4EF6\u5217\u8868</button></div>
        ` : state.settingsFileLoading ? '<div class="helper-text">\u52A0\u8F7D\u4E2D...</div>' : files.length === 0 ? renderEmpty("\u5F53\u524D\u6CA1\u6709\u4E0A\u4F20\u6587\u4EF6\u3002") : (() => {
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
      const ta = fileIndex[a.path]?.uploadedAt || a.modifiedAt || "";
      const tb = fileIndex[b.path]?.uploadedAt || b.modifiedAt || "";
      return tb.localeCompare(ta);
    });
    if (state.settingsFilePage > 0 && filtered.length <= state.settingsFilePage * FILES_PER_PAGE) state.settingsFilePage = 0;
    const page = state.settingsFilePage;
    const totalPages = Math.max(1, Math.ceil(filtered.length / FILES_PER_PAGE));
    const pageFiles = filtered.slice(page * FILES_PER_PAGE, (page + 1) * FILES_PER_PAGE);
    return `
            <div class="toolbar-row">
              ${renderFilterField("\u641C\u7D22\u6587\u4EF6", "files", "query", state.fileFilters.query, "text", "\u641C\u7D22\u6587\u4EF6\u540D\u3001\u4EFB\u52A1\u3001\u4E0A\u4F20\u8005")}
              ${renderFilterSelect("\u6765\u6E90", "files", "source", state.fileFilters.source, ["submission", "progress", "progress_note", "task_attachment", "promotion", "orphan"], { submission: "\u6210\u679C\u63D0\u4EA4", progress: "\u8FDB\u5EA6\u66F4\u65B0", progress_note: "\u8FDB\u5EA6\u8BF4\u660E", task_attachment: "\u4EFB\u52A1\u8D44\u6599", promotion: "\u53D8\u5C97\u7533\u8BF7", orphan: "\u5B64\u7ACB\u6587\u4EF6" })}
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
                    <div class="helper-text">${timeLabel} \xB7 ${fileSizeLabel} \xB7 ${ref ? `${escapeHtml(ref.title)}${ref.uploadedByName ? ` \xB7 ${escapeHtml(ref.uploadedByName)}` : ""}` : "\u5B64\u7ACB\u6587\u4EF6"}</div>
                    <div class="button-row"><button class="button-danger" type="button" data-action="delete-upload-file" data-storage-path="${escapeAttribute(file.path)}" data-file-name="${escapeAttribute(originalName)}">\u5220\u9664</button></div>
                  </div>
                `;
    }).join("") : renderEmpty("\u6CA1\u6709\u5339\u914D\u7B5B\u9009\u6761\u4EF6\u7684\u6587\u4EF6\u3002")}
            </div>
            ${totalPages > 1 ? `
              <div class="button-row" style="justify-content:center;margin-top:16px">
                <button class="button-secondary" type="button" data-action="settings-file-page" data-page="${page - 1}" ${page === 0 ? "disabled" : ""}>< \u4E0A\u4E00\u9875</button>
                <span class="helper-text" style="margin:0 12px">\u7B2C ${page + 1} / ${totalPages} \u9875</span>
                <button class="button-secondary" type="button" data-action="settings-file-page" data-page="${page + 1}" ${page + 1 >= totalPages ? "disabled" : ""}>\u4E0B\u4E00\u9875 ></button>
              </div>` : ""}`;
  })()}
      </div>
    </div>
  `;
}
function renderTaskOwnerReassignModal() {
  const task = getTaskById(state.modal.taskId);
  if (!task) return "";
  const candidateParticipants = getTaskOwnerReassignCandidates(task);
  return `
    <div class="modal">
      <div class="modal-card modal-card-completion glass-card">
        <div class="section-header">
          <div><h3>\u6539\u6D3E\u8D1F\u8D23\u4EBA</h3><p>\u8D1F\u8D23\u4EBA\u4E0D\u80FD\u4E3A\u7A7A\u3002\u8BF7\u9009\u62E9\u65B0\u7684\u8D1F\u8D23\u4EBA\u540E\u4FDD\u5B58\uFF0C\u5F53\u524D\u8D1F\u8D23\u4EBA\u4F1A\u81EA\u52A8\u8F6C\u4E3A\u534F\u4F5C\u8005\u3002</p></div>
          <button class="button-ghost" type="button" data-action="close-overlay">\u5173\u95ED</button>
        </div>
        <form class="auth-form" data-form="task-owner-reassign" data-task-id="${task.id}">
          <label class="field-group">
            <span class="field-label">\u65B0\u7684\u8D1F\u8D23\u4EBA</span>
            <select class="field-select" name="memberId" required ${candidateParticipants.length ? "" : "disabled"}>
              ${candidateParticipants.length ? candidateParticipants.map((entry) => `<option value="${entry.member.id}" ${state.modal.nextOwnerId === entry.member.id ? "selected" : ""}>${escapeHtml(entry.member.name)} \xB7 ${escapeHtml(entry.participant.role)}</option>`).join("") : '<option value="">\u5F53\u524D\u6CA1\u6709\u53EF\u6539\u6D3E\u7684\u5019\u9009\u6210\u5458</option>'}
            </select>
          </label>
          ${!candidateParticipants.length ? '<div class="helper-text">\u8BF7\u5148\u5728\u4EFB\u52A1\u7F16\u8F91\u4E2D\u6DFB\u52A0\u81F3\u5C11\u4E00\u4F4D\u6B63\u5E38\u72B6\u6001\u7684\u534F\u4F5C\u8005\uFF0C\u518D\u6267\u884C\u8D1F\u8D23\u4EBA\u6539\u6D3E\u3002</div>' : ""}
          <div class="button-row">
            <button class="button-primary" type="submit" ${candidateParticipants.length ? "" : "disabled"}>\u786E\u8BA4\u6539\u6D3E</button>
            <button class="button-ghost" type="button" data-action="close-overlay">\u53D6\u6D88</button>
          </div>
        </form>
      </div>
    </div>
  `;
}
function renderPasswordChangeModal() {
  return `
    <div class="modal">
      <div class="modal-card glass-card">
        <div class="section-header">
          <div><h3>\u4FEE\u6539\u5BC6\u7801</h3><p>\u8F93\u5165\u5F53\u524D\u5BC6\u7801\u548C\u65B0\u5BC6\u7801\u5B8C\u6210\u4FEE\u6539\u3002</p></div>
          <button class="button-ghost" type="button" data-action="close-overlay">\u5173\u95ED</button>
        </div>
        <form class="auth-form" data-form="password-change">
          <label class="field-group"><span class="field-label">\u5F53\u524D\u5BC6\u7801</span><input class="field-input" type="password" name="oldPassword" required placeholder="\u8F93\u5165\u5F53\u524D\u767B\u5F55\u5BC6\u7801"></label>
          <label class="field-group"><span class="field-label">\u65B0\u5BC6\u7801</span><input class="field-input" type="password" name="newPassword" required placeholder="\u81F3\u5C11 6 \u4F4D" minlength="6"></label>
          <label class="field-group"><span class="field-label">\u786E\u8BA4\u65B0\u5BC6\u7801</span><input class="field-input" type="password" name="confirmPassword" required placeholder="\u518D\u6B21\u8F93\u5165\u65B0\u5BC6\u7801"></label>
          <div class="button-row">
            <button class="button-primary" type="submit" ${state.formLoading === "password-change" ? "disabled" : ""}>\u4FEE\u6539\u5BC6\u7801</button>
            <button class="button-ghost" type="button" data-action="close-overlay">\u53D6\u6D88</button>
          </div>
        </form>
      </div>
    </div>
  `;
}
function renderRetireFormModal() {
  const member = getCurrentMember();
  if (!member) return "";
  return `
    <div class="modal">
      <div class="modal-card glass-card">
        <div class="section-header">
          <div><h3>\u7533\u8BF7\u9000\u5F79</h3><p>\u586B\u5199\u9000\u5F79\u539F\u56E0\u548C\u7559\u8A00\uFF0C\u786E\u8BA4\u540E\u8D26\u53F7\u5C06\u5207\u6362\u4E3A\u53EA\u8BFB\u72B6\u6001\u3002</p></div>
          <button class="button-ghost" type="button" data-action="close-overlay">\u5173\u95ED</button>
        </div>
        <form class="auth-form" data-form="retire-form">
          <label class="field-group">
            <span class="field-label">\u9000\u5F79\u539F\u56E0\uFF08\u5FC5\u586B\uFF09</span>
            <textarea class="field-textarea" name="reason" required placeholder="\u8BF7\u7B80\u8981\u8BF4\u660E\u9000\u5F79\u539F\u56E0\uFF0C\u4F8B\u5982\uFF1A\u5B66\u4E1A\u538B\u529B\u3001\u65F6\u95F4\u4E0D\u8DB3\u7B49" style="min-height:80px"></textarea>
          </label>
          <label class="field-group">
            <span class="field-label">\u60F3\u7559\u4E0B\u7684\u8BDD\uFF08\u9009\u586B\uFF09</span>
            <textarea class="field-textarea" name="message" placeholder="\u53EF\u4EE5\u5199\u4E0B\u5BF9\u6218\u961F\u3001\u961F\u53CB\u7684\u5BC4\u8BED\u6216\u5EFA\u8BAE" style="min-height:80px"></textarea>
          </label>
          <div class="button-row">
            <button class="button-danger" type="submit" ${state.formLoading === "retire-form" ? "disabled" : ""}>\u63D0\u4EA4\u9000\u5F79\u7533\u8BF7</button>
            <button class="button-ghost" type="button" data-action="close-overlay">\u53D6\u6D88</button>
          </div>
        </form>
      </div>
    </div>
  `;
}
function renderProgressNoteFormModal() {
  const task = getTaskById(state.modal.taskId);
  if (!task) return "";
  return `
    <div class="modal">
      <div class="modal-card glass-card">
        <div class="section-header">
          <div><h3>\u6DFB\u52A0\u8FDB\u5EA6\u8BF4\u660E</h3><p>\u5F53\u524D\u8FDB\u5EA6 ${task.progressPercent}%\u3002\u8BB0\u5F55\u5F53\u524D\u9636\u6BB5\u7684\u5B8C\u6210\u5185\u5BB9\u4E0E\u9047\u5230\u7684\u95EE\u9898\u3002</p></div>
          <button class="button-ghost" type="button" data-action="close-overlay">\u5173\u95ED</button>
        </div>
        <form class="auth-form" data-form="progress-note-form" data-task-id="${task.id}">
          <input type="hidden" name="progressPercent" value="${task.progressPercent}">
          <label class="field-group"><span class="field-label">\u8FDB\u5EA6\u8BF4\u660E</span><textarea class="field-textarea" name="note" placeholder="\u63CF\u8FF0\u5F53\u524D\u5B8C\u6210\u7684\u5DE5\u4F5C\u3001\u9047\u5230\u7684\u95EE\u9898\u6216\u4E0B\u4E00\u6B65\u8BA1\u5212" style="min-height:100px"></textarea></label>
          <div class="button-row">
            <button class="button-primary" type="submit" ${state.formLoading === "progress-note-form" ? "disabled" : ""}>\u4FDD\u5B58\u8FDB\u5EA6\u8BF4\u660E</button>
            <button class="button-ghost" type="button" data-action="close-overlay">\u53D6\u6D88</button>
          </div>
        </form>
      </div>
    </div>
  `;
}
function renderTaskAttachmentFormModal() {
  const task = getTaskById(state.modal.taskId);
  if (!task) return "";
  return `
    <div class="modal">
      <div class="modal-card glass-card">
        <div class="section-header">
          <div><h3>\u4E0A\u4F20\u4EFB\u52A1\u9644\u4EF6</h3><p>\u4E0A\u4F20\u8D44\u6599\u6587\u4EF6\u5230\u4EFB\u52A1\u8D44\u6599\u533A\uFF0C\u4F9B\u6240\u6709\u53C2\u4E0E\u8005\u67E5\u770B\u3002</p></div>
          <button class="button-ghost" type="button" data-action="close-overlay">\u5173\u95ED</button>
        </div>
        <form class="auth-form" data-form="task-attachment-form" data-task-id="${task.id}">
          <label class="field-group"><span class="field-label">\u9009\u62E9\u6587\u4EF6</span><input class="field-input field-file-input" type="file" name="attachments" multiple onchange="this.nextElementSibling.textContent = this.files.length > 5 ? '\u5355\u6B21\u6700\u591A\u4E0A\u4F20 5 \u4E2A\u6587\u4EF6\u3002' : ''"><span class="helper-text file-count-warn" style="color:var(--danger)"></span></label>
          <div class="button-row">
            <button class="button-primary" type="submit" ${state.formLoading === "task-attachment-form" ? "disabled" : ""}>\u4E0A\u4F20\u9644\u4EF6</button>
            <button class="button-ghost" type="button" data-action="close-overlay">\u53D6\u6D88</button>
          </div>
        </form>
      </div>
    </div>
  `;
}
function getTaskOwnerReassignCandidates(task) {
  return getTaskParticipantRecords(task.id).filter((participant) => participant.status === "involved").map((participant) => ({ participant, member: getMemberById(participant.memberId) })).filter((entry) => entry.member && canMemberBeAddedToTask(entry.member)).filter((entry) => entry.member.id !== task.ownerId);
}

export {
  renderMemberDetailModal,
  renderSensitiveActionModal,
  renderRegistrationEditModal,
  renderProfileContentModal,
  renderRoleChangeRequestModal,
  renderPromotionDetailModal,
  renderTaskCompletionModal,
  renderTaskDetailModal,
  renderShareTaskModal,
  renderTaskFormModal,
  renderMemberFormModal,
  renderApprovalActionModal,
  renderRegistrationReviewModal,
  renderFileManagerModal,
  renderTaskOwnerReassignModal,
  renderPasswordChangeModal,
  renderRetireFormModal,
  renderProgressNoteFormModal,
  renderTaskAttachmentFormModal
};
