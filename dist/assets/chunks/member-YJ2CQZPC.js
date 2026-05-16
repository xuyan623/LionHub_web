import {
  renderMemberDetailModal,
  renderMemberFormModal,
  renderProfileContentModal,
  renderRetireFormModal
} from "./chunk-YHSFSITU.js";
import "./chunk-OANHKQRB.js";
import "./chunk-NDS5IZL5.js";
import "./chunk-VXIKIDMW.js";
import "./chunk-UKTXZA3P.js";
import "./chunk-SXRKLTAB.js";
import "./chunk-UQLSNBUY.js";
import "./chunk-54LJH7SJ.js";
import "./chunk-5IOWRUG7.js";

// client/render/modal-groups/member.js
function render(modalType) {
  switch (modalType) {
    case "member-detail":
      return renderMemberDetailModal();
    case "member-form":
      return renderMemberFormModal();
    case "profile-content":
      return renderProfileContentModal();
    case "retire-form":
      return renderRetireFormModal();
    default:
      return "";
  }
}
export {
  render
};
