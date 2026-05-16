import { renderFileManagerModal } from "../modals.js";

export function render(modalType) {
  if (modalType === "file-manager") {
    return renderFileManagerModal();
  }
  return "";
}
