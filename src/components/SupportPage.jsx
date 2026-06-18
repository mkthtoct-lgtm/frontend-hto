import { useState, useEffect } from "react";

const FAQ_CATEGORIES = [
  { id: "all", label: "Tất cả câu hỏi" },
  { id: "account", label: "Tài khoản & Bảo mật" },
  { id: "accounting", label: "Đối soát & Hoa hồng" },
  { id: "crm", label: "Đồng bộ CRM" },
  { id: "general", label: "Quy định & Hướng dẫn" }
];

const FAQ_ITEMS = [
  {
    category: "accounting",
    question: "Làm thế nào để yêu cầu đối soát hoa hồng?",
    answer: "Bạn có thể vào phân hệ Nghiệp vụ -> Hoa hồng dự kiến, kiểm tra danh sách các deal đã hoàn thành hợp đồng, sau đó nhấn nút 'Đồng bộ CRM' để gửi yêu cầu đối soát tự động lên phòng kế toán."
  },
  {
    category: "general",
    question: "Tại sao tài liệu/biểu mẫu tôi cần không hiển thị?",
    answer: "Một số tài liệu yêu cầu quyền truy cập cụ thể tùy theo phòng ban (HR, Kế toán, Sales). Hãy liên hệ Trưởng bộ phận hoặc Quản trị viên để được cấp quyền xem phù hợp."
  },
  {
    category: "general",
    question: "Cách cấu hình prompt cho trợ lý AI nội bộ?",
    answer: "Quyền cấu hình AI chỉ dành cho các tài khoản có vai trò Admin. Nếu bạn là Admin, hãy vào mục AI nội bộ -> Cấu hình AI để tinh chỉnh hệ thống."
  },
  {
    category: "general",
    question: "Tôi có thể import file định dạng nào khi tạo JD?",
    answer: "Hệ thống hỗ trợ các định dạng .json, .csv và .txt. Vui lòng sử dụng đúng cấu trúc dữ liệu mẫu được quy định trước khi tải lên."
  },
  {
    category: "account",
    question: "Làm thế nào để thay đổi mật khẩu tài khoản?",
    answer: "Để thay đổi mật khẩu, bạn nhấp vào biểu tượng ảnh đại diện ở góc trên bên phải, chọn 'Trang cá nhân', sau đó chọn mục 'Bảo mật tài khoản' để thực hiện đổi mật khẩu mới."
  },
  {
    category: "crm",
    question: "Deal đồng bộ từ CRM mất bao lâu để hiển thị?",
    answer: "Thông thường, dữ liệu từ CRM sẽ được đồng bộ ngay lập tức. Nếu sau 5-10 phút vẫn chưa thấy deal mới xuất hiện tại trang Đối soát, bạn hãy bấm nút 'Đồng bộ CRM' để tải lại."
  },
  {
    category: "account",
    question: "Tôi phải làm gì nếu bị mất số điện thoại đăng ký Zalo?",
    answer: "Hãy gửi yêu cầu hỗ trợ qua mục 'Tạo Ticket' trên trang này, cung cấp Email đăng ký và CCCD để quản trị viên hỗ trợ cập nhật lại thông tin liên lạc."
  },
  {
    category: "account",
    question: "Làm thế nào để đặt lại mật khẩu?",
    answer: "Nhấp vào nút 'Quên mật khẩu' trên trang đăng nhập, nhập email đăng ký của bạn. Chúng tôi sẽ gửi đường dẫn đặt lại mật khẩu vào email trong vòng 5 phút."
  },
  {
    category: "crm",
    question: "Làm thế nào để kiểm tra trạng thái đồng bộ CRM?",
    answer: "Vào menu Cài đặt -> Lịch sử đồng bộ CRM. Bạn sẽ thấy danh sách tất cả các lần đồng bộ cùng thời gian, số bản ghi và trạng thái (thành công/lỗi)."
  },
  {
    category: "accounting",
    question: "Tôi phải làm gì khi thấy lỗi 'Số liệu trùng lặp'?",
    answer: "Lỗi này thường xảy ra khi dữ liệu đã được đồng bộ trước đó. Hãy kiểm tra Lịch sử đồng bộ để xác nhận. Nếu vẫn gặp lỗi, hãy gửi ticket hỗ trợ."
  },
  {
    category: "general",
    question: "Hệ thống có hỗ trợ xuất dữ liệu không?",
    answer: "Có, bạn có thể xuất dữ liệu dưới định dạng Excel (.xlsx) hoặc CSV. Nhấp vào biểu tượng tải xuống trên danh sách dữ liệu bạn cần."
  },
  {
    category: "general",
    question: "Làm thế nào để thay đổi ngôn ngữ hiển thị?",
    answer: "Hiện tại hệ thống chỉ hỗ trợ tiếng Việt. Tính năng đa ngôn ngữ sẽ được bổ sung trong các phiên bản tiếp theo."
  },
  {
    category: "crm",
    question: "Có thể đồng bộ CRM từ mobile app không?",
    answer: "Không, tính năng đồng bộ CRM chỉ có trên web app. Bạn cần truy cập từ máy tính để thực hiện đồng bộ."
  },
  {
    category: "account",
    question: "Tôi có thể thay đổi tên hiển thị không?",
    answer: "Không, tên tài khoản được thiết lập từ admin và không thể tự thay đổi. Để đổi tên, liên hệ quản trị viên hệ thống."
  }
];

