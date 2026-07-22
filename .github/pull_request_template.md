# Pull request — hợp đồng phối hợp agent

Task-ID: 
Agent/Owner: 
Branch đã đăng ký: 

## Mục tiêu

<!-- Một mục tiêu duy nhất, không gộp việc ngoài Task-ID. -->

## Phạm vi đã khóa

<!-- Chép đúng paths từ docs/handover/ACTIVE_TASKS.json. -->

- 

## Thay đổi

- 

## Kiểm thử đã chạy

- [ ] `node tools/validate-coordination.mjs`
- [ ] Kiểm tra cú pháp liên quan
- [ ] Test frontend liên quan
- [ ] Test Worker/backend liên quan
- [ ] Kiểm thử trình duyệt hoặc E2E khi cần

Kết quả/ngoại lệ:

## Ảnh hưởng production

- [ ] Không deploy
- [ ] Chỉ Pages
- [ ] Chỉ Worker — phải giải thích vì sao an toàn
- [ ] Pages trước, Worker sau

Hậu kiểm dự kiến/đã chạy:

## Dữ liệu và bí mật

- [ ] Không thêm token, mật khẩu, khóa giải mã, secret hoặc dữ liệu chat riêng tư
- [ ] Không commit plaintext của payload mã hóa
- [ ] Không làm thay đổi binding/secret ngoài phạm vi đã ghi

## Bàn giao

- [ ] Đã cập nhật `docs/handover/NHAT-KY-PHOI-HOP.md`
- [ ] Đã cập nhật `docs/handover/ACTIVE_TASKS.json`
- [ ] Đã cập nhật `HANDOVER.md` hoặc file bàn giao chuyên biệt nếu kiến trúc/trạng thái thay đổi
- [ ] Khóa phạm vi đã chuyển sang `completed`, `blocked` hoặc còn giữ có lý do rõ ràng

## Xung đột và phụ thuộc

<!-- Nêu commit main đã dùng làm base, agent/task liên quan, migration hoặc việc phải làm tiếp. -->
