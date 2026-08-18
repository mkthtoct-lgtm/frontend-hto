import React, { useState, useEffect, useMemo, useCallback, memo } from "react";
import { API_BASE_URL } from "../config/api";
import { authFetch, getAuthHeaders } from "../auth/session";

// 1. BỘ ÁNH XẠ THỊ TRƯỜNG / CHÂU LỤC TOÀN DIỆN & CHÍNH XÁC
const getContinentFromSchool = (school) => {
  if (!school) return "Châu Á";
  const name = String(school["Tên trường"] || school.name || "").trim();
  const country = String(school["Quốc gia"] || school["Quốc gia "] || school.country || "").trim();
  const region = String(school["Khu vực"] || school["Khu vực "] || school.region || "").trim();
  const address = String(school["Địa chỉ"] || school.address || "").trim();
  const program = String(school["Chương trình"] || school.program || "").trim();
  const system = String(school["Hệ tuyển sinh"] || school.system || school.admissionSystem || "").trim();

  const fullText = `${country} ${name} ${address} ${region} ${program} ${system}`.toLowerCase();

  // 1. Ưu tiên kiểm tra danh mục đặc thù TTS Quốc Tế & Du học nghề / Trại hè
  if (
    fullText.includes("tts") ||
    fullText.includes("thực tập sinh") ||
    fullText.includes("du học nghề") ||
    fullText.includes("trại hè") ||
    fullText.includes("summer camp") ||
    fullText.includes("summer school") ||
    fullText.includes("vocational") ||
    fullText.includes("internship")
  ) {
    return "TTS Quốc Tế";
  }

  // 2. Phân loại theo Quốc gia cụ thể
  const countryLower = country.toLowerCase();
  if (
    countryLower.includes("đài loan") ||
    countryLower.includes("hàn quốc") ||
    countryLower.includes("nhật bản") ||
    countryLower.includes("nhật") ||
    countryLower.includes("trung quốc") ||
    countryLower.includes("singapore") ||
    countryLower.includes("thái lan") ||
    countryLower.includes("malaysia") ||
    countryLower.includes("philippines") ||
    countryLower.includes("indonesia") ||
    countryLower.includes("ấn độ") ||
    countryLower.includes("taiwan") ||
    countryLower.includes("korea") ||
    countryLower.includes("japan") ||
    countryLower.includes("china")
  ) {
    return "Châu Á";
  }

  if (
    countryLower.includes("đức") ||
    countryLower.includes("anh") ||
    countryLower.includes("pháp") ||
    countryLower.includes("ba lan") ||
    countryLower.includes("hà lan") ||
    countryLower.includes("phần lan") ||
    countryLower.includes("thụy sĩ") ||
    countryLower.includes("thụy điển") ||
    countryLower.includes("na uy") ||
    countryLower.includes("đan mạch") ||
    countryLower.includes("áo") ||
    countryLower.includes("ý") ||
    countryLower.includes("tây ban nha") ||
    countryLower.includes("hungary") ||
    countryLower.includes("séc") ||
    countryLower.includes("bỉ") ||
    countryLower.includes("ireland") ||
    countryLower.includes("germany") ||
    countryLower.includes("uk") ||
    countryLower.includes("poland") ||
    countryLower.includes("france") ||
    countryLower.includes("italy") ||
    countryLower.includes("spain") ||
    countryLower.includes("austria")
  ) {
    return "Châu Âu";
  }

  if (
    countryLower.includes("mỹ") ||
    countryLower.includes("hoa kỳ") ||
    countryLower.includes("canada") ||
    countryLower.includes("usa") ||
    countryLower.includes("us")
  ) {
    return "Châu Mỹ";
  }

  if (
    countryLower.includes("úc") ||
    countryLower.includes("australia") ||
    countryLower.includes("new zealand") ||
    countryLower.includes("nz")
  ) {
    return "Châu Đại Dương";
  }

  // 3. Phân loại dự phòng theo Địa chỉ, Khu vực, Tên trường hoặc Đơn vị tiền tệ
  if (
    fullText.includes("đài bắc") ||
    fullText.includes("đài nam") ||
    fullText.includes("đài trung") ||
    fullText.includes("cao hùng") ||
    fullText.includes("tân bắc") ||
    fullText.includes("đào viên") ||
    fullText.includes("tân trúc") ||
    fullText.includes("seoul") ||
    fullText.includes("busan") ||
    fullText.includes("incheon") ||
    fullText.includes("daegu") ||
    fullText.includes("gwangju") ||
    fullText.includes("daejeon") ||
    fullText.includes("ulsan") ||
    fullText.includes("tokyo") ||
    fullText.includes("osaka") ||
    fullText.includes("kyoto") ||
    fullText.includes("beijing") ||
    fullText.includes("shanghai") ||
    fullText.includes("twd") ||
    fullText.includes("đài tệ") ||
    fullText.includes("krw") ||
    fullText.includes("won") ||
    fullText.includes("jpy") ||
    fullText.includes("yen")
  ) {
    return "Châu Á";
  }

  if (
    fullText.includes("berlin") ||
    fullText.includes("munich") ||
    fullText.includes("frankfurt") ||
    fullText.includes("hamburg") ||
    fullText.includes("london") ||
    fullText.includes("paris") ||
    fullText.includes("warsaw") ||
    fullText.includes("amsterdam") ||
    fullText.includes("helsinki") ||
    fullText.includes("zurich") ||
    fullText.includes("vienna") ||
    fullText.includes("rome") ||
    fullText.includes("madrid") ||
    fullText.includes("eur") ||
    fullText.includes("euro") ||
    fullText.includes("gbp") ||
    fullText.includes("pln")
  ) {
    return "Châu Âu";
  }

  if (
    fullText.includes("california") ||
    fullText.includes("new york") ||
    fullText.includes("texas") ||
    fullText.includes("washington") ||
    fullText.includes("toronto") ||
    fullText.includes("vancouver") ||
    fullText.includes("montreal") ||
    fullText.includes("usd") ||
    fullText.includes("cad")
  ) {
    return "Châu Mỹ";
  }

  if (
    fullText.includes("sydney") ||
    fullText.includes("melbourne") ||
    fullText.includes("brisbane") ||
    fullText.includes("perth") ||
    fullText.includes("adelaide") ||
    fullText.includes("auckland") ||
    fullText.includes("wellington") ||
    fullText.includes("aud") ||
    fullText.includes("nzd")
  ) {
    return "Châu Đại Dương";
  }

  return "Châu Á";
};

// Helper xác định icon cho từng cột bảng
const getHeaderIcon = (header) => {
  const h = (header || "").toLowerCase();
  if (h === "stt" || h === "#") return "fa-hashtag";
  if (h.includes("tên trường") || h.includes("ten truong")) return "fa-university";
  if (h.includes("khu vực") || h.includes("khu vuc")) return "fa-location-dot";
  if (h.includes("địa chỉ") || h.includes("dia chi")) return "fa-map-pin";
  if (h.includes("chuyên ngành") || h.includes("chuyen nganh")) return "fa-book-open";
  if (h.includes("website")) return "fa-globe";
  if (h.includes("hệ tuyển") || h.includes("he tuyen")) return "fa-graduation-cap";
  if (h.includes("hạn báo") || h.includes("han bao")) return "fa-calendar-check";
  if (h.includes("hạn nộp") || h.includes("han nop")) return "fa-clock";
  if (h.includes("điều kiện") || h.includes("dieu kien")) return "fa-file-lines";
  if (h.includes("học phí") && h.includes("tiếng")) return "fa-money-bill-wave";
  if (h.includes("học phí")) return "fa-coins";
  if (h.includes("ký túc") || h.includes("ktx")) return "fa-hotel";
  if (h.includes("học bổng") || h.includes("hoc bong")) return "fa-award";
  if (h.includes("ảnh") || h.includes("image") || h.includes("file")) return "fa-image";
  return "fa-circle-info";
};

// Helper cấu hình độ rộng và căn chỉnh từng cột với tỷ lệ vàng mặc định chuẩn
const getColumnConfig = (header, customWidths = {}) => {
  const h = (header || "").toLowerCase();
  let baseConfig = { width: 130, align: "left" };

  if (h === "stt" || h === "#") baseConfig = { width: 50, align: "center" };
  else if (h.includes("tên trường") || h.includes("ten truong")) baseConfig = { width: 185, align: "left" };
  else if (h.includes("khu vực") || h.includes("region")) baseConfig = { width: 135, align: "center" };
  else if (h.includes("địa chỉ") || h.includes("dia chi")) baseConfig = { width: 155, align: "left" };
  else if (h.includes("chuyên ngành") || h.includes("chuyen nganh")) baseConfig = { width: 160, align: "left" };
  else if (h.includes("website") || h.includes("web")) baseConfig = { width: 95, align: "center" };
  else if (h.includes("hệ") || h.includes("system")) baseConfig = { width: 110, align: "center" };
  else if (h.includes("hạn báo") || h.includes("hạn nộp") || h.includes("han")) baseConfig = { width: 105, align: "center" };
  else if (h.includes("điều kiện") || h.includes("dieu kien")) baseConfig = { width: 165, align: "left" };
  else if (h.includes("học phí") || h.includes("hoc phi")) baseConfig = { width: 135, align: "left" };
  else if (h.includes("ký túc") || h.includes("ktx")) baseConfig = { width: 120, align: "left" };
  else if (h.includes("học bổng") || h.includes("hoc bong")) baseConfig = { width: 135, align: "left" };
  else if (h.includes("ảnh") || h.includes("image") || h.includes("file")) baseConfig = { width: 100, align: "center" };

  const effectiveWidth = customWidths[header] ? Number(customWidths[header]) : baseConfig.width;
  return {
    width: `${effectiveWidth}px`,
    minWidth: `${effectiveWidth}px`,
    align: baseConfig.align,
  };
};

