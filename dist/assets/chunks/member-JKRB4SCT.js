import {
  clearModalStack,
  popModal,
  saveDatabase
} from "./chunk-KX6RKBAB.js";
import "./chunk-AFQ47FFH.js";
import {
  pushFlash,
  saveSession
} from "./chunk-5PJ3LKYU.js";
import {
  getLifecycleActionDefinition
} from "./chunk-XS6Z5SGI.js";
import {
  canDeleteAllGeneratedData,
  clamp,
  ensureVisibleRoute,
  getCurrentMember,
  getCurrentUser,
  getLifecycleBlockingTasks,
  getMemberById,
  getRoleForIdentity,
  joinOr,
  parseList
} from "./chunk-IKVMAO7C.js";
import {
  dictionaries,
  state
} from "./chunk-NDL62ULM.js";
import {
  hashPassword
} from "./chunk-UQLSNBUY.js";

// client/domain/member.js
async function handleMemberForm(form) {
  const formData = new FormData(form);
  const member = getMemberById(String(formData.get("memberId") || ""));
  if (!member) {
    pushFlash("\u6210\u5458\u4E0D\u5B58\u5728\u3002", "info");
    return;
  }
  member.name = String(formData.get("name") || "").trim();
  member.phone = String(formData.get("phone") || "").trim();
  member.identity = String(formData.get("identity") || member.identity);
  member.role = getRoleForIdentity(member.identity);
  const nextMemberStatus = String(formData.get("memberStatus") || member.memberStatus);
  if (["retired", "disabled"].includes(nextMemberStatus)) {
    pushFlash("\u9000\u4F11\u548C\u505C\u7528\u8BF7\u4F7F\u7528\u4E13\u7528\u64CD\u4F5C\u6309\u94AE\u6267\u884C\u3002", "info");
    return;
  }
  member.memberStatus = nextMemberStatus;
  member.departments = parseList(String(formData.get("departments") || "")).slice(0, 1);
  member.directions = parseList(String(formData.get("directions") || ""));
  member.robotGroups = parseList(String(formData.get("robotGroups") || ""));
  member.skillTags = parseList(String(formData.get("skillTags") || ""));
  member.bio = String(formData.get("bio") || "").trim();
  const user = state.database.users.find((item) => item.memberId === member.id);
  if (user) user.status = member.memberStatus === "pending_review" ? "pending" : "active";
  if (!await saveDatabase()) return;
  clearModalStack();
  pushFlash("\u6210\u5458\u8D44\u6599\u5DF2\u66F4\u65B0\u3002", "info");
}
async function handleProfileContentForm(form) {
  const member = getCurrentMember();
  if (!member) return;
  const formData = new FormData(form);
  const updated = {
    phone: String(formData.get("phone") || "").trim(),
    skillTags: parseList(String(formData.get("skillTags") || "")),
    bio: String(formData.get("bio") || "").trim()
  };
  if (!await handleUpdateMemberProfile(member, updated)) return;
  clearModalStack();
  pushFlash("\u4E2A\u4EBA\u8D44\u6599\u5DF2\u66F4\u65B0\u3002", "info");
}
async function handleUpdateMemberProfile(member, updates) {
  Object.assign(member, updates);
  return await saveDatabase();
}
async function handleSettingsForm(form) {
  if (!canDeleteAllGeneratedData()) {
    pushFlash("\u53EA\u6709\u7BA1\u7406\u5458\u53EF\u4EE5\u4FEE\u6539\u7CFB\u7EDF\u8BBE\u7F6E\u3002", "info");
    return;
  }
  const formData = new FormData(form);
  state.database.settings.middleJoinDiscount = clamp(Number(formData.get("middleJoinDiscount") || 0.5), 0, 1);
  state.database.settings.overduePointDiscount = clamp(Number(formData.get("overduePointDiscount") || 0.5), 0, 1);
  state.database.settings.pointPrecision = Math.round(clamp(Number(formData.get("pointPrecision") || 1), 0, 2));
  state.database.settings.hardTaskNeedsApproval = String(formData.get("hardTaskNeedsApproval") || "true") === "true";
  if (!await saveDatabase()) return;
  pushFlash("\u7CFB\u7EDF\u8BBE\u7F6E\u5DF2\u4FDD\u5B58\u3002", "info");
}
async function handleSensitiveActionForm(form) {
  const currentUser = getCurrentUser();
  if (!currentUser || state.modal?.type !== "sensitive-action") {
    pushFlash("\u5F53\u524D\u65E0\u6CD5\u6267\u884C\u8BE5\u654F\u611F\u64CD\u4F5C\u3002", "info");
    return;
  }
  const formData = new FormData(form);
  const operatorEmail = String(formData.get("operatorEmail") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "").trim();
  if (!operatorEmail || !password) {
    pushFlash("\u8BF7\u8F93\u5165\u5F53\u524D\u64CD\u4F5C\u8005\u8D26\u53F7\u548C\u5BC6\u7801\u3002", "error");
    return;
  }
  if (operatorEmail !== currentUser.email.toLowerCase()) {
    pushFlash("\u786E\u8BA4\u8D26\u53F7\u5FC5\u987B\u586B\u5199\u5F53\u524D\u767B\u5F55\u8D26\u53F7\u90AE\u7BB1\u3002", "error");
    return;
  }
  const hashedPassword = await hashPassword(password);
  if (hashedPassword !== currentUser.passwordHash && password !== currentUser.passwordHash) {
    pushFlash("\u8D26\u53F7\u6216\u5BC6\u7801\u6821\u9A8C\u5931\u8D25\uFF0C\u672A\u6267\u884C\u8BE5\u64CD\u4F5C\u3002", "error");
    return;
  }
  const actionConfig = getLifecycleActionDefinition(state.modal.actionKey, state.modal.memberId);
  if (!actionConfig) {
    pushFlash("\u654F\u611F\u64CD\u4F5C\u5DF2\u5931\u6548\uFF0C\u8BF7\u91CD\u65B0\u53D1\u8D77\u3002", "info");
    return;
  }
  const performed = await executeSensitiveMemberAction(actionConfig);
  if (!performed) return;
  if (actionConfig.actionKey === "retire-self") {
    clearModalStack();
  } else {
    popModal();
  }
  ensureVisibleRoute();
}
async function executeSensitiveMemberAction(actionConfig) {
  const { actionKey, member, targetStatus, targetUserStatus, successMessage } = actionConfig;
  const user = state.database.users.find((item) => item.memberId === member.id) || null;
  if (member.hiddenFromDirectory) {
    pushFlash("\u7CFB\u7EDF\u9690\u85CF\u7BA1\u7406\u5458\u8D26\u53F7\u4E0D\u5141\u8BB8\u6267\u884C\u8BE5\u64CD\u4F5C\u3002", "info");
    return false;
  }
  if (actionKey === "restore-member") {
    if (!user || user.status !== "disabled") {
      pushFlash("\u5F53\u524D\u6210\u5458\u8D26\u53F7\u4E0D\u662F\u505C\u7528\u72B6\u6001\uFF0C\u65E0\u6CD5\u6062\u590D\u3002", "info");
      return false;
    }
  } else {
    const blockers = getLifecycleBlockingTasks(member.id);
    if (blockers.length) {
      pushFlash(`\u8BE5\u6210\u5458\u4ECD\u6709\u5173\u8054\u4E2D\u7684\u4EFB\u52A1\uFF1A${blockers.map((task) => task.title).join("\u3001")}\u3002\u8BF7\u5148\u5728\u4EFB\u52A1\u8BE6\u60C5\u91CC\u8C03\u6574\u53C2\u4E0E\u6210\u5458\u6216\u8D1F\u8D23\u4EBA\u3002`, "error");
      return false;
    }
  }
  if (actionKey === "retire-self" && member.memberStatus === "retired") {
    pushFlash("\u5F53\u524D\u8D26\u53F7\u5DF2\u7ECF\u662F\u9000\u4F11\u72B6\u6001\u3002", "info");
    return false;
  }
  if (actionKey === "force-retire-member" && member.memberStatus === "retired") {
    pushFlash("\u8BE5\u6210\u5458\u5DF2\u7ECF\u662F\u9000\u4F11\u72B6\u6001\u3002", "info");
    return false;
  }
  if (actionKey === "disable-member" && user?.status === "disabled") {
    pushFlash("\u8BE5\u6210\u5458\u8D26\u53F7\u5DF2\u7ECF\u505C\u7528\u3002", "info");
    return false;
  }
  member.memberStatus = targetStatus;
  if (user) user.status = targetUserStatus;
  if (!await saveDatabase()) return false;
  if (actionKey === "disable-member" && user?.id === state.currentUserId) saveSession(state.currentUserId);
  pushFlash(successMessage, "info");
  return true;
}
async function handleRetireForm(form) {
  const member = getCurrentMember();
  if (!member) {
    pushFlash("\u8BF7\u5148\u767B\u5F55\u3002", "info");
    return;
  }
  if (member.hiddenFromDirectory) {
    pushFlash("\u7CFB\u7EDF\u9690\u85CF\u7BA1\u7406\u5458\u8D26\u53F7\u4E0D\u5141\u8BB8\u6267\u884C\u8BE5\u64CD\u4F5C\u3002", "info");
    return;
  }
  if (member.memberStatus === "retired") {
    pushFlash("\u5F53\u524D\u8D26\u53F7\u5DF2\u7ECF\u662F\u9000\u4F11\u72B6\u6001\u3002", "info");
    return;
  }
  const formData = new FormData(form);
  const reason = String(formData.get("reason") || "").trim();
  const message = String(formData.get("message") || "").trim();
  if (!reason) {
    pushFlash("\u8BF7\u586B\u5199\u9000\u5F79\u539F\u56E0\u3002", "info");
    return;
  }
  const blockers = getLifecycleBlockingTasks(member.id);
  if (blockers.length) {
    const taskList = blockers.map((task) => `\u300A${task.title}\u300B`).join("\u3001");
    pushFlash(`\u5F53\u524D\u4ECD\u6709\u672A\u5B8C\u6210\u7684\u4EFB\u52A1\uFF1A${taskList}\u3002\u8BF7\u5148\u5B8C\u6210\u6216\u79FB\u4EA4\u8FD9\u4E9B\u4EFB\u52A1\u540E\u518D\u7533\u8BF7\u9000\u5F79\u3002`, "info");
    return;
  }
  const confirmed = window.confirm(`\u786E\u8BA4\u8981\u7533\u8BF7\u9000\u5F79\u5417\uFF1F

\u9000\u5F79\u540E\u8D26\u53F7\u5C06\u5207\u6362\u4E3A\u53EA\u8BFB\u72B6\u6001\uFF0C\u4E0D\u518D\u53C2\u4E0E\u4EFB\u52A1\u3001\u79EF\u5206\u4E0E\u6392\u884C\uFF0C\u4F46\u5386\u53F2\u8BB0\u5F55\u4F1A\u4FDD\u7559\u3002\u6B64\u64CD\u4F5C\u4E0D\u53EF\u64A4\u9500\u3002`);
  if (!confirmed) return;
  member.memberStatus = "retired";
  member.retireReason = reason;
  member.retireMessage = message;
  member.retiredAt = (/* @__PURE__ */ new Date()).toISOString();
  if (!await saveDatabase()) return;
  clearModalStack();
  pushFlash("\u5DF2\u9000\u5F79\uFF0C\u5F53\u524D\u8D26\u53F7\u5DF2\u5207\u6362\u4E3A\u53EA\u8BFB\u72B6\u6001\u3002", "info");
}
async function exportMembersCsv() {
  const rows = [["\u59D3\u540D", "\u6210\u5458\u8EAB\u4EFD", "\u89D2\u8272", "\u90E8\u95E8", "\u5175\u79CD", "\u6280\u80FD\u6807\u7B7E", "\u72B6\u6001"]];
  state.database.members.forEach((m) => {
    rows.push([m.name, dictionaries.identities[m.identity] || m.identity, dictionaries.roles[m.role] || m.role, m.departments.join(";"), m.robotGroups.join(";"), m.skillTags.join(";"), dictionaries.memberStatuses[m.memberStatus] || m.memberStatus]);
  });
  downloadCsv("\u6210\u5458\u5217\u8868.csv", rows);
}
async function exportTasksCsv() {
  const rows = [["\u6807\u9898", "\u7C7B\u578B", "\u72B6\u6001", "\u4F18\u5148\u7EA7", "\u96BE\u5EA6", "\u90E8\u95E8", "\u5175\u79CD", "\u622A\u6B62\u65E5\u671F", "\u8D1F\u8D23\u4EBA", "\u8FDB\u5EA6"]];
  state.database.tasks.forEach((t) => {
    const owner = getMemberById(t.ownerId);
    rows.push([t.title, dictionaries.taskTypes[t.type] || t.type, dictionaries.taskStatuses[t.status] || t.status, dictionaries.priorities[t.priority] || t.priority, dictionaries.difficulties[t.difficulty] || t.difficulty, joinOr(t.departments || t.department, ""), joinOr(t.robotGroups || t.robotGroup, "\u901A\u7528"), t.dueAt ? new Date(t.dueAt).toLocaleDateString("zh-CN") : "", owner?.name || "", `${t.progressPercent}%`]);
  });
  downloadCsv("\u4EFB\u52A1\u5217\u8868.csv", rows);
}
async function exportRankingsCsv() {
  const rows = [["\u6392\u540D", "\u59D3\u540D", "\u8EAB\u4EFD", "\u90E8\u95E8", "\u7814\u4E60\u70B9", "\u5DE5\u65F6\u70B9", "\u7BA1\u7406\u70B9", "\u7EFC\u5408\u8D21\u732E"]];
  const { getLeaderboard } = await import("./query-KC33TORI.js");
  const entries = getLeaderboard("composite", "total");
  entries.forEach((entry, i) => {
    rows.push([String(i + 1), entry.member.name, dictionaries.identities[entry.member.identity] || entry.member.identity, entry.member.departments.join(";"), String(entry.values.study), String(entry.values.labor), String(entry.values.management), String(entry.values.composite)]);
  });
  downloadCsv("\u79EF\u5206\u6392\u884C.csv", rows);
}
function downloadCsv(filename, rows) {
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}
export {
  exportMembersCsv,
  exportRankingsCsv,
  exportTasksCsv,
  handleMemberForm,
  handleProfileContentForm,
  handleRetireForm,
  handleSensitiveActionForm,
  handleSettingsForm
};
