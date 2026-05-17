import { state, FILES_PER_PAGE } from "../../core/state.js";
import { escapeAttribute, escapeHtml } from "../../core/security.js";
import { formatDateTime } from "../../core/format.js";
import { renderEmpty, renderFilterField, renderFilterSelect } from "../components.js";

export function render(modalType) {
  if (modalType === "file-manager") {
    return renderFileManagerModal();
  }
  return "";
}

export function renderFileManagerModal() {
  const files = state.settingsFiles;
  const fileIndex = state.attachmentsIndex || {};
  return `
    <div class="modal">
      <div class="modal-card modal-card-completion glass-card">
        <div class="section-header">
          <div><h3>文件管理</h3><p>${files ? `共 ${files.length} 个上传文件` : "加载后即可查看和管理所有共享附件。"}</p></div>
          <button class="button-ghost" type="button" data-action="close-overlay">关闭</button>
        </div>
        ${!files ? `
          <div class="button-row"><button class="button-primary" type="button" data-action="load-file-manager">加载文件列表</button></div>
        ` : state.settingsFileLoading ? '<div class="helper-text">加载中...</div>' : files.length === 0 ? renderEmpty("当前没有上传文件。") : (() => {
          const q = (state.fileFilters.query || "").toLowerCase();
          const sourceFilter = state.fileFilters.source || "all";
          const filtered = files.filter((file) => {
            const ref = fileIndex[file.path];
            const nameMatch = (ref?.name || file.name).toLowerCase().includes(q);
            const uploaderMatch = (ref?.uploadedByName || "").toLowerCase().includes(q);
            const titleMatch = (ref?.title || "").toLowerCase().includes(q);
            if (q && !nameMatch && !uploaderMatch && !titleMatch) return false;
            if (sourceFilter !== "all") {
              if (sourceFilter === "orphan" && ref) return false;
              if (sourceFilter !== "orphan" && (!ref || ref.source !== sourceFilter)) return false;
            }
            return true;
          }).sort((a, b) => {
            const ta = (fileIndex[a.path]?.uploadedAt || a.modifiedAt || "");
            const tb = (fileIndex[b.path]?.uploadedAt || b.modifiedAt || "");
            return tb.localeCompare(ta);
          });
          if (state.settingsFilePage > 0 && filtered.length <= state.settingsFilePage * FILES_PER_PAGE) state.settingsFilePage = 0;
          const page = state.settingsFilePage;
          const totalPages = Math.max(1, Math.ceil(filtered.length / FILES_PER_PAGE));
          const pageFiles = filtered.slice(page * FILES_PER_PAGE, (page + 1) * FILES_PER_PAGE);
          return `
            <div class="toolbar-row">
              ${renderFilterField("搜索文件", "files", "query", state.fileFilters.query, "text", "搜索文件名、任务、上传者")}
              ${renderFilterSelect("来源", "files", "source", state.fileFilters.source, ["submission", "progress", "progress_note", "task_attachment", "promotion", "orphan"], { submission: "成果提交", progress: "进度更新", progress_note: "进度说明", task_attachment: "任务资料", promotion: "变岗申请", orphan: "孤立文件" })}
              <button class="button-ghost" type="button" data-action="clear-filters" data-group="files">清空筛选</button>
            </div>
            <div class="task-stack">
              ${pageFiles.length ? pageFiles.map((file) => {
                const ref = fileIndex[file.path];
                const originalName = ref?.name || file.name;
                const fileSizeLabel = file.size > 1048576 ? `${(file.size / 1048576).toFixed(1)} MB` : file.size > 1024 ? `${(file.size / 1024).toFixed(1)} KB` : `${file.size} B`;
                const timeLabel = formatDateTime(ref?.uploadedAt || file.modifiedAt);
                const downloadUrl = `/uploads/${encodeURI(file.path)}?downloadName=${encodeURIComponent(originalName)}`;
                return `
                  <div class="comment-card">
                    <strong><a class="attachment-link" href="${escapeAttribute(downloadUrl)}" target="_blank" rel="noreferrer" download="${escapeAttribute(originalName)}">${escapeHtml(originalName)}</a></strong>
                    <div class="helper-text">${timeLabel} · ${fileSizeLabel} · ${ref ? `${escapeHtml(ref.title)}${ref.uploadedByName ? ` · ${escapeHtml(ref.uploadedByName)}` : ""}` : "孤立文件"}</div>
                    <div class="button-row"><button class="button-danger" type="button" data-action="delete-upload-file" data-storage-path="${escapeAttribute(file.path)}" data-file-name="${escapeAttribute(originalName)}">删除</button></div>
                  </div>
                `;
              }).join("") : renderEmpty("没有匹配筛选条件的文件。")}
            </div>
            ${totalPages > 1 ? `
              <div class="pager">
                <button class="button-secondary" type="button" data-action="settings-file-page" data-page="${page - 1}" ${page === 0 ? "disabled" : ""}>上一页</button>
                <span class="helper-text">第 ${page + 1} / ${totalPages} 页</span>
                <button class="button-secondary" type="button" data-action="settings-file-page" data-page="${page + 1}" ${page + 1 >= totalPages ? "disabled" : ""}>下一页</button>
              </div>` : ""}`;
        })()}
      </div>
    </div>
  `;
}
