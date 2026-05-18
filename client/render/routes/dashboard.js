export function render() {
  return renderDashboardPage();
}

import { state } from "../../core/state.js";
import { getCurrentUserTaskRecords, getDashboardFeaturedTasks, getDashboardStats, getDepartmentContribution, getLeaderboard, getMemberLoads } from "../../domain/query.js";
import { renderChartRow, renderExpandableCollection, renderLoadRow, renderMetricCard, renderPointPill, renderProjectCard, renderRankingRow, renderTaskCard } from "../components.js";

export function renderDashboardPage() {
  const stats = getDashboardStats();
  const featuredTasks = getDashboardFeaturedTasks().slice(0, 4);
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
          ${renderExpandableCollection(myTasks, ({ task }) => renderTaskCard(task, { compact: true }), {
            emptyText: "当前没有进行中的个人任务。",
            listClass: "task-stack",
            previewLimit: 3,
            itemUnit: "个",
            itemLabel: "任务",
          })}
        </section>
        <section class="panel">
          <div class="section-header"><div><h3>任务市场精选</h3><p>只展示当前仍需跟进的公开任务，已完成任务不会继续占用精选位。</p></div><button class="button-ghost" type="button" data-action="navigate" data-route="market">进入市场</button></div>
          ${renderExpandableCollection(featuredTasks, (task) => renderTaskCard(task, { showAction: true, compact: true }), {
            emptyText: "当前没有可展示任务。",
            listClass: "task-stack",
            previewLimit: 3,
            itemUnit: "个",
            itemLabel: "任务",
          })}
        </section>
        <section class="panel">
          <div class="section-header"><div><h3>积分排行</h3><p>综合贡献 Top 5。</p></div><button class="button-ghost" type="button" data-action="navigate" data-route="rankings">完整榜单</button></div>
          ${renderExpandableCollection(ranking, (entry, index) => renderRankingRow(entry, index + 1), {
            emptyText: "暂无排行数据。",
            listClass: "ranking-stack",
            previewLimit: 3,
            itemUnit: "名",
            itemLabel: "成员",
          })}
        </section>
      </div>
      <div class="page-grid columns-2">
        <section class="panel">
          <div class="section-header"><div><h3>成员负载</h3><p>帮助大家了解当前协作分布与任务压力。</p></div></div>
          ${renderExpandableCollection(loads, (entry) => renderLoadRow(entry), {
            emptyText: "当前没有负载数据。",
            listClass: "member-stack",
            previewLimit: 4,
            itemUnit: "名",
            itemLabel: "成员",
          })}
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
