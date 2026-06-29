import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../config/api";
import { getAuthHeaders } from "../auth/session";

const LEAD_REQUEST_TIMEOUT_MS = 15000;

const normalizePhone = (value) => value.trim().replace(/[\s.-]/g, "");

const mapCountryInterest = (catId, progId) => {
  if (catId === "duhocnghe" || catId === "dinhcu") return "Đức";
  if (catId === "duhoche") {
    return progId === "singapore" ? "Singapore" : "Úc";
  }
  if (catId === "visa") {
    return progId === "visaduhoc" ? "Đức" : "Khác";
  }
};

const getApiErrorMessage = (data, status) => {
  if (status === 401) {
    return data?.message || "Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại để nộp hồ sơ.";
  }

  if (status === 403) {
    return data?.message || "Tài khoản hiện tại chưa có quyền nộp hồ sơ. Vui lòng kiểm tra lại quyền truy cập.";
  }

  if (status === 400) {
    return data?.message || "Thông tin hồ sơ chưa hợp lệ. Vui lòng kiểm tra lại họ tên, số điện thoại và email.";
  }

  return data?.message || "Không thể gửi hồ sơ lên hệ thống. Vui lòng thử lại sau.";
};

export function OnlineApplicationPage({ currentUser, onNavigate }) {
  // Brand color config
  const brandColor = "#0D919C";

  // Dynamic Theme observer
  const [isDark, setIsDark] = useState(() => {
    return document.documentElement.getAttribute("data-bs-theme") === "dark";
  });

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.getAttribute("data-bs-theme") === "dark");
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-bs-theme"],
    });
    return () => observer.disconnect();
  }, []);

  // Program catalog definitions
  const CATEGORIES = [
    {
      id: "duhocnghe",
      name: "Du học nghề Đức",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9-9c1.657 0 3 4.03 3 9s-1.343 9-3 9m0-18c-1.657 0-3 4.03-3 9s1.343 9 3 9m-9-9a9 9 0 019-9" />
        </svg>
      ),
      programs: [
        { id: "dieuduong", name: "Du học nghề Đức - Điều dưỡng kép (Hưởng lương)", docs: ["Hộ chiếu / CCCD", "Học bạ & Bằng tốt nghiệp THPT", "Chứng chỉ tiếng Đức A2/B1"] },
        { id: "cokhi", name: "Du học nghề Đức - Cơ khí & Điện tử", docs: ["Hộ chiếu / CCCD", "Học bạ & Bằng tốt nghiệp THPT", "Chứng chỉ tiếng Đức A2/B1"] },
        { id: "nhahang", name: "Du học nghề Đức - Nhà hàng & Khách sạn", docs: ["Hộ chiếu / CCCD", "Học bạ & Bằng tốt nghiệp THPT", "Chứng chỉ tiếng Đức A2/B1"] }
      ]
    },
    {
      id: "duhoche",
      name: "Du học hè quốc tế",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
        </svg>
      ),
      programs: [
        { id: "singapore", name: "Du học hè Singapore kết hợp Anh ngữ (7-17 tuổi)", docs: ["Hộ chiếu / Giấy khai sinh", "Cam kết phụ huynh"] },
        { id: "australia", name: "Du học hè Úc - Trải nghiệm văn hóa & Học thuật", docs: ["Hộ chiếu / Giấy khai sinh", "Học bạ 2 năm gần nhất", "Cam kết phụ huynh"] }
      ]
    },
    {
      id: "visa",
      name: "Dịch vụ làm Visa",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />
        </svg>
      ),
      programs: [
        { id: "visaduhoc", name: "Visa Du học Đức / Châu Âu", docs: ["Hộ chiếu / CCCD", "Thư mời nhập học", "Chứng minh tài chính"] },
        { id: "visadulich", name: "Visa Du lịch / Thăm thân nhân các nước", docs: ["Hộ chiếu / CCCD", "Chứng minh công việc", "Chứng minh tài chính"] }
      ]
    },
    {
      id: "dinhcu",
      name: "Định cư & Việc làm",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      programs: [
        { id: "dinhcuduc", name: "Chương trình Định cư diện Tay nghề cao CHLB Đức", docs: ["Hộ chiếu / CCCD", "Bằng đại học/cao đẳng chuyên ngành", "Bảng điểm", "Chứng chỉ ngoại ngữ"] },
        { id: "xuatkhau", name: "Chương trình Việc làm & Chuyển đổi văn bằng tại Đức", docs: ["Hộ chiếu / CCCD", "Bằng tốt nghiệp chuyên ngành", "Xác nhận kinh nghiệm làm việc"] }
      ]
    }
  ];

  // States
  const [selectedCatId, setSelectedCatId] = useState("duhocnghe");
  const [selectedProgId, setSelectedProgId] = useState("dieuduong");

  // Form Fields
  const [formData, setFormData] = useState(() => {
    try {
      const lastLead = JSON.parse(window.localStorage.getItem("last_lead_info"));
      if (lastLead && (lastLead.fullName || lastLead.phone || lastLead.email)) {
        return {
          fullName: lastLead.fullName || currentUser?.name || currentUser?.fullName || "",
          phone: lastLead.phone || "",
          email: lastLead.email || currentUser?.email || "",
          dob: lastLead.dob || "",
          passport: lastLead.passport || "",
          address: lastLead.address || "",
          notes: lastLead.notes || lastLead.note || ""
        };
      }
    } catch (e) {
      // ignore
    }
    return {
      fullName: currentUser?.name || currentUser?.fullName || "",
      phone: "",
      email: currentUser?.email || "",
      dob: "",
      passport: "",
      address: "",
      notes: ""
    };
  });



  // Flow control states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [leadCode, setLeadCode] = useState("");

  // CCCD Photo states
  const [cccdFrontFile, setCccdFrontFile] = useState(null);
  const [cccdBackFile, setCccdBackFile] = useState(null);
  const [cccdFrontPreview, setCccdFrontPreview] = useState("");
  const [cccdBackPreview, setCccdBackPreview] = useState("");

  const [submittedInvalidFields, setSubmittedInvalidFields] = useState([]);

  const getFieldBorderClass = (fieldName) => {
    if (submittedInvalidFields.includes(fieldName)) {
      return "border-red-500 focus:ring-red-500 focus:border-red-500 focus:ring-1";
    }
    return isDark
      ? "border-[#334155] focus:ring-[#0D919C] focus:border-[#0D919C]"
      : "border-[#e2e8f0] focus:ring-[#0D919C] focus:border-[#0D919C]";
  };

  const getCccdBorderClass = (fieldName) => {
    if (submittedInvalidFields.includes(fieldName)) {
      return "border-red-500";
    }
    return isDark
      ? "border-slate-700 hover:border-cyan-500"
      : "border-slate-200 hover:border-cyan-500";
  };

  // Sync program defaults when category changes
  const activeCategory = CATEGORIES.find(c => c.id === selectedCatId) || CATEGORIES[0];
  const activeProgram = activeCategory.programs.find(p => p.id === selectedProgId) || activeCategory.programs[0];

  useEffect(() => {
    if (activeCategory.programs.length > 0) {
      setSelectedProgId(activeCategory.programs[0].id);
    }
  }, [selectedCatId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const nextData = { ...prev, [name]: value };
      try {
        window.localStorage.setItem("last_lead_info", JSON.stringify(nextData));
      } catch (err) { }
      return nextData;
    });
    // Clear red border on input edit
    if (submittedInvalidFields.includes(name)) {
      setSubmittedInvalidFields(prev => prev.filter(f => f !== name));
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check authentication headers
    const authHeaders = getAuthHeaders();
    if (!authHeaders.Authorization) {
      setValidationError("Bạn cần đăng nhập hoặc phiên đăng nhập đã hết hạn để nộp hồ sơ đăng ký.");
      // Scroll to top of the form body
      const formContainer = document.querySelector("form");
      if (formContainer) {
        formContainer.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      return;
    }

    // Validate all required fields
    const invalidFields = [];
    if (!formData.fullName.trim()) invalidFields.push("fullName");
    if (!formData.phone.trim()) invalidFields.push("phone");
    if (!formData.email.trim()) invalidFields.push("email");
    if (!formData.dob) invalidFields.push("dob");
    if (!formData.passport.trim()) invalidFields.push("passport");
    if (!cccdFrontFile) invalidFields.push("cccdFront");
    if (!cccdBackFile) invalidFields.push("cccdBack");
    if (!formData.address.trim()) invalidFields.push("address");

    setSubmittedInvalidFields(invalidFields);

    if (invalidFields.length > 0) {
      setValidationError("Vui lòng điền đầy đủ và tải lên các thông tin bắt buộc (*).");

      // Find and scroll to the first invalid field
      const firstInvalidField = invalidFields[0];
      let elementToFocus = null;
      if (firstInvalidField === "cccdFront") {
        elementToFocus = document.getElementById("cccd-front-input-box");
      } else if (firstInvalidField === "cccdBack") {
        elementToFocus = document.getElementById("cccd-back-input-box");
      } else {
        elementToFocus = document.getElementsByName(firstInvalidField)[0];
      }

      if (elementToFocus) {
        elementToFocus.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => {
          if (elementToFocus.focus) {
            elementToFocus.focus();
          }
        }, 300);
      }
      return;
    }

    setValidationError("");
    setIsSubmitting(true);

    // Build the consolidated notes
    const noteParts = [];
    if (formData.dob) noteParts.push(`Ngày sinh: ${formData.dob}`);
    if (formData.passport) noteParts.push(`CCCD/Hộ chiếu: ${formData.passport}`);
    if (formData.address) noteParts.push(`Địa chỉ: ${formData.address}`);
    if (formData.notes) noteParts.push(`Ghi chú: ${formData.notes}`);
    const combinedNote = noteParts.join(" | ");

    // Prepare multipart/form-data payload
    const payload = new FormData();
    payload.append("customerName", formData.fullName.trim());
    payload.append("phone", normalizePhone(formData.phone));
    payload.append("email", formData.email.trim());
    payload.append("source", "Nộp hồ sơ online");
    payload.append("productInterest", activeProgram?.name || "Nộp hồ sơ online");
    payload.append("countryInterest", mapCountryInterest(selectedCatId, selectedProgId));
    payload.append("note", combinedNote);
    payload.append("cccdFront", cccdFrontFile);
    payload.append("cccdBack", cccdBackFile);

    const abortController = new AbortController();
    const requestTimeout = window.setTimeout(() => {
      abortController.abort();
    }, LEAD_REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(`${API_BASE_URL}/leads`, {
        method: "POST",
        headers: {
          ...authHeaders
        },
        signal: abortController.signal,
        body: payload
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(getApiErrorMessage(data, response.status));
      }

      const createdLead = data?.data || {};

      // Store returned lead ID or contact ID, fallback to client-side code if empty
      const successLeadCode = createdLead.bizflyContactId || createdLead._id || `HTO-${Date.now().toString().slice(-6)}`;
      setLeadCode(successLeadCode);
      setIsSuccess(true);
      window.localStorage.removeItem("last_lead_info");
    } catch (err) {
      const isTimeout = err.name === "AbortError";
      const errorMsg = isTimeout
        ? "Kết nối API quá lâu chưa phản hồi. Vui lòng thử lại sau ít phút."
        : err.message || "Không thể nộp hồ sơ. Vui lòng thử lại sau.";

      setValidationError(errorMsg);

      // Scroll to error view
      const formContainer = document.querySelector("form");
      if (formContainer) {
        formContainer.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } finally {
      window.clearTimeout(requestTimeout);
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setSelectedCatId("duhocnghe");
    setSelectedProgId("dieuduong");
    setFormData({
      fullName: currentUser?.name || currentUser?.fullName || "",
      phone: "",
      email: currentUser?.email || "",
      dob: "",
      passport: "",
      address: "",
      notes: ""
    });
    setValidationError("");
    setLeadCode("");
    setIsSuccess(false);

    // Revoke object URLs to avoid memory leaks
    if (cccdFrontPreview) URL.revokeObjectURL(cccdFrontPreview);
    if (cccdBackPreview) URL.revokeObjectURL(cccdBackPreview);

    setCccdFrontFile(null);
    setCccdBackFile(null);
    setCccdFrontPreview("");
    setCccdBackPreview("");
    setSubmittedInvalidFields([]);
  };

  return (
    <div className={`p-2.5 sm:p-4 md:p-6 w-full max-w-[1200px] mx-auto min-h-screen text-[#1e293b] ${isDark ? "text-[#f8fafc]" : ""}`}>


      {isSuccess ? (
        /* SUCCESS CONFIRMATION CARD */
        <div className={`rounded-2xl border p-4 sm:p-8 text-center max-w-[650px] mx-auto shadow-2xl transition-all duration-300 ${isDark ? "bg-[#111827] border-[#334155]" : "bg-white border-[#e2e8f0]"}`}>
          <div className="w-16 h-16 bg-[#10b981]/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#10b981]/20">
            <svg className="w-8 h-8 text-[#10b981]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className={`text-xl font-bold mb-2 ${isDark ? "text-white" : "text-[#0f172a]"}`}>
            Nộp Hồ Sơ Thành Công!
          </h3>
          <p className={`text-sm mb-6 px-1 ${isDark ? "text-[#94a3b8]" : "text-[#64748b]"}`}>
            Mã hồ sơ của bạn là <span className="font-bold text-[#0D919C]">{leadCode}</span>. Chuyên viên xử lý hồ sơ của HT Ocean sẽ tiến hành thẩm định và liên hệ lại với bạn qua số điện thoại <span className="font-semibold">{formData.phone}</span> trong vòng 24 giờ làm việc.
          </p>

          <div className={`rounded-xl p-4 mb-6 text-left text-xs space-y-2 ${isDark ? "bg-[#1f2937]" : "bg-[#f8fafc]"}`}>
            <div className="font-bold uppercase tracking-wider text-[10px] text-[#0D919C] mb-2 border-b pb-1">Tóm tắt thông tin nộp</div>
            <div className="flex flex-col sm:flex-row sm:gap-1"><span className="opacity-70 flex-shrink-0">Chương trình:</span> <strong className={`break-words ${isDark ? "text-white" : "text-[#1e293b]"}`}>{activeProgram?.name}</strong></div>
            <div className="flex flex-col sm:flex-row sm:gap-1"><span className="opacity-70 flex-shrink-0">Họ và tên:</span> <strong className={isDark ? "text-white" : "text-[#1e293b]"}>{formData.fullName}</strong></div>
            <div className="flex flex-col sm:flex-row sm:gap-1"><span className="opacity-70 flex-shrink-0">Số điện thoại:</span> <strong className={isDark ? "text-white" : "text-[#1e293b]"}>{formData.phone}</strong></div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center w-full">
            <button
              onClick={() => onNavigate?.("dashboard")}
              className={`w-full sm:w-auto px-5 py-3 text-xs font-bold rounded-lg border hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer text-center ${isDark ? "border-[#334155] text-slate-300" : "border-slate-200 text-slate-700"}`}
            >
              VỀ TRANG CHỦ
            </button>
            <button
              onClick={handleResetForm}
              className="w-full sm:w-auto px-6 py-3 text-xs font-bold text-white bg-[#0D919C] hover:bg-[#0a757e] rounded-lg transition-colors border-0 cursor-pointer text-center"
            >
              NỘP HỒ SƠ KHÁC
            </button>
          </div>
        </div>
      ) : (
        /* FORM BODY */
        <div className={`rounded-2xl border p-4 sm:p-5 md:p-6 flex flex-col justify-between shadow-sm relative ${isDark ? "bg-[#111827] border-[#334155]" : "bg-white border-[#e2e8f0]"}`}>
          {isSubmitting && (
            <div className="absolute inset-0 bg-white/70 dark:bg-black/60 backdrop-blur-[2px] rounded-2xl z-20 flex flex-col items-center justify-center">
              <div className="w-12 h-12 border-4 border-[#0D919C] border-t-transparent rounded-full animate-spin mb-3"></div>
              <div className="font-bold text-sm tracking-wide text-[#0D919C]">Đang kiểm tra và tải hồ sơ lên hệ thống...</div>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="flex-1 flex flex-col">

            {validationError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-xs font-semibold flex items-center gap-2 mb-4">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {validationError}
              </div>
            )}

            {/* PHẦN 1: CHỌN CHƯƠNG TRÌNH */}
            <div className="space-y-5 text-left">
              <div>
                <h3 className={`text-lg font-bold mb-1 ${isDark ? "text-white" : "text-[#0f172a]"}`}>Chọn Chương trình đăng ký</h3>
                <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  Chọn nhóm dịch vụ HTO và chương trình bạn quan tâm để tiến hành đăng ký trực tuyến.
                </p>
              </div>

              {/* Category grid selection */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {CATEGORIES.map(cat => {
                  const isSelected = selectedCatId === cat.id;
                  return (
                    <div
                      key={cat.id}
                      onClick={() => setSelectedCatId(cat.id)}
                      className={`p-3 border rounded-xl cursor-pointer transition-all duration-300 flex flex-col items-center justify-center text-center gap-2 ${isSelected
                        ? "border-[#0D919C] bg-[#0D919C]/5 shadow-md shadow-[#0D919C]/5 text-[#0D919C] font-semibold scale-[1.02]"
                        : (isDark ? "border-[#334155] hover:border-slate-600 bg-slate-800/20" : "border-[#e2e8f0] hover:border-slate-300 bg-slate-50/50")
                        }`}
                    >
                      <div className={`p-2 rounded-lg transition-colors ${isSelected ? "bg-[#0D919C] text-white" : (isDark ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500")}`}>
                        {cat.icon}
                      </div>
                      <span className="text-xs truncate w-full">{cat.name}</span>
                    </div>
                  );
                })}
              </div>

              {/* Program dropdown list */}
              <div className="space-y-2">
                <label className={`block text-xs font-bold ${isDark ? "text-[#94a3b8]" : "text-[#64748b]"}`}>Chương trình cụ thể *</label>
                <select
                  value={selectedProgId}
                  onChange={(e) => setSelectedProgId(e.target.value)}
                  className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0D919C] focus:border-[#0D919C] text-sm ${isDark ? "border-[#334155] bg-[#1f2937] text-white" : "border-[#e2e8f0] bg-white text-[#1e293b]"}`}
                >
                  {activeCategory.programs.map(p => (
                    <option key={p.id} value={p.id} className={isDark ? "bg-[#1f2937]" : "bg-white"}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <hr className="my-6 border-slate-100 dark:border-[#334155]" />

            {/* PHẦN 2: THÔNG TIN CÁ NHÂN */}
            <div className="space-y-4 text-left">
              <div>
                <h3 className={`text-lg font-bold mb-1 ${isDark ? "text-white" : "text-[#0f172a]"}`}>Thông tin cá nhân học viên</h3>
                <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  Điền thông tin định danh để HTO tạo hồ sơ học viên trong hệ thống quản lý.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className={`block text-xs font-bold ${isDark ? "text-[#94a3b8]" : "text-[#64748b]"}`}>Họ và tên *</label>
                  <input
                    type="text"
                    name="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Nguyễn Văn A"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring text-sm ${isDark ? "bg-[#1f2937] text-white" : "bg-white text-[#1e293b]"} ${getFieldBorderClass("fullName")}`}
                  />
                </div>

                <div className="space-y-1">
                  <label className={`block text-xs font-bold ${isDark ? "text-[#94a3b8]" : "text-[#64748b]"}`}>Số điện thoại *</label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="0987654321"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring text-sm ${isDark ? "bg-[#1f2937] text-white" : "bg-white text-[#1e293b]"} ${getFieldBorderClass("phone")}`}
                  />
                </div>

                <div className="space-y-1">
                  <label className={`block text-xs font-bold ${isDark ? "text-[#94a3b8]" : "text-[#64748b]"}`}>Địa chỉ Email *</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="nguyenvana@gmail.com"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring text-sm ${isDark ? "bg-[#1f2937] text-white" : "bg-white text-[#1e293b]"} ${getFieldBorderClass("email")}`}
                  />
                </div>

                <div className="space-y-1">
                  <label className={`block text-xs font-bold ${isDark ? "text-[#94a3b8]" : "text-[#64748b]"}`}>Ngày sinh *</label>
                  <input
                    type="date"
                    name="dob"
                    required
                    value={formData.dob}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring text-sm ${isDark ? "bg-[#1f2937] text-white" : "bg-white text-[#1e293b]"} ${getFieldBorderClass("dob")}`}
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className={`block text-xs font-bold ${isDark ? "text-[#94a3b8]" : "text-[#64748b]"}`}>Số CCCD / Hộ chiếu *</label>
                  <input
                    type="text"
                    name="passport"
                    required
                    value={formData.passport}
                    onChange={handleInputChange}
                    placeholder="Ví dụ: 037012345678"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring text-sm ${isDark ? "bg-[#1f2937] text-white" : "bg-white text-[#1e293b]"} ${getFieldBorderClass("passport")}`}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className={`block text-xs font-bold ${isDark ? "text-[#94a3b8]" : "text-[#64748b]"}`}>Ảnh thẻ CCCD / Hộ chiếu (Mặt trước & Mặt sau) *</label>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Mặt trước */}
                    <div className="flex flex-col gap-1">
                      <div
                        className={`relative h-28 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden ${isDark ? "bg-slate-800/20" : "bg-slate-50"
                          } ${getCccdBorderClass("cccdFront")}`}
                        onClick={() => document.getElementById("cccd-front-input").click()}
                        id="cccd-front-input-box"
                      >
                        {cccdFrontPreview ? (
                          <>
                            <img src={cccdFrontPreview} alt="Mặt trước" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/45 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (cccdFrontPreview) URL.revokeObjectURL(cccdFrontPreview);
                                  setCccdFrontFile(null);
                                  setCccdFrontPreview("");
                                }}
                                className="bg-red-600 hover:bg-red-700 text-white rounded-full p-2 text-xs transition-colors shadow-md border-0 cursor-pointer"
                              >
                                <i className="fa fa-trash"></i>
                              </button>
                            </div>
                            <span className="absolute bottom-2 left-2 bg-emerald-500/90 text-white px-2 py-0.5 rounded-md text-[8px] font-bold shadow-sm">
                              ✓ Đã chọn
                            </span>
                          </>
                        ) : (
                          <div className="flex flex-col items-center gap-1.5 text-center px-2">
                            <i className="fa fa-cloud-arrow-up text-slate-400 text-lg"></i>
                            <div>
                              <div className={`text-xs font-semibold ${isDark ? "text-slate-300" : "text-slate-600"}`}>Mặt trước CCCD</div>
                              <div className="text-[9px] text-slate-400">Nhấp để chọn ảnh</div>
                            </div>
                          </div>
                        )}
                      </div>
                      <input
                        type="file"
                        id="cccd-front-input"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (cccdFrontPreview) URL.revokeObjectURL(cccdFrontPreview);
                            setCccdFrontFile(file);
                            setCccdFrontPreview(URL.createObjectURL(file));
                            setSubmittedInvalidFields(prev => prev.filter(f => f !== "cccdFront"));
                          }
                        }}
                      />
                    </div>

                    {/* Mặt sau */}
                    <div className="flex flex-col gap-1">
                      <div
                        className={`relative h-28 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden ${isDark ? "bg-slate-800/20" : "bg-slate-50"
                          } ${getCccdBorderClass("cccdBack")}`}
                        onClick={() => document.getElementById("cccd-back-input").click()}
                        id="cccd-back-input-box"
                      >
                        {cccdBackPreview ? (
                          <>
                            <img src={cccdBackPreview} alt="Mặt sau" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/45 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (cccdBackPreview) URL.revokeObjectURL(cccdBackPreview);
                                  setCccdBackFile(null);
                                  setCccdBackPreview("");
                                }}
                                className="bg-red-600 hover:bg-red-700 text-white rounded-full p-2 text-xs transition-colors shadow-md border-0 cursor-pointer"
                              >
                                <i className="fa fa-trash"></i>
                              </button>
                            </div>
                            <span className="absolute bottom-2 left-2 bg-emerald-500/90 text-white px-2 py-0.5 rounded-md text-[8px] font-bold shadow-sm">
                              ✓ Đã chọn
                            </span>
                          </>
                        ) : (
                          <div className="flex flex-col items-center gap-1.5 text-center px-2">
                            <i className="fa fa-cloud-arrow-up text-slate-400 text-lg"></i>
                            <div>
                              <div className={`text-xs font-semibold ${isDark ? "text-slate-300" : "text-slate-600"}`}>Mặt sau CCCD</div>
                              <div className="text-[9px] text-slate-400">Nhấp để chọn ảnh</div>
                            </div>
                          </div>
                        )}
                      </div>
                      <input
                        type="file"
                        id="cccd-back-input"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (cccdBackPreview) URL.revokeObjectURL(cccdBackPreview);
                            setCccdBackFile(file);
                            setCccdBackPreview(URL.createObjectURL(file));
                            setSubmittedInvalidFields(prev => prev.filter(f => f !== "cccdBack"));
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className={`block text-xs font-bold ${isDark ? "text-[#94a3b8]" : "text-[#64748b]"}`}>Địa chỉ thường trú *</label>
                  <input
                    type="text"
                    name="address"
                    required
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Số nhà, Tên đường, Quận/Huyện, Tỉnh/Thành phố"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring text-sm ${isDark ? "bg-[#1f2937] text-white" : "bg-white text-[#1e293b]"} ${getFieldBorderClass("address")}`}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className={`block text-xs font-bold ${isDark ? "text-[#94a3b8]" : "text-[#64748b]"}`}>Ghi chú từ học viên</label>
                <textarea
                  name="notes"
                  rows="2"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Lời nhắn đến chuyên viên xét duyệt..."
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0D919C] focus:border-[#0D919C] text-sm ${isDark ? "border-[#334155] bg-[#1f2937] text-white" : "border-[#e2e8f0] bg-white text-[#1e293b]"}`}
                />
              </div>
            </div>

            {/* FLOW ACTIONS FOOTER */}
            <div className="flex justify-end border-t border-slate-100 dark:border-[#334155] pt-4 mt-6">
              <button
                type="submit"
                className="w-full sm:w-auto px-8 py-3 text-xs font-bold text-white bg-[#0D919C] hover:bg-[#0d9a6c] rounded-lg transition-colors border-0 cursor-pointer"
              >
                GỬI HỒ SƠ ĐĂNG KÝ
              </button>
            </div>

          </form>
        </div>
      )}
    </div>
  );
}
