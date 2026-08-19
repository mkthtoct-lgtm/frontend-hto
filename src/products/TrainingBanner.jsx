import React, { useState, useRef } from 'react';

export const TrainingBanner = ({ onBannerChange, initialBannerUrl = null }) => {
  const [bannerImage, setBannerImage] = useState(initialBannerUrl);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Xử lý upload ảnh banner mới từ máy tính
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Giới hạn định dạng và kích thước (tối đa 5MB)
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn đúng định dạng hình ảnh (.jpg, .png, .webp)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Kích thước ảnh không được vượt quá 5MB');
      return;
    }

    setIsUploading(true);
    try {
      // Tạo preview cục bộ ngay lập tức
      const localPreviewUrl = URL.createObjectURL(file);
      setBannerImage(localPreviewUrl);

      // Nếu có truyền hàm upload lên server/drive
      if (onBannerChange) {
        await onBannerChange(file);
      }
    } catch (error) {
      alert('Lỗi tải ảnh lên: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  // Đặt lại banner về giao diện Gradient mặc định
  const handleResetBanner = (e) => {
    e.stopPropagation();
    setBannerImage(null);
  };

  return (
    <div 
      className="position-relative rounded-3xl overflow-hidden shadow-2xl mb-4 border border-white/10 transition-all duration-300 group"
      style={{
        minHeight: "260px",
        background: "linear-gradient(135deg, #0b1329 0%, #0d2557 35%, #1d4ed8 70%, #0284c7 100%)",
      }}
    >
      {/* 1. HIỆU ỨNG ÁNH SÁNG AMBIENT GLOW */}
      <div 
        className="position-absolute rounded-circle pointer-events-none"
        style={{
          width: "350px",
          height: "350px",
          top: "-100px",
          left: "-80px",
          background: "radial-gradient(circle, rgba(6, 182, 212, 0.35) 0%, rgba(6, 182, 212, 0) 70%)",
          filter: "blur(40px)"
        }}
      />
      <div 
        className="position-absolute rounded-circle pointer-events-none"
        style={{
          width: "280px",
          height: "280px",
          bottom: "-80px",
          left: "30%",
          background: "radial-gradient(circle, rgba(245, 158, 11, 0.2) 0%, rgba(245, 158, 11, 0) 70%)",
          filter: "blur(50px)"
        }}
      />

      {/* 2. HÌNH ẢNH BANNER (MẶC ĐỊNH HOẶC ẢNH TỰ UPLOAD) */}
      <div 
        className="position-absolute top-0 end-0 h-100 w-100 w-lg-50 pointer-events-none"
        style={{
          zIndex: 1,
          maskImage: "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.4) 30%, rgba(0,0,0,0.95) 100%)",
          WebkitMaskImage: "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.4) 30%, rgba(0,0,0,0.95) 100%)"
        }}
      >
        <img 
          src={bannerImage || "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80"} 
          alt="Đào tạo du học" 
          className="w-100 h-100 object-cover object-center"
          style={{ filter: bannerImage ? "none" : "brightness(0.9) contrast(1.1) saturate(1.1)" }}
        />
      </div>

      {/* 3. NỘI DUNG CHỮ & THỐNG KÊ (ĐỘ TƯƠNG PHẢN CAO) */}
      <div className="position-relative p-4 p-md-5 d-flex flex-column justify-content-between h-100" style={{ zIndex: 2, maxWidth: "680px" }}>
        
        {/* Tag Phân Loại Nhỏ */}
        <div className="mb-2">
          <span 
            className="badge px-3 py-1.5 rounded-pill text-[11px] font-bold tracking-wide uppercase shadow-sm"
            style={{
              background: "linear-gradient(135deg, rgba(6, 182, 212, 0.25), rgba(59, 130, 246, 0.25))",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              color: "#38bdf8",
              backdropFilter: "blur(8px)"
            }}
          >
            <i className="fa fa-graduation-cap me-1.5 text-cyan-300"></i>
            Chương trình đào tạo chuẩn quốc tế
          </span>
        </div>

        {/* Cụm Tiêu Đề */}
        <div className="mb-3">
          <h2 className="fw-black text-white mb-1 fs-2 fs-md-1 tracking-tight" style={{ textShadow: "0 2px 10px rgba(0,0,0,0.3)" }}>
            Chinh phục ngoại ngữ
          </h2>
          <h2 
            className="fw-black mb-2 fs-2 fs-md-1 tracking-tight"
            style={{
              background: "linear-gradient(90deg, #fcd34d 0%, #f59e0b 50%, #fb923c 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: "drop-shadow(0 2px 8px rgba(245, 158, 11, 0.3))"
            }}
          >
            Mở lối thành công
          </h2>
          <p className="text-slate-200 text-xs text-md-sm mb-0 leading-relaxed font-normal" style={{ maxWidth: "520px", textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}>
            Chương trình đào tạo tinh gọn, lộ trình cá nhân hóa giúp học viên đạt mục tiêu chứng chỉ nhanh nhất để hiện thực hóa ước mơ du học.
          </p>
        </div>

        {/* Cụm Thống Kê Glassmorphism */}
        <div className="d-flex flex-wrap align-items-center gap-3 pt-2">
          
          <div 
            className="px-3.5 py-2 rounded-2xl shadow-sm d-flex flex-column"
            style={{
              background: "rgba(15, 23, 42, 0.45)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              backdropFilter: "blur(10px)"
            }}
          >
            <span className="fw-black fs-5 text-cyan-300 leading-none mb-1">500+</span>
            <span className="text-slate-300 text-[11px] font-medium">Học viên / năm</span>
          </div>

          <div 
            className="px-3.5 py-2 rounded-2xl shadow-sm d-flex flex-column"
            style={{
              background: "rgba(15, 23, 42, 0.45)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              backdropFilter: "blur(10px)"
            }}
          >
            <span className="fw-black fs-5 text-amber-300 leading-none mb-1">98%</span>
            <span className="text-slate-300 text-[11px] font-medium">Tỷ lệ đỗ Visa</span>
          </div>

          <div 
            className="px-3.5 py-2 rounded-2xl shadow-sm d-flex flex-column"
            style={{
              background: "rgba(15, 23, 42, 0.45)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              backdropFilter: "blur(10px)"
            }}
          >
            <span className="fw-black fs-5 text-emerald-300 leading-none mb-1">20+</span>
            <span className="text-slate-300 text-[11px] font-medium">Giáo viên bản xứ</span>
          </div>

        </div>

      </div>

      {/* 4. NÚT ĐỔI / UPLOAD BANNER (GÓC PHẢI TRÊN) */}
      <div className="position-absolute top-3 end-3 d-flex align-items-center gap-2" style={{ zIndex: 10 }}>
        
        {/* Nút đặt lại ảnh mặc định (khi đã upload ảnh riêng) */}
        {bannerImage && (
          <button
            type="button"
            className="btn btn-sm px-2.5 py-1.5 rounded-xl text-xs font-semibold text-white shadow-md transition-all hover:bg-red-600/80 border-0"
            style={{
              background: "rgba(239, 68, 68, 0.6)",
              backdropFilter: "blur(6px)"
            }}
            onClick={handleResetBanner}
            title="Khôi phục banner mặc định"
          >
            <i className="fa fa-undo me-1"></i> Mặc định
          </button>
        )}

        {/* Nút Upload Banner */}
        <input 
          type="file" 
          ref={fileInputRef} 
          className="d-none" 
          accept="image/*" 
          onChange={handleFileChange} 
        />
        
        <button
          type="button"
          className="btn btn-sm px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-lg transition-all hover:scale-105 active:scale-95 border-0 d-flex align-items-center gap-1.5"
          style={{
            background: "linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.1) 100%)",
            border: "1px solid rgba(255, 255, 255, 0.35)",
            backdropFilter: "blur(8px)"
          }}
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? (
            <span className="spinner-border spinner-border-sm text-cyan-300" style={{ width: '12px', height: '12px' }}></span>
          ) : (
            <i className="fa fa-camera text-cyan-300"></i>
          )}
          <span>{bannerImage ? "Đổi Banner" : "Tải ảnh lên"}</span>
        </button>
      </div>

    </div>
  );
};
