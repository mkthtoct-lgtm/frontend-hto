import { useMemo, useState, useEffect } from "react";

const API_BASE_URL = "http://localhost:3000/api/v1";
const getToken = () => localStorage.getItem("token");

const PERIOD_OPTIONS = [
  { id: "day", label: "Ngày", caption: "03/06/2026" },
  { id: "month", label: "Tháng", caption: "Tháng 06/2026" },
  { id: "quarter", label: "Quý", caption: "Quý II/2026" },
  { id: "year", label: "Năm", caption: "Năm 2026" },
];

const DASHBOARD_DATA = {
  day: {
    totals: { done: 37, files: 31, processing: 18, events: 4 },
    trend: [
      { label: "08:00", done: 4, files: 3, processing: 8, events: 1 },
      { label: "10:00", done: 9, files: 7, processing: 11, events: 2 },
      { label: "12:00", done: 15, files: 12, processing: 13, events: 2 },
      { label: "14:00", done: 23, files: 18, processing: 16, events: 3 },
      { label: "16:00", done: 31, files: 26, processing: 17, events: 3 },
      { label: "18:00", done: 37, files: 31, processing: 18, events: 4 },
    ],
  },
  month: {
    totals: { done: 186, files: 142, processing: 86, events: 19 },
    trend: [
      { label: "Tuần 1", done: 32, files: 21, processing: 24, events: 4 },
      { label: "Tuần 2", done: 68, files: 49, processing: 42, events: 8 },
      { label: "Tuần 3", done: 121, files: 91, processing: 63, events: 13 },
      { label: "Tuần 4", done: 186, files: 142, processing: 86, events: 19 },
    ],
  },
  quarter: {
    totals: { done: 548, files: 421, processing: 164, events: 46 },
    trend: [
      { label: "Tháng 4", done: 156, files: 118, processing: 52, events: 13 },
      { label: "Tháng 5", done: 362, files: 276, processing: 109, events: 31 },
      { label: "Tháng 6", done: 548, files: 421, processing: 164, events: 46 },
    ],
  },
  year: {
    totals: { done: 2148, files: 1682, processing: 438, events: 168 },
    trend: [
      { label: "T1", done: 132, files: 96, processing: 34, events: 8 },
      { label: "T2", done: 296, files: 214, processing: 72, events: 19 },
      { label: "T3", done: 521, files: 402, processing: 106, events: 36 },
      { label: "T4", done: 884, files: 689, processing: 178, events: 65 },
      { label: "T5", done: 1510, files: 1184, processing: 326, events: 121 },
      { label: "T6", done: 2148, files: 1682, processing: 438, events: 168 },
    ],
  },
};

const DEPARTMENT_STATS = [
  { name: "Phòng Hồ sơ", completed: 54, processing: 18, pending: 7, files: 43, color: "#2563eb" },
  { name: "Phòng Tư vấn", completed: 46, processing: 14, pending: 5, files: 22, color: "#16a34a" },
  { name: "Phòng Đào tạo", completed: 38, processing: 21, pending: 9, files: 18, color: "#f59e0b" },
  { name: "CSKH", completed: 31, processing: 12, pending: 4, files: 14, color: "#0ea5e9" },
  { name: "Đối tác", completed: 17, processing: 8, pending: 3, files: 9, color: "#8b5cf6" },
];

const EVENTS = [
  {
    date: "03/06",
    time: "08:30",
    title: "Họp tiến độ hồ sơ visa",
    department: "Phòng Hồ sơ",
    location: "Phòng họp A",
    note: "Chốt danh sách hồ sơ cần bổ sung giấy tờ trong tuần.",
    status: "Đang diễn ra",
    tone: "bg-primary-subtle text-primary",
  },
  {
    date: "03/06",
    time: "10:00",
    title: "Tư vấn du học nghề Đức",
    department: "Phòng Tư vấn",
    location: "Online Meet",
    note: "12 khách hàng đã đặt lịch, ưu tiên nhóm điều dưỡng và nhà hàng.",
    status: "Sắp tới",
    tone: "bg-success-subtle text-success",
  },
  {
    date: "03/06",
    time: "14:00",
    title: "Kiểm tra trình độ tiếng Đức",
    department: "Phòng Đào tạo",
    location: "Lớp B1.02",
    note: "Test đầu vào cho học viên mới và phân lớp theo năng lực.",
    status: "Chuẩn bị",
    tone: "bg-warning-subtle text-warning",
  },
  {
    date: "04/06",
    time: "09:15",
    title: "Checklist trước ngày bay",
    department: "CSKH",
    location: "Văn phòng HTO",
    note: "Kiểm tra vé bay, bảo hiểm, giấy tờ gốc và hướng dẫn nhập cảnh.",
    status: "Ngày mai",
    tone: "bg-info-subtle text-info",
  },
];

