import {
  renderMemberDetailModal,
  renderMemberFormModal,
  renderProfileContentModal,
  renderRetireFormModal
} from "./chunk-2OINSEP5.js";
import "./chunk-LTIDHJS7.js";
import "./chunk-OZYI6NAT.js";
import "./chunk-OANHKQRB.js";
import "./chunk-4JSWFH7K.js";
import "./chunk-GTV4JDSP.js";
import "./chunk-NCJITHBH.js";
import "./chunk-UOGRBFTX.js";
import "./chunk-4ZHULIGH.js";
import "./chunk-RFGSPZ7J.js";
import "./chunk-UQLSNBUY.js";
import "./chunk-G7BQR5R5.js";
import "./chunk-AFQ47FFH.js";
import "./chunk-NDL62ULM.js";

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
