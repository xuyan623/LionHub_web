import {
  renderProgressNoteFormModal,
  renderShareTaskModal,
  renderTaskAttachmentFormModal,
  renderTaskCompletionModal,
  renderTaskDetailModal,
  renderTaskFormModal,
  renderTaskOwnerReassignModal
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

// client/render/modal-groups/task.js
function render(modalType) {
  switch (modalType) {
    case "progress-note-form":
      return renderProgressNoteFormModal();
    case "share-task":
      return renderShareTaskModal();
    case "task-attachment-form":
      return renderTaskAttachmentFormModal();
    case "task-completion":
      return renderTaskCompletionModal();
    case "task-detail":
      return renderTaskDetailModal();
    case "task-form":
      return renderTaskFormModal();
    case "task-owner-reassign":
      return renderTaskOwnerReassignModal();
    default:
      return "";
  }
}
export {
  render
};
