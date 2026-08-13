import React, { useState } from 'react';
import { API_BASE_URL } from '../config/api';
import Swal from 'sweetalert2';

export default function CourseConsultationForm({ course, onCloseModal }) {
  const [formData, setFormData] = useState({
    customerName: '',
    phoneNumber: '',
    email: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmitConsultation = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        courseId: course._id,
      };

      const response = await fetch(`${API_BASE_URL}/course-leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      const isDarkMode = document.documentElement.getAttribute('data-bs-theme') === 'dark';
      const swalConfig = {
        background: isDarkMode ? '#2b3035' : '#fff', // Lighter dark background
        color: isDarkMode ? '#f8f9fa' : '#212529',
      };

      if (response.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Đăng ký tư vấn thành công!',
          text: 'Đội ngũ Sale sẽ liên hệ sớm nhất.',
          confirmButtonColor: '#0d6efd',
          ...swalConfig
        });

        setFormData({ customerName: '', phoneNumber: '', email: '', notes: '' });
        if (onCloseModal) onCloseModal();
      } else if (response.status === 409) {
        Swal.fire({
          icon: 'info',
          title: 'Yêu cầu đã được ghi nhận',
          text: result.message || 'Bạn đã gửi yêu cầu tư vấn khóa học này rồi. Đội ngũ tư vấn sẽ liên hệ với bạn sớm nhất.',
          confirmButtonColor: '#0d6efd',
          ...swalConfig
        });
        setFormData({ customerName: '', phoneNumber: '', email: '', notes: '' });
        if (onCloseModal) onCloseModal();
      } else if (response.status === 429) {
        let messageText = result.message || 'Hệ thống phát hiện bạn đang gửi yêu cầu liên tục. Vui lòng thử lại sau.';
        if (result.retryAfter) {
          const m = Math.floor(result.retryAfter / 60);
          const s = result.retryAfter % 60;
          const timeStr = m > 0 ? `${m} phút ${s} giây` : `${s} giây`;
          messageText += ` (Còn lại: ${timeStr})`;
        }
        Swal.fire({
          icon: 'warning',
          title: 'Bạn thao tác quá nhanh',
          text: messageText,
          confirmButtonColor: '#ffc107',
          ...swalConfig
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Đăng ký thất bại',
          text: result.message || 'Vui lòng kiểm tra lại thông tin.',
          confirmButtonColor: '#dc3545',
          ...swalConfig
        });
      }
    } catch (error) {
      console.error('Lỗi khi gửi form tư vấn:', error);
      const isDarkMode = document.documentElement.getAttribute('data-bs-theme') === 'dark';
      Swal.fire({
        icon: 'error',
        title: 'Lỗi hệ thống',
        text: 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.',
        confirmButtonColor: '#dc3545',
        background: isDarkMode ? '#2b3035' : '#fff',
        color: isDarkMode ? '#f8f9fa' : '#212529',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="position-relative bg-body text-body-emphasis h-100 w-100 d-flex flex-column rounded-4">
      {/* Modal Header */}
      <div className="d-flex justify-content-between align-items-center p-4 pb-3 border-bottom border-secondary-subtle">
        <h4 className="mb-0 fw-bold">Đăng Ký Tư Vấn Khóa Học</h4>
        <button 
          type="button" 
          className="btn-close" 
          onClick={onCloseModal}
          style={{ cursor: 'pointer' }}
        />
      </div>

      <div className="p-4 pt-3">
        <p className="text-body-secondary mb-4 fs-6">
          Để lại thông tin, đội ngũ tư vấn sẽ liên hệ với bạn sớm nhất.
        </p>

        {/* Course Info Card */}
        <div className="d-flex align-items-center p-3 mb-4 rounded-3 border border-primary-subtle bg-primary-subtle bg-opacity-10">
          <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3 shadow-sm" style={{ width: '40px', height: '40px', flexShrink: 0 }}>
            <i className="fa fa-book-open"></i>
          </div>
          <div>
            <div className="text-body-secondary small mb-1">Bạn đang đăng ký tư vấn khóa học</div>
            <div className="fw-bold fs-6 text-primary">{course?.name}</div>
          </div>
        </div>

        <form onSubmit={handleSubmitConsultation}>
          <div className="mb-3 position-relative">
            <label className="form-label fw-medium small mb-1 text-body-secondary">Họ và tên <span className="text-danger">*</span></label>
            <div className="input-group">
              <span className="input-group-text bg-body-tertiary border-end-0">
                <i className="fa fa-user text-body-secondary"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0 ps-0"
                name="customerName"
                value={formData.customerName}
                onChange={handleChange}
                placeholder="Nhập họ và tên của bạn"
                required
                pattern="^[\p{L}\s]{2,50}$"
                title="Họ tên phải chứa từ 2-50 ký tự, không bao gồm số hoặc ký tự đặc biệt"
              />
            </div>
          </div>

          <div className="mb-3 position-relative">
            <label className="form-label fw-medium small mb-1 text-body-secondary">Số điện thoại <span className="text-danger">*</span></label>
            <div className="input-group">
              <span className="input-group-text bg-body-tertiary border-end-0">
                <i className="fa fa-phone text-body-secondary"></i>
              </span>
              <input
                type="tel"
                className="form-control border-start-0 ps-0"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="Ví dụ: 0901234567"
                required
                pattern="^(0|\+84)[\d\s\-\.]{8,15}$"
                title="Số điện thoại phải bắt đầu bằng 0 hoặc +84 (VD: 0901234567 hoặc +84901234567)"
              />
            </div>
          </div>

          <div className="mb-3 position-relative">
            <label className="form-label fw-medium small mb-1 text-body-secondary">Email (Tùy chọn)</label>
            <div className="input-group">
              <span className="input-group-text bg-body-tertiary border-end-0">
                <i className="fa fa-envelope text-body-secondary"></i>
              </span>
              <input
                type="email"
                className="form-control border-start-0 ps-0"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="email@example.com"
              />
            </div>
          </div>

          <div className="mb-4 position-relative">
            <label className="form-label fw-medium small mb-1 text-body-secondary">Ghi chú thêm</label>
            <textarea
              className="form-control"
              name="notes"
              rows="3"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Bạn muốn hỏi thêm điều gì về khóa học này?"
              style={{ resize: 'none' }}
            ></textarea>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100 py-2 fs-6 fw-medium d-flex justify-content-center align-items-center rounded-3 shadow-sm"
            style={{ transition: 'all 0.3s ease' }}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Đang gửi...
              </>
            ) : (
              <>
                Gửi Yêu Cầu Tư Vấn <i className="fa fa-paper-plane ms-2"></i>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
