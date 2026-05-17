import { dictionaries, options, state } from "../../core/state.js";
import { escapeAttribute, escapeHtml } from "../../core/security.js";
import { formatDateTime } from "../../core/format.js";
import { getApprovalById, getCurrentUser, getLifecycleActionDefinition, getMemberById, getTaskById } from "../../domain/query.js";
import { getLatestSubmissionSummary, getSubmissionAttachments, getTaskSettlementPreview } from "../../domain/task.js";
import { canDeleteApprovalRecord, canReview, getLifecycleBlockingTasks } from "../../domain/permissions.js";
import { renderAttachmentCard, renderEmpty, renderPointPill, renderSelectOptions, renderTimelineCard } from "../components.js";
import { joinOr } from "../../core/utils.js";

export function render(modalType) {
  switch (modalType) {
    case "approval-action":
      return renderApprovalActionModal();
    case "password-change":
      return renderPasswordChangeModal();
    case "promotion-detail":
      return renderPromotionDetailModal();
    case "registration-edit":
      return renderRegistrationEditModal();
    case "registration-review":
      return renderRegistrationReviewModal();
    case "promotion-request":
    case "role-change-request":
      return renderRoleChangeRequestModal();
    case "sensitive-action":
      return renderSensitiveActionModal();
    default:
      return "";
  }
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
            <div class="timeline-grid">${blockers.map((task) => renderTimelineCard(task.title, `${dictionaries.taskStatuses[task.status] || task.status} · 负责人 ${getMemberById(task.ownerId)?.name || "未设置"}`)).join("")}</div>
          </section>
        ` : ""}
        <form class="auth-form" data-form="sensitive-action">
          <label class="field-group"><span class="field-label">确认当前操作者账号</span><input class="field-input" type="email" name="operatorEmail" required placeholder="请输入当前登录账号邮箱"></label>
          <label class="field-group"><span class="field-label">确认当前操作者密码</span><input class="field-input" type="password" name="password" required placeholder="请输入当前登录账号密码"></label>
          <div class="modal-actions-sticky">
            <div class="helper-text">为避免误操作，需要再次确认当前登录账号。</div>
            <div class="button-row">
              <button class="button-danger" type="submit">${escapeHtml(submitLabel)}</button>
              <button class="button-ghost" type="button" data-action="close-overlay">取消</button>
            </div>
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
          <div class="modal-actions-sticky">
            <div class="helper-text">保存后会同步刷新当前注册审核记录。</div>
            <div class="button-row">
              <button class="button-primary" type="submit" ${state.formLoading === "registration-edit" ? "disabled" : ""}>保存修改</button>
              <button class="button-ghost" type="button" data-action="close-overlay">取消</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  `;
}

export function renderRoleChangeRequestModal() {
  const member = getMemberById(getCurrentUser()?.memberId);
  if (!member) return "";
  const currentIdentityLabel = dictionaries.identities[member.identity];
  const identityOptions = Object.entries(dictionaries.identities)
    .filter(([key]) => key !== member.identity)
    .map(([key, label]) => `<option value="${key}">${escapeHtml(label)}</option>`)
    .join("");
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
          <div class="modal-actions-sticky">
            <div class="helper-text">提交后会进入审核中心，等待目标岗位及以上权限成员处理。</div>
            <div class="button-row">
              <button class="button-primary" type="submit" ${state.formLoading === "role-change-request" ? "disabled" : ""}>提交变岗申请</button>
              <button class="button-ghost" type="button" data-action="close-overlay">取消</button>
            </div>
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
        <div class="modal-actions-sticky">
          <div class="helper-text">审核通过后，该成员会进入新的成员身份。</div>
          <div class="button-row">
            ${approval.status === "pending" && canReview() ? `<button class="button-primary" type="button" data-action="approve-promotion" data-approval-id="${approval.id}">通过转正</button>` : ""}
            ${approval.status === "pending" && canReview() ? `<button class="button-danger" type="button" data-action="reject-promotion" data-approval-id="${approval.id}">拒绝申请</button>` : ""}
            ${canDeleteApprovalRecord(approval) ? `<button class="button-danger" type="button" data-action="delete-approval" data-approval-id="${approval.id}">删除记录</button>` : ""}
            <button class="button-ghost" type="button" data-action="close-overlay">关闭</button>
          </div>
        </div>
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
        <div class="modal-actions-sticky">
          <div class="helper-text">${isCompletionApproval ? "完成审核通过后会直接进入结算流程。" : "处理结果会即时同步到对应成员或任务记录。"}</div>
          <div class="button-row">
            ${isApprovable && approveAction ? `<button class="button-primary" type="button" data-action="${approveAction}" data-approval-id="${approval.id}">通过</button>` : ""}
            ${isApprovable && isCompletionApproval ? `<button class="button-danger" type="button" data-action="return-completion" data-approval-id="${approval.id}">驳回修改</button>` : ""}
            ${isApprovable && !isCompletionApproval ? `<button class="button-danger" type="button" data-action="reject-approval" data-approval-id="${approval.id}">拒绝</button>` : ""}
            <button class="button-ghost" type="button" data-action="close-overlay">关闭</button>
          </div>
        </div>
      </div>
    </div>
  `;
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
          </div>
          <div class="field-grid">
            <label class="field-group"><span class="field-label">部门</span><select class="field-select" name="departments" required>${renderSelectOptions(options.departments, pendingMember.departments[0] || options.departments[0])}</select></label>
            <label class="field-group"><span class="field-label">方向</span><select class="field-select" name="direction" required><option value="">请选择方向</option>${renderSelectOptions(options.directions, pendingMember.directions[0] || "")}</select></label>
          </div>
          <div class="field-grid">
            <label class="field-group"><span class="field-label">兵种组</span><select class="field-select" name="robotGroup" required><option value="">请选择兵种组</option>${renderSelectOptions(options.robotGroups, pendingMember.robotGroups[0] || "")}</select></label>
          </div>
          <label class="field-group"><span class="field-label">个人简介</span><textarea class="field-textarea" disabled>${escapeHtml(pendingMember.bio || "未填写")}</textarea></label>
          <div class="modal-actions-sticky">
            <div class="helper-text">审核通过后，成员即可带着分配好的身份和方向进入工作台。</div>
            <div class="button-row">
              <button class="button-primary" type="submit" ${state.formLoading === "registration-review" ? "disabled" : ""}>审核通过</button>
              <button class="button-danger" type="button" data-action="reject-registration" data-approval-id="${approval.id}">拒绝申请</button>
            </div>
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
          <div class="modal-actions-sticky">
            <div class="helper-text">修改成功后，新密码会立即用于后续登录。</div>
            <div class="button-row">
              <button class="button-primary" type="submit" ${state.formLoading === "password-change" ? "disabled" : ""}>修改密码</button>
              <button class="button-ghost" type="button" data-action="close-overlay">取消</button>
            </div>
          </div>
        </form>
      </div>
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
