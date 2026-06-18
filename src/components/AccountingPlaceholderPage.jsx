import { useState } from "react";

const dependencySteps = [
  {
    title: "CRM",
    description: "Cần hồ sơ khách hàng, người phụ trách, trạng thái ký hợp đồng và nguồn giới thiệu.",
  },
  {
    title: "Kế toán",
    description: "Cần dữ liệu thu tiền, công nợ, hoàn phí và trạng thái đối soát.",
  },
  {
    title: "Hoa hồng",
    description: "Chỉ tính dự kiến khi hồ sơ CRM khớp với khoản thu đã được kế toán xác nhận.",
  },
];

const MOCK_DEALS = [
  {
    id: "DEAL-2026-001",
    title: "Hợp đồng tư vấn đào tạo nhân sự - Công ty TechVibe",
    customer: {
      name: "Nguyễn Văn Hải",
      phone: "0901 234 567",
      email: "hai.nguyen@techvibe.vn",
      company: "Công ty Cổ phần Công nghệ TechVibe",
      address: "Tòa nhà Viettel, Quận 10, TP. Hồ Chí Minh",
    },
    value: 120000000,
    commissionRate: 10,
    expectedCommission: 12000000,
    status: "reconciled",
    statusLabel: "Đã đối soát",
    statusColor: "bg-success-subtle text-success border-success-subtle",
    owner: "Lê Minh Tuấn (Sales Manager)",
    createdAt: "2026-05-10T08:30:00Z",
    notes: "Đã khớp với tài khoản Vietcombank, chứng từ thanh toán và hóa đơn đầy đủ.",
    timeline: [
      { status: "Tạo deal", time: "10/05/2026 08:30", done: true },
      { status: "Ký hợp đồng", time: "12/05/2026 14:00", done: true },
      { status: "Kế toán xác nhận thu tiền", time: "14/05/2026 09:15", done: true },
      { status: "Đối soát hoàn tất", time: "15/05/2026 10:00", done: true },
    ],
  },
  {
    id: "DEAL-2026-002",
    title: "Gói giải pháp chuyển đổi số doanh nghiệp ERP",
    customer: {
      name: "Trần Thị Kim Oanh",
      phone: "0987 654 321",
      email: "oanh.ttk@greenlogistics.com",
      company: "Công ty TNHH Logistics Xanh",
      address: "Khu công nghiệp Sóng Thần, Dĩ An, Bình Dương",
    },
    value: 350000000,
    commissionRate: 12,
    expectedCommission: 42000000,
    status: "pending_reconcile",
    statusLabel: "Chờ đối soát",
    statusColor: "bg-warning-subtle text-warning border-warning-subtle",
    owner: "Phạm Thanh Thảo (Senior Consultant)",
    createdAt: "2026-06-01T09:00:00Z",
    notes: "Khách đã chuyển khoản 50% cọc. Chờ kế toán xác nhận số dư tài khoản ngân hàng.",
    timeline: [
      { status: "Tạo deal", time: "01/06/2026 09:00", done: true },
      { status: "Ký hợp đồng", time: "03/06/2026 16:30", done: true },
      { status: "Kế toán xác nhận thu tiền", time: "Chờ xác nhận", done: false },
      { status: "Đối soát hoàn tất", time: "", done: false },
    ],
  },
  {
    id: "DEAL-2026-003",
    title: "Tuyển dụng Headhunt vị trí CTO & Marketing Director",
    customer: {
      name: "Hoàng Đức Trung",
      phone: "0912 345 678",
      email: "trung.hd@alphacapital.vn",
      company: "Quỹ đầu tư Alpha Capital",
      address: "Tòa nhà Keangnam, Cầu Giấy, Hà Nội",
    },
    value: 85000000,
    commissionRate: 15,
    expectedCommission: 12750000,
    status: "processing",
    statusLabel: "Đang xử lý",
    statusColor: "bg-info-subtle text-info border-info-subtle",
    owner: "Nguyễn Hoàng Nam (HR Specialist)",
    createdAt: "2026-06-12T14:20:00Z",
    notes: "Đang gửi hồ sơ ứng viên vòng 2. Dự kiến chốt và thu tiền trong tháng 6.",
    timeline: [
      { status: "Tạo deal", time: "12/06/2026 14:20", done: true },
      { status: "Ký hợp đồng", time: "Chờ ký kết", done: false },
      { status: "Kế toán xác nhận thu tiền", time: "", done: false },
      { status: "Đối soát hoàn tất", time: "", done: false },
    ],
  },
  {
    id: "DEAL-2026-004",
    title: "Cung cấp nhân sự IT Outsource (3 Java Devs)",
    customer: {
      name: "David Nguyen",
      phone: "0933 888 999",
      email: "david.nguyen@viasolutions.com.vn",
      company: "Công ty Cổ phần Giải pháp ViaSolutions",
      address: "Tòa nhà Etown, Tân Bình, TP. Hồ Chí Minh",
    },
    value: 180000000,
    commissionRate: 8,
    expectedCommission: 14400000,
    status: "reconciled",
    statusLabel: "Đã đối soát",
    statusColor: "bg-success-subtle text-success border-success-subtle",
    owner: "Lê Minh Tuấn (Sales Manager)",
    createdAt: "2026-05-18T10:15:00Z",
    notes: "Khách hàng thanh toán đúng hạn kỳ 1. Đã đối soát khớp hoàn toàn.",
    timeline: [
      { status: "Tạo deal", time: "18/05/2026 10:15", done: true },
      { status: "Ký hợp đồng", time: "20/05/2026 11:00", done: true },
      { status: "Kế toán xác nhận thu tiền", time: "24/05/2026 14:45", done: true },
      { status: "Đối soát hoàn tất", time: "25/05/2026 15:30", done: true },
    ],
  },
  {
    id: "DEAL-2026-005",
    title: "Tư vấn setup hệ thống bảo mật & Cloud AWS",
    customer: {
      name: "Phùng Hoài Nam",
      phone: "0977 111 222",
      email: "nam.ph@securecyber.com",
      company: "Công ty Cổ phần An ninh mạng SecureCyber",
      address: "Tòa nhà Lotte, Ba Đình, Hà Nội",
    },
    value: 95000000,
    commissionRate: 10,
    expectedCommission: 9500000,
    status: "failed",
    statusLabel: "Hủy bỏ",
    statusColor: "bg-danger-subtle text-danger border-danger-subtle",
    owner: "Phạm Thanh Thảo (Senior Consultant)",
    createdAt: "2026-05-02T09:00:00Z",
    notes: "Khách hàng hủy dự án do thay đổi ngân sách hoạt động năm 2026. Không tiến hành đối soát.",
    timeline: [
      { status: "Tạo deal", time: "02/05/2026 09:00", done: true },
      { status: "Ký hợp đồng", time: "Hủy bỏ", done: false },
      { status: "Kế toán xác nhận thu tiền", time: "", done: false },
      { status: "Đối soát hoàn tất", time: "", done: false },
    ],
  },
];

