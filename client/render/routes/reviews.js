export function render() {
  return renderReviewsPage();
}

import { getApprovalGroups } from "../../domain/query.js";
import { renderReviewStack, renderReviewTabButton } from "../components.js";
import { state } from "../../core/state.js";

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
