import {
  clearDraft,
  saveDraft,
  serializeFormDraft
} from "./chunks/chunk-OANHKQRB.js";
import {
  clearModalStack,
  ensureDatabaseReady,
  initialize,
  loadModalChunk,
  loadRouteChunk,
  navigateTo,
  popModal,
  pushFlash,
  pushModal,
  refreshDatabaseQuietly,
  renderApp2 as renderApp,
  replaceModal,
  saveDatabase
} from "./chunks/chunk-LMST3HJK.js";
import "./chunks/chunk-UQLSNBUY.js";
import {
  clearSession,
  fetchUploadList,
  requestJson
} from "./chunks/chunk-PIQJ4EHT.js";
import {
  savePersistentState,
  state
} from "./chunks/chunk-NDL62ULM.js";

// client/core/bootstrap.js
function bootstrapApp() {
  initialize();
  renderApp();
}

// client/core/validation.js
function isFormField(element) {
  return element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement;
}
function isRequiredFieldEmpty(field) {
  if (!field.required || field.disabled) {
    return false;
  }
  if (field instanceof HTMLInputElement && ["checkbox", "radio"].includes(field.type)) {
    return !field.checked;
  }
  return !String(field.value ?? "").trim();
}
function setFieldValidationState(field, invalid) {
  field.classList.toggle("is-invalid", invalid);
  field.setAttribute("aria-invalid", invalid ? "true" : "false");
  const fieldGroup = field.closest(".field-group");
  if (fieldGroup) {
    fieldGroup.classList.toggle("has-error", invalid);
    let errorEl = fieldGroup.querySelector(".field-error");
    if (invalid) {
      if (!errorEl) {
        errorEl = document.createElement("span");
        errorEl.className = "field-error";
        fieldGroup.appendChild(errorEl);
      }
      errorEl.textContent = "\u8BF7\u586B\u5199\u6B64\u9879";
    } else if (errorEl) {
      errorEl.remove();
    }
  }
}
function clearFieldValidationState(field) {
  if (!field.classList.contains("is-invalid")) {
    return;
  }
  if (!field.required) {
    setFieldValidationState(field, false);
    return;
  }
  if (!isRequiredFieldEmpty(field)) {
    setFieldValidationState(field, false);
  }
}
function validateRequiredFields(form) {
  let firstInvalidField = null;
  form.querySelectorAll("[required]").forEach((element) => {
    if (!isFormField(element)) {
      return;
    }
    const invalid = isRequiredFieldEmpty(element);
    setFieldValidationState(element, invalid);
    if (invalid && !firstInvalidField) {
      firstInvalidField = element;
    }
  });
  if (firstInvalidField) {
    firstInvalidField.focus();
    return false;
  }
  return true;
}

