import { useCallback, useEffect, useMemo, useState } from "react";
import { TailwindDropdown } from "../components/ui/TailwindDropdown";
import { AUDIT_ACTION_OPTIONS, getAuditActors, getAuditLogs } from "./auditLogMockData.jsx";

const ADMIN_ROLE_ID = "69fc5af582ef85451120772a";

const isAdmin = (user) => user?.role === "admin" || user?.roleId === ADMIN_ROLE_ID;

export const AuditLogPage = ({ currentUser }) => {
  const [logs, setLogs] = useState([]);
  const [actors, setActors] = useState([]);
  const [selectedLogId, setSelectedLogId] = useState("");
  const [filters, setFilters] = useState({
    userId: "",
    action: "",
    from: "",
    to: "",
  });
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ totalLogs: 0, totalPages: 1, currentPage: 1, limit: 30 });

  const selectedLog = useMemo(
    () => logs.find((log) => log.id === selectedLogId),
    [logs, selectedLogId],
  );

  const loadAuditLogs = useCallback(async (page = 1) => {
    setLoading(true);
    setApiError("");

    try {
      const normalizedFilters = {
        userId: filters.userId,
        action: filters.action,
        from: filters.from ? new Date(filters.from).toISOString() : "",
        to: filters.to ? new Date(filters.to).toISOString() : "",
      };
      const [rawLogResult, rawActorData] = await Promise.all([
        getAuditLogs(normalizedFilters, page),
        getAuditActors(),
      ]);

      const logData = Array.isArray(rawLogResult?.logs) ? rawLogResult.logs : (Array.isArray(rawLogResult) ? rawLogResult : []);
      const actorData = Array.isArray(rawActorData) ? rawActorData : [];
      const paginationData = rawLogResult?.pagination || { totalLogs: logData.length, totalPages: 1, currentPage: page, limit: 30 };

      setLogs(logData);
      setActors(actorData);
      setPagination(paginationData);
      setCurrentPage(paginationData.currentPage || page);
      setSelectedLogId((currentId) =>
        logData.some((log) => log.id === currentId) ? currentId : logData[0]?.id || "",
      );
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Không thể tải lịch sử thao tác.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (isAdmin(currentUser)) {
      void Promise.resolve().then(() => loadAuditLogs(1));
    }
  }, [currentUser, loadAuditLogs]);

  const goToPage = (page) => {
    if (page < 1 || page > pagination.totalPages || page === currentPage) return;
    loadAuditLogs(page);
  };

  const updateFilter = (key, value) => {
    setFilters((currentFilters) => ({ ...currentFilters, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({ userId: "", action: "", from: "", to: "" });
    setCurrentPage(1);
  };

  if (!isAdmin(currentUser)) {
    return (
      <div className="container-fluid pt-5 text-center">
        <h2 className="text-danger">Từ chối truy cập</h2>
        <p className="text-body-secondary">Chỉ admin được truy cập màn hình lịch sử thao tác.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] px-3 pb-4 pt-3">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h4 className="fw-bold text-body-emphasis mb-1">Lịch sử thao tác</h4>
          
        </div>
        <button id="audit-refresh-btn" className="btn btn-outline-secondary" type="button" onClick={() => loadAuditLogs(currentPage)} disabled={loading}>
          Làm mới
        </button>
      </div>

      <section id="audit-filter-section" className="card mb-3 overflow-hidden rounded-xl border-0 shadow-sm">
        <div className="card-body">
          <div className="grid grid-cols-1 items-end gap-3 xl:grid-cols-[minmax(180px,1fr)_minmax(170px,0.8fr)_minmax(170px,0.8fr)_minmax(170px,0.8fr)_auto]">
            <div>
              <label className="form-label fw-semibold" style={{ fontSize: "13px" }}>Người thao tác</label>
              <TailwindDropdown
                onChange={(value) => updateFilter("userId", value)}
                options={[
                  { label: "Tất cả người dùng", value: "" },
                  ...actors.map((actor) => ({
                    label: `${actor.fullName} - ${actor.email}`,
                    value: actor.id,
                  })),
                ]}
                placeholder="Tất cả người dùng"
                value={filters.userId}
              />
            </div>

            <div>
              <label className="form-label fw-semibold" style={{ fontSize: "13px" }}>Hành động</label>
              <TailwindDropdown
                onChange={(value) => updateFilter("action", value)}
                options={[
                  { label: "Tất cả action", value: "" },
                  ...AUDIT_ACTION_OPTIONS.map((action) => ({
                    label: action.label,
                    value: action.value,
                  })),
                ]}
                placeholder="Tất cả action"
                value={filters.action}
              />
            </div>

            <div>
              <label className="form-label fw-semibold" style={{ fontSize: "13px" }}>Từ thời điểm</label>
              <input
                type="datetime-local"
                className="form-control"
                value={filters.from}
                onChange={(event) => updateFilter("from", event.target.value)}
              />
            </div>

            <div>
              <label className="form-label fw-semibold" style={{ fontSize: "13px" }}>Đến thời điểm</label>
              <input
                type="datetime-local"
                className="form-control"
                value={filters.to}
                onChange={(event) => updateFilter("to", event.target.value)}
              />
            </div>

            <button id="audit-clear-filter-btn" className="btn btn-light border" type="button" onClick={clearFilters}>
              Xóa lọc
            </button>
          </div>
        </div>
      </section>

      {apiError && (
        <div className="alert alert-danger d-flex align-items-center gap-2" role="alert">
          <WarningIcon />
          {apiError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
        <section id="audit-log-table" className="card overflow-hidden rounded-xl border-0 shadow-sm">
          <div className="card-header bg-transparent border-bottom d-flex justify-content-between align-items-center">
            <span className="fw-bold text-body-emphasis">Danh sách audit log</span>
            <span className="badge text-bg-light">{pagination.totalLogs} log</span>
          </div>

          {loading ? (
            <LoadingState label="Đang tải audit log..." />
          ) : logs.length === 0 ? (
            <EmptyState label="Không có log phù hợp với bộ lọc." />
          ) : (
            <>
              <div className="table-responsive hidden md:block">
                <table className="table custom-table mb-0">
                  <thead>
                    <tr>
                      <th>Thời gian</th>
                      <th>Actor</th>
                      <th>Action</th>
                      <th>Target</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr
                        key={log.id}
                        className={`cursor-pointer ${selectedLogId === log.id ? "[&>td]:!bg-[var(--bs-primary-bg-subtle)]" : ""}`}
                        onClick={() => setSelectedLogId(log.id)}
                      >
                        <td className="text-nowrap">{formatDateTime(log.createdAt)}</td>
                        <td>
                          <div className="fw-bold text-body-emphasis">{log.actor.fullName}</div>
                          <div className="text-body-secondary" style={{ fontSize: "12px" }}>{log.actor.email}</div>
                        </td>
                        <td><span className="inline-flex items-center whitespace-nowrap rounded-full bg-[var(--bs-secondary-bg)] px-2.5 py-1 text-xs font-bold text-[var(--bs-emphasis-color)]">{getActionLabel(log.action)}</span></td>
                        <td>
                          <div className="fw-semibold">{log.target.name}</div>
                          <div className="text-body-secondary" style={{ fontSize: "12px" }}>{log.target.type}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="block md:hidden">
                {logs.map((log) => (
                  <button
                    type="button"
                    key={log.id}
                    className={`w-100 border-0 border-b border-[var(--bs-border-color-translucent)] bg-transparent p-3.5 text-start ${selectedLogId === log.id ? "bg-[var(--bs-primary-bg-subtle)]" : ""}`}
                    onClick={() => setSelectedLogId(log.id)}
                  >
                    <div className="d-flex justify-content-between gap-2">
                      <strong>{log.actor.fullName}</strong>
                      <span className="text-body-secondary" style={{ fontSize: "12px" }}>{formatDateTime(log.createdAt)}</span>
                    </div>
                    <div className="mt-2"><span className="inline-flex items-center whitespace-nowrap rounded-full bg-[var(--bs-secondary-bg)] px-2.5 py-1 text-xs font-bold text-[var(--bs-emphasis-color)]">{getActionLabel(log.action)}</span></div>
                    <div className="text-body-secondary mt-2" style={{ fontSize: "13px" }}>
                      {log.target.type}: {log.target.name}
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Pagination */}
          {!loading && pagination.totalPages > 1 && (
            <div className="card-footer bg-transparent border-top d-flex flex-wrap justify-content-between align-items-center gap-2 px-3 py-2">
              <span className="text-body-secondary" style={{ fontSize: "13px" }}>
                Trang {currentPage} / {pagination.totalPages} ({pagination.totalLogs} log)
              </span>
              <nav>
                <ul className="pagination pagination-sm mb-0 gap-1">
                  <li className={`page-item ${currentPage <= 1 ? "disabled" : ""}`}>
                    <button type="button" className="page-link" onClick={() => goToPage(1)} disabled={currentPage <= 1}>
                      <ChevronDoubleLeftIcon />
                    </button>
                  </li>
                  <li className={`page-item ${currentPage <= 1 ? "disabled" : ""}`}>
                    <button type="button" className="page-link" onClick={() => goToPage(currentPage - 1)} disabled={currentPage <= 1}>
                      <ChevronLeftIcon />
                    </button>
                  </li>

                  {getPageNumbers(currentPage, pagination.totalPages).map((pageNum, idx) =>
                    pageNum === "..." ? (
                      <li key={`ellipsis-${idx}`} className="page-item disabled">
                        <span className="page-link">…</span>
                      </li>
                    ) : (
                      <li key={pageNum} className={`page-item ${pageNum === currentPage ? "active" : ""}`}>
                        <button type="button" className="page-link" onClick={() => goToPage(pageNum)}>
                          {pageNum}
                        </button>
                      </li>
                    )
                  )}

                  <li className={`page-item ${currentPage >= pagination.totalPages ? "disabled" : ""}`}>
                    <button type="button" className="page-link" onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= pagination.totalPages}>
                      <ChevronRightIcon />
                    </button>
                  </li>
                  <li className={`page-item ${currentPage >= pagination.totalPages ? "disabled" : ""}`}>
                    <button type="button" className="page-link" onClick={() => goToPage(pagination.totalPages)} disabled={currentPage >= pagination.totalPages}>
                      <ChevronDoubleRightIcon />
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </section>

        <section id="audit-log-detail" className="card overflow-hidden rounded-xl border-0 shadow-sm">
          <div className="card-header bg-transparent border-bottom">
            <span className="fw-bold text-body-emphasis">Chi tiết log</span>
          </div>
          <div className="card-body">
            {!selectedLog ? (
              <EmptyState label="Chọn một log để xem chi tiết." />
            ) : (
              <div className="d-flex flex-column gap-3">
                <DetailRow label="Actor" value={`${selectedLog.actor.fullName} (${selectedLog.actor.email})`} />
                <DetailRow label="Action" value={getActionLabel(selectedLog.action)} badge />
                <DetailRow label="Target" value={`${selectedLog.target.type}: ${selectedLog.target.name}`} />
                <DetailRow label="Thời gian" value={formatDateTime(selectedLog.createdAt)} />
               
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

/** Tính danh sách số trang hiển thị (có dấu "..." khi cần) */
function getPageNumbers(current, total) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages = [];

  // Luôn hiển thị trang 1
  pages.push(1);

  if (current > 3) {
    pages.push("...");
  }

  // Các trang xung quanh trang hiện tại
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) {
    pages.push("...");
  }

  // Luôn hiển thị trang cuối
  pages.push(total);

  return pages;
}

function DetailRow({ label, value, badge = false }) {
  return (
    <div>
      <div className="text-body-secondary fw-semibold mb-1" style={{ fontSize: "13px" }}>{label}</div>
      {badge ? (
        <span className="inline-flex items-center whitespace-nowrap rounded-full bg-[var(--bs-secondary-bg)] px-2.5 py-1 text-xs font-bold text-[var(--bs-emphasis-color)]">{value}</span>
      ) : (
        <div className="text-body-emphasis">{value}</div>
      )}
    </div>
  );
}

function LoadingState({ label }) {
  return (
    <div className="px-4 py-10 text-center text-[var(--bs-secondary-color)]">
      <div className="spinner-border text-primary mb-2" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
      <div>{label}</div>
    </div>
  );
}

function EmptyState({ label }) {
  return (
    <div className="px-4 py-10 text-center text-[var(--bs-secondary-color)]">
      <LogIcon />
      <div className="mt-2">{label}</div>
    </div>
  );
}

function getActionLabel(actionValue) {
  return AUDIT_ACTION_OPTIONS.find((action) => action.value === actionValue)?.label || actionValue;
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function WarningIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
  );
}

function LogIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M8 6h13"></path>
      <path d="M8 12h13"></path>
      <path d="M8 18h13"></path>
      <path d="M3 6h.01"></path>
      <path d="M3 12h.01"></path>
      <path d="M3 18h.01"></path>
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

function ChevronDoubleLeftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 17l-5-5 5-5" />
      <path d="M18 17l-5-5 5-5" />
    </svg>
  );
}

function ChevronDoubleRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 7l5 5-5 5" />
      <path d="M6 7l5 5-5 5" />
    </svg>
  );
}
