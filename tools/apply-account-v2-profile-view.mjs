import { readFile, writeFile } from "node:fs/promises";

async function edit(path, mutate) {
  const before = await readFile(path, "utf8");
  const after = mutate(before);
  if (after !== before) await writeFile(path, after, "utf8");
}

function replaceRange(source, startMarker, endMarker, replacement, label) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  if (start < 0 || end < 0) throw new Error(`Không tìm thấy khối ${label}`);
  return source.slice(0, start) + replacement + source.slice(end);
}

await edit("assets/community.js", (source) => {
  if (source.includes("/* Admin total member profile view */")) return source;

  const defaultDashboard = '      if (state.profile.role === "reader") renderConversations(); else renderReaders();';
  const profileDashboard = '      var requestedView = new URLSearchParams(location.search).get("admin_view");\n      if (tokenClaims().mode === "impersonation" && requestedView === "profile") renderProfile();\n      else if (state.profile.role === "reader") renderConversations(); else renderReaders();';
  if (!source.includes(defaultDashboard)) throw new Error("Không tìm thấy điều hướng dashboard mặc định");
  source = source.replace(defaultDashboard, profileDashboard);

  const oldLogout = '    var logout = button("Đăng xuất", "community-secondary", function () { setStorage(COMMUNITY_TOKEN_KEY, ""); saveProfile(null); renderAuth(); });';
  const newLogout = '    var impersonating = tokenClaims().mode === "impersonation";\n    var logout = button(impersonating ? "Quay lại Admin" : "Đăng xuất", "community-secondary", function () {\n      setStorage(COMMUNITY_TOKEN_KEY, ""); saveProfile(null);\n      if (impersonating) { if (history.length > 1) history.back(); else location.assign("./community-admin.html"); return; }\n      renderAuth();\n    });';
  if (!source.includes(oldLogout)) throw new Error("Không tìm thấy nút đăng xuất Account V2");
  source = source.replace(oldLogout, newLogout);

  const profileBlock = `  function renderProfile() {
    clearPoll();
    var adminView = tokenClaims().mode === "impersonation";
    function leaveAdminView() {
      setStorage(COMMUNITY_TOKEN_KEY, ""); saveProfile(null);
      if (history.length > 1) history.back(); else location.assign("./community-admin.html");
    }
    var card = el("section", null, "community-card");
    card.append(dashboardHeader(), topTabs("profile"), el("h2", "Trang cá nhân"));
    if (adminView) {
      var notice = el("div", null, "community-state");
      notice.append(el("strong", "Admin tổng đang xem trang cá nhân của " + (state.profile.display_name || state.profile.username)), el("span", " · Chế độ chỉ đọc"));
      card.append(notice, button("← Quay lại khu vực Admin", "community-secondary", leaveAdminView));
    }
    var form = el("form", null, "community-form");
    if (adminView) {
      var username = el("input"); username.value = state.profile.username || ""; username.disabled = true;
      var usernameLabel = el("label", "Tên đăng nhập"); usernameLabel.append(username); form.append(usernameLabel);
    }
    var display = el("input"); display.name = "display_name"; display.maxLength = 80; display.required = true; display.value = state.profile.display_name || "";
    var bio = el("textarea"); bio.name = "bio"; bio.maxLength = 1000; bio.rows = 5; bio.value = state.profile.bio || "";
    var displayLabel = el("label", "Tên hiển thị"); displayLabel.append(display);
    var bioLabel = el("label", "Giới thiệu bản thân"); bioLabel.append(bio);
    form.append(displayLabel, bioLabel);
    var specialties, bankName, accountNumber, accountName, qrFile;
    if (state.profile.role === "reader") {
      specialties = el("input"); specialties.value = (state.profile.specialties || []).join(", "); specialties.maxLength = 500;
      bankName = el("input"); bankName.value = state.profile.bank && state.profile.bank.bank_name || "";
      accountNumber = el("input"); accountNumber.value = state.profile.bank && state.profile.bank.account_number || "";
      accountName = el("input"); accountName.value = state.profile.bank && state.profile.bank.account_name || "";
      qrFile = el("input"); qrFile.type = "file"; qrFile.accept = "image/png,image/jpeg,image/webp";
      [["Mảng chuyên sâu", specialties], ["Ngân hàng", bankName], ["Số tài khoản", accountNumber], ["Tên chủ tài khoản", accountName], ["Thay ảnh QR", qrFile]].forEach(function (pair) { var label = el("label", pair[0]); label.append(pair[1]); form.append(label); });
      if (adminView && state.profile.bank && state.profile.bank.qr_data) {
        var qr = el("img"); qr.src = state.profile.bank.qr_data; qr.alt = "QR của " + state.profile.display_name; qr.className = "community-qr";
        var qrLabel = el("div", null, "community-payment-box"); qrLabel.append(el("strong", "QR hiện tại"), qr); form.append(qrLabel);
      }
    }
    if (adminView) {
      [display, bio, specialties, bankName, accountNumber, accountName, qrFile].filter(Boolean).forEach(function (control) { control.disabled = true; });
      form.append(el("p", "Đây là toàn bộ trang cá nhân của member theo dữ liệu hiện có. Admin tổng không thể sửa dưới danh nghĩa member.", "community-state"));
      card.append(form); APP.replaceChildren(card); return;
    }
    var submit = el("button", "Lưu thay đổi", "community-primary"); submit.type = "submit";
    var status = el("p", "", "community-state"); form.append(submit, status); card.append(form); APP.replaceChildren(card);
    form.addEventListener("submit", function (event) {
      event.preventDefault(); submit.disabled = true; setMessage(status, "Đang lưu…");
      var oldQr = state.profile.bank && state.profile.bank.qr_data || "";
      fileToDataUrl(qrFile && qrFile.files[0]).then(function (newQr) {
        return api("/api/community/me", jsonOptions("PUT", {
          display_name: display.value.trim(), bio: bio.value.trim(),
          specialties: specialties ? specialties.value : [], bank_name: bankName ? bankName.value.trim() : "",
          account_number: accountNumber ? accountNumber.value.trim() : "", account_name: accountName ? accountName.value.trim() : "",
          qr_data: newQr || oldQr
        }));
      }).then(function (data) { saveProfile(data.profile); setMessage(status, "Đã lưu."); submit.disabled = false; }).catch(function (error) { submit.disabled = false; setMessage(status, humanError(error), true); });
    });
  }

`;
  source = replaceRange(source, "  function renderProfile() {", "  function boot() {", profileBlock, "trang cá nhân member");
  source = source.replace("\n  boot();", "\n  /* Admin total member profile view */\n  boot();");
  return source;
});

await edit("assets/community-admin.js", (source) => {
  if (!source.includes('button("Xem giao diện","community-secondary"')) throw new Error("Không tìm thấy nút Xem giao diện Admin");
  source = source.replace('button("Xem giao diện","community-secondary"', 'button("Xem trang cá nhân","community-secondary"');
  if (!source.includes('location.assign("./community.html?admin_view=1")')) throw new Error("Không tìm thấy URL impersonation cũ");
  source = source.replace('location.assign("./community.html?admin_view=1")', 'location.assign("./community.html?admin_view=profile")');
  return source;
});

const community = await readFile("assets/community.js", "utf8");
const admin = await readFile("assets/community-admin.js", "utf8");
for (const marker of ["admin_view", "Chế độ chỉ đọc", "Quay lại khu vực Admin", "Admin total member profile view"]) {
  if (!community.includes(marker)) throw new Error(`Thiếu marker ${marker} trong community.js`);
}
for (const marker of ["Xem trang cá nhân", "admin_view=profile"]) {
  if (!admin.includes(marker)) throw new Error(`Thiếu marker ${marker} trong community-admin.js`);
}
console.log("Đã sửa Admin tổng mở thẳng Trang cá nhân member ở chế độ chỉ đọc.");
