import { state, appRoot } from "../core/state.js";
import { escapeHtml, escapeAttribute } from "../core/security.js";
import { formatDateTime } from "../core/format.js";
import { getInitials } from "../core/utils.js";
import { ensureVisibleRoute } from "../domain/permissions.js";
import { getCurrentUser, getCurrentMember, getSearchPlaceholder } from "../domain/query.js";
import { saveSession } from "../core/database.js";
import { setServices, pushFlash } from "../core/services.js";
import { canCreateTask, getVisibleRoutes, isAdmin } from "../domain/permissions.js";
import { dictionaries, options } from "../core/state.js";
import { renderDashboardPage, renderMarketPage, renderMyTasksPage, renderTaskManagementPage, renderMembersPage, renderProjectsPage, renderRankingsPage, renderReviewsPage, renderProfilePage, renderSettingsPage } from "./pages.js";
import { renderModal } from "./modals.js";
import { getPendingApprovalCount } from "./components.js";

function dismissFlashDom() {
  state.flash = "";
  const el = document.querySelector('.flash-toast');
  if (el) {
    el.classList.remove('is-visible');
    el.style.display = 'none';
  }
  state.flashTimer = null;
}

function pushFlashImpl(message, tone = "info") {
  if (state.flashTimer !== null) {
    clearTimeout(state.flashTimer);
  }
  state.flash = message;
  state.flashTone = tone;

  let el = document.querySelector('.flash-toast');
  if (!el) {
    // Fallback if workspace hasn't rendered yet
    renderAppImpl();
    el = document.querySelector('.flash-toast');
  }
  if (el) {
    el.style.display = '';
    el.className = `flash-toast flash-${tone} is-visible`;
    const textEl = el.querySelector('.flash-text');
    if (textEl) textEl.textContent = message;
  }

  state.flashTimer = setTimeout(() => dismissFlashDom(), 5000);
}

let _lastRoute = "";
let _lastUserId = "";

function _computeModalKey() {
  if (!state.modal) return "";
  return `${state.modal.type}:${state.modal.taskId || state.modal.memberId || state.modal.approvalId || ""}`;
}

function _updateShellWidgets() {
  if (state.flash) {
    const el = document.querySelector('.flash-toast');
    if (el) {
      el.style.display = '';
      el.className = `flash-toast flash-${state.flashTone} is-visible`;
      const textEl = el.querySelector('.flash-text');
      if (textEl) textEl.textContent = state.flash;
    }
  } else {
    const el = document.querySelector('.flash-toast');
    if (el) {
      el.classList.remove('is-visible');
      el.style.display = 'none';
    }
  }
  const workspace = document.querySelector('.workspace');
  if (workspace) {
    const existingBar = workspace.querySelector('.form-loading-bar');
    if (state.formLoading || state.loadingRoute) {
      if (!existingBar) {
        const flashEl = workspace.querySelector('.flash-toast');
        if (flashEl) flashEl.insertAdjacentHTML('afterend', '<div class="form-loading-bar"></div>');
      }
    } else if (existingBar) {
      existingBar.remove();
    }
  }
  const sidebar = document.querySelector('.sidebar');
  if (sidebar) {
    sidebar.classList.toggle('is-open', state.mobileNavOpen);
  }
  const backdrop = document.querySelector('.backdrop');
  if (backdrop) {
    backdrop.classList.toggle('is-open', state.mobileNavOpen || Boolean(state.modal));
  }
}

function _updateModalLayer() {
  const existingModal = document.querySelector('.modal');
  const modalHtml = state.modal ? renderModal() : "";
  if (existingModal) {
    if (modalHtml) existingModal.outerHTML = modalHtml;
    else existingModal.remove();
  } else if (modalHtml) {
    const workspace = document.querySelector('.workspace');
    if (workspace) workspace.insertAdjacentHTML('beforeend', modalHtml);
  }
}