const RECENT_TASKS = [
  { title: "Hoàn tất bộ hồ sơ visa Đức", department: "Phòng Hồ sơ", done: 14, processing: 6, status: "Đang xử lý", due: "Hôm nay" },
  { title: "Gọi lại khách hàng quan tâm định cư", department: "Phòng Tư vấn", done: 21, processing: 4, status: "Hoàn tất", due: "03/06" },
  { title: "Cập nhật điểm danh lớp tiếng Đức", department: "Phòng Đào tạo", done: 18, processing: 7, status: "Đang xử lý", due: "04/06" },
  { title: "Gửi lịch webinar cho học viên", department: "CSKH", done: 9, processing: 3, status: "Chờ phản hồi", due: "05/06" },
];

const getStatusClassName = (status) => {
  if (status === "Hoàn tất") return "bg-success-subtle text-success";
  if (status === "Chờ phản hồi") return "bg-warning-subtle text-warning";
  return "bg-primary-subtle text-primary";
};

const getDepartmentTotal = (department) =>
  department.completed + department.processing + department.pending;

const formatNumber = (value) => value.toLocaleString("vi-VN");


// Giải mã JWT để lấy userId và departmentId
const decodeToken = () => {
  try {
    const token = getToken();
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload; // { sub, roleId, departmentId, email }
  } catch {
    return null;
  }
};

const ROLE_ID_MAP = {
  "69fc5af582ef85451120772a": "admin",
  "69fc5af582ef85451120772b": "bangiamdoc",
  "69fc5af582ef85451120772c": "truongbophan",
  "69fc5af582ef85451120772d": "nhansu",
  "69fc5af582ef85451120772e": "daily",
  "69fc5af682ef85451120772f": "congtacvien",
  "69fc5af782ef854511207730": "user",
};

// Chọn đúng endpoint theo role trả về từ API
const getApiEndpoint = (role, tokenPayload) => {
  if (role === "board_of_directors" || role === "admin" || role === "bangiamdoc") {
    return `${API_BASE_URL}/dashboard/board-of-directors`;
  }
  if (role === "truongbophan" || role === "department_head") {
    return `${API_BASE_URL}/dashboard/department-head?departmentId=${tokenPayload?.departmentId}`;
  }
  if (role === "nhansu" || role === "employee" || role === "daily" || role === "congtacvien" || role === "user" || role === "hethong") {
    return `${API_BASE_URL}/dashboard/employee?userId=${tokenPayload?.sub}`;
  }
  return `${API_BASE_URL}/dashboard/board-of-directors`; // fallback
};

