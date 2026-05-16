import {
  addRecord,
  removeWhere
} from "./chunk-GTV4JDSP.js";
import {
  clearModalStack,
  ensureDatabaseReady,
  ensureSharedDataSync,
  pushFlash,
  renderApp,
  saveDatabase,
  saveSession
} from "./chunk-U4IZDVAT.js";
import {
  createNotification,
  getReviewerUserIds,
  removeNotificationsByUser
} from "./chunk-UOGRBFTX.js";
import "./chunk-4ZHULIGH.js";
import {
  ensureVisibleRoute,
  getCurrentUser,
  getMemberById,
  getRoleForIdentity,
  parseList
} from "./chunk-RFGSPZ7J.js";
import {
  uid
} from "./chunk-UQLSNBUY.js";
import {
  requestJson
} from "./chunk-AFQ47FFH.js";
import {
  API_KEY_STORAGE_KEY,
  SESSION_KEY,
  state
} from "./chunk-NDL62ULM.js";

// client/domain/auth.js
async function handleLogin(form) {
  const formData = new FormData(form);
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "").trim();
  state.rememberMe = String(formData.get("rememberMe") || "") === "on";
  if (!email || !password) {
    state.authFeedback = "\u90AE\u7BB1\u548C\u5BC6\u7801\u4E0D\u80FD\u4E3A\u7A7A\u3002";
    renderApp();
    return;
  }
  let authResult;
  try {
    authResult = await requestJson("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
  } catch (error) {
    sessionStorage.removeItem(API_KEY_STORAGE_KEY);
    state.authFeedback = error instanceof Error && error.message ? error.message : "\u767B\u5F55\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5\u3002";
    renderApp();
    return;
  }
  if (authResult?.apiKey) {
    sessionStorage.setItem(API_KEY_STORAGE_KEY, authResult.apiKey);
  } else {
    sessionStorage.removeItem(API_KEY_STORAGE_KEY);
  }
  state.currentUserId = authResult.userId;
  state.authFeedback = "";
  await ensureDatabaseReady();
  const user = getCurrentUser();
  if (!user) {
    state.currentUserId = null;
    state.authFeedback = "\u767B\u5F55\u540E\u672A\u627E\u5230\u8D26\u53F7\u6570\u636E\uFF0C\u8BF7\u5237\u65B0\u9875\u9762\u540E\u91CD\u8BD5\u3002";
    renderApp();
    return;
  }
  user.lastLoginAt = (/* @__PURE__ */ new Date()).toISOString();
  await saveDatabase();
  if (state.rememberMe) {
    saveSession(state.currentUserId);
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
  ensureSharedDataSync();
  ensureVisibleRoute();
  renderApp();
}
async function handleRegister(form) {
  const formData = new FormData(form);
  const username = String(formData.get("username") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const phone = String(formData.get("phone") || "").trim();
  const department = String(formData.get("department") || "").trim();
  const password = String(formData.get("password") || "").trim();
  const confirmPassword = String(formData.get("confirmPassword") || "").trim();
  const bio = String(formData.get("bio") || "").trim();
  const skillTags = parseList(String(formData.get("skills") || ""));
  if (!username || !name || !email || !phone || !department || !password) {
    state.authFeedback = "\u8BF7\u5B8C\u6574\u586B\u5199\u6CE8\u518C\u4FE1\u606F\u3002";
    renderApp();
    return;
  }
  if (password !== confirmPassword) {
    state.authFeedback = "\u4E24\u6B21\u8F93\u5165\u7684\u5BC6\u7801\u4E0D\u4E00\u81F4\uFF0C\u8BF7\u91CD\u65B0\u8F93\u5165\u3002";
    renderApp();
    return;
  }
  if (state.database.users.some((user) => user.email.toLowerCase() === email)) {
    state.authFeedback = "\u8BE5\u90AE\u7BB1\u5DF2\u88AB\u6CE8\u518C\uFF0C\u8BF7\u76F4\u63A5\u767B\u5F55\u3002";
    renderApp();
    return;
  }
  const userId = uid("user");
  const memberId = uid("member");
  const now = (/* @__PURE__ */ new Date()).toISOString();
  addRecord("users", { id: userId, memberId, username, email, passwordHash: password, status: "pending", createdAt: now, lastLoginAt: null });
  addRecord("members", {
    id: memberId,
    userId,
    name,
    avatar: "",
    phone,
    identity: "seedling",
    role: getRoleForIdentity("seedling"),
    departments: [department],
    directions: [],
    robotGroups: [],
    positions: [],
    skillTags,
    joinDate: now,
    memberStatus: "pending_review",
    bio: bio || "\u5F85\u5BA1\u6838\u65B0\u6210\u5458"
  });
  const approval = { id: uid("approval"), type: "registration", targetId: memberId, submitterId: memberId, approverId: null, status: "pending", comment: "\u65B0\u6210\u5458\u6CE8\u518C\u7533\u8BF7", createdAt: now, reviewedAt: null };
  addRecord("approvals", approval);
  const reviewerUserIds = getReviewerUserIds();
  reviewerUserIds.forEach((reviewerId) => {
    createNotification(reviewerId, `\u65B0\u6210\u5458 ${name} \u63D0\u4EA4\u4E86\u6CE8\u518C\u7533\u8BF7\uFF0C\u7B49\u5F85\u5BA1\u6838`, { sourceId: approval.id, sourceType: "approval", memberId, type: "info" });
  });
  if (!await saveDatabase()) return;
  state.currentUserId = userId;
  saveSession(state.currentUserId);
  ensureSharedDataSync();
  state.authFeedback = "";
  renderApp();
}
async function handleRegistrationEdit(form) {
  const user = getCurrentUser();
  const member = user ? getMemberById(user.memberId) : null;
  if (!user || user.status === "active" || !member) {
    pushFlash("\u5F53\u524D\u8D26\u53F7\u4E0D\u5728\u5F85\u5BA1\u6838\u72B6\u6001\uFF0C\u65E0\u6CD5\u4FEE\u6539\u6CE8\u518C\u4FE1\u606F\u3002", "info");
    return;
  }
  const formData = new FormData(form);
  const username = String(formData.get("username") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const phone = String(formData.get("phone") || "").trim();
  const department = String(formData.get("department") || "").trim();
  const bio = String(formData.get("bio") || "").trim();
  const skillTags = parseList(String(formData.get("skills") || ""));
  if (!username || !name || !email || !phone || !department) {
    pushFlash("\u8BF7\u5B8C\u6574\u586B\u5199\u6CE8\u518C\u4FE1\u606F\u3002", "error");
    return;
  }
  const duplicatedUser = state.database.users.find((item) => item.id !== user.id && item.email.toLowerCase() === email);
  if (duplicatedUser) {
    pushFlash("\u8BE5\u90AE\u7BB1\u5DF2\u88AB\u5176\u4ED6\u8D26\u53F7\u4F7F\u7528\uFF0C\u8BF7\u66F4\u6362\u540E\u91CD\u8BD5\u3002", "error");
    return;
  }
  user.username = username;
  user.email = email;
  member.name = name;
  member.phone = phone;
  member.departments = [department];
  member.skillTags = skillTags;
  member.bio = bio;
  if (!await saveDatabase()) return;
  clearModalStack();
  pushFlash("\u6CE8\u518C\u4FE1\u606F\u5DF2\u66F4\u65B0\u3002", "info");
}
async function cancelPendingRegistration() {
  const user = getCurrentUser();
  const member = user ? getMemberById(user.memberId) : null;
  if (!user || user.status === "active") {
    pushFlash("\u5F53\u524D\u8D26\u53F7\u4E0D\u5728\u5F85\u5BA1\u6838\u72B6\u6001\uFF0C\u65E0\u6CD5\u53D6\u6D88\u6CE8\u518C\u3002", "info");
    return;
  }
  const confirmed = window.confirm("\u53D6\u6D88\u6CE8\u518C\u540E\uFF0C\u5F53\u524D\u5F85\u5BA1\u6838\u8D26\u53F7\u548C\u7533\u8BF7\u8BB0\u5F55\u4F1A\u88AB\u5220\u9664\u3002\u786E\u5B9A\u7EE7\u7EED\u5417\uFF1F");
  if (!confirmed) return;
  removeWhere("users", (item) => item.id === user.id);
  if (member) {
    removeWhere("members", (item) => item.id === member.id);
    removeWhere("approvals", (approval) => approval.targetId === member.id && approval.submitterId === member.id);
  }
  removeNotificationsByUser(user.id);
  if (!await saveDatabase()) return;
  state.currentUserId = null;
  clearModalStack();
  state.authMode = "login";
  state.authFeedback = "";
  saveSession(state.currentUserId);
  renderApp();
}
async function handlePasswordChange(form) {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    pushFlash("\u8BF7\u5148\u767B\u5F55\u3002", "info");
    return;
  }
  const formData = new FormData(form);
  const oldPassword = String(formData.get("oldPassword") || "").trim();
  const newPassword = String(formData.get("newPassword") || "").trim();
  const confirmPassword = String(formData.get("confirmPassword") || "").trim();
  if (!oldPassword || !newPassword || !confirmPassword) {
    pushFlash("\u8BF7\u5B8C\u6574\u586B\u5199\u5BC6\u7801\u4FE1\u606F\u3002", "error");
    return;
  }
  if (newPassword !== confirmPassword) {
    pushFlash("\u4E24\u6B21\u8F93\u5165\u7684\u65B0\u5BC6\u7801\u4E0D\u4E00\u81F4\u3002", "error");
    return;
  }
  if (newPassword.length < 6) {
    pushFlash("\u65B0\u5BC6\u7801\u957F\u5EA6\u4E0D\u80FD\u5C11\u4E8E 6 \u4F4D\u3002", "error");
    return;
  }
  if (currentUser.passwordHash !== oldPassword) {
    pushFlash("\u5F53\u524D\u5BC6\u7801\u9519\u8BEF\u3002", "error");
    return;
  }
  currentUser.passwordHash = newPassword;
  if (!await saveDatabase()) return;
  clearModalStack();
  pushFlash("\u5BC6\u7801\u5DF2\u4FEE\u6539\u6210\u529F\u3002", "info");
}
export {
  cancelPendingRegistration,
  handleLogin,
  handlePasswordChange,
  handleRegister,
  handleRegistrationEdit
};
