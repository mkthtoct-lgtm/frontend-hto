import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { fetchNewsPosts } from "../newsEvents/newsEventsApi";
import { getAuthHeaders } from "../auth/session";
import { API_BASE_URL } from "../config/api";
import { beginLeadSubmission, finishLeadSubmission, markLeadReadyForReconciliation, normalizeLeadPhone } from "../utils/leadSubmission";

const fallbackCategories = [
  { id: "cat-du-hoc", name: "Du học nghề Đức" },
  { id: "cat-tieng-duc", name: "Khóa học tiếng Đức" },
  { id: "cat-visa", name: "Dịch vụ làm Visa" },
  { id: "cat-dinh-cu", name: "Định cư & Việc làm" }
];

const fallbackProducts = [
  { id: "prod-dd", name: "Du học nghề Đức ngành Điều dưỡng", categoryId: "cat-du-hoc", country: "Đức" },
  { id: "prod-nhks", name: "Du học nghề Đức ngành Nhà hàng - Khách sạn", categoryId: "cat-du-hoc", country: "Đức" },
  { id: "prod-ck", name: "Du học nghề Đức ngành Cơ khí - Điện tử", categoryId: "cat-du-hoc", country: "Đức" },
  { id: "prod-a1a2", name: "Khóa học tiếng Đức trình độ A1-A2", categoryId: "cat-tieng-duc", country: "Đức" },
  { id: "prod-b1b2", name: "Khóa học tiếng Đức trình độ B1-B2", categoryId: "cat-tieng-duc", country: "Đức" },
  { id: "prod-visa-dh", name: "Hồ sơ Visa du học nghề Đức", categoryId: "cat-visa", country: "Đức" },
  { id: "prod-visa-dl", name: "Hồ sơ Visa du lịch châu Âu (Schengen)", categoryId: "cat-visa", country: "Đức" },
  { id: "prod-ks", name: "Chương trình kỹ sư/nhân sự chất lượng cao tại Đức", categoryId: "cat-dinh-cu", country: "Đức" },
  { id: "prod-cd", name: "Chuyển đổi bằng cấp điều dưỡng viên nước ngoài", categoryId: "cat-dinh-cu", country: "Đức" }
];

const getReferralCode = () => {
  try {
    const params = new URLSearchParams(window.location.search);
    const urlCode = params.get("ref") || params.get("referral") || params.get("referralCode") || params.get("maGioiThieu");
    if (urlCode) {
      window.localStorage.setItem("hto_referral_code", urlCode);
      return urlCode;
    }

    const storedUser = JSON.parse(window.localStorage.getItem("auth_user") || "null");
    return storedUser?.referralCode || storedUser?.referral_code || window.localStorage.getItem("hto_referral_code") || "";
  } catch {
    return "";
  }
};