export const DashboardPage = () => {
  // --- tất cả hooks phải ở trên cùng, trước mọi early return ---
  const [apiData, setApiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [selectedPointIndex, setSelectedPointIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      try {
        // Bước 1: gọi /dashboard để biết role của user
        const firstRes = await fetch(`${API_BASE_URL}/dashboard`, {
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        });
        const firstJson = await firstRes.json();
        if (!firstRes.ok) throw new Error(firstJson?.message || `HTTP ${firstRes.status}`);
        
        let role = firstJson.data?.role;
        const tokenPayload = decodeToken();
        
        // Fallback sang role trích xuất từ token nếu API không trả về
        if (!role && tokenPayload?.roleId) {
          role = ROLE_ID_MAP[tokenPayload.roleId];
        }
        
        // Chuẩn hóa tên role
        if (role === "admin" || role === "bangiamdoc" || role === "board_of_directors") {
          role = "board_of_directors";
        } else if (role === "department_head" || role === "truongbophan") {
          role = "truongbophan";
        } else if (role === "employee" || role === "nhansu") {
          role = "nhansu";
        } else if (role === "agent" || role === "daily") {
          role = "daily";
        } else if (role === "collaborator" || role === "congtacvien") {
          role = "congtacvien";
        } else if (role === "client" || role === "user" || role === "hethong") {
          role = "user";
        }

        // Bước 2: gọi đúng endpoint theo role
        const endpoint = getApiEndpoint(role, tokenPayload);
        const res = await fetch(endpoint, {
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.message || `HTTP ${res.status}`);
        if (!cancelled) {
          const finalData = json.data ?? json;
          if (!finalData.role) {
            finalData.role = role;
          }
          setApiData(finalData);
        }
      } catch (err) {
        if (!cancelled) setError(err.message || "Không thể tải dữ liệu dashboard.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, []);

  const chartData = apiData?.chartData ?? DASHBOARD_DATA;
  const selectedData = chartData[selectedPeriod] ?? DASHBOARD_DATA[selectedPeriod];

  const departmentStats = apiData?.topDepartments?.length > 0
    ? apiData.topDepartments.map((dept, index) => ({
        name: dept.name,
        completed: dept.memberCount ?? 0,
        processing: 0,
        pending: 0,
        files: dept.memberCount ?? 0,
        color: ["#2563eb", "#16a34a", "#f59e0b", "#0ea5e9", "#8b5cf6"][index % 5],
      }))
    : DEPARTMENT_STATS;

  const events = apiData?.events?.length > 0 ? apiData.events : EVENTS;
  const recentTasks = apiData?.recentTasks?.length > 0 ? apiData.recentTasks : RECENT_TASKS;

  const selectedPoint = selectedData.trend[Math.min(selectedPointIndex, selectedData.trend.length - 1)];
  const activeOption = PERIOD_OPTIONS.find((option) => option.id === selectedPeriod);
  const stats = apiData?.stats;

  const role = apiData?.role;
  const periodTotals = selectedData.totals;

  // Metrics thay đổi theo role
  const metrics = useMemo(() => {
    if (role === "truongbophan") {
      const ms = apiData?.memberStats ?? {};
      const ds = apiData?.documentStats ?? {};
      return [
        { label: "Tổng nhân sự", value: ms.total ?? 0, change: `${ms.active ?? 0} đang hoạt động`, caption: apiData?.department?.name ?? "", color: "#2563eb", bg: "bg-primary-subtle", tone: "text-primary", key: "done" },
        { label: "Nhân sự hoạt động", value: ms.active ?? 0, change: `${ms.inactive ?? 0} không hoạt động`, caption: "", color: "#16a34a", bg: "bg-success-subtle", tone: "text-success", key: "files" },
        { label: "Tổng tài liệu", value: ds.total ?? 0, change: `${ds.active ?? 0} đang hoạt động`, caption: "", color: "#f59e0b", bg: "bg-warning-subtle", tone: "text-warning", key: "processing" },
        { label: "Tài liệu chờ duyệt", value: ds.pending ?? 0, change: `${ds.draft ?? 0} bản nháp`, caption: "", color: "#0ea5e9", bg: "bg-info-subtle", tone: "text-info", key: "events" },
      ];
    }
    if (role === "nhansu") {
      const ds = apiData?.documentStats ?? {};
      return [
        { label: "Tổng tài liệu của tôi", value: ds.total ?? 0, change: `${ds.active ?? 0} đang hoạt động`, caption: apiData?.user?.fullName ?? "", color: "#2563eb", bg: "bg-primary-subtle", tone: "text-primary", key: "done" },
        { label: "Tài liệu active", value: ds.active ?? 0, change: "đang hoạt động", caption: "", color: "#16a34a", bg: "bg-success-subtle", tone: "text-success", key: "files" },
        { label: "Bản nháp", value: ds.draft ?? 0, change: "chưa gửi", caption: "", color: "#f59e0b", bg: "bg-warning-subtle", tone: "text-warning", key: "processing" },
        { label: "Chờ duyệt", value: ds.pending ?? 0, change: "cần xử lý", caption: "", color: "#0ea5e9", bg: "bg-info-subtle", tone: "text-info", key: "events" },
      ];
    }
    if (role === "daily") {
      const ds = apiData?.documentStats ?? {};
      return [
        { label: "Tổng tài liệu Đại lý", value: ds.total ?? 0, change: `${ds.active ?? 0} đang hoạt động`, caption: apiData?.user?.fullName ?? "", color: "#2563eb", bg: "bg-primary-subtle", tone: "text-primary", key: "done" },
        { label: "Tài liệu active", value: ds.active ?? 0, change: "đang hoạt động", caption: "", color: "#16a34a", bg: "bg-success-subtle", tone: "text-success", key: "files" },
        { label: "Hồ sơ nháp", value: ds.draft ?? 0, change: "chưa gửi", caption: "", color: "#f59e0b", bg: "bg-warning-subtle", tone: "text-warning", key: "processing" },
        { label: "Yêu cầu chờ duyệt", value: ds.pending ?? 0, change: "đang xử lý", caption: "", color: "#0ea5e9", bg: "bg-info-subtle", tone: "text-info", key: "events" },
      ];
    }
    if (role === "congtacvien") {
      const ds = apiData?.documentStats ?? {};
      return [
        { label: "Tổng tài liệu CTV", value: ds.total ?? 0, change: `${ds.active ?? 0} đang hoạt động`, caption: apiData?.user?.fullName ?? "", color: "#2563eb", bg: "bg-primary-subtle", tone: "text-primary", key: "done" },
        { label: "Tài liệu active", value: ds.active ?? 0, change: "đang hoạt động", caption: "", color: "#16a34a", bg: "bg-success-subtle", tone: "text-success", key: "files" },
        { label: "Hồ sơ nháp", value: ds.draft ?? 0, change: "chưa gửi", caption: "", color: "#f59e0b", bg: "bg-warning-subtle", tone: "text-warning", key: "processing" },
        { label: "Yêu cầu chờ duyệt", value: ds.pending ?? 0, change: "đang xử lý", caption: "", color: "#0ea5e9", bg: "bg-info-subtle", tone: "text-info", key: "events" },
      ];
    }
    if (role === "user") {
      const ds = apiData?.documentStats ?? {};
      return [
        { label: "Hồ sơ cá nhân", value: ds.total ?? 0, change: `${ds.active ?? 0} đang hoạt động`, caption: apiData?.user?.fullName ?? "", color: "#2563eb", bg: "bg-primary-subtle", tone: "text-primary", key: "done" },
        { label: "Tài liệu hoạt động", value: ds.active ?? 0, change: "đang hoạt động", caption: "", color: "#16a34a", bg: "bg-success-subtle", tone: "text-success", key: "files" },
        { label: "Bản nháp", value: ds.draft ?? 0, change: "chưa gửi", caption: "", color: "#f59e0b", bg: "bg-warning-subtle", tone: "text-warning", key: "processing" },
        { label: "Chờ duyệt", value: ds.pending ?? 0, change: "cần xử lý", caption: "", color: "#0ea5e9", bg: "bg-info-subtle", tone: "text-info", key: "events" },
      ];
    }
    // board_of_directors - dùng stats thật từ API
    return [
      { label: "Tổng người dùng", value: stats?.totalUsers ?? periodTotals.done, change: "trong hệ thống", caption: activeOption?.caption || "", color: "#2563eb", bg: "bg-primary-subtle", tone: "text-primary", key: "done" },
      { label: "Tổng tài liệu", value: stats?.totalDocuments ?? periodTotals.files, change: `${stats?.totalActiveDocuments ?? 0} đang hoạt động`, caption: activeOption?.caption || "", color: "#16a34a", bg: "bg-success-subtle", tone: "text-success", key: "files" },
      { label: "Tài liệu đang xử lý", value: stats?.totalActiveDocuments ?? periodTotals.processing, change: "đang xử lý", caption: activeOption?.caption || "", color: "#f59e0b", bg: "bg-warning-subtle", tone: "text-warning", key: "processing" },
      { label: "Tổng phòng ban", value: stats?.totalDepartments ?? periodTotals.events, change: "phòng ban", caption: activeOption?.caption || "", color: "#0ea5e9", bg: "bg-info-subtle", tone: "text-info", key: "events" },
    ];
  }, [role, apiData, stats, periodTotals, activeOption?.caption]);

  const handleSelectPeriod = (periodId) => {
    const nextData = (apiData?.chartData ?? DASHBOARD_DATA)[periodId] ?? DASHBOARD_DATA[periodId];
    setSelectedPeriod(periodId);
    setSelectedPointIndex(nextData.trend.length - 1);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status" />
          <div className="text-body-secondary" style={{ fontSize: "13px" }}>Đang tải dữ liệu...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid pt-3" style={{ maxWidth: "1600px" }}>
        <div className="alert alert-danger d-flex align-items-center justify-content-between gap-3">
          <span>⚠️ {error}</span>
          <button className="btn btn-sm btn-outline-danger" onClick={() => window.location.reload()}>Thử lại</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid pt-3 pb-1" style={{ maxWidth: "1600px" }}>
      <div className="card border-0 mb-3" style={{ borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <div className="card-body p-3 d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <h5 className="fw-bold text-body-emphasis mb-1">
              {role === "truongbophan" ? `Dashboard – ${apiData?.department?.name ?? "Phòng ban"}` :
               role === "nhansu" ? `Dashboard – ${apiData?.user?.fullName ?? "Cá nhân"}` :
               role === "daily" ? `Dashboard Đại lý – ${apiData?.user?.fullName ?? "Đại lý"}` :
               role === "congtacvien" ? `Dashboard Cộng tác viên – ${apiData?.user?.fullName ?? "Cộng tác viên"}` :
               role === "user" ? `Dashboard Khách hàng – ${apiData?.user?.fullName ?? "Cá nhân"}` :
               "Dashboard thống kê vận hành"}
            </h5>
            <div className="text-body-secondary" style={{ fontSize: "13px" }}>
              {role === "board_of_directors" ? "Tổng quan toàn hệ thống – Ban Giám Đốc" :
               role === "truongbophan" ? "Thống kê nhân sự và tài liệu phòng ban của bạn" :
               role === "daily" ? "Thống kê tài liệu và hoạt động của Đại lý" :
               role === "congtacvien" ? "Thống kê tài liệu và hoạt động của Cộng tác viên" :
               role === "user" ? "Chi tiết tiến độ hồ sơ và tài liệu cá nhân của bạn" :
               "Thống kê tài liệu và hoạt động cá nhân"}
            </div>
          </div>
          <div className="d-flex flex-wrap gap-2">
            {PERIOD_OPTIONS.map((option) => (
              <button
                className={`btn btn-sm ${selectedPeriod === option.id ? "btn-primary" : "btn-outline-primary"}`}
                key={option.id}
                type="button"
                onClick={() => handleSelectPeriod(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="row mb-3 gx-2 gx-xl-3 align-items-stretch">
        {metrics.map((metric) => (
          <div className="col-12 col-sm-6 col-xl-3 mb-3 mb-xl-0" key={metric.label}>
            <TrendMetricCard metric={metric} trend={selectedData.trend} />
          </div>
        ))}
      </div>

      {/* Section riêng cho Trưởng bộ phận: danh sách thành viên */}
      {role === "truongbophan" && apiData?.members?.length > 0 && (
        <div className="card border-0 mb-3" style={{ borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div className="card-header bg-transparent border-0 p-3 pb-0">
            <h6 className="fw-bold d-flex align-items-center mb-0 text-body-emphasis" style={{ fontSize: "14px" }}>
              <DepartmentIcon /><span className="ms-2">THÀNH VIÊN PHÒNG BAN</span>
            </h6>
          </div>
          <div className="card-body p-0 table-responsive">
            <table className="table table-borderless align-middle mb-0" style={{ fontSize: "13px" }}>
              <thead className="border-bottom">
                <tr>
                  <th className="ps-4 py-3">Họ tên</th>
                  <th className="py-3">Email</th>
                  <th className="py-3">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {apiData.members.map((m) => (
                  <tr className="border-bottom" key={m.id ?? m._id}>
                    <td className="ps-4 py-3 fw-semibold text-body-emphasis">{m.fullName}</td>
                    <td className="py-3 text-body-secondary">{m.email}</td>
                    <td className="py-3"><span className={`badge ${m.status === "active" ? "bg-success-subtle text-success" : "bg-warning-subtle text-warning"}`}>{m.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Section riêng cho Nhân sự/Đại lý/CTV/Khách hàng: tài liệu gần đây */}
      {["nhansu", "daily", "congtacvien", "user"].includes(role) && (
        <div className="card border-0 mb-3" style={{ borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div className="card-header bg-transparent border-0 p-3 pb-0">
            <h6 className="fw-bold d-flex align-items-center mb-0 text-body-emphasis" style={{ fontSize: "14px" }}>
              <TaskIcon /><span className="ms-2">
                {role === "daily" ? "TÀI LIỆU MỚI NHẤT CỦA ĐẠI LÝ" :
                 role === "congtacvien" ? "TÀI LIỆU MỚI NHẤT CỦA CTV" :
                 role === "user" ? "DANH SÁCH TÀI LIỆU CÁ NHÂN" :
                 "TÀI LIỆU GẦN ĐÂY CỦA TÔI"}
              </span>
            </h6>
          </div>
          <div className="card-body p-0 table-responsive">
            <table className="table table-borderless align-middle mb-0" style={{ fontSize: "13px" }}>
              <thead className="border-bottom">
                <tr>
                  <th className="ps-4 py-3">Tên tài liệu</th>
                  <th className="py-3">Trạng thái</th>
                  <th className="text-end pe-4 py-3">Ngày tạo</th>
                </tr>
              </thead>
              <tbody>
                {(apiData?.recentDocuments ?? []).length === 0 ? (
                  <tr><td colSpan="3" className="ps-4 py-3 text-body-secondary">Chưa có tài liệu nào.</td></tr>
                ) : (apiData.recentDocuments.map((doc) => (
                  <tr className="border-bottom" key={doc.id ?? doc._id}>
                    <td className="ps-4 py-3 fw-semibold text-body-emphasis">{doc.title ?? doc.name}</td>
                    <td className="py-3"><span className="badge bg-primary-subtle text-primary">{doc.status}</span></td>
                    <td className="text-end pe-4 py-3 text-body-secondary">{doc.createdAt ? new Date(doc.createdAt).toLocaleDateString("vi-VN") : "—"}</td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="row mb-3 gx-2 gx-xl-3 align-items-stretch">
        <div className="col-12 col-xl-8 mb-3 mb-xl-0">
          <div className="card border-0 h-100" style={{ borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", minHeight: "420px" }}>
            <div className="card-header bg-transparent border-0 p-3 pb-0 d-flex flex-wrap align-items-center justify-content-between gap-2">
              <h6 className="fw-bold d-flex align-items-center mb-0 text-body-emphasis" style={{ fontSize: "14px" }}>
                <ChartIcon />
                <span className="ms-2">BIỂU ĐỒ XU HƯỚNG THEO {activeOption?.label.toUpperCase()}</span>
              </h6>
              <span className="badge bg-body-secondary text-body" style={{ fontSize: "11px" }}>{activeOption?.caption}</span>
            </div>
            <div className="card-body p-3">
              <div className="rounded border bg-body-tertiary p-3">
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                  <div>
                    <div className="fw-bold text-body-emphasis" style={{ fontSize: "22px" }}>
                      {formatNumber(selectedData.totals.done)} công việc · {formatNumber(selectedData.totals.files)} hồ sơ
                    </div>
                    <div className="text-body-secondary" style={{ fontSize: "12px" }}>Tổng số thống kê trong {activeOption?.caption.toLowerCase()}</div>
                  </div>
                  <div className="d-flex flex-wrap gap-3">
                    <Legend color="#2563eb" label="Công việc hoàn thành" />
                    <Legend color="#16a34a" label="Hồ sơ xử lý" />
                    <Legend color="#f59e0b" label="Đang xử lý" />
                  </div>
                </div>
                <InteractiveTrendChart
                  data={selectedData.trend}
                  selectedIndex={Math.min(selectedPointIndex, selectedData.trend.length - 1)}
                  onSelect={setSelectedPointIndex}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-4">
          <div className="card border-0 h-100" style={{ borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", minHeight: "420px" }}>
            <div className="card-header bg-transparent border-0 p-3 pb-0">
              <h6 className="fw-bold d-flex align-items-center mb-0 text-body-emphasis" style={{ fontSize: "14px" }}>
                <TaskIcon />
                <span className="ms-2">CHI TIẾT MỐC THỐNG KÊ</span>
              </h6>
            </div>
            <div className="card-body p-3">
              <div className="rounded border bg-body-tertiary p-3 mb-3">
                <span className="text-body-secondary d-block mb-1" style={{ fontSize: "12px" }}>Mốc đang xem</span>
                <div className="fw-bold text-body-emphasis" style={{ fontSize: "22px" }}>{selectedPoint.label}</div>
                <div className="text-body-secondary" style={{ fontSize: "12px" }}>{activeOption?.caption}</div>
              </div>
              <div className="row g-2">
                <DetailTile label="Công việc hoàn thành" value={selectedPoint.done} tone="text-primary" />
                <DetailTile label="Hồ sơ xử lý" value={selectedPoint.files} tone="text-success" />
                <DetailTile label="Hồ sơ đang xử lý" value={selectedPoint.processing} tone="text-warning" />
                <DetailTile label="Sự kiện" value={selectedPoint.events} tone="text-info" />
              </div>
              <div className="rounded border bg-body-tertiary p-3 mt-3">
                <div className="fw-semibold text-body-emphasis mb-2" style={{ fontSize: "13px" }}>Nhận định nhanh</div>
                <p className="text-body-secondary mb-0" style={{ fontSize: "12px", lineHeight: 1.45 }}>
                  Mốc {selectedPoint.label} có {selectedPoint.done} công việc hoàn thành và {selectedPoint.files} hồ sơ đã xử lý. Nhóm hồ sơ đang xử lý còn {selectedPoint.processing}, nên cần ưu tiên rà soát checklist và lịch hẹn liên quan.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row mb-3 gx-2 gx-xl-3 align-items-stretch">
        <div className="col-12 col-xl-7 mb-3 mb-xl-0">
          <div className="card border-0 h-100" style={{ borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", minHeight: "360px" }}>
            <div className="card-header bg-transparent border-0 p-3 pb-0 d-flex align-items-center justify-content-between">
              <h6 className="fw-bold d-flex align-items-center mb-0 text-body-emphasis" style={{ fontSize: "14px" }}>
                <DepartmentIcon />
                <span className="ms-2">THỐNG KÊ THEO PHÒNG BAN</span>
              </h6>
              <span className="text-body-secondary d-none d-md-inline" style={{ fontSize: "11px" }}>Công việc, hồ sơ và tồn xử lý</span>
            </div>
            <div className="card-body p-3">
              <div className="d-flex flex-column gap-3">
                {departmentStats.map((department) => <DepartmentRow department={department} key={department.name} />)}
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-5">
          <div className="card border-0 h-100" style={{ borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", minHeight: "360px" }}>
            <div className="card-header bg-transparent border-0 p-3 pb-0">
              <h6 className="fw-bold d-flex align-items-center mb-0 text-body-emphasis" style={{ fontSize: "14px" }}>
                <CalendarIcon />
                <span className="ms-2">LỊCH SỰ KIỆN CHI TIẾT</span>
              </h6>
            </div>
            <div className="card-body p-3 d-flex flex-column gap-2">
              {events.map((event, index) => (
                <EventCard event={event} isLast={index === events.length - 1} key={`${event.date}-${event.time}-${event.title}`} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="row mb-3 gx-2 gx-xl-3 align-items-stretch">
        <div className="col-12">
          <div className="card border-0" style={{ borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div className="card-header bg-transparent border-0 p-3 pb-0">
              <h6 className="fw-bold d-flex align-items-center mb-0 text-body-emphasis" style={{ fontSize: "14px" }}>
                <TaskIcon />
                <span className="ms-2">CÔNG VIỆC CẦN THEO DÕI</span>
              </h6>
            </div>
            <div className="card-body p-0 table-responsive">
              <table className="table table-borderless align-middle mb-0" style={{ fontSize: "13px" }}>
                <thead className="border-bottom">
                  <tr>
                    <th className="ps-4 py-3 text-body-emphasis">Công việc</th>
                    <th className="py-3 text-body-emphasis">Phòng ban</th>
                    <th className="py-3 text-body-emphasis">Tiến độ</th>
                    <th className="text-end pe-4 py-3 text-body-emphasis">Hạn</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTasks.map((task) => (
                    <tr className="border-bottom" key={task.title}>
                      <td className="ps-4 py-3 fw-semibold text-body-emphasis">{task.title}</td>
                      <td className="py-3 text-body-secondary">{task.department}</td>
                      <td className="py-3">
                        <span className={`badge mb-1 ${getStatusClassName(task.status)}`}>{task.status}</span>
                        <div className="text-body-secondary" style={{ fontSize: "11px" }}>{task.done} xong · {task.processing} đang xử lý</div>
                      </td>
                      <td className="text-end pe-4 py-3 text-body-secondary">{task.due}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function InteractiveTrendChart({ data, onSelect, selectedIndex }) {
  const maxValue = Math.max(...data.flatMap((item) => [item.done, item.files, item.processing]), 1);
  const getPoint = (item, index, key) => {
    const x = data.length === 1 ? 60 : 60 + index * (620 / (data.length - 1));
    const y = 188 - (item[key] / maxValue) * 142;
    return { x, y };
  };
  const toPolyline = (key) => data.map((item, index) => {
    const point = getPoint(item, index, key);
    return `${point.x},${point.y}`;
  }).join(" ");

  return (
    <svg viewBox="0 0 720 240" role="img" aria-label="Biểu đồ xu hướng công việc và hồ sơ" className="w-100" style={{ minHeight: "260px" }}>
      {[46, 82, 118, 154, 190].map((y) => (
        <line key={y} x1="40" y1={y} x2="700" y2={y} stroke="var(--bs-border-color)" strokeWidth="1" />
      ))}
      <polyline points={toPolyline("processing")} fill="none" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" opacity="0.75" />
      <polyline points={toPolyline("files")} fill="none" stroke="#16a34a" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={toPolyline("done")} fill="none" stroke="#2563eb" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((item, index) => {
        const donePoint = getPoint(item, index, "done");
        const filePoint = getPoint(item, index, "files");
        const processingPoint = getPoint(item, index, "processing");
        const isSelected = selectedIndex === index;

        return (
          <g key={item.label}>
            {isSelected && (
              <rect x={donePoint.x - 44} y="30" width="88" height="172" rx="10" fill="currentColor" opacity="0.06" />
            )}
            <g
              aria-label={`Xem chi tiết ${item.label}`}
              onClick={() => onSelect(index)}
              role="button"
              style={{ cursor: "pointer" }}
              tabIndex="0"
            >
              <circle cx={processingPoint.x} cy={processingPoint.y} r={isSelected ? "7" : "5"} fill="#f59e0b" />
              <circle cx={filePoint.x} cy={filePoint.y} r={isSelected ? "7" : "5"} fill="#16a34a" />
              <circle cx={donePoint.x} cy={donePoint.y} r={isSelected ? "8" : "6"} fill="#2563eb" />
            </g>
            <text x={donePoint.x} y="224" textAnchor="middle" fill="currentColor" style={{ fontSize: "12px", fontWeight: isSelected ? 700 : 400 }}>{item.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

function TrendMetricCard({ metric, trend }) {
  const maxValue = Math.max(...trend.map((item) => item[metric.key]), 1);
  const points = trend.map((item, index) => {
    const x = trend.length === 1 ? 0 : index * (288 / (trend.length - 1));
    const y = 90 - (item[metric.key] / maxValue) * 76;
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className="card border-0 h-100 overflow-hidden" style={{ borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
      <div className="card-body p-3">
        <div className="d-flex align-items-start justify-content-between gap-2">
          <div style={{ minWidth: 0 }}>
            <span className="text-body-secondary d-block mb-1" style={{ fontSize: "12px" }}>{metric.label}</span>
            <div className="fw-bold text-body-emphasis" style={{ fontSize: "25px", lineHeight: 1 }}>{formatNumber(metric.value)}</div>
            <span className={`d-block mt-2 fw-semibold ${metric.tone}`} style={{ fontSize: "11px" }}>{metric.change} <span className="text-body-secondary fw-normal">{metric.caption}</span></span>
          </div>
          <div className={`d-flex align-items-center justify-content-center rounded-circle ${metric.bg} ${metric.tone}`} style={{ width: "42px", height: "42px" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17h2.75l3.5-4.5 3 3.5L19 7.5V11h2V4h-7v2h3.52l-5.35 6.74-3-3.5L3 17Z" /></svg>
          </div>
        </div>
        <svg viewBox="0 0 288 96" className="w-100 mt-3" role="img" aria-label={`Xu hướng ${metric.label}`} style={{ height: "76px" }}>
          <path d="M0 95H288" stroke="var(--bs-border-color)" />
          <polyline points={points} fill="none" stroke={metric.color} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points={`${points} 288,96 0,96`} fill={metric.color} opacity="0.1" />
        </svg>
      </div>
    </div>
  );
}

function DepartmentRow({ department }) {
  const total = getDepartmentTotal(department);
  const completedWidth = `${Math.round((department.completed / total) * 100)}%`;
  const processingWidth = `${Math.round((department.processing / total) * 100)}%`;
  const pendingWidth = `${Math.round((department.pending / total) * 100)}%`;

  return (
    <div className="rounded border bg-body-tertiary p-3">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
        <div>
          <div className="fw-bold text-body-emphasis" style={{ fontSize: "13px" }}>{department.name}</div>
          <div className="text-body-secondary" style={{ fontSize: "12px" }}>{total} đầu việc · {department.files} hồ sơ đã xử lý</div>
        </div>
        <div className="d-flex gap-3 text-nowrap">
          <SmallStat label="Hoàn thành" value={department.completed} tone="text-success" />
          <SmallStat label="Đang xử lý" value={department.processing} tone="text-primary" />
          <SmallStat label="Tồn" value={department.pending} tone="text-warning" />
        </div>
      </div>
      <div className="d-flex overflow-hidden bg-body-secondary" style={{ height: "10px", borderRadius: "999px" }}>
        <div style={{ width: completedWidth, backgroundColor: "#16a34a" }} />
        <div style={{ width: processingWidth, backgroundColor: department.color }} />
        <div style={{ width: pendingWidth, backgroundColor: "#f59e0b" }} />
      </div>
    </div>
  );
}

function DetailTile({ label, value, tone }) {
  return (
    <div className="col-6">
      <div className="rounded border bg-body-tertiary p-3 h-100">
        <div className={`fw-bold ${tone}`} style={{ fontSize: "20px" }}>{formatNumber(value)}</div>
        <div className="text-body-secondary" style={{ fontSize: "12px", lineHeight: 1.25 }}>{label}</div>
      </div>
    </div>
  );
}

function EventCard({ event, isLast }) {
  return (
    <div className="d-flex gap-3 position-relative">
      {!isLast && (
        <div className="position-absolute" style={{ left: "37px", top: "54px", bottom: "-10px", width: "2px", backgroundColor: "var(--bs-border-color)" }} />
      )}
      <div className="rounded bg-primary text-white text-center flex-shrink-0 position-relative" style={{ width: "74px", padding: "7px 4px", zIndex: 1 }}>
        <div className="fw-bold" style={{ fontSize: "12px" }}>{event.date}</div>
        <div style={{ fontSize: "11px", opacity: 0.88 }}>{event.time}</div>
      </div>
      <div className="rounded border bg-body-tertiary p-2 flex-grow-1" style={{ minWidth: 0 }}>
        <div className="d-flex align-items-start justify-content-between gap-2 mb-1">
          <div className="fw-bold text-body-emphasis" style={{ fontSize: "13px", lineHeight: 1.25 }}>{event.title}</div>
          <span className={`badge flex-shrink-0 ${event.tone}`} style={{ fontSize: "10px" }}>{event.status}</span>
        </div>
        <div className="text-body-secondary mb-1" style={{ fontSize: "12px" }}>{event.department} · {event.location}</div>
        <div className="text-body-secondary" style={{ fontSize: "12px", lineHeight: 1.35 }}>{event.note}</div>
      </div>
    </div>
  );
}

function Legend({ color, label }) {
  return (
    <div className="d-flex align-items-center gap-1 text-body-secondary" style={{ fontSize: "12px" }}>
      <span className="d-inline-block rounded-circle" style={{ width: "9px", height: "9px", backgroundColor: color }} />
      {label}
    </div>
  );
}

function SmallStat({ label, value, tone }) {
  return (
    <div className="text-end">
      <div className={`fw-bold ${tone}`} style={{ fontSize: "13px" }}>{value}</div>
      <div className="text-body-secondary" style={{ fontSize: "10px" }}>{label}</div>
    </div>
  );
}

function ChartIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" className="text-primary" fill="currentColor"><path d="M3 17h2.75l3.5-4.5 3 3.5L19 7.5V11h2V4h-7v2h3.52l-5.35 6.74-3-3.5L3 17Z" /></svg>;
}

function CalendarIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" className="text-primary" fill="currentColor"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2Zm0 16H5V8h14v11Z" /></svg>;
}

function DepartmentIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" className="text-primary" fill="currentColor"><path d="M3 21V7l6-4 6 4v3h6v11h-7v-5H10v5H3Zm2-2h3v-5h8v5h3v-7h-6V8L9 5.35 5 8v11Z" /></svg>;
}

function TaskIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" className="text-primary" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14h18V5c0-1.1-.9-2-2-2ZM8 17H5v-2h3v2Zm0-4H5v-2h3v2Zm0-4H5V7h3v2Zm11 8H10v-2h9v2Zm0-4H10v-2h9v2Zm0-4H10V7h9v2Z" /></svg>;
}
