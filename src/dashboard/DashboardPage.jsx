import { useMemo, useState } from "react";

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

export const DashboardPage = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const selectedData = DASHBOARD_DATA[selectedPeriod];
  const [selectedPointIndex, setSelectedPointIndex] = useState(selectedData.trend.length - 1);

  const selectedPoint = selectedData.trend[Math.min(selectedPointIndex, selectedData.trend.length - 1)];
  const activeOption = PERIOD_OPTIONS.find((option) => option.id === selectedPeriod);
  const metrics = useMemo(() => [
    {
      label: "Tổng công việc hoàn thành",
      value: selectedData.totals.done,
      change: "+24.5%",
      caption: "xu hướng tăng",
      color: "#2563eb",
      bg: "bg-primary-subtle",
      tone: "text-primary",
      key: "done",
    },
    {
      label: "Tổng hồ sơ xử lý",
      value: selectedData.totals.files,
      change: "+18.2%",
      caption: "đạt kế hoạch",
      color: "#16a34a",
      bg: "bg-success-subtle",
      tone: "text-success",
      key: "files",
    },
    {
      label: "Hồ sơ đang xử lý",
      value: selectedData.totals.processing,
      change: "-9 hồ sơ tồn",
      caption: "đang kiểm soát",
      color: "#f59e0b",
      bg: "bg-warning-subtle",
      tone: "text-warning",
      key: "processing",
    },
    {
      label: "Lịch sự kiện",
      value: selectedData.totals.events,
      change: "đã lên lịch",
      caption: activeOption?.caption || "",
      color: "#0ea5e9",
      bg: "bg-info-subtle",
      tone: "text-info",
      key: "events",
    },
  ], [activeOption?.caption, selectedData]);

  const handleSelectPeriod = (periodId) => {
    const nextData = DASHBOARD_DATA[periodId];
    setSelectedPeriod(periodId);
    setSelectedPointIndex(nextData.trend.length - 1);
  };

  return (
    <div className="container-fluid pt-3 pb-1" style={{ maxWidth: "1600px" }}>
      <div className="card border-0 mb-3" style={{ borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <div className="card-body p-3 d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <h5 className="fw-bold text-body-emphasis mb-1">Dashboard thống kê vận hành</h5>
            <div className="text-body-secondary" style={{ fontSize: "13px" }}>
              Lọc theo thời gian, xem tổng số và bấm vào từng mốc biểu đồ để xem chi tiết chỉ số.
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
                {DEPARTMENT_STATS.map((department) => <DepartmentRow department={department} key={department.name} />)}
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
              {EVENTS.map((event, index) => (
                <EventCard event={event} isLast={index === EVENTS.length - 1} key={`${event.date}-${event.time}-${event.title}`} />
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
                  {RECENT_TASKS.map((task) => (
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