// Helper function to highlight matching search term keywords
function highlightText(text, search) {
  if (!search || !text) return text;
  const str = String(text);
  const cleanSearch = search.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
  const parts = str.split(new RegExp(`(${cleanSearch})`, "gi"));
  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === search.toLowerCase() ? (
          <mark key={index} className="bg-warning text-dark px-1 py-0 rounded font-semibold">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

export const SchoolSearchPage = memo(function SchoolSearchPage() {
  const [headers, setHeaders] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Trạng thái Ẩn / Hiện Bộ lọc
  const [isFilterVisible, setIsFilterVisible] = useState(true);

  // Cấp 1: Thị trường / Châu lục (mặc định 'all')
  const [selectedContinent, setSelectedContinent] = useState("all");

  // Cấp 2: Quốc gia & Chương trình (mặc định 'all')
  const [countries, setCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState("all");
  const [programs, setPrograms] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState("all");

  // Cấp 3: Thuộc tính & Hệ đào tạo (mặc định 'all')
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [selectedSystem, setSelectedSystem] = useState("all");
  const [selectedMajor, setSelectedMajor] = useState("all");
  const [selectedIntake, setSelectedIntake] = useState("all");

  // Ngân sách / Học phí
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");

  // UI state
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [tableDensity, setTableDensity] = useState("normal"); // 'compact' | 'normal' | 'spacious'
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);

  // Quản lý độ rộng cột có thể kéo thả tùy chỉnh theo ý nhân viên
  const [columnWidths, setColumnWidths] = useState(() => {
    try {
      const saved = localStorage.getItem("school_table_custom_widths");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const handleResizeStart = useCallback((header, e) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.pageX;
    const cfg = getColumnConfig(header, columnWidths);
    const startWidth = parseInt(cfg.width, 10) || 150;

    const handleMouseMove = (moveEvent) => {
      const diff = moveEvent.pageX - startX;
      const newWidth = Math.max(50, startWidth + diff);
      setColumnWidths(prev => {
        const next = { ...prev, [header]: newWidth };
        try {
          localStorage.setItem("school_table_custom_widths", JSON.stringify(next));
        } catch {}
        return next;
      });
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }, [columnWidths]);

  const handleResetColumnWidths = () => {
    setColumnWidths({});
    try {
      localStorage.removeItem("school_table_custom_widths");
    } catch {}
  };

  // Dynamic filter options from DB
  const [regionOptions, setRegionOptions] = useState([]);
  const [systemOptions, setSystemOptions] = useState([]);

  // Auth User check
  const currentUser = useMemo(() => {
    try {
      return JSON.parse(window.localStorage.getItem("auth_user") || "null");
    } catch {
      return null;
    }
  }, []);

  const isAdmin = useMemo(() => {
    return (
      currentUser?.role === "admin" ||
      currentUser?.roleId === "69fc5af582ef85451120772a" ||
      (Array.isArray(currentUser?.permissions) &&
        (currentUser.permissions.includes("users:write") || currentUser.permissions.includes("*")))
    );
  }, [currentUser]);

  // Modals management
  const [isSchoolModalOpen, setIsSchoolModalOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState(null);
  const [isSourcesModalOpen, setIsSourcesModalOpen] = useState(false);

  // School Form State
  const [schoolForm, setSchoolForm] = useState({
    name: "", country: "", program: "", region: "", address: "", majors: "", website: "",
    admissionSystem: "", deadlineRegister: "", deadlineDocument: "", requirements: "",
    tuitionLanguage: "", tuitionMajor: "", dormitory: "", scholarship: "", imageUrl: "", stt: 0
  });

  // Sources management states
  const [sources, setSources] = useState([]);
  const [sourcesLoading, setSourcesLoading] = useState(false);
  const [syncingId, setSyncingId] = useState(null);
  const [newSource, setNewSource] = useState({ name: "", country: "", program: "", spreadsheetId: "", gid: "" });

  // 1. Fetch filter options dynamically
  const fetchFilterOptions = async (country = selectedCountry, program = selectedProgram) => {
    try {
      const c = (country || "").toLowerCase() === "all" ? "all" : country;
      const p = (program || "").toLowerCase() === "all" ? "all" : program;
      const regionRes = await authFetch(`${API_BASE_URL}/schools/regions?country=${encodeURIComponent(c)}&program=${encodeURIComponent(p)}`, { headers: getAuthHeaders() });
      const regionJson = await regionRes.json().catch(() => null);
      if (regionRes.ok && regionJson?.success) {
        setRegionOptions(regionJson.data || []);
      }

      const systemRes = await authFetch(`${API_BASE_URL}/schools/systems?country=${encodeURIComponent(c)}&program=${encodeURIComponent(p)}`, { headers: getAuthHeaders() });
      const systemJson = await systemRes.json().catch(() => null);
      if (systemRes.ok && systemJson?.success) {
        setSystemOptions(systemJson.data || []);
      }
    } catch (err) {
      console.error("Lỗi tải bộ lọc:", err);
    }
  };

  // 2. Fetch Countries & initial programs
  const fetchCountriesAndPrograms = async () => {
    try {
      const res = await authFetch(`${API_BASE_URL}/schools/countries`, { headers: getAuthHeaders() });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) {
        setCountries(json.data || []);
      }

      const c = (selectedCountry || "").toLowerCase() === "all" ? "all" : selectedCountry;
      const progRes = await authFetch(`${API_BASE_URL}/schools/programs?country=${encodeURIComponent(c)}`, { headers: getAuthHeaders() });
      const progJson = await progRes.json().catch(() => null);
      if (progRes.ok && progJson?.success) {
        setPrograms(progJson.data || []);
      }
    } catch (err) {
      console.error("Lỗi tải thông tin danh mục:", err);
    }
  };

  // 3. Fetch Schools
  const fetchSchools = async (country = selectedCountry, program = selectedProgram) => {
    setLoading(true);
    setError("");
    try {
      const c = (country || "").toLowerCase() === "all" ? "all" : country;
      const p = (program || "").toLowerCase() === "all" ? "all" : program;
      const url = `${API_BASE_URL}/schools?country=${encodeURIComponent(c)}&program=${encodeURIComponent(p)}&limit=1000&search=${encodeURIComponent(searchTerm)}`;
      const response = await authFetch(url, { headers: getAuthHeaders() });
      const json = await response.json().catch(() => null);
      if (!response.ok || !json?.success) {
        throw new Error(json?.message || "Không thể tải danh sách trường du học.");
      }

      setHeaders(json.data.headers || []);
      setRecords(json.data.records || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi khi tải danh sách.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCountriesAndPrograms();
    fetchSchools(selectedCountry, selectedProgram);
    fetchFilterOptions(selectedCountry, selectedProgram);
  }, []);

  // Danh sách các tab Thị trường Cấp 1
  const continentTabs = [
    { id: "all", label: "Tất cả thị trường", icon: "fa-globe-americas" },
    { id: "Châu Á", label: "Châu Á", icon: "fa-compass" },
    { id: "Châu Âu", label: "Châu Âu", icon: "fa-landmark" },
    { id: "Châu Mỹ", label: "Châu Mỹ", icon: "fa-flag" },
    { id: "Châu Đại Dương", label: "Châu Đại Dương", icon: "fa-sun" },
    { id: "TTS Quốc Tế", label: "TTS Quốc Tế", icon: "fa-plane-departure" },
  ];

  // Trích xuất động danh sách Quốc gia & Chuyên ngành từ dữ liệu
  const dynamicOptions = useMemo(() => {
    const countrySet = new Set(countries);
    const systemSet = new Set(systemOptions);
    const majorSet = new Set();
    const regionSet = new Set(regionOptions);

    records.forEach(r => {
      const c = r["Quốc gia"] || r["Quốc gia "] || r.country;
      if (c) countrySet.add(String(c).trim());

      const s = r["Hệ tuyển sinh"] || r["Hệ tuyển sinh "] || r.system;
      if (s) systemSet.add(String(s).trim());

      const reg = r["Khu vực"] || r["Khu vực "] || r.region;
      if (reg) regionSet.add(String(reg).trim());

      const mVal = String(r["Chuyên ngành"] || r["Chuyên ngành "] || r.major || "").trim();
      if (mVal) {
        mVal.split(/[,;\n]/).forEach(m => {
          const clean = m.trim();
          if (clean && clean.length > 2 && clean.length < 50) {
            majorSet.add(clean);
          }
        });
      }
    });

    return {
      countries: Array.from(countrySet).filter(Boolean),
      systems: Array.from(systemSet).filter(Boolean),
      majors: Array.from(majorSet).sort((a, b) => a.localeCompare(b, "vi")),
      regions: Array.from(regionSet).filter(Boolean),
    };
  }, [records, countries, systemOptions, regionOptions]);

  // Trích xuất danh sách Kỳ nhập học / Hạn nộp
  const availableIntakes = useMemo(() => {
    return [
      { id: "all", label: "Tất cả kỳ nhập học" },
      { id: "xuan", label: "Kỳ Mùa Xuân (T2 - T4)", keyword: "xuân" },
      { id: "thu", label: "Kỳ Mùa Thu (T9 - T11)", keyword: "thu" },
      { id: "he", label: "Kỳ Mùa Hè (T6 - T7)", keyword: "hè" },
      { id: "dong", label: "Kỳ Mùa Đông (T12 - T1)", keyword: "đông" },
    ];
  }, []);

  // Xử lý đổi Quốc gia
  const handleCountryChange = async (countryVal) => {
    setSelectedCountry(countryVal);
    setSelectedRegion("all");
    setSelectedSystem("all");
    setSelectedMajor("all");
    setSelectedIntake("all");

    try {
      const c = countryVal.toLowerCase() === "all" ? "all" : countryVal;
      const progRes = await authFetch(`${API_BASE_URL}/schools/programs?country=${encodeURIComponent(c)}`, { headers: getAuthHeaders() });
      const progJson = await progRes.json().catch(() => null);
      if (progRes.ok && progJson?.success) {
        setPrograms(progJson.data || []);
      }
    } catch (err) {
      console.error(err);
    }

    setSelectedProgram("all");
    fetchSchools(countryVal, "all");
    fetchFilterOptions(countryVal, "all");
  };

  // Nhận diện các cột Học phí
  const tuitionHeaders = useMemo(
    () => headers.filter((h) => h !== "_id" && /học phí/i.test(h)),
    [headers]
  );

  const tuitionCurrencyLabel = useMemo(() => {
    const units = new Set();
    tuitionHeaders.forEach((h) => {
      const match = h.match(/\(([^)]+)\)\s*$/);
      if (match && match[1]) units.add(match[1].trim());
    });
    return Array.from(units).join(" / ");
  }, [tuitionHeaders]);

  const parseTuitionValue = (raw) => {
    if (raw === undefined || raw === null) return null;
    const digitsOnly = String(raw).replace(/[^\d.,]/g, "").replace(/[.,]/g, "");
    if (!digitsOnly) return null;
    const numeric = parseInt(digitsOnly, 10);
    return Number.isFinite(numeric) ? numeric : null;
  };

  const getRecordTuition = (record) => {
    let max = null;
    for (const h of tuitionHeaders) {
      const val = parseTuitionValue(record[h]);
      if (val !== null && (max === null || val > max)) max = val;
    }
    return max;
  };

  // Đếm số lượng bộ lọc đang hoạt động
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedContinent !== "all") count++;
    if (selectedCountry !== "all") count++;
    if (selectedProgram !== "all") count++;
    if (selectedRegion !== "all") count++;
    if (selectedSystem !== "all") count++;
    if (selectedMajor !== "all") count++;
    if (selectedIntake !== "all") count++;
    if (budgetMin !== "" || budgetMax !== "") count++;
    if (searchTerm) count++;
    return count;
  }, [selectedContinent, selectedCountry, selectedProgram, selectedRegion, selectedSystem, selectedMajor, selectedIntake, budgetMin, budgetMax, searchTerm]);

  const handleResetFilters = () => {
    setSelectedContinent("all");
    setSelectedCountry("all");
    setSelectedProgram("all");
    setSelectedRegion("all");
    setSelectedSystem("all");
    setSelectedMajor("all");
    setSelectedIntake("all");
    setSearchTerm("");
    setBudgetMin("");
    setBudgetMax("");
    fetchSchools("all", "all");
    fetchFilterOptions("all", "all");
  };

  // Bộ lọc dữ liệu hợp nhất (Bảo đảm không 0 kết quả khi chọn Châu lục)
  const filteredRecords = useMemo(() => {
    const minBudget = budgetMin !== "" ? Number(budgetMin) : null;
    const maxBudget = budgetMax !== "" ? Number(budgetMax) : null;

    return records.filter(r => {
      // 1. Lọc Cấp 1: Thị trường / Châu lục qua mapper thông minh
      if (selectedContinent && selectedContinent.toLowerCase() !== "all") {
        const schoolContinent = getContinentFromSchool(r);
        if (schoolContinent.toLowerCase() !== selectedContinent.toLowerCase()) return false;
      }

      // 2. Lọc Cấp 2: Quốc gia
      if (selectedCountry && selectedCountry.toLowerCase() !== "all") {
        const countryVal = String(r["Quốc gia"] || r["Quốc gia "] || r.country || "").trim();
        if (countryVal && countryVal.toLowerCase() !== selectedCountry.toLowerCase() && !countryVal.toLowerCase().includes(selectedCountry.toLowerCase())) {
          return false;
        }
      }

      // 3. Lọc Cấp 2: Hệ tuyển sinh
      if (selectedSystem && selectedSystem.toLowerCase() !== "all") {
        const systemVal = String(r["Hệ tuyển sinh"] || r["Hệ tuyển sinh "] || r.system || "").toLowerCase();
        if (!systemVal.includes(selectedSystem.toLowerCase())) return false;
      }

      // 4. Lọc Cấp 2: Chuyên ngành
      if (selectedMajor && selectedMajor.toLowerCase() !== "all") {
        const majorVal = String(r["Chuyên ngành"] || r["Chuyên ngành "] || r.major || "").toLowerCase();
        if (!majorVal.includes(selectedMajor.toLowerCase())) return false;
      }

      // 5. Lọc Cấp 3: Khu vực
      if (selectedRegion && selectedRegion.toLowerCase() !== "all") {
        const regionVal = String(r["Khu vực"] || r["Khu vực "] || r.region || "").trim();
        if (regionVal.toLowerCase() !== selectedRegion.toLowerCase()) return false;
      }

      // 6. Lọc Cấp 3: Kỳ nhập học
      if (selectedIntake && selectedIntake.toLowerCase() !== "all") {
        const intakeObj = availableIntakes.find(i => i.id === selectedIntake);
        if (intakeObj && intakeObj.keyword) {
          const deadlineReg = String(r["Hạn báo danh"] || r["Hạn nộp hồ sơ"] || r["Kỳ tuyển sinh"] || r.deadline || "").toLowerCase();
          if (!deadlineReg.includes(intakeObj.keyword)) return false;
        }
      }

      // 7. Lọc Ngân sách / Học phí
      if (minBudget !== null || maxBudget !== null) {
        const tuition = getRecordTuition(r);
        if (tuition === null) return false;
        if (minBudget !== null && tuition < minBudget) return false;
        if (maxBudget !== null && tuition > maxBudget) return false;
      }

      return true;
    });
  }, [records, selectedContinent, selectedCountry, selectedSystem, selectedMajor, selectedRegion, selectedIntake, budgetMin, budgetMax, tuitionHeaders, availableIntakes]);

  // Export to CSV
  const handleExportCsv = () => {
    if (filteredRecords.length === 0 || headers.length === 0) return;

    const exportHeaders = headers.filter(h => h !== "_id");

    const csvContent = "\uFEFF" + [
      exportHeaders.join(","),
      ...filteredRecords.map(row =>
        exportHeaders.map(h => {
          const val = String(row[h] || "").replace(/"/g, '""');
          return `"${val}"`;
        }).join(",")
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Danh_sach_truong_du_hoc_${Date.now()}.csv`;
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getTabForHeader = (h) => {
    const trimmed = h.trim();
    if (["Tên trường", "Khu vực", "Địa chỉ", "Chuyên ngành", "File ảnh thông báo", "STT", "Website"].includes(trimmed)) {
      return "overview";
    }
    if (["Hệ tuyển sinh", "Hạn báo danh", "Hạn nộp hồ sơ", "Điều kiện tuyển sinh"].includes(trimmed)) {
      return "requirements";
    }
    if (["Học phí học tiếng (1+4) TWD", "Học phí chuyên ngành (TWD)", "Ký túc xá (đài tệ)"].includes(trimmed)) {
      return "tuition";
    }
    if (["Học bổng"].includes(trimmed)) {
      return "scholarship";
    }
    return "overview";
  };

  const handleOpenDetailModal = (row) => {
    setSelectedSchool(row);
    setActiveTab("overview");
  };

  // CRUD Functions
  const openSchoolModal = (school = null) => {
    if (school) {
      setEditingSchool(school);
      setSchoolForm({
        name: school["Tên trường"] || school.name || "",
        country: selectedCountry !== "all" ? selectedCountry : (school["Quốc gia"] || school.country || ""),
        program: selectedProgram !== "all" ? selectedProgram : (school["Chương trình"] || school.program || ""),
        region: school["Khu vực"] || school.region || "",
        address: school["Địa chỉ"] || school.address || "",
        majors: school["Chuyên ngành"] || school.major || "",
        website: school["Website"] || school.website || "",
        admissionSystem: school["Hệ tuyển sinh"] || school.system || "",
        deadlineRegister: school["Hạn báo danh"] || school.deadline || "",
        deadlineDocument: school["Hạn nộp hồ sơ"] || "",
        requirements: school["Điều kiện tuyển sinh"] || school.requirements || "",
        tuitionLanguage: school["Học phí học tiếng (1+4) TWD"] || "",
        tuitionMajor: school["Học phí chuyên ngành (TWD)"] || "",
        dormitory: school["Ký túc xá (đài tệ)"] || "",
        scholarship: school["Học bổng"] || "",
        imageUrl: school["File ảnh thông báo"] || "",
        stt: parseInt(school["STT"]) || 0
      });
    } else {
      setEditingSchool(null);
      setSchoolForm({
        name: "", country: selectedCountry !== "all" ? selectedCountry : "", program: selectedProgram !== "all" ? selectedProgram : "",
        region: "", address: "", majors: "", website: "", admissionSystem: "", deadlineRegister: "", deadlineDocument: "",
        requirements: "", tuitionLanguage: "", tuitionMajor: "", dormitory: "", scholarship: "", imageUrl: "", stt: 0
      });
    }
    setIsSchoolModalOpen(true);
  };

  const handleSchoolSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingSchool
        ? `${API_BASE_URL}/schools/${editingSchool._id}`
        : `${API_BASE_URL}/schools`;
      const method = editingSchool ? "PUT" : "POST";

      const res = await authFetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(schoolForm)
      });
      if (res.ok) {
        setIsSchoolModalOpen(false);
        fetchSchools();
        fetchCountriesAndPrograms();
      } else {
        const json = await res.json().catch(() => null);
        alert(json?.message || "Có lỗi xảy ra khi lưu thông tin trường.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSchoolDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Bạn có chắc muốn xóa trường này khỏi hệ thống?")) return;
    try {
      const res = await authFetch(`${API_BASE_URL}/schools/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });
      if (res.ok) {
        fetchSchools();
      } else {
        alert("Không thể xóa trường học này.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Sources management
  const fetchSources = async () => {
    setSourcesLoading(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/schools/sources`, { headers: getAuthHeaders() });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) {
        setSources(json.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSourcesLoading(false);
    }
  };

  const handleOpenSourcesModal = () => {
    setIsSourcesModalOpen(true);
    fetchSources();
  };

  const handleAddSource = async (e) => {
    e.preventDefault();
    let { name, country, program, spreadsheetId, gid } = newSource;
    spreadsheetId = (spreadsheetId || "").trim();
    gid = (gid || "").trim();

    if (spreadsheetId.includes("/d/")) {
      const matchId = spreadsheetId.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (matchId) spreadsheetId = matchId[1];
    }
    if (newSource.spreadsheetId.includes("gid=")) {
      const matchGid = newSource.spreadsheetId.match(/gid=([0-9]+)/);
      if (matchGid) gid = matchGid[1];
    }
    gid = gid || "0";

    const payload = { name, country, program, spreadsheetId, gid };

    try {
      const res = await authFetch(`${API_BASE_URL}/schools/sources`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setNewSource({ name: "", country: "", program: "", spreadsheetId: "", gid: "" });
        fetchSources();
      } else {
        const json = await res.json().catch(() => null);
        alert(json?.message || "Lỗi khi thêm liên kết Sheet.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSource = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa nguồn Google Sheet này?")) return;
    try {
      const res = await authFetch(`${API_BASE_URL}/schools/sources/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });
      if (res.ok) {
        fetchSources();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSyncSource = async (id) => {
    setSyncingId(id);
    try {
      const res = await authFetch(`${API_BASE_URL}/schools/sources/${id}/sync`, {
        method: "POST",
        headers: getAuthHeaders()
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) {
        alert(`Đồng bộ thành công ${json.data?.totalSynced || 0} trường!`);
        fetchSources();
        fetchSchools();
        fetchCountriesAndPrograms();
      } else {
        alert(json?.message || "Đồng bộ thất bại. Vui lòng kiểm tra lại quyền truy cập Sheet.");
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi kết nối khi đồng bộ.");
    } finally {
      setSyncingId(null);
    }
  };

  return (
    <div className="d-flex flex-column h-100 p-3 gap-3 bg-slate-50 app-dark:bg-[#0b1120]! overflow-hidden transition-colors duration-300">
      {/* ── STYLES CHỐNG ĐÈ CHỮ CHO THEAD Ở CẢ LIGHT VÀ DARK MODE ── */}
      <style>{`
        /* ── TABLE THEAD & STICKY ACTION COLUMN DESIGN ── */
        .school-sticky-thead th {
          position: sticky;
          top: 0;
          z-index: 20;
          background-color: #f8fafc !important;
          color: #1e293b !important;
          border-bottom: 2px solid #06b6d4 !important;
          box-shadow: 0 2px 4px rgba(0,0,0,0.03);
          letter-spacing: 0.03em;
        }
        html.app-dark .school-sticky-thead th,
        body.app-dark .school-sticky-thead th,
        [data-bs-theme="dark"] .school-sticky-thead th,
        .app-dark .school-sticky-thead th {
          background-color: #1e293b !important;
          color: #f8fafc !important;
          border-bottom: 2px solid #06b6d4 !important;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3) !important;
        }

        /* Tay cầm kéo chỉnh độ rộng cột (Column Resizer) với vạch phân cách tinh tế */
        .school-col-resizer {
          position: absolute;
          right: 0;
          top: 15%;
          bottom: 15%;
          width: 10px;
          cursor: col-resize;
          user-select: none;
          touch-action: none;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .school-col-resizer::after {
          content: "";
          display: block;
          width: 2px;
          height: 100%;
          background-color: #cbd5e1;
          border-radius: 2px;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .school-col-resizer:hover::after,
        .school-col-resizer:active::after {
          width: 4px;
          background: linear-gradient(180deg, #06b6d4 0%, #3b82f6 100%) !important;
          box-shadow: 0 0 10px rgba(6, 182, 212, 0.8) !important;
        }
        html.app-dark .school-col-resizer::after,
        body.app-dark .school-col-resizer::after,
        [data-bs-theme="dark"] .school-col-resizer::after,
        .app-dark .school-col-resizer::after {
          background-color: #475569;
        }
        html.app-dark .school-col-resizer:hover::after,
        body.app-dark .school-col-resizer:hover::after,
        [data-bs-theme="dark"] .school-col-resizer:hover::after,
        .app-dark .school-col-resizer:hover::after {
          background: linear-gradient(180deg, #22d3ee 0%, #38bdf8 100%) !important;
          box-shadow: 0 0 10px rgba(34, 211, 238, 0.8) !important;
        }

        .school-sticky-action-col {
          position: sticky !important;
          right: 0 !important;
          z-index: 15 !important;
          background-color: #ffffff !important;
          box-shadow: -6px 0 14px rgba(0, 0, 0, 0.08) !important;
          min-width: 120px !important;
          width: 120px !important;
        }
        .table-row-item:hover .school-sticky-action-col {
          background-color: #f8fafc !important;
        }
        .table-row-item.table-row-selected .school-sticky-action-col {
          background-color: #ecfeff !important;
        }
        html.app-dark .school-sticky-action-col,
        body.app-dark .school-sticky-action-col,
        [data-bs-theme="dark"] .school-sticky-action-col,
        .app-dark .school-sticky-action-col {
          background-color: #0f172a !important;
          box-shadow: -6px 0 14px rgba(0, 0, 0, 0.5) !important;
        }
        html.app-dark .table-row-item:hover .school-sticky-action-col,
        .app-dark .table-row-item:hover .school-sticky-action-col {
          background-color: #1e293b !important;
        }
        html.app-dark .table-row-item.table-row-selected .school-sticky-action-col,
        .app-dark .table-row-item.table-row-selected .school-sticky-action-col {
          background-color: #083344 !important;
        }

        /* ── BẢNG MÀU STT DỊU MẮT, DỄ NHÌN, KHÔNG CHÓI ── */
        .badge-stt-gentle {
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%) !important;
          color: #334155 !important;
          border: 1px solid #cbd5e1 !important;
          font-weight: 800 !important;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
        }
        html.app-dark .badge-stt-gentle,
        body.app-dark .badge-stt-gentle,
        [data-bs-theme="dark"] .badge-stt-gentle,
        .app-dark .badge-stt-gentle {
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%) !important;
          color: #94a3b8 !important;
          border: 1px solid #334155 !important;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
        }

        /* ── BẢNG MÀU HẠN BÁO DANH & HẠN NỘP HỒ SƠ ĐỎ ĐẬM SANG TRỌNG ── */
        .badge-deadline-crimson {
          background-color: rgba(225, 29, 72, 0.12) !important;
          color: #9f1239 !important;
          border: 1px solid #e11d48 !important;
          font-weight: 800 !important;
        }
        html.app-dark .badge-deadline-crimson,
        body.app-dark .badge-deadline-crimson,
        [data-bs-theme="dark"] .badge-deadline-crimson,
        .app-dark .badge-deadline-crimson {
          background-color: rgba(225, 29, 72, 0.25) !important;
          color: #fb7185 !important;
          border: 1px solid rgba(244, 63, 94, 0.7) !important;
        }

        /* ── NÚT THAO TÁC ĐỒNG BỘ TINH TẾ (CHẾ ĐỘ SÁNG & TỐI) ── */
        .btn-action-view {
          background-color: #f1f5f9;
          color: #0284c7;
          border: 1px solid #cbd5e1;
        }
        .btn-action-view:hover {
          background-color: #0284c7 !important;
          color: #ffffff !important;
          border-color: #0284c7 !important;
        }
        html.app-dark .btn-action-view,
        body.app-dark .btn-action-view,
        [data-bs-theme="dark"] .btn-action-view,
        .app-dark .btn-action-view {
          background-color: #1e293b !important;
          color: #38bdf8 !important;
          border: 1px solid #334155 !important;
        }

        .btn-action-edit {
          background-color: #f1f5f9;
          color: #d97706;
          border: 1px solid #cbd5e1;
        }
        .btn-action-edit:hover {
          background-color: #d97706 !important;
          color: #ffffff !important;
          border-color: #d97706 !important;
        }
        html.app-dark .btn-action-edit,
        body.app-dark .btn-action-edit,
        [data-bs-theme="dark"] .btn-action-edit,
        .app-dark .btn-action-edit {
          background-color: #1e293b !important;
          color: #fbbf24 !important;
          border: 1px solid #334155 !important;
        }

        .btn-action-delete {
          background-color: #f1f5f9;
          color: #e11d48;
          border: 1px solid #cbd5e1;
        }
        .btn-action-delete:hover {
          background-color: #e11d48 !important;
          color: #ffffff !important;
          border-color: #e11d48 !important;
        }
        html.app-dark .btn-action-delete,
        body.app-dark .btn-action-delete,
        [data-bs-theme="dark"] .btn-action-delete,
        .app-dark .btn-action-delete {
          background-color: #1e293b !important;
          color: #f87171 !important;
          border: 1px solid #334155 !important;
        }

        /* ── BẢNG MÀU GRADIENT ĐA SẮC CAO CẤP CHO BADGE & ACTION BUTTONS ── */
        .badge-tuyensinh-chromatic {
          background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 35%, #8b5cf6 70%, #ec4899 100%) !important;
          box-shadow: 0 3px 12px rgba(59, 130, 246, 0.4) !important;
          color: #ffffff !important;
          border: 1px solid rgba(255, 255, 255, 0.3) !important;
        }

        .badge-livedata-chromatic {
          background: linear-gradient(135deg, #f59e0b 0%, #ef4444 30%, #ec4899 65%, #8b5cf6 100%) !important;
          box-shadow: 0 3px 12px rgba(236, 72, 153, 0.4) !important;
          color: #ffffff !important;
          border: 1px solid rgba(255, 255, 255, 0.3) !important;
        }

        .btn-export-chromatic {
          background: linear-gradient(135deg, #059669 0%, #10b981 25%, #06b6d4 55%, #3b82f6 80%, #6366f1 100%) !important;
          box-shadow: 0 4px 15px rgba(16, 185, 129, 0.45) !important;
          color: #ffffff !important;
          border: none !important;
          font-weight: 800 !important;
        }
        .btn-export-chromatic:hover {
          transform: translateY(-2px) scale(1.04);
          box-shadow: 0 6px 22px rgba(16, 185, 129, 0.6) !important;
          color: #ffffff !important;
        }
        .btn-export-chromatic:active {
          transform: scale(0.96);
        }
        /* ── BẢNG MÀU KHU VỰC CHUẨN XANH #25A18E ── */
        .badge-region-teal {
          background-color: rgba(37, 161, 142, 0.12) !important;
          color: #0b685b !important;
          border: 1px solid #25a18e !important;
          font-weight: 800 !important;
        }
        html.app-dark .badge-region-teal,
        body.app-dark .badge-region-teal,
        [data-bs-theme="dark"] .badge-region-teal,
        .app-dark .badge-region-teal {
          background-color: rgba(37, 161, 142, 0.25) !important;
          color: #38dec5 !important;
          border: 1px solid rgba(37, 161, 142, 0.7) !important;
        }

        /* ── BẢNG MÀU HỆ TUYỂN SINH CHUẨN XANH #18A5A7 ── */
        .badge-system-teal {
          background-color: rgba(24, 165, 167, 0.12) !important;
          color: #0b686a !important;
          border: 1px solid #18a5a7 !important;
          font-weight: 800 !important;
        }
        html.app-dark .badge-system-teal,
        body.app-dark .badge-system-teal,
        [data-bs-theme="dark"] .badge-system-teal,
        .app-dark .badge-system-teal {
          background-color: rgba(24, 165, 167, 0.25) !important;
          color: #3bf2f5 !important;
          border: 1px solid rgba(24, 165, 167, 0.7) !important;
        }

        /* ── BẢNG MÀU HỌC BỔNG ĐA SẮC SANG TRỌNG #291850 ── */
        .badge-scholarship-chromatic {
          background: linear-gradient(135deg, #291850 0%, #4c1d95 35%, #7c3aed 70%, #c026d3 100%) !important;
          color: #ffffff !important;
          border: 1px solid rgba(255, 255, 255, 0.25) !important;
          box-shadow: 0 2px 8px rgba(41, 24, 80, 0.35) !important;
          font-weight: 800 !important;
        }
        .badge-scholarship-chromatic i {
          color: #fde047 !important;
        }
        html.app-dark .badge-scholarship-chromatic,
        body.app-dark .badge-scholarship-chromatic,
        [data-bs-theme="dark"] .badge-scholarship-chromatic,
        .app-dark .badge-scholarship-chromatic {
          background: linear-gradient(135deg, #291850 0%, #4c1d95 40%, #7e22ce 75%, #a21caf 100%) !important;
          color: #ffffff !important;
          border: 1px solid rgba(192, 38, 211, 0.5) !important;
          box-shadow: 0 2px 8px rgba(126, 34, 206, 0.4) !important;
        }
      `}</style>

      {/* ── 1. HEADER CHÍNH & CỤM NÚT GRADIENT CAO CẤP ── */}
      <div className="card border-0 rounded-3xl p-4 shadow-sm bg-white app-dark:bg-[#0f172a]! border border-slate-200 app-dark:border-slate-800! transition-all">
        <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
          
          <div>
            <div className="d-flex align-items-center gap-2 mb-1.5">
              <span
                className="badge badge-tuyensinh-chromatic px-3 py-1.5 rounded-xl text-[11px] font-black tracking-wide uppercase d-inline-flex align-items-center gap-1.5 transition-all hover:scale-105"
              >
                <i className="fa fa-graduation-cap"></i>
                <span>Tuyển sinh Du học</span>
              </span>
              <span
                className="badge badge-livedata-chromatic px-2.5 py-1.5 rounded-xl text-[11px] font-black tracking-wide d-inline-flex align-items-center gap-1.5 transition-all hover:scale-105"
              >
                <span className="d-inline-block rounded-circle bg-white" style={{ width: "6px", height: "6px", boxShadow: "0 0 6px #ffffff" }}></span>
                <i className="fa fa-rotate fa-spin" style={{ animationDuration: "4s", fontSize: "10px" }}></i>
                <span>Live Data Sync</span>
              </span>
            </div>

            <h4 className="fw-black tracking-tight mb-1 text-slate-900 app-dark:text-white!">
              <span className="bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Tra Cứu Trường Du Học Toàn Cầu
              </span>
            </h4>
            <p className="text-slate-600 app-dark:text-slate-400! text-xs mb-0 font-medium">
              Hệ thống tra cứu chỉ tiêu tuyển sinh, học phí, học bổng và kỳ nhập học các thị trường quốc tế
            </p>
          </div>

          {/* Cụm Nút Gradient Hành Động */}
          <div className="d-flex flex-wrap align-items-center gap-2">
            
            {/* Nút Ẩn/Hiện Bộ lọc (Indigo-Violet-Pink Gradient) */}
            <button
              type="button"
              onClick={() => setIsFilterVisible(!isFilterVisible)}
              className={`btn btn-sm px-3.5 py-2 rounded-xl text-xs font-bold text-white d-flex align-items-center gap-2 border-0 shadow-md transition-all hover:scale-105 active:scale-95 ${
                isFilterVisible ? "scale-105 ring-2 ring-indigo-400/50" : ""
              }`}
              style={{
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)",
                boxShadow: "0 4px 14px rgba(139, 92, 246, 0.35)",
              }}
            >
              <i className={`fa fa-filter text-xs transition-transform duration-300 ${isFilterVisible ? "rotate-180 text-amber-200" : "text-white"}`}></i>
              <span>{isFilterVisible ? "Ẩn bộ lọc" : "Hiện bộ lọc"}</span>
              {activeFilterCount > 0 && (
                <span
                  className="d-inline-flex align-items-center justify-content-center text-center select-none"
                  style={{
                    backgroundColor: "#ffffff",
                    color: "#4338ca",
                    fontWeight: "900",
                    fontSize: "11px",
                    minWidth: "20px",
                    height: "20px",
                    borderRadius: "9999px",
                    padding: "0 5px",
                    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.25)",
                    verticalAlign: "middle",
                    flexShrink: 0,
                  }}
                  title={`Đang áp dụng ${activeFilterCount} bộ lọc`}
                >
                  <span style={{ lineHeight: "1", display: "inline-block", textAlign: "center" }}>
                    {activeFilterCount}
                  </span>
                </span>
              )}
            </button>

            {/* Nút + Thêm trường (Sunset Crimson Gradient) */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => openSchoolModal()}
                className="btn btn-sm px-3.5 py-2 rounded-xl text-xs font-bold text-white d-flex align-items-center gap-1.5 border-0 shadow-md transition-all hover:scale-105 active:scale-95"
                style={{
                  background: "linear-gradient(135deg, #f43f5e 0%, #e11d48 50%, #fb923c 100%)",
                  boxShadow: "0 4px 14px rgba(244, 63, 94, 0.35)",
                }}
              >
                <i className="fa fa-plus text-xs"></i>
                <span>Thêm trường</span>
              </button>
            )}

            {/* Nút Quản lý Sheets nguồn (Ocean Cyan Gradient) */}
            {isAdmin && (
              <button
                type="button"
                onClick={handleOpenSourcesModal}
                className="btn btn-sm px-3.5 py-2 rounded-xl text-xs font-bold text-white d-flex align-items-center gap-1.5 border-0 shadow-md transition-all hover:scale-105 active:scale-95"
                style={{
                  background: "linear-gradient(135deg, #0284c7 0%, #0d9488 100%)",
                  boxShadow: "0 4px 14px rgba(2, 132, 199, 0.35)",
                }}
              >
                <i className="fa fa-table text-xs"></i>
                <span>Quản lý Sheets nguồn</span>
              </button>
            )}

            {/* Nút Xuất Excel / CSV (Đa sắc Emerald-Teal-Cyan-Blue-Indigo Gradient) */}
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={loading || filteredRecords.length === 0}
              className="btn btn-sm btn-export-chromatic px-3.5 py-2 rounded-xl text-xs d-flex align-items-center gap-1.5 transition-all hover:scale-105 active:scale-95"
            >
              <i className="fa fa-file-excel text-xs text-white"></i>
              <span className="text-white">Xuất Excel / CSV</span>
            </button>

            {/* Nút Làm mới (Đưa về phía bên phải cùng) */}
            <button
              type="button"
              onClick={() => fetchSchools()}
              disabled={loading}
              className="btn btn-sm px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-300 bg-slate-100 text-slate-800 hover:bg-slate-200 app-dark:bg-slate-800! app-dark:border-slate-700! app-dark:text-slate-200! transition-all hover:scale-105 active:scale-95 shadow-sm"
              title="Làm mới dữ liệu từ máy chủ"
            >
              <i className={`fa fa-sync-alt text-xs ${loading ? "fa-spin" : ""}`}></i>
              <span className="ms-1.5">Làm mới</span>
            </button>

          </div>
        </div>
      </div>

      {/* ── 2. KHU VỰC BỘ LỌC 3 CẤP (CÓ THỂ ẨN / HIỆN) ── */}
      {isFilterVisible && (
        <div className="card border-0 rounded-3xl p-3.5 shadow-sm bg-white app-dark:bg-[#0f172a]! border border-slate-200 app-dark:border-slate-800! transition-all duration-300">
          
          {/* CẤP 1: QUICK SWITCHER THỊ TRƯỜNG / CHÂU LỤC */}
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3 pb-3 border-bottom border-slate-200 app-dark:border-slate-800!">
            <div className="d-flex flex-wrap gap-2">
              {continentTabs.map(tab => {
                const isActive = selectedContinent.toLowerCase() === tab.id.toLowerCase();
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setSelectedContinent(tab.id);
                      setSelectedCountry("all"); // Reset lọc quốc gia khi chuyển châu lục
                    }}
                    className={`btn btn-sm px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 d-flex align-items-center gap-1.5 border ${
                      isActive
                        ? "text-white border-transparent shadow-md scale-105"
                        : "border-slate-300 bg-slate-100 text-slate-800 hover:bg-slate-200 app-dark:bg-slate-900/80! app-dark:border-slate-800! app-dark:text-slate-300! app-dark:hover:bg-slate-800!"
                    }`}
                    style={
                      isActive
                        ? {
                            background: "linear-gradient(135deg, #0284c7 0%, #2563eb 50%, #4f46e5 100%)",
                            boxShadow: "0 4px 12px rgba(37, 99, 235, 0.35)",
                          }
                        : {}
                    }
                  >
                    <i className={`fa ${tab.icon} text-xs`}></i>
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <span className="text-slate-600 app-dark:text-slate-400! text-xs font-bold">
              Khả dụng: <strong className="text-cyan-600 app-dark:text-cyan-400! font-black">{filteredRecords.length}</strong> / {records.length} trường
            </span>
          </div>

          {/* CẤP 2 & 3: FORM BỘ LỌC CHI TIẾT */}
          <div className="row g-2 align-items-center">
            
            {/* Ô & Nút Tìm kiếm Capsule Hiện Đại */}
            <div className="col-12 col-lg-3">
              <div className="d-flex align-items-center bg-slate-100 app-dark:bg-slate-900/90! border border-slate-300 app-dark:border-slate-700/90! rounded-xl p-1 shadow-sm focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-500/30 transition-all">
                <div className="d-flex align-items-center justify-content-center ps-2.5 pe-1.5 text-cyan-600 app-dark:text-cyan-400!">
                  <i className="fa fa-search text-xs"></i>
                </div>
                <input
                  type="text"
                  className="form-control form-control-sm border-0 bg-transparent text-slate-900 app-dark:text-slate-100! font-semibold text-xs shadow-none p-0 focus:outline-none flex-grow-1"
                  placeholder="Tìm tên trường, ngành, khu vực, GPA..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchSchools()}
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm("");
                      fetchSchools();
                    }}
                    className="btn btn-link btn-sm p-0 px-1.5 text-slate-400 hover:text-rose-500 app-dark:hover:text-rose-400! text-xs text-decoration-none"
                    title="Xóa nội dung tìm kiếm"
                  >
                    <i className="fa fa-times-circle"></i>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => fetchSchools()}
                  className="btn btn-sm px-2.5 py-1 rounded-lg text-[11px] font-extrabold text-white border-0 shadow-sm transition-all hover:scale-105 active:scale-95 ms-1 d-flex align-items-center gap-1"
                  style={{
                    background: "linear-gradient(135deg, #0284c7 0%, #2563eb 100%)",
                    boxShadow: "0 2px 6px rgba(37, 99, 235, 0.35)",
                  }}
                  title="Tìm kiếm ngay"
                >
                  <i className="fa fa-arrow-right text-[10px]"></i>
                  <span>Tìm</span>
                </button>
              </div>
            </div>

            {/* Lọc Quốc Gia */}
            <div className="col-6 col-lg-2">
              <select
                className="form-select form-select-sm py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-900 border-slate-300 app-dark:bg-slate-900! app-dark:text-slate-200! app-dark:border-slate-700!"
                value={selectedCountry}
                onChange={(e) => handleCountryChange(e.target.value)}
              >
                <option value="all">🌍 Tất cả quốc gia ({dynamicOptions.countries.length})</option>
                {dynamicOptions.countries.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Lọc Hệ Tuyển Sinh */}
            <div className="col-6 col-lg-2">
              <select
                className="form-select form-select-sm py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-900 border-slate-300 app-dark:bg-slate-900! app-dark:text-slate-200! app-dark:border-slate-700!"
                value={selectedSystem}
                onChange={(e) => setSelectedSystem(e.target.value)}
              >
                <option value="all">🎓 Hệ tuyển sinh</option>
                {dynamicOptions.systems.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Lọc Chuyên Ngành */}
            <div className="col-6 col-lg-2">
              <select
                className="form-select form-select-sm py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-900 border-slate-300 app-dark:bg-slate-900! app-dark:text-slate-200! app-dark:border-slate-700!"
                value={selectedMajor}
                onChange={(e) => setSelectedMajor(e.target.value)}
              >
                <option value="all">📚 Chuyên ngành</option>
                {dynamicOptions.majors.slice(0, 50).map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* Lọc Khu Vực */}
            <div className="col-6 col-lg-2">
              <select
                className="form-select form-select-sm py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-900 border-slate-300 app-dark:bg-slate-900! app-dark:text-slate-200! app-dark:border-slate-700!"
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
              >
                <option value="all">📍 Tất cả khu vực ({dynamicOptions.regions.length})</option>
                {dynamicOptions.regions.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* Nút Đặt lại */}
            <div className="col-12 col-lg-1 text-end">
              <button
                type="button"
                onClick={handleResetFilters}
                className="btn btn-sm w-100 py-2 rounded-xl text-xs font-bold border border-slate-300 bg-slate-100 text-slate-800 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300 app-dark:bg-slate-900! app-dark:text-slate-300! app-dark:border-slate-700! app-dark:hover:bg-rose-950! app-dark:hover:text-rose-400! transition-all"
                title="Đặt lại toàn bộ bộ lọc"
              >
                <i className="fa fa-redo me-1 text-xs"></i>
                <span>Đặt lại</span>
              </button>
            </div>

          </div>

          {/* DÒNG PHỤ CẤP 3: HỌC PHÍ & KỲ NHẬP HỌC */}
          <div className="row g-2 align-items-center mt-1 pt-2 border-top border-slate-200 app-dark:border-slate-800/60!">
            <div className="col-6 col-lg-3">
              <select
                className="form-select form-select-sm py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-900 border-slate-300 app-dark:bg-slate-900! app-dark:text-slate-200! app-dark:border-slate-700!"
                value={selectedIntake}
                onChange={(e) => setSelectedIntake(e.target.value)}
              >
                {availableIntakes.map(i => (
                  <option key={i.id} value={i.id}>{i.label}</option>
                ))}
              </select>
            </div>

            <div className="col-6 col-lg-3">
              <div className="d-flex align-items-center gap-1.5">
                <span className="text-slate-600 app-dark:text-slate-400! text-xs font-bold text-nowrap"><i className="fa fa-money-bill me-1 text-emerald-600"></i>Học phí từ:</span>
                <input
                  type="number"
                  min="0"
                  className="form-control form-control-sm py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-900 border-slate-300 app-dark:bg-slate-900/80! app-dark:text-slate-100! app-dark:border-slate-700/80!"
                  placeholder="0"
                  value={budgetMin}
                  onChange={(e) => setBudgetMin(e.target.value)}
                />
              </div>
            </div>

            <div className="col-6 col-lg-3">
              <div className="d-flex align-items-center gap-1.5">
                <span className="text-slate-600 app-dark:text-slate-400! text-xs font-bold text-nowrap">Đến {tuitionCurrencyLabel ? `(${tuitionCurrencyLabel})` : ""}:</span>
                <input
                  type="number"
                  min="0"
                  className="form-control form-control-sm py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-900 border-slate-300 app-dark:bg-slate-900/80! app-dark:text-slate-100! app-dark:border-slate-700/80!"
                  placeholder="Tối đa"
                  value={budgetMax}
                  onChange={(e) => setBudgetMax(e.target.value)}
                />
              </div>
            </div>

            <div className="col-6 col-lg-3 text-end">
              {activeFilterCount > 0 && (
                <span className="badge bg-cyan-100 text-cyan-800 border border-cyan-300 app-dark:bg-cyan-950/80! app-dark:text-cyan-300! app-dark:border-cyan-700/60! px-2.5 py-1 rounded-pill text-xs font-bold">
                  Đang lọc {activeFilterCount} tiêu chí
                </span>
              )}
            </div>
          </div>

          {/* ACTIVE FILTER CHIPS */}
          {activeFilterCount > 0 && (
            <div className="d-flex flex-wrap align-items-center gap-2 mt-2.5 pt-2.5 border-top border-slate-200 app-dark:border-slate-800/80!">
              <span className="text-[11px] font-extrabold text-slate-500 app-dark:text-slate-400! uppercase tracking-wider">Đang lọc:</span>
              
              {selectedContinent !== "all" && (
                <span className="badge bg-cyan-100 text-cyan-900 border border-cyan-300 app-dark:bg-cyan-950/80 app-dark:text-cyan-300 app-dark:border-cyan-700 rounded-lg px-2.5 py-1 text-[11px] font-bold d-inline-flex align-items-center gap-1.5">
                  Thị trường: {selectedContinent}
                  <i className="fa fa-times cursor-pointer hover:text-rose-600" onClick={() => setSelectedContinent("all")}></i>
                </span>
              )}

              {selectedCountry !== "all" && (
                <span className="badge bg-blue-100 text-blue-900 border border-blue-300 app-dark:bg-blue-950/80 app-dark:text-blue-300 app-dark:border-blue-700 rounded-lg px-2.5 py-1 text-[11px] font-bold d-inline-flex align-items-center gap-1.5">
                  Quốc gia: {selectedCountry}
                  <i className="fa fa-times cursor-pointer hover:text-rose-600" onClick={() => setSelectedCountry("all")}></i>
                </span>
              )}

              {selectedSystem !== "all" && (
                <span className="badge badge-system-teal rounded-lg px-2.5 py-1 text-[11px] font-extrabold d-inline-flex align-items-center gap-1.5">
                  Hệ: {selectedSystem}
                  <i className="fa fa-times cursor-pointer hover:text-rose-600" onClick={() => setSelectedSystem("all")}></i>
                </span>
              )}

              {selectedMajor !== "all" && (
                <span className="badge bg-purple-100 text-purple-900 border border-purple-300 app-dark:bg-purple-950/80 app-dark:text-purple-300 app-dark:border-purple-700 rounded-lg px-2.5 py-1 text-[11px] font-bold d-inline-flex align-items-center gap-1.5">
                  Ngành: {selectedMajor}
                  <i className="fa fa-times cursor-pointer hover:text-rose-600" onClick={() => setSelectedMajor("all")}></i>
                </span>
              )}

              {selectedRegion !== "all" && (
                <span className="badge badge-region-teal rounded-lg px-2.5 py-1 text-[11px] font-extrabold d-inline-flex align-items-center gap-1.5">
                  Khu vực: {selectedRegion}
                  <i className="fa fa-times cursor-pointer hover:text-rose-600" onClick={() => setSelectedRegion("all")}></i>
                </span>
              )}

              {searchTerm && (
                <span className="badge bg-slate-200 text-slate-900 border border-slate-400 app-dark:bg-slate-800 app-dark:text-white app-dark:border-slate-600 rounded-lg px-2.5 py-1 text-[11px] font-bold d-inline-flex align-items-center gap-1.5">
                  Từ khóa: "{searchTerm}"
                  <i className="fa fa-times cursor-pointer hover:text-rose-600" onClick={() => setSearchTerm("")}></i>
                </span>
              )}

              <button
                type="button"
                onClick={handleResetFilters}
                className="btn btn-link text-[11px] text-rose-600 font-extrabold p-0 ms-2 text-decoration-none hover:underline"
              >
                Xóa tất cả
              </button>
            </div>
          )}

        </div>
      )}

      {/* ── 3. BẢNG DỮ LIỆU TRƯỜNG HỌC (STICKY HEADER ĐẬM ĐẶC 100%, CHỐNG ĐÈ CHỮ) ── */}
      <div className="card border-0 rounded-3xl shadow-sm bg-white app-dark:bg-[#0f172a]! border border-slate-200 app-dark:border-slate-800! flex-grow-1 overflow-hidden d-flex flex-column transition-colors duration-300">
        
        {/* Header danh sách */}
        <div className="px-4 py-3 border-bottom border-slate-200 app-dark:border-slate-800! d-flex flex-wrap align-items-center justify-content-between gap-2 bg-slate-50 app-dark:bg-slate-900/60!">
          <div className="d-flex align-items-center gap-2">
            <h6 className="fw-black text-slate-900 app-dark:text-white! mb-0 text-sm">
              Danh Sách Trường Du Học
            </h6>
            <span
              className="badge px-3 py-1 rounded-xl text-[11px] font-black text-white shadow-sm border border-white/20 d-inline-flex align-items-center gap-1.5"
              style={{
                background: "linear-gradient(135deg, #00A5CF 0%, #0084a8 100%)",
                boxShadow: "0 2px 8px rgba(0, 165, 207, 0.45)",
                color: "#ffffff",
              }}
            >
              <i className="fa fa-globe text-[10px]"></i>
              <span>{selectedContinent === "all" ? "Toàn cầu" : selectedContinent}</span>
            </span>
          </div>

          <div className="d-flex align-items-center gap-2">
            {/* Nút Hướng dẫn chỉnh cột cho nhân viên */}
            <button
              type="button"
              onClick={() => setIsGuideModalOpen(true)}
              className="btn btn-xs px-2.5 py-1 rounded-xl text-[11px] font-bold border border-cyan-300 bg-cyan-50/80 text-cyan-800 hover:bg-cyan-100 app-dark:bg-cyan-950/60! app-dark:border-cyan-800! app-dark:text-cyan-300! app-dark:hover:bg-cyan-900/80! transition-all d-flex align-items-center gap-1.5 shadow-xs"
              title="Xem hướng dẫn tùy chỉnh độ rộng cột và khoảng cách bảng"
            >
              <i className="fa fa-circle-question text-cyan-600 app-dark:text-cyan-400!"></i>
              <span>Hướng dẫn chỉnh cột</span>
            </button>

            {/* Nút đặt lại độ rộng cột nếu đã kéo chỉnh */}
            {Object.keys(columnWidths).length > 0 && (
              <button
                type="button"
                onClick={handleResetColumnWidths}
                className="btn btn-xs px-2 py-1 rounded-lg text-[11px] font-bold border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 app-dark:bg-slate-800! app-dark:text-slate-300! app-dark:border-slate-700! app-dark:hover:bg-slate-700! transition-all shadow-xs"
                title="Khôi phục độ rộng mặc định của tất cả các cột"
              >
                <i className="fa fa-arrows-left-right me-1 text-cyan-600 app-dark:text-cyan-400!"></i>
                <span>Đặt lại cột</span>
              </button>
            )}

            {/* Bộ chọn khoảng cách / mật độ hiển thị (Tùy chỉnh khoảng cách thẻ) */}
            <div className="d-flex align-items-center gap-1.5">
              <span className="text-slate-500 app-dark:text-slate-400! text-[11px] font-bold d-none d-sm-inline">
                Khoảng cách:
              </span>
              <div className="btn-group btn-group-sm bg-slate-200/80 app-dark:bg-slate-800! p-0.5 rounded-xl border border-slate-300 app-dark:border-slate-700!">
                <button
                  type="button"
                  onClick={() => setTableDensity("compact")}
                  className={`btn btn-xs px-2 py-0.5 rounded-lg text-[11px] font-bold border-0 transition-all ${
                    tableDensity === "compact"
                      ? "bg-white text-cyan-700 app-dark:bg-cyan-600! app-dark:text-white! shadow-xs"
                      : "text-slate-600 app-dark:text-slate-400!"
                  }`}
                  title="Hiển thị gọn gàng"
                >
                  Gọn
                </button>
                <button
                  type="button"
                  onClick={() => setTableDensity("normal")}
                  className={`btn btn-xs px-2 py-0.5 rounded-lg text-[11px] font-bold border-0 transition-all ${
                    tableDensity === "normal"
                      ? "bg-white text-cyan-700 app-dark:bg-cyan-600! app-dark:text-white! shadow-xs"
                      : "text-slate-600 app-dark:text-slate-400!"
                  }`}
                  title="Hiển thị vừa vặn tiêu chuẩn"
                >
                  Vừa
                </button>
                <button
                  type="button"
                  onClick={() => setTableDensity("spacious")}
                  className={`btn btn-xs px-2 py-0.5 rounded-lg text-[11px] font-bold border-0 transition-all ${
                    tableDensity === "spacious"
                      ? "bg-white text-cyan-700 app-dark:bg-cyan-600! app-dark:text-white! shadow-xs"
                      : "text-slate-600 app-dark:text-slate-400!"
                  }`}
                  title="Hiển thị rộng rãi, thoáng mắt"
                >
                  Thoáng
                </button>
              </div>
            </div>

            <span className="text-slate-600 app-dark:text-slate-400! text-xs font-bold">
              Hiển thị <strong className="text-slate-900 app-dark:text-white! font-black">{filteredRecords.length}</strong> / {records.length} trường
            </span>
          </div>
        </div>

        {/* Khung cuộn bảng */}
        <div className="table-responsive flex-grow-1 overflow-auto" style={{ maxHeight: "660px" }}>
          <table className="table align-middle mb-0 text-xs">
            
            {/* THEAD CỐ ĐỊNH VỚI ICON, TYPOGRAPHY & KHẢ NĂNG KÉO CHỈNH ĐỘ RỘNG CỘT */}
            <thead className="school-sticky-thead">
              <tr>
                {headers.filter(h => h !== "_id").map(h => {
                  const cfg = getColumnConfig(h, columnWidths);
                  const icon = getHeaderIcon(h);
                  return (
                    <th
                      key={h}
                      style={{ width: cfg.width, minWidth: cfg.minWidth, textAlign: cfg.align, position: "relative" }}
                      className="py-3 px-3 text-nowrap font-black uppercase text-[11px] select-none"
                    >
                      <div className={`d-inline-flex align-items-center gap-1.5 ${cfg.align === "center" ? "justify-content-center w-100" : ""}`}>
                        <i className={`fa ${icon} text-[10px] text-cyan-600 app-dark:text-cyan-400!`}></i>
                        <span>{h}</span>
                      </div>
                      {/* Tay cầm kéo chỉnh độ rộng cột */}
                      <div
                        className="school-col-resizer"
                        onMouseDown={(e) => handleResizeStart(h, e)}
                        onDoubleClick={() => {
                          setColumnWidths(prev => {
                            const next = { ...prev };
                            delete next[h];
                            try { localStorage.setItem("school_table_custom_widths", JSON.stringify(next)); } catch {}
                            return next;
                          });
                        }}
                        title="Kéo sang trái/phải để tùy chỉnh độ rộng cột, Nhấp đúp để đặt lại"
                      />
                    </th>
                  );
                })}
                <th
                  className="py-3 px-3 font-black uppercase text-[11px] text-center text-nowrap school-sticky-thead"
                  style={{ width: "120px", position: "sticky", right: 0, zIndex: 25 }}
                >
                  <div className="d-inline-flex align-items-center justify-content-center gap-1.5 w-100">
                    <i className="fa fa-bolt text-[10px] text-amber-500"></i>
                    <span>Thao tác</span>
                  </div>
                </th>
              </tr>
            </thead>

            {/* TBODY DỮ LIỆU TƯƠNG PHẢN CAO & ĐƯỢC CHUẨN HÓA GIAO DIỆN */}
            <tbody className="divide-y divide-slate-100 app-dark:divide-slate-800/80! bg-white app-dark:bg-[#0f172a]!">
              {loading ? (
                <tr>
                  <td colSpan={headers.length + 1} className="text-center py-5">
                    <div className="spinner-border spinner-border-sm text-cyan-600 me-2" role="status"></div>
                    <span className="text-slate-600 app-dark:text-slate-400! font-bold">Đang tải dữ liệu trường học từ hệ thống...</span>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={headers.length + 1} className="text-center py-5 text-rose-600 font-bold">
                    <i className="fa fa-circle-exclamation me-1"></i> {error}
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={headers.length + 1} className="text-center py-5">
                    <div className="py-4 text-center">
                      <div className="d-inline-flex align-items-center justify-content-center bg-slate-100 app-dark:bg-slate-800! rounded-3xl p-4 mb-3 border border-slate-200 app-dark:border-slate-700!">
                        <i className="fa fa-graduation-cap display-6 text-slate-400 app-dark:text-slate-400!"></i>
                      </div>
                      <div className="fw-black text-slate-800 app-dark:text-slate-100! fs-6 mb-1">
                        Không tìm thấy trường học phù hợp
                      </div>
                      <div className="text-slate-500 app-dark:text-slate-400! text-xs font-semibold mb-3">
                        Thử chuyển sang tab "Tất cả thị trường" hoặc đặt lại bộ lọc tìm kiếm
                      </div>
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="btn btn-sm px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-600 text-white border-0 shadow-md transition-all"
                      >
                        <i className="fa fa-redo me-1.5"></i> Đặt lại tất cả bộ lọc
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((row, rowIdx) => {
                  const isSelected = selectedSchool && selectedSchool._id === row._id;
                  return (
                    <tr
                      key={row._id || rowIdx}
                      style={{
                        cursor: "pointer",
                        borderLeft: isSelected ? "4px solid #06b6d4" : "4px solid transparent",
                      }}
                      onClick={() => handleOpenDetailModal(row)}
                      className={`table-row-item transition-colors duration-150 ${
                        isSelected
                          ? "bg-cyan-50/80 app-dark:bg-cyan-950/40! font-semibold"
                          : "hover:bg-slate-50 app-dark:hover:bg-slate-800/60!"
                      }`}
                    >
                      {headers.filter(h => h !== "_id").map(h => {
                        const val = row[h] || "";
                        const isLink = String(val).startsWith("http");
                        const isImage = isLink && (
                          h.toLowerCase().includes("ảnh") || h.toLowerCase().includes("image") || /\.(jpg|jpeg|png|webp|gif|svg)/i.test(val.split("?")[0])
                        );

                        const isSttCol = h.toLowerCase() === "stt" || h.toLowerCase() === "#";
                        const isNameCol = h.toLowerCase().includes("tên trường") || h.toLowerCase().includes("ten truong");
                        const isSystemCol = h.toLowerCase().includes("hệ") || h.toLowerCase().includes("system");
                        const isRegionCol = h.toLowerCase().includes("khu vực") || h.toLowerCase().includes("region");
                        const isScholarshipCol = h.toLowerCase().includes("học bổng") || h.toLowerCase().includes("hoc bong");
                        const isDeadlineCol = h.toLowerCase().includes("hạn") || h.toLowerCase().includes("han");
                        const isTuitionCol = h.toLowerCase().includes("học phí") || h.toLowerCase().includes("hoc phi") || h.toLowerCase().includes("ký túc") || h.toLowerCase().includes("ktx");

                        const cfg = getColumnConfig(h, columnWidths);

                        const cellPadding =
                          tableDensity === "compact" ? "px-2 py-1.5" : tableDensity === "spacious" ? "px-4 py-3.5" : "px-3 py-2.5";

                        const isActionOrStt = isSttCol || isImage || isLink;

                        return (
                          <td
                            key={h}
                            className={`${cellPadding} text-truncate`}
                            style={{
                              width: cfg.width,
                              minWidth: cfg.minWidth,
                              maxWidth: cfg.width,
                              textAlign: cfg.align,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                            title={typeof val === "string" ? val : ""}
                          >
                            {isSttCol ? (
                              <div className="text-center">
                                <span className="badge rounded-pill badge-stt-gentle px-3 py-1 text-[11px] text-nowrap">
                                  #{rowIdx + 1}
                                </span>
                              </div>
                            ) : isImage ? (
                              <div className="text-center">
                                <a
                                  href={val}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={e => e.stopPropagation()}
                                  className="btn btn-xs py-1 px-3 rounded-lg text-[11px] font-bold bg-purple-50 text-purple-700 hover:bg-purple-600 hover:text-white app-dark:bg-purple-950/70! app-dark:text-purple-300! app-dark:hover:bg-purple-600! border border-purple-200 app-dark:border-purple-800! d-inline-flex align-items-center gap-1.5 shadow-xs transition-all text-nowrap"
                                >
                                  <i className="fa fa-image text-[10px]"></i>
                                  <span>Xem ảnh</span>
                                </a>
                              </div>
                            ) : isLink ? (
                              <div className="text-center">
                                <a
                                  href={val}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={e => e.stopPropagation()}
                                  className="btn btn-xs py-1 px-3 rounded-lg text-[11px] font-bold bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white app-dark:bg-blue-950/70! app-dark:text-blue-300! app-dark:hover:bg-blue-600! border border-blue-200 app-dark:border-blue-800! d-inline-flex align-items-center gap-1.5 shadow-xs transition-all text-nowrap"
                                >
                                  <i className="fa fa-globe text-[10px]"></i>
                                  <span>Truy cập</span>
                                </a>
                              </div>
                            ) : isNameCol ? (
                              <div className="d-flex align-items-center gap-2 min-w-0 w-100 overflow-hidden">
                                <div className="w-7 h-7 rounded-lg bg-cyan-100 app-dark:bg-cyan-950/80! text-cyan-700 app-dark:text-cyan-300! d-flex align-items-center justify-content-center flex-shrink-0 font-black shadow-xs">
                                  <i className="fa fa-school text-[11px]"></i>
                                </div>
                                <span className="font-extrabold text-slate-900 app-dark:text-white! text-xs text-truncate flex-grow-1" title={val}>
                                  {highlightText(val, searchTerm)}
                                </span>
                              </div>
                            ) : isSystemCol && val ? (
                              <div className="text-center w-100 overflow-hidden">
                                <span className="badge badge-system-teal px-3 py-1 rounded-md text-[11px] font-extrabold d-inline-flex align-items-center gap-1.5 shadow-xs max-w-full text-truncate" title={val}>
                                  <i className="fa fa-graduation-cap text-[10px] flex-shrink-0"></i>
                                  <span className="text-truncate">{highlightText(val, searchTerm)}</span>
                                </span>
                              </div>
                            ) : isRegionCol && val ? (
                              <div className="text-center w-100 overflow-hidden">
                                <span className="badge badge-region-teal px-3 py-1 rounded-md text-[11px] font-extrabold d-inline-flex align-items-center gap-1.5 shadow-xs max-w-full text-truncate" title={val}>
                                  <i className="fa fa-location-dot text-[9px] flex-shrink-0"></i>
                                  <span className="text-truncate">{highlightText(val, searchTerm)}</span>
                                </span>
                              </div>
                            ) : isScholarshipCol ? (
                              val && val.trim() !== "-" && val.trim() !== "0" && val.trim() !== "" ? (
                                <span className="badge badge-scholarship-chromatic px-3 py-1 rounded-md text-[11px] font-extrabold d-inline-flex align-items-center gap-1.5 shadow-xs max-w-full text-truncate" title={val}>
                                  <i className="fa fa-award text-[10px] flex-shrink-0"></i>
                                  <span className="text-truncate">{highlightText(val, searchTerm)}</span>
                                </span>
                              ) : (
                                <span className="text-slate-400 font-mono text-xs">{val || "-"}</span>
                              )
                            ) : isDeadlineCol && val ? (
                              <span className="badge badge-deadline-crimson px-3 py-1 rounded-md text-[11px] font-extrabold d-inline-flex align-items-center gap-1.5 shadow-xs max-w-full text-truncate" title={val}>
                                <i className="fa fa-calendar-check text-[10px] flex-shrink-0"></i>
                                <span className="text-truncate">{highlightText(val, searchTerm)}</span>
                              </span>
                            ) : isTuitionCol && val ? (
                              <span className="font-extrabold text-emerald-700 app-dark:text-emerald-400! text-xs font-mono text-truncate d-block w-100" title={val}>
                                {highlightText(val, searchTerm)}
                              </span>
                            ) : (
                              <span className="text-slate-800 app-dark:text-slate-200! font-medium text-truncate d-block w-100" title={val}>
                                {highlightText(val, searchTerm)}
                              </span>
                            )}
                          </td>
                        );
                      })}
                      <td
                        className={`text-center ${tableDensity === "compact" ? "px-2 py-1.5" : tableDensity === "spacious" ? "px-3 py-3" : "px-2 py-2"} school-sticky-action-col`}
                        onClick={e => e.stopPropagation()}
                      >
                        <div className="d-flex justify-content-center gap-1.5">
                          <button
                            className="btn btn-sm btn-action-view p-1.5 px-2 rounded-lg text-xs font-bold transition-all shadow-xs"
                            type="button"
                            title="Xem chi tiết"
                            onClick={() => handleOpenDetailModal(row)}
                          >
                            <i className="fa fa-eye"></i>
                          </button>
                          {isAdmin && (
                            <>
                              <button
                                className="btn btn-sm btn-action-edit p-1.5 px-2 rounded-lg text-xs font-bold transition-all shadow-xs"
                                type="button"
                                title="Sửa"
                                onClick={() => openSchoolModal(row)}
                              >
                                <i className="fa fa-pen"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-action-delete p-1.5 px-2 rounded-lg text-xs font-bold transition-all shadow-xs"
                                type="button"
                                title="Xóa"
                                onClick={(e) => handleSchoolDelete(row._id, e)}
                              >
                                <i className="fa fa-trash"></i>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── DETAIL MODAL ── */}
      {selectedSchool && (
        <div className="fixed inset-0 z-[1050] flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm">
          <div className="flex w-full max-w-[760px] flex-col overflow-hidden rounded-3xl bg-white app-dark:bg-[#0f172a]! shadow-2xl border border-slate-200 app-dark:border-slate-800!" style={{ maxHeight: "calc(100vh - 40px)" }}>
            <div className="d-flex flex-shrink-0 justify-content-between align-items-center border-bottom border-slate-200 app-dark:border-slate-800! p-4 bg-slate-50 app-dark:bg-slate-900/60!">
              <div className="d-flex align-items-center gap-2.5">
                <div className="d-flex align-items-center justify-content-center bg-cyan-600 text-white rounded-2xl p-2" style={{ width: "40px", height: "40px" }}>
                  <i className="fa fa-graduation-cap"></i>
                </div>
                <div>
                  <h5 className="m-0 font-extrabold text-slate-900 app-dark:text-slate-100!">
                    {selectedSchool["Tên trường"] || selectedSchool.name || "Chi tiết trường học"}
                  </h5>
                  <div className="d-flex align-items-center gap-1.5 mt-1">
                    {(selectedSchool["Quốc gia"] || selectedCountry !== "all") && (
                      <span className="badge bg-cyan-600 text-white text-xs font-bold">
                        {selectedSchool["Quốc gia"] || selectedCountry}
                      </span>
                    )}
                    {(selectedSchool["Khu vực"] || selectedSchool["Khu vực "]) && (
                      <span className="badge badge-region-teal text-xs font-extrabold">
                        {selectedSchool["Khu vực"] || selectedSchool["Khu vực "]}
                      </span>
                    )}
                    {(selectedSchool["Hệ tuyển sinh"] || selectedSchool["Hệ tuyển sinh "]) && (
                      <span className="badge badge-system-teal text-xs font-extrabold">
                        {selectedSchool["Hệ tuyển sinh"] || selectedSchool["Hệ tuyển sinh "]}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button className="btn btn-sm btn-light rounded-circle p-1 border" type="button" onClick={() => setSelectedSchool(null)}>
                <i className="fa fa-xmark"></i>
              </button>
            </div>

            <div className="px-4 pt-2 border-bottom border-slate-200 app-dark:border-slate-800! bg-slate-50 app-dark:bg-slate-900/40!">
              <ul className="nav nav-tabs border-0 flex-nowrap overflow-x-auto text-nowrap gap-1">
                {[
                  { id: "overview", label: "Tổng quan & Địa chỉ", icon: "fa-circle-info" },
                  { id: "requirements", label: "Yêu cầu & Hạn nộp", icon: "fa-calendar-check" },
                  { id: "tuition", label: "Học phí & KTX", icon: "fa-receipt" },
                  { id: "scholarship", label: "Học bổng", icon: "fa-award" }
                ].map(tab => (
                  <li className="nav-item" key={tab.id}>
                    <button
                      className={`nav-link border-0 px-3 py-2.5 font-bold text-xs transition-all d-flex align-items-center gap-1.5 ${
                        activeTab === tab.id
                          ? "active text-cyan-700 app-dark:text-cyan-400! border-bottom border-3 border-cyan-500 bg-white app-dark:bg-[#0f172a]!"
                          : "text-slate-600 app-dark:text-slate-400! bg-transparent"
                      }`}
                      style={{ borderRadius: "8px 8px 0 0" }}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                    >
                      <i className={`fa ${tab.icon}`}></i>
                      <span>{tab.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 overflow-y-auto min-h-0 flex-1">
              <div className="row g-3">
                {(() => {
                  const displayHeaders = headers.filter(h => h !== "_id");
                  const tabHeaders = displayHeaders.filter(h => getTabForHeader(h) === activeTab && selectedSchool[h]);
                  if (tabHeaders.length === 0) {
                    return <div className="col-12 text-center py-5 text-slate-500 font-bold">Không có dữ liệu cho mục này.</div>;
                  }

                  return tabHeaders.map(h => {
                    const value = selectedSchool[h] || "";
                    const isLink = String(value).startsWith("http");
                    const isImage = isLink && (
                      h.toLowerCase().includes("ảnh") || h.toLowerCase().includes("image") || /\.(jpg|jpeg|png|webp|gif|svg)/i.test(value.split("?")[0])
                    );

                    const isLargeField = ["Địa chỉ", "Điều kiện tuyển sinh", "Học bổng", "Chuyên ngành", "Học phí học tiếng (1+4) TWD", "Học phí chuyên ngành (TWD)", "Ký túc xá (đài tệ)"].includes(h) || h.trim() === "File ảnh thông báo" || isImage;

                    return (
                      <div className={isLargeField ? "col-12" : "col-6"} key={h}>
                        <span className="text-slate-600 app-dark:text-slate-400! small d-block font-extrabold mb-1 text-xs" style={{ textTransform: "uppercase" }}>{h}</span>
                        <div className="bg-slate-100 app-dark:bg-slate-900/60! rounded-2xl p-3 border border-slate-200 app-dark:border-slate-800!">
                          {isImage ? (
                            <div className="text-center bg-white app-dark:bg-slate-900! rounded-xl p-3 border my-1 shadow-sm">
                              <img src={value} alt={h} className="img-fluid rounded border" style={{ maxHeight: "320px", objectFit: "contain" }} />
                              <div className="d-flex justify-content-center gap-2 mt-3">
                                <a href={value} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-primary rounded-xl px-3 text-xs font-bold">
                                  <i className="fa fa-arrow-up-right-from-square me-1"></i> Mở ảnh gốc
                                </a>
                              </div>
                            </div>
                          ) : isLink ? (
                            <a href={value} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-primary rounded-xl px-3 d-inline-flex align-items-center gap-1.5 text-xs font-bold">
                              <i className="fa fa-arrow-up-right-from-square"></i>
                              <span>Mở {h.trim()}</span>
                            </a>
                          ) : (
                            <span className="text-slate-900 app-dark:text-slate-100! text-break text-xs font-semibold" style={{ whiteSpace: "pre-wrap" }}>
                              {highlightText(value, searchTerm)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
            <div className="d-flex flex-shrink-0 justify-content-end gap-2 border-top border-slate-200 app-dark:border-slate-800! p-4 bg-slate-50 app-dark:bg-slate-900/60!">
              <button type="button" className="btn btn-primary rounded-xl px-4 font-bold text-xs" onClick={() => setSelectedSchool(null)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CRUD SCHOOL MODAL ── */}
      {isSchoolModalOpen && (
        <div className="fixed inset-0 z-[1060] flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm">
          <form className="flex w-full max-w-[840px] flex-col overflow-hidden rounded-3xl bg-white app-dark:bg-[#0f172a]! shadow-2xl border border-slate-200 app-dark:border-slate-800!" style={{ maxHeight: "calc(100vh - 40px)" }} onSubmit={handleSchoolSubmit}>
            <div className="d-flex flex-shrink-0 justify-content-between align-items-center border-bottom border-slate-200 app-dark:border-slate-800! p-4 bg-slate-50 app-dark:bg-slate-900/60!">
              <h5 className="m-0 font-extrabold text-slate-900 app-dark:text-slate-100!">
                {editingSchool ? "Chỉnh sửa thông tin trường" : "Thêm trường du học mới"}
              </h5>
              <button className="btn btn-sm btn-light rounded-circle p-1 border" type="button" onClick={() => setIsSchoolModalOpen(false)}>
                <i className="fa fa-xmark"></i>
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 row g-3 text-xs">
              <div className="col-12 col-md-6">
                <label className="form-label font-bold text-slate-800 app-dark:text-slate-200!">Tên trường *</label>
                <input type="text" className="form-control form-control-sm rounded-xl font-semibold" required value={schoolForm.name} onChange={e => setSchoolForm({ ...schoolForm, name: e.target.value })} />
              </div>
              <div className="col-6 col-md-3">
                <label className="form-label font-bold text-slate-800 app-dark:text-slate-200!">Quốc gia *</label>
                <input type="text" className="form-control form-control-sm rounded-xl font-semibold" required placeholder="Ví dụ: Đài Loan, Đức" value={schoolForm.country} onChange={e => setSchoolForm({ ...schoolForm, country: e.target.value })} />
              </div>
              <div className="col-6 col-md-3">
                <label className="form-label font-bold text-slate-800 app-dark:text-slate-200!">Chương trình *</label>
                <input type="text" className="form-control form-control-sm rounded-xl font-semibold" required placeholder="Ví dụ: Đại học, THPT" value={schoolForm.program} onChange={e => setSchoolForm({ ...schoolForm, program: e.target.value })} />
              </div>
              <div className="col-6 col-md-4">
                <label className="form-label font-bold text-slate-800 app-dark:text-slate-200!">Khu vực</label>
                <input type="text" className="form-control form-control-sm rounded-xl font-semibold" value={schoolForm.region} onChange={e => setSchoolForm({ ...schoolForm, region: e.target.value })} />
              </div>
              <div className="col-6 col-md-4">
                <label className="form-label font-bold text-slate-800 app-dark:text-slate-200!">Hệ tuyển sinh</label>
                <input type="text" className="form-control form-control-sm rounded-xl font-semibold" value={schoolForm.admissionSystem} onChange={e => setSchoolForm({ ...schoolForm, admissionSystem: e.target.value })} />
              </div>
              <div className="col-6 col-md-4">
                <label className="form-label font-bold text-slate-800 app-dark:text-slate-200!">Thứ tự hiển thị (STT)</label>
                <input type="number" className="form-control form-control-sm rounded-xl font-semibold" value={schoolForm.stt} onChange={e => setSchoolForm({ ...schoolForm, stt: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="col-12">
                <label className="form-label font-bold text-slate-800 app-dark:text-slate-200!">Địa chỉ</label>
                <input type="text" className="form-control form-control-sm rounded-xl font-semibold" value={schoolForm.address} onChange={e => setSchoolForm({ ...schoolForm, address: e.target.value })} />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label font-bold text-slate-800 app-dark:text-slate-200!">Chuyên ngành</label>
                <textarea className="form-control form-control-sm rounded-xl font-semibold" rows="2" value={schoolForm.majors} onChange={e => setSchoolForm({ ...schoolForm, majors: e.target.value })}></textarea>
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label font-bold text-slate-800 app-dark:text-slate-200!">Điều kiện tuyển sinh</label>
                <textarea className="form-control form-control-sm rounded-xl font-semibold" rows="2" value={schoolForm.requirements} onChange={e => setSchoolForm({ ...schoolForm, requirements: e.target.value })}></textarea>
              </div>
              <div className="col-6">
                <label className="form-label font-bold text-slate-800 app-dark:text-slate-200!">Hạn báo danh</label>
                <input type="text" className="form-control form-control-sm rounded-xl font-semibold" value={schoolForm.deadlineRegister} onChange={e => setSchoolForm({ ...schoolForm, deadlineRegister: e.target.value })} />
              </div>
              <div className="col-6">
                <label className="form-label font-bold text-slate-800 app-dark:text-slate-200!">Hạn nộp hồ sơ</label>
                <input type="text" className="form-control form-control-sm rounded-xl font-semibold" value={schoolForm.deadlineDocument} onChange={e => setSchoolForm({ ...schoolForm, deadlineDocument: e.target.value })} />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label font-bold text-slate-800 app-dark:text-slate-200!">Học phí học tiếng</label>
                <input type="text" className="form-control form-control-sm rounded-xl font-semibold" value={schoolForm.tuitionLanguage} onChange={e => setSchoolForm({ ...schoolForm, tuitionLanguage: e.target.value })} />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label font-bold text-slate-800 app-dark:text-slate-200!">Học phí chuyên ngành</label>
                <input type="text" className="form-control form-control-sm rounded-xl font-semibold" value={schoolForm.tuitionMajor} onChange={e => setSchoolForm({ ...schoolForm, tuitionMajor: e.target.value })} />
              </div>
              <div className="col-6">
                <label className="form-label font-bold text-slate-800 app-dark:text-slate-200!">Ký túc xá</label>
                <input type="text" className="form-control form-control-sm rounded-xl font-semibold" value={schoolForm.dormitory} onChange={e => setSchoolForm({ ...schoolForm, dormitory: e.target.value })} />
              </div>
              <div className="col-6">
                <label className="form-label font-bold text-slate-800 app-dark:text-slate-200!">Học bổng</label>
                <input type="text" className="form-control form-control-sm rounded-xl font-semibold" value={schoolForm.scholarship} onChange={e => setSchoolForm({ ...schoolForm, scholarship: e.target.value })} />
              </div>
              <div className="col-12">
                <label className="form-label font-bold text-slate-800 app-dark:text-slate-200!">Website trường</label>
                <input type="url" className="form-control form-control-sm font-mono rounded-xl" value={schoolForm.website} onChange={e => setSchoolForm({ ...schoolForm, website: e.target.value })} />
              </div>
              <div className="col-12">
                <label className="form-label font-bold text-slate-800 app-dark:text-slate-200!">Link ảnh thông báo</label>
                <input type="url" className="form-control form-control-sm font-mono rounded-xl" value={schoolForm.imageUrl} onChange={e => setSchoolForm({ ...schoolForm, imageUrl: e.target.value })} />
              </div>
            </div>

            <div className="d-flex flex-shrink-0 justify-content-end gap-2 border-top border-slate-200 app-dark:border-slate-800! p-4 bg-slate-50 app-dark:bg-slate-900/60!">
              <button type="button" className="btn btn-outline-secondary rounded-xl px-3 text-xs font-bold" onClick={() => setIsSchoolModalOpen(false)}>Hủy</button>
              <button type="submit" className="btn btn-primary rounded-xl px-4 font-bold text-xs">Lưu lại</button>
            </div>
          </form>
        </div>
      )}

      {/* ── GOOGLE SHEETS SOURCES MODAL ── */}
      {isSourcesModalOpen && (
        <div className="fixed inset-0 z-[1060] flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm">
          <div className="flex w-full max-w-[940px] flex-col overflow-hidden rounded-3xl bg-white app-dark:bg-[#0f172a]! shadow-2xl border border-slate-200 app-dark:border-slate-800!" style={{ maxHeight: "calc(100vh - 40px)" }}>
            <div className="d-flex flex-shrink-0 justify-content-between align-items-center border-bottom border-slate-200 app-dark:border-slate-800! p-4 bg-slate-50 app-dark:bg-slate-900/60!">
              <div className="d-flex align-items-center gap-2">
                <i className="fa fa-table text-emerald-600 fa-lg"></i>
                <h5 className="m-0 font-extrabold text-slate-900 app-dark:text-slate-100!">Quản lý các nguồn Google Sheets tuyển sinh</h5>
              </div>
              <button className="btn btn-sm btn-light rounded-circle p-1 border" type="button" onClick={() => setIsSourcesModalOpen(false)}>
                <i className="fa fa-xmark"></i>
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1">
              {/* Form to Add New Source */}
              <form onSubmit={handleAddSource} className="row g-2 mb-4 p-3 bg-slate-100 app-dark:bg-slate-900/60! border border-slate-200 app-dark:border-slate-800! rounded-2xl">
                <h6 className="font-extrabold mb-2 text-cyan-700 app-dark:text-cyan-400! text-xs">Thêm Sheet liên kết mới</h6>
                <div className="col-6 col-md-3">
                  <input type="text" className="form-control form-control-sm rounded-xl text-xs font-semibold" required placeholder="Tên nguồn (vd: Đức - THPT)" value={newSource.name} onChange={e => setNewSource({ ...newSource, name: e.target.value })} />
                </div>
                <div className="col-6 col-md-2">
                  <input type="text" className="form-control form-control-sm rounded-xl text-xs font-semibold" required placeholder="Quốc gia" value={newSource.country} onChange={e => setNewSource({ ...newSource, country: e.target.value })} />
                </div>
                <div className="col-6 col-md-2">
                  <input type="text" className="form-control form-control-sm rounded-xl text-xs font-semibold" required placeholder="Chương trình" value={newSource.program} onChange={e => setNewSource({ ...newSource, program: e.target.value })} />
                </div>
                <div className="col-6 col-md-3">
                  <input type="text" className="form-control form-control-sm rounded-xl text-xs font-semibold" required placeholder="Google Sheet ID" value={newSource.spreadsheetId} onChange={e => setNewSource({ ...newSource, spreadsheetId: e.target.value })} />
                </div>
                <div className="col-6 col-md-1">
                  <input type="text" className="form-control form-control-sm rounded-xl text-xs font-semibold" required placeholder="GID" value={newSource.gid} onChange={e => setNewSource({ ...newSource, gid: e.target.value })} />
                </div>
                <div className="col-6 col-md-1">
                  <button className="btn btn-sm btn-primary w-100 font-bold rounded-xl text-xs" type="submit">Thêm</button>
                </div>
              </form>

              {/* Sources List */}
              <h6 className="font-extrabold mb-2 text-xs text-slate-800 app-dark:text-slate-200!">Danh sách nguồn đang liên kết</h6>
              <div className="table-responsive">
                <table className="table table-bordered table-hover align-middle table-sm text-xs">
                  <thead className="table-light">
                    <tr>
                      <th>Tên phân loại</th>
                      <th>Nước</th>
                      <th>Chương trình</th>
                      <th>Sheet ID</th>
                      <th>GID Tab</th>
                      <th>Trạng thái</th>
                      <th className="text-center" style={{ width: "160px" }}>Đồng bộ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sourcesLoading ? (
                      <tr><td colSpan="7" className="text-center py-3 font-bold">Đang tải...</td></tr>
                    ) : sources.length === 0 ? (
                      <tr><td colSpan="7" className="text-center py-3 text-slate-500 font-bold">Chưa cấu hình nguồn nào.</td></tr>
                    ) : (
                      sources.map((s) => (
                        <tr key={s._id}>
                          <td className="font-extrabold text-cyan-700 app-dark:text-cyan-400!">{s.name}</td>
                          <td className="font-bold">{s.country}</td>
                          <td>{s.program}</td>
                          <td className="text-truncate font-mono" style={{ maxWidth: "140px" }} title={s.spreadsheetId}>{s.spreadsheetId}</td>
                          <td>{s.gid}</td>
                          <td>
                            {s.lastSyncedAt ? (
                              <span className="text-slate-600 app-dark:text-slate-400! d-block font-semibold" style={{ fontSize: "11px" }}>
                                Đã đồng bộ <strong>{s.lastSyncCount}</strong> trường lúc {new Date(s.lastSyncedAt).toLocaleString("vi-VN")}
                              </span>
                            ) : (
                              <span className="badge bg-amber-100 text-amber-900 border border-amber-300 font-bold">Chưa đồng bộ</span>
                            )}
                          </td>
                          <td className="text-center">
                            <div className="d-flex justify-content-center gap-1">
                              <button
                                className="btn btn-xs btn-success d-inline-flex align-items-center gap-1 py-1 px-2.5 rounded-lg font-bold text-xs"
                                type="button"
                                disabled={syncingId !== null}
                                onClick={() => handleSyncSource(s._id)}
                              >
                                <i className={`fa fa-rotate ${syncingId === s._id ? "fa-spin" : ""}`}></i>
                                <span>{syncingId === s._id ? "Đang đồng bộ..." : "Đồng bộ"}</span>
                              </button>
                              <button className="btn btn-xs btn-outline-danger p-1 rounded-lg text-xs" type="button" title="Xóa" onClick={() => handleDeleteSource(s._id)}>
                                <i className="fa fa-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="d-flex flex-shrink-0 justify-content-end gap-2 border-top border-slate-200 app-dark:border-slate-800! p-4 bg-slate-50 app-dark:bg-slate-900/60!">
              <button type="button" className="btn btn-outline-secondary rounded-xl px-4 text-xs font-bold" onClick={() => setIsSourcesModalOpen(false)}>Hoàn tất</button>
            </div>
          </div>
        </div>
      )}

      {/* ── 5. HƯỚNG DẪN TÙY CHỈNH BẢNG DÀNH CHO NHÂN VIÊN ── */}
      {isGuideModalOpen && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm">
          <div className="flex w-full max-w-[620px] flex-col overflow-hidden rounded-3xl bg-white app-dark:bg-[#0f172a]! shadow-2xl border border-slate-200 app-dark:border-slate-800!">
            
            {/* Modal Header */}
            <div className="d-flex justify-content-between align-items-center border-bottom border-slate-200 app-dark:border-slate-800! p-4 bg-gradient-to-r from-cyan-50 to-blue-50 app-dark:from-slate-900 app-dark:to-slate-800">
              <div className="d-flex align-items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-600 text-white d-flex align-items-center justify-content-center flex-shrink-0 shadow-md">
                  <i className="fa fa-arrows-left-right text-lg"></i>
                </div>
                <div>
                  <h6 className="font-extrabold text-slate-900 app-dark:text-white! mb-0.5 text-base">
                    Hướng Dẫn Tùy Chỉnh Giao Diện Bảng
                  </h6>
                  <p className="text-xs text-slate-500 app-dark:text-slate-400! mb-0 font-medium">
                    Tối ưu không gian làm việc theo phong cách riêng của bạn
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-link text-slate-400 hover:text-slate-700 app-dark:hover:text-white! p-1"
                onClick={() => setIsGuideModalOpen(false)}
              >
                <i className="fa fa-times text-lg"></i>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto max-h-[70vh] d-flex flex-column gap-3">
              
              {/* Feature 1 */}
              <div className="p-3.5 rounded-2xl bg-slate-50 app-dark:bg-slate-900/60! border border-slate-200 app-dark:border-slate-800! d-flex gap-3 align-items-start">
                <div className="w-8 h-8 rounded-xl bg-cyan-100 app-dark:bg-cyan-950/80 text-cyan-700 app-dark:text-cyan-300 d-flex align-items-center justify-content-center flex-shrink-0 font-black text-sm">
                  1
                </div>
                <div className="flex-1">
                  <h6 className="font-extrabold text-slate-900 app-dark:text-white! text-xs mb-1 d-flex align-items-center gap-1.5">
                    <span>Kéo thả trực tiếp trên mép cột</span>
                    <span className="badge bg-cyan-100 text-cyan-800 text-[10px] font-bold">Quan trọng</span>
                  </h6>
                  <p className="text-xs text-slate-600 app-dark:text-slate-400! mb-0 leading-relaxed">
                    Rê chuột vào <strong>vạch phân cách xám ở mép phải</strong> của bất kỳ tiêu đề cột nào (con trỏ chuột sẽ đổi thành biểu tượng <strong className="text-cyan-600">↔</strong>). Nhấn giữ và kéo sang trái để thu nhỏ hoặc sang phải để mở rộng theo ý muốn.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="p-3.5 rounded-2xl bg-slate-50 app-dark:bg-slate-900/60! border border-slate-200 app-dark:border-slate-800! d-flex gap-3 align-items-start">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 app-dark:bg-emerald-950/80 text-emerald-700 app-dark:text-emerald-300 d-flex align-items-center justify-content-center flex-shrink-0 font-black text-sm">
                  2
                </div>
                <div className="flex-1">
                  <h6 className="font-extrabold text-slate-900 app-dark:text-white! text-xs mb-1">
                    Tự động lưu nhớ cấu hình cá nhân
                  </h6>
                  <p className="text-xs text-slate-600 app-dark:text-slate-400! mb-0 leading-relaxed">
                    Độ rộng các cột bạn đã chỉnh sẽ được <strong>tự động ghi nhớ vào trình duyệt</strong>, các lần truy cập tiếp theo bảng vẫn giữ nguyên kích thước ưa thích của bạn.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="p-3.5 rounded-2xl bg-slate-50 app-dark:bg-slate-900/60! border border-slate-200 app-dark:border-slate-800! d-flex gap-3 align-items-start">
                <div className="w-8 h-8 rounded-xl bg-amber-100 app-dark:bg-amber-950/80 text-amber-700 app-dark:text-amber-300 d-flex align-items-center justify-content-center flex-shrink-0 font-black text-sm">
                  3
                </div>
                <div className="flex-1">
                  <h6 className="font-extrabold text-slate-900 app-dark:text-white! text-xs mb-1">
                    Nhấp đúp hoặc bấm "Đặt lại cột"
                  </h6>
                  <p className="text-xs text-slate-600 app-dark:text-slate-400! mb-0 leading-relaxed">
                    <strong>Nhấp đúp chuột (Double-click)</strong> vào mép cột để hoàn nguyên riêng cột đó, hoặc bấm nút <strong className="text-cyan-700 app-dark:text-cyan-400">[ ↔ Đặt lại cột ]</strong> trên góc phải để khôi phục toàn bộ bảng về kích thước tiêu chuẩn ban đầu.
                  </p>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="p-3.5 rounded-2xl bg-slate-50 app-dark:bg-slate-900/60! border border-slate-200 app-dark:border-slate-800! d-flex gap-3 align-items-start">
                <div className="w-8 h-8 rounded-xl bg-purple-100 app-dark:bg-purple-950/80 text-purple-700 app-dark:text-purple-300 d-flex align-items-center justify-content-center flex-shrink-0 font-black text-sm">
                  4
                </div>
                <div className="flex-1">
                  <h6 className="font-extrabold text-slate-900 app-dark:text-white! text-xs mb-1">
                    Tùy chỉnh khoảng cách hiển thị (Gọn / Vừa / Thoáng)
                  </h6>
                  <p className="text-xs text-slate-600 app-dark:text-slate-400! mb-0 leading-relaxed">
                    Bấm các nút <strong>Gọn</strong> (hiển thị nhiều trường nhất trên 1 màn hình), <strong>Vừa</strong> (chuẩn), hoặc <strong>Thoáng</strong> (khoảng cách rộng rãi, thoáng mắt) ngay trên thanh tiêu đề bảng.
                  </p>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="d-flex justify-content-end gap-2 border-top border-slate-200 app-dark:border-slate-800! p-4 bg-slate-50 app-dark:bg-slate-900/60!">
              <button
                type="button"
                className="btn btn-primary rounded-xl px-4 py-2 font-bold text-xs shadow-md"
                onClick={() => setIsGuideModalOpen(false)}
              >
                <i className="fa fa-check me-1.5"></i> Đã hiểu & Trải nghiệm ngay
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
});
