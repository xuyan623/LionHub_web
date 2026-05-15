/**
 * Central data access layer for state.database collections.
 * Provides uniform CRUD operations to replace scattered direct array mutations.
 * Future extensions: change logging, optimistic locking, indexed lookups.
 *
 * @module data-access
 */
import { state } from "./state.js";

/** @type {Set<string>} */
const VALID_COLLECTIONS = new Set([
  "users",
  "members",
  "tasks",
  "taskParticipants",
  "approvals",
  "pointTransactions",
  "notifications",
  "robotProjects",
]);

/**
 * @param {string} key
 * @returns {Object[]}
 */
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

/**
 * Find a record by its id field.
 * @template T
 * @param {string} collection
 * @param {string} id
 * @returns {T|null}
 */
export function findById(collection, id) {
  const list = guardCollection(collection);
  return list.find((item) => item.id === id) || null;
}

/**
 * Find first record matching predicate.
 * @template T
 * @param {string} collection
 * @param {(item: T) => boolean} predicate
 * @returns {T|null}
 */
export function findBy(collection, predicate) {
  const list = guardCollection(collection);
  return list.find(predicate) || null;
}

/**
 * Filter records by predicate.
 * @template T
 * @param {string} collection
 * @param {(item: T) => boolean} predicate
 * @returns {T[]}
 */
export function filterBy(collection, predicate) {
  const list = guardCollection(collection);
  return list.filter(predicate);
}

/**
 * Add record to head of collection.
 * @template T
 * @param {string} collection
 * @param {T} record
 * @returns {T}
 */
export function addRecord(collection, record) {
  const list = guardCollection(collection);
  list.unshift(record);
  return record;
}

/**
 * Remove record by id.
 * @param {string} collection
 * @param {string} id
 * @returns {boolean}
 */
export function removeRecord(collection, id) {
  const list = guardCollection(collection);
  const idx = list.findIndex((item) => item.id === id);
  if (idx === -1) return false;
  list.splice(idx, 1);
  return true;
}

/**
 * Remove all records matching predicate.
 * @template T
 * @param {string} collection
 * @param {(item: T) => boolean} predicate
 * @returns {T[]}
 */
export function removeWhere(collection, predicate) {
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

/**
 * Update record by id with partial updates.
 * @template T
 * @param {string} collection
 * @param {string} id
 * @param {Partial<T>} updates
 * @returns {T|null}
 */
export function updateRecord(collection, id, updates) {
  const record = findById(collection, id);
  if (!record) return null;
  Object.assign(record, updates);
  return record;
}

/**
 * Update if exists, otherwise insert.
 * @template T
 * @param {string} collection
 * @param {T} record
 * @returns {T}
 */
export function upsertRecord(collection, record) {
  const list = guardCollection(collection);
  const existing = list.find((item) => item.id === record.id);
  if (existing) {
    Object.assign(existing, record);
    return existing;
  }
  list.unshift(record);
  return record;
}

/**
 * Get raw collection array.
 * @template T
 * @param {string} collection
 * @returns {T[]}
 */
export function getCollection(collection) {
  return guardCollection(collection);
}
