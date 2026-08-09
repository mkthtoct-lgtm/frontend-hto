# Khu vực lưu trữ tài liệu hướng dẫn + Hoàn thiện Tour Pop-up - Tóm tắt thay đổi

Tài liệu này tóm tắt việc bổ sung "Khu vực lưu trữ tài liệu hướng dẫn" và hoàn
thiện hệ thống tour pop-up/tooltip (driver.js) đã có sẵn trong code, để nhân
viên nội bộ và CTV biết cách thao tác trên Portal.

## 1. Hiện trạng trước khi sửa

Hệ thống đã có sẵn thư viện **driver.js** (tour pop-up từng bước) và đang dùng
cho 11 trang. Qua rà soát, phát hiện:

- **~13 trang quan trọng chưa có tour** (Trang chủ, Cài đặt hệ thống, Tra cứu
  trường du học, Kho Media, Trang cá nhân, Quản lý vai trò, Quản lý khảo sát,
  Quản lý sản phẩm, Đào tạo, Nộp hồ sơ online...).
- **1 lỗi có sẵn**: tour "Tin tức" gắn sai khoá (`news`/`newsManagement`)
  không khớp với route thực tế của ứng dụng (`tintuc`/`newsEventsManage`) nên
  **chưa từng tự chạy được** dù đã có nội dung soạn sẵn.
- **1 lỗi gắn nhầm**: tour khoá `hotro` thực chất 100% nội dung dành cho
  trang **Gửi Lead** (form LeadForm), khiến trang Hỗ trợ (FAQ/Ticket) thật sự
  **chưa từng có tour riêng**.
- **Không có nơi tra cứu lại lâu dài**: tour chỉ hiện đúng 1 lần khi vào
  trang lần đầu, không có cách nào xem lại nếu quên, và không có 1 trang tổng
  hợp mọi hướng dẫn để tra cứu khi cần.

## 2. Đã bổ sung

### 2.1. Khu vực lưu trữ tài liệu hướng dẫn (trang mới)

Trang **"Hướng dẫn sử dụng Portal"** - cẩm nang tra cứu lại bất cứ lúc nào,
không giới hạn ở lần xem đầu tiên:

- **9 nhóm chức năng, 25 bài hướng dẫn chi tiết**, bao quát gần như toàn bộ
  Portal: Bắt đầu, Sản phẩm & Dịch vụ, Nghiệp vụ & Chăm sóc khách hàng, Hỗ trợ
  & Tra cứu, Tin tức/Sự kiện/Kho Media, Trợ lý AI nội bộ, Khảo sát, Quản trị
  hệ thống.
- Mỗi bài viết: đối tượng áp dụng (nhân viên/CTV/Admin), tóm tắt, các bước
  thực hiện cụ thể, và khung "Mẹo & Lưu ý" khi cần.
- **Tìm kiếm không phân biệt dấu** (gõ "hoa hong" vẫn ra "hoa hồng"), có bôi
  vàng từ khoá khớp trong kết quả.
- Nút **"Xem hướng dẫn trực tiếp trên trang"**: tự động điều hướng tới đúng
  trang và phát lại tour pop-up ngay tại đó, không cần tự đi tìm.
- Truy cập qua: Sidebar → Hỗ trợ → "📘 Hướng dẫn sử dụng Portal", hoặc icon
  sách 📖 mới trên thanh Header (cạnh cụm icon liên hệ nhanh).

### 2.2. Sửa lỗi + bổ sung tour pop-up còn thiếu

- **Sửa lỗi khoá tour Tin tức** - giờ đã tự chạy đúng khi vào trang Tin tức
  lần đầu.
- **Tách đúng tour Gửi Lead** ra khỏi khoá `hotro`, đồng thời **soạn tour mới
  thật sự cho trang Hỗ trợ** (FAQ & Ticket).
