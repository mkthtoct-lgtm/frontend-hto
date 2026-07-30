import { useState, useEffect, useCallback, useMemo } from "react";
import { API_BASE_URL } from "../config/api";
import { authFetch, getAuthHeaders } from "../auth/session";
import { useToast } from "../products/ToastContext";

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

const ROLE_ID_MAP = {
  "69fc5af582ef85451120772a": "admin",
  "69fc5af582ef85451120772b": "bangiamdoc",
  "69fc5af582ef85451120772c": "truongbophan",
  "69fc5af582ef85451120772d": "nhansu",
  "69fc5af582ef85451120772e": "daily",
  "69fc5af682ef85451120772f": "congtacvien",
  "69fc5af782ef854511207730": "user",
};

const normalizeRoleKey = (roleValue) => {
  return String(roleValue || "")
    .trim()
    .toLowerCase()
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
};

const getUserRoleKey = (user) => {
  const roleFromObject = user?.role?.name || user?.roleName || user?.role || user?.role_key || "";
  const roleFromId = ROLE_ID_MAP[user?.roleId];
  return normalizeRoleKey(roleFromObject || roleFromId || "user");
};

const getStatusProps = (status) => {
  switch (status) {
    case "pending":
      return {
        label: "Chờ đối soát",
        color: "bg-warning-subtle text-warning border-warning-subtle",
      };
    case "approved":
      return {
        label: "Đã đối soát",
        color: "bg-success-subtle text-success border-success-subtle",
      };
    case "paid":
      return {
        label: "Đã thanh toán",
        color: "bg-primary-subtle text-primary border-primary-subtle",
      };
    case "cancelled":
      return {
        label: "Hủy bỏ",
        color: "bg-danger-subtle text-danger border-danger-subtle",
      };
    default:
      return {
        label: status || "Không rõ",
        color: "bg-secondary-subtle text-secondary border-secondary-subtle",
      };
  }
};

