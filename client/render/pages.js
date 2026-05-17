import { state, dictionaries, options } from "../core/state.js";
import { escapeHtml, escapeAttribute } from "../core/security.js";
import { formatDateTime, formatShortDate } from "../core/format.js";
import { getInitials } from "../core/utils.js";
import { getCurrentMember, getDashboardStats, getMarketTasks, getFilteredMarketTasks, getCurrentUserTaskRecords, getVisibleTaskManagementTasks, getFilteredMembers, getMemberLoads, getLeaderboard, getDepartmentContribution, getRobotContribution, getApprovalGroups, getMemberPointSummary, getMemberTimeline, getTaskParticipantRecordsByMember, getMemberById, getTaskParticipantRecords, getJoinActionLabel, isUrgentMarketTask, getLifecycleActionDefinition } from "../domain/query.js";
import { canRequestRoleChange, canInteractWithTasks, canCreateTask, canReview, isMemberIncludedInWorkspaceStats, canDeleteApprovalRecord, canDeleteAllGeneratedData, getMemberPendingRoleChange, canEditTask, canDeleteTask, canMemberBeAddedToTask, getLifecycleBlockingTasks } from "../domain/permissions.js";
import { renderMetricCard, renderChartRow, renderTaskCard, renderMemberCard, renderProjectCard, renderRankingCard, renderRankingRow, renderLoadRow, renderStatusBadge, renderPointPill, renderEmpty, renderTimelineCard, renderReviewTabButton, renderFilterField, renderFilterSelect, renderReviewStack, renderMemberDetail, renderMemberTable } from "./components.js";
import { renderTaskManageBody, renderCompensationPanel, renderRatioPanel, renderTaskActionPanel } from "./task-detail.js";

export function renderDashboardPage() {
  const stats = getDashboardStats();
  const featuredTasks = getMarketTasks().slice(0, 4);
  const myTasks = getCurrentUserTaskRecords().active.slice(0, 4);
  const loads = getMemberLoads().slice(0, 6);
  const ranking = getLeaderboard("composite", "total").slice(0, 5);
  const departments = getDepartmentContribution();
  const projects = state.database.robotProjects.slice(0, 4);
  return `
    <section>
      <div class="page-header">
        <div><h2>仪表盘</h2><p>快速查看战队近期任务、成员协作分布、积分排行与兵种项目推进情况。</p></div>
      </div>
      <div class="metric-grid">
        ${renderMetricCard("当前成员数", stats.memberCount, "包含当前可见成员")}
        ${renderMetricCard("进行中任务", stats.inProgressCount, "当前正在推进的公开任务与项目任务")}
        ${renderMetricCard("待审核任务", stats.pendingReviewCount, "已提交成果等待审核与结算")}
        ${renderMetricCard("已逾期任务", stats.overdueCount, "截止日期已过且未完成的任务")}
        ${renderMetricCard("本月完成任务", stats.completedThisMonth, "用于观察当前节奏与产出密度")}
      </div>
      <div class="page-grid columns-3">
        <section class="panel">
          <div class="section-header"><div><h3>我的任务</h3><p>当前用户负责、参与或待提交的任务。</p></div><button class="button-ghost" type="button" data-action="navigate" data-route="myTasks">查看全部</button></div>
          <div class="task-stack">${myTasks.length ? myTasks.map(({ task }) => renderTaskCard(task, { compact: true })).join("") : renderEmpty("当前没有进行中的个人任务。")}</div>
        </section>
        <section class="panel">
          <div class="section-header"><div><h3>任务市场精选</h3><p>面向当前成员画像的最新公开任务。</p></div><button class="button-ghost" type="button" data-action="navigate" data-route="market">进入市场</button></div>
          <div class="task-stack">${featuredTasks.map((task) => renderTaskCard(task, { showAction: true, compact: true })).join("")}</div>
        </section>
        <section class="panel">
          <div class="section-header"><div><h3>积分排行</h3><p>综合贡献 Top 5。</p></div><button class="button-ghost" type="button" data-action="navigate" data-route="rankings">完整榜单</button></div>
          <div class="ranking-stack">${ranking.map((entry, index) => renderRankingRow(entry, index + 1)).join("")}</div>
        </section>
      </div>
      <div class="page-grid columns-2">
        <section class="panel">
          <div class="section-header"><div><h3>成员负载</h3><p>帮助大家了解当前协作分布与任务压力。</p></div></div>
          <div class="member-stack">${loads.map((entry) => renderLoadRow(entry)).join("")}</div>
        </section>
        <section class="panel">
          <div class="section-header"><div><h3>部门贡献</h3><p>按研习点、工时点、管理点合计贡献值比较。</p></div></div>
          <div class="chart-bars">${departments.map((item) => renderChartRow(item.label, item.value, departments[0]?.value || 1)).join("")}</div>
        </section>
      </div>
      <section class="panel">
        <div class="section-header"><div><h3>兵种项目进度总览</h3><p>步兵、哨兵、英雄、工程、无人机、飞镖、雷达的当前进度、阻塞项与负责人。</p></div><button class="button-ghost" type="button" data-action="navigate" data-route="projects">进入兵种页</button></div>
        <div class="project-grid">${projects.map((project) => renderProjectCard(project)).join("")}</div>
      </section>
    </section>
  `;
}

export function renderMarketPage() {
  const tasks = getFilteredMarketTasks();
  const marketStatusLabels = { market_open: "未完成", ...dictionaries.taskStatuses };
  return `
    <section>
      <div class="panel market-board">
        <div class="market-stage">
          <div class="market-stage-copy">
            <div class="market-stage-badge">Open Task Market</div>
            <h2>任务市场</h2>
            <p>完全公开的任务广场。支持搜索、筛选、直接领取或对高难任务发起审批申请。</p>
          </div>
          <div class="market-stage-meta">
            ${renderPointPill("公开任务", tasks.length)}
            ${renderPointPill("高难任务", tasks.filter((task) => ["hard", "core"].includes(task.difficulty)).length)}
            ${renderPointPill("紧急任务", tasks.filter((task) => isUrgentMarketTask(task)).length)}
            ${renderPointPill("待审核", tasks.filter((task) => task.status === "pending_review").length)}
          </div>
        </div>
        <div class="market-filter-shell">
          <div class="field-grid">
            ${renderFilterField("任务搜索", "market", "query", state.marketFilters.query, "text", "搜索标题、描述、推荐人群")}
            ${renderFilterSelect("任务类型", "market", "type", state.marketFilters.type, options.taskTypes, dictionaries.taskTypes)}
          </div>
          <div class="field-grid-3">
            ${renderFilterSelect("部门", "market", "department", state.marketFilters.department, options.departments)}
            ${renderFilterSelect("方向", "market", "direction", state.marketFilters.direction, options.directions)}
            ${renderFilterSelect("兵种", "market", "robotGroup", state.marketFilters.robotGroup, options.robotGroups)}
          </div>
          <div class="field-grid-3">
            ${renderFilterSelect("难度", "market", "difficulty", state.marketFilters.difficulty, options.difficulties, dictionaries.difficulties)}
            ${renderFilterSelect("状态", "market", "status", state.marketFilters.status, options.marketTaskStatuses, marketStatusLabels)}
            ${renderFilterField("推荐适合人群", "market", "audience", state.marketFilters.audience, "text", "如 机械组新人 / 算法梯队")}
          </div>
        </div>
        <div class="market-waterfall">
          ${tasks.length ? tasks.map((task) => renderTaskCard(task, { showAction: canInteractWithTasks(), compact: false, waterfall: true })).join("") : renderEmpty("没有匹配筛选条件的任务。")}
        </div>
      </div>
    </section>
  `;
}

