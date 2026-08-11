// ============================================================================
// KHU VỰC LƯU TRỮ TÀI LIỆU HƯỚNG DẪN - Nội dung cẩm nang sử dụng Portal HTO
// ============================================================================
// File này chỉ chứa DỮ LIỆU (nội dung hướng dẫn), tách riêng khỏi UI
// (UserGuidePage.jsx) để dễ bảo trì - khi có tính năng mới, chỉ cần bổ sung
// thêm 1 object "article" vào category phù hợp bên dưới, không cần đụng vào
// code giao diện.
//
// Cấu trúc 1 category:
// { id, label, description, articles: [ {id, title, audience, summary,
//   steps: [...], tips: [...], related: [tourPageKey] } ] }
//
// "related" (nếu có) là key trang tương ứng trong PAGE_TOURS (App.jsx) - dùng
// để hiển thị nút "Xem hướng dẫn nhanh trên trang" ngay trong bài viết, giúp
// người dùng bật lại tour pop-up ngay tại đây mà không cần rời trang.

export const GUIDE_CATEGORIES = [
  // ==========================================================================
  {
    id: "bat-dau",
    label: "Bắt đầu",
    description: "Làm quen với Portal trong 5 phút đầu tiên",
    articles: [
      {
        id: "dang-nhap",
        title: "Đăng nhập & Bảo mật tài khoản",
        audience: "Tất cả nhân viên & CTV",
        summary: "Cách đăng nhập, xử lý khi quên mật khẩu và giữ tài khoản an toàn.",
        steps: [
          "Truy cập địa chỉ Portal do công ty cung cấp, nhập Email và Mật khẩu được cấp ban đầu.",
          "Nếu quên mật khẩu, bấm \"Quên mật khẩu\" ngay trên màn hình đăng nhập, nhập email đã đăng ký - hệ thống sẽ gửi đường dẫn đặt lại mật khẩu qua email trong vòng 5 phút.",
          "Sau lần đăng nhập đầu tiên, vào biểu tượng ảnh đại diện (góc trên bên phải) → \"Trang cá nhân\" → \"Bảo mật tài khoản\" để đổi sang mật khẩu riêng của bạn.",
          "Không chia sẻ mật khẩu cho người khác. Nếu nghi ngờ tài khoản bị lộ, đổi mật khẩu ngay và báo Quản trị viên.",
        ],
        tips: [
          "Tài khoản đăng nhập sai quá nhiều lần có thể bị tạm khóa - liên hệ Admin nếu bị khóa.",
          "Bạn KHÔNG thể tự đổi tên hiển thị trên hệ thống - việc này do Admin thiết lập.",
        ],
      },
      {
        id: "trang-chu",
        title: "Trang chủ (Dashboard cá nhân)",
        audience: "Tất cả nhân viên & CTV",
        summary: "Nơi tổng hợp nhanh công việc, thông báo và số liệu quan trọng nhất của bạn mỗi khi đăng nhập.",
        steps: [
          "Sau khi đăng nhập, bạn sẽ vào thẳng Trang chủ - nơi hiển thị lời chào, tóm tắt công việc và các chỉ số liên quan tới vai trò của bạn.",
          "Với CTV/Đại lý: xem nhanh số Lead đã gửi, hoa hồng dự kiến, hạng thành viên hiện tại.",
          "Với Quản lý/Admin: xem nhanh số liệu vận hành toàn hệ thống (nếu có quyền truy cập trang Thống kê riêng).",
          "Dùng thanh điều hướng bên trái (Sidebar) để di chuyển tới bất kỳ phân hệ nào - menu được nhóm theo chức năng (Sản phẩm, Nghiệp vụ, Hỗ trợ, Tin tức, Quản trị...).",
        ],
        tips: [
          "Lần đầu vào mỗi trang mới, hệ thống sẽ tự hiện 1 tour pop-up giới thiệu nhanh các khu vực chính - bạn có thể bấm \"Đã hiểu!\" để tắt hoặc xem lại bất cứ lúc nào qua nút hướng dẫn ở góc trên (biểu tượng 💡) trên mỗi trang.",
        ],
        related: "dashboard",
      },
      {
        id: "trang-ca-nhan",
        title: "Trang cá nhân (Profile)",
        audience: "Tất cả nhân viên & CTV",
        summary: "Xem/cập nhật thông tin cá nhân, đổi mật khẩu và theo dõi thành tích của riêng bạn.",
        steps: [
          "Bấm vào ảnh đại diện ở góc trên bên phải màn hình → chọn \"Trang cá nhân\".",
          "Tab thông tin chung: xem họ tên, email, số điện thoại, phòng ban, vai trò hiện tại (một số trường chỉ Admin mới sửa được).",
          "Tab bảo mật: đổi mật khẩu đăng nhập.",
          "Với CTV/Đại lý: có thêm tab thống kê cá nhân (số Lead, doanh số, hạng thành viên, mã giới thiệu riêng để chia sẻ cho khách hàng).",
        ],
        related: "profile",
      },
      {
        id: "thong-bao",
        title: "Thông báo nội bộ",
        audience: "Tất cả nhân viên & CTV",
        summary: "Trung tâm nhận mọi thông báo quan trọng từ hệ thống và từ Quản lý/Admin.",
        steps: [
          "Bấm biểu tượng chuông ở thanh điều hướng trên cùng, hoặc vào mục \"Thông báo\" ở Sidebar để xem toàn bộ.",
          "Số màu đỏ trên biểu tượng chuông là số thông báo CHƯA ĐỌC.",
          "Dùng bộ lọc để xem \"Tất cả\", \"Chưa đọc\" hoặc \"Đã đọc\".",
          "Bấm vào 1 thông báo để đọc chi tiết, sau đó có thể \"Đánh dấu đã đọc\".",
          "(Admin/Quản lý) Có thể soạn và gửi thông báo mới tới toàn hệ thống hoặc một nhóm/phòng ban cụ thể ngay tại trang này.",
        ],
        related: "notifications",
      },
    ],
  },

  // ==========================================================================
  {
    id: "san-pham-dich-vu",
    label: "Sản phẩm & Dịch vụ",
    description: "Toàn bộ thông tin về các gói du học, định cư, visa, đào tạo ngôn ngữ HTO đang cung cấp",
    articles: [
      {
        id: "tong-quan-san-pham",
        title: "Tổng quan sản phẩm (Du học / Định cư / Visa / Đào tạo)",
        audience: "Tất cả nhân viên & CTV",
        summary: "Nơi tra cứu đầy đủ các gói dịch vụ HTO đang bán để tư vấn khách hàng chính xác.",
        steps: [
          "Vào Sidebar → \"Sản phẩm\" để xem toàn bộ danh mục: Du học, Định cư, Visa, Đào tạo ngôn ngữ.",
          "Dùng ô tìm kiếm và bộ lọc trên đầu trang để nhanh chóng tìm đúng nhóm sản phẩm/quốc gia cần tư vấn.",
          "Bấm vào từng thẻ sản phẩm/chương trình để xem chi tiết: mô tả, chi phí, điều kiện, tài liệu tư vấn nội bộ, brochure đính kèm.",
          "Dùng thông tin này để tư vấn khách hàng chính xác - không tự ý báo giá/điều kiện khác với dữ liệu trên hệ thống.",
        ],
        tips: [
          "Nếu thấy thông tin sản phẩm sai/lỗi thời, hãy báo ngay cho phòng phụ trách sản phẩm hoặc tạo Ticket hỗ trợ để được cập nhật kịp thời, tránh tư vấn sai cho khách.",
        ],
        related: "products",
      },
      {
        id: "quan-ly-san-pham",
        title: "Quản lý sản phẩm (dành cho Admin/Quản lý)",
        audience: "Admin / Trưởng bộ phận được phân quyền",
        summary: "Thêm mới, chỉnh sửa, ẩn/hiện các danh mục và chương trình sản phẩm hiển thị ra toàn hệ thống.",
        steps: [
          "Vào Sidebar → \"Quản lý sản phẩm\" (chỉ hiển thị với tài khoản có quyền phù hợp).",
          "Tạo danh mục mới (vd: thêm 1 quốc gia du học mới) hoặc chỉnh sửa danh mục sẵn có.",
          "Trong mỗi danh mục, thêm/sửa/xóa từng chương trình/gói sản phẩm cụ thể: tên, mô tả, chi phí, tài liệu đính kèm, trạng thái hiển thị.",
          "Thay đổi tại đây sẽ cập nhật NGAY LẬP TỨC lên trang \"Tổng quan sản phẩm\" mà toàn bộ nhân viên/CTV đang xem - hãy kiểm tra kỹ nội dung trước khi lưu.",
        ],
        related: "productManagement",
      },
      {
        id: "nop-ho-so-online",
        title: "Nộp hồ sơ online",
        audience: "Tất cả nhân viên & CTV",
        summary: "Hướng dẫn khách hàng hoặc tự thay mặt khách hàng nộp hồ sơ đăng ký một chương trình cụ thể qua form online.",
        steps: [
          "Vào Sidebar → \"Nộp hồ sơ online\" (nằm trong nhóm Sản phẩm).",
          "Chọn đúng chương trình/gói dịch vụ khách hàng muốn đăng ký.",
          "Điền đầy đủ thông tin khách hàng và tải lên các giấy tờ cần thiết theo yêu cầu của từng chương trình (CCCD/Hộ chiếu, bảng điểm, v.v.).",
          "Kiểm tra lại toàn bộ thông tin trước khi bấm Nộp - hồ sơ sẽ được chuyển tới bộ phận xử lý phù hợp.",
        ],
        related: "nophosoonline",
      },
      {
        id: "dao-tao",
        title: "Đào tạo ngôn ngữ",
        audience: "Tất cả nhân viên & CTV",
        summary: "Tra cứu các khóa đào tạo ngoại ngữ (chuẩn bị hồ sơ du học) mà HTO/Hallo Sài Gòn đang triển khai.",
        steps: [
          "Vào Sidebar → \"Đào tạo\" để xem danh sách các khóa học ngôn ngữ hiện có.",
          "Xem thông tin chi tiết từng khóa: ngôn ngữ, cấp độ, lịch học, học phí, hình thức học (online/offline).",
          "Dùng thông tin này để tư vấn khách hàng kết hợp gói du học + khóa học ngôn ngữ chuẩn bị hồ sơ.",
        ],
        related: "daotao",
      },
      {
        id: "tra-cuu-thi-truong-du-hoc",
        title: "Tra cứu thị trường du học (Trường học theo quốc gia)",
        audience: "Tất cả nhân viên & CTV",
        summary: "Cơ sở dữ liệu các trường học ở nhiều quốc gia, đồng bộ trực tiếp từ nguồn dữ liệu tuyển sinh, hỗ trợ tra cứu học phí, khu vực, hệ tuyển sinh theo đúng ngân sách khách hàng.",
        steps: [
          "Vào Sidebar → \"Nghiệp vụ\" → \"Tra cứu trường du học\".",
          "Bấm nút \"Bộ lọc\" để mở bảng lọc nằm ngang phía trên bảng dữ liệu, gồm: Quốc gia, Chương trình, Khu vực, Hệ tuyển sinh và khoảng Học phí (ngân sách).",
          "Nhập khoảng học phí \"Từ\" - \"Đến\" nếu khách hàng có ngân sách cụ thể - hệ thống sẽ tự lọc ra các trường phù hợp (tự nhận diện cột học phí theo từng nguồn dữ liệu, kể cả đơn vị tiền tệ khác nhau).",
          "Dùng ô tìm kiếm phía trên để tìm nhanh theo tên trường hoặc từ khóa bất kỳ.",
          "Bấm vào 1 dòng bất kỳ trong bảng để xem đầy đủ thông tin chi tiết của trường đó trong hộp thoại popup.",
          "Các cột có chứa link (hình ảnh, brochure...) sẽ hiển thị nút mở link riêng, bấm vào để xem/tải tài liệu gốc.",
        ],
        tips: [
          "Nếu chọn Quốc gia/Chương trình mà bảng chưa có dữ liệu học phí, hệ thống sẽ báo rõ thay vì hiển thị danh sách trống gây khó hiểu.",
          "Bộ lọc có thể thu gọn lại khi không cần dùng để có thêm không gian xem bảng dữ liệu - bấm lại nút \"Bộ lọc\" để mở ra bất cứ lúc nào.",
        ],
        related: "schoolSearch",
      },
    ],
  },

  // ==========================================================================
  {
    id: "nghiep-vu",
    label: "Nghiệp vụ & Chăm sóc khách hàng",
    description: "Quy trình làm việc hằng ngày: gửi Lead, theo dõi hồ sơ, đối soát hoa hồng",
    articles: [
      {
        id: "gui-lead",
        title: "Gửi Lead khách hàng (CTV/Đại lý)",
        audience: "CTV / Đại lý / Nhân viên tư vấn",
        summary: "Cách ghi nhận một khách hàng tiềm năng vào hệ thống CRM để bắt đầu quy trình tư vấn và tính hoa hồng.",
        steps: [
          "Vào Sidebar → \"Hỗ trợ\" → \"Gửi lead khách hàng\".",
          "Theo dõi chỉ số % \"Tiến độ hoàn thiện Form\" ở đầu trang - cố gắng đạt tối thiểu 80% trước khi gửi để CRM xử lý chính xác nhất.",
          "Điền đầy đủ: họ tên khách hàng, số điện thoại, email, sản phẩm/dịch vụ khách quan tâm, kênh nguồn (Facebook, giới thiệu, Zalo...) và ghi chú thêm nếu có.",
          "Xem trước dữ liệu JSON ở khung bên phải (nếu bạn muốn kiểm tra kỹ thông tin trước khi gửi).",
          "Bấm \"Gửi\" - hệ thống sẽ báo kết quả ngay lập tức và tự động đồng bộ lead sang CRM trung tâm.",
        ],
        tips: [
          "Nếu bạn gửi trùng thông tin một khách hàng đã có trong hệ thống (cùng SĐT/email) trong thời gian gần đây, hệ thống sẽ tự phát hiện và cảnh báo cho Quản lý để tránh 2 CTV cùng chăm sóc 1 khách gây tranh chấp hoa hồng - đây là điều bình thường, không phải lỗi.",
          "Sau khi gửi, khách hàng sẽ nhận được 1 email xác nhận tự động - bạn có thể yên tâm là hệ thống đã ghi nhận thành công.",
        ],
        related: "leadForm",
      },
      {
        id: "theo-doi-lead",
        title: "Theo dõi trạng thái Lead sau khi gửi",
        audience: "CTV / Đại lý / Nhân viên tư vấn",
        summary: "Sau khi gửi Lead, đây là những gì diễn ra phía sau và cách bạn biết khi nào cần liên hệ lại khách hàng.",
        steps: [
          "Lead mới sẽ được tự động phân công cho nhân sự phụ trách (nếu bạn không phải người trực tiếp giới thiệu) hoặc gắn với chính bạn (nếu bạn là người giới thiệu).",
          "Bạn sẽ nhận được thông báo trong hệ thống (mục Thông báo) và email khi có Lead mới cần xử lý.",
          "Nếu 1 Lead chưa được cập nhật trạng thái sau một khoảng thời gian (mặc định 24 giờ), hệ thống sẽ tự động nhắc bạn qua thông báo/email - hãy chủ động liên hệ lại khách hàng khi thấy nhắc nhở này.",
          "Trạng thái Lead gồm: Đang tư vấn → Chờ chốt hợp đồng → Xử lý hồ sơ (đã chốt deal) hoặc Thất bại.",
          "Khi Lead chuyển sang \"Xử lý hồ sơ\", hoa hồng dự kiến của bạn sẽ được ghi nhận tại mục Nghiệp vụ → Đối soát hoa hồng.",
        ],
        tips: [
          "Lead ở trạng thái \"Đang tư vấn\" quá lâu (mặc định 14 ngày) mà không có cập nhật sẽ tự động chuyển sang \"Thất bại\" - hãy cập nhật trạng thái thường xuyên để không bị đóng nhầm.",
        ],
      },
      {
        id: "doi-soat-hoa-hong",
        title: "Đối soát hoa hồng (Nghiệp vụ)",
        audience: "CTV / Đại lý / Kế toán / Quản lý",
        summary: "Theo dõi hoa hồng dự kiến, điều kiện ghi nhận và trạng thái đối soát với phòng kế toán.",
        steps: [
          "Vào Sidebar → \"Nghiệp vụ\" → \"Đối soát hoa hồng\" (hoặc mục tương đương trong \"Nghiệp vụ\").",
          "Xem bảng chỉ số nghiệp vụ: hoa hồng dự kiến, doanh thu đã ghi nhận, số hồ sơ đủ điều kiện, trạng thái đối soát kế toán.",
          "Bấm \"Đồng bộ CRM\" khi có dữ liệu deal mới từ CRM cần cập nhật vào hệ thống (hồ sơ khách hàng, người phụ trách, trạng thái ký hợp đồng).",
          "Đọc kỹ khung \"Điều kiện ghi nhận hoa hồng\": cần đủ 3 bước - dữ liệu CRM hợp lệ → Kế toán xác nhận khoản thu → Đối soát hoàn tất - thì hoa hồng mới chính thức hiển thị.",
          "Nếu bảng chưa có số liệu, nghĩa là chưa đủ điều kiện ở trên, không phải lỗi hệ thống.",
        ],
        tips: [
          "(Admin/Kế toán) Nếu có khoản hoa hồng ở trạng thái \"Chờ đối soát\" quá lâu (mặc định 7 ngày), hệ thống sẽ tự động gửi email + thông báo nhắc xử lý.",
        ],
        related: "nghiepvu",
      },
      {
        id: "checklist-sop",
        title: "Checklist công việc & Quy trình chuẩn (SOP)",
        audience: "Tất cả nhân viên & CTV",
        summary: "Danh sách việc cần làm theo từng giai đoạn hồ sơ và tài liệu quy trình chuẩn của từng phòng ban.",
        steps: [
          "Checklist: vào Sidebar → \"Nghiệp vụ\" → \"Checklist\" để xem/đánh dấu các đầu việc cần hoàn thành theo từng giai đoạn xử lý hồ sơ khách hàng.",
          "SOP (Standard Operating Procedure): vào Sidebar → \"Nghiệp vụ\" → \"SOP\" để tra cứu quy trình làm việc chuẩn của từng phòng ban/nghiệp vụ - luôn thực hiện đúng theo SOP để đảm bảo chất lượng dịch vụ đồng nhất.",
        ],
      },
    ],
  },

  // ==========================================================================
  {
    id: "ho-tro-khach-hang",
    label: "Hỗ trợ & Tra cứu",
    description: "FAQ, gửi yêu cầu hỗ trợ kỹ thuật và tra cứu tài liệu nội bộ",
    articles: [
      {
        id: "faq-ticket",
        title: "Câu hỏi thường gặp (FAQ) & Tạo Ticket hỗ trợ",
        audience: "Tất cả nhân viên & CTV",
        summary: "Tự tra cứu câu trả lời nhanh hoặc gửi yêu cầu hỗ trợ kỹ thuật khi gặp sự cố.",
        steps: [
          "Vào Sidebar → \"Hỗ trợ\" để mở trang FAQ & Ticket.",
          "Tab FAQ: chọn danh mục (Tài khoản, Lead, JD, Hoa hồng, Audit Log, CRM, Quy định chung) hoặc gõ từ khóa để tìm câu trả lời có sẵn - phần lớn thắc mắc thường gặp đã có lời giải ở đây.",
          "Nếu không tìm được câu trả lời phù hợp, bấm \"Tạo Ticket\" (hoặc Sidebar → \"Hỗ trợ\" → \"Tạo Ticket\"), mô tả rõ vấn đề, chọn phân loại và mức độ ưu tiên.",
          "Theo dõi phản hồi từ đội kỹ thuật ngay trong chi tiết Ticket - bạn có thể trả lời thêm nếu cần bổ sung thông tin.",
        ],
        related: "hotro",
      },
      {
        id: "kho-tai-lieu",
        title: "Kho tài liệu & Biểu mẫu",
        audience: "Tất cả nhân viên & CTV (theo phân quyền)",
        summary: "Nơi lưu trữ tập trung mọi tài liệu, hợp đồng mẫu, biểu mẫu của công ty - phân quyền truy cập theo phòng ban.",
        steps: [
          "Vào Sidebar → \"Tài liệu & Biểu mẫu\" để xem danh mục tài liệu.",
          "Dùng dropdown lọc theo danh mục (hợp đồng, quy trình, biểu mẫu...) để thu hẹp kết quả.",
          "Bấm vào tài liệu để xem, tải xuống hoặc lấy link chia sẻ.",
          "Nếu KHÔNG thấy tài liệu bạn cần, rất có thể do phân quyền theo phòng ban (HR, Kế toán, Sales...) - liên hệ Trưởng bộ phận hoặc Admin để được cấp quyền phù hợp.",
          "(Admin/Quản lý) Có thể tải tài liệu mới lên (từ máy tính hoặc dán link Google Drive/OneDrive) và thiết lập quyền Xem/Tải/Sửa cho từng tài liệu.",
        ],
        related: "documents",
      },
      {
        id: "tra-cuu-tai-lieu",
        title: "Tra cứu tài liệu nhanh",
        audience: "Tất cả nhân viên & CTV",
        summary: "Công cụ tìm kiếm nhanh trong toàn bộ kho tài liệu khi bạn chỉ nhớ mang máng tên hoặc nội dung.",
        steps: [
          "Vào Sidebar → \"Tra cứu tài liệu\".",
          "Gõ từ khóa liên quan đến tên tài liệu hoặc nội dung cần tìm.",
          "Kết quả trả về sẽ được sắp xếp theo độ liên quan, bấm vào kết quả để mở tài liệu tương ứng.",
        ],
      },
    ],
  },

  // ==========================================================================
  {
    id: "tin-tuc-media",
    label: "Tin tức, Sự kiện & Kho Media",
    description: "Cập nhật thông tin nội bộ và khai thác tư liệu truyền thông/minh chứng visa",
    articles: [
      {
        id: "tin-tuc-su-kien",
        title: "Tin tức & Sự kiện",
        audience: "Tất cả nhân viên & CTV",
        summary: "Cập nhật thông báo, chính sách mới và lịch các sự kiện nội bộ của HTO.",
        steps: [
          "Vào Sidebar → \"Tin tức & Sự kiện\" để xem danh sách bài viết.",
          "Dùng ô tìm kiếm hoặc bộ lọc (Tất cả / Tin tức / Sự kiện) để thu hẹp danh sách.",
          "Bấm vào bài viết để đọc chi tiết hoặc lấy link chia sẻ cho đồng nghiệp.",
          "Xem thanh bên phải để biết tin nổi bật, bài đọc nhiều và lịch sự kiện sắp diễn ra.",
        ],
        tips: [
          "(Admin/Quản lý) Vào \"Quản lý tin tức\" để đăng bài mới - khi đăng, hệ thống có thể tự động gửi email tóm tắt bài viết tới khách hàng đang được chăm sóc (nếu tính năng Bản tin marketing đang được bật trong Cài đặt hệ thống).",
        ],
        related: "tintuc",
      },
      {
        id: "quan-ly-tin-tuc",
        title: "Quản lý tin tức & sự kiện (dành cho Admin/Quản lý)",
        audience: "Admin / Trưởng bộ phận được phân quyền",
        summary: "Soạn thảo, đăng và quản lý các bài viết tin tức/sự kiện hiển thị cho toàn hệ thống.",
        steps: [
          "Vào Sidebar → \"Quản lý tin tức\" (nằm trong nhóm Tin tức & Sự kiện).",
          "Bấm tạo bài viết mới: chọn loại (Tin tức/Sự kiện), nhập tiêu đề, nội dung, ảnh đại diện, và với Sự kiện cần thêm thời gian/địa điểm diễn ra.",
          "Xem trước bài viết trước khi đăng chính thức để đảm bảo hiển thị đúng như mong muốn.",
          "Sau khi đăng, bài viết xuất hiện ngay trên trang \"Tin tức & Sự kiện\" cho toàn bộ nhân viên/CTV.",
        ],
      },
      {
        id: "kho-media",
        title: "Kho Media (Minh chứng Visa & Video/Content PR)",
        audience: "Tất cả nhân viên & CTV",
        summary: "Kho lưu trữ hình ảnh minh chứng Visa thành công và video/tài liệu truyền thông, phục vụ tư vấn và làm tư liệu PR cho khách hàng.",
        steps: [
          "Vào Sidebar → \"Kho Media\" (nằm trong nhóm Marketing & Hệ thống, dưới mục Quản lý bài viết).",
          "Tab \"Kết quả Visa thành công\": xem lưới ảnh minh chứng, dùng thanh lọc ngang để chọn theo quốc gia (Canada, Úc, Mỹ...).",
          "Bấm vào 1 ảnh để xem phóng to kèm thông tin: quốc gia, loại Visa, tên khách hàng (đã được làm mờ để bảo mật) và ngày cấp.",
          "Tab \"Video & Content PR\": xem danh sách video marketing hoặc tài liệu PR. Video sẽ phát trực tiếp trong popup, tài liệu PDF có nút \"Tải tài liệu\" để tải về máy.",
          "Dùng các minh chứng này khi tư vấn khách hàng (tăng độ tin cậy) hoặc khi cần tư liệu để tự làm nội dung PR/quảng cáo cá nhân.",
        ],
        tips: [
          "Đây là tính năng mới - nếu bạn cần bổ sung thêm minh chứng/video của chính khách hàng mình phụ trách, hãy liên hệ bộ phận Marketing/Admin để được thêm vào kho.",
        ],
        related: "media-repository",
      },
    ],
  },

  // ==========================================================================
  {
    id: "ai-noi-bo",
    label: "Trợ lý AI nội bộ",
    description: "Chatbot hỗ trợ tra cứu nhanh quy trình, tài liệu và tư vấn khách hàng",
    articles: [
      {
        id: "chat-ai",
        title: "Sử dụng Trợ lý AI (Chatbot)",
        audience: "Tất cả nhân viên & CTV",
        summary: "Chatbot nội bộ giúp trả lời nhanh câu hỏi về quy trình, sản phẩm và hỗ trợ soạn nội dung tư vấn khách hàng.",
        steps: [
          "Vào Sidebar → \"AI nội bộ\" → \"Trò chuyện với AI\" (hoặc biểu tượng chat nếu hiển thị nổi trên giao diện).",
          "Gõ câu hỏi bằng ngôn ngữ tự nhiên - ví dụ: \"Điều kiện visa du học Canada là gì?\" hoặc \"Quy trình xử lý hồ sơ định cư Đức gồm những bước nào?\".",
          "AI sẽ trả lời dựa trên kiến thức nền về công ty và các tài liệu nội bộ đã được nạp - luôn kiểm tra lại thông tin quan trọng (học phí, tỷ lệ đậu visa...) với dữ liệu chính thức trước khi báo cho khách hàng.",
          "Nếu AI không chắc chắn câu trả lời, AI sẽ thành thật báo không biết thay vì bịa thông tin - trường hợp này hãy tra cứu thêm ở Kho tài liệu/SOP hoặc hỏi đồng nghiệp/quản lý.",
        ],
        tips: [
          "Nếu chatbot báo lỗi \"chưa được cấu hình\", nghĩa là Admin chưa nhập API Key - hãy báo cho Admin vào Cài đặt hệ thống để kích hoạt.",
        ],
      },
      {
        id: "cau-hinh-ai",
        title: "Cấu hình AI (dành cho Admin)",
        audience: "Admin",
        summary: "Chọn nguồn tri thức và tinh chỉnh cách chatbot trả lời.",
        steps: [
          "Vào Sidebar → \"AI nội bộ\" → \"Cấu hình AI\".",
          "Chọn các nhóm tài liệu mà AI được phép sử dụng để trả lời câu hỏi (giới hạn phạm vi kiến thức phù hợp).",
          "Tinh chỉnh tham số: chế độ trả lời chính xác/sáng tạo, ngưỡng khớp tài liệu, thông điệp mặc định khi AI không tìm thấy câu trả lời.",
          "Bấm \"Lưu cấu hình AI\" để áp dụng ngay lập tức.",
          "Để cấu hình giọng điệu và API Key, vào Sidebar → \"Cấu hình hệ thống\" → tab \"Chatbot AI\" (xem bài hướng dẫn riêng trong mục Quản trị hệ thống).",
        ],
        related: "aiConfig",
      },
      {
        id: "ai-cau-hoi-cho-lich-su",
        title: "Câu hỏi AI đang chờ duyệt & Lịch sử trò chuyện",
        audience: "Admin / Quản lý",
        summary: "Theo dõi các câu hỏi mà AI chưa trả lời được (cần bổ sung kiến thức) và xem lại lịch sử trò chuyện toàn hệ thống.",
        steps: [
          "\"Câu hỏi AI đang chờ\": liệt kê các câu hỏi AI chưa có đủ dữ liệu để trả lời chính xác - Admin nên bổ sung tài liệu/kiến thức liên quan để AI trả lời tốt hơn trong tương lai.",
          "\"Lịch sử AI\": xem lại toàn bộ các cuộc trò chuyện đã diễn ra trên hệ thống, phục vụ giám sát chất lượng và cải thiện chatbot.",
        ],
      },
    ],
  },

  // ==========================================================================
  {
    id: "khao-sat",
    label: "Khảo sát",
    description: "Thu thập ý kiến khách hàng và nội bộ",
    articles: [
      {
        id: "quan-ly-khao-sat",
        title: "Quản lý khảo sát",
        audience: "Admin / Quản lý",
        summary: "Tạo, phát hành và theo dõi kết quả các khảo sát (hài lòng khách hàng, nội bộ...).",
        steps: [
          "Vào Sidebar → \"Quản lý khảo sát\" (mục Quản trị hệ thống).",
          "Bấm tạo khảo sát mới: đặt tiêu đề, thêm các câu hỏi (trắc nghiệm, tự luận, đánh giá sao...).",
          "Sau khi tạo, lấy link khảo sát để gửi cho khách hàng/nhân viên - khảo sát công khai không cần đăng nhập.",
          "Xem tổng hợp kết quả trả lời trực tiếp trên trang quản lý, dùng để đánh giá chất lượng dịch vụ.",
        ],
        tips: [
          "Với khách hàng đã hoàn tất hồ sơ (chuyển trạng thái \"Xử lý hồ sơ\"), hệ thống có thể tự động gửi lời mời khảo sát hài lòng sau một khoảng thời gian nhất định nếu tính năng này được bật trong Cài đặt hệ thống → Marketing Automation.",
        ],
        related: "surveyManagement",
      },
    ],
  },

  // ==========================================================================
  {
    id: "quan-tri-he-thong",
    label: "Quản trị hệ thống",
    description: "Dành cho Admin/Ban Giám đốc - quản lý tài khoản, phân quyền và cấu hình toàn hệ thống",
    articles: [
      {
        id: "quan-ly-tai-khoan",
        title: "Quản lý tài khoản nhân viên",
        audience: "Admin",
        summary: "Tạo mới, chỉnh sửa, khóa/mở khóa tài khoản nhân viên và CTV.",
        steps: [
          "Vào Sidebar → \"Quản lý tài khoản\".",
          "Bấm \"➕ Thêm tài khoản mới\": nhập họ tên, email, mật khẩu ban đầu, số điện thoại, chọn vai trò (Admin/Nhân sự/CTV...) và phòng ban.",
          "Dùng ô tìm kiếm và bộ lọc theo Vai trò/Phòng ban để tìm nhanh tài khoản cần quản lý.",
          "Mỗi dòng trong bảng có 3 thao tác: 👁 Xem chi tiết, ✏️ Sửa thông tin, 🔒 Khóa/Mở khóa tài khoản (tài khoản bị khóa không thể đăng nhập).",
          "Cột \"Quyền chức năng\" hiển thị số quyền riêng lẻ đã cấp cho tài khoản (khác với Vai trò) - bấm vào để xem/chỉnh chi tiết từng quyền (xem thống kê, tạo tin tức, quản lý sản phẩm...).",
        ],
        related: "users",
      },
      {
        id: "phan-quyen-vai-tro",
        title: "Quản lý Vai trò & Phân quyền",
        audience: "Admin",
        summary: "Định nghĩa các vai trò (Admin, BGĐ, Trưởng bộ phận, Nhân sự, Đại lý, CTV, Nhân viên...) và quyền hạn tương ứng của từng vai trò.",
        steps: [
          "Vào Sidebar → \"Quản lý vai trò\".",
          "Xem danh sách vai trò hiện có và tập quyền (permission) được gán cho từng vai trò.",
          "Chỉnh sửa quyền của 1 vai trò sẽ ảnh hưởng tới TẤT CẢ tài khoản đang mang vai trò đó - cân nhắc kỹ trước khi thay đổi.",
          "Có thể gán thêm quyền riêng lẻ cho từng tài khoản cụ thể (không ảnh hưởng vai trò chung) tại trang Quản lý tài khoản.",
        ],
        related: "roles",
      },
      {
        id: "quan-ly-phong-ban",
        title: "Quản lý Phòng ban",
        audience: "Admin",
        summary: "Tạo cơ cấu phòng ban và phân bổ nhân sự.",
        steps: [
          "Vào Sidebar → \"Phòng ban\".",
          "Bấm \"Thêm phòng ban mới\": đặt tên, mô tả nhiệm vụ, chỉ định Trưởng phòng ban.",
          "Bấm vào 1 phòng ban để xem danh sách thành viên, gán thêm hoặc gỡ nhân sự khỏi phòng ban - thay đổi cập nhật ngay lập tức toàn hệ thống.",
        ],
        related: "departments",
      },
      {
        id: "nhat-ky-thao-tac",
        title: "Nhật ký thao tác (Audit Log)",
        audience: "Admin",
        summary: "Giám sát toàn bộ lịch sử thao tác trên hệ thống để đảm bảo an toàn dữ liệu và phục vụ điều tra khi cần.",
        steps: [
          "Vào Sidebar → \"Lịch sử thao tác\".",
          "Lọc theo 4 tiêu chí: Người thực hiện, Loại hành động (tạo/sửa/xóa), Từ thời điểm, Đến thời điểm.",
          "Bấm vào 1 dòng bản ghi để xem chi tiết: ai đã làm gì, tác động lên đối tượng nào, vào lúc nào.",
          "Bấm \"Làm mới\" để tải lại dữ liệu mới nhất, hoặc \"Xóa bộ lọc\" để quay về xem toàn bộ lịch sử gần đây.",
        ],
        tips: [
          "Các hành động tự động của hệ thống (CRM Automation, Marketing Automation) cũng được ghi lại tại đây với tiền tố \"automation.*\" hoặc \"marketing.*\" trong loại hành động.",
        ],
        related: "auditLogs",
      },
      {
        id: "cau-hinh-he-thong-tong-quan",
        title: "Cài đặt hệ thống - Tổng quan 4 khu vực cấu hình",
        audience: "Admin / Ban Giám đốc",
        summary: "Trang cấu hình trung tâm gồm 4 tab: Chatbot AI, Chính sách Hoa hồng, CRM Automation và Marketing Automation.",
        steps: [
          "Vào Sidebar → \"Cấu hình hệ thống\" (chỉ Admin/BGĐ nhìn thấy).",
          "Trang có 4 tab chính, mỗi tab quản lý 1 nhóm cấu hình riêng biệt - xem chi tiết từng tab ở các bài hướng dẫn riêng ngay bên dưới trong mục này.",
          "Luôn bấm đúng nút \"Lưu\" ở cuối mỗi tab sau khi chỉnh sửa - các tab hoạt động độc lập, lưu tab này không ảnh hưởng dữ liệu tab khác.",
        ],
        related: "systemSettings",
      },
      {
        id: "cau-hinh-chatbot-ai",
        title: "Cài đặt hệ thống → Chatbot AI (kể cả API Key)",
        audience: "Admin / Ban Giám đốc",
        summary: "Bật/tắt chatbot, thiết lập API Key, chọn model, tùy chỉnh giọng điệu chăm sóc khách hàng và kiến thức nền công ty.",
        steps: [
          "Vào Cài đặt hệ thống → tab \"Chatbot AI\".",
          "Bật/tắt chatbot toàn hệ thống bằng công tắc \"Kích hoạt\".",
          "Ô \"API Key (Gemini)\": dán API Key vào đây rồi bấm \"Lưu cấu hình Chatbot\" - hệ thống sẽ áp dụng NGAY LẬP TỨC, không cần deploy lại. Badge bên cạnh ô cho biết đã cấu hình hay chưa.",
          "Muốn gỡ bỏ API Key hoàn toàn (ví dụ khi nghi ngờ lộ key), bấm nút \"Xoá API Key\" riêng biệt - key sẽ bị xoá khỏi hệ thống ngay, chatbot sẽ ngừng hoạt động cho tới khi nhập key mới.",
          "Chọn Model AI (khuyến nghị Gemini 2.5 Flash cho tốc độ phản hồi nhanh).",
          "Chỉnh \"Lời chào\" hiển thị khi khách/nhân viên mở khung chat lần đầu.",
          "Ô \"Kiến thức nền về công ty\": cập nhật thông tin công ty (địa chỉ, dịch vụ, quy trình...) để chatbot trả lời chính xác - nên cập nhật định kỳ khi có thay đổi.",
          "Ô \"Giọng điệu Chăm sóc khách hàng\": tùy chỉnh cách chatbot xưng hô/thể hiện cảm xúc khi trò chuyện với khách hàng/CTV/Đại lý (khác với chế độ dành cho nhân sự nội bộ).",
        ],
        tips: [
          "Vì lý do bảo mật, ô API Key LUÔN hiển thị trống dù đã lưu trước đó - đây không phải lỗi, chỉ cần để trống và lưu các trường khác thì key cũ vẫn được giữ nguyên, không bị xoá.",
        ],
        related: "systemSettings",
      },
      {
        id: "cau-hinh-hoa-hong",
        title: "Cài đặt hệ thống → Chính sách Hoa hồng",
        audience: "Admin / Ban Giám đốc",
        summary: "Thiết lập tỷ lệ hoa hồng (%) theo từng hạng Cộng tác viên/Đại lý.",
        steps: [
          "Vào Cài đặt hệ thống → tab \"Chính sách Hoa hồng Deal\".",
          "Nhập tỷ lệ % hoa hồng cho từng hạng: Khách hàng thân thiết, Đại sứ Gieo mầm Đồng, Đại sứ Kết nối Bạc, Đại sứ Trụ cột Vàng, Đại sứ Tinh anh Kim cương, Đại sứ Tận tâm Master.",
          "Bấm \"Lưu cấu hình Hoa hồng\" - thay đổi sẽ áp dụng cho các lần tính hoa hồng tiếp theo.",
        ],
      },
      {
        id: "cau-hinh-crm-automation",
        title: "Cài đặt hệ thống → CRM Automation (Tự động hoá vận hành)",
        audience: "Admin / Ban Giám đốc",
        summary: "Bật/tắt các quy tắc tự động: phân công nhân sự, phát hiện Lead trùng, nhắc nhở chăm sóc, tự động đóng Lead quá hạn, nhắc đối soát hoa hồng, gợi ý thăng hạng CTV.",
        steps: [
          "Vào Cài đặt hệ thống → tab \"CRM Automation\".",
          "Xem bảng \"Tổng quan\": số Lead chưa có người phụ trách, số Lead im lặng quá hạn, số Lead sắp bị tự động đóng, số Lead trùng gần đây, số hoa hồng chờ đối soát quá hạn.",
          "Bấm \"Chạy kiểm tra ngay\" nếu muốn hệ thống quét và xử lý ngay lập tức thay vì chờ chu kỳ tự động (chạy ngầm định kỳ).",
          "Bật/tắt từng automation riêng lẻ và chỉnh ngưỡng thời gian phù hợp: số ngày coi là trùng lặp, số giờ coi là \"im lặng\" cần nhắc, số ngày tự động đóng Lead, số ngày nhắc đối soát hoa hồng.",
          "Bấm \"Lưu cấu hình CRM Automation\" để áp dụng.",
        ],
        tips: [
          "Toàn bộ automation ở đây là quy tắc cố định (rule-based), KHÔNG dùng AI, nên kết quả luôn nhất quán, dễ dự đoán.",
          "Có công tắc tổng \"Kích hoạt\" ở trên cùng - tắt công tắc này sẽ dừng toàn bộ automation trong tab này ngay lập tức.",
        ],
        related: "systemSettings",
      },
      {
        id: "cau-hinh-marketing-automation",
        title: "Cài đặt hệ thống → Marketing Automation (Chăm sóc khách hàng)",
        audience: "Admin / Ban Giám đốc",
        summary: "Bật/tắt các chiến dịch tự động chăm sóc khách hàng: chuỗi email nuôi dưỡng, cảm ơn khi chốt deal, tái kết nối khách cũ, bản tin tự động.",
        steps: [
          "Vào Cài đặt hệ thống → tab \"Marketing Automation\".",
          "Xem bảng Tổng quan số liệu tương tự tab CRM Automation.",
          "Bật/tắt từng chiến dịch: Chăm sóc Lead đang tư vấn, Email cảm ơn sau chốt deal, Tái kết nối (Win-back) Lead đã Thất bại, Bản tin (Newsletter) tự động.",
          "Với Bản tin tự động: cân nhắc kỹ trước khi bật vì đây là tính năng gửi email hàng loạt - nên xem thử nội dung mẫu trước.",
          "Bấm \"Chạy kiểm tra ngay\" hoặc \"Lưu cấu hình\" tương tự tab CRM Automation.",
        ],
        tips: [
          "Khách hàng luôn có thể tự hủy nhận email marketing qua link \"Hủy nhận\" ở cuối mỗi email - đây là yêu cầu bắt buộc để tránh bị đánh dấu spam, không cần xử lý thủ công.",
        ],
        related: "systemSettings",
      },
    ],
  },
];

// Từ khoá phụ trợ cho tìm kiếm - giúp tìm ra bài viết dù người dùng gõ từ khoá
// không trùng khớp 100% với tiêu đề (đồng nghĩa thường dùng trong nội bộ).
export const GUIDE_SEARCH_SYNONYMS = {
  "hoa hong": "hoa hồng doi soat commission",
  "lead": "lead khach hang crm",
  "tour": "huong dan pop-up tooltip",
  "api key": "chatbot ai gemini cau hinh",
  "hoc phi": "ngan sach gia san pham truong hoc",
};
