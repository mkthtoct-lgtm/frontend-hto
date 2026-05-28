import { useState } from "react";

const ADMIN_ROLE_ID = "69fc5af582ef85451120772a";
const PRODUCT_STORAGE_KEY = "hto_products";
const DASHBOARD_DATA_KEY = "hto_products_dashboard_data";
const DASHBOARD_EDITORS_KEY = "hto_dashboard_editors";

const PRODUCT_TYPES = [
  { id: "duhocduc", label: "Du học - Đức" },
  { id: "dinhcu", label: "Định cư" },
  { id: "visa", label: "Visa" },
  { id: "daotaongonngu", label: "Đào tạo ngôn ngữ" },
  { id: "nophosoonline", label: "Nộp hồ sơ online" },
];

const emptyForm = {
  name: "",
  type: "duhocduc",
  status: "Đang mở",
  description: "",
  conditions: "",
  costs: "",
  process: "",
};

const DEFAULT_PRODUCTS = [
  {
    id: "product-du-hoc-duc",
    name: "Du học nghề Đức",
    type: "duhocduc",
    status: "Đang mở",
    updatedAt: "2026-05-20",
    description: "Chương trình tư vấn, chuẩn bị hồ sơ và lộ trình học nghề tại Đức.",
    conditions: [
      "Tốt nghiệp THPT hoặc trình độ tương đương.",
      "Có chứng chỉ tiếng Đức tối thiểu B1/B2 theo yêu cầu ngành.",
      "Đủ điều kiện tài chính và hồ sơ cá nhân hợp lệ.",
    ],
    costs: [
      { name: "Phí dịch vụ HTO", amount: "5.000.000 VNĐ" },
      { name: "Học phí/luyện tiếng", amount: "Theo gói đăng ký" },
      { name: "Chứng minh tài chính", amount: "Theo quy định từng thời điểm" },
    ],
    process: [
      "Tư vấn ngành và kiểm tra điều kiện đầu vào.",
      "Ký hợp đồng, học tiếng và hoàn thiện hồ sơ.",
      "Nộp hồ sơ trường/doanh nghiệp và xin visa.",
      "Bay, nhập học và theo dõi sau nhập cảnh.",
    ],
  },
  {
    id: "product-visa",
    name: "Dịch vụ visa Đức",
    type: "visa",
    status: "Đang mở",
    updatedAt: "2026-05-18",
    description: "Hỗ trợ kiểm tra, sắp xếp và nộp hồ sơ visa theo từng mục đích.",
    conditions: [
      "Có mục đích chuyến đi rõ ràng và giấy tờ chứng minh phù hợp.",
      "Hộ chiếu còn hạn và thông tin cá nhân nhất quán.",
      "Có tài chính, bảo hiểm và lịch trình theo yêu cầu lãnh sự.",
    ],
    costs: [
      { name: "Phí tư vấn hồ sơ", amount: "2.000.000 VNĐ" },
      { name: "Phí lãnh sự", amount: "Theo thông báo lãnh sự" },
    ],
    process: [
      "Tiếp nhận nhu cầu và kiểm tra checklist.",
      "Rà soát giấy tờ, đặt lịch và hoàn thiện biểu mẫu.",
      "Nộp hồ sơ, theo dõi kết quả và bàn giao visa.",
    ],
  },
  {
    id: "product-language",
    name: "Khóa tiếng Đức B1",
    type: "daotaongonngu",
    status: "Đang mở",
    updatedAt: "2026-05-15",
    description: "Khóa đào tạo tiếng Đức phục vụ mục tiêu du học, nghề nghiệp và visa.",
    conditions: [
      "Hoàn thành trình độ nền theo bài kiểm tra đầu vào.",
      "Cam kết lịch học và bài tập theo lộ trình.",
    ],
    costs: [
      { name: "Học phí khóa B1", amount: "Theo lớp khai giảng" },
      { name: "Tài liệu", amount: "Đã bao gồm hoặc theo gói" },
    ],
    process: [
      "Kiểm tra trình độ đầu vào.",
      "Xếp lớp và học theo giáo trình.",
      "Thi thử, bổ trợ kỹ năng và đăng ký kỳ thi.",
    ],
  },
];

const DEFAULT_DASHBOARD_DATA = {
  banners: {
    banner1: "./assets/images/banner-web-korean.jpg",
    banner2: "./assets/images/banner-second.jpg",
  },
  tongQuan: {
    description: "HTO cập nhật nhanh chóng và chính xác các thông tin du học Đức mới nhất.",
    stats: [
      { value: "157 key", label: "đại học & cao đẳng" },
      { value: "24 sites", label: "thi tiếng" },
      { value: "200 ngành", label: "đào tạo" },
      { value: "Số liệu", label: "chứng minh" },
    ],
  },
  dieuKienQuick: {
    items: [
      { title: "Tuổi", icon: "user", bg: "bg-primary-subtle text-primary" },
      { title: "B1/B2\nTiếng Đức", icon: "chat", bg: "bg-warning-subtle text-warning" },
      { title: "Tốt nghiệp\nTHPT", icon: "grad", bg: "bg-body-secondary text-primary" },
    ],
    badges: [
      { text: "Tờ tiền CM", bg: "#5b6cf9" },
      { text: "Số tiền CM", bg: "#10b981" },
      { text: "TK phong tỏa", bg: "#5b6cf9" },
      { text: "Sổ tiết kiệm", bg: "#10b981" },
    ],
  },
  thuTucQuick: {
    steps: [
      { step: 1, title: "Tư vấn\nban đầu", sub: "20 min." },
      { step: 2, title: "Đào tạo\nngôn ngữ", sub: "25 min.\n(03 tuần)" },
      { step: 3, title: "Nộp hồ sơ\ntrường", sub: "33 min.\n(3h nhận bot)" },
      { step: 4, title: "Xin Visa", sub: "" },
      { step: 5, title: "Bay &\nNhập học", sub: "90 min.\n(3h nhận tỉnh)" },
      { step: 6, title: "Đến nơi", sub: "" },
    ],
  },
  dieuKienDetail: [
    "Tốt nghiệp THPT hoặc trình độ tương đương trở lên.",
    "Chứng chỉ tiếng Đức tối thiểu trình độ B1 hoặc B2 tùy theo yêu cầu của ngành nghề hoặc trường.",
    "Độ tuổi từ 18 đến 35, đảm bảo đủ điều kiện sức khỏe học tập và làm việc tại nước ngoài.",
    "Đủ điều kiện tài chính mở tài khoản phong tỏa theo đúng quy định hiện hành.",
  ],
  chiPhiDetail: [
    { name: "Phí dịch vụ HTO", amount: "5.000.000" },
    { name: "Học phí", amount: "4.000.000" },
    { name: "Sinh hoạt phí dự kiến", amount: "2.000.000" },
    { name: "Bảo hiểm", amount: "1.200.000" },
    { name: "Vé máy bay", amount: "350.000" },
  ],
  quyTrinhDetail: [
    "Tư vấn định hướng nghề nghiệp và ký hợp đồng dịch vụ.",
    "Học tiếng Đức từ trình độ A1 đến B1/B2 và rèn luyện kỹ năng phỏng vấn.",
    "Xử lý hồ sơ, xin thư mời nhập học tại Đức và làm các thủ tục chứng minh tài chính.",
    "Nộp hồ sơ xin visa du học nghề tại Đại sứ quán Đức.",
    "Nhận visa, chuẩn bị hành lý, bay sang Đức và làm thủ tục nhập học.",
    "Ổn định cuộc sống tại Đức, bắt đầu học tập và làm việc.",
  ],
};

