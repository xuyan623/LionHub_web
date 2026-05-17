export const LEGACY_STORAGE_KEY = "lion-hub-db-v1";
export const SESSION_KEY = "lion-hub-session-v1";
export const API_KEY_STORAGE_KEY = "lion-hub-apikey-v1";
export const VERSION_HASH_KEY = "lion-hub-build-v1";
export const STALE_KEY = "stale";
export const DATABASE_API_URL = "/api/database";
export const SHARED_SYNC_INTERVAL_MS = 15000;
export const FILES_PER_PAGE = 20;
export const UPLOAD_MAX_SIZE_BYTES = 5 * 1024 * 1024;
export const MAX_UPLOAD_COUNT = 5;

export const dictionaries = {
  identities: {
    captain: "队长",
    vice_captain: "副队长",
    project_manager: "项目管理",
    formal: "正式队员",
    reserve: "梯队队员",
    seedling: "育苗队员",
    teacher: "指导老师",
  },
  identityRoleMap: {
    captain: "admin",
    vice_captain: "admin",
    project_manager: "admin",
    formal: "formal_member",
    reserve: "reserve",
    seedling: "seedling",
    teacher: "teacher",
  },
  taskStatuses: {
    todo: "待开始",
    in_progress: "进行中",
    pending_review: "待审核",
    completed: "已完成",
    overdue: "已逾期",
  },
  priorities: {
    low: "低",
    medium: "中",
    high: "高",
    urgent: "紧急",
  },
  difficulties: {
    entry: "入门",
    normal: "普通",
    advanced: "进阶",
    hard: "高难",
    core: "核心",
  },
  taskTypes: {
    research: "技术研发任务",
    project: "兵种项目任务",
    training: "学习培训任务",
    maintenance: "运维维护任务",
    operation: "运营宣传任务",
    finance: "招商财务任务",
    competition: "比赛筹备任务",
    emergency: "紧急任务",
    long_term: "长期项目任务",
    purchase: "物资采购",
    documentation: "文档沉淀",
    duty: "值班任务",
    review: "复盘总结",
  },
  approvalTypes: {
    registration: "注册审核",
    join: "高难任务加入审批",
    completion: "任务完成审核",
    settlement: "点数结算审核",
    compensation: "补偿点数记录",
    promotion: "成员晋升记录",
    status_change: "变岗申请",
  },
  approvalStatuses: {
    pending: "待审核",
    approved: "通过",
    rejected: "拒绝",
    returned: "驳回修改",
  },
  pointTypes: {
    study: "研习点",
    labor: "工时点",
    management: "管理点",
    compensation: "补偿点",
  },
  loadLevels: {
    idle: "空闲",
    normal: "正常",
    busy: "偏忙",
    overload: "过载",
  },
};

export const options = {
  departments: ["管理层", "机械组", "电控组", "算法组", "运营组"],
  directions: ["硬件", "软件", "视觉", "导航", "宣传", "招商", "财务"],
  robotGroups: ["步兵", "哨兵", "英雄", "工程", "无人机", "飞镖", "雷达"],
  taskTypes: Object.keys(dictionaries.taskTypes),
  taskStatuses: Object.keys(dictionaries.taskStatuses),
  marketTaskStatuses: ["market_open", ...Object.keys(dictionaries.taskStatuses)],
  priorities: Object.keys(dictionaries.priorities),
  difficulties: Object.keys(dictionaries.difficulties),
  identities: Object.keys(dictionaries.identities),
};