function renderAppImpl() {
  try {
    if (state.modal && !document.querySelector(".modal")) {
      state.modalScrollY = window.scrollY;
    }
    if (state.initError) {
      appRoot.innerHTML = renderInitializationErrorShell();
      _lastRoute = "";
      return;
    }
    ensureVisibleRoute();
    if (!state.currentUserId) {
      appRoot.innerHTML = renderAuthShell();
      _lastRoute = "";
      return;
    }
    const user = getCurrentUser();
    if (!user) {
      state.currentUserId = null;
      saveSession();
      appRoot.innerHTML = renderAuthShell();
      _lastRoute = "";
      return;
    }
    if (user.status !== "active") {
      appRoot.innerHTML = renderWaitingShell(user) + (state.modal ? renderModal() : "");
      _lastRoute = "";
      return;
    }

    const workspace = document.querySelector('.workspace');
    const shouldFullRender = !workspace || _lastRoute !== state.route || _lastUserId !== state.currentUserId;

    if (shouldFullRender) {
      appRoot.innerHTML = renderWorkspace();
      _lastRoute = state.route;
      _lastUserId = state.currentUserId;
    } else {
      const pageContent = document.querySelector('.page-content');
      if (pageContent) {
        pageContent.innerHTML = renderCurrentPage();
      }
      _updateModalLayer();
      _updateShellWidgets();
    }
  } catch (error) {
    appRoot.innerHTML = `<div style="padding:40px;color:#ff6666"><h2>渲染错误</h2><pre style="white-space:pre-wrap">${escapeHtml(error.stack || error.message || String(error))}</pre></div>`;
    console.error("renderApp error:", error);
  }
}

export function renderApp() {
  renderAppImpl();
}

function renderInitializationErrorShell() {
  const secureContextTip = window.isSecureContext
    ? "当前已是安全上下文，启动失败更可能来自浏览器缓存或本地数据异常。"
    : "当前网址不是安全上下文。部分移动端浏览器在普通 HTTP 网穿地址下会限制 Web Crypto，建议优先改用 HTTPS 网穿地址。";
  return `
    <div class="auth-layout">
      <section class="auth-panel">
        <div class="auth-card glass-card">
          <div class="boot-mark">Lion Hub</div>
          <h1>应用启动失败</h1>
          <p>初始化成员、任务与登录数据时发生错误，页面已停止在安全错误态，而不是继续卡在装载页。</p>
          <div class="panel">
            <div class="definition-list">
              <div class="definition-row"><span>错误信息</span><strong>${escapeHtml(state.initError)}</strong></div>
              <div class="definition-row"><span>当前环境</span><strong>${window.isSecureContext ? "安全上下文" : "非安全上下文"}</strong></div>
            </div>
          </div>
          <div class="feedback error">${escapeHtml(secureContextTip)}</div>
        </div>
      </section>
      <aside class="auth-aside">
        <div class="hero-panel glass-card">
          <div class="brand-badge">Startup Diagnostics</div>
          <h2>如果你是通过网穿地址在手机上打开，这里最常见的问题是使用了 HTTP 而不是 HTTPS。</h2>
          <p>当前版本已经为密码哈希增加了非 Web Crypto 回退实现。若仍失败，请强制刷新页面，或清掉浏览器站点缓存后重试。</p>
        </div>
      </aside>
    </div>
  `;
}