const isAdmin = (user) => user?.role === "admin" || user?.roleId === ADMIN_ROLE_ID;

const readDashboardEditors = () => {
  try {
    const value = window.localStorage.getItem(DASHBOARD_EDITORS_KEY);
    return value ? JSON.parse(value) : [];
  } catch {
    return [];
  }
};

const readDashboardData = () => {
  try {
    const value = window.localStorage.getItem(DASHBOARD_DATA_KEY);

    if (!value) {
      window.localStorage.setItem(DASHBOARD_DATA_KEY, JSON.stringify(DEFAULT_DASHBOARD_DATA));
      return DEFAULT_DASHBOARD_DATA;
    }

    const parsed = JSON.parse(value);

    return {
      banners: parsed.banners || DEFAULT_DASHBOARD_DATA.banners,
      tongQuan: parsed.tongQuan || DEFAULT_DASHBOARD_DATA.tongQuan,
      dieuKienQuick: parsed.dieuKienQuick || DEFAULT_DASHBOARD_DATA.dieuKienQuick,
      thuTucQuick: parsed.thuTucQuick || DEFAULT_DASHBOARD_DATA.thuTucQuick,
      dieuKienDetail: parsed.dieuKienDetail || DEFAULT_DASHBOARD_DATA.dieuKienDetail,
      chiPhiDetail: parsed.chiPhiDetail || DEFAULT_DASHBOARD_DATA.chiPhiDetail,
      quyTrinhDetail: parsed.quyTrinhDetail || DEFAULT_DASHBOARD_DATA.quyTrinhDetail,
    };
  } catch {
    return DEFAULT_DASHBOARD_DATA;
  }
};

const writeDashboardData = (data) => {
  window.localStorage.setItem(DASHBOARD_DATA_KEY, JSON.stringify(data));
};

const getTypeLabel = (type) => PRODUCT_TYPES.find((item) => item.id === type)?.label || type || "-";

const formatDate = (value) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value || "-";
  }

  return date.toLocaleDateString("vi-VN");
};

const splitListText = (value) =>
  Array.isArray(value)
    ? value.map(String).map((item) => item.trim()).filter(Boolean)
    : String(value || "")
        .split(/\r?\n|;/g)
        .map((item) => item.trim())
        .filter(Boolean);

const parseCosts = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) =>
      typeof item === "string"
        ? { name: item, amount: "" }
        : { name: String(item.name || "").trim(), amount: String(item.amount || "").trim() },
    ).filter((item) => item.name || item.amount);
  }

  return String(value || "")
    .split(/\r?\n/g)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, ...amountParts] = line.split(/:|-/g);

      return {
        name: name?.trim() || line,
        amount: amountParts.join("-").trim(),
      };
    });
};

const costsToText = (costs) =>
  (costs || []).map((item) => `${item.name}${item.amount ? `: ${item.amount}` : ""}`).join("\n");

const normalizeProduct = (input, index = 0) => {
  const now = new Date().toISOString().slice(0, 10);

  return {
    id: String(input?.id || `product-${Date.now()}-${index}`),
    name: String(input?.name || "").trim() || `Sản phẩm ${index + 1}`,
    type: String(input?.type || "duhocduc").trim(),
    status: String(input?.status || "Đang mở").trim(),
    updatedAt: String(input?.updatedAt || now).trim(),
    description: String(input?.description || "").trim(),
    conditions: splitListText(input?.conditions),
    costs: parseCosts(input?.costs),
    process: splitListText(input?.process),
  };
};

const readProducts = () => {
  try {
    const storedValue = window.localStorage.getItem(PRODUCT_STORAGE_KEY);

    if (!storedValue) {
      window.localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(DEFAULT_PRODUCTS));
      return DEFAULT_PRODUCTS;
    }

    const rows = JSON.parse(storedValue);

    return Array.isArray(rows) ? rows.map(normalizeProduct) : DEFAULT_PRODUCTS;
  } catch {
    window.localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(DEFAULT_PRODUCTS));
    return DEFAULT_PRODUCTS;
  }
};

const writeProducts = (products) => {
  window.localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(products));
};

const formFromProduct = (product) => ({
  name: product.name,
  type: product.type,
  status: product.status,
  description: product.description,
  conditions: product.conditions.join("\n"),
  costs: costsToText(product.costs),
  process: product.process.join("\n"),
});

const productFromForm = (form, id) =>
  normalizeProduct({
    id,
    ...form,
    conditions: splitListText(form.conditions),
    costs: parseCosts(form.costs),
    process: splitListText(form.process),
    updatedAt: new Date().toISOString().slice(0, 10),
  });

