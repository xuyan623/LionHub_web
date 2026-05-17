import { state } from "../../core/state.js";
import { escapeAttribute, escapeHtml } from "../../core/security.js";
import { getCurrentMember, getCurrentUser, getLifecycleActionDefinition, getMemberById } from "../../domain/query.js";
import { canDeleteAllGeneratedData, getLifecycleBlockingTasks } from "../../domain/permissions.js";
import { renderMemberDetail, renderTimelineCard } from "../components.js";

export function render(modalType) {
  switch (modalType) {
    case "member-detail":
      return renderMemberDetailModal();
    case "member-form":
      return renderMemberFormModal();
    case "profile-content":
      return renderProfileContentModal();
    case "retire-form":
      return renderRetireFormModal();
    default:
      return "";
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
        <div class="modal-actions-sticky">
          <div class="helper-text">管理员可以直接在这里进入资料编辑。</div>
          <div class="button-row">
            ${canDeleteAllGeneratedData() ? `<button class="button-secondary" type="button" data-action="open-edit-member" data-member-id="${member.id}">编辑成员</button>` : ""}
            <button class="button-ghost" type="button" data-action="close-overlay">关闭</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function renderMemberFormModal() {
  const member = getMemberById(state.modal.memberId);
  if (!member) return "";
  const lifecycleExplanation = !member.hiddenFromDirectory && member.memberStatus !== "retired" && member.memberStatus !== "disabled"
    ? getLifecycleActionDefinition("force-retire-member", member.id)?.description || ""
    : "";
  const blockingTasks = member.hiddenFromDirectory ? [] : getLifecycleBlockingTasks(member.id);
  return `
    <div class="modal">
      <div class="modal-card glass-card">
        <div class="section-header">
          <div><h3>编辑成员</h3><p>管理员可直接修改成员身份、部门、方向和兵种信息。</p></div>
          <button class="button-ghost" type="button" data-action="close-overlay">关闭</button>
        </div>
        ${blockingTasks.length ? `
          <section class="panel">
            <div class="section-header"><div><h3>生命周期操作前置提醒</h3><p>当前成员仍有关联中的任务。强制退休或停用前，必须先完成负责人改派或移除参与关系。</p></div></div>
            <div class="timeline-grid">${blockingTasks.map((task) => renderTimelineCard(task.title, `${escapeHtml(task.status)} · 负责人 ${escapeHtml(getMemberById(task.ownerId)?.name || "未设置")}`)).join("")}</div>
          </section>
        ` : ""}
        <form class="auth-form" data-form="member-form">
          <input type="hidden" name="memberId" value="${escapeAttribute(member.id)}">
          <div class="field-grid">
            <label class="field-group"><span class="field-label">姓名</span><input class="field-input" type="text" name="name" value="${escapeAttribute(member.name)}" required></label>
            <label class="field-group"><span class="field-label">手机号</span><input class="field-input" type="text" name="phone" value="${escapeAttribute(member.phone || "")}"></label>
          </div>
          <div class="field-grid">
            <label class="field-group"><span class="field-label">成员身份</span><select class="field-select" name="identity" required>${renderIdentityOptions(member.identity)}</select></label>
          </div>
          <div class="field-grid">
            <label class="field-group"><span class="field-label">部门</span><select class="field-select" name="departments" required>${renderDepartmentOptions(member.departments[0] || "")}</select></label>
            <label class="field-group"><span class="field-label">方向</span><select class="field-select" name="directions">${renderDirectionOptions(member.directions[0] || "")}</select></label>
          </div>
          <div class="field-grid">
            <label class="field-group"><span class="field-label">兵种组</span><select class="field-select" name="robotGroups">${renderRobotGroupOptions(member.robotGroups[0] || "")}</select></label>
            <label class="field-group"><span class="field-label">技能标签</span><input class="field-input" type="text" name="skillTags" value="${escapeAttribute(member.skillTags.join(", "))}"></label>
          </div>
          <label class="field-group"><span class="field-label">个人简介</span><textarea class="field-textarea" name="bio">${escapeHtml(member.bio || "")}</textarea></label>
          <div class="modal-actions-sticky">
            <div class="helper-text">${escapeHtml(lifecycleExplanation || "保存后会即时更新成员目录和详情弹窗。")}</div>
            <div class="button-row">
              <button class="button-primary" type="submit" ${state.formLoading === "member-form" ? "disabled" : ""}>保存成员资料</button>
              ${!member.hiddenFromDirectory && member.memberStatus !== "retired" && member.memberStatus !== "disabled" ? `<button class="button-danger" type="button" data-action="open-force-retire-member" data-member-id="${member.id}">强制退休</button>` : ""}
              ${!member.hiddenFromDirectory && member.memberStatus !== "disabled" ? `<button class="button-danger" type="button" data-action="open-disable-member" data-member-id="${member.id}">注销 / 停用</button>` : ""}
              ${!member.hiddenFromDirectory && member.memberStatus === "disabled" ? `<button class="button-secondary" type="button" data-action="open-restore-member" data-member-id="${member.id}">恢复账号</button>` : ""}
              <button class="button-ghost" type="button" data-action="close-overlay">取消</button>
            </div>
          </div>
        </form>
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
          <div class="modal-actions-sticky">
            <div class="helper-text">修改后会同步影响任务推荐、成员目录和个人中心展示。</div>
            <div class="button-row">
              <button class="button-primary" type="submit" ${state.formLoading === "profile-content" ? "disabled" : ""}>保存个性内容</button>
              <button class="button-ghost" type="button" data-action="close-overlay">取消</button>
            </div>
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
          <div class="modal-actions-sticky">
            <div class="helper-text">提交后账号会进入只读状态，但历史记录仍会保留。</div>
            <div class="button-row">
              <button class="button-danger" type="submit" ${state.formLoading === "retire-form" ? "disabled" : ""}>提交退役申请</button>
              <button class="button-ghost" type="button" data-action="close-overlay">取消</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  `;
}

function renderIdentityOptions(selectedValue) {
  const labels = {
    captain: "队长",
    vice_captain: "副队长",
    project_manager: "项目管理",
    formal: "正式队员",
    reserve: "梯队队员",
    seedling: "育苗队员",
    teacher: "指导老师",
  };
  return Object.entries(labels)
    .map(([value, label]) => `<option value="${value}" ${value === selectedValue ? "selected" : ""}>${escapeHtml(label)}</option>`)
    .join("");
}

function renderDepartmentOptions(selectedValue) {
  return ["管理层", "机械组", "电控组", "算法组", "运营组"]
    .map((value) => `<option value="${value}" ${value === selectedValue ? "selected" : ""}>${escapeHtml(value)}</option>`)
    .join("");
}

function renderDirectionOptions(selectedValue) {
  const options = ["", "硬件", "软件", "视觉", "导航", "宣传", "招商", "财务"];
  return options
    .map((value) => {
      const label = value || "未指定";
      return `<option value="${escapeAttribute(value)}" ${value === selectedValue ? "selected" : ""}>${escapeHtml(label)}</option>`;
    })
    .join("");
}

function renderRobotGroupOptions(selectedValue) {
  const options = ["", "步兵", "哨兵", "英雄", "工程", "无人机", "飞镖", "雷达"];
  return options
    .map((value) => {
      const label = value || "未指定";
      return `<option value="${escapeAttribute(value)}" ${value === selectedValue ? "selected" : ""}>${escapeHtml(label)}</option>`;
    })
    .join("");
}
