import { state } from "./state.js";

export function getCurrentUser() {
  return state.database?.users.find((user) => user.id === state.currentUserId) || null;
}

export function getCurrentMember() {
  const user = getCurrentUser();
  if (!user?.memberId) {
    return null;
  }
  return getMemberById(user.memberId);
}

export function getTaskById(taskId) {
  return state.database.tasks.find((task) => task.id === taskId) || null;
}

export function getMemberById(memberId) {
  const persistedMember = state.database.members.find((member) => member.id === memberId);
  if (persistedMember) {
    return persistedMember;
  }
  const hiddenAccount = getHiddenAccountUserByMemberId(memberId);
  return hiddenAccount ? buildHiddenAccountMember(hiddenAccount) : null;
}

export function getApprovalById(approvalId) {
  return state.database.approvals.find((approval) => approval.id === approvalId) || null;
}

function getHiddenAccountUserByMemberId(memberId) {
  if (!memberId) {
    return null;
  }
  return state.database.users.find(
    (user) => user.memberId === memberId && user.hiddenFromDirectory === true && Boolean(user.role)
  ) || null;
}

function buildHiddenAccountMember(user) {
  return {
    id: user.memberId,
    userId: user.id,
    name: user.name || user.username || user.email,
    avatar: "",
    phone: user.phone || "",
    identity: user.identity || "captain",
    role: user.role || "admin",
    departments: Array.isArray(user.departments) ? [...user.departments] : [],
    directions: Array.isArray(user.directions) ? [...user.directions] : [],
    robotGroups: Array.isArray(user.robotGroups) ? [...user.robotGroups] : [],
    positions: Array.isArray(user.positions) ? [...user.positions] : [],
    skillTags: Array.isArray(user.skillTags) ? [...user.skillTags] : [],
    joinDate: user.createdAt || new Date().toISOString(),
    memberStatus: "normal",
    bio: user.bio || "站点隐藏管理员账号",
    hiddenFromDirectory: true,
  };
}

export function updateMemberProfileFields(memberId, profileFields) {
  const persistedMember = state.database.members.find((member) => member.id === memberId);
  if (persistedMember) {
    Object.assign(persistedMember, profileFields);
    return true;
  }
  const hiddenAccount = getHiddenAccountUserByMemberId(memberId);
  if (!hiddenAccount) {
    return false;
  }
  Object.assign(hiddenAccount, profileFields);
  return true;
}

export function getTaskParticipantRecords(taskId) {
  return state.database.taskParticipants.filter((participant) => participant.taskId === taskId);
}

export function getTaskParticipantRecordsByMember(memberId) {
  return state.database.taskParticipants.filter((participant) => participant.memberId === memberId);
}

export function getActiveParticipantCount(taskId) {
  return getTaskParticipantRecords(taskId).filter((item) => item.status === "involved").length;
}
