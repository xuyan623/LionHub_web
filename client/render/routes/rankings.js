export function render() {
  return renderRankingsPage();
}

import { FILES_PER_PAGE, state } from "../../core/state.js";
import { getDepartmentContribution, getLeaderboard, getMemberPointSummary, getRobotContribution } from "../../domain/query.js";
import { renderChartRow, renderEmpty, renderMetricCard, renderPager, renderRankingCard } from "../components.js";

export function renderRankingsPage() {
  const leaderboard = getLeaderboard(state.rankingTab, state.rankingRange);
  const departmentBoard = getDepartmentContribution();
  const robotBoard = getRobotContribution();
  const currentPage = state.rankingPage;
  const totalPages = Math.max(1, Math.ceil(leaderboard.length / FILES_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages - 1);
  if (safePage !== currentPage) {
    state.rankingPage = safePage;
  }
  const visibleLeaderboard = leaderboard.slice(safePage * FILES_PER_PAGE, (safePage + 1) * FILES_PER_PAGE);
  const leadingEntry = leaderboard[0];
  const leadingStats = leadingEntry ? getMemberPointSummary(leadingEntry.member.id, state.rankingRange === "month") : null;
  return `
    <section>
      <div class="page-header"><div><h2>积分排行</h2><p>支持研习点、工时点、管理点、综合贡献、部门贡献与兵种贡献的多维榜单。</p></div><button class="button-ghost" type="button" data-action="export-rankings-csv">导出 CSV</button></div>
      <div class="toolbar-row">
        ${[["study", "研习点榜"], ["labor", "工时点榜"], ["management", "管理点榜"], ["composite", "综合贡献榜"]].map(([tab, label]) => `<button class="button-secondary ${state.rankingTab === tab ? "is-active" : ""}" type="button" data-action="set-ranking-tab" data-tab="${tab}">${label}</button>`).join("")}
        <button class="button-ghost ${state.rankingRange === "month" ? "is-active" : ""}" type="button" data-action="set-ranking-range" data-range="month">月度榜</button>
        <button class="button-ghost ${state.rankingRange === "total" ? "is-active" : ""}" type="button" data-action="set-ranking-range" data-range="total">总榜</button>
      </div>
      ${leadingEntry && leadingStats ? `
        <div class="metric-grid metric-grid-profile ranking-hero">
          ${renderMetricCard("当前榜首", leadingEntry.member.name, state.rankingRange === "month" ? "本月综合贡献领先" : "总榜综合贡献领先")}
          ${renderMetricCard("综合贡献", leadingStats.composite, "按当前榜单范围统计")}
          ${renderMetricCard("研习点", leadingStats.study, "技术成长与研发投入")}
          ${renderMetricCard("工时点", leadingStats.labor, "执行劳动与协作投入")}
        </div>
      ` : ""}
      <div class="page-grid columns-2">
        <section class="panel">
          <div class="section-header"><div><h3>${state.rankingRange === "month" ? "月度榜单" : "总榜榜单"}</h3><p>按当前选中的积分维度排序，分页展示避免单次渲染过长。</p></div></div>
          <div class="task-stack">${visibleLeaderboard.length ? visibleLeaderboard.map((entry, index) => renderRankingCard(entry, safePage * FILES_PER_PAGE + index + 1, state.rankingTab)).join("") : renderEmpty("暂无排行数据。")}</div>
          ${renderPager("ranking-page", safePage, leaderboard.length, FILES_PER_PAGE)}
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
