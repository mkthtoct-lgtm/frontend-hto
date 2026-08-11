import React, { useState, useEffect } from 'react';
import { authFetch } from '../auth/session';
import { API_BASE_URL } from '../config/api';

export function DaoTaoPage({ onNavigate }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    target: "",
    duration: "",
    fee: 0,
    image: null
  });

  const fetchCourses = async () => {
    try {
      setLoading(true);
      // Giả định dùng trường purpose = 'dao_tao' để phân biệt khóa học
      const res = await authFetch(`${API_BASE_URL}/api/v1/products?limit=100`);
      if (res.ok) {
        const data = await res.json();
        const allProducts = data.data.products || [];
        const trainingCourses = allProducts.filter(p => p.purpose === 'dao_tao');
        setCourses(trainingCourses);
      }
    } catch (err) {
      console.error("Lỗi khi tải danh sách khóa học:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleRegisterClick = (course) => {
    setSelectedCourse(course);
    setIsModalOpen(true);
  };

  const formatCurrency = (amount) => {
    if (!amount) return "Đang cập nhật...";
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const getImageUrl = (url) => {
    if (!url) return "https://images.unsplash.com/photo-1527866959252-deab85ef7d1b?auto=format&fit=crop&w=500&q=80";
    if (url.startsWith('http')) return url;
    return `${API_BASE_URL}${url}`;
  };

  // --- ADMIN FUNCTIONS ---
  const handleOpenAdminModal = (course = null) => {
    if (course) {
      setEditData(course);
      setFormData({
        name: course.name || "",
        description: course.description || "",
        target: course.visaCode || "", // Dùng tạm visaCode lưu mục tiêu
        duration: course.shortCode || "", // Dùng tạm shortCode lưu thời gian
        fee: course.serviceFee || 0,
        image: null
      });
    } else {
      setEditData(null);
      setFormData({
        name: "",
        description: "",
        target: "",
        duration: "",
        fee: 0,
        image: null
      });
    }
    setIsAdminModalOpen(true);
  };

  const handleCloseAdminModal = () => {
    setIsAdminModalOpen(false);
    setEditData(null);
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append("name", formData.name);
    data.append("description", formData.description);
    data.append("purpose", "dao_tao");
    data.append("visaCode", formData.target);
    data.append("shortCode", formData.duration);
    data.append("serviceFee", formData.fee);
    
    if (formData.image) {
      data.append("image", formData.image);
    }

    try {
      if (editData) {
        await authFetch(`${API_BASE_URL}/api/v1/products/${editData._id}`, {
          method: "PUT",
          body: data
        });
        alert("Cập nhật thành công!");
      } else {
        await authFetch(`${API_BASE_URL}/api/v1/products`, {
          method: "POST",
          body: data
        });
        alert("Thêm mới khóa học thành công!");
      }
      handleCloseAdminModal();
      fetchCourses();
    } catch (err) {
      console.error(err);
      alert("Có lỗi xảy ra: " + err.message);
    }
  };

  const handleDeleteCourse = async (e, id) => {
    e.stopPropagation();
    if (window.confirm("Bạn có chắc chắn muốn xóa khóa học này?")) {
      try {
        await authFetch(`${API_BASE_URL}/api/v1/products/${id}`, {
          method: "DELETE"
        });
        alert("Đã xóa khóa học!");
        fetchCourses();
      } catch (err) {
        console.error(err);
        alert("Có lỗi xảy ra khi xóa.");
      }
    }
  };

  return (
    <div className="container-fluid py-4" style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      
      {/* Hero Banner Section */}
      <div 
        id="daotao-hero-section"
        className="rounded-4 mb-5 position-relative overflow-hidden shadow-sm"
        style={{
          background: "linear-gradient(135deg, #0d6efd 0%, #0098f0 100%)",
          color: "white",
          padding: "4rem 2rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}
      >
        <div style={{ maxWidth: "600px", zIndex: 2 }}>
          <h1 className="fw-bold mb-3 display-5" style={{ textShadow: "0 2px 4px rgba(0,0,0,0.2)" }}>
            Chinh phục ngoại ngữ <br/> <span className="text-warning">Mở lối thành công</span>
          </h1>
          <p className="lead mb-4" style={{ opacity: 0.9 }}>
            Chương trình đào tạo chuẩn quốc tế, lộ trình cá nhân hóa giúp học viên đạt mục tiêu chứng chỉ nhanh nhất để chinh phục giấc mơ du học.
          </p>
          <div className="d-flex gap-4">
            <div className="text-center">
              <h2 className="fw-bold mb-0">500+</h2>
              <small style={{ opacity: 0.8 }}>Học viên mỗi năm</small>
            </div>
            <div className="text-center">
              <h2 className="fw-bold mb-0">98%</h2>
              <small style={{ opacity: 0.8 }}>Tỷ lệ đỗ Visa</small>
            </div>
            <div className="text-center">
              <h2 className="fw-bold mb-0">20+</h2>
              <small style={{ opacity: 0.8 }}>Giáo viên bản xứ</small>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div 
          className="position-absolute end-0 top-0 h-100 d-none d-lg-block"
          style={{ width: "40%", background: "url('https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80') center/cover", opacity: 0.4, mixBlendMode: "overlay" }}
        />
      </div>

      {/* Courses List Section */}
      <div className="mb-4 d-flex justify-content-between align-items-end">
        <div>
          <h3 className="fw-bold text-dark mb-1">Khóa Học Nổi Bật</h3>
          <p className="text-body-secondary mb-0">Lựa chọn chương trình đào tạo phù hợp với mục tiêu của học viên.</p>
        </div>
        <button className="btn btn-primary shadow-sm" onClick={() => handleOpenAdminModal()}>
          <i className="fa fa-plus me-2"></i>Thêm Khóa Học
        </button>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-5 bg-white rounded-4 shadow-sm">
          <i className="fa fa-book-open text-muted fs-1 mb-3"></i>
          <h5 className="text-muted">Chưa có khóa học nào.</h5>
          <p className="text-muted small">Hãy bấm "Thêm Khóa Học" để tạo mới.</p>
        </div>
      ) : (
        <div className="row g-4">
          {courses.map(course => (
            <div className="col-12 col-md-6 col-xl-4" key={course._id}>
              <div 
                className="card h-100 border-0 rounded-4 overflow-hidden position-relative group"
                style={{ boxShadow: "0 10px 30px rgba(0,0,0,0.05)", transition: "transform 0.3s ease, box-shadow 0.3s ease" }}
              >
                <div className="position-absolute top-0 end-0 m-2" style={{ zIndex: 10 }}>
                  <button className="btn btn-light btn-sm rounded-circle shadow-sm me-2" onClick={(e) => { e.stopPropagation(); handleOpenAdminModal(course); }}>
                    <i className="fa fa-edit text-primary"></i>
                  </button>
                  <button className="btn btn-light btn-sm rounded-circle shadow-sm" onClick={(e) => handleDeleteCourse(e, course._id)}>
                    <i className="fa fa-trash text-danger"></i>
                  </button>
                </div>
                <div className="position-relative" style={{ height: "200px" }}>
                  <img 
                    src={getImageUrl(course.image)} 
                    alt={course.name} 
                    className="w-100 h-100 object-fit-cover" 
                    style={{ objectPosition: "center" }}
                  />
                  <div className={`position-absolute top-0 start-0 m-3 badge bg-danger fs-6 px-3 py-2 rounded-pill shadow-sm`}>
                    HOT
                  </div>
                </div>
                <div className="card-body p-4 d-flex flex-column">
                  <h5 className="fw-bold mb-3 text-dark">{course.name}</h5>
                  <p className="text-body-secondary mb-4" style={{ fontSize: "14px", flexGrow: 1 }}>
                    {course.description}
                  </p>
                  
                  <div className="d-flex flex-column gap-2 mb-4">
                    <div className="d-flex align-items-center text-dark" style={{ fontSize: "14px" }}>
                      <div className="bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: "32px", height: "32px" }}>
                        <i className="fa fa-bullseye"></i>
                      </div>
                      <div><span className="text-body-secondary">Mục tiêu:</span> <strong>{course.visaCode || "Chưa xác định"}</strong></div>
                    </div>
                    
                    <div className="d-flex align-items-center text-dark" style={{ fontSize: "14px" }}>
                      <div className="bg-info-subtle text-info rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: "32px", height: "32px" }}>
                        <i className="fa fa-clock"></i>
                      </div>
                      <div><span className="text-body-secondary">Thời gian:</span> <strong>{course.shortCode || "Chưa xác định"}</strong></div>
                    </div>
                    
                    <div className="d-flex align-items-center text-dark" style={{ fontSize: "14px" }}>
                      <div className="bg-warning-subtle text-warning rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: "32px", height: "32px" }}>
                        <i className="fa fa-money-bill"></i>
                      </div>
                      <div><span className="text-body-secondary">Học phí:</span> <strong className="text-danger">{formatCurrency(course.serviceFee)}</strong></div>
                    </div>
                  </div>

                  <button 
                    className="btn btn-primary w-100 py-2 fw-bold shadow-sm rounded-3"
                    onClick={() => handleRegisterClick(course)}
                  >
                    Đăng Ký Tư Vấn Ngay
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Admin Modal */}
      {isAdminModalOpen && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">{editData ? "Cập nhật Khóa Học" : "Thêm mới Khóa Học"}</h5>
                <button type="button" className="btn-close" onClick={handleCloseAdminModal}></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleAdminSubmit}>
                  <div className="mb-3">
                    <label className="form-label">Tên khóa học</label>
                    <input type="text" className="form-control" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Tiếng Đức A1-B1" />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Mô tả khóa học</label>
                    <textarea className="form-control" rows="3" required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Mục tiêu đầu ra</label>
                    <input type="text" className="form-control" required value={formData.target} onChange={e => setFormData({...formData, target: e.target.value})} placeholder="IELTS 6.0" />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Thời gian dự kiến</label>
                    <input type="text" className="form-control" required value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} placeholder="6 - 8 Tháng" />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Học phí (VNĐ)</label>
                    <input type="number" className="form-control" value={formData.fee} onChange={e => setFormData({...formData, fee: e.target.value})} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Ảnh bìa (Upload)</label>
                    <input type="file" className="form-control" accept="image/*" onChange={e => setFormData({...formData, image: e.target.files[0]})} />
                  </div>
                  <div className="text-end">
                    <button type="button" className="btn btn-secondary me-2" onClick={handleCloseAdminModal}>Hủy</button>
                    <button type="submit" className="btn btn-primary">Lưu lại</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Registration Modal Overlay */}
      {isModalOpen && selectedCourse && (
        <>
          <div 
            className="position-fixed top-0 start-0 w-100 h-100 bg-black backdrop-blur"
            style={{ opacity: 0.5, zIndex: 1040 }}
            onClick={() => setIsModalOpen(false)}
          />
          <div 
            className="position-fixed top-50 start-50 translate-middle w-100"
            style={{ maxWidth: "500px", zIndex: 1050, padding: "0 15px" }}
          >
            <div className="card border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="card-header bg-primary text-white p-4 border-0 d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-bold">Đăng Ký Tư Vấn Khóa Học</h5>
                <button 
                  type="button" 
                  className="btn-close btn-close-white" 
                  onClick={() => setIsModalOpen(false)}
                />
              </div>
              <div className="card-body p-4">
                <div className="alert alert-primary mb-4 border-0 bg-primary-subtle rounded-3">
                  <strong className="d-block mb-1">Khóa học đang chọn:</strong>
                  <div className="text-primary fw-bold">{selectedCourse.name}</div>
                </div>
                
                <form onSubmit={(e) => { e.preventDefault(); alert("Đã gửi đăng ký thành công!"); setIsModalOpen(false); }}>
                  <div className="mb-3">
                    <label className="form-label fw-medium text-dark">Họ và tên <span className="text-danger">*</span></label>
                    <input type="text" className="form-control form-control-lg bg-light border-0" required placeholder="Nhập họ tên của bạn" />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-medium text-dark">Số điện thoại <span className="text-danger">*</span></label>
                    <input type="tel" className="form-control form-control-lg bg-light border-0" required placeholder="Nhập số điện thoại" />
                  </div>
                  <div className="mb-4">
                    <label className="form-label fw-medium text-dark">Ghi chú thêm</label>
                    <textarea className="form-control bg-light border-0" rows="3" placeholder="Ví dụ: Mong muốn học buổi tối..." />
                  </div>
                  <button type="submit" className="btn btn-primary btn-lg w-100 fw-bold shadow-sm rounded-3">
                    Gửi Yêu Cầu Tư Vấn
                  </button>
                </form>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
