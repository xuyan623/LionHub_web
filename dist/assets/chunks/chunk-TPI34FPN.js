import {
  renderTaskManageBody
} from "./chunk-DNC4V4PA.js";
import {
  formatDateTime,
  formatShortDate,
  renderChartRow,
  renderEmpty,
  renderFilterField,
  renderFilterSelect,
  renderLoadRow,
  renderMemberCard,
  renderMemberTable,
  renderMetricCard,
  renderPointPill,
  renderProjectCard,
  renderRankingCard,
  renderRankingRow,
  renderReviewStack,
  renderReviewTabButton,
  renderTaskCard,
  renderTimelineCard
} from "./chunk-IIX4FKHB.js";
import {
  getApprovalGroups,
  getCurrentUserTaskRecords,
  getDashboardStats,
  getDepartmentContribution,
  getFilteredMarketTasks,
  getFilteredMembers,
  getLeaderboard,
  getMarketTasks,
  getMemberLoads,
  getMemberPointSummary,
  getMemberTimeline,
  getRobotContribution,
  getVisibleTaskManagementTasks,
  isUrgentMarketTask
} from "./chunk-XS6Z5SGI.js";
import {
  canInteractWithTasks,
  getCurrentMember,
  isMemberIncludedInWorkspaceStats
} from "./chunk-IKVMAO7C.js";
import {
  dictionaries,
  options,
  state
} from "./chunk-NDL62ULM.js";
import {
  escapeAttribute,
  escapeHtml
} from "./chunk-UQLSNBUY.js";

