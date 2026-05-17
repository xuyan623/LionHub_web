export function render() {
  return renderMembersPage();
}

import { FILES_PER_PAGE, options, state } from "../../core/state.js";
import { getFilteredMembers, getMemberLoads } from "../../domain/query.js";
import { isMemberIncludedInWorkspaceStats } from "../../domain/permissions.js";
import { renderEmpty, renderFilterField, renderFilterSelect, renderMemberCard, renderMemberTable, renderPager, renderPointPill } from "../components.js";

export function renderMembersPage() {
  const members = getFilteredMembers();
  const activeMembers = state.database.members.filter((member) => isMemberIncludedInWorkspaceStats(member));
  const leaderCount = activeMembers.filter((member) => ["admin", "leader"].includes(member.role)).length;
  const overloadedCount = getMemberLoads().filter((entry) => entry.loadLevel === "overload").length;
  const currentPage = state.memberPage;
  const totalPages = Math.max(1, Math.ceil(members.length / FILES_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages - 1);
  if (safePage !== currentPage) {
    state.memberPage = safePage;
  }
  const pageMembers = members.slice(safePage * FILES_PER_PAGE, (safePage + 1) * FILES_PER_PAGE);
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
          </div>
          <div class="field-grid">
            ${renderFilterSelect("部门", "member", "department", state.memberFilters.department, options.departments)}
            ${renderFilterSelect("兵种", "member", "robotGroup", state.memberFilters.robotGroup, options.robotGroups)}
          </div>
          <div class="board-results">
            <div><strong>当前显示 ${pageMembers.length} / ${members.length} 名成员</strong><span>只展示可见成员，已自动隐藏系统管理员和停用的目录成员。</span></div>
            <div class="button-row"><button class="button-ghost" type="button" data-action="clear-filters" data-group="member">清空筛选</button></div>
          </div>
        </div>
        <div class="toolbar-row"><button class="button-ghost" type="button" data-action="export-members-csv">导出 CSV</button><button class="button-secondary ${state.memberView === "cards" ? "is-active" : ""}" type="button" data-action="set-member-view" data-view="cards">卡片</button><button class="button-secondary ${state.memberView === "table" ? "is-active" : ""}" type="button" data-action="set-member-view" data-view="table">表格</button></div>
        ${state.memberView === "table" ? renderMemberTable(pageMembers) : `<div class="member-waterfall">${pageMembers.length ? pageMembers.map((member) => renderMemberCard(member, { waterfall: true })).join("") : renderEmpty("没有匹配筛选条件的成员。")}</div>`}
        ${renderPager("member-page", safePage, members.length, FILES_PER_PAGE)}
      </div>
    </section>
  `;
}
