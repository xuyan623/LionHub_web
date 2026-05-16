import {
  renderProgressNoteFormModal,
  renderShareTaskModal,
  renderTaskAttachmentFormModal,
  renderTaskCompletionModal,
  renderTaskDetailModal,
  renderTaskFormModal,
  renderTaskOwnerReassignModal
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
