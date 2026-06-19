import React, { useState } from "react";

export function HelpCenterPage({ currentUser, onNavigate }) {
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const toggleFaq = (index) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const faqItems = [
    {
      question: "Làm thế nào để thay đổi thông tin hồ sơ cá nhân?",
      answer: "Bạn truy cập vào phần 'Hồ sơ cá nhân' bằng cách nhấn vào hình đại diện của bạn ở góc trên bên phải màn hình. Tại đây, bạn có thể cập nhật ảnh đại diện, thông tin liên lạc và các cài đặt cá nhân khác, sau đó bấm 'Lưu thay đổi'."
    },
    {
      question: "Thời gian xử lý Ticket hỗ trợ là bao lâu?",
      answer: "Các yêu cầu hỗ trợ (Ticket) thường được phân loại theo mức độ ưu tiên. Đối với các vấn đề khẩn cấp liên quan đến gián đoạn hệ thống, thời gian xử lý là dưới 2 giờ. Đối với các yêu cầu thông thường, thời gian phản hồi tối đa là 24 giờ làm việc."
    },
    {
      question: "Tôi quên mật khẩu truy cập Portal, tôi phải làm gì?",
      answer: "Tại trang đăng nhập của Portal, bạn nhấn vào liên kết 'Quên mật khẩu?'. Hệ thống sẽ yêu cầu bạn nhập địa chỉ email đã đăng ký để gửi liên kết khôi phục mật khẩu. Bạn cũng có thể liên hệ trực tiếp với bộ phận Quản trị hệ thống tại công ty."
    },
    {
      question: "Quản lý thông báo nội bộ như thế nào?",
      answer: "Bạn có thể quản lý các kênh nhận thông báo bằng cách vào trang Thông báo nội bộ. Tại đây, bạn có thể lọc thông báo theo danh mục hoặc cập nhật trạng thái đã đọc cho tất cả thông báo cùng một lúc."
    }
  ];

  const quickActions = [
    {
      title: "Gửi Ticket",
      description: "Tạo yêu cầu hỗ trợ kỹ thuật hoặc báo cáo lỗi hệ thống.",
      buttonText: "Tạo yêu cầu",
      icon: (
        <svg className="w-6 h-6 text-cyan-600 dark:text-cyan-400 app-dark:!text-cyan-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
        </svg>
      )
    },
    {
      title: "Liên hệ tư vấn",
      description: "Kết nối trực tiếp với đội ngũ tư vấn viên chuyên nghiệp.",
      buttonText: "Chat ngay",
      icon: (
        <svg className="w-6 h-6 text-cyan-600 dark:text-cyan-400 app-dark:!text-cyan-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      )
    },
    {
      title: "Hướng dẫn",
      description: "Tài liệu chi tiết hướng dẫn sử dụng các tính năng Portal.",
      buttonText: "Xem tài liệu",
      icon: (
        <svg className="w-6 h-6 text-cyan-600 dark:text-cyan-400 app-dark:!text-cyan-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    },
    {
      title: "FAQ",
      description: "Những câu hỏi thường gặp và giải đáp nhanh chóng.",
      buttonText: "Xem FAQ",
      icon: (
        <svg className="w-6 h-6 text-cyan-600 dark:text-cyan-400 app-dark:!text-cyan-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  ];

  const resourceCards = [
    {
      category: "QUẢN LÝ TÀI CHÍNH",
      title: "Hướng dẫn thanh toán quốc tế qua Portal",
      description: "Chi tiết các phương thức thanh toán quốc tế và quy trình đối soát tự động.",
      image: "/assets/images/resource_finance.png"
    },
    {
      category: "BẢO MẬT",
      title: "Cài đặt xác thực 2 lớp (2FA) bảo vệ tài khoản",
      description: "Hướng dẫn tích hợp Google Authenticator hoặc Microsoft Authenticator bảo mật.",
      image: "/assets/images/resource_security.png"
    },
    {
      category: "HỒ SƠ",
      title: "Quy trình nộp hồ sơ visa trực tuyến A-Z",
      description: "Các bước điền thông tin và tải lên tài liệu chuẩn để được phê duyệt nhanh chóng.",
      image: "/assets/images/resource_visa.png"
    }
  ];

  const tickets = [
    {
      id: "#TK-0021",
      title: "Lỗi không thể tải lên tài liệu hồ sơ",
      assignee: "Nguyễn Văn An",
      date: "12/10/2023",
      status: "Đang xử lý"
    },
    {
      id: "#TK-0014",
      title: "Yêu cầu khôi phục mật khẩu Portal",
      assignee: "Trần Thị Bé",
      date: "08/10/2023",
      status: "Hoàn thành"
    },
    {
      id: "#TK-0712",
      title: "Thắc mắc về quy trình thanh toán Visa",
      assignee: "Lê Hoàng Nam",
      date: "02/10/2023",
      status: "Hoàn thành"
    },
    {
      id: "#TK-0001",
      title: "Cập nhật thông tin doanh nghiệp",
      assignee: "Đặng Minh Khoa",
      date: "01/10/2023",
      status: "Chờ phản hồi"
    }
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case "Đang xử lý":
        return (
          <span className="inline-flex items-center justify-center h-8 w-[130px] text-xs font-semibold rounded-full border bg-sky-50 text-sky-700 border-sky-200/50 app-dark:!bg-sky-955/40 app-dark:!text-sky-400 app-dark:!border-sky-900/50">
            Đang xử lý
          </span>
        );
      case "Hoàn thành":
        return (
          <span className="inline-flex items-center justify-center h-8 w-[130px] text-xs font-semibold rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200/50 app-dark:!bg-emerald-955/40 app-dark:!text-emerald-400 app-dark:!border-emerald-900/50">
            Hoàn thành
          </span>
        );
      case "Chờ phản hồi":
        return (
          <span className="inline-flex items-center justify-center h-8 w-[130px] text-xs font-semibold rounded-full border bg-amber-50 text-amber-700 border-amber-200/50 app-dark:!bg-amber-955/40 app-dark:!text-amber-350 app-dark:!border-amber-900/50">
            Chờ phản hồi
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center justify-center h-8 w-[130px] text-xs font-semibold rounded-full border bg-slate-50 text-slate-700 border-slate-200/50 app-dark:!bg-slate-900/40 app-dark:!text-slate-400 app-dark:!border-slate-800/50">
            {status}
          </span>
        );
    }
  };

  const handleSuggestedSearch = (tag) => {
    setSearchQuery(tag);
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 app-dark:!bg-[#141414] text-slate-900 app-dark:!text-slate-100 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 space-y-6">
        
        {/* ================= SECTION 1: HERO ================= */}
        <div className="h-[160px] md:h-[180px] lg:h-[220px] rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 app-dark:!bg-gradient-to-r app-dark:!from-[#0b2b30] app-dark:!to-[#071924] border border-transparent app-dark:!border-slate-800 relative overflow-hidden flex items-center shadow-lg">
          {/* Cyber Glow background for Dark Mode */}
          <div className="absolute right-0 top-0 w-[400px] h-[400px] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none hidden app-dark:!block"></div>
          
          <div className="flex-1 p-6 md:p-8 lg:p-10 z-10 flex flex-col justify-center max-w-[65%]">
            <h1 className="text-xl md:text-2xl lg:text-3xl font-extrabold text-white leading-tight">
              Trung tâm hỗ trợ
            </h1>
            <p className="mt-2 text-xs md:text-sm text-cyan-50/90 app-dark:!text-slate-300 max-w-xl line-clamp-2 leading-relaxed">
              Tìm kiếm hướng dẫn, câu hỏi thường gặp và gửi yêu cầu hỗ trợ tới đội ngũ HTO. Chúng tôi luôn sẵn sàng đồng hành cùng bạn.
            </p>
            <div className="mt-4 flex">
              <button 
                onClick={() => onNavigate?.("profile")}
                className="px-4 py-1.5 bg-white text-cyan-600 app-dark:!bg-cyan-500 app-dark:!text-white hover:bg-cyan-50 app-dark:hover:!bg-cyan-600 font-semibold text-xs md:text-sm rounded-xl transition-all shadow-sm cursor-pointer"
              >
                Liên hệ hỗ trợ
              </button>
            </div>
          </div>
          
          {/* Right Side Illustration */}
          <div className="absolute right-4 md:right-8 lg:right-12 bottom-0 top-0 w-[30%] flex items-end justify-center">
            <img 
              src="/assets/images/help_hero_ai.png" 
              alt="AI assistant illustration" 
              className="h-[85%] md:h-[95%] lg:h-[105%] object-contain select-none pointer-events-none transform translate-y-2 lg:translate-y-4"
            />
          </div>
        </div>

        {/* ================= SECTION 2: SEARCH ================= */}
        <div className="max-w-[700px] mx-auto text-center space-y-3">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tôi có thể giúp gì cho bạn?"
              className="w-full pl-11 pr-4 py-3 bg-white app-dark:!bg-[#1f1f1f] border border-slate-200 app-dark:!border-slate-800 rounded-full focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 app-dark:focus:!border-cyan-500 text-sm shadow-sm transition-all text-slate-800 app-dark:!text-slate-100"
            />
          </div>
          {/* Tag suggestions */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400 app-dark:!text-slate-500">
            <span>Tìm kiếm phổ biến:</span>
            {["Visa", "Hồ sơ", "Thanh toán", "Tài khoản", "Hệ thống"].map((tag) => (
              <button 
                key={tag} 
                onClick={() => handleSuggestedSearch(tag)}
                className="px-2.5 py-0.5 rounded-full bg-slate-200/60 app-dark:!bg-slate-800/60 text-slate-600 app-dark:!text-slate-450 hover:bg-cyan-50 app-dark:hover:!bg-cyan-955/40 hover:text-cyan-600 app-dark:hover:!text-cyan-400 transition-colors cursor-pointer font-medium"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* ================= SECTION 3: QUICK ACTIONS ================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action, idx) => (
            <div 
              key={idx}
              className="bg-white app-dark:!bg-[#1f1f1f] border border-slate-200 app-dark:!border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:scale-[1.02] hover:shadow-md transition-all duration-200"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-cyan-50 app-dark:!bg-cyan-955/40 flex items-center justify-center mb-4">
                  {action.icon}
                </div>
                <h3 className="text-sm font-bold text-slate-900 app-dark:!text-slate-100 mb-1">{action.title}</h3>
                <p className="text-xs text-slate-500 app-dark:!text-slate-400 leading-relaxed mb-4">{action.description}</p>
              </div>
              <button className="w-full py-2 bg-slate-50 app-dark:!bg-slate-800/40 hover:bg-cyan-50 app-dark:hover:!bg-cyan-955/40 text-cyan-600 app-dark:!text-cyan-400 hover:text-cyan-700 app-dark:hover:!text-cyan-300 text-xs font-semibold rounded-xl border border-slate-150 app-dark:!border-slate-800 transition-colors cursor-pointer">
                {action.buttonText}
              </button>
            </div>
          ))}
        </div>

        {/* ================= SECTION 4 & 5: POPULAR TOPICS & CONTACT ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Section 4: Accordion FAQs (2 columns width on desktop) */}
          <div className="lg:col-span-2 bg-white app-dark:!bg-[#1f1f1f] border border-slate-200 app-dark:!border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 app-dark:!border-slate-800">
              <h2 className="text-base font-bold text-slate-900 app-dark:!text-slate-100">Câu hỏi thường gặp</h2>
              <a href="#" className="text-xs font-semibold text-cyan-600 app-dark:!text-cyan-400 hover:underline">Xem tất cả</a>
            </div>
            
            <div className="space-y-3">
              {faqItems.map((item, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div 
                    key={idx} 
                    className="border border-slate-100 app-dark:!border-slate-800 rounded-xl overflow-hidden"
                  >
                    <button 
                      onClick={() => toggleFaq(idx)}
                      className="w-full px-4 py-3 flex items-center justify-between bg-slate-50/50 app-dark:!bg-slate-800/10 hover:bg-slate-50 app-dark:hover:!bg-slate-800/30 transition-colors text-left cursor-pointer"
                    >
                      <span className="text-xs md:text-sm font-semibold text-slate-800 app-dark:!text-slate-200">{item.question}</span>
                      <svg 
                        className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        viewBox="0 0 24 24"
                      >
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </button>
                    <div 
                      className={`transition-all duration-200 overflow-hidden ${isOpen ? "max-h-[200px] border-t border-slate-100 app-dark:!border-slate-800" : "max-h-0"}`}
                    >
                      <div className="p-4 text-xs md:text-sm text-slate-500 app-dark:!text-slate-400 leading-relaxed bg-white app-dark:!bg-[#1f1f1f]">
                        {item.answer}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 5: Contact Support Panel (1 column width on desktop) */}
          <div className="flex flex-col gap-6">
            <div className="bg-white app-dark:!bg-[#1f1f1f] border border-slate-200 app-dark:!border-slate-800 rounded-2xl p-6 flex flex-col justify-between flex-1">
              <div>
                <h2 className="text-base font-bold text-slate-900 app-dark:!text-slate-100 pb-2 border-b border-slate-100 app-dark:!border-slate-800 mb-4">Liên hệ trực tiếp</h2>
                <div className="space-y-4">
                  {/* Hotline */}
                  <div className="flex items-start gap-4 p-3.5 bg-slate-50 app-dark:!bg-[#252525] border border-slate-100 app-dark:!border-slate-800 rounded-xl">
                    <div className="w-8 h-8 rounded-lg bg-cyan-100 app-dark:!bg-cyan-955/60 flex items-center justify-center text-cyan-600 app-dark:!text-cyan-400 flex-shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Hotline 24/7</p>
                      <p className="text-base font-bold text-slate-900 app-dark:!text-slate-100 mt-0.5">1900 6789</p>
                      <p className="text-[11px] text-slate-500 app-dark:!text-slate-400 mt-1">Hỗ trợ khẩn cấp các vấn đề hệ thống</p>
                    </div>
                  </div>
                  {/* Email */}
                  <div className="flex items-start gap-4 p-3.5 bg-slate-50 app-dark:!bg-[#252525] border border-slate-100 app-dark:!border-slate-800 rounded-xl">
                    <div className="w-8 h-8 rounded-lg bg-cyan-100 app-dark:!bg-cyan-955/60 flex items-center justify-center text-cyan-600 app-dark:!text-cyan-400 flex-shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Email hỗ trợ</p>
                      <p className="text-sm md:text-base font-bold text-slate-900 app-dark:!text-slate-100 mt-0.5 truncate select-all">support@hto.edu.vn</p>
                      <p className="text-[11px] text-slate-500 app-dark:!text-slate-400 mt-1">Phản hồi trong vòng 24h làm việc</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
        </div>

        {/* ================= SECTION 6: RESOURCE LIBRARY ================= */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-slate-900 app-dark:!text-slate-100">Hướng dẫn chuyên sâu</h2>
            <a href="#" className="text-xs font-semibold text-cyan-600 app-dark:!text-cyan-400 hover:underline flex items-center gap-1">
              Xem tất cả
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resourceCards.map((card, idx) => (
              <div 
                key={idx}
                className="bg-white app-dark:!bg-[#1f1f1f] border border-slate-200 app-dark:!border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col h-full"
              >
                <div className="aspect-video w-full overflow-hidden bg-slate-100 app-dark:!bg-slate-900 border-b border-slate-100 app-dark:!border-slate-800">
                  <img 
                    src={card.image} 
                    alt={card.title} 
                    className="w-full h-full object-cover select-none pointer-events-none hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-cyan-600 app-dark:!text-cyan-400 uppercase tracking-wider">
                      {card.category}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 app-dark:!text-slate-100 leading-snug line-clamp-2 min-h-[40px]">
                      {card.title}
                    </h3>
                    <p className="text-xs text-slate-500 app-dark:!text-slate-400 leading-relaxed line-clamp-2">
                      {card.description}
                    </p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100 app-dark:!border-slate-800/80">
                    <button className="flex items-center text-xs font-bold text-cyan-600 app-dark:!text-cyan-400 hover:text-cyan-700 app-dark:hover:!text-cyan-300 gap-1.5 cursor-pointer">
                      Xem chi tiết
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ================= SECTION 7: SUPPORT TICKETS ================= */}
        <div className="bg-white app-dark:!bg-[#1f1f1f] border border-slate-200 app-dark:!border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 app-dark:!text-slate-100">Yêu cầu hỗ trợ gần đây</h2>
              <p className="text-xs text-slate-500 app-dark:!text-slate-400 mt-0.5">Theo dõi trạng thái của các yêu cầu hỗ trợ mà bạn gửi lên hệ thống.</p>
            </div>
            <button className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer flex-shrink-0 self-start sm:self-center shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Tạo Ticket mới
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-100 app-dark:!border-slate-800/80 rounded-xl">
            <table className="w-full text-left border-collapse text-xs md:text-sm">
              <thead>
                <tr className="bg-slate-50/50 app-dark:!bg-slate-800/10 border-b border-slate-150 app-dark:!border-slate-800 text-[11px] text-slate-450 app-dark:!text-slate-500 font-bold uppercase tracking-wider">
                  <th className="px-4 py-3.5">Mã Ticket</th>
                  <th className="px-4 py-3.5">Tiêu đề</th>
                  <th className="px-4 py-3.5">Người phụ trách</th>
                  <th className="px-4 py-3.5">Ngày tạo</th>
                  <th className="px-4 py-3.5 text-right">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 app-dark:!divide-slate-800">
                {tickets.map((ticket, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/30 app-dark:hover:!bg-slate-800/5 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-cyan-600 app-dark:!text-cyan-400">{ticket.id}</td>
                    <td className="px-4 py-3.5 font-semibold text-slate-800 app-dark:!text-slate-200 max-w-[200px] truncate">{ticket.title}</td>
                    <td className="px-4 py-3.5 text-slate-500 app-dark:!text-slate-400">{ticket.assignee}</td>
                    <td className="px-4 py-3.5 text-slate-500 app-dark:!text-slate-400">{ticket.date}</td>
                    <td className="px-4 py-3.5 text-right">{getStatusBadge(ticket.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-500 app-dark:!text-slate-400">
              Hiển thị <span className="font-semibold text-slate-700 app-dark:!text-slate-300">4</span> trong <span className="font-semibold text-slate-700 app-dark:!text-slate-300">12</span> ticket
            </span>
            <div className="flex gap-1">
              <button className="p-1.5 rounded-lg border border-slate-200 app-dark:!border-slate-800 text-slate-455 hover:bg-slate-50 app-dark:hover:!bg-slate-800/40 cursor-pointer transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button className="p-1.5 rounded-lg border border-slate-200 app-dark:!border-slate-800 text-slate-455 hover:bg-slate-50 app-dark:hover:!bg-slate-800/40 cursor-pointer transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
