import { readFile, writeFile, unlink } from "node:fs/promises";
import { pathToFileURL } from "node:url";

async function importRuntime(templateName, mutate = (value) => value) {
  const templatePath = new URL(`./${templateName}`, import.meta.url);
  const runtimePath = new URL(`./.${templateName.replace(/\.mjs$/, "")}-runtime-${process.pid}-${Date.now()}.mjs`, import.meta.url);
  const source = mutate(await readFile(templatePath, "utf8"));
  await writeFile(runtimePath, source, "utf8");
  try {
    await import(pathToFileURL(runtimePath.pathname).href + `?v=${Date.now()}`);
  } finally {
    await unlink(runtimePath).catch(() => {});
  }
}

await importRuntime("apply-account-v2.mjs", (value) => {
  let source = value;
  const slash = "\\";
  const unsafeReviewAudit = 'await adminAudit(env, request, "review_deleted", `${readerId}:${authorId}`);';
  const safeReviewAudit = 'await adminAudit(env, request, "review_deleted", ' + slash + '`' + slash + '${readerId}:' + slash + '${authorId}' + slash + '`);';
  const unsafeAdminName = 'cell(r,user.username+"' + slash + 'n"+user.display_name);';
  const safeAdminName = 'cell(r,user.username+"' + slash + slash + 'n"+user.display_name);';
  if (source.includes(unsafeReviewAudit)) source = source.replace(unsafeReviewAudit, safeReviewAudit);
  else if (!source.includes(safeReviewAudit)) throw new Error("Không tìm thấy điểm sửa template review audit");
  if (source.includes(unsafeAdminName)) source = source.replace(unsafeAdminName, safeAdminName);
  else if (!source.includes(safeAdminName)) throw new Error("Không tìm thấy điểm sửa xuống dòng tên Admin");
  return source;
});

await import(new URL("./apply-account-v2-profile-view.mjs", import.meta.url).href + `?v=${Date.now()}`);
await import(new URL("./apply-account-v3-hotfix.mjs", import.meta.url).href + `?v=${Date.now()}`);
await import(new URL("./apply-account-v4-edge-auth.mjs", import.meta.url).href + `?v=${Date.now()}`);
await import(new URL("./apply-admin-v5-v6-runner.mjs", import.meta.url).href + `?v=${Date.now()}`);
