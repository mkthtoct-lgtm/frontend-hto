import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { API_BASE_URL } from "../config/api";
import { authFetch, getAuthHeaders } from "../auth/session";
import { ToastDispatchContext, useToast } from "./ToastContext";
import { beginLeadSubmission, finishLeadSubmission, normalizeLeadPhone } from "../utils/leadSubmission";
import { MOCK_CATEGORIES } from "./mockCategories";
const STATIC_BASE_URL = API_BASE_URL.replace("/api/v1", "");

// Key dùng chung với Sidebar.jsx để truyền danh mục được chọn khi điều hướng
const SIDEBAR_CATEGORY_STORAGE_KEY = "hto_selected_product_category";
// Sự kiện dùng để Sidebar báo ngay cho trang này (nếu đã mount sẵn) khi người dùng đổi danh mục
const SIDEBAR_CATEGORY_EVENT = "hto:select-product-category";

// Đọc (và xóa) danh mục được Sidebar chọn — gọi trong lazy initializer của useState,
// KHÔNG gọi trong effect, để tránh setState đồng bộ bên trong effect (react-hooks/set-state-in-effect)
const readPendingSidebarCategory = () => {
  try {
    const raw = sessionStorage.getItem(SIDEBAR_CATEGORY_STORAGE_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(SIDEBAR_CATEGORY_STORAGE_KEY);
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
};

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

const cleanVietnameseText = (str) => {
  if (!str) return "";
  let res = str.normalize("NFC");
  const replacements = {
    "a`": "à", "A`": "À",
    "â`": "ầ", "Â`": "Ầ",
    "ă`": "ằ", "Ă`": "Ằ",
    "e`": "è", "E`": "È",
    "ê`": "ề", "Ê`": "Ề",
    "i`": "ì", "I`": "Ì",
    "o`": "ò", "O`": "Ò",
    "ô`": "ồ", "Ô`": "Ồ",
    "ơ`": "ờ", "Ơ`": "Ờ",
    "u`": "ù", "U`": "Ù",
    "ư`": "ừ", "Ư`": "Ừ",
    "y`": "ỳ", "Y`": "Ỳ",
    "a´": "á", "A´": "Á",
    "â´": "ấ", "Â´": "Ấ",
    "ă´": "ắ", "Ă´": "Ắ",
    "e´": "é", "E´": "É",
    "ê´": "ế", "Ê´": "Ế",
    "i´": "í", "I´": "Í",
    "o´": "ó", "O´": "Ó",
    "ô´": "ố", "Ô´": "Ố",
    "ơ´": "ớ", "Ơ´": "Ớ",
    "u´": "ú", "U´": "Ú",
    "ư´": "ứ", "Ư´": "Ứ",
    "y´": "ý", "Y´": "Ý"
  };
  for (const [key, val] of Object.entries(replacements)) {
    res = res.replace(new RegExp(key, "g"), val);
  }
  return res.replace(/[`´]/g, "");
};

const numberToVietnameseWords = (num) => {
  if (!num || isNaN(num)) return "Không đồng";
  const units = ["", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
  const unitsTen = ["", "mười", "hai mươi", "ba mươi", "bốn mươi", "năm mươi", "sáu mươi", "bảy mươi", "tám mươi", "chín mươi"];
  
  const readThreeDigits = (threeDigits, showZeroHundred) => {
    let hundred = Math.floor(threeDigits / 100);
    let ten = Math.floor((threeDigits % 100) / 10);
    let unit = threeDigits % 10;
    let res = "";
    
    if (hundred > 0 || showZeroHundred) {
      res += units[hundred] + " trăm ";
    }
    
    if (ten > 0) {
      res += unitsTen[ten] + " ";
    } else if (hundred > 0 && unit > 0) {
      res += "lẻ ";
    }
    
    if (unit > 0) {
      if (unit === 1 && ten > 1) {
        res += "mốt";
      } else if (unit === 5 && ten > 0) {
        res += "lăm";
      } else {
        res += units[unit];
      }
    }
    return res.trim();
  };

  let strNum = Math.floor(num).toString();
  let groups = [];
  while (strNum.length > 0) {
    groups.push(parseInt(strNum.slice(-3)));
    strNum = strNum.slice(0, -3);
  }

  const levels = ["", "nghìn", "triệu", "tỷ", "nghìn tỷ", "triệu tỷ"];
  let words = "";
  for (let i = groups.length - 1; i >= 0; i--) {
    let g = groups[i];
    if (g > 0) {
      let gWords = readThreeDigits(g, i < groups.length - 1);
      words += gWords + " " + levels[i] + " ";
    }
  }

  words = words.trim();
  if (!words) return "Không đồng";
  return words.charAt(0).toUpperCase() + words.slice(1) + " đồng chẵn";
};

// ==========================================
// MOCK DATA - LUÔN CÓ SẴN ĐỂ FALLBACK
// ==========================================
const VISA_TYPES = [
  { id: "vtype-1", name: "Visa Du học", icon: "fa-graduation-cap", desc: "Hồ sơ xin visa du học các nước", color: "text-[#2563eb]", gradient: "bg-linear-to-b from-[#e0f2fe] to-white", btnBg: "bg-[#eff6ff] text-[#2563eb] hover:bg-[#dbeafe]", docsCount: 12, filesCount: 18 },
  { id: "vtype-2", name: "Visa Du lịch", icon: "fa-plane", desc: "Hồ sơ xin visa du lịch, thăm thân", color: "text-[#059669]", gradient: "bg-linear-to-b from-[#d1fae5] to-white", btnBg: "bg-[#ecfdf5] text-[#059669] hover:bg-[#d1fae5]", docsCount: 8, filesCount: 10 },
  { id: "vtype-3", name: "Visa Định cư", icon: "fa-house", desc: "Hồ sơ xin định cư, bảo lãnh", color: "text-[#d97706]", gradient: "bg-linear-to-b from-[#fef3c7] to-white", btnBg: "bg-[#fffbeb] text-[#d97706] hover:bg-[#fef3c7]", docsCount: 7, filesCount: 12 },
  { id: "vtype-4", name: "Visa Công tác", icon: "fa-briefcase", desc: "Hồ sơ xin visa công tác, làm việc", color: "text-[#7c3aed]", gradient: "bg-linear-to-b from-[#f3e8ff] to-white", btnBg: "bg-[#faf5ff] text-[#7c3aed] hover:bg-[#f3e8ff]", docsCount: 5, filesCount: 6 }
];



const EXCEL_PRODUCTS = [
  { visaCode: "CA-TRV-TOUR-SGL", shortCode: "VIS-CA-01", country: "Canada", name: "Canada", purpose: "Du lịch/Thăm thân", serviceFee: 8100000 },
  { visaCode: "CA-TRV-CHILD-U14-WITH-PARENTS", shortCode: "VIS-CA-02", country: "Canada", name: "Canada (trẻ em dưới 14t) đi cùng bố mẹ", purpose: "Du lịch/Thăm thân", serviceFee: 4590000 },
  { visaCode: "CA-TRV-CHILD-U14-SEPARATE", shortCode: "VIS-CA-03", country: "Canada", name: "Canada (trẻ em dưới 14t) nộp riêng", purpose: "Du lịch/Thăm thân", serviceFee: 6210000 },
  { visaCode: "US-B1B2-TOUR-BIZ", shortCode: "VIS-US-01", country: "Mỹ", name: "Mỹ", purpose: "Du lịch/Công tác", serviceFee: 8100000 },
  { visaCode: "US-B1B2-RENEWAL", shortCode: "VIS-US-02", country: "Mỹ", name: "Mỹ gia hạn visa", purpose: "Du lịch/Công tác", serviceFee: 8100000 },
  { visaCode: "SCH-TOUR-SGL", shortCode: "VIS-SCH-01", country: "Schengen", name: "Schengen", purpose: "Du lịch/Thăm thân/Công tác", serviceFee: 7290000 },
  { visaCode: "AU-600-TOUR-VISIT", shortCode: "VIS-AU-01", country: "Úc", name: "Úc", purpose: "Du lịch/Thăm thân/Công tác", serviceFee: 7560000 },
  { visaCode: "NZ-VISITOR-TOUR", shortCode: "VIS-NZ-01", country: "New Zealand", name: "New Zealand", purpose: "Du lịch/Thăm thân", serviceFee: 10260000 },
  { visaCode: "UK-STANDARD-VISITOR-6M", shortCode: "VIS-UK-01", country: "UK", name: "UK (6 tháng)", purpose: "Du lịch/Thăm thân/Công tác", serviceFee: 12150000 },
  { visaCode: "KR-C31-TOUR-SGL-3M-SOUTH", shortCode: "VIS-KR-01", country: "Hàn Quốc", name: "Hàn (miền Nam) 3 tháng Single", purpose: "Du lịch", serviceFee: 3180000 },
  { visaCode: "KR-F15-FAMILY-VISIT-SGL", shortCode: "VIS-KR-02", country: "Hàn Quốc", name: "Hàn thăm thân F1-5", purpose: "Thăm thân", serviceFee: 3445000 },
  { visaCode: "KR-C31-TOUR-MUL-5Y-SOUTH", shortCode: "VIS-KR-03", country: "Hàn Quốc", name: "Hàn (miền Nam) 5 năm Multiple", purpose: "Du lịch", serviceFee: 5300000 },
  { visaCode: "KR-C31-TOUR-MUL-10Y-SOUTH", shortCode: "VIS-KR-04", country: "Hàn Quốc", name: "Hàn (miền Nam) 10 Năm Multiple", purpose: "Du lịch", serviceFee: 6360000 },
  { visaCode: "KR-C31-TOUR-SGL-3M-NORTH", shortCode: "VIS-KR-05", country: "Hàn Quốc", name: "Hàn (miền Bắc) 3 tháng Single", purpose: "Du lịch", serviceFee: 3510000 },
  { visaCode: "KR-C31-TOUR-MUL-5Y10Y-SOUTH", shortCode: "VIS-KR-06", country: "Hàn Quốc", name: "Hàn (miền Nam) 5 năm = 10 Năm Multiple", purpose: "Du lịch", serviceFee: 6750000 },
  { visaCode: "JP-TOUR-SGL", shortCode: "VIS-JP-01", country: "Nhật Bản", name: "Nhật SGL", purpose: "Du lịch", serviceFee: 2970000 },
  { visaCode: "JP-TOUR-MUL", shortCode: "VIS-JP-02", country: "Nhật Bản", name: "Nhật MUL", purpose: "Du lịch", serviceFee: 3510000 },
  { visaCode: "TW-TOUR-STANDARD-5D", shortCode: "VIS-TW-01", country: "Đài Loan", name: "Đài Loan thường 5 ngày", purpose: "Du lịch", serviceFee: 3240000 },
  { visaCode: "TW-TOUR-URGENT-3D", shortCode: "VIS-TW-02", country: "Đài Loan", name: "Đài Loan khẩn 3 ngày", purpose: "Du lịch", serviceFee: 4050000 },
  { visaCode: "CN-TOUR-BIZ-SGL", shortCode: "VIS-CN-01", country: "Trung Quốc", name: "Trung Quốc du lịch = thương mại", purpose: "Du lịch/Thương mại", serviceFee: 3510000 },
  { visaCode: "KR-C39-TOUR-SGL-3M", shortCode: "", country: "Hàn Quốc", name: "Du lịch", purpose: "Du lịch", serviceFee: 0 },
  { visaCode: "KR-C39-TOUR-MUL-5Y", shortCode: "", country: "Hàn Quốc", name: "Du lịch", purpose: "Du lịch", serviceFee: 0 },
  { visaCode: "CN-L-TOUR-SGL", shortCode: "", country: "Trung Quốc", name: "Du lịch", purpose: "Du lịch", serviceFee: 0 },
  { visaCode: "CN-M-BIZ-SGL", shortCode: "", country: "Trung Quốc", name: "Công tác", purpose: "Công tác", serviceFee: 0 },
  { visaCode: "JP-VISIT-FAMILY", shortCode: "", country: "Nhật Bản", name: "Thăm thân", purpose: "Thăm thân", serviceFee: 0 },
  { visaCode: "TW-TOUR-STANDARD", shortCode: "", country: "Đài Loan", name: "Du lịch", purpose: "Du lịch", serviceFee: 0 },
  { visaCode: "TW-BIZ-STANDARD", shortCode: "", country: "Đài Loan", name: "Công tác", purpose: "Công tác", serviceFee: 0 },
  { visaCode: "HK-EVISA-TOUR", shortCode: "", country: "Hong Kong", name: "Du lịch", purpose: "Du lịch", serviceFee: 0 },
  { visaCode: "HK-EVISA-BIZ", shortCode: "", country: "Hong Kong", name: "Thương mại", purpose: "Thương mại", serviceFee: 0 },
  { visaCode: "HK-EVISA-TRANSIT", shortCode: "", country: "Hong Kong", name: "Quá cảnh", purpose: "Quá cảnh", serviceFee: 0 },
  { visaCode: "SCH-VISIT-FAMILY", shortCode: "", country: "Schengen", name: "Thăm thân", purpose: "Thăm thân", serviceFee: 0 },
  { visaCode: "SCH-BIZ-SGL", shortCode: "", country: "Schengen", name: "Công tác", purpose: "Công tác", serviceFee: 0 },
  { visaCode: "CA-TRV-TOUR", shortCode: "", country: "Canada", name: "Du lịch", purpose: "Du lịch", serviceFee: 0 },
  { visaCode: "AU-600-TOUR", shortCode: "", country: "Úc", name: "Du lịch", purpose: "Du lịch", serviceFee: 0 },
  { visaCode: "AU-600-VISIT-FAMILY", shortCode: "", country: "Úc", name: "Thăm thân", purpose: "Thăm thân", serviceFee: 0 },
  { visaCode: "AU-600-BIZ", shortCode: "", country: "Úc", name: "Công tác", purpose: "Công tác", serviceFee: 0 },
  { visaCode: "NZ-VISITOR-GROUP", shortCode: "", country: "New Zealand", name: "Gia đình/nhóm", purpose: "Gia đình/nhóm", serviceFee: 0 },
  { visaCode: "ID-VISITOR-TOUR", shortCode: "", country: "Indonesia", name: "Du lịch", purpose: "Du lịch", serviceFee: 0 },
  { visaCode: "IN-VISITOR-TOUR", shortCode: "", country: "Ấn Độ", name: "Du lịch", purpose: "Du lịch", serviceFee: 0 },
  { visaCode: "KR-STUDY-LANG-D41", shortCode: "VIS-KR-ST01", country: "Hàn Quốc", name: "Du học tiếng Hàn", purpose: "Du học", serviceFee: 13600000 },
  { visaCode: "KR-STUDY-VET-D46", shortCode: "VIS-KR-ST02", country: "Hàn Quốc", name: "Du học nghề Hàn Quốc", purpose: "Du học", serviceFee: 13600000 },
  { visaCode: "KR-STUDY-ASSOC-D21", shortCode: "VIS-KR-ST03", country: "Hàn Quốc", name: "Cao đẳng chuyên ngành", purpose: "Du học", serviceFee: 13600000 },
  { visaCode: "KR-STUDY-UNI-D22", shortCode: "VIS-KR-ST04", country: "Hàn Quốc", name: "Đại học chính quy", purpose: "Du học", serviceFee: 13600000 },
  { visaCode: "KR-STUDY-POST-D23D24", shortCode: "VIS-KR-ST05", country: "Hàn Quốc", name: "Thạc sĩ/Tiến sĩ", purpose: "Du học", serviceFee: 13600000 },
  { visaCode: "KR-STUDY-EXCH-D26", shortCode: "VIS-KR-ST06", country: "Hàn Quốc", name: "Trao đổi sinh viên", purpose: "Du học", serviceFee: 13600000 },
  { visaCode: "JP-STUDY-STUDENT-COE", shortCode: "VIS-JP-ST01", country: "Nhật Bản", name: "Visa du học Nhật Bản", purpose: "Du học", serviceFee: 13600000 },
  { visaCode: "CN-STUDY-X1-LONG", shortCode: "VIS-CN-ST01", country: "Trung Quốc", name: "Du học dài hạn Trung Quốc", purpose: "Du học", serviceFee: 13600000 },
  { visaCode: "CN-STUDY-X2-SHORT", shortCode: "VIS-CN-ST02", country: "Trung Quốc", name: "Du học ngắn hạn Trung Quốc", purpose: "Du học", serviceFee: 13600000 },
  { visaCode: "TW-STUDY-RESIDENT", shortCode: "VIS-TW-ST01", country: "Đài Loan", name: "Resident Visa for Study", purpose: "Du học", serviceFee: 13600000 },
  { visaCode: "TW-STUDY-VISITOR", shortCode: "VIS-TW-ST02", country: "Đài Loan", name: "Visitor Visa for Study", purpose: "Du học", serviceFee: 13600000 },
  { visaCode: "DE-STUDY-VET-BERUF", shortCode: "VIS-DE-ST01", country: "Đức", name: "Du học nghề Đức", purpose: "Du học", serviceFee: 30600000 },
  { visaCode: "DE-STUDY-UNI-STUDIUM", shortCode: "VIS-DE-ST02", country: "Đức", name: "Du học Đại học/Sau Đại học Đức", purpose: "Du học", serviceFee: 30600000 },
  { visaCode: "DE-STUDY-SOP-KOLLEG", shortCode: "VIS-DE-ST03", country: "Đức", name: "Dự bị Đại học/Tìm trường Đức", purpose: "Du học", serviceFee: 30600000 },
  { visaCode: "DE-STUDY-LANG-SPRACH", shortCode: "VIS-DE-ST04", country: "Đức", name: "Khóa tiếng Đức chuyên sâu", purpose: "Du học", serviceFee: 30600000 },
  { visaCode: "SCH-STUDY-SHORT-C", shortCode: "VIS-SCH-ST01", country: "Khối Schengen", name: "Du học ngắn hạn Schengen", purpose: "Du học", serviceFee: 20400000 },
  { visaCode: "SCH-STUDY-LONG-D", shortCode: "VIS-SCH-ST02", country: "Khối Schengen", name: "Du học dài hạn quốc gia", purpose: "Du học", serviceFee: 20400000 },
  { visaCode: "UK-STUDY-STUDENT", shortCode: "VIS-UK-ST01", country: "Anh Quốc", name: "Student Visa UK", purpose: "Du học", serviceFee: 30600000 },
  { visaCode: "UK-STUDY-CHILD", shortCode: "VIS-UK-ST02", country: "Anh Quốc", name: "Child Student Visa UK", purpose: "Du học", serviceFee: 30600000 },
  { visaCode: "UK-STUDY-SHORT-11M", shortCode: "VIS-UK-ST03", country: "Anh Quốc", name: "Short-term Study Visa UK", purpose: "Du học", serviceFee: 30600000 },
  { visaCode: "UK-STUDY-VISITOR-6M", shortCode: "VIS-UK-ST04", country: "Anh Quốc", name: "Standard Visitor học ngắn hạn", purpose: "Du học", serviceFee: 30600000 },
  { visaCode: "US-STUDY-F1-ACADEMIC", shortCode: "VIS-US-ST01", country: "Mỹ", name: "Du học chính quy Mỹ", purpose: "Du học", serviceFee: 30600000 },
  { visaCode: "US-STUDY-M1-VOCATIONAL", shortCode: "VIS-US-ST02", country: "Mỹ", name: "Du học nghề Mỹ", purpose: "Du học", serviceFee: 30600000 },
  { visaCode: "US-STUDY-J1-EXCHANGE", shortCode: "VIS-US-ST03", country: "Mỹ", name: "Giao lưu văn hóa/trao đổi Mỹ", purpose: "Du học", serviceFee: 30600000 },
  { visaCode: "AU-STUDY-SUBCLASS500", shortCode: "VIS-AU-ST01", country: "Úc", name: "Student Visa Úc", purpose: "Du học", serviceFee: 30600000 },
  { visaCode: "AU-STUDY-GD-SUBCLASS590", shortCode: "VIS-AU-ST02", country: "Úc", name: "Người giám hộ du học sinh Úc", purpose: "Du học", serviceFee: 30600000 },
  { visaCode: "CA-STUDY-PERMIT-REGULAR", shortCode: "VIS-CA-ST01", country: "Canada", name: "Study Permit Canada thường", purpose: "Du học", serviceFee: 30600000 },
  { visaCode: "CA-STUDY-PERMIT-SDS", shortCode: "VIS-CA-ST02", country: "Canada", name: "Study Permit diện SDS", purpose: "Du học", serviceFee: 30600000 },
  { visaCode: "CA-STUDY-VISITOR-SHORT", shortCode: "VIS-CA-ST03", country: "Canada", name: "Khóa học ngắn hạn Canada", purpose: "Du học", serviceFee: 30600000 },
  { visaCode: "NZ-STUDY-FEE-PAYING", shortCode: "VIS-NZ-ST01", country: "New Zealand", name: "Fee Paying Student Visa", purpose: "Du học", serviceFee: 20400000 },
  { visaCode: "NZ-STUDY-PATHWAY", shortCode: "VIS-NZ-ST02", country: "New Zealand", name: "Pathway Student Visa", purpose: "Du học", serviceFee: 20400000 },
  { visaCode: "NZ-STUDY-EXCHANGE", shortCode: "VIS-NZ-ST03", country: "New Zealand", name: "Exchange Student Visa", purpose: "Du học", serviceFee: 20400000 },
  { visaCode: "NZ-STUDY-FOREIGN-DOMESTIC", shortCode: "VIS-NZ-ST04", country: "New Zealand", name: "Foreign Domestic Student Visa", purpose: "Du học", serviceFee: 20400000 },
];


// ==========================================
// TOAST NOTIFICATION SYSTEM
// ==========================================
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dispatch = useCallback((toast) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, ...toast }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, toast.duration || 3500);
  }, []);

  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  const ICONS = {
    success: (
      <svg className="w-5 h-5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5 text-cyan-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  const STYLES = {
    success: "border-emerald-200 bg-emerald-50",
    error: "border-red-200 bg-red-50",
    warning: "border-amber-200 bg-amber-50",
    info: "border-cyan-200 bg-cyan-50",
  };

  return (
    <ToastDispatchContext.Provider value={dispatch}>
      {children}
      <div className="fixed top-4 right-4 z-9999 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-lg animate-[slideInRight_0.25s_ease-out] ${STYLES[t.type] || STYLES.info}`}
          >
            {ICONS[t.type] || ICONS.info}
            <div className="flex-1 min-w-0">
              {t.title && <p className="text-sm font-semibold text-slate-800 mb-0.5">{t.title}</p>}
              <p className="text-xs text-slate-600 leading-relaxed">{t.message}</p>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-slate-400 hover:text-slate-600 transition-colors shrink-0 mt-0.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </ToastDispatchContext.Provider>
  );
}

// ==========================================
// CONFIRM MODAL COMPONENT
// ==========================================
function ConfirmModal({ isOpen, title, message, confirmLabel = "Xác nhận", cancelLabel = "Hủy", variant = "danger", onConfirm, onCancel }) {
  if (!isOpen) return null;

  const btnStyles = {
    danger: "bg-red-600 hover:bg-red-700 text-white",
    warning: "bg-amber-500 hover:bg-amber-600 text-white",
    primary: "bg-cyan-900 hover:bg-cyan-950 text-white",
  };

  const iconStyles = {
    danger: { bg: "bg-red-100", icon: "text-red-600", path: "M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" },
    warning: { bg: "bg-amber-100", icon: "text-amber-600", path: "M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" },
    primary: { bg: "bg-cyan-100", icon: "text-cyan-700", path: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  };

  const s = iconStyles[variant] || iconStyles.danger;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[3px] flex items-center justify-center p-4 z-9998 animate-[fadeIn_0.15s_ease-out]">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-[slideUp_0.2s_cubic-bezier(0.16,1,0.3,1)]">
        <div className="flex items-start gap-4">
          <div className={`shrink-0 w-10 h-10 rounded-full ${s.bg} flex items-center justify-center`}>
            <svg className={`w-5 h-5 ${s.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={s.path} />
            </svg>
          </div>
          <div className="flex-1">
            {title && <h6 className="font-bold text-slate-800 text-sm mb-1">{title}</h6>}
            <p className="text-slate-500 text-sm leading-relaxed">{message}</p>
          </div>
        </div>
        <div className="flex gap-3 mt-5 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="text-slate-600 border border-slate-200 hover:bg-slate-50 text-xs font-semibold py-2 px-4 rounded-xl transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`text-xs font-semibold py-2 px-4 rounded-xl transition-colors ${btnStyles[variant] || btnStyles.danger}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// API HELPERS — Products & Categories
// ==========================================

const parseApiError = async (response) => {
  if (response.status === 403) return "Bạn không có quyền thực hiện thao tác này.";
  if (response.status === 401) return "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.";
  if (response.status === 404) return "Không tìm thấy dữ liệu yêu cầu.";
  try {
    const body = await response.json();
    return body?.message || body?.error || `Lỗi máy chủ (${response.status}).`;
  } catch {
    return `Lỗi máy chủ (${response.status}).`;
  }
};

const apiRequest = async (url, options = {}) => {
  const headers = {
    ...getAuthHeaders(),
    ...(options.headers || {})
  };
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  const response = await authFetch(url, { ...options, headers });
  if (!response.ok) {
    const msg = await parseApiError(response);
    throw new Error(msg);
  }
  const text = await response.text();
  return text ? JSON.parse(text) : null;
};

// Helper: parse extended info từ description (lưu dưới dạng JSON)
const parseExtendedInfo = (description) => {
  if (!description) return { mainDescription: "", extendedData: {} };
  if (description.startsWith('{') && description.includes('"__extended__"')) {
    try {
      const parsed = JSON.parse(description);
      if (parsed.__extended__) {
        return {
          mainDescription: parsed.mainDescription || "",
          extendedData: parsed
        };
      }
    } catch {
      return { mainDescription: description, extendedData: {} };
    }
  }
  return { mainDescription: description, extendedData: {} };
};

// Build description với extended data
const buildDescription = (mainDescription, extendedData) => {
  if (Object.keys(extendedData).length === 0) return mainDescription;
  return JSON.stringify({
    __extended__: true,
    mainDescription: mainDescription || "",
    ...extendedData
  });
};

// Map product từ API về UI format
const mapApiProductToUiProduct = (apiProduct, categoryId, categoryName) => {
  if (!apiProduct) return null;
  const id = apiProduct._id || apiProduct.id;
  const catId = (typeof apiProduct.categoryId === "object"
    ? apiProduct.categoryId?._id || apiProduct.categoryId?.id
    : apiProduct.categoryId) || categoryId || "";
  const catName = apiProduct.categoryName || categoryName || "";

  const { mainDescription, extendedData } = parseExtendedInfo(apiProduct.description);

  const requirements = Array.isArray(apiProduct.requirements) ? apiProduct.requirements : [];
  const highlights = requirements
    .filter(r => r.criteriaType !== "tag" && r.criteriaType !== "processStep")
    .map(r => r.criteriaValue || `${r.criteriaType}: ${r.criteriaValue}`)
    .filter(Boolean);

  const steps = Array.isArray(apiProduct.steps) ? apiProduct.steps : [];
  const processSteps = steps
    .slice()
    .sort((a, b) => (a.stepOrder || 0) - (b.stepOrder || 0))
    .map(s => s.stepName || s.description || "")
    .filter(Boolean);

  const costs = Array.isArray(apiProduct.costs) ? apiProduct.costs : [];

  const status = apiProduct.status ||
    (apiProduct.isActive === false ? "inactive" : "active");

  let cleanImagePath = apiProduct.image || "";
  if (cleanImagePath.includes("localhost:3000")) {
    cleanImagePath = cleanImagePath.replace(/^http:\/\/localhost:3000/, "");
  }

  const image = cleanImagePath
    ? (cleanImagePath.startsWith("http") || cleanImagePath.startsWith("data:")
      ? cleanImagePath
      : `${STATIC_BASE_URL}/${cleanImagePath.replace(/^\//, "")}`)
    : "";

  const tags = requirements.filter(r => r.criteriaType === "tag").map(r => r.criteriaValue).filter(Boolean);

  const serviceFeeItem = costs.find(c => c.itemName === "Phí dịch vụ");
  const serviceFee = serviceFeeItem?.amount || apiProduct.serviceFee || 0;
  const currency = serviceFeeItem?.currency || apiProduct.currency || "VND";

  return {
    id,
    name: apiProduct.name || "",
    categoryId: catId,
    categoryName: catName,
    country: apiProduct.country || "",
    region: extendedData.region || "Châu Á",
    status,
    isActive: apiProduct.isActive !== false,
    description: mainDescription,
    detailDescription: extendedData.detailDescription || mainDescription,
    targetAudience: extendedData.targetAudience || "",
    highlights,
    processSteps,
    steps,
    requirements,
    costs,
    serviceFee,
    currency,
    tags: extendedData.tags || tags,
    websiteUrl: extendedData.websiteUrl || "",
    image,
    brochure: extendedData.brochure || null,
    documents: extendedData.documents || [],
    gradientFrom: extendedData.gradientFrom || "#0d2040",
    gradientTo: extendedData.gradientTo || "#1a3a6b",
    updatedAt: apiProduct.updatedAt || extendedData.updatedAt || "",
    visaCode: apiProduct.visaCode || "",
    shortCode: apiProduct.shortCode || "",
    purpose: apiProduct.purpose || ""
  };
};

/**
 * Chuyển đổi dữ liệu danh mục từ API về định dạng chuẩn của giao diện (UI)
 */
const mapApiCategoryToUiCategory = (apiCategory) => {
  if (!apiCategory) return null;

  const id = apiCategory._id || apiCategory.id || "";
  const name = apiCategory.name || "";
  const description = apiCategory.description || "";
  const status = apiCategory.status || (apiCategory.isActive === false ? "inactive" : "active");
  const updatedAt = apiCategory.updatedAt || "";

  let rawUrl = apiCategory.coverImageUrl || apiCategory.imageUrl || apiCategory.image || "";

  if (rawUrl.includes("localhost:3000")) {
    rawUrl = rawUrl.replace(/^http:\/\/localhost:3000/, "");
  }

  const coverImageUrl = rawUrl
    ? (rawUrl.startsWith("http://") || rawUrl.startsWith("https://") || rawUrl.startsWith("data:")
      ? rawUrl
      : `${STATIC_BASE_URL}/${rawUrl.replace(/^\//, "")}`)
    : "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80";

  return {
    id,
    name,
    description,
    status,
    updatedAt,
    coverImageUrl,
    programs: [],
    products: []
  };
};

const safeText = (value) => String(value || "").toLowerCase().trim();
const safeArray = (value) => Array.isArray(value) ? value : [];

// Map mã quốc gia ISO → tên tiếng Việt đầy đủ
const COUNTRY_CODE_MAP = {
  AF: "Afghanistan", AL: "Albania", DZ: "Algeria", AR: "Argentina",
  AU: "Úc", AT: "Áo", BE: "Bỉ", BR: "Brazil", KH: "Campuchia",
  CA: "Canada", CL: "Chile", CN: "Trung Quốc", CO: "Colombia",
  HR: "Croatia", CZ: "Cộng hòa Séc", DK: "Đan Mạch", EG: "Ai Cập",
  FI: "Phần Lan", FR: "Pháp", DE: "Đức", GH: "Ghana", GR: "Hy Lạp",
  HK: "Hồng Kông", HU: "Hungary", IN: "Ấn Độ", ID: "Indonesia",
  IR: "Iran", IQ: "Iraq", IE: "Ireland", IL: "Israel", IT: "Ý",
  JP: "Nhật Bản", JO: "Jordan", KZ: "Kazakhstan", KE: "Kenya",
  KR: "Hàn Quốc", KW: "Kuwait", LA: "Lào", LB: "Lebanon",
  MY: "Malaysia", MX: "Mexico", MA: "Morocco", MM: "Myanmar",
  NL: "Hà Lan", NZ: "New Zealand", NG: "Nigeria", NO: "Na Uy",
  PK: "Pakistan", PH: "Philippines", PL: "Ba Lan", PT: "Bồ Đào Nha",
  QA: "Qatar", RO: "Romania", RU: "Nga", SA: "Ả Rập Xê Út",
  SG: "Singapore", ZA: "Nam Phi", ES: "Tây Ban Nha", LK: "Sri Lanka",
  SE: "Thụy Điển", CH: "Thụy Sĩ", TW: "Đài Loan", TH: "Thái Lan",
  TR: "Thổ Nhĩ Kỳ", UA: "Ukraine", AE: "UAE", GB: "Anh Quốc",
  US: "Mỹ", VN: "Việt Nam", YE: "Yemen",
};

// Chuyển mã quốc gia → tên đầy đủ (nếu có), ngược lại giữ nguyên
const resolveCountryName = (value) => {
  if (!value) return "";
  const upper = value.trim().toUpperCase();
  return COUNTRY_CODE_MAP[upper] || value.trim();
};

const ROLE_ID_MAP = {
  "69fc5af582ef85451120772a": "admin",
  "69fc5af582ef85451120772b": "bangiamdoc",
  "69fc5af582ef85451120772c": "truongbophan",
  "69fc5af582ef85451120772d": "nhansu",
  "69fc5af582ef85451120772e": "daily",
  "69fc5af682ef85451120772f": "user",
  "69fc5af782ef854511207730": "congtacvien",
  "60c72b2f9b1d8b2bad000001": "staff",
};

const normalizeRoleKey = (roleValue) => {
  return String(roleValue || "")
    .trim()
    .toLowerCase()
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
};

const getUserRoleKey = (user) => {
  const roleFromObject = user?.role?.name || user?.roleName || user?.role || user?.role_key || "";
  const roleFromId = ROLE_ID_MAP[user?.roleId];
  return normalizeRoleKey(roleFromObject || roleFromId || "user");
};

// ==========================================
// CUSTOM DROPDOWN COMPONENT
// ==========================================
function CustomDropdown({ value, options, onChange, placeholder }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const selectedOption = options.find(opt => opt.value === value) || options[0];
  const isAll = value === "Tất cả" || value === "all";
  const displayLabel = isAll ? placeholder : (selectedOption?.label || placeholder);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full h-10 bg-white app-dark:bg-[#1e1e1e]! border ${isOpen ? "border-cyan-400 ring-2 ring-cyan-500/20" : "border-slate-200 app-dark:border-slate-700!"
          } force-rounded-xl px-3 text-sm text-slate-700 app-dark:text-slate-200! flex items-center justify-between shadow-sm transition-all duration-200 cursor-pointer focus:outline-none`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={`truncate pr-2 ${isAll ? "text-slate-700 app-dark:text-slate-400! font-medium" : "text-slate-800 app-dark:text-slate-100! font-semibold"}`}>
          {displayLabel}
        </span>
        <svg
          className={`w-4 h-4 text-slate-400 app-dark:text-slate-500! transition-transform duration-200 shrink-0 ${isOpen ? "rotate-180" : ""
            }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 z-9999 mt-1.5 max-h-[280px] overflow-y-auto force-rounded-xl border border-slate-200 app-dark:border-slate-700! bg-white app-dark:bg-[#252525]! shadow-xl p-1 animate-fade-in">
          <div role="listbox" className="flex flex-col gap-0.5">
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={`w-full force-rounded-lg px-3 py-2 text-left text-sm transition-colors duration-150 flex items-center justify-between cursor-pointer ${isSelected
                    ? "bg-cyan-100 app-dark:bg-cyan-900/40! text-cyan-800 app-dark:text-cyan-100! font-semibold"
                    : "text-slate-700 app-dark:text-slate-200! hover:bg-cyan-50 app-dark:hover:bg-cyan-900/30! hover:text-cyan-700 app-dark:hover:text-cyan-400"
                    }`}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                >
                  <span className="truncate pr-2">{opt.label}</span>
                  {isSelected && (
                    <svg className="w-4 h-4 text-cyan-700 app-dark:text-cyan-400! shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function MegaMenuFilter({ categories, selectedCategoryName, selectedCountry, selectedRegion, onSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCat, setSelectedCat] = useState(null);
  const [selectedRegionItem, setSelectedRegionItem] = useState(null);
  const [selectedCountryItem, setSelectedCountryItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const menuRef = useRef(null);

  // Lọc danh mục
  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) return categories;
    const term = searchTerm.toLowerCase().trim();
    return categories.filter(cat =>
      cat?.name?.toLowerCase().includes(term) ||
      cat?.description?.toLowerCase().includes(term)
    );
  }, [categories, searchTerm]);

  // Lấy danh sách khu vực theo danh mục đã chọn
  const regionsForCat = useMemo(() => {
    if (!selectedCat) return [];
    const cat = categories.find(c => c.name === selectedCat);
    if (!cat) return [];

    const seen = new Set();
    const result = [];
    (cat.programs || []).forEach(p => {
      const raw = p?.region?.trim();
      if (raw && !seen.has(raw)) {
        seen.add(raw);
        result.push(raw);
      }
    });
    return result.sort();
  }, [categories, selectedCat]);

  // Lấy danh sách quốc gia theo danh mục + khu vực đã chọn
  const countriesForSelection = useMemo(() => {
    if (!selectedCat || !selectedRegionItem) return [];
    const cat = categories.find(c => c.name === selectedCat);
    if (!cat) return [];

    let programs = cat.programs || [];
    if (selectedRegionItem !== "Tất cả khu vực") {
      programs = programs.filter(p => safeText(p?.region) === safeText(selectedRegionItem));
    }

    const seen = new Set();
    const result = [];
    programs.forEach(p => {
      const raw = p?.country?.trim();
      if (raw && !seen.has(raw)) {
        seen.add(raw);
        result.push(raw);
      }
    });
    return result.sort((a, b) =>
      resolveCountryName(a).localeCompare(resolveCountryName(b), "vi")
    );
  }, [categories, selectedCat, selectedRegionItem]);

  // Lấy chương trình theo danh mục, khu vực và quốc gia đã chọn
  const programsForSelection = useMemo(() => {
    if (!selectedCat || !selectedRegionItem || !selectedCountryItem) return [];

    const cat = categories.find(c => c.name === selectedCat);
    if (!cat) return [];

    let programs = cat.programs || [];

    if (selectedRegionItem !== "Tất cả khu vực") {
      programs = programs.filter(p => safeText(p?.region) === safeText(selectedRegionItem));
    }

    if (selectedCountryItem !== "Tất cả quốc gia") {
      programs = programs.filter(p => safeText(p?.country) === safeText(selectedCountryItem));
    }

    return programs;
  }, [categories, selectedCat, selectedRegionItem, selectedCountryItem]);

  // Click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
        setSelectedCat(null);
        setSelectedRegionItem(null);
        setSelectedCountryItem(null);
        setSearchTerm("");
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const hasSelection = selectedCategoryName !== "Tất cả" || selectedCountry !== "Tất cả" || selectedRegion !== "Tất cả";

  const displayLabel = hasSelection
    ? [
      selectedCategoryName !== "Tất cả" && selectedCategoryName,
      selectedRegion !== "Tất cả" && selectedRegion,
      selectedCountry !== "Tất cả" && resolveCountryName(selectedCountry)
    ]
      .filter(Boolean)
      .join(" › ")
    : "Danh mục & Quốc gia";

  const handleSelectCategory = (catName) => {
    if (selectedCat === catName) {
      setSelectedCat(null);
      setSelectedRegionItem(null);
      setSelectedCountryItem(null);
    } else {
      setSelectedCat(catName);
      setSelectedRegionItem(null);
      setSelectedCountryItem(null);
    }
  };

  const handleSelectRegion = (region) => {
    if (selectedRegionItem === region) {
      setSelectedRegionItem(null);
      setSelectedCountryItem(null);
    } else {
      setSelectedRegionItem(region);
      setSelectedCountryItem(null);
    }
  };

  const handleSelectCountry = (country) => {
    if (selectedCountryItem === country) {
      setSelectedCountryItem(null);
    } else {
      setSelectedCountryItem(country);
    }
  };

  const handleApplyFilter = (catName, region, country) => {
    onSelect({
      category: catName || "Tất cả",
      region: region || "Tất cả",
      country: country || "Tất cả"
    });
    setIsOpen(false);
    setSelectedCat(null);
    setSelectedRegionItem(null);
    setSelectedCountryItem(null);
    setSearchTerm("");
  };

  const handleReset = () => {
    onSelect({ category: "Tất cả", region: "Tất cả", country: "Tất cả" });
    setIsOpen(false);
    setSelectedCat(null);
    setSelectedRegionItem(null);
    setSelectedCountryItem(null);
    setSearchTerm("");
  };

  const renderCategoryList = () => (
    <div className="p-2">
      <div className="relative mb-2">
        <input
          type="text"
          placeholder="Tìm danh mục..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full h-9 pl-8 pr-3 bg-slate-50 app-dark:bg-[#1e1e1e]! border border-slate-200 app-dark:border-slate-700! rounded-lg text-sm text-slate-700 app-dark:text-slate-200! placeholder-slate-400 app-dark:placeholder-slate-500! focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
        />
        <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      <button
        onClick={handleReset}
        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${selectedCategoryName === "Tất cả" && selectedCountry === "Tất cả" && selectedRegion === "Tất cả"
          ? "bg-cyan-50 app-dark:bg-cyan-955/35! text-cyan-700 app-dark:text-cyan-300! font-semibold"
          : "hover:bg-slate-50 app-dark:hover:bg-white/5! text-slate-600 app-dark:text-slate-300!"
          }`}
      >
        Tất cả danh mục
      </button>

      {filteredCategories.map(cat => {
        const isActive = selectedCat === cat.name;
        const count = cat.programs?.length || 0;
        return (
          <button
            key={cat.id}
            onClick={() => handleSelectCategory(cat.name)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center justify-between ${isActive ? "bg-cyan-50 app-dark:bg-cyan-955/35! text-cyan-700 app-dark:text-cyan-300! font-semibold" : "hover:bg-slate-50 app-dark:hover:bg-white/5! text-slate-600 app-dark:text-slate-300!"
              }`}
          >
            <span>{cat.name}</span>
            <div className="flex items-center gap-2">
              {count > 0 && (
                <span className="text-[10px] text-slate-400 app-dark:text-slate-500! bg-slate-100 app-dark:bg-slate-800! px-1.5 py-0.5 rounded">
                  {count}
                </span>
              )}
              <svg className={`w-4 h-4 transition-transform ${isActive ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        );
      })}
    </div>
  );

  const renderRegionList = () => {
    if (!selectedCat) return (
      <div className="p-4 text-center text-slate-400 app-dark:text-slate-500! text-sm">
        ← Chọn danh mục để xem khu vực
      </div>
    );

    if (regionsForCat.length === 0) return (
      <div className="p-4 text-center text-slate-400 app-dark:text-slate-500! text-sm">
        Chưa có khu vực
      </div>
    );

    return (
      <div className="p-2">
        <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 app-dark:text-slate-500! uppercase tracking-wider">
          Khu vực
        </div>
        <button
          onClick={() => handleSelectRegion("Tất cả khu vực")}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${selectedRegionItem === "Tất cả khu vực" ? "bg-cyan-50 app-dark:bg-cyan-955/35! text-cyan-700 app-dark:text-cyan-300! font-semibold" : "hover:bg-slate-50 app-dark:hover:bg-white/5! text-slate-600 app-dark:text-slate-300!"
            }`}
        >
          Tất cả khu vực
        </button>
        {regionsForCat.map(region => (
          <button
            key={region}
            onClick={() => handleSelectRegion(region)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${selectedRegionItem === region ? "bg-cyan-50 app-dark:bg-cyan-955/35! text-cyan-700 app-dark:text-cyan-300! font-semibold" : "hover:bg-slate-50 app-dark:hover:bg-white/5! text-slate-600 app-dark:text-slate-300!"
              }`}
          >
            {region}
          </button>
        ))}
      </div>
    );
  };

  const renderCountryList = () => {
    if (!selectedCat || !selectedRegionItem) return (
      <div className="p-4 text-center text-slate-400 app-dark:text-slate-500! text-sm">
        {!selectedCat ? "← Chọn danh mục" : "← Chọn khu vực để xem quốc gia"}
      </div>
    );

    if (countriesForSelection.length === 0) return (
      <div className="p-4 text-center text-slate-400 app-dark:text-slate-500! text-sm">
        {selectedRegionItem === "Tất cả khu vực"
          ? "Chọn khu vực cụ thể để xem quốc gia"
          : "Chưa có quốc gia"}
      </div>
    );

    return (
      <div className="p-2">
        <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 app-dark:text-slate-500! uppercase tracking-wider">
          Quốc gia
        </div>
        <button
          onClick={() => handleSelectCountry("Tất cả quốc gia")}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${selectedCountryItem === "Tất cả quốc gia" ? "bg-cyan-50 app-dark:bg-cyan-955/35! text-cyan-700 app-dark:text-cyan-300! font-semibold" : "hover:bg-slate-50 app-dark:hover:bg-white/5! text-slate-600 app-dark:text-slate-300!"
            }`}
        >
          Tất cả quốc gia
        </button>
        {countriesForSelection.map(country => (
          <button
            key={country}
            onClick={() => handleSelectCountry(country)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${selectedCountryItem === country ? "bg-cyan-50 app-dark:bg-cyan-955/35! text-cyan-700 app-dark:text-cyan-300! font-semibold" : "hover:bg-slate-50 app-dark:hover:bg-white/5! text-slate-600 app-dark:text-slate-300!"
              }`}
          >
            {resolveCountryName(country)}
          </button>
        ))}
      </div>
    );
  };

  const renderProgramList = () => {
    if (!selectedCat || !selectedRegionItem || !selectedCountryItem) return (
      <div className="p-4 text-center text-slate-400 app-dark:text-slate-500! text-sm">
        {!selectedCat ? "← Chọn danh mục" :
          !selectedRegionItem ? "← Chọn khu vực" :
            "← Chọn quốc gia để xem chương trình"}
      </div>
    );

    if (programsForSelection.length === 0) return (
      <div className="p-4 text-center text-slate-400 app-dark:text-slate-500! text-sm">
        {selectedCountryItem === "Tất cả quốc gia"
          ? "Chọn quốc gia cụ thể để xem chương trình"
          : "Chưa có chương trình"}
      </div>
    );

    return (
      <div className="p-2">
        <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 app-dark:text-slate-500! uppercase tracking-wider">
          Chương trình
        </div>
        {programsForSelection.slice(0, 10).map(prog => (
          <button
            key={prog.id}
            onClick={() => handleApplyFilter(selectedCat, selectedRegionItem, selectedCountryItem)}
            className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-cyan-50 app-dark:hover:bg-cyan-955/20! transition-all border-b border-slate-50 app-dark:border-slate-800! last:border-0"
          >
            <div className="font-medium text-slate-700 app-dark:text-slate-300!">{prog.name}</div>
            <div className="text-[10px] text-slate-400 app-dark:text-slate-500! mt-0.5">
              {prog.region} · {resolveCountryName(prog.country)}
            </div>
          </button>
        ))}
        {programsForSelection.length > 10 && (
          <button
            onClick={() => handleApplyFilter(selectedCat, selectedRegionItem, selectedCountryItem)}
            className="w-full text-center px-3 py-2 text-sm text-cyan-700 app-dark:text-cyan-400! font-semibold hover:bg-cyan-50 app-dark:hover:bg-cyan-955/20! rounded-lg transition-all mt-1"
          >
            Xem tất cả {programsForSelection.length} chương trình →
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="w-full" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full h-11 px-4 rounded-2xl border bg-white app-dark:bg-[#1e1e1e]! shadow-sm transition-all
          flex items-center justify-between
          ${isOpen
            ? "border-cyan-400 ring-2 ring-cyan-500/20"
            : "border-slate-200 app-dark:border-slate-700! hover:border-cyan-300"}
        `}
      >
        <span className={`truncate text-sm ${hasSelection ? "font-semibold text-slate-800 app-dark:text-slate-100!" : "text-slate-500"}`}>
          {displayLabel}
        </span>
        <svg
          className={`w-4 h-4 text-slate-400 app-dark:text-slate-500! transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-2 z-9999 bg-white app-dark:bg-[#252525]! rounded-2xl border border-slate-200 app-dark:border-slate-700! shadow-[0_20px_60px_rgba(0,0,0,0.12)] overflow-hidden" style={{ width: "min(860px, calc(100vw - 280px))" }}>
          <div className="flex flex-row max-h-[500px]">
            <div className="flex-1 min-w-0 border-r border-slate-100 app-dark:border-slate-700! overflow-y-auto">
              {renderCategoryList()}
            </div>
            <div className="flex-1 min-w-0 border-r border-slate-100 app-dark:border-slate-700! bg-slate-50/30 app-dark:bg-white/3! overflow-y-auto">
              {renderRegionList()}
            </div>
            <div className="flex-1 min-w-0 border-r border-slate-100 app-dark:border-slate-700! bg-slate-50/20 app-dark:bg-white/2! overflow-y-auto">
              {renderCountryList()}
            </div>
            <div className="flex-1 min-w-0 bg-white app-dark:bg-transparent! overflow-y-auto">
              {renderProgramList()}
            </div>
          </div>

          {selectedCat && selectedRegionItem && selectedCountryItem && programsForSelection.length > 0 && (
            <div className="border-t border-slate-100 app-dark:border-slate-700! p-3 bg-slate-50 app-dark:bg-slate-900!">
              <button
                onClick={() => handleApplyFilter(selectedCat, selectedRegionItem, selectedCountryItem)}
                className="w-full bg-cyan-900 hover:bg-cyan-950 text-white text-sm font-semibold py-2 rounded-xl transition-colors"
              >
                Áp dụng bộ lọc
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ==========================================
// MAIN COMPONENT
// ==========================================
function ProductOverviewPageInner({ currentUser }) {
  const toast = useToast();
  const userRole = getUserRoleKey(currentUser);
  const canManageProducts = ["admin", "bangiamdoc", "truongbophan"].includes(userRole);

  // Confirm modal state
  const [confirmModal, setConfirmModal] = useState({ isOpen: false });

  const showConfirm = useCallback(({ title, message, confirmLabel, cancelLabel, variant, onConfirm }) => {
    setConfirmModal({ isOpen: true, title, message, confirmLabel, cancelLabel, variant, onConfirm });
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirmModal({ isOpen: false });
  }, []);

  const [categories, setCategories] = useState(MOCK_CATEGORIES);
  const [loading] = useState(false);
  const [, setError] = useState("");
  const [apiMode, setApiMode] = useState("mock");

  // Đọc sản phẩm được Sidebar chọn từ sessionStorage (nếu có)
  const [pendingSidebarProduct] = useState(() => {
    try {
      const raw = sessionStorage.getItem("hto_selected_product");
      if (raw) {
        sessionStorage.removeItem("hto_selected_product");
        return JSON.parse(raw);
      }
    } catch {
      // bỏ qua
    }
    return null;
  });

  const [viewMode, setViewMode] = useState(() => pendingSidebarProduct ? "detail" : "overview");
  const [selectedProduct, setSelectedProduct] = useState(() => pendingSidebarProduct);

  const resolvedProduct = useMemo(() => {
    if (!selectedProduct) return null;

    const info = {
      ...selectedProduct,
      name: selectedProduct.name || "",
      serviceFee: selectedProduct.serviceFee || 0,
      shortCode: selectedProduct.shortCode || "",
      visaCode: selectedProduct.visaCode || "",
      purpose: selectedProduct.purpose || "",
      currency: selectedProduct.currency || "VND"
    };

    // 1. Trích xuất mã visa từ tên sản phẩm nếu có định dạng "Tên - VisaCode"
    let nameVisaCode = "";
    if (info.name.includes(" - ")) {
      const parts = info.name.split(" - ");
      nameVisaCode = parts[parts.length - 1].trim().toLowerCase();
    }

    // 2. Tìm kiếm trong danh sách EXCEL_PRODUCTS
    let match = EXCEL_PRODUCTS.find(p => {
      if (p.visaCode && info.visaCode && p.visaCode.toLowerCase() === info.visaCode.toLowerCase()) return true;
      if (p.visaCode && nameVisaCode && p.visaCode.toLowerCase() === nameVisaCode) return true;
      if (p.shortCode && info.shortCode && p.shortCode.toLowerCase() === info.shortCode.toLowerCase()) return true;
      if (p.name && info.name && p.name.trim().toLowerCase() === info.name.trim().toLowerCase()) return true;
      if (p.visaCode && info.name && info.name.toLowerCase().includes(p.visaCode.toLowerCase())) return true;
      return false;
    });

    // 2.5. Nếu không tìm thấy khớp trực tiếp, đối chiếu dự phòng theo Quốc gia và phân loại Du học / Visa
    if (!match) {
      const c = (info.country || "").trim().toUpperCase();
      const isStudy = info.name.toLowerCase().includes("du học") || 
                      info.name.toLowerCase().includes("học") || 
                      info.name.toLowerCase().includes("school") || 
                      info.name.toLowerCase().includes("college") || 
                      info.name.toLowerCase().includes("trại hè") || 
                      info.name.toLowerCase().includes("camp") || 
                      info.name.toLowerCase().includes("study");
                      
      // Map quốc gia code/tên về visaCode chuẩn
      let fallbackVisaCode = "";
      if (["CA", "CANADA"].includes(c)) {
        fallbackVisaCode = isStudy ? "CA-STUDY-PERMIT-REGULAR" : "CA-TRV-TOUR-SGL";
      } else if (["US", "USA", "MỸ"].includes(c)) {
        fallbackVisaCode = isStudy ? "US-STUDY-F1-ACADEMIC" : "US-B1B2-TOUR-BIZ";
      } else if (["AU", "ÚC", "AUSTRALIA"].includes(c)) {
        fallbackVisaCode = isStudy ? "AU-STUDY-SUBCLASS500" : "AU-600-TOUR-VISIT";
      } else if (["UK", "ANH QUỐC", "ANH"].includes(c)) {
        fallbackVisaCode = isStudy ? "UK-STUDY-STUDENT" : "UK-STANDARD-VISITOR-6M";
      } else if (["DE", "ĐỨC", "GERMANY"].includes(c)) {
        fallbackVisaCode = isStudy ? "DE-STUDY-VET-BERUF" : "";
      } else if (["KR", "HÀN QUỐC", "HÀN", "KOREA"].includes(c)) {
        fallbackVisaCode = isStudy ? "KR-STUDY-LANG-D41" : "KR-C31-TOUR-SGL-3M-SOUTH";
      } else if (["JP", "NHẬT BẢN", "NHẬT", "JAPAN"].includes(c)) {
        fallbackVisaCode = isStudy ? "JP-STUDY-STUDENT-COE" : "JP-TOUR-SGL";
      } else if (["TW", "ĐÀI LOAN", "TAIWAN"].includes(c)) {
        fallbackVisaCode = isStudy ? "TW-STUDY-RESIDENT" : "TW-TOUR-STANDARD-5D";
      } else if (["CN", "TRUNG QUỐC", "CHINA"].includes(c)) {
        fallbackVisaCode = isStudy ? "CN-STUDY-X1-LONG" : "CN-TOUR-BIZ-SGL";
      } else if (["NZ", "NEW ZEALAND"].includes(c)) {
        fallbackVisaCode = isStudy ? "NZ-STUDY-FEE-PAYING" : "NZ-VISITOR-TOUR";
      } else if (["SCH", "SCHENGEN", "KHỐI SCHENGEN"].includes(c)) {
        fallbackVisaCode = isStudy ? "SCH-STUDY-LONG-D" : "SCH-TOUR-SGL";
      }

      if (fallbackVisaCode) {
        match = EXCEL_PRODUCTS.find(p => p.visaCode === fallbackVisaCode);
      }
    }

    if (match) {
      if (!info.visaCode) info.visaCode = match.visaCode;
      if (!info.shortCode) info.shortCode = match.shortCode;
      if (!info.purpose) info.purpose = match.purpose;
      if (info.serviceFee === 0 && match.serviceFee > 0) {
        info.serviceFee = match.serviceFee;
      }
    }

    // 3. Dự phòng bảng giá khác
    const PRODUCT_PRICES = {
      'd41': 85000000,
      'd22': 85000000,
      'd26': 150000000,
      'vhvl + 1 + 4': 45000000,
      'intense': 45000000,
      'intership (6 tháng)': 40500000,
      'intership (1 năm)': 45900000,
      'du học nghề': 220000000,
      'dhn học tiếng': 360000000
    };

    const cleanName = info.name.trim().toLowerCase();
    const knownShortCodes = ['d41', 'd22', 'd26', 'vhvl + 1 + 4', 'intense', 'intership (6 tháng)', 'intership (1 năm)', 'du học nghề', 'dhn học tiếng'];
    const isNameAShortCode = knownShortCodes.includes(cleanName);

    if (info.serviceFee === 0) {
      if (PRODUCT_PRICES[cleanName]) {
        info.serviceFee = PRODUCT_PRICES[cleanName];
      } else if (nameVisaCode && PRODUCT_PRICES[nameVisaCode]) {
        info.serviceFee = PRODUCT_PRICES[nameVisaCode];
      }
    }

    if (!info.visaCode) {
      if (nameVisaCode) {
        info.visaCode = nameVisaCode.toUpperCase();
      } else if (isNameAShortCode) {
        info.visaCode = info.name.toUpperCase();
      }
    }

    if (!info.shortCode) {
      if (isNameAShortCode) {
        info.shortCode = info.name.toUpperCase();
      } else if (nameVisaCode) {
        const prefix = nameVisaCode.split("-")[0] || "";
        info.shortCode = prefix ? `VIS-${prefix.toUpperCase()}` : nameVisaCode.toUpperCase();
      }
    }

    if (!info.purpose) {
      if (info.name.toLowerCase().includes("du học")) {
        info.purpose = "Du học";
      } else if (info.name.toLowerCase().includes("định cư")) {
        info.purpose = "Định cư";
      } else if (info.name.toLowerCase().includes("visa")) {
        info.purpose = "Visa";
      } else {
        info.purpose = "Tư vấn tổng hợp";
      }
    }

    return info;
  }, [selectedProduct]);



  // Danh mục Sidebar đã chọn (nếu có), đọc một lần duy nhất lúc khởi tạo component
  const [pendingSidebarCategory] = useState(() => readPendingSidebarCategory());

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryName, setSelectedCategoryName] = useState(() => pendingSidebarCategory?.name || "Tất cả");
  const [selectedCountry, setSelectedCountry] = useState(() => pendingSidebarCategory?.country || "Tất cả");
  const [selectedRegion, setSelectedRegion] = useState(() => pendingSidebarCategory?.region || "Tất cả");
  const [selectedStatus, setSelectedStatus] = useState("all");
    const [selectedVisaType, setSelectedVisaType] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({});

  const [editingCategory, setEditingCategory] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingProductParentCatId, setEditingProductParentCatId] = useState("");
  const [showInterestModal, setShowInterestModal] = useState(false);

  const [interestCccdFrontFile, setInterestCccdFrontFile] = useState(null);
  const [interestCccdBackFile, setInterestCccdBackFile] = useState(null);
  const [interestCccdFrontPreview, setInterestCccdFrontPreview] = useState("");
  const [interestCccdBackPreview, setInterestCccdBackPreview] = useState("");
  const [interestInvalidFields, setInterestInvalidFields] = useState([]);

  const [activeCategoryTab, setActiveCategoryTab] = useState("info");
  const [activeProductTab, setActiveProductTab] = useState("basic");

  const [brochureLinkInput, setBrochureLinkInput] = useState("");
  const [docLinkNameInput, setDocLinkNameInput] = useState("");
  const [docLinkUrlInput, setDocLinkUrlInput] = useState("");
  const [docLinkTypeInput, setDocLinkTypeInput] = useState("Checklist");

  const [isBrochureDragging, setIsBrochureDragging] = useState(false);
  const [isDocsDragging, setIsDocsDragging] = useState(false);

  const [formCategory, setFormCategory] = useState({
    id: "",
    name: "",
    description: "",
    status: "active",
    coverImageUrl: "",
    programs: []
  });

  const [formProduct, setFormProduct] = useState({
    id: "",
    name: "",
    categoryId: "",
    categoryName: "",
    country: "",
    region: "Châu Á",
    status: "active",
    description: "",
    detailDescription: "",
    targetAudience: "",
    highlightsText: "",
    processStepsText: "",
    tagsText: "",
    websiteUrl: "",
    serviceFee: 0,
    currency: "VND",
    image: "",
    brochure: null,
    documents: [],
    updatedAt: "",
    gradientFrom: "#0d2040",
    gradientTo: "#1a3a6b",
    visaCode: "",
    shortCode: "",
    purpose: ""
  });

  const [interestForm, setInterestForm] = useState({
    customerName: "",
    phone: "",
    email: "",
    note: "",
    sourceChannel: "CTV/Đại lý"
  });

  const [isSubmittingInterest, setIsSubmittingInterest] = useState(false);
  const [showContractPreview, setShowContractPreview] = useState(false);
  const [contractType, setContractType] = useState("main");

  const currentUserName = useMemo(() => {
    try {
      const stored = JSON.parse(window.localStorage.getItem("auth_user") || "null");
      return currentUser?.fullName || currentUser?.name || stored?.fullName || stored?.name || currentUser?.username || stored?.username || "CTV/Đại lý HTO";
    } catch {
      return currentUser?.name || currentUser?.username || "CTV/Đại lý HTO";
    }
  }, [currentUser]);



  // Status options matching backend enum
  const statusOptions = useMemo(() => [
    { label: "Tất cả", value: "all" },
    { label: "Đang hoạt động", value: "active" },
    { label: "Sắp mở", value: "coming_soon" },
    { label: "Tạm ngưng", value: "inactive" },
    { label: "Đã ẩn", value: "hidden" }
  ], []);

  // Load dữ liệu từ API - VẪN GỌI NHƯNG KHÔNG ẢNH HƯỞNG NẾU LỖI
  useEffect(() => {
    const normalizeArray = (p) => {
      if (!p) return [];
      if (Array.isArray(p)) return p;
      if (p.success && Array.isArray(p.data)) return p.data;
      if (Array.isArray(p.items)) return p.items;
      if (Array.isArray(p.categories)) return p.categories;
      if (Array.isArray(p.products)) return p.products;
      return [];
    };

    const fetchData = async () => {
      setError("");
      try {
        const catsPayload = await apiRequest(`${API_BASE_URL}/product-categories`);
        const apiCats = normalizeArray(catsPayload);

        if (apiCats.length === 0) {
          console.warn("[API] Không có dữ liệu từ API, giữ mock data");
          setApiMode("mock");
          return;
        }

        const catMap = {};
        apiCats.forEach(rawCat => {
          const id = rawCat._id?.$oid || rawCat._id || rawCat.id || "";
          const name = rawCat.name || "";
          const rawCoverUrl = rawCat.coverImageUrl || rawCat.imageUrl || rawCat.image || "";
          catMap[id] = {
            id,
            name,
            description: rawCat.description || "",
            status: rawCat.status || "active",
            updatedAt: rawCat.updatedAt || "",
            coverImageUrl: rawCoverUrl && !rawCoverUrl.startsWith("http") && !rawCoverUrl.startsWith("data:")
              ? `${STATIC_BASE_URL}/${rawCoverUrl.replace(/^\//, "")}`
              : rawCoverUrl,
            programs: []
          };
        });

        const categoryIds = Object.keys(catMap);
        const productFetches = categoryIds.map(catId =>
          apiRequest(`${API_BASE_URL}/products?categoryId=${catId}`)
            .then(payload => ({ catId, products: normalizeArray(payload) }))
            .catch(() => ({ catId, products: [] }))
        );

        const productResults = await Promise.all(productFetches);

        productResults.forEach(({ catId, products }) => {
          const catEntry = catMap[catId];
          if (!catEntry) return;
          products.forEach(p => {
            const mapped = mapApiProductToUiProduct(p, catId, catEntry.name);
            if (mapped) {
              catEntry.programs.push(mapped);
            }
          });
        });

        // Di chuyển "Dịch vụ Visa Nhật Bản" từ danh mục "Dịch vụ" sang "Visa"
        const dichVuEntry = Object.values(catMap).find(c => c.name.toLowerCase() === "dịch vụ" || c.name.toLowerCase() === "dich vu");
        const visaEntry = Object.values(catMap).find(c => c.name.toLowerCase() === "visa");

        if (dichVuEntry && visaEntry) {
          const visaJapanProds = (dichVuEntry.programs || []).filter(p => {
            const nameLower = (p.name || "").toLowerCase();
            const countryLower = (p.country || "").trim().toLowerCase();
            const isJapan = countryLower === "nhật bản" || countryLower === "jp" || countryLower === "nhật";
            return nameLower.includes("visa") && isJapan;
          });

          if (visaJapanProds.length > 0) {
            // Cập nhật categoryId và categoryName cho các sản phẩm di chuyển
            visaJapanProds.forEach(p => {
              p.categoryId = visaEntry.id;
              p.categoryName = visaEntry.name;
            });

            // Xóa khỏi Dịch vụ
            dichVuEntry.programs = (dichVuEntry.programs || []).filter(p => !visaJapanProds.includes(p));

            // Thêm vào Visa
            visaEntry.programs = [...(visaEntry.programs || []), ...visaJapanProds];
          }
        }

        const result = categoryIds
          .map(id => catMap[id])
          .filter(cat => {
            if (!cat) return false;
            // Ẩn danh mục "Dịch vụ" nếu nó rỗng sau khi chuyển sản phẩm
            if ((cat.name.toLowerCase() === "dịch vụ" || cat.name.toLowerCase() === "dich vu") && cat.programs.length === 0) {
              return false;
            }
            return true;
          });

        if (result.length > 0) {
          setCategories(result);
          setApiMode("api");
        } else {
          console.warn("[API] Không có dữ liệu, giữ mock data");
        }
      } catch (err) {
        console.warn("[API] Lỗi kết nối, giữ mock data:", err.message);
      }
    };

    fetchData();
  }, []);

  // Lắng nghe khi Sidebar chọn danh mục khác trong lúc trang này đã mount sẵn
  useEffect(() => {
    const handleSidebarCategorySelect = (event) => {
      const detail = event?.detail || {};
      setViewMode("overview");
      setSelectedProduct(null);
      setSelectedCategoryName(detail.name || "Tất cả");
      setSelectedCountry(detail.country || "Tất cả");
      setSelectedRegion(detail.region || "Tất cả");
            setSelectedVisaType(null);
      if (detail.id) {
        setExpandedCategories(prev => ({ ...prev, [detail.id]: true }));
      }
    };

    window.addEventListener(SIDEBAR_CATEGORY_EVENT, handleSidebarCategorySelect);
    return () => window.removeEventListener(SIDEBAR_CATEGORY_EVENT, handleSidebarCategorySelect);
  }, []);

  // Đồng bộ ngược từ Page sang Sidebar khi chọn bộ lọc trên trang
  useEffect(() => {
    const cat = categories.find(c => c && c.name === selectedCategoryName);
    const detail = {
      id: cat?.id || null,
      name: selectedCategoryName,
      country: selectedCountry,
      region: selectedRegion,
      fromSidebar: false
    };
    window.dispatchEvent(new CustomEvent(SIDEBAR_CATEGORY_EVENT, { detail }));
  }, [selectedCategoryName, selectedCountry, selectedRegion, categories]);

  // Lắng nghe khi Sidebar chọn sản phẩm con cụ thể (trong lúc trang này đã mount sẵn)
  useEffect(() => {
    const handleSidebarProductSelect = (event) => {
      const detail = event?.detail || {};
      if (detail.product) {
        let foundProduct = null;
        for (const cat of categories) {
          const progs = cat.programs || cat.products || [];
          const found = progs.find(p => String(p.id) === String(detail.product.id || detail.product._id));
          if (found) {
            foundProduct = found;
            break;
          }
        }
        const prodToSelect = foundProduct || detail.product;
        setSelectedProduct(prodToSelect);
        setViewMode("detail");

        if (prodToSelect.categoryName) {
          setSelectedCategoryName(prodToSelect.categoryName);
        } else if (prodToSelect.categoryId) {
          const cat = categories.find(c => c.id === prodToSelect.categoryId);
          if (cat) setSelectedCategoryName(cat.name);
        }
      }
    };

    window.addEventListener("hto:select-product", handleSidebarProductSelect);
    return () => window.removeEventListener("hto:select-product", handleSidebarProductSelect);
  }, [categories]);

  // Cập nhật selectedProduct hoàn chỉnh sau khi dữ liệu categories/products được đồng bộ từ API/Mock
  const selectedProductRef = useRef(selectedProduct);
  useEffect(() => { selectedProductRef.current = selectedProduct; }, [selectedProduct]);

  useEffect(() => {
    const current = selectedProductRef.current;
    if (!current) return;
    if (current.highlights && current.highlights.length > 0) return;
    let foundProduct = null;
    for (const cat of categories) {
      const progs = cat.programs || cat.products || [];
      const found = progs.find(p => String(p.id) === String(current.id || current._id));
      if (found) { foundProduct = found; break; }
    }
    if (foundProduct && foundProduct.highlights?.length > 0) {
      const t = setTimeout(() => setSelectedProduct(foundProduct), 0);
      return () => clearTimeout(t);
    }
  }, [categories]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCategoryName("Tất cả");
    setSelectedCountry("Tất cả");
    setSelectedRegion("Tất cả");
    setSelectedStatus("all");
    setSelectedVisaType(null);
    setLeftCategoryPage(0);
  };

  const LEFT_CATEGORIES_PER_PAGE = 2;
  const [leftCategoryPage, setLeftCategoryPage] = useState(0);

  const handleGoBack = () => {
    setSelectedProduct(null);
    setViewMode("overview");
  };

  useEffect(() => {
    setLeftCategoryPage(0);
  }, [searchQuery, selectedCategoryName, selectedCountry, selectedRegion, selectedStatus]);

  const filteredCategories = useMemo(() => {
    const q = safeText(searchQuery);
    const hasFilter = q || selectedCountry !== "Tất cả" || selectedStatus !== "all" || selectedRegion !== "Tất cả";

    return safeArray(categories)
      .map(cat => {
        if (!cat) return null;

        if (selectedCategoryName !== "Tất cả" && safeText(cat.name) !== safeText(selectedCategoryName)) {
          return null;
        }

        const progs = safeArray(cat.programs || cat.products);

        const filteredProgs = progs.filter(prog => {
          if (!prog) return false;

          if (!canManageProducts) {
            if (prog.status === "hidden" || prog.isActive === false) return false;
          }

          const matchSearch =
            !q ||
            safeText(prog.name).includes(q) ||
            safeText(prog.country).includes(q) ||
            safeText(prog.description).includes(q) ||
            safeArray(prog.tags).some(t => safeText(t).includes(q));

          const matchCountry =
            selectedCountry === "Tất cả" ||
            safeText(prog.country) === safeText(selectedCountry);

          const matchStatus =
            selectedStatus === "all" ||
            safeText(prog.status) === safeText(selectedStatus);

          const matchRegion =
            selectedRegion === "Tất cả" ||
            safeText(prog.region) === safeText(selectedRegion);

          return matchSearch && matchCountry && matchStatus && matchRegion;
        });

        if (hasFilter) {
          const isCatNameMatch =
            q &&
            selectedCountry === "Tất cả" &&
            selectedStatus === "all" &&
            selectedRegion === "Tất cả" &&
            (safeText(cat.name).includes(q) || safeText(cat.description).includes(q));

          if (filteredProgs.length === 0 && !isCatNameMatch) return null;
        }

        return { ...cat, filteredPrograms: filteredProgs };
      })
      .filter(Boolean);
  }, [categories, searchQuery, selectedCategoryName, selectedCountry, selectedRegion, selectedStatus, canManageProducts]);

  const stats = useMemo(() => {
    let totalChildren = 0;
    let activeChildren = 0;
    let docsCount = 0;

    safeArray(categories).forEach(c => {
      if (!c) return;
      const progs = safeArray(c.programs || c.products);
      totalChildren += progs.length;
      progs.forEach(p => {
        if (!p) return;
        if (p.status === "active") activeChildren++;
        if (p.brochure) docsCount++;
        docsCount += safeArray(p.documents).length;
      });
    });

    return {
      totalCategories: safeArray(categories).length,
      totalPrograms: totalChildren,
      activePrograms: activeChildren,
      totalDocuments: docsCount,
      hiddenCategories: safeArray(categories).filter(c => c && (c.status === "hidden" || c.status === "inactive")).length
    };
  }, [categories]);

  const isValidUrl = (url) => {
    const trimmed = url.trim();
    if (!trimmed) return false;
    return trimmed.includes(".") && trimmed.length > 3;
  };

  const normalizeUrl = (url) => {
    if (!url) return "";
    let target = url.trim();
    if (!/^https?:\/\//i.test(target)) {
      target = "https://" + target;
    }
    return target;
  };

  const handleOpenWebsite = (url) => {
    if (!url) return;
    const finalUrl = normalizeUrl(url);
    window.open(finalUrl, "_blank", "noopener,noreferrer");
  };

  const handleDownloadDoc = (name) => {
    toast.info(`Đang tải tài liệu: ${name}`);
  };

  const cleanupInterestCccdPreviews = () => {
    if (interestCccdFrontPreview) URL.revokeObjectURL(interestCccdFrontPreview);
    if (interestCccdBackPreview) URL.revokeObjectURL(interestCccdBackPreview);
    setInterestCccdFrontPreview("");
    setInterestCccdBackPreview("");
    setInterestCccdFrontFile(null);
    setInterestCccdBackFile(null);
    setInterestInvalidFields([]);
  };

  const handleOpenInterestModal = () => {
    cleanupInterestCccdPreviews();
    setInterestForm({
      customerName: "",
      phone: "",
      email: "",
      note: "",
      sourceChannel: "CTV/Đại lý"
    });
    setShowInterestModal(true);
  };

  const handleCloseInterestModal = () => {
    cleanupInterestCccdPreviews();
    setShowInterestModal(false);
  };

  const handleSubmitInterest = async (e) => {
    e.preventDefault();

    const invalidFields = [];
    if (!interestForm.customerName.trim()) invalidFields.push("customerName");
    if (!interestForm.phone.trim()) invalidFields.push("phone");
    if (!interestCccdFrontFile) invalidFields.push("cccdFront");
    if (!interestCccdBackFile) invalidFields.push("cccdBack");

    setInterestInvalidFields(invalidFields);

    if (invalidFields.length > 0) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc và tải lên cả hai mặt của CCCD khách hàng.", "Thiếu thông tin");
      return;
    }

    const duplicateGuard = beginLeadSubmission(interestForm.phone);
    if (!duplicateGuard.allowed) {
      toast.error(duplicateGuard.message, "Thông tin đã gửi");
      return;
    }

    setIsSubmittingInterest(true);

    const payload = new FormData();
    payload.append("customerName", interestForm.customerName.trim());
    payload.append("phone", normalizeLeadPhone(interestForm.phone));
    payload.append("email", interestForm.email ? interestForm.email.trim() : "");
    payload.append("source", interestForm.sourceChannel || "CTV/Đại lý");
    payload.append("productInterest", selectedProduct?.name || "Sản phẩm quan tâm");
    payload.append("countryInterest", resolveCountryName(selectedProduct?.country) || "Đức");
    payload.append("note", interestForm.note ? interestForm.note.trim() : "");
    payload.append("status", "xu_ly_ho_so");
    const referralCode = getReferralCode();
    if (referralCode) {
      payload.append("referralCode", referralCode);
    }
    payload.append("cccdFront", interestCccdFrontFile);
    payload.append("cccdBack", interestCccdBackFile);

    try {
      const response = await apiRequest(`${API_BASE_URL}/leads`, {
        method: "POST",
        body: payload
      });

      const successCode = response?.data?.bizflyContactId || response?.bizflyContactId || response?.data?._id || response?._id || `HTO-${Date.now().toString().slice(-6)}`;
      toast.success(
        `Đã đăng ký thành công cho khách hàng ${interestForm.customerName}. Deal đã vào đối soát. Mã liên hệ: ${successCode}`,
        "Gửi liên hệ thành công"
      );
      finishLeadSubmission(interestForm.phone, true);
      handleCloseInterestModal();
    } catch (err) {
      toast.error(err.message || "Gửi liên hệ tư vấn thất bại. Vui lòng thử lại sau.", "Lỗi gửi liên hệ");
      finishLeadSubmission(interestForm.phone, false);
    } finally {
      setIsSubmittingInterest(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 500 * 1024) {
      toast.warning("Ảnh quá lớn! Vui lòng chọn ảnh nhỏ hơn 500KB", "File quá lớn");
      e.target.value = '';
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.warning("Vui lòng chọn file ảnh (JPG, PNG, WEBP, GIF)", "Định dạng không hỗ trợ");
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target.result;
      setFormCategory(prev => ({ ...prev, coverImageUrl: base64String }));
      toast.success("Đã chọn ảnh thành công!", "Upload ảnh");
    };
    reader.onerror = () => {
      toast.error("Không thể đọc file", "Lỗi");
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setFormCategory(prev => ({ ...prev, coverImageUrl: '' }));
    toast.info("Đã xóa ảnh", "Xóa ảnh");
  };

  const handleOpenNewCategory = () => {
    if (!canManageProducts) return;
    setFormCategory({
      id: "new",
      name: "",
      description: "",
      status: "active",
      coverImageUrl: "",
      programs: []
    });
    setActiveCategoryTab("info");
    setEditingCategory("new");
  };

  const handleEditCategory = (cat) => {
    if (!canManageProducts) return;
    setFormCategory({
      id: cat.id,
      name: cat.name,
      description: cat.description || "",
      status: cat.status || "active",
      coverImageUrl: cat.coverImageUrl || "",
      programs: cat.programs || []
    });
    setActiveCategoryTab("info");
    setEditingCategory(cat.id);
  };

  const handleToggleCategoryStatus = async (catId, currentStatus) => {
    if (!canManageProducts) return;

    let newStatus;
    if (currentStatus === "active") {
      newStatus = "inactive";
    } else if (currentStatus === "inactive") {
      newStatus = "active";
    } else if (currentStatus === "coming_soon") {
      newStatus = "hidden";
    } else if (currentStatus === "hidden") {
      newStatus = "active";
    } else {
      newStatus = "active";
    }

    const statusTextMap = {
      active: "hiện",
      inactive: "tạm ngưng",
      coming_soon: "sắp mở",
      hidden: "ẩn"
    };
    const statusText = statusTextMap[newStatus] || "thay đổi trạng thái";

    showConfirm({
      title: "Thay đổi trạng thái danh mục",
      message: `Bạn có chắc chắn muốn chuyển danh mục sang trạng thái "${statusText}" không?`,
      confirmLabel: "Xác nhận",
      variant: "warning",
      onConfirm: async () => {
        closeConfirm();
        try {
          const catToUpdate = categories.find(cat => cat.id === catId);
          if (!catToUpdate) return;
          if (apiMode === "api") {
            await apiRequest(`${API_BASE_URL}/product-categories/${catId}`, {
              method: "PATCH",
              body: JSON.stringify({
                name: catToUpdate.name,
                description: catToUpdate.description || "",
                status: newStatus
              })
            });
          }
          const updated = categories.map(cat =>
            cat.id === catId ? { ...cat, status: newStatus } : cat
          );
          setCategories(updated);
          toast.success(`Đã chuyển sang trạng thái ${statusText}`, "Cập nhật trạng thái");
        } catch (err) {
          toast.error(err.message, "Lỗi cập nhật trạng thái");
        }
      }
    });
  };

  const handleDeleteCategory = async (catId) => {
    if (!canManageProducts) return;
    showConfirm({
      title: "Xóa danh mục",
      message: "Bạn có chắc chắn muốn xóa danh mục này không? Thao tác này không thể hoàn tác.",
      confirmLabel: "Xóa danh mục",
      variant: "danger",
      onConfirm: async () => {
        closeConfirm();
        try {
          if (apiMode === "api") {
            await apiRequest(`${API_BASE_URL}/product-categories/${catId}`, { method: "DELETE" });
          }
          const updated = categories.filter(cat => cat.id !== catId);
          setCategories(updated);
          setEditingCategory(null);
          toast.success("Danh mục đã được xóa thành công", "Xóa thành công");
        } catch (err) {
          toast.error(err.message, "Lỗi khi xóa danh mục");
        }
      }
    });
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!canManageProducts) return;
    if (!formCategory.name.trim()) {
      toast.warning("Tên danh mục không được để trống!", "Thiếu thông tin");
      return;
    }
    try {
      const payload = {
        name: formCategory.name,
        description: formCategory.description || '',
        status: formCategory.status,
        coverImageUrl: formCategory.coverImageUrl || '',
      };

      const url = editingCategory === "new"
        ? `${API_BASE_URL}/product-categories`
        : `${API_BASE_URL}/product-categories/${editingCategory}`;

      const response = await apiRequest(url, {
        method: editingCategory === "new" ? "POST" : "PATCH",
        body: JSON.stringify(payload),
      });

      const savedCategory = response?.data || response;
      const localCoverUrl = formCategory.coverImageUrl || '';
      const mapped = mapApiCategoryToUiCategory({
        ...savedCategory,
        coverImageUrl: savedCategory?.coverImageUrl || localCoverUrl,
        image: savedCategory?.image || localCoverUrl,
      });

      if (editingCategory === "new") {
        setCategories(prev => [...prev, mapped]);
      } else {
        setCategories(prev => prev.map(cat => {
          if (cat.id !== editingCategory) return cat;
          return { ...cat, ...mapped, programs: cat.programs || [] };
        }));
      }

      setApiMode("api");
      setEditingCategory(null);
      toast.success(editingCategory === "new" ? "Danh mục mới đã được thêm thành công" : "Danh mục đã được cập nhật", "Lưu thành công");
    } catch (err) {
      toast.error(err.message, "Lỗi khi lưu danh mục");
    }
  };

  // ==========================================
  // CRUD: PRODUCT ACTIONS
  // ==========================================
  const handleOpenNewProduct = (catId) => {
    if (!canManageProducts) return;
    setEditingProductParentCatId(catId);
    setFormProduct({
      id: "new",
      name: "",
      categoryId: catId,
      country: "",
      region: "Châu Á",
      status: "active",
      description: "",
      detailDescription: "",
      targetAudience: "",
      highlightsText: "",
      processStepsText: "",
      tagsText: "",
      websiteUrl: "",
      serviceFee: 0,
      currency: "VND",
      image: "",
      brochure: null,
      documents: [],
      visaCode: "",
      shortCode: "",
      purpose: ""
    });
    setBrochureLinkInput("");
    setDocLinkNameInput("");
    setDocLinkUrlInput("");
    setDocLinkTypeInput("Checklist");
    setActiveProductTab("basic");
    setEditingProduct("new");
  };

  const handleEditProduct = (prod) => {
    if (!canManageProducts) return;

    setEditingProductParentCatId(prod.categoryId);
    setFormProduct({
      id: prod.id,
      name: prod.name,
      categoryId: prod.categoryId,
      categoryName: prod.categoryName,
      country: prod.country,
      region: prod.region || "Châu Á",
      status: prod.status || "active",
      description: prod.description || "",
      detailDescription: prod.detailDescription || "",
      targetAudience: prod.targetAudience || "",
      highlightsText: (prod.highlights || []).join("\n"),
      processStepsText: (prod.processSteps || []).join("\n"),
      tagsText: (prod.tags || []).join(", "),
      websiteUrl: prod.websiteUrl || "",
      serviceFee: prod.serviceFee || 0,
      currency: prod.currency || "VND",
      image: prod.image || "",
      brochure: prod.brochure || null,
      documents: prod.documents || [],
      gradientFrom: prod.gradientFrom || "#0d2040",
      gradientTo: prod.gradientTo || "#1a3a6b",
      visaCode: prod.visaCode || "",
      shortCode: prod.shortCode || "",
      purpose: prod.purpose || ""
    });
    setBrochureLinkInput("");
    setDocLinkNameInput("");
    setDocLinkUrlInput("");
    setDocLinkTypeInput("Checklist");
    setActiveProductTab("basic");
    setEditingProduct(prod.id);
  };

  const handleDeleteProduct = async (prodId) => {
    if (!canManageProducts) return;
    showConfirm({
      title: "Xóa sản phẩm",
      message: "Bạn có chắc chắn muốn xóa sản phẩm này không? Thao tác này không thể hoàn tác.",
      confirmLabel: "Xóa sản phẩm",
      variant: "danger",
      onConfirm: async () => {
        closeConfirm();
        try {
          if (apiMode === "api") {
            await apiRequest(`${API_BASE_URL}/products/${prodId}`, { method: "DELETE" });
          }
          const updated = categories.map(cat => ({
            ...cat,
            programs: (cat.programs || []).filter(p => p.id !== prodId)
          }));
          setCategories(updated);
          if (selectedProduct?.id === prodId) {
            setSelectedProduct(null);
            setViewMode("overview");
          }
          setFormCategory(prev => ({
            ...prev,
            programs: (prev.programs || []).filter(p => p.id !== prodId)
          }));
          toast.success("Sản phẩm đã được xóa thành công", "Xóa thành công");
        } catch (err) {
          toast.error(err.message, "Lỗi khi xóa sản phẩm");
        }
      }
    });
  };

  const handleToggleProductStatus = async (prod) => {
    if (!canManageProducts) return;
    const isCurrentlyHidden = prod.status === "hidden" || prod.isActive === false;
    const newStatus = isCurrentlyHidden ? "active" : "hidden";
    const label = isCurrentlyHidden ? "hiện" : "ẩn";
    showConfirm({
      title: isCurrentlyHidden ? "Hiện sản phẩm" : "Ẩn sản phẩm",
      message: `Bạn có chắc chắn muốn ${label} sản phẩm "${prod.name}" không?`,
      confirmLabel: "Xác nhận",
      variant: "warning",
      onConfirm: async () => {
        closeConfirm();
        try {
          if (apiMode === "api") {
            await apiRequest(`${API_BASE_URL}/products/${prod.id}`, {
              method: "PATCH",
              body: JSON.stringify({ isActive: newStatus !== "hidden", status: newStatus })
            });
          }
          const updated = categories.map(cat => ({
            ...cat,
            programs: (cat.programs || []).map(p =>
              p.id === prod.id ? { ...p, status: newStatus, isActive: newStatus !== "hidden" } : p
            )
          }));
          setCategories(updated);
          const updatedCat = updated.find(c => c.id === (prod.categoryId || editingProductParentCatId));
          if (updatedCat) setFormCategory(prev => ({ ...prev, programs: updatedCat.programs || [] }));
          toast.success(`Đã ${label} sản phẩm thành công`, "Cập nhật trạng thái");
        } catch (err) {
          toast.error(err.message, "Lỗi cập nhật trạng thái");
        }
      }
    });
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!canManageProducts) return;

    if (!formProduct.name.trim()) {
      toast.warning("Tên sản phẩm không được để trống!", "Thiếu thông tin");
      return;
    }
    if (!formProduct.country.trim()) {
      toast.warning("Quốc gia không được để trống!", "Thiếu thông tin");
      return;
    }

    const highlightsArray = formProduct.highlightsText.split("\n").map(s => s.trim()).filter(Boolean);
    const requirements = highlightsArray.map((text, index) => ({
      criteriaType: text.split(":")[0]?.trim() || "Điểm nổi bật",
      criteriaValue: text,
      displayOrder: index
    }));

    const processStepsArray = formProduct.processStepsText.split("\n").map(s => s.trim()).filter(Boolean);
    const steps = processStepsArray.map((stepName, index) => ({
      stepOrder: index,
      stepName: stepName,
      description: "",
      estimatedDuration: ""
    }));

    const tags = formProduct.tagsText.split(",").map(s => s.trim()).filter(Boolean);
    tags.forEach((tag, index) => {
      requirements.push({
        criteriaType: "tag",
        criteriaValue: tag,
        displayOrder: highlightsArray.length + index
      });
    });

    const costs = [];
    if (formProduct.serviceFee > 0) {
      costs.push({
        itemName: "Phí dịch vụ",
        amount: formProduct.serviceFee,
        currency: formProduct.currency || "VND",
        note: "",
        displayOrder: 0
      });
    }

    const extendedData = {
      region: formProduct.region || "Châu Á",
      detailDescription: formProduct.detailDescription || formProduct.description,
      targetAudience: formProduct.targetAudience || "",
      tags: tags || [],
      websiteUrl: formProduct.websiteUrl || "",
      brochure: formProduct.brochure || null,
      documents: formProduct.documents || [],
      gradientFrom: formProduct.gradientFrom || "#0d2040",
      gradientTo: formProduct.gradientTo || "#1a3a6b",
      updatedAt: new Date().toISOString().split("T")[0]
    };

    const finalDescription = buildDescription(formProduct.description, extendedData);

    try {
      const apiPayload = {
        name: formProduct.name,
        categoryId: editingProductParentCatId,
        country: formProduct.country,
        isActive: formProduct.status === "active",
        description: finalDescription,
        requirements,
        costs,
        steps,
        serviceFee: formProduct.serviceFee || 0,
        currency: formProduct.currency || "VND",
        image: formProduct.image || "",
        visaCode: formProduct.visaCode || "",
        shortCode: formProduct.shortCode || "",
        purpose: formProduct.purpose || "",
      };

      let response;
      if (editingProduct === "new") {
        response = await apiRequest(`${API_BASE_URL}/products`, { method: "POST", body: JSON.stringify(apiPayload) });
      } else {
        response = await apiRequest(`${API_BASE_URL}/products/${editingProduct}`, { method: "PATCH", body: JSON.stringify(apiPayload) });
      }

      let savedProd;
      if (apiMode === "api") {
        const normalized = response?.data || response;
        const catName = categories.find(c => c.id === editingProductParentCatId)?.name || "";
        savedProd = mapApiProductToUiProduct(normalized, editingProductParentCatId, catName);
      } else {
        const catName = categories.find(c => c.id === editingProductParentCatId)?.name || "";
        savedProd = {
          id: editingProduct === "new" ? `prod-${Date.now()}` : editingProduct,
          name: formProduct.name,
          categoryId: editingProductParentCatId,
          categoryName: catName,
          country: formProduct.country,
          region: formProduct.region || "Châu Á",
          status: formProduct.status,
          description: formProduct.description,
          highlights: highlightsArray,
          processSteps: processStepsArray,
          tags: tags,
          detailDescription: formProduct.detailDescription || formProduct.description,
          targetAudience: formProduct.targetAudience || "",
          websiteUrl: formProduct.websiteUrl || "",
          image: formProduct.image || "",
          brochure: formProduct.brochure || null,
          documents: formProduct.documents || [],
          gradientFrom: formProduct.gradientFrom || "#0d2040",
          gradientTo: formProduct.gradientTo || "#1a3a6b",
          updatedAt: new Date().toISOString().split("T")[0]
        };
      }

      if (!savedProd) throw new Error("API không trả về dữ liệu hợp lệ.");

      const updated = editingProduct === "new"
        ? categories.map(cat =>
          cat.id === editingProductParentCatId
            ? { ...cat, programs: [...(cat.programs || []), savedProd] }
            : cat
        )
        : categories.map(cat => ({
          ...cat,
          programs: (cat.programs || []).map(p =>
            p.id === editingProduct ? savedProd : p
          )
        }));

      setCategories(updated);
      setEditingProduct(null);
      if (selectedProduct?.id === editingProduct) setSelectedProduct(savedProd);
      const updatedCat = updated.find(c => c.id === editingProductParentCatId);
      if (updatedCat) {
        setFormCategory(prev => ({ ...prev, programs: updatedCat.programs || [] }));
      }
      toast.success(editingProduct === "new" ? "Sản phẩm mới đã được thêm thành công" : "Sản phẩm đã được cập nhật", "Lưu thành công");
    } catch (err) {
      toast.error(err.message, "Lỗi khi lưu sản phẩm");
    }
  };

  // ==========================================
  // BROCHURE & DOCUMENTS UPLOAD HANDLERS
  // ==========================================
  const checkAndReplaceBrochure = (onConfirmCallback) => {
    if (formProduct.brochure) {
      showConfirm({
        title: "Thay thế Brochure",
        message: "Sản phẩm đã có Brochure. Bạn có chắc chắn muốn thay thế bằng Brochure mới không?",
        confirmLabel: "Thay thế",
        variant: "warning",
        onConfirm: () => { closeConfirm(); onConfirmCallback(); }
      });
    } else {
      onConfirmCallback();
    }
  };

  const handleProductBrochureUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const ext = file.name.split(".").pop().toLowerCase();
      const isPdf = ext === "pdf";
      const isImg = ["jpg", "jpeg", "png", "webp"].includes(ext);
      if (!isPdf && !isImg) {
        toast.warning("Vui lòng tải lên file PDF hoặc hình ảnh (JPG, JPEG, PNG, WEBP)!", "Định dạng không hỗ trợ");
        return;
      }
      checkAndReplaceBrochure(() => {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        const previewUrl = isImg ? URL.createObjectURL(file) : "";
        const brochureData = {
          id: `brochure-file-${Date.now()}`,
          name: file.name,
          sourceType: "file",
          fileType: isPdf ? "PDF" : "IMAGE",
          size: `${sizeMB} MB`,
          url: previewUrl,
          updatedAt: new Date().toISOString().split("T")[0]
        };
        setFormProduct(prev => ({ ...prev, brochure: brochureData }));
      });
      e.target.value = "";
    }
  };

  const handleBrochureDragOver = (e) => {
    e.preventDefault();
    setIsBrochureDragging(true);
  };

  const handleBrochureDragLeave = (e) => {
    e.preventDefault();
    setIsBrochureDragging(false);
  };

  const handleBrochureDrop = (e) => {
    e.preventDefault();
    setIsBrochureDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      const ext = file.name.split(".").pop().toLowerCase();
      const isPdf = ext === "pdf";
      const isImg = ["jpg", "jpeg", "png", "webp"].includes(ext);
      if (!isPdf && !isImg) {
        toast.warning("Vui lòng tải lên file PDF hoặc hình ảnh (JPG, JPEG, PNG, WEBP)!", "Định dạng không hỗ trợ");
        return;
      }
      checkAndReplaceBrochure(() => {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        const previewUrl = isImg ? URL.createObjectURL(file) : "";
        const brochureData = {
          id: `brochure-file-${Date.now()}`,
          name: file.name,
          sourceType: "file",
          fileType: isPdf ? "PDF" : "IMAGE",
          size: `${sizeMB} MB`,
          url: previewUrl,
          updatedAt: new Date().toISOString().split("T")[0]
        };
        setFormProduct(prev => ({ ...prev, brochure: brochureData }));
        toast.success(`Đã tải brochure: ${file.name}`, "Tải lên thành công");
      });
    }
  };

  const handleAddBrochureLink = () => {
    if (!brochureLinkInput.trim()) {
      toast.warning("Vui lòng nhập link Brochure.", "Thiếu thông tin");
      return;
    }
    if (!isValidUrl(brochureLinkInput)) {
      toast.warning("Vui lòng nhập link hợp lệ.", "Link không hợp lệ");
      return;
    }
    checkAndReplaceBrochure(() => {
      const finalUrl = normalizeUrl(brochureLinkInput);
      const brochureData = {
        id: `brochure-link-${Date.now()}`,
        name: brochureLinkInput.trim(),
        sourceType: "link",
        fileType: "LINK",
        size: "",
        url: finalUrl,
        updatedAt: new Date().toISOString().split("T")[0]
      };
      setFormProduct(prev => ({ ...prev, brochure: brochureData }));
      setBrochureLinkInput("");
      toast.success("Đã gắn link Brochure thành công!", "Thêm Brochure");
    });
  };

  const removeProductBrochure = () => {
    setFormProduct(prev => ({ ...prev, brochure: null }));
  };

  const handleProductDocsUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const validFiles = files.filter(file => {
        const ext = file.name.split(".").pop().toLowerCase();
        return ["pdf", "docx", "xlsx"].includes(ext);
      });
      if (validFiles.length === 0) {
        toast.warning("Vui lòng chọn các file PDF, DOCX hoặc XLSX!", "Định dạng không hỗ trợ");
        return;
      }
      const newDocs = validFiles.map((file, index) => {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        const kbSize = (file.size / 1024).toFixed(0);
        const finalSize = parseFloat(sizeMB) > 0.1 ? `${sizeMB} MB` : `${kbSize} KB`;
        const ext = file.name.split(".").pop().toUpperCase();
        return {
          id: `prod-doc-${Date.now()}-${index}`,
          name: file.name,
          type: ext === "PDF" ? "PDF" : (ext === "DOCX" ? "DOCX" : "XLSX"),
          sourceType: "file",
          fileType: ext,
          size: finalSize,
          url: "",
          updatedAt: new Date().toISOString().split("T")[0]
        };
      });
      setFormProduct(prev => ({
        ...prev,
        documents: [...(prev.documents || []), ...newDocs]
      }));
      toast.success(`Đã đính kèm ${newDocs.length} tài liệu tư vấn`, "Tải lên thành công");
    }
  };

  const handleDocsDragOver = (e) => {
    e.preventDefault();
    setIsDocsDragging(true);
  };

  const handleDocsDragLeave = (e) => {
    e.preventDefault();
    setIsDocsDragging(false);
  };

  const handleDocsDrop = (e) => {
    e.preventDefault();
    setIsDocsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const validFiles = files.filter(file => {
        const ext = file.name.split(".").pop().toLowerCase();
        return ["pdf", "docx", "xlsx"].includes(ext);
      });
      if (validFiles.length === 0) {
        toast.warning("Vui lòng kéo thả các tệp PDF, DOCX hoặc XLSX!", "Định dạng không hỗ trợ");
        return;
      }
      const newDocs = validFiles.map((file, index) => {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        const kbSize = (file.size / 1024).toFixed(0);
        const finalSize = parseFloat(sizeMB) > 0.1 ? `${sizeMB} MB` : `${kbSize} KB`;
        const ext = file.name.split(".").pop().toUpperCase();
        return {
          id: `prod-doc-${Date.now()}-${index}`,
          name: file.name,
          type: ext === "PDF" ? "PDF" : (ext === "DOCX" ? "DOCX" : "XLSX"),
          sourceType: "file",
          fileType: ext,
          size: finalSize,
          url: "",
          updatedAt: new Date().toISOString().split("T")[0]
        };
      });
      setFormProduct(prev => ({
        ...prev,
        documents: [...(prev.documents || []), ...newDocs]
      }));
      toast.success(`Đã đính kèm ${newDocs.length} tài liệu tư vấn`, "Tải lên thành công");
    }
  };

  const handleAddDocLink = () => {
    if (!docLinkNameInput.trim()) {
      toast.warning("Vui lòng nhập tên tài liệu.", "Thiếu thông tin");
      return;
    }
    if (!docLinkUrlInput.trim() || !isValidUrl(docLinkUrlInput)) {
      toast.warning("Vui lòng nhập link tài liệu hợp lệ.", "Link không hợp lệ");
      return;
    }

    const finalUrl = normalizeUrl(docLinkUrlInput);
    const newDoc = {
      id: `prod-doc-link-${Date.now()}`,
      name: docLinkNameInput.trim(),
      type: docLinkTypeInput,
      sourceType: "link",
      fileType: "LINK",
      size: "",
      url: finalUrl,
      updatedAt: new Date().toISOString().split("T")[0]
    };

    setFormProduct(prev => ({
      ...prev,
      documents: [...(prev.documents || []), newDoc]
    }));

    setDocLinkNameInput("");
    setDocLinkUrlInput("");
    toast.success("Đã thêm liên kết tài liệu tư vấn", "Thêm tài liệu");
  };

  const deleteProductDoc = (docId) => {
    showConfirm({
      title: "Xóa tài liệu",
      message: "Bạn có chắc chắn muốn xóa tài liệu tư vấn này không?",
      confirmLabel: "Xóa",
      variant: "danger",
      onConfirm: () => {
        closeConfirm();
        setFormProduct(prev => ({
          ...prev,
          documents: (prev.documents || []).filter(d => d.id !== docId)
        }));
        toast.success("Đã xóa tài liệu tư vấn", "Xóa thành công");
      }
    });
  };

  const renderCategorySection = (cat) => {
    const displayPrograms = cat.filteredPrograms || cat.programs || [];
    if (displayPrograms.length === 0 && !canManageProducts) return null;

    const ITEMS_PER_ROW = 3;
    const isExpanded = !!expandedCategories[cat.id];
    const visiblePrograms = isExpanded ? displayPrograms : displayPrograms.slice(0, ITEMS_PER_ROW);
    const hasMore = displayPrograms.length > ITEMS_PER_ROW;
    const hiddenCount = displayPrograms.length - ITEMS_PER_ROW;

    const renderProductGrid = (programsToRender) => (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {programsToRender.map((prog, progIdx) => {
          const totalDocs = (prog.brochure ? 1 : 0) + (prog.documents?.length || 0);
          const isFirstCard = progIdx === 0;
          return (
            <div
              key={prog.id}
              id={isFirstCard ? "tour-first-program-card" : undefined}
              className="bg-slate-50/50 app-dark:bg-[#1e1e1e]/60! border border-slate-200/60 app-dark:border-slate-700/80! rounded-xl overflow-hidden transition-all duration-200 hover:bg-cyan-50/20 app-dark:hover:bg-cyan-955/10! hover:border-cyan-300/80 app-dark:hover:border-cyan-900/50! hover:shadow-sm cursor-pointer flex flex-row items-center relative group"
              onClick={() => {
                setSelectedProduct(prog);
                setViewMode("detail");
              }}
            >
              <div className="shrink-0 w-14 h-14 bg-slate-200 app-dark:bg-slate-700! relative overflow-hidden m-2 rounded-lg border border-slate-200/80 app-dark:border-slate-650!">
                {prog.image ? (
                  <img
                    src={prog.image}
                    alt={prog.name}
                    className="w-full h-full object-cover absolute inset-0"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-cyan-900/10 to-cyan-700/20 app-dark:from-cyan-900/30 app-dark:to-cyan-700/40">
                    <i className="fa fa-image text-base text-slate-300 app-dark:text-slate-600!"></i>
                  </div>
                )}
              </div>

              <div className="flex flex-col justify-center flex-1 min-w-0 py-2 pr-2 pl-0.5">
                <div className="font-bold text-slate-800 app-dark:text-slate-100! text-[12px] mb-0.5 line-clamp-1 leading-tight pr-6" title={prog.name}>
                  {prog.name}
                </div>
                {prog.description ? (
                  <p className="text-[9.5px] text-slate-450 app-dark:text-slate-400! line-clamp-1 leading-normal m-0">
                    {prog.description}
                  </p>
                ) : (
                  <div className="h-3.5"></div>
                )}
                <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-100 app-dark:border-slate-800/80!">
                  <span className="bg-slate-100 app-dark:bg-slate-800/80! text-slate-600 app-dark:text-slate-300! px-1.5 py-0.5 rounded text-[8px] font-medium flex items-center gap-0.5 max-w-[80px] truncate">
                    <i className="fa fa-earth-asia text-[7.5px] text-cyan-600"></i>
                    {resolveCountryName(prog.country)}
                  </span>
                  <span className="text-[8px] text-slate-400 app-dark:text-slate-500! font-medium flex items-center gap-0.5">
                    <i className="fa fa-folder-open text-[8px]"></i>
                    {totalDocs} TL
                  </span>
                </div>
              </div>

              {canManageProducts && (
                <div
                  className="absolute top-1/2 -translate-y-1/2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => handleEditProduct(prog)}
                    className="w-5.5 h-5.5 rounded bg-white border border-slate-200 text-slate-500 hover:text-cyan-700 hover:border-cyan-300 flex items-center justify-center shadow-xs transition-colors"
                    title="Sửa sản phẩm"
                  >
                    <i className="fa fa-pen text-[8.5px]"></i>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteProduct(prog.id)}
                    className="w-5.5 h-5.5 rounded bg-white border border-slate-200 text-slate-500 hover:text-red-650 hover:border-red-300 flex items-center justify-center shadow-xs transition-colors"
                    title="Xóa sản phẩm"
                  >
                    <i className="fa fa-trash text-[8.5px]"></i>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );

    const renderShowMoreBtn = (hasMoreItems, hiddenItemsCount) => {
      if (!hasMoreItems) return null;
      return (
        <div className="mt-2.5 flex justify-center">
          <button
            type="button"
            onClick={() => setExpandedCategories(prev => ({ ...prev, [cat.id]: !isExpanded }))}
            className="flex items-center gap-1 text-[9.5px] font-semibold text-cyan-800 app-dark:text-cyan-400! hover:text-cyan-950 bg-cyan-50/50 app-dark:bg-cyan-955/20! hover:bg-cyan-100 app-dark:hover:bg-cyan-955/40! border border-cyan-100 app-dark:border-cyan-900/40! px-2.5 py-0.5 rounded-full transition-all duration-200"
          >
            {isExpanded ? (
              <><i className="fa fa-chevron-up text-[7.5px]"></i> Thu gọn</>
            ) : (
              <><i className="fa fa-chevron-down text-[7.5px]"></i> Xem thêm {hiddenItemsCount} sản phẩm</>
            )}
          </button>
        </div>
      );
    };

    if (cat.name === "Visa") {
      return (
        <div key={cat.id} className="bg-white app-dark:bg-[#111827]! rounded-2xl border border-slate-150 app-dark:border-slate-800! p-4 md:p-5 mb-6 shadow-sm relative z-0">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 pb-3.5 border-b border-slate-100 app-dark:border-slate-800/80!">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-cyan-50 app-dark:bg-cyan-955/20! text-[#0d919c] app-dark:text-cyan-400! flex items-center justify-center shrink-0 border border-cyan-100/60 app-dark:border-cyan-900/40!">
                <i className="fa fa-earth-americas text-base"></i>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base md:text-[16px] font-bold text-slate-800 app-dark:text-slate-100! m-0 leading-none">Visa</h3>
                  <span className="bg-blue-50 app-dark:bg-blue-950/30! text-blue-700 app-dark:text-blue-400! border border-blue-100/60 app-dark:border-blue-900/30! px-1.5 py-0.5 rounded-lg text-[9.5px] font-semibold">
                    4 SP
                  </span>
                </div>
                <p className="text-slate-500 app-dark:text-slate-400! text-[11px] md:text-[11.5px] m-0 max-w-2xl leading-normal mt-1 line-clamp-1">Quản lý các danh mục visa và hồ sơ liên quan</p>
              </div>
            </div>
            {canManageProducts && (
              <div className="flex items-center gap-1.5 shrink-0 flex-wrap ml-auto sm:ml-0">
                <button
                  type="button"
                  onClick={() => handleEditCategory(cat)}
                  className="bg-slate-50 app-dark:bg-slate-800! border border-slate-200 app-dark:border-slate-700! text-[#ea580c] app-dark:text-orange-400! hover:bg-orange-50/50 app-dark:hover:bg-slate-700! px-2 py-1.5 rounded-lg text-[10px] font-semibold flex items-center gap-1 shadow-sm transition-colors"
                >
                  <i className="fa fa-pen text-[9px]"></i> Sửa
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleCategoryStatus(cat.id, cat.status)}
                  className="bg-slate-50 app-dark:bg-slate-800! border border-slate-200 app-dark:border-slate-700! text-slate-600 app-dark:text-slate-300! hover:bg-slate-100 app-dark:hover:bg-slate-700! px-2 py-1.5 rounded-lg text-[10px] font-semibold flex items-center gap-1 shadow-sm transition-colors"
                >
                  {cat.status === "inactive" || cat.status === "hidden" ? <><i className="fa fa-eye text-[9px]"></i> Hiện</> : <><i className="fa fa-eye-slash text-[9px]"></i> Ẩn</>}
                </button>
              </div>
            )}
          </div>

          {/* Content - HIỂN THỊ VISA_TYPES */}
          <div className="relative z-0">
            {!selectedVisaType ? (
              <>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {VISA_TYPES.map(type => (
                    <div
                      key={type.id}
                      onClick={() => setSelectedVisaType(type.id)}
                      className={`relative flex flex-col border border-slate-100 app-dark:border-slate-800/80! rounded-xl overflow-hidden cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ${type.gradient} app-dark:bg-[#1e293b]/40!`}
                    >
                      <div className="p-3 flex flex-col items-center text-center flex-1">
                        <div className={`w-9 h-9 rounded-full bg-white app-dark:bg-slate-800! flex items-center justify-center shadow-sm mb-2 ${type.color}`}>
                          <i className={`fa ${type.icon} text-sm`}></i>
                        </div>
                        <h5 className={`text-[12px] font-bold mb-0.5 ${type.color}`}>{type.name}</h5>
                        <p className="text-slate-500 app-dark:text-slate-400! text-[10px] leading-snug line-clamp-2">{type.desc}</p>
                        <div className="w-full border-t border-dashed border-slate-200/50 app-dark:border-slate-700/50! my-2"></div>
                        <div className="w-full flex justify-around text-[10px]">
                          <div>
                            <div className="font-extrabold text-slate-700 app-dark:text-slate-300!">{type.docsCount}</div>
                            <div className="text-[8px] text-slate-400">Hồ sơ</div>
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-700 app-dark:text-slate-300!">{type.filesCount}</div>
                            <div className="text-[8px] text-slate-400">Tài liệu</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-[#f8fafc] app-dark:bg-slate-900/50! border border-[#f1f5f9] app-dark:border-slate-800/60! rounded-xl px-3 py-2 flex items-center gap-1.5">
                  <i className="fa fa-info-circle text-cyan-650 text-xs"></i>
                  <span className="text-[10px] text-slate-500 app-dark:text-slate-400! font-medium">Click chọn loại Visa để xem hồ sơ và tài liệu cụ thể.</span>
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-3 bg-white app-dark:bg-[#111827]! p-2.5 rounded-xl border border-slate-100 app-dark:border-slate-800/80! shadow-xs">
                <div className="flex items-center gap-2 bg-slate-50 app-dark:bg-slate-900/50! p-2 rounded-lg border border-slate-150 app-dark:border-slate-800/60!">
                  <button
                    onClick={() => setSelectedVisaType(null)}
                    className="text-slate-600 app-dark:text-slate-300! hover:text-cyan-700 app-dark:hover:text-cyan-400 bg-white app-dark:bg-slate-800! border border-slate-200 app-dark:border-slate-700! px-2 py-1 rounded-md text-[10px] font-semibold shadow-xs transition-colors flex items-center gap-1"
                  >
                    <i className="fa fa-arrow-left text-[8px]"></i> Trở lại
                  </button>
                  <span className="font-bold text-slate-800 app-dark:text-slate-100! text-xs">
                    Đang hiển thị: {VISA_TYPES.find(t => t.id === selectedVisaType)?.name}
                  </span>
                </div>
                {renderProductGrid(visiblePrograms)}
                {renderShowMoreBtn(hasMore, hiddenCount)}
              </div>
            )}
          </div>
        </div>
      );
    }

    const totalCatDocs = displayPrograms.reduce((sum, prog) => sum + (prog.brochure ? 1 : 0) + (prog.documents?.length || 0), 0);
    return (
      <div key={cat.id} className="bg-white app-dark:bg-[#111827]! rounded-2xl border border-slate-150 app-dark:border-slate-800! p-4 md:p-5 mb-6 shadow-sm relative z-0">
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 pb-3.5 border-b border-slate-100 app-dark:border-slate-800/80!">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 app-dark:bg-cyan-950/30! text-[#0d919c] app-dark:text-cyan-400! flex items-center justify-center shrink-0 border border-cyan-100/60 app-dark:border-cyan-900/40!">
              <i className="fa fa-layer-group text-base"></i>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base md:text-[16px] font-bold text-slate-800 app-dark:text-slate-100! m-0 leading-none">{cat.name}</h3>
                <div className="flex gap-1 items-center">
                  <span className="bg-emerald-50 app-dark:bg-emerald-950/30! text-emerald-700 app-dark:text-emerald-400! border border-emerald-100/60 app-dark:border-emerald-900/30! px-1.5 py-0.5 rounded-lg text-[9.5px] font-semibold flex items-center gap-1">
                    <i className="fa fa-box-open text-[8.5px]"></i>
                    {displayPrograms.length} SP
                  </span>
                  <span className="bg-blue-50 app-dark:bg-blue-950/30! text-blue-700 app-dark:text-blue-400! border border-blue-100/60 app-dark:border-blue-900/30! px-1.5 py-0.5 rounded-lg text-[9.5px] font-semibold flex items-center gap-1">
                    <i className="fa fa-file-lines text-[8.5px]"></i>
                    {totalCatDocs} TL
                  </span>
                </div>
              </div>
              {cat.description && (
                <p className="text-slate-500 app-dark:text-slate-400! text-[11px] md:text-[11.5px] m-0 max-w-2xl leading-normal mt-1 line-clamp-1" title={cat.description}>{cat.description}</p>
              )}
            </div>
          </div>
          {canManageProducts && (
            <div className="flex items-center gap-1.5 shrink-0 flex-wrap ml-auto sm:ml-0">
              <button
                type="button"
                onClick={() => handleEditCategory(cat)}
                className="bg-slate-50 app-dark:bg-slate-800! border border-slate-200 app-dark:border-slate-700! text-[#ea580c] app-dark:text-orange-400! hover:bg-orange-50/50 app-dark:hover:bg-slate-700! px-2 py-1.5 rounded-lg text-[10px] font-semibold flex items-center gap-1 shadow-sm transition-colors"
              >
                <i className="fa fa-pen text-[9px]"></i> Sửa
              </button>
              <button
                type="button"
                onClick={() => handleToggleCategoryStatus(cat.id, cat.status)}
                className="bg-slate-50 app-dark:bg-slate-800! border border-slate-200 app-dark:border-slate-700! text-slate-600 app-dark:text-slate-300! hover:bg-slate-100 app-dark:hover:bg-slate-700! px-2 py-1.5 rounded-lg text-[10px] font-semibold flex items-center gap-1 shadow-sm transition-colors"
              >
                {cat.status === "inactive" || cat.status === "hidden" ? <><i className="fa fa-eye text-[9px]"></i> Hiện</> : <><i className="fa fa-eye-slash text-[9px]"></i> Ẩn</>}
              </button>
            </div>
          )}
        </div>

        {/* Product list */}
        {displayPrograms.length > 0 ? (
          <div className="relative z-0">
            {renderProductGrid(visiblePrograms)}
            {renderShowMoreBtn(hasMore, hiddenCount)}
          </div>
        ) : (
          <div className="text-center py-6 text-slate-400 app-dark:text-slate-500! text-xs">
            Danh mục này chưa có sản phẩm nào.
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="w-full py-20 text-center flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-cyan-200 border-t-cyan-900" role="status">
          <span className="sr-only">Đang tải...</span>
        </div>
        <p className="mt-4 text-slate-500 text-sm">Đang đồng bộ dữ liệu sản phẩm HTO...</p>
      </div>
    );
  }

  return (
    <>
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        cancelLabel={confirmModal.cancelLabel}
        variant={confirmModal.variant}
        onConfirm={confirmModal.onConfirm}
        onCancel={closeConfirm}
      />
      <div className="w-full max-w-[1600px] mx-auto px-4 py-6">
        {/* HEADER SECTION */}
        {viewMode === "overview" ? (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold text-slate-900 app-dark:text-slate-100! m-0">Danh mục sản phẩm</h1>
              </div>
              <p className="text-slate-500 app-dark:text-slate-400! text-sm m-0 mt-1">
                Kho danh mục chương trình và tài liệu tư vấn dành cho cộng tác viên, đại lý và nhân viên tư vấn.
              </p>
            </div>
            {canManageProducts && (
              <button
                id="products-add-category-btn"
                className="bg-cyan-900 hover:bg-cyan-950 text-white text-sm font-semibold px-4 py-2 flex items-center gap-2 shadow-sm force-rounded-xl transition-all duration-200 cursor-pointer"
                onClick={handleOpenNewCategory}
              >
                <i className="fa fa-folder-plus text-base"></i> + Thêm danh mục
              </button>
            )}
          </div>
        ) : (
          <div className="mb-6">
            <button
              className="border border-slate-300 app-dark:border-white/15! hover:bg-slate-50 app-dark:hover:bg-white/5! text-slate-700 app-dark:text-slate-300! text-sm font-semibold force-rounded-xl px-4 py-2 flex items-center gap-2 transition-colors duration-200"
              onClick={handleGoBack}
            >
              <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Quay lại danh sách
            </button>
          </div>
        )}

        {/* STATS SECTION */}
        {viewMode === "overview" && canManageProducts && selectedCategoryName === "Tất cả" && (
          <div id="products-stats-grid" className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="bg-white app-dark:bg-[#252525]! rounded-2xl p-4.5 shadow-sm border border-slate-100 app-dark:border-white/8! flex items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 app-dark:bg-cyan-955/40! text-cyan-900 app-dark:text-cyan-300! shrink-0 mr-4">
                <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              <div>
                <span className="text-slate-450 app-dark:text-slate-400! text-xs block font-medium">Danh mục lớn</span>
                <span className="font-bold text-slate-800 app-dark:text-slate-100! text-lg md:text-xl leading-none block mt-1">{stats.totalCategories}</span>
              </div>
            </div>
            <div className="bg-white app-dark:bg-[#252525]! rounded-2xl p-4.5 shadow-sm border border-slate-100 app-dark:border-white/8! flex items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 app-dark:bg-emerald-955/40! text-emerald-650 app-dark:text-emerald-350! shrink-0 mr-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0v6m-7.244-2.244L12 20l7.244-2.244" />
                </svg>
              </div>
              <div>
                <span className="text-slate-455 app-dark:text-slate-400! text-xs block font-medium">Sản phẩm/Chương trình con</span>
                <span className="font-bold text-slate-800 app-dark:text-slate-100! text-lg md:text-xl leading-none block mt-1">{stats.totalPrograms}</span>
              </div>
            </div>
            <div className="bg-white app-dark:bg-[#252525]! rounded-2xl p-4.5 shadow-sm border border-slate-100 app-dark:border-white/8! flex items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 app-dark:bg-sky-955/40! text-sky-650 app-dark:text-sky-300! shrink-0 mr-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <span className="text-slate-455 app-dark:text-slate-400! text-xs block font-medium">Đang tuyển sinh</span>
                <span className="font-bold text-slate-800 app-dark:text-slate-100! text-lg md:text-xl leading-none block mt-1">{stats.activePrograms}</span>
              </div>
            </div>
            <div className="bg-white app-dark:bg-[#252525]! rounded-2xl p-4.5 shadow-sm border border-slate-100 app-dark:border-white/8! flex items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 app-dark:bg-amber-955/40! text-amber-650 app-dark:text-amber-300! shrink-0 mr-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <span className="text-slate-455 app-dark:text-slate-400! text-xs block font-medium">Brochures & Tài liệu tư vấn</span>
                <span className="font-bold text-slate-800 app-dark:text-slate-100! text-lg md:text-xl leading-none block mt-1">{stats.totalDocuments}</span>
              </div>
            </div>
          </div>
        )}

        {/* FILTER SECTION */}
        {viewMode === "overview" && (() => {
          const activeFilters = [
            searchQuery && { key: "search", label: `"${searchQuery}"`, onClear: () => setSearchQuery("") },
            selectedCategoryName !== "Tất cả" && { key: "cat", label: selectedCategoryName, onClear: () => setSelectedCategoryName("Tất cả") },
            selectedRegion !== "Tất cả" && { key: "region", label: selectedRegion, onClear: () => setSelectedRegion("Tất cả") },
            selectedCountry !== "Tất cả" && { key: "country", label: resolveCountryName(selectedCountry), onClear: () => setSelectedCountry("Tất cả") },
            selectedStatus !== "all" && { key: "status", label: statusOptions.find(o => o.value === selectedStatus)?.label || selectedStatus, onClear: () => setSelectedStatus("all") },
          ].filter(Boolean);

          const totalResults = filteredCategories.reduce((sum, cat) => sum + (cat.filteredPrograms?.length || 0), 0);
          const hasActiveFilter = activeFilters.length > 0;

          return (
            <div id="products-filter-section" className="bg-white app-dark:bg-[#252525]! rounded-2xl border border-slate-100 app-dark:border-white/8! px-4 py-3 shadow-sm app-dark:shadow-none! mb-5 overflow-visible">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:items-center relative">
                {/* Search */}
                <div className="md:col-span-12 xl:col-span-5">
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-slate-400 app-dark:text-slate-500! flex items-center justify-center pointer-events-none">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      className="w-full h-10 bg-white app-dark:bg-[#1e1e1e]! border border-slate-200 app-dark:border-slate-700! rounded-xl pl-9 pr-8 text-sm text-slate-700 app-dark:text-slate-100! placeholder-slate-400 app-dark:placeholder-slate-500! focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 focus:outline-none transition-all duration-200"
                      placeholder="Tìm kiếm theo tên, quốc gia, tag..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        className="absolute right-2.5 text-slate-400 hover:text-slate-600 app-dark:hover:text-slate-200! transition-colors"
                        onClick={() => setSearchQuery("")}
                        aria-label="Xóa tìm kiếm"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Mega menu */}
                <div className="md:col-span-8 xl:col-span-5">
                  <MegaMenuFilter
                    categories={categories}
                    selectedCategoryName={selectedCategoryName}
                    selectedCountry={selectedCountry}
                    selectedRegion={selectedRegion}
                    onSelect={({ category, region, country }) => {
                      setSelectedCategoryName(category);
                      setSelectedRegion(region);
                      setSelectedCountry(country);
                    }}
                  />
                </div>

                {/* Trạng thái */}
                <div className="md:col-span-4 xl:col-span-2">
                  <CustomDropdown
                    value={selectedStatus}
                    options={statusOptions}
                    onChange={setSelectedStatus}
                    placeholder="Trạng thái"
                  />
                </div>
              </div>

              {/* Active filter badges */}
              {hasActiveFilter && (
                <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-100 app-dark:border-white/8!">
                  <span className="text-xs text-slate-400 app-dark:text-slate-505! font-medium shrink-0">
                    {filteredCategories.length > 0
                      ? <><span className="text-cyan-800 app-dark:text-cyan-400! font-bold">{totalResults}</span> chương trình trong <span className="text-cyan-800 app-dark:text-cyan-400! font-bold">{filteredCategories.length}</span> danh mục</>
                      : <span className="text-orange-500 font-semibold">Không tìm thấy kết quả</span>
                    }
                  </span>
                  <span className="text-slate-200 app-dark:text-slate-700! mx-1 hidden sm:inline">·</span>
                  {activeFilters.map(f => (
                    <span key={f.key} className="inline-flex items-center gap-1 bg-cyan-50 app-dark:bg-cyan-955/30! border border-cyan-200 app-dark:border-cyan-900/60! text-cyan-800 app-dark:text-cyan-300! text-[11px] font-semibold px-2.5 py-1 rounded-full">
                      {f.label}
                      <button
                        type="button"
                        onClick={f.onClear}
                        className="ml-0.5 text-cyan-500 hover:text-cyan-800 app-dark:hover:text-cyan-100! transition-colors"
                        aria-label={`Xóa lọc ${f.label}`}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                  {activeFilters.length > 1 && (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="text-[11px] text-slate-400 hover:text-red-500 app-dark:hover:text-red-400! font-semibold transition-colors underline underline-offset-2"
                    >
                      Xóa tất cả
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })()}

        {/* CATEGORIES GRID VIEW */}
        {viewMode === "overview" && (
          <>
            {filteredCategories.length > 0 ? (
              (() => {
                const visaCat = filteredCategories.find(cat => cat.name === "Visa");
                const leftCategories = filteredCategories.filter(cat => cat.name !== "Visa");

                const isVisaVisible = !!visaCat && (selectedCategoryName === "Tất cả" || selectedCategoryName === "Visa");
                const isLeftVisible = leftCategories.length > 0 && selectedCategoryName !== "Visa";

                const isTwoColumn = isVisaVisible && isLeftVisible;

                // local pagination for left categories (non-Visa) when viewing all
                const totalLeftPages = Math.ceil(leftCategories.length / LEFT_CATEGORIES_PER_PAGE);
                const safeLeftPage = Math.min(leftCategoryPage, Math.max(0, totalLeftPages - 1));
                const pagedLeftCategories = leftCategories.slice(
                  safeLeftPage * LEFT_CATEGORIES_PER_PAGE,
                  safeLeftPage * LEFT_CATEGORIES_PER_PAGE + LEFT_CATEGORIES_PER_PAGE
                );

                return (
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 relative z-0">
                    {/* LEFT COLUMN: other categories */}
                    {isLeftVisible && (
                      <div className={isTwoColumn ? "xl:col-span-6 space-y-6" : "xl:col-span-12 space-y-6"}>
                        {/* Render other categories */}
                        {(isTwoColumn ? pagedLeftCategories : leftCategories).map(cat => renderCategorySection(cat))}

                        {/* Local Pagination controls for Left Column */}
                        {isTwoColumn && totalLeftPages > 1 && (
                          <div className="flex items-center justify-center gap-3 mt-4">
                            <button
                              type="button"
                              disabled={safeLeftPage === 0}
                              onClick={() => setLeftCategoryPage(p => Math.max(0, p - 1))}
                              className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 app-dark:border-slate-700! text-slate-500 app-dark:text-slate-300! disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 app-dark:hover:bg-[#252525]! transition-colors"
                              aria-label="Trang trước"
                            >
                              <i className="fa fa-chevron-left text-[10px]"></i>
                            </button>
                            <div className="flex items-center gap-1">
                              {Array.from({ length: totalLeftPages }).map((_, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => setLeftCategoryPage(idx)}
                                  className={`rounded-full transition-all duration-200 font-semibold text-[10px] ${idx === safeLeftPage
                                    ? "h-7 w-7 bg-cyan-900 text-white shadow-sm"
                                    : "h-7 w-7 bg-white app-dark:bg-[#252525]! border border-slate-200 app-dark:border-slate-700! text-slate-500 app-dark:text-slate-400! hover:bg-slate-50 app-dark:hover:bg-[#2e2e2e]!"
                                    }`}
                                  aria-label={`Trang ${idx + 1}`}
                                >
                                  {idx + 1}
                                </button>
                              ))}
                            </div>
                            <button
                              type="button"
                              disabled={safeLeftPage === totalLeftPages - 1}
                              onClick={() => setLeftCategoryPage(p => Math.min(totalLeftPages - 1, p + 1))}
                              className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 app-dark:border-slate-700! text-slate-500 app-dark:text-slate-300! disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 app-dark:hover:bg-[#252525]! transition-colors"
                              aria-label="Trang sau"
                            >
                              <i className="fa fa-chevron-right text-[10px]"></i>
                            </button>
                            <span className="text-[10px] text-slate-450 app-dark:text-slate-500! ml-1">
                              Trang {safeLeftPage + 1} / {totalLeftPages}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* RIGHT COLUMN: Visa category */}
                    {isVisaVisible && (
                      <div className={isTwoColumn ? "xl:col-span-6 space-y-6" : "xl:col-span-12 space-y-6"}>
                        {renderCategorySection(visaCat)}
                      </div>
                    )}
                  </div>
                );
              })()
            ) : (
              <div className="text-center py-16 bg-white app-dark:bg-[#252525]! border border-slate-100 app-dark:border-white/8! rounded-2xl shadow-sm app-dark:shadow-none!">
                <svg className="w-12 h-12 text-slate-300 app-dark:text-slate-600! mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h5 className="text-slate-500 app-dark:text-slate-400! font-semibold text-sm mb-1">Không tìm thấy kết quả phù hợp</h5>
                <p className="text-slate-400 app-dark:text-slate-500! text-xs mb-4">Thử thay đổi từ khóa hoặc xóa bộ lọc đang áp dụng.</p>
                <button className="bg-cyan-900 hover:bg-cyan-950 text-white text-xs font-semibold px-4 py-2 rounded-xl mt-1 transition-colors" onClick={handleResetFilters}>
                  Xóa bộ lọc
                </button>
              </div>
            )}
          </>
        )}

        {/* PRODUCT DETAIL VIEW */}
        {viewMode === "detail" && selectedProduct && (() => {
          const getDefaultProductImage = (prod) => {
            const country = String(prod?.country || "").trim().toLowerCase();
            const categoryName = String(prod?.categoryName || "").trim().toLowerCase();
            const name = String(prod?.name || "").trim().toLowerCase();

            // Germany
            if (country.includes("đức") || country.includes("germany") || country.includes("de")) {
              return "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=800&q=80";
            }
            // Canada
            if (country.includes("canada") || country.includes("ca")) {
              return "https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7?auto=format&fit=crop&w=800&q=80";
            }
            // US
            if (country.includes("mỹ") || country.includes("usa") || country.includes("us") || country.includes("united states")) {
              return "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=800&q=80";
            }
            // Australia
            if (country.includes("úc") || country.includes("australia") || country.includes("au")) {
              return "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=800&q=80";
            }
            // Japan
            if (country.includes("nhật") || country.includes("japan") || country.includes("jp")) {
              return "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80";
            }
            // Korea
            if (country.includes("hàn") || country.includes("korea") || country.includes("kr")) {
              return "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=80";
            }
            // UK
            if (country.includes("anh") || country.includes("uk") || country.includes("united kingdom") || country.includes("gb")) {
              return "https://images.unsplash.com/photo-1486299267070-83823f5448dd?auto=format&fit=crop&w=800&q=80";
            }
            // Philippines
            if (country.includes("philippines") || country.includes("ph")) {
              return "https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80";
            }
            // Singapore
            if (country.includes("singapore") || country.includes("sg")) {
              return "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=800&q=80";
            }
            // General study
            if (categoryName.includes("học") || name.includes("học")) {
              return "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80";
            }
            // General visa
            if (categoryName.includes("visa") || name.includes("visa")) {
              return "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80";
            }
            // General default
            return "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80";
          };

          const pImg = selectedProduct.image || getDefaultProductImage(selectedProduct);
          const bgGradient = `linear-gradient(135deg, ${selectedProduct.gradientFrom || "#0d2040"} 0%, ${selectedProduct.gradientTo || "#1a3a6b"} 100%)`;

          // Parse steps dynamically to resolve step-numbering bug
          const parsedSteps = [];
          (selectedProduct.processSteps || []).forEach(step => {
            const stepTrimmed = step.trim();
            if (stepTrimmed.startsWith("Bước ") || stepTrimmed.startsWith("Bước: ") || stepTrimmed.toLowerCase().startsWith("bước ")) {
              parsedSteps.push({
                title: stepTrimmed,
                description: []
              });
            } else {
              if (parsedSteps.length > 0) {
                parsedSteps[parsedSteps.length - 1].description.push(stepTrimmed);
              } else {
                parsedSteps.push({
                  title: stepTrimmed,
                  description: []
                });
              }
            }
          });

          return (
            <div className="bg-white app-dark:bg-[#1e1e1e]! rounded-2xl shadow-lg border border-slate-100 app-dark:border-white/8! overflow-hidden">

              {/* ── HERO BANNER — bố cục màu gradient xịn đè hình ── */}
              <div className="relative overflow-hidden" style={{ minHeight: "280px", background: bgGradient }}>
                
                {/* Decorative background overlay */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none"></div>

                <div className="grid grid-cols-1 lg:grid-cols-10 items-center p-6 md:p-8 lg:p-10 relative z-10 gap-6">

                  {/* Cột trái: thông tin (6/10) */}
                  <div className="lg:col-span-6 flex flex-col justify-between gap-4">
                    {/* Breadcrumb text-only */}
                    <div className="flex items-center gap-1.5 flex-wrap text-xs text-slate-300/80">
                      <span
                        className="hover:text-white cursor-pointer transition-colors font-medium"
                        onClick={() => setViewMode("overview")}
                      >
                        {selectedProduct.categoryName || "Sản phẩm"}
                      </span>
                      {(selectedProduct.region || selectedProduct.country) && (
                        <>
                          <span className="opacity-60">›</span>
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {[selectedProduct.region, resolveCountryName(selectedProduct.country)].filter(Boolean).join(" · ")}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Nội dung chính */}
                    <div className="flex-1 mt-2">
                      {/* Badge danh mục */}
                      <div className="flex gap-2 mb-4 flex-wrap items-center">
                        <span className="inline-block bg-white/15 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-white/10">
                          {selectedProduct.categoryName || "Chương trình"}
                        </span>
                        {selectedProduct.shortCode && (
                          <span className="inline-block bg-cyan-500/20 text-cyan-200 text-[10px] font-bold px-3 py-1 rounded-full border border-cyan-500/30">
                            Mã: {selectedProduct.shortCode}
                          </span>
                        )}
                        {selectedProduct.visaCode && (
                          <span className="inline-block bg-indigo-500/20 text-indigo-200 text-[10px] font-bold px-3 py-1 rounded-full border border-indigo-500/30">
                            Visa: {selectedProduct.visaCode}
                          </span>
                        )}
                        {selectedProduct.purpose && (
                          <span className="inline-block bg-amber-500/20 text-amber-200 text-[10px] font-bold px-3 py-1 rounded-full border border-amber-500/30">
                            {selectedProduct.purpose}
                          </span>
                        )}
                      </div>
                      
                      <h2 className="text-2xl md:text-3.5xl font-extrabold text-white m-0 leading-tight tracking-tight">
                        {selectedProduct.name}
                      </h2>
                      <p className="text-slate-200 app-dark:text-slate-300! text-[14px] leading-relaxed mt-3 mb-0 max-w-xl opacity-90">
                        {selectedProduct.description || "Chương trình chất lượng cao, uy tín quốc tế của tập đoàn HT Ocean."}
                      </p>
                    </div>

                    {/* Footer: ngày cập nhật + website */}
                    <div className="flex items-center gap-4 flex-wrap pt-4 border-t border-white/10 mt-2">
                      <p className="text-slate-300 text-xs flex items-center gap-1.5 m-0 opacity-80">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Cập nhật:{" "}
                        {selectedProduct.updatedAt
                          ? (() => {
                            try {
                              const d = new Date(selectedProduct.updatedAt);
                              return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
                            } catch { return selectedProduct.updatedAt; }
                          })()
                          : new Date().toLocaleDateString("vi-VN")}
                      </p>
                      {selectedProduct.websiteUrl && (
                        <button
                          className="bg-white/10 hover:bg-white/20 text-white border border-white/25 font-semibold text-xs rounded-xl px-3.5 py-2 flex items-center gap-1.5 transition-all shadow-sm"
                          onClick={() => handleOpenWebsite(selectedProduct.websiteUrl)}
                        >
                          <i className="fa fa-globe text-[11px]"></i> Website
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Cột phải: ảnh banner phẳng, đổ bóng sâu (4/10) */}
                  <div className="lg:col-span-4 flex items-center justify-center lg:justify-end overflow-hidden relative">
                    
                    {/* Nút Chỉnh sửa — góc phải trên banner */}
                    {canManageProducts && (
                      <button
                        className="absolute top-0 right-0 bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold text-xs rounded-xl px-4 py-2 flex items-center gap-1.5 transition-all shadow-md z-25"
                        onClick={() => handleEditProduct(selectedProduct)}
                      >
                        <i className="fa fa-pen text-[11px]"></i> Chỉnh sửa
                      </button>
                    )}

                    <div
                      className="rounded-2xl overflow-hidden shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] border border-white/15 transition-transform duration-300 hover:scale-[1.02]"
                      style={{ width: "100%", maxWidth: "380px", height: "230px", flexShrink: 0 }}
                    >
                      <img src={pImg} alt={selectedProduct.name} className="w-full h-full object-cover" />
                    </div>
                  </div>
                </div>
              </div>

              {/* ── CONTENT ── */}
              <div className="p-6 md:p-8 lg:p-10">
                <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">

                  {/* LEFT: Main content (7/10) */}
                  <div className="lg:col-span-7 space-y-8">

                    {/* Mô tả chi tiết */}
                    {selectedProduct.detailDescription && (
                      <div>
                        <h4 className="font-bold text-slate-800 app-dark:text-slate-100! text-sm mb-4 flex items-center gap-2">
                          <i className="fa fa-align-left text-[#005bbf]"></i>
                          <span className="text-[#005bbf] uppercase tracking-wide text-xs">Giới thiệu chương trình</span>
                        </h4>
                        <div className="space-y-4">
                          {selectedProduct.detailDescription.split("\n\n").map((para, idx) => (
                            <p key={idx} className="text-slate-600 app-dark:text-slate-300! text-[14.5px] leading-relaxed m-0 border-l-3 border-[#005bbf]/25 pl-4 py-0.5">
                              {para}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Đối tượng phù hợp */}
                    {selectedProduct.targetAudience && (
                      <div className="flex gap-4 p-5 rounded-2xl bg-cyan-50/50 app-dark:bg-white/3! border border-cyan-100/50 app-dark:border-white/8!">
                        <div className="w-10 h-10 rounded-xl bg-[#005bbf] text-white flex items-center justify-center shrink-0 text-sm shadow-md">
                          <i className="fa fa-users text-xs"></i>
                        </div>
                        <div>
                          <p className="font-bold text-[#005bbf] app-dark:text-blue-300! text-[10px] uppercase tracking-widest mb-1.5">Đối tượng phù hợp</p>
                          <p className="text-slate-600 app-dark:text-slate-300! text-[14px] leading-relaxed m-0">{selectedProduct.targetAudience}</p>
                        </div>
                      </div>
                    )}

                  </div>

                  {/* RIGHT: Sidebar (3/10) */}
                  <div className="lg:col-span-3 space-y-4">

                    {/* Card tài liệu & brochure */}
                    <div className="bg-slate-50 app-dark:bg-white/3! rounded-2xl border border-slate-200 app-dark:border-white/8! overflow-hidden shadow-sm">
                      <div className="px-4 py-3.5 border-b border-slate-200 app-dark:border-white/8! flex items-center gap-2 bg-slate-100/50 app-dark:bg-white/2!">
                        <div className="w-7 h-7 bg-[#005bbf]/10 rounded-lg flex items-center justify-center">
                          <i className="fa fa-folder-open text-[#005bbf] text-sm"></i>
                        </div>
                        <span className="font-bold text-slate-700 app-dark:text-slate-200! text-sm">Tài liệu & Brochure</span>
                      </div>

                      <div className="p-4 space-y-4">
                        {/* Brochure */}
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Brochure chính thức</p>
                          {selectedProduct.brochure ? (
                            <div className="bg-white app-dark:bg-[#252525]! border border-slate-200/80 app-dark:border-white/10! rounded-xl p-3 flex justify-between items-center gap-2 shadow-xs">
                              <div className="flex items-center gap-2 min-w-0">
                                {selectedProduct.brochure.sourceType === "link" ? (
                                  <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                                    <i className="fa fa-link text-[#005bbf] text-xs"></i>
                                  </div>
                                ) : selectedProduct.brochure.fileType === "IMAGE" ? (
                                  selectedProduct.brochure.url ? (
                                    <img src={selectedProduct.brochure.url} alt="preview" className="rounded-lg w-7 h-7 object-cover shrink-0 border border-slate-200" />
                                  ) : (
                                    <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0">
                                      <i className="fa fa-file-image text-emerald-500 text-xs"></i>
                                    </div>
                                  )
                                ) : (
                                  <div className="w-7 h-7 bg-red-50 rounded-lg flex items-center justify-center shrink-0">
                                    <i className="fa fa-file-pdf text-red-500 text-xs"></i>
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className="font-semibold text-xs text-slate-800 app-dark:text-slate-200! truncate m-0" title={selectedProduct.brochure.name}>{selectedProduct.brochure.name}</p>
                                  <p className="text-slate-400 text-[10px] m-0">{selectedProduct.brochure.size || "Link"}</p>
                                </div>
                              </div>
                              {selectedProduct.brochure.sourceType === "link" ? (
                                <button className="text-[#005bbf] border border-blue-200 bg-blue-50 hover:bg-blue-100 text-xs font-semibold py-1 px-3 rounded-lg shrink-0 transition-colors" onClick={() => handleOpenWebsite(selectedProduct.brochure.url)}>Mở</button>
                              ) : selectedProduct.brochure.fileType === "IMAGE" && selectedProduct.brochure.url ? (
                                <a href={selectedProduct.brochure.url} target="_blank" rel="noreferrer" className="text-[#005bbf] border border-blue-200 bg-blue-50 hover:bg-blue-100 text-xs font-semibold py-1 px-3 rounded-lg shrink-0 transition-colors">Xem</a>
                              ) : (
                                <button className="text-[#005bbf] border border-blue-200 bg-blue-50 hover:bg-blue-100 text-xs font-semibold py-1 px-3 rounded-lg shrink-0 transition-colors" onClick={() => handleDownloadDoc(selectedProduct.brochure.name)}>Tải</button>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 py-2.5 px-3 bg-white app-dark:bg-white/3! border border-dashed border-slate-200 app-dark:border-white/10! rounded-xl">
                              <i className="fa fa-description text-slate-355 text-sm"></i>
                              <p className="text-slate-400 text-xs italic m-0">Chưa có brochure</p>
                            </div>
                          )}
                        </div>

                        {/* Tài liệu tư vấn */}
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Tài liệu hướng dẫn tư vấn</p>
                          {selectedProduct.documents && selectedProduct.documents.length > 0 ? (
                            <div className="flex flex-col gap-2">
                              {selectedProduct.documents.map((doc) => (
                                <div key={doc.id} className="bg-white app-dark:bg-[#252525]! border border-slate-200/80 app-dark:border-white/10! rounded-xl p-3 flex justify-between items-center gap-2 shadow-xs">
                                  <div className="flex items-center gap-2 min-w-0">
                                    {doc.sourceType === "link" ? (
                                      <div className="w-6 h-6 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                                        <i className="fa fa-link text-[#005bbf] text-[10px]"></i>
                                      </div>
                                    ) : (
                                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${doc.type === "PDF" ? "bg-red-50" : doc.type === "XLSX" ? "bg-emerald-50" : "bg-sky-50"}`}>
                                        <i className={`fa ${doc.type === "PDF" ? "fa-file-pdf text-red-500" : doc.type === "XLSX" ? "fa-file-excel text-emerald-500" : "fa-file-lines text-sky-500"} text-[10px]`}></i>
                                      </div>
                                    )}
                                    <div className="min-w-0">
                                      <p className="font-semibold text-xs text-slate-800 app-dark:text-slate-200! truncate m-0" title={doc.name}>{doc.name}</p>
                                      <p className="text-slate-400 text-[10px] m-0">{doc.size || "Link"} · {doc.updatedAt || "2026-06-01"}</p>
                                    </div>
                                  </div>
                                  {doc.sourceType === "link" ? (
                                    <button className="text-slate-650 border border-slate-200 hover:bg-slate-50 text-xs font-semibold py-1 px-3 rounded-lg shrink-0 transition-colors" onClick={() => handleOpenWebsite(doc.url)}>Mở</button>
                                  ) : (
                                    <button className="text-slate-650 border border-slate-200 hover:bg-slate-50 text-xs font-semibold py-1 px-3 rounded-lg shrink-0 transition-colors" onClick={() => handleDownloadDoc(doc.name)}>Tải</button>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 py-2.5 px-3 bg-white app-dark:bg-white/3! border border-dashed border-slate-200 app-dark:border-white/10! rounded-xl">
                              <i className="fa fa-menu-book text-slate-355 text-sm"></i>
                              <p className="text-slate-400 text-xs italic m-0">Chưa có tài liệu</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Nút Quan tâm sản phẩm */}
                    <button
                      className="w-full bg-red-600 hover:bg-red-700 text-white py-3.5 px-4 rounded-2xl font-bold shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm cursor-pointer"
                      onClick={handleOpenInterestModal}
                    >
                      <i className="fa fa-paper-plane"></i> Quan tâm sản phẩm
                    </button>
                  </div>
                </div>

                {/* ── ROW: Điểm nổi bật (7) + Quy trình (3) ── */}
                {(selectedProduct.highlights?.length > 0 || parsedSteps.length > 0) && (
                  <div className="grid grid-cols-1 lg:grid-cols-10 gap-8 mt-8 pt-8 border-t border-slate-100 app-dark:border-white/8!">

                    {/* Điểm nổi bật — 7/10 */}
                    {selectedProduct.highlights && selectedProduct.highlights.length > 0 && (
                      <div className="lg:col-span-7">
                        <h4 className="font-bold text-slate-800 app-dark:text-slate-100! text-sm mb-4 flex items-center gap-2">
                          <i className="fa fa-star text-amber-400"></i>
                          <span className="text-slate-700 app-dark:text-slate-200!">Điểm nổi bật</span>
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          {selectedProduct.highlights.map((hl, i) => (
                            <div
                              key={i}
                              className="flex items-start gap-3.5 p-4 rounded-xl bg-white app-dark:bg-white/3! border border-slate-200 app-dark:border-white/8! shadow-xs hover:border-[#005bbf]/30 hover:scale-[1.01] hover:shadow-sm transition-all duration-200"
                            >
                              <div className="w-8 h-8 bg-emerald-50 app-dark:bg-emerald-950/20! text-emerald-600 app-dark:text-emerald-400! rounded-lg flex items-center justify-center shrink-0">
                                <i className="fa fa-circle-check text-sm"></i>
                              </div>
                              <span className="text-slate-750 app-dark:text-slate-300! text-[13.5px] leading-relaxed">{hl}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quy trình xử lý — 3/10, stepper dọc rút gọn */}
                    {parsedSteps.length > 0 && (
                      <div className="lg:col-span-3">
                        <h4 className="font-bold text-slate-800 app-dark:text-slate-100! text-sm mb-5 flex items-center gap-2">
                          <i className="fa fa-list-check text-[#005bbf]"></i>
                          <span className="text-slate-700 app-dark:text-slate-200!">Quy trình xử lý</span>
                          <span className="ml-auto text-[10px] font-semibold text-slate-400 bg-slate-100 app-dark:bg-white/10! px-2 py-0.5 rounded-full">
                            {parsedSteps.length} bước
                          </span>
                        </h4>
                        
                        <div className="flex flex-col relative pl-6 border-l-2 border-slate-100 app-dark:border-white/8! space-y-6">
                          {parsedSteps.map((step, i) => (
                            <div key={i} className="relative">
                              {/* Circle number indicator */}
                              <div className="absolute left-[-35px] top-0 w-6 h-6 bg-[#005bbf] text-white font-bold rounded-full flex items-center justify-center text-[10px] shadow-md">
                                {i + 1}
                              </div>
                              <div>
                                <h5 className="font-bold text-slate-800 app-dark:text-slate-100! text-[13.5px] mb-1 leading-snug">
                                  {step.title}
                                </h5>
                                {step.description.map((desc, dIdx) => (
                                  <p key={dIdx} className="text-slate-500 app-dark:text-slate-400! text-xs leading-relaxed m-0 mt-1">
                                    {desc}
                                  </p>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Tags */}
                {selectedProduct.tags && selectedProduct.tags.length > 0 && (
                  <div className="flex items-center flex-wrap gap-2 mt-6 pt-6 border-t border-slate-100 app-dark:border-white/8!">
                    {selectedProduct.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="bg-blue-50 app-dark:bg-blue-900/20! text-[#005bbf] app-dark:text-blue-300! border border-blue-100 app-dark:border-blue-900/40! px-3 py-1 rounded-full text-xs font-semibold"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* MODAL: THÊM / SỬA DANH MỤC LỚN */}
        {editingCategory && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-6 z-1050 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-[650px] max-h-[90vh] flex flex-col overflow-hidden animate-slide-up">
              <div className="bg-slate-50 border-b border-slate-100 px-5 py-4 flex justify-between items-center">
                <h5 className="font-bold text-slate-800 text-base m-0">
                  {editingCategory === "new" ? "Thêm danh mục lớn mới" : "Sửa danh mục lớn"}
                </h5>
                <button className="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 w-8 h-8 rounded-lg flex items-center justify-center transition-colors" onClick={() => setEditingCategory(null)}>
                  <i className="fa fa-times"></i>
                </button>
              </div>

              <form onSubmit={handleSaveCategory} className="flex flex-col grow overflow-hidden">
                <div className="bg-slate-50/50 border-b border-slate-150 px-5 flex gap-4">
                  <button
                    type="button"
                    className={`border-b-2 px-1 py-3 text-[13.5px] font-semibold transition-all duration-200 ${activeCategoryTab === "info"
                      ? "text-cyan-900 border-cyan-900"
                      : "text-slate-400 border-transparent hover:text-slate-600"
                      }`}
                    onClick={() => setActiveCategoryTab("info")}
                  >
                    <i className="fa fa-info-circle mr-1.5"></i> 1. Thông tin danh mục
                  </button>
                  <button
                    type="button"
                    className={`border-b-2 px-1 py-3 text-[13.5px] font-semibold transition-all duration-200 ${activeCategoryTab === "programs"
                      ? "text-cyan-900 border-cyan-900"
                      : "text-slate-400 border-transparent hover:text-slate-600 disabled:opacity-40"
                      }`}
                    onClick={() => setActiveCategoryTab("programs")}
                    disabled={editingCategory === "new"}
                  >
                    <i className="fa fa-list-check mr-1.5"></i> 2. Sản phẩm con ({formCategory.programs?.length || 0})
                  </button>
                </div>

                <div className="p-6 overflow-y-auto text-[13.5px] grow">
                  {activeCategoryTab === "info" ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block font-semibold text-xs text-slate-500 mb-1.5">Tên danh mục lớn <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[13.5px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all"
                          placeholder="Ví dụ: Du học hè, Định cư..."
                          value={formCategory.name}
                          onChange={(e) => setFormCategory({ ...formCategory, name: e.target.value })}
                          required
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-xs text-slate-500 mb-1.5">Trạng thái hoạt động</label>
                        <select
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[13.5px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all cursor-pointer"
                          value={formCategory.status}
                          onChange={(e) => setFormCategory({ ...formCategory, status: e.target.value })}
                        >
                          <option value="active">Đang hoạt động</option>
                          <option value="coming_soon">Sắp mở</option>
                          <option value="inactive">Tạm ngưng</option>
                          <option value="hidden">Đã ẩn</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-xs text-slate-500 mb-1.5">Ảnh bìa danh mục</label>
                        {formCategory.coverImageUrl && (
                          <div className="mb-3 relative group">
                            <img
                              src={formCategory.coverImageUrl}
                              alt="Cover"
                              className="w-full h-40 object-cover rounded-xl border border-slate-200"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                            <button
                              type="button"
                              className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm transition-colors shadow-lg opacity-0 group-hover:opacity-100"
                              onClick={handleRemoveImage}
                            >
                              <i className="fa fa-times"></i>
                            </button>
                          </div>
                        )}

                        {!formCategory.coverImageUrl && (
                          <div className="mb-3 border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-cyan-400 transition-colors">
                            <i className="fa fa-image text-3xl text-slate-300 mb-2"></i>
                            <p className="text-sm text-slate-500">Chưa có ảnh</p>
                            <p className="text-xs text-slate-400 mt-1">Upload từ máy hoặc nhập link</p>
                          </div>
                        )}

                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-3">
                            <label className="flex-1 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 text-cyan-700 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors cursor-pointer text-center">
                              <i className="fa fa-upload mr-2"></i>
                              Chọn ảnh từ máy
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                              />
                            </label>
                            <span className="text-xs text-slate-400">(Tối đa 500KB)</span>
                          </div>

                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <hr className="flex-1 border-slate-200" />
                              <span className="text-xs text-slate-400 font-medium">HOẶC</span>
                              <hr className="flex-1 border-slate-200" />
                            </div>
                            <input
                              type="text"
                              placeholder="Dán link ảnh từ Internet (Unsplash, Google...)"
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-[13px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all"
                              value={formCategory.coverImageUrl?.startsWith('data:') ? '' : (formCategory.coverImageUrl || '')}
                              onChange={(e) => {
                                const value = e.target.value;
                                let finalValue = value;
                                if (value && !/^https?:\/\//i.test(value) && !value.startsWith('data:')) {
                                  if (value.includes('.') && value.length > 3) {
                                    finalValue = 'https://' + value;
                                  }
                                }
                                setFormCategory(prev => ({ ...prev, coverImageUrl: finalValue }));
                              }}
                            />
                          </div>
                        </div>

                        <div className="mt-4">
                          <p className="text-[10px] text-slate-400 mb-2">Chọn ảnh gợi ý nhanh:</p>
                          <div className="flex gap-2 flex-wrap">
                            {[
                              'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80',
                              'https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=800&q=80',
                              'https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?auto=format&fit=crop&w=800&q=80',
                              'https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7?auto=format&fit=crop&w=800&q=80',
                              'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80',
                            ].map((url, index) => (
                              <button
                                key={index}
                                type="button"
                                className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${formCategory.coverImageUrl === url
                                    ? 'border-cyan-500 ring-2 ring-cyan-500/20'
                                    : 'border-slate-200 hover:border-cyan-300'
                                  }`}
                                onClick={() => {
                                  setFormCategory(prev => ({ ...prev, coverImageUrl: url }));
                                }}
                              >
                                <img src={url} alt="suggestion" className="w-full h-full object-cover" />
                              </button>
                            ))}
                          </div>
                        </div>

                        <p className="text-[10px] text-slate-400 mt-3">
                          <i className="fa fa-info-circle mr-1"></i>
                          Ảnh được lưu dưới dạng Base64 hoặc URL. Nên dùng ảnh nhỏ hơn 500KB cho Base64.
                        </p>
                      </div>

                      <div>
                        <label className="block font-semibold text-xs text-slate-500 mb-1.5">Mô tả tóm tắt</label>
                        <textarea
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[13.5px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all"
                          rows="4"
                          placeholder="Mô tả ngắn gọn mục đích và nội dung cốt lõi của danh mục lớn này..."
                          value={formCategory.description}
                          onChange={(e) => setFormCategory({ ...formCategory, description: e.target.value })}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-slate-500 text-xs">Danh sách sản phẩm con thuộc danh mục:</span>
                        <button
                          type="button"
                          className="bg-cyan-900 hover:bg-cyan-950 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                          onClick={() => handleOpenNewProduct(formCategory.id)}
                        >
                          + Thêm sản phẩm con
                        </button>
                      </div>

                      {formCategory.programs && formCategory.programs.length > 0 ? (
                        <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
                          {formCategory.programs.map((prod) => (
                            <div key={prod.id} className="p-3 border border-slate-100 rounded-xl bg-slate-50 flex justify-between items-center">
                              <div className="text-truncate pr-4 grow" style={{ minWidth: 0 }}>
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="font-bold text-slate-800 text-[13px] block text-truncate" title={prod.name}>
                                    {prod.name}
                                  </span>
                                  {(prod.status === "hidden" || prod.isActive === false) && (
                                    <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-slate-200 text-slate-500">Đã ẩn</span>
                                  )}
                                  {prod.status === "inactive" && (
                                    <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-orange-100 text-orange-600">Tạm ngưng</span>
                                  )}
                                  {prod.status === "coming_soon" && (
                                    <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-yellow-100 text-yellow-700">Sắp mở</span>
                                  )}
                                </div>
                                <span className="text-slate-450 block text-[11px]">
                                  {prod.region} · {prod.country}
                                </span>
                              </div>
                              <div className="flex gap-2 shrink-0">
                                <button
                                  type="button"
                                  title={(prod.status === "hidden" || prod.isActive === false) ? "Hiện sản phẩm" : "Ẩn sản phẩm"}
                                  className={`bg-transparent text-xs font-semibold py-1 px-3 rounded-lg transition-colors border ${(prod.status === "hidden" || prod.isActive === false) ? "hover:bg-emerald-50 text-emerald-600 border-emerald-200" : "hover:bg-slate-100 text-slate-500 border-slate-200"}`}
                                  onClick={() => handleToggleProductStatus(prod)}
                                >
                                  {(prod.status === "hidden" || prod.isActive === false) ? "Hiện" : "Ẩn"}
                                </button>
                                <button
                                  type="button"
                                  className="bg-transparent hover:bg-amber-50 text-amber-600 border border-amber-200 text-xs font-semibold py-1 px-3 rounded-lg transition-colors"
                                  onClick={() => handleEditProduct(prod)}
                                >
                                  Sửa
                                </button>
                                <button
                                  type="button"
                                  className="bg-transparent hover:bg-red-50 text-red-600 border border-red-200 text-xs font-semibold py-1 px-3 rounded-lg transition-colors"
                                  onClick={() => handleDeleteProduct(prod.id)}
                                >
                                  Xóa
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 border-2 border-dashed border-slate-200 bg-slate-50 text-slate-400 text-xs rounded-xl">
                          Chưa có sản phẩm con nào trong danh mục này. Bấm nút phía trên để tạo mới.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 p-4 border-t border-slate-100 flex flex-col sm:flex-row gap-2.5 sm:gap-3 justify-end">
                  {editingCategory !== "new" && (
                    <button
                      type="button"
                      className="order-3 sm:order-1 w-full sm:w-auto sm:mr-auto bg-transparent hover:bg-red-50 text-red-650 border border-red-200 hover:border-red-350 text-xs font-semibold py-2.5 px-4 rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5"
                      onClick={() => handleDeleteCategory(editingCategory)}
                    >
                      <i className="fa fa-trash-can text-sm"></i> Xóa danh mục
                    </button>
                  )}
                  <button type="button" className="order-2 sm:order-2 w-full sm:w-auto bg-transparent hover:bg-slate-150 text-slate-650 border border-slate-250 text-xs font-semibold py-2.5 px-4 rounded-xl transition-colors cursor-pointer flex items-center justify-center" onClick={() => setEditingCategory(null)}>
                    Hủy bỏ
                  </button>
                  <button type="submit" className="order-1 sm:order-3 w-full sm:w-auto bg-cyan-900 hover:bg-cyan-950 text-white text-xs font-semibold py-2.5 px-5 rounded-xl transition-colors cursor-pointer flex items-center justify-center">
                    {editingCategory === "new" ? "Lưu danh mục" : "Cập nhật danh mục"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: THÊM / SỬA SẢN PHẨM CON */}
        {editingProduct && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-6 z-1060 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-[1000px] max-h-[90vh] flex flex-col overflow-hidden animate-slide-up">
              <div className="bg-slate-50 border-b border-slate-100 px-5 py-4 flex justify-between items-center">
                <h5 className="font-bold text-slate-800 text-base m-0">
                  {editingProduct === "new" ? "Thêm sản phẩm con mới" : "Sửa thông tin sản phẩm con"}
                </h5>
                <button className="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 w-8 h-8 rounded-lg flex items-center justify-center transition-colors" onClick={() => setEditingProduct(null)}>
                  <i className="fa fa-times"></i>
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="flex flex-col grow overflow-hidden">
                <div className="bg-slate-50/50 border-b border-slate-150 px-5 flex gap-4">
                  <button
                    type="button"
                    className={`border-b-2 px-1 py-3 text-[13.5px] font-semibold transition-all duration-200 ${activeProductTab === "basic"
                      ? "text-cyan-900 border-cyan-900"
                      : "text-slate-400 border-transparent hover:text-slate-600"
                      }`}
                    onClick={() => setActiveProductTab("basic")}
                  >
                    <i className="fa fa-info-circle mr-1.5"></i> 1. Thông tin cơ bản
                  </button>
                  <button
                    type="button"
                    className={`border-b-2 px-1 py-3 text-[13.5px] font-semibold transition-all duration-200 ${activeProductTab === "content"
                      ? "text-cyan-900 border-cyan-900"
                      : "text-slate-400 border-transparent hover:text-slate-600"
                      }`}
                    onClick={() => setActiveProductTab("content")}
                  >
                    <i className="fa fa-file-invoice mr-1.5"></i> 2. Nội dung tư vấn
                  </button>
                  <button
                    type="button"
                    className={`border-b-2 px-1 py-3 text-[13.5px] font-semibold transition-all duration-200 ${activeProductTab === "docs"
                      ? "text-cyan-900 border-cyan-900"
                      : "text-slate-400 border-transparent hover:text-slate-600"
                      }`}
                    onClick={() => setActiveProductTab("docs")}
                  >
                    <i className="fa fa-file-pdf mr-1.5"></i> 3. Tài liệu ({formProduct.brochure ? 1 : 0} Brochure / {formProduct.documents?.length || 0} Tư vấn)
                  </button>
                </div>

                <div className="p-6 overflow-y-auto text-[13.5px] grow">
                  {/* TAB 1: BASIC INFORMATION */}
                  {activeProductTab === "basic" && (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      <div className="md:col-span-6">
                        <label className="block font-semibold text-xs text-slate-500 mb-1.5">Tên sản phẩm <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[13.5px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all"
                          value={formProduct.name}
                          onChange={(e) => setFormProduct({ ...formProduct, name: e.target.value })}
                          placeholder="Ví dụ: Du học hè tiếng Anh Philippines"
                          required
                        />
                      </div>
                      <div className="md:col-span-6">
                        <label className="block font-semibold text-xs text-slate-500 mb-1.5">Thuộc danh mục lớn <span className="text-red-500">*</span></label>
                        <select
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[13.5px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all cursor-pointer"
                          value={formProduct.categoryId}
                          onChange={(e) => setFormProduct({ ...formProduct, categoryId: e.target.value, categoryName: categories.find(c => c.id === e.target.value)?.name || "" })}
                          required
                        >
                          <option value="">-- Chọn danh mục lớn --</option>
                          {categories.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-1 md:col-span-4">
                        <label className="block font-semibold text-xs text-slate-500 mb-1.5">Quốc gia <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[13.5px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all"
                          value={formProduct.country}
                          onChange={(e) => setFormProduct({ ...formProduct, country: e.target.value })}
                          placeholder="Ví dụ: Đức, Hàn Quốc"
                          required
                        />
                      </div>
                      <div className="col-span-1 md:col-span-4">
                        <label className="block font-semibold text-xs text-slate-500 mb-1.5">Khu vực địa lý</label>
                        <select
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[13.5px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all cursor-pointer"
                          value={formProduct.region}
                          onChange={(e) => setFormProduct({ ...formProduct, region: e.target.value })}
                        >
                          <option value="Châu Á">Châu Á</option>
                          <option value="Châu Âu">Châu Âu</option>
                          <option value="Châu Mỹ">Châu Mỹ</option>
                          <option value="Châu Đại Dương">Châu Đại Dương</option>
                          <option value="Châu Phi">Châu Phi</option>
                          <option value="Trung Đông">Trung Đông</option>
                        </select>
                      </div>
                      <div className="col-span-1 md:col-span-4">
                        <label className="block font-semibold text-xs text-slate-500 mb-1.5">Trạng thái sản phẩm</label>
                        <select
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[13.5px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all cursor-pointer"
                          value={formProduct.status}
                          onChange={(e) => setFormProduct({ ...formProduct, status: e.target.value })}
                        >
                          <option value="active">Đang hoạt động</option>
                          <option value="inactive">Tạm ngưng</option>
                        </select>
                      </div>

                      <div className="col-span-1 md:col-span-4">
                        <label className="block font-semibold text-xs text-slate-500 mb-1.5">Mã Visa hệ thống (visaCode)</label>
                        <input
                          type="text"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[13.5px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all"
                          value={formProduct.visaCode || ""}
                          onChange={(e) => setFormProduct({ ...formProduct, visaCode: e.target.value })}
                          placeholder="Ví dụ: DE-STUDY-LANG-D41"
                        />
                      </div>
                      <div className="col-span-1 md:col-span-4">
                        <label className="block font-semibold text-xs text-slate-500 mb-1.5">Mã ngắn nội bộ (shortCode)</label>
                        <input
                          type="text"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[13.5px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all"
                          value={formProduct.shortCode || ""}
                          onChange={(e) => setFormProduct({ ...formProduct, shortCode: e.target.value })}
                          placeholder="Ví dụ: VIS-DE-01"
                        />
                      </div>
                      <div className="col-span-1 md:col-span-4">
                        <label className="block font-semibold text-xs text-slate-500 mb-1.5">Mục đích phân loại (purpose)</label>
                        <input
                          type="text"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[13.5px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all"
                          value={formProduct.purpose || ""}
                          onChange={(e) => setFormProduct({ ...formProduct, purpose: e.target.value })}
                          placeholder="Ví dụ: Du học nghề Đức"
                        />
                      </div>

                      <div className="md:col-span-12">
                        <label className="block font-semibold text-xs text-slate-500 mb-1.5">Ảnh đại diện sản phẩm</label>
                        <div className="flex items-stretch gap-0 rounded-xl overflow-hidden border border-slate-200 focus-within:ring-2 focus-within:ring-cyan-900/10 focus-within:border-cyan-900 transition-all">
                          <input
                            type="text"
                            className="flex-1 bg-slate-50 px-4 py-2.5 text-[13.5px] text-slate-700 placeholder-slate-400 focus:outline-none"
                            value={formProduct.image?.startsWith("data:") ? "" : (formProduct.image || "")}
                            onChange={(e) => setFormProduct({ ...formProduct, image: e.target.value })}
                            placeholder="https://example.com/image.jpg"
                            disabled={formProduct.image?.startsWith("data:")}
                          />
                          <label className="shrink-0 flex items-center gap-1.5 cursor-pointer bg-slate-100 hover:bg-slate-200 border-l border-slate-200 text-slate-600 text-xs font-semibold px-4 py-2.5 transition-colors whitespace-nowrap">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            Chọn file
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp,image/gif"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                if (file.size > 500 * 1024) {
                                  toast.warning("Ảnh quá lớn! Vui lòng chọn ảnh nhỏ hơn 500KB", "File quá lớn");
                                  e.target.value = "";
                                  return;
                                }
                                const reader = new FileReader();
                                reader.onload = (ev) => {
                                  setFormProduct(prev => ({ ...prev, image: ev.target.result }));
                                  toast.success("Đã chọn ảnh thành công!", "Upload ảnh");
                                };
                                reader.onerror = () => toast.error("Không thể đọc file", "Lỗi");
                                reader.readAsDataURL(file);
                                e.target.value = "";
                              }}
                            />
                          </label>
                        </div>

                        {formProduct.image && (
                          <div className="mt-2 relative inline-block">
                            <img
                              src={formProduct.image}
                              alt="preview"
                              className="h-20 rounded-xl border border-slate-200 object-cover"
                              onError={(e) => { e.target.style.display = "none"; }}
                            />
                            <button
                              type="button"
                              className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs transition-colors"
                              onClick={() => setFormProduct({ ...formProduct, image: "" })}
                            >×</button>
                          </div>
                        )}

                        {formProduct.image?.startsWith("data:") && (
                          <p className="text-[11px] text-slate-400 mt-1">Ảnh đã được chuyển sang Base64 — sẽ lưu cùng dữ liệu sản phẩm</p>
                        )}
                      </div>

                      <div className="md:col-span-12">
                        <label className="block font-semibold text-xs text-slate-500 mb-2">Bảng màu gradient banner</label>
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-slate-500 whitespace-nowrap">Màu bắt đầu</label>
                            <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-slate-200 cursor-pointer shadow-sm">
                              <input
                                type="color"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                value={formProduct.gradientFrom || "#0d2040"}
                                onChange={(e) => setFormProduct({ ...formProduct, gradientFrom: e.target.value })}
                              />
                              <div className="w-full h-full rounded-lg" style={{ background: formProduct.gradientFrom || "#0d2040" }} />
                            </div>
                            <input
                              type="text"
                              className="w-24 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-[12px] text-slate-700 font-mono focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all"
                              value={formProduct.gradientFrom || "#0d2040"}
                              onChange={(e) => setFormProduct({ ...formProduct, gradientFrom: e.target.value })}
                              placeholder="#0d2040"
                            />
                          </div>

                          <svg className="w-4 h-4 text-slate-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>

                          <div className="flex items-center gap-2">
                            <label className="text-xs text-slate-500 whitespace-nowrap">Màu kết thúc</label>
                            <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-slate-200 cursor-pointer shadow-sm">
                              <input
                                type="color"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                value={formProduct.gradientTo || "#1a3a6b"}
                                onChange={(e) => setFormProduct({ ...formProduct, gradientTo: e.target.value })}
                              />
                              <div className="w-full h-full rounded-lg" style={{ background: formProduct.gradientTo || "#1a3a6b" }} />
                            </div>
                            <input
                              type="text"
                              className="w-24 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-[12px] text-slate-700 font-mono focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all"
                              value={formProduct.gradientTo || "#1a3a6b"}
                              onChange={(e) => setFormProduct({ ...formProduct, gradientTo: e.target.value })}
                              placeholder="#1a3a6b"
                            />
                          </div>

                          <div
                            className="flex-1 min-w-[120px] h-9 rounded-lg border border-slate-200 shadow-sm"
                            style={{ background: `linear-gradient(135deg, ${formProduct.gradientFrom || "#0d2040"} 0%, ${formProduct.gradientTo || "#1a3a6b"} 100%)` }}
                          />

                          <button
                            type="button"
                            className="text-xs text-slate-400 hover:text-slate-600 underline underline-offset-2 whitespace-nowrap"
                            onClick={() => setFormProduct({ ...formProduct, gradientFrom: "#0d2040", gradientTo: "#1a3a6b" })}
                          >
                            Đặt lại
                          </button>
                        </div>
                      </div>

                      <div className="md:col-span-12">
                        <label className="block font-semibold text-xs text-slate-500 mb-1.5">Link trang web sản phẩm</label>
                        <input
                          type="text"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[13.5px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all"
                          value={formProduct.websiteUrl}
                          onChange={(e) => setFormProduct({ ...formProduct, websiteUrl: e.target.value })}
                          placeholder="Ví dụ: https://htocean.edu.vn/du-hoc-he-singapore"
                        />
                        <span className="text-slate-450 block mt-1.5 text-[11px]">
                          Dán link WordPress/public landing page của sản phẩm để CTV mở xem khi cần.
                        </span>
                      </div>

                      <div className="md:col-span-12">
                        <label className="block font-semibold text-xs text-slate-500 mb-1.5">Mô tả tóm tắt chương trình</label>
                        <textarea
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[13.5px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all"
                          rows="3"
                          value={formProduct.description}
                          onChange={(e) => setFormProduct({ ...formProduct, description: e.target.value })}
                          placeholder="Nhập mô tả ngắn gọn giới thiệu chung về chương trình..."
                        />
                      </div>
                    </div>
                  )}

                  {/* TAB 2: CONSULTING CONTENT */}
                  {activeProductTab === "content" && (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      <div className="md:col-span-12">
                        <label className="block font-semibold text-xs text-slate-500 mb-1.5">Mô tả chi tiết chương trình</label>
                        <textarea
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[13.5px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all"
                          rows="4"
                          value={formProduct.detailDescription}
                          onChange={(e) => setFormProduct({ ...formProduct, detailDescription: e.target.value })}
                          placeholder="Nhập nội dung chi tiết lộ trình học tập, chỗ ở, thời gian biểu..."
                        />
                      </div>

                      <div className="md:col-span-12">
                        <label className="block font-semibold text-xs text-slate-500 mb-1.5">Đối tượng phù hợp tuyển sinh</label>
                        <input
                          type="text"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[13.5px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all"
                          value={formProduct.targetAudience}
                          onChange={(e) => setFormProduct({ ...formProduct, targetAudience: e.target.value })}
                          placeholder="Ví dụ: Học sinh từ 7 đến 17 tuổi..."
                        />
                      </div>

                      <div className="md:col-span-6">
                        <label className="block font-semibold text-xs text-slate-500 mb-1.5">Điểm nổi bật (Mỗi dòng một điểm nổi bật)</label>
                        <textarea
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[13.5px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all"
                          rows="4"
                          value={formProduct.highlightsText}
                          onChange={(e) => setFormProduct({ ...formProduct, highlightsText: e.target.value })}
                          placeholder="Ví dụ:&#10;Học 1 kèm 1 với giáo viên bản ngữ&#10;Hỗ trợ 24/7..."
                        />
                      </div>

                      <div className="md:col-span-6">
                        <label className="block font-semibold text-xs text-slate-500 mb-1.5">Các bước quy trình (Mỗi dòng một bước)</label>
                        <textarea
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[13.5px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all"
                          rows="4"
                          value={formProduct.processStepsText}
                          onChange={(e) => setFormProduct({ ...formProduct, processStepsText: e.target.value })}
                          placeholder="Ví dụ:&#10;Tư vấn chọn lịch trình&#10;Nộp phí ghi danh&#10;Phỏng vấn chọn trường..."
                        />
                      </div>

                      <div className="md:col-span-12">
                        <label className="block font-semibold text-xs text-slate-500 mb-1.5">Tags nhãn dán (Ngăn cách bởi dấu phẩy)</label>
                        <input
                          type="text"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[13.5px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all"
                          value={formProduct.tagsText}
                          onChange={(e) => setFormProduct({ ...formProduct, tagsText: e.target.value })}
                          placeholder="Chất lượng cao, Miễn học phí, Cơ hội PR"
                        />
                      </div>
                    </div>
                  )}

                  {/* TAB 3: DOCUMENTS */}
                  {activeProductTab === "docs" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 h-full flex flex-col justify-start gap-4">
                          <div>
                            <label className="block font-bold text-cyan-900 text-[14px] mb-2">
                              <i className="fa fa-file-invoice text-cyan-900 mr-2"></i>Tài liệu chính (Brochure)
                            </label>
                            <p className="text-slate-400 text-xs mb-3">Hỗ trợ PDF, hình ảnh hoặc link tài liệu</p>

                            <div
                              className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all duration-200 cursor-pointer ${isBrochureDragging
                                ? "border-cyan-600 bg-cyan-50/50"
                                : "border-slate-300 bg-white hover:bg-slate-55"
                                }`}
                              onDragOver={handleBrochureDragOver}
                              onDragLeave={handleBrochureDragLeave}
                              onDrop={handleBrochureDrop}
                            >
                              <input
                                type="file"
                                className="hidden"
                                id="prod-brochure-file"
                                accept="application/pdf,image/*"
                                onChange={handleProductBrochureUpload}
                              />
                              <label htmlFor="prod-brochure-file" style={{ cursor: "pointer" }} className="w-full m-0 block">
                                <i className="fa fa-cloud-arrow-up text-cyan-900 text-2xl mb-2 block"></i>
                                <span className="text-xs font-semibold text-cyan-900 block">
                                  {isBrochureDragging ? "Thả file để tải lên" : "Kéo thả Brochure hoặc bấm để chọn file"}
                                </span>
                                <span className="text-slate-400 block mt-1 text-[10px]">Hỗ trợ PDF, hình ảnh hoặc link tài liệu</span>
                              </label>
                            </div>

                            <div className="flex items-center my-4">
                              <hr className="grow border-slate-200 my-0" />
                              <span className="mx-3 text-slate-400 text-xs font-semibold uppercase tracking-wider">hoặc</span>
                              <hr className="grow border-slate-200 my-0" />
                            </div>

                            <div>
                              <label className="block font-semibold text-xs text-slate-500 mb-1.5">Link Brochure</label>
                              <div className="flex rounded-xl overflow-hidden border border-slate-200 bg-white">
                                <input
                                  type="text"
                                  className="w-full px-3 py-1.5 text-xs text-slate-705 placeholder-slate-400 focus:outline-none"
                                  placeholder="Ví dụ: https://drive.google.com/..."
                                  value={brochureLinkInput}
                                  onChange={(e) => setBrochureLinkInput(e.target.value)}
                                />
                                <button
                                  type="button"
                                  className="bg-cyan-900 hover:bg-cyan-950 text-white text-xs font-semibold px-4 transition-colors"
                                  onClick={handleAddBrochureLink}
                                >
                                  Gắn link
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="mt-auto pt-3 border-t border-slate-100">
                            <label className="font-semibold text-slate-500 text-xs mb-2 block">Brochure hiện tại:</label>
                            {formProduct.brochure ? (
                              <div className="flex items-center justify-between p-2.5 border border-slate-100 rounded-xl bg-white shadow-sm">
                                <div className="text-truncate pr-3 flex items-center" style={{ minWidth: 0 }}>
                                  {formProduct.brochure.sourceType === "link" ? (
                                    <i className="fa fa-link text-cyan-900 mr-2 text-base shrink-0"></i>
                                  ) : formProduct.brochure.fileType === "IMAGE" ? (
                                    formProduct.brochure.url ? (
                                      <img
                                        src={formProduct.brochure.url}
                                        alt="preview"
                                        className="rounded border mr-2 w-8 h-8 object-cover shrink-0"
                                      />
                                    ) : (
                                      <i className="fa fa-file-image text-emerald-600 mr-2 text-base shrink-0"></i>
                                    )
                                  ) : (
                                    <i className="fa fa-file-pdf text-red-500 mr-2 text-base shrink-0"></i>
                                  )}
                                  <div className="text-truncate" style={{ minWidth: 0 }}>
                                    <span
                                      className="font-bold text-slate-800 text-xs block text-truncate"
                                      title={formProduct.brochure.name}
                                      style={{ maxWidth: "160px" }}
                                    >
                                      {formProduct.brochure.name}
                                    </span>
                                    <span className="text-slate-405 block text-[10px] text-truncate mt-0.5">
                                      {formProduct.brochure.sourceType === "link" ? (
                                        <span className="text-cyan-700 font-medium">Link đính kèm</span>
                                      ) : formProduct.brochure.fileType === "IMAGE" ? (
                                        <span>Ảnh tải lên ({formProduct.brochure.size})</span>
                                      ) : (
                                        <span>File tải lên ({formProduct.brochure.size})</span>
                                      )}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex gap-1.5 items-center shrink-0">
                                  {formProduct.brochure.sourceType === "link" && (
                                    <button
                                      type="button"
                                      className="bg-transparent hover:bg-slate-50 text-cyan-900 border border-slate-200 text-[11px] font-semibold px-2 py-1 rounded"
                                      onClick={() => handleOpenWebsite(formProduct.brochure.url)}
                                    >
                                      Mở link
                                    </button>
                                  )}
                                  {formProduct.brochure.fileType === "IMAGE" && formProduct.brochure.url && (
                                    <a
                                      href={formProduct.brochure.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="bg-transparent hover:bg-slate-50 text-cyan-900 border border-slate-200 text-[11px] font-semibold px-2 py-1 rounded text-decoration-none inline-block text-center leading-normal"
                                    >
                                      Xem ảnh
                                    </a>
                                  )}
                                  <button
                                    type="button"
                                    className="bg-transparent hover:bg-red-550 hover:text-white text-red-650 border border-red-200 text-[11px] font-semibold px-2 py-1 rounded"
                                    onClick={removeProductBrochure}
                                  >
                                    <i className="fa fa-trash-can"></i> Gỡ
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="text-slate-400 text-xs italic text-center py-3 border border-dashed border-slate-200 bg-white/50 rounded-xl">Chưa có Brochure</div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 h-full flex flex-col justify-between">
                          <div>
                            <label className="block font-bold text-sky-900 text-[14px] mb-2">
                              <i className="fa fa-folder-open text-sky-800 mr-2"></i>Tài liệu hướng dẫn tư vấn kèm theo
                            </label>
                            <p className="text-slate-400 text-xs mb-3">Tải lên file hoặc gắn link tài liệu tư vấn nội bộ.</p>

                            <div
                              className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all duration-200 cursor-pointer ${isDocsDragging
                                ? "border-sky-500 bg-sky-50/50"
                                : "border-slate-300 bg-white hover:bg-slate-50"
                                }`}
                              onDragOver={handleDocsDragOver}
                              onDragLeave={handleDocsDragLeave}
                              onDrop={handleDocsDrop}
                            >
                              <input
                                type="file"
                                multiple
                                className="hidden"
                                id="prod-docs-file"
                                onChange={handleProductDocsUpload}
                              />
                              <label htmlFor="prod-docs-file" style={{ cursor: "pointer" }} className="w-full m-0 block">
                                <i className="fa fa-cloud-arrow-up text-sky-800 text-2xl mb-2 block"></i>
                                <span className="text-xs font-semibold text-sky-800 block">
                                  {isDocsDragging ? "Thả file để tải lên" : "Kéo thả tài liệu hoặc bấm để chọn file"}
                                </span>
                                <span className="text-slate-400 block mt-1 text-[10px]">Hỗ trợ PDF, DOCX, XLSX hoặc link tài liệu</span>
                              </label>
                            </div>

                            <div className="flex items-center my-4">
                              <hr className="grow border-slate-200 my-0" />
                              <span className="mx-3 text-slate-400 text-xs font-semibold uppercase tracking-wider">hoặc</span>
                              <hr className="grow border-slate-200 my-0" />
                            </div>

                            <div className="p-3 border border-slate-150 rounded-xl bg-white shadow-sm mb-3 space-y-2">
                              <span className="font-semibold text-slate-500 text-xs block mb-1">Gắn link tài liệu mới</span>
                              <div className="space-y-2">
                                <input
                                  type="text"
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none"
                                  placeholder="Tên tài liệu..."
                                  value={docLinkNameInput}
                                  onChange={(e) => setDocLinkNameInput(e.target.value)}
                                />
                                <input
                                  type="text"
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none"
                                  placeholder="Link tài liệu (ví dụ: drive.google.com/...)"
                                  value={docLinkUrlInput}
                                  onChange={(e) => setDocLinkUrlInput(e.target.value)}
                                />
                                <div className="flex gap-2">
                                  <select
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none cursor-pointer"
                                    value={docLinkTypeInput}
                                    onChange={(e) => setDocLinkTypeInput(e.target.value)}
                                  >
                                    <option value="Checklist">Checklist</option>
                                    <option value="Bảng phí">Bảng phí</option>
                                    <option value="Quy trình tư vấn">Quy trình tư vấn</option>
                                    <option value="FAQ">FAQ</option>
                                    <option value="Mẫu form khách hàng">Mẫu form khách hàng</option>
                                    <option value="Khác">Khác</option>
                                  </select>
                                  <button
                                    type="button"
                                    className="bg-sky-800 hover:bg-sky-900 text-white text-xs font-semibold px-4 rounded-lg transition-colors shrink-0"
                                    onClick={handleAddDocLink}
                                  >
                                    Thêm link
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="mt-3">
                            <span className="fw-semibold text-slate-500 text-xs block mb-2">Các tài liệu tư vấn đính kèm:</span>
                            {formProduct.documents && formProduct.documents.length > 0 ? (
                              <div className="flex flex-col gap-2 max-h-[150px] overflow-y-auto pr-1">
                                {formProduct.documents.map((doc) => (
                                  <div key={doc.id} className="flex items-center justify-between p-2.5 border border-slate-100 rounded-xl bg-white shadow-sm">
                                    <div className="text-truncate pr-3 flex items-center" style={{ minWidth: 0 }}>
                                      {doc.sourceType === "link" ? (
                                        <i className="fa fa-link text-sky-850 mr-2 text-base shrink-0"></i>
                                      ) : (
                                        <i className={`fa ${doc.type === "PDF" ? "fa-file-pdf text-red-500" : (doc.type === "XLSX" ? "fa-file-excel text-emerald-650" : "fa-file-word text-primary")} mr-2 text-base shrink-0`}></i>
                                      )}
                                      <div className="text-truncate" style={{ minWidth: 0 }}>
                                        <span className="font-bold text-slate-800 text-xs block text-truncate" title={doc.name}>
                                          {doc.name}
                                        </span>
                                        <span className="text-slate-400 block text-[10px] mt-0.5">
                                          {doc.sourceType === "link" ? (
                                            <span className="text-sky-700 font-semibold">{doc.type} (Link)</span>
                                          ) : (
                                            <span>File ({doc.size})</span>
                                          )}
                                        </span>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      className="bg-transparent hover:bg-red-50 text-red-600 border border-red-200 text-xs font-semibold py-1 px-3 rounded-lg transition-colors shrink-0"
                                      onClick={() => deleteProductDoc(doc.id)}
                                    >
                                      Xóa
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-slate-400 text-xs italic text-center py-3 border border-dashed border-slate-200 bg-white/50 rounded-xl">Chưa có tài liệu đính kèm</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 p-4 border-t border-slate-100 flex flex-col sm:flex-row gap-2.5 sm:gap-3 justify-end">
                  <button type="button" className="order-2 sm:order-1 w-full sm:w-auto bg-transparent hover:bg-slate-150 text-slate-650 border border-slate-250 text-xs font-semibold py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center" onClick={() => setEditingProduct(null)}>
                    Hủy bỏ
                  </button>
                  <button type="submit" className="order-1 sm:order-2 w-full sm:w-auto bg-cyan-900 hover:bg-cyan-950 text-white text-xs font-semibold py-2.5 px-5 rounded-xl transition-colors flex items-center justify-center">
                    Lưu thay đổi
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: FORM QUAN TÂM SẢN PHẨM */}
        {showInterestModal && selectedProduct && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-6 z-1050 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-[550px] flex flex-col animate-slide-up" style={{ maxHeight: "90vh", overflow: "hidden" }}>
              <div className="bg-slate-50 border-b border-slate-100 px-5 py-4 flex justify-between items-center">
                <h5 className="font-bold text-slate-800 text-base m-0 flex items-center gap-2">
                  <i className="fa fa-envelope-open-text text-red-500"></i> Đăng ký khách hàng quan tâm
                </h5>
                <button className="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 w-8 h-8 rounded-lg flex items-center justify-center transition-colors" onClick={handleCloseInterestModal}>
                  <i className="fa fa-times"></i>
                </button>
              </div>

              <form id="interestForm" onSubmit={handleSubmitInterest} className="flex-1 min-h-0 overflow-y-auto">
                <div className="p-5 text-[13.5px]">
                  <div className="mb-3">
                    <label className="block font-semibold text-xs text-slate-500 mb-1.5">Sản phẩm quan tâm</label>
                    <input
                      type="text"
                      className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2 text-[13.5px] text-slate-600 focus:outline-none"
                      value={selectedProduct.name}
                      readOnly
                    />
                  </div>

                  <div className="mb-3">
                    <label className="block font-semibold text-xs text-slate-500 mb-1.5">Họ tên khách hàng <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      className={`w-full bg-slate-50 border rounded-xl px-4 py-2 text-[13.5px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all disabled:opacity-50 ${
                        interestInvalidFields.includes("customerName") ? "border-red-500 focus:ring-red-500/10 focus:border-red-500" : "border-slate-200"
                      }`}
                      placeholder="Ví dụ: Nguyễn Văn A"
                      value={interestForm.customerName}
                      onChange={(e) => {
                        setInterestForm({ ...interestForm, customerName: e.target.value });
                        if (interestInvalidFields.includes("customerName")) {
                          setInterestInvalidFields(prev => prev.filter(f => f !== "customerName"));
                        }
                      }}
                      required
                      disabled={isSubmittingInterest}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block font-semibold text-xs text-slate-500 mb-1.5">Số điện thoại <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        className={`w-full bg-slate-50 border rounded-xl px-4 py-2 text-[13.5px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all disabled:opacity-50 ${
                          interestInvalidFields.includes("phone") ? "border-red-500 focus:ring-red-500/10 focus:border-red-500" : "border-slate-200"
                        }`}
                        placeholder="Ví dụ: 0987654321"
                        value={interestForm.phone}
                        onChange={(e) => {
                          setInterestForm({ ...interestForm, phone: e.target.value });
                          if (interestInvalidFields.includes("phone")) {
                            setInterestInvalidFields(prev => prev.filter(f => f !== "phone"));
                          }
                        }}
                        required
                        disabled={isSubmittingInterest}
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-xs text-slate-500 mb-1.5">Email (nếu có)</label>
                      <input
                        type="email"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[13.5px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all disabled:opacity-50"
                        placeholder="customer@email.com"
                        value={interestForm.email}
                        onChange={(e) => setInterestForm({ ...interestForm, email: e.target.value })}
                        disabled={isSubmittingInterest}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block font-semibold text-xs text-slate-500 mb-1.5">Người phụ trách / CTV giới thiệu</label>
                      <input
                        type="text"
                        className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2 text-[13.5px] text-slate-600 focus:outline-none"
                        value={currentUserName}
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-xs text-slate-500 mb-1.5">Kênh nguồn tuyển sinh</label>
                      <select
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[13.5px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all cursor-pointer disabled:opacity-50"
                        value={interestForm.sourceChannel}
                        onChange={(e) => setInterestForm({ ...interestForm, sourceChannel: e.target.value })}
                        disabled={isSubmittingInterest}
                      >
                        <option value="CTV/Đại lý">CTV / Đại lý</option>
                        <option value="Nhân viên tư vấn">Nhân viên tư vấn</option>
                        <option value="Website">Website</option>
                        <option value="Facebook">Facebook</option>
                        <option value="Zalo">Zalo</option>
                        <option value="Sự kiện">Sự kiện hội thảo</option>
                        <option value="Khác">Khác</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="block font-semibold text-xs text-slate-500 mb-1.5">Ảnh thẻ CCCD / Hộ chiếu khách hàng (Mặt trước & Mặt sau) <span className="text-red-500">*</span></label>
                    <div className="grid grid-cols-2 gap-3">
                      {/* Mặt trước */}
                      <div className="flex flex-col gap-1">
                        <div
                          className={`relative h-24 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden bg-slate-50 ${
                            interestInvalidFields.includes("cccdFront") ? "border-red-500" : "border-slate-200 hover:border-cyan-900/45"
                          }`}
                          onClick={() => document.getElementById("interest-cccd-front-input").click()}
                        >
                          {interestCccdFrontPreview ? (
                            <>
                              <img src={interestCccdFrontPreview} alt="Mặt trước" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/45 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (interestCccdFrontPreview) URL.revokeObjectURL(interestCccdFrontPreview);
                                    setInterestCccdFrontFile(null);
                                    setInterestCccdFrontPreview("");
                                  }}
                                  className="bg-red-600 hover:bg-red-700 text-white rounded-full p-1.5 text-xs transition-colors shadow-md border-0 cursor-pointer flex items-center justify-center w-7 h-7"
                                >
                                  <i className="fa fa-trash"></i>
                                </button>
                              </div>
                              <span className="absolute bottom-1.5 left-1.5 bg-emerald-500/90 text-white px-1.5 py-0.5 rounded text-[8px] font-bold shadow-sm">
                                ✓ Đã chọn
                              </span>
                            </>
                          ) : (
                            <div className="flex flex-col items-center gap-1 text-center px-2">
                              <i className="fa fa-cloud-arrow-up text-slate-400 text-base"></i>
                              <div>
                                <div className="text-xs font-semibold text-slate-600">Mặt trước CCCD</div>
                                <div className="text-[9px] text-slate-400">Nhấp để tải lên</div>
                              </div>
                            </div>
                          )}
                        </div>
                        <input
                          type="file"
                          id="interest-cccd-front-input"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (interestCccdFrontPreview) URL.revokeObjectURL(interestCccdFrontPreview);
                              setInterestCccdFrontFile(file);
                              setInterestCccdFrontPreview(URL.createObjectURL(file));
                              setInterestInvalidFields(prev => prev.filter(f => f !== "cccdFront"));
                            }
                          }}
                        />
                      </div>

                      {/* Mặt sau */}
                      <div className="flex flex-col gap-1">
                        <div
                          className={`relative h-24 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden bg-slate-50 ${
                            interestInvalidFields.includes("cccdBack") ? "border-red-500" : "border-slate-200 hover:border-cyan-900/45"
                          }`}
                          onClick={() => document.getElementById("interest-cccd-back-input").click()}
                        >
                          {interestCccdBackPreview ? (
                            <>
                              <img src={interestCccdBackPreview} alt="Mặt sau" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/45 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (interestCccdBackPreview) URL.revokeObjectURL(interestCccdBackPreview);
                                    setInterestCccdBackFile(null);
                                    setInterestCccdBackPreview("");
                                  }}
                                  className="bg-red-600 hover:bg-red-700 text-white rounded-full p-1.5 text-xs transition-colors shadow-md border-0 cursor-pointer flex items-center justify-center w-7 h-7"
                                >
                                  <i className="fa fa-trash"></i>
                                </button>
                              </div>
                              <span className="absolute bottom-1.5 left-1.5 bg-emerald-500/90 text-white px-1.5 py-0.5 rounded text-[8px] font-bold shadow-sm">
                                ✓ Đã chọn
                              </span>
                            </>
                          ) : (
                            <div className="flex flex-col items-center gap-1 text-center px-2">
                              <i className="fa fa-cloud-arrow-up text-slate-400 text-base"></i>
                              <div>
                                <div className="text-xs font-semibold text-slate-600">Mặt sau CCCD</div>
                                <div className="text-[9px] text-slate-400">Nhấp để tải lên</div>
                              </div>
                            </div>
                          )}
                        </div>
                        <input
                          type="file"
                          id="interest-cccd-back-input"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (interestCccdBackPreview) URL.revokeObjectURL(interestCccdBackPreview);
                              setInterestCccdBackFile(file);
                              setInterestCccdBackPreview(URL.createObjectURL(file));
                              setInterestInvalidFields(prev => prev.filter(f => f !== "cccdBack"));
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-2">
                    <label className="block font-semibold text-xs text-slate-500 mb-1.5">Nhu cầu cụ thể / Ghi chú</label>
                    <textarea
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[13.5px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all disabled:opacity-50"
                      rows="2"
                      placeholder="Nhập yêu cầu đặc biệt của khách hàng hoặc khu giờ liên hệ phù hợp..."
                      value={interestForm.note}
                      onChange={(e) => setInterestForm({ ...interestForm, note: e.target.value })}
                      disabled={isSubmittingInterest}
                    />
                  </div>
                </div>
              </form>

              <div className="bg-slate-50 p-4 border-t border-slate-100 flex flex-col sm:flex-row gap-2.5 sm:gap-3 justify-end shrink-0">
                <button
                  type="button"
                  className="order-2 sm:order-1 w-full sm:w-auto sm:mr-auto bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                  onClick={() => setShowContractPreview(true)}
                >
                  <i className="fa fa-file-signature text-blue-600 text-sm"></i>
                  Xem hợp đồng mẫu
                </button>
                <button type="button" className="order-3 sm:order-2 w-full sm:w-auto bg-transparent hover:bg-slate-150 text-slate-650 border border-slate-250 text-xs font-semibold py-2.5 px-4 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center" onClick={handleCloseInterestModal} disabled={isSubmittingInterest}>
                  Hủy bỏ
                </button>
                <button type="submit" form="interestForm" className="order-1 sm:order-3 w-full sm:w-auto bg-cyan-900 hover:bg-cyan-950 text-white text-xs font-semibold py-2.5 px-5 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center" disabled={isSubmittingInterest}>
                  {isSubmittingInterest ? "Đang gửi..." : "Gửi liên hệ tư vấn"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: XEM TRƯỚC HỢP ĐỒNG MẪU */}
        {showContractPreview && resolvedProduct && (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-[6px] flex items-center justify-center p-4 md:p-6 z-1100 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[850px] flex flex-col animate-slide-up overflow-hidden" style={{ maxHeight: "95vh" }}>
              <div className="bg-slate-50 border-b border-slate-100 px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
                <div>
                  <h5 className="font-bold text-slate-800 text-base m-0 flex items-center gap-2">
                    <i className="fa fa-file-contract text-blue-600"></i> Xem trước Hợp đồng & Phụ lục
                  </h5>
                  <p className="text-[11px] text-slate-405 m-0 mt-0.5">Dữ liệu được điền tự động từ form đăng ký quan tâm</p>
                </div>
                
                <div className="flex items-center bg-slate-200/65 rounded-lg p-0.5 self-start md:self-auto">
                  <button
                    type="button"
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${contractType === "main" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                    onClick={() => setContractType("main")}
                  >
                    Hợp đồng chính
                  </button>
                  <button
                    type="button"
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${contractType === "appendix" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                    onClick={() => setContractType("appendix")}
                  >
                    Phụ lục hợp đồng
                  </button>
                </div>
              </div>

              {/* Scrollable A4 Container */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-150/40 select-text">
                <style>{`
                  @media print {
                    body * {
                      visibility: hidden;
                    }
                    #contract-print-area, #contract-print-area * {
                      visibility: visible;
                    }
                    #contract-print-area {
                      position: absolute;
                      left: 0;
                      top: 0;
                      width: 100%;
                      padding: 0;
                      margin: 0;
                      box-shadow: none !important;
                      border: none !important;
                    }
                  }
                `}</style>

                {contractType === "main" ? (
                  <div id="contract-print-area" className="bg-white shadow-lg mx-auto max-w-[794px] p-[30px] sm:p-[50px] border border-slate-200 text-slate-800 font-sans leading-relaxed text-[13px] relative rounded-lg">
                    {/* Header Block like Image 2 */}
                    <div className="flex items-center gap-4 border-b-2 border-sky-400 pb-3 mb-6">
                      <img src="/assets/images/logo-HTO.png" alt="HT Ocean Group" className="h-16 w-auto object-contain shrink-0" />
                      <div className="flex-1 text-slate-800 text-[11px] leading-tight text-left">
                        <div className="font-extrabold text-[#0066b2] text-[13px] uppercase">
                          CÔNG TY CỔ PHẦN TƯ VẤN GIÁO DỤC & ĐỊNH CƯ HT ĐẠI DƯƠNG
                        </div>
                        <div className="font-bold text-slate-600 text-[9.5px] uppercase mt-0.5">
                          HT OCEAN EDUCATION & IMMIGRATION CONSULTANCY JOINT STOCK COMPANY
                        </div>
                        <div className="mt-1 text-slate-500">
                          Tầng 1, Toà nhà số 284/41/2 Lý Thường Kiệt, Phường Diên Hồng, TP. HCM
                        </div>
                        <div className="text-slate-500">
                          0334.585.198 - 0866.934.579 <span className="text-sky-400 mx-1">|</span> administrator@htogroup.com.vn <span className="text-sky-400 mx-1">|</span> www.htogroup.com.vn
                        </div>
                      </div>
                    </div>

                    {/* National Motto and Company Reference */}
                    <div className="grid grid-cols-2 gap-4 text-center text-[12px] mb-6">
                      <div className="flex flex-col items-center">
                        <div className="font-bold uppercase text-slate-900 leading-tight">
                          CÔNG TY CỔ PHẦN TƯ VẤN GIÁO DỤC &<br />ĐỊNH CƯ HT ĐẠI DƯƠNG
                        </div>
                        <div className="text-slate-400 text-[10px] my-0.5">---</div>
                        <div className="font-bold text-slate-800">
                          Số: {Date.now().toString().slice(-6)}/DHDE
                        </div>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="font-bold uppercase text-slate-900 leading-tight">
                          CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                        </div>
                        <div className="font-bold text-slate-800 mt-1">
                          Độc lập - Tự do - Hạnh phúc
                        </div>
                        <div className="text-slate-400 text-[10px] my-0.5">---</div>
                      </div>
                    </div>

                    <div className="text-center font-bold text-[16px] mt-8 mb-4 text-slate-900">
                      HỢP ĐỒNG TƯ VẤN DU HỌC
                    </div>

                    <div className="space-y-3">
                      <p className="italic text-slate-600">- Căn cứ Bộ luật Dân sự số 91/2015/QH13 ban hành ngày 24/11/2015;</p>
                      <p className="italic text-slate-600">- Căn cứ nhu cầu và năng lực thực tế của hai Bên.</p>

                      <p className="mt-4">Hôm nay, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}, tại văn phòng Công ty, chúng tôi gồm:</p>

                      {/* BÊN A */}
                      <div className="mt-4">
                        <div className="font-bold text-[12.5px] border-b border-slate-200 pb-1 mb-2 text-slate-900">
                          BÊN A: ĐƠN VỊ TƯ VẤN (HT OCEAN GROUP)
                        </div>
                        <table className="w-full text-left table-fixed text-[13px]">
                          <tbody>
                            <tr>
                              <td className="w-1/3 py-1 font-bold">Tên đơn vị:</td>
                              <td className="w-2/3 py-1 font-semibold">CÔNG TY CỔ PHẦN TƯ VẤN GIÁO DỤC & ĐỊNH CƯ HT ĐẠI DƯƠNG</td>
                            </tr>
                            <tr>
                              <td className="py-1 font-bold">Địa chỉ:</td>
                              <td className="py-1">Tầng 1, Toà nhà số 284/41/2 Lý Thường Kiệt, Phường Diên Hồng, TP. HCM</td>
                            </tr>
                            <tr>
                              <td className="py-1 font-bold">Người đại diện:</td>
                              <td className="py-1 font-bold text-cyan-950 bg-slate-50 px-2 rounded">VŨ ĐỨC HÙNG</td>
                            </tr>
                            <tr>
                              <td className="py-1 font-bold">Chức vụ:</td>
                              <td className="py-1">Giám đốc điều hành</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* BÊN B */}
                      <div className="mt-4">
                        <div className="font-bold text-[12.5px] border-b border-slate-200 pb-1 mb-2 text-slate-900">
                          BÊN B: BÊN ĐƯỢC TƯ VẤN (KHÁCH HÀNG / HỌC VIÊN)
                        </div>
                        <table className="w-full text-left table-fixed text-[13px]">
                          <tbody>
                            <tr>
                              <td className="w-1/3 py-1 font-bold">Họ và tên:</td>
                              <td className="w-2/3 py-1 text-cyan-950 font-bold bg-yellow-100/50 px-2 rounded">{cleanVietnameseText(interestForm.customerName) || "...................................................."}</td>
                            </tr>
                            <tr>
                              <td className="py-1 font-bold">Số điện thoại:</td>
                              <td className="py-1 text-cyan-950 font-bold bg-slate-50 px-2 rounded">{cleanVietnameseText(interestForm.phone) || "...................................................."}</td>
                            </tr>
                            <tr>
                              <td className="py-1 font-bold">Email:</td>
                              <td className="py-1 text-cyan-950 bg-slate-50 px-2 rounded">{cleanVietnameseText(interestForm.email) || "...................................................."}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <div className="font-bold text-[12.5px] mt-6 mb-2 text-slate-900">ĐIỀU 1: NỘI DUNG DỊCH VỤ & PHẠM VI CÔNG VIỆC</div>
                      <p>1. Bên B tự nguyện đăng ký và Bên A nhận cung cấp dịch vụ tư vấn, làm thủ tục du học cho Bên B đối với:</p>
                      <ul className="list-disc pl-5 space-y-1 mt-2">
                        <li><strong>Chương trình du học:</strong> <span className="text-cyan-950 font-bold bg-yellow-100/50 px-1 rounded">{cleanVietnameseText(resolvedProduct.name)}</span></li>
                        <li><strong>Quốc gia học tập:</strong> <span className="text-cyan-950 font-bold bg-slate-50 px-1 rounded">{cleanVietnameseText(resolveCountryName(resolvedProduct.country))}</span></li>
                        {resolvedProduct.visaCode && <li><strong>Mã Visa hệ thống (visaCode):</strong> <span className="font-mono bg-slate-100 px-1 py-0.5 rounded text-[11.5px]">{resolvedProduct.visaCode}</span></li>}
                      </ul>
                      <p className="mt-2">2. Bên A chịu trách nhiệm hướng dẫn Bên B chuẩn bị hồ sơ cá nhân đầy đủ và hợp lệ, liên hệ các trường đối tác nước ngoài để xin thư mời học, hướng dẫn thủ tục xin Visa, tổ chức đào tạo định hướng hành trang trước khi xuất cảnh.</p>

                      <div className="font-bold text-[12.5px] mt-6 mb-2 text-slate-900">ĐIỀU 2: PHÍ DỊCH VỤ VÀ PHƯƠNG THỨC THANH TOÁN</div>
                      <p>1. Phí dịch vụ tư vấn du học trọn gói đối với chương trình này là: <strong>{resolvedProduct.serviceFee ? resolvedProduct.serviceFee.toLocaleString("vi-VN") : "0"} {resolvedProduct.currency || "VND"}</strong></p>
                      <p>2. Bằng chữ: <em className="text-cyan-950 font-bold bg-yellow-100/50 px-2 py-0.5 rounded block mt-1">{cleanVietnameseText(numberToVietnameseWords(resolvedProduct.serviceFee))}</em></p>
                      <p>3. Chi phí trên chưa bao gồm các khoản lệ phí đóng trực tiếp cho Đại sứ quán, vé máy bay, bảo hiểm hoặc học phí đóng trực tiếp cho nhà trường tại nước sở tại (nếu có).</p>

                      <div className="font-bold text-[12.5px] mt-6 mb-2 text-slate-900">ĐIỀU 3: CAM KẾT VÀ HIỆU LỰC</div>
                      <p>1. Bên B cam kết cung cấp toàn bộ thông tin cá nhân, bằng cấp, học bạ và hình ảnh thẻ CCCD/Hộ chiếu trung thực và chính xác. Mọi sai sót dẫn đến việc từ chối hồ sơ Bên B hoàn toàn chịu trách nhiệm.</p>
                      <p>2. Bên A cam kết thực hiện đúng tiến độ xử lý hồ sơ theo quy định của chương trình. Hợp đồng có hiệu lực kể từ ngày ký và tự động thanh lý khi Bên B hoàn thành thủ tục nhập học.</p>

                      {/* SIGNATURE SECTION */}
                      <div className="grid grid-cols-2 gap-8 text-center mt-12 pt-6 border-t border-dashed border-slate-200">
                        <div>
                          <div className="font-bold text-slate-900 uppercase">BÊN B</div>
                          <div className="font-bold text-slate-900">Khách hàng</div>
                          <div className="text-slate-400 italic text-[11px] mt-0.5">(Ký và ghi rõ họ tên)</div>
                          <div className="h-20"></div>
                          <div className="font-bold text-cyan-950">{cleanVietnameseText(interestForm.customerName) || "...................................................."}</div>
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 uppercase">BÊN A</div>
                          <div className="font-bold text-slate-900">Giám đốc điều hành</div>
                          <div className="text-slate-400 italic text-[11px] mt-0.5">(Ký và ghi rõ họ tên)</div>
                          <div className="h-20"></div>
                          <div className="font-bold text-cyan-950">VŨ ĐỨC HÙNG</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div id="contract-print-area" className="bg-white shadow-lg mx-auto max-w-[794px] p-[30px] sm:p-[50px] border border-slate-200 text-slate-800 font-sans leading-relaxed text-[13px] relative rounded-lg">
                    {/* Header Block like Image 2 */}
                    <div className="flex items-center gap-4 border-b-2 border-sky-400 pb-3 mb-6">
                      <img src="/assets/images/logo-HTO.png" alt="HT Ocean Group" className="h-16 w-auto object-contain shrink-0" />
                      <div className="flex-1 text-slate-800 text-[11px] leading-tight text-left">
                        <div className="font-extrabold text-[#0066b2] text-[13px] uppercase">
                          CÔNG TY CỔ PHẦN TƯ VẤN GIÁO DỤC & ĐỊNH CƯ HT ĐẠI DƯƠNG
                        </div>
                        <div className="font-bold text-slate-600 text-[9.5px] uppercase mt-0.5">
                          HT OCEAN EDUCATION & IMMIGRATION CONSULTANCY JOINT STOCK COMPANY
                        </div>
                        <div className="mt-1 text-slate-500">
                          Tầng 1, Toà nhà số 284/41/2 Lý Thường Kiệt, Phường Diên Hồng, TP. HCM
                        </div>
                        <div className="text-slate-500">
                          0334.585.198 - 0866.934.579 <span className="text-sky-400 mx-1">|</span> administrator@htogroup.com.vn <span className="text-sky-400 mx-1">|</span> www.htogroup.com.vn
                        </div>
                      </div>
                    </div>

                    {/* National Motto and Company Reference */}
                    <div className="grid grid-cols-2 gap-4 text-center text-[12px] mb-6">
                      <div className="flex flex-col items-center">
                        <div className="font-bold uppercase text-slate-900 leading-tight">
                          CÔNG TY CỔ PHẦN TƯ VẤN GIÁO DỤC &<br />ĐỊNH CƯ HT ĐẠI DƯƠNG
                        </div>
                        <div className="text-slate-400 text-[10px] my-0.5">---</div>
                        <div className="font-bold text-slate-800">
                          Số: {Date.now().toString().slice(-6)}/DHDE
                        </div>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="font-bold uppercase text-slate-900 leading-tight">
                          CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                        </div>
                        <div className="font-bold text-slate-800 mt-1">
                          Độc lập - Tự do - Hạnh phúc
                        </div>
                        <div className="text-slate-400 text-[10px] my-0.5">---</div>
                      </div>
                    </div>

                    <div className="text-center font-bold text-[16px] mt-8 mb-4 text-slate-900">
                      PHỤ LỤC HỢP ĐỒNG TƯ VẤN DU HỌC
                    </div>
                    <div className="text-center font-bold text-[12px] italic -mt-2 mb-6 text-slate-500">
                      (Kèm theo Hợp đồng tư vấn du học ký ngày {new Date().getDate()}/{new Date().getMonth() + 1}/{new Date().getFullYear()})
                    </div>

                    <div className="space-y-3">
                      <p>Căn cứ Hợp đồng dịch vụ tư vấn du học số {Date.now().toString().slice(-6)}/HĐTVDH-HTO giữa các Bên, hai Bên thống nhất ký kết Phụ lục này với các nội dung chi tiết sau:</p>

                      {/* PHẦN I */}
                      <div className="mt-4">
                        <div className="font-bold text-[12.5px] border-b border-slate-200 pb-1 mb-2 text-slate-900">
                          I. THÔNG TIN CHI TIẾT CHƯƠNG TRÌNH & HỌC VIÊN
                        </div>
                        <table className="w-full text-left table-fixed text-[13px]">
                          <tbody>
                            <tr>
                              <td className="w-1/3 py-1 font-bold">Họ tên học viên (Bên B):</td>
                              <td className="w-2/3 py-1 text-cyan-950 font-bold bg-yellow-100/50 px-2 rounded">{cleanVietnameseText(interestForm.customerName) || "...................................................."}</td>
                            </tr>
                            <tr>
                              <td className="py-1 font-bold">Chương trình tuyển sinh:</td>
                              <td className="py-1 text-cyan-950 font-bold bg-slate-50 px-2 rounded">{cleanVietnameseText(resolvedProduct.name)}</td>
                            </tr>
                            <tr>
                              <td className="py-1 font-bold">Quốc gia đích đến:</td>
                              <td className="py-1 text-cyan-950 font-bold bg-slate-50 px-2 rounded">{cleanVietnameseText(resolveCountryName(resolvedProduct.country))}</td>
                            </tr>
                            <tr>
                              <td className="py-1 font-bold">Mã ngắn nội bộ (shortCode):</td>
                              <td className="py-1 font-mono bg-slate-100 px-2 rounded text-[12px]">{resolvedProduct.shortCode || "Chưa thiết lập"}</td>
                            </tr>
                            <tr>
                              <td className="py-1 font-bold">Mã Visa diện tuyển sinh:</td>
                              <td className="py-1 font-mono bg-slate-100 px-2 rounded text-[12px]">{resolvedProduct.visaCode || "Chưa thiết lập"}</td>
                            </tr>
                            <tr>
                              <td className="py-1 font-bold">Mục đích phân loại (purpose):</td>
                              <td className="py-1 bg-slate-50 px-2 rounded">{resolvedProduct.purpose || "Chưa thiết lập"}</td>
                            </tr>
                          </tbody>
                        </table>

                        {/* Referral Information Table matching the user's screenshot */}
                        <div className="font-bold text-[12.5px] border-b border-slate-200 pb-1 mb-2 mt-4 text-slate-900">
                          THÔNG TIN NGƯỜI GIỚI THIỆU
                        </div>
                        <table className="w-full border border-collapse border-slate-300 text-center my-2 text-[12px] table-fixed">
                          <thead>
                            <tr className="bg-slate-50 text-slate-700">
                              <th className="border border-slate-300 p-2 font-bold w-5/12">Option 1: Tên nhân viên giới thiệu</th>
                              <th className="border border-slate-300 p-2 font-bold w-5/12">Option 2: Tên khách giới thiệu</th>
                              <th className="border border-slate-300 p-2 font-bold w-2/12">Số điện thoại</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border border-slate-300 p-2 text-cyan-950 font-medium">
                                {["admin", "bangiamdoc", "truongbophan", "nhansu"].includes(userRole) 
                                  ? cleanVietnameseText(currentUserName) 
                                  : "—"}
                              </td>
                              <td className="border border-slate-300 p-2 text-cyan-950 font-medium">
                                {cleanVietnameseText(interestForm.customerName) || "—"}
                              </td>
                              <td className="border border-slate-300 p-2 text-cyan-950 font-medium">
                                {interestForm.phone || "—"}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* PHẦN II */}
                      <div className="mt-4">
                        <div className="font-bold text-[12.5px] border-b border-slate-200 pb-1 mb-2 text-slate-900">
                          II. BIỂU PHÍ & LỘ TRÌNH THANH TOÁN
                        </div>
                        <table className="w-full border border-collapse border-slate-350 text-center my-3 text-[13px]">
                          <thead>
                            <tr className="bg-slate-50">
                              <th className="border border-slate-300 p-2 font-bold w-1/12">STT</th>
                              <th className="border border-slate-300 p-2 font-bold w-6/12">Khoản mục chi phí</th>
                              <th className="border border-slate-300 p-2 font-bold w-5/12">Số tiền</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border border-slate-300 p-2">1</td>
                              <td className="border border-slate-300 p-2 text-left">Phí dịch vụ tư vấn (HT Ocean Group)</td>
                              <td className="border border-slate-300 p-2 text-right font-bold text-cyan-950">
                                {resolvedProduct.serviceFee ? resolvedProduct.serviceFee.toLocaleString("vi-VN") : "0"} {resolvedProduct.currency || "VND"}
                              </td>
                            </tr>
                            <tr className="bg-slate-50 font-bold">
                              <td className="border border-slate-300 p-2" colSpan="2">Tổng chi phí dịch vụ:</td>
                              <td className="border border-slate-300 p-2 text-right text-cyan-950">
                                {resolvedProduct.serviceFee ? resolvedProduct.serviceFee.toLocaleString("vi-VN") : "0"} {resolvedProduct.currency || "VND"}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                        <p className="italic">Bằng chữ: <strong className="text-cyan-950 bg-yellow-100/50 px-2 py-0.5 rounded">{cleanVietnameseText(numberToVietnameseWords(resolvedProduct.serviceFee))}</strong></p>
                      </div>

                      {/* PHẦN III */}
                      <div className="mt-4">
                        <div className="font-bold text-[12.5px] border-b border-slate-200 pb-1 mb-2 text-slate-900">
                          III. LỘ TRÌNH XỬ LÝ HỒ SƠ & THỦ TỤC
                        </div>
                        <ol className="list-decimal pl-5 space-y-2 mt-2">
                          <li><strong>Giai đoạn 1:</strong> Tiếp nhận thông tin học viên, đối soát thông tin cá nhân và thẩm định học bạ/CCCD. Tổ chức ký Hợp đồng tư vấn du học.</li>
                          <li><strong>Giai đoạn 2:</strong> Dịch thuật hồ sơ công chứng, nộp hồ sơ xin Thư mời học (Admission Letter) từ trường đối tác thuộc diện tuyển dụng.</li>
                          <li><strong>Giai đoạn 3:</strong> Hoàn tất hồ sơ chứng minh tài chính, nộp xin lịch hẹn phỏng vấn Visa tại cơ quan Ngoại giao theo diện <strong>{resolvedProduct.visaCode || "tương ứng"}</strong>.</li>
                          <li><strong>Giai đoạn 4:</strong> Nhận kết quả Visa, đào tạo định hướng kỹ năng hội nhập, hướng dẫn xuất cảnh và nhập học chính thức.</li>
                        </ol>
                      </div>

                      {/* SIGNATURE SECTION */}
                      <div className="grid grid-cols-2 gap-8 text-center mt-12 pt-6 border-t border-dashed border-slate-200">
                        <div>
                          <div className="font-bold text-slate-900 uppercase">BÊN B</div>
                          <div className="font-bold text-slate-900">Khách hàng</div>
                          <div className="text-slate-400 italic text-[11px] mt-0.5">(Ký và ghi rõ họ tên)</div>
                          <div className="h-20"></div>
                          <div className="font-bold text-cyan-950">{cleanVietnameseText(interestForm.customerName) || "...................................................."}</div>
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 uppercase">BÊN A</div>
                          <div className="font-bold text-slate-900">Giám đốc điều hành</div>
                          <div className="text-slate-400 italic text-[11px] mt-0.5">(Ký và ghi rõ họ tên)</div>
                          <div className="h-20"></div>
                          <div className="font-bold text-cyan-950">VŨ ĐỨC HÙNG</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="bg-slate-50 p-4 border-t border-slate-100 flex gap-3 justify-end shrink-0">
                <button
                  type="button"
                  className="bg-transparent hover:bg-slate-150 text-slate-650 border border-slate-250 text-xs font-semibold py-2 px-4 rounded-xl transition-colors"
                  onClick={() => setShowContractPreview(false)}
                >
                  Quay lại
                </button>
                <button
                  type="button"
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 px-5 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
                  onClick={() => window.print()}
                >
                  <i className="fa fa-print"></i> In / Xuất PDF
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export function ProductOverviewPage({ currentUser }) {
  return (
    <ToastProvider>
      <ProductOverviewPageInner currentUser={currentUser} />
    </ToastProvider>
  );
}
