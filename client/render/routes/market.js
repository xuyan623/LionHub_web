export function render() {
  return renderMarketPage();
}

import { FILES_PER_PAGE, dictionaries, options, state } from "../../core/state.js";
import { getFilteredMarketTasks, isUrgentMarketTask } from "../../domain/query.js";
import { canInteractWithTasks } from "../../domain/permissions.js";
import { renderEmpty, renderFilterField, renderFilterSelect, renderPager, renderPointPill, renderTaskCard } from "../components.js";

export function renderMarketPage() {
  const tasks = getFilteredMarketTasks();
  const marketStatusLabels = { market_open: "未完成", ...dictionaries.taskStatuses };
  const currentPage = state.marketPage;
  const totalPages = Math.max(1, Math.ceil(tasks.length / FILES_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages - 1);
  if (safePage !== currentPage) {
    state.marketPage = safePage;
  }
  const pageTasks = tasks.slice(safePage * FILES_PER_PAGE, (safePage + 1) * FILES_PER_PAGE);
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
          <div class="board-results">
            <div><strong>当前显示 ${pageTasks.length} / ${tasks.length} 个任务</strong><span>默认隐藏已完成任务，优先展示当前可领取和可跟进的任务。</span></div>
            <div class="button-row"><button class="button-ghost" type="button" data-action="clear-filters" data-group="market">清空筛选</button></div>
          </div>
        </div>
        <div class="market-waterfall">
          ${pageTasks.length ? pageTasks.map((task) => renderTaskCard(task, { showAction: canInteractWithTasks(), compact: false, waterfall: true })).join("") : renderEmpty("没有匹配筛选条件的任务。")}
        </div>
        ${renderPager("market-page", safePage, tasks.length, FILES_PER_PAGE)}
      </div>
    </section>
  `;
}
