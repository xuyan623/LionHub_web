import { state, savePersistentState, createDefaultMarketFilters, createDefaultMemberFilters, createDefaultFileFilters } from "../client/core/state.js";
import { renderApp } from "../client/render/core.js";
import { pushFlash } from "../client/core/services.js";
import { pushModal, popModal, replaceModal, clearModalStack } from "../client/core/modal.js";
import { navigateTo, refreshDatabaseQuietly, saveDatabase } from "../client/core/database.js";
import { bootstrapApp, ensureDatabaseReady, loadModalChunk, loadRouteChunk } from "../client/core/bootstrap.js";
import { saveDraft, clearDraft, serializeFormDraft } from "../client/core/drafts.js";
import { requestJson, fetchUploadList } from "../client/core/http.js";
import { isFormField, clearFieldValidationState, validateRequiredFields } from "../client/core/validation.js";
import { clearSession } from "../client/core/session.js";

let filterDebounceTimer = null;

const moduleLoaders = {
  approval: createModuleLoader(() => import("../client/domain/approval.js")),
  auth: createModuleLoader(() => import("../client/domain/auth.js")),
  member: createModuleLoader(() => import("../client/domain/member.js")),
  notifications: createModuleLoader(() => import("../client/domain/notifications.js")),
  permissions: createModuleLoader(() => import("../client/domain/permissions.js")),
  query: createModuleLoader(() => import("../client/domain/query.js")),
  task: createModuleLoader(() => import("../client/domain/task.js")),
};

function createModuleLoader(factory) {
  let promise = null;
  return () => {
    if (!promise) {
      promise = factory();
    }
    return promise;
  };
}

function openModal(type, payload = {}, mode = "replace") {
  const modal = { type, ...payload };
  if (mode === "push") {
    pushModal(modal);
  } else {
    replaceModal(modal);
  }
  void loadModalChunk(type);
}

let notificationPersistPromise = null;

function persistNotificationReadState() {
  if (notificationPersistPromise) {
    return notificationPersistPromise;
  }
  notificationPersistPromise = saveDatabase()
    .catch((error) => {
      console.error("Failed to persist notification read state:", error);
    })
    .finally(() => {
      notificationPersistPromise = null;
    });
  return notificationPersistPromise;
}

