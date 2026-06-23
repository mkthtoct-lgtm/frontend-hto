import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { fetchNewsPosts } from "../newsEvents/newsEventsApi";

export const HomePage = ({ theme, onNavigate }) => {
  // Brand colors
  const brandColor = "#0D919C";
  const hoverBrandColor = "#0a757e";

  // Theme state
  const isDark = theme === "dark";
  const borderColor = isDark ? "#334155" : "#e2e8f0";
  const cardBg = isDark ? "#111827" : "#ffffff";
  const mutedTextColor = isDark ? "#94a3b8" : "#64748b";
  const headingTextColor = isDark ? "#f8fafc" : "#1e293b";

  // Dynamic news/events loading state
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  // Interactive States
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(""); // "consult" or "event"
  const [selectedEvent, setSelectedEvent] = useState("");
  const [activeStep, setActiveStep] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    program: "Du học nghề Đức",
    notes: ""
  });

  // Toast notification
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const toastTimeoutRef = useRef(null);

  const defaultMockEvents = [
    {
      id: "mock-evt-1",
      title: "WORKSHOP LỘ TRÌNH DU HỌC NGHỀ ĐỨC",
      location: "Trung tâm HT Ocean chi nhánh Hồ Chí Minh",
      date: "2026-06-15",
      status: "Sắp diễn ra",
      image: "assets/images/hito_2.png"
    },
    {
      id: "mock-evt-2",
      title: "NGÀY HỘI KIỂM TRA HỒ SƠ VISA",
      location: "Văn phòng tư vấn trực tuyến Zoom/Meet",
      date: "2026-06-22",
      status: "Đang mở đăng ký",
      image: "assets/images/hito_3.png"
    },
    {
      id: "mock-evt-3",
      title: "KHAI GIẢNG LỚP TIẾNG ĐỨC NỀN TẢNG",
      location: "Khóa học tập trung - Trình độ A1",
      date: "2026-06-30",
      status: "Nhận lịch học",
      image: "assets/images/hito_4.png"
    }
  ];

  // Prevent background scroll when modal is active
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showModal]);

  // Fetch real events from database
  useEffect(() => {
    let active = true;
    const loadEvents = async () => {
      try {
        const data = await fetchNewsPosts();
        if (!active) return;

        // Filter for events
        const eventItems = data.filter(
          (item) =>
            String(item.type).toLowerCase() === "event" ||
            String(item.postType).toLowerCase() === "event" ||
            item.isEvent
        );

        if (eventItems.length > 0) {
          setEvents(eventItems.slice(0, 3));
        } else {
          // Fallback to general news items
          const fallbackData = data.slice(0, 3);
          if (fallbackData.length > 0) {
            setEvents(fallbackData.map(item => ({
              ...item,
              status: item.status || "Xem ngay"
            })));
          } else {
            setEvents(defaultMockEvents);
          }
        }
      } catch (err) {
        console.error("Error loading events for homepage:", err);
        if (active) {
          setEvents(defaultMockEvents);
        }
      } finally {
        if (active) {
          setLoadingEvents(false);
        }
      }
    };

    loadEvents();
    return () => {
      active = false;
    };
  }, []);

  const triggerToast = (message) => {
    setToastMessage(message);
    setShowToast(true);
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = setTimeout(() => {
      setShowToast(false);
    }, 4000);
  };

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const handleOpenConsultModal = (e) => {
    e.preventDefault();
    setFormData({ name: "", phone: "", email: "", program: "Du học nghề Đức", notes: "" });
    setModalType("consult");
    setShowModal(true);
  };

  const handleOpenEventModal = (e, eventTitle) => {
    e.preventDefault();
    setFormData({ name: "", phone: "", email: "", program: "", notes: "" });
    setSelectedEvent(eventTitle);
    setModalType("event");
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setShowModal(false);
    if (modalType === "consult") {
      triggerToast(`Đăng ký tư vấn thành công! HTO sẽ liên hệ lại qua SĐT: ${formData.phone}`);
    } else {
      triggerToast(`Đăng ký sự kiện thành công! Vé tham dự đã gửi tới email: ${formData.email}`);
    }
  };

  const handleNavigatePage = (e, page) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate(page);
    }
  };

  // Helper to parse dates like YYYY-MM-DD
  const parseArticleDate = (dateStr) => {
    if (!dateStr) return { day: "15", month: "THÁNG 06" };
    const cleanDate = String(dateStr).trim().split("T")[0];
    const parts = cleanDate.split("-");
    if (parts.length === 3) {
      const day = parts[2];
      const monthStr = `THÁNG ${parts[1]}`;
      return { day, month: monthStr };
    }
    const partsSlash = cleanDate.split("/");
    if (partsSlash.length === 3) {
      return { day: partsSlash[0], month: `THÁNG ${partsSlash[1]}` };
    }
    return { day: "15", month: "THÁNG 06" };
  };

  // Helper to format dates like YYYY-MM-DD to DD/MM/YYYY
  const formatDateSlash = (dateStr) => {
    if (!dateStr) return "";
    const cleanDate = String(dateStr).trim().split("T")[0];
    const parts = cleanDate.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    const partsSlash = cleanDate.split("/");
    if (partsSlash.length === 3) {
      return cleanDate;
    }
    return "";
  };

  const getEventBadgeStyle = (status) => {
    const normalized = String(status || "").toLowerCase();
    if (normalized.includes("sắp") || normalized.includes("sap") || normalized.includes("diễn ra") || normalized.includes("dien ra")) {
      return {
        border: `1.5px solid ${brandColor}`,
        color: brandColor,
        backgroundColor: "transparent",
        borderRadius: "8px",
        fontSize: "10.5px",
        letterSpacing: "0.5px",
        minWidth: "110px",
        cursor: "pointer"
      };
    } else if (normalized.includes("đăng ký") || normalized.includes("dang ky") || normalized.includes("mở") || normalized.includes("mo")) {
      return {
        backgroundColor: "#0ea5e9",
        color: "#ffffff",
        borderRadius: "8px",
        fontSize: "10.5px",
        letterSpacing: "0.5px",
        minWidth: "110px",
        cursor: "pointer"
      };
    } else {
      return {
        border: `1.5px solid ${borderColor}`,
        color: headingTextColor,
        backgroundColor: "transparent",
        borderRadius: "8px",
        fontSize: "10.5px",
        letterSpacing: "0.5px",
        minWidth: "110px",
        cursor: "pointer"
      };
    }
  };

  const stepsData = [
    {
      num: "1",
      title: "TIẾP NHẬN",
      desc: "Lắng nghe nguyện vọng, phân tích hồ sơ ban đầu của khách hàng.",
      detail: "Bộ phận Chăm sóc khách hàng của HTO tiếp nhận hồ sơ trong vòng 24h, phân loại theo nhu cầu (Du học Đức, Định cư, Visa) và phân bổ chuyên viên chuyên trách hướng dẫn."
    },
    {
      num: "2",
      title: "TƯ VẤN",
      desc: "Cung cấp thông tin chi tiết về các chương trình phù hợp nhất.",
      detail: "Chuyên viên tiến hành phỏng vấn 1:1 trực tiếp hoặc online, đánh giá hồ sơ học lực, năng lực ngoại ngữ, khả năng tài chính và đề xuất chương trình học tối ưu."
    },
    {
      num: "3",
      title: "LẬP LỘ TRÌNH",
      desc: "Thiết kế kế hoạch học tập và tài chính cụ thể theo thời gian.",
      detail: "Thiết lập thời gian biểu chi tiết từ khâu học tiếng Đức (A1-B2), chuẩn bị tài khoản phong tỏa chứng minh tài chính, nộp hồ sơ xin thư mời học và thời gian cất cánh."
    },
    {
      num: "4",
      title: "XỬ LÝ HỒ SƠ",
      desc: "Hoàn thiện giấy tờ, dịch thuật và nộp hồ sơ theo chuẩn quốc tế.",
      detail: "Bộ phận xử lý tiến hành dịch thuật công chứng hồ sơ văn bằng, gửi hồ sơ thẩm định APS, xin thư mời nhập học của đối tác tại Đức và đặt lịch hẹn xin cấp visa."
    },
    {
      num: "5",
      title: "THEO DÕI",
      desc: "Cập nhật tiến độ visa và phản hồi từ các cơ quan chức năng.",
      detail: "Theo dõi sát sao tiến trình duyệt hồ sơ tại Lãnh sự quán, bổ sung giấy tờ giải trình nếu có yêu cầu và tổ chức luyện phỏng vấn Visa trực tiếp 1:1."
    },
    {
      num: "6",
      title: "HỖ TRỢ SAU DỊCH VỤ",
      desc: "Đưa đón sân bay, tìm nhà ở và hỗ trợ ổn định tại nước ngoài.",
      detail: "Đại diện HTO tại Đức đón học viên tại sân bay, dẫn về ký túc xá/nhà thuê, hỗ trợ đăng ký tạm trú, mở tài khoản ngân hàng Đức, mua bảo hiểm và hoàn tất nhập học.",
      highlight: true
    }
  ];

  return (
    <div className="container-fluid pt-3 pb-4 px-2 px-md-3 px-lg-4" style={{ maxWidth: "1600px", overflowX: "hidden" }}>
      {/* Dynamic Style Sheet */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes pulseGlow {
          0%, 100% {
            box-shadow: 0 4px 15px rgba(13, 145, 156, 0.12);
          }
          50% {
            box-shadow: 0 4px 25px rgba(13, 145, 156, 0.3);
            border-color: ${brandColor} !important;
          }
        }

        @keyframes breatheBacklight {
          0%, 100% {
            box-shadow: 0 10px 30px rgba(13, 145, 156, 0.08);
          }
          50% {
            box-shadow: 0 10px 45px rgba(13, 145, 156, 0.25);
          }
        }

        .animate-entrance {
          animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }

        .section-hero { animation-delay: 0.05s; }
        .section-stats { animation-delay: 0.15s; }
        .section-services { animation-delay: 0.25s; }
        .section-events { animation-delay: 0.35s; }
        .section-process { animation-delay: 0.45s; }

        .interactive-card {
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
          cursor: pointer;
        }

        .interactive-card:hover {
          transform: translateY(-5px);
          border-color: ${brandColor} !important;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06) !important;
        }

        [data-bs-theme="dark"] .interactive-card:hover {
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3) !important;
        }



        .breathe-backlight {
          animation: breatheBacklight 5s infinite ease-in-out;
        }

        .highlight-glow-card {
          animation: pulseGlow 4s infinite ease-in-out;
        }

        .step-num-tag {
          transition: all 0.3s ease;
        }

        .interactive-card:hover .step-num-tag {
          transform: scale(1.1);
          background-color: ${hoverBrandColor} !important;
        }
      `}</style>

      {/* SUCCESS TOAST ALERT */}
      {showToast && (
        <div
          className="position-fixed top-0 start-50 translate-middle-x mt-4 p-3 rounded-3 shadow-lg d-flex align-items-center gap-2 text-white border-0"
          style={{
            backgroundColor: "#10b981",
            zIndex: 1090,
            boxShadow: "0 10px 30px rgba(16, 185, 129, 0.25)",
            fontSize: "14px",
            fontWeight: "600",
            animation: "fadeInUp 0.3s ease-out"
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. HERO SECTION */}
      <div className="row align-items-center mb-5 g-4 pt-2 section-hero animate-entrance">
        <div className="col-12 col-md-7 col-lg-7 order-2 order-md-1">
          <div className="pe-xl-4 text-start">
            <h1 className="mb-3 text-uppercase" style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)", fontWeight: 800, letterSpacing: "-0.5px", lineHeight: "1.15", color: headingTextColor }}>
              HT OCEAN <span style={{ color: brandColor }}>GROUP</span>
            </h1>

            <div className="d-flex align-items-stretch mb-4 ps-3" style={{ borderLeft: `4px solid ${brandColor}` }}>
              <p className="mb-0 fs-6 lh-base text-body-secondary" style={{ fontWeight: "400" }}>
                Đồng hành cùng học viên, phụ huynh và đối tác trong các chương trình du học, đào tạo ngôn ngữ, visa, định cư và hồ sơ quốc tế.
              </p>
            </div>

            <div className="d-flex gap-3 flex-wrap">
              <button
                className="btn text-white fw-bold px-4 py-2"
                onClick={handleOpenConsultModal}
                style={{
                  backgroundColor: brandColor,
                  border: `1px solid ${brandColor}`,
                  fontSize: "13.5px",
                  letterSpacing: "0.5px",
                  borderRadius: "8px",
                  transition: "all 0.2s ease-in-out"
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = hoverBrandColor}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = brandColor}
              >
                TƯ VẤN NGAY
              </button>
              <button
                className="btn bg-transparent fw-bold px-4 py-2"
                onClick={(e) => handleNavigatePage(e, "productOverview")}
                style={{
                  border: `1px solid ${borderColor}`,
                  color: headingTextColor,
                  fontSize: "13.5px",
                  letterSpacing: "0.5px",
                  borderRadius: "8px",
                  transition: "all 0.2s ease-in-out"
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = isDark ? "#1e293b" : "#f8fafc";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                TÌM HIỂU THÊM
              </button>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-5 col-lg-5 order-1 order-md-2 text-center">
          <div className="position-relative d-inline-block w-100" style={{ maxWidth: "480px" }}>
            <div
              className="overflow-hidden rounded-3 breathe-backlight"
              style={{
                border: `1px solid ${borderColor}`,
                backgroundColor: isDark ? "#0f172a" : "#f8fafc",
                padding: "3px",
                transition: "all 0.3s ease"
              }}
            >
              <img
                src="assets/images/dashboard_monitor_mockup.png"
                alt="HTO Portal Dashboard"
                className="img-fluid rounded"
                style={{ width: "100%", height: "auto", display: "block" }}
              />
            </div>

            <div
              className="position-absolute px-2 py-1 fw-bold text-white text-uppercase"
              style={{
                bottom: "10px",
                right: "10px",
                backgroundColor: brandColor,
                border: "1px solid rgba(0,0,0,0.15)",
                fontSize: "9px",
                letterSpacing: "0.5px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
                borderRadius: "4px"
              }}
            >
              Trusted since 2014
            </div>
          </div>
        </div>
      </div>

      {/* 2. STATS SECTION */}
      <div className="row mb-5 g-3 section-stats animate-entrance">
        {[
          { value: "10+", label: "NĂM ĐỒNG HÀNH" },
          { value: "5", label: "NHÓM DỊCH VỤ" },
          { value: "1:1", label: "TƯ VẤN HỒ SƠ" },
          { value: "360", label: "HỖ TRỢ TRỌN GÓI" }
        ].map((stat) => (
          <div className="col-6 col-md-3" key={stat.label}>
            <div
              className="card border text-center p-3 h-100 interactive-card"
              onClick={handleOpenConsultModal}
              style={{
                backgroundColor: cardBg,
                borderColor: borderColor,
                borderRadius: "12px"
              }}
            >
              <div className="fw-extrabold text-body-emphasis mb-1" style={{ fontSize: "2rem", fontWeight: 800, color: headingTextColor }}>
                {stat.value}
              </div>
              <div className="text-uppercase fw-semibold" style={{ fontSize: "11px", letterSpacing: "0.5px", color: mutedTextColor }}>
                {stat.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 3. DỊCH VỤ & CHƯƠNG TRÌNH */}
      <div className="mb-5 text-start section-services animate-entrance">
        <div className="d-flex justify-content-between align-items-end mb-2 pb-2" style={{ borderBottom: `1px solid ${borderColor}` }}>
          <h3 className="fw-bold mb-0 text-uppercase" style={{ fontSize: "1.2rem", letterSpacing: "0.5px", color: headingTextColor }}>
            DỊCH VỤ & CHƯƠNG TRÌNH
          </h3>
          <span className="text-uppercase fw-semibold d-none d-sm-inline" style={{ fontSize: "10px", color: brandColor, letterSpacing: "0.5px" }}>
            HT OCEAN SERVICES CATALOG 2026
          </span>
        </div>

        <div className="row g-3 mt-1">
          {[
            {
              title: "DU HỌC VÀ DU HỌC NGHỀ",
              desc: "Định hướng ngành, lộ trình tiếng Đức, hồ sơ trường và theo dõi sau nhập cảnh.",
              badge: "DU HỌC ĐỨC",
              page: "productOverview",
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/>
                  <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/>
                </svg>
              )
            },
            {
              title: "VISA VÀ HỒ SƠ QUỐC TẾ",
              desc: "Rà soát checklist, đặt lịch, hoàn thiện biểu mẫu và theo dõi kết quả visa.",
              badge: "HỖ TRỢ HỒ SƠ",
              page: "visa",
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/>
                  <path d="M14 2v4a2 2 0 0 0 2 2h4"/>
                  <path d="M10 9H8"/>
                  <path d="M16 13H8"/>
                  <path d="M16 17H8"/>
                </svg>
              )
            },
            {
              title: "ĐÀO TẠO NGÔN NGỮ",
              desc: "Lớp tiếng Đức theo mục tiêu A1 đến B2, kèm phỏng vấn và thi thử định kỳ.",
              badge: "ĐÀO TẠO NGÔN NGỮ",
              page: "daotaongonngu",
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m5 8 6 6"/>
                  <path d="m4 14 6-6 2-3h-15"/>
                  <path d="M2 5h12"/>
                  <path d="M7 2h1"/>
                  <path d="m22 22-5-10-5 10"/>
                  <path d="M14 18h6"/>
                </svg>
              )
            },
            {
              title: "ĐỊNH CƯ VÀ NGHỀ NGHIỆP",
              desc: "Tư vấn lộ trình làm việc, chuyển đổi bằng cấp và ổn định cuộc sống tại nước ngoài.",
              badge: "TƯ VẤN LỘ TRÌNH",
              page: "dinhcu",
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                  <rect width="20" height="14" x="2" y="6" rx="2"/>
                </svg>
              )
            }
          ].map((srv) => (
            <div className="col-12 col-sm-6 col-md-3" key={srv.title}>
              <div 
                className={`border p-4 h-full flex flex-col justify-between rounded-xl cursor-pointer transition-all duration-300 group ${isDark ? "bg-[#111827] border-[#334155]" : "bg-white border-[#e2e8f0]"}`}
                onClick={(e) => handleNavigatePage(e, srv.page)}
              >
                <div>
                  <div className="flex items-center justify-center text-white mb-3 w-10 h-10 bg-[#0D919C] rounded-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                    {srv.icon}
                  </div>
                  
                  <h5 className={`font-bold mb-2 text-sm leading-snug ${isDark ? "text-[#f8fafc]" : "text-[#1e293b]"}`}>
                    {srv.title}
                  </h5>
                  
                  <p className="text-xs text-[#64748b] dark:text-[#94a3b8] mb-3 leading-relaxed">
                    {srv.desc}
                  </p>
                </div>

                <div>
                  <div className="mb-2">
                    <span className={`inline-block px-2 py-1 font-bold text-center text-[10px] tracking-wide rounded-md border ${isDark ? "border-[#334155] text-[#0D919C]" : "border-[#e2e8f0] text-[#0D919C]"}`}>
                      {srv.badge}
                    </span>
                  </div>

                  <a 
                    href="#" 
                    className={`inline-flex items-center gap-1 font-bold no-underline text-xs ${isDark ? "text-[#f8fafc]" : "text-[#1e293b]"}`}
                    onClick={(e) => handleNavigatePage(e, srv.page)}
                  >
                    CHI TIẾT 
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                      <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. THÔNG BÁO SỰ KIỆN */}
      <div className="row mb-5 g-3 text-start section-events animate-entrance">
        <div className="col-12 col-md-4 col-lg-4">
          <div className="relative overflow-hidden bg-[#111827] text-white p-4 rounded-xl flex flex-col justify-between h-full min-h-[220px]">
            {/* Background Image Overlay */}
            <img
              src="assets/images/banner-second.jpg"
              alt="Event background"
              className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none z-0"
            />

            <div className="relative z-10">
              <h4 className="font-extrabold mb-3 text-white uppercase text-[1.2rem] tracking-[0.5px]">
                THÔNG BÁO SỰ KIỆN
              </h4>
              <p className="text-white/70 mb-4 text-[13px] leading-relaxed">
                Cập nhật những hoạt động mới nhất và các buổi Workshop độc quyền từ HT Ocean Group.
              </p>
            </div>

            <div className="relative z-10">
              <button
                className="w-full bg-transparent font-bold py-2 text-white border border-white hover:bg-white/10 rounded-lg text-xs tracking-wider transition-colors cursor-pointer"
                onClick={(e) => handleNavigatePage(e, "tintuc")}
              >
                XEM TOÀN BỘ LỊCH
              </button>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-8 col-lg-8">
          <div className="d-flex flex-column gap-3 h-100 justify-content-between">
            {loadingEvents ? (
              <div className="text-center py-5 w-100 d-flex justify-content-center align-items-center" style={{ minHeight: "200px" }}>
                <div className="spinner-border" style={{ color: brandColor }} role="status">
                  <span className="visually-hidden">Đang tải sự kiện...</span>
                </div>
              </div>
            ) : (
              events.map((evt) => {
                const { day, month } = parseArticleDate(evt.date);
                const eventBadgeStyle = getEventBadgeStyle(evt.status);

                return (
                  <div
                    className={`border p-3 shadow-sm flex flex-row items-center justify-between flex-wrap gap-3 interactive-card rounded-xl flex-1 cursor-pointer transition-all duration-300 ${isDark ? "bg-[#111827] border-[#334155]" : "bg-white border-[#e2e8f0]"}`}
                    key={evt.id || evt.title}
                    onClick={(e) => handleOpenEventModal(e, evt.title)}
                  >
                    <div className="flex items-center gap-3 min-w-0">


                      {/* Thumbnail Image */}
                      <div className={`rounded-lg overflow-hidden flex-shrink-0 hidden sm:block w-[90px] h-[60px] border ${isDark ? "border-[#334155]" : "border-[#e2e8f0]"}`}>
                        <img
                          src={evt.image || "assets/images/banner-second.jpg"}
                          alt={evt.title}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="min-w-0">
                        <h6 className={`font-bold mb-1 text-sm truncate w-[200px] sm:w-[280px] md:w-[320px] lg:w-[400px] ${isDark ? "text-[#f8fafc]" : "text-[#1e293b]"}`}>
                          {evt.title}
                        </h6>
                        <p className="text-xs text-[#64748b] dark:text-[#94a3b8] mb-0 truncate w-[200px] sm:w-[280px] md:w-[320px] lg:w-[400px]">
                          {evt.location || evt.summary || "HT Ocean Group"}
                          {formatDateSlash(evt.date) && ` | ${formatDateSlash(evt.date)}`}
                        </p>
                      </div>
                    </div>

                    <div className="ml-auto sm:ml-0">
                      <span className="badge px-3 py-2 font-bold text-center align-self-center" style={eventBadgeStyle}>
                        {evt.status || "ĐĂNG KÝ NGAY"}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 5. QUY TRÌNH ĐỒNG HÀNH */}
      <div className="mb-4 text-center section-process animate-entrance">
        <h3 className="fw-bold mb-2 text-uppercase" style={{ fontSize: "1.35rem", letterSpacing: "0.5px", color: headingTextColor }}>
          QUY TRÌNH ĐỒNG HÀNH
        </h3>
        <p className="text-body-secondary mb-4 mx-auto fst-italic" style={{ maxWidth: "800px", fontSize: "12.5px" }}>
          "Mỗi chương trình đều được theo dõi bằng checklist riêng, đảm bảo sự minh bạch và tiến độ chính xác nhất cho từng học viên."
        </p>

        <div className="row g-4 mt-2 text-start position-relative">
          {/* Background connecting lines for desktop */}
          <div className="position-absolute d-none d-md-block" style={{ top: "25%", left: "8%", right: "8%", height: "2px", borderTop: `2px dashed ${borderColor}`, zIndex: 0 }} />
          <div className="position-absolute d-none d-md-block" style={{ top: "75%", left: "8%", right: "8%", height: "2px", borderTop: `2px dashed ${borderColor}`, zIndex: 0 }} />

          {stepsData.map((step, idx) => (
            <div className="col-12 col-md-4" key={step.num} style={{ zIndex: 1 }}>
              <div
                className={`card p-3 shadow-sm h-100 position-relative interactive-card ${step.highlight ? "highlight-glow-card" : ""} ${activeStep === idx ? "border-primary" : ""}`}
                onClick={() => setActiveStep(activeStep === idx ? null : idx)}
                style={{
                  backgroundColor: cardBg,
                  border: activeStep === idx ? `2px solid ${brandColor}` : (step.highlight ? `2px solid ${brandColor}` : `1px solid ${borderColor}`),
                  borderRadius: "12px",
                  minHeight: "120px"
                }}
              >
                <div
                  className="position-absolute d-flex align-items-center justify-content-center text-white fw-bold step-num-tag"
                  style={{
                    top: "-12px",
                    left: "15px",
                    backgroundColor: brandColor,
                    width: "24px",
                    height: "24px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                  }}
                >
                  {step.num}
                </div>

                <div className="pt-2">
                  <h6 className="fw-bold mb-2 text-body-emphasis" style={{ fontSize: "14px", color: headingTextColor }}>
                    {step.title}
                  </h6>
                  <p className="text-body-secondary mb-0" style={{ fontSize: "12.5px", lineHeight: "1.45" }}>
                    {step.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Dynamic step detail card */}
        {activeStep !== null && (
          <div
            className="mt-4 p-3 rounded-3 border text-start d-flex align-items-start gap-3 shadow-sm animate-entrance"
            style={{
              backgroundColor: isDark ? "rgba(13, 145, 156, 0.04)" : "rgba(13, 145, 156, 0.02)",
              borderColor: brandColor,
              borderRadius: "12px",
              animation: "fadeInUp 0.3s ease-out"
            }}
          >
            <div
              className="d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0"
              style={{
                backgroundColor: brandColor,
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                fontSize: "16px"
              }}
            >
              {activeStep + 1}
            </div>

            <div style={{ flex: 1 }}>
              <h6 className="fw-bold mb-1" style={{ color: headingTextColor }}>
                CHI TIẾT BƯỚC: {stepsData[activeStep].title}
              </h6>
              <p className="text-body-secondary mb-0" style={{ fontSize: "13px", lineHeight: "1.5" }}>
                {stepsData[activeStep].detail}
              </p>
            </div>

            <button
              className="btn-close ms-auto p-1 bg-transparent border-0"
              onClick={() => setActiveStep(null)}
              aria-label="Close"
              style={{ filter: isDark ? "invert(1)" : "none" }}
            />
          </div>
        )}
      </div>

      {/* POPUP MODAL (CONSULT & REGISTER EVENT) */}
      {showModal && createPortal(
        <div
          className="fixed inset-0 w-screen h-screen bg-black/55 backdrop-blur-[4px] z-[1080] flex items-center justify-center overflow-y-auto p-5"
          onClick={() => setShowModal(false)}
        >
          <div
            className="relative w-full max-w-[500px] m-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`relative flex flex-col w-full rounded-2xl border-0 shadow-2xl p-5 text-[#1e293b] ${isDark ? "bg-[#111827] text-[#f8fafc]" : "bg-white text-[#1e293b]"}`}>
              <div className="flex items-center justify-between pb-2 border-b border-transparent">
                <h5 className="text-lg font-bold">
                  {modalType === "consult" ? "ĐĂNG KÝ TƯ VẤN LỘ TRÌNH" : "ĐĂNG KÝ THAM GIA SỰ KIỆN"}
                </h5>
                <button
                  type="button"
                  className={`text-2xl font-bold bg-transparent border-0 hover:opacity-75 cursor-pointer leading-none ${isDark ? "text-[#94a3b8]" : "text-[#64748b]"}`}
                  onClick={() => setShowModal(false)}
                  aria-label="Close"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleFormSubmit}>
                <div className="py-3">
                  {modalType === "event" && (
                    <div className={`p-3 mb-3 rounded-lg text-left border-l-4 border-[#0D919C] ${isDark ? "bg-[#1e293b]" : "bg-[#f1f5f9]"}`}>
                      <div className="font-bold mb-1 uppercase text-[11px] text-[#0D919C]">Bạn đang chọn sự kiện</div>
                      <div className="font-semibold text-sm">{selectedEvent}</div>
                    </div>
                  )}

                  <div className="mb-3 text-left">
                    <label className={`block text-xs font-bold mb-1 ${isDark ? "text-[#94a3b8]" : "text-[#64748b]"}`}>Họ và tên *</label>
                    <input
                      type="text"
                      name="name"
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0D919C] focus:border-[#0D919C] text-sm ${isDark ? "border-[#334155] bg-[#1f2937] text-[#f8fafc]" : "border-[#e2e8f0] bg-white text-[#1e293b]"}`}
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Nguyễn Văn A"
                    />
                  </div>

                  <div className="mb-3 text-left">
                    <label className={`block text-xs font-bold mb-1 ${isDark ? "text-[#94a3b8]" : "text-[#64748b]"}`}>Số điện thoại *</label>
                    <input
                      type="tel"
                      name="phone"
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0D919C] focus:border-[#0D919C] text-sm ${isDark ? "border-[#334155] bg-[#1f2937] text-[#f8fafc]" : "border-[#e2e8f0] bg-white text-[#1e293b]"}`}
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="0987654321"
                    />
                  </div>

                  <div className="mb-3 text-left">
                    <label className={`block text-xs font-bold mb-1 ${isDark ? "text-[#94a3b8]" : "text-[#64748b]"}`}>Địa chỉ Email *</label>
                    <input
                      type="email"
                      name="email"
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0D919C] focus:border-[#0D919C] text-sm ${isDark ? "border-[#334155] bg-[#1f2937] text-[#f8fafc]" : "border-[#e2e8f0] bg-white text-[#1e293b]"}`}
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="nguyenvana@gmail.com"
                    />
                  </div>

                  {modalType === "consult" && (
                    <div className="mb-3 text-left">
                      <label className={`block text-xs font-bold mb-1 ${isDark ? "text-[#94a3b8]" : "text-[#64748b]"}`}>Chương trình quan tâm</label>
                      <select
                        name="program"
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0D919C] focus:border-[#0D919C] text-sm ${isDark ? "border-[#334155] bg-[#1f2937] text-[#f8fafc]" : "border-[#e2e8f0] bg-white text-[#1e293b]"}`}
                        value={formData.program}
                        onChange={handleInputChange}
                      >
                        <option value="Du học nghề Đức" className={isDark ? "bg-[#1f2937]" : "bg-white"}>Du học nghề Đức (Điều dưỡng, Nhà hàng, Cơ khí...)</option>
                        <option value="Khóa học tiếng Đức" className={isDark ? "bg-[#1f2937]" : "bg-white"}>Khóa học tiếng Đức (A1, A2, B1, B2)</option>
                        <option value="Dịch vụ làm Visa" className={isDark ? "bg-[#1f2937]" : "bg-white"}>Dịch vụ làm hồ sơ Visa du học/du lịch</option>
                        <option value="Định cư & Việc làm" className={isDark ? "bg-[#1f2937]" : "bg-white"}>Chương trình Định cư & Việc làm tại CHLB Đức</option>
                      </select>
                    </div>
                  )}

                  <div className="mb-2 text-left">
                    <label className={`block text-xs font-bold mb-1 ${isDark ? "text-[#94a3b8]" : "text-[#64748b]"}`}>Ghi chú thêm</label>
                    <textarea
                      name="notes"
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0D919C] focus:border-[#0D919C] text-sm ${isDark ? "border-[#334155] bg-[#1f2937] text-[#f8fafc]" : "border-[#e2e8f0] bg-white text-[#1e293b]"}`}
                      rows="3"
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder="Ví dụ: Mong muốn tư vấn thời gian xuất cảnh, thủ tục tài chính..."
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 pb-1">
                  {modalType === "consult" && (
                    <a
                      href="#"
                      onClick={(e) => {
                        setShowModal(false);
                        handleNavigatePage(e, "leadForm");
                      }}
                      className="text-xs font-semibold no-underline text-[#0D919C] hover:text-[#0a757e] transition-colors"
                    >
                      Gửi qua Form Lead CRM &rarr;
                    </a>
                  )}
                  {modalType === "event" && (
                    <span className={`text-xs ${isDark ? "text-[#94a3b8]" : "text-[#64748b]"}`}>* Vui lòng kiểm tra kỹ email</span>
                  )}

                  <div className="flex gap-2 ml-auto">
                    <button
                      type="button"
                      className="text-white text-xs font-semibold px-4 py-2 bg-[#FD6B4C] hover:bg-[#e05638] rounded-lg transition-colors border-0 cursor-pointer"
                      onClick={() => setShowModal(false)}
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="text-white text-xs font-bold px-4 py-2 bg-[#0D919C] hover:bg-[#0a757e] rounded-lg transition-colors border-0 cursor-pointer"
                    >
                      XÁC NHẬN GỬI
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
