export function render() {
  return renderTaskManagementPage();
}

import { getVisibleTaskManagementTasks } from "../../domain/query.js";
import { renderTaskManageBody } from "../task-detail.js";

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

import { state } from "../../core/state.js";