const INITIAL_TICKETS = [
  {
    id: "HTO-TK-802",
    title: "Lỗi không đồng bộ được hồ sơ du học sinh từ CRM",
    category: "Lỗi phần mềm",
    priority: "High",
    priorityLabel: "Cao",
    priorityColor: "bg-danger-subtle text-danger border-danger-subtle",
    status: "processing",
    statusLabel: "Đang xử lý",
    statusColor: "bg-info-subtle text-info border-info-subtle",
    description: "Tôi đã thử đồng bộ hồ sơ của học sinh Nguyễn Văn A từ CRM sang danh sách hồ sơ đủ điều kiện bên Kế toán nhiều lần nhưng hệ thống báo lỗi Timeout. Các hồ sơ khác vẫn đồng bộ bình thường.",
    createdAt: "2026-06-17T14:30:00Z",
    replies: [
      { sender: "Hệ thống", time: "17/06/2026 14:30", message: "Yêu cầu hỗ trợ đã được tạo tự động và gửi tới đội ngũ kỹ thuật." },
      { sender: "Kỹ thuật viên (Nguyễn Minh Hoàng)", time: "17/06/2026 15:45", message: "Chào anh/chị, chúng tôi đã ghi nhận lỗi timeout đối với hồ sơ này do dung lượng ảnh đính kèm quá lớn. Đội kỹ thuật đang tiến hành tối ưu hóa." }
    ]
  },
  {
    id: "HTO-TK-791",
    title: "Yêu cầu cấp quyền xem tài liệu phòng Nhân sự",
    category: "Phân quyền tài khoản",
    priority: "Medium",
    priorityLabel: "Trung bình",
    priorityColor: "bg-warning-subtle text-warning border-warning-subtle",
    status: "resolved",
    statusLabel: "Đã giải quyết",
    statusColor: "bg-success-subtle text-success border-success-subtle",
    description: "Tôi là CTV mới của phòng ban Du học Đức, cần được phân quyền đọc thư mục tài liệu tuyển dụng nhân sự Đức tại Kho tài liệu.",
    createdAt: "2026-06-15T09:00:00Z",
    replies: [
      { sender: "Hệ thống", time: "15/06/2026 09:00", message: "Yêu cầu hỗ trợ đã được tạo." },
      { sender: "Quản trị viên", time: "15/06/2026 10:30", message: "Đã phê duyệt và phân quyền đọc cho tài khoản của bạn. Vui lòng tải lại trang để kiểm tra." }
    ]
  },
  {
    id: "HTO-TK-780",
    title: "Hỏi về tỷ lệ hoa hồng dự án IT Outsource",
    category: "Nghiệp vụ kế toán",
    priority: "Low",
    priorityLabel: "Thấp",
    priorityColor: "bg-secondary-subtle text-secondary border-secondary-subtle",
    status: "pending",
    statusLabel: "Đang chờ",
    statusColor: "bg-warning-subtle text-warning border-warning-subtle",
    description: "Cho tôi hỏi tỷ lệ hoa hồng 8% của dự án Outsource Java Dev là cố định cho cả năm hay thay đổi theo quý?",
    createdAt: "2026-06-18T08:15:00Z",
    replies: [
      { sender: "Hệ thống", time: "18/06/2026 08:15", message: "Yêu cầu hỗ trợ đã được gửi tới phòng Kế toán." }
    ]
  }
];