export function AccountingPlaceholderPage() {
  const [selectedDeal, setSelectedDeal] = useState(null);

  // Calculate stats based on mock data
  const totalExpectedCommission = MOCK_DEALS
    .filter((d) => d.status !== "failed")
    .reduce((sum, d) => sum + d.expectedCommission, 0);

  const totalRecordedRevenue = MOCK_DEALS
    .filter((d) => d.status === "reconciled")
    .reduce((sum, d) => sum + d.value, 0);

  const eligibleDealsCount = MOCK_DEALS.filter((d) => d.status !== "failed").length;
  const reconciledCount = MOCK_DEALS.filter((d) => d.status === "reconciled").length;

  const metrics = [
    { label: "Hoa hồng dự kiến", value: totalExpectedCommission.toLocaleString("vi-VN") + " VND", accent: "#2563eb" },
    { label: "Doanh thu đã ghi nhận", value: totalRecordedRevenue.toLocaleString("vi-VN") + " VND", accent: "#0f766e" },
    { label: "Hồ sơ đủ điều kiện", value: `${eligibleDealsCount} hồ sơ`, accent: "#7c3aed" },
    { label: "Đối soát kế toán", value: `Đã đối soát ${reconciledCount}/${eligibleDealsCount}`, accent: "#b45309" },
  ];

  return (
    <div className="container-fluid pt-3 pb-4" style={{ maxWidth: "1600px" }}>
      <div className="d-flex flex-column flex-xl-row justify-content-between align-items-xl-center gap-3 mb-3">
        <div>
          <div className="text-uppercase fw-semibold text-primary mb-1" style={{ fontSize: "12px", letterSpacing: 0 }}>
            Nghiệp vụ kế toán
          </div>
          <h4 className="fw-bold text-body-emphasis mb-1">Hoa hồng & Đối soát Deal</h4>
        </div>

        <div className="d-flex flex-wrap gap-2">
          <button className="btn btn-sm btn-outline-primary" type="button" onClick={() => alert("Đang đồng bộ dữ liệu với hệ thống CRM...")}>
            Đồng bộ CRM
          </button>
          <button className="btn btn-sm btn-primary" type="button" onClick={() => alert("Đang tải cấu hình thiết lập đối soát...")}>
            Thiết lập kế toán
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="row g-2 g-xl-3 mb-3">
        {metrics.map((metric) => (
          <div className="col-12 col-sm-6 col-xl-3" key={metric.label}>
            <section className="card border-0 h-100" style={{ borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <div className="card-body p-3">
                <div className="d-flex align-items-center justify-content-between gap-3">
                  <div style={{ minWidth: 0 }}>
                    <div className="text-body-secondary mb-1" style={{ fontSize: "12px" }}>
                      {metric.label}
                    </div>
                    <div className="fw-bold text-body-emphasis text-truncate" style={{ fontSize: "18px" }}>
                      {metric.value}
                    </div>
                  </div>
                  <span
                    className="d-inline-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                    style={{ width: "34px", height: "34px", backgroundColor: `${metric.accent}1a`, color: metric.accent }}
                    aria-hidden="true"
                  >
                    <MetricIcon />
                  </span>
                </div>
              </div>
            </section>
          </div>
        ))}
      </div>

      <div className="row g-2 g-xl-3 align-items-stretch">
        {/* Deal List Column */}
        <div className="col-12 col-xl-8">
          <section className="card border-0 h-100" style={{ borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div className="card-header bg-transparent border-bottom py-3 px-3 d-flex justify-content-between align-items-center">
              <h6 className="fw-bold text-body-emphasis mb-0">Danh sách Deal cần đối soát (Dữ liệu mẫu)</h6>
              <span className="badge bg-primary-subtle text-primary px-2 py-1">{MOCK_DEALS.length} Deal</span>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0" style={{ fontSize: "13px" }}>
                  <thead className="table-light">
                    <tr>
                      <th className="ps-3 py-3 text-body-secondary fw-semibold">Mã Deal / Tên dự án</th>
                      <th className="py-3 text-body-secondary fw-semibold">Khách hàng</th>
                      <th className="py-3 text-body-secondary fw-semibold">Giá trị hợp đồng</th>
                      <th className="py-3 text-body-secondary fw-semibold">Hoa hồng dự kiến</th>
                      <th className="py-3 text-body-secondary fw-semibold">Trạng thái</th>
                      <th className="pe-3 py-3 text-body-secondary fw-semibold text-end">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_DEALS.map((deal) => (
                      <tr key={deal.id} style={{ cursor: "pointer" }} onClick={() => setSelectedDeal(deal)}>
                        <td className="ps-3 py-3">
                          <div className="fw-bold text-body-emphasis">{deal.id}</div>
                          <div className="text-body-secondary small text-truncate mt-1" style={{ maxWidth: "200px" }} title={deal.title}>
                            {deal.title}
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="fw-semibold text-body-emphasis">{deal.customer.name}</div>
                          <div className="text-body-secondary small mt-0.5">{deal.customer.company}</div>
                        </td>
                        <td className="py-3 fw-medium text-body-emphasis">
                          {deal.value.toLocaleString("vi-VN")} VND
                        </td>
                        <td className="py-3">
                          <div className="fw-semibold text-success">
                            {deal.expectedCommission.toLocaleString("vi-VN")} VND
                          </div>
                          <div className="small text-body-secondary">({deal.commissionRate}%)</div>
                        </td>
                        <td className="py-3">
                          <span className={`badge border px-2 py-1.5 ${deal.statusColor}`}>
                            {deal.statusLabel}
                          </span>
                        </td>
                        <td className="pe-3 py-3 text-end">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDeal(deal);
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
          </section>
        </div>

        {/* Right Info Column */}
        <div className="col-12 col-xl-4">
          <section className="card border-0 h-100" style={{ borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div className="card-header bg-transparent border-0 p-3 pb-0">
              <h6 className="fw-bold text-body-emphasis mb-0">Điều kiện hiển thị & ghi nhận</h6>
            </div>
            <div className="card-body p-3">
              <div className="d-grid gap-3">
                {dependencySteps.map((step, index) => (
                  <div className="d-flex gap-3" key={step.title}>
                    <span className="d-inline-flex align-items-center justify-content-center rounded-circle bg-primary text-white fw-bold flex-shrink-0" style={{ width: "28px", height: "28px", fontSize: "12px" }}>
                      {index + 1}
                    </span>
                    <div>
                      <div className="fw-semibold text-body-emphasis mb-1" style={{ fontSize: "13px" }}>
                        {step.title}
                      </div>
                      <div className="text-body-secondary" style={{ fontSize: "12px", lineHeight: 1.5 }}>
                        {step.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded bg-warning-subtle text-warning-emphasis p-3 mt-4" style={{ fontSize: "12px", lineHeight: 1.5 }}>
                Bảng trên là dữ liệu demo của quy trình đối soát kế toán. Khi kết nối API thật với CRM và phân hệ Kế toán, dữ liệu sẽ tự động đồng bộ thời gian thực.
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Deal Detail Modal */}
      {selectedDeal && (
        <div className="fixed inset-0 z-[1050] flex items-center justify-center bg-black/50 p-3 backdrop-blur-[2px]">
          <div
            className="flex w-full max-w-[650px] flex-col overflow-hidden rounded-xl bg-[var(--bs-body-bg)] shadow-xl"
            style={{ maxHeight: "calc(100vh - 24px)" }}
          >
            <div className="d-flex flex-shrink-0 justify-content-between align-items-center border-bottom p-4">
              <h5 className="m-0 fw-bold text-body-emphasis d-flex align-items-center gap-2">
                <span>Chi tiết Deal: {selectedDeal.id}</span>
                <span className={`badge border font-normal ${selectedDeal.statusColor}`} style={{ fontSize: "12px" }}>
                  {selectedDeal.statusLabel}
                </span>
              </h5>
              <button className="btn btn-sm btn-light border" type="button" onClick={() => setSelectedDeal(null)}>
                Đóng
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto min-h-0 flex-1">
              {/* Deal General Info */}
              <div className="mb-4">
                <h6 className="fw-bold text-body-emphasis border-bottom pb-2 mb-3">Thông tin Deal</h6>
                <div className="row g-3">
                  <div className="col-12">
                    <span className="text-body-secondary small d-block">Tên Deal / Dự án</span>
                    <span className="fw-semibold text-body-emphasis">{selectedDeal.title}</span>
                  </div>
                  <div className="col-6">
                    <span className="text-body-secondary small d-block">Giá trị hợp đồng</span>
                    <span className="fw-bold text-primary" style={{ fontSize: "16px" }}>
                      {selectedDeal.value.toLocaleString("vi-VN")} VND
                    </span>
                  </div>
                  <div className="col-6">
                    <span className="text-body-secondary small d-block">Hoa hồng dự kiến ({selectedDeal.commissionRate}%)</span>
                    <span className="fw-bold text-success" style={{ fontSize: "16px" }}>
                      {selectedDeal.expectedCommission.toLocaleString("vi-VN")} VND
                    </span>
                  </div>
                  <div className="col-6">
                    <span className="text-body-secondary small d-block">Người phụ trách (Owner)</span>
                    <span className="text-body-emphasis">{selectedDeal.owner}</span>
                  </div>
                  <div className="col-6">
                    <span className="text-body-secondary small d-block">Ngày tạo hồ sơ</span>
                    <span className="text-body-emphasis">{new Date(selectedDeal.createdAt).toLocaleDateString("vi-VN")}</span>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="mb-4">
                <h6 className="fw-bold text-body-emphasis border-bottom pb-2 mb-3">Thông tin khách hàng</h6>
                <div className="row g-3">
                  <div className="col-6">
                    <span className="text-body-secondary small d-block">Họ và tên</span>
                    <span className="fw-semibold text-body-emphasis">{selectedDeal.customer.name}</span>
                  </div>
                  <div className="col-6">
                    <span className="text-body-secondary small d-block">Số điện thoại</span>
                    <span className="text-body-emphasis">{selectedDeal.customer.phone}</span>
                  </div>
                  <div className="col-6">
                    <span className="text-body-secondary small d-block">Email</span>
                    <span className="text-body-emphasis">{selectedDeal.customer.email}</span>
                  </div>
                  <div className="col-6">
                    <span className="text-body-secondary small d-block">Doanh nghiệp</span>
                    <span className="text-body-emphasis">{selectedDeal.customer.company}</span>
                  </div>
                  <div className="col-12">
                    <span className="text-body-secondary small d-block">Địa chỉ trụ sở</span>
                    <span className="text-body-emphasis">{selectedDeal.customer.address}</span>
                  </div>
                </div>
              </div>

              {/* Progress Timeline */}
              <div className="mb-4">
                <h6 className="fw-bold text-body-emphasis border-bottom pb-2 mb-3">Lịch sử trạng thái đối soát</h6>
                <div className="ps-2">
                  {selectedDeal.timeline.map((step, idx) => (
                    <div key={idx} className="d-flex gap-3 position-relative pb-3">
                      {idx !== selectedDeal.timeline.length - 1 && (
                        <div
                          className="position-absolute border-start"
                          style={{
                            left: "9px",
                            top: "20px",
                            bottom: 0,
                            borderColor: step.done ? "#2563eb" : "#e5e7eb",
                          }}
                        ></div>
                      )}
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{
                          width: "20px",
                          height: "20px",
                          backgroundColor: step.done ? "#2563eb" : "#e5e7eb",
                          color: "#fff",
                          fontSize: "10px",
                          zIndex: 1,
                        }}
                      >
                        {step.done ? "✓" : ""}
                      </div>
                      <div>
                        <div className={`fw-semibold ${step.done ? "text-body-emphasis" : "text-body-secondary"}`} style={{ fontSize: "13px" }}>
                          {step.status}
                        </div>
                        {step.time && (
                          <div className="text-body-secondary small" style={{ fontSize: "11px" }}>
                            {step.time}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Remarks/Notes */}
              {selectedDeal.notes && (
                <div className="bg-body-secondary/30 border rounded p-3">
                  <div className="fw-semibold small text-body-emphasis mb-1">Ghi chú đối soát:</div>
                  <p className="text-body-secondary mb-0 small" style={{ lineHeight: 1.5 }}>
                    {selectedDeal.notes}
                  </p>
                </div>
              )}
            </div>
            <div className="d-flex flex-shrink-0 justify-content-end gap-2 border-top p-4">
              <button type="button" className="btn btn-primary" onClick={() => setSelectedDeal(null)}>
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1v22"></path>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6"></path>
    </svg>
  );
}
