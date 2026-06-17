import { useState, useEffect, useCallback } from "react";
import { authFetch, getAuthHeaders } from "../auth/session";
import { API_BASE_URL } from "../config/api";

const STATUS_OPTS = [
  { value: "dang_tu_van", label: "Đang tư vấn", color: "bg-info text-dark" },
  { value: "cho_chot_hop_dong", label: "Chờ chốt hợp đồng", color: "bg-warning text-dark" },
  { value: "xu_ly_ho_so", label: "Xử lí hồ sơ (Tính Deal)", color: "bg-success text-white" },
  { value: "lost", label: "Hủy/Thất bại", color: "bg-danger text-white" }
];

export const OrderManagementPage = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await authFetch(`${API_BASE_URL}/leads`, {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders()
        }
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.message || "Không thể tải danh sách leads.");
      }

      setLeads(payload?.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) {
        void fetchLeads();
      }
    });
    return () => {
      active = false;
    };
  }, [fetchLeads]);

  const handleUpdateStatus = async (leadId, nextStatus) => {
    setUpdatingId(leadId);
    try {
      const response = await authFetch(`${API_BASE_URL}/leads/${leadId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders()
        },
        body: JSON.stringify({ status: nextStatus })
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.message || "Cập nhật trạng thái thất bại.");
      }

      // Cập nhật state cục bộ
      setLeads((prev) =>
        prev.map((lead) => (lead._id === leadId ? { ...lead, status: nextStatus } : lead))
      );
    } catch (err) {
      alert("Lỗi: " + (err instanceof Error ? err.message : "Cập nhật thất bại"));
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (statusValue) => {
    const opt = STATUS_OPTS.find((o) => o.value === statusValue);
    return opt ? (
      <span className={`badge ${opt.color} px-2.5 py-1.5 rounded-lg text-xs font-bold`}>
        {opt.label}
      </span>
    ) : (
      <span className="badge bg-secondary">Chưa rõ</span>
    );
  };

  const filteredLeads = leads.filter((lead) => {
    const matchSearch =
      lead.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone.includes(searchTerm) ||
      (lead.collaboratorId?.fullName || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchStatus = filterStatus ? lead.status === filterStatus : true;

    return matchSearch && matchStatus;
  });

  return (
    <div className="order-management-page container-fluid pt-3 pb-4" style={{ maxWidth: "1600px" }}>
      {/* Title Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-widest text-slate-500">ADMIN CONTROL</span>
          <h4 className="fw-bold text-body-emphasis mb-1">Quản lý Đơn hàng & Leads Khách hàng</h4>
          <p className="text-body-secondary mb-0">
            Quản trị viên theo dõi khách hàng gửi từ CTV, kiểm tra trạng thái BizFly CRM và cập nhật tiến độ để ghi nhận deal.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="row g-3 mb-4 align-items-center">
        <div className="col-12 col-md-5">
          <div className="input-group border rounded-3 bg-body overflow-hidden">
            <span className="input-group-text bg-transparent border-0 text-slate-400">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </span>
            <input
              type="text"
              className="form-control border-0 px-2 py-2.5 text-sm"
              placeholder="Tìm theo tên khách, SĐT hoặc người giới thiệu (CTV)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="col-12 col-md-3">
          <select
            className="form-select border rounded-3 py-2.5 text-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            {STATUS_OPTS.map((opt) => (
              <option value={opt.value} key={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="col-12 col-md-4 text-md-end">
          <button className="btn btn-outline-secondary btn-sm px-3 py-2" onClick={fetchLeads} disabled={loading}>
            Tải lại dữ liệu
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="card border-0 shadow-sm" style={{ borderRadius: "12px" }}>
        <div className="table-responsive">
          <table className="table align-middle mb-0" style={{ borderCollapse: "separate" }}>
            <thead className="table-light">
              <tr>
                <th className="py-3 px-4" style={{ width: "5%" }}>#</th>
                <th className="py-3" style={{ width: "23%" }}>Khách hàng</th>
                <th className="py-3" style={{ width: "20%" }}>Nhu cầu tư vấn</th>
                <th className="py-3" style={{ width: "18%" }}>Người giới thiệu (CTV)</th>
                <th className="py-3" style={{ width: "14%" }}>BizFly CRM Sync</th>
                <th className="py-3" style={{ width: "12%" }}>Trạng thái</th>
                <th className="py-3 text-center" style={{ width: "8%" }}>Cập nhật</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="7" className="text-center py-4 text-danger font-bold">{error}</td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-5 text-body-secondary">
                    Không tìm thấy Leads nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead, index) => (
                  <tr key={lead._id}>
                    <td className="px-4 text-body-secondary font-medium">{index + 1}</td>
                    <td>
                      <div className="d-flex flex-column">
                        <span className="fw-bold text-body-emphasis">{lead.customerName}</span>
                        <span className="text-body-secondary text-xs">{lead.phone} · {lead.email || "Không có email"}</span>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex flex-column">
                        <span className="fw-medium text-slate-800">{lead.productInterest} ({lead.countryInterest})</span>
                        <span className="text-body-secondary text-xs truncate max-w-[240px]" title={lead.note}>
                          Ghi chú: {lead.note || "Trống"}
                        </span>
                      </div>
                    </td>
                    <td>
                      {lead.collaboratorId ? (
                        <div className="d-flex flex-column">
                          <span className="fw-bold text-indigo-600">{lead.collaboratorId.fullName}</span>
                          <span className="text-body-secondary text-xs">{lead.collaboratorId.email}</span>
                        </div>
                      ) : (
                        <span className="text-body-secondary text-xs">—</span>
                      )}
                    </td>
                    <td>
                      {lead.bizflyContactId ? (
                        <span className="badge bg-success-subtle text-success px-2 py-1 border border-success-subtle rounded text-xs font-semibold">
                          Đã sync (ID: {lead.bizflyContactId})
                        </span>
                      ) : (
                        <span className="badge bg-slate-100 text-slate-500 px-2 py-1 border border-slate-200 rounded text-xs font-semibold">
                          Chờ sync / Thất bại
                        </span>
                      )}
                    </td>
                    <td>{getStatusBadge(lead.status)}</td>
                    <td className="text-center">
                      <select
                        className="form-select form-select-sm border"
                        value={lead.status}
                        onChange={(e) => handleUpdateStatus(lead._id, e.target.value)}
                        disabled={updatingId === lead._id}
                        style={{ minWidth: "120px" }}
                      >
                        {STATUS_OPTS.map((opt) => (
                          <option value={opt.value} key={opt.value}>
                            {opt.label.split(" (")[0]}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
