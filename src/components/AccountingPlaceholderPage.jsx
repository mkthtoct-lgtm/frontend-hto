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

const placeholderMetrics = [
  { label: "Hoa hồng dự kiến", value: "Chờ dữ liệu", accent: "#2563eb" },
  { label: "Doanh thu đã ghi nhận", value: "Chưa có số liệu", accent: "#0f766e" },
  { label: "Hồ sơ đủ điều kiện", value: "0 hồ sơ", accent: "#7c3aed" },
  { label: "Đối soát kế toán", value: "Chưa kết nối", accent: "#b45309" },
];

export function AccountingPlaceholderPage() {
  return (
    <div className="container-fluid pt-3 pb-4" style={{ maxWidth: "1600px" }}>
      <div className="d-flex flex-column flex-xl-row justify-content-between align-items-xl-center gap-3 mb-3">
        <div>
          <div className="text-uppercase fw-semibold text-primary mb-1" style={{ fontSize: "12px", letterSpacing: 0 }}>
            Nghiệp vụ kế toán
          </div>
          <h4 className="fw-bold text-body-emphasis mb-1">Hoa hồng dự kiến</h4>
          
        </div>

        <div className="d-flex flex-wrap gap-2">
          <button id="nghiepvu-sync-crm-btn" className="btn btn-sm btn-outline-secondary" type="button" disabled>
            Đồng bộ CRM
          </button>
          <button className="btn btn-sm btn-primary" type="button" disabled>
            Thiết lập kế toán
          </button>
        </div>
      </div>

      <div id="nghiepvu-metrics-grid" className="row g-2 g-xl-3 mb-3">
        {placeholderMetrics.map((metric) => (
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
                    className="d-inline-flex align-items-center justify-content-center rounded-circle shrink-0"
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
        <div className="col-12 col-xl-8">
          <section id="nghiepvu-empty-state" className="card border-0 h-100" style={{ borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", minHeight: "360px" }}>
            <div className="card-body p-4 d-flex flex-column align-items-center justify-content-center text-center">
              <div className="d-inline-flex align-items-center justify-content-center rounded-circle bg-primary-subtle text-primary mb-3" style={{ width: "72px", height: "72px" }}>
                <EmptyStateIcon />
              </div>
              <h5 className="fw-bold text-body-emphasis mb-2">Chưa có dữ liệu kế toán</h5>
              <p className="text-body-secondary mb-3" style={{ maxWidth: "560px", fontSize: "13px", lineHeight: 1.6 }}>
                Hoa hồng dự kiến chưa thể hiển thị vì hệ thống chưa nhận được khoản thu đã đối soát từ kế toán. Khi CRM có hồ sơ hợp lệ và kế toán xác nhận thanh toán, bảng hoa hồng sẽ tự động thay thế trạng thái trống này.
              </p>
              <div className="d-flex flex-wrap justify-content-center gap-2">
                <span className="badge bg-body-secondary text-body px-3 py-2">Thiếu khoản thu đã xác nhận</span>
                <span className="badge bg-body-secondary text-body px-3 py-2">Thiếu mapping nhân sự CRM</span>
                <span className="badge bg-body-secondary text-body px-3 py-2">Chưa có kỳ đối soát</span>
              </div>
            </div>
          </section>
        </div>

        <div className="col-12 col-xl-4">
          <section id="nghiepvu-conditions-card" className="card border-0 h-100" style={{ borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div className="card-header bg-transparent border-0 p-3 pb-0">
              <h6 className="fw-bold text-body-emphasis mb-0">Điều kiện hiển thị</h6>
            </div>
            <div className="card-body p-3">
              <div className="d-grid gap-3">
                {dependencySteps.map((step, index) => (
                  <div className="d-flex gap-3" key={step.title}>
                    <span className="d-inline-flex align-items-center justify-content-center rounded-circle bg-primary text-white fw-bold shrink-0" style={{ width: "28px", height: "28px", fontSize: "12px" }}>
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
                Số “Hoa hồng dự kiến” chỉ là placeholder cho đến khi có dữ liệu thật từ CRM và kế toán. Không dùng trạng thái này để chốt chi trả.
              </div>
            </div>
          </section>
        </div>
      </div>
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

function EmptyStateIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16v16H4z"></path>
      <path d="M8 9h8"></path>
      <path d="M8 13h5"></path>
      <path d="M8 17h3"></path>
      <path d="M16 15l2 2 3-4"></path>
    </svg>
  );
}
