import { useMemo, useState } from "react";
import { getAuthHeaders } from "../auth/session";
import { TailwindDropdown } from "../components/ui/TailwindDropdown";
import { API_BASE_URL } from "../config/api";
import "./LeadFormPage.css";

const LEAD_REQUEST_TIMEOUT_MS = 15000;

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

const normalizePhone = (value) => value.trim().replace(/[\s.-]/g, "");

const buildLeadPayload = (form) => {
  return {
    customerName: form.customerName.trim(),
    phone: normalizePhone(form.phone),
    source: form.source || "Website",
    productInterest: form.productInterest || "Du học Đức",
    countryInterest: form.countryInterest || "Đức",
    email: form.email.trim(),
    budgetRange: form.budgetRange.trim(),
    urgency: form.urgency || "Trong 1-3 tháng",
    preferredContact: form.preferredContact || "Zalo/Điện thoại",
    note: form.note.trim()
  };
};

const getApiErrorMessage = (data, status) => {
  if (status === 401) {
    return data?.message || "Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại để gửi lead.";
  }

  if (status === 403) {
    return data?.message || "Tài khoản hiện tại chưa có quyền gửi lead. Vui lòng kiểm tra quyền cộng tác viên.";
  }

  if (status === 400) {
    return data?.message || "Thông tin lead chưa hợp lệ. Vui lòng kiểm tra họ tên và số điện thoại.";
  }

  return data?.message || "Không thể gửi lead. Vui lòng thử lại sau.";
};

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
  const [form, setForm] = useState(() => {
    try {
      const lastLead = JSON.parse(window.localStorage.getItem("last_lead_info"));
      if (lastLead && (lastLead.fullName || lastLead.phone || lastLead.email)) {
        return {
          ...INITIAL_FORM,
          customerName: lastLead.fullName || lastLead.customerName || "",
          phone: lastLead.phone || "",
          email: lastLead.email || "",
          note: lastLead.notes || lastLead.note || ""
        };
      }
    } catch (e) {
      // ignore
    }
    return INITIAL_FORM;
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const payloadPreview = useMemo(() => buildLeadPayload(form), [form]);

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
    setForm((current) => {
      const nextForm = {
        ...current,
        [fieldName]: value
      };
      
      try {
        const lastLead = JSON.parse(window.localStorage.getItem("last_lead_info") || "{}");
        window.localStorage.setItem("last_lead_info", JSON.stringify({
          ...lastLead,
          fullName: fieldName === "customerName" ? value : nextForm.customerName,
          phone: fieldName === "phone" ? value : nextForm.phone,
          email: fieldName === "email" ? value : nextForm.email,
          notes: fieldName === "note" ? value : nextForm.note
        }));
      } catch (e) {}

      return nextForm;
    });

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

    const authHeaders = getAuthHeaders();

    if (!authHeaders.Authorization) {
      setSubmitResult({
        type: "danger",
        mode: "real",
        leadCode: "-",
        message: "Bạn cần đăng nhập hoặc phiên đăng nhập đã hết hạn để gửi lead."
      });
      setSubmitting(false);
      return;
    }

    const payload = buildLeadPayload(form);

    const abortController = new AbortController();
    const requestTimeout = window.setTimeout(() => {
      abortController.abort();
    }, LEAD_REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(`${API_BASE_URL}/leads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders
        },
        signal: abortController.signal,
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(getApiErrorMessage(data, response.status));
      }

      const createdLead = data?.data || {};

      setSubmitResult({
        type: "success",
        mode: "api",
        leadCode: createdLead.bizflyContactId || createdLead._id || `LEAD-${Date.now()}`,
        message: createdLead.bizflyContactId
          ? data?.message || "Lead đã được gửi thành công vào CRM."
          : "Lead đã lưu vào hệ thống, nhưng BizFly chưa trả mã contact. Vui lòng kiểm tra log đồng bộ hoặc thử lại với đầy đủ email/số điện thoại."
      });

      setForm(INITIAL_FORM);
      window.localStorage.removeItem("last_lead_info");
    } catch (err) {
      const isTimeout = err.name === "AbortError";

      setSubmitResult({
        type: "danger",
        mode: "api",
        leadCode: "-",
        message: isTimeout
          ? "Kết nối API quá lâu chưa phản hồi. Vui lòng thử lại sau ít phút."
          : err.message || "Không thể gửi lead. Vui lòng thử lại sau."
      });
    } finally {
      window.clearTimeout(requestTimeout);
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

        <div id="lead-form-completion-card" className="lead-completion-card">
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
              Mã lead: {submitResult.leadCode} · API: POST {API_BASE_URL}/leads
            </div>
          </div>
        </div>
      )}

      <div className="row g-3 align-items-start">
        <div className="col-12 col-xl-8">
          <form id="lead-form-main-card" className="lead-form-card" onSubmit={handleSubmit}>
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
                  <TailwindDropdown onChange={(value) => handleChange("source", value)} options={SOURCE_OPTIONS.map((item) => ({ label: item, value: item }))} placeholder="Chọn nguồn lead" value={form.source} />
                </div>
              </div>
            </div>

            <div className="lead-form-section">
              <h6>Nhu cầu tư vấn</h6>

              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <label className="form-label">Dịch vụ quan tâm <span className="text-danger">*</span></label>
                  <TailwindDropdown error={Boolean(errors.productInterest)} onChange={(value) => handleChange("productInterest", value)} options={PRODUCT_OPTIONS.map((item) => ({ label: item, value: item }))} placeholder="Chọn dịch vụ" value={form.productInterest} />
                  {errors.productInterest && <div className="invalid-feedback">{errors.productInterest}</div>}
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label">Quốc gia quan tâm</label>
                  <TailwindDropdown onChange={(value) => handleChange("countryInterest", value)} options={COUNTRY_OPTIONS.map((item) => ({ label: item, value: item }))} placeholder="Chọn quốc gia" value={form.countryInterest} />
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
                  <TailwindDropdown onChange={(value) => handleChange("urgency", value)} options={URGENCY_OPTIONS.map((item) => ({ label: item, value: item }))} placeholder="Chọn thời gian" value={form.urgency} />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label">Kênh liên hệ ưu tiên</label>
                  <TailwindDropdown onChange={(value) => handleChange("preferredContact", value)} options={CONTACT_OPTIONS.map((item) => ({ label: item, value: item }))} placeholder="Chọn kênh liên hệ" value={form.preferredContact} />
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

              <button id="lead-form-submit-btn" type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? "Đang gửi..." : "Gửi lead"}
              </button>
            </div>
          </form>
        </div>

        <div className="col-12 col-xl-4">
          <div id="lead-form-guide-panel" className="lead-guide-panel">
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
              <strong>API đang kết nối:</strong>
              <code>POST {API_BASE_URL}/leads</code>
            </div>

            <div className="lead-api-note mt-3">
              <strong>Payload sẽ gửi:</strong>
              <pre>{JSON.stringify(payloadPreview, null, 2)}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
