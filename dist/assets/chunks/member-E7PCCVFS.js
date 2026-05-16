import {
  renderMemberDetailModal,
  renderMemberFormModal,
  renderProfileContentModal,
  renderRetireFormModal
} from "./chunk-VZWRNJ47.js";
import "./chunk-EW2IGVH4.js";
import "./chunk-5JYJCFR5.js";
import "./chunk-OANHKQRB.js";
import "./chunk-UT45P3WN.js";
import "./chunk-GTV4JDSP.js";
import "./chunk-LMST3HJK.js";
import "./chunk-UOGRBFTX.js";
import "./chunk-4ZHULIGH.js";
import "./chunk-RFGSPZ7J.js";
import "./chunk-UQLSNBUY.js";
import "./chunk-URWQRSRF.js";
import "./chunk-PIQJ4EHT.js";
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
