import React, { useEffect, useState, useMemo, useRef } from "react";
import { authFetch, getAuthHeaders } from "../auth/session";
import { API_BASE_URL } from "../config/api";
import { DocumentsPage } from "../components/DocumentsPage";

// Component vẽ Icon viền mảnh (Outline Icons) đồng bộ với giao diện
function OutlineIcon({ name, className = "text-primary", size = 20, style = {} }) {
  const styles = { width: `${size}px`, height: `${size}px`, ...style };
  
  switch (name) {
    case "target": // OKR
      return (
        <svg className={className} style={styles} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <circle cx="12" cy="12" r="6"></circle>
          <circle cx="12" cy="12" r="2"></circle>
        </svg>
      );
    case "users": // Org Chart / Team
      return (
        <svg className={className} style={styles} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
      );
    case "bell": // Announcements
      return (
        <svg className={className} style={styles} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
      );
    case "link": // External / Quick Link
      return (
        <svg className={className} style={styles} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
          <polyline points="15 3 21 3 21 9"></polyline>
          <line x1="10" y1="14" x2="21" y2="3"></line>
        </svg>
      );
    case "help": // FAQ
      return (
        <svg className={className} style={styles} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
      );
    case "mail": // Contact Mail
      return (
        <svg className={className} style={styles} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
          <polyline points="22,6 12,13 2,6"></polyline>
        </svg>
      );
    case "arrow-right": // Chevron
      return (
        <svg className={className} style={styles} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12"></line>
          <polyline points="12 5 19 12 12 19"></polyline>
        </svg>
      );
    case "chevron-down":
      return (
        <svg className={className} style={styles} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      );
    case "calendar":
      return (
        <svg className={className} style={styles} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      );
    case "edit": // Edit icon
      return (
        <svg className={className} style={styles} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
      );
    case "plus":
      return (
        <svg className={className} style={styles} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      );
    case "trash":
      return (
        <svg className={className} style={styles} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          <line x1="10" y1="11" x2="10" y2="17"></line>
          <line x1="14" y1="11" x2="14" y2="17"></line>
        </svg>
      );
    default:
      return null;
  }
}

