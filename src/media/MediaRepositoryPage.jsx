import { useState, useMemo, useEffect } from "react";
import { MEDIA_COUNTRY_MAP } from "./mockMediaData";
import { API_BASE_URL } from "../config/api";
import { authFetch } from "../auth/session";

export const MediaRepositoryPage = () => {
  const [activeTab, setActiveTab] = useState("visa_result"); // "visa_result", "video_library", or "document"
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
    thumbnail: null
  });

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const res = await authFetch(`${API_BASE_URL}/api/v1/media?limit=100`);
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

  // Lọc dữ liệu theo tab
  const tabData = useMemo(() => {
    return mediaData.filter(item => item.category === activeTab);
  }, [mediaData, activeTab]);

  // Lọc theo quốc gia & tìm kiếm
  const filteredData = useMemo(() => {
    return tabData.filter(item => {
      const matchCountry = selectedCountry === "ALL" || item.country_tag === selectedCountry || item.country_tag === "ALL";
      const matchSearch = !searchQuery || 
                          item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (item.customer_name_masked && item.customer_name_masked.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCountry && matchSearch;
    });
  }, [tabData, selectedCountry, searchQuery]);

  // Tạo danh sách quốc gia duy nhất cho tab hiện tại (dùng để render thanh lọc)
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

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  };
  
  const getImageUrl = (url) => {
    if (!url) return "";
    if (url.startsWith('http')) return url;
    return `${API_BASE_URL}${url}`;
  };

  // --- ADMIN FUNCTIONS ---
  const handleOpenAdminModal = (media = null) => {
    if (media) {
      setEditData(media);
      setFormData({
        title: media.title,
        category: media.category,
        country_tag: media.country_tag,
        customer_name: media.customer_name || "",
        thumbnail: null
      });
    } else {
      setEditData(null);
      setFormData({
        title: "",
        category: activeTab,
        country_tag: "ALL",
        customer_name: "",
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
    if (formData.thumbnail) {
      data.append("thumbnail", formData.thumbnail);
    }

    try {
      if (editData) {
        await authFetch(`${API_BASE_URL}/api/v1/media/${editData._id}`, {
          method: "PUT",
          body: data
        });
        alert("Cập nhật thành công!");
      } else {
        await authFetch(`${API_BASE_URL}/api/v1/media`, {
          method: "POST",
          body: data
        });
        alert("Thêm mới thành công!");
      }
      handleCloseAdminModal();
      fetchMedia();
    } catch (err) {
      console.error(err);
      alert("Có lỗi xảy ra: " + err.message);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (window.confirm("Bạn có chắc chắn muốn xoá mục này?")) {
      try {
        await authFetch(`${API_BASE_URL}/api/v1/media/${id}`, {
          method: "DELETE"
        });
        alert("Đã xoá!");
        fetchMedia();
      } catch (err) {
        console.error(err);
        alert("Có lỗi xảy ra khi xoá.");
      }
    }
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
            <button className="btn btn-primary btn-sm d-flex align-items-center gap-2" onClick={() => handleOpenAdminModal()}>
              <i className="fa fa-plus"></i> Thêm mới
            </button>
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
                <div 
                  className="position-relative cursor-pointer overflow-hidden bg-slate-100 app-dark:bg-slate-800!" 
                  style={{ aspectRatio: "4/3" }}
                  onClick={() => handleOpenModal(item)}
                >
                  <img 
                    src={getImageUrl(item.thumbnail_url)} 
                    alt={item.title} 
                    className="w-100 h-100 object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => { e.target.src = "https://via.placeholder.com/400x300?text=No+Image" }}
                  />
                  
                  {/* Overlays based on type */}
                  {item.category === 'video_library' && (
                    <div className="position-absolute top-50 start-50 translate-middle bg-white bg-opacity-75 rounded-circle d-flex align-items-center justify-content-center" style={{ width: "48px", height: "48px" }}>
                      <i className="fa fa-play text-danger fs-5 ms-1"></i>
                    </div>
                  )}
                  {item.category === 'visa_result' && (
                    <div className="position-absolute bottom-0 start-0 w-100 p-2 bg-gradient-to-t from-black/70 to-transparent">
                      <span className="badge bg-success text-white d-flex align-items-center w-fit gap-1 shadow-sm">
                        <i className="fa fa-check-circle"></i> Visa Approved
                      </span>
                    </div>
                  )}

                  {/* Edit/Delete Actions */}
                  <div className="position-absolute top-0 end-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="btn btn-light btn-sm rounded-circle me-1" onClick={(e) => { e.stopPropagation(); handleOpenAdminModal(item); }}>
                      <i className="fa fa-edit text-primary"></i>
                    </button>
                    <button className="btn btn-light btn-sm rounded-circle" onClick={(e) => handleDelete(e, item._id)}>
                      <i className="fa fa-trash text-danger"></i>
                    </button>
                  </div>
                </div>
                
                <div className="card-body p-3">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h6 className="card-title fw-bold text-slate-800 app-dark:text-slate-100! mb-0 text-truncate" title={item.title}>
                      {item.title}
                    </h6>
                    {item.country_tag !== "ALL" && (
                      <span className="badge bg-slate-100 text-slate-600 app-dark:bg-slate-700! app-dark:text-slate-300! border border-slate-200 app-dark:border-slate-600! ms-2 shrink-0">
                        {MEDIA_COUNTRY_MAP[item.country_tag] || item.country_tag}
                      </span>
                    )}
                  </div>
                  
                  {item.customer_name_masked && (
                    <p className="card-text text-slate-500 app-dark:text-slate-400! small mb-1">
                      <i className="fa fa-user me-1"></i> Khách hàng: <span className="fw-semibold">{item.customer_name_masked}</span>
                    </p>
                  )}
                  
                  <p className="card-text text-slate-400 small mb-0">
                    <i className="fa fa-calendar-alt me-1"></i> {formatDate(item.createdAt)}
                  </p>
                </div>
                
                {/* Actions for Document/Video */}
                {item.category === 'document' && (
                  <div className="card-footer bg-transparent border-top border-slate-100 app-dark:border-slate-700! p-3 pt-2">
                    <a href={getImageUrl(item.thumbnail_url)} download className="btn btn-sm btn-light w-100 d-flex align-items-center justify-content-center gap-2 fw-semibold text-cyan-700 app-dark:bg-slate-800! app-dark:text-cyan-400! app-dark:border-slate-600!">
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

      {/* Lightbox Modal */}
      {selectedMedia && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.85)", zIndex: 1050 }} onClick={handleCloseModal}>
          <div className="modal-dialog modal-dialog-centered modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-content bg-transparent border-0 shadow-none">
              <div className="modal-header border-0 pb-0 justify-content-end">
                <button type="button" className="btn-close btn-close-white" onClick={handleCloseModal}></button>
              </div>
              <div className="modal-body p-0 text-center">
                {selectedMedia.category === 'video_library' ? (
                  <div className="ratio ratio-16x9 rounded-3 overflow-hidden shadow-lg">
                    {/* Placeholder for actual video, showing thumbnail for now */}
                    <img src={getImageUrl(selectedMedia.thumbnail_url)} alt={selectedMedia.title} className="img-fluid rounded-3" />
                  </div>
                ) : (
                  <div className="position-relative d-inline-block">
                    <img 
                      src={getImageUrl(selectedMedia.thumbnail_url)} 
                      alt={selectedMedia.title} 
                      className="img-fluid rounded-3 shadow-lg" 
                      style={{ maxHeight: "80vh", objectFit: "contain" }}
                    />
                    {selectedMedia.category === 'visa_result' && selectedMedia.customer_name_masked && (
                      <div className="position-absolute bottom-0 start-0 w-100 p-3 bg-gradient-to-t from-black/80 to-transparent text-start rounded-bottom-3">
                        <h5 className="text-white fw-bold mb-1">{selectedMedia.title}</h5>
                        <p className="text-white-50 mb-0">Khách hàng: {selectedMedia.customer_name_masked} | Ngày cấp: {formatDate(selectedMedia.createdAt)}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Modal */}
      {showAdminModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">{editData ? "Cập nhật Media" : "Thêm mới Media"}</h5>
                <button type="button" className="btn-close" onClick={handleCloseAdminModal}></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleFormSubmit}>
                  <div className="mb-3">
                    <label className="form-label">Tiêu đề</label>
                    <input type="text" className="form-control" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Danh mục</label>
                    <select className="form-select" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                      <option value="visa_result">Kết quả Visa</option>
                      <option value="video_library">Thư viện Video</option>
                      <option value="document">Ấn phẩm & Tài liệu</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Quốc gia</label>
                    <select className="form-select" value={formData.country_tag} onChange={e => setFormData({...formData, country_tag: e.target.value})}>
                      <option value="ALL">Tất cả / Không xác định</option>
                      <option value="DE">Đức</option>
                      <option value="AU">Úc</option>
                      <option value="CA">Canada</option>
                      <option value="US">Mỹ</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Tên khách hàng (nếu có)</label>
                    <input type="text" className="form-control" value={formData.customer_name} onChange={e => setFormData({...formData, customer_name: e.target.value})} placeholder="Nguyễn Văn A" />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Ảnh đính kèm</label>
                    <input type="file" className="form-control" accept="image/*" onChange={e => setFormData({...formData, thumbnail: e.target.files[0]})} />
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
    </div>
  );
};
