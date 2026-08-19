import React, { useState, useEffect, useMemo, useRef } from "react";
import { API_BASE_URL } from "../config/api";
import { authFetch } from "../auth/session";

import { MediaCard } from "./components/MediaCard.jsx";
import { MediaFilterPanel } from "./components/MediaFilterPanel.jsx";
import { MediaDetailModal } from "./components/MediaDetailModal.jsx";
import { MediaFormModal } from "./components/MediaFormModal.jsx";
import { EmptyState } from "./components/EmptyState.jsx";
import { ErrorState } from "./components/ErrorState.jsx";
import { MediaCardSkeleton } from "./components/MediaCardSkeleton.jsx";
import { MediaErrorBoundary } from "./components/MediaErrorBoundary.jsx";

// Custom hook for debouncing search input
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

export const MediaRepositoryPage = React.memo(({ currentUser }) => {
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

  // Filter & Search States
  const [activeTab, setActiveTab] = useState("visa_result");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);
  
  const [countryFilter, setCountryFilter] = useState("ALL");
  const [localCountryFilter, setLocalCountryFilter] = useState("ALL");
  const [advancedFilters, setAdvancedFilters] = useState({
    storageProvider: 'ALL',
    storageOwnership: 'ALL',
    videoType: 'ALL',
    documentType: 'ALL',
    visa_result_status: 'ALL',
    createdFrom: '',
    createdTo: ''
  });
  const [localAdvancedFilters, setLocalAdvancedFilters] = useState(advancedFilters);
  
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const filterPanelRef = useRef(null);

  // Data States
  const [mediaData, setMediaData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal States
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [editData, setEditData] = useState(null);
  
  // Video Playback Global State (Single Player Rule)
  const [playingMediaId, setPlayingMediaId] = useState(null);
  
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

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (countryFilter !== "ALL") count++;
    Object.values(advancedFilters).forEach(val => {
      if (val && val !== "ALL") count++;
    });
    return count;
  }, [countryFilter, advancedFilters]);

  // Handle closing filter panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterPanelRef.current && !filterPanelRef.current.contains(event.target)) {
        setIsFilterPanelOpen(false);
      }
    };
    if (isFilterPanelOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isFilterPanelOpen]);

  // Sync local filter with applied filter when opening
  useEffect(() => {
    if (isFilterPanelOpen) {
      setLocalCountryFilter(countryFilter);
      setLocalAdvancedFilters(advancedFilters);
    }
  }, [isFilterPanelOpen, countryFilter, advancedFilters]);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      setError(null);
      // Gọi API sử dụng các query parameters backend thực sự hỗ trợ
      const params = new URLSearchParams();
      params.append('limit', '100');
      params.append('category', activeTab);
      
      if (debouncedSearch) {
        params.append('search', debouncedSearch);
      }
      if (countryFilter !== 'ALL') {
        params.append('country', countryFilter);
      }
      if (advancedFilters.storageProvider && advancedFilters.storageProvider !== 'ALL') params.append('storageProvider', advancedFilters.storageProvider);
      if (advancedFilters.storageOwnership && advancedFilters.storageOwnership !== 'ALL') params.append('storageOwnership', advancedFilters.storageOwnership);
      if (advancedFilters.videoType && advancedFilters.videoType !== 'ALL') params.append('videoType', advancedFilters.videoType);
      if (advancedFilters.documentType && advancedFilters.documentType !== 'ALL') params.append('documentType', advancedFilters.documentType);
      if (advancedFilters.visa_result_status && advancedFilters.visa_result_status !== 'ALL') params.append('visa_result_status', advancedFilters.visa_result_status);
      if (advancedFilters.createdFrom) params.append('createdFrom', advancedFilters.createdFrom);
      if (advancedFilters.createdTo) params.append('createdTo', advancedFilters.createdTo);

      const res = await authFetch(`${API_BASE_URL}/media?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setMediaData(data.data.medias || []);
      } else {
        throw new Error("Không thể tải danh sách media");
      }
    } catch (err) {
      console.error("Error fetching media", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Trigger fetch when these dependencies change
  useEffect(() => {
    fetchMedia();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, debouncedSearch, countryFilter, advancedFilters]);

  const handleApplyFilter = () => {
    setCountryFilter(localCountryFilter);
    setAdvancedFilters(localAdvancedFilters);
  };

  const handleClearFilter = () => {
    setCountryFilter("ALL");
    setLocalCountryFilter("ALL");
    setSearchQuery("");
    const defaultAdvanced = { storageProvider: 'ALL', storageOwnership: 'ALL', videoType: 'ALL', documentType: 'ALL', visa_result_status: 'ALL', createdFrom: '', createdTo: '' };
    setAdvancedFilters(defaultAdvanced);
    setLocalAdvancedFilters(defaultAdvanced);
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
        sourceType: media.sourceType || "UPLOAD",
        youtubeVideoId: media.youtubeVideoId || "",
        storageFileId: media.storageFileId || "",
        videoType: media.videoType || "",
        videoPurpose: media.videoPurpose || "",
        documentType: media.documentType || "",
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
        sourceType: "UPLOAD",
        youtubeVideoId: "",
        storageFileId: "",
        videoType: "",
        videoPurpose: "",
        documentType: "",
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
    
    data.append("storageProvider", formData.storageProvider || "GOOGLE_DRIVE");
    data.append("privacyStatus", formData.privacyStatus || "unlisted");
    
    if (formData.videoType) data.append("videoType", formData.videoType);
    if (formData.videoPurpose) data.append("videoPurpose", formData.videoPurpose);
    if (formData.documentType) data.append("documentType", formData.documentType);
    if (formData.sourceType) data.append("sourceType", formData.sourceType);
    if (formData.youtubeVideoId) data.append("youtubeVideoId", formData.youtubeVideoId);
    if (formData.storageFileId) data.append("storageFileId", formData.storageFileId);
    
    if (formData.thumbnail) {
      data.append("thumbnail", formData.thumbnail);
    }

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
      fetchMedia(); // Reload data
    } catch (err) {
      console.error(err);
      alert("Có lỗi xảy ra: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xoá mục này? Hành động này sẽ xóa luôn dữ liệu trên Google Drive / YouTube nếu có.")) {
      try {
        const res = await authFetch(`${API_BASE_URL}/media/${id}`, {
          method: "DELETE"
        });
        if (!res.ok) throw await parseErrorResponse(res, 'Lỗi khi xoá');
        alert("Đã xoá thành công!");
        
        if (selectedMedia && selectedMedia._id === id) {
          setSelectedMedia(null);
        }
        fetchMedia(); // Reload data
      } catch (err) {
        console.error(err);
        alert("Có lỗi xảy ra: " + err.message);
      }
    }
  };

  const getFileInputAcceptStr = (category) => {
    if (category === 'visa_result') return "image/*";
    if (category === 'video_library') return "video/mp4,video/avi,video/quicktime,video/x-ms-wmv,video/webm,video/x-flv,video/3gpp,video/x-matroska";
    if (category === 'document') return ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx";
    return "*/*";
  };

  return (
    <MediaErrorBoundary>
      <div className="d-flex flex-column h-100 bg-slate-50 app-dark:bg-[#0f172a]! overflow-hidden p-3 gap-3">
        {/* Header & Tabs */}
        <div 
          className="card border-0 shadow-sm rounded-3xl p-4 mb-1 bg-white/95 app-dark:bg-[#0f172a]/95! backdrop-blur-xl border border-slate-200/90 app-dark:border-slate-800/90! transition-all"
          style={{ overflow: 'visible', position: 'relative', zIndex: 100 }}
        >
          <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
            
            {/* Tiêu đề & Giới thiệu */}
            <div>
              <h4 className="fw-bold mb-1 tracking-tight d-flex align-items-center gap-2 text-slate-900 app-dark:text-white!">
                <span className="bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">Media Repository</span>
              </h4>
              <p className="text-slate-500 app-dark:text-slate-400! text-xs mb-0">
                Lưu trữ kết quả Visa, video truyền thông và tài liệu lưu hành
              </p>
            </div>

            {/* CỤM TÌM KIẾM, BỘ LỌC VÀ THÊM MỚI (ĐỒNG BỘ MULTI-GRADIENT) */}
            <div className="d-flex flex-wrap align-items-center gap-2.5">
              {/* 1. Ô TÌM KIẾM TỰ ĐỘNG ĐỔI THEO LIGHT / DARK MODE */}
              <div className="position-relative" style={{ minWidth: "240px" }}>
                <i 
                  className="fa fa-search position-absolute text-xs text-slate-400 app-dark:text-cyan-400!"
                  style={{ 
                    top: "50%", 
                    left: "14px", 
                    transform: "translateY(-50%)", 
                    zIndex: 5, 
                    pointerEvents: "none" 
                  }}
                ></i>
                
                <input
                  type="text"
                  className="form-control form-control-sm rounded-xl text-xs transition-all duration-300 bg-slate-100/90 text-slate-800 border-slate-200 focus:bg-white focus:border-cyan-500 app-dark:bg-slate-900/60! app-dark:text-slate-100! app-dark:border-cyan-500/30! app-dark:focus:bg-slate-900! app-dark:focus:border-cyan-400!"
                  style={{
                    backdropFilter: "blur(10px)",
                    paddingLeft: "36px",
                    paddingRight: searchQuery ? "32px" : "14px",
                    paddingTop: "8px",
                    paddingBottom: "8px",
                    fontSize: "12.5px"
                  }}
                  placeholder="Tìm kiếm media..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />

                {searchQuery && (
                  <button
                    type="button"
                    className="btn btn-link p-0 position-absolute text-slate-400 hover:text-slate-600 app-dark:hover:text-slate-200! border-0"
                    style={{ top: "50%", right: "12px", transform: "translateY(-50%)", fontSize: "14px", textDecoration: "none", zIndex: 5 }}
                    onClick={() => setSearchQuery("")}
                    title="Xóa tìm kiếm"
                  >
                    <i className="fa fa-times-circle"></i>
                  </button>
                )}
              </div>

              {/* 2. CỤM NÚT BỘ LỌC MULTI-COLOR AURORA GRADIENT */}
              <div className="position-relative" ref={filterPanelRef} style={{ zIndex: 1050 }}>
                <button
                  type="button"
                  onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
                  className={`btn btn-sm px-3.5 py-2 rounded-xl text-xs font-bold text-white d-flex align-items-center gap-2 border-0 transition-all duration-300 ${
                    isFilterPanelOpen || activeFilterCount > 0 ? "scale-105" : "hover:scale-105 active:scale-95"
                  }`}
                  style={{
                    /* Dải Gradient 4 màu: Indigo -> Tím Neon -> Hồng Cyber -> Cam Hoàng Hôn */
                    background: isFilterPanelOpen || activeFilterCount > 0
                      ? "linear-gradient(135deg, #4f46e5 0%, #7c3aed 35%, #db2777 70%, #ea580c 100%)"
                      : "linear-gradient(135deg, #6366f1 0%, #8b5cf6 35%, #ec4899 70%, #f97316 100%)",
                    boxShadow: isFilterPanelOpen || activeFilterCount > 0
                      ? "0 6px 20px rgba(236, 72, 153, 0.55), 0 0 0 2px rgba(255, 255, 255, 0.6)"
                      : "0 4px 15px rgba(139, 92, 246, 0.4)",
                    textShadow: "0 1px 3px rgba(0, 0, 0, 0.3)",
                    letterSpacing: "0.2px"
                  }}
                  title="Bộ lọc nâng cao"
                >
                  {/* Icon Phễu lọc với hiệu ứng xoay nhẹ khi mở */}
                  <i 
                    className={`fa fa-filter text-xs transition-transform duration-300 ${isFilterPanelOpen ? "rotate-180 text-amber-200" : "text-white"}`}
                    style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))" }}
                  ></i>
                  
                  <span>Bộ lọc</span>

                  {/* Chấm tròn hoặc số lượng filter active */}
                  {activeFilterCount > 0 ? (
                    <span 
                      className="d-inline-flex align-items-center justify-content-center text-center select-none"
                      style={{
                        backgroundColor: "#ffffff",
                        color: "#7c3aed",
                        fontSize: "10px",
                        fontWeight: "900",
                        minWidth: "18px",
                        height: "18px",
                        borderRadius: "9999px",
                        padding: "0 4px",
                        boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
                        flexShrink: 0,
                      }}
                      title={`Đang áp dụng ${activeFilterCount} bộ lọc`}
                    >
                      <span style={{ lineHeight: "1", display: "inline-block" }}>
                        {activeFilterCount}
                      </span>
                    </span>
                  ) : isFilterPanelOpen && (
                    <span className="rounded-circle bg-amber-300" style={{ width: "6px", height: "6px" }}></span>
                  )}
                </button>

                <MediaFilterPanel 
                  isOpen={isFilterPanelOpen} 
                  onClose={() => setIsFilterPanelOpen(false)}
                  localCountry={localCountryFilter}
                  setLocalCountry={setLocalCountryFilter}
                  localFilters={localAdvancedFilters}
                  setLocalFilters={setLocalAdvancedFilters}
                  onApply={handleApplyFilter}
                  onClear={handleClearFilter}
                  activeTab={activeTab}
                />
              </div>

              {/* 3. NÚT THÊM MỚI (SUNSET CRIMSON MULTI-GRADIENT) */}
              {canCreate && (
                <button
                  type="button"
                  onClick={() => handleOpenAdminModal()}
                  className="btn btn-sm px-4 py-2 rounded-xl text-xs font-bold text-white d-flex align-items-center gap-2 border-0 shadow-lg transition-all duration-300 hover:scale-105 active:scale-95"
                  style={{
                    background: "linear-gradient(135deg, #f43f5e 0%, #e11d48 35%, #ec4899 70%, #fb923c 100%)",
                    boxShadow: "0 4px 16px rgba(244, 63, 94, 0.45)",
                    textShadow: "0 1px 3px rgba(0,0,0,0.3)",
                    letterSpacing: "0.2px"
                  }}
                >
                  <i className="fa fa-plus text-xs" style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))" }}></i>
                  <span>Thêm mới</span>
                </button>
              )}
            </div>
          </div>

          {/* THANH TABS CHUYỂN DANH MỤC */}
          <div className="mt-3 pt-3 border-top border-slate-100 app-dark:border-slate-800/80! d-flex flex-wrap gap-2">
            
            {/* 1. TAB KẾT QUẢ VISA (Gradient Đỏ Nổi Bật) */}
            <button
              type="button"
              onClick={() => { setActiveTab('visa_result'); setCountryFilter('ALL'); }}
              className={`btn btn-sm px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 d-flex align-items-center gap-2 border-0 ${
                activeTab === 'visa_result'
                  ? 'text-white shadow-lg scale-105'
                  : 'text-slate-700 app-dark:text-slate-300! hover:text-rose-500 app-dark:hover:text-rose-400! bg-slate-100 app-dark:bg-slate-800/80! hover:bg-slate-200 app-dark:hover:bg-slate-700!'
              }`}
              style={
                activeTab === 'visa_result'
                  ? {
                      background: "linear-gradient(135deg, #be123c 0%, #e11d48 50%, #f43f5e 100%)",
                      boxShadow: "0 4px 16px rgba(225, 29, 72, 0.45)",
                    }
                  : {}
              }
            >
              <i className={`fa fa-check-circle text-xs ${activeTab === 'visa_result' ? 'text-white' : 'text-rose-500'}`}></i>
              <span>Kết quả Visa</span>
            </button>

            {/* 2. TAB THƯ VIỆN VIDEO (Gradient Xanh Biển Sâu) */}
            <button
              type="button"
              onClick={() => { setActiveTab('video_library'); setCountryFilter('ALL'); }}
              className={`btn btn-sm px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 d-flex align-items-center gap-2 border-0 ${
                activeTab === 'video_library'
                  ? 'text-white shadow-lg scale-105'
                  : 'text-slate-700 app-dark:text-slate-300! hover:text-blue-500 app-dark:hover:text-blue-400! bg-slate-100 app-dark:bg-slate-800/80! hover:bg-slate-200 app-dark:hover:bg-slate-700!'
              }`}
              style={
                activeTab === 'video_library'
                  ? {
                      background: "linear-gradient(135deg, #0284c7 0%, #2563eb 50%, #1d4ed8 100%)",
                      boxShadow: "0 4px 16px rgba(37, 99, 235, 0.45)",
                    }
                  : {}
              }
            >
              <i className={`fa fa-play-circle text-xs ${activeTab === 'video_library' ? 'text-white' : 'text-blue-500'}`}></i>
              <span>Thư viện Video</span>
            </button>

            {/* 3. TAB ẤN PHẨM & TÀI LIỆU (Gradient Cam Hổ Phách) */}
            <button
              type="button"
              onClick={() => { setActiveTab('document'); setCountryFilter('ALL'); }}
              className={`btn btn-sm px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 d-flex align-items-center gap-2 border-0 ${
                activeTab === 'document'
                  ? 'text-white shadow-lg scale-105'
                  : 'text-slate-700 app-dark:text-slate-300! hover:text-amber-500 app-dark:hover:text-amber-400! bg-slate-100 app-dark:bg-slate-800/80! hover:bg-slate-200 app-dark:hover:bg-slate-700!'
              }`}
              style={
                activeTab === 'document'
                  ? {
                      background: "linear-gradient(135deg, #d97706 0%, #ea580c 50%, #f97316 100%)",
                      boxShadow: "0 4px 16px rgba(234, 88, 12, 0.45)",
                    }
                  : {}
              }
            >
              <i className={`fa fa-file-alt text-xs ${activeTab === 'document' ? 'text-white' : 'text-amber-500'}`}></i>
              <span>Ấn phẩm & Tài liệu</span>
            </button>

          </div>
        </div>

        {/* Content Area */}
        <div id="media-content-area" className="flex-grow-1 overflow-auto bg-white app-dark:bg-[#1e293b]! rounded-2xl p-4 shadow-xs border border-slate-200 app-dark:border-slate-700! position-relative">
          
          {error ? (
            <ErrorState message={error} onRetry={fetchMedia} />
          ) : loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => <MediaCardSkeleton key={i} />)}
            </div>
          ) : mediaData.length === 0 ? (
            <EmptyState onClearFilter={(countryFilter !== "ALL" || searchQuery) ? handleClearFilter : null} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {mediaData.map(item => (
                <MediaCard 
                  key={item._id} 
                  item={item} 
                  playingMediaId={playingMediaId}
                  setPlayingMediaId={setPlayingMediaId}
                  onOpenModal={(media) => {
                    setPlayingMediaId(null); // Pause any playing card when opening modal
                    setSelectedMedia(media);
                  }} 
                />
              ))}
            </div>
          )}
        </div>

        {/* Detail Modal */}
        {selectedMedia && (
          <MediaDetailModal 
            selectedMedia={selectedMedia}
            onClose={() => setSelectedMedia(null)}
            canUpdate={canUpdate}
            canDelete={canDelete}
            onEdit={() => { setSelectedMedia(null); handleOpenAdminModal(selectedMedia); }}
            onDelete={() => handleDelete(selectedMedia._id)}
          />
        )}

        {/* Form Modal */}
        {showAdminModal && (
          <MediaFormModal 
            editData={editData}
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleFormSubmit}
            onClose={handleCloseAdminModal}
            getFileInputAcceptStr={getFileInputAcceptStr}
          />
        )}
      </div>
    </MediaErrorBoundary>
  );
});

