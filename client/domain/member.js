import { state, dictionaries } from "../core/state.js";
import { uid, hashPassword } from "../core/security.js";
import { parseList, clamp, toArray, joinOr } from "../core/utils.js";
import { saveDatabase, saveSession } from "../core/database.js";
import { clearModalStack, popModal } from "../core/modal.js";
import { getRoleForIdentity, ensureVisibleRoute, canDeleteAllGeneratedData, canMemberParticipateInTasks, isRetiredMember, isDisabledMember, getLifecycleBlockingTasks } from "./permissions.js";
import { getCurrentUser, getCurrentMember, getMemberById, getLifecycleActionDefinition } from "./query.js";
import { pushFlash } from "../core/services.js";

export async function handleMemberForm(form) {
  const formData = new FormData(form);
  const member = getMemberById(String(formData.get("memberId") || ""));
  if (!member) { pushFlash("成员不存在。", "info"); return; }

  member.name = String(formData.get("name") || "").trim();
  member.phone = String(formData.get("phone") || "").trim();
  member.identity = String(formData.get("identity") || member.identity);
  member.role = getRoleForIdentity(member.identity);
  const nextMemberStatus = String(formData.get("memberStatus") || member.memberStatus);
  if (["retired", "disabled"].includes(nextMemberStatus)) { pushFlash("退休和停用请使用专用操作按钮执行。", "info"); return; }
  member.memberStatus = nextMemberStatus;
  member.departments = parseList(String(formData.get("departments") || "")).slice(0, 1);
  member.directions = parseList(String(formData.get("directions") || ""));
  member.robotGroups = parseList(String(formData.get("robotGroups") || ""));
  member.skillTags = parseList(String(formData.get("skillTags") || ""));
  member.bio = String(formData.get("bio") || "").trim();

  const user = state.database.users.find((item) => item.memberId === member.id);
  if (user) user.status = member.memberStatus === "pending_review" ? "pending" : "active";

  if (!(await saveDatabase())) return;
  clearModalStack();
  pushFlash("成员资料已更新。", "info");
}

export async function handleProfileContentForm(form) {
  const member = getCurrentMember();
  if (!member) return;
  const formData = new FormData(form);
  const updated = {
    phone: String(formData.get("phone") || "").trim(),
    skillTags: parseList(String(formData.get("skillTags") || "")),
    bio: String(formData.get("bio") || "").trim(),
  };
  if (!(await handleUpdateMemberProfile(member, updated))) return;
  clearModalStack();
  pushFlash("个人资料已更新。", "info");
}

async function handleUpdateMemberProfile(member, updates) {
  Object.assign(member, updates);
  return await saveDatabase();
}

export async function handleSettingsForm(form) {
  if (!canDeleteAllGeneratedData()) { pushFlash("只有管理员可以修改系统设置。", "info"); return; }
  const formData = new FormData(form);
  state.database.settings.middleJoinDiscount = clamp(Number(formData.get("middleJoinDiscount") || 0.5), 0, 1);
  state.database.settings.overduePointDiscount = clamp(Number(formData.get("overduePointDiscount") || 0.5), 0, 1);
  state.database.settings.pointPrecision = Math.round(clamp(Number(formData.get("pointPrecision") || 1), 0, 2));
  state.database.settings.hardTaskNeedsApproval = String(formData.get("hardTaskNeedsApproval") || "true") === "true";
  if (!(await saveDatabase())) return;
  pushFlash("系统设置已保存。", "info");
}

