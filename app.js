import { state, SESSION_KEY, savePersistentState } from "./client/core/state.js";
import { renderApp, pushFlash, renderNotifIcon, renderNotifPanel } from "./client/render/core.js";
import { pushModal, popModal, replaceModal, clearModalStack } from "./client/core/modal.js";
import { navigateTo, initialize, saveDatabase, saveSession, refreshDatabaseQuietly } from "./client/core/database.js";
import { saveDraft, loadDraft, clearDraft, serializeFormDraft, getDraftKey } from "./client/core/drafts.js";
import { requestJson, fetchUploadList } from "./client/core/http.js";
import { isFormField, clearFieldValidationState, validateRequiredFields } from "./client/core/validation.js";
import { getCurrentMember, getAttachmentsIndex } from "./client/domain/query.js";
import { canCreateTask, canReview, canRequestRoleChange, canDeleteAllGeneratedData, getLifecycleBlockingTasks } from "./client/domain/permissions.js";

import { handleLogin, handleRegister, handleRegistrationEdit, cancelPendingRegistration, handlePasswordChange } from "./client/domain/auth.js";
import { handleTaskForm, deleteTask, joinTask, exitTask, handleProgressForm, handleSubmissionForm, handleRatioForm, handleCompensationForm, handleCommentForm, handleProgressNoteForm, handleTaskAttachmentForm, deleteTaskComment, deleteTaskAttachment, deleteProgressNode, deleteProgressNodeAttachment, deletePointTransaction, handleTaskParticipantAdd, removeTaskParticipant, handleTaskOwnerReassignForm } from "./client/domain/task.js";
import { handleMemberForm, handleProfileContentForm, handleSettingsForm, handleSensitiveActionForm, handleRetireForm, exportMembersCsv, exportTasksCsv, exportRankingsCsv } from "./client/domain/member.js";
import { handleRegistrationReview, approveJoinRequest, rejectApproval, rejectRegistration, approveCompletion, approvePromotionRequest, returnCompletion, approveStatusChangeRequest, handleRoleChangeRequestForm, deleteApprovalRecord } from "./client/domain/approval.js";
import { markAllNotificationsRead } from "./client/domain/notifications.js";

// Debounce timer for filter inputs to prevent excessive re-renders
let filterDebounceTimer = null;
let ignoreNextDebouncedRender = false;

