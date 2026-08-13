import React, { useState } from 'react';
import { API_BASE_URL } from '../config/api';
// Assuming sweetalert2 is installed, otherwise replace with normal alert or another toast library.
// The snippet specified Swal, let's include it. If it's not installed, we can fall back to alert, but the prompt says to use standard web APIs or a library.
import Swal from 'sweetalert2';

export default function CourseConsultationForm({ courseId, onCloseModal }) {
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
    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        courseId: courseId,
      };

      const response = await fetch(`${API_BASE_URL}/course-leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Đăng ký tư vấn thành công!',
          text: 'Đội ngũ Sale sẽ liên hệ sớm nhất.',
          confirmButtonColor: '#3085d6',
        });

        setFormData({ customerName: '', phoneNumber: '', email: '', notes: '' });
        if (onCloseModal) onCloseModal();
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Đăng ký thất bại',
          text: result.message || 'Vui lòng kiểm tra lại thông tin.',
        });
      }
    } catch (error) {
      console.error('Lỗi khi gửi form tư vấn:', error);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi hệ thống',
        text: 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmitConsultation} className="p-4 bg-white rounded shadow-sm">
      <h5 className="mb-4 fw-bold">Đăng Ký Tư Vấn Khóa Học</h5>
      
      <div className="mb-3">
        <label className="form-label">Họ và tên *</label>
        <input
          type="text"
          className="form-control"
          name="customerName"
          value={formData.customerName}
          onChange={handleChange}
          required
        />
      </div>

      <div className="mb-3">
        <label className="form-label">Số điện thoại *</label>
        <input
          type="tel"
          className="form-control"
          name="phoneNumber"
          value={formData.phoneNumber}
          onChange={handleChange}
          required
        />
      </div>

      <div className="mb-3">
        <label className="form-label">Email</label>
        <input
          type="email"
          className="form-control"
          name="email"
          value={formData.email}
          onChange={handleChange}
        />
      </div>

      <div className="mb-4">
        <label className="form-label">Ghi chú thêm</label>
        <textarea
          className="form-control"
          name="notes"
          rows="3"
          value={formData.notes}
          onChange={handleChange}
        ></textarea>
      </div>

      <button
        type="submit"
        className="btn btn-primary w-100"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Đang gửi...' : 'Gửi Yêu Cầu Tư Vấn'}
      </button>
    </form>
  );
}