export const HomePage = ({ theme, onNavigate, currentUser }) => {
  // Brand colors
  const brandColor = "#0b6fb3";
  const hoverBrandColor = "#074b80";

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
    serviceId: "",
    productId: "",
    notes: ""
  });

  // Dynamic products & categories state
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cccdImages, setCccdImages] = useState([]);
  const [isProcessingCccd, setIsProcessingCccd] = useState(false);

  const activeCategories = categories.length > 0 ? categories : fallbackCategories;
  const activeProducts = products.length > 0 ? products : fallbackProducts;

  useEffect(() => {
    let active = true;
    const loadOptions = async () => {
      try {
        const headers = { "Content-Type": "application/json", ...getAuthHeaders() };

        // Tải danh mục dịch vụ
        const catRes = await fetch(`${API_BASE_URL}/product-categories`, { headers });
        let catList = [];
        if (catRes.ok) {
          const payload = await catRes.json().catch(() => null);
          catList = payload?.data || payload || [];
        }

        // Tải danh sách sản phẩm
        const prodRes = await fetch(`${API_BASE_URL}/products`, { headers });
        let prodList = [];
        if (prodRes.ok) {
          const payload = await prodRes.json().catch(() => null);
          prodList = payload?.data || payload || [];
        }

        if (active) {
          const formattedCats = catList.map(c => ({
            id: c._id || c.id,
            name: c.name
          })).filter(c => c.id && c.name);

          const formattedProds = prodList.map(p => ({
            id: p._id || p.id,
            name: p.name,
            categoryId: p.categoryId || p.category?._id || p.category?.id,
            country: p.country || "Đức"
          })).filter(p => p.id && p.name);

          setCategories(formattedCats);
          setProducts(formattedProds);
        }
      } catch (err) {
        console.warn("Lỗi tải thông tin sản phẩm từ API, sử dụng mock:", err.message);
      }
    };

    if (getAuthHeaders().Authorization) {
      loadOptions();
    }
    return () => { active = false; };
  }, []);

  // Toast notification
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
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

  const compressImage = (base64Str, maxWidth = 500, maxHeight = 500, quality = 0.35) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL("image/jpeg", quality);
        resolve(compressed);
      };
      img.onerror = () => {
        resolve(base64Str);
      };
    });
  };

  const handleCccdUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (cccdImages.length + files.length > 5) {
      triggerToast("Bạn chỉ được tải lên tối đa 5 ảnh CCCD!", "danger");
      e.target.value = "";
      return;
    }

    setIsProcessingCccd(true);
    const loadAndCompressPromises = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = async (event) => {
          const originalBase64 = event.target.result;
          const compressedBase64 = await compressImage(originalBase64);
          resolve(compressedBase64);
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(loadAndCompressPromises).then(compressedList => {
      setCccdImages(prev => [...prev, ...compressedList]);
      setIsProcessingCccd(false);
    }).catch(() => setIsProcessingCccd(false));

    e.target.value = "";
  };

  const handleRemoveCccd = (index) => {
    setCccdImages(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleOpenConsultModal = (e) => {
    e.preventDefault();
    const defaultServiceId = activeCategories[0]?.id || "";
    const filteredProds = activeProducts.filter(p => String(p.categoryId) === String(defaultServiceId));
    const defaultProductId = filteredProds[0]?.id || "";

    setCccdImages([]);
    setFormData({
      name: "",
      phone: "",
      email: "",
      serviceId: defaultServiceId,
      productId: defaultProductId,
      notes: ""
    });
    setModalType("consult");
    setShowModal(true);
  };

  const handleOpenEventModal = (e, eventTitle) => {
    e.preventDefault();
    setCccdImages([]);
    setFormData({ name: "", phone: "", email: "", serviceId: "", productId: "", notes: "" });
    setSelectedEvent(eventTitle);
    setModalType("event");
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (e) => {
    const serviceId = e.target.value;
    const filteredProds = activeProducts.filter(p => String(p.categoryId) === String(serviceId));
    const firstProductId = filteredProds[0]?.id || "";
    setFormData(prev => ({
      ...prev,
      serviceId,
      productId: firstProductId
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (modalType === "event") {
      setShowModal(false);
      triggerToast(`Đăng ký sự kiện thành công! Vé tham dự đã gửi tới email: ${formData.email}`);
      return;
    }

    // Gửi Lead lên CRM
    if (!formData.name.trim() || !formData.phone.trim()) {
      triggerToast("Vui lòng điền Họ tên và Số điện thoại!", "danger");
      return;
    }

    // Chờ xử lý ảnh CCCD hoàn tất trước khi gửi
    if (isProcessingCccd) {
      triggerToast("Ảnh CCCD đang được xử lý, vui lòng chờ giây lát...", "danger");
      return;
    }

    const duplicateGuard = beginLeadSubmission(formData.phone);
    if (!duplicateGuard.allowed) {
      triggerToast(duplicateGuard.message, "danger");
      return;
    }

    const selectedProduct = activeProducts.find(p => String(p.id) === String(formData.productId));
    const productName = selectedProduct ? selectedProduct.name : "Du học nghề Đức";
    const country = selectedProduct?.country || "Đức";

    setIsSubmitting(true);
    try {
      // Hàm chuyển base64 sang Blob file
      const base64ToBlob = (base64) => {
        const parts = base64.split(",");
        const mime = parts[0].match(/:(.*?);/)?.[1] || "image/jpeg";
        const byteString = atob(parts[1]);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
        return new Blob([ab], { type: mime });
      };

      let response;
      if (cccdImages.length >= 2) {
        // Gửi multipart/form-data với cccdFront và cccdBack (backend yêu cầu)
        const fd = new FormData();
        fd.append("customerName", formData.name.trim());
        fd.append("phone", normalizeLeadPhone(formData.phone));
        fd.append("email", formData.email.trim());
        fd.append("source", "Website");
        fd.append("productInterest", productName);
        fd.append("countryInterest", country);
        fd.append("note", `[Đăng ký tư vấn lộ trình] ${formData.notes.trim()}`.trim());
        fd.append("status", "xu_ly_ho_so");
        const referralCode = getReferralCode();
        if (referralCode) {
          fd.append("referralCode", referralCode);
        }
        fd.append("cccdFront", base64ToBlob(cccdImages[0]), "cccd_front.jpg");
        fd.append("cccdBack", base64ToBlob(cccdImages[1]), "cccd_back.jpg");
        // Nếu có thêm ảnh CCCD bổ sung (ảnh thứ 3-5)
        for (let i = 2; i < cccdImages.length; i++) {
          fd.append("cccdExtra", base64ToBlob(cccdImages[i]), `cccd_extra_${i}.jpg`);
        }

        const authHeaders = getAuthHeaders();
        const headers = { ...authHeaders };
        console.log("[HomePage] Gửi multipart/form-data với cccdFront + cccdBack");
        response = await fetch(`${API_BASE_URL}/leads`, {
          method: "POST",
          headers,
          body: fd
        });
      } else {
        // Gửi JSON thuần (không có CCCD hoặc chỉ 1 ảnh)
        const payload = {
          customerName: formData.name.trim(),
          phone: normalizeLeadPhone(formData.phone),
          email: formData.email.trim(),
          source: "Website",
          productInterest: productName,
          countryInterest: country,
          referralCode: getReferralCode(),
          note: `[Đăng ký tư vấn lộ trình] ${formData.notes.trim()}`.trim(),
          status: "xu_ly_ho_so"
        };

        const headers = { "Content-Type": "application/json", ...getAuthHeaders() };
        console.log("[HomePage] Payload JSON gửi lên API /leads:", JSON.stringify(payload, null, 2));
        response = await fetch(`${API_BASE_URL}/leads`, {
          method: "POST",
          headers,
          body: JSON.stringify(payload)
        });
      }

      const data = await response.json().catch(() => ({}));
      console.log("[HomePage] Response status:", response.status, "Body:", data);
      if (response.ok) {
        setShowModal(false);
        setCccdImages([]);
        const contactId = data?.data?.bizflyContactId || data?.data?._id || `LEAD-${Date.now().toString().slice(-6)}`;
        triggerToast(
          `Đăng ký tư vấn thành công! Lead đã được gửi lên CRM và tạo deal đối soát (Mã: ${contactId}).`,
          "success"
        );
        finishLeadSubmission(formData.phone, true);
      } else {
        const errorMsg = data?.message || `Lỗi máy chủ (HTTP ${response.status})`;
        triggerToast(`Gửi thông tin thất bại: ${errorMsg}`, "danger");
        finishLeadSubmission(formData.phone, false);
      }
    } catch (err) {
      console.error("Lỗi khi gửi lead lên CRM:", err);
      triggerToast(`Không thể kết nối đến máy chủ: ${err.message}`, "danger");
      finishLeadSubmission(formData.phone, false);
    } finally {
      setIsSubmitting(false);
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
            box-shadow: 0 4px 15px rgba(11, 111, 179, 0.12);
          }
          50% {
            box-shadow: 0 4px 25px rgba(11, 111, 179, 0.3);
            border-color: ${brandColor} !important;
          }
        }

        @keyframes breatheBacklight {
          0%, 100% {
            box-shadow: 0 10px 30px rgba(11, 111, 179, 0.08);
          }
          50% {
            box-shadow: 0 10px 45px rgba(11, 111, 179, 0.25);
          }
        }

        .animate-entrance {
          animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }

        .section-hero { animation-delay: 0.05s; }
        .section-stats { animation-delay: 0.1s; }
        .section-about { animation-delay: 0.15s; }
        .section-services { animation-delay: 0.2s; }
        .section-events { animation-delay: 0.25s; }
        .section-process { animation-delay: 0.3s; }

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
          box-shadow: 0 8px 25px rgba(0, 0, 0, 3) !important;
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

      {/* TOAST ALERT */}
      {showToast && (
        <div
          className="position-fixed top-0 start-50 translate-middle-x mt-4 p-3 rounded-3 shadow-lg d-flex align-items-center gap-2 text-white border-0"
          style={{
            backgroundColor: toastType === "success" ? "#0b6fb3" : "#ef4444",
            zIndex: 1090,
            boxShadow: toastType === "success" ? "0 10px 30px rgba(11, 111, 179, 0.25)" : "0 10px 30px rgba(239, 68, 68, 0.25)",
            fontSize: "14px",
            fontWeight: "600",
            animation: "fadeInUp 0.3s ease-out"
          }}
        >
          {toastType === "success" ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          )}
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
              <div className="text-body-secondary">
                <p className="mb-2 fs-6 lh-base" style={{ fontWeight: "400" }}>
                  <strong>HTO Group</strong> là công ty tư vấn giáo dục và định cư uy tín hàng đầu tại Việt Nam. Chúng tôi tự hào là đối tác tuyển sinh trực tiếp của hàng chục trường đại học, tập đoàn lớn tại Đức, Canada, Úc. Với tôn chỉ <em>"Uy tín - Tử tế - Trách nhiệm"</em>, HTO Group cam kết mang đến giải pháp di trú và phát triển nguồn nhân lực toàn diện cho người Việt.
                </p>
                <p className="mb-0 text-sm leading-relaxed" style={{ opacity: 0.9 }}>
                  Chúng tôi đồng hành xuyên suốt cùng học viên từ khâu đào tạo ngoại ngữ chuẩn đầu ra tại Hallo Sài Gòn, xử lý hồ sơ Visa nhanh chóng, thẩm định học bạ/CCCD, cho tới hỗ trợ tìm nhà ở, đăng ký tạm trú sau khi cất cánh sang nước sở tại.
                </p>
              </div>
            </div>

            {/* Các thế mạnh nổi bật điền khoảng trống */}
            <div className="row g-3 mb-4 mt-2">
              {[
                { icon: "fa-certificate", title: "50+ Đối tác toàn cầu", desc: "Liên kết trực tiếp với các trường & tập đoàn lớn tại Đức, Úc, Canada." },
                { icon: "fa-shield-halved", title: "Đồng hành trọn gói", desc: "Hỗ trợ từ đào tạo, làm hồ sơ đến định cư sau xuất cảnh." },
                { icon: "fa-circle-check", title: "Tỷ lệ Visa vượt trội", desc: "Quy trình thẩm định hồ sơ 2 lớp nghiêm ngặt, tỷ lệ đỗ cao." }
              ].map((item, idx) => (
                <div className="col-12 col-sm-4" key={idx}>
                  <div className="d-flex align-items-start gap-2">
                    <span className="text-primary mt-0.5" style={{ color: brandColor }}><i className={`fa ${item.icon} text-sm`}></i></span>
                    <div>
                      <h6 className="m-0 text-xs font-bold" style={{ color: headingTextColor }}>{item.title}</h6>
                      <p className="m-0 text-[10.5px] text-body-secondary mt-0.5 leading-snug">{item.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
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
                transition: "all 0.3s ease"
              }}
            >
              <img
                src="assets/images/Artboard1.png"
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
          { value: "5+", label: "NĂM ĐỒNG HÀNH" },
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

      {/* 2B. GIỚI THIỆU HTO GROUP */}
      <div className="row mb-5 g-4 text-start section-about animate-entrance">
        <div className="col-12 col-lg-6">
          <div className="h-100 d-flex flex-column justify-content-between gap-4">
            <div>
              <span className="text-uppercase fw-bold text-xs tracking-wider" style={{ color: brandColor }}>
                Về HTO Group
              </span>
              <h3 className="fw-bold mt-1 mb-3 text-uppercase" style={{ fontSize: "1.45rem", letterSpacing: "0.5px", color: headingTextColor }}>
                Người bạn đồng hành đáng tin cậy trong lĩnh vực giáo dục và định cư
              </h3>
              <p className="text-body-secondary text-sm leading-relaxed mb-4">
                HTO Group là công ty tư vấn giáo dục và định cư uy tín hàng đầu tại Việt Nam. Công ty được thành lập với sứ mệnh trở thành người bạn đồng hành đáng tin cậy, giúp người Việt tiếp cận gần hơn với thế giới, mở ra nhiều con đường về học tập và lao động phù hợp nhất với nhu cầu và năng lực của mỗi người.
              </p>

              <div className="d-flex flex-column gap-2 mb-2">
                {[
                  "Đào tạo kiến thức và kỹ năng",
                  "Định hướng du học và việc làm",
                  "Di trú và định cư nước ngoài"
                ].map((item, idx) => (
                  <div className="d-flex align-items-center gap-2.5" key={idx}>
                    <span className="d-inline-flex align-items-center justify-content-center rounded-circle flex-shrink-0 text-blue-600 dark:text-blue-400" style={{ width: "24px", height: "24px", backgroundColor: isDark ? "rgba(11, 111, 179, 0.15)" : "rgba(11, 111, 179, 0.08)" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </span>
                    <span className="font-semibold text-sm" style={{ color: headingTextColor }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border p-4 bg-gradient-to-r from-blue-50/50 to-cyan-50/20 dark:from-blue-950/20 dark:to-cyan-950/10" style={{ borderColor: borderColor }}>
              <div className="text-uppercase fw-bold text-[10px] mb-1" style={{ color: brandColor }}>Giá trị cốt lõi</div>
              <div className="font-extrabold text-[15px] mb-1.5" style={{ color: headingTextColor }}>“Uy tín – Tử tế – Trách nhiệm”</div>
              <p className="text-body-secondary text-xs leading-relaxed m-0">
                Đây là “kim chỉ nam” định hướng về thái độ hành xử của người lao động, là những giá trị mang tính phổ quát, bền vững và được áp dụng tại HTO.
              </p>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-6">
          <div className="d-flex flex-column gap-3 h-100">
            <div className="row g-3">
              <div className="col-12 col-sm-6">
                <div className="card p-3 border rounded-xl h-100" style={{ backgroundColor: cardBg, borderColor: borderColor }}>
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <span className="text-blue-600 dark:text-blue-400 text-base">
                      <i className="fa fa-eye"></i>
                    </span>
                    <h6 className="font-bold m-0 text-xs text-uppercase" style={{ color: headingTextColor }}>Tầm Nhìn</h6>
                  </div>
                  <p className="text-body-secondary text-xs leading-relaxed m-0" style={{ fontSize: "11.5px" }}>
                    Trở thành tổ chức tư vấn du học và phát triển con người hàng đầu khu vực, được công nhận bởi sự chuyên nghiệp, uy tín và những đóng góp vượt trội vào chất lượng giáo dục quốc tế của người Việt.
                  </p>
                </div>
              </div>

              <div className="col-12 col-sm-6">
                <div className="card p-3 border rounded-xl h-100" style={{ backgroundColor: cardBg, borderColor: borderColor }}>
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <span className="text-blue-600 dark:text-blue-400 text-base">
                      <i className="fa fa-rocket"></i>
                    </span>
                    <h6 className="font-bold m-0 text-xs text-uppercase" style={{ color: headingTextColor }}>Sứ Mệnh</h6>
                  </div>
                  <p className="text-body-secondary text-xs leading-relaxed m-0" style={{ fontSize: "11.5px" }}>
                    Kiến tạo những công dân toàn cầu ưu tú thông qua hành trình du học trọn vẹn và chuyên nghiệp, giúp họ mở khóa tiềm năng và thành công bền vững trên trường quốc tế.
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-4 border rounded-xl flex-grow-1" style={{ backgroundColor: cardBg, borderColor: borderColor }}>
              <div className="d-flex align-items-center gap-2.5 mb-2.5 border-b pb-2" style={{ borderColor: borderColor }}>
                <span className="text-blue-600 dark:text-blue-400">
                  <i className="fa fa-clock-rotate-left"></i>
                </span>
                <h6 className="font-bold m-0 text-xs text-uppercase" style={{ color: headingTextColor }}>Lịch Sử Hình Thành & Phát Triển</h6>
              </div>
              <p className="text-body-secondary text-xs leading-relaxed m-0" style={{ fontSize: "12px", lineHeight: "1.6" }}>
                HTO Group được thành lập vào năm 2021 với sứ mệnh đồng hành cùng người Việt trở thành công dân toàn cầu. Từ một công ty tư vấn giáo dục và định tại TP. HCM, chúng tôi đã mở rộng mạng lưới với các văn phòng đại diện trong nước và quốc tế. Với đội ngũ chuyên gia giàu kinh nghiệm, HTO Group đã hỗ trợ hàng chục ngàn cơ hội học tập và việc làm cho thanh niên Việt Nam. Chúng tôi cam kết xây dựng hệ sinh thái giáo dục toàn diện, từ đào tạo ngoại ngữ tại Hallo Sài Gòn đến tư vấn du học và định cư tại các quốc gia hàng đầu như Đức, Canada, Úc. Hành trình của chúng tôi tiếp tục phát triển, góp phần kiến tạo tương lai bền vững cho thế hệ trẻ.
              </p>
            </div>
          </div>
        </div>
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
                  <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
                  <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
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
                  <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                  <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                  <path d="M10 9H8" />
                  <path d="M16 13H8" />
                  <path d="M16 17H8" />
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
                  <path d="m5 8 6 6" />
                  <path d="m4 14 6-6 2-3h-15" />
                  <path d="M2 5h12" />
                  <path d="M7 2h1" />
                  <path d="m22 22-5-10-5 10" />
                  <path d="M14 18h6" />
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
                  <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                  <rect width="20" height="14" x="2" y="6" rx="2" />
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
                  <div className="flex items-center justify-center text-white mb-3 w-10 h-10 bg-[#0b6fb3] rounded-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
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
                    <span className={`inline-block px-2 py-1 font-bold text-center text-[10px] tracking-wide rounded-md border ${isDark ? "border-[#334155] text-[#0b6fb3]" : "border-[#e2e8f0] text-[#0b6fb3]"}`}>
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
                className={`card p-3 shadow-sm h-100 position-relative interactive-card ${activeStep === idx ? "border-primary" : ""}`}
                onClick={() => setActiveStep(activeStep === idx ? null : idx)}
                style={{
                  backgroundColor: cardBg,
                  border: activeStep === idx ? `2px solid ${brandColor}` : `1px solid ${borderColor}`,
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
              backgroundColor: isDark ? "rgba(11, 111, 179, 0.04)" : "rgba(11, 111, 179, 0.02)",
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
      {
        showModal && createPortal(
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
                      <div className={`p-3 mb-3 rounded-lg text-left border-l-4 border-[#0b6fb3] ${isDark ? "bg-[#1e293b]" : "bg-[#f1f5f9]"}`}>
                        <div className="font-bold mb-1 uppercase text-[11px] text-[#0b6fb3]">Bạn đang chọn sự kiện</div>
                        <div className="font-semibold text-sm">{selectedEvent}</div>
                      </div>
                    )}

                    <div className="mb-3 text-left">
                      <label className={`block text-xs font-bold mb-1 ${isDark ? "text-[#94a3b8]" : "text-[#64748b]"}`}>Họ và tên *</label>
                      <input
                        type="text"
                        name="name"
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0b6fb3] focus:border-[#0b6fb3] text-sm ${isDark ? "border-[#334155] bg-[#1f2937] text-[#f8fafc]" : "border-[#e2e8f0] bg-white text-[#1e293b]"}`}
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
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0b6fb3] focus:border-[#0b6fb3] text-sm ${isDark ? "border-[#334155] bg-[#1f2937] text-[#f8fafc]" : "border-[#e2e8f0] bg-white text-[#1e293b]"}`}
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
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0b6fb3] focus:border-[#0b6fb3] text-sm ${isDark ? "border-[#334155] bg-[#1f2937] text-[#f8fafc]" : "border-[#e2e8f0] bg-white text-[#1e293b]"}`}
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="nguyenvana@gmail.com"
                      />
                    </div>

                    {modalType === "consult" && (
                      <>
                        <div className="mb-3 text-left">
                          <label className={`block text-xs font-bold mb-1 ${isDark ? "text-[#94a3b8]" : "text-[#64748b]"}`}>Chọn dịch vụ *</label>
                          <select
                            name="serviceId"
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0b6fb3] focus:border-[#0b6fb3] text-sm ${isDark ? "border-[#334155] bg-[#1f2937] text-[#f8fafc]" : "border-[#e2e8f0] bg-white text-[#1e293b]"}`}
                            value={formData.serviceId}
                            onChange={handleCategoryChange}
                            required
                          >
                            {activeCategories.map(cat => (
                              <option key={cat.id} value={cat.id} className={isDark ? "bg-[#1f2937]" : "bg-white"}>
                                {cat.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="mb-3 text-left">
                          <label className={`block text-xs font-bold mb-1 ${isDark ? "text-[#94a3b8]" : "text-[#64748b]"}`}>Chọn sản phẩm *</label>
                          <select
                            name="productId"
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0b6fb3] focus:border-[#0b6fb3] text-sm ${isDark ? "border-[#334155] bg-[#1f2937] text-[#f8fafc]" : "border-[#e2e8f0] bg-white text-[#1e293b]"}`}
                            value={formData.productId}
                            onChange={handleInputChange}
                            required
                          >
                            {activeProducts.filter(p => String(p.categoryId) === String(formData.serviceId)).map(prod => (
                              <option key={prod.id} value={prod.id} className={isDark ? "bg-[#1f2937]" : "bg-white"}>
                                {prod.name}
                              </option>
                            ))}
                            {activeProducts.filter(p => String(p.categoryId) === String(formData.serviceId)).length === 0 && (
                              <option value="" className={isDark ? "bg-[#1f2937]" : "bg-white"}>
                                Chưa có sản phẩm cho dịch vụ này
                              </option>
                            )}
                          </select>
                        </div>
                        <div className="mb-3 text-left">
                          <label className={`block text-xs font-bold mb-1 ${isDark ? "text-[#94a3b8]" : "text-[#64748b]"}`}>
                            Tải ảnh CCCD khách hàng (Đã chọn: {cccdImages.length}/5)
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            className={`w-full px-3 py-1.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0b6fb3] focus:border-[#0b6fb3] text-sm ${isDark ? "border-[#334155] bg-[#1f2937] text-[#f8fafc]" : "border-[#e2e8f0] bg-white text-[#1e293b]"}`}
                            onChange={handleCccdUpload}
                          />
                          <div className="text-[10px] mt-1" style={{ color: mutedTextColor }}>
                            * Nếu có tải CCCD, vui lòng tải từ 2 đến 5 ảnh (ví dụ: mặt trước, mặt sau)
                          </div>
                          {cccdImages.length > 0 && (
                            <div className="mt-2 d-flex flex-wrap gap-2">
                              {cccdImages.map((imgBase64, idx) => (
                                <div key={idx} className="position-relative d-inline-block" style={{ width: "65px", height: "65px" }}>
                                  <img src={imgBase64} alt={`CCCD ${idx + 1}`} className="img-thumbnail w-100 h-100 object-fit-cover" style={{ padding: "1px" }} />
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-danger position-absolute top-0 end-0 m-0.5"
                                    onClick={() => handleRemoveCccd(idx)}
                                    style={{ padding: "0px 4px", fontSize: "9px", lineHeight: "1" }}
                                  >
                                    &times;
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    <div className="mb-2 text-left">
                      <label className={`block text-xs font-bold mb-1 ${isDark ? "text-[#94a3b8]" : "text-[#64748b]"}`}>Ghi chú thêm</label>
                      <textarea
                        name="notes"
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0b6fb3] focus:border-[#0b6fb3] text-sm ${isDark ? "border-[#334155] bg-[#1f2937] text-[#f8fafc]" : "border-[#e2e8f0] bg-white text-[#1e293b]"}`}
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
                        className="text-xs font-semibold no-underline text-[#0b6fb3] hover:text-[#074b80] transition-colors"
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
                        disabled={isSubmitting}
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="text-white text-xs font-bold px-4 py-2 bg-[#0b6fb3] hover:bg-[#074b80] rounded-lg transition-colors border-0 cursor-pointer disabled:opacity-50"
                      >
                        {isSubmitting ? "ĐANG GỬI..." : "XÁC NHẬN GỬI"}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>,
          document.body
        )
      }
    </div >
  );
};
