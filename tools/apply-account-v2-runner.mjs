import { readFile, writeFile, unlink } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const templatePath = new URL("./apply-account-v2.mjs", import.meta.url);
const runtimePath = new URL(`./.apply-account-v2-runtime-${process.pid}.mjs`, import.meta.url);

let source = await readFile(templatePath, "utf8");
const slash = "\\";
const unsafeReviewAudit = 'await adminAudit(env, request, "review_deleted", `${readerId}:${authorId}`);';
const safeReviewAudit = 'await adminAudit(env, request, "review_deleted", ' + slash + '`' + slash + '${readerId}:' + slash + '${authorId}' + slash + '`);';
const unsafeAdminName = 'cell(r,user.username+"\n"+user.display_name);';
const safeAdminName = 'cell(r,user.username+"' + "\\\\n" + '"+user.display_name);';
if (source.includes(unsafeReviewAudit)) source = source.replace(unsafeReviewAudit, safeReviewAudit);
else if (!source.includes(safeReviewAudit)) throw new Error("Không tìm thấy điểm sửa template review audit");
if (source.includes(unsafeAdminName)) source = source.replace(unsafeAdminName, safeAdminName);
else if (!source.includes(safeAdminName)) throw new Error("Không tìm thấy điểm sửa xuống dòng tên Admin");

await writeFile(runtimePath, source, "utf8");
try {
  await import(pathToFileURL(runtimePath.pathname).href + `?v=${Date.now()}`);
} finally {
  await unlink(runtimePath).catch(() => {});
}

await import(new URL("./apply-account-v2-profile-view.mjs", import.meta.url).href + `?v=${Date.now()}`);
await import(new URL("./apply-account-v3-hotfix.mjs", import.meta.url).href + `?v=${Date.now()}`);
await import(new URL("./apply-account-v4-edge-auth.mjs", import.meta.url).href + `?v=${Date.now()}`);
await import(new URL("./apply-admin-session-v5.mjs", import.meta.url).href + `?v=${Date.now()}`);
await import(new URL("./apply-admin-levels-v6.mjs", import.meta.url).href + `?v=${Date.now()}`);