document.addEventListener("click", async (event) => {
  const actionTarget = event.target.closest("[data-action]");
  if (!actionTarget) return;

  const { action } = actionTarget.dataset;

  if (action === "toggle-nav") { state.mobileNavOpen = !state.mobileNavOpen; renderApp(); return; }

  if (action === "dismiss-flash") {
    state.flash = "";
    if (state.flashTimer) clearTimeout(state.flashTimer);
    state.flashTimer = null;
    const el = document.querySelector('.flash-toast');
    if (el) {
      el.classList.remove('is-visible');
      el.style.display = 'none';
    }
    return;
  }

  if (action === "close-overlay") {
    state.mobileNavOpen = false;
    popModal();
    return;
  }

  if (action === "switch-auth") { state.authMode = actionTarget.dataset.mode; state.authFeedback = ""; renderApp(); return; }
  if (action === "navigate") { navigateTo(actionTarget.dataset.route); return; }

  if (action === "logout") {
    state.authMode = "login";
    state.currentUserId = null;
    state.route = "dashboard";
    state.mobileNavOpen = false;
    localStorage.removeItem(SESSION_KEY);
    clearModalStack();
    return;
  }

  if (action === "open-registration-edit") { replaceModal({ type: "registration-edit" }); return; }
  if (action === "cancel-registration") { await cancelPendingRegistration(); return; }

  if (action === "open-retire-self") {
    const member = getCurrentMember();
    if (!member) return;
    if (member.hiddenFromDirectory) { pushFlash("系统隐藏管理员账号不允许执行该操作。", "info"); return; }
    if (member.memberStatus === "retired") { pushFlash("当前账号已经是退休状态。", "info"); return; }
    const blockers = getLifecycleBlockingTasks(member.id);
    if (blockers.length) {
      const taskList = blockers.map((task) => `《${task.title}》`).join("、");
      pushFlash(`当前仍有未完成的任务：${taskList}。请先完成或移交这些任务后再申请退役。`, "info");
      return;
    }
    replaceModal({ type: "retire-form" });
    return;
  }

  if (action === "open-force-retire-member") {
    pushModal({ type: "sensitive-action", actionKey: "force-retire-member", memberId: actionTarget.dataset.memberId });
    return;
  }

  if (action === "open-disable-member") {
    pushModal({ type: "sensitive-action", actionKey: "disable-member", memberId: actionTarget.dataset.memberId });
    return;
  }

  if (action === "open-restore-member") {
    pushModal({ type: "sensitive-action", actionKey: "restore-member", memberId: actionTarget.dataset.memberId });
    return;
  }

  if (action === "open-task") { replaceModal({ type: "task-detail", taskId: actionTarget.dataset.taskId }); return; }
  if (action === "open-member") { replaceModal({ type: "member-detail", memberId: actionTarget.dataset.memberId }); return; }
  if (action === "set-task-view") { state.taskManageView = actionTarget.dataset.view; savePersistentState(); renderApp(); return; }
  if (action === "set-ranking-tab") { state.rankingTab = actionTarget.dataset.tab; savePersistentState(); renderApp(); return; }
  if (action === "set-ranking-range") { state.rankingRange = actionTarget.dataset.range; savePersistentState(); renderApp(); return; }
  if (action === "set-review-tab") { state.reviewTab = actionTarget.dataset.tab; savePersistentState(); renderApp(); return; }
  if (action === "set-member-view") { state.memberView = actionTarget.dataset.view; savePersistentState(); renderApp(); return; }

  if (action === "open-create-task") {
    if (!canCreateTask()) { pushFlash("当前身份没有发布任务权限。", "info"); return; }
    replaceModal({ type: "task-form", taskId: null });
    return;
  }

  if (action === "open-edit-task") { pushModal({ type: "task-form", taskId: actionTarget.dataset.taskId }); return; }
  if (action === "open-share-task") { pushModal({ type: "share-task", taskId: actionTarget.dataset.taskId }); return; }
  if (action === "delete-task") { await deleteTask(actionTarget.dataset.taskId); return; }

  if (action === "open-owner-reassign") {
    pushModal({ type: "task-owner-reassign", taskId: actionTarget.dataset.taskId, nextOwnerId: actionTarget.dataset.memberId || "" });
    return;
  }

  if (action === "remove-task-participant") { await removeTaskParticipant(actionTarget.dataset.taskId, actionTarget.dataset.memberId); return; }

  if (action === "open-edit-member") {
    if (!canDeleteAllGeneratedData()) { pushFlash("只有管理员可以编辑成员资料。", "info"); return; }
    replaceModal({ type: "member-form", memberId: actionTarget.dataset.memberId });
    return;
  }

  if (action === "open-profile-content") { replaceModal({ type: "profile-content" }); return; }
  if (action === "open-promotion-request" || action === "open-role-change-request") {
    if (action === "open-role-change-request" && !canRequestRoleChange()) { pushFlash("您已有一个待审核的变岗申请，请等待审核完成后再提交。", "info"); return; }
    replaceModal({ type: "role-change-request" });
    return;
  }

  if (action === "open-promotion-detail") { replaceModal({ type: "promotion-detail", approvalId: actionTarget.dataset.approvalId }); return; }

  if (action === "open-registration-review") {
    if (!canReview()) { pushFlash("当前身份没有审核权限。", "info"); return; }
    replaceModal({ type: "registration-review", approvalId: actionTarget.dataset.approvalId });
    return;
  }

  if (action === "open-approval-action") { replaceModal({ type: "approval-action", approvalId: actionTarget.dataset.approvalId }); return; }
  if (action === "reject-approval") { await rejectApproval(actionTarget.dataset.approvalId, "申请未通过"); return; }
  if (action === "claim-task") { await joinTask(actionTarget.dataset.taskId); return; }
  if (action === "exit-task") { await exitTask(actionTarget.dataset.taskId); return; }
  if (action === "approve-join") { await approveJoinRequest(actionTarget.dataset.approvalId); return; }
  if (action === "reject-join") { await rejectApproval(actionTarget.dataset.approvalId, "加入申请未通过"); return; }
  if (action === "reject-registration") { await rejectRegistration(actionTarget.dataset.approvalId); return; }
  if (action === "approve-completion") { await approveCompletion(actionTarget.dataset.approvalId); return; }
  if (action === "approve-promotion") { await approvePromotionRequest(actionTarget.dataset.approvalId); return; }
  if (action === "approve-status-change") { await approveStatusChangeRequest(actionTarget.dataset.approvalId); return; }
  if (action === "reject-status-change") { await rejectApproval(actionTarget.dataset.approvalId, "变岗申请未通过"); return; }

  if (action === "load-file-manager") {
    state.settingsFilePage = 0;
    replaceModal({ type: "file-manager" });
    state.settingsFileLoading = true;
    renderApp();
    try {
      state.settingsFiles = await fetchUploadList();
      state.attachmentsIndex = getAttachmentsIndex();
    } catch {
      state.settingsFiles = [];
      pushFlash("文件列表加载失败。", "info");
    }
    state.settingsFileLoading = false;
    renderApp();
    return;
  }

  if (action === "settings-file-page") {
    const page = parseInt(actionTarget.dataset.page, 10);
    if (!isNaN(page) && page >= 0) { state.settingsFilePage = page; renderApp(); }
    return;
  }

  if (action === "delete-upload-file") {
    const storagePath = actionTarget.dataset.storagePath;
    const fileName = actionTarget.dataset.fileName || storagePath.split("/").pop();
    if (!window.confirm(`确认删除文件《${fileName}》？删除后不可恢复。`)) return;
    try {
      await requestJson("/api/uploads/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paths: [storagePath] }) });
    } catch { pushFlash("文件删除失败。", "info"); return; }
    state.settingsFiles = state.settingsFiles.filter((file) => file.path !== storagePath);
    state.database.tasks.forEach((task) => {
      task.attachments = (task.attachments || []).filter((attachment) => attachment.storagePath !== storagePath);
      (task.progressNodes || []).forEach((node) => {
        node.attachments = (node.attachments || []).filter((attachment) => attachment.storagePath !== storagePath);
      });
    });
    state.database.approvals.forEach((approval) => { approval.attachments = (approval.attachments || []).filter((attachment) => attachment.storagePath !== storagePath); });
    await saveDatabase();
    state.attachmentsIndex = getAttachmentsIndex();
    renderApp();
    return;
  }

  if (action === "return-completion") { await returnCompletion(actionTarget.dataset.approvalId); return; }
  if (action === "reject-promotion") { await rejectApproval(actionTarget.dataset.approvalId, "转正申请未通过"); return; }
  if (action === "delete-approval") { await deleteApprovalRecord(actionTarget.dataset.approvalId); return; }
  if (action === "delete-comment") { await deleteTaskComment(actionTarget.dataset.taskId, actionTarget.dataset.commentId); return; }
  if (action === "delete-attachment") { await deleteTaskAttachment(actionTarget.dataset.taskId, actionTarget.dataset.attachmentId); return; }
  if (action === "delete-progress-node") { await deleteProgressNode(actionTarget.dataset.taskId, actionTarget.dataset.nodeId); return; }
  if (action === "delete-progress-node-attachment") { await deleteProgressNodeAttachment(actionTarget.dataset.taskId, actionTarget.dataset.nodeId, actionTarget.dataset.attachmentId); return; }
  if (action === "delete-point-transaction") { await deletePointTransaction(actionTarget.dataset.pointId); return; }
  if (action === "open-progress-note") { pushModal({ type: "progress-note-form", taskId: actionTarget.dataset.taskId }); return; }
  if (action === "open-task-attachment") { pushModal({ type: "task-attachment-form", taskId: actionTarget.dataset.taskId }); return; }
  if (action === "open-password-change") {
    replaceModal({ type: "password-change" });
    return;
  }
  if (action === "table-sort") {
    const column = actionTarget.dataset.column;
    if (state.tableSort.column === column) {
      state.tableSort.direction = state.tableSort.direction === "asc" ? "desc" : "asc";
    } else {
      state.tableSort.column = column;
      state.tableSort.direction = "asc";
    }
    renderApp();
    return;
  }
  if (action === "clone-task") {
    const taskId = actionTarget.dataset.taskId;
    replaceModal({ type: "task-form", taskId: null, cloneFromTaskId: taskId });
    return;
  }
  if (action === "export-members-csv") { await exportMembersCsv(); return; }
  if (action === "export-tasks-csv") { await exportTasksCsv(); return; }
  if (action === "export-rankings-csv") { await exportRankingsCsv(); return; }
  if (action === "toggle-notif-panel") {
    if (state.notifPanelOpen) {
      state.notifPanelOpen = false;
      markAllNotificationsRead();
      const bell = actionTarget.closest(".notif-bell");
      if (bell) {
        const existingPanel = bell.querySelector(".notif-panel");
        if (existingPanel) existingPanel.remove();
        const bellBtn = bell.querySelector('button[data-action="toggle-notif-panel"]');
        if (bellBtn) bellBtn.innerHTML = renderNotifIcon();
      }
      void saveDatabase();
    } else {
      state.notifPanelOpen = true;
      const bell = actionTarget.closest(".notif-bell");
      if (bell) {
        const existingPanel = bell.querySelector(".notif-panel");
        if (!existingPanel) bell.insertAdjacentHTML("beforeend", renderNotifPanel());
      }
    }
    return;
  }
});

document.addEventListener("submit", async (event) => {
  const form = event.target;
  if (!(form instanceof HTMLFormElement)) return;
  event.preventDefault();
  if (!validateRequiredFields(form)) return;

  const formKey = form.dataset.form;
  state.formLoading = formKey;
  renderApp();

  try {
    switch (formKey) {
    case "login": await handleLogin(form); break;
    case "password-change": await handlePasswordChange(form); break;
    case "register": await handleRegister(form); break;
    case "registration-edit": await handleRegistrationEdit(form); break;
    case "sensitive-action": await handleSensitiveActionForm(form); break;
    case "task-form": await handleTaskForm(form); break;
    case "task-participant-add": await handleTaskParticipantAdd(form); break;
    case "task-owner-reassign": await handleTaskOwnerReassignForm(form); break;
    case "member-form": await handleMemberForm(form); break;
    case "profile-content": await handleProfileContentForm(form); break;
    case "promotion-request": case "role-change-request": await handleRoleChangeRequestForm(form); break;
    case "registration-review": await handleRegistrationReview(form); break;
    case "task-progress": await handleProgressForm(form); break;
    case "task-comment": await handleCommentForm(form); break;
    case "task-submit": await handleSubmissionForm(form); break;
    case "progress-note-form": await handleProgressNoteForm(form); break;
    case "task-attachment-form": await handleTaskAttachmentForm(form); break;
    case "task-ratios": await handleRatioForm(form); break;
    case "task-compensation": await handleCompensationForm(form); break;
    case "settings": await handleSettingsForm(form); break;
    case "retire-form": await handleRetireForm(form); break;
    default: break;
  }
    const draftKey = form.dataset.draftKey;
    if (draftKey) clearDraft(draftKey);
  } catch (err) {
    console.error("Form submission error:", err);
    pushFlash("操作失败，请重试。", "error");
  } finally {
    state.formLoading = null;
    renderApp();
  }
});

document.addEventListener("input", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  if (isFormField(target)) clearFieldValidationState(target);
  if (target.dataset.globalSearch !== undefined) { state.globalSearch = target.value; renderApp(); return; }
  if (target.dataset.participantSearch !== undefined) {
    const taskId = target.dataset.participantSearch;
    const q = target.value.toLowerCase();
    const sel = document.querySelector(`[data-participant-select="${CSS.escape(taskId)}"]`);
    if (sel) {
      Array.from(sel.options).forEach((o) => {
        o.style.display = o.text.toLowerCase().includes(q) ? "" : "none";
      });
    }
    return;
  }
  const draftForm = target.closest("form[data-draft-key]");
  if (draftForm && isFormField(target)) {
    const draftKey = draftForm.dataset.draftKey;
    if (draftKey) {
      const data = serializeFormDraft(draftForm);
      saveDraft(draftKey, data);
    }
  }
  if (target.dataset.filterGroup && target.dataset.filterKey) {
    const group = target.dataset.filterGroup;
    const key = target.dataset.filterKey;
    const source = group === "member" ? state.memberFilters : group === "files" ? state.fileFilters : state.marketFilters;
    source[key] = target.value;

    if (filterDebounceTimer !== null) {
      clearTimeout(filterDebounceTimer);
    }
    filterDebounceTimer = setTimeout(() => {
      if (state.formLoading) return;
      const group = target.dataset.filterGroup;
      const key = target.dataset.filterKey;
      const selStart = target instanceof HTMLInputElement ? target.selectionStart : null;
      const selEnd = target instanceof HTMLInputElement ? target.selectionEnd : null;
      renderApp();
      savePersistentState();
      if (group && key) {
        const restored = document.querySelector(`[data-filter-group="${group}"][data-filter-key="${key}"]`);
        if (restored instanceof HTMLInputElement) {
          restored.focus();
          if (selStart !== null) restored.setSelectionRange(selStart, selEnd ?? selStart);
        }
      }
    }, 150);
  }
});