// Hệ thống dữ liệu chuyên môn tĩnh & hình ảnh thực tế cho từng phòng ban
const DEPARTMENT_SPECIFIC_DATA = {
  "dept-hanh-chinh": {
    name: "Phòng Hành chính",
    mission: "Đảm bảo vận hành văn phòng thông suốt, quản lý cơ sở vật chất tối ưu và cung cấp dịch vụ hỗ trợ nội bộ chu đáo, chuyên nghiệp.",
    slogan: "Hậu phương vững chắc, vận hành chu toàn",
    image: "/assets/images/banner-second.jpg",
    okrs: [
      { target: "Tối ưu hóa 15% chi phí vận hành và văn phòng phẩm năm 2026", progress: 90 },
      { target: "Bảo trì định kỳ 100% trang thiết bị văn phòng và hệ thống phòng họp", progress: 80 },
      { target: "Rút ngắn thời gian xử lý đề xuất cấp phát thiết bị dưới 2 ngày", progress: 85 }
    ],
    announcements: [
      { id: 1, title: "Bảo trì định kỳ hệ thống điều hòa văn phòng", date: "29/06/2026", desc: "Hệ thống điều hòa sẽ được bảo trì vào Thứ 7 tuần này. Khuyến nghị nhân sự không làm việc tại văn phòng thời gian này.", isImportant: true },
      { id: 2, title: "Cập nhật quy trình đặt phòng họp trên hệ thống nội bộ", date: "20/06/2026", desc: "Yêu cầu đặt phòng họp trước tối thiểu 2 tiếng để bộ phận lễ tân chuẩn bị nước và trang thiết bị kỹ thuật.", isImportant: false }
    ],
    schedule: [
      { time: "09:00 Thứ 2", event: "Họp giao ban đầu tuần phòng Hành chính" },
      { time: "15:00 Thứ 6", event: "Kiểm kê văn phòng phẩm & Báo cáo tuần" }
    ],
    quickLinks: [
      { title: "Đặt phòng họp", url: "#", desc: "Đăng ký sử dụng phòng họp trực tuyến" },
      { title: "Báo hỏng thiết bị", url: "#", desc: "Form báo lỗi cơ sở vật chất" },
      { title: "Đề xuất văn phòng phẩm", url: "#", desc: "Yêu cầu cấp phát hàng tháng" },
      { title: "Theo dõi tài sản", url: "#", desc: "Bảng quản lý tài sản cố định công ty" }
    ],
    faqs: [
      { q: "Muốn mượn thiết bị trình chiếu, máy ảnh thì liên hệ ai?", a: "Liên hệ trực tiếp bộ phận Lễ tân Hành chính tại quầy tầng 1 hoặc tạo phiếu mượn thiết bị trên hệ thống trước ít nhất 1 ngày." },
      { q: "Quy trình xử lý khi phát hiện hư hỏng tài sản văn phòng?", a: "Vui lòng chụp ảnh hiện trạng lỗi và điền phiếu báo hỏng thiết bị ở phần Quick Links. Kỹ thuật viên sẽ xử lý trong vòng 24h." }
    ]
  },
  "dept-nhan-su": {
    name: "Phòng Nhân sự",
    mission: "Thu hút, đào tạo và giữ chân nhân tài, xây dựng văn hóa doanh nghiệp gắn kết và tạo dựng môi trường làm việc hạnh phúc tại HT Ocean Group.",
    slogan: "Con người là tài sản lớn nhất",
    image: "/assets/images/hito_4.png",
    okrs: [
      { target: "Tuyển dụng thành công 150 nhân sự chất lượng cao cho toàn bộ chi nhánh", progress: 85 },
      { target: "Chuẩn hóa 100% quy trình Onboarding và tài liệu đào tạo nội bộ", progress: 70 },
      { target: "Đạt điểm số hài lòng về môi trường làm việc trên 90% đánh giá năm", progress: 65 }
    ],
    announcements: [
      { id: 1, title: "Quy định về trang phục công sở và thẻ nhân viên mới", date: "28/06/2026", desc: "Yêu cầu tất cả nhân sự mang thẻ nhân viên và mặc trang phục lịch sự từ Thứ 2 đến Thứ 5 hàng tuần.", isImportant: true },
      { id: 2, title: "Kế hoạch tổ chức Team Building hè 2026", date: "25/06/2026", desc: "Chương trình Team Building dự kiến diễn ra từ 15/07 - 18/07 tại Đà Nẵng. Đăng ký tham gia trước 05/07.", isImportant: false }
    ],
    schedule: [
      { time: "14:00 Thứ 3", event: "Đào tạo hội nhập nhân sự mới (Onboarding)" },
      { time: "10:00 Thứ 5", event: "Họp đánh giá ứng viên tuần" }
    ],
    quickLinks: [
      { title: "Cổng nhân sự Base", url: "#", desc: "Quản lý chấm công, ngày phép, thông tin cá nhân" },
      { title: "Bảng tin tuyển dụng", url: "#", desc: "Các vị trí đang cần tuyển và cơ chế giới thiệu" },
      { title: "Form xin nghỉ phép", url: "#", desc: "Quy trình xin nghỉ phép, nghỉ ốm, chế độ" },
      { title: "Tài liệu Onboarding", url: "#", desc: "Sổ tay nhân viên và quy trình làm việc" }
    ],
    faqs: [
      { q: "Quy trình xin nghỉ phép thường niên được tính thế nào?", a: "Nhân viên tạo đề xuất nghỉ phép trên Base HR. Nghỉ dưới 2 ngày cần báo trước 1 ngày; nghỉ từ 3 ngày trở lên cần báo trước tối thiểu 1 tuần và được Trưởng bộ phận phê duyệt." },
      { q: "Cách tính lương ngoài giờ (OT) tại HT Ocean Group?", a: "Công việc OT phải được Trưởng bộ phận phê duyệt bằng phiếu OT trước 17h00 ngày làm việc. Hệ số lương OT được áp dụng theo đúng Luật Lao động hiện hành." }
    ]
  },
  "dept-ke-toan": {
    name: "Phòng Kế toán",
    mission: "Quản lý tài chính minh bạch, chính xác, đảm bảo dòng tiền lành mạnh và thực hiện đối soát chi trả hoa hồng, công nợ đúng hạn.",
    slogan: "Minh bạch tài chính, vững bước vươn xa",
    image: "/assets/images/dashboard_monitor_mockup.png",
    okrs: [
      { target: "Hoàn thành kiểm toán tài chính bán niên 2026 đúng tiến độ", progress: 95 },
      { target: "Rút ngắn thời gian đối soát hoa hồng cho đại lý xuống dưới 3 ngày làm việc", progress: 85 },
      { target: "Số hóa 100% hóa đơn chứng từ sang hệ thống hóa đơn điện tử mới", progress: 75 }
    ],
    announcements: [
      { id: 1, title: "Hạn cuối nộp hóa đơn chứng từ thanh toán tháng 06", date: "27/06/2026", desc: "Đề nghị các phòng ban gửi toàn bộ hóa đơn chứng từ hợp lệ về phòng kế toán trước 17h00 ngày 30/06.", isImportant: true },
      { id: 2, title: "Thay đổi thông tin xuất hóa đơn VAT của công ty", date: "15/06/2026", desc: "Cập nhật địa chỉ xuất hóa đơn VAT mới áp dụng từ ngày 20/06. Vui lòng xem kỹ file đính kèm.", isImportant: false }
    ],
    schedule: [
      { time: "08:30 Thứ 2", event: "Họp cập nhật dòng tiền và công nợ tuần" },
      { time: "16:00 Ngày 25", event: "Hạn chót duyệt bảng chấm công chuyển lương" }
    ],
    quickLinks: [
      { title: "Phần mềm MISA", url: "#", desc: "Cổng đăng nhập hệ thống kế toán nội bộ" },
      { title: "Cổng đối soát Deal", url: "#", desc: "Trang đối soát doanh thu và hoa hồng đại lý" },
      { title: "Form tạm ứng chi phí", url: "#", desc: "Đề xuất tạm ứng công tác phí, sự kiện" },
      { title: "Thông tin VAT HTO", url: "#", desc: "Thông tin tài khoản ngân hàng và mã số thuế" }
    ],
    faqs: [
      { q: "Lương và hoa hồng được chi trả vào ngày nào hàng tháng?", a: "Lương cố định được chuyển khoản vào ngày 05 hàng tháng. Hoa hồng kinh doanh và hoa hồng đại lý được đối soát và chi trả từ ngày 10 đến ngày 15 hàng tháng." },
      { q: "Quy định về thời gian thanh toán hoàn ứng sau khi đi công tác?", a: "Trong vòng 5 ngày làm việc sau khi kết thúc chuyến công tác, nhân sự phải nộp đầy đủ hóa đơn đỏ (VAT) kèm phiếu thanh toán hoàn ứng để kế toán xử lý." }
    ]
  },
  "dept-ho-so": {
    name: "Phòng Hồ sơ",
    mission: "Xử lý, thẩm định và chuẩn hóa hồ sơ xin học, hồ sơ visa của học viên đạt chất lượng cao nhất, đảm bảo tỷ lệ đỗ visa tối đa.",
    slogan: "Hồ sơ chỉn chu, tương lai rộng mở",
    image: "/assets/images/banner-web-korean.jpg",
    okrs: [
      { target: "Duy trì tỷ lệ đỗ Visa du học Đức và Hàn Quốc trên 98%", progress: 95 },
      { target: "Chuẩn hóa quy trình dịch thuật công chứng tự động hóa 80%", progress: 75 },
      { target: "Rút ngắn thời gian thẩm định hồ sơ học viên mới dưới 3 ngày", progress: 80 }
    ],
    announcements: [
      { id: 1, title: "Cập nhật thay đổi thủ tục xin Visa học nghề Đức diện mới", date: "29/06/2026", desc: "Đại sứ quán Đức cập nhật điều kiện về chứng chỉ tiếng và chứng minh tài chính. Yêu cầu rà soát gấp danh sách học viên.", isImportant: true },
      { id: 2, title: "Lịch làm việc của văn phòng dịch thuật công chứng liên kết", date: "22/06/2026", desc: "Lịch trả hồ sơ dịch thuật công chứng cố định vào chiều Thứ 3 và Thứ 5 hàng tuần.", isImportant: false }
    ],
    schedule: [
      { time: "10:00 Thứ 3", event: "Họp cập nhật tiến độ nộp Visa học viên" },
      { time: "14:00 Thứ 5", event: "Thẩm định chéo hồ sơ xuất cảnh" }
    ],
    quickLinks: [
      { title: "Đặt hẹn Đại sứ quán", url: "#", desc: "Cổng đăng ký lịch hẹn phỏng vấn Visa" },
      { title: "Kho tài liệu dịch mẫu", url: "#", desc: "Mẫu dịch thuật công chứng giấy tờ chuẩn" },
      { title: "Theo dõi tiến độ Visa", url: "#", desc: "Bảng theo dõi trạng thái hồ sơ học viên" },
      { title: "CRM Hồ sơ", url: "#", desc: "Hệ thống quản lý dữ liệu học viên" }
    ],
    faqs: [
      { q: "Hồ sơ xin visa học nghề Đức cần những giấy tờ gì bắt buộc?", a: "Các giấy tờ thiết yếu gồm: Hộ chiếu, Chứng chỉ tiếng Đức (B1/B2), Hợp đồng học nghề & thực hành tại Đức, Giấy thông hành APS, Chứng minh tài chính (Sổ phong tỏa) và Bảo hiểm y tế phù hợp." },
      { q: "Thời gian xét duyệt Visa thông thường của Đại sứ quán mất bao lâu?", a: "Thời gian xét duyệt dao động từ 4 đến 8 tuần tùy thuộc vào chương trình học, số lượng hồ sơ tồn đọng và tỉnh/bang tiếp nhận tại Đức." }
    ]
  },
  "dept-tuyen-sinh": {
    name: "Phòng Tuyển sinh",
    mission: "Tiếp cận, tư vấn định hướng lộ trình học tập tối ưu cho học viên, mở rộng mạng lưới đối tác và thúc đẩy doanh thu tuyển sinh bền vững.",
    slogan: "Định hướng tương lai, đồng hành bứt phá",
    image: "/assets/images/hito_3.png",
    okrs: [
      { target: "Đạt mốc tuyển sinh mới 500 học viên du học nghề năm 2026", progress: 85 },
      { target: "Phát triển và liên kết thêm 30 đại lý tuyển sinh mới trên cả nước", progress: 70 },
      { target: "Tối ưu hóa tỷ lệ chuyển đổi từ Lead sang học viên ký hợp đồng trên 20%", progress: 65 }
    ],
    announcements: [
      { id: 1, title: "Chính sách thưởng nóng tuyển sinh kỳ du học tháng 09/2026", date: "28/06/2026", desc: "Ban Giám Đốc ban hành cơ chế thưởng đặc biệt cho tư vấn viên đạt doanh số xuất sắc trong tháng này.", isImportant: true },
      { id: 2, title: "Cập nhật bộ Brochure sản phẩm du học Đức & Hàn Quốc mới", date: "25/06/2026", desc: "Tải ngay bộ tài liệu tư vấn mới nhất ở phần Quick Links để gửi cho khách hàng và đại lý.", isImportant: false }
    ],
    schedule: [
      { time: "08:30 Thứ 2", event: "Họp giao chỉ tiêu doanh số và phân bổ Lead tuần" },
      { time: "16:00 Thứ 6", event: "Họp tổng kết tuần và tháo gỡ khó khăn chốt hợp đồng" }
    ],
    quickLinks: [
      { title: "CRM Bizfly", url: "#", desc: "Hệ thống quản lý thông tin Lead và Khách hàng" },
      { title: "Tài liệu sản phẩm", url: "#", desc: "Brochure, lộ trình tư vấn, học phí các gói" },
      { title: "Chính sách đại lý", url: "#", desc: "Quy định hoa hồng và chính sách liên kết tuyển sinh" },
      { title: "Lịch khai giảng", url: "#", desc: "Lịch khai giảng các lớp tiếng Đức, tiếng Hàn" }
    ],
    faqs: [
      { q: "Làm thế nào để yêu cầu cấp phát Lead mới từ Marketing?", a: "Tư vấn viên đăng nhập CRM Bizfly, kiểm tra hàng chờ Lead được phân bổ tự động. Nếu cần cấp Lead đột xuất cho chiến dịch, gửi đề xuất thông qua Trưởng bộ phận duyệt." },
      { q: "Chính sách chiết khấu hoa hồng cho đại lý liên kết quy định ở đâu?", a: "Chính sách hoa hồng được quy định chi tiết trong văn bản ký kết đại lý 2026. Bạn có thể xem nhanh bản mềm ở mục Lối tắt phần Tài liệu chính sách đại lý." }
    ]
  }
};

