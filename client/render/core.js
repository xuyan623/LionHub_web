import { appRoot, dictionaries, options, routes, state } from "../core/state.js";
import { escapeAttribute, escapeHtml } from "../core/security.js";
import { loadRouteChunk, loadWorkspaceRuntime, getLoadedWorkspaceRuntime } from "../core/runtime-loader.js";
import { saveSession } from "../core/session.js";
import { setServices } from "../core/services.js";

function dismissFlashDom() {
  state.flash = "";
  const element = document.querySelector(".flash-toast");
  if (element) {
    element.classList.remove("is-visible");
    element.style.display = "none";
  }
  state.flashTimer = null;
}

function pushFlashImpl(message, tone = "info") {
  if (state.flashTimer !== null) {
    clearTimeout(state.flashTimer);
  }
  state.flash = message;
  state.flashTone = tone;

  let element = document.querySelector(".flash-toast");
  if (!element) {
    renderAppImpl();
    element = document.querySelector(".flash-toast");
  }
  if (element) {
    element.style.display = "";
    element.className = `flash-toast flash-${tone} is-visible`;
    const textElement = element.querySelector(".flash-text");
    if (textElement) {
      textElement.textContent = message;
    }
  }

  state.flashTimer = setTimeout(() => dismissFlashDom(), 5000);
}

export function renderApp() {
  renderAppImpl();
}

function renderAppImpl() {
  try {
    if (state.initError) {
      appRoot.innerHTML = renderInitializationErrorShell();
      return;
    }

    if (!state.currentUserId) {
      appRoot.innerHTML = renderAuthShell();
      return;
    }

    if (!state.databaseReady) {
      void loadWorkspaceRuntime();
      void loadRouteChunk(state.route);
      appRoot.innerHTML = renderWorkspaceLoadingShell();
      return;
    }

    const user = getCurrentUserRecord();
    if (!user) {
      state.currentUserId = null;
      saveSession(state.currentUserId);
      appRoot.innerHTML = renderAuthShell();
      return;
    }

    if (user.status !== "active") {
      appRoot.innerHTML = renderWaitingShell(user);
      return;
    }

    const runtime = getLoadedWorkspaceRuntime();
    if (!runtime) {
      void loadWorkspaceRuntime();
      void loadRouteChunk(state.route);
      appRoot.innerHTML = renderWorkspaceLoadingShell(getMemberRecord(user.memberId));
      return;
    }

    runtime.renderWorkspaceRoot(appRoot);
  } catch (error) {
    appRoot.innerHTML = `
      <div style="padding:40px;color:#ff6666">
        <h2>渲染错误</h2>
        <pre style="white-space:pre-wrap">${escapeHtml(error.stack || error.message || String(error))}</pre>
      </div>
    `;
    console.error("renderApp error:", error);
  }
}

function getCurrentUserRecord() {
  return state.database?.users.find((user) => user.id === state.currentUserId) || null;
}

function getMemberRecord(memberId) {
  return state.database?.members.find((member) => member.id === memberId) || null;
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
          <p>初始化成员、任务与登录数据时发生错误，页面已停止在安全错误态。</p>
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
          <p>若仍失败，请强制刷新页面，或清掉浏览器站点缓存后重试。</p>
        </div>
      </aside>
    </div>
  `;
}

function renderAuthShell() {
  const hydrationMessage = state.databaseHydrating
    ? "正在连接共享服务。提交注册或登录后会继续同步所需数据。"
    : "首屏不会自动拉取全量共享数据，只有登录成功或提交注册时才会同步。";
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
          <div class="helper-text" style="margin-top:12px">${escapeHtml(hydrationMessage)}</div>
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
      <div class="button-row"><button class="button-primary" type="submit" ${state.formLoading === "login" ? "disabled" : ""}>登录</button><button class="button-ghost" type="button" data-action="switch-auth" data-mode="register">注册新账号</button></div>
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
      <div class="button-row"><button class="button-primary" type="submit" ${state.formLoading === "register" ? "disabled" : ""}>提交注册</button><button class="button-ghost" type="button" data-action="switch-auth" data-mode="login">返回登录</button></div>
    </form>
  `;
}

function renderWaitingShell(user) {
  const member = getMemberRecord(user.memberId);
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

function renderWorkspaceLoadingShell(member = null) {
  const currentRoute = routes.find((route) => route.id === state.route);
  const routeLabel = currentRoute ? currentRoute.label : "当前页面";
  const routeButtons = routes
    .map((route) => `<button type="button" class="nav-item ${route.id === state.route ? "is-active" : ""}" data-action="navigate" data-route="${route.id}"><span>${route.label}</span></button>`)
    .join("");
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
          ${routeButtons}
        </div>
        <div class="sidebar-footer">
          <strong>${escapeHtml(member?.name || "正在恢复会话")}</strong>
          <span>${escapeHtml(member ? `${dictionaries.identities[member.identity]} · ${dictionaries.roles[member.role]}` : "同步成员资料中")}</span>
          <span class="helper-text">${escapeHtml(member?.departments?.join(" / ") || "首次进入会先加载工作台数据")}</span>
          <div class="button-row">
            <button class="button-secondary" type="button" data-action="navigate" data-route="profile">个人中心</button>
            <button class="button-ghost" type="button" data-action="logout">退出</button>
          </div>
        </div>
      </aside>
      <main class="main-area">
        <div class="topbar">
          <div class="search-shell">
            <button class="button-ghost mobile-toggle" type="button" data-action="toggle-nav">菜单</button>
            <input type="text" placeholder="正在装载工作台数据…" value="" disabled>
          </div>
          <div class="topbar-actions">
            <span class="topbar-chip">同步中</span>
          </div>
        </div>
        <div class="page-content">
          <section>
            <div class="page-header">
              <div><h2>${escapeHtml(routeLabel)}</h2><p>正在同步首屏数据与页面资源，工作台壳层已先显示。</p></div>
            </div>
            <section class="panel">
              <div class="empty-state">正在加载当前页面内容…</div>
            </section>
          </section>
        </div>
      </main>
      <div class="backdrop ${state.mobileNavOpen ? "is-open" : ""}" data-action="close-overlay"></div>
    </div>
  `;
}

function renderSelectOptions(values, selectedValue = "", labels = null) {
  return values.map((value) => {
    const selected = value === selectedValue ? "selected" : "";
    const label = labels ? labels[value] : value;
    return `<option value="${escapeAttribute(value)}" ${selected}>${escapeHtml(label)}</option>`;
  }).join("");
}

setServices({ pushFlash: pushFlashImpl, renderApp: renderAppImpl });