export function AccountingManagementPage({ currentUser }) {
  const toast = useToast();
  
  const [commissions, setCommissions] = useState([]);
  const [allCommissionsForMetrics, setAllCommissionsForMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [dealPage, setDealPage] = useState(1);
  const [dealPageCount, setDealPageCount] = useState(1);
  const [totalDeals, setTotalDeals] = useState(0);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [stats, setStats] = useState(null);

  const DEAL_PAGE_SIZE = 10;

  const isAdmin = useMemo(() => {
    const userRole = getUserRoleKey(currentUser);
    const permissions = Array.isArray(currentUser?.permissions) ? currentUser.permissions : [];
    return (
      ["admin", "bangiamdoc", "truongbophan"].includes(userRole) ||
      permissions.includes("*") ||
      permissions.includes("settings:manage") ||
      permissions.includes("commissions:read") ||
      permissions.includes("commissions:write")
    );
  }, [currentUser]);

  // Fetch list of commissions
  const fetchCommissions = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const endpoint = isAdmin ? "/commissions/admin" : "/commissions/my";
      const params = new URLSearchParams({
        page: dealPage,
        limit: DEAL_PAGE_SIZE,
      });
      if (statusFilter) params.append("status", statusFilter);
      if (searchTerm) params.append("search", searchTerm);

      const response = await authFetch(`${API_BASE_URL}${endpoint}?${params.toString()}`, {
        headers: getAuthHeaders(),
      });
      const json = await response.json().catch(() => null);
      if (!response.ok || !json?.success) {
        throw new Error(json?.message || "Không thể tải danh sách đối soát.");
      }

      setCommissions(json.data?.items || []);
      setTotalDeals(json.data?.pagination?.total || 0);
      setDealPageCount(json.data?.pagination?.pages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi khi tải danh sách hoa hồng.");
    } finally {
      setLoading(false);
    }
  }, [isAdmin, dealPage, statusFilter, searchTerm]);

  // Fetch metrics data
  const fetchMetricsData = useCallback(async () => {
    try {
      if (isAdmin) {
        const response = await authFetch(`${API_BASE_URL}/commissions/admin?limit=1000`, {
          headers: getAuthHeaders(),
        });
        const json = await response.json().catch(() => null);
        if (json?.success) {
          setAllCommissionsForMetrics(json.data?.items || []);
        }
      } else {
        // CTV Stats
        const responseStats = await authFetch(`${API_BASE_URL}/commissions/stats`, {
          headers: getAuthHeaders(),
        });
        const jsonStats = await responseStats.json().catch(() => null);
        if (jsonStats?.success) {
          setStats(jsonStats.data);
        }

        // CTV personal list
        const responseMy = await authFetch(`${API_BASE_URL}/commissions/my?limit=1000`, {
          headers: getAuthHeaders(),
        });
        const jsonMy = await responseMy.json().catch(() => null);
        if (jsonMy?.success) {
          setAllCommissionsForMetrics(jsonMy.data?.items || []);
        }
      }
    } catch (err) {
      console.error("Failed to fetch metrics:", err);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchCommissions();
  }, [fetchCommissions]);

  useEffect(() => {
    fetchMetricsData();
  }, [fetchMetricsData]);

  const refreshAccountingData = useCallback(async () => {
    toast.info("Đang tải lại dữ liệu deal và hoa hồng...", "Đồng bộ dữ liệu");
    await Promise.all([fetchCommissions(), fetchMetricsData()]);
  }, [fetchCommissions, fetchMetricsData, toast]);

  // Calculate Metrics from allCommissionsForMetrics
  const { totalExpectedCommission, totalRecordedRevenue, eligibleDealsCount, reconciledCount } = useMemo(() => {
    const list = allCommissionsForMetrics || [];
    
    const expected = list
      .filter((d) => d.status !== "cancelled")
      .reduce((sum, d) => sum + (d.commissionAmount || 0), 0);

    const revenue = list
      .filter((d) => d.status === "approved" || d.status === "paid")
      .reduce((sum, d) => sum + (d.productPrice || 0), 0);

    const eligible = list.filter((d) => d.status !== "cancelled").length;
    const reconciled = list.filter((d) => d.status === "approved" || d.status === "paid").length;

    return {
      totalExpectedCommission: expected,
      totalRecordedRevenue: revenue,
      eligibleDealsCount: eligible,
      reconciledCount: reconciled,
    };
  }, [allCommissionsForMetrics]);

  const metrics = useMemo(() => [
    { label: "Hoa hồng dự kiến", value: totalExpectedCommission.toLocaleString("vi-VN") + " VND", accent: "#4F86F7" },
    { label: "Doanh thu đã ghi nhận", value: totalRecordedRevenue.toLocaleString("vi-VN") + " VND", accent: "#50B8B0" },
    { label: "Hồ sơ đủ điều kiện", value: `${eligibleDealsCount} hồ sơ`, accent: "#A162F7" },
    { label: "Đối soát kế toán", value: `Đã đối soát ${reconciledCount}/${eligibleDealsCount}`, accent: "#F79F57" },
  ], [totalExpectedCommission, totalRecordedRevenue, eligibleDealsCount, reconciledCount]);

  // Handle status updates (Admin only)
  const handleUpdateStatus = async (commissionId, newStatus) => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      const response = await authFetch(`${API_BASE_URL}/commissions/admin/${commissionId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await response.json().catch(() => null);
      if (!response.ok || !json?.success) {
        throw new Error(json?.message || "Cập nhật trạng thái thất bại.");
      }

      const updatedItem = json.data;
      const mappedUpdatedItem = {
        id: updatedItem._id || updatedItem.id,
        leadId: updatedItem.leadId,
        customerPhone: selectedDeal?.customerPhone || '',
        customerEmail: selectedDeal?.customerEmail || '',
        note: selectedDeal?.note || '',
        collaborator: selectedDeal?.collaborator,
        customerName: updatedItem.customerName,
        productInterest: updatedItem.productInterest,
        productPrice: updatedItem.productPrice,
        collaboratorRank: updatedItem.collaboratorRank,
        commissionRate: updatedItem.commissionRate,
        commissionAmount: updatedItem.commissionAmount,
        status: updatedItem.status,
        createdAt: updatedItem.createdAt,
        updatedAt: updatedItem.updatedAt
      };

      toast.success(`Cập nhật trạng thái đối soát thành công sang: ${getStatusProps(newStatus).label}`, "Thành công");

      // Update state
      setCommissions((prev) => prev.map((item) => item.id === commissionId ? mappedUpdatedItem : item));
      setAllCommissionsForMetrics((prev) => prev.map((item) => (item.id === commissionId || item._id === commissionId) ? { ...item, status: newStatus } : item));
      setSelectedDeal(mappedUpdatedItem);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Đã xảy ra lỗi khi cập nhật trạng thái.", "Lỗi");
    } finally {
      setActionLoading(false);
    }
  };

  // Construct dynamic timeline based on status
  const selectedDealTimeline = useMemo(() => {
    if (!selectedDeal) return [];
    const createdStr = new Date(selectedDeal.createdAt).toLocaleString("vi-VN", { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
    const updatedStr = new Date(selectedDeal.updatedAt).toLocaleString("vi-VN", { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
    const isApproved = selectedDeal.status === "approved" || selectedDeal.status === "paid";
    const isPaid = selectedDeal.status === "paid";

    if (selectedDeal.status === "cancelled") {
      return [
        { status: "Tạo deal", time: createdStr, done: true },
        { status: "Giao dịch bị hủy", time: updatedStr, done: true },
      ];
    }

    return [
      { status: "Tạo deal", time: createdStr, done: true },
      {
        status: "Ký hợp đồng",
        time: isApproved ? updatedStr : "Chờ admin xác nhận",
        done: isApproved
      },
      { 
        status: "Xác nhận thu tiền", 
        time: isApproved ? updatedStr : "Chờ xác nhận", 
        done: isApproved 
      },
      { 
        status: isPaid ? "Đã thanh toán" : "Đối soát hoàn tất", 
        time: isPaid ? updatedStr : "Chờ hoàn tất", 
        done: isPaid 
      },
    ];
  }, [selectedDeal]);

  return (
    <div className="container-fluid pt-3 pb-4" style={{ maxWidth: "1600px" }}>
      <div className="d-flex flex-column flex-xl-row justify-content-between align-items-xl-center gap-3 mb-3">
        <div>
          <h4 className="fw-bold text-body-emphasis mb-1">Đối soát & Quản lý Deal</h4>
        </div>

        <div className="d-flex flex-wrap gap-2">
          <button id="nghiepvu-sync-crm-btn" className="btn btn-sm btn-outline-primary d-inline-flex align-items-center" type="button" onClick={refreshAccountingData}>
            <RefreshCwIcon />
            Đồng bộ CRM
          </button>
          <button className="btn btn-sm btn-primary d-inline-flex align-items-center" type="button" onClick={() => toast.info("Đang tải cấu hình thiết lập đối soát...", "Cấu hình")}>
            <SettingsIcon />
            Thiết lập kế toán
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div id="nghiepvu-metrics-grid" className="row g-2 g-xl-3 mb-3">
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
          <section id="nghiepvu-empty-state" className="card border-0 h-100" style={{ borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div className="card-header bg-transparent border-bottom py-3 px-3 d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2">
              <h6 className="fw-bold text-body-emphasis mb-0">Danh sách Deal cần đối soát</h6>
              <div className="d-flex flex-wrap align-items-center gap-2">
                <input
                  type="text"
                  placeholder="Tìm kiếm khách hàng/sản phẩm..."
                  className="form-control form-control-sm bg-body border-1"
                  style={{ width: "200px", fontSize: "12px" }}
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setDealPage(1);
                  }}
                />
                <select
                  className="form-select form-select-sm bg-body border-1"
                  style={{ width: "130px", fontSize: "12px" }}
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setDealPage(1);
                  }}
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="pending">Chờ đối soát</option>
                  <option value="approved">Đã đối soát</option>
                  <option value="paid">Đã thanh toán</option>
                  <option value="cancelled">Hủy bỏ</option>
                </select>
                <span className="badge bg-primary-subtle text-primary px-2 py-1">{totalDeals} Deal</span>
              </div>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0" style={{ fontSize: "13px" }}>
                  <thead className="table-light">
                    <tr>
                      <th className="ps-3 py-3 text-body-secondary fw-semibold text-nowrap" style={{ width: "180px" }}>Mã Deal / Dự án</th>
                      <th className="py-3 text-body-secondary fw-semibold text-nowrap" style={{ width: "160px" }}>Khách hàng</th>
                      <th className="py-3 text-body-secondary fw-semibold text-nowrap">Giá trị hợp đồng</th>
                      <th className="py-3 text-body-secondary fw-semibold text-nowrap">Hoa hồng dự kiến</th>
                      <th className="py-3 text-body-secondary fw-semibold text-nowrap">Trạng thái</th>
                      <th className="pe-3 py-3 text-body-secondary fw-semibold text-end text-nowrap">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="6" className="text-center py-5">
                          <div className="spinner-border spinner-border-sm text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        </td>
                      </tr>
                    ) : error ? (
                      <tr>
                        <td colSpan="6" className="text-center py-4 text-danger">{error}</td>
                      </tr>
                    ) : commissions.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center py-5 text-body-secondary">
                          Không tìm thấy bản ghi đối soát nào.
                        </td>
                      </tr>
                    ) : (
                      commissions.map((deal) => {
                        const statusProps = getStatusProps(deal.status);
                        return (
                          <tr key={deal.id} style={{ cursor: "pointer" }} onClick={() => setSelectedDeal(deal)}>
                            <td className="ps-3 py-3 text-nowrap" style={{ maxWidth: "180px" }}>
                              <div className="fw-bold text-body-emphasis" style={{ fontSize: "12px" }} title={deal.id}>
                                #{deal.id.slice(-8).toUpperCase()}
                              </div>
                              <div className="text-body-secondary small text-truncate mt-1" style={{ maxWidth: "160px" }} title={deal.productInterest}>
                                {deal.productInterest}
                              </div>
                            </td>
                            <td className="py-3 text-nowrap" style={{ maxWidth: "160px" }}>
                              <div className="fw-semibold text-body-emphasis">{deal.customerName}</div>
                              {isAdmin && deal.collaborator && (
                                <div className="text-body-secondary small mt-0.5 text-truncate" style={{ maxWidth: "140px" }} title={deal.collaborator.fullName}>
                                  CTV: {deal.collaborator.fullName}
                                </div>
                              )}
                            </td>
                            <td className="py-3 fw-medium text-body-emphasis text-nowrap">
                              {deal.productPrice.toLocaleString("vi-VN")} VND
                            </td>
                            <td className="py-3 text-nowrap">
                              <div className="fw-semibold text-success">
                                {deal.commissionAmount.toLocaleString("vi-VN")} VND
                              </div>
                              <div className="small text-body-secondary">({(deal.commissionRate * 100).toFixed(0)}%)</div>
                            </td>
                            <td className="py-3 text-nowrap">
                              <span className={`badge border px-2 py-1.5 ${statusProps.color}`}>
                                {statusProps.label}
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
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              
              {!loading && !error && dealPageCount > 1 && (
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 p-3 border-top">
                  <span className="text-body-secondary" style={{ fontSize: "13px" }}>
                    Hiển thị {(dealPage - 1) * DEAL_PAGE_SIZE + 1}-
                    {Math.min(dealPage * DEAL_PAGE_SIZE, totalDeals)} trong{" "}
                    {totalDeals} Deal
                  </span>
                  <div className="btn-group gap-2" role="group" aria-label="Phân trang Deal">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => setDealPage((page) => Math.max(1, page - 1))}
                      disabled={dealPage === 1}
                    >
                      Trước
                    </button>
                    {Array.from({ length: dealPageCount }, (_, index) => index + 1).map(
                      (page) => (
                        <button
                           key={page}
                           type="button"
                           className={`btn btn-sm ${page === dealPage ? "btn-primary" : "btn-outline-secondary"}`}
                           onClick={() => setDealPage(page)}
                        >
                          {page}
                        </button>
                      ),
                    )}
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => setDealPage((page) => Math.min(dealPageCount, page + 1))}
                      disabled={dealPage === dealPageCount}
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
          <section id="nghiepvu-conditions-card" className="card border-0 h-100" style={{ borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
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

              <div className="rounded bg-info-subtle text-info-emphasis p-3 mt-4" style={{ fontSize: "12px", lineHeight: 1.5 }}>
                Dữ liệu đối soát hoa hồng dựa trên hồ sơ khách hàng đã gửi và được cập nhật trạng thái bởi bộ phận Kế toán / Admin.
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
                <span>Chi tiết Deal: #{selectedDeal.id.slice(-8).toUpperCase()}</span>
                <span className={`badge border font-normal ${getStatusProps(selectedDeal.status).color}`} style={{ fontSize: "12px" }}>
                  {getStatusProps(selectedDeal.status).label}
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
                    <span className="text-body-secondary small d-block">Sản phẩm quan tâm</span>
                    <span className="fw-semibold text-body-emphasis">{selectedDeal.productInterest}</span>
                  </div>
                  <div className="col-6">
                    <span className="text-body-secondary small d-block">Giá trị hợp đồng</span>
                    <span className="fw-bold text-primary" style={{ fontSize: "16px" }}>
                      {selectedDeal.productPrice.toLocaleString("vi-VN")} VND
                    </span>
                  </div>
                  <div className="col-6">
                    <span className="text-body-secondary small d-block">Hoa hồng thực nhận ({(selectedDeal.commissionRate * 100).toFixed(0)}%)</span>
                    <span className="fw-bold text-success" style={{ fontSize: "16px" }}>
                      {selectedDeal.commissionAmount.toLocaleString("vi-VN")} VND
                    </span>
                  </div>
                  <div className="col-6">
                    <span className="text-body-secondary small d-block">Cấp bậc CTV ghi nhận</span>
                    <span className="text-body-emphasis">{selectedDeal.collaboratorRank || "—"}</span>
                  </div>
                  <div className="col-6">
                    <span className="text-body-secondary small d-block">Ngày ghi nhận hoa hồng</span>
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
                    <span className="fw-semibold text-body-emphasis">{selectedDeal.customerName}</span>
                  </div>
                  <div className="col-6">
                    <span className="text-body-secondary small d-block">Số điện thoại</span>
                    <span className="text-body-emphasis">{selectedDeal.customerPhone || "—"}</span>
                  </div>
                  <div className="col-12">
                    <span className="text-body-secondary small d-block">Email</span>
                    <span className="text-body-emphasis text-break">{selectedDeal.customerEmail || "—"}</span>
                  </div>
                </div>
              </div>

              {/* Collaborator Info (Admin only) */}
              {isAdmin && selectedDeal.collaborator && (
                <div className="mb-4">
                  <h6 className="fw-bold text-body-emphasis border-bottom pb-2 mb-3">Thông tin Cộng tác viên giới thiệu</h6>
                  <div className="row g-3">
                    <div className="col-6">
                      <span className="text-body-secondary small d-block">Họ và tên CTV</span>
                      <span className="fw-semibold text-body-emphasis">{selectedDeal.collaborator.fullName}</span>
                    </div>
                    <div className="col-6">
                      <span className="text-body-secondary small d-block">Số điện thoại CTV</span>
                      <span className="text-body-emphasis">{selectedDeal.collaborator.phone || "—"}</span>
                    </div>
                    <div className="col-12">
                      <span className="text-body-secondary small d-block">Email CTV</span>
                      <span className="text-body-emphasis text-break">{selectedDeal.collaborator.email || "—"}</span>
                    </div>
                  </div>
                </div>
              )}

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
                        left: `${100 / selectedDealTimeline.length / 2}%`,
                        right: `${100 / selectedDealTimeline.length / 2}%`,
                        height: "2px",
                        backgroundColor: "#e2e8f0",
                        zIndex: 0,
                      }}
                    ></div>
                    <div className="d-flex justify-content-between align-items-start position-relative w-100" style={{ zIndex: 1 }}>
                      {selectedDealTimeline.map((step, idx) => (
                        <div key={idx} className="d-flex flex-column align-items-center text-center flex-fill" style={{ width: `${100 / selectedDealTimeline.length}%` }}>
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
              {selectedDeal.note && (
                <div className="bg-body-secondary/30 border rounded p-3">
                  <div className="fw-semibold small text-body-emphasis mb-1">Ghi chú từ CTV:</div>
                  <p className="text-body-secondary mb-0 small" style={{ lineHeight: 1.5 }}>
                    {selectedDeal.note}
                  </p>
                </div>
              )}
            </div>
            
            {/* Modal Actions */}
            <div className="d-flex flex-shrink-0 justify-content-end gap-2 border-top p-4">
              <button type="button" className="btn btn-light border" onClick={() => setSelectedDeal(null)}>
                Đóng
              </button>
              
              {/* Admin decision buttons */}
              {isAdmin && selectedDeal.status === "pending" && (
                <>
                  <button
                    type="button"
                    className="btn btn-danger"
                    disabled={actionLoading}
                    onClick={() => handleUpdateStatus(selectedDeal.id, "cancelled")}
                  >
                    Hủy giao dịch
                  </button>
                  <button
                    type="button"
                    className="btn btn-success"
                    disabled={actionLoading}
                    onClick={() => handleUpdateStatus(selectedDeal.id, "approved")}
                  >
                    Duyệt đối soát
                  </button>
                </>
              )}

              {/* Admin payout button */}
              {isAdmin && selectedDeal.status === "approved" && (
                <>
                  <button
                    type="button"
                    className="btn btn-danger"
                    disabled={actionLoading}
                    onClick={() => handleUpdateStatus(selectedDeal.id, "cancelled")}
                  >
                    Hủy giao dịch
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={actionLoading}
                    onClick={() => handleUpdateStatus(selectedDeal.id, "paid")}
                  >
                    Xác nhận thanh toán
                  </button>
                </>
              )}
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
