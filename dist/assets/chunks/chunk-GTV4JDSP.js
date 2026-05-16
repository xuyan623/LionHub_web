import {
  state
} from "./chunk-NDL62ULM.js";

// client/core/data-access.js
var VALID_COLLECTIONS = /* @__PURE__ */ new Set([
  "users",
  "members",
  "tasks",
  "taskParticipants",
  "approvals",
  "pointTransactions",
  "notifications",
  "robotProjects"
]);
function guardCollection(key) {
  if (!VALID_COLLECTIONS.has(key)) {
    throw new TypeError(`Invalid collection "${key}".`);
  }
  if (!state.database) {
    throw new Error("Database is not initialized.");
  }
  if (!Array.isArray(state.database[key])) {
    state.database[key] = [];
  }
  return state.database[key];
}
function addRecord(collection, record) {
  const list = guardCollection(collection);
  list.unshift(record);
  return record;
}
function removeRecord(collection, id) {
  const list = guardCollection(collection);
  const idx = list.findIndex((item) => item.id === id);
  if (idx === -1) return false;
  list.splice(idx, 1);
  return true;
}
function removeWhere(collection, predicate) {
  const list = guardCollection(collection);
  const removed = [];
  for (let i = list.length - 1; i >= 0; i--) {
    if (predicate(list[i])) {
      removed.push(list[i]);
      list.splice(i, 1);
    }
  }
  return removed;
}

export {
  addRecord,
  removeRecord,
  removeWhere
};
