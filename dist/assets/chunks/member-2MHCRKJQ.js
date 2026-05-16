import {
  renderMemberDetailModal,
  renderMemberFormModal,
  renderProfileContentModal,
  renderRetireFormModal
} from "./chunk-NE6BVVLJ.js";
import "./chunk-FZEOHIDP.js";
import "./chunk-VDXRB7D4.js";
import "./chunk-OANHKQRB.js";
import "./chunk-FUTIGIGI.js";
import "./chunk-GTV4JDSP.js";
import "./chunk-PYCLTF52.js";
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
