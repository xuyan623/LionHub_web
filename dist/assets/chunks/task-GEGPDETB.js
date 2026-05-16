import {
  renderProgressNoteFormModal,
  renderShareTaskModal,
  renderTaskAttachmentFormModal,
  renderTaskCompletionModal,
  renderTaskDetailModal,
  renderTaskFormModal,
  renderTaskOwnerReassignModal
} from "./chunk-YHSFSITU.js";
import "./chunk-OANHKQRB.js";
import "./chunk-NDS5IZL5.js";
import "./chunk-VXIKIDMW.js";
import "./chunk-UKTXZA3P.js";
import "./chunk-SXRKLTAB.js";
import "./chunk-UQLSNBUY.js";
import "./chunk-54LJH7SJ.js";
import "./chunk-5IOWRUG7.js";

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
