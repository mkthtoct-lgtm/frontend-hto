import { useMemo, useState } from "react";
import "./LeadFormPage.css";

const API_BASE_URL = "http://localhost:3000/api/v1";

const INITIAL_FORM = {
  customerName: "",
  phone: "",
  email: "",
  source: "Website",
  productInterest: "Du học Đức",
  countryInterest: "Đức",
  budgetRange: "",
  urgency: "Trong 1-3 tháng",
  preferredContact: "Zalo/Điện thoại",
  note: ""
};

const SOURCE_OPTIONS = ["Website", "Facebook", "TikTok", "Google Ads", "Referral", "Offline event", "Khác"];
const PRODUCT_OPTIONS = ["Du học Đức", "Visa", "Định cư", "Đào tạo ngôn ngữ", "Nộp hồ sơ online", "Tư vấn tổng hợp"];
const COUNTRY_OPTIONS = ["Đức", "Úc", "Canada", "Mỹ", "Nhật Bản", "Hàn Quốc", "Khác"];
const URGENCY_OPTIONS = ["Ngay lập tức", "Trong 1-3 tháng", "Trong 3-6 tháng", "Sau 6 tháng", "Chưa xác định"];
const CONTACT_OPTIONS = ["Zalo/Điện thoại", "Email", "Messenger", "Gặp trực tiếp", "Khác"];

const validateForm = (form) => {
  const errors = {};

  if (!form.customerName.trim()) {
    errors.customerName = "Vui lòng nhập họ tên khách hàng.";
  }

  if (!form.phone.trim()) {
    errors.phone = "Vui lòng nhập số điện thoại.";
  } else if (!/^[0-9+\-\s]{8,18}$/.test(form.phone.trim())) {
    errors.phone = "Số điện thoại chưa đúng định dạng.";
  }

  if (form.email.trim() && !/\S+@\S+\.\S+/.test(form.email.trim())) {
    errors.email = "Email chưa đúng định dạng.";
  }

  if (!form.productInterest.trim()) {
    errors.productInterest = "Vui lòng chọn dịch vụ quan tâm.";
  }

  return errors;
};

