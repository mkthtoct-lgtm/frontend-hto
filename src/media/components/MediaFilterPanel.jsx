import React from 'react';

export const MediaFilterPanel = ({ 
  isOpen, 
  onClose, 
  localCountry,
  setLocalCountry,
  localFilters,
  setLocalFilters,
  onApply, 
  onClear,
  activeTab
}) => {
  if (!isOpen) return null;

  const handleApply = () => {
    onApply();
    onClose();
  };

  const handleClear = () => {
    onClear();
    onClose();
  };

  const handleFilterChange = (field, value) => {
    setLocalFilters(prev => ({ ...prev, [field]: value }));
  };

  const isVideo = activeTab === 'video_library';
  const isDocument = activeTab === 'document';
  const isVisa = activeTab === 'visa_result';

  return (
    <div className="position-absolute top-100 end-0 mt-2 bg-white app-dark:bg-[#1e293b]! border border-slate-200 app-dark:border-slate-700! shadow-lg rounded-xl p-4 z-50" style={{ width: "380px", zIndex: 1050 }}>
      <div className="d-flex justify-content-between align-items-center border-bottom border-slate-100 app-dark:border-slate-700! pb-2 mb-3">
        <h6 className="fw-bold mb-0 text-slate-800 app-dark:text-slate-100!">Bộ lọc nâng cao</h6>
        <button className="btn-close text-[10px]" onClick={onClose}></button>
      </div>
      
      <div className="row g-3 mb-3">
        {/* QUỐC GIA */}
        <div className="col-12">
          <label className="form-label text-sm fw-semibold text-slate-700 app-dark:text-slate-300!">Quốc gia</label>
          <select 
            className="form-select form-select-sm" 
            value={localCountry} 
            onChange={(e) => setLocalCountry(e.target.value)}
          >
            <option value="ALL">Tất cả / Không xác định</option>
            <optgroup label="Châu Á">
              <option value="VN">Việt Nam</option>
              <option value="JP">Nhật Bản</option>
              <option value="KR">Hàn Quốc</option>
              <option value="CN">Trung Quốc</option>
              <option value="TW">Đài Loan</option>
              <option value="SG">Singapore</option>
              <option value="MY">Malaysia</option>
              <option value="TH">Thái Lan</option>
              <option value="ID">Indonesia</option>
              <option value="PH">Philippines</option>
              <option value="IN">Ấn Độ</option>
              <option value="HK">Hong Kong</option>
              <option value="MO">Macau</option>
              <option value="AE">UAE</option>
            </optgroup>
            <optgroup label="Châu Âu">
              <option value="GB">Anh</option>
              <option value="FR">Pháp</option>
              <option value="DE">Đức</option>
            </optgroup>
            <optgroup label="Châu Mỹ">
              <option value="US">Mỹ</option>
              <option value="CA">Canada</option>
            </optgroup>
            <optgroup label="Châu Úc">
              <option value="AU">Úc</option>
            </optgroup>
          </select>
        </div>

        {/* NỀN TẢNG & SỞ HỮU */}
        {(isVideo || isDocument) && (
          <>
            <div className="col-6">
              <label className="form-label text-xs fw-semibold text-slate-500">Nền tảng</label>
              <select className="form-select form-select-sm" value={localFilters.storageProvider || 'ALL'} onChange={e => handleFilterChange('storageProvider', e.target.value)}>
                <option value="ALL">Tất cả</option>
                <option value="GOOGLE_DRIVE">Google Drive</option>
                {isVideo && <option value="YOUTUBE">YouTube</option>}
              </select>
            </div>
            <div className="col-6">
              <label className="form-label text-xs fw-semibold text-slate-500">Sở hữu / Nguồn</label>
              <select className="form-select form-select-sm" value={localFilters.storageOwnership || 'ALL'} onChange={e => handleFilterChange('storageOwnership', e.target.value)}>
                <option value="ALL">Tất cả</option>
                <option value="MANAGED">Upload trực tiếp</option>
                <option value="EXTERNAL">Link bên ngoài</option>
              </select>
            </div>
          </>
        )}

        {/* THỂ LOẠI */}
        {isVideo && (
          <div className="col-12">
            <label className="form-label text-xs fw-semibold text-slate-500">Loại Video (Video Type)</label>
            <select className="form-select form-select-sm" value={localFilters.videoType || 'ALL'} onChange={e => handleFilterChange('videoType', e.target.value)}>
              <option value="ALL">Tất cả</option>
              {['Quảng bá thương hiệu', 'Du học', 'Visa', 'Điểm đến / Du lịch', 'Trường / Đối tác', 'Chương trình học', 'Học bổng', 'Đời sống du học sinh', 'Testimonial / Câu chuyện khách hàng', 'Hướng dẫn / How-to', 'Sự kiện / Webinar', 'Tin tức', 'Marketing / Campaign', 'Social Media', 'Đào tạo nội bộ', 'Khác'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        )}

        {isDocument && (
          <div className="col-12">
            <label className="form-label text-xs fw-semibold text-slate-500">Loại Tài liệu (Document Type)</label>
            <select className="form-select form-select-sm" value={localFilters.documentType || 'ALL'} onChange={e => handleFilterChange('documentType', e.target.value)}>
              <option value="ALL">Tất cả</option>
              {['Brochure', 'Catalogue', 'Flyer', 'Poster', 'Infographic', 'Ấn phẩm Marketing', 'Tài liệu giới thiệu dịch vụ', 'Tài liệu giới thiệu chương trình', 'Tài liệu theo quốc gia / điểm đến', 'Tài liệu sự kiện', 'Website Materials', 'PR / Truyền thông', 'Campaign Material', 'Social Media Material', 'Khác'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        )}

        {isVisa && (
          <div className="col-12">
            <label className="form-label text-xs fw-semibold text-slate-500">Kết quả Visa</label>
            <select className="form-select form-select-sm" value={localFilters.visa_result_status || 'ALL'} onChange={e => handleFilterChange('visa_result_status', e.target.value)}>
              <option value="ALL">Tất cả</option>
              <option value="pending">Đang xử lý</option>
              <option value="approved">Đậu Visa</option>
              <option value="rejected">Trượt Visa</option>
              <option value="cancelled">Đã hủy</option>
            </select>
          </div>
        )}

        {/* THỜI GIAN */}
        <div className="col-6">
          <label className="form-label text-xs fw-semibold text-slate-500">Từ ngày</label>
          <input type="date" className="form-control form-control-sm" value={localFilters.createdFrom || ''} onChange={e => handleFilterChange('createdFrom', e.target.value)} />
        </div>
        <div className="col-6">
          <label className="form-label text-xs fw-semibold text-slate-500">Đến ngày</label>
          <input type="date" className="form-control form-control-sm" value={localFilters.createdTo || ''} onChange={e => handleFilterChange('createdTo', e.target.value)} />
        </div>
      </div>

      <div className="d-flex justify-content-between gap-2 mt-4 pt-3 border-top border-slate-100 app-dark:border-slate-700!">
        <button className="btn btn-light btn-sm flex-grow-1" onClick={handleClear}>Xóa lọc</button>
        <button className="btn btn-primary btn-sm flex-grow-1" onClick={handleApply}>Áp dụng</button>
      </div>
    </div>
  );
};