function renderAuthShell() {
  return `
    <div class="auth-layout">
      <section class="auth-panel">
        <div class="auth-card glass-card">
          <div class="auth-meta">
            <span>RoboMaster 内部协作平台</span>
            <span>Team Workspace</span>
          </div>
          <div class="boot-mark">Lion Hub</div>
          <h1>${state.authMode === "login" ? "进入战队协作中枢" : "提交注册进入审核流"}</h1>
          <p>${state.authMode === "login" ? "支持邮箱 + 密码登录。待审核账号登录后会进入审核中页面。" : "注册后自动进入待审核状态，由管理员分配身份、部门与系统权限。"}</p>
          ${state.authMode === "login" ? renderLoginForm() : renderRegisterForm()}
          <div class="feedback ${state.authFeedback ? "error" : ""}">${escapeHtml(state.authFeedback || "")}</div>
        </div>
      </section>
      <aside class="auth-aside">
        <div class="hero-panel glass-card">
          <div class="brand-badge">Lion Hub Workspace</div>
          <h2>任务协作、审核流转、积分记录和兵种进度统一在一个工作台里完成。</h2>
          <p>这里用于战队日常协作与任务推进。队员可以查看公开任务、参与执行、提交成果、跟进审核，也可以在个人中心维护自己的个性内容、任务记录和成长轨迹。</p>
          <div class="hero-grid">
            <div class="hero-block"><h3>公开任务市场</h3><p>支持按任务类型、部门、方向和兵种筛选，快速找到适合自己的任务并查看详情。</p></div>
            <div class="hero-block"><h3>完整协作链路</h3><p>从领取任务、更新进度、上传附件到提交审核，所有关键动作都会在站内留痕。</p></div>
            <div class="hero-block"><h3>审核与积分</h3><p>高难任务审批、完成审核、点数结算和补偿记录会统一归档，方便后续复盘和统计。</p></div>
            <div class="hero-block"><h3>个人成长视图</h3><p>每位成员都可以在个人中心查看个性内容、参与记录、积分构成和最近完成的任务快照。</p></div>
          </div>
        </div>
      </aside>
    </div>
  `;
}

function renderLoginForm() {
   return `
     <form class="auth-form" data-form="login">
       <label class="field-group"><span class="field-label">邮箱</span><input class="field-input" type="email" name="email" placeholder="name@example.com" required></label>
       <label class="field-group"><span class="field-label">密码</span><input class="field-input" type="password" name="password" placeholder="请输入密码" required></label>
       <label class="field-group" style="flex-direction:row;align-items:center;gap:8px"><input type="checkbox" name="rememberMe" checked ${state.rememberMe ? "checked" : ""} style="width:18px;height:18px;accent-color:white"> <span class="helper-text">记住登录状态</span></label>
       <div class="button-row"><button class="button-primary" type="submit" ${state.formLoading === 'login' ? 'disabled' : ''}>登录</button><button class="button-ghost" type="button" data-action="switch-auth" data-mode="register">注册新账号</button></div>
     </form>
   `;
 }

function renderRegisterForm() {
  return `
    <form class="auth-form" data-form="register">
      <div class="field-grid">
        <label class="field-group"><span class="field-label">用户名</span><input class="field-input" type="text" name="username" placeholder="用于系统展示" required></label>
        <label class="field-group"><span class="field-label">姓名</span><input class="field-input" type="text" name="name" placeholder="真实姓名或战队内姓名" required></label>
      </div>
      <div class="field-grid">
        <label class="field-group"><span class="field-label">邮箱</span><input class="field-input" type="email" name="email" placeholder="用于登录" required></label>
        <label class="field-group"><span class="field-label">手机号</span><input class="field-input" type="tel" name="phone" placeholder="用于联系" required></label>
      </div>
      <label class="field-group"><span class="field-label">密码</span><input class="field-input" type="password" name="password" placeholder="设置登录密码" required></label>
      <label class="field-group"><span class="field-label">确认密码</span><input class="field-input" type="password" name="confirmPassword" placeholder="再次输入密码" required></label>
      <div class="field-grid">
        <label class="field-group"><span class="field-label">意向组别</span><select class="field-select" name="department" required>${renderSelectOptions(options.departments)}</select></label>
        <label class="field-group"><span class="field-label">技能标签</span><input class="field-input" type="text" name="skills" placeholder="用逗号分隔，例如 C, ROS, OpenCV"></label>
      </div>
      <label class="field-group"><span class="field-label">个人简介</span><textarea class="field-textarea" name="bio" placeholder="简单介绍擅长方向、参与经历或希望承担的工作"></textarea></label>
      <div class="button-row"><button class="button-primary" type="submit" ${state.formLoading === 'register' ? 'disabled' : ''}>提交注册</button><button class="button-ghost" type="button" data-action="switch-auth" data-mode="login">返回登录</button></div>
    </form>
  `;
}