export const LeadFormPage = () => {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);

  const completionPercent = useMemo(() => {
    const fields = [
      form.customerName,
      form.phone,
      form.email,
      form.source,
      form.productInterest,
      form.countryInterest,
      form.urgency,
      form.preferredContact
    ];

    const filled = fields.filter((value) => String(value || "").trim()).length;
    return Math.round((filled / fields.length) * 100);
  }, [form]);

  const handleChange = (fieldName, value) => {
    setForm((current) => ({
      ...current,
      [fieldName]: value
    }));

    setErrors((current) => ({
      ...current,
      [fieldName]: ""
    }));

    setSubmitResult(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = validateForm(form);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    setSubmitResult(null);

    const payload = {
      customerName: form.customerName.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      source: form.source,
      productInterest: form.productInterest,
      countryInterest: form.countryInterest,
      budgetRange: form.budgetRange.trim(),
      urgency: form.urgency,
      preferredContact: form.preferredContact,
      note: form.note.trim(),
      status: "new",
      createdAt: new Date().toISOString()
    };

    try {
      const response = await fetch(`${API_BASE_URL}/leads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("API lead chưa sẵn sàng. Hệ thống sẽ mô phỏng gửi thành công để test UI.");
      }

      const data = await response.json();

      setSubmitResult({
        type: "success",
        mode: "real",
        leadCode: data?.data?.code || data?.code || `LEAD-${Date.now()}`,
        message: "Lead đã được gửi thành công vào CRM."
      });

      setForm(INITIAL_FORM);
    } catch (err) {
      setSubmitResult({
        type: "success",
        mode: "mock",
        leadCode: `MOCK-LEAD-${Date.now().toString().slice(-6)}`,
        message: "Đã mô phỏng gửi lead thành công. Khi có API thật, thay endpoint POST /leads là dùng được."
      });

      setForm(INITIAL_FORM);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="lead-form-page container-fluid pt-3 pb-4" style={{ maxWidth: "1280px" }}>
      <div className="lead-form-hero mb-4">
        <div>
          <span className="lead-form-eyebrow">External lead intake</span>
          <h4 className="fw-bold text-body-emphasis mb-1">Form gửi lead khách hàng</h4>
          <p className="text-body-secondary mb-0">
            Form CRM tạm để external user hoặc nhân sự nhập thông tin khách hàng tiềm năng trước khi đồng bộ vào hệ thống thật.
          </p>
        </div>

        <div className="lead-completion-card">
          <span>Mức độ hoàn thiện</span>
          <strong>{completionPercent}%</strong>
          <div className="progress lead-progress">
            <div className="progress-bar" style={{ width: `${completionPercent}%` }}></div>
          </div>
        </div>
      </div>

      {submitResult && (
        <div className={`lead-result-alert ${submitResult.type === "success" ? "success" : "danger"} mb-4`}>
          <div>
            <strong>{submitResult.message}</strong>
            <div className="small">
              Mã lead: {submitResult.leadCode} · {submitResult.mode === "real" ? "API thật" : "Dữ liệu giả"}
            </div>
          </div>
        </div>
      )}

      <div className="row g-3 align-items-start">
        <div className="col-12 col-xl-8">
          <form className="lead-form-card" onSubmit={handleSubmit}>
            <div className="lead-form-section">
              <h6>Thông tin khách hàng</h6>

              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <label className="form-label">Họ và tên khách hàng <span className="text-danger">*</span></label>
                  <input
                    className={`form-control ${errors.customerName ? "is-invalid" : ""}`}
                    value={form.customerName}
                    onChange={(event) => handleChange("customerName", event.target.value)}
                    placeholder="Ví dụ: Nguyễn Văn A"
                  />
                  {errors.customerName && <div className="invalid-feedback">{errors.customerName}</div>}
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label">Số điện thoại <span className="text-danger">*</span></label>
                  <input
                    className={`form-control ${errors.phone ? "is-invalid" : ""}`}
                    value={form.phone}
                    onChange={(event) => handleChange("phone", event.target.value)}
                    placeholder="Ví dụ: 0987654321"
                  />
                  {errors.phone && <div className="invalid-feedback">{errors.phone}</div>}
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label">Email</label>
                  <input
                    className={`form-control ${errors.email ? "is-invalid" : ""}`}
                    value={form.email}
                    onChange={(event) => handleChange("email", event.target.value)}
                    placeholder="customer@email.com"
                  />
                  {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label">Nguồn lead</label>
                  <select className="form-select" value={form.source} onChange={(event) => handleChange("source", event.target.value)}>
                    {SOURCE_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="lead-form-section">
              <h6>Nhu cầu tư vấn</h6>

              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <label className="form-label">Dịch vụ quan tâm <span className="text-danger">*</span></label>
                  <select
                    className={`form-select ${errors.productInterest ? "is-invalid" : ""}`}
                    value={form.productInterest}
                    onChange={(event) => handleChange("productInterest", event.target.value)}
                  >
                    {PRODUCT_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                  {errors.productInterest && <div className="invalid-feedback">{errors.productInterest}</div>}
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label">Quốc gia quan tâm</label>
                  <select className="form-select" value={form.countryInterest} onChange={(event) => handleChange("countryInterest", event.target.value)}>
                    {COUNTRY_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label">Ngân sách dự kiến</label>
                  <input
                    className="form-control"
                    value={form.budgetRange}
                    onChange={(event) => handleChange("budgetRange", event.target.value)}
                    placeholder="Ví dụ: 200-300 triệu"
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label">Thời gian dự kiến triển khai</label>
                  <select className="form-select" value={form.urgency} onChange={(event) => handleChange("urgency", event.target.value)}>
                    {URGENCY_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label">Kênh liên hệ ưu tiên</label>
                  <select className="form-select" value={form.preferredContact} onChange={(event) => handleChange("preferredContact", event.target.value)}>
                    {CONTACT_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </div>

                <div className="col-12">
                  <label className="form-label">Ghi chú thêm</label>
                  <textarea
                    className="form-control"
                    rows="4"
                    value={form.note}
                    onChange={(event) => handleChange("note", event.target.value)}
                    placeholder="Nhập nhu cầu, tình trạng hồ sơ, thời gian có thể liên hệ..."
                  ></textarea>
                </div>
              </div>
            </div>

            <div className="lead-form-footer">
              <button
                type="button"
                className="btn btn-light border"
                disabled={submitting}
                onClick={() => {
                  setForm(INITIAL_FORM);
                  setErrors({});
                  setSubmitResult(null);
                }}
              >
                Làm mới
              </button>

              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? "Đang gửi..." : "Gửi lead"}
              </button>
            </div>
          </form>
        </div>

        <div className="col-12 col-xl-4">
          <div className="lead-guide-panel">
            <span className="lead-form-eyebrow">CRM temporary fields</span>
            <h5 className="fw-bold text-body-emphasis mb-3">Field CRM tạm đang gửi</h5>

            <div className="lead-field-list">
              <div><span>customerName</span><strong>Họ tên khách hàng</strong></div>
              <div><span>phone</span><strong>Số điện thoại</strong></div>
              <div><span>email</span><strong>Email</strong></div>
              <div><span>source</span><strong>Nguồn lead</strong></div>
              <div><span>productInterest</span><strong>Dịch vụ quan tâm</strong></div>
              <div><span>countryInterest</span><strong>Quốc gia quan tâm</strong></div>
              <div><span>budgetRange</span><strong>Ngân sách dự kiến</strong></div>
              <div><span>urgency</span><strong>Thời gian triển khai</strong></div>
              <div><span>preferredContact</span><strong>Kênh liên hệ</strong></div>
              <div><span>note</span><strong>Ghi chú</strong></div>
            </div>

            <div className="lead-api-note mt-4">
              <strong>API thật sau này:</strong>
              <code>POST /api/v1/leads</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
