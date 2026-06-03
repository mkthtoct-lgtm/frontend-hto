const HOME_STATS = [
  { value: "10+", label: "năm đồng hành" },
  { value: "5", label: "nhóm dịch vụ" },
  { value: "1:1", label: "tư vấn hồ sơ" },
  { value: "360", label: "hỗ trợ trọn gói" },
];

const HOME_SERVICES = [
  {
    title: "Du học và du học nghề",
    text: "Định hướng ngành, lộ trình tiếng Đức, hồ sơ trường và theo dõi sau nhập cảnh.",
    tone: "bg-primary-subtle text-primary",
  },
  {
    title: "Visa và hồ sơ quốc tế",
    text: "Rà soát checklist, đặt lịch, hoàn thiện biểu mẫu và theo dõi kết quả visa.",
    tone: "bg-success-subtle text-success",
  },
  {
    title: "Đào tạo ngôn ngữ",
    text: "Lớp tiếng Đức theo mục tiêu A1 đến B2, kèm phỏng vấn và thi thử định kỳ.",
    tone: "bg-warning-subtle text-warning",
  },
  {
    title: "Định cư và nghề nghiệp",
    text: "Tư vấn lộ trình làm việc, chuyển đổi bằng cấp và ổn định cuộc sống tại nước ngoài.",
    tone: "bg-info-subtle text-info",
  },
];

const HOME_EVENTS = [
  {
    date: "15/06/2026",
    title: "Workshop lộ trình du học nghề Đức",
    text: "Cập nhật ngành nghề, điều kiện tiếng Đức và những bước cần chuẩn bị từ sớm.",
    status: "Sắp diễn ra",
  },
  {
    date: "22/06/2026",
    title: "Ngày hội kiểm tra hồ sơ visa",
    text: "Tư vấn trực tiếp cùng đội ngũ hồ sơ để giảm sai sót trước khi nộp lãnh sự.",
    status: "Đang mở đăng ký",
  },
  {
    date: "30/06/2026",
    title: "Khai giảng lớp tiếng Đức nền tảng",
    text: "Dành cho học viên mới bắt đầu, có test đầu vào và kế hoạch học cá nhân.",
    status: "Nhận lịch học",
  },
];

const HOME_GALLERY = [
  {
    title: "Du học Đức",
    image: "/assets/images/banner-web-korean.jpg",
  },
  {
    title: "Hỗ trợ hồ sơ",
    image: "/assets/images/banner-second.jpg",
  },
  {
    title: "Đào tạo ngôn ngữ",
    image: "/assets/images/hito_3.png",
  },
  {
    title: "Tư vấn lộ trình",
    image: "/assets/images/hito_4.png",
  },
];

const FALLBACK_HOME_IMAGE = "/assets/images/banner-second.jpg";

const handleImageFallback = (event) => {
  if (event.currentTarget.src.endsWith(FALLBACK_HOME_IMAGE)) return;
  event.currentTarget.src = FALLBACK_HOME_IMAGE;
};