document.addEventListener("change", (event) => {
  const target = event.target;
  if (!isFormField(target)) return;
  clearFieldValidationState(target);
});

document.addEventListener("dragenter", (event) => {
  const input = event.target.closest(".field-file-input");
  if (input) { input.classList.add("is-dragover"); event.preventDefault(); }
});
document.addEventListener("dragover", (event) => {
  const input = event.target.closest(".field-file-input");
  if (input) { input.classList.add("is-dragover"); event.preventDefault(); }
});
document.addEventListener("dragleave", (event) => {
  const input = event.target.closest(".field-file-input");
  if (input) { input.classList.remove("is-dragover"); }
});
document.addEventListener("drop", (event) => {
  const input = event.target.closest(".field-file-input");
  if (!(input instanceof HTMLInputElement)) return;
  event.preventDefault();
  input.classList.remove("is-dragover");
  if (event.dataTransfer?.files?.length) {
    input.files = event.dataTransfer.files;
    const warn = input.nextElementSibling;
    if (warn) warn.textContent = input.files.length > 5 ? "单次最多上传 5 个文件。" : "";
  }
});

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) void refreshDatabaseQuietly();
});

// Router popstate and hash changes are handled by client/core/router.js

document.addEventListener("keydown", (event) => {
  const tag = event.target?.tagName;
  const editing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
  if (event.key === "Escape") {
    if (state.notifPanelOpen) {
      state.notifPanelOpen = false;
      markAllNotificationsRead();
      const panel = document.querySelector(".notif-panel");
      if (panel) panel.remove();
      return;
    }
    if (state.modal) {
      popModal();
    }
    return;
  }
  if (event.ctrlKey || event.metaKey || event.altKey || editing) return;
  if (event.key === "n" || event.key === "N") {
    event.preventDefault();
    const btn = document.querySelector('[data-action="open-create-task"]');
    if (btn) { btn.click(); }
    return;
  }
  if (event.key === "/") {
    event.preventDefault();
    const searchInput = document.querySelector('.search-shell input');
    if (searchInput) { searchInput.focus(); }
    return;
  }
  if (event.key === "?" && !state.modal) {
    event.preventDefault();
    if (!window.confirm([
      "键盘快捷键：",
      "",
      "  N  — 新建任务",
      "  /  — 聚焦搜索",
      "  Esc — 关闭弹窗/通知面板",
      "  ?  — 显示此帮助",
      "",
      "此提示只会在按 ? 时显示。",
    ].join("\n"))) return;
  }
});

// Initialize the application
initialize().then(() => {
  renderApp();
}).catch(err => {
  console.error("Failed to initialize application:", err);
  state.initError = "应用初始化失败，请刷新页面重试。";
  renderApp();
});