function renderWaitingShell(user) {
  const member = getMemberById(user.memberId);
  const isRejected = user.status === "rejected";
  const isDisabled = user.status === "disabled";
  return `
    <div class="auth-layout">
      <section class="auth-panel">
        <div class="auth-card glass-card">
          <div class="boot-mark">${isDisabled ? "Account Disabled" : isRejected ? "Review Result" : "Pending Review"}</div>
          <h1>${isDisabled ? "账号已停用" : isRejected ? "审核未通过" : "账号审核中"}</h1>
          <p>${isDisabled ? "当前账号已被管理员停用，暂时不能进入工作台。如需恢复，请联系管理员处理。" : isRejected ? "当前账号尚未进入正式系统，请联系管理员修正资料后重新提交。" : "管理员会在审核中心分配成员身份、部门、兵种与系统权限，审核通过后即可进入完整工作台。"}</p>
          <div class="panel">
            <div class="definition-list">
              <div class="definition-row"><span>申请人</span><strong>${escapeHtml(member?.name || user.username)}</strong></div>
              <div class="definition-row"><span>邮箱</span><strong>${escapeHtml(user.email)}</strong></div>
              <div class="definition-row"><span>意向组别</span><strong>${escapeHtml((member?.departments || []).join(" / ") || "未填写")}</strong></div>
            </div>
          </div>
          <div class="button-row">
            ${!isDisabled ? '<button class="button-primary" type="button" data-action="open-registration-edit">修改信息</button>' : ""}
            ${!isDisabled ? '<button class="button-danger" type="button" data-action="cancel-registration">取消注册</button>' : ""}
            <button class="button-secondary" type="button" data-action="logout">退出账号</button>
          </div>
        </div>
      </section>
      <aside class="auth-aside">
        <div class="hero-panel glass-card">
          <div class="brand-badge">Approval Pipeline</div>
          <h2>注册申请会直接进入审核中心。</h2>
          <p>管理员可在审核中心查看注册申请，并为你设置成员身份、权限角色、所属部门、方向与兵种标签。</p>
        </div>
      </aside>
    </div>
  `;
}

function renderWorkspace() {
  const member = getCurrentMember();
  const navItems = getVisibleRoutes();
  const pendingCount = getPendingApprovalCount();
  return `
    <div class="workspace">
      <aside class="sidebar ${state.mobileNavOpen ? "is-open" : ""}">
        <div class="brand">
          <div class="brand-badge">Lion Hub</div>
          <h1>醒狮战队协作中枢</h1>
          <p>成员、任务、审核、积分与兵种进度的一体化工作台。</p>
        </div>
        <div class="nav-group">
          <div class="nav-label">Workspace</div>
          ${navItems.map((route) => {
            const suffix = route.id === "reviews" && pendingCount > 0 ? `<small>${pendingCount}</small>` : "";
            return `<button type="button" class="nav-item ${state.route === route.id ? "is-active" : ""}" data-action="navigate" data-route="${route.id}"><span>${route.label}</span>${suffix}</button>`;
          }).join("")}
        </div>
        <div class="sidebar-footer">
          <strong>${escapeHtml(member.name)}</strong>
          <span>${escapeHtml(dictionaries.identities[member.identity])} · ${escapeHtml(dictionaries.roles[member.role])}</span>
          <span class="helper-text">${escapeHtml(member.departments.join(" / "))}</span>
          <div class="button-row">
            <button class="button-secondary" type="button" data-action="navigate" data-route="profile">个人中心</button>
            <button class="button-ghost" type="button" data-action="logout">退出</button>
          </div>
        </div>
      </aside>
<div class="flash-toast ${state.flash ? 'is-visible' : ''}" style="display:${state.flash ? '' : 'none'}"><span class="flash-text">${escapeHtml(state.flash)}</span><button class="flash-close" type="button" data-action="dismiss-flash">×</button></div>
       ${state.formLoading || state.loadingRoute ? `<div class="form-loading-bar"></div>` : ""}
       <main class="main-area">
         <div class="topbar">
          <div class="search-shell">
            <button class="button-ghost mobile-toggle" type="button" data-action="toggle-nav">菜单</button>
            <input type="text" placeholder="${getSearchPlaceholder()}" value="${escapeAttribute(state.globalSearch)}" data-global-search>
          </div>
          <div class="topbar-actions">
            <span class="topbar-chip">待审核 ${pendingCount}</span>
            <div class="notif-bell" style="position:relative">
              <button class="button-ghost" type="button" data-action="toggle-notif-panel" style="position:relative;padding:8px 12px;font-size:1.2rem">${renderNotifIcon()}</button>
              ${state.notifPanelOpen ? renderNotifPanel() : ""}
            </div>
            ${canCreateTask() ? '<button class="button-primary" type="button" data-action="open-create-task">新建任务</button>' : ""}
            <div class="profile-pill">
              <div class="avatar">${escapeHtml(getInitials(member.name))}</div>
              <div><strong>${escapeHtml(member.name)}</strong><div class="helper-text">${escapeHtml(dictionaries.roles[member.role])}</div></div>
            </div>
          </div>
        </div>
        <div class="page-content">${renderCurrentPage()}</div>
      </main>
      <div class="backdrop ${state.mobileNavOpen || state.modal ? "is-open" : ""}" data-action="close-overlay"></div>
      ${state.modal ? renderModal() : ""}
    </div>
  `;
}

