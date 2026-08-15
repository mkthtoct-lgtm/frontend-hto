import React, { useState, useEffect, useRef } from 'react';
import { authFetch, getAuthHeaders } from '../auth/session';
import { API_BASE_URL } from '../config/api';
import { LeadStatusBadge } from './LeadStatusBadge';
import { LeadDetailModal } from './LeadDetailModal';
import Swal from 'sweetalert2';

export const CrmLeadsPage = ({ currentUser, theme }) => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const selectAllRef = useRef(null);
  
  const hasPermission = (user, requiredPermission) => {
    const roleKey = String(user?.role?.name || user?.roleName || user?.role || "")
      .trim().toLowerCase().replace(/đ/g, "d").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
    if (roleKey === "admin" || user?.roleId === "69fc5af582ef85451120772a") return true;

    const permissions = Array.isArray(user?.permissions) ? user.permissions : [];
    return permissions.includes("*") || permissions.includes(requiredPermission);
  };
  
  const canArchive = hasPermission(currentUser, 'crm.course_leads.archive');
  const canDelete = hasPermission(currentUser, 'crm.course_leads.permanent_delete');

  const fetchLeads = async () => {
    setLoading(true);
    try {
      // Build query string
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (searchQuery) params.append('search', searchQuery);
      if (showArchived) params.append('isArchived', 'true');
      
      const res = await authFetch(`${API_BASE_URL}/course-leads?${params.toString()}`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setLeads(data.data || []);
      }
    } catch (err) {
      console.error('Lỗi khi fetch leads', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLeads();
    setSelectedIds([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, showArchived]);

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = selectedIds.length > 0 && selectedIds.length < leads.length;
    }
  }, [selectedIds, leads]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchLeads();
  };

  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(leads.map(l => l._id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelectOne = (e, id) => {
    e.stopPropagation();
    if (e.target.checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(item => item !== id));
    }
  };

  const handleBulkArchive = async () => {
    const result = await Swal.fire({
      title: 'Lưu trữ Lead',
      text: `Bạn có chắc muốn Archive ${selectedIds.length} Lead đã chọn?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ffc107',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Đồng ý',
      cancelButtonText: 'Hủy'
    });
    
    if (!result.isConfirmed) return;

    try {
      const res = await authFetch(`${API_BASE_URL}/course-leads/bulk/archive`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ids: selectedIds, reason: 'Archive hàng loạt' })
      });
      if (res.ok) {
        Swal.fire('Thành công', 'Đã Archive Lead thành công', 'success');
        setSelectedIds([]);
        fetchLeads();
      }
    } catch (err) {
      console.error(err);
      Swal.fire('Lỗi', 'Không thể Archive', 'error');
    }
  };

  const handleBulkRestore = async () => {
    const result = await Swal.fire({
      title: 'Khôi phục Lead',
      text: `Bạn có chắc muốn khôi phục ${selectedIds.length} Lead đã chọn?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Khôi phục',
      cancelButtonText: 'Hủy'
    });
    
    if (!result.isConfirmed) return;

    try {
      const res = await authFetch(`${API_BASE_URL}/course-leads/bulk/restore`, {
        method: 'PATCH',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds })
      });
      if (res.ok) {
        Swal.fire('Thành công', 'Đã Khôi phục Lead thành công', 'success');
        setSelectedIds([]);
        fetchLeads();
      }
    } catch (err) {
      console.error(err);
      Swal.fire('Lỗi', 'Không thể Khôi phục', 'error');
    }
  };

  const handleBulkPermanentDelete = async () => {
    // Bước 1
    const step1 = await Swal.fire({
      title: `Xóa vĩnh viễn ${selectedIds.length} Lead?`,
      text: "Dữ liệu sau khi xóa sẽ không thể khôi phục.",
      icon: 'error',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Xóa vĩnh viễn',
      cancelButtonText: 'Hủy'
    });
    if (!step1.isConfirmed) return;

    // Bước 2
    const step2 = await Swal.fire({
      title: 'Xác nhận lần cuối',
      text: `Bạn thật sự muốn xóa ${selectedIds.length} Lead này?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Xác nhận xóa',
      cancelButtonText: 'Hủy'
    });
    if (!step2.isConfirmed) return;
    
    try {
      const res = await authFetch(`${API_BASE_URL}/course-leads/bulk/permanent`, {
        method: 'DELETE',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds })
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        Swal.fire(
          'Thành công!',
          `Đã xóa thành công ${data.deletedCount} Lead.`,
          'success'
        );
        setSelectedIds([]);
        fetchLeads();
      } else if (res.ok && !data.success) {
        // Có lỗi (như vướng KPI)
        let msg = `Đã xóa ${data.deletedCount} Lead.<br/>`;
        if (data.failedCount > 0) {
          msg += `<b>${data.failedCount} Lead không thể xóa</b> vì đã được duyệt KPI hoặc lỗi.`;
        }
        Swal.fire({
          title: 'Kết quả xóa',
          html: msg,
          icon: 'warning'
        });
        setSelectedIds([]);
        fetchLeads();
      } else {
        Swal.fire('Lỗi', data.message || 'Có lỗi xảy ra từ máy chủ', 'error');
      }
    } catch (err) {
      console.error(err);
      Swal.fire('Lỗi', 'Đã xảy ra sự cố mạng', 'error');
    }
  };

  // KPIs
  const totalLeads = leads.length;
  const newLeads = leads.filter(l => l.status === 'NEW').length;
  const processingLeads = leads.filter(l => l.status === 'PROCESSING' || l.status === 'ASSIGNED').length;
  const kpiSuccess = leads.filter(l => l.status === 'APPROVED').length;

  return (
    <div className="container-fluid pt-3 pb-4" style={{ maxWidth: "1600px" }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1 text-body-emphasis">Quản lý Course Leads</h4>
          <p className="text-body-secondary mb-0" style={{ fontSize: '14px' }}>
            {canDelete ? 'Quản lý toàn bộ yêu cầu tư vấn khóa học' : 'Danh sách khách hàng bạn đang tư vấn'}
          </p>
        </div>
        <button className="btn btn-primary d-flex align-items-center gap-2" onClick={fetchLeads}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
            <path d="M3 3v5h5"></path>
          </svg>
          Làm mới
        </button>
      </div>

      {/* KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card border-0 bg-primary-subtle text-primary-emphasis h-100 rounded-3">
            <div className="card-body">
              <h6 className="fw-bold mb-2 opacity-75">TỔNG LEADS</h6>
              <h2 className="fw-bold mb-0">{totalLeads}</h2>
            </div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card border-0 bg-info-subtle text-info-emphasis h-100 rounded-3">
            <div className="card-body">
              <h6 className="fw-bold mb-2 opacity-75">LEAD MỚI (CHƯA NHẬN)</h6>
              <h2 className="fw-bold mb-0">{newLeads}</h2>
            </div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card border-0 bg-warning-subtle text-warning-emphasis h-100 rounded-3">
            <div className="card-body">
              <h6 className="fw-bold mb-2 opacity-75">ĐANG TƯ VẤN</h6>
              <h2 className="fw-bold mb-0">{processingLeads}</h2>
            </div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card border-0 bg-success-subtle text-success-emphasis h-100 rounded-3">
            <div className="card-body">
              <h6 className="fw-bold mb-2 opacity-75">KPI THÀNH CÔNG</h6>
              <h2 className="fw-bold mb-0">{kpiSuccess}</h2>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Table */}
      <div className="card border-0 shadow-sm rounded-3">
        <div className="card-header bg-transparent border-bottom p-3">
          <form className="row g-2 align-items-center" onSubmit={handleSearch}>
            <div className="col-12 col-md-4">
              <input 
                type="text" 
                className="form-control" 
                placeholder="Tìm SĐT hoặc Tên KH..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="col-12 col-md-3">
              <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="">Tất cả trạng thái</option>
                <option value="NEW">Mới (Chưa ai nhận)</option>
                <option value="ASSIGNED">Đã phân công</option>
                <option value="PROCESSING">Đang tư vấn</option>
                <option value="SUBMITTED_PROOF">Chờ duyệt minh chứng</option>
                <option value="APPROVED">Thành công (Đã duyệt KPI)</option>
                <option value="REJECTED">Từ chối / Fail</option>
                <option value="SPAM">Spam / Không hợp lệ</option>
              </select>
            </div>
            <div className="col-12 col-md-3 d-flex align-items-center">
              <div className="form-check form-switch ms-2">
                <input className="form-check-input" type="checkbox" id="showArchivedSwitch" checked={showArchived} onChange={e => setShowArchived(e.target.checked)} />
                <label className="form-check-label text-body-secondary small ms-1" htmlFor="showArchivedSwitch">Hiện lưu trữ</label>
              </div>
            </div>
            <div className="col-12 col-md-2">
              <button type="submit" className="btn btn-secondary w-100">Tìm kiếm</button>
            </div>
          </form>
        </div>
        <div className="card-body p-0 table-responsive">
          {selectedIds.length > 0 && (
            <div className="bg-warning-subtle py-2 px-3 d-flex align-items-center justify-content-between border-bottom">
              <span className="fw-medium text-warning-emphasis">Đã chọn {selectedIds.length} Lead</span>
              <div className="d-flex gap-2">
                {!showArchived && canArchive && (
                  <button className="btn btn-sm btn-warning fw-bold text-dark" onClick={handleBulkArchive}>
                    <i className="fa fa-archive me-1"></i> Archive
                  </button>
                )}
                {showArchived && canArchive && (
                  <button className="btn btn-sm btn-success fw-bold text-light" onClick={handleBulkRestore}>
                    <i className="fa fa-undo me-1"></i> Khôi phục
                  </button>
                )}
                {canDelete && (
                  <button className="btn btn-sm btn-danger fw-bold" onClick={handleBulkPermanentDelete}>
                    <i className="fa fa-trash me-1"></i> Xóa vĩnh viễn
                  </button>
                )}
              </div>
            </div>
          )}
          {loading ? (
            <div className="text-center p-5 text-body-secondary">Đang tải dữ liệu...</div>
          ) : leads.length === 0 ? (
            <div className="text-center p-5 text-body-secondary">Không tìm thấy Lead nào.</div>
          ) : (
            <table className="table table-hover align-middle mb-0" style={{ fontSize: '14px' }}>
              <thead className="table-light">
                <tr>
                  <th className="ps-3 py-3" style={{ width: '50px' }}>
                    <input 
                      type="checkbox" 
                      className="form-check-input" 
                      style={{ width: '20px', height: '20px', cursor: 'pointer', border: '2px solid #adb5bd' }}
                      ref={selectAllRef}
                      checked={selectedIds.length === leads.length && leads.length > 0} 
                      onChange={toggleSelectAll} 
                    />
                  </th>
                  <th className="py-3">Khách hàng</th>
                  <th className="py-3">Liên hệ</th>
                  <th className="py-3">Khóa học</th>
                  <th className="py-3">Sale phụ trách</th>
                  <th className="py-3">Trạng thái</th>
                  <th className="py-3 text-end pe-3">Ngày đăng ký</th>
                </tr>
              </thead>
              <tbody>
                {leads.map(lead => (
                  <tr key={lead._id} className={lead.isArchived ? 'opacity-75 bg-light' : ''} style={{ cursor: 'pointer' }} onClick={() => setSelectedLead(lead)}>
                    <td className="ps-3" onClick={e => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        className="form-check-input" 
                        style={{ width: '20px', height: '20px', cursor: 'pointer', border: '2px solid #adb5bd' }}
                        checked={selectedIds.includes(lead._id)} 
                        onChange={(e) => toggleSelectOne(e, lead._id)} 
                      />
                    </td>
                    <td>
                      <div className="fw-bold text-body-emphasis">
                        {lead.customerName}
                        {lead.isArchived && <span className="badge bg-secondary ms-2 small">Archived</span>}
                      </div>
                    </td>
                    <td>
                      <div>{lead.phoneNumber}</div>
                      <div className="text-body-secondary" style={{ fontSize: '12px' }}>{lead.email}</div>
                    </td>
                    <td>
                      <div className="text-truncate" style={{ maxWidth: '200px' }}>
                        {lead.courseId?.name || '---'}
                      </div>
                    </td>
                    <td>
                      {lead.assignedTo ? (
                        <div className="fw-medium">{lead.assignedTo.fullName || lead.assignedTo.email}</div>
                      ) : (
                        <span className="text-body-secondary fst-italic">Chưa có</span>
                      )}
                    </td>
                    <td>
                      <LeadStatusBadge status={lead.status} />
                    </td>
                    <td className="text-end pe-3 text-body-secondary" style={{ fontSize: '13px' }}>
                      {new Date(lead.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal Chi tiết */}
      {selectedLead && (
        <LeadDetailModal 
          lead={selectedLead} 
          currentUser={currentUser} 
          onClose={() => setSelectedLead(null)} 
          onRefresh={fetchLeads} 
        />
      )}
    </div>
  );
};