export function renderMyTasksPage() {
  const buckets = getCurrentUserTaskRecords();
  return `
    <section>
      <div class="page-header"><div><h2>我的任务</h2><p>管理当前用户负责、参与、申请中、待提交、已完成与隐私记录中的任务。</p></div></div>
      <div class="page-grid columns-2">
        <section class="panel">
          <div class="section-header"><div><h3>我负责的任务</h3><p>负责推进与验收节奏的任务。</p></div></div>
          <div class="task-stack">${buckets.owned.length ? buckets.owned.map(({ task }) => renderTaskCard(task, { compact: true })).join("") : renderEmpty("当前没有负责中的任务。")}</div>
        </section>
        <section class="panel">
          <div class="section-header"><div><h3>我参与的任务</h3><p>已加入并仍在参与中的任务。</p></div></div>
          <div class="task-stack">${buckets.active.length ? buckets.active.map(({ task }) => renderTaskCard(task, { compact: true })).join("") : renderEmpty("当前没有参与中的任务。")}</div>
        </section>
      </div>
      <div class="page-grid columns-2">
        <section class="panel">
          <div class="section-header"><div><h3>我申请中的任务</h3><p>等待组长或管理员审批的高难任务。</p></div></div>
          <div class="task-stack">${buckets.pendingJoin.length ? buckets.pendingJoin.map((approval) => renderApprovalPreview(approval)).join("") : renderEmpty("当前没有待审批的加入申请。")}</div>
        </section>
        <section class="panel">
          <div class="section-header"><div><h3>待我提交的任务</h3><p>已完成主要工作但还未提交成果的任务。</p></div></div>
          <div class="task-stack">${buckets.needsSubmit.length ? buckets.needsSubmit.map(({ task }) => renderTaskCard(task, { compact: true })).join("") : renderEmpty("当前没有待提交成果的任务。")}</div>
        </section>
      </div>
      <div class="page-grid columns-2">
        <section class="panel">
          <div class="section-header"><div><h3>我已完成的任务</h3><p>已通过审核并完成结算。</p></div></div>
          <div class="task-stack">${buckets.completed.length ? buckets.completed.map(({ task }) => renderTaskCard(task, { compact: true })).join("") : renderEmpty("当前没有已完成任务。")}</div>
        </section>
        <section class="panel">
          <div class="section-header"><div><h3>隐私记录</h3><p>退出任务与逾期任务仅本人及管理层可见。</p></div></div>
          <div class="timeline-grid">
            ${buckets.exited.length ? buckets.exited.map(({ task, participant }) => renderTimelineCard(task.title, `已退出 · ${formatDateTime(participant.exitedAt)}`)).join("") : renderTimelineCard("退出记录", "暂无退出任务记录")}
            ${buckets.overdue.length ? buckets.overdue.map(({ task }) => renderTimelineCard(task.title, `逾期任务 · 截止于 ${formatShortDate(task.dueAt)}`)).join("") : renderTimelineCard("逾期记录", "暂无逾期任务记录")}
          </div>
        </section>
      </div>
    </section>
  `;
}

export function renderTaskManagementPage() {
  const tasks = getVisibleTaskManagementTasks();
  return `
    <section>
      <div class="page-header">
        <div><h2>任务管理</h2><p>面向管理员、组长与正式队员的任务总览。支持看板、表格、日历与兵种四种视图。</p></div>
        <div class="page-actions">
          <button class="button-ghost" type="button" data-action="export-tasks-csv">导出 CSV</button>
          <button class="button-secondary ${state.taskManageView === "kanban" ? "is-active" : ""}" type="button" data-action="set-task-view" data-view="kanban">看板</button>
          <button class="button-secondary ${state.taskManageView === "table" ? "is-active" : ""}" type="button" data-action="set-task-view" data-view="table">表格</button>
          <button class="button-secondary ${state.taskManageView === "calendar" ? "is-active" : ""}" type="button" data-action="set-task-view" data-view="calendar">日历</button>
          <button class="button-secondary ${state.taskManageView === "robot" ? "is-active" : ""}" type="button" data-action="set-task-view" data-view="robot">兵种</button>
        </div>
      </div>
      <section class="panel">${renderTaskManageBody(tasks)}</section>
    </section>
  `;
}

