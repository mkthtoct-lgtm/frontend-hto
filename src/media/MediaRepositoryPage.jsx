import { useState, useMemo, useEffect } from "react";
import { MEDIA_COUNTRY_MAP } from "./mockMediaData";
import { API_BASE_URL } from "../config/api";
import { authFetch } from "../auth/session";

const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (isNaN(date)) return '';
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const calculateAge = (dob) => {
  if (!dob) return null;
  const birthDate = new Date(dob);
  if (isNaN(birthDate)) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const getFileExtension = (filename) => {
  if (!filename) return '';
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
};

// Component tiện ích cho Select Quốc gia
const CountrySelect = ({ value, onChange, label, required = false }) => (
  <div className="mb-3">
    <label className="form-label">{label} {required && <span className="text-danger">*</span>}</label>
    <select className="form-select" value={value} onChange={onChange} required={required}>
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

export const MediaRepositoryPage = ({ currentUser }) => {
  const hasPermission = (user, requiredPermission) => {
    const roleKey = String(user?.role?.name || user?.roleName || user?.role || "")
      .trim().toLowerCase().replace(/đ/g, "d").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
    if (roleKey === "admin" || user?.roleId === "69fc5af582ef85451120772a") return true;

    const permissions = Array.isArray(user?.permissions) ? user.permissions : (Array.isArray(user?.grantedPermissions) ? user.grantedPermissions : []);
    return permissions.includes("*") || permissions.includes(requiredPermission);
  };
  
  const canCreate = hasPermission(currentUser, 'media.create');
  const canUpdate = hasPermission(currentUser, 'media.update');
  const canDelete = hasPermission(currentUser, 'media.delete');

  const [activeTab, setActiveTab] = useState("visa_result");
  const [selectedCountry, setSelectedCountry] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMedia, setSelectedMedia] = useState(null);
  
  const [mediaData, setMediaData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // States for Admin Modal
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    category: "visa_result",
    country_tag: "ALL",
    customer_name: "",
    dob: "",
    customer_country: "ALL",
    visa_country: "ALL",
    visa_result_status: "",
    visa_result_date: "",
    notes: "",
    storageProvider: "GOOGLE_DRIVE",
    privacyStatus: "unlisted",
    thumbnail: null
  });

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const res = await authFetch(`${API_BASE_URL}/media?limit=100`);
      if (res.ok) {
        const data = await res.json();
        setMediaData(data.data.medias);
      }
    } catch (err) {
      console.error("Error fetching media", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const tabData = useMemo(() => {
    return mediaData.filter(item => item.category === activeTab);
  }, [mediaData, activeTab]);

  const filteredData = useMemo(() => {
    return tabData.filter(item => {
      const matchCountry = selectedCountry === "ALL" || item.country_tag === selectedCountry || item.country_tag === "ALL";
      const matchSearch = !searchQuery || 
                          item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (item.customer_name_masked && item.customer_name_masked.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (item.customer_name && item.customer_name.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCountry && matchSearch;
    });
  }, [tabData, selectedCountry, searchQuery]);

  const uniqueCountries = useMemo(() => {
    const codes = new Set(tabData.map(item => item.country_tag));
    codes.delete("ALL");
    return Array.from(codes).sort();
  }, [tabData]);

  const handleOpenModal = (media) => {
    setSelectedMedia(media);
  };

  const handleCloseModal = () => {
    setSelectedMedia(null);
  };

  const getImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')) {
      return url;
    }
    const cleanUrl = url.startsWith('/api/v1') ? url.substring(7) : url;
    return `${API_BASE_URL}${cleanUrl}`;
  };

  const getDownloadUrl = (media) => {
    return `${API_BASE_URL}/media/${media._id}/download?forceDownload=true`;
  };
  
  const getPreviewUrl = (media) => {
    return `${API_BASE_URL}/media/${media._id}/download`;
  };

  const parseErrorResponse = async (res, defaultMessage) => {
    try {
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const errData = await res.json();
        return new Error(errData.message || defaultMessage);
      } else {
        const text = await res.text();
        return new Error(`${defaultMessage} (HTTP ${res.status}): ${text.substring(0, 50)}...`);
      }
    } catch (e) {
      return new Error(defaultMessage);
    }
  };

  const handleOpenAdminModal = (media = null) => {
    if (media) {
      setEditData(media);
      setFormData({
        title: media.title || "",
        category: media.category || "visa_result",
        country_tag: media.country_tag || "ALL",
        customer_name: media.customer_name || "",
        dob: media.dob ? new Date(media.dob).toISOString().split('T')[0] : "",
        customer_country: media.customer_country || "ALL",
        visa_country: media.visa_country || "ALL",
        visa_result_status: media.visa_result_status || "",
        visa_result_date: media.visa_result_date ? new Date(media.visa_result_date).toISOString().split('T')[0] : "",
        notes: media.notes || "",
        storageProvider: media.storageProvider || "GOOGLE_DRIVE",
        privacyStatus: media.privacyStatus || "unlisted",
        thumbnail: null
      });
    } else {
      setEditData(null);
      setFormData({
        title: "",
        category: activeTab,
        country_tag: "ALL",
        customer_name: "",
        dob: "",
        customer_country: "ALL",
        visa_country: "ALL",
        visa_result_status: "",
        visa_result_date: "",
        notes: "",
        storageProvider: "GOOGLE_DRIVE",
        privacyStatus: "unlisted",
        thumbnail: null
      });
    }
    setShowAdminModal(true);
  };

  const handleCloseAdminModal = () => {
    setShowAdminModal(false);
    setEditData(null);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append("title", formData.title);
    data.append("category", formData.category);
    data.append("country_tag", formData.country_tag);
    data.append("customer_name", formData.customer_name);
    
    if (formData.dob) data.append("dob", formData.dob);
    data.append("customer_country", formData.customer_country);
    data.append("visa_country", formData.visa_country);
    data.append("visa_result_status", formData.visa_result_status);
    if (formData.visa_result_date) data.append("visa_result_date", formData.visa_result_date);
    data.append("notes", formData.notes);
    
    // Additional fields for V3
    data.append("storageProvider", formData.storageProvider);
    data.append("privacyStatus", formData.privacyStatus);
    
    if (formData.thumbnail) {
      data.append("thumbnail", formData.thumbnail);
    }

    // Determine target URL based on category
    let submitUrl = `${API_BASE_URL}/media`;
    if (formData.category === 'video_library') submitUrl += '/video';
    if (formData.category === 'document') submitUrl += '/document';
    
    if (editData) {
        submitUrl += `/${editData._id}`;
    }

    try {
      const res = await authFetch(submitUrl, {
        method: editData ? "PUT" : "POST",
        body: data
      });
      if (!res.ok) throw await parseErrorResponse(res, editData ? 'Lỗi khi cập nhật' : 'Lỗi khi thêm mới');
      alert(editData ? "Cập nhật thành công!" : "Thêm mới thành công!");
      handleCloseAdminModal();
      fetchMedia();
    } catch (err) {
      console.error(err);
      alert("Có lỗi xảy ra: " + err.message);
    }
  };

  const handleDelete = async (e, id) => {
    if (e) e.stopPropagation();
    if (window.confirm("Bạn có chắc chắn muốn xoá mục này? Hành động này sẽ xóa luôn dữ liệu trên Google Drive / YouTube nếu có.")) {
      try {
        const res = await authFetch(`${API_BASE_URL}/media/${id}`, {
          method: "DELETE"
        });
        if (!res.ok) throw await parseErrorResponse(res, 'Lỗi khi xoá');
        alert("Đã xoá!");
        if (selectedMedia && selectedMedia._id === id) {
          handleCloseModal();
        }
        fetchMedia();
      } catch (err) {
        console.error(err);
        alert("Có lỗi xảy ra: " + err.message);
      }
    }
  };

  const renderVisaResultBadge = (status) => {
    switch (status) {
      case 'approved': return <span className="badge bg-success"><i className="fa fa-check-circle"></i> Đậu Visa</span>;
      case 'rejected': return <span className="badge bg-danger"><i className="fa fa-times-circle"></i> Trượt Visa</span>;
      case 'pending': return <span className="badge bg-warning text-dark"><i className="fa fa-hourglass-half"></i> Đang xử lý</span>;
      case 'cancelled': return <span className="badge bg-secondary"><i className="fa fa-ban"></i> Đã hủy</span>;
      default: return <span className="badge bg-light text-muted border">Chưa cập nhật</span>;
    }
  };
  
  const getFileInputAcceptStr = (category) => {
    if (category === 'visa_result') return "image/*";
    if (category === 'video_library') return "video/mp4,video/avi,video/quicktime,video/x-ms-wmv,video/webm,video/x-flv,video/3gpp,video/x-matroska";
    if (category === 'document') return ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx";
    return "*/*";
  };

  return (
    <div className="d-flex flex-column h-100 bg-slate-50 app-dark:bg-[#0f172a]! overflow-hidden p-3 gap-3">
      {/* Header & Tabs */}
      <div className="bg-white app-dark:bg-[#1e293b]! rounded-2xl p-4 shadow-xs border border-slate-200 app-dark:border-slate-700!">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
          <div>
            <h4 className="fw-bold mb-1 text-slate-800 app-dark:text-slate-100!">Media Repository</h4>
            <p className="text-muted small mb-0 app-dark:text-slate-400!">Lưu trữ kết quả Visa, hình ảnh sự kiện và tài liệu truyền thông</p>
          </div>
          
          <div className="d-flex gap-2">
            {canCreate && (
              <button className="btn btn-primary btn-sm d-flex align-items-center gap-2" onClick={() => handleOpenAdminModal()}>
                <i className="fa fa-plus"></i> Thêm mới
              </button>
            )}
            <div id="media-search-box" className="input-group input-group-sm" style={{ width: "250px" }}>
              <span className="input-group-text bg-transparent border-end-0 border-slate-200 app-dark:border-slate-600!">
                <i className="fa fa-search text-slate-400"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0 border-slate-200 app-dark:border-slate-600! app-dark:bg-[#0f172a]! app-dark:text-slate-100! shadow-none"
                placeholder="Tìm kiếm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Triple View Tabs */}
        <div id="media-tabs" className="d-flex gap-3 border-bottom border-slate-200 app-dark:border-slate-700!">
          <button
            className={`pb-2 px-1 bg-transparent border-0 fw-bold transition-colors ${activeTab === "visa_result" ? "text-cyan-600 app-dark:text-cyan-400! border-bottom border-2 border-cyan-600" : "text-slate-500 hover:text-slate-700"}`}
            onClick={() => { setActiveTab("visa_result"); setSelectedCountry("ALL"); }}
          >
            <i className="fa fa-check-circle me-2"></i>Kết quả Visa
          </button>
          <button
            className={`pb-2 px-1 bg-transparent border-0 fw-bold transition-colors ${activeTab === "video_library" ? "text-cyan-600 app-dark:text-cyan-400! border-bottom border-2 border-cyan-600" : "text-slate-500 hover:text-slate-700"}`}
            onClick={() => { setActiveTab("video_library"); setSelectedCountry("ALL"); }}
          >
            <i className="fa fa-play-circle me-2"></i>Thư viện Video
          </button>
          <button
            className={`pb-2 px-1 bg-transparent border-0 fw-bold transition-colors ${activeTab === "document" ? "text-cyan-600 app-dark:text-cyan-400! border-bottom border-2 border-cyan-600" : "text-slate-500 hover:text-slate-700"}`}
            onClick={() => { setActiveTab("document"); setSelectedCountry("ALL"); }}
          >
            <i className="fa fa-file-pdf me-2"></i>Ấn phẩm & Tài liệu
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div id="media-content-area" className="flex-grow-1 overflow-auto bg-white app-dark:bg-[#1e293b]! rounded-2xl p-4 shadow-xs border border-slate-200 app-dark:border-slate-700!">
        
        {/* Filter Bar (Country) */}
        {uniqueCountries.length > 0 && (
          <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2 w-full scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
            <button
              onClick={() => setSelectedCountry("ALL")}
              className={`shrink-0 px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all duration-200 border ${
                selectedCountry === "ALL"
                  ? "bg-cyan-900 text-white border-cyan-900 shadow-md"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-cyan-300"
              }`}
            >
              Tất cả
            </button>
            {uniqueCountries.map(code => (
              <button
                key={code}
                onClick={() => setSelectedCountry(code)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all duration-200 border flex items-center gap-1.5 ${
                  selectedCountry === code
                    ? "bg-cyan-900 text-white border-cyan-900 shadow-md"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-cyan-300"
                }`}
              >
                <i className="fa fa-earth-americas text-[10px] opacity-70"></i>
                {MEDIA_COUNTRY_MAP[code] || code}
              </button>
            ))}
          </div>
        )}

        {/* Media Grid */}
        {loading ? (
          <div className="text-center py-5"><div className="spinner-border text-primary" role="status"></div></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredData.map(item => (
              <div key={item._id} className="card h-100 border-0 shadow-sm rounded-xl overflow-hidden hover:shadow-md transition-shadow app-dark:bg-[#0f172a]! group">
                {item.category !== 'document' ? (
                  <div 
                    className="position-relative cursor-pointer overflow-hidden bg-slate-100 app-dark:bg-slate-800!" 
                    style={{ aspectRatio: "4/3" }}
                    onClick={() => handleOpenModal(item)}
                  >
                    {item.category === 'video_library' && item.storageProvider === 'YOUTUBE' && item.youtubeVideoId ? (
                      <img 
                        src={`https://img.youtube.com/vi/${item.youtubeVideoId}/hqdefault.jpg`} 
                        alt={item.title} 
                        className="w-100 h-100 object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => { e.target.src = "https://via.placeholder.com/400x300?text=YouTube+Video" }}
                      />
                    ) : (
                      <img 
                        src={getImageUrl(item.thumbnail_url)} 
                        alt={item.title} 
                        className="w-100 h-100 object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => { e.target.src = "https://via.placeholder.com/400x300?text=L%E1%BB%97i+%E1%BA%A3nh" }}
                      />
                    )}
                    
                    {item.category === 'video_library' && (
                      <div className="position-absolute top-50 start-50 translate-middle bg-white bg-opacity-75 rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{ width: "48px", height: "48px" }}>
                        <i className={`fa ${item.storageProvider === 'YOUTUBE' ? 'fa-youtube text-danger' : 'fa-play text-primary'} fs-4 ms-1`}></i>
                      </div>
                    )}
                  </div>
                ) : (
                  <div 
                    className="position-relative cursor-pointer overflow-hidden bg-slate-100 app-dark:bg-slate-800! d-flex flex-column align-items-center justify-content-center" 
                    style={{ aspectRatio: "4/3" }}
                    onClick={() => handleOpenModal(item)}
                  >
                    <i className={`fa ${getFileExtension(item.fileName) === 'pdf' ? 'fa-file-pdf text-danger' : 'fa-file-word text-primary'} display-1 mb-2`}></i>
                    <span className="badge bg-secondary">{getFileExtension(item.fileName).toUpperCase()}</span>
                  </div>
                )}
                
                <div className="card-body p-3">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h6 className="card-title fw-bold text-slate-800 app-dark:text-slate-100! mb-0 text-truncate" title={item.title}>
                      {item.title}
                    </h6>
                    {item.category === 'visa_result' && (
                      <div className="ms-2 shrink-0">
                        {renderVisaResultBadge(item.visa_result_status)}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-slate-600 app-dark:text-slate-400! small mb-2 d-flex flex-column gap-1">
                    <div className="d-flex gap-2">
                      <span className="fw-semibold text-truncate"><i className="fa fa-user text-slate-400 me-1"></i> {item.customer_name || 'Chưa cập nhật'}</span>
                    </div>
                    {item.category === 'visa_result' && (
                      <div className="d-flex gap-2 align-items-center">
                        <span><i className="fa fa-earth-americas text-slate-400 me-1"></i> Visa: {item.visa_country !== 'ALL' && item.visa_country ? MEDIA_COUNTRY_MAP[item.visa_country] || item.visa_country : 'Chưa cập nhật'}</span>
                      </div>
                    )}
                    {item.category === 'document' && item.fileSize && (
                      <div className="d-flex gap-2 align-items-center">
                        <span><i className="fa fa-hdd text-slate-400 me-1"></i> Size: {(item.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                      </div>
                    )}
                    <div className="d-flex justify-content-between text-slate-400 mt-1">
                      {item.category === 'visa_result' && (
                        <span title="Ngày kết quả Visa"><i className="fa fa-calendar-check me-1"></i> {formatDate(item.visa_result_date) || 'Chưa cập nhật'}</span>
                      )}
                      <span title="Ngày tạo"><i className="fa fa-clock me-1"></i> {formatDate(item.createdAt)}</span>
                    </div>
                  </div>
                </div>
                
                {item.category === 'document' && (
                  <div className="card-footer bg-transparent border-top border-slate-100 app-dark:border-slate-700! p-3 pt-2">
                    <a href={getDownloadUrl(item)} className="btn btn-sm btn-light w-100 d-flex align-items-center justify-content-center gap-2 fw-semibold text-cyan-700 app-dark:bg-slate-800! app-dark:text-cyan-400! app-dark:border-slate-600!">
                      <i className="fa fa-download"></i> Tải tài liệu
                    </a>
                  </div>
                )}
              </div>
            ))}
            
            {filteredData.length === 0 && (
              <div className="col-span-full d-flex flex-column align-items-center justify-content-center py-5 text-center">
                <div className="bg-slate-100 app-dark:bg-slate-800! rounded-circle d-flex align-items-center justify-content-center mb-3" style={{ width: "64px", height: "64px" }}>
                  <i className="fa fa-folder-open text-slate-400 fs-3"></i>
                </div>
                <h6 className="fw-bold text-slate-700 app-dark:text-slate-300!">Không tìm thấy dữ liệu</h6>
                <p className="text-slate-500 small">Vui lòng thử bộ lọc hoặc từ khóa tìm kiếm khác.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lightbox Detail Modal */}
      {selectedMedia && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.85)", zIndex: 1050 }} onClick={handleCloseModal}>
          <div className="modal-dialog modal-dialog-centered modal-xl" onClick={e => e.stopPropagation()}>
            <div className="modal-content bg-white app-dark:bg-[#1e293b]! border-0 shadow-lg rounded-4 overflow-hidden flex-column h-100">
              
              {/* Header: Chỉ Title + Close */}
              <div className="modal-header border-bottom border-slate-200 app-dark:border-slate-700! bg-slate-50 app-dark:bg-slate-800! py-3">
                <h5 className="modal-title fw-bold text-slate-800 app-dark:text-slate-100! mb-0 text-truncate">{selectedMedia.title}</h5>
                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
              </div>
              
              {/* Body */}
              <div className="modal-body p-0 flex-grow-1" style={{ overflowY: 'auto' }}>
                <div className="row g-0 h-100">
                  <div className="col-md-7 bg-slate-100 app-dark:bg-slate-900! d-flex align-items-center justify-content-center" style={{ minHeight: "400px" }}>
                    
                    {/* Render Content Based on Category */}
                    {selectedMedia.category === 'visa_result' && (
                      <img 
                        src={getImageUrl(selectedMedia.thumbnail_url)} 
                        alt={selectedMedia.title} 
                        className="img-fluid" 
                        style={{ maxHeight: "70vh", objectFit: "contain" }}
                        onError={(e) => { e.target.src = "https://via.placeholder.com/600x400?text=L%E1%BB%97i+%E1%BA%A3nh" }}
                      />
                    )}

                    {selectedMedia.category === 'video_library' && selectedMedia.storageProvider === 'YOUTUBE' && (
                      <div className="ratio ratio-16x9 w-100">
                        <iframe 
                          src={`https://www.youtube.com/embed/${selectedMedia.youtubeVideoId}?autoplay=1`} 
                          title="YouTube video" 
                          allowFullScreen
                        ></iframe>
                      </div>
                    )}

                    {selectedMedia.category === 'video_library' && selectedMedia.storageProvider === 'GOOGLE_DRIVE' && (
                      <div className="w-100 h-100 d-flex align-items-center justify-content-center bg-black">
                        <video 
                          src={getPreviewUrl(selectedMedia)} 
                          controls 
                          autoPlay 
                          className="w-100" 
                          style={{ maxHeight: "70vh" }}
                        ></video>
                      </div>
                    )}

                    {selectedMedia.category === 'document' && (
                      <div className="w-100 h-100 d-flex flex-column align-items-center justify-content-center p-4">
                         <i className={`fa ${getFileExtension(selectedMedia.fileName) === 'pdf' ? 'fa-file-pdf text-danger' : 'fa-file-word text-primary'} display-1 mb-4`}></i>
                         <h5 className="fw-bold text-center mb-3">{selectedMedia.fileName || selectedMedia.title}</h5>
                         {getFileExtension(selectedMedia.fileName) === 'pdf' ? (
                            <a href={getPreviewUrl(selectedMedia)} target="_blank" rel="noreferrer" className="btn btn-outline-primary mb-2">
                               <i className="fa fa-eye me-2"></i> Xem trước tài liệu
                            </a>
                         ) : (
                            <div className="alert alert-info small text-center mb-2">
                               Định dạng này không hỗ trợ xem trước. Vui lòng tải xuống.
                            </div>
                         )}
                         <a href={getDownloadUrl(selectedMedia)} className="btn btn-primary">
                            <i className="fa fa-download me-2"></i> Tải xuống
                         </a>
                      </div>
                    )}

                  </div>
                  <div className="col-md-5 p-4 overflow-auto" style={{ maxHeight: "70vh" }}>
                    <p className="text-muted small mb-4">
                      Tạo ngày {formatDate(selectedMedia.createdAt)} • Cập nhật {formatDate(selectedMedia.updatedAt)}
                    </p>
                    
                    <div className="d-flex flex-column gap-3">
                      {selectedMedia.category === 'visa_result' && (
                        <div className="p-3 bg-slate-50 app-dark:bg-slate-800! rounded-3 border border-slate-200 app-dark:border-slate-700!">
                          <div className="mb-2"><strong>Kết quả Visa:</strong> <span className="ms-2">{renderVisaResultBadge(selectedMedia.visa_result_status)}</span></div>
                          <div><strong>Ngày kết quả:</strong> <span className="ms-2">{formatDate(selectedMedia.visa_result_date) || "Chưa cập nhật"}</span></div>
                        </div>
                      )}
                      
                      <div className="border-bottom border-slate-200 app-dark:border-slate-700! pb-2">
                        <h6 className="fw-bold text-slate-700 app-dark:text-slate-300!"><i className="fa fa-user-circle me-2"></i>Thông tin Khách hàng</h6>
                        <table className="table table-sm table-borderless text-slate-600 app-dark:text-slate-400! mb-0">
                          <tbody>
                            <tr><td style={{width: "120px"}}>Họ & Tên:</td><td className="fw-semibold text-slate-800 app-dark:text-slate-200!">{selectedMedia.customer_name || "Chưa cập nhật"}</td></tr>
                            <tr><td>Ngày sinh:</td><td>{formatDate(selectedMedia.dob) || "Chưa cập nhật"} {selectedMedia.dob && `(${calculateAge(selectedMedia.dob)} tuổi)`}</td></tr>
                            <tr><td>Quốc gia KH:</td><td>{selectedMedia.customer_country !== 'ALL' && selectedMedia.customer_country ? MEDIA_COUNTRY_MAP[selectedMedia.customer_country] || selectedMedia.customer_country : "Chưa cập nhật"}</td></tr>
                          </tbody>
                        </table>
                      </div>
                      
                      <div className="border-bottom border-slate-200 app-dark:border-slate-700! pb-2">
                        <h6 className="fw-bold text-slate-700 app-dark:text-slate-300!"><i className="fa fa-info-circle me-2"></i>Thông tin thêm</h6>
                        <table className="table table-sm table-borderless text-slate-600 app-dark:text-slate-400! mb-0">
                          <tbody>
                            <tr><td style={{width: "120px"}}>Danh mục:</td><td>
                              {selectedMedia.category === 'visa_result' ? 'Kết quả Visa' : 
                               selectedMedia.category === 'video_library' ? 'Thư viện Video' : 'Ấn phẩm & Tài liệu'}
                            </td></tr>
                            
                            {selectedMedia.category === 'visa_result' && (
                                <>
                                <tr><td>Quốc gia Visa:</td><td>{selectedMedia.visa_country !== 'ALL' && selectedMedia.visa_country ? MEDIA_COUNTRY_MAP[selectedMedia.visa_country] || selectedMedia.visa_country : "Chưa cập nhật"}</td></tr>
                                <tr><td>Country Tag:</td><td>{selectedMedia.country_tag !== 'ALL' ? MEDIA_COUNTRY_MAP[selectedMedia.country_tag] || selectedMedia.country_tag : "Tất cả"}</td></tr>
                                </>
                            )}

                            {selectedMedia.category !== 'visa_result' && (
                                <tr><td>Provider:</td><td><span className={`badge ${selectedMedia.storageProvider === 'YOUTUBE' ? 'bg-danger' : 'bg-primary'}`}>{selectedMedia.storageProvider}</span></td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      {selectedMedia.notes && (
                        <div>
                          <h6 className="fw-bold text-slate-700 app-dark:text-slate-300!"><i className="fa fa-sticky-note me-2"></i>Ghi chú</h6>
                          <div className="p-3 bg-slate-50 app-dark:bg-slate-800! rounded-3 text-slate-600 app-dark:text-slate-400! text-break" style={{ whiteSpace: "pre-wrap" }}>
                            {selectedMedia.notes}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Footer: [Đóng] ----- [Sửa] [Xóa] */}
              <div className="modal-footer bg-slate-50 app-dark:bg-slate-800! border-top border-slate-200 app-dark:border-slate-700! d-flex justify-content-between">
                 <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>Đóng</button>
                 <div className="d-flex gap-2">
                    {canUpdate && (
                      <button className="btn btn-primary" onClick={() => { handleCloseModal(); handleOpenAdminModal(selectedMedia); }}>
                        <i className="fa fa-edit me-1"></i> Sửa
                      </button>
                    )}
                    {canDelete && (
                      <button className="btn btn-danger" onClick={() => handleDelete(null, selectedMedia._id)}>
                        <i className="fa fa-trash me-1"></i> Xóa
                      </button>
                    )}
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Form Modal */}
      {showAdminModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">{editData ? "Cập nhật Media" : "Thêm mới Media"}</h5>
                <button type="button" className="btn-close" onClick={handleCloseAdminModal}></button>
              </div>
              <div className="modal-body overflow-auto" style={{ maxHeight: "75vh" }}>
                <form onSubmit={handleFormSubmit}>
                  <div className="row">
                    <div className="col-md-12 mb-3">
                      <label className="form-label">Tiêu đề <span className="text-danger">*</span></label>
                      <input type="text" className="form-control" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                    </div>
                    
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Danh mục <span className="text-danger">*</span></label>
                      <select className="form-select" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                        <option value="visa_result">Kết quả Visa (Ảnh)</option>
                        <option value="video_library">Thư viện Video</option>
                        <option value="document">Ấn phẩm & Tài liệu</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <CountrySelect 
                        label="Country Tag (Dùng để lọc danh sách)" 
                        value={formData.country_tag} 
                        onChange={e => setFormData({...formData, country_tag: e.target.value})} 
                      />
                    </div>
                  </div>

                  {formData.category === 'video_library' && (
                     <div className="row bg-slate-50 app-dark:bg-slate-800/50! p-3 rounded-3 border border-slate-100 app-dark:border-slate-700! mb-3 mx-0">
                        <h6 className="fw-bold text-primary mb-3">Cấu hình Video Provider</h6>
                        <div className="col-md-6 mb-3">
                           <label className="form-label">Nơi lưu trữ</label>
                           <select className="form-select" value={formData.storageProvider} onChange={e => setFormData({...formData, storageProvider: e.target.value})}>
                              <option value="GOOGLE_DRIVE">Google Drive (Nội bộ)</option>
                              <option value="YOUTUBE">YouTube</option>
                           </select>
                        </div>
                        {formData.storageProvider === 'YOUTUBE' && (
                           <div className="col-md-6 mb-3">
                              <label className="form-label">Trạng thái quyền riêng tư</label>
                              <select className="form-select" value={formData.privacyStatus} onChange={e => setFormData({...formData, privacyStatus: e.target.value})}>
                                 <option value="unlisted">Unlisted (Có link mới xem được)</option>
                                 <option value="private">Private (Chỉ quản trị viên)</option>
                                 <option value="public">Public (Công khai)</option>
                              </select>
                           </div>
                        )}
                     </div>
                  )}
                  
                  <div className="row bg-slate-50 app-dark:bg-slate-800/50! p-3 rounded-3 border border-slate-100 app-dark:border-slate-700! mb-3 mx-0">
                    <h6 className="fw-bold text-primary mb-3">Thông tin Khách hàng & Visa</h6>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Họ & Tên khách hàng</label>
                      <input type="text" className="form-control" value={formData.customer_name} onChange={e => setFormData({...formData, customer_name: e.target.value})} placeholder="Nguyễn Văn A" />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Ngày sinh (DOB)</label>
                      <input type="date" className="form-control" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} />
                    </div>
                    
                    <div className="col-md-6">
                      <CountrySelect 
                        label="Quốc gia của khách hàng" 
                        value={formData.customer_country} 
                        onChange={e => setFormData({...formData, customer_country: e.target.value})} 
                      />
                    </div>
                    
                    <div className="col-md-6">
                      <CountrySelect 
                        label="Quốc gia xin/đậu Visa" 
                        value={formData.visa_country} 
                        onChange={e => setFormData({...formData, visa_country: e.target.value})} 
                      />
                    </div>

                    {formData.category === 'visa_result' && (
                      <>
                        <div className="col-md-6 mb-3">
                          <label className="form-label">Kết quả Visa</label>
                          <select className="form-select" value={formData.visa_result_status} onChange={e => setFormData({...formData, visa_result_status: e.target.value})}>
                            <option value="">-- Chọn kết quả --</option>
                            <option value="pending">Đang xử lý</option>
                            <option value="approved">Đậu Visa</option>
                            <option value="rejected">Trượt Visa</option>
                            <option value="cancelled">Đã hủy</option>
                          </select>
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label">Ngày kết quả Visa</label>
                          <input type="date" className="form-control" value={formData.visa_result_date} onChange={e => setFormData({...formData, visa_result_date: e.target.value})} />
                        </div>
                      </>
                    )}
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Ghi chú / Mô tả YouTube</label>
                    <textarea className="form-control" rows="2" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})}></textarea>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">
                        File đính kèm ({formData.category === 'document' ? 'Tài liệu' : formData.category === 'video_library' ? 'Video' : 'Ảnh'}) 
                        {editData ? " (Để trống nếu không muốn thay đổi)" : <span className="text-danger">*</span>}
                    </label>
                    <input 
                        type="file" 
                        className="form-control" 
                        accept={getFileInputAcceptStr(formData.category)} 
                        onChange={e => setFormData({...formData, thumbnail: e.target.files[0]})} 
                        required={!editData} 
                    />
                    <small className="text-muted d-block mt-1">
                        {formData.category === 'visa_result' && "Cho phép ảnh (JPG, PNG...). Giới hạn 50MB."}
                        {formData.category === 'document' && "Cho phép PDF, Word, Excel, PowerPoint. Giới hạn 50MB."}
                        {formData.category === 'video_library' && "Cho phép MP4, AVI... Giới hạn 1GB. Vui lòng giữ cửa sổ mở cho đến khi hoàn thành tải lên YouTube."}
                    </small>
                  </div>
                  
                  <div className="text-end border-top pt-3">
                    <button type="button" className="btn btn-secondary me-2" onClick={handleCloseAdminModal}>Hủy</button>
                    <button type="submit" className="btn btn-primary d-inline-flex align-items-center gap-2">
                      <i className="fa fa-save"></i> Lưu lại
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