// frontend/app.js
var filterDebounceTimer = null;
var moduleLoaders = {
  approval: createModuleLoader(() => import("./chunks/approval-DRYLWX2A.js")),
  auth: createModuleLoader(() => import("./chunks/auth-U66JP7DV.js")),
  member: createModuleLoader(() => import("./chunks/member-TYMOVCJU.js")),
  notifications: createModuleLoader(() => import("./chunks/notifications-6JRS6HE2.js")),
  permissions: createModuleLoader(() => import("./chunks/permissions-IJH7XE2W.js")),
  query: createModuleLoader(() => import("./chunks/query-5EPJMK3D.js")),
  task: createModuleLoader(() => import("./chunks/task-GVPTZOQT.js"))
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
document.addEventListener("click", async (event) => {
  const actionTarget = event.target.closest("[data-action]");
  if (!actionTarget) return;
  const { action } = actionTarget.dataset;
  if (action === "toggle-nav") {
    state.mobileNavOpen = !state.mobileNavOpen;
    renderApp();
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
  await ensureDatabaseReady();
  const [permissions, query] = await Promise.all([
    moduleLoaders.permissions(),
    moduleLoaders.query()
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
      pushFlash("\u7CFB\u7EDF\u9690\u85CF\u7BA1\u7406\u5458\u8D26\u53F7\u4E0D\u5141\u8BB8\u6267\u884C\u8BE5\u64CD\u4F5C\u3002", "info");
      return;
    }
    if (member.memberStatus === "retired") {
      pushFlash("\u5F53\u524D\u8D26\u53F7\u5DF2\u7ECF\u662F\u9000\u4F11\u72B6\u6001\u3002", "info");
      return;
    }
    const blockers = permissions.getLifecycleBlockingTasks(member.id);
    if (blockers.length) {
      const taskList = blockers.map((task) => `\u300A${task.title}\u300B`).join("\u3001");
      pushFlash(`\u5F53\u524D\u4ECD\u6709\u672A\u5B8C\u6210\u7684\u4EFB\u52A1\uFF1A${taskList}\u3002\u8BF7\u5148\u5B8C\u6210\u6216\u79FB\u4EA4\u8FD9\u4E9B\u4EFB\u52A1\u540E\u518D\u7533\u8BF7\u9000\u5F79\u3002`, "info");
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
    savePersistentState();
    renderApp();
    return;
  }
  if (action === "set-ranking-range") {
    state.rankingRange = actionTarget.dataset.range;
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
    savePersistentState();
    renderApp();
    return;
  }
  if (action === "open-create-task") {
    if (!permissions.canCreateTask()) {
      pushFlash("\u5F53\u524D\u8EAB\u4EFD\u6CA1\u6709\u53D1\u5E03\u4EFB\u52A1\u6743\u9650\u3002", "info");
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
      pushFlash("\u53EA\u6709\u7BA1\u7406\u5458\u53EF\u4EE5\u7F16\u8F91\u6210\u5458\u8D44\u6599\u3002", "info");
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
      pushFlash("\u60A8\u5DF2\u6709\u4E00\u4E2A\u5F85\u5BA1\u6838\u7684\u53D8\u5C97\u7533\u8BF7\uFF0C\u8BF7\u7B49\u5F85\u5BA1\u6838\u5B8C\u6210\u540E\u518D\u63D0\u4EA4\u3002", "info");
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
      pushFlash("\u5F53\u524D\u8EAB\u4EFD\u6CA1\u6709\u5BA1\u6838\u6743\u9650\u3002", "info");
      return;
    }
    openModal("registration-review", { approvalId: actionTarget.dataset.approvalId });
    return;
  }
  if (action === "open-approval-action") {
    openModal("approval-action", { approvalId: actionTarget.dataset.approvalId });
    return;
  }
  if (action === "reject-approval") {
    const approval = await moduleLoaders.approval();
    await approval.rejectApproval(actionTarget.dataset.approvalId, "\u7533\u8BF7\u672A\u901A\u8FC7");
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
    await approval.rejectApproval(actionTarget.dataset.approvalId, "\u52A0\u5165\u7533\u8BF7\u672A\u901A\u8FC7");
    return;
  }
  if (action === "reject-registration") {
    const approval = await moduleLoaders.approval();
    await approval.rejectRegistration(actionTarget.dataset.approvalId);
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
    const approval = await moduleLoaders.approval();
    await approval.rejectApproval(actionTarget.dataset.approvalId, "\u53D8\u5C97\u7533\u8BF7\u672A\u901A\u8FC7");
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
      pushFlash("\u6587\u4EF6\u5217\u8868\u52A0\u8F7D\u5931\u8D25\u3002", "info");
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
    if (!window.confirm(`\u786E\u8BA4\u5220\u9664\u6587\u4EF6\u300A${fileName}\u300B\uFF1F\u5220\u9664\u540E\u4E0D\u53EF\u6062\u590D\u3002`)) return;
    try {
      await requestJson("/api/uploads/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paths: [storagePath] })
      });
    } catch {
      pushFlash("\u6587\u4EF6\u5220\u9664\u5931\u8D25\u3002", "info");
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
    const approval = await moduleLoaders.approval();
    await approval.returnCompletion(actionTarget.dataset.approvalId);
    return;
  }
  if (action === "reject-promotion") {
    const approval = await moduleLoaders.approval();
    await approval.rejectApproval(actionTarget.dataset.approvalId, "\u8F6C\u6B63\u7533\u8BF7\u672A\u901A\u8FC7");
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
  if (action === "toggle-notif-panel") {
    const notifications = await moduleLoaders.notifications();
    if (state.notifPanelOpen) {
      state.notifPanelOpen = false;
      notifications.markAllNotificationsRead();
      await saveDatabase();
    } else {
      state.notifPanelOpen = true;
    }
    renderApp();
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
    pushFlash("\u64CD\u4F5C\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5\u3002", "error");
  } finally {
    state.formLoading = null;
    renderApp();
  }
});
document.addEventListener("input", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  if (isFormField(target)) clearFieldValidationState(target);
  if (target.dataset.globalSearch !== void 0) {
    state.globalSearch = target.value;
    renderApp();
    return;
  }
  if (target.dataset.participantSearch !== void 0) {
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
      warn.textContent = input.files.length > 5 ? "\u5355\u6B21\u6700\u591A\u4E0A\u4F20 5 \u4E2A\u6587\u4EF6\u3002" : "";
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
      "\u952E\u76D8\u5FEB\u6377\u952E\uFF1A",
      "",
      "  N  \u2014 \u65B0\u5EFA\u4EFB\u52A1",
      "  /  \u2014 \u805A\u7126\u641C\u7D22",
      "  Esc \u2014 \u5173\u95ED\u5F39\u7A97/\u901A\u77E5\u9762\u677F",
      "  ?  \u2014 \u663E\u793A\u6B64\u5E2E\u52A9",
      "",
      "\u6B64\u63D0\u793A\u53EA\u4F1A\u5728\u6309 ? \u65F6\u663E\u793A\u3002"
    ].join("\n"));
  }
});
bootstrapApp();