// client/render/pages.js
function renderDashboardPage() {
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
        <div><h2>\u4EEA\u8868\u76D8</h2><p>\u603B\u89C8\u6210\u5458\u8D1F\u8F7D\u3001\u7CBE\u9009\u4EFB\u52A1\u3001\u79EF\u5206\u6392\u884C\u4E0E\u5175\u79CD\u9879\u76EE\u8FDB\u5C55\uFF0C\u4F18\u5148\u66B4\u9732\u7BA1\u7406\u5C42\u6700\u5173\u5FC3\u7684\u8FD0\u884C\u4FE1\u53F7\u3002</p></div>
      </div>
      <div class="metric-grid">
        ${renderMetricCard("\u5F53\u524D\u6210\u5458\u6570", stats.memberCount, "\u5305\u542B\u6B63\u5E38\u72B6\u6001\u6210\u5458")}
        ${renderMetricCard("\u8FDB\u884C\u4E2D\u4EFB\u52A1", stats.inProgressCount, "\u5F53\u524D\u6B63\u5728\u63A8\u8FDB\u7684\u516C\u5F00\u4EFB\u52A1\u4E0E\u9879\u76EE\u4EFB\u52A1")}
        ${renderMetricCard("\u5F85\u5BA1\u6838\u4EFB\u52A1", stats.pendingReviewCount, "\u5DF2\u63D0\u4EA4\u6210\u679C\u7B49\u5F85\u5BA1\u6838\u4E0E\u7ED3\u7B97")}
        ${renderMetricCard("\u5DF2\u903E\u671F\u4EFB\u52A1", stats.overdueCount, "\u622A\u6B62\u65E5\u671F\u5DF2\u8FC7\u4E14\u672A\u5B8C\u6210\u7684\u4EFB\u52A1")}
        ${renderMetricCard("\u672C\u6708\u5B8C\u6210\u4EFB\u52A1", stats.completedThisMonth, "\u7528\u4E8E\u89C2\u5BDF\u5F53\u524D\u8282\u594F\u4E0E\u4EA7\u51FA\u5BC6\u5EA6")}
      </div>
      <div class="page-grid columns-3">
        <section class="panel">
          <div class="section-header"><div><h3>\u6211\u7684\u4EFB\u52A1</h3><p>\u5F53\u524D\u7528\u6237\u8D1F\u8D23\u3001\u53C2\u4E0E\u6216\u5F85\u63D0\u4EA4\u7684\u4EFB\u52A1\u3002</p></div><button class="button-ghost" type="button" data-action="navigate" data-route="myTasks">\u67E5\u770B\u5168\u90E8</button></div>
          <div class="task-stack">${myTasks.length ? myTasks.map(({ task }) => renderTaskCard(task, { compact: true })).join("") : renderEmpty("\u5F53\u524D\u6CA1\u6709\u8FDB\u884C\u4E2D\u7684\u4E2A\u4EBA\u4EFB\u52A1\u3002")}</div>
        </section>
        <section class="panel">
          <div class="section-header"><div><h3>\u4EFB\u52A1\u5E02\u573A\u7CBE\u9009</h3><p>\u9762\u5411\u5F53\u524D\u6210\u5458\u753B\u50CF\u7684\u6700\u65B0\u516C\u5F00\u4EFB\u52A1\u3002</p></div><button class="button-ghost" type="button" data-action="navigate" data-route="market">\u8FDB\u5165\u5E02\u573A</button></div>
          <div class="task-stack">${featuredTasks.map((task) => renderTaskCard(task, { showAction: true, compact: true })).join("")}</div>
        </section>
        <section class="panel">
          <div class="section-header"><div><h3>\u79EF\u5206\u6392\u884C</h3><p>\u7EFC\u5408\u8D21\u732E Top 5\u3002</p></div><button class="button-ghost" type="button" data-action="navigate" data-route="rankings">\u5B8C\u6574\u699C\u5355</button></div>
          <div class="ranking-stack">${ranking.map((entry, index) => renderRankingRow(entry, index + 1)).join("")}</div>
        </section>
      </div>
      <div class="page-grid columns-2">
        <section class="panel">
          <div class="section-header"><div><h3>\u6210\u5458\u8D1F\u8F7D</h3><p>\u7528\u4E8E\u4EFB\u52A1\u5206\u914D\u4E0E\u5E02\u573A\u63A8\u8350\u7684\u8D1F\u8F7D\u5FEB\u7167\u3002</p></div></div>
          <div class="member-stack">${loads.map((entry) => renderLoadRow(entry)).join("")}</div>
        </section>
        <section class="panel">
          <div class="section-header"><div><h3>\u90E8\u95E8\u8D21\u732E</h3><p>\u6309\u7814\u4E60\u70B9\u3001\u5DE5\u65F6\u70B9\u3001\u7BA1\u7406\u70B9\u5408\u8BA1\u8D21\u732E\u503C\u6BD4\u8F83\u3002</p></div></div>
          <div class="chart-bars">${departments.map((item) => renderChartRow(item.label, item.value, departments[0]?.value || 1)).join("")}</div>
        </section>
      </div>
      <section class="panel">
        <div class="section-header"><div><h3>\u5175\u79CD\u9879\u76EE\u8FDB\u5EA6\u603B\u89C8</h3><p>\u6B65\u5175\u3001\u54E8\u5175\u3001\u82F1\u96C4\u3001\u5DE5\u7A0B\u3001\u65E0\u4EBA\u673A\u3001\u98DE\u9556\u3001\u96F7\u8FBE\u7684\u5F53\u524D\u8FDB\u5EA6\u3001\u963B\u585E\u9879\u4E0E\u8D1F\u8D23\u4EBA\u3002</p></div><button class="button-ghost" type="button" data-action="navigate" data-route="projects">\u8FDB\u5165\u5175\u79CD\u9875</button></div>
        <div class="project-grid">${projects.map((project) => renderProjectCard(project)).join("")}</div>
      </section>
    </section>
  `;
}
function renderMarketPage() {
  const tasks = getFilteredMarketTasks();
  return `
    <section>
      <div class="panel market-board">
        <div class="market-stage">
          <div class="market-stage-copy">
            <div class="market-stage-badge">Open Task Market</div>
            <h2>\u4EFB\u52A1\u5E02\u573A</h2>
            <p>\u5B8C\u5168\u516C\u5F00\u7684\u4EFB\u52A1\u5E7F\u573A\u3002\u652F\u6301\u641C\u7D22\u3001\u7B5B\u9009\u3001\u76F4\u63A5\u9886\u53D6\u6216\u5BF9\u9AD8\u96BE\u4EFB\u52A1\u53D1\u8D77\u5BA1\u6279\u7533\u8BF7\u3002</p>
          </div>
          <div class="market-stage-meta">
            ${renderPointPill("\u516C\u5F00\u4EFB\u52A1", tasks.length)}
            ${renderPointPill("\u9AD8\u96BE\u4EFB\u52A1", tasks.filter((task) => ["hard", "core"].includes(task.difficulty)).length)}
            ${renderPointPill("\u7D27\u6025\u4EFB\u52A1", tasks.filter((task) => isUrgentMarketTask(task)).length)}
            ${renderPointPill("\u5F85\u5BA1\u6838", tasks.filter((task) => task.status === "pending_review").length)}
          </div>
        </div>
        <div class="market-filter-shell">
          <div class="field-grid">
            ${renderFilterField("\u4EFB\u52A1\u641C\u7D22", "market", "query", state.marketFilters.query, "text", "\u641C\u7D22\u6807\u9898\u3001\u63CF\u8FF0\u3001\u63A8\u8350\u4EBA\u7FA4")}
            ${renderFilterSelect("\u4EFB\u52A1\u7C7B\u578B", "market", "type", state.marketFilters.type, options.taskTypes, dictionaries.taskTypes)}
          </div>
          <div class="field-grid-3">
            ${renderFilterSelect("\u90E8\u95E8", "market", "department", state.marketFilters.department, options.departments)}
            ${renderFilterSelect("\u65B9\u5411", "market", "direction", state.marketFilters.direction, options.directions)}
            ${renderFilterSelect("\u5175\u79CD", "market", "robotGroup", state.marketFilters.robotGroup, options.robotGroups)}
          </div>
          <div class="field-grid-3">
            ${renderFilterSelect("\u96BE\u5EA6", "market", "difficulty", state.marketFilters.difficulty, options.difficulties, dictionaries.difficulties)}
            ${renderFilterSelect("\u72B6\u6001", "market", "status", state.marketFilters.status, options.taskStatuses, dictionaries.taskStatuses)}
            ${renderFilterField("\u63A8\u8350\u9002\u5408\u4EBA\u7FA4", "market", "audience", state.marketFilters.audience, "text", "\u5982 \u673A\u68B0\u7EC4\u65B0\u4EBA / \u7B97\u6CD5\u68AF\u961F")}
          </div>
        </div>
        <div class="market-waterfall">
          ${tasks.length ? tasks.map((task) => renderTaskCard(task, { showAction: canInteractWithTasks(), compact: false, waterfall: true })).join("") : renderEmpty("\u6CA1\u6709\u5339\u914D\u7B5B\u9009\u6761\u4EF6\u7684\u4EFB\u52A1\u3002")}
        </div>
      </div>
    </section>
  `;
}
function renderMyTasksPage() {
  const buckets = getCurrentUserTaskRecords();
  return `
    <section>
      <div class="page-header"><div><h2>\u6211\u7684\u4EFB\u52A1</h2><p>\u7BA1\u7406\u5F53\u524D\u7528\u6237\u8D1F\u8D23\u3001\u53C2\u4E0E\u3001\u7533\u8BF7\u4E2D\u3001\u5F85\u63D0\u4EA4\u3001\u5DF2\u5B8C\u6210\u4E0E\u9690\u79C1\u8BB0\u5F55\u4E2D\u7684\u4EFB\u52A1\u3002</p></div></div>
      <div class="page-grid columns-2">
        <section class="panel">
          <div class="section-header"><div><h3>\u6211\u8D1F\u8D23\u7684\u4EFB\u52A1</h3><p>\u8D1F\u8D23\u63A8\u8FDB\u4E0E\u9A8C\u6536\u8282\u594F\u7684\u4EFB\u52A1\u3002</p></div></div>
          <div class="task-stack">${buckets.owned.length ? buckets.owned.map(({ task }) => renderTaskCard(task, { compact: true })).join("") : renderEmpty("\u5F53\u524D\u6CA1\u6709\u8D1F\u8D23\u4E2D\u7684\u4EFB\u52A1\u3002")}</div>
        </section>
        <section class="panel">
          <div class="section-header"><div><h3>\u6211\u53C2\u4E0E\u7684\u4EFB\u52A1</h3><p>\u5DF2\u52A0\u5165\u5E76\u4ECD\u5728\u53C2\u4E0E\u4E2D\u7684\u4EFB\u52A1\u3002</p></div></div>
          <div class="task-stack">${buckets.active.length ? buckets.active.map(({ task }) => renderTaskCard(task, { compact: true })).join("") : renderEmpty("\u5F53\u524D\u6CA1\u6709\u53C2\u4E0E\u4E2D\u7684\u4EFB\u52A1\u3002")}</div>
        </section>
      </div>
      <div class="page-grid columns-2">
        <section class="panel">
          <div class="section-header"><div><h3>\u6211\u7533\u8BF7\u4E2D\u7684\u4EFB\u52A1</h3><p>\u7B49\u5F85\u7EC4\u957F\u6216\u7BA1\u7406\u5458\u5BA1\u6279\u7684\u9AD8\u96BE\u4EFB\u52A1\u3002</p></div></div>
          <div class="task-stack">${buckets.pendingJoin.length ? buckets.pendingJoin.map((approval) => renderApprovalPreview(approval)).join("") : renderEmpty("\u5F53\u524D\u6CA1\u6709\u5F85\u5BA1\u6279\u7684\u52A0\u5165\u7533\u8BF7\u3002")}</div>
        </section>
        <section class="panel">
          <div class="section-header"><div><h3>\u5F85\u6211\u63D0\u4EA4\u7684\u4EFB\u52A1</h3><p>\u5DF2\u5B8C\u6210\u4E3B\u8981\u5DE5\u4F5C\u4F46\u8FD8\u672A\u63D0\u4EA4\u6210\u679C\u7684\u4EFB\u52A1\u3002</p></div></div>
          <div class="task-stack">${buckets.needsSubmit.length ? buckets.needsSubmit.map(({ task }) => renderTaskCard(task, { compact: true })).join("") : renderEmpty("\u5F53\u524D\u6CA1\u6709\u5F85\u63D0\u4EA4\u6210\u679C\u7684\u4EFB\u52A1\u3002")}</div>
        </section>
      </div>
      <div class="page-grid columns-2">
        <section class="panel">
          <div class="section-header"><div><h3>\u6211\u5DF2\u5B8C\u6210\u7684\u4EFB\u52A1</h3><p>\u5DF2\u901A\u8FC7\u5BA1\u6838\u5E76\u5B8C\u6210\u7ED3\u7B97\u3002</p></div></div>
          <div class="task-stack">${buckets.completed.length ? buckets.completed.map(({ task }) => renderTaskCard(task, { compact: true })).join("") : renderEmpty("\u5F53\u524D\u6CA1\u6709\u5DF2\u5B8C\u6210\u4EFB\u52A1\u3002")}</div>
        </section>
        <section class="panel">
          <div class="section-header"><div><h3>\u9690\u79C1\u8BB0\u5F55</h3><p>\u9000\u51FA\u4EFB\u52A1\u4E0E\u903E\u671F\u4EFB\u52A1\u4EC5\u672C\u4EBA\u53CA\u7BA1\u7406\u5C42\u53EF\u89C1\u3002</p></div></div>
          <div class="timeline-grid">
            ${buckets.exited.length ? buckets.exited.map(({ task, participant }) => renderTimelineCard(task.title, `\u5DF2\u9000\u51FA \xB7 ${formatDateTime(participant.exitedAt)}`)).join("") : renderTimelineCard("\u9000\u51FA\u8BB0\u5F55", "\u6682\u65E0\u9000\u51FA\u4EFB\u52A1\u8BB0\u5F55")}
            ${buckets.overdue.length ? buckets.overdue.map(({ task }) => renderTimelineCard(task.title, `\u903E\u671F\u4EFB\u52A1 \xB7 \u622A\u6B62\u4E8E ${formatShortDate(task.dueAt)}`)).join("") : renderTimelineCard("\u903E\u671F\u8BB0\u5F55", "\u6682\u65E0\u903E\u671F\u4EFB\u52A1\u8BB0\u5F55")}
          </div>
        </section>
      </div>
    </section>
  `;
}
function renderTaskManagementPage() {
  const tasks = getVisibleTaskManagementTasks();
  return `
    <section>
      <div class="page-header">
        <div><h2>\u4EFB\u52A1\u7BA1\u7406</h2><p>\u9762\u5411\u7BA1\u7406\u5458\u3001\u7EC4\u957F\u4E0E\u6B63\u5F0F\u961F\u5458\u7684\u4EFB\u52A1\u603B\u89C8\u3002\u652F\u6301\u770B\u677F\u3001\u8868\u683C\u3001\u65E5\u5386\u4E0E\u5175\u79CD\u56DB\u79CD\u89C6\u56FE\u3002</p></div>
        <div class="page-actions">
          <button class="button-ghost" type="button" data-action="export-tasks-csv">\u5BFC\u51FA CSV</button>
          <button class="button-secondary ${state.taskManageView === "kanban" ? "is-active" : ""}" type="button" data-action="set-task-view" data-view="kanban">\u770B\u677F</button>
          <button class="button-secondary ${state.taskManageView === "table" ? "is-active" : ""}" type="button" data-action="set-task-view" data-view="table">\u8868\u683C</button>
          <button class="button-secondary ${state.taskManageView === "calendar" ? "is-active" : ""}" type="button" data-action="set-task-view" data-view="calendar">\u65E5\u5386</button>
          <button class="button-secondary ${state.taskManageView === "robot" ? "is-active" : ""}" type="button" data-action="set-task-view" data-view="robot">\u5175\u79CD</button>
        </div>
      </div>
      <section class="panel">${renderTaskManageBody(tasks)}</section>
    </section>
  `;
}
function renderMembersPage() {
  const members = getFilteredMembers();
  const activeMembers = state.database.members.filter((member) => isMemberIncludedInWorkspaceStats(member));
  const leaderCount = activeMembers.filter((member) => ["admin", "leader"].includes(member.role)).length;
  const overloadedCount = getMemberLoads().filter((entry) => entry.loadLevel === "overload").length;
  const pendingCount = state.database.members.filter((member) => member.memberStatus === "pending_review").length;
  return `
    <section>
      <div class="panel member-board">
        <div class="member-stage">
          <div class="member-stage-copy">
            <div class="market-stage-badge">Member Directory</div>
            <h2>\u6210\u5458\u7BA1\u7406</h2>
            <p>\u6309\u8EAB\u4EFD\u3001\u90E8\u95E8\u3001\u5175\u79CD\u548C\u72B6\u6001\u67E5\u770B\u6210\u5458\u516C\u5F00\u8D44\u6599\u3001\u8D1F\u8F7D\u4E0E\u8D21\u732E\u6570\u636E\u3002\u7BA1\u7406\u5458\u53EF\u4EE5\u76F4\u63A5\u7EF4\u62A4\u6210\u5458\u6863\u6848\u3002</p>
          </div>
          <div class="market-stage-meta">
            ${renderPointPill("\u6210\u5458\u603B\u6570", activeMembers.length)}
            ${renderPointPill("\u7BA1\u7406\u4E0E\u7EC4\u957F", leaderCount)}
            ${renderPointPill("\u8FC7\u8F7D\u6210\u5458", overloadedCount)}
            ${renderPointPill("\u5F85\u5BA1\u6838", pendingCount)}
          </div>
        </div>
        <div class="market-filter-shell">
          <div class="field-grid">
            ${renderFilterField("\u641C\u7D22\u6210\u5458", "member", "query", state.memberFilters.query, "text", "\u641C\u7D22\u59D3\u540D\u3001\u6280\u80FD\u3001\u90E8\u95E8")}
            ${renderFilterSelect("\u6743\u9650\u89D2\u8272", "member", "role", state.memberFilters.role, options.roles, dictionaries.roles)}
          </div>
          <div class="field-grid-3">
            ${renderFilterSelect("\u90E8\u95E8", "member", "department", state.memberFilters.department, options.departments)}
            ${renderFilterSelect("\u5175\u79CD", "member", "robotGroup", state.memberFilters.robotGroup, options.robotGroups)}
            ${renderFilterSelect("\u72B6\u6001", "member", "status", state.memberFilters.status, options.memberStatuses, dictionaries.memberStatuses)}
          </div>
        </div>
        <div class="toolbar-row"><button class="button-ghost" type="button" data-action="export-members-csv">\u5BFC\u51FA CSV</button><button class="button-secondary ${state.memberView === "cards" ? "is-active" : ""}" type="button" data-action="set-member-view" data-view="cards">\u5361\u7247</button><button class="button-secondary ${state.memberView === "table" ? "is-active" : ""}" type="button" data-action="set-member-view" data-view="table">\u8868\u683C</button></div>
        ${state.memberView === "table" ? renderMemberTable(members) : `<div class="member-waterfall">${members.length ? members.map((member) => renderMemberCard(member, { waterfall: true })).join("") : renderEmpty("\u6CA1\u6709\u5339\u914D\u7B5B\u9009\u6761\u4EF6\u7684\u6210\u5458\u3002")}</div>`}
      </div>
    </section>
  `;
}
function renderProjectsPage() {
  const projects = state.database.robotProjects;
  return `
    <section>
      <div class="page-header"><div><h2>\u5175\u79CD\u9879\u76EE</h2><p>\u96C6\u4E2D\u67E5\u770B\u4E03\u4E2A\u5175\u79CD\u673A\u5668\u4EBA\u7684\u603B\u8FDB\u5EA6\u3001\u5B50\u65B9\u5411\u8FDB\u5EA6\u3001\u963B\u585E\u9879\u3001\u5173\u8054\u4EFB\u52A1\u4E0E\u9636\u6BB5\u590D\u76D8\u3002</p></div></div>
      <div class="project-grid">${projects.length ? projects.map((project) => renderProjectCard(project, true)).join("") : renderEmpty("\u5F53\u524D\u6CA1\u6709\u5175\u79CD\u9879\u76EE\u6570\u636E\uFF0C\u8BF7\u5728\u7CFB\u7EDF\u8BBE\u7F6E\u4E2D\u521D\u59CB\u5316\u3002")}</div>
    </section>
  `;
}
function renderRankingsPage() {
  const leaderboard = getLeaderboard(state.rankingTab, state.rankingRange);
  const departmentBoard = getDepartmentContribution();
  const robotBoard = getRobotContribution();
  return `
    <section>
        <div class="page-header"><div><h2>\u79EF\u5206\u6392\u884C</h2><p>\u652F\u6301\u7814\u4E60\u70B9\u3001\u5DE5\u65F6\u70B9\u3001\u7BA1\u7406\u70B9\u3001\u7EFC\u5408\u8D21\u732E\u3001\u90E8\u95E8\u8D21\u732E\u4E0E\u5175\u79CD\u8D21\u732E\u7684\u591A\u7EF4\u699C\u5355\u3002</p></div><button class="button-ghost" type="button" data-action="export-rankings-csv">\u5BFC\u51FA CSV</button></div>
      <div class="toolbar-row">
        ${[["study", "\u7814\u4E60\u70B9\u699C"], ["labor", "\u5DE5\u65F6\u70B9\u699C"], ["management", "\u7BA1\u7406\u70B9\u699C"], ["composite", "\u7EFC\u5408\u8D21\u732E\u699C"]].map(([tab, label]) => `<button class="button-secondary ${state.rankingTab === tab ? "is-active" : ""}" type="button" data-action="set-ranking-tab" data-tab="${tab}">${label}</button>`).join("")}
        <button class="button-ghost ${state.rankingRange === "month" ? "is-active" : ""}" type="button" data-action="set-ranking-range" data-range="month">\u6708\u5EA6\u699C</button>
        <button class="button-ghost ${state.rankingRange === "total" ? "is-active" : ""}" type="button" data-action="set-ranking-range" data-range="total">\u603B\u699C</button>
      </div>
      <div class="page-grid columns-2">
        <section class="panel">
          <div class="section-header"><div><h3>${escapeHtml(state.rankingRange === "month" ? "\u6708\u5EA6\u699C\u5355" : "\u603B\u699C\u699C\u5355")}</h3><p>\u6309\u5F53\u524D\u9009\u4E2D\u7684\u79EF\u5206\u7EF4\u5EA6\u6392\u5E8F\u3002</p></div></div>
          <div class="task-stack">${leaderboard.length ? leaderboard.map((entry, index) => renderRankingCard(entry, index + 1, state.rankingTab)).join("") : renderEmpty("\u6682\u65E0\u6392\u884C\u6570\u636E\u3002")}</div>
        </section>
        <div class="page-grid">
          <section class="panel">
            <div class="section-header"><div><h3>\u90E8\u95E8\u8D21\u732E\u699C</h3><p>\u6309\u7D2F\u8BA1\u70B9\u6570\u805A\u5408\u3002</p></div></div>
            <div class="chart-bars">${departmentBoard.length ? departmentBoard.map((item) => renderChartRow(item.label, item.value, departmentBoard[0]?.value || 1)).join("") : renderEmpty("\u6682\u65E0\u6570\u636E\u3002")}</div>
          </section>
          <section class="panel">
            <div class="section-header"><div><h3>\u5175\u79CD\u8D21\u732E\u699C</h3><p>\u6309\u5173\u8054\u4EFB\u52A1\u70B9\u6570\u805A\u5408\u3002</p></div></div>
            <div class="chart-bars">${robotBoard.length ? robotBoard.map((item) => renderChartRow(item.label, item.value, robotBoard[0]?.value || 1)).join("") : renderEmpty("\u6682\u65E0\u6570\u636E\u3002")}</div>
          </section>
        </div>
      </div>
    </section>
  `;
}
function renderReviewsPage() {
  const groups = getApprovalGroups();
  return `
    <section>
      <div class="page-header"><div><h2>\u5BA1\u6838\u4E2D\u5FC3</h2><p>\u96C6\u4E2D\u5904\u7406\u6CE8\u518C\u5BA1\u6838\u3001\u9AD8\u96BE\u4EFB\u52A1\u52A0\u5165\u5BA1\u6279\u3001\u4EFB\u52A1\u5B8C\u6210\u5BA1\u6838\u3001\u70B9\u6570\u7ED3\u7B97\u4E0E\u8865\u507F\u8BB0\u5F55\u3002</p></div></div>
      <div class="toolbar-row">
        ${renderReviewTabButton("registration", "\u6CE8\u518C\u5BA1\u6838", groups.registration.length)}
        ${renderReviewTabButton("join", "\u52A0\u5165\u5BA1\u6279", groups.join.length)}
        ${renderReviewTabButton("completion", "\u5B8C\u6210\u5BA1\u6838", groups.completion.length)}
        ${renderReviewTabButton("settlement", "\u70B9\u6570\u7ED3\u7B97", groups.settlement.length)}
        ${renderReviewTabButton("compensation", "\u8865\u507F\u8BB0\u5F55", groups.compensation.length)}
        ${renderReviewTabButton("promotion", "\u664B\u5347\u8BB0\u5F55", groups.promotion.length)}
        ${renderReviewTabButton("status_change", "\u53D8\u5C97\u7533\u8BF7", groups.status_change.length)}
      </div>
      <section class="panel"><div class="approval-stack">${renderReviewStack(groups[state.reviewTab])}</div></section>
    </section>
  `;
}
function renderProfilePage() {
  const member = getCurrentMember();
  const stats = getMemberPointSummary(member.id);
  const history = getMemberTimeline(member.id);
  const tasks = getCurrentUserTaskRecords();
  return `
    <section>
      <div class="page-header"><div><h2>\u4E2A\u4EBA\u4E2D\u5FC3</h2><p>\u67E5\u770B\u4E2A\u4EBA\u6863\u6848\u3001\u4EFB\u52A1\u8F68\u8FF9\u3001\u79EF\u5206\u6784\u6210\u3001\u9690\u79C1\u8BB0\u5F55\u4E0E\u664B\u5347\u8DEF\u5F84\u3002</p></div></div>
      <div class="page-grid columns-2">
        <section class="panel">
          <div class="section-header"><div><h3>\u57FA\u672C\u4FE1\u606F</h3><p>\u89D2\u8272\u3001\u90E8\u95E8\u3001\u65B9\u5411\u3001\u5175\u79CD\u3001\u6280\u80FD\u6807\u7B7E\u4E0E\u4E2A\u4EBA\u7B80\u4ECB\u3002</p></div></div>
          <div class="definition-list">
            <div class="definition-row"><span>\u59D3\u540D</span><strong>${escapeHtml(member.name)}</strong></div>
            <div class="definition-row"><span>\u6210\u5458\u8EAB\u4EFD</span><strong>${escapeHtml(dictionaries.identities[member.identity])}</strong></div>
            <div class="definition-row"><span>\u90E8\u95E8 / \u65B9\u5411</span><strong>${escapeHtml(member.departments.join(" / "))} / ${escapeHtml(member.directions.join(" / ") || "\u672A\u8BBE\u7F6E")}</strong></div>
            <div class="definition-row"><span>\u5175\u79CD\u7EC4</span><strong>${escapeHtml(member.robotGroups.join(" / ") || "\u672A\u8BBE\u7F6E")}</strong></div>
            <div class="definition-row"><span>\u6280\u80FD\u6807\u7B7E</span><strong>${escapeHtml(member.skillTags.join("\u3001") || "\u6682\u65E0")}</strong></div>
            <div class="definition-row"><span>\u4E2A\u4EBA\u7B80\u4ECB</span><strong>${escapeHtml(member.bio || "\u672A\u586B\u5199")}</strong></div>
          </div>
          <div class="button-row">
            <button class="button-secondary" type="button" data-action="open-profile-content">\u4FEE\u6539\u4E2A\u6027\u5185\u5BB9</button>
            <button class="button-ghost" type="button" data-action="open-password-change">\u4FEE\u6539\u5BC6\u7801</button>
          </div>
          ${member.memberStatus === "retired" ? '<div class="helper-text">\u5F53\u524D\u8D26\u53F7\u5DF2\u9000\u4F11\uFF0C\u4FDD\u7559\u5386\u53F2\u8BB0\u5F55\u5E76\u53EF\u53EA\u8BFB\u6D4F\u89C8\uFF0C\u4F46\u4E0D\u518D\u53C2\u4E0E\u4EFB\u52A1\u3001\u79EF\u5206\u4E0E\u6392\u884C\u3002</div>' : ""}
        </section>
        <section class="panel">
          <div class="section-header"><div><h3>\u79EF\u5206\u603B\u89C8</h3><p>\u7814\u4E60\u70B9\u3001\u5DE5\u65F6\u70B9\u3001\u7BA1\u7406\u70B9\u4E0E\u7EFC\u5408\u8D21\u732E\u3002</p></div></div>
          <div class="metric-grid metric-grid-profile">
            ${renderMetricCard("\u7814\u4E60\u70B9", stats.study, "\u6280\u672F\u5B66\u4E60\u3001\u6587\u6863\u4E0E\u7814\u53D1\u6210\u957F")}
            ${renderMetricCard("\u5DE5\u65F6\u70B9", stats.labor, "\u6267\u884C\u52B3\u52A8\u3001\u8FD0\u7EF4\u4E0E\u8FD0\u8425\u6295\u5165")}
            ${renderMetricCard("\u7BA1\u7406\u70B9", stats.management, "\u8D1F\u8D23\u4EBA\u7EC4\u7EC7\u534F\u8C03\u4E0E\u9A8C\u6536\u8D21\u732E")}
            ${renderMetricCard("\u7EFC\u5408\u8D21\u732E", stats.composite, "\u4E09\u7C7B\u70B9\u6570\u4E4B\u548C")}
            ${renderMetricCard("\u672C\u6708\u5B8C\u6210", tasks.completed.length, "\u672C\u6708\u5DF2\u7ECF\u5B8C\u6210\u5E76\u7ED3\u7B97\u7684\u4EFB\u52A1")}
          </div>
        </section>
      </div>
      <div class="page-grid columns-2">
        <section class="panel">
          <div class="section-header"><div><h3>\u6210\u957F\u4E0E\u8BB0\u5F55</h3><p>\u664B\u5347\u3001\u8865\u507F\u70B9\u3001\u9000\u51FA\u4EFB\u52A1\u4E0E\u903E\u671F\u4EFB\u52A1\u4F1A\u7EDF\u4E00\u8FDB\u5165\u4E2A\u4EBA\u65F6\u95F4\u7EBF\u3002</p></div></div>
          <div class="timeline-grid">${history.length ? history.map((item) => renderTimelineCard(item.title, item.description)).join("") : renderEmpty("\u6682\u65E0\u6210\u957F\u8BB0\u5F55\u3002")}</div>
        </section>
        <section class="panel">
          <div class="section-header"><div><h3>\u5F53\u524D\u4EFB\u52A1\u5FEB\u7167</h3><p>\u5FEB\u901F\u67E5\u770B\u6B63\u5728\u8FDB\u884C\u548C\u6700\u8FD1\u5B8C\u6210\u7684\u4EFB\u52A1\u3002</p></div></div>
          <div class="task-stack">
            ${tasks.active.length ? tasks.active.slice(0, 3).map(({ task }) => renderTaskCard(task, { compact: true })).join("") : renderEmpty("\u6682\u65E0\u8FDB\u884C\u4E2D\u7684\u4EFB\u52A1\u3002")}
            ${tasks.completed.length ? tasks.completed.slice(0, 2).map(({ task }) => renderTaskCard(task, { compact: true })).join("") : ""}
          </div>
        </section>
      </div>
      <div class="button-row" style="margin-top:24px;justify-content:flex-start">
        <button class="button-danger" type="button" data-action="open-retire-self">\u7533\u8BF7\u9000\u5F79</button>
        <span class="helper-text">\u9000\u5F79\u540E\u8D26\u53F7\u53D8\u4E3A\u53EA\u8BFB\uFF0C\u4E0D\u518D\u53C2\u4E0E\u4EFB\u52A1\u3001\u79EF\u5206\u4E0E\u6392\u884C\uFF0C\u4F46\u5386\u53F2\u8BB0\u5F55\u4FDD\u7559\u3002</span>
      </div>
    </section>
  `;
}
function renderSettingsPage() {
  const settings = state.database.settings;
  return `
    <section>
      <div class="page-header"><div><h2>\u7CFB\u7EDF\u8BBE\u7F6E</h2><p>\u7BA1\u7406\u5458\u53EF\u7EF4\u62A4\u4EFB\u52A1\u7ED3\u7B97\u4E0E\u5BA1\u6838\u76F8\u5173\u89C4\u5219\uFF0C\u786E\u4FDD\u7AD9\u5185\u6D41\u7A0B\u4E0E\u5B9E\u9645\u5236\u5EA6\u4FDD\u6301\u4E00\u81F4\u3002</p></div></div>
      <form class="panel" data-form="settings">
        <div class="field-grid">
          <label class="field-group"><span class="field-label">\u4E2D\u9014\u52A0\u5165\u6298\u6263</span><input class="field-input" type="number" min="0" max="1" step="0.1" name="middleJoinDiscount" required value="${escapeAttribute(String(settings.middleJoinDiscount))}"></label>
          <label class="field-group"><span class="field-label">\u903E\u671F\u4EFB\u52A1\u79EF\u5206\u6298\u6263</span><input class="field-input" type="number" min="0" max="1" step="0.1" name="overduePointDiscount" required value="${escapeAttribute(String(settings.overduePointDiscount ?? 0.5))}"></label>
          <label class="field-group"><span class="field-label">\u70B9\u6570\u4FDD\u7559\u4F4D\u6570</span><input class="field-input" type="number" min="0" max="2" step="1" name="pointPrecision" required value="${escapeAttribute(String(settings.pointPrecision))}"></label>
        </div>
        <div class="field-grid">
          <label class="field-group"><span class="field-label">\u662F\u5426\u5BF9\u9AD8\u96BE\u4EFB\u52A1\u5F3A\u5236\u5BA1\u6279</span><select class="field-select" name="hardTaskNeedsApproval" required><option value="true" ${settings.hardTaskNeedsApproval ? "selected" : ""}>\u5F3A\u5236\u5BA1\u6279</option><option value="false" ${!settings.hardTaskNeedsApproval ? "selected" : ""}>\u53EF\u624B\u52A8\u5173\u95ED</option></select></label>
        </div>
        <div class="button-row"><button class="button-primary" type="submit" ${state.formLoading === "settings" ? "disabled" : ""}>\u4FDD\u5B58\u8BBE\u7F6E</button></div>
      </form>
      <div class="button-row"><button class="button-secondary" type="button" data-action="load-file-manager">\u6587\u4EF6\u7BA1\u7406</button></div>
    </section>
  `;
}

export {
  renderDashboardPage,
  renderMarketPage,
  renderMyTasksPage,
  renderTaskManagementPage,
  renderMembersPage,
  renderProjectsPage,
  renderRankingsPage,
  renderReviewsPage,
  renderProfilePage,
  renderSettingsPage
};