export const HomePage = ({ theme }) => {
  return (
    <div className="container-fluid pt-3 pb-1" style={{ maxWidth: "1600px" }}>
      <div className="row mb-3 gx-2 gx-xl-3 align-items-stretch">
        <div className="col-12 col-md-8 col-lg-8 col-xl-8 mb-3 mb-md-0">
          <div className="card border-0 bg-transparent h-100">
            <img src="/assets/images/banner-web-korean.jpg" alt="Banner chương trình HTO" className="img-fluid w-100 h-100 bg-primary-subtle" style={{ borderRadius: "12px", objectFit: "cover", minHeight: "180px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }} onError={handleImageFallback} />
          </div>
        </div>
        <div className="col-12 col-md-4 col-lg-4 col-xl-4">
          <div className="card border-0 bg-transparent h-100">
            <img src="/assets/images/banner-second.jpg" alt="Banner hỗ trợ HTO" className="img-fluid w-100 h-100 bg-body" style={{ borderRadius: "12px", objectFit: "cover", minHeight: "180px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }} onError={handleImageFallback} />
          </div>
        </div>
      </div>

      <div className="row mb-3 gx-2 gx-xl-3 align-items-stretch">
        <div className="col-12 col-md-4 col-lg-4 col-xl-4 mb-3 mb-md-0">
          <div className="card border-0 h-100" style={{ borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", minHeight: "260px" }}>
            <div className="card-body p-3 d-flex flex-column">
              <h6 className="fw-bold d-flex align-items-center mb-2 text-body-emphasis" style={{ fontSize: "14px" }}>
                <img src="/assets/images/logo-HTO.png" alt="HTO" className="bg-body-secondary rounded me-2" style={{ width: "24px", height: "24px", objectFit: "contain" }} onError={handleImageFallback} />
                GIỚI THIỆU CÔNG TY
              </h6>
              <p className="text-body-secondary mb-3" style={{ fontSize: "13px", lineHeight: 1.45 }}>
                HT Ocean Group đồng hành cùng học viên, phụ huynh và đối tác trong các chương trình du học, đào tạo ngôn ngữ, visa, định cư và hồ sơ quốc tế.
              </p>
              <div className="d-grid gap-2 mt-auto" style={{ gridTemplateColumns: "1fr 1fr" }}>
                {HOME_STATS.map((stat) => (
                  <div className="rounded p-2 bg-body-secondary overflow-hidden text-center" key={stat.label}>
                    <div className="fw-bold text-body-emphasis text-truncate" style={{ fontSize: "15px" }}>{stat.value}</div>
                    <div className="text-body-secondary" style={{ fontSize: "11px", lineHeight: 1.2 }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-8 col-lg-8 col-xl-8">
          <div className="card border-0 h-100" style={{ borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", minHeight: "260px" }}>
            <div className="card-body p-3">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold d-flex align-items-center mb-0 text-body-emphasis" style={{ fontSize: "14px" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" className="text-primary me-2" fill="currentColor"><path d="M4 4h16v4H4V4Zm0 6h7v10H4V10Zm9 0h7v10h-7V10Z" /></svg>
                  DỊCH VỤ & CHƯƠNG TRÌNH
                </h6>
                <span className="text-body-secondary d-none d-md-inline" style={{ fontSize: "11px" }}>Cập nhật: 03/06/2026</span>
              </div>
              <div className="row g-2">
                {HOME_SERVICES.map((service) => (
                  <div className="col-12 col-md-6" key={service.title}>
                    <div className="rounded border bg-body-tertiary p-3 h-100">
                      <div className={`d-inline-flex align-items-center justify-content-center rounded-circle mb-2 ${service.tone}`} style={{ width: "34px", height: "34px" }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2 3 6v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V6l-9-4Zm-1 14-4-4 1.41-1.41L11 13.17l5.59-5.59L18 9l-7 7Z" /></svg>
                      </div>
                      <h6 className="fw-bold text-body-emphasis mb-1" style={{ fontSize: "13px" }}>{service.title}</h6>
                      <p className="text-body-secondary mb-0" style={{ fontSize: "12px", lineHeight: 1.4 }}>{service.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row mb-3 gx-2 gx-xl-3 align-items-stretch">
        {HOME_GALLERY.map((item) => (
          <div className="col-12 col-sm-6 col-xl-3 mb-3 mb-xl-0" key={item.title}>
            <div className="card border-0 h-100 overflow-hidden" style={{ borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <div className="position-relative">
                <img src={item.image} alt={item.title} className="w-100 bg-body-tertiary" style={{ height: "150px", objectFit: "cover" }} onError={handleImageFallback} />
                <div className="position-absolute bottom-0 start-0 w-100 p-2 text-white fw-bold" style={{ background: "linear-gradient(180deg, transparent, rgba(0,0,0,0.68))", fontSize: "13px" }}>
                  {item.title}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="row mb-3 gx-2 gx-xl-3 align-items-stretch">
        <div className="col-12 col-md-6 col-lg-6 col-xl-6 mb-3 mb-md-0">
          <div className="card border-0 h-100" style={{ borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", minHeight: "300px" }}>
            <div className="card-header bg-transparent border-0 p-3 pb-0">
              <h6 className="fw-bold d-flex align-items-center mb-0 text-body-emphasis" style={{ fontSize: "14px" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" className="text-primary me-2" fill="currentColor"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2Zm0 16H5V8h14v11Z" /></svg>
                THÔNG BÁO SỰ KIỆN
              </h6>
            </div>
            <div className="card-body p-3 d-flex flex-column gap-2">
              {HOME_EVENTS.map((event, index) => (
                <div className="d-flex align-items-start gap-3 rounded border bg-body-tertiary p-2" key={event.title}>
                  <div className="rounded text-white text-center flex-shrink-0 bg-primary" style={{ width: "70px", padding: "6px 4px" }}>
                    <div className="fw-bold" style={{ fontSize: "12px" }}>{event.date.slice(0, 5)}</div>
                    <div style={{ fontSize: "10px", opacity: 0.85 }}>{event.date.slice(6)}</div>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <span className="fw-bold text-body-emphasis text-truncate" style={{ fontSize: "13px" }}>{event.title}</span>
                      <span className={`badge flex-shrink-0 ${index === 0 ? "bg-warning-subtle text-warning" : "bg-success-subtle text-success"}`} style={{ fontSize: "10px" }}>{event.status}</span>
                    </div>
                    <p className="text-body-secondary mb-0" style={{ fontSize: "12px", lineHeight: 1.35 }}>{event.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6 col-lg-6 col-xl-6">
          <div className="card border-0 h-100" style={{ borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", minHeight: "300px" }}>
            <div className="card-body p-3 d-flex flex-column overflow-hidden">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold d-flex align-items-center mb-0 text-body-emphasis" style={{ fontSize: "14px" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" className="text-primary me-2" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14l4-4h12c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2Z" /></svg>
                  QUY TRÌNH ĐỒNG HÀNH
                </h6>
                <span className="text-body-secondary d-none d-md-inline" style={{ fontSize: "11px" }}>Tư vấn đến chăm sóc sau dịch vụ</span>
              </div>
              <div className="d-flex justify-content-between align-items-start mt-auto mb-auto overflow-x-auto pb-2" style={{ minWidth: "100%" }}>
                <div className="d-flex justify-content-between w-100" style={{ minWidth: "460px" }}>
                  {["Tiếp nhận", "Tư vấn", "Lập lộ trình", "Xử lý hồ sơ", "Theo dõi", "Hỗ trợ sau dịch vụ"].map((step, index) => (
                    <div className="d-flex flex-column align-items-center position-relative" style={{ flex: 1 }} key={step}>
                      {index < 5 && (
                        <div className="position-absolute" style={{ top: "13px", left: "50%", width: "100%", height: "2px", backgroundColor: theme === "dark" ? "#ffffff" : "#1e40af", zIndex: 0 }} />
                      )}
                      <div className="rounded-circle d-flex align-items-center justify-content-center mb-2 position-relative shadow-sm" style={{ backgroundColor: theme === "dark" ? "#ffffff" : "#1e40af", color: theme === "dark" ? "#1e40af" : "#ffffff", width: "26px", height: "26px", fontSize: "12px", fontWeight: "bold", zIndex: 1 }}>
                        {index + 1}
                      </div>
                      <div className="fw-bold text-center text-body-emphasis mt-1 text-wrap" style={{ fontSize: "12.5px", lineHeight: 1.2 }}>{step}</div>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-body-secondary mb-0 mt-3" style={{ fontSize: "12px", lineHeight: 1.45 }}>
                Mỗi chương trình đều được theo dõi bằng checklist riêng để các bộ phận nắm rõ trạng thái, hạn chế thiếu sót và cập nhật kịp thời cho học viên.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