- **Bổ sung 8 tour mới hoàn toàn** cho các trang trước đây chưa có: Trang chủ,
  Tra cứu thị trường du học (kể cả bộ lọc Học phí/Ngân sách vừa làm), Cài đặt
  hệ thống (cả 4 tab: Chatbot AI, Hoa hồng, CRM Automation, Marketing
  Automation), Kho Media, Trang cá nhân, Quản lý vai trò, Quản lý khảo sát,
  Quản lý sản phẩm, và 1 tour gộp cho Đào tạo + Nộp hồ sơ online.
- **Cơ chế "phát lại tour theo yêu cầu"**: trước đây tour chỉ hiện đúng 1 lần
  và không có cách xem lại. Giờ có thể phát lại bất cứ lúc nào từ trang
  Hướng dẫn sử dụng Portal, không giới hạn số lần, không ảnh hưởng tới trạng
  thái "đã xem" của lần tự động đầu tiên.

Tổng cộng: **21/21 tour** trong hệ thống đều có khoá khớp chính xác với trang
thực tế (đã đối chiếu tự động để đảm bảo không tour nào "mồ côi" hoặc không
bao giờ chạy được).

## 3. File đã thay đổi (chỉ Frontend, Backend không đổi)

**File mới:**
- `src/userGuide/guideContent.js` - toàn bộ nội dung 25 bài hướng dẫn (tách
  riêng khỏi giao diện để dễ bổ sung sau này)
- `src/userGuide/UserGuidePage.jsx` - giao diện trang Hướng dẫn sử dụng Portal

**File đã sửa:**
- `src/App.jsx` - export cấu hình tour, sửa lỗi khoá Tin tức, tách tour Gửi
  Lead/Hỗ trợ, bổ sung 8 tour mới, thêm cơ chế phát lại tour theo yêu cầu,
  thêm route cho trang Hướng dẫn
- `src/components/Header.jsx` - thêm icon truy cập nhanh trang Hướng dẫn
- `src/components/Sidebar.jsx` - thêm link "Hướng dẫn sử dụng Portal" trong
  mục Hỗ trợ
- `src/home/HomePage.jsx`, `src/components/SchoolSearchPage.jsx`,
  `src/systemSettings/SystemSettingsPage.jsx`, `src/media/MediaRepositoryPage.jsx`,
  `src/components/SupportPage.jsx`, `src/profile/ProfilePage.jsx`,
  `src/RoleManagement/RoleManagementPage.jsx`,
  `src/SurveyManagement/SurveyManagementPage.jsx`,
  `src/products/ProductManagementPage.jsx`,
  `src/products/OnlineApplicationPage.jsx`, `src/products/DaoTaoPage.jsx`
  - chỉ thêm thuộc tính `id="..."` vào các phần tử giao diện quan trọng để
    tour pop-up có thể "neo" (highlight) đúng vị trí. **Không thay đổi bất kỳ
    logic hay giao diện hiển thị nào khác.**

## 4. Lưu ý khi triển khai

- **Không cần cài thêm package nào** - `driver.js` đã có sẵn trong
  `package.json` từ trước.
- **Backend hoàn toàn không đổi** trong lần cập nhật này.
- Toàn bộ file `.jsx`/`.js` đã qua kiểm tra cú pháp bằng TypeScript compiler
  (chế độ parse-only) - không lỗi. Đã đối chiếu tự động toàn bộ khoá tour để
  đảm bảo không có tour nào bị "mồ côi" (không trang nào trỏ tới) hoặc trang
  nào có khoá tour không tồn tại.
- **Khuyến nghị test trên trình duyệt thật** trước khi lên production, đặc
  biệt: (1) tour tự động hiện đúng lần đầu vào từng trang, (2) nút "Xem hướng
  dẫn trực tiếp trên trang" điều hướng và phát tour đúng, (3) tìm kiếm trong
  trang Hướng dẫn hoạt động mượt trên các trình duyệt/thiết bị khác nhau.
- Nội dung 25 bài hướng dẫn được soạn dựa trên hiểu biết về toàn bộ hệ thống
  qua quá trình xây dựng - khuyến nghị đội ngũ vận hành thực tế rà soát lại
  1 lượt để đảm bảo khớp 100% với quy trình làm việc thực tế, và bổ sung
  thêm khi có tính năng mới.