export async function handleSensitiveActionForm(form) {
  const currentUser = getCurrentUser();
  if (!currentUser || state.modal?.type !== "sensitive-action") {
    pushFlash("当前无法执行该敏感操作。", "info"); return;
  }
  const formData = new FormData(form);
  const operatorEmail = String(formData.get("operatorEmail") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "").trim();
  if (!operatorEmail || !password) { pushFlash("请输入当前操作者账号和密码。", "error"); return; }
  if (operatorEmail !== currentUser.email.toLowerCase()) { pushFlash("确认账号必须填写当前登录账号邮箱。", "error"); return; }
  const hashedPassword = await hashPassword(password);
  if (hashedPassword !== currentUser.passwordHash && password !== currentUser.passwordHash) { pushFlash("账号或密码校验失败，未执行该操作。", "error"); return; }

  const actionConfig = getLifecycleActionDefinition(state.modal.actionKey, state.modal.memberId);
  if (!actionConfig) { pushFlash("敏感操作已失效，请重新发起。", "info"); return; }

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
  if (member.hiddenFromDirectory) { pushFlash("系统隐藏管理员账号不允许执行该操作。", "info"); return false; }
  if (actionKey === "restore-member") {
    if (!user || user.status !== "disabled") { pushFlash("当前成员账号不是停用状态，无法恢复。", "info"); return false; }
  } else {
    const blockers = getLifecycleBlockingTasks(member.id);
    if (blockers.length) { pushFlash(`该成员仍有关联中的任务：${blockers.map((task) => task.title).join("、")}。请先在任务详情里调整参与成员或负责人。`, "error"); return false; }
  }
  if (actionKey === "retire-self" && member.memberStatus === "retired") { pushFlash("当前账号已经是退休状态。", "info"); return false; }
  if (actionKey === "force-retire-member" && member.memberStatus === "retired") { pushFlash("该成员已经是退休状态。", "info"); return false; }
  if (actionKey === "disable-member" && user?.status === "disabled") { pushFlash("该成员账号已经停用。", "info"); return false; }

  member.memberStatus = targetStatus;
  if (user) user.status = targetUserStatus;
  if (!(await saveDatabase())) return false;
  if (actionKey === "disable-member" && user?.id === state.currentUserId) saveSession();
  pushFlash(successMessage, "info");
  return true;
}

export async function handleRetireForm(form) {
  const member = getCurrentMember();
  if (!member) { pushFlash("请先登录。", "info"); return; }
  if (member.hiddenFromDirectory) { pushFlash("系统隐藏管理员账号不允许执行该操作。", "info"); return; }
  if (member.memberStatus === "retired") { pushFlash("当前账号已经是退休状态。", "info"); return; }

  const formData = new FormData(form);
  const reason = String(formData.get("reason") || "").trim();
  const message = String(formData.get("message") || "").trim();
  if (!reason) { pushFlash("请填写退役原因。", "info"); return; }

  const blockers = getLifecycleBlockingTasks(member.id);
  if (blockers.length) {
    const taskList = blockers.map((task) => `《${task.title}》`).join("、");
    pushFlash(`当前仍有未完成的任务：${taskList}。请先完成或移交这些任务后再申请退役。`, "info");
    return;
  }

  const confirmed = window.confirm(`确认要申请退役吗？\n\n退役后账号将切换为只读状态，不再参与任务、积分与排行，但历史记录会保留。此操作不可撤销。`);
  if (!confirmed) return;

  member.memberStatus = "retired";
  member.retireReason = reason;
  member.retireMessage = message;
  member.retiredAt = new Date().toISOString();
  if (!(await saveDatabase())) return;
  clearModalStack();
  pushFlash("已退役，当前账号已切换为只读状态。", "info");
}

export async function exportMembersCsv() {
  const rows = [["姓名","成员身份","角色","部门","兵种","技能标签","状态"]];
  state.database.members.forEach((m) => {
    rows.push([m.name, dictionaries.identities[m.identity] || m.identity, dictionaries.roles[m.role] || m.role, m.departments.join(";"), m.robotGroups.join(";"), m.skillTags.join(";"), dictionaries.memberStatuses[m.memberStatus] || m.memberStatus]);
  });
  downloadCsv("成员列表.csv", rows);
}

export async function exportTasksCsv() {
  const rows = [["标题","类型","状态","优先级","难度","部门","兵种","截止日期","负责人","进度"]];
  state.database.tasks.forEach((t) => {
    const owner = getMemberById(t.ownerId);
    rows.push([t.title, dictionaries.taskTypes[t.type] || t.type, dictionaries.taskStatuses[t.status] || t.status, dictionaries.priorities[t.priority] || t.priority, dictionaries.difficulties[t.difficulty] || t.difficulty, joinOr(t.departments || t.department, ""), joinOr(t.robotGroups || t.robotGroup, "通用"), t.dueAt ? new Date(t.dueAt).toLocaleDateString("zh-CN") : "", owner?.name || "", `${t.progressPercent}%`]);
  });
  downloadCsv("任务列表.csv", rows);
}

export async function exportRankingsCsv() {
  const rows = [["排名","姓名","身份","部门","研习点","工时点","管理点","综合贡献"]];
  const { getLeaderboard } = await import("./query.js");
  const entries = getLeaderboard("composite", "total");
  entries.forEach((entry, i) => {
    rows.push([String(i + 1), entry.member.name, dictionaries.identities[entry.member.identity] || entry.member.identity, entry.member.departments.join(";"), String(entry.values.study), String(entry.values.labor), String(entry.values.management), String(entry.values.composite)]);
  });
  downloadCsv("积分排行.csv", rows);
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
