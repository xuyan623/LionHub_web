import {
  renderProgressNoteFormModal,
  renderShareTaskModal,
  renderTaskAttachmentFormModal,
  renderTaskCompletionModal,
  renderTaskDetailModal,
  renderTaskFormModal,
  renderTaskOwnerReassignModal
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
