import React from 'react';

const CountrySelect = ({ value, onChange, label, required = false }) => (
  <div>
    <label className="form-label text-[11px] text-slate-600 app-dark:text-slate-400! font-medium mb-1 d-block">
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    <select 
      className="form-select form-select-sm rounded-xl border-slate-200 bg-white text-slate-800 app-dark:border-slate-700! app-dark:bg-slate-950! app-dark:text-slate-100!" 
      value={value} 
      onChange={onChange} 
      required={required}
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
);

export const MediaFormModal = ({
  editData,
  formData,
  setFormData,
  onSubmit,
  onClose,
  getFileInputAcceptStr
}) => {
  // Ensure default sourceType
  React.useEffect(() => {
    if (!formData.sourceType) setFormData(prev => ({ ...prev, sourceType: 'UPLOAD' }));
    if (!formData.storageProvider) setFormData(prev => ({ ...prev, storageProvider: 'GOOGLE_DRIVE' }));
  }, []);

  const isVideo = formData.category === 'video_library';
  const isDocument = formData.category === 'document';
  const isVisa = formData.category === 'visa_result';

  return (
    <div 
      className="modal fade show d-block" 
      tabIndex="-1" 
      style={{ backgroundColor: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(6px)", zIndex: 1060 }}
      onClick={onClose}
    >
      <div 
        className="modal-dialog modal-dialog-centered modal-lg" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "780px" }}
      >
        <div className="modal-content border-0 rounded-3xl overflow-hidden shadow-2xl bg-white app-dark:bg-[#0f172a]! border border-slate-200 app-dark:border-slate-800! transition-colors duration-300">
          
          {/* HEADER MODAL */}
          <div className="modal-header px-4 py-3.5 border-b border-slate-100 app-dark:border-slate-800! d-flex justify-content-between align-items-center bg-slate-50/80 app-dark:bg-slate-900/60!">
            <div className="d-flex align-items-center gap-2.5">
              <div 
                className="rounded-xl p-2 d-flex align-items-center justify-content-center shadow-md"
                style={{ background: "linear-gradient(135deg, #f43f5e, #e11d48)" }}
              >
                <i className="fa fa-cloud-upload-alt text-white text-xs"></i>
              </div>
              <h5 className="modal-title fw-bold text-slate-800 app-dark:text-white! fs-6 mb-0 tracking-tight">
                {editData ? "Cập nhật Media" : "Thêm mới Media"}
              </h5>
            </div>
            
            <button 
              type="button" 
              className="btn btn-sm btn-light app-dark:btn-dark! rounded-full p-2 text-slate-400 hover:text-slate-700 app-dark:hover:text-white! border-0 transition-colors"
              onClick={onClose}
            >
              <i className="fa fa-times text-xs"></i>
            </button>
          </div>

          {/* BODY FORM */}
          <form onSubmit={onSubmit} id="mediaForm">
            <div className="modal-body p-4 overflow-y-auto" style={{ maxHeight: "75vh" }}>
              
              {/* DANH MỤC & TIÊU ĐỀ */}
              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label text-xs fw-bold text-slate-700 app-dark:text-slate-200!">
                    Danh mục <span className="text-rose-500">*</span>
                  </label>
                  <select 
                    className="form-select form-select-sm rounded-xl border-slate-200 bg-slate-50 text-slate-800 app-dark:border-slate-700! app-dark:bg-slate-900! app-dark:text-slate-100!"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                  >
                    <option value="video_library">Thư viện Video</option>
                    <option value="visa_result">Kết quả Visa (Ảnh)</option>
                    <option value="document">Ấn phẩm & Tài liệu</option>
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label text-xs fw-bold text-slate-700 app-dark:text-slate-200!">
                    Tiêu đề <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    className="form-control form-control-sm rounded-xl border-slate-200 bg-slate-50 text-slate-800 app-dark:border-slate-700! app-dark:bg-slate-900! app-dark:text-slate-100!"
                    placeholder="Nhập tên tiêu đề media..."
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* BLOCK 1: PHÂN LOẠI (TAXONOMY) */}
              {(isVideo || isDocument) && (
                <div className="p-3 mb-3 rounded-2xl border border-slate-200 bg-slate-50/70 app-dark:border-slate-800! app-dark:bg-slate-900/40!">
                  <h6 className="text-[11px] fw-bold text-rose-600 app-dark:text-rose-400! text-uppercase tracking-wider mb-2.5">
                    <i className="fa fa-layer-group me-1.5"></i>Phân loại (Taxonomy)
                  </h6>
                  {isVideo && (
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label text-[11px] text-slate-600 app-dark:text-slate-400!">Loại Video (Video Type)</label>
                        <select 
                          className="form-select form-select-sm rounded-xl border-slate-200 bg-white text-slate-800 app-dark:border-slate-700! app-dark:bg-slate-950! app-dark:text-slate-100!"
                          value={formData.videoType || ''}
                          onChange={(e) => setFormData({ ...formData, videoType: e.target.value })}
                        >
                          <option value="">-- Chọn loại Video --</option>
                          {['Quảng bá thương hiệu', 'Du học', 'Visa', 'Điểm đến / Du lịch', 'Trường / Đối tác', 'Chương trình học', 'Học bổng', 'Đời sống du học sinh', 'Testimonial / Câu chuyện khách hàng', 'Hướng dẫn / How-to', 'Sự kiện / Webinar', 'Tin tức', 'Marketing / Campaign', 'Social Media', 'Đào tạo nội bộ', 'Khác'].map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label text-[11px] text-slate-600 app-dark:text-slate-400!">Mục đích (Video Purpose)</label>
                        <select 
                          className="form-select form-select-sm rounded-xl border-slate-200 bg-white text-slate-800 app-dark:border-slate-700! app-dark:bg-slate-950! app-dark:text-slate-100!"
                          value={formData.videoPurpose || ''}
                          onChange={(e) => setFormData({ ...formData, videoPurpose: e.target.value })}
                        >
                          <option value="">-- Chọn mục đích --</option>
                          {['Website', 'YouTube', 'Facebook', 'TikTok', 'Zalo', 'Presentation', 'Advertising', 'Internal Training', 'Khác'].map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                    </div>
                  )}
                  {isDocument && (
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label text-[11px] text-slate-600 app-dark:text-slate-400!">Loại Tài liệu (Document Type)</label>
                        <select 
                          className="form-select form-select-sm rounded-xl border-slate-200 bg-white text-slate-800 app-dark:border-slate-700! app-dark:bg-slate-950! app-dark:text-slate-100!"
                          value={formData.documentType || ''}
                          onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                        >
                          <option value="">-- Chọn loại tài liệu --</option>
                          {['Brochure', 'Catalogue', 'Flyer', 'Poster', 'Infographic', 'Ấn phẩm Marketing', 'Tài liệu giới thiệu dịch vụ', 'Tài liệu giới thiệu chương trình', 'Tài liệu theo quốc gia / điểm đến', 'Tài liệu sự kiện', 'Website Materials', 'PR / Truyền thông', 'Campaign Material', 'Social Media Material', 'Khác'].map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* BLOCK 2: NGUỒN VÀ LƯU TRỮ */}
              <div className="p-3 mb-3 rounded-2xl border border-slate-200 bg-slate-50/70 app-dark:border-slate-800! app-dark:bg-slate-900/40!">
                <h6 className="text-[11px] fw-bold text-cyan-600 app-dark:text-cyan-400! text-uppercase tracking-wider mb-2.5">
                  <i className="fa fa-server me-1.5"></i>Nguồn và Lưu trữ
                </h6>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label text-[11px] text-slate-600 app-dark:text-slate-400! d-block">
                      Nguồn {isDocument ? 'Tài liệu' : (isVideo ? 'Video' : 'Ảnh')}
                    </label>
                    <div className="d-flex align-items-center gap-3 mt-1.5">
                      <label className="d-flex align-items-center gap-1.5 text-xs text-slate-700 app-dark:text-slate-300! cursor-pointer">
                        <input 
                          type="radio" 
                          name="sourceType" 
                          checked={formData.sourceType === 'UPLOAD'} 
                          onChange={() => setFormData({ ...formData, sourceType: 'UPLOAD' })}
                          className="form-check-input mt-0" 
                        />
                        <span>Upload File</span>
                      </label>
                      {(isVideo || isDocument) && (
                        <label className="d-flex align-items-center gap-1.5 text-xs text-slate-700 app-dark:text-slate-300! cursor-pointer">
                          <input 
                            type="radio" 
                            name="sourceType" 
                            checked={formData.sourceType === 'EXTERNAL_LINK'} 
                            onChange={() => setFormData({ ...formData, sourceType: 'EXTERNAL_LINK' })}
                            className="form-check-input mt-0" 
                          />
                          <span>Dán Link có sẵn</span>
                        </label>
                      )}
                    </div>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label text-[11px] text-slate-600 app-dark:text-slate-400!">Nơi lưu trữ</label>
                    <select 
                      className="form-select form-select-sm rounded-xl border-slate-200 bg-white text-slate-800 app-dark:border-slate-700! app-dark:bg-slate-950! app-dark:text-slate-100!"
                      value={formData.storageProvider || 'GOOGLE_DRIVE'}
                      onChange={(e) => setFormData({ ...formData, storageProvider: e.target.value })}
                      disabled={isDocument || isVisa}
                    >
                      <option value="GOOGLE_DRIVE">Google Drive (Nội bộ)</option>
                      {isVideo && <option value="YOUTUBE">YouTube</option>}
                    </select>
                    {(isDocument || isVisa) && <small className="text-slate-400 text-[10px] d-block mt-0.5">Danh mục này chỉ hỗ trợ Google Drive.</small>}
                  </div>

                  {formData.storageProvider === 'YOUTUBE' && formData.sourceType === 'UPLOAD' && (
                    <div className="col-md-6">
                      <label className="form-label text-[11px] text-slate-600 app-dark:text-slate-400!">Trạng thái quyền riêng tư YouTube</label>
                      <select 
                        className="form-select form-select-sm rounded-xl border-slate-200 bg-white text-slate-800 app-dark:border-slate-700! app-dark:bg-slate-950! app-dark:text-slate-100!"
                        value={formData.privacyStatus || 'unlisted'} 
                        onChange={e => setFormData({...formData, privacyStatus: e.target.value})}
                      >
                        <option value="unlisted">Unlisted (Có link mới xem được)</option>
                        <option value="private">Private (Chỉ quản trị viên)</option>
                        <option value="public">Public (Công khai)</option>
                      </select>
                    </div>
                  )}

                  {/* LOGIC INPUT FILE/LINK */}
                  <div className="col-12 mt-1">
                    {formData.sourceType === 'EXTERNAL_LINK' ? (
                      <div>
                        <label className="form-label text-[11px] text-slate-600 app-dark:text-slate-400!">
                          {formData.storageProvider === 'YOUTUBE' ? 'YouTube Video ID hoặc URL' : 'Google Drive File ID hoặc URL'}
                          <span className="text-rose-500">*</span>
                        </label>
                        <input 
                          type="text" 
                          className="form-control form-control-sm rounded-xl border-slate-200 bg-white text-slate-800 app-dark:border-slate-700! app-dark:bg-slate-950! app-dark:text-slate-100!"
                          required 
                          value={formData.storageProvider === 'YOUTUBE' ? (formData.youtubeVideoId || '') : (formData.storageFileId || '')}
                          onChange={e => {
                            const val = e.target.value;
                            if (formData.storageProvider === 'YOUTUBE') {
                              setFormData({...formData, youtubeVideoId: val});
                            } else {
                              setFormData({...formData, storageFileId: val});
                            }
                          }}
                          placeholder={formData.storageProvider === 'YOUTUBE' ? 'VD: dQw4w9WgXcQ' : 'VD: 1BxiMVs0X...'}
                        />
                        <small className="text-slate-400 text-[10px] d-block mt-1">Dán ID hoặc link của file. File gốc sẽ KHÔNG bị thay đổi hoặc tải xuống.</small>
                      </div>
                    ) : (
                      <div>
                        <label className="form-label text-[11px] text-slate-600 app-dark:text-slate-400!">
                          File đính kèm {!editData && <span className="text-rose-500">*</span>}
                        </label>
                        <input 
                          type="file" 
                          className="form-control form-control-sm rounded-xl border-slate-200 bg-white text-slate-800 app-dark:border-slate-700! app-dark:bg-slate-950! app-dark:text-slate-100!"
                          accept={getFileInputAcceptStr(formData.category)}
                          onChange={(e) => setFormData({ ...formData, thumbnail: e.target.files[0] })}
                          required={!editData && formData.sourceType !== 'EXTERNAL_LINK'}
                        />
                        <small className="text-slate-400 text-[10px] d-block mt-1">
                          {isVisa && "Cho phép ảnh (JPG, PNG...). Giới hạn 50MB."}
                          {isDocument && "Cho phép PDF, Word, Excel, PowerPoint. Giới hạn 50MB."}
                          {isVideo && formData.storageProvider === 'YOUTUBE' && "Cho phép MP4, AVI... Giới hạn 1GB. Sẽ được tải lên YouTube."}
                          {isVideo && formData.storageProvider === 'GOOGLE_DRIVE' && "Cho phép MP4, AVI... Giới hạn 1GB. Sẽ được tải lên Google Drive."}
                        </small>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* BLOCK 3: THÔNG TIN KHÁCH HÀNG & QUỐC GIA */}
              <div className="p-3 mb-3 rounded-2xl border border-slate-200 bg-slate-50/70 app-dark:border-slate-800! app-dark:bg-slate-900/40!">
                <h6 className="text-[11px] fw-bold text-amber-600 app-dark:text-amber-400! text-uppercase tracking-wider mb-2.5">
                  <i className="fa fa-user-circle me-1.5"></i>Thông tin Khách hàng & Quốc gia
                </h6>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label text-[11px] text-slate-600 app-dark:text-slate-400!">Họ & Tên khách hàng</label>
                    <input 
                      type="text" 
                      className="form-control form-control-sm rounded-xl border-slate-200 bg-white text-slate-800 app-dark:border-slate-700! app-dark:bg-slate-950! app-dark:text-slate-100!"
                      placeholder="Nguyễn Văn A" 
                      value={formData.customer_name || ''}
                      onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label text-[11px] text-slate-600 app-dark:text-slate-400!">Ngày sinh (DOB)</label>
                    <input 
                      type="date" 
                      className="form-control form-control-sm rounded-xl border-slate-200 bg-white text-slate-800 app-dark:border-slate-700! app-dark:bg-slate-950! app-dark:text-slate-100!"
                      value={formData.dob ? formData.dob.split('T')[0] : ''}
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    />
                  </div>

                  <div className="col-md-4">
                    <CountrySelect 
                      label="Tag Lọc Quốc Gia" 
                      value={formData.country_tag || 'ALL'} 
                      onChange={(e) => setFormData({ ...formData, country_tag: e.target.value })} 
                    />
                  </div>

                  <div className="col-md-4">
                    <CountrySelect 
                      label="Quốc gia khách hàng" 
                      value={formData.customer_country || ''} 
                      onChange={(e) => setFormData({ ...formData, customer_country: e.target.value })} 
                    />
                  </div>

                  <div className="col-md-4">
                    <CountrySelect 
                      label="Quốc gia Visa" 
                      value={formData.visa_country || ''} 
                      onChange={(e) => setFormData({ ...formData, visa_country: e.target.value })} 
                    />
                  </div>

                  {isVisa && (
                    <>
                      <div className="col-md-6">
                        <label className="form-label text-[11px] text-slate-600 app-dark:text-slate-400!">Kết quả Visa</label>
                        <select 
                          className="form-select form-select-sm rounded-xl border-slate-200 bg-white text-slate-800 app-dark:border-slate-700! app-dark:bg-slate-950! app-dark:text-slate-100!"
                          value={formData.visa_result_status || ''} 
                          onChange={e => setFormData({...formData, visa_result_status: e.target.value})}
                        >
                          <option value="">-- Chọn kết quả --</option>
                          <option value="pending">Đang xử lý</option>
                          <option value="approved">Đậu Visa</option>
                          <option value="rejected">Trượt Visa</option>
                          <option value="cancelled">Đã hủy</option>
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label text-[11px] text-slate-600 app-dark:text-slate-400!">Ngày kết quả Visa</label>
                        <input 
                          type="date" 
                          className="form-control form-control-sm rounded-xl border-slate-200 bg-white text-slate-800 app-dark:border-slate-700! app-dark:bg-slate-950! app-dark:text-slate-100!"
                          value={formData.visa_result_date ? formData.visa_result_date.split('T')[0] : ''} 
                          onChange={e => setFormData({...formData, visa_result_date: e.target.value})} 
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* BLOCK 4: GHI CHÚ */}
              <div>
                <label className="form-label text-xs fw-bold text-slate-700 app-dark:text-slate-200!">Ghi chú / Mô tả</label>
                <textarea 
                  rows="3" 
                  className="form-control form-control-sm rounded-xl border-slate-200 bg-slate-50 text-slate-800 app-dark:border-slate-700! app-dark:bg-slate-900! app-dark:text-slate-100!"
                  placeholder="Nhập ghi chú thêm cho media này..."
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                ></textarea>
              </div>

            </div>

            {/* FOOTER ACTION BUTTONS */}
            <div className="modal-footer px-4 py-3 border-t border-slate-100 app-dark:border-slate-800! bg-slate-50/80 app-dark:bg-slate-900/60! d-flex justify-content-end gap-2.5">
              
              {/* Nút Hủy */}
              <button 
                type="button" 
                className="btn btn-sm px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 app-dark:bg-slate-800! app-dark:text-slate-300! app-dark:border-slate-700! app-dark:hover:bg-slate-700! transition-all"
                onClick={onClose}
              >
                Hủy
              </button>

              {/* Nút Lưu Lại (Multi-Color Gradient) */}
              <button 
                type="submit" 
                className="btn btn-sm px-4 py-2 rounded-xl text-xs font-bold text-white d-flex align-items-center gap-2 border-0 shadow-lg transition-all duration-300 hover:scale-105 active:scale-95"
                style={{
                  background: "linear-gradient(135deg, #06b6d4 0%, #3b82f6 40%, #8b5cf6 80%, #d946ef 100%)",
                  boxShadow: "0 4px 18px rgba(59, 130, 246, 0.4)",
                  textShadow: "0 1px 3px rgba(0,0,0,0.3)"
                }}
              >
                <i className="fa fa-save text-xs"></i>
                <span>{editData ? "Lưu thay đổi" : "Lưu lại"}</span>
              </button>

            </div>
          </form>

        </div>
      </div>
    </div>
  );
};