export function renderMembersPage() {
  const members = getFilteredMembers();
  const activeMembers = state.database.members.filter((member) => isMemberIncludedInWorkspaceStats(member));
  const leaderCount = activeMembers.filter((member) => ["admin", "leader"].includes(member.role)).length;
  const overloadedCount = getMemberLoads().filter((entry) => entry.loadLevel === "overload").length;
  return `
    <section>
      <div class="panel member-board">
        <div class="member-stage">
          <div class="member-stage-copy">
            <div class="market-stage-badge">Member Directory</div>
            <h2>成员管理</h2>
            <p>按身份、部门和兵种查看成员公开资料、负载与贡献数据。具备权限的成员可以维护成员档案。</p>
          </div>
          <div class="market-stage-meta">
            ${renderPointPill("成员总数", activeMembers.length)}
            ${renderPointPill("管理与组长", leaderCount)}
            ${renderPointPill("过载成员", overloadedCount)}
          </div>
        </div>
        <div class="market-filter-shell">
          <div class="field-grid">
            ${renderFilterField("搜索成员", "member", "query", state.memberFilters.query, "text", "搜索姓名、技能、部门")}
            ${renderFilterSelect("权限角色", "member", "role", state.memberFilters.role, options.roles, dictionaries.roles)}
          </div>
          <div class="field-grid">
            ${renderFilterSelect("部门", "member", "department", state.memberFilters.department, options.departments)}
            ${renderFilterSelect("兵种", "member", "robotGroup", state.memberFilters.robotGroup, options.robotGroups)}
          </div>
        </div>
        <div class="toolbar-row"><button class="button-ghost" type="button" data-action="export-members-csv">导出 CSV</button><button class="button-secondary ${state.memberView === "cards" ? "is-active" : ""}" type="button" data-action="set-member-view" data-view="cards">卡片</button><button class="button-secondary ${state.memberView === "table" ? "is-active" : ""}" type="button" data-action="set-member-view" data-view="table">表格</button></div>
        ${state.memberView === "table" ? renderMemberTable(members) : `<div class="member-waterfall">${members.length ? members.map((member) => renderMemberCard(member, { waterfall: true })).join("") : renderEmpty("没有匹配筛选条件的成员。")}</div>`}
      </div>
    </section>
  `;
}

export function renderProjectsPage() {
  const projects = state.database.robotProjects;
  return `
    <section>
      <div class="page-header"><div><h2>兵种项目</h2><p>集中查看七个兵种机器人的总进度、子方向进度、阻塞项、关联任务与阶段复盘。</p></div></div>
      <div class="project-grid">${projects.length ? projects.map((project) => renderProjectCard(project, true)).join("") : renderEmpty("当前没有兵种项目数据，请在系统设置中初始化。")}</div>
    </section>
  `;
}

