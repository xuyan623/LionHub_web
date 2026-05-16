import { appRoot, dictionaries, state } from "../core/state.js";
import { escapeAttribute, escapeHtml } from "../core/security.js";
import { formatDateTime } from "../core/format.js";
import { getInitials } from "../core/utils.js";
import { getLoadedModalChunk, getLoadedRouteChunk, loadModalChunk, loadRouteChunk } from "../core/runtime-loader.js";
import { saveSession } from "../core/session.js";
import { getCurrentMember, getCurrentUser, getSearchPlaceholder, getMemberById } from "../domain/query.js";
import { canCreateTask, getVisibleRoutes } from "../domain/permissions.js";
import { getPendingApprovalCount } from "./components.js";
import { getNotificationsForCurrentUser, getUnreadNotificationCount } from "../domain/notifications.js";

let notificationCache = { items: [], version: -1 };

export function renderWorkspaceRoot(root = appRoot) {
  try {
    const user = getCurrentUser();
    if (!user) {
      state.currentUserId = null;
      saveSession(state.currentUserId);
      root.innerHTML = "";
      return;
    }
    root.innerHTML = renderWorkspace();
  } catch (error) {
    root.innerHTML = `
      <div style="padding:40px;color:#ff6666">
        <h2>工作台渲染错误</h2>
        <pre style="white-space:pre-wrap">${escapeHtml(error.stack || error.message || String(error))}</pre>
      </div>
    `;
    console.error("workspace render error:", error);
  }
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
      <div class="flash-toast ${state.flash ? "is-visible" : ""}" style="display:${state.flash ? "" : "none"}"><span class="flash-text">${escapeHtml(state.flash)}</span><button class="flash-close" type="button" data-action="dismiss-flash">×</button></div>
      ${state.formLoading || state.loadingRoute ? `<div class="form-loading-bar"></div>` : ""}
      <main class="main-area">
        <div class="topbar">
          <div class="search-shell">
            <button class="button-ghost mobile-toggle" type="button" data-action="toggle-nav">菜单</button>
            <input type="text" placeholder="${escapeAttribute(getSearchPlaceholder())}" value="${escapeAttribute(state.globalSearch)}" data-global-search>
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
  const routeId = state.route;
  const routeModule = getLoadedRouteChunk(routeId);
  if (!routeModule) {
    void loadRouteChunk(routeId);
    return renderPageLoadingState(routeId);
  }
  return routeModule.render();
}

function renderPageLoadingState(routeId) {
  const currentRoute = getVisibleRoutes().find((route) => route.id === routeId);
  const label = currentRoute?.label || "当前页面";
  return `
    <section>
      <div class="page-header">
        <div><h2>${escapeHtml(label)}</h2><p>页面代码已从首包中拆出，当前正在按需加载。</p></div>
      </div>
      <section class="panel">
        <div class="empty-state">正在加载 ${escapeHtml(label)} 模块…</div>
      </section>
    </section>
  `;
}

function renderModal() {
  const modalType = state.modal?.type;
  if (!modalType) {
    return "";
  }
  const modalModule = getLoadedModalChunk(modalType);
  if (!modalModule) {
    void loadModalChunk(modalType);
    return `
      <div class="modal">
        <div class="modal-card glass-card">
          <div class="section-header">
            <div><h3>正在加载操作面板</h3><p>当前弹窗代码已改为按需加载，请稍候。</p></div>
            <button class="button-ghost" type="button" data-action="close-overlay">关闭</button>
          </div>
          <div class="empty-state">正在加载弹窗内容…</div>
        </div>
      </div>
    `;
  }
  return modalModule.render(modalType);
}

function renderNotifIcon() {
  const unread = getUnreadNotificationCount();
  return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--text-soft);vertical-align:middle"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>${unread ? `<span style="position:absolute;top:-2px;right:-4px;min-width:16px;height:16px;border-radius:8px;background:var(--text-soft);color:#111;font-size:0.65rem;font-weight:700;display:inline-flex;align-items:center;justify-content:center;padding:0 4px">${unread > 99 ? "99+" : unread}</span>` : ""}`;
}

function computeNotifications() {
  if (!state.database) {
    return [];
  }
  if (state.databaseVersion === notificationCache.version) {
    return notificationCache.items;
  }
  notificationCache.items = getNotificationsForCurrentUser();
  notificationCache.version = state.databaseVersion;
  return notificationCache.items;
}

function renderNotifPanel() {
  const items = computeNotifications();
  const unreadCount = items.filter((item) => !item.read).length;
  return `
    <div class="notif-panel" style="position:absolute;top:100%;right:0;width:320px;max-width:calc(100vw - 48px);max-height:400px;overflow-y:auto;z-index:30;margin-top:4px;border-radius:16px;border:1px solid var(--line);background:rgba(20,20,22,0.98);backdrop-filter:blur(16px);box-shadow:0 16px 48px rgba(0,0,0,0.5);padding:12px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid var(--line)">
        <strong style="font-size:0.95rem">我的通知${unreadCount ? ` (${unreadCount})` : ""}</strong>
        <button class="button-ghost" type="button" data-action="toggle-notif-panel" style="padding:4px 8px;font-size:0.8rem">关闭</button>
      </div>
      ${items.length ? items.map((item) => `
        <div style="padding:8px 6px;border-bottom:1px solid rgba(255,255,255,0.06);font-size:0.85rem;color:var(--text-soft);${item.read ? "opacity:0.5" : ""}">
          <div>${escapeHtml(item.text)}</div>
          <div style="font-size:0.75rem;color:var(--text-faint);margin-top:4px">${formatDateTime(item.createdAt)}</div>
        </div>
      `).join("") : '<div style="padding:20px;text-align:center;color:var(--text-faint);font-size:0.85rem">暂无近7天通知</div>'}
    </div>
  `;
}

export { renderNotifIcon, renderNotifPanel, getMemberById };
