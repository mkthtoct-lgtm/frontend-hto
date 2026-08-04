import React, { useState } from 'react';

const mockCourses = [
  {
    id: 1,
    title: "Tiếng Đức A1-B1 (Du học nghề)",
    badge: "Khai giảng sắp tới",
    badgeColor: "danger",
    target: "Chứng chỉ Goethe/Telc B1",
    duration: "6 - 8 Tháng",
    fee: "Đang cập nhật...",
    schedule: "Thứ 2 - Thứ 6 (Sáng/Chiều)",
    image: "https://images.unsplash.com/photo-1527866959252-deab85ef7d1b?auto=format&fit=crop&w=500&q=80",
    description: "Khóa học thiết kế chuyên biệt cho học viên chuẩn bị hồ sơ Du học nghề Đức. Đảm bảo chuẩn đầu ra xin Visa."
  },
  {
    id: 2,
    title: "Tiếng Anh IELTS 6.0+ (Du học/Định cư)",
    badge: "Lớp chuyên sâu",
    badgeColor: "success",
    target: "IELTS 6.0 - 6.5",
    duration: "4 - 6 Tháng",
    fee: "Đang cập nhật...",
    schedule: "Linh hoạt (Các buổi tối / Cuối tuần)",
    image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=500&q=80",
    description: "Lộ trình cấp tốc rèn luyện 4 kỹ năng. Phù hợp cho khách hàng làm hồ sơ Du học, Work Visa tại Úc, Canada, Anh."
  },
  {
    id: 3,
    title: "Tiếng Đức A2 (Đoàn tụ gia đình)",
    badge: "Sắp mở",
    badgeColor: "warning",
    target: "Chứng chỉ A2",
    duration: "3 Tháng",
    fee: "Đang cập nhật...",
    schedule: "Ca Tối thứ 2, 4, 6",
    image: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=500&q=80",
    description: "Chương trình dành riêng cho diện Visa đoàn tụ gia đình tại Đức. Chú trọng kỹ năng giao tiếp thực tế."
  }
];

export function DaoTaoPage({ onNavigate }) {
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleRegisterClick = (course) => {
    setSelectedCourse(course);
    setIsModalOpen(true);
  };

  return (
    <div className="container-fluid py-4" style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      
      {/* Hero Banner Section */}
      <div 
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
        <div className="position-absolute" style={{ top: "-20%", right: "-5%", width: "400px", height: "400px", borderRadius: "50%", background: "rgba(255,255,255,0.1)", filter: "blur(40px)" }} />
        <div className="position-absolute" style={{ bottom: "-10%", right: "15%", width: "300px", height: "300px", borderRadius: "50%", background: "rgba(255,200,0,0.15)", filter: "blur(40px)" }} />
      </div>

      {/* Courses List Section */}
      <div className="mb-4 d-flex justify-content-between align-items-end">
        <div>
          <h3 className="fw-bold text-dark mb-1">Khóa Học Nổi Bật</h3>
          <p className="text-body-secondary mb-0">Lựa chọn chương trình đào tạo phù hợp với mục tiêu của học viên.</p>
        </div>
      </div>

      <div className="row g-4">
        {mockCourses.map(course => (
          <div className="col-12 col-md-6 col-xl-4" key={course.id}>
            <div 
              className="card h-100 border-0 rounded-4 overflow-hidden"
              style={{
                boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
                cursor: "pointer"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-8px)";
                e.currentTarget.style.boxShadow = "0 15px 40px rgba(0,0,0,0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,0,0,0.05)";
              }}
            >
              <div className="position-relative" style={{ height: "200px" }}>
                <img 
                  src={course.image} 
                  alt={course.title} 
                  className="w-100 h-100 object-fit-cover" 
                  style={{ objectPosition: "center" }}
                />
                <div className={`position-absolute top-0 start-0 m-3 badge bg-${course.badgeColor} fs-6 px-3 py-2 rounded-pill shadow-sm`}>
                  {course.badge}
                </div>
              </div>
              <div className="card-body p-4 d-flex flex-column">
                <h5 className="fw-bold mb-3 text-dark">{course.title}</h5>
                <p className="text-body-secondary mb-4" style={{ fontSize: "14px", flexGrow: 1 }}>
                  {course.description}
                </p>
                
                <div className="d-flex flex-column gap-2 mb-4">
                  <div className="d-flex align-items-center text-dark" style={{ fontSize: "14px" }}>
                    <div className="bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: "32px", height: "32px" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    </div>
                    <div><span className="text-body-secondary">Mục tiêu:</span> <strong>{course.target}</strong></div>
                  </div>
                  
                  <div className="d-flex align-items-center text-dark" style={{ fontSize: "14px" }}>
                    <div className="bg-info-subtle text-info rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: "32px", height: "32px" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    </div>
                    <div><span className="text-body-secondary">Thời gian:</span> <strong>{course.duration}</strong></div>
                  </div>
                  
                  <div className="d-flex align-items-center text-dark" style={{ fontSize: "14px" }}>
                    <div className="bg-warning-subtle text-warning rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: "32px", height: "32px" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                    </div>
                    <div><span className="text-body-secondary">Học phí:</span> <strong className="text-danger">{course.fee}</strong></div>
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
                  <span className="text-primary">{selectedCourse.title}</span>
                </div>
                
                <form onSubmit={(e) => { e.preventDefault(); alert("Đã gửi yêu cầu đăng ký thành công!"); setIsModalOpen(false); }}>
                  <div className="mb-3">
                    <label className="form-label fw-bold text-body-secondary small">Họ và Tên Học Viên <span className="text-danger">*</span></label>
                    <input type="text" className="form-control py-2 rounded-3" placeholder="Nhập họ tên đầy đủ" required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold text-body-secondary small">Số Điện Thoại <span className="text-danger">*</span></label>
                    <input type="tel" className="form-control py-2 rounded-3" placeholder="Nhập số điện thoại liên hệ" required />
                  </div>
                  <div className="mb-4">
                    <label className="form-label fw-bold text-body-secondary small">Ghi chú (Tùy chọn)</label>
                    <textarea className="form-control py-2 rounded-3" rows="3" placeholder="Ví dụ: Mong muốn học ca tối, hoặc cần tư vấn thêm về Visa..."></textarea>
                  </div>
                  <button type="submit" className="btn btn-primary w-100 py-2.5 fw-bold rounded-3 shadow-sm">
                    Gửi Yêu Cầu Đăng Ký
                  </button>
                </form>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Internal CSS for backdrop blur and utilities */}
      <style>{`
        .backdrop-blur { backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); }
        .object-fit-cover { object-fit: cover; }
      `}</style>
    </div>
  );
}