export function renderRankingsPage() {
  const leaderboard = getLeaderboard(state.rankingTab, state.rankingRange);
  const departmentBoard = getDepartmentContribution();
  const robotBoard = getRobotContribution();
  return `
    <section>
        <div class="page-header"><div><h2>积分排行</h2><p>支持研习点、工时点、管理点、综合贡献、部门贡献与兵种贡献的多维榜单。</p></div><button class="button-ghost" type="button" data-action="export-rankings-csv">导出 CSV</button></div>
      <div class="toolbar-row">
        ${[["study", "研习点榜"], ["labor", "工时点榜"], ["management", "管理点榜"], ["composite", "综合贡献榜"]].map(([tab, label]) => `<button class="button-secondary ${state.rankingTab === tab ? "is-active" : ""}" type="button" data-action="set-ranking-tab" data-tab="${tab}">${label}</button>`).join("")}
        <button class="button-ghost ${state.rankingRange === "month" ? "is-active" : ""}" type="button" data-action="set-ranking-range" data-range="month">月度榜</button>
        <button class="button-ghost ${state.rankingRange === "total" ? "is-active" : ""}" type="button" data-action="set-ranking-range" data-range="total">总榜</button>
      </div>
      <div class="page-grid columns-2">
        <section class="panel">
          <div class="section-header"><div><h3>${escapeHtml(state.rankingRange === "month" ? "月度榜单" : "总榜榜单")}</h3><p>按当前选中的积分维度排序。</p></div></div>
          <div class="task-stack">${leaderboard.length ? leaderboard.map((entry, index) => renderRankingCard(entry, index + 1, state.rankingTab)).join("") : renderEmpty("暂无排行数据。")}</div>
        </section>
        <div class="page-grid">
          <section class="panel">
            <div class="section-header"><div><h3>部门贡献榜</h3><p>按累计点数聚合。</p></div></div>
            <div class="chart-bars">${departmentBoard.length ? departmentBoard.map((item) => renderChartRow(item.label, item.value, departmentBoard[0]?.value || 1)).join("") : renderEmpty("暂无数据。")}</div>
          </section>
          <section class="panel">
            <div class="section-header"><div><h3>兵种贡献榜</h3><p>按关联任务点数聚合。</p></div></div>
            <div class="chart-bars">${robotBoard.length ? robotBoard.map((item) => renderChartRow(item.label, item.value, robotBoard[0]?.value || 1)).join("") : renderEmpty("暂无数据。")}</div>
          </section>
        </div>
      </div>
    </section>
  `;
}

export function renderReviewsPage() {
  const groups = getApprovalGroups();
  return `
    <section>
      <div class="page-header"><div><h2>审核中心</h2><p>集中处理注册审核、高难任务加入审批、任务完成审核、点数结算与补偿记录。</p></div></div>
      <div class="toolbar-row">
        ${renderReviewTabButton("registration", "注册审核", groups.registration.length)}
        ${renderReviewTabButton("join", "加入审批", groups.join.length)}
        ${renderReviewTabButton("completion", "完成审核", groups.completion.length)}
        ${renderReviewTabButton("settlement", "点数结算", groups.settlement.length)}
        ${renderReviewTabButton("compensation", "补偿记录", groups.compensation.length)}
        ${renderReviewTabButton("promotion", "晋升记录", groups.promotion.length)}
        ${renderReviewTabButton("status_change", "变岗申请", groups.status_change.length)}
      </div>
      <section class="panel"><div class="approval-stack">${renderReviewStack(groups[state.reviewTab])}</div></section>
    </section>
  `;
}

