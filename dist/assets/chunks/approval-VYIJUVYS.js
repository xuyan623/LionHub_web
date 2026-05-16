import {
  renderApprovalActionModal,
  renderPasswordChangeModal,
  renderPromotionDetailModal,
  renderRegistrationEditModal,
  renderRegistrationReviewModal,
  renderRoleChangeRequestModal,
  renderSensitiveActionModal
} from "./chunk-J5POHC42.js";
import "./chunk-O4G3LWLC.js";
import "./chunk-YX5YTMZU.js";
import "./chunk-OANHKQRB.js";
import "./chunk-EY4W4HEE.js";
import "./chunk-GTV4JDSP.js";
import "./chunk-U4IZDVAT.js";
import "./chunk-UOGRBFTX.js";
import "./chunk-4ZHULIGH.js";
import "./chunk-RFGSPZ7J.js";
import "./chunk-UQLSNBUY.js";
import "./chunk-G7BQR5R5.js";
import "./chunk-AFQ47FFH.js";
import "./chunk-NDL62ULM.js";

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
