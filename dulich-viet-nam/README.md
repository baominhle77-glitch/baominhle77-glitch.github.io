# Việt Nam Đi Đâu?

Web app tĩnh để tra cứu địa điểm du lịch Việt Nam. Ứng dụng ưu tiên tải dữ liệu từ Cloudflare Worker/D1; nếu API chưa cấu hình hoặc tạm lỗi, ứng dụng tự chuyển sang `data/places.json`.

## Cấu hình frontend

Mở `config.js` và điền URL API sau khi deploy Worker:

```js
window.TRAVEL_CONFIG = {
  apiBase: "https://vietnam-travel-api.<subdomain>.workers.dev/api",
  staticDataUrl: "./data/places.json"
};
```

## Chạy thử cục bộ

Cần dùng HTTP server, không mở trực tiếp bằng `file://`:

```bash
python -m http.server 8080
```

Sau đó mở `/dulich-viet-nam/`.

## Nguyên tắc dữ liệu

- Không coi giá vé, giờ mở cửa hoặc điều kiện tham quan trong dữ liệu là thông tin thời gian thực.
- Mỗi bản ghi nên có nguồn chính thức và ngày kiểm tra gần nhất khi đưa vào vận hành.
- Token Telegram, Cloudflare và khóa quản trị không được ghi vào source.