function renderCurrentPage() {
  switch (state.route) {
    case "dashboard": return renderDashboardPage();
    case "market": return renderMarketPage();
    case "myTasks": return renderMyTasksPage();
    case "taskManagement": return renderTaskManagementPage();
    case "members": return renderMembersPage();
    case "projects": return renderProjectsPage();
    case "rankings": return renderRankingsPage();
    case "reviews": return renderReviewsPage();
    case "profile": return renderProfilePage();
    case "settings": return renderSettingsPage();
    default: return renderDashboardPage();
  }
}

setServices({ pushFlash: pushFlashImpl, renderApp: renderAppImpl });

export { pushFlash, renderNotifIcon, renderNotifPanel };

function renderNotifIcon() {
  const unread = getUnreadNotificationCount();
  return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--text-soft);vertical-align:middle"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>${unread ? `<span style="position:absolute;top:-2px;right:-4px;min-width:16px;height:16px;border-radius:8px;background:var(--text-soft);color:#111;font-size:0.65rem;font-weight:700;display:inline-flex;align-items:center;justify-content:center;padding:0 4px">${unread > 99 ? "99+" : unread}</span>` : ""}`;
}

let _notifCache = { items: [], version: -1 };

function computeNotifications() {
  if (!state.database) return [];
  if (state.databaseVersion === _notifCache.version) return _notifCache.items;
  _notifCache.items = getNotificationsForCurrentUser();
  _notifCache.version = state.databaseVersion;
  return _notifCache.items;
}

function renderNotifPanel() {
  const items = computeNotifications();
  const unreadCount = items.filter((n) => !n.read).length;
  return `
    <div class="notif-panel" style="position:absolute;top:100%;right:0;width:320px;max-width:calc(100vw - 48px);max-height:400px;overflow-y:auto;z-index:30;margin-top:4px;border-radius:16px;border:1px solid var(--line);background:rgba(20,20,22,0.98);backdrop-filter:blur(16px);box-shadow:0 16px 48px rgba(0,0,0,0.5);padding:12px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid var(--line)">
        <strong style="font-size:0.95rem">我的通知${unreadCount ? ` (${unreadCount})` : ""}</strong>
        <button class="button-ghost" type="button" data-action="toggle-notif-panel" style="padding:4px 8px;font-size:0.8rem">关闭</button>
      </div>
      ${items.length ? items.map((n) => `
        <div style="padding:8px 6px;border-bottom:1px solid rgba(255,255,255,0.06);font-size:0.85rem;color:var(--text-soft);${n.read ? "opacity:0.5" : ""}">
          <div>${escapeHtml(n.text)}</div>
          <div style="font-size:0.75rem;color:var(--text-faint);margin-top:4px">${formatDateTime(n.createdAt)}</div>
        </div>
      `).join("") : '<div style="padding:20px;text-align:center;color:var(--text-faint);font-size:0.85rem">暂无近7天通知</div>'}
    </div>
  `;
}

import { getMemberById } from "../domain/query.js";
import { renderSelectOptions } from "./components.js";
import { getNotificationsForCurrentUser, getUnreadNotificationCount } from "../domain/notifications.js";
