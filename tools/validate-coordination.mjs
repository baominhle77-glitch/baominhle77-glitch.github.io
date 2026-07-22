import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const LEDGER = path.join(ROOT, "docs", "handover", "ACTIVE_TASKS.json");

function fail(message) {
  console.error(`coordination-error: ${message}`);
  process.exitCode = 1;
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function isIsoDate(value) {
  return typeof value === "string" && value.length >= 20 && Number.isFinite(Date.parse(value));
}

function normalizeScope(value, taskId) {
  assert(typeof value === "string" && value.trim(), `${taskId}: phạm vi rỗng`);
  const normalized = String(value).trim().replaceAll("\\", "/").replace(/^\.\//, "");
  assert(!normalized.startsWith("/"), `${taskId}: không dùng đường dẫn tuyệt đối: ${value}`);
  assert(!normalized.split("/").includes(".."), `${taskId}: không dùng '..' trong phạm vi: ${value}`);
  assert(normalized !== "*", `${taskId}: khóa toàn repository bằng '*' không được phép`);
  return normalized;
}

function scopeInfo(scope) {
  if (scope.endsWith("/**")) return { type: "tree", value: scope.slice(0, -3).replace(/\/$/, "") };
  if (scope.endsWith("/*")) return { type: "tree", value: scope.slice(0, -2).replace(/\/$/, "") };
  if (scope.endsWith("/")) return { type: "tree", value: scope.replace(/\/$/, "") };
  return { type: "file", value: scope };
}

function treeContains(tree, candidate) {
  return candidate === tree || candidate.startsWith(`${tree}/`);
}

function overlaps(left, right) {
  const a = scopeInfo(left);
  const b = scopeInfo(right);
  if (a.type === "file" && b.type === "file") return a.value === b.value;
  if (a.type === "tree" && b.type === "file") return treeContains(a.value, b.value);
  if (a.type === "file" && b.type === "tree") return treeContains(b.value, a.value);
  return treeContains(a.value, b.value) || treeContains(b.value, a.value);
}

let ledger;
try {
  ledger = JSON.parse(fs.readFileSync(LEDGER, "utf8"));
} catch (error) {
  console.error(`coordination-error: không đọc được ${LEDGER}: ${error.message}`);
  process.exit(1);
}

assert(ledger.schema_version === 1, "schema_version phải bằng 1");
assert(isIsoDate(ledger.updated_at), "updated_at phải là thời gian ISO hợp lệ");
assert(Number.isInteger(ledger.lock_timeout_hours) && ledger.lock_timeout_hours > 0, "lock_timeout_hours phải là số nguyên dương");
assert(Array.isArray(ledger.active_tasks), "active_tasks phải là mảng");
assert(Array.isArray(ledger.recently_completed), "recently_completed phải là mảng");

const idPattern = /^[A-Z][A-Z0-9-]{5,}$/;
const ids = new Set();
const branches = new Set();
const active = [];

for (const task of ledger.active_tasks) {
  const id = task && task.id;
  assert(typeof id === "string" && idPattern.test(id), `Task-ID không hợp lệ: ${String(id)}`);
  assert(!ids.has(id), `Task-ID bị trùng: ${id}`);
  ids.add(id);

  assert(typeof task.owner === "string" && task.owner.trim(), `${id}: thiếu owner`);
  assert(typeof task.branch === "string" && task.branch.trim(), `${id}: thiếu branch`);
  assert(!branches.has(task.branch), `${id}: branch đang được task khác sử dụng: ${task.branch}`);
  branches.add(task.branch);

  assert(/^[0-9a-f]{40}$/i.test(task.base_sha || ""), `${id}: base_sha phải là SHA 40 ký tự`);
  assert(task.status === "in_progress" || task.status === "blocked", `${id}: active task chỉ được in_progress hoặc blocked`);
  assert(isIsoDate(task.started_at), `${id}: started_at không hợp lệ`);
  assert(isIsoDate(task.heartbeat_at), `${id}: heartbeat_at không hợp lệ`);
  assert(typeof task.summary === "string" && task.summary.trim(), `${id}: thiếu summary`);
  assert(Array.isArray(task.paths) && task.paths.length > 0, `${id}: phải khóa ít nhất một phạm vi`);

  const scopes = task.paths.map((scope) => normalizeScope(scope, id));
  assert(new Set(scopes).size === scopes.length, `${id}: có phạm vi lặp trong cùng task`);
  active.push({ id, scopes });
}

for (let i = 0; i < active.length; i += 1) {
  for (let j = i + 1; j < active.length; j += 1) {
    for (const left of active[i].scopes) {
      for (const right of active[j].scopes) {
        if (overlaps(left, right)) {
          fail(`${active[i].id} (${left}) chồng phạm vi với ${active[j].id} (${right})`);
        }
      }
    }
  }
}

for (const task of ledger.recently_completed) {
  const id = task && task.id;
  assert(typeof id === "string" && idPattern.test(id), `Task-ID hoàn tất không hợp lệ: ${String(id)}`);
  assert(!ids.has(id), `Task-ID xuất hiện cả active và completed: ${id}`);
  ids.add(id);
  assert(["completed", "cancelled"].includes(task.status), `${id}: recently_completed chỉ được completed hoặc cancelled`);
  assert(isIsoDate(task.completed_at), `${id}: completed_at không hợp lệ`);
}

if (process.exitCode) process.exit(process.exitCode);
console.log(`coordination-ok: ${ledger.active_tasks.length} active task(s), không có phạm vi chồng chéo`);