export function renderProfilePage() {
  const member = getCurrentMember();
  const stats = getMemberPointSummary(member.id);
  const history = getMemberTimeline(member.id);
  const tasks = getCurrentUserTaskRecords();
  return `
    <section>
      <div class="page-header"><div><h2>个人中心</h2><p>查看个人档案、任务轨迹、积分构成、隐私记录与晋升路径。</p></div></div>
      <div class="page-grid columns-2">
        <section class="panel">
          <div class="section-header"><div><h3>基本信息</h3><p>角色、部门、方向、兵种、技能标签与个人简介。</p></div></div>
          <div class="definition-list">
            <div class="definition-row"><span>姓名</span><strong>${escapeHtml(member.name)}</strong></div>
            <div class="definition-row"><span>成员身份</span><strong>${escapeHtml(dictionaries.identities[member.identity])}</strong></div>
            <div class="definition-row"><span>部门 / 方向</span><strong>${escapeHtml(member.departments.join(" / "))} / ${escapeHtml(member.directions.join(" / ") || "未设置")}</strong></div>
            <div class="definition-row"><span>兵种组</span><strong>${escapeHtml(member.robotGroups.join(" / ") || "未设置")}</strong></div>
            <div class="definition-row"><span>技能标签</span><strong>${escapeHtml(member.skillTags.join("、") || "暂无")}</strong></div>
            <div class="definition-row"><span>个人简介</span><strong>${escapeHtml(member.bio || "未填写")}</strong></div>
          </div>
          <div class="button-row">
            <button class="button-secondary" type="button" data-action="open-profile-content">修改个性内容</button>
            <button class="button-ghost" type="button" data-action="open-password-change">修改密码</button>
          </div>
          ${member.memberStatus === "retired" ? '<div class="helper-text">当前账号已退休，保留历史记录并可只读浏览，但不再参与任务、积分与排行。</div>' : ""}
        </section>
        <section class="panel">
          <div class="section-header"><div><h3>积分总览</h3><p>研习点、工时点、管理点与综合贡献。</p></div></div>
          <div class="metric-grid metric-grid-profile">
            ${renderMetricCard("研习点", stats.study, "技术学习、文档与研发成长")}
            ${renderMetricCard("工时点", stats.labor, "执行劳动、运维与运营投入")}
            ${renderMetricCard("管理点", stats.management, "负责人组织协调与验收贡献")}
            ${renderMetricCard("综合贡献", stats.composite, "三类点数之和")}
            ${renderMetricCard("本月完成", tasks.completed.length, "本月已经完成并结算的任务")}
          </div>
        </section>
      </div>
      <div class="page-grid columns-2">
        <section class="panel">
          <div class="section-header"><div><h3>成长与记录</h3><p>晋升、补偿点、退出任务与逾期任务会统一进入个人时间线。</p></div></div>
          <div class="timeline-grid">${history.length ? history.map((item) => renderTimelineCard(item.title, item.description)).join("") : renderEmpty("暂无成长记录。")}</div>
        </section>
        <section class="panel">
          <div class="section-header"><div><h3>当前任务快照</h3><p>快速查看正在进行和最近完成的任务。</p></div></div>
          <div class="task-stack">
            ${tasks.active.length ? tasks.active.slice(0, 3).map(({ task }) => renderTaskCard(task, { compact: true })).join("") : renderEmpty("暂无进行中的任务。")}
            ${tasks.completed.length ? tasks.completed.slice(0, 2).map(({ task }) => renderTaskCard(task, { compact: true })).join("") : ""}
          </div>
        </section>
      </div>
      <div class="button-row" style="margin-top:24px;justify-content:flex-start">
        <button class="button-danger" type="button" data-action="open-retire-self">申请退役</button>
        <span class="helper-text">退役后账号变为只读，不再参与任务、积分与排行，但历史记录保留。</span>
      </div>
    </section>
  `;
}

export function renderSettingsPage() {
  const settings = state.database.settings;
  return `
    <section>
      <div class="page-header"><div><h2>系统设置</h2><p>具备权限的成员可维护任务结算与审核规则，确保站内流程与实际制度保持一致。</p></div></div>
      <form class="panel" data-form="settings">
        <div class="field-grid">
          <label class="field-group"><span class="field-label">中途加入折扣</span><input class="field-input" type="number" min="0" max="1" step="0.1" name="middleJoinDiscount" required value="${escapeAttribute(String(settings.middleJoinDiscount))}"></label>
          <label class="field-group"><span class="field-label">逾期任务积分折扣</span><input class="field-input" type="number" min="0" max="1" step="0.1" name="overduePointDiscount" required value="${escapeAttribute(String(settings.overduePointDiscount ?? 0.5))}"></label>
          <label class="field-group"><span class="field-label">点数保留位数</span><input class="field-input" type="number" min="0" max="2" step="1" name="pointPrecision" required value="${escapeAttribute(String(settings.pointPrecision))}"></label>
        </div>
        <div class="field-grid">
          <label class="field-group"><span class="field-label">是否对高难任务强制审批</span><select class="field-select" name="hardTaskNeedsApproval" required><option value="true" ${settings.hardTaskNeedsApproval ? "selected" : ""}>强制审批</option><option value="false" ${!settings.hardTaskNeedsApproval ? "selected" : ""}>可手动关闭</option></select></label>
        </div>
        <div class="button-row"><button class="button-primary" type="submit" ${state.formLoading === 'settings' ? 'disabled' : ''}>保存设置</button></div>
      </form>
      <div class="button-row"><button class="button-secondary" type="button" data-action="load-file-manager">文件管理</button></div>
    </section>
  `;
}
