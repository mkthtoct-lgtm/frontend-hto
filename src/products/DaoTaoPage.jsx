import React, { useState, useEffect } from 'react';
import { authFetch } from '../auth/session';
import { API_BASE_URL } from '../config/api';
import CourseConsultationForm from './CourseConsultationForm';
import { TrainingBanner } from './TrainingBanner';

export function DaoTaoPage({ onNavigate, currentUser }) {
  const hasPermission = (user, requiredPermission) => {
    const roleKey = String(user?.role?.name || user?.roleName || user?.role || "")
      .trim().toLowerCase().replace(/đ/g, "d").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
    if (roleKey === "admin" || user?.roleId === "69fc5af582ef85451120772a") return true;

    const permissions = Array.isArray(user?.permissions) ? user.permissions : [];
    return permissions.includes("*") || permissions.includes(requiredPermission);
  };
  
  const canCreate = hasPermission(currentUser, 'dao_tao.create');
  const canUpdate = hasPermission(currentUser, 'dao_tao.update');
  const canDelete = hasPermission(currentUser, 'dao_tao.delete');
  const canUploadImage = hasPermission(currentUser, 'dao_tao.upload_image');

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
      const res = await authFetch(`${API_BASE_URL}/products?limit=100`);
      if (res.ok) {
        const data = await res.json();
        // Handle both possible backend structures to be safe
        const allProducts = data?.data?.products || data?.data || data?.products || data || [];
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
    // Safely parse to number to avoid RangeError in Intl.NumberFormat
    const num = Number(amount);
    if (isNaN(num)) return amount;
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  const STATIC_BASE_URL = API_BASE_URL.replace("/api/v1", "");

  const getImageUrl = (product) => {
    if (!product) return "https://images.unsplash.com/photo-1527866959252-deab85ef7d1b?auto=format&fit=crop&w=500&q=80";

    // Mới: Sử dụng Proxy URL nếu có imageFileId
    if (product.imageFileId) {
      return `${API_BASE_URL}/drive/${product.imageFileId}`;
    }

    const url = product.image;
    if (!url) return "https://images.unsplash.com/photo-1527866959252-deab85ef7d1b?auto=format&fit=crop&w=500&q=80";
    
    // Fix existing Google Drive URLs (from /view)
    const driveMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)\/view/);
    if (driveMatch) {
      return `https://drive.google.com/thumbnail?id=${driveMatch[1]}&sz=w1000`;
    }
    
    // Migrate old uc?export=view URLs to thumbnail API to bypass CORP restrictions
    const driveUcMatch = url.match(/drive\.google\.com\/uc\?export=view&id=([^&]+)/);
    if (driveUcMatch) {
      return `https://drive.google.com/thumbnail?id=${driveUcMatch[1]}&sz=w1000`;
    }
    
    if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')) return url;
    return `${STATIC_BASE_URL}${url}`;
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
      let newCourse = null;
      if (editData) {
        const res = await authFetch(`${API_BASE_URL}/products/${editData._id}`, {
          method: "PATCH",
          body: data
        });
        
        let json;
        try {
          json = await res.json();
        } catch (parseError) {
          throw new Error(`Lỗi từ máy chủ: Không thể đọc phản hồi (Status ${res.status}).`);
        }

        if (res.ok) {
           newCourse = json.data || json;
           alert("Cập nhật thành công!");
        } else {
           throw new Error(json.message || "Lỗi cập nhật khóa học từ máy chủ");
        }
      } else {
        const res = await authFetch(`${API_BASE_URL}/products`, {
          method: "POST",
          body: data
        });
        
        let json;
        try {
          json = await res.json();
        } catch (parseError) {
          throw new Error(`Lỗi từ máy chủ: Không thể đọc phản hồi (Status ${res.status}). Vui lòng kiểm tra lại cấu hình API_BASE_URL.`);
        }

        if (res.ok) {
           newCourse = json.data || json;
           alert("Thêm mới khóa học thành công!");
        } else {
           throw new Error(json.message || "Lỗi thêm khóa học từ máy chủ");
        }
      }

      setCourses(prev => {
         if (editData) {
            return prev.map(c => c._id === editData._id ? { ...c, ...newCourse } : c);
         }
         return [...prev, newCourse];
      });

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
        const res = await authFetch(`${API_BASE_URL}/products/${id}`, {
          method: "DELETE"
        });
        
        if (!res.ok) {
           const errText = await res.text();
           throw new Error(`Lỗi máy chủ (Status: ${res.status}): ${errText}`);
        }

        alert("Đã xóa khóa học!");
        fetchCourses();
      } catch (err) {
        console.error(err);
        alert("Có lỗi xảy ra khi xóa: " + err.message);
      }
    }
  };

  return (
    <div className="container-fluid py-4 bg-body-tertiary" style={{ minHeight: "100vh" }}>
      
      {/* Hero Banner Section */}
      <TrainingBanner />

      {/* Courses List Section */}
      <div className="mb-4 d-flex justify-content-between align-items-end">
        <div>
          <h3 className="fw-bold text-body-emphasis mb-1">Khóa Học Nổi Bật</h3>
          <p className="text-body-secondary mb-0">Lựa chọn chương trình đào tạo phù hợp với mục tiêu của học viên.</p>
        </div>
        {canCreate && (
          <button className="btn btn-primary shadow-sm" onClick={() => handleOpenAdminModal()}>
            <i className="fa fa-plus me-2"></i>Thêm Khóa Học
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-5 bg-body border rounded-4 shadow-sm">
          <i className="fa fa-book-open text-muted fs-1 mb-3"></i>
          <h5 className="text-muted">Chưa có khóa học nào.</h5>
          <p className="text-muted small">
            {canCreate ? 'Hãy bấm "Thêm Khóa Học" để tạo mới.' : 'Danh sách khóa học trống.'}
          </p>
        </div>
      ) : (
        <div id="daotao-courses-grid" className="row g-4">
          {courses.map(course => (
            <div className="col-12 col-md-6 col-xl-4" key={course._id}>
              <div 
                className="card h-100 border-0 rounded-4 overflow-hidden position-relative group"
                style={{ boxShadow: "0 10px 30px rgba(0,0,0,0.05)", transition: "transform 0.3s ease, box-shadow 0.3s ease" }}
              >
                {(canUpdate || canDelete) && (
                  <div className="position-absolute top-0 end-0 m-2" style={{ zIndex: 10 }}>
                    {canUpdate && (
                      <button className="btn btn-light btn-sm rounded-circle shadow-sm me-2" onClick={(e) => { e.stopPropagation(); handleOpenAdminModal(course); }}>
                        <i className="fa fa-edit text-primary"></i>
                      </button>
                    )}
                    {canDelete && (
                      <button className="btn btn-light btn-sm rounded-circle shadow-sm" onClick={(e) => handleDeleteCourse(e, course._id)}>
                        <i className="fa fa-trash text-danger"></i>
                      </button>
                    )}
                  </div>
                )}
                <div className="position-relative" style={{ height: "200px" }}>
                  <img 
                    src={getImageUrl(course)} 
                    alt={course.name} 
                    className="w-100 h-100 object-fit-cover" 
                    style={{ objectPosition: "center" }}
                  />
                  <div className={`position-absolute top-0 start-0 m-3 badge bg-danger fs-6 px-3 py-2 rounded-pill shadow-sm`}>
                    HOT
                  </div>
                </div>
                <div className="card-body p-4 d-flex flex-column">
                  <h5 className="fw-bold mb-3 text-body-emphasis">{course.name}</h5>
                  <p className="text-body-secondary mb-4" style={{ fontSize: "14px", flexGrow: 1 }}>
                    {course.description}
                  </p>
                  
                  <div className="d-flex flex-column gap-2 mb-4">
                    <div className="d-flex align-items-center text-body-emphasis" style={{ fontSize: "14px" }}>
                      <div className="bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: "32px", height: "32px" }}>
                        <i className="fa fa-bullseye"></i>
                      </div>
                      <div><span className="text-body-secondary">Mục tiêu:</span> <strong>{course.visaCode || "Chưa xác định"}</strong></div>
                    </div>
                    
                    <div className="d-flex align-items-center text-body-emphasis" style={{ fontSize: "14px" }}>
                      <div className="bg-info-subtle text-info rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: "32px", height: "32px" }}>
                        <i className="fa fa-clock"></i>
                      </div>
                      <div><span className="text-body-secondary">Thời gian:</span> <strong>{course.shortCode || "Chưa xác định"}</strong></div>
                    </div>
                    
                    <div className="d-flex align-items-center text-body-emphasis" style={{ fontSize: "14px" }}>
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
                  {canUploadImage ? (
                    <div className="mb-3">
                      <label className="form-label">Ảnh bìa (Upload)</label>
                      <input type="file" className="form-control" accept="image/*" onChange={e => setFormData({...formData, image: e.target.files[0]})} />
                    </div>
                  ) : (
                    <div className="mb-3">
                      <label className="form-label text-muted">Ảnh bìa (Upload)</label>
                      <p className="small text-danger mb-0">Bạn không có quyền tải ảnh lên hệ thống.</p>
                    </div>
                  )}
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
            <div className="card border-0 shadow-lg rounded-4 overflow-hidden bg-body">
              <CourseConsultationForm 
                course={selectedCourse} 
                onCloseModal={() => setIsModalOpen(false)} 
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
