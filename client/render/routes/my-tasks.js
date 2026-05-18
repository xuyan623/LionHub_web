export function render() {
  return renderMyTasksPage();
}

import { formatDateTime, formatShortDate } from "../../core/format.js";
import { getCurrentUserTaskRecords } from "../../domain/query.js";
import { renderApprovalPreview, renderExpandableCollection, renderTaskCard, renderTimelineCard } from "../components.js";

export function renderMyTasksPage() {
  const buckets = getCurrentUserTaskRecords();
  return `
    <section>
      <div class="page-header"><div><h2>我的任务</h2><p>管理当前用户负责、参与、申请中、待提交、已完成与隐私记录中的任务。</p></div></div>
      <div class="page-grid columns-2">
        <section class="panel">
          <div class="section-header"><div><h3>我负责的任务</h3><p>负责推进与验收节奏的任务。</p></div></div>
          ${renderExpandableCollection(buckets.owned, ({ task }) => renderTaskCard(task, { compact: true }), {
            emptyText: "当前没有负责中的任务。",
            listClass: "task-stack",
            previewLimit: 4,
            itemUnit: "个",
            itemLabel: "任务",
          })}
        </section>
        <section class="panel">
          <div class="section-header"><div><h3>我参与的任务</h3><p>已加入并仍在参与中的任务。</p></div></div>
          ${renderExpandableCollection(buckets.active, ({ task }) => renderTaskCard(task, { compact: true }), {
            emptyText: "当前没有参与中的任务。",
            listClass: "task-stack",
            previewLimit: 4,
            itemUnit: "个",
            itemLabel: "任务",
          })}
        </section>
      </div>
      <div class="page-grid columns-2">
        <section class="panel">
          <div class="section-header"><div><h3>我申请中的任务</h3><p>等待组长或管理员审批的高难任务。</p></div></div>
          ${renderExpandableCollection(buckets.pendingJoin, (approval) => renderApprovalPreview(approval), {
            emptyText: "当前没有待审批的加入申请。",
            listClass: "task-stack",
            previewLimit: 4,
            itemUnit: "条",
            itemLabel: "申请",
          })}
        </section>
        <section class="panel">
          <div class="section-header"><div><h3>待我提交的任务</h3><p>已完成主要工作但还未提交成果的任务。</p></div></div>
          ${renderExpandableCollection(buckets.needsSubmit, ({ task }) => renderTaskCard(task, { compact: true }), {
            emptyText: "当前没有待提交成果的任务。",
            listClass: "task-stack",
            previewLimit: 4,
            itemUnit: "个",
            itemLabel: "任务",
          })}
        </section>
      </div>
      <div class="page-grid columns-2">
        <section class="panel">
          <div class="section-header"><div><h3>我已完成的任务</h3><p>已通过审核并完成结算。</p></div></div>
          ${renderExpandableCollection(buckets.completed, ({ task }) => renderTaskCard(task, { compact: true }), {
            emptyText: "当前没有已完成任务。",
            listClass: "task-stack",
            previewLimit: 4,
            itemUnit: "个",
            itemLabel: "任务",
          })}
        </section>
        <section class="panel">
          <div class="section-header"><div><h3>隐私记录</h3><p>退出任务与逾期任务仅本人及管理层可见。</p></div></div>
          ${renderExpandableCollection([
            ...buckets.exited.map(({ task, participant }) => ({ title: task.title, description: `已退出 · ${formatDateTime(participant.exitedAt)}` })),
            ...buckets.overdue.map(({ task }) => ({ title: task.title, description: `逾期任务 · 截止于 ${formatShortDate(task.dueAt)}` })),
          ], (item) => renderTimelineCard(item.title, item.description), {
            emptyText: "暂无退出或逾期记录。",
            listClass: "timeline-grid",
            previewLimit: 4,
            itemUnit: "条",
            itemLabel: "记录",
          })}
        </section>
      </div>
    </section>
  `;
}
