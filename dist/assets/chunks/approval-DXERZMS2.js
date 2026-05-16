import {
  renderApprovalActionModal,
  renderPasswordChangeModal,
  renderPromotionDetailModal,
  renderRegistrationEditModal,
  renderRegistrationReviewModal,
  renderRoleChangeRequestModal,
  renderSensitiveActionModal
} from "./chunk-YEGQ2DVP.js";
import "./chunk-OTK46JVW.js";
import "./chunk-GTV4JDSP.js";
import "./chunk-URJPZTLH.js";
import "./chunk-SNLC6MV6.js";
import "./chunk-OANHKQRB.js";
import "./chunk-6CQGROI4.js";
import "./chunk-AFQ47FFH.js";
import "./chunk-DI5EFKKB.js";
import "./chunk-DNC4V4PA.js";
import "./chunk-IIX4FKHB.js";
import "./chunk-XS6Z5SGI.js";
import "./chunk-IKVMAO7C.js";
import "./chunk-NDL62ULM.js";
import "./chunk-UQLSNBUY.js";

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
