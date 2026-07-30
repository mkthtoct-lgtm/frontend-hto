# KẾ HOẠCH & LUỒNG TRIỂN KHAI: KHO MEDIA & CHỨNG NHẬN
*(Dự án: HTO Portal - Web Nội Bộ CTY)*

## 1. Tổng Quan Mục Tiêu
- Xây dựng một khu vực riêng biệt (Module Kho Media) để lưu trữ và hiển thị các tài liệu truyền thông (Content, Video) và minh chứng **"Kết quả Visa thành công"**.
- **Mục đích:** Tăng tính trực quan, xây dựng độ uy tín (Social Proof) đối với khách hàng và hỗ trợ bộ phận Sale/Đại lý dễ dàng lấy tư liệu PR.

---

## 2. Luồng Trải Nghiệm Giao Diện (UI/UX Flow)

Giao diện áp dụng cơ chế **Dual View (Chế độ xem kép)** thông qua hệ thống Tabs:

### Tab 1: "Kết quả Visa thành công" (Visa Proofs)
- **Hiển thị:** Dạng lưới (Grid Card) tập trung vào hình ảnh minh chứng Visa.
- **Tính năng Lọc (Filter):** Tích hợp thanh cuộn ngang (Horizontal Filter Bar) phân loại theo Quốc gia (VD: Canada, Úc, Mỹ, v.v.).
- **Tương tác:** Click vào hình ảnh bất kỳ sẽ bật lên màn hình **Lightbox Modal** (Popup nền tối) hiển thị:
  - Ảnh minh chứng chất lượng cao.
  - Tên quốc gia & loại Visa.
  - Tên khách hàng (Đã được đội thiết kế làm mờ bớt thông tin).
  - Ngày cấp Visa.

### Tab 2: "Video & Content PR"
- **Hiển thị:** Lưới danh sách các Video Marketing hoặc Cẩm nang/Tài liệu PR.
- **Tương tác:**
  - **Video:** Gắn iframe Player (như Youtube) trực tiếp trên Lightbox Modal, click là xem ngay không cần chuyển trang.
  - **Tài liệu PDF/Document:** Có nút **"Tải tài liệu" (Download)** trực tiếp trên thẻ để Đại lý tải về máy.

---

## 3. Cấu Trúc Hệ Thống Component (Frontend)

- **Định tuyến (Routing):** Thêm đường dẫn `/media-repository` trong `src/App.jsx`.
- **Thanh điều hướng (Sidebar):** Nằm dưới mục "Quản lý bài viết" trong thẻ "Marketing & Hệ thống" (`src/components/Sidebar.jsx`).
- **Module Chính:** `src/media/MediaRepositoryPage.jsx` chứa toàn bộ logic xử lý giao diện (Lọc, Modal, Tabs).
- **Dữ liệu mồi (Mock Data):** `src/media/mockMediaData.js` đóng vai trò thay thế API trong lúc chờ Backend hoàn thiện.

---

## 4. Thiết Kế Database (Backend Schema)

Bảng cơ sở dữ liệu `media_repository` sẽ bao gồm các trường sau:

| Trường (Field) | Kiểu dữ liệu (Type) | Mô tả (Description) |
| :--- | :--- | :--- |
| `id` | UUID / String | Mã định danh duy nhất của tài liệu/chứng nhận. |
| `title` | String | Tên tài liệu hoặc tiêu đề Visa (VD: *"Visa Du học Canada - Nguyễn Văn A"*). |
| `category_type` | Enum | Phân loại: `visa_proof` (Minh chứng) \| `video` (Truyền thông) \| `document` (Tài liệu). |
| `country_code` | String | Mã ISO quốc gia để làm bộ lọc (VD: `CA`, `US`, `AU`, `ALL`). |
| `media_url` | String | Đường dẫn URL file gốc (Ảnh chất lượng cao / Video Youtube / File PDF tải về). |
| `thumbnail_url` | String | URL ảnh thu nhỏ (Bắt buộc dùng cho thẻ Video hoặc Document PDF). |
| `customer_name_masked`| String | Tên khách hàng đã che bảo mật (VD: *"Nguyễn V*** A"*). Chỉ dùng cho category `visa_proof`. |
| `issued_date` | Date | Ngày cấp Visa hoặc ngày tài liệu được xuất bản/đăng tải. |
| `status` | String | Trạng thái hiển thị: `active` (Hoạt động) \| `hidden` (Đang ẩn). |

---

## 5. Danh Sách API Endpoints Dự Kiến (RESTful)

Khi Frontend ghép nối với Backend, chúng ta sẽ cần các API sau:

1. **[GET] `/api/v1/media?type=visa_proof&country=CA&page=1&limit=12`**
   - **Mô tả:** Lấy danh sách media có hỗ trợ lọc theo loại, lọc theo quốc gia và phân trang (Pagination).

2. **[POST] `/api/v1/media`**
   - **Mô tả:** Upload thêm tài liệu/minh chứng mới. (Dùng cho trang Quản trị Admin/CMS).
   - **Payload:** Các trường trong cấu trúc DB cộng với file đính kèm.

3. **[PATCH] `/api/v1/media/{id}/toggle-status`**
   - **Mô tả:** Đổi trạng thái hiển thị của một chứng nhận (từ `active` sang `hidden` hoặc ngược lại). 

---
*Văn bản này đóng vai trò là Blueprint để đội ngũ thiết kế, Front-end và Back-end đồng bộ khi làm việc cùng nhau trên phân hệ Media.*