// Dữ liệu mặc định nếu phòng ban chưa được cấu hình chi tiết
const DEFAULT_DEPT_DATA = {
  name: "Phòng ban chuyên môn",
  mission: "Đóng góp vào sự phát triển chung của HT Ocean Group bằng chất lượng công việc vượt trội, tinh thần phối hợp chuyên nghiệp và không ngừng đổi mới sáng tạo.",
  slogan: "Đoàn kết sáng tạo, kiến tạo thành công",
  image: "/assets/images/hito_2.png",
  okrs: [
    { target: "Hoàn thành 100% mục tiêu chuyên môn Quý II/2026", progress: 80 },
    { target: "Chuẩn hóa toàn bộ quy trình làm việc SOP nội bộ phòng ban", progress: 75 }
  ],
  announcements: [
    { id: 1, title: "Thông báo cập nhật lịch làm việc chung", date: "29/06/2026", desc: "Vui lòng cập nhật đầy đủ lịch làm việc cá nhân lên lịch chung của phòng ban.", isImportant: false }
  ],
  schedule: [
    { time: "09:00 Thứ 2", event: "Họp giao ban tuần phòng ban" }
  ],
  quickLinks: [
    { title: "Tài liệu quy trình SOP", url: "#", desc: "Kho tài liệu quy trình chuẩn của phòng" },
    { title: "Báo cáo công việc", url: "#", desc: "Hệ thống báo cáo hiệu suất cá nhân" }
  ],
  faqs: [
    { q: "Quy trình phối hợp liên phòng ban khi có sự vụ phát sinh?", a: "Tạo nhóm chat phối hợp gồm Trưởng bộ phận liên quan và các nhân sự phụ trách trực tiếp để xử lý nhanh chóng." }
  ]
};

