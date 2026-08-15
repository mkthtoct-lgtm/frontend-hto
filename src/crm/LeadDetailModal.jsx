import React, { useState, useEffect } from 'react';
import { LeadStatusBadge } from './LeadStatusBadge';
import { authFetch, getAuthHeaders } from '../auth/session';
import { API_BASE_URL } from '../config/api';
import Swal from 'sweetalert2';

const modalStyles = `
  @media (prefers-reduced-motion: no-preference) {
    .status-pulse {
      animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    @keyframes pulse-ring {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(0.8); }
    }
    .btn-workflow {
      transition: all 0.2s ease-in-out;
    }
    .btn-workflow:not(:disabled):hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }
    .btn-workflow:not(:disabled):active {
      transform: translateY(0);
    }
  }
`;

export const LeadDetailModal = ({ lead, onClose, onRefresh, currentUser }) => {
  const [localLead, setLocalLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [proofNote, setProofNote] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  // Reassign Modal State
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [reassignActionType, setReassignActionType] = useState('RELEASE');
  const [eligibleSales, setEligibleSales] = useState([]);
  const [selectedSaleId, setSelectedSaleId] = useState('');
  const [reassignReason, setReassignReason] = useState('');
  const [loadingSales, setLoadingSales] = useState(false);

  useEffect(() => {
    const fetchLeadDetail = async () => {
      try {
        setLoading(true);
        const res = await authFetch(`${API_BASE_URL}/course-leads/${lead._id}`, {
          headers: getAuthHeaders()
        });
        const result = await res.json();
        if (res.ok && result.success) {
          setLocalLead(result.data);
        } else {
          Swal.fire('Lỗi', 'Không thể tải chi tiết Lead', 'error');
          onClose();
        }
      } catch (err) {
        Swal.fire('Lỗi', 'Lỗi kết nối server', 'error');
        onClose();
      } finally {
        setLoading(false);
      }
    };
    if (lead?._id) {
      fetchLeadDetail();
    }
  }, [lead?._id, onClose]);

  const handleSubmitProof = async () => {
    if (!proofFile) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('proofFile', proofFile);
      if (proofNote) formData.append('note', proofNote);

      const res = await authFetch(`${API_BASE_URL}/course-leads/${localLead._id}/submit-proof`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData
      });
      const result = await res.json();

      if (res.ok && result.success) {
        setLocalLead(result.data);
        onRefresh();
        Swal.fire('Thành công', 'Đã nộp minh chứng thành công.', 'success');
        setProofFile(null);
        setProofNote('');
      } else {
        if (res.status === 403) Swal.fire('Từ chối truy cập', 'Bạn không có quyền nộp minh chứng.', 'error');
        else if (res.status === 409) Swal.fire('Không hợp lệ', result.message || 'Trạng thái Lead không cho phép.', 'warning');
        else Swal.fire('Lỗi', result.message || 'Có lỗi xảy ra', 'error');
      }
    } catch (err) {
      Swal.fire('Lỗi', 'Lỗi kết nối server.', 'error');
    }
    setSubmitting(false);
  };

  const hasPermission = (user, requiredPermission) => {
    const roleKey = String(user?.role?.name || user?.roleName || user?.role || "")
      .trim().toLowerCase().replace(/đ/g, "d").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
    if (roleKey === "admin" || user?.roleId === "69fc5af582ef85451120772a") return true;

    const permissions = Array.isArray(user?.permissions) ? user.permissions : [];
    return permissions.includes("*") || permissions.includes(requiredPermission);
  };

  const canArchive = hasPermission(currentUser, 'crm.course_leads.archive');
  const canRestore = hasPermission(currentUser, 'crm.course_leads.restore');
  const canDelete = hasPermission(currentUser, 'crm.course_leads.permanent_delete');
  const canAssign = hasPermission(currentUser, 'crm.course_leads.assign');
  const canRelease = hasPermission(currentUser, 'crm.course_leads.release');
  const canReassign = hasPermission(currentUser, 'crm.course_leads.reassign') || canRelease;
  const canProcess = hasPermission(currentUser, 'crm.course_leads.process');
  const canSubmitProof = hasPermission(currentUser, 'crm.course_leads.submit_proof');
  const canReviewProof = hasPermission(currentUser, 'crm.course_leads.review_proof');

  const handleAction = async (action, data = {}) => {
    setSubmitting(true);
    try {
      let endpoint = '';
      if (action === 'ASSIGN') endpoint = 'assign';
      else if (action === 'REASSIGN') endpoint = 'reassign';
      else if (action === 'PROCESS') endpoint = 'process';
      else if (action === 'APPROVE') endpoint = 'approve';
      else if (action === 'REJECT') endpoint = 'reject';

      const res = await authFetch(`${API_BASE_URL}/course-leads/${localLead._id}/${endpoint}`, {
        method: 'PATCH',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setLocalLead(result.data); // Update modal UI locally with full populated data
        onRefresh(); // Keep list updated in the background
        if (action === 'ASSIGN') {
          Swal.fire('Thành công', 'Đã nhận Lead thành công.', 'success');
        } else if (action === 'REASSIGN') {
          Swal.fire('Thành công', 'Thao tác Trả/Chuyển Lead thành công.', 'success');
          setShowReassignModal(false);
        } else if (action === 'PROCESS') {
          Swal.fire('Thành công', 'Bắt đầu xử lý Lead.', 'success');
        } else {
          Swal.fire('Thành công', 'Thao tác thành công.', 'success');
        }
      } else {
        if (res.status === 403) {
          Swal.fire('Từ chối truy cập', 'Bạn không có quyền thao tác.', 'error');
        } else if (res.status === 404) {
          Swal.fire('Lỗi', 'Không tìm thấy Lead.', 'error');
        } else if (res.status === 409) {
          Swal.fire('Không thể thực hiện', result.message || 'Trạng thái không hợp lệ', 'warning');
        } else if (res.status === 500) {
          Swal.fire('Lỗi', 'Lỗi máy chủ.', 'error');
        } else {
          Swal.fire('Lỗi', result.message || 'Có lỗi xảy ra', 'error');
        }
      }
    } catch (err) {
      Swal.fire('Lỗi', 'Lỗi kết nối server.', 'error');
    }
    setSubmitting(false);
  };

  const openReassignModal = async () => {
    setShowReassignModal(true);
    setReassignActionType('RELEASE');
    setSelectedSaleId('');
    setReassignReason('');

    // Fetch eligible sales
    setLoadingSales(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/course-leads/eligible-sales`, {
        headers: getAuthHeaders()
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setEligibleSales(result.data.filter(u => u._id !== currentUser.id));
      }
    } catch (err) {
      console.error(err);
    }
    setLoadingSales(false);
  };

  const handleArchive = async () => {
    const { value: reason } = await Swal.fire({
      title: 'Lưu trữ Lead',
      input: 'text',
      inputLabel: 'Nhập lý do lưu trữ (Spam, Dữ liệu test, Không liên lạc được...)',
      inputPlaceholder: 'Nhập lý do...',
      showCancelButton: true,
      confirmButtonText: 'Lưu trữ',
      cancelButtonText: 'Hủy',
      inputValidator: (value) => {
        if (!value) return 'Vui lòng nhập lý do!';
      }
    });

    if (!reason) return;

    setSubmitting(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/course-leads/${localLead._id}/archive`, {
        method: 'PATCH',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      if (res.ok) {
        Swal.fire('Thành công', 'Đã lưu trữ Lead', 'success');
        onRefresh();
        onClose();
      } else {
        const data = await res.json();
        Swal.fire('Lỗi', data.message || 'Có lỗi xảy ra', 'error');
      }
    } catch (err) { Swal.fire('Lỗi', 'Lỗi kết nối server', 'error'); }
    setSubmitting(false);
  };

  const handleRestore = async () => {
    const confirm = await Swal.fire({
      title: 'Khôi phục Lead',
      text: 'Bạn muốn khôi phục Lead này về danh sách đang hoạt động?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Khôi phục',
      cancelButtonText: 'Hủy'
    });

    if (!confirm.isConfirmed) return;

    setSubmitting(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/course-leads/${localLead._id}/restore`, {
        method: 'PATCH',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        Swal.fire('Thành công', 'Đã khôi phục Lead', 'success');
        onRefresh();
        onClose();
      } else {
        const data = await res.json();
        Swal.fire('Lỗi', data.message || 'Có lỗi xảy ra', 'error');
      }
    } catch (err) { Swal.fire('Lỗi', 'Lỗi kết nối server', 'error'); }
    setSubmitting(false);
  };

  const handlePermanentDelete = async () => {
    const step1 = await Swal.fire({
      title: 'CẢNH BÁO',
      text: 'Hành động này sẽ xoá vĩnh viễn Lead khỏi hệ thống và KHÔNG THỂ KHÔI PHỤC. Bạn có chắc chắn?',
      icon: 'error',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      confirmButtonText: 'Xoá vĩnh viễn',
      cancelButtonText: 'Hủy'
    });

    if (!step1.isConfirmed) return;

    let force = false;
    if (localLead.status === 'COMPLETED' && localLead.proofStatus === 'APPROVED') {
      const step2 = await Swal.fire({
        title: 'Lead ĐÃ ĐƯỢC DUYỆT KPI',
        text: 'Xoá Lead có thể ảnh hưởng báo cáo. Bạn CÓ THỰC SỰ CHẮC CHẮN muốn xoá vĩnh viễn?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        confirmButtonText: 'Vẫn xoá vĩnh viễn',
        cancelButtonText: 'Hủy'
      });
      if (!step2.isConfirmed) return;
      force = true;
    }

    setSubmitting(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/course-leads/${localLead._id}/permanent${force ? '?force=true' : ''}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok && data.success) {
        Swal.fire('Thành công', 'Xoá vĩnh viễn thành công', 'success');
        onRefresh();
        onClose();
      } else {
        Swal.fire('Lỗi', data.message || 'Có lỗi xảy ra', 'error');
      }
    } catch (err) { Swal.fire('Lỗi', 'Lỗi kết nối server', 'error'); }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-body text-center p-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3 text-body-secondary">Đang tải dữ liệu...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!localLead) return null;

  const isMyLead = localLead.assignedTo?._id === currentUser?.id || localLead.assignedTo === currentUser?.id;
  const isAdminOrLeader = hasPermission(currentUser, '*');
  const hasActionPower = isMyLead || isAdminOrLeader;
  const isKpiApproved = localLead.status === 'COMPLETED' && localLead.proofStatus === 'APPROVED';

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
      <style>{modalStyles}</style>
      <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '12px', overflow: 'hidden' }}>

          {/* HEADER (Sticky) */}
          <div className="modal-header bg-body-tertiary border-bottom d-flex flex-column align-items-start z-1">
            <div className="w-100 d-flex justify-content-between align-items-center mb-1">
              <h5 className="modal-title fw-bold text-body-emphasis mb-0" style={{ fontSize: '18px' }}>Chi tiết Course Lead</h5>
              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>
            <div className="text-body-secondary" style={{ fontSize: '14px' }}>
              <span className="fw-medium text-body-emphasis">{localLead.customerName}</span> — Quan tâm: <span className="fw-medium text-primary">{localLead.courseId?.name || 'Chưa rõ'}</span>
            </div>
          </div>

          {/* BODY (Scrollable) */}
          <div className="modal-body p-4 bg-body" style={{ overflowY: 'auto' }}>

            <div className="row g-4">
              {/* CUSTOMER INFORMATION */}
              <div className="col-12 col-md-6 d-flex flex-column">
                <h6 className="fw-bold mb-3 text-body-emphasis text-uppercase" style={{ fontSize: '13px', letterSpacing: '0.5px' }}>
                  <i className="fa fa-user me-2 text-primary"></i> Thông tin khách hàng
                </h6>
                <div className="card border-0 bg-body-tertiary shadow-sm flex-grow-1" style={{ borderRadius: '10px' }}>
                  <div className="card-body p-3">
                    <div className="mb-3">
                      <div className="text-body-secondary mb-1" style={{ fontSize: '12px' }}>Họ & Tên:</div>
                      <div className="fw-bold text-body-emphasis" style={{ fontSize: '15px' }}>{localLead.customerName}</div>
                    </div>
                    <div className="mb-3">
                      <div className="text-body-secondary mb-1" style={{ fontSize: '12px' }}>Số Điện Thoại:</div>
                      <div className="fw-medium text-body-emphasis" style={{ fontSize: '14px' }}>{localLead.phoneNumber}</div>
                    </div>
                    <div className="mb-3">
                      <div className="text-body-secondary mb-1" style={{ fontSize: '12px' }}>Email:</div>
                      <div className="fw-medium text-body-emphasis" style={{ fontSize: '14px' }}>{localLead.email || 'Không có'}</div>
                    </div>
                    <div>
                      <div className="text-body-secondary mb-1" style={{ fontSize: '12px' }}>Ghi chú từ khách:</div>
                      <div className="p-2 bg-body rounded border text-body-emphasis" style={{ fontSize: '13px', minHeight: '60px' }}>
                        {localLead.notes || localLead.note || 'Không có ghi chú'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* STATUS & ASSIGNMENT */}
              <div className="col-12 col-md-6 d-flex flex-column">
                <h6 className="fw-bold mb-3 text-body-emphasis text-uppercase" style={{ fontSize: '13px', letterSpacing: '0.5px' }}>
                  <i className="fa fa-info-circle me-2 text-info"></i> Trạng thái & Phân công
                </h6>
                <div className="card border-0 bg-body-tertiary shadow-sm flex-grow-1" style={{ borderRadius: '10px' }}>
                  <div className="card-body p-3">
                    <div className="mb-3 d-flex align-items-center justify-content-between">
                      <div className="text-body-secondary" style={{ fontSize: '12px' }}>Trạng thái:</div>
                      <div><LeadStatusBadge status={localLead.status} /></div>
                    </div>
                    <div className="mb-3">
                      <div className="text-body-secondary mb-1" style={{ fontSize: '12px' }}>Ngày tạo Lead:</div>
                      <div className="fw-medium text-body-emphasis" style={{ fontSize: '14px' }}>
                        {new Date(localLead.createdAt).toLocaleString('vi-VN')}
                      </div>
                    </div>
                    <div className="pt-3 mt-3 border-top">
                      <h6 className="fw-bold text-body-emphasis text-uppercase mb-3" style={{ fontSize: '12px', letterSpacing: '0.5px' }}>Sale phụ trách:</h6>
                      {localLead.assignedTo ? (
                        <div>
                          <div className="mb-3">
                            <div className="text-body-secondary mb-1" style={{ fontSize: '12px' }}>Họ & Tên:</div>
                            <div className="fw-bold text-body-emphasis" style={{ fontSize: '15px' }}>
                              {localLead.assignedTo.fullName || localLead.assignedTo.name || 'Chưa cập nhật'}
                            </div>
                          </div>
                          <div className="mb-3">
                            <div className="text-body-secondary mb-1" style={{ fontSize: '12px' }}>Email:</div>
                            <div className="fw-medium text-body-emphasis" style={{ fontSize: '14px' }}>
                              {localLead.assignedTo.email || 'Chưa cập nhật'}
                            </div>
                          </div>
                          <div className="mb-2">
                            <div className="text-body-secondary mb-1" style={{ fontSize: '12px' }}>Số Điện Thoại:</div>
                            <div className="fw-medium text-body-emphasis" style={{ fontSize: '14px' }}>
                              {localLead.assignedTo.phone || 'Chưa cập nhật'}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="fw-medium text-danger" style={{ fontSize: '14px' }}>Chưa phân công</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* PROCESS HISTORY (TIMELINE) */}
              <div className="col-12">
                <h6 className="fw-bold mb-3 text-body-emphasis text-uppercase" style={{ fontSize: '13px', letterSpacing: '0.5px' }}>
                  <i className="fa fa-history me-2 text-warning"></i> Lịch sử xử lý
                </h6>
                <div className="card border-0 bg-body-tertiary shadow-sm" style={{ borderRadius: '10px' }}>
                  <div className="card-body p-4">
                    {(!localLead.history || localLead.history.length === 0) ? (
                      <div className="text-center py-3 text-body-secondary">
                        <i className="fa fa-clock-o fs-3 mb-2 opacity-50"></i>
                        <p className="mb-0" style={{ fontSize: '14px' }}>Không có dữ liệu lịch sử.</p>
                      </div>
                    ) : (
                      <div className="timeline-container ps-2" style={{ borderLeft: '2px solid var(--bs-border-color)', position: 'relative' }}>
                        {localLead.history.map((h, i) => (
                          <div key={h._id || i} className="timeline-item mb-4 position-relative ps-4">
                            <span className="position-absolute bg-primary rounded-circle" style={{ width: '12px', height: '12px', left: '-7px', top: '4px', border: '2px solid var(--bs-body-bg)' }}></span>

                            <div className="d-flex flex-wrap align-items-baseline mb-1">
                              <span className="fw-bold text-body-emphasis me-2" style={{ fontSize: '14px' }}>
                                {(h.toStatus === 'NEW' && (h.fromStatus === 'ASSIGNED' || h.fromStatus === 'PROCESSING')) ? 'Trả Lead' :
                                  (h.toStatus === 'ASSIGNED' && h.fromStatus === 'NEW') ? 'Nhận Lead' :
                                    (h.toStatus === 'ASSIGNED' && (h.fromStatus === 'ASSIGNED' || h.fromStatus === 'PROCESSING')) ? 'Chuyển Lead' :
                                      h.toStatus === 'PROCESSING' ? 'Bắt đầu tư vấn' :
                                        h.toStatus === 'COMPLETED_PENDING_PROOF' ? 'Gửi minh chứng' : 'Cập nhật'}
                              </span>
                              <span className="text-body-secondary" style={{ fontSize: '12px' }}>
                                ● {new Date(h.createdAt).toLocaleString('vi-VN')}
                              </span>
                            </div>

                            <div className="text-primary mb-1" style={{ fontSize: '13px', fontWeight: '500' }}>
                              {h.changedBy?.fullName || h.changedBy?.email || 'Hệ thống'}
                            </div>

                            {h.reason && (
                              <div className="mt-2 p-2 bg-body rounded text-body-secondary border" style={{ fontSize: '13px' }}>
                                <strong>Lý do: </strong>{h.reason}
                              </div>
                            )}
                            {h.note && (
                              <div className="mt-1 text-body-tertiary" style={{ fontSize: '12px', fontStyle: 'italic' }}>
                                {h.note}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* PROOF / KPI (Nộp minh chứng) */}
              {(localLead.status === 'PROCESSING' || localLead.status === 'COMPLETED_PENDING_PROOF' || localLead.status === 'COMPLETED') && (
                <div className="col-12">
                  <h6 className="fw-bold mb-3 text-body-emphasis text-uppercase" style={{ fontSize: '13px', letterSpacing: '0.5px' }}>
                    <i className="fa fa-shield me-2 text-success"></i> Minh chứng KPI
                  </h6>
                  <div className="card border-0 bg-body-tertiary shadow-sm" style={{ borderRadius: '10px' }}>
                    <div className="card-body p-4">

                      {/* Trạng thái duyệt KPI */}
                      <div className="mb-3 d-flex align-items-center">
                        <span className="me-2 text-body-secondary" style={{ fontSize: '13px' }}>Trạng thái KPI:</span>
                        {localLead.proofStatus === 'APPROVED' ? <span className="badge bg-success">Đã duyệt</span> :
                          localLead.proofStatus === 'REJECTED' ? <span className="badge bg-danger">Từ chối</span> :
                            localLead.proofStatus === 'PENDING' ? <span className="badge bg-warning text-dark">Chờ duyệt</span> :
                              <span className="badge bg-secondary">Chưa nộp</span>}
                      </div>

                      {/* Hiển thị link đã nộp nếu có */}
                      {localLead.proofFiles && localLead.proofFiles.length > 0 && (
                        <div className="mb-4">
                          <p className="mb-2 text-body-secondary" style={{ fontSize: '13px' }}>Các tệp minh chứng đã nộp:</p>
                          <div className="d-flex flex-wrap gap-2">
                            {localLead.proofFiles.map((file, idx) => (
                              <a key={idx} href={file.includes('http') ? file : `https://drive.google.com/file/d/${file}/view`} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-primary">
                                <i className="fa fa-external-link me-1"></i> Xem tệp {idx + 1}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Form nộp minh chứng cho Sale */}
                      {localLead.status === 'PROCESSING' && hasActionPower && canSubmitProof && (
                        <div className="mt-3 pt-3 border-top">
                          <p className="fw-bold text-body-emphasis mb-2" style={{ fontSize: '14px' }}>Nộp / Cập nhật minh chứng mới</p>
                          <div className="row g-2">
                            <div className="col-12 col-md-6">
                              <input
                                type="file"
                                className="form-control form-control-sm"
                                accept="image/jpeg, image/png, image/webp"
                                onChange={e => setProofFile(e.target.files[0])}
                              />
                            </div>
                            <div className="col-12 col-md-6">
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                placeholder="Ghi chú minh chứng (Số tiền đã cọc, tình trạng...)"
                                value={proofNote}
                                onChange={e => setProofNote(e.target.value)}
                              />
                            </div>
                            <div className="col-12">
                              <button
                                className="btn btn-success btn-sm fw-medium"
                                disabled={submitting || !proofFile}
                                onClick={handleSubmitProof}
                              >
                                <i className="fa fa-upload me-1"></i> Nộp minh chứng
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Leader: Duyệt/Từ chối KPI */}
                      {localLead.status === 'COMPLETED_PENDING_PROOF' && canReviewProof && (
                        <div className="mt-3 pt-3 border-top">
                          <p className="fw-bold text-body-emphasis mb-2" style={{ fontSize: '14px' }}>Quản lý (Leader) duyệt KPI</p>
                          <div className="row g-2 align-items-center">
                            <div className="col-12 col-md-8">
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                placeholder="Lý do từ chối (nếu có)"
                                value={rejectReason}
                                onChange={e => setRejectReason(e.target.value)}
                              />
                            </div>
                            <div className="col-12 col-md-4 d-flex justify-content-end gap-2">
                              <button
                                className="btn btn-danger btn-sm fw-medium"
                                disabled={submitting || !rejectReason}
                                onClick={() => handleAction('REJECT', { note: rejectReason })}
                              >
                                Từ chối
                              </button>
                              <button
                                className="btn btn-success btn-sm fw-medium"
                                disabled={submitting}
                                onClick={() => handleAction('APPROVE', { note: 'Leader duyệt KPI' })}
                              >
                                Duyệt KPI
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ACTION FOOTER */}
          <div className="modal-footer bg-body-tertiary border-top d-flex flex-wrap flex-lg-nowrap justify-content-between align-items-center py-3 gap-2" style={{ borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>

            {/* Administrative Actions */}
            <div className="d-flex flex-wrap flex-lg-nowrap gap-2">
              <button type="button" className="btn btn-secondary fw-medium border px-3" onClick={onClose} disabled={submitting}>
                Đóng
              </button>

              {!localLead.isArchived && canArchive && (
                <button type="button" className="btn btn-outline-secondary fw-medium" onClick={handleArchive} disabled={submitting}>
                  🗄 Lưu trữ
                </button>
              )}

              {localLead.isArchived && canRestore && (
                <button type="button" className="btn btn-outline-success fw-medium" onClick={handleRestore} disabled={submitting}>
                  <i className="fa fa-undo me-1"></i> Khôi phục
                </button>
              )}

              {canDelete && !isKpiApproved && (
                <button type="button" className="btn btn-outline-danger fw-medium" onClick={handlePermanentDelete} disabled={submitting}>
                  🗑 Xóa vĩnh viễn
                </button>
              )}
            </div>

            {/* Workflow Actions */}
            <div className="d-flex flex-wrap flex-lg-nowrap gap-2">
              {localLead.status === 'NEW' && canAssign && (
                <button
                  className="btn btn-primary btn-workflow fw-medium px-4 shadow-sm d-inline-flex align-items-center"
                  disabled={submitting}
                  onClick={() => handleAction('ASSIGN')}
                >
                  <i className="fa fa-user me-2"></i> Nhận tư vấn
                </button>
              )}

              {localLead.status === 'ASSIGNED' && (
                <>
                  {hasActionPower && (
                    <>
                      {canReassign && (
                        <button
                          className="btn btn-outline-secondary btn-workflow fw-medium px-4 d-inline-flex align-items-center"
                          disabled={submitting}
                          onClick={openReassignModal}
                        >
                          <i className="fa fa-reply me-2"></i> Trả / Chuyển
                        </button>
                      )}
                      {canProcess && (
                        <button
                          className="btn btn-warning btn-workflow fw-medium px-4 shadow-sm d-inline-flex align-items-center"
                          disabled={submitting}
                          onClick={() => handleAction('PROCESS', { note: 'Bắt đầu liên hệ tư vấn' })}
                        >
                          <i className="fa fa-play me-2"></i> Bắt đầu tư vấn
                        </button>
                      )}
                    </>
                  )}
                  <div
                    className="d-flex align-items-center bg-secondary bg-opacity-10 text-secondary-emphasis fw-medium px-4 rounded border border-secondary"
                    style={{ height: '38px', cursor: 'default' }}
                  >
                    <i className="fa fa-user-check me-2"></i> Đã phân công
                  </div>
                </>
              )}

              {localLead.status === 'PROCESSING' && (
                <>
                  {canReassign && hasActionPower && (
                    <button
                      className="btn btn-outline-secondary btn-workflow fw-medium px-4 d-inline-flex align-items-center"
                      disabled={submitting}
                      onClick={openReassignModal}
                    >
                      <i className="fa fa-reply me-2"></i> Trả / Chuyển
                    </button>
                  )}
                  <div
                    className="d-flex align-items-center bg-info bg-opacity-10 text-info fw-medium px-4 rounded border border-info"
                    style={{ height: '38px', cursor: 'default' }}
                  >
                    <i className="fa fa-circle me-2 status-pulse" style={{ fontSize: '10px' }}></i> Đang tư vấn
                  </div>
                </>
              )}

              {localLead.status === 'COMPLETED_PENDING_PROOF' && (
                <div
                  className="d-flex align-items-center bg-warning bg-opacity-10 text-warning-emphasis fw-medium px-4 rounded border border-warning"
                  style={{ height: '38px', cursor: 'default' }}
                >
                  <i className="fa fa-hourglass-half me-2"></i> Chờ duyệt
                </div>
              )}

              {localLead.status === 'COMPLETED' && (
                <div
                  className="d-flex align-items-center bg-success bg-opacity-10 text-success fw-medium px-4 rounded border border-success"
                  style={{ height: '38px', cursor: 'default' }}
                >
                  <i className="fa fa-check me-2"></i> Hoàn thành
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* REASSIGN MODAL */}
      {showReassignModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '12px' }}>
              <div className="modal-header border-bottom">
                <h6 className="modal-title fw-bold text-body-emphasis">Xử lý lại người phụ trách</h6>
                <button type="button" className="btn-close" onClick={() => setShowReassignModal(false)}></button>
              </div>
              <div className="modal-body p-4 bg-body">
                <div className="mb-3">
                  <label className="form-label fw-medium text-body-emphasis" style={{ fontSize: '14px' }}>Tùy chọn xử lý</label>
                  <div className="d-flex gap-3">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        id="radioRelease"
                        name="reassignType"
                        checked={reassignActionType === 'RELEASE'}
                        onChange={() => setReassignActionType('RELEASE')}
                      />
                      <label className="form-check-label text-body-secondary" htmlFor="radioRelease">
                        Trả về hàng chờ chung
                      </label>
                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        id="radioReassign"
                        name="reassignType"
                        checked={reassignActionType === 'REASSIGN'}
                        onChange={() => setReassignActionType('REASSIGN')}
                      />
                      <label className="form-check-label text-body-secondary" htmlFor="radioReassign">
                        Chuyển cho Sale khác
                      </label>
                    </div>
                  </div>
                </div>

                {reassignActionType === 'REASSIGN' && (
                  <div className="mb-3">
                    <label className="form-label fw-medium text-body-emphasis" style={{ fontSize: '14px' }}>Chọn Sale nhận bàn giao</label>
                    {loadingSales ? (
                      <div className="text-body-secondary" style={{ fontSize: '13px' }}>Đang tải danh sách...</div>
                    ) : (
                      <select
                        className="form-select"
                        value={selectedSaleId}
                        onChange={(e) => setSelectedSaleId(e.target.value)}
                      >
                        <option value="">-- Chọn nhân viên Sale --</option>
                        {eligibleSales.map(sale => (
                          <option key={sale._id} value={sale._id}>
                            {sale.fullName || sale.email} {sale.phone ? `(${sale.phone})` : ''}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                <div className="mb-3">
                  <label className="form-label fw-medium text-body-emphasis" style={{ fontSize: '14px' }}>Lý do (Bắt buộc)</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="Nhập lý do trả/chuyển Lead (Case khó, sai thông tin...)"
                    value={reassignReason}
                    onChange={(e) => setReassignReason(e.target.value)}
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer border-top d-flex gap-2">
                <button
                  className="btn btn-secondary fw-medium px-4"
                  onClick={() => setShowReassignModal(false)}
                  disabled={submitting}
                >
                  Hủy
                </button>
                <button
                  className="btn btn-primary fw-medium px-4"
                  disabled={submitting || !reassignReason.trim() || (reassignActionType === 'REASSIGN' && !selectedSaleId)}
                  onClick={() => handleAction('REASSIGN', {
                    actionType: reassignActionType,
                    targetUserId: selectedSaleId,
                    reason: reassignReason.trim()
                  })}
                >
                  {submitting ? 'Đang xử lý...' : 'Xác nhận'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