export const ProductsPage = ({ currentUser }) => {
  const [dashboardData, setDashboardData] = useState(() => readDashboardData());
  const [editingDashboardSection, setEditingDashboardSection] = useState(null);
  const [dashboardForm, setDashboardForm] = useState({});
  const theme = window.localStorage.getItem("app-theme") || "light";
  const canManage = isAdmin(currentUser) || readDashboardEditors().includes(currentUser?.id);

  const openEditDashboard = (section) => {
    setEditingDashboardSection(section);

    if (section === "banners") {
      setDashboardForm({
        banner1: dashboardData.banners.banner1,
        banner2: dashboardData.banners.banner2,
      });
    } else if (section === "tongQuan") {
      setDashboardForm({
        description: dashboardData.tongQuan.description,
        stat0_value: dashboardData.tongQuan.stats[0].value,
        stat0_label: dashboardData.tongQuan.stats[0].label,
        stat1_value: dashboardData.tongQuan.stats[1].value,
        stat1_label: dashboardData.tongQuan.stats[1].label,
        stat2_value: dashboardData.tongQuan.stats[2].value,
        stat2_label: dashboardData.tongQuan.stats[2].label,
        stat3_value: dashboardData.tongQuan.stats[3].value,
        stat3_label: dashboardData.tongQuan.stats[3].label,
      });
    } else if (section === "dieuKienQuick") {
      setDashboardForm({
        item0_title: dashboardData.dieuKienQuick.items[0].title,
        item1_title: dashboardData.dieuKienQuick.items[1].title,
        item2_title: dashboardData.dieuKienQuick.items[2].title,
        badge0_text: dashboardData.dieuKienQuick.badges[0].text,
        badge1_text: dashboardData.dieuKienQuick.badges[1].text,
        badge2_text: dashboardData.dieuKienQuick.badges[2].text,
        badge3_text: dashboardData.dieuKienQuick.badges[3].text,
      });
    } else if (section === "thuTucQuick") {
      setDashboardForm({
        step0_title: dashboardData.thuTucQuick.steps[0].title,
        step0_sub: dashboardData.thuTucQuick.steps[0].sub,
        step1_title: dashboardData.thuTucQuick.steps[1].title,
        step1_sub: dashboardData.thuTucQuick.steps[1].sub,
        step2_title: dashboardData.thuTucQuick.steps[2].title,
        step2_sub: dashboardData.thuTucQuick.steps[2].sub,
        step3_title: dashboardData.thuTucQuick.steps[3].title,
        step3_sub: dashboardData.thuTucQuick.steps[3].sub,
        step4_title: dashboardData.thuTucQuick.steps[4].title,
        step4_sub: dashboardData.thuTucQuick.steps[4].sub,
        step5_title: dashboardData.thuTucQuick.steps[5].title,
        step5_sub: dashboardData.thuTucQuick.steps[5].sub,
      });
    } else if (section === "dieuKienDetail") {
      setDashboardForm({ text: dashboardData.dieuKienDetail.join("\n") });
    } else if (section === "chiPhiDetail") {
      setDashboardForm({ text: dashboardData.chiPhiDetail.map((item) => `${item.name}: ${item.amount}`).join("\n") });
    } else if (section === "quyTrinhDetail") {
      setDashboardForm({ text: dashboardData.quyTrinhDetail.join("\n") });
    }
  };

  const saveDashboardEdit = (event) => {
    event.preventDefault();

    const nextData = { ...dashboardData };

    if (editingDashboardSection === "banners") {
      nextData.banners = {
        banner1: dashboardForm.banner1.trim(),
        banner2: dashboardForm.banner2.trim(),
      };
    } else if (editingDashboardSection === "tongQuan") {
      nextData.tongQuan = {
        description: dashboardForm.description.trim(),
        stats: [
          { value: dashboardForm.stat0_value.trim(), label: dashboardForm.stat0_label.trim() },
          { value: dashboardForm.stat1_value.trim(), label: dashboardForm.stat1_label.trim() },
          { value: dashboardForm.stat2_value.trim(), label: dashboardForm.stat2_label.trim() },
          { value: dashboardForm.stat3_value.trim(), label: dashboardForm.stat3_label.trim() },
        ],
      };
    } else if (editingDashboardSection === "dieuKienQuick") {
      nextData.dieuKienQuick = {
        items: [
          { title: dashboardForm.item0_title.trim(), icon: "user", bg: "bg-primary-subtle text-primary" },
          { title: dashboardForm.item1_title.trim(), icon: "chat", bg: "bg-warning-subtle text-warning" },
          { title: dashboardForm.item2_title.trim(), icon: "grad", bg: "bg-body-secondary text-primary" },
        ],
        badges: [
          { text: dashboardForm.badge0_text.trim(), bg: "#5b6cf9" },
          { text: dashboardForm.badge1_text.trim(), bg: "#10b981" },
          { text: dashboardForm.badge2_text.trim(), bg: "#5b6cf9" },
          { text: dashboardForm.badge3_text.trim(), bg: "#10b981" },
        ],
      };
    } else if (editingDashboardSection === "thuTucQuick") {
      nextData.thuTucQuick = {
        steps: [
          { step: 1, title: dashboardForm.step0_title.trim(), sub: dashboardForm.step0_sub.trim() },
          { step: 2, title: dashboardForm.step1_title.trim(), sub: dashboardForm.step1_sub.trim() },
          { step: 3, title: dashboardForm.step2_title.trim(), sub: dashboardForm.step2_sub.trim() },
          { step: 4, title: dashboardForm.step3_title.trim(), sub: dashboardForm.step3_sub.trim() },
          { step: 5, title: dashboardForm.step4_title.trim(), sub: dashboardForm.step4_sub.trim() },
          { step: 6, title: dashboardForm.step5_title.trim(), sub: dashboardForm.step5_sub.trim() },
        ],
      };
    } else if (editingDashboardSection === "dieuKienDetail") {
      nextData.dieuKienDetail = dashboardForm.text.split("\n").map((line) => line.trim()).filter(Boolean);
    } else if (editingDashboardSection === "chiPhiDetail") {
      nextData.chiPhiDetail = dashboardForm.text
        .split("\n")
        .map((line) => {
          const parts = line.split(":");

          return {
            name: parts[0]?.trim() || line.trim(),
            amount: parts[1]?.trim() || "",
          };
        })
        .filter((item) => item.name);
    } else if (editingDashboardSection === "quyTrinhDetail") {
      nextData.quyTrinhDetail = dashboardForm.text.split("\n").map((line) => line.trim()).filter(Boolean);
    }

    setDashboardData(nextData);
    writeDashboardData(nextData);
    setEditingDashboardSection(null);
  };

  return (
    <div className="container-fluid pt-3 pb-1" style={{ maxWidth: "1600px" }}>
      {/* --- ROW 1: BANNER --- */}
      <div className="row mb-3 gx-2 gx-xl-3 align-items-stretch">
        <div className="col-12 col-md-8 col-lg-8 col-xl-8 mb-3 mb-md-0 position-relative">
          <div className="card border-0 bg-transparent h-100 position-relative">
            <img src={dashboardData.banners.banner1} alt="Banner Du học Hàn Quốc" className="img-fluid w-100 h-100 bg-primary-subtle" style={{ borderRadius: "12px", objectFit: "cover", minHeight: "180px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }} />
            {canManage && <AdminEditButton onClick={() => openEditDashboard("banners")} title="Sửa banner" />}
          </div>
        </div>

        <div className="col-12 col-md-4 col-lg-4 col-xl-4 position-relative">
          <div className="card border-0 bg-transparent h-100 position-relative">
            <img src={dashboardData.banners.banner2} alt="HITO Support Box" className="img-fluid w-100 h-100 bg-body" style={{ borderRadius: "12px", objectFit: "cover", minHeight: "180px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }} />
            {canManage && <AdminEditButton onClick={() => openEditDashboard("banners")} title="Sửa banner" />}
          </div>
        </div>
      </div>

      {/* --- ROW 2: TỔNG QUAN, ĐIỀU KIỆN, THỦ TỤC --- */}
      <div className="row mb-3 gx-2 gx-xl-3 align-items-stretch">
        <div className="col-12 col-md-3 col-lg-3 col-xl-3 mb-3 mb-md-0 position-relative">
          <div className="card border-0 h-100 position-relative" style={{ borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", minHeight: "240px" }}>
            {canManage && <AdminEditButton small onClick={() => openEditDashboard("tongQuan")} title="Sửa tổng quan" />}
            <div className="card-body p-2 p-xl-3 d-flex flex-column justify-content-between">
              <h6 className="fw-bold d-flex align-items-center mb-2 text-body-emphasis" style={{ fontSize: "14px" }}>
                <img src="./assets/images/germany-banner.png" alt="Cờ Đức" className="bg-secondary-subtle border border-secondary-subtle" style={{ width: "20px", height: "14px", marginRight: "8px", borderRadius: "2px" }} />
                TỔNG QUAN
              </h6>
              <p className="text-body-secondary mb-2" style={{ fontSize: "12px", lineHeight: "1.3" }}>
                {dashboardData.tongQuan.description}
              </p>
              <div className="d-flex align-items-center flex-grow-1">
                <div className="w-40 text-center pe-1 pe-xl-2">
                  <img src="./assets/images/germany-map.png" alt="Bản đồ Đức" className="img-fluid bg-body-tertiary rounded" style={{ width: "100%", maxHeight: "110px", objectFit: "contain" }} />
                </div>
                <div className="w-60 d-grid gap-1 gap-xl-2" style={{ gridTemplateColumns: "1fr 1fr" }}>
                  {dashboardData.tongQuan.stats.map((stat, index) => (
                    <div key={`${stat.value}-${index}`} className="text-center rounded p-1 bg-body-secondary overflow-hidden">
                      <div className="fw-bold text-body-emphasis text-truncate" style={{ fontSize: "13px" }}>{stat.value}</div>
                      <div className="text-body-secondary" style={{ fontSize: "10px", lineHeight: "1.2" }}>{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-3 col-lg-3 col-xl-3 mb-3 mb-md-0 position-relative">
          <div className="card border-0 h-100 position-relative" style={{ borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", minHeight: "240px" }}>
            {canManage && <AdminEditButton small onClick={() => openEditDashboard("dieuKienQuick")} title="Sửa điều kiện" />}
            <div className="card-body p-2 p-xl-3 d-flex flex-column justify-content-between">
              <h6 className="fw-bold d-flex align-items-center mb-2 text-body-emphasis" style={{ fontSize: "14px" }}>
                <ConditionIcon className="me-2" />
                ĐIỀU KIỆN
              </h6>
              <div className="d-flex flex-wrap justify-content-between mb-2 gap-1 gap-xl-2">
                {dashboardData.dieuKienQuick.items.map((item, index) => (
                  <div key={`${item.title}-${index}`} className={`text-center rounded p-1 p-xl-2 flex-fill overflow-hidden ${item.bg}`}>
                    <QuickConditionIcon index={index} />
                    <span className="fw-bold text-body-emphasis d-block text-truncate" style={{ fontSize: "11.5px", lineHeight: "1.2", display: "block" }}>{item.title}</span>
                  </div>
                ))}
              </div>
              <div className="d-flex flex-wrap gap-1 gap-xl-2">
                {dashboardData.dieuKienQuick.badges.map((badge, index) => (
                  <div key={`${badge.text}-${index}`} className="flex-fill text-white rounded p-1 px-xl-2 py-xl-2 d-flex justify-content-center align-items-center text-nowrap overflow-hidden" style={{ backgroundColor: badge.bg, fontSize: "11.5px", opacity: index >= 2 ? 0.9 : 1 }}>
                    <BadgeIcon index={index} />
                    <span className="text-truncate">{badge.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6 col-lg-6 col-xl-6 position-relative">
          <div className="card border-0 h-100 position-relative" style={{ borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", minHeight: "240px" }}>
            {canManage && <AdminEditButton small onClick={() => openEditDashboard("thuTucQuick")} title="Sửa quy trình nhanh" />}
            <div className="card-body p-2 p-xl-3 d-flex flex-column overflow-hidden">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold d-flex align-items-center mb-0 text-body-emphasis" style={{ fontSize: "14px" }}>
                  <ProcessIcon />
                  <span className="ms-2">THỦ TỤC</span>
                </h6>
                <span className="text-body-secondary d-none d-md-inline text-truncate" style={{ fontSize: "11px" }}>Cập nhật: 15/03/2026</span>
              </div>
              <div className="d-flex justify-content-between align-items-start mt-auto mb-auto overflow-x-auto pb-2" style={{ minWidth: "100%" }}>
                <div className="d-flex justify-content-between w-100" style={{ minWidth: "400px" }}>
                  {dashboardData.thuTucQuick.steps.map((item, index) => (
                    <div key={`${item.title}-${index}`} className="d-flex flex-column align-items-center position-relative" style={{ flex: 1 }}>
                      {index < 5 && (
                        <div className="position-absolute" style={{ top: "12px", left: "50%", width: "100%", height: "2px", backgroundColor: theme === "dark" ? "#ffffff" : "#1e40af", zIndex: 0 }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="position-absolute top-50 start-50 translate-middle" style={{ color: theme === "dark" ? "#ffffff" : "#1e40af", backgroundColor: "var(--bs-card-bg)", padding: "0 2px" }}>
                            <path d="M10 6 8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6Z"/>
                          </svg>
                        </div>
                      )}
                      <div className="rounded-circle d-flex align-items-center justify-content-center mb-2 position-relative shadow-sm" style={{ backgroundColor: theme === "dark" ? "#ffffff" : "#1e40af", color: theme === "dark" ? "#1e40af" : "#ffffff", width: "24px", height: "24px", fontSize: "12px", fontWeight: "bold", zIndex: 1 }}>
                        {item.step}
                      </div>
                      <div className="d-flex align-items-center justify-content-center mb-1 text-primary" style={{ height: "30px" }}>
                        <ProcessStepIcon index={index} />
                      </div>
                      <div className="fw-bold text-center text-body-emphasis mt-1 text-wrap" style={{ fontSize: "12.5px", lineHeight: "1.2", whiteSpace: "pre-line" }}>{item.title}</div>
                      <div className="text-body-secondary text-center mt-1 text-wrap" style={{ fontSize: "10.5px", lineHeight: "1.2", whiteSpace: "pre-line" }}>{item.sub}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- ROW 3: ĐIỀU KIỆN, CHI PHÍ, QUY TRÌNH --- */}
      <div className="row mb-3 gx-2 gx-xl-3 align-items-stretch">
        <div className="col-12 col-md-4 col-lg-4 col-xl-4 mb-3 mb-md-0 position-relative">
          <div className="card border-0 h-100 position-relative" style={{ borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", minHeight: "320px" }}>
            {canManage && <AdminEditButton onClick={() => openEditDashboard("dieuKienDetail")} title="Sửa điều kiện chi tiết" />}
            <div className="card-header bg-transparent border-0 p-3 pb-0">
              <h6 className="fw-bold d-flex align-items-center mb-0 text-body-emphasis" style={{ fontSize: "14px" }}>
                <ConditionIcon />
                <span className="ms-2">ĐIỀU KIỆN</span>
              </h6>
            </div>
            <div className="card-body p-3 d-flex flex-column justify-content-between">
              <div className="d-flex flex-column gap-2 overflow-y-auto flex-grow-1" style={{ maxHeight: "250px" }}>
                {dashboardData.dieuKienDetail.map((item, index) => (
                  <div className="rounded border bg-body-tertiary p-2" key={`${item}-${index}`}>
                    <div className="d-flex align-items-start gap-2">
                      <span className="d-inline-flex align-items-center justify-content-center rounded-circle bg-primary text-white flex-shrink-0" style={{ width: "20px", height: "20px", fontSize: "11px", marginTop: "2px" }}>
                        {index + 1}
                      </span>
                      <span className="text-body-secondary" style={{ fontSize: "12.5px", lineHeight: 1.4 }}>
                        {item}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4 col-lg-4 col-xl-4 mb-3 mb-md-0 position-relative">
          <div className="card border-0 h-100" style={{ borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", minHeight: "320px" }}>
            <div className="card-header bg-transparent border-0 p-3 pb-0 d-flex align-items-center justify-content-between">
              <h6 className="fw-bold d-flex align-items-center mb-0 text-body-emphasis" style={{ fontSize: "14px" }}>
                <CostIcon />
                <span className="ms-2">CHI PHÍ</span>
              </h6>
              {canManage && <AdminEditButton inline onClick={() => openEditDashboard("chiPhiDetail")} title="Sửa chi phí chi tiết" />}
            </div>
            <div className="card-body p-3 pt-0 d-flex flex-column flex-grow-1" style={{ overflowY: "auto" }}>
              <div className="table-responsive w-100" style={{ border: "none" }}>
                <table className="table table-borderless align-middle mb-0" style={{ fontSize: "13px" }}>
                  <thead className="border-bottom sticky-top bg-body">
                    <tr>
                      <th className="fw-bold text-body-emphasis py-2" style={{ width: "60%" }}>Hạng mục phí</th>
                      <th className="fw-bold text-body-emphasis text-end py-2">Số tiền (VNĐ)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.chiPhiDetail.map((cost, index) => (
                      <tr key={`${cost.name}-${index}`}>
                        <td className="py-2 text-body-secondary fw-medium text-wrap">{cost.name}</td>
                        <td className="text-end fw-bold py-2 text-success" style={{ fontSize: "13px" }}>{cost.amount}</td>
                      </tr>
                    ))}
                    {(() => {
                      const total = dashboardData.chiPhiDetail.reduce((sum, item) => {
                        const value = parseInt(String(item.amount).replace(/\./g, "").replace(/,/g, ""), 10);
                        return Number.isNaN(value) ? sum : sum + value;
                      }, 0);

                      return total > 0 ? (
                        <tr className="bg-body-secondary border-top">
                          <td className="ps-2 py-3 fw-bold text-body-emphasis text-nowrap">Tổng chi phí</td>
                          <td className="text-end fw-bold py-3 pe-2 text-danger" style={{ fontSize: "15px" }}>{total.toLocaleString("vi-VN")}</td>
                        </tr>
                      ) : null;
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4 col-lg-4 col-xl-4 position-relative">
          <div className="card border-0 h-100 position-relative" style={{ borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", minHeight: "320px" }}>
            {canManage && <AdminEditButton onClick={() => openEditDashboard("quyTrinhDetail")} title="Sửa quy trình chi tiết" />}
            <div className="card-header bg-transparent border-0 p-3 pb-0">
              <h6 className="fw-bold d-flex align-items-center mb-0 text-body-emphasis" style={{ fontSize: "14px" }}>
                <ProcessIcon />
                <span className="ms-2">QUY TRÌNH</span>
              </h6>
            </div>
            <div className="card-body p-3 d-flex flex-column justify-content-between">
              <div className="d-flex flex-column gap-2 overflow-y-auto flex-grow-1" style={{ maxHeight: "250px" }}>
                {dashboardData.quyTrinhDetail.map((item, index) => (
                  <div className="d-flex align-items-start gap-2 position-relative" key={`${item}-${index}`}>
                    {index < dashboardData.quyTrinhDetail.length - 1 && (
                      <div className="position-absolute" style={{ left: "10px", top: "24px", bottom: "-12px", width: "2px", backgroundColor: "var(--bs-border-color)" }}></div>
                    )}
                    <span className="d-inline-flex align-items-center justify-content-center rounded-circle bg-success text-white fw-bold flex-shrink-0" style={{ width: "22px", height: "22px", fontSize: "11px", zIndex: 1 }}>
                      {index + 1}
                    </span>
                    <div className="rounded border bg-body-tertiary p-2 flex-grow-1" style={{ fontSize: "12.5px" }}>
                      <div className="text-body-secondary" style={{ lineHeight: 1.4 }}>{item}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {editingDashboardSection && canManage && (
        <DashboardEditModal
          dashboardForm={dashboardForm}
          editingDashboardSection={editingDashboardSection}
          onCancel={() => setEditingDashboardSection(null)}
          onChange={setDashboardForm}
          onSubmit={saveDashboardEdit}
        />
      )}
    </div>
  );
};

function Field({ children, label, required = false, wide = false }) {
  return (
    <div className={wide ? "col-12" : "col-md-6"}>
      <label className="form-label fw-semibold">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      {children}
    </div>
  );
}

function DashboardEditModal({ dashboardForm, editingDashboardSection, onCancel, onChange, onSubmit }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1050, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.5)", padding: "12px", backdropFilter: "blur(2px)" }}>
      <div
        style={{ display: "flex", width: "100%", maxWidth: "640px", flexDirection: "column", overflow: "hidden", borderRadius: "12px", backgroundColor: "var(--bs-body-bg)", boxShadow: "0 10px 30px rgba(0,0,0,0.15)", maxHeight: "calc(100vh - 24px)" }}
      >
        <div className="d-flex justify-content-between align-items-center border-bottom p-4" style={{ flexShrink: 0 }}>
          <h5 className="m-0 fw-bold text-body-emphasis">
            {editingDashboardSection === "banners" ? "Sửa Banners" :
             editingDashboardSection === "tongQuan" ? "Sửa Tổng Quan" :
             editingDashboardSection === "dieuKienQuick" ? "Sửa Điều Kiện Nhanh" :
             editingDashboardSection === "thuTucQuick" ? "Sửa Thủ Tục Nhanh" :
             editingDashboardSection === "dieuKienDetail" ? "Sửa Điều Kiện Chi Tiết" :
             editingDashboardSection === "chiPhiDetail" ? "Sửa Chi Phí Chi Tiết" :
             "Sửa Quy Trình Chi Tiết"}
          </h5>
          <button className="btn btn-sm btn-light border" type="button" onClick={onCancel}>
            Đóng
          </button>
        </div>
        <form style={{ display: "flex", minHeight: 0, flex: 1, flexDirection: "column" }} onSubmit={onSubmit}>
          <div className="p-4" style={{ minHeight: 0, flex: 1, overflowY: "auto" }}>
            {editingDashboardSection === "banners" && (
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label fw-semibold">Đường dẫn Banner 1</label>
                  <input className="form-control" value={dashboardForm.banner1 || ""} onChange={(event) => onChange({ ...dashboardForm, banner1: event.target.value })} required />
                </div>
                <div className="col-12">
                  <label className="form-label fw-semibold">Đường dẫn Banner 2</label>
                  <input className="form-control" value={dashboardForm.banner2 || ""} onChange={(event) => onChange({ ...dashboardForm, banner2: event.target.value })} required />
                </div>
              </div>
            )}

            {editingDashboardSection === "tongQuan" && (
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label fw-semibold">Mô tả tổng quan</label>
                  <textarea className="form-control" rows="3" value={dashboardForm.description || ""} onChange={(event) => onChange({ ...dashboardForm, description: event.target.value })} required />
                </div>
                {[0, 1, 2, 3].map((index) => (
                  <div className="col-6" key={index}>
                    <label className="form-label fw-semibold">Số liệu {index + 1}</label>
                    <input className="form-control mb-1" placeholder="Ví dụ: 157 key" value={dashboardForm[`stat${index}_value`] || ""} onChange={(event) => onChange({ ...dashboardForm, [`stat${index}_value`]: event.target.value })} required />
                    <input className="form-control" placeholder="Ví dụ: đại học & cao đẳng" value={dashboardForm[`stat${index}_label`] || ""} onChange={(event) => onChange({ ...dashboardForm, [`stat${index}_label`]: event.target.value })} required />
                  </div>
                ))}
              </div>
            )}

            {editingDashboardSection === "dieuKienQuick" && (
              <div className="row g-3">
                {[0, 1, 2].map((index) => (
                  <div className="col-12" key={index}>
                    <label className="form-label fw-semibold">Mục Điều kiện Nhanh {index + 1}</label>
                    <input className="form-control" value={dashboardForm[`item${index}_title`] || ""} onChange={(event) => onChange({ ...dashboardForm, [`item${index}_title`]: event.target.value })} required />
                  </div>
                ))}
                {[0, 1, 2, 3].map((index) => (
                  <div className="col-6" key={index}>
                    <label className="form-label fw-semibold">Badge hồ sơ {index + 1}</label>
                    <input className="form-control" value={dashboardForm[`badge${index}_text`] || ""} onChange={(event) => onChange({ ...dashboardForm, [`badge${index}_text`]: event.target.value })} required />
                  </div>
                ))}
              </div>
            )}

            {editingDashboardSection === "thuTucQuick" && (
              <div className="row g-3">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <div className="col-6 border-bottom pb-2" key={index}>
                    <label className="form-label fw-semibold text-primary">Bước {index + 1}</label>
                    <input className="form-control mb-1" placeholder="Tiêu đề bước" value={dashboardForm[`step${index}_title`] || ""} onChange={(event) => onChange({ ...dashboardForm, [`step${index}_title`]: event.target.value })} required />
                    <input className="form-control" placeholder="Mô tả phụ (nếu có)" value={dashboardForm[`step${index}_sub`] || ""} onChange={(event) => onChange({ ...dashboardForm, [`step${index}_sub`]: event.target.value })} />
                  </div>
                ))}
              </div>
            )}

            {editingDashboardSection === "dieuKienDetail" && (
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label fw-semibold">Điều kiện chi tiết (Mỗi dòng một mục)</label>
                  <textarea className="form-control" rows="8" value={dashboardForm.text || ""} onChange={(event) => onChange({ ...dashboardForm, text: event.target.value })} required />
                </div>
              </div>
            )}

            {editingDashboardSection === "chiPhiDetail" && (
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label fw-semibold">Hạng mục chi phí (Mỗi dòng định dạng: Tên phí: Số tiền)</label>
                  <textarea className="form-control" rows="8" placeholder="Phí dịch vụ HTO: 5.000.000" value={dashboardForm.text || ""} onChange={(event) => onChange({ ...dashboardForm, text: event.target.value })} required />
                </div>
              </div>
            )}

            {editingDashboardSection === "quyTrinhDetail" && (
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label fw-semibold">Quy trình chi tiết (Mỗi dòng một bước)</label>
                  <textarea className="form-control" rows="8" value={dashboardForm.text || ""} onChange={(event) => onChange({ ...dashboardForm, text: event.target.value })} required />
                </div>
              </div>
            )}
          </div>
          <div className="d-flex flex-shrink-0 justify-content-end gap-2 border-top p-4">
            <button type="button" className="btn btn-light border" onClick={onCancel}>
              Hủy
            </button>
            <button type="submit" className="btn btn-primary">
              Lưu thay đổi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function QuickConditionIcon({ index }) {
  if (index === 0) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="mb-1">
        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3Zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3Zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13Zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5Z"/>
      </svg>
    );
  }

  if (index === 1) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="mb-1">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2Zm-2 12H6v-2h12v2Zm0-3H6V9h12v2Zm0-3H6V6h12v2Z"/>
      </svg>
    );
  }

  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="mb-1">
      <path d="M12 3 1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3Zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9ZM17 15.99l-5 2.73-5-2.73v-3.72l5 2.73 5-2.73v3.72Z"/>
    </svg>
  );
}

function BadgeIcon({ index }) {
  const paths = [
    "M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6Zm2 16H8v-2h8v2Zm0-4H8v-2h8v2Zm-3-5V3.5L18.5 9H13Z",
    "M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4Z",
    "M12 1 3 6v2h18V6l-9-5Zm0 2.18 5.36 2.82H6.64L12 3.18ZM5 10h2v7H5v-7Zm6 0h2v7h-2v-7Zm6 0h2v7h-2v-7ZM3 19h18v2H3v-2Z",
    "M21 7.28V5c0-1.1-.9-2-2-2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-2.28c.59-.35 1-.98 1-1.72V9c0-.74-.41-1.37-1-1.72ZM20 9v6h-7V9h7ZM5 19V5h14v2h-6c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h6v2H5Z",
  ];

  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="me-1 d-none d-xl-block">
      <path d={paths[index] || paths[0]} />
      {index === 3 && <circle cx="16" cy="12" r="1.5" />}
    </svg>
  );
}

function ProcessStepIcon({ index }) {
  const paths = [
    "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4Zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4Z",
    "M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2Zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1Zm-2 14-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8Z",
    "M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2Zm-6 10H6v-2h8v2Zm4-4H6v-2h12v2Z",
    "M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4Zm-2 16-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8Z",
    "M2.5 19h19v2h-19Zm19.57-9.36c-.21-.8-1.04-1.28-1.84-1.06L14.92 10l-6.9-6.43-1.93.51 4.14 7.17-4.97 1.33-1.97-1.54-1.45.39 1.82 3.16.77 1.33 1.6-.43 5.31-1.42 4.35-1.16L21 11.49c.81-.23 1.28-1.05 1.07-1.85Z",
    "M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5Z",
  ];

  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d={paths[index] || paths[paths.length - 1]} />
    </svg>
  );
}

function ProductOverviewCard({ canManage, onDelete, onEdit, onOpen, product }) {
  return (
    <section className="card border-0 shadow-sm h-100">
      <div className="card-header bg-transparent border-0 pb-0">
        <div className="d-flex justify-content-between align-items-start gap-3">
          <div style={{ minWidth: 0 }}>
            <h5 className="fw-bold text-body-emphasis mb-1 text-truncate">{product.name}</h5>
            <div className="text-body-secondary" style={{ fontSize: "13px" }}>
              {getTypeLabel(product.type)} · {product.status}
            </div>
          </div>
          <span className="badge bg-body-secondary text-body flex-shrink-0">
            {formatDate(product.updatedAt)}
          </span>
        </div>
      </div>
      <div className="card-body">
        <p className="text-body-secondary mb-3" style={{ fontSize: "13px", lineHeight: 1.5 }}>
          {product.description}
        </p>
        <div className="row g-2">
          <MetricTile label="Điều kiện" value={product.conditions.length} />
          <MetricTile label="Chi phí" value={product.costs.length} />
          <MetricTile label="Quy trình" value={product.process.length} />
        </div>
        <div className="d-flex justify-content-between align-items-center gap-2 mt-3">
          <button className="btn btn-sm btn-outline-primary" onClick={onOpen}>
            Xem chi tiết
          </button>
          {canManage && (
            <div className="d-flex gap-2">
              <button
                className="btn btn-sm btn-outline-primary d-inline-flex align-items-center justify-content-center"
                style={{ width: "32px", height: "32px", padding: 0 }}
                title="Sửa sản phẩm"
                aria-label="Sửa sản phẩm"
                onClick={onEdit}
              >
                <EditIcon />
              </button>
              <button
                className="btn btn-sm btn-outline-danger d-inline-flex align-items-center justify-content-center"
                style={{ width: "32px", height: "32px", padding: 0 }}
                title="Xóa sản phẩm"
                aria-label="Xóa sản phẩm"
                onClick={onDelete}
              >
                <TrashIcon />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function ProductDetail({ canManage, onBack, onDelete, onEdit, product }) {
  if (!product) {
    return (
      <section className="card border-0 shadow-sm">
        <div className="card-body text-center text-body-secondary py-5">Không tìm thấy sản phẩm.</div>
      </section>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center gap-3 mb-3">
        <button className="btn btn-sm btn-outline-secondary" onClick={onBack}>
          Quay lại danh mục
        </button>
        {canManage && (
          <div className="d-flex gap-2">
            <button
              className="btn btn-sm btn-outline-primary d-inline-flex align-items-center justify-content-center"
              style={{ width: "34px", height: "34px", padding: 0 }}
              title="Sửa sản phẩm"
              aria-label="Sửa sản phẩm"
              onClick={onEdit}
            >
              <EditIcon />
            </button>
            <button
              className="btn btn-sm btn-outline-danger d-inline-flex align-items-center justify-content-center"
              style={{ width: "34px", height: "34px", padding: 0 }}
              title="Xóa sản phẩm"
              aria-label="Xóa sản phẩm"
              onClick={onDelete}
            >
              <TrashIcon />
            </button>
          </div>
        )}
      </div>

      <div className="row mb-3 gx-2 gx-xl-3 align-items-stretch">
        <div className="col-12 col-md-8 mb-3 mb-md-0">
          <div className="card border-0 bg-transparent h-100 position-relative overflow-hidden" style={{ borderRadius: "12px", minHeight: "180px" }}>
            <img src="./assets/images/banner-web-korean.jpg" alt={product.name} className="img-fluid w-100 h-100 bg-primary-subtle" style={{ objectFit: "cover", minHeight: "180px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }} />
            {canManage && <AdminEditButton onClick={onEdit} title="Sửa thông tin banner" />}
            <div className="position-absolute top-0 start-0 h-100 w-100 d-flex align-items-end" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.08), rgba(0,0,0,0.52))", borderRadius: "12px" }}>
              <div className="p-3 p-xl-4 text-white">
                <div className="d-flex flex-wrap gap-2 mb-2">
                  <span className="badge bg-light text-primary">{getTypeLabel(product.type)}</span>
                  <span className="badge bg-success">{product.status}</span>
                </div>
                <h3 className="fw-bold mb-1">{product.name}</h3>
                <p className="mb-0" style={{ maxWidth: "760px", fontSize: "13px", lineHeight: 1.45 }}>
                  {product.description || "Chưa có mô tả."}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="card border-0 h-100 position-relative" style={{ borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", minHeight: "180px" }}>
            {canManage && <AdminEditButton onClick={onEdit} title="Sửa thống kê sản phẩm" />}
            <div className="card-body d-flex flex-column justify-content-between p-3">
              <div>
                <h6 className="fw-bold text-body-emphasis mb-2">{getTypeLabel(product.type)}</h6>
                <div className="text-body-secondary" style={{ fontSize: "13px" }}>Cập nhật {formatDate(product.updatedAt)}</div>
              </div>
              <div className="row g-2 mt-3">
                <MetricTile label="Điều kiện" value={product.conditions.length} />
                <MetricTile label="Chi phí" value={product.costs.length} />
                <MetricTile label="Quy trình" value={product.process.length} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row mb-3 gx-2 gx-xl-3 align-items-stretch">
        <div className="col-12 col-md-3 mb-3 mb-md-0">
          <div className="card border-0 h-100 position-relative" style={{ borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", minHeight: "240px" }}>
            {canManage && <AdminEditButton small onClick={onEdit} title="Sửa tổng quan" />}
            <div className="card-body p-3 d-flex flex-column justify-content-between">
              <h6 className="fw-bold d-flex align-items-center mb-2 text-body-emphasis" style={{ fontSize: "14px" }}>
                <ProductHeroIcon small />
                <span className="ms-2">TỔNG QUAN</span>
              </h6>
              <p className="text-body-secondary mb-3" style={{ fontSize: "12px", lineHeight: 1.4 }}>
                {product.description || "Chưa có mô tả."}
              </p>
              <div className="d-grid gap-2" style={{ gridTemplateColumns: "1fr 1fr" }}>
                <SummaryTile value={product.status} label="trạng thái" />
                <SummaryTile value={getTypeLabel(product.type)} label="danh mục" />
                <SummaryTile value={product.costs.length || "-"} label="hạng mục phí" />
                <SummaryTile value={product.process.length || "-"} label="bước xử lý" />
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-3 mb-3 mb-md-0">
          <div className="card border-0 h-100 position-relative" style={{ borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", minHeight: "240px" }}>
            {canManage && <AdminEditButton small onClick={onEdit} title="Sửa điều kiện nhanh" />}
            <div className="card-body p-3 d-flex flex-column">
              <h6 className="fw-bold d-flex align-items-center mb-3 text-body-emphasis" style={{ fontSize: "14px" }}>
                <ConditionIcon />
                <span className="ms-2">ĐIỀU KIỆN</span>
              </h6>
              <ConditionGrid items={product.conditions.slice(0, 4)} />
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6">
          <div className="card border-0 h-100 position-relative" style={{ borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", minHeight: "240px" }}>
            {canManage && <AdminEditButton small onClick={onEdit} title="Sửa quy trình nhanh" />}
            <div className="card-body p-3 d-flex flex-column overflow-hidden">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold d-flex align-items-center mb-0 text-body-emphasis" style={{ fontSize: "14px" }}>
                  <ProcessIcon />
                  <span className="ms-2">QUY TRÌNH</span>
                </h6>
                <span className="text-body-secondary d-none d-md-inline text-truncate" style={{ fontSize: "11px" }}>
                  {formatDate(product.updatedAt)}
                </span>
              </div>
              <ProcessTimeline items={product.process} compact />
            </div>
          </div>
        </div>
      </div>

      <div className="row mb-3 gx-2 gx-xl-3 align-items-stretch">
        <div className="col-12 col-md-4 mb-3 mb-md-0">
          <div className="card border-0 h-100 position-relative" style={{ borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", minHeight: "320px" }}>
            {canManage && <AdminEditButton onClick={onEdit} title="Sửa điều kiện chi tiết" />}
            <div className="card-header bg-transparent border-0 p-3 pb-0">
              <h6 className="fw-bold d-flex align-items-center mb-0 text-body-emphasis" style={{ fontSize: "14px" }}>
                <ConditionIcon />
                <span className="ms-2">ĐIỀU KIỆN</span>
              </h6>
            </div>
            <div className="card-body p-3">
              <ConditionGrid items={product.conditions} />
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4 mb-3 mb-md-0">
          <div className="card border-0 h-100" style={{ borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", minHeight: "320px" }}>
            <div className="card-header bg-transparent border-0 p-3 pb-0 d-flex align-items-center justify-content-between">
              <h6 className="fw-bold d-flex align-items-center mb-0 text-body-emphasis" style={{ fontSize: "14px" }}>
                <CostIcon />
                <span className="ms-2">CHI PHÍ</span>
              </h6>
              {canManage && <AdminEditButton inline onClick={onEdit} title="Sửa chi phí chi tiết" />}
            </div>
            <div className="card-body p-3 d-flex flex-column justify-content-center">
              <CostSection costs={product.costs} compact />
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card border-0 h-100 position-relative" style={{ borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", minHeight: "320px" }}>
            {canManage && <AdminEditButton onClick={onEdit} title="Sửa quy trình chi tiết" />}
            <div className="card-header bg-transparent border-0 p-3 pb-0">
              <h6 className="fw-bold d-flex align-items-center mb-0 text-body-emphasis" style={{ fontSize: "14px" }}>
                <ProcessIcon />
                <span className="ms-2">QUY TRÌNH</span>
              </h6>
            </div>
            <div className="card-body p-3">
              <ProcessTimeline items={product.process} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminEditButton({ inline = false, onClick, small = false, title }) {
  const size = small ? 28 : 32;

  return (
    <button
      className={`btn btn-sm btn-light border shadow-sm d-inline-flex align-items-center justify-content-center${inline ? "" : " position-absolute"}`}
      style={{
        ...(inline ? {} : { top: small ? "8px" : "12px", right: small ? "8px" : "12px", zIndex: 10 }),
        borderRadius: "50%",
        width: `${size}px`,
        height: `${size}px`,
        padding: 0,
      }}
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
    >
      <EditIcon size={small ? 12 : 14} />
    </button>
  );
}

function MetricTile({ label, value }) {
  return (
    <div className="col-4">
      <div className="rounded border bg-body-tertiary p-2 text-center h-100">
        <div className="fw-bold text-body-emphasis">{value}</div>
        <div className="text-body-secondary" style={{ fontSize: "12px" }}>
          {label}
        </div>
      </div>
    </div>
  );
}

function SummaryTile({ label, value }) {
  return (
    <div className="text-center rounded p-2 bg-body-secondary overflow-hidden">
      <div className="fw-bold text-body-emphasis text-truncate" style={{ fontSize: "13px" }}>
        {value}
      </div>
      <div className="text-body-secondary" style={{ fontSize: "10px", lineHeight: 1.2 }}>
        {label}
      </div>
    </div>
  );
}

function ConditionGrid({ items }) {
  const safeItems = items.length > 0 ? items : ["Chưa khai báo."];

  return (
    <div className="row g-2">
      {safeItems.map((item, index) => (
        <div className="col-12 col-md-6" key={item}>
          <div className="rounded border bg-body-tertiary p-3 h-100">
            <div className="d-flex align-items-start gap-2">
              <span className="d-inline-flex align-items-center justify-content-center rounded-circle bg-primary text-white flex-shrink-0" style={{ width: "24px", height: "24px", fontSize: "12px" }}>
                {index + 1}
              </span>
              <span className="text-body-secondary" style={{ fontSize: "13px", lineHeight: 1.5 }}>
                {item}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ProcessTimeline({ compact = false, items }) {
  const safeItems = items.length > 0 ? items : ["Chưa khai báo."];

  return (
    <div className={compact ? "d-flex overflow-x-auto pb-2 gap-2" : "d-flex flex-column flex-lg-row gap-3"}>
      {safeItems.map((item, index) => (
        <div className="position-relative flex-fill" key={item} style={compact ? { minWidth: "110px" } : undefined}>
          <div className="rounded border bg-body-tertiary p-3 h-100 text-center">
            <div className="mx-auto mb-2 d-flex align-items-center justify-content-center rounded-circle bg-primary text-white fw-bold" style={{ width: compact ? "28px" : "32px", height: compact ? "28px" : "32px", fontSize: "13px" }}>
              {index + 1}
            </div>
            <div className="fw-semibold text-body-emphasis" style={{ fontSize: compact ? "12px" : "13px", lineHeight: 1.4 }}>
              {item}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ProductHeroIcon({ small = false }) {
  return (
    <svg width={small ? "20" : "72"} height={small ? "20" : "72"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
      <path d="M3.27 6.96 12 12.01l8.73-5.05"></path>
      <path d="M12 22.08V12"></path>
    </svg>
  );
}

function ConditionIcon({ className = "" } = {}) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className={`text-primary ${className}`.trim()}>
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4Zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4Z" />
    </svg>
  );
}

function CostIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-primary">
      <path d="M19 4H5C3.9 4 3 4.9 3 6v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2ZM6 7h3v3H6V7Zm0 5h3v3H6v-3Zm12 3h-7v-3h7v3Zm0-5h-7V7h7v3Z" />
    </svg>
  );
}

function ProcessIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-primary">
      <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1S9.6 1.84 9.18 3H5c-1.1 0-2 .9-2 2v15c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2Zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1Zm4 12H8v-2h8v2Zm0-4H8V9h8v2Z" />
    </svg>
  );
}

function Section({ items, ordered = false, title }) {
  const ListTag = ordered ? "ol" : "ul";
  const safeItems = items.length > 0 ? items : ["Chưa khai báo."];

  return (
    <div className="mt-4 first:mt-0">
      <h6 className="fw-bold text-body-emphasis mb-2">{title}</h6>
      <ListTag className="mb-0 ps-3 text-body-secondary" style={{ lineHeight: 1.7 }}>
        {safeItems.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ListTag>
    </div>
  );
}

function CostSection({ compact = false, costs }) {
  return (
    <div className={compact ? "" : "mt-4"}>
      {!compact && <h6 className="fw-bold text-body-emphasis mb-2">Chi phí</h6>}
      {costs.length === 0 ? (
        <div className="text-body-secondary">Chưa khai báo.</div>
      ) : (
        <div className="table-responsive rounded border">
          <table className="table table-sm mb-0 align-middle">
            <thead>
              <tr>
                <th>Hạng mục</th>
                <th className="text-end">Số tiền/ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {costs.map((cost, index) => (
                <tr key={`${cost.name}-${index}`}>
                  <td>{cost.name}</td>
                  <td className="text-end fw-semibold">{cost.amount || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  );
}

function EditIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
      <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
      <path d="M10 11v6"></path>
      <path d="M14 11v6"></path>
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      className="position-absolute text-body-secondary"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      style={{ left: "16px", top: "50%", transform: "translateY(-50%)" }}
    >
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  );
}