document.addEventListener("click", async (event) => {
  const actionTarget = event.target.closest("[data-action]");
  if (!actionTarget) return;

  const { action } = actionTarget.dataset;

  if (action === "toggle-nav") {
    state.mobileNavOpen = !state.mobileNavOpen;
    renderApp();
    return;
  }

  if (action === "toggle-text-expand") {
    const wrap = actionTarget.closest(".expandable-text-wrap");
    if (!wrap) return;
    const clamp = wrap.querySelector(".expandable-text-clamp");
    const full = wrap.querySelector(".expandable-text-full");
    if (!clamp || !full) return;
    const isExpanded = full.style.display !== "none";
    clamp.style.display = isExpanded ? "block" : "none";
    full.style.display = isExpanded ? "none" : "block";
    return;
  }

  if (action === "dismiss-flash") {
    state.flash = "";
    if (state.flashTimer) clearTimeout(state.flashTimer);
    state.flashTimer = null;
    const element = document.querySelector(".flash-toast");
    if (element) {
      element.classList.remove("is-visible");
      element.style.display = "none";
    }
    return;
  }

  if (action === "close-overlay") {
    state.mobileNavOpen = false;
    popModal();
    return;
  }

  if (action === "switch-auth") {
    state.authMode = actionTarget.dataset.mode;
    state.authFeedback = "";
    savePersistentState();
    renderApp();
    return;
  }

  if (action === "navigate") {
    const route = actionTarget.dataset.route;
    navigateTo(route);
    void loadRouteChunk(route);
    return;
  }

  if (action === "logout") {
    state.authMode = "login";
    state.currentUserId = null;
    state.route = "dashboard";
    state.mobileNavOpen = false;
    clearSession();
    clearModalStack();
    return;
  }

  if (action === "toggle-notif-panel") {
    const notifications = await moduleLoaders.notifications();
    state.notifPanelOpen = !state.notifPanelOpen;
    if (!state.notifPanelOpen) {
      notifications.markAllNotificationsRead();
      renderApp();
      void persistNotificationReadState();
      return;
    }
    renderApp();
    return;
  }

  await ensureDatabaseReady();

  const [permissions, query] = await Promise.all([
    moduleLoaders.permissions(),
    moduleLoaders.query(),
  ]);

  if (action === "open-registration-edit") {
    openModal("registration-edit");
    return;
  }

  if (action === "cancel-registration") {
    const auth = await moduleLoaders.auth();
    await auth.cancelPendingRegistration();
    return;
  }

  if (action === "open-retire-self") {
    const member = query.getCurrentMember();
    if (!member) return;
    if (member.hiddenFromDirectory) {
      pushFlash("系统隐藏管理员账号不允许执行该操作。", "info");
      return;
    }
    if (member.memberStatus === "retired") {
      pushFlash("当前账号已经是退休状态。", "info");
      return;
    }
    const blockers = permissions.getLifecycleBlockingTasks(member.id);
    if (blockers.length) {
      const taskList = blockers.map((task) => `《${task.title}》`).join("、");
      pushFlash(`当前仍有未完成的任务：${taskList}。请先完成或移交这些任务后再申请退役。`, "info");
      return;
    }
    openModal("retire-form");
    return;
  }

  if (action === "open-force-retire-member") {
    pushModal({ type: "sensitive-action", actionKey: "force-retire-member", memberId: actionTarget.dataset.memberId });
    void loadModalChunk("sensitive-action");
    return;
  }

  if (action === "open-disable-member") {
    pushModal({ type: "sensitive-action", actionKey: "disable-member", memberId: actionTarget.dataset.memberId });
    void loadModalChunk("sensitive-action");
    return;
  }

  if (action === "open-restore-member") {
    pushModal({ type: "sensitive-action", actionKey: "restore-member", memberId: actionTarget.dataset.memberId });
    void loadModalChunk("sensitive-action");
    return;
  }

  if (action === "open-task") {
    openModal("task-detail", { taskId: actionTarget.dataset.taskId });
    return;
  }

  if (action === "open-member") {
    openModal("member-detail", { memberId: actionTarget.dataset.memberId });
    return;
  }

  if (action === "set-task-view") {
    state.taskManageView = actionTarget.dataset.view;
    savePersistentState();
    renderApp();
    return;
  }

  if (action === "set-ranking-tab") {
    state.rankingTab = actionTarget.dataset.tab;
    state.rankingPage = 0;
    savePersistentState();
    renderApp();
    return;
  }

  if (action === "set-ranking-range") {
    state.rankingRange = actionTarget.dataset.range;
    state.rankingPage = 0;
    savePersistentState();
    renderApp();
    return;
  }

  if (action === "set-review-tab") {
    state.reviewTab = actionTarget.dataset.tab;
    savePersistentState();
    renderApp();
    return;
  }

  if (action === "set-member-view") {
    state.memberView = actionTarget.dataset.view;
    state.memberPage = 0;
    savePersistentState();
    renderApp();
    return;
  }

  if (action === "member-page") {
    const page = parseInt(actionTarget.dataset.page, 10);
    if (!Number.isNaN(page) && page >= 0) {
      state.memberPage = page;
      renderApp();
    }
    return;
  }

  if (action === "market-page") {
    const page = parseInt(actionTarget.dataset.page, 10);
    if (!Number.isNaN(page) && page >= 0) {
      state.marketPage = page;
      renderApp();
    }
    return;
  }

  if (action === "ranking-page") {
    const page = parseInt(actionTarget.dataset.page, 10);
    if (!Number.isNaN(page) && page >= 0) {
      state.rankingPage = page;
      renderApp();
    }
    return;
  }

  if (action === "clear-filters") {
    const { group } = actionTarget.dataset;
    if (group === "market") {
      state.marketFilters = createDefaultMarketFilters();
      state.marketPage = 0;
    } else if (group === "member") {
      state.memberFilters = createDefaultMemberFilters();
      state.memberPage = 0;
    } else if (group === "files") {
      state.fileFilters = createDefaultFileFilters();
      state.settingsFilePage = 0;
    }
    savePersistentState();
    renderApp();
    return;
  }

  if (action === "open-create-task") {
    if (!permissions.canCreateTask()) {
      pushFlash("当前身份没有发布任务权限。", "info");
      return;
    }
    openModal("task-form", { taskId: null });
    return;
  }

  if (action === "open-edit-task") {
    pushModal({ type: "task-form", taskId: actionTarget.dataset.taskId });
    void loadModalChunk("task-form");
    return;
  }

  if (action === "open-share-task") {
    pushModal({ type: "share-task", taskId: actionTarget.dataset.taskId });
    void loadModalChunk("share-task");
    return;
  }

  if (action === "delete-task") {
    const task = await moduleLoaders.task();
    await task.deleteTask(actionTarget.dataset.taskId);
    return;
  }

  if (action === "open-owner-reassign") {
    pushModal({ type: "task-owner-reassign", taskId: actionTarget.dataset.taskId, nextOwnerId: actionTarget.dataset.memberId || "" });
    void loadModalChunk("task-owner-reassign");
    return;
  }

  if (action === "remove-task-participant") {
    const task = await moduleLoaders.task();
    await task.removeTaskParticipant(actionTarget.dataset.taskId, actionTarget.dataset.memberId);
    return;
  }

  if (action === "open-edit-member") {
    if (!permissions.canDeleteAllGeneratedData()) {
      pushFlash("只有管理员可以编辑成员资料。", "info");
      return;
    }
    openModal("member-form", { memberId: actionTarget.dataset.memberId });
    return;
  }

  if (action === "open-profile-content") {
    openModal("profile-content");
    return;
  }

  if (action === "open-promotion-request" || action === "open-role-change-request") {
    if (action === "open-role-change-request" && !permissions.canRequestRoleChange()) {
      pushFlash("您已有一个待审核的变岗申请，请等待审核完成后再提交。", "info");
      return;
    }
    openModal("role-change-request");
    return;
  }

  if (action === "open-promotion-detail") {
    openModal("promotion-detail", { approvalId: actionTarget.dataset.approvalId });
    return;
  }

  if (action === "open-registration-review") {
    if (!permissions.canReview()) {
      pushFlash("当前身份没有审核权限。", "info");
      return;
    }
    openModal("registration-review", { approvalId: actionTarget.dataset.approvalId });
    return;
  }

  if (action === "open-approval-action") {
    openModal("approval-action", { approvalId: actionTarget.dataset.approvalId });
    return;
  }

  if (action === "open-approval-reject") {
    openModal("approval-reject", {
      approvalId: actionTarget.dataset.approvalId,
      decisionType: actionTarget.dataset.decisionType || "reject",
    });
    return;
  }

  if (action === "reject-approval") {
    openModal("approval-reject", { approvalId: actionTarget.dataset.approvalId, decisionType: "reject" });
    return;
  }

  if (action === "claim-task") {
    const task = await moduleLoaders.task();
    await task.joinTask(actionTarget.dataset.taskId);
    return;
  }

  if (action === "exit-task") {
    const task = await moduleLoaders.task();
    await task.exitTask(actionTarget.dataset.taskId);
    return;
  }

  if (action === "approve-join") {
    const approval = await moduleLoaders.approval();
    await approval.approveJoinRequest(actionTarget.dataset.approvalId);
    return;
  }

  if (action === "reject-join") {
    const approval = await moduleLoaders.approval();
    await approval.rejectApproval(actionTarget.dataset.approvalId, "加入申请未通过");
    return;
  }

  if (action === "reject-registration") {
    openModal("approval-reject", { approvalId: actionTarget.dataset.approvalId, decisionType: "registration" });
    return;
  }

  if (action === "approve-completion") {
    const approval = await moduleLoaders.approval();
    await approval.approveCompletion(actionTarget.dataset.approvalId);
    return;
  }

  if (action === "approve-promotion") {
    const approval = await moduleLoaders.approval();
    await approval.approvePromotionRequest(actionTarget.dataset.approvalId);
    return;
  }

  if (action === "approve-status-change") {
    const approval = await moduleLoaders.approval();
    await approval.approveStatusChangeRequest(actionTarget.dataset.approvalId);
    return;
  }

  if (action === "reject-status-change") {
    openModal("approval-reject", { approvalId: actionTarget.dataset.approvalId, decisionType: "reject" });
    return;
  }

  if (action === "load-file-manager") {
    state.settingsFilePage = 0;
    openModal("file-manager");
    state.settingsFileLoading = true;
    renderApp();
    try {
      state.settingsFiles = await fetchUploadList();
      state.attachmentsIndex = query.getAttachmentsIndex();
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
    if (!Number.isNaN(page) && page >= 0) {
      state.settingsFilePage = page;
      renderApp();
    }
    return;
  }

  if (action === "delete-upload-file") {
    const storagePath = actionTarget.dataset.storagePath;
    const fileName = actionTarget.dataset.fileName || storagePath.split("/").pop();
    if (!window.confirm(`确认删除文件《${fileName}》？删除后不可恢复。`)) return;
    try {
      await requestJson("/api/uploads/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paths: [storagePath] }),
      });
    } catch {
      pushFlash("文件删除失败。", "info");
      return;
    }
    state.settingsFiles = state.settingsFiles.filter((file) => file.path !== storagePath);
    state.database.tasks.forEach((taskRecord) => {
      taskRecord.attachments = (taskRecord.attachments || []).filter((attachment) => attachment.storagePath !== storagePath);
      (taskRecord.progressNodes || []).forEach((node) => {
        node.attachments = (node.attachments || []).filter((attachment) => attachment.storagePath !== storagePath);
      });
    });
    state.database.approvals.forEach((approvalRecord) => {
      approvalRecord.attachments = (approvalRecord.attachments || []).filter((attachment) => attachment.storagePath !== storagePath);
    });
    await saveDatabase();
    state.attachmentsIndex = query.getAttachmentsIndex();
    renderApp();
    return;
  }

  if (action === "return-completion") {
    openModal("approval-reject", { approvalId: actionTarget.dataset.approvalId, decisionType: "return" });
    return;
  }

  if (action === "reject-promotion") {
    openModal("approval-reject", { approvalId: actionTarget.dataset.approvalId, decisionType: "reject" });
    return;
  }

  if (action === "delete-approval") {
    const approval = await moduleLoaders.approval();
    await approval.deleteApprovalRecord(actionTarget.dataset.approvalId);
    return;
  }

  if (action === "delete-comment") {
    const task = await moduleLoaders.task();
    await task.deleteTaskComment(actionTarget.dataset.taskId, actionTarget.dataset.commentId);
    return;
  }

  if (action === "delete-attachment") {
    const task = await moduleLoaders.task();
    await task.deleteTaskAttachment(actionTarget.dataset.taskId, actionTarget.dataset.attachmentId);
    return;
  }

  if (action === "delete-progress-node") {
    const task = await moduleLoaders.task();
    await task.deleteProgressNode(actionTarget.dataset.taskId, actionTarget.dataset.nodeId);
    return;
  }

  if (action === "delete-progress-node-attachment") {
    const task = await moduleLoaders.task();
    await task.deleteProgressNodeAttachment(actionTarget.dataset.taskId, actionTarget.dataset.nodeId, actionTarget.dataset.attachmentId);
    return;
  }

  if (action === "delete-point-transaction") {
    const task = await moduleLoaders.task();
    await task.deletePointTransaction(actionTarget.dataset.pointId);
    return;
  }

  if (action === "open-progress-note") {
    pushModal({ type: "progress-note-form", taskId: actionTarget.dataset.taskId });
    void loadModalChunk("progress-note-form");
    return;
  }

  if (action === "open-task-attachment") {
    pushModal({ type: "task-attachment-form", taskId: actionTarget.dataset.taskId });
    void loadModalChunk("task-attachment-form");
    return;
  }

  if (action === "open-password-change") {
    openModal("password-change");
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
    replaceModal({ type: "task-form", taskId: null, cloneFromTaskId: actionTarget.dataset.taskId });
    void loadModalChunk("task-form");
    return;
  }

  if (action === "export-members-csv") {
    const member = await moduleLoaders.member();
    await member.exportMembersCsv();
    return;
  }

  if (action === "export-tasks-csv") {
    const member = await moduleLoaders.member();
    await member.exportTasksCsv();
    return;
  }

  if (action === "export-rankings-csv") {
    const member = await moduleLoaders.member();
    await member.exportRankingsCsv();
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
    if (formKey !== "login") {
      await ensureDatabaseReady();
    }
    switch (formKey) {
      case "login": {
        const auth = await moduleLoaders.auth();
        await auth.handleLogin(form);
        break;
      }
      case "password-change": {
        const auth = await moduleLoaders.auth();
        await auth.handlePasswordChange(form);
        break;
      }
      case "register": {
        const auth = await moduleLoaders.auth();
        await auth.handleRegister(form);
        break;
      }
      case "registration-edit": {
        const auth = await moduleLoaders.auth();
        await auth.handleRegistrationEdit(form);
        break;
      }
      case "sensitive-action": {
        const member = await moduleLoaders.member();
        await member.handleSensitiveActionForm(form);
        break;
      }
      case "task-form": {
        const task = await moduleLoaders.task();
        await task.handleTaskForm(form);
        break;
      }
      case "task-participant-add": {
        const task = await moduleLoaders.task();
        await task.handleTaskParticipantAdd(form);
        break;
      }
      case "task-owner-reassign": {
        const task = await moduleLoaders.task();
        await task.handleTaskOwnerReassignForm(form);
        break;
      }
      case "member-form": {
        const member = await moduleLoaders.member();
        await member.handleMemberForm(form);
        break;
      }
      case "profile-content": {
        const member = await moduleLoaders.member();
        await member.handleProfileContentForm(form);
        break;
      }
      case "promotion-request":
      case "role-change-request": {
        const approval = await moduleLoaders.approval();
        await approval.handleRoleChangeRequestForm(form);
        break;
      }
      case "registration-review": {
        const approval = await moduleLoaders.approval();
        await approval.handleRegistrationReview(form);
        break;
      }
      case "approval-reject": {
        const approval = await moduleLoaders.approval();
        await approval.handleApprovalRejectionForm(form);
        break;
      }
      case "task-progress": {
        const task = await moduleLoaders.task();
        await task.handleProgressForm(form);
        break;
      }
      case "task-comment": {
        const task = await moduleLoaders.task();
        await task.handleCommentForm(form);
        break;
      }
      case "task-submit": {
        const task = await moduleLoaders.task();
        await task.handleSubmissionForm(form);
        break;
      }
      case "progress-note-form": {
        const task = await moduleLoaders.task();
        await task.handleProgressNoteForm(form);
        break;
      }
      case "task-attachment-form": {
        const task = await moduleLoaders.task();
        await task.handleTaskAttachmentForm(form);
        break;
      }
      case "task-ratios": {
        const task = await moduleLoaders.task();
        await task.handleRatioForm(form);
        break;
      }
      case "task-compensation": {
        const task = await moduleLoaders.task();
        await task.handleCompensationForm(form);
        break;
      }
      case "settings": {
        const member = await moduleLoaders.member();
        await member.handleSettingsForm(form);
        break;
      }
      case "retire-form": {
        const member = await moduleLoaders.member();
        await member.handleRetireForm(form);
        break;
      }
      default:
        break;
    }

    const draftKey = form.dataset.draftKey;
    if (draftKey) {
      clearDraft(draftKey);
    }
  } catch (error) {
    console.error("Form submission error:", error);
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
  if (target.dataset.participantSearch !== undefined) {
    const taskId = target.dataset.participantSearch;
    const query = target.value.toLowerCase();
    const select = document.querySelector(`[data-participant-select="${CSS.escape(taskId)}"]`);
    if (select) {
      Array.from(select.options).forEach((option) => {
        option.style.display = option.text.toLowerCase().includes(query) ? "" : "none";
      });
    }
    return;
  }
  const draftForm = target.closest("form[data-draft-key]");
  if (draftForm && isFormField(target)) {
    const draftKey = draftForm.dataset.draftKey;
    if (draftKey) {
      saveDraft(draftKey, serializeFormDraft(draftForm));
    }
  }
  if (target.dataset.filterGroup && target.dataset.filterKey) {
    const group = target.dataset.filterGroup;
    const key = target.dataset.filterKey;
    const source = group === "member" ? state.memberFilters : group === "files" ? state.fileFilters : state.marketFilters;
    source[key] = target.value;
    if (group === "market") {
      state.marketPage = 0;
    } else if (group === "member") {
      state.memberPage = 0;
    } else if (group === "files") {
      state.settingsFilePage = 0;
    }

    if (filterDebounceTimer !== null) {
      clearTimeout(filterDebounceTimer);
    }
    filterDebounceTimer = setTimeout(() => {
      if (state.formLoading) return;
      const selectionStart = target instanceof HTMLInputElement ? target.selectionStart : null;
      const selectionEnd = target instanceof HTMLInputElement ? target.selectionEnd : null;
      renderApp();
      savePersistentState();
      const restored = document.querySelector(`[data-filter-group="${group}"][data-filter-key="${key}"]`);
      if (restored instanceof HTMLInputElement) {
        restored.focus();
        if (selectionStart !== null) {
          restored.setSelectionRange(selectionStart, selectionEnd ?? selectionStart);
        }
      }
    }, 150);
  }
});

document.addEventListener("change", (event) => {
  const target = event.target;
  if (!isFormField(target)) return;
  clearFieldValidationState(target);
  const draftForm = target.closest("form[data-draft-key]");
  if (draftForm) {
    const draftKey = draftForm.dataset.draftKey;
    if (draftKey) {
      saveDraft(draftKey, serializeFormDraft(draftForm));
    }
  }
});

document.addEventListener("focusin", (event) => {
  const target = event.target;
  if (target.hasAttribute("data-readonly")) {
    target.removeAttribute("readonly");
    target.removeAttribute("data-readonly");
  }
});

document.addEventListener("dragenter", (event) => {
  const input = event.target.closest(".field-file-input");
  if (input) {
    input.classList.add("is-dragover");
    event.preventDefault();
  }
});

document.addEventListener("dragover", (event) => {
  const input = event.target.closest(".field-file-input");
  if (input) {
    input.classList.add("is-dragover");
    event.preventDefault();
  }
});

document.addEventListener("dragleave", (event) => {
  const input = event.target.closest(".field-file-input");
  if (input) {
    input.classList.remove("is-dragover");
  }
});

document.addEventListener("drop", (event) => {
  const input = event.target.closest(".field-file-input");
  if (!(input instanceof HTMLInputElement)) return;
  event.preventDefault();
  input.classList.remove("is-dragover");
  if (event.dataTransfer?.files?.length) {
    input.files = event.dataTransfer.files;
    const warn = input.nextElementSibling;
    if (warn) {
      warn.textContent = input.files.length > 5 ? "单次最多上传 5 个文件。" : "";
    }
  }
});

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    void refreshDatabaseQuietly();
  }
});

document.addEventListener("keydown", async (event) => {
  const tag = event.target?.tagName;
  const editing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
  if (event.key === "Escape") {
    if (state.notifPanelOpen) {
      state.notifPanelOpen = false;
      const notifications = await moduleLoaders.notifications();
      notifications.markAllNotificationsRead();
      renderApp();
      void persistNotificationReadState();
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
    const button = document.querySelector('[data-action="open-create-task"]');
    if (button) button.click();
    return;
  }
  if (event.key === "/") {
    event.preventDefault();
    const searchInput = document.querySelector(".search-shell input");
    if (searchInput) searchInput.focus();
    return;
  }
  if (event.key === "?" && !state.modal) {
    event.preventDefault();
    window.confirm([
      "键盘快捷键：",
      "",
      "  N  — 新建任务",
      "  /  — 聚焦搜索",
      "  Esc — 关闭弹窗/通知面板",
      "  ?  — 显示此帮助",
      "",
      "此提示只会在按 ? 时显示。",
    ].join("\n"));
  }
});

bootstrapApp();
