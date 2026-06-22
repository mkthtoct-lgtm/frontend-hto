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
      { status: "Xác nhận thu tiền", time: "14/05/2026 09:15", done: true },
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
      { status: "Xác nhận thu tiền", time: "Chờ xác nhận", done: false },
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
      { status: "Xác nhận thu tiền", time: "", done: false },
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
      { status: "Xác nhận thu tiền", time: "24/05/2026 14:45", done: true },
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
      { status: "Xác nhận thu tiền", time: "", done: false },
      { status: "Đối soát hoàn tất", time: "", done: false },
    ],
  },
];

export function AccountingPlaceholderPage() {
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [dealPage, setDealPage] = useState(1);

  const DEAL_PAGE_SIZE = 20;

  // Calculate stats based on mock data
  const totalExpectedCommission = MOCK_DEALS
    .filter((d) => d.status !== "failed")
    .reduce((sum, d) => sum + d.expectedCommission, 0);

  const totalRecordedRevenue = MOCK_DEALS
    .filter((d) => d.status === "reconciled")
    .reduce((sum, d) => sum + d.value, 0);

  const eligibleDealsCount = MOCK_DEALS.filter((d) => d.status !== "failed").length;
  const reconciledCount = MOCK_DEALS.filter((d) => d.status === "reconciled").length;

  const dealPageCount = Math.max(
    1,
    Math.ceil(MOCK_DEALS.length / DEAL_PAGE_SIZE),
  );
  const safeDealPage = Math.min(dealPage, dealPageCount);
  const paginatedDeals = MOCK_DEALS.slice(
    (safeDealPage - 1) * DEAL_PAGE_SIZE,
    safeDealPage * DEAL_PAGE_SIZE,
  );

  const metrics = [
    { label: "Hoa hồng dự kiến", value: totalExpectedCommission.toLocaleString("vi-VN") + " VND", accent: "#4F86F7" },
    { label: "Doanh thu đã ghi nhận", value: totalRecordedRevenue.toLocaleString("vi-VN") + " VND", accent: "#50B8B0" },
    { label: "Hồ sơ đủ điều kiện", value: `${eligibleDealsCount} hồ sơ`, accent: "#A162F7" },
    { label: "Đối soát kế toán", value: `Đã đối soát ${reconciledCount}/${eligibleDealsCount}`, accent: "#F79F57" },
  ];

  return (
    <div className="container-fluid pt-3 pb-4" style={{ maxWidth: "1600px" }}>
      <div className="d-flex flex-column flex-xl-row justify-content-between align-items-xl-center gap-3 mb-3">
        <div>

          <h4 className="fw-bold text-body-emphasis mb-1">Đối soát & Quản lý Deal</h4>
        </div>

        <div className="d-flex flex-wrap gap-2">
          <button className="btn btn-sm btn-outline-primary d-inline-flex align-items-center" type="button" onClick={() => alert("Đang đồng bộ dữ liệu với hệ thống CRM...")}>
            <RefreshCwIcon />
            Đồng bộ CRM
          </button>
          <button className="btn btn-sm btn-primary d-inline-flex align-items-center" type="button" onClick={() => alert("Đang tải cấu hình thiết lập đối soát...")}>
            <SettingsIcon />
            Thiết lập kế toán
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="row g-2 g-xl-3 mb-3">
        {metrics.map((metric) => (
          <div className="col-12 col-sm-6 col-xl-3" key={metric.label}>
            <section className="card border-0 h-100" style={{ borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", backgroundColor: `${metric.accent}15` }}>
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
                    className="d-inline-flex align-items-center justify-content-center rounded-circle flex-shrink-0 bg-white"
                    style={{ width: "34px", height: "34px", color: metric.accent, boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}
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
                      <th className="ps-3 py-3 text-body-secondary fw-semibold text-nowrap" style={{ width: "160px" }}>Mã Deal / Dự án</th>
                      <th className="py-3 text-body-secondary fw-semibold text-nowrap" style={{ width: "140px" }}>Khách hàng</th>
                      <th className="py-3 text-body-secondary fw-semibold text-nowrap">Giá trị hợp đồng</th>
                      <th className="py-3 text-body-secondary fw-semibold text-nowrap">Hoa hồng dự kiến</th>
                      <th className="py-3 text-body-secondary fw-semibold text-nowrap">Trạng thái</th>
                      <th className="pe-3 py-3 text-body-secondary fw-semibold text-end text-nowrap">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedDeals.map((deal) => (
                      <tr key={deal.id} style={{ cursor: "pointer" }} onClick={() => setSelectedDeal(deal)}>
                        <td className="ps-3 py-3 text-nowrap" style={{ maxWidth: "160px" }}>
                          <div className="fw-bold text-body-emphasis">{deal.id}</div>
                          <div className="text-body-secondary small text-truncate mt-1" style={{ maxWidth: "140px" }} title={deal.title}>
                            {deal.title}
                          </div>
                        </td>
                        <td className="py-3 text-nowrap" style={{ maxWidth: "140px" }}>
                          <div className="fw-semibold text-body-emphasis">{deal.customer.name}</div>
                          <div className="text-body-secondary small mt-0.5 text-truncate" style={{ maxWidth: "120px" }} title={deal.customer.company}>
                            {deal.customer.company}
                          </div>
                        </td>
                        <td className="py-3 fw-medium text-body-emphasis text-nowrap">
                          {deal.value.toLocaleString("vi-VN")} VND
                        </td>
                        <td className="py-3 text-nowrap">
                          <div className="fw-semibold text-success">
                            {deal.expectedCommission.toLocaleString("vi-VN")} VND
                          </div>
                          <div className="small text-body-secondary">({deal.commissionRate}%)</div>
                        </td>
                        <td className="py-3 text-nowrap">
                          <span className={`badge border px-2 py-1.5 ${deal.statusColor}`}>
                            {deal.statusLabel}
                          </span>
                        </td>
                        <td className="pe-3 py-3 text-end">
                          <button
                            className="btn btn-sm btn-outline-primary d-inline-flex align-items-center justify-content-center"
                            style={{ width: "32px", height: "32px", padding: 0 }}
                            type="button"
                            title="Xem chi tiết Deal"
                            aria-label="Xem chi tiết Deal"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDeal(deal);
                            }}
                          >
                            <EyeIcon />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {MOCK_DEALS.length > DEAL_PAGE_SIZE && (
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 p-3 border-top">
                  <span className="text-body-secondary" style={{ fontSize: "13px" }}>
                    Hiển thị {(safeDealPage - 1) * DEAL_PAGE_SIZE + 1}-
                    {Math.min(safeDealPage * DEAL_PAGE_SIZE, MOCK_DEALS.length)} trong{" "}
                    {MOCK_DEALS.length} Deal
                  </span>
                  <div className="btn-group gap-2" role="group" aria-label="Phân trang Deal">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => setDealPage((page) => Math.max(1, page - 1))}
                      disabled={safeDealPage === 1}
                    >
                      Trước
                    </button>
                    {Array.from({ length: dealPageCount }, (_, index) => index + 1).map(
                      (page) => (
                        <button
                          key={page}
                          type="button"
                          className={`btn btn-sm ${page === safeDealPage ? "btn-primary" : "btn-outline-secondary"}`}
                          onClick={() => setDealPage(page)}
                        >
                          {page}
                        </button>
                      ),
                    )}
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() =>
                        setDealPage((page) => Math.min(dealPageCount, page + 1))
                      }
                      disabled={safeDealPage === dealPageCount}
                    >
                      Sau
                    </button>
                  </div>
                </div>
              )}
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
                <h6 className="fw-bold text-body-emphasis border-bottom pb-2 mb-4">Lịch sử trạng thái đối soát</h6>
                <div className="overflow-x-auto py-2">
                  <div className="position-relative" style={{ minWidth: "450px" }}>
                    {/* Background Line */}
                    <div
                      className="position-absolute"
                      style={{
                        top: "12px",
                        left: `${100 / selectedDeal.timeline.length / 2}%`,
                        right: `${100 / selectedDeal.timeline.length / 2}%`,
                        height: "2px",
                        backgroundColor: "#e2e8f0",
                        zIndex: 0,
                      }}
                    ></div>
                    <div className="d-flex justify-content-between align-items-start position-relative w-100" style={{ zIndex: 1 }}>
                      {selectedDeal.timeline.map((step, idx) => (
                        <div key={idx} className="d-flex flex-column align-items-center text-center flex-fill" style={{ width: `${100 / selectedDeal.timeline.length}%` }}>
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center mb-2"
                            style={{
                              width: "24px",
                              height: "24px",
                              backgroundColor: step.done ? "#2563eb" : "#cbd5e1",
                              color: "#fff",
                              fontSize: "11px",
                              fontWeight: "bold",
                              border: "2px solid var(--bs-body-bg)",
                              boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
                            }}
                          >
                            {step.done ? "✓" : idx + 1}
                          </div>
                          <div className={`fw-semibold px-2 ${step.done ? "text-body-emphasis" : "text-body-secondary"}`} style={{ fontSize: "12px", lineHeight: 1.3 }}>
                            {step.status}
                          </div>
                          {step.time && (
                            <div className="text-body-secondary small mt-1 px-1" style={{ fontSize: "10px", minHeight: "15px" }}>
                              {step.time}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
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

function EyeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  );
}

function RefreshCwIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-1">
      <polyline points="23 4 23 10 17 10"></polyline>
      <polyline points="1 20 1 14 7 14"></polyline>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-1">
      <circle cx="12" cy="12" r="3"></circle>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
    </svg>
  );
}