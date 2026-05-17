import {
  renderApprovalActionModal,
  renderPasswordChangeModal,
  renderPromotionDetailModal,
  renderRegistrationEditModal,
  renderRegistrationReviewModal,
  renderRoleChangeRequestModal,
  renderSensitiveActionModal
} from "./chunk-EBUFRF2N.js";
import "./chunk-OANHKQRB.js";
import "./chunk-XFQSWTBI.js";
import "./chunk-VXIKIDMW.js";
import "./chunk-UKTXZA3P.js";
import "./chunk-SXRKLTAB.js";
import "./chunk-UQLSNBUY.js";
import "./chunk-GV2AYCPY.js";
import "./chunk-5IOWRUG7.js";

// client/render/modal-groups/approval.js
function render(modalType) {
  switch (modalType) {
    case "approval-action":
      return renderApprovalActionModal();
    case "password-change":
      return renderPasswordChangeModal();
    case "promotion-detail":
      return renderPromotionDetailModal();
    case "registration-edit":
      return renderRegistrationEditModal();
    case "registration-review":
      return renderRegistrationReviewModal();
    case "promotion-request":
    case "role-change-request":
      return renderRoleChangeRequestModal();
    case "sensitive-action":
      return renderSensitiveActionModal();
    default:
      return "";
  }
}
export {
  render
};
