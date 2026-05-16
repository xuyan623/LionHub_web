import { state, API_KEY_STORAGE_KEY, SESSION_KEY } from "../core/state.js";
import { uid } from "../core/security.js";
import { parseList } from "../core/utils.js";
import { addRecord, removeWhere } from "../core/data-access.js";
import { saveDatabase } from "../core/database.js";
import { saveSession } from "../core/session.js";
import { clearModalStack } from "../core/modal.js";
import { getRoleForIdentity, ensureVisibleRoute } from "./permissions.js";
import { getCurrentUser, getMemberById, getApprovalById } from "./query.js";
import { pushFlash, renderApp } from "../core/services.js";
import { requestJson } from "../core/http.js";
import { removeNotificationsByUser, getReviewerUserIds, createNotification } from "./notifications.js";

export async function handleLogin(form) {
  const formData = new FormData(form);
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "").trim();
  state.rememberMe = String(formData.get("rememberMe") || "") === "on";
  if (!email || !password) {
    state.authFeedback = "邮箱和密码不能为空。";
    renderApp();
    return;
  }
  const user = state.database.users.find((item) => item.email.toLowerCase() === email);
  if (!user) {
    state.authFeedback = "账号不存在，请确认邮箱或先注册。";
    renderApp();
    return;
  }
  if (user.passwordHash !== password) {
    state.authFeedback = "密码错误，请重新输入。";
    renderApp();
    return;
  }
  try {
    const authResult = await requestJson("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (authResult?.apiKey) {
      sessionStorage.setItem(API_KEY_STORAGE_KEY, authResult.apiKey);
    }
  } catch {
    sessionStorage.removeItem(API_KEY_STORAGE_KEY);
  }
  user.lastLoginAt = new Date().toISOString();
  state.currentUserId = user.id;
  state.authFeedback = "";
  await saveDatabase();
  if (state.rememberMe) {
    saveSession(state.currentUserId);
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
  ensureVisibleRoute();
  renderApp();
}

export async function handleRegister(form) {
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
     state.authFeedback = "请完整填写注册信息。";
     renderApp();
     return;
   }
   if (password !== confirmPassword) {
     state.authFeedback = "两次输入的密码不一致，请重新输入。";
     renderApp();
     return;
   }
   if (state.database.users.some((user) => user.email.toLowerCase() === email)) {
    state.authFeedback = "该邮箱已被注册，请直接登录。";
    renderApp();
    return;
  }

  const userId = uid("user");
  const memberId = uid("member");
  const now = new Date().toISOString();

  addRecord("users", { id: userId, memberId, username, email, passwordHash: password, status: "pending", createdAt: now, lastLoginAt: null });
  addRecord("members", {
    id: memberId, userId, name, avatar: "", phone, identity: "seedling", role: getRoleForIdentity("seedling"),
    departments: [department], directions: [], robotGroups: [], positions: [], skillTags, joinDate: now, memberStatus: "pending_review", bio: bio || "待审核新成员",
  });
  const approval = { id: uid("approval"), type: "registration", targetId: memberId, submitterId: memberId, approverId: null, status: "pending", comment: "新成员注册申请", createdAt: now, reviewedAt: null };
  addRecord("approvals", approval);

  // Notify reviewers/admins of new registration
  const reviewerUserIds = getReviewerUserIds();
  reviewerUserIds.forEach((reviewerId) => {
    createNotification(reviewerId, `新成员 ${name} 提交了注册申请，等待审核`, { sourceId: approval.id, sourceType: "approval", memberId: memberId, type: "info" });
  });

  if (!(await saveDatabase())) return;
  state.currentUserId = userId;
  saveSession(state.currentUserId);
  state.authFeedback = "";
  renderApp();
}

export async function handleRegistrationEdit(form) {
  const user = getCurrentUser();
  const member = user ? getMemberById(user.memberId) : null;
  if (!user || user.status === "active" || !member) {
    pushFlash("当前账号不在待审核状态，无法修改注册信息。", "info");
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
    pushFlash("请完整填写注册信息。", "error");
    return;
  }
  const duplicatedUser = state.database.users.find((item) => item.id !== user.id && item.email.toLowerCase() === email);
  if (duplicatedUser) { pushFlash("该邮箱已被其他账号使用，请更换后重试。", "error"); return; }

  user.username = username;
  user.email = email;
  member.name = name;
  member.phone = phone;
  member.departments = [department];
  member.skillTags = skillTags;
  member.bio = bio;

  if (!(await saveDatabase())) return;
  clearModalStack();
  pushFlash("注册信息已更新。", "info");
}

export async function cancelPendingRegistration() {
  const user = getCurrentUser();
  const member = user ? getMemberById(user.memberId) : null;
  if (!user || user.status === "active") {
    pushFlash("当前账号不在待审核状态，无法取消注册。", "info");
    return;
  }
  const confirmed = window.confirm("取消注册后，当前待审核账号和申请记录会被删除。确定继续吗？");
  if (!confirmed) return;

  removeWhere("users", (item) => item.id === user.id);
  if (member) {
    removeWhere("members", (item) => item.id === member.id);
    removeWhere("approvals", (approval) => approval.targetId === member.id && approval.submitterId === member.id);
  }
  removeNotificationsByUser(user.id);
  if (!(await saveDatabase())) return;
  state.currentUserId = null;
  clearModalStack();
  state.authMode = "login";
  state.authFeedback = "";
  saveSession(state.currentUserId);
  renderApp();
}

export async function handlePasswordChange(form) {
  const currentUser = getCurrentUser();
  if (!currentUser) { pushFlash("请先登录。", "info"); return; }
  const formData = new FormData(form);
  const oldPassword = String(formData.get("oldPassword") || "").trim();
  const newPassword = String(formData.get("newPassword") || "").trim();
  const confirmPassword = String(formData.get("confirmPassword") || "").trim();
  if (!oldPassword || !newPassword || !confirmPassword) {
    pushFlash("请完整填写密码信息。", "error"); return;
  }
  if (newPassword !== confirmPassword) {
    pushFlash("两次输入的新密码不一致。", "error"); return;
  }
  if (newPassword.length < 6) {
    pushFlash("新密码长度不能少于 6 位。", "error"); return;
  }
  if (currentUser.passwordHash !== oldPassword) {
    pushFlash("当前密码错误。", "error"); return;
  }
  currentUser.passwordHash = newPassword;
  if (!(await saveDatabase())) return;
  clearModalStack();
  pushFlash("密码已修改成功。", "info");
}