export default function DepartmentGeneralPage({ currentUser, departmentId }) {
  const [departmentName, setDepartmentName] = useState("");
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  // States quản lý việc chỉnh sửa SOP
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  // States quản lý Sơ đồ cây tổ chức động (Thêm/Sửa/Xóa nút sơ đồ)
  const [orgChartNodes, setOrgChartNodes] = useState(null);
  const [isOrgNodeModalOpen, setIsOrgNodeModalOpen] = useState(false);
  const [editingNode, setEditingNode] = useState(null);
  const [nodeForm, setNodeForm] = useState({ title: "", fullName: "", role: "", level: "member", avatarUrl: "" });

  // Refs & Handlers Tải ảnh từ máy tính (Local Computer File Upload)
  const nodeAvatarFileRef = useRef(null);
  const bannerFileRef = useRef(null);

  const handleAvatarFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Dung lượng tệp ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setNodeForm(prev => ({ ...prev, avatarUrl: event.target.result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleBannerFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      alert("Dung lượng tệp ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn 8MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setEditData(prev => ({ ...prev, image: event.target.result }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Kiểm duyệt quyền của user hiện tại (chỉ Admin, Ban Giám Đốc, Trưởng bộ phận mới được sửa)
  const isAllowedToEdit = useMemo(() => {
    const role = String(currentUser?.role || "").toLowerCase();
    return ["admin", "bangiamdoc", "truongbophan"].includes(role);
  }, [currentUser]);

  // Lấy dữ liệu SOP từ LocalStorage (hoặc fallback về code tĩnh)
  const [sopConfig, setSopConfig] = useState(null);

  const activeSopData = useMemo(() => {
    if (sopConfig) return sopConfig;
    return DEPARTMENT_SPECIFIC_DATA[departmentId] || {
      ...DEFAULT_DEPT_DATA,
      name: departmentName || DEFAULT_DEPT_DATA.name
    };
  }, [departmentId, departmentName, sopConfig]);

  // Load cấu hình SOP và Sơ đồ tổ chức lưu trong LocalStorage khi thay đổi departmentId
  useEffect(() => {
    if (!departmentId) return;
    const stored = localStorage.getItem(`hto_sop_config_${departmentId}`);
    if (stored) {
      try {
        setSopConfig(JSON.parse(stored));
      } catch {
        setSopConfig(null);
      }
    } else {
      setSopConfig(null);
    }

    const storedOrg = localStorage.getItem(`hto_org_chart_${departmentId}`);
    if (storedOrg) {
      try {
        setOrgChartNodes(JSON.parse(storedOrg));
      } catch {
        setOrgChartNodes(null);
      }
    } else {
      setOrgChartNodes(null);
    }
  }, [departmentId]);

  const activeOrgChartNodes = useMemo(() => {
    if (orgChartNodes && Array.isArray(orgChartNodes)) return orgChartNodes;

    if (!members || members.length === 0) {
      return [
        {
          id: "leader-node-empty",
          title: "TRƯỞNG BỘ PHẬN",
          fullName: "Chưa phân bổ nhân sự",
          role: "Trưởng phòng ban",
          avatarUrl: "/assets/images/avatar/avatar1.webp",
          level: "leader"
        }
      ];
    }

    const leader = members.find(m => 
      String(m.role).toLowerCase().includes("trưởng") || 
      String(m.role).toLowerCase().includes("quản lý") || 
      String(m.role).toLowerCase().includes("giám đốc") ||
      String(m.role).toLowerCase().includes("leader")
    ) || members[0];

    const otherMembers = members.filter(m => m.id !== leader.id);

    return [
      {
        id: `leader-node-${leader.id}`,
        title: "TRƯỞNG BỘ PHẬN",
        fullName: leader.fullName,
        role: leader.role || "Quản lý phòng ban",
        avatarUrl: leader.avatarUrl || "/assets/images/avatar/avatar1.webp",
        level: "leader"
      },
      ...otherMembers.map((m, idx) => ({
        id: `member-node-${m.id || idx}`,
        title: m.role || "THÀNH VIÊN",
        fullName: m.fullName,
        role: m.role || "Nhân sự phòng ban",
        avatarUrl: m.avatarUrl || `/assets/images/avatar/avatar${(idx % 8) + 1}.webp`,
        level: "member"
      }))
    ];
  }, [members, orgChartNodes]);

  const handleSaveOrgChartNodes = (nodes) => {
    setOrgChartNodes(nodes);
    localStorage.setItem(`hto_org_chart_${departmentId}`, JSON.stringify(nodes));
  };

  const handleOpenAddNodeModal = () => {
    const firstMember = members[0];
    setEditingNode(null);
    setNodeForm({ 
      title: "Chuyên viên nhiệm vụ", 
      fullName: firstMember?.fullName || "", 
      role: firstMember?.role || "Thành viên chuyên môn", 
      avatarUrl: firstMember?.avatarUrl || "/assets/images/avatar/avatar1.webp",
      level: "member" 
    });
    setIsOrgNodeModalOpen(true);
  };

  const handleOpenEditNodeModal = (node) => {
    setEditingNode(node);
    setNodeForm({ 
      title: node.title, 
      fullName: node.fullName, 
      role: node.role || "", 
      avatarUrl: node.avatarUrl || "/assets/images/avatar/avatar1.webp",
      level: node.level || "member" 
    });
    setIsOrgNodeModalOpen(true);
  };

  const handleDeleteNode = (nodeId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa vị trí này khỏi Sơ đồ tổ chức?")) return;
    const nextNodes = activeOrgChartNodes.filter(n => n.id !== nodeId);
    handleSaveOrgChartNodes(nextNodes);
  };

  const handleSaveNodeForm = (e) => {
    e.preventDefault();
    if (!nodeForm.fullName.trim()) return;

    if (editingNode) {
      const nextNodes = activeOrgChartNodes.map(n => 
        n.id === editingNode.id 
          ? { 
              ...n, 
              title: nodeForm.title, 
              fullName: nodeForm.fullName.trim(), 
              role: nodeForm.role, 
              avatarUrl: nodeForm.avatarUrl || "/assets/images/avatar/avatar1.webp",
              level: nodeForm.level 
            }
          : n
      );
      handleSaveOrgChartNodes(nextNodes);
    } else {
      const newNode = {
        id: `custom-node-${Date.now()}`,
        title: nodeForm.title || "Vị trí chuyên môn",
        fullName: nodeForm.fullName.trim(),
        role: nodeForm.role || "Nhân sự",
        avatarUrl: nodeForm.avatarUrl || "/assets/images/avatar/avatar1.webp",
        level: nodeForm.level || "member"
      };
      handleSaveOrgChartNodes([...activeOrgChartNodes, newNode]);
    }
    setIsOrgNodeModalOpen(false);
  };

  const handleResetOrgChart = () => {
    if (window.confirm("Khôi phục sơ đồ cây tổ chức về mặc định ban đầu?")) {
      localStorage.removeItem(`hto_org_chart_${departmentId}`);
      setOrgChartNodes(null);
    }
  };

  // Gọi API lấy thông tin tên phòng ban và thành viên thực tế từ Backend
  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      if (!departmentId) return;
      setLoading(true);
      
      const KNOWN_HIDDEN_DEPTS = {
        "6a2928bd198af598139ab42a": "laptop M4",
        "6a389e5cd30baf58a6859c5e": "cộng tác viên",
        "6a389e7bd30baf58a6859cf3": "Đại sứ thương hiệu",
        "6a1d026bd982af7420184420": "Tuyển Sinh du học hè",
        "6a1d03fc6d7314acd051155a": "Tuyển sinh du học Mỹ",
        "6a1d04686d7314acd051155c": "Nghiệp vụ",
        "6a1d047a6d7314acd051155d": "Telesale & CSKH",
        "6a1d048b6d7314acd051155e": "IT & Marketing & Social",
        "6a1d04996d7314acd051155f": "Kinh doanh",
        "6a1d04a86d7314acd0511560": "Tổng Hợp",
        "6a1e3941e43b5d5e028e9e9d": "Tuyển sinh"
      };

      const initialDepartments = {
        "dept-hanh-chinh": "Phòng Hành chính",
        "dept-nhan-su": "Phòng Nhân sự",
        "dept-ke-toan": "Phòng Kế toán",
        "dept-ho-so": "Phòng Hồ sơ",
        "dept-tuyen-sinh": "Phòng Tuyển sinh"
      };

      try {
        const headers = { "Content-Type": "application/json", ...getAuthHeaders() };
        const canReadDepts = ["admin", "bangiamdoc", "truongbophan", "nhansu", "staff"].includes(currentUser?.role);
        const canReadUsers = ["admin", "bangiamdoc", "truongbophan", "nhansu", "staff"].includes(currentUser?.role);
        
        // 1. Lấy thông tin phòng ban
        if (canReadDepts) {
          try {
            const deptRes = await authFetch(`${API_BASE_URL}/departments?includeHidden=true`, { headers });
            if (deptRes.ok) {
              const deptPayload = await deptRes.json().catch(() => null);
              const deptList = deptPayload?.data || deptPayload || [];
              const matchDept = deptList.find(d => String(d._id || d.id) === String(departmentId));
              if (matchDept && isMounted) {
                setDepartmentName(matchDept.name);
              } else if (isMounted) {
                setDepartmentName(KNOWN_HIDDEN_DEPTS[departmentId] || initialDepartments[departmentId] || "Phòng ban chuyên môn");
              }
            } else {
              if (isMounted) {
                setDepartmentName(KNOWN_HIDDEN_DEPTS[departmentId] || initialDepartments[departmentId] || "Phòng ban chuyên môn");
              }
            }
          } catch (e) {
            if (isMounted) {
              setDepartmentName(KNOWN_HIDDEN_DEPTS[departmentId] || initialDepartments[departmentId] || "Phòng ban chuyên môn");
            }
          }
        } else {
          if (isMounted) {
            setDepartmentName(KNOWN_HIDDEN_DEPTS[departmentId] || initialDepartments[departmentId] || "Phòng ban chuyên môn");
          }
        }

        // 2. Lấy thành viên phòng ban từ Swagger API thật (Backend MongoDB)
        try {
          const usersRes = await authFetch(`${API_BASE_URL}/users?page=1&limit=200`, { headers });
          if (usersRes.ok) {
            const usersPayload = await usersRes.json().catch(() => null);
            const usersList = Array.isArray(usersPayload?.data?.users)
              ? usersPayload.data.users
              : Array.isArray(usersPayload?.data)
              ? usersPayload.data
              : Array.isArray(usersPayload?.users)
              ? usersPayload.users
              : [];
            
            const deptMembers = usersList.filter(user => {
              const userDeptId = user.departmentId || user.department?._id || user.department?.id;
              const userDeptName = String(user.departmentName || user.department?.name || "").toLowerCase();
              const currentDeptName = String(departmentName || "").toLowerCase();

              // 1. Khớp trực tiếp theo MongoDB ID phòng ban
              if (userDeptId && String(userDeptId) === String(departmentId)) return true;

              // 2. Khớp theo Tên phòng ban
              if (currentDeptName && userDeptName && (userDeptName.includes(currentDeptName) || currentDeptName.includes(userDeptName))) return true;

              // 3. Khớp theo slug tĩnh của phòng ban
              if (departmentId === "dept-hanh-chinh" && userDeptName.includes("hành chính")) return true;
              if (departmentId === "dept-nhan-su" && userDeptName.includes("nhân sự")) return true;
              if (departmentId === "dept-ke-toan" && userDeptName.includes("kế toán")) return true;
              if (departmentId === "dept-ho-so" && userDeptName.includes("hồ sơ")) return true;
              if (departmentId === "dept-tuyen-sinh" && userDeptName.includes("tuyển sinh")) return true;

              return false;
            });

            if (isMounted) {
              setMembers(deptMembers.map((u, index) => ({
                id: u._id || u.id,
                fullName: u.fullName || u.name || u.email || "Nhân sự HTO",
                email: u.email || "",
                role: u.roleName || u.role?.name || u.role || "Nhân sự chuyên môn",
                avatarUrl: u.avatarUrl || u.profile?.avatarUrl || `/assets/images/avatar/avatar${(index % 8) + 1}.webp`
              })));
            }
          }
        } catch (e) {
          console.error("Lỗi tải thông tin nhân sự:", e);
        }

      } catch (error) {
        console.error("Lỗi khi tải dữ liệu phòng ban từ API:", error.message);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
      
      function loadFallbackMembers() {
        if (!isMounted) return;
        const name = KNOWN_HIDDEN_DEPTS[departmentId] || initialDepartments[departmentId] || "Phòng ban";
        const fallbackList = [
          {
            id: `mock-leader-${departmentId}`,
            fullName: `Trần Ngọc Hải`,
            email: `haitn@hto.edu.vn`,
            role: `Quản lý ${name}`,
            avatarUrl: `/assets/images/avatar/avatar1.webp`
          },
          {
            id: `mock-member-1-${departmentId}`,
            fullName: `Nguyễn Đức Hùng`,
            email: `hungnd@hto.edu.vn`,
            role: `Kỹ thuật viên ${name}`,
            avatarUrl: `/assets/images/avatar/avatar2.webp`
          },
          {
            id: `mock-member-2-${departmentId}`,
            fullName: `Lê Thu Trang`,
            email: `tranglt@hto.edu.vn`,
            role: `Chuyên viên nghiệp vụ`,
            avatarUrl: `/assets/images/avatar/avatar3.webp`
          }
        ];
        setMembers(fallbackList);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, [departmentId, currentUser]);

  const toggleFaq = (index) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  // Mở modal sửa cấu hình
  const handleOpenEditModal = () => {
    // Clone sâu dữ liệu hiện tại để đưa vào form sửa
    setEditData(JSON.parse(JSON.stringify(activeSopData)));
    setIsEditModalOpen(true);
  };

  // Lưu thông tin sửa đổi xuống LocalStorage
  const handleSaveEdit = () => {
    if (!editData) return;
    localStorage.setItem(`hto_sop_config_${departmentId}`, JSON.stringify(editData));
    setSopConfig(editData);
    setIsEditModalOpen(false);
  };

  // Khôi phục về mặc định gốc
  const handleResetToDefault = () => {
    if (window.confirm("Bạn có chắc chắn muốn khôi phục dữ liệu ban đầu của phòng ban này?")) {
      localStorage.removeItem(`hto_sop_config_${departmentId}`);
      setSopConfig(null);
      setIsEditModalOpen(false);
    }
  };

  if (loading && members.length === 0 && !departmentName) {
    return (
      <div className="container-fluid pt-4 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Đang tải thông tin...</span>
        </div>
        <p className="mt-2 text-body-secondary">Đang tải dữ liệu Nội dung chung phòng ban...</p>
      </div>
    );
  }

  return (
    <div className="container-fluid pt-3 pb-5" style={{ maxWidth: "1600px" }}>
      {/* SECTION 1: HEADER BANNER (MÀU ĐỒNG BỘ WEB, KHÔNG DÙNG GRADIENT, SỬ DỤNG HÌNH ẢNH THẬT) */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card border shadow-sm overflow-hidden" style={{ borderRadius: "16px" }}>
            <div className="row g-0">
              {/* Nội dung text bên trái (Nền solid màu tương thích) */}
              <div className="col-lg-8 p-4 p-lg-5 bg-body-secondary position-relative">
                {/* Nút Sửa Giao Diện Cho Admin/Trưởng phòng ban */}
                {isAllowedToEdit && (
                  <button 
                    onClick={handleOpenEditModal}
                    className="btn btn-sm btn-outline-primary border px-3 py-1.5 position-absolute top-4 end-4 d-flex align-items-center gap-1.5 shadow-sm bg-body"
                    style={{ zIndex: 10, fontSize: "12px", fontWeight: "600" }}
                  >
                    <OutlineIcon name="edit" className="text-primary" size={14} />
                    Chỉnh sửa nội dung chung
                  </button>
                )}

                <div className="d-flex align-items-center gap-2 mb-3">
                  <OutlineIcon name="target" className="text-primary" size={22} />
                  <span className="text-primary fw-bold small uppercase" style={{ letterSpacing: "0.5px" }}>
                    Nội dung chung & Quy chuẩn phòng ban
                  </span>
                </div>
                
                <h2 className="fw-bold mb-2 text-body-emphasis" style={{ fontSize: "30px", letterSpacing: "-0.5px" }}>
                  {activeSopData.name}
                </h2>
                
                <p className="fs-6 text-body-secondary mb-4 italic" style={{ lineHeight: "1.4" }}>
                  “{activeSopData.slogan}”
                </p>
                
                <div className="border-top pt-4 mt-2">
                  <div className="row g-3">
                    <div className="col-md-8 col-lg-9">
                      <h6 className="fw-bold text-body-emphasis small mb-2">Tầm nhìn & Sứ mệnh phòng ban</h6>
                      <p className="mb-0 text-body-secondary" style={{ fontSize: "14px", lineHeight: "1.5" }}>
                        {activeSopData.mission}
                      </p>
                    </div>
                    <div className="col-md-4 col-lg-3 d-flex align-items-center justify-content-md-end">
                      <div className="bg-body border rounded-3 p-3 text-center w-100 max-w-[200px]">
                        <div className="fw-bold fs-4 text-primary">{members.length || "-"}</div>
                        <div className="small text-body-secondary">Nhân sự phòng ban</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hình ảnh banner thực tế bên phải */}
              <div className="col-lg-4 d-none d-lg-block position-relative">
                <img 
                  src={activeSopData.image} 
                  alt={`${activeSopData.name} Banner`} 
                  className="w-100 h-100" 
                  style={{ objectFit: "cover" }} 
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4 align-items-stretch">
        {/* CỘT TRÁI (2/3) */}
        <div className="col-12 col-xl-8 d-flex flex-column gap-4">
          
          {/* SECTION 2: MỤC TIÊU LỚN & OKRs (DÙNG MÀU ĐỒNG BỘ WEB, KHÔNG DÙNG GRADIENT) */}
          <section className="card border shadow-sm bg-body" style={{ borderRadius: "12px" }}>
            <div className="card-header bg-transparent border-bottom py-3 px-4 d-flex align-items-center gap-2">
              <OutlineIcon name="target" className="text-primary" size={20} />
              <h5 className="card-title fw-bold text-body-emphasis mb-0">Mục tiêu chiến lược & OKRs</h5>
            </div>
            <div className="card-body p-4">
              <div className="d-grid gap-4">
                {(activeSopData.okrs || []).map((okr, index) => (
                  <div key={index} className="okr-item">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="fw-bold text-body-emphasis" style={{ fontSize: "13.5px" }}>
                        OKR #{index + 1}: {okr.target}
                      </span>
                      <span className="badge bg-primary-subtle text-primary fw-bold" style={{ fontSize: "12px" }}>
                        {okr.progress}% Hoàn thành
                      </span>
                    </div>
                    {/* Progress Bar màu đồng bộ (Solid bg-primary) */}
                    <div className="progress rounded-pill bg-body-secondary" style={{ height: "10px" }}>
                      <div 
                        className="progress-bar rounded-pill bg-primary" 
                        role="progressbar" 
                        style={{ width: `${okr.progress}%` }} 
                        aria-valuenow={okr.progress} 
                        aria-valuemin="0" 
                        aria-valuemax="100"
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* SECTION 3: SƠ ĐỒ TỔ CHỨC & DANH SÁCH THÀNH VIÊN */}
          <section className="card border shadow-sm bg-body" style={{ borderRadius: "12px" }}>
            <div className="card-header bg-transparent border-bottom py-3 px-4 d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2">
                <OutlineIcon name="users" className="text-primary" size={20} />
                <h5 className="card-title fw-bold text-body-emphasis mb-0">Sơ đồ tổ chức & Thành viên chuyên môn</h5>
              </div>
              <div className="d-flex align-items-center gap-2">
                {isAllowedToEdit && (
                  <>
                    <button
                      type="button"
                      className="btn btn-sm btn-primary d-flex align-items-center gap-1 py-1 px-2.5"
                      style={{ fontSize: "12px", fontWeight: 600 }}
                      onClick={handleOpenAddNodeModal}
                    >
                      <OutlineIcon name="plus" className="text-white" size={13} />
                      Thêm vị trí sơ đồ
                    </button>
                    {orgChartNodes && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary py-1 px-2"
                        style={{ fontSize: "11px" }}
                        onClick={handleResetOrgChart}
                        title="Khôi phục sơ đồ mặc định"
                      >
                        Mặc định
                      </button>
                    )}
                  </>
                )}
                <span className="badge bg-secondary-subtle text-body-secondary fw-semibold">
                  {members.length} nhân sự hoạt động
                </span>
              </div>
            </div>
            <div className="card-body p-4">
              {/* ORG CHART CARD GRAPHIC */}
              <div className="org-chart-wrapper bg-body-tertiary rounded-4 p-4 mb-4 text-center border position-relative">
                <h6 className="fw-bold text-body-secondary uppercase small mb-3">Sơ đồ cây tổ chức</h6>
                <div className="d-flex flex-column align-items-center gap-3">
                  {/* Leaders Row */}
                  <div className="d-flex flex-wrap justify-content-center gap-3">
                    {activeOrgChartNodes.filter(n => n.level === "leader").map((node) => (
                      <div key={node.id} className="card border border-indigo-200 shadow-md p-3 px-4 rounded-3 text-center position-relative bg-white text-slate-900" style={{ minWidth: "240px" }}>
                        {isAllowedToEdit && (
                          <div className="position-absolute top-2 end-2 d-flex gap-1 bg-slate-100 p-1 rounded border border-slate-200">
                            <button type="button" className="btn btn-xs text-slate-600 p-0 border-0" title="Sửa vị trí" onClick={() => handleOpenEditNodeModal(node)}>
                              <OutlineIcon name="edit" className="text-slate-600" size={13} />
                            </button>
                            <button type="button" className="btn btn-xs text-rose-600 p-0 border-0 ms-1" title="Xóa vị trí" onClick={() => handleDeleteNode(node.id)}>
                              <OutlineIcon name="trash" className="text-rose-600" size={13} />
                            </button>
                          </div>
                        )}
                        {node.avatarUrl && (
                          <img src={node.avatarUrl} alt={node.fullName} className="rounded-circle border border-2 border-indigo-500 mx-auto mb-2" style={{ width: "52px", height: "52px", objectFit: "cover" }} />
                        )}
                        <div className="fw-bold text-uppercase text-indigo-700" style={{ fontSize: "11px", letterSpacing: "0.5px" }}>{node.title || "TRƯỞNG BỘ PHẬN"}</div>
                        <div className="fw-bold fs-6 mt-1 text-slate-900" style={{ color: "#0f172a", fontWeight: "800" }}>{node.fullName}</div>
                        {node.role && <div className="small mt-0.5 text-slate-600 font-medium" style={{ fontSize: "12px", color: "#475569" }}>{node.role}</div>}
                      </div>
                    ))}
                  </div>

                  {/* Connecting Line */}
                  <div style={{ width: "2px", height: "24px", backgroundColor: "#cbd5e1" }}></div>

                  {/* Member Nodes Grid */}
                  <div className="d-flex flex-wrap justify-content-center gap-3">
                    {activeOrgChartNodes.filter(n => n.level !== "leader").map((node) => (
                      <div key={node.id} className="card border border-slate-200 shadow-sm p-3 px-3 rounded-3 text-center position-relative bg-white text-slate-900" style={{ minWidth: "180px" }}>
                        {node.avatarUrl && (
                          <img src={node.avatarUrl} alt={node.fullName} className="rounded-circle border border-slate-200 mx-auto mb-1.5" style={{ width: "42px", height: "42px", objectFit: "cover" }} />
                        )}
                        <div className="fw-bold text-slate-900 text-truncate" style={{ fontSize: "13.5px", color: "#0f172a" }}>{node.fullName}</div>
                        <div className="small mt-0.5 text-slate-600 font-medium" style={{ fontSize: "11.5px", color: "#475569" }}>{node.title || node.role}</div>
                        {isAllowedToEdit && (
                          <div className="d-flex justify-content-center gap-2 mt-2 border-top border-slate-100 pt-1.5">
                            <button type="button" className="btn btn-xs text-indigo-600 p-0 border-0 fw-semibold" style={{ fontSize: "11px" }} onClick={() => handleOpenEditNodeModal(node)}>
                              Sửa
                            </button>
                            <span className="text-slate-300">|</span>
                            <button type="button" className="btn btn-xs text-rose-600 p-0 border-0 fw-semibold" style={{ fontSize: "11px" }} onClick={() => handleDeleteNode(node.id)}>
                              Xóa
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                    {activeOrgChartNodes.filter(n => n.level !== "leader").length === 0 && (
                      <div className="text-body-secondary small italic py-2">Chưa có vị trí thành viên nào. Bấm "Thêm vị trí sơ đồ" để bổ sung.</div>
                    )}
                  </div>
                </div>
              </div>

              {/* MEMBERS LIST TABLE */}
              <h6 className="fw-bold text-body-emphasis mb-3">Danh bạ liên hệ nhanh</h6>
              <div className="table-responsive">
                <table className="table align-middle table-hover mb-0" style={{ fontSize: "13px" }}>
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: "40%" }}>Họ và tên</th>
                      <th>Chức danh</th>
                      <th>Email liên hệ</th>
                      <th className="text-end">Liên hệ nhanh</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.length > 0 ? (
                      members.map((member) => (
                        <tr key={member.id}>
                          <td>
                            <div className="d-flex align-items-center gap-3">
                              <img 
                                src={member.avatarUrl} 
                                alt={member.fullName} 
                                className="rounded-circle border" 
                                style={{ width: "32px", height: "32px", objectFit: "cover" }} 
                              />
                              <div>
                                <span className="fw-bold text-body-emphasis d-block">{member.fullName}</span>
                              </div>
                            </div>
                          </td>
                          <td className="text-body-secondary fw-medium">{member.role}</td>
                          <td className="text-body-secondary">{member.email}</td>
                          <td className="text-end">
                            <a href={`mailto:${member.email}`} className="btn btn-sm btn-outline-primary border px-2.5 py-1 d-inline-flex align-items-center gap-1.5" style={{ fontSize: "11px", fontWeight: "600" }}>
                              <OutlineIcon name="mail" className="text-primary" size={13} />
                              Gửi Email
                            </a>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="text-center py-4 text-body-secondary">
                          Chưa có thông tin nhân sự nào được phân vào phòng ban này.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* SECTION 4: BẢN TIN & THÔNG BÁO NỘI BỘ PHÒNG BAN */}
          <section className="card border shadow-sm bg-body" style={{ borderRadius: "12px" }}>
            <div className="card-header bg-transparent border-bottom py-3 px-4 d-flex align-items-center gap-2">
              <OutlineIcon name="bell" className="text-primary" size={20} />
              <h5 className="card-title fw-bold text-body-emphasis mb-0">Bản tin & Thông báo nội bộ</h5>
            </div>
            <div className="card-body p-4">
              <div className="row g-4">
                {/* Announcements Column */}
                <div className="col-12 col-md-7 d-flex flex-column gap-3">
                  <h6 className="fw-bold text-body-emphasis mb-1">Thông báo & Quyết định mới nhất</h6>
                  {(activeSopData.announcements || []).map((item) => (
                    <article 
                      key={item.id} 
                      className={`p-3 rounded-3 border ${item.isImportant ? "bg-warning-subtle/30 border-warning-subtle" : "bg-body border-slate-200"}`}
                    >
                      <div className="d-flex justify-content-between align-items-start gap-3 mb-1.5">
                        <h6 className="fw-bold text-body-emphasis mb-0" style={{ fontSize: "13.5px" }}>
                          {item.isImportant && <span className="badge bg-danger text-white me-1.5">Quan trọng</span>}
                          {item.title}
                        </h6>
                        <span className="text-body-secondary small text-nowrap" style={{ fontSize: "11px" }}>{item.date}</span>
                      </div>
                      <p className="text-body-secondary mb-0" style={{ fontSize: "12.5px", lineHeight: "1.4" }}>
                        {item.desc}
                      </p>
                    </article>
                  ))}
                </div>
                
                {/* Schedule Column */}
                <div className="col-12 col-md-5">
                  <div className="p-3 bg-body-tertiary rounded-3 border h-100">
                    <h6 className="fw-bold text-body-emphasis mb-3 d-flex align-items-center gap-1.5" style={{ fontSize: "14px" }}>
                      <OutlineIcon name="calendar" className="text-primary" size={16} />
                      Lịch sinh hoạt phòng ban
                    </h6>
                    <ul className="list-unstyled mb-0 d-grid gap-3">
                      {(activeSopData.schedule || []).map((sch, idx) => (
                        <li key={idx} className="d-flex gap-2">
                          <span className="badge bg-primary text-white fw-bold align-self-start py-1" style={{ fontSize: "10px", minWidth: "90px" }}>
                            {sch.time}
                          </span>
                          <span className="text-body-secondary fw-medium" style={{ fontSize: "12.5px", lineHeight: "1.3" }}>
                            {sch.event}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

        </div>

        {/* CỘT PHẢI (1/3) */}
        <div className="col-12 col-xl-4 d-flex flex-column gap-4">
          
          {/* SECTION 5: LỐI TẮT ĐẾN CÔNG CỤ & HỆ THỐNG */}
          <section className="card border shadow-sm bg-body" style={{ borderRadius: "12px" }}>
            <div className="card-header bg-transparent border-bottom py-3 px-4 d-flex align-items-center gap-2">
              <OutlineIcon name="link" className="text-primary" size={20} />
              <h5 className="card-title fw-bold text-body-emphasis mb-0">Lối tắt công cụ thường dùng</h5>
            </div>
            <div className="card-body p-4">
              <div className="d-grid gap-3">
                {(activeSopData.quickLinks || []).map((link, index) => (
                  <a 
                    key={index} 
                    href={link.url} 
                    className="card bg-body border hover:border-primary text-decoration-none p-3 transition-all duration-200" 
                    style={{ borderRadius: "10px" }}
                  >
                    <div className="d-flex align-items-center justify-content-between gap-3">
                      <div>
                        <span className="fw-bold text-body-emphasis d-block" style={{ fontSize: "13.5px" }}>
                          {link.title}
                        </span>
                        <span className="text-body-secondary small mt-0.5 d-block" style={{ fontSize: "11.5px", lineHeight: "1.3" }}>
                          {link.desc}
                        </span>
                      </div>
                      {/* Icon viền mảnh thay cho emoji */}
                      <span className="d-inline-flex align-items-center justify-content-center text-primary flex-shrink-0">
                        <OutlineIcon name="arrow-right" className="text-primary" size={16} />
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </section>

          {/* SECTION 6: CÂU HỎI THƯỜNG GẶP (FAQs) */}
          <section className="card border shadow-sm bg-body" style={{ borderRadius: "12px" }}>
            <div className="card-header bg-transparent border-bottom py-3 px-4 d-flex align-items-center gap-2">
              <OutlineIcon name="help" className="text-primary" size={20} />
              <h5 className="card-title fw-bold text-body-emphasis mb-0">Câu hỏi thường gặp (FAQs)</h5>
            </div>
            <div className="card-body p-3">
              <div className="accordion d-grid gap-2">
                {(activeSopData.faqs || []).map((faq, index) => {
                  const isOpen = openFaqIndex === index;
                  return (
                    <div key={index} className="border rounded-3 overflow-hidden bg-body">
                      <button
                        className="w-100 text-start py-2.5 px-3 border-0 bg-transparent fw-bold text-body-emphasis d-flex align-items-center justify-content-between gap-3 hover:bg-body-secondary/20 transition-all"
                        style={{ fontSize: "13px" }}
                        onClick={() => toggleFaq(index)}
                        aria-expanded={isOpen}
                      >
                        <span>{faq.q}</span>
                        <OutlineIcon 
                          name="chevron-down" 
                          className="text-body-secondary" 
                          size={12}
                          style={{
                            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                            transition: "transform 0.2s ease"
                          }}
                        />
                      </button>
                      <div 
                        style={{ 
                          maxHeight: isOpen ? "200px" : "0", 
                          overflow: "hidden", 
                          transition: "max-height 0.25s ease-out" 
                        }}
                      >
                        <div className="p-3 pt-1 border-top text-body-secondary bg-body-tertiary/40" style={{ fontSize: "12.5px", lineHeight: "1.5" }}>
                          {faq.a}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

        </div>
      </div>

      {/* SECTION 7: TÀI LIỆU & QUY CHUẨN ĐÍNH KÈM */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="card border shadow-sm bg-body animate-fade-in" style={{ borderRadius: "12px" }}>
            <div className="card-header bg-transparent border-bottom py-3 px-4 d-flex align-items-center gap-2">
              <OutlineIcon name="link" className="text-primary" size={20} />
              <h5 className="card-title fw-bold text-body-emphasis mb-0">Tài liệu & Quy trình đính kèm</h5>
            </div>
            <div className="card-body p-0">
              <DocumentsPage currentUser={currentUser} filterDepartmentId={departmentId} forceCategoryName="Nội dung chung" />
            </div>
          </div>
        </div>
      </div>

      {/* MODAL CHỈNH SỬA NỘI DUNG SOP (DÀNH CHO ADMIN & TRƯỞNG PHÒNG) */}
      {isEditModalOpen && editData && (
        <div className="custom-modal-overlay d-flex align-items-center justify-content-center position-fixed w-100 h-100" style={{ zIndex: 1090, top: 0, left: 0, backgroundColor: "rgba(0, 0, 0, 0.5)" }}>
          <div className="card border shadow-lg bg-body w-100 mx-3 p-0" style={{ maxWidth: "800px", borderRadius: "16px", maxHeight: "90vh", overflow: "hidden" }}>
            <div className="card-header border-bottom bg-transparent py-3 px-4 d-flex align-items-center justify-content-between">
              <h5 className="card-title fw-bold text-body-emphasis mb-0 d-flex align-items-center gap-2">
                <OutlineIcon name="edit" className="text-primary" size={20} />
                Biên tập Nội dung chung (SOP)
              </h5>
              <button 
                type="button" 
                className="btn-close border-0 bg-transparent text-body-secondary fs-4" 
                onClick={() => setIsEditModalOpen(false)}
              >
                &times;
              </button>
            </div>
            
            <div className="card-body p-4" style={{ overflowY: "auto", maxHeight: "calc(90vh - 140px)" }}>
              {/* Tab 1: Thông tin chung */}
              <div className="mb-4">
                <h6 className="fw-bold text-primary border-bottom pb-2 mb-3">1. Thông tin chung & Sứ mệnh</h6>
                <div className="mb-3">
                  <label className="form-label small fw-bold">Slogan của phòng</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={editData.slogan || ""} 
                    onChange={e => setEditData({ ...editData, slogan: e.target.value })}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-bold">Tầm nhìn & Sứ mệnh</label>
                  <textarea 
                    rows="3" 
                    className="form-control" 
                    value={editData.mission || ""} 
                    onChange={e => setEditData({ ...editData, mission: e.target.value })}
                  ></textarea>
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-bold">Ảnh bìa phòng ban</label>
                  <input
                    type="file"
                    ref={bannerFileRef}
                    accept="image/*"
                    className="d-none"
                    onChange={handleBannerFileUpload}
                  />
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1.5"
                      onClick={() => bannerFileRef.current?.click()}
                    >
                      <OutlineIcon name="edit" className="text-primary" size={14} />
                      Chọn ảnh từ máy tính
                    </button>
                    {editData.image && (
                      <span className="small text-success fw-bold" style={{ fontSize: "11px" }}>✓ Đã chọn ảnh</span>
                    )}
                  </div>
                  <input 
                    type="text" 
                    className="form-control font-mono" 
                    placeholder="URL ảnh hoặc bấm chọn ảnh từ máy tính ở trên..."
                    value={editData.image || ""} 
                    onChange={e => setEditData({ ...editData, image: e.target.value })}
                  />
                </div>
              </div>

              {/* Tab 2: OKRs Chiến lược */}
              <div className="mb-4">
                <div className="d-flex align-items-center justify-content-between border-bottom pb-2 mb-3">
                  <h6 className="fw-bold text-primary mb-0">2. Mục tiêu & OKRs</h6>
                  <button 
                    type="button"
                    onClick={() => {
                      const nextOkrs = [...(editData.okrs || []), { target: "Mục tiêu mới", progress: 50 }];
                      setEditData({ ...editData, okrs: nextOkrs });
                    }}
                    className="btn btn-sm btn-outline-primary border px-2.5 py-1 d-flex align-items-center gap-1"
                    style={{ fontSize: "11px", fontWeight: "600" }}
                  >
                    <OutlineIcon name="plus" className="text-primary" size={12} />
                    Thêm OKR
                  </button>
                </div>
                <div className="d-grid gap-3">
                  {(editData.okrs || []).map((okr, idx) => (
                    <div key={idx} className="d-flex gap-2 align-items-center border p-2 rounded-3">
                      <div className="flex-grow-1">
                        <input 
                          type="text" 
                          className="form-control form-control-sm mb-1" 
                          value={okr.target} 
                          placeholder="Mục tiêu OKR"
                          onChange={e => {
                            const list = [...editData.okrs];
                            list[idx].target = e.target.value;
                            setEditData({ ...editData, okrs: list });
                          }}
                        />
                      </div>
                      <div style={{ width: "100px" }}>
                        <div className="input-group input-group-sm">
                          <input 
                            type="number" 
                            className="form-control form-control-sm" 
                            value={okr.progress} 
                            min="0"
                            max="100"
                            onChange={e => {
                              const list = [...editData.okrs];
                              list[idx].progress = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                              setEditData({ ...editData, okrs: list });
                            }}
                          />
                          <span className="input-group-text" style={{ fontSize: "11px" }}>%</span>
                        </div>
                      </div>
                      <button 
                        type="button"
                        className="btn btn-sm btn-outline-danger border p-1"
                        onClick={() => {
                          const list = editData.okrs.filter((_, i) => i !== idx);
                          setEditData({ ...editData, okrs: list });
                        }}
                      >
                        <OutlineIcon name="trash" className="text-danger" size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tab 3: Lối tắt công cụ */}
              <div className="mb-4">
                <div className="d-flex align-items-center justify-content-between border-bottom pb-2 mb-3">
                  <h6 className="fw-bold text-primary mb-0">3. Lối tắt công cụ (Quick Links)</h6>
                  <button 
                    type="button"
                    onClick={() => {
                      const nextLinks = [...(editData.quickLinks || []), { title: "Công cụ mới", desc: "Mô tả công cụ", url: "#" }];
                      setEditData({ ...editData, quickLinks: nextLinks });
                    }}
                    className="btn btn-sm btn-outline-primary border px-2.5 py-1 d-flex align-items-center gap-1"
                    style={{ fontSize: "11px", fontWeight: "600" }}
                  >
                    <OutlineIcon name="plus" className="text-primary" size={12} />
                    Thêm liên kết
                  </button>
                </div>
                <div className="d-grid gap-3">
                  {(editData.quickLinks || []).map((link, idx) => (
                    <div key={idx} className="border p-3 rounded-3 d-grid gap-2 position-relative">
                      <button 
                        type="button"
                        className="btn btn-sm btn-outline-danger border p-1 position-absolute top-2 end-2"
                        onClick={() => {
                          const list = editData.quickLinks.filter((_, i) => i !== idx);
                          setEditData({ ...editData, quickLinks: list });
                        }}
                      >
                        <OutlineIcon name="trash" className="text-danger" size={14} />
                      </button>
                      <div className="row g-2">
                        <div className="col-md-4">
                          <label className="form-label small mb-0.5 fw-semibold" style={{ fontSize: "11px" }}>Tên công cụ</label>
                          <input 
                            type="text" 
                            className="form-control form-control-sm" 
                            value={link.title} 
                            onChange={e => {
                              const list = [...editData.quickLinks];
                              list[idx].title = e.target.value;
                              setEditData({ ...editData, quickLinks: list });
                            }}
                          />
                        </div>
                        <div className="col-md-5">
                          <label className="form-label small mb-0.5 fw-semibold" style={{ fontSize: "11px" }}>Mô tả ngắn</label>
                          <input 
                            type="text" 
                            className="form-control form-control-sm" 
                            value={link.desc} 
                            onChange={e => {
                              const list = [...editData.quickLinks];
                              list[idx].desc = e.target.value;
                              setEditData({ ...editData, quickLinks: list });
                            }}
                          />
                        </div>
                        <div className="col-md-3">
                          <label className="form-label small mb-0.5 fw-semibold" style={{ fontSize: "11px" }}>Đường dẫn (URL)</label>
                          <input 
                            type="text" 
                            className="form-control form-control-sm" 
                            value={link.url} 
                            onChange={e => {
                              const list = [...editData.quickLinks];
                              list[idx].url = e.target.value;
                              setEditData({ ...editData, quickLinks: list });
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tab 4: Câu hỏi thường gặp FAQs */}
              <div className="mb-4">
                <div className="d-flex align-items-center justify-content-between border-bottom pb-2 mb-3">
                  <h6 className="fw-bold text-primary mb-0">4. Câu hỏi thường gặp (FAQs)</h6>
                  <button 
                    type="button"
                    onClick={() => {
                      const nextFaqs = [...(editData.faqs || []), { q: "Câu hỏi thường gặp?", a: "Câu trả lời của phòng ban." }];
                      setEditData({ ...editData, faqs: nextFaqs });
                    }}
                    className="btn btn-sm btn-outline-primary border px-2.5 py-1 d-flex align-items-center gap-1"
                    style={{ fontSize: "11px", fontWeight: "600" }}
                  >
                    <OutlineIcon name="plus" className="text-primary" size={12} />
                    Thêm FAQ
                  </button>
                </div>
                <div className="d-grid gap-3">
                  {(editData.faqs || []).map((faq, idx) => (
                    <div key={idx} className="border p-3 rounded-3 d-grid gap-2 position-relative">
                      <button 
                        type="button"
                        className="btn btn-sm btn-outline-danger border p-1 position-absolute top-2 end-2"
                        onClick={() => {
                          const list = editData.faqs.filter((_, i) => i !== idx);
                          setEditData({ ...editData, faqs: list });
                        }}
                      >
                        <OutlineIcon name="trash" className="text-danger" size={14} />
                      </button>
                      <div className="mb-2">
                        <label className="form-label small mb-0.5 fw-semibold" style={{ fontSize: "11px" }}>Câu hỏi</label>
                        <input 
                          type="text" 
                          className="form-control form-control-sm" 
                          value={faq.q} 
                          onChange={e => {
                            const list = [...editData.faqs];
                            list[idx].q = e.target.value;
                            setEditData({ ...editData, faqs: list });
                          }}
                        />
                      </div>
                      <div>
                        <label className="form-label small mb-0.5 fw-semibold" style={{ fontSize: "11px" }}>Câu trả lời</label>
                        <textarea 
                          rows="2" 
                          className="form-control form-control-sm" 
                          value={faq.a} 
                          onChange={e => {
                            const list = [...editData.faqs];
                            list[idx].a = e.target.value;
                            setEditData({ ...editData, faqs: list });
                          }}
                        ></textarea>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="card-footer border-top bg-transparent py-3 px-4 d-flex align-items-center justify-content-between">
              <button 
                type="button" 
                className="btn btn-sm btn-outline-danger border px-3" 
                onClick={handleResetToDefault}
              >
                Khôi phục mặc định gốc
              </button>
              <div className="d-flex gap-2">
                <button 
                  type="button" 
                  className="btn btn-sm btn-light border px-3" 
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Hủy
                </button>
                <button 
                  type="button" 
                  className="btn btn-sm btn-primary px-4 fw-bold" 
                  onClick={handleSaveEdit}
                >
                  Lưu thay đổi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CHỈNH SỬA / THÊM MỚI VỊ TRÍ SƠ ĐỒ CÂY TỔ CHỨC */}
      {isOrgNodeModalOpen && (
        <div className="custom-modal-overlay d-flex align-items-center justify-content-center position-fixed w-100 h-100" style={{ zIndex: 1095, top: 0, left: 0, backgroundColor: "rgba(0, 0, 0, 0.5)" }}>
          <div className="card border shadow-lg bg-body w-100 mx-3 p-0" style={{ maxWidth: "520px", borderRadius: "16px", overflow: "hidden" }}>
            <div className="card-header border-bottom bg-transparent py-3 px-4 d-flex align-items-center justify-content-between">
              <h5 className="card-title fw-bold text-body-emphasis mb-0 d-flex align-items-center gap-2">
                <OutlineIcon name="users" className="text-primary" size={20} />
                {editingNode ? "Chỉnh sửa vị trí sơ đồ" : "Thêm vị trí vào Sơ đồ cây"}
              </h5>
              <button 
                type="button" 
                className="btn-close border-0 bg-transparent text-body-secondary fs-4" 
                onClick={() => setIsOrgNodeModalOpen(false)}
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSaveNodeForm}>
              <div className="card-body p-4">
                {/* 1. Select from Department Members */}
                {members.length > 0 && (
                  <div className="mb-3 p-2.5 bg-body-tertiary rounded-3 border">
                    <label className="form-label small fw-bold text-primary mb-1">
                      Chọn nhanh nhân sự có sẵn trong phòng ban:
                    </label>
                    <select
                      className="form-select form-select-sm"
                      value=""
                      onChange={(e) => {
                        const selectedId = e.target.value;
                        const m = members.find((user) => String(user.id) === String(selectedId));
                        if (m) {
                          setNodeForm({
                            ...nodeForm,
                            fullName: m.fullName,
                            role: m.role || nodeForm.role,
                            avatarUrl: m.avatarUrl || nodeForm.avatarUrl || "/assets/images/avatar/avatar1.webp",
                          });
                        }
                      }}
                    >
                      <option value="">-- Click để chọn nhân sự tự động --</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.fullName} ({m.role || "Nhân sự"})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="mb-3">
                  <label className="form-label small fw-bold">Chức danh / Vị trí hiển thị <span className="text-danger">*</span></label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required
                    placeholder="Ví dụ: TRƯỞNG BỘ PHẬN, Kỹ năng viên Kinh doanh, Chuyên viên nhiệm vụ..." 
                    value={nodeForm.title} 
                    onChange={e => setNodeForm({ ...nodeForm, title: e.target.value })}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-bold">Họ và tên nhân sự <span className="text-danger">*</span></label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required
                    placeholder="Nhập họ và tên..." 
                    value={nodeForm.fullName} 
                    onChange={e => setNodeForm({ ...nodeForm, fullName: e.target.value })}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-bold">Mô tả ngắn / Chuyên môn</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Ví dụ: Quản lý bộ phận, Kỹ năng viên Kinh doanh..." 
                    value={nodeForm.role} 
                    onChange={e => setNodeForm({ ...nodeForm, role: e.target.value })}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-bold">Ảnh đại diện (Avatar)</label>
                  <input
                    type="file"
                    ref={nodeAvatarFileRef}
                    accept="image/*"
                    className="d-none"
                    onChange={handleAvatarFileUpload}
                  />
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1.5"
                      onClick={() => nodeAvatarFileRef.current?.click()}
                    >
                      <OutlineIcon name="edit" className="text-primary" size={14} />
                      Chọn ảnh từ máy tính
                    </button>
                    {nodeForm.avatarUrl && (
                      <div className="d-flex align-items-center gap-1.5 bg-body-tertiary px-2 py-1 rounded border">
                        <img
                          src={nodeForm.avatarUrl}
                          alt="Preview"
                          className="rounded-circle border"
                          style={{ width: "24px", height: "24px", objectFit: "cover" }}
                        />
                        <span className="small text-success fw-bold" style={{ fontSize: "11px" }}>Đã chọn ảnh</span>
                      </div>
                    )}
                  </div>

                  <div className="input-group input-group-sm mb-1.5">
                    <input 
                      type="text" 
                      className="form-control font-mono" 
                      placeholder="/assets/images/avatar/avatar1.webp hoặc URL ảnh..." 
                      value={nodeForm.avatarUrl} 
                      onChange={e => setNodeForm({ ...nodeForm, avatarUrl: e.target.value })}
                    />
                  </div>
                  <div className="d-flex align-items-center gap-1.5 flex-wrap">
                    <span className="small text-body-secondary" style={{ fontSize: "11px" }}>Mẫu avatar:</span>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => {
                      const url = `/assets/images/avatar/avatar${num}.webp`;
                      return (
                        <img
                          key={num}
                          src={url}
                          alt={`Avatar ${num}`}
                          className={`rounded-circle cursor-pointer border ${nodeForm.avatarUrl === url ? "border-primary border-2" : ""}`}
                          style={{ width: "26px", height: "26px", objectFit: "cover" }}
                          onClick={() => setNodeForm({ ...nodeForm, avatarUrl: url })}
                          title={`Chọn Avatar ${num}`}
                        />
                      );
                    })}
                  </div>
                </div>

                <div className="mb-2">
                  <label className="form-label small fw-bold">Cấp bậc hiển thị trên sơ đồ cây</label>
                  <select 
                    className="form-select" 
                    value={nodeForm.level} 
                    onChange={e => setNodeForm({ ...nodeForm, level: e.target.value })}
                  >
                    <option value="leader">Cấp trên (Lãnh đạo / Trưởng phòng - Khung màu xanh nổi bật)</option>
                    <option value="member">Cấp dưới (Thành viên / Chuyên viên - Khung màu trắng bên dưới)</option>
                  </select>
                </div>
              </div>

              <div className="card-footer border-top bg-transparent py-3 px-4 d-flex align-items-center justify-content-end gap-2">
                <button 
                  type="button" 
                  className="btn btn-sm btn-light border px-3" 
                  onClick={() => setIsOrgNodeModalOpen(false)}
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="btn btn-sm btn-primary px-4 fw-bold"
                >
                  {editingNode ? "Lưu thay đổi" : "Thêm vị trí"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
