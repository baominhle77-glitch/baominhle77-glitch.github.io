import { readFile, writeFile, unlink } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const templatePath = new URL("./apply-account-v2.mjs", import.meta.url);
const runtimePath = new URL(`./.apply-account-v2-runtime-${process.pid}.mjs`, import.meta.url);

let source = await readFile(templatePath, "utf8");
const unsafeReviewAudit = 'await adminAudit(env, request, "review_deleted", `${readerId}:${authorId}`);';
const safeReviewAudit = 'await adminAudit(env, request, "review_deleted", \\`\\${readerId}:\\${authorId}\\`);';
const unsafeAdminName = 'cell(r,user.username+"\\n"+user.display_name);';
const safeAdminName = 'cell(r,user.username+"\\\\n"+user.display_name);';
if (!source.includes(unsafeReviewAudit)) throw new Error("Không tìm thấy điểm sửa template review audit");
if (!source.includes(unsafeAdminName)) throw new Error("Không tìm thấy điểm sửa xuống dòng tên Admin");
source = source.replace(unsafeReviewAudit, safeReviewAudit).replace(unsafeAdminName, safeAdminName);

await writeFile(runtimePath, source, "utf8");
try {
  await import(pathToFileURL(runtimePath.pathname).href + `?v=${Date.now()}`);
} finally {
  await unlink(runtimePath).catch(() => {});
}
