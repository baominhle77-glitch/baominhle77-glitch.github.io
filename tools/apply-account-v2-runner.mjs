import { readFile, writeFile, unlink } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const templatePath = new URL("./apply-account-v2.mjs", import.meta.url);
const runtimePath = new URL(`./.apply-account-v2-runtime-${process.pid}.mjs`, import.meta.url);

let source = await readFile(templatePath, "utf8");
const unsafe = 'await adminAudit(env, request, "review_deleted", `${readerId}:${authorId}`);';
const safe = 'await adminAudit(env, request, "review_deleted", \\`\\${readerId}:\\${authorId}\\`);';
if (!source.includes(unsafe)) throw new Error("Không tìm thấy điểm sửa template review audit");
source = source.replace(unsafe, safe);

await writeFile(runtimePath, source, "utf8");
try {
  await import(pathToFileURL(runtimePath.pathname).href + `?v=${Date.now()}`);
} finally {
  await unlink(runtimePath).catch(() => {});
}
