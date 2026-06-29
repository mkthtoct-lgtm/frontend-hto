import { useCallback, useEffect, useMemo, useState } from "react";
import { TailwindDropdown } from "../components/ui/TailwindDropdown";
import "./AIConfigPage.css";

const API_BASE_URL = "http://localhost:3000/api/v1";
const USE_MOCK_WHEN_API_FAIL = true;

const MOCK_DOCUMENT_GROUPS = [
  { id: "grp-sop", name: "SOP nghiệp vụ", description: "Các quy trình chuẩn đang áp dụng cho tư vấn, visa, CRM, nhân sự.", documentCount: 24, updatedAt: "2026-05-24" },
  { id: "grp-form", name: "Biểu mẫu & template", description: "Mẫu form, hợp đồng, email, checklist dùng cho vận hành nội bộ.", documentCount: 38, updatedAt: "2026-05-22" },
  { id: "grp-policy", name: "Chính sách nội bộ", description: "Quy định phân quyền, bảo mật, duyệt tài liệu và kiểm soát truy cập.", documentCount: 12, updatedAt: "2026-05-20" },
  { id: "grp-product", name: "Tài liệu sản phẩm", description: "Tài liệu mô tả dịch vụ du học, visa, định cư, đào tạo ngôn ngữ.", documentCount: 46, updatedAt: "2026-05-19" },
  { id: "grp-faq", name: "FAQ khách hàng", description: "Câu hỏi thường gặp đã được kiểm duyệt để AI dùng trả lời nhanh.", documentCount: 31, updatedAt: "2026-05-18" }
];

const MOCK_CONFIG = {
  enabled: true,
  answerMode: "balanced",
  retrievalLimit: 5,
  similarityThreshold: 72,
  fallbackAction: "create_pending_question",
  selectedGroupIds: ["grp-sop", "grp-policy", "grp-product"],
  allowedRoles: ["admin", "bangiamdoc", "truongbophan", "nhansu"],
  systemPrompt:
    "Bạn là trợ lý AI nội bộ của HT Ocean Group. Chỉ trả lời dựa trên tài liệu được cấu hình. Nếu chưa đủ dữ liệu, hãy tạo câu hỏi pending để trưởng bộ phận xử lý."
};

const normalizeArrayResponse = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const normalizeRole = (roleValue) => {
  return String(roleValue || "")
    .trim()
    .toLowerCase()
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
};

const isAdminUser = (currentUser) => {
  const roleName = normalizeRole(currentUser?.role?.name || currentUser?.roleName || currentUser?.role);
  return roleName === "admin";
};

const formatDate = (dateValue) => {
  if (!dateValue) return "—";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
};