export function SupportPage({ currentUser, initialTab = "faq" }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [faqCategory, setFaqCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [tickets, setTickets] = useState(INITIAL_TICKETS);
  const [selectedTicket, setSelectedTicket] = useState(null);

  // State for new ticket form
  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState("Lỗi phần mềm");
  const [formPriority, setFormPriority] = useState("Medium");
  const [formDescription, setFormDescription] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // State for reply message
  const [replyMessage, setReplyMessage] = useState("");

  // Sync activeTab when initialTab prop changes (e.g. user clicked sidebar menu link)
  useEffect(() => {
    const timer = setTimeout(() => {
      setActiveTab(initialTab);
    }, 0);
    return () => clearTimeout(timer);
  }, [initialTab]);

  const handleCreateTicket = (e) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDescription.trim()) {
      alert("Vui lòng điền đầy đủ tiêu đề và nội dung mô tả yêu cầu.");
      return;
    }

    const ticketId = `HTO-TK-${Math.floor(100 + Math.random() * 900)}`;
    const newTicket = {
      id: ticketId,
      title: formTitle.trim(),
      category: formCategory,
      priority: formPriority,
      priorityLabel: formPriority === "High" ? "Cao" : formPriority === "Medium" ? "Trung bình" : "Thấp",
      priorityColor: formPriority === "High" ? "bg-danger-subtle text-danger border-danger-subtle" : formPriority === "Medium" ? "bg-warning-subtle text-warning border-warning-subtle" : "bg-secondary-subtle text-secondary border-secondary-subtle",
      status: "pending",
      statusLabel: "Đang chờ",
      statusColor: "bg-warning-subtle text-warning border-warning-subtle",
      description: formDescription.trim(),
      createdAt: new Date().toISOString(),
      replies: [
        { sender: "Hệ thống", time: new Date().toLocaleString("vi-VN"), message: "Yêu cầu hỗ trợ đã được ghi nhận thành công." }
      ]
    };

    setTickets([newTicket, ...tickets]);
    setFormTitle("");
    setFormDescription("");
    setFormSuccess(`Đã tạo thành công ticket hỗ trợ ${ticketId}! Bạn có thể theo dõi tiến độ tại tab Lịch sử hỗ trợ.`);

    // Clear success message after 5 seconds
    setTimeout(() => {
      setFormSuccess("");
    }, 5000);
  };

  const handleSendReply = (e) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedTicket) return;

    const newReply = {
      sender: currentUser?.fullName || currentUser?.name || currentUser?.email || "Người dùng",
      time: new Date().toLocaleString("vi-VN"),
      message: replyMessage.trim()
    };

    // Important: never call setSelectedTicket inside render-loop.
    // Build updated list first, then update selectedTicket once.
    const updatedTickets = tickets.map((t) => {
      if (t.id !== selectedTicket.id) return t;
      return { ...t, replies: [...t.replies, newReply] };
    });

    setTickets(updatedTickets);
    setSelectedTicket(updatedTickets.find((t) => t.id === selectedTicket.id) || null);
    setReplyMessage("");
  };

  // Filter FAQ items
  const filteredFaqs = FAQ_ITEMS.filter((item) => {
    const matchesCategory = faqCategory === "all" || item.category === faqCategory;
    const matchesQuery = !searchQuery.trim() ||
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  // DEBUG
  console.log("faqCategory:", faqCategory, "filteredFaqs count:", filteredFaqs.length, "FAQ_ITEMS:", FAQ_ITEMS);

  return (
    <div className="container-fluid pt-3 pb-4" style={{ maxWidth: "1600px" }}>
      <div className="d-flex flex-column flex-xl-row justify-content-between align-items-xl-center gap-3 mb-3">
        <div>
          <div className="text-uppercase fw-semibold text-primary mb-1" style={{ fontSize: "12px", letterSpacing: 0 }}>
            Hệ thống hỗ trợ nội bộ
          </div>
          <h4 className="fw-bold text-body-emphasis mb-1">Trợ giúp & Liên hệ hỗ trợ</h4>
        </div>
      </div>

      {/* Tabs list */}
      <div className="card border-0 mb-4" style={{ borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <div className="card-body p-2">
          <ul className="nav nav-pills gap-1 flex-wrap border-0">
            <li className="nav-item">
              <button
                className={`nav-link border-0 px-4 py-2 fw-medium ${activeTab === "faq" ? "active bg-primary text-white" : "text-body-secondary bg-transparent"}`}
                type="button"
                onClick={() => {
                  setActiveTab("faq");
                  setSearchQuery("");
                }}
                style={{ borderRadius: "8px" }}
              >
                Trung tâm trợ giúp (FAQ)
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link border-0 px-4 py-2 fw-medium ${activeTab === "ticket" ? "active bg-primary text-white" : "text-body-secondary bg-transparent"}`}
                type="button"
                onClick={() => setActiveTab("ticket")}
                style={{ borderRadius: "8px" }}
              >
                Gửi Ticket hỗ trợ
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link border-0 px-4 py-2 fw-medium ${activeTab === "history" ? "active bg-primary text-white" : "text-body-secondary bg-transparent"}`}
                type="button"
                onClick={() => setActiveTab("history")}
                style={{ borderRadius: "8px" }}
              >
                Lịch sử hỗ trợ của tôi
                <span className="badge bg-danger-subtle text-danger ms-2" style={{ fontSize: "11px" }}>
                  {tickets.filter(t => t.status !== 'resolved').length}
                </span>
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* FAQ Tab Content */}
      {activeTab === "faq" && (
        <div className="row g-4" style={{ minWidth: 0, maxWidth: "100%", overflow: "hidden" }}>
          <div className="col-12 col-xl-3" style={{ minWidth: 0, overflow: "hidden" }}>
            <div className="card border-0 shadow-sm" style={{ borderRadius: "12px" }}>
              <div className="card-header bg-transparent border-0 pt-3 px-3 pb-1">
                <h6 className="fw-bold text-body-emphasis mb-0">Chủ đề hỗ trợ</h6>
              </div>
              <div className="card-body px-2 py-3">
                <div className="d-grid gap-1">
                  {FAQ_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      className={`btn w-100 text-start border-0 px-3 py-2 text-truncate ${faqCategory === cat.id ? "bg-primary-subtle text-primary fw-semibold" : "bg-transparent text-body-secondary"}`}
                      onClick={() => setFaqCategory(cat.id)}
                      style={{ fontSize: "13.5px" }}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-xl-9" style={{ minWidth: 0, overflow: "hidden", maxWidth: "100%" }}>
            <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: "12px" }}>
              <div className="card-body p-3" style={{ overflow: "hidden" }}>
                <div className="input-group" style={{ minWidth: 0 }}>
                  <span className="input-group-text bg-transparent border-end-0 text-body-secondary">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8"></circle>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0 ps-1"
                    placeholder="Tìm kiếm câu hỏi hoặc nội dung hỗ trợ..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ fontSize: "14px" }}
                  />
                </div>
              </div>
            </div>

            <div className="d-grid gap-3" style={{ minWidth: 0, maxWidth: "100%" }}>
              {filteredFaqs.length === 0 ? (
                <div className="card border-0 shadow-sm py-5 text-center text-body-secondary" style={{ borderRadius: "12px" }}>
                  Không tìm thấy câu hỏi nào phù hợp với từ khóa của bạn.
                </div>
              ) : (
                filteredFaqs.map((faq, idx) => (
                  <div key={idx} className="card border-0 shadow-sm" style={{ borderRadius: "12px", minWidth: 0, overflow: "hidden" }}>
                    <div className="card-body p-4" style={{ minWidth: 0, overflow: "hidden" }}>
                      <h6 className="fw-bold text-body-emphasis mb-2 d-flex gap-2 align-items-start" style={{ minWidth: 0 }}>
                        <span className="text-primary mt-0.5" style={{ flexShrink: 0 }}>Q.</span>
                        <span style={{ wordBreak: "break-word", overflowWrap: "break-word", minWidth: 0 }}>{faq.question}</span>
                      </h6>
                      <div className="text-body-secondary d-flex gap-2 align-items-start mb-0 ps-3 border-start" style={{ fontSize: "13.5px", lineHeight: 1.6, minWidth: 0 }}>
                        <span style={{ wordBreak: "break-word", overflowWrap: "break-word", minWidth: 0 }}>{faq.answer}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Ticket Tab Content */}
      {activeTab === "ticket" && (
        <div className="row justify-content-center">
          <div className="col-12 col-lg-8">
            <div className="card border-0 shadow-sm" style={{ borderRadius: "12px" }}>
              <div className="card-header bg-transparent border-bottom py-3 px-4">
                <h6 className="fw-bold text-body-emphasis mb-0">Tạo yêu cầu hỗ trợ mới (Support Ticket)</h6>
              </div>
              <div className="card-body p-4">
                {formSuccess && (
                  <div className="alert alert-success py-3 px-4 mb-4" role="alert">
                    {formSuccess}
                  </div>
                )}

                <form onSubmit={handleCreateTicket} className="d-grid gap-3">
                  <div>
                    <label className="form-label fw-semibold" style={{ fontSize: "13.5px" }}>Tiêu đề yêu cầu <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ví dụ: Lỗi không mở được file PDF tại Kho tài liệu"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold" style={{ fontSize: "13.5px" }}>Danh mục phân loại</label>
                      <select
                        className="form-select"
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value)}
                      >
                        <option value="Lỗi phần mềm">Lỗi phần mềm</option>
                        <option value="Nghiệp vụ kế toán">Nghiệp vụ kế toán</option>
                        <option value="Phân quyền tài khoản">Phân quyền tài khoản</option>
                        <option value="Yêu cầu tính năng mới">Yêu cầu tính năng mới</option>
                        <option value="Khác">Khác</option>
                      </select>
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold" style={{ fontSize: "13.5px" }}>Mức độ ưu tiên</label>
                      <select
                        className="form-select"
                        value={formPriority}
                        onChange={(e) => setFormPriority(e.target.value)}
                      >
                        <option value="Low">Thấp (Giải đáp nghiệp vụ)</option>
                        <option value="Medium">Trung bình (Ảnh hưởng công việc cá nhân)</option>
                        <option value="High">Cao (Ảnh hưởng hệ thống / Chặn công việc)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="form-label fw-semibold" style={{ fontSize: "13.5px" }}>Mô tả chi tiết sự cố hoặc yêu cầu <span className="text-danger">*</span></label>
                    <textarea
                      className="form-control"
                      rows="6"
                      placeholder="Mô tả cụ thể vấn đề bạn gặp phải, cung cấp thông tin mã deal, mã tài liệu hoặc các bước tạo ra lỗi (nếu có)..."
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      required
                    />
                  </div>

                  <div className="border border-dashed rounded p-4 text-center bg-body-tertiary/20">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-body-secondary mb-2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    <div className="fw-semibold text-body-emphasis mb-1" style={{ fontSize: "13px" }}>Tải lên ảnh chụp màn hình (Tính năng demo)</div>
                    <span className="text-body-secondary small">Kéo thả file hình ảnh lỗi tại đây để đính kèm</span>
                  </div>

                  <div className="d-flex justify-content-end gap-2 mt-2">
                    <button
                      type="button"
                      className="btn btn-light border px-4"
                      onClick={() => {
                        setFormTitle("");
                        setFormDescription("");
                      }}
                    >
                      Hủy bỏ
                    </button>
                    <button type="submit" className="btn btn-primary px-4">Gửi yêu cầu hỗ trợ</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ticket History Tab Content */}
      {activeTab === "history" && (
        <div className="card border-0 shadow-sm" style={{ borderRadius: "12px" }}>
          <div className="card-header bg-transparent border-bottom py-3 px-3 d-flex justify-content-between align-items-center">
            <h6 className="fw-bold text-body-emphasis mb-0">Danh sách Ticket hỗ trợ của tôi</h6>
            <span className="badge bg-primary-subtle text-primary px-2 py-1">{tickets.length} Ticket</span>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0" style={{ fontSize: "13px" }}>
                <thead className="table-light">
                  <tr>
                    <th className="ps-3 py-3 text-body-secondary fw-semibold">Mã Ticket</th>
                    <th className="py-3 text-body-secondary fw-semibold">Nội dung sự cố</th>
                    <th className="py-3 text-body-secondary fw-semibold">Phân loại</th>
                    <th className="py-3 text-body-secondary fw-semibold">Mức độ ưu tiên</th>
                    <th className="py-3 text-body-secondary fw-semibold">Trạng thái</th>
                    <th className="py-3 text-body-secondary fw-semibold">Ngày tạo</th>
                    <th className="pe-3 py-3 text-body-secondary fw-semibold text-end">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket) => (
                    <tr key={ticket.id} style={{ cursor: "pointer" }} onClick={() => setSelectedTicket(ticket)}>
                      <td className="ps-3 py-3 fw-bold text-body-emphasis">{ticket.id}</td>
                      <td className="py-3" style={{ minWidth: 0 }}>
                        <div className="fw-semibold text-body-emphasis" style={{ wordBreak: "break-word", overflowWrap: "break-word" }}>{ticket.title}</div>
                        <div className="text-body-secondary small text-truncate mt-0.5" style={{ maxWidth: "280px", wordBreak: "break-word", overflowWrap: "break-word" }}>
                          {ticket.description}
                        </div>
                      </td>
                      <td className="py-3 text-body-secondary">{ticket.category}</td>
                      <td className="py-3">
                        <span className={`badge border px-2 py-1 ${ticket.priorityColor}`}>
                          {ticket.priorityLabel}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className={`badge border px-2 py-1 ${ticket.statusColor}`}>
                          {ticket.statusLabel}
                        </span>
                      </td>
                      <td className="py-3 text-body-secondary">
                        {new Date(ticket.createdAt).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="pe-3 py-3 text-end">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTicket(ticket);
                          }}
                        >
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Details Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-[1050] flex items-center justify-center bg-black/50 p-3 backdrop-blur-[2px]">
          <div
            className="flex w-full max-w-[650px] flex-col overflow-hidden rounded-xl bg-[var(--bs-body-bg)] shadow-xl"
            style={{ maxHeight: "calc(100vh - 24px)" }}
          >
            <div className="d-flex flex-shrink-0 justify-content-between align-items-center border-bottom p-4">
              <h5 className="m-0 fw-bold text-body-emphasis d-flex align-items-center gap-2">
                <span>Chi tiết Ticket: {selectedTicket.id}</span>
                <span className={`badge border font-normal ${selectedTicket.statusColor}`} style={{ fontSize: "12px" }}>
                  {selectedTicket.statusLabel}
                </span>
              </h5>
              <button className="btn btn-sm btn-light border" type="button" onClick={() => setSelectedTicket(null)}>
                Đóng
              </button>
            </div>

            <div className="p-4 overflow-y-auto min-h-0 flex-1" style={{ minWidth: 0 }}>
              {/* General details */}
              <div className="mb-4 bg-body-secondary/20 p-3 border rounded">
                <div className="row g-2">
                  <div className="col-12">
                    <span className="text-body-secondary small d-block">Tiêu đề yêu cầu</span>
                    <span className="fw-semibold text-body-emphasis" style={{ wordBreak: "break-word", overflowWrap: "break-word" }}>{selectedTicket.title}</span>
                  </div>
                  <div className="col-6">
                    <span className="text-body-secondary small d-block">Phân loại</span>
                    <span className="text-body-emphasis">{selectedTicket.category}</span>
                  </div>
                  <div className="col-6">
                    <span className="text-body-secondary small d-block">Độ ưu tiên</span>
                    <span className={`badge border px-2 py-0.5 ${selectedTicket.priorityColor}`}>
                      {selectedTicket.priorityLabel}
                    </span>
                  </div>
                  <div className="col-6">
                    <span className="text-body-secondary small d-block">Thời gian tạo</span>
                    <span className="text-body-emphasis small">{new Date(selectedTicket.createdAt).toLocaleString("vi-VN")}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="mb-4" style={{ minWidth: 0 }}>
                <h6 className="fw-bold text-body-emphasis border-bottom pb-2 mb-2">Nội dung chi tiết</h6>
                <p className="text-body-secondary small mb-0" style={{ lineHeight: 1.6, whiteSpace: "pre-line", wordBreak: "break-word", overflowWrap: "break-word" }}>
                  {selectedTicket.description}
                </p>
              </div>

              {/* Replies History */}
              <div className="mb-4">
                <h6 className="fw-bold text-body-emphasis border-bottom pb-2 mb-3">Lịch sử phản hồi ({selectedTicket.replies.length})</h6>
                <div className="d-grid gap-3">
                  {selectedTicket.replies.map((reply, idx) => {
                    const isSystem = reply.sender === "Hệ thống";
                    const isCurrentUser = reply.sender === (currentUser?.fullName || currentUser?.name || currentUser?.email);

                    let bgClass = "bg-body-secondary text-body";
                    let alignClass = "text-start";

                    if (isCurrentUser) {
                      bgClass = "bg-primary-subtle text-primary-emphasis ms-auto";
                      alignClass = "text-end";
                    } else if (isSystem) {
                      bgClass = "bg-light border text-center mx-auto text-body-secondary";
                    }

                    return (
                      <div key={idx} className={`w-100 ${alignClass}`}>
                        <div className="small text-body-secondary mb-1" style={{ fontSize: "11px" }}>
                          {reply.sender} • {reply.time}
                        </div>
                        <div
                          className={`rounded px-3 py-2 d-inline-block text-start ${bgClass}`}
                          style={{
                            maxWidth: isSystem ? "100%" : "85%",
                            fontSize: "13px",
                            wordBreak: "break-word",
                            overflowWrap: "break-word",
                            minWidth: 0
                          }}
                        >
                          {reply.message}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Reply Form */}
              {selectedTicket.status !== "resolved" && (
                <form onSubmit={handleSendReply} className="border-top pt-3 mt-3">
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Nhập câu trả lời hoặc phản hồi..."
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      style={{ fontSize: "13.5px" }}
                    />
                    <button type="submit" className="btn btn-primary px-3" disabled={!replyMessage.trim()}>
                      Gửi phản hồi
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className="d-flex flex-shrink-0 justify-content-end gap-2 border-top p-4">
              <button type="button" className="btn btn-primary" onClick={() => setSelectedTicket(null)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