export const routes = [
  { id: "dashboard", label: "仪表盘", audience: ["admin", "leader", "formal_member", "reserve", "seedling", "teacher"] },
  { id: "market", label: "任务市场", audience: ["admin", "leader", "formal_member", "reserve", "seedling", "teacher"] },
  { id: "myTasks", label: "我的任务", audience: ["admin", "leader", "formal_member", "reserve", "seedling"] },
  { id: "taskManagement", label: "任务管理", audience: ["admin", "leader", "formal_member"] },
  { id: "members", label: "成员管理", audience: ["admin", "leader", "formal_member", "reserve", "seedling", "teacher"] },
  { id: "projects", label: "兵种项目", audience: ["admin", "leader", "formal_member", "reserve", "seedling", "teacher"] },
  { id: "rankings", label: "积分排行", audience: ["admin", "leader", "formal_member", "reserve", "seedling", "teacher"] },
  { id: "reviews", label: "审核中心", audience: ["admin", "leader"] },
  { id: "profile", label: "个人中心", audience: ["admin", "leader", "formal_member", "reserve", "seedling", "teacher"] },
  { id: "settings", label: "系统设置", audience: ["admin"] },
];

const PERSISTENT_STATE_KEY = "lion-hub-ui-state-v1";
const PERSISTENT_KEYS = [
  "taskManageView",
  "memberView",
  "rankingTab",
  "rankingRange",
  "reviewTab",
  "marketFilters",
  "memberFilters",
  "fileFilters",
  "tableSort",
];

const DEFAULT_MARKET_FILTERS = {
  query: "",
  type: "all",
  department: "all",
  direction: "all",
  robotGroup: "all",
  difficulty: "all",
  status: "market_open",
  audience: "",
};

const DEFAULT_MEMBER_FILTERS = {
  query: "",
  department: "all",
  robotGroup: "all",
};

const DEFAULT_FILE_FILTERS = {
  query: "",
  source: "all",
};

const DEFAULT_TABLE_SORT = {
  column: "",
  direction: "asc",
};

export function createDefaultMarketFilters() {
  return { ...DEFAULT_MARKET_FILTERS };
}

export function createDefaultMemberFilters() {
  return { ...DEFAULT_MEMBER_FILTERS };
}

export function createDefaultFileFilters() {
  return { ...DEFAULT_FILE_FILTERS };
}

function loadPersistentState() {
  try {
    const raw = localStorage.getItem(PERSISTENT_STATE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

export function savePersistentState(currentState = state) {
  try {
    const snapshot = {};
    for (const key of PERSISTENT_KEYS) {
      snapshot[key] = currentState[key];
    }
    localStorage.setItem(PERSISTENT_STATE_KEY, JSON.stringify(snapshot));
  } catch {
    // Ignore quota/storage errors
  }
}

const persisted = loadPersistentState();

export const state = {
  database: null,
  databaseReady: false,
  databaseHydrating: false,
  databaseVersion: 0,
  renderCycleVersion: 0,
  currentUserId: null,
  route: "dashboard",
  authMode: "login",
  authFeedback: "",
  initError: "",
  flash: "",
  formLoading: null,
  flashTone: "info",
  flashTimer: null,
  marketFilters: { ...DEFAULT_MARKET_FILTERS, ...persisted.marketFilters },
  marketPage: 0,
  memberFilters: { ...DEFAULT_MEMBER_FILTERS, ...persisted.memberFilters },
  memberPage: 0,
  rankingTab: persisted.rankingTab ?? "composite",
  rankingRange: persisted.rankingRange ?? "total",
  rankingPage: 0,
  taskManageView: persisted.taskManageView ?? "kanban",
  reviewTab: persisted.reviewTab ?? "registration",
  modal: null,
  modalStack: [],
  mobileNavOpen: false,
  settingsFiles: null,
  settingsFileLoading: false,
  attachmentsIndex: null,
  settingsFilePage: 0,
  fileFilters: { ...DEFAULT_FILE_FILTERS, ...persisted.fileFilters },
  rememberMe: true,
  tableSort: { ...DEFAULT_TABLE_SORT, ...persisted.tableSort },
  notifPanelOpen: false,
  loadingRoute: false,
  modalScrollY: 0,
  memberView: persisted.memberView ?? "cards",
};

export let sharedSyncTimer = null;
export function setSharedSyncTimer(timer) {
  sharedSyncTimer = timer;
}

export const appRoot = document.getElementById("app");
