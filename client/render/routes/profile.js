export function render() {
  return renderProfilePage();
}

import { dictionaries } from "../../core/state.js";
import { getCurrentMember, getCurrentUserTaskRecords, getMemberPointSummary, getMemberTimeline } from "../../domain/query.js";
import { canRequestRoleChange, getMemberPendingRoleChange } from "../../domain/permissions.js";
import { renderExpandableCollection, renderMetricCard, renderTaskCard, renderTimelineCard } from "../components.js";

export function renderProfilePage() {
  const member = getCurrentMember();
  const stats = getMemberPointSummary(member.id);
  const history = getMemberTimeline(member.id);
  const tasks = getCurrentUserTaskRecords();
  const pendingRoleChange = getMemberPendingRoleChange(member.id);
  const canOpenRoleChange = canRequestRoleChange(member);
  return `
    <section>
      <div class="page-header"><div><h2>个人中心</h2><p>查看个人档案、任务轨迹、积分构成、隐私记录与晋升路径。</p></div></div>
      <div class="page-grid columns-2">
        <section class="panel">
          <div class="section-header"><div><h3>基本信息</h3><p>身份、部门、方向、兵种、技能标签与个人简介。</p></div></div>
          <div class="definition-list">
            <div class="definition-row"><span>姓名</span><strong>${member.name}</strong></div>
            <div class="definition-row"><span>成员身份</span><strong>${dictionaries.identities[member.identity]}</strong></div>
            <div class="definition-row"><span>部门 / 方向</span><strong>${member.departments.join(" / ")} / ${member.directions.join(" / ") || "未设置"}</strong></div>
            <div class="definition-row"><span>兵种组</span><strong>${member.robotGroups.join(" / ") || "未设置"}</strong></div>
            <div class="definition-row"><span>技能标签</span><strong>${member.skillTags.join("、") || "暂无"}</strong></div>
            <div class="definition-row"><span>个人简介</span><strong>${member.bio || "未填写"}</strong></div>
          </div>
          <div class="button-row">
            <button class="button-secondary" type="button" data-action="open-profile-content">修改个性内容</button>
            ${pendingRoleChange ? `<button class="button-secondary" type="button" disabled>变岗审核中</button>` : canOpenRoleChange ? `<button class="button-secondary" type="button" data-action="open-role-change-request">申请变岗</button>` : ""}
            <button class="button-ghost" type="button" data-action="open-password-change">修改密码</button>
          </div>
          ${pendingRoleChange ? `<div class="helper-text">当前已提交变岗申请，目标身份为 ${dictionaries.identities[pendingRoleChange.requestedIdentity] || "未指定"}，请等待审核结果。</div>` : ""}
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
          ${renderExpandableCollection(history, (item) => renderTimelineCard(item.title, item.description), {
            emptyText: "暂无成长记录。",
            listClass: "timeline-grid",
            previewLimit: 4,
            itemUnit: "条",
            itemLabel: "记录",
          })}
        </section>
        <section class="panel">
          <div class="section-header"><div><h3>当前任务快照</h3><p>快速查看正在进行和最近完成的任务。</p></div></div>
          ${renderExpandableCollection([
            ...tasks.active.slice(0, 3).map(({ task }) => task),
            ...tasks.completed.slice(0, 2).map(({ task }) => task),
          ], (task) => renderTaskCard(task, { compact: true }), {
            emptyText: "暂无进行中的任务。",
            listClass: "task-stack",
            previewLimit: 3,
            itemUnit: "个",
            itemLabel: "任务",
          })}
        </section>
      </div>
      <div class="button-row" style="margin-top:24px;justify-content:flex-start">
        <button class="button-danger" type="button" data-action="open-retire-self">申请退役</button>
        <span class="helper-text">退役后账号变为只读，不再参与任务、积分与排行，但历史记录保留。</span>
      </div>
    </section>
  `;
}
