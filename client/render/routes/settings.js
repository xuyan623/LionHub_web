export function render() {
  return renderSettingsPage();
}

import { state } from "../../core/state.js";
import { escapeAttribute } from "../../core/security.js";

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
        <div class="button-row"><button class="button-primary" type="submit" ${state.formLoading === "settings" ? "disabled" : ""}>保存设置</button></div>
      </form>
      <div class="button-row"><button class="button-secondary" type="button" data-action="load-file-manager">文件管理</button></div>
    </section>
  `;
}
