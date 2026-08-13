import React, { useState } from 'react';
import { LeadStatusBadge } from './LeadStatusBadge';
import { authFetch, getAuthHeaders } from '../auth/session';
import { API_BASE_URL } from '../config/api';

export const LeadDetailModal = ({ lead, onClose, onRefresh, currentUser }) => {
  const [submitting, setSubmitting] = useState(false);
  const [proofNote, setProofNote] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  
  if (!lead) return null;

  const isSale = currentUser?.role === 'nhansu' || currentUser?.role === 'staff' || currentUser?.role === 'congtacvien';
  const isLeader = currentUser?.role === 'admin' || currentUser?.role === 'bangiamdoc' || currentUser?.role === 'truongbophan';

  const handleAction = async (action, data = {}) => {
    setSubmitting(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/course-leads/${lead._id}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ action, ...data })
      });
      const result = await res.json();
      if (res.ok && result.success) {
        onRefresh();
        onClose();
      } else {
        alert(result.message || 'Có lỗi xảy ra');
      }
    } catch (err) {
      alert('Lỗi kết nối server');
    }
    setSubmitting(false);
  };

  const handleArchive = async () => {
    const reason = window.prompt("Nhập lý do lưu trữ (Spam, Dữ liệu test, Không liên lạc được...):");
    if (reason === null) return;
    setSubmitting(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/course-leads/${lead._id}/archive`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ reason })
      });
      if (res.ok) {
        onRefresh();
        onClose();
      } else {
        const data = await res.json();
        alert(data.message || 'Có lỗi xảy ra');
      }
    } catch (err) { alert('Lỗi kết nối server'); }
    setSubmitting(false);
  };

  const handleRestore = async () => {
    if (!window.confirm("Bạn muốn khôi phục Lead này về danh sách đang hoạt động?")) return;
    setSubmitting(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/course-leads/${lead._id}/restore`, {
        method: 'PATCH',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        onRefresh();
        onClose();
      } else {
        const data = await res.json();
        alert(data.message || 'Có lỗi xảy ra');
      }
    } catch (err) { alert('Lỗi kết nối server'); }
    setSubmitting(false);
  };

  const handlePermanentDelete = async () => {
    if (!window.confirm("CẢNH BÁO: Hành động này sẽ xoá vĩnh viễn Lead khỏi hệ thống và KHÔNG THỂ KHÔI PHỤC. Bạn có chắc chắn?")) return;
    
    let force = false;
    if (lead.status === 'COMPLETED' && lead.proofStatus === 'APPROVED') {
      if (!window.confirm("Lead này ĐÃ ĐƯỢC DUYỆT KPI. Xoá Lead có thể ảnh hưởng báo cáo. Bạn CÓ THỰC SỰ CHẮC CHẮN muốn xoá vĩnh viễn?")) return;
      force = true;
    }

    setSubmitting(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/course-leads/${lead._id}/permanent${force ? '?force=true' : ''}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('Xoá vĩnh viễn thành công');
        onRefresh();
        onClose();
      } else {
        alert(data.message || 'Có lỗi xảy ra');
      }
    } catch (err) { alert('Lỗi kết nối server'); }
    setSubmitting(false);
  };

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content border-0 shadow-lg">
          <div className="modal-header border-bottom-0 pb-0">
            <h5 className="modal-title fw-bold text-body-emphasis">Chi tiết Course Lead</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="row g-3">
              {/* Thông tin khách hàng */}
              <div className="col-12 col-md-6">
                <div className="card h-100 border-0 bg-body-tertiary">
                  <div className="card-body">
                    <h6 className="fw-bold mb-3 text-primary">Thông tin Khách hàng</h6>
                    <p className="mb-1 text-body-secondary" style={{ fontSize: '13px' }}>Họ tên:</p>
                    <p className="fw-medium text-body-emphasis">{lead.customerName}</p>
                    
                    <p className="mb-1 text-body-secondary mt-2" style={{ fontSize: '13px' }}>Số điện thoại:</p>
                    <p className="fw-medium text-body-emphasis">{lead.phoneNumber}</p>
                    
                    <p className="mb-1 text-body-secondary mt-2" style={{ fontSize: '13px' }}>Email:</p>
                    <p className="fw-medium text-body-emphasis">{lead.email || 'Không có'}</p>
                    
                    <p className="mb-1 text-body-secondary mt-2" style={{ fontSize: '13px' }}>Ghi chú từ khách:</p>
                    <p className="fw-medium text-body-emphasis bg-body rounded p-2 border" style={{ fontSize: '13px' }}>{lead.note || 'Không có ghi chú'}</p>
                  </div>
                </div>
              </div>

              {/* Thông tin Khóa học & Trạng thái */}
              <div className="col-12 col-md-6">
                <div className="card h-100 border-0 bg-body-tertiary">
                  <div className="card-body">
                    <h6 className="fw-bold mb-3 text-primary">Trạng thái & Phân công</h6>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <span className="text-body-secondary" style={{ fontSize: '13px' }}>Trạng thái hiện tại:</span>
                      <LeadStatusBadge status={lead.status} />
                    </div>
                    
                    <p className="mb-1 text-body-secondary" style={{ fontSize: '13px' }}>Khóa học quan tâm:</p>
                    <p className="fw-bold text-body-emphasis">{lead.courseId?.name || 'Khóa học không xác định'}</p>
                    
                    <p className="mb-1 text-body-secondary mt-3" style={{ fontSize: '13px' }}>Sale phụ trách:</p>
                    <p className="fw-medium text-body-emphasis">
                      {lead.assignedTo ? lead.assignedTo.fullName || lead.assignedTo.email : 'Chưa phân công'}
                    </p>

                    <p className="mb-1 text-body-secondary mt-3" style={{ fontSize: '13px' }}>Ngày tạo Lead:</p>
                    <p className="fw-medium text-body-emphasis" style={{ fontSize: '13px' }}>
                      {new Date(lead.createdAt).toLocaleString('vi-VN')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Timeline Lịch sử */}
              <div className="col-12">
                <div className="card border-0">
                  <div className="card-body px-0">
                    <h6 className="fw-bold mb-3 text-body-emphasis">Lịch sử xử lý</h6>
                    {(!lead.history || lead.history.length === 0) ? (
                      <p className="text-body-secondary" style={{ fontSize: '13px' }}>Chưa có lịch sử xử lý.</p>
                    ) : (
                      <div className="timeline ps-3" style={{ borderLeft: '2px solid var(--bs-border-color)' }}>
                        {lead.history.map((h, i) => (
                          <div key={h._id || i} className="position-relative mb-3 ps-3">
                            <span className="position-absolute bg-primary rounded-circle" style={{ width: '10px', height: '10px', left: '-22px', top: '4px' }}></span>
                            <div className="d-flex justify-content-between align-items-start mb-1">
                              <span className="fw-bold text-body-emphasis" style={{ fontSize: '13px' }}>
                                {h.action}
                              </span>
                              <span className="text-body-secondary" style={{ fontSize: '11px' }}>
                                {new Date(h.createdAt).toLocaleString('vi-VN')}
                              </span>
                            </div>
                            <p className="mb-0 text-body-secondary" style={{ fontSize: '12px' }}>
                              Bởi: {h.actorId?.fullName || h.actorId?.email || 'Hệ thống'}
                            </p>
                            {h.note && (
                              <p className="mb-0 mt-1 bg-body-tertiary rounded p-2 text-body" style={{ fontSize: '12px', borderLeft: '3px solid var(--bs-primary)' }}>
                                {h.note}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="modal-footer border-top-0 bg-body-tertiary rounded-bottom d-flex flex-wrap align-items-center">
            {/* CÁC NÚT QUẢN TRỊ DỮ LIỆU */}
            <div className="d-flex flex-wrap gap-2 me-auto">
              {!lead.isArchived ? (
                <button type="button" className="btn btn-outline-warning btn-sm fw-medium" onClick={handleArchive} disabled={submitting}>
                  <i className="fa fa-archive me-1"></i> Lưu trữ (Archive)
                </button>
              ) : (
                isLeader && (
                  <button type="button" className="btn btn-outline-success btn-sm fw-medium" onClick={handleRestore} disabled={submitting}>
                    <i className="fa fa-undo me-1"></i> Khôi phục (Restore)
                  </button>
                )
              )}
              {currentUser?.role === 'admin' && (
                <button type="button" className="btn btn-outline-danger btn-sm fw-medium" onClick={handlePermanentDelete} disabled={submitting}>
                  <i className="fa fa-trash me-1"></i> Xoá vĩnh viễn
                </button>
              )}
            </div>
            
            {/* CÁC NÚT NGHIỆP VỤ SALE */}
            <div className="d-flex flex-wrap gap-2 justify-content-end ms-auto" style={{ flex: 1 }}>
            {lead.status === 'NEW' && (
              <button 
                className="btn btn-primary fw-medium px-4" 
                disabled={submitting} 
                onClick={() => handleAction('ASSIGN')}
              >
                Nhận tư vấn Lead này
              </button>
            )}

            {/* Sale: Đang xử lý */}
            {(lead.status === 'ASSIGNED' && lead.assignedTo?._id === currentUser?.id) && (
              <button 
                className="btn btn-warning fw-medium px-4" 
                disabled={submitting} 
                onClick={() => handleAction('PROCESS', { note: 'Bắt đầu liên hệ tư vấn' })}
              >
                Bắt đầu xử lý (Đang tư vấn)
              </button>
            )}

            {/* Sale: Nộp minh chứng */}
            {lead.status === 'PROCESSING' && lead.assignedTo?._id === currentUser?.id && (
              <div className="w-100 d-flex flex-column gap-2">
                <input 
                  type="text" 
                  className="form-control form-control-sm" 
                  placeholder="Link hình ảnh minh chứng (VD: Imgur, Drive...)" 
                  value={proofUrl} 
                  onChange={e => setProofUrl(e.target.value)} 
                />
                <textarea 
                  className="form-control form-control-sm" 
                  rows="2" 
                  placeholder="Ghi chú minh chứng (Số tiền đã cọc, tình trạng...)" 
                  value={proofNote} 
                  onChange={e => setProofNote(e.target.value)} 
                />
                <button 
                  className="btn btn-success fw-medium align-self-end mt-1" 
                  disabled={submitting || !proofNote} 
                  onClick={() => handleAction('SUBMIT_PROOF', { proofImages: proofUrl ? [proofUrl] : [], note: proofNote })}
                >
                  Nộp minh chứng (Yêu cầu KPI)
                </button>
              </div>
            )}

            {/* Leader: Duyệt/Từ chối */}
            {lead.status === 'SUBMITTED_PROOF' && isLeader && (
              <div className="w-100 d-flex flex-column gap-2">
                <input 
                  type="text" 
                  className="form-control form-control-sm" 
                  placeholder="Lý do từ chối (nếu có)" 
                  value={rejectReason} 
                  onChange={e => setRejectReason(e.target.value)} 
                />
                <div className="d-flex justify-content-end gap-2 mt-1">
                  <button 
                    className="btn btn-danger fw-medium" 
                    disabled={submitting || !rejectReason} 
                    onClick={() => handleAction('REJECT', { note: rejectReason })}
                  >
                    Từ chối
                  </button>
                  <button 
                    className="btn btn-success fw-medium" 
                    disabled={submitting} 
                    onClick={() => handleAction('APPROVE', { note: 'Leader duyệt KPI' })}
                  >
                    Duyệt KPI (Thành công)
                  </button>
                </div>
              </div>
            )}

            </div>

            <button type="button" className="btn btn-light border" onClick={onClose} disabled={submitting}>Đóng</button>
          </div>
        </div>
      </div>
    </div>
  );
};
