// client/core/state.js
var LEGACY_STORAGE_KEY = "lion-hub-db-v1";
var SESSION_KEY = "lion-hub-session-v1";
var API_KEY_STORAGE_KEY = "lion-hub-apikey-v1";
var DATABASE_API_URL = "/api/database";
var SHARED_SYNC_INTERVAL_MS = 15e3;
var FILES_PER_PAGE = 20;
var UPLOAD_MAX_SIZE_BYTES = 5 * 1024 * 1024;
var MAX_UPLOAD_COUNT = 5;
var dictionaries = {
  roles: {
    admin: "\u7BA1\u7406\u5458",
    leader: "\u7EC4\u957F",
    formal_member: "\u6B63\u5F0F\u961F\u5458",
    reserve: "\u68AF\u961F\u961F\u5458",
    seedling: "\u80B2\u82D7\u961F\u5458",
    teacher: "\u6307\u5BFC\u8001\u5E08"
  },
  identities: {
    captain: "\u961F\u957F",
    vice_captain: "\u526F\u961F\u957F",
    project_manager: "\u9879\u76EE\u7BA1\u7406",
    formal: "\u6B63\u5F0F\u961F\u5458",
    reserve: "\u68AF\u961F\u961F\u5458",
    seedling: "\u80B2\u82D7\u961F\u5458",
    teacher: "\u6307\u5BFC\u8001\u5E08"
  },
  identityRoleMap: {
    captain: "admin",
    vice_captain: "admin",
    project_manager: "admin",
    formal: "formal_member",
    reserve: "reserve",
    seedling: "seedling",
    teacher: "teacher"
  },
  memberStatuses: {
    pending_review: "\u5F85\u5BA1\u6838",
    normal: "\u6B63\u5E38",
    retired: "\u5DF2\u9000\u4F11",
    disabled: "\u5DF2\u505C\u7528",
    exited: "\u5DF2\u9000\u51FA"
  },
  taskStatuses: {
    todo: "\u5F85\u5F00\u59CB",
    in_progress: "\u8FDB\u884C\u4E2D",
    pending_review: "\u5F85\u5BA1\u6838",
    completed: "\u5DF2\u5B8C\u6210",
    overdue: "\u5DF2\u903E\u671F"
  },
  priorities: {
    low: "\u4F4E",
    medium: "\u4E2D",
    high: "\u9AD8",
    urgent: "\u7D27\u6025"
  },
  difficulties: {
    entry: "\u5165\u95E8",
    normal: "\u666E\u901A",
    advanced: "\u8FDB\u9636",
    hard: "\u9AD8\u96BE",
    core: "\u6838\u5FC3"
  },
  taskTypes: {
    research: "\u6280\u672F\u7814\u53D1\u4EFB\u52A1",
    project: "\u5175\u79CD\u9879\u76EE\u4EFB\u52A1",
    training: "\u5B66\u4E60\u57F9\u8BAD\u4EFB\u52A1",
    maintenance: "\u8FD0\u7EF4\u7EF4\u62A4\u4EFB\u52A1",
    operation: "\u8FD0\u8425\u5BA3\u4F20\u4EFB\u52A1",
    finance: "\u62DB\u5546\u8D22\u52A1\u4EFB\u52A1",
    competition: "\u6BD4\u8D5B\u7B79\u5907\u4EFB\u52A1",
    emergency: "\u7D27\u6025\u4EFB\u52A1",
    long_term: "\u957F\u671F\u9879\u76EE\u4EFB\u52A1",
    purchase: "\u7269\u8D44\u91C7\u8D2D",
    documentation: "\u6587\u6863\u6C89\u6DC0",
    duty: "\u503C\u73ED\u4EFB\u52A1",
    review: "\u590D\u76D8\u603B\u7ED3"
  },
  approvalTypes: {
    registration: "\u6CE8\u518C\u5BA1\u6838",
    join: "\u9AD8\u96BE\u4EFB\u52A1\u52A0\u5165\u5BA1\u6279",
    completion: "\u4EFB\u52A1\u5B8C\u6210\u5BA1\u6838",
    settlement: "\u70B9\u6570\u7ED3\u7B97\u5BA1\u6838",
    compensation: "\u8865\u507F\u70B9\u6570\u8BB0\u5F55",
    promotion: "\u6210\u5458\u664B\u5347\u8BB0\u5F55",
    status_change: "\u53D8\u5C97\u7533\u8BF7"
  },
  approvalStatuses: {
    pending: "\u5F85\u5BA1\u6838",
    approved: "\u901A\u8FC7",
    rejected: "\u62D2\u7EDD",
    returned: "\u9A73\u56DE\u4FEE\u6539"
  },
  pointTypes: {
    study: "\u7814\u4E60\u70B9",
    labor: "\u5DE5\u65F6\u70B9",
    management: "\u7BA1\u7406\u70B9",
    compensation: "\u8865\u507F\u70B9"
  },
  loadLevels: {
    idle: "\u7A7A\u95F2",
    normal: "\u6B63\u5E38",
    busy: "\u504F\u5FD9",
    overload: "\u8FC7\u8F7D"
  }
};
var options = {
  departments: ["\u7BA1\u7406\u5C42", "\u673A\u68B0\u7EC4", "\u7535\u63A7\u7EC4", "\u7B97\u6CD5\u7EC4", "\u8FD0\u8425\u7EC4"],
  directions: ["\u786C\u4EF6", "\u8F6F\u4EF6", "\u89C6\u89C9", "\u5BFC\u822A", "\u5BA3\u4F20", "\u62DB\u5546", "\u8D22\u52A1"],
  robotGroups: ["\u6B65\u5175", "\u54E8\u5175", "\u82F1\u96C4", "\u5DE5\u7A0B", "\u65E0\u4EBA\u673A", "\u98DE\u9556", "\u96F7\u8FBE"],
  taskTypes: Object.keys(dictionaries.taskTypes),
  taskStatuses: Object.keys(dictionaries.taskStatuses),
  priorities: Object.keys(dictionaries.priorities),
  difficulties: Object.keys(dictionaries.difficulties),
  roles: Object.keys(dictionaries.roles),
  identities: Object.keys(dictionaries.identities),
  memberStatuses: Object.keys(dictionaries.memberStatuses)
};
var routes = [
  { id: "dashboard", label: "\u4EEA\u8868\u76D8", audience: ["admin", "leader", "formal_member", "reserve", "seedling", "teacher"] },
  { id: "market", label: "\u4EFB\u52A1\u5E02\u573A", audience: ["admin", "leader", "formal_member", "reserve", "seedling", "teacher"] },
  { id: "myTasks", label: "\u6211\u7684\u4EFB\u52A1", audience: ["admin", "leader", "formal_member", "reserve", "seedling"] },
  { id: "taskManagement", label: "\u4EFB\u52A1\u7BA1\u7406", audience: ["admin", "leader", "formal_member"] },
  { id: "members", label: "\u6210\u5458\u7BA1\u7406", audience: ["admin", "leader", "formal_member", "reserve", "seedling", "teacher"] },
  { id: "projects", label: "\u5175\u79CD\u9879\u76EE", audience: ["admin", "leader", "formal_member", "reserve", "seedling", "teacher"] },
  { id: "rankings", label: "\u79EF\u5206\u6392\u884C", audience: ["admin", "leader", "formal_member", "reserve", "seedling", "teacher"] },
  { id: "reviews", label: "\u5BA1\u6838\u4E2D\u5FC3", audience: ["admin", "leader"] },
  { id: "profile", label: "\u4E2A\u4EBA\u4E2D\u5FC3", audience: ["admin", "leader", "formal_member", "reserve", "seedling", "teacher"] },
  { id: "settings", label: "\u7CFB\u7EDF\u8BBE\u7F6E", audience: ["admin"] }
];
var PERSISTENT_STATE_KEY = "lion-hub-ui-state-v1";
var PERSISTENT_KEYS = [
  "taskManageView",
  "memberView",
  "rankingTab",
  "rankingRange",
  "reviewTab",
  "marketFilters",
  "memberFilters",
  "fileFilters",
  "tableSort"
];
var DEFAULT_MARKET_FILTERS = {
  query: "",
  type: "all",
  department: "all",
  direction: "all",
  robotGroup: "all",
  difficulty: "all",
  status: "all",
  audience: ""
};
var DEFAULT_MEMBER_FILTERS = {
  query: "",
  role: "all",
  department: "all",
  robotGroup: "all",
  status: "all"
};
var DEFAULT_FILE_FILTERS = {
  query: "",
  source: "all"
};
var DEFAULT_TABLE_SORT = {
  column: "",
  direction: "asc"
};
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
function savePersistentState(currentState = state) {
  try {
    const snapshot = {};
    for (const key of PERSISTENT_KEYS) {
      snapshot[key] = currentState[key];
    }
    localStorage.setItem(PERSISTENT_STATE_KEY, JSON.stringify(snapshot));
  } catch {
  }
}
var persisted = loadPersistentState();
var state = {
  database: null,
  databaseReady: false,
  databaseHydrating: false,
  databaseVersion: 0,
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
  memberFilters: { ...DEFAULT_MEMBER_FILTERS, ...persisted.memberFilters },
  rankingTab: persisted.rankingTab ?? "composite",
  rankingRange: persisted.rankingRange ?? "total",
  taskManageView: persisted.taskManageView ?? "kanban",
  reviewTab: persisted.reviewTab ?? "registration",
  modal: null,
  modalStack: [],
  mobileNavOpen: false,
  globalSearch: "",
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
  memberView: persisted.memberView ?? "cards"
};
var sharedSyncTimer = null;
function setSharedSyncTimer(timer) {
  sharedSyncTimer = timer;
}
var appRoot = document.getElementById("app");

export {
  LEGACY_STORAGE_KEY,
  SESSION_KEY,
  API_KEY_STORAGE_KEY,
  DATABASE_API_URL,
  SHARED_SYNC_INTERVAL_MS,
  FILES_PER_PAGE,
  UPLOAD_MAX_SIZE_BYTES,
  MAX_UPLOAD_COUNT,
  dictionaries,
  options,
  routes,
  savePersistentState,
  state,
  setSharedSyncTimer,
  appRoot
};