export const AIConfigPage = ({ currentUser }) => {
  const [documentGroups, setDocumentGroups] = useState([]);
  const [config, setConfig] = useState(MOCK_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [apiMode, setApiMode] = useState("mock");
  const [message, setMessage] = useState("");

  const canManage = isAdminUser(currentUser);

  const fetchAIConfig = useCallback(async () => {
    setLoading(true);
    setMessage("");

    try {
      const token = localStorage.getItem("token");

      const [groupsResponse, configResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/ai/document-groups`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/ai/config`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (!groupsResponse.ok || !configResponse.ok) {
        throw new Error("API cấu hình AI chưa sẵn sàng hoặc tài khoản hiện tại chưa có quyền truy cập.");
      }

      const groupsPayload = await groupsResponse.json();
      const configPayload = await configResponse.json();

      setDocumentGroups(normalizeArrayResponse(groupsPayload));
      setConfig(configPayload?.data || configPayload || MOCK_CONFIG);
      setApiMode("real");
    } catch (err) {
      if (USE_MOCK_WHEN_API_FAIL) {
        setDocumentGroups(MOCK_DOCUMENT_GROUPS);
        setConfig(MOCK_CONFIG);
        setApiMode("mock");
      } else {
        setMessage(err.message || "Không thể tải cấu hình AI.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAIConfig();
  }, [fetchAIConfig]);

  const selectedGroups = useMemo(() => {
    return documentGroups.filter((group) => (config.selectedGroupIds || []).includes(group.id || group._id));
  }, [documentGroups, config.selectedGroupIds]);

  const totalSelectedDocuments = useMemo(() => {
    return selectedGroups.reduce((total, group) => total + Number(group.documentCount || group.document_count || 0), 0);
  }, [selectedGroups]);

  const handleConfigChange = (fieldName, value) => {
    setConfig((current) => ({ ...current, [fieldName]: value }));
    setMessage("");
  };

  const toggleDocumentGroup = (groupId) => {
    setConfig((current) => {
      const currentIds = current.selectedGroupIds || [];
      const nextIds = currentIds.includes(groupId)
        ? currentIds.filter((id) => id !== groupId)
        : [...currentIds, groupId];

      return { ...current, selectedGroupIds: nextIds };
    });
    setMessage("");
  };

  const toggleRole = (roleName) => {
    setConfig((current) => {
      const currentRoles = current.allowedRoles || [];
      const nextRoles = currentRoles.includes(roleName)
        ? currentRoles.filter((item) => item !== roleName)
        : [...currentRoles, roleName];

      return { ...current, allowedRoles: nextRoles };
    });
    setMessage("");
  };

  const handleSave = async () => {
    if (!canManage) return;

    setSaving(true);
    setMessage("");

    const payload = {
      ...config,
      selectedGroupIds: config.selectedGroupIds || [],
      allowedRoles: config.allowedRoles || []
    };

    try {
      if (apiMode === "mock") {
        await new Promise((resolve) => setTimeout(resolve, 450));
        setMessage("Đã lưu mô phỏng cấu hình AI. Khi có API thật, PATCH /ai/config sẽ lưu vào backend.");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/ai/config`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("Không thể lưu cấu hình AI.");
      }

      const savedPayload = await response.json();
      setConfig(savedPayload?.data || savedPayload || payload);
      setMessage("Đã lưu cấu hình AI thành công.");
    } catch (err) {
      setMessage(err.message || "Lưu cấu hình thất bại.");
    } finally {
      setSaving(false);
    }
  };

  if (!canManage) {
    return (
      <div className="ai-config-page container-fluid pt-5 pb-4" style={{ maxWidth: "1180px" }}>
        <div className="ai-config-denied">
          <h4 className="fw-bold text-danger">Từ chối quyền truy cập</h4>
          <p className="text-body-secondary mb-0">Chỉ tài khoản Admin được cấu hình nguồn tài liệu AI.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-config-page container-fluid pt-3 pb-4" style={{ maxWidth: "1500px" }}>
      <div className="ai-config-hero mb-4">
        <div>
          <span className="ai-config-eyebrow">AI source configuration</span>
          <h4 className="fw-bold text-body-emphasis mb-1">Cấu hình nguồn tài liệu AI</h4>
          <p className="text-body-secondary mb-0">
            Chọn nhóm tài liệu AI được phép sử dụng, cấu hình cách truy xuất dữ liệu và hành vi khi AI chưa đủ thông tin.
          </p>
        </div>

        <div className="d-flex flex-wrap gap-2 justify-content-end align-items-center">
          <span className={`ai-config-api-badge ${apiMode === "real" ? "real" : "mock"}`}>
            {apiMode === "real" ? "Đang dùng API thật" : "Đang dùng dữ liệu giả"}
          </span>

          <button className="btn btn-outline-primary btn-sm" onClick={fetchAIConfig} disabled={loading}>
            Đồng bộ lại
          </button>
        </div>
      </div>

      {message && <div className="alert alert-info py-2">{message}</div>}

      <div className="row g-3 align-items-start">
        <div className="col-12 col-xl-8">
          <div className="ai-config-card">
            <div className="ai-config-card-header">
              <div>
                <h6 className="fw-bold mb-0">Nhóm tài liệu AI sử dụng</h6>
                <span className="text-body-secondary small">Chọn nguồn tri thức được đưa vào truy xuất câu trả lời.</span>
              </div>
            </div>

            <div id="aiconfig-group-grid" className="ai-group-grid">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
                </div>
              ) : (
                documentGroups.map((group) => {
                  const groupId = group.id || group._id;
                  const checked = (config.selectedGroupIds || []).includes(groupId);

                  return (
                    <button key={groupId} type="button" className={`ai-group-card ${checked ? "selected" : ""}`} onClick={() => toggleDocumentGroup(groupId)}>
                      <div className="d-flex justify-content-between gap-3">
                        <div>
                          <h6>{group.name}</h6>
                          <p>{group.description}</p>
                        </div>

                        <span className={`ai-check-dot ${checked ? "active" : ""}`}>{checked ? "✓" : ""}</span>
                      </div>

                      <div className="ai-group-meta">
                        <span>{group.documentCount || group.document_count || 0} tài liệu</span>
                        <span>Cập nhật {formatDate(group.updatedAt || group.updated_at)}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-4">
          <div id="aiconfig-side-panel" className="ai-config-side-panel">
            <span className="ai-config-eyebrow">Runtime setting</span>
            <h5 className="fw-bold text-body-emphasis mb-3">Thiết lập AI</h5>

            <div className="ai-switch-row">
              <div>
                <strong>Bật trợ lý AI</strong>
                <span>Cho phép AI trả lời dựa trên nguồn đã chọn.</span>
              </div>

              <input type="checkbox" className="form-check-input" checked={Boolean(config.enabled)} onChange={(event) => handleConfigChange("enabled", event.target.checked)} />
            </div>

            <div className="mb-3">
              <label className="form-label">Chế độ trả lời</label>
              <TailwindDropdown onChange={(value) => handleConfigChange("answerMode", value)} options={[{ label: "Chặt chẽ theo tài liệu", value: "strict" }, { label: "Cân bằng", value: "balanced" }, { label: "Linh hoạt có kiểm soát", value: "creative" }]} placeholder="Chọn chế độ" value={config.answerMode} />
            </div>

            <div className="row g-3">
              <div className="col-6">
                <label className="form-label">Số tài liệu truy xuất</label>
                <input type="number" min="1" max="20" className="form-control" value={config.retrievalLimit} onChange={(event) => handleConfigChange("retrievalLimit", Number(event.target.value))} />
              </div>

              <div className="col-6">
                <label className="form-label">Độ khớp tối thiểu</label>
                <input type="number" min="0" max="100" className="form-control" value={config.similarityThreshold} onChange={(event) => handleConfigChange("similarityThreshold", Number(event.target.value))} />
              </div>
            </div>

            <div className="mt-3">
              <label className="form-label">Khi AI chưa đủ thông tin</label>
              <TailwindDropdown onChange={(value) => handleConfigChange("fallbackAction", value)} options={[{ label: "Tạo câu hỏi pending", value: "create_pending_question" }, { label: "Trả lời kèm cảnh báo", value: "answer_with_warning" }, { label: "Từ chối trả lời", value: "refuse_answer" }]} placeholder="Chọn cách xử lý" value={config.fallbackAction} />
            </div>

            <div className="mt-4">
              <label className="form-label">Role được sử dụng AI</label>
              <div className="ai-role-list">
                {["admin", "bangiamdoc", "truongbophan", "nhansu", "daily", "congtacvien"].map((roleName) => (
                  <label key={roleName} className="ai-role-item">
                    <input type="checkbox" checked={(config.allowedRoles || []).includes(roleName)} onChange={() => toggleRole(roleName)} />
                    <span>{roleName}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <label className="form-label">System prompt</label>
              <textarea className="form-control" rows="5" value={config.systemPrompt} onChange={(event) => handleConfigChange("systemPrompt", event.target.value)}></textarea>
            </div>

            <div className="ai-config-summary my-4">
              <div><span>Nhóm đã chọn</span><strong>{selectedGroups.length}</strong></div>
              <div><span>Tài liệu khả dụng</span><strong>{totalSelectedDocuments}</strong></div>
            </div>

            <button id="aiconfig-save-btn" className="btn btn-primary w-100" onClick={handleSave} disabled={saving}>
              {saving ? "Đang lưu..." : "Lưu cấu hình AI"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
