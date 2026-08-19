import React, { useState, useEffect, useMemo, useRef } from 'react';
import { API_BASE_URL } from '../config/api';
import { authFetch } from '../auth/session';
import { fetchMediaAccessUrl, getFileExtension, formatDate } from '../media/components/mediaUtils.jsx';
import './DocumentSearchPage.css';

// Custom Dropdown Menu chống tràn, hỗ trợ Glassmorphism mượt mà cả 2 theme
const CustomSelect = ({ value, onChange, options, icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedOption = options.find(opt => opt.value === value) || options[0];

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  return (
    <div className={`doc-custom-dropdown-container ${isOpen ? 'dropdown-active-portal' : ''}`} ref={dropdownRef}>
      <button
        type="button"
        className={`doc-dropdown-trigger-btn ${isOpen ? 'is-active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="d-flex align-items-center gap-2 text-truncate">
          {icon && <i className={`${icon} doc-dropdown-icon`}></i>}
          <span className="doc-dropdown-selected-label text-truncate">{selectedOption.label}</span>
        </div>
        <i className={`fa fa-chevron-down doc-dropdown-chevron ${isOpen ? 'is-rotated' : ''}`}></i>
      </button>

      {isOpen && (
        <div className="doc-dropdown-menu-list animate-dropdown-pop">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <div
                key={opt.value}
                className={`doc-dropdown-item ${isSelected ? 'is-selected' : ''}`}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
              >
                <span className="doc-item-text">{opt.label}</span>
                {isSelected && <i className="fa fa-check text-cyan-500 doc-check-icon"></i>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const DocumentSearchPage = React.memo(() => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [warningMsg, setWarningMsg] = useState('');
  
  const [allItems, setAllItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);

  // Bộ lọc & Tìm kiếm
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSource, setFilterSource] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');

  const [isActionLoading, setIsActionLoading] = useState(false);

  const sourceOptions = [
    { value: 'ALL', label: 'Tất cả nguồn (2 Nguồn)' },
    { value: 'DOCUMENT', label: 'Tài liệu & Biểu mẫu' },
    { value: 'MEDIA', label: 'Media Repository' }
  ];

  const typeOptions = [
    { value: 'ALL', label: 'Tất cả định dạng' },
    { value: 'PDF', label: 'PDF' },
    { value: 'DOCX', label: 'DOCX / Word' },
    { value: 'PPTX', label: 'PPTX / Slide' },
    { value: 'MP4', label: 'MP4 / Video' },
    { value: 'JPG', label: 'JPG / PNG Ảnh' }
  ];

  const sortOptions = [
    { value: 'newest', label: 'Mới cập nhật nhất' },
    { value: 'oldest', label: 'Cũ nhất' },
    { value: 'title', label: 'Theo tên A - Z' }
  ];

  // Hệ thống màu Prism Gradient cho định dạng file
  const renderFileTypeBadge = (type) => {
    const ext = (type || 'DOC').toUpperCase();

    const badgeConfigs = {
      DOCX: { gradient: "linear-gradient(135deg, #38bdf8 0%, #2563eb 50%, #1d4ed8 100%)", shadow: "rgba(37, 99, 235, 0.4)", border: "rgba(56, 189, 248, 0.4)" },
      DOC:  { gradient: "linear-gradient(135deg, #38bdf8 0%, #2563eb 50%, #1d4ed8 100%)", shadow: "rgba(37, 99, 235, 0.4)", border: "rgba(56, 189, 248, 0.4)" },
      PDF:  { gradient: "linear-gradient(135deg, #fb7185 0%, #e11d48 50%, #be123c 100%)", shadow: "rgba(225, 29, 72, 0.4)", border: "rgba(251, 113, 133, 0.4)" },
      MP4:  { gradient: "linear-gradient(135deg, #22d3ee 0%, #0284c7 50%, #0369a1 100%)", shadow: "rgba(6, 182, 212, 0.4)", border: "rgba(34, 211, 238, 0.4)" },
      VIDEO:{ gradient: "linear-gradient(135deg, #22d3ee 0%, #0284c7 50%, #0369a1 100%)", shadow: "rgba(6, 182, 212, 0.4)", border: "rgba(34, 211, 238, 0.4)" },
      PNG:  { gradient: "linear-gradient(135deg, #34d399 0%, #059669 50%, #047857 100%)", shadow: "rgba(5, 150, 105, 0.4)", border: "rgba(52, 211, 153, 0.4)" },
      JPG:  { gradient: "linear-gradient(135deg, #34d399 0%, #059669 50%, #047857 100%)", shadow: "rgba(5, 150, 105, 0.4)", border: "rgba(52, 211, 153, 0.4)" },
      IMG:  { gradient: "linear-gradient(135deg, #34d399 0%, #059669 50%, #047857 100%)", shadow: "rgba(5, 150, 105, 0.4)", border: "rgba(52, 211, 153, 0.4)" },
      PPTX: { gradient: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)", shadow: "rgba(245, 158, 11, 0.4)", border: "rgba(251, 191, 36, 0.4)" },
      PPT:  { gradient: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)", shadow: "rgba(245, 158, 11, 0.4)", border: "rgba(251, 191, 36, 0.4)" },
      XLSX: { gradient: "linear-gradient(135deg, #2dd4bf 0%, #0d9488 50%, #115e59 100%)", shadow: "rgba(13, 148, 136, 0.4)", border: "rgba(45, 212, 191, 0.4)" },
      TXT:  { gradient: "linear-gradient(135deg, #c084fc 0%, #7c3aed 50%, #6d28d9 100%)", shadow: "rgba(124, 58, 237, 0.4)", border: "rgba(192, 132, 252, 0.4)" },
    };

    const config = badgeConfigs[ext] || {
      gradient: "linear-gradient(135deg, #94a3b8 0%, #64748b 50%, #475569 100%)",
      shadow: "rgba(100, 116, 139, 0.3)",
      border: "rgba(148, 163, 184, 0.35)",
    };

    return (
      <span
        className="doc-format-badge select-none"
        style={{
          background: config.gradient,
          boxShadow: `0 2px 8px ${config.shadow}`,
          border: `1px solid ${config.border}`,
        }}
      >
        {ext}
      </span>
    );
  };

  const normalizeDocItem = (doc) => ({
    id: doc._id || doc.id,
    title: doc.title || doc.name || 'Tài liệu không tên',
    description: doc.description || doc.notes || '',
    source: 'DOCUMENT',
    sourceLabel: 'Tài liệu & Biểu mẫu',
    category: doc.category?.name || doc.categoryName || (typeof doc.category === 'string' ? doc.category : '') || 'Kho lưu trữ nội bộ',
    department: doc.department?.name || doc.departmentName || (typeof doc.department === 'string' ? doc.department : '') || 'Toàn công ty',
    fileType: (doc.fileType || getFileExtension(doc.fileName || doc.title) || 'DOC').toUpperCase(),
    status: doc.status || 'Đang dùng',
    date: doc.updatedAt || doc.createdAt || new Date().toISOString(),
    downloadCount: doc.downloadCount || 0,
    author: doc.uploadedBy?.name || doc.ownerName || 'Hệ thống',
    version: doc.version || 'v1.0',
    fileSize: doc.fileSize || 0,
    raw: doc
  });

  const normalizeMediaItem = (media) => {
    let catLabel = 'Ấn phẩm & Tài liệu';
    if (media.category === 'video_library') catLabel = 'Thư viện Video';
    if (media.category === 'visa_result') catLabel = 'Kết quả Visa';

    let ext = getFileExtension(media.fileName || media.title);
    if (!ext) {
      ext = media.category === 'video_library' ? 'MP4' : (media.category === 'visa_result' ? 'JPG' : 'DOCX');
    }

    return {
      id: media._id || media.id,
      title: media.title || media.fileName || 'Media không tên',
      description: media.notes || (media.customer_name ? `Khách hàng: ${media.customer_name}` : ''),
      source: 'MEDIA',
      sourceLabel: 'Media Repository',
      category: catLabel,
      department: media.customer_country && media.customer_country !== 'ALL' ? `Thị trường ${media.customer_country}` : 'Truyền thông & Media',
      fileType: ext.toUpperCase(),
      status: media.visa_result_status || 'Đang lưu hành',
      date: media.updatedAt || media.createdAt || new Date().toISOString(),
      downloadCount: media.views || 0,
      author: media.customer_name || media.storageProvider || 'Media Team',
      version: media.storageProvider || 'Cloud',
      fileSize: media.fileSize || 0,
      raw: media
    };
  };

  const fetchUnifiedData = async () => {
    try {
      setLoading(true);
      setError(null);
      setWarningMsg('');

      const [docsResult, mediaResult] = await Promise.allSettled([
        authFetch(`${API_BASE_URL}/documents?limit=100`),
        authFetch(`${API_BASE_URL}/media?limit=100`)
      ]);

      let docsList = [];
      let mediaList = [];
      let failCount = 0;

      if (docsResult.status === 'fulfilled' && docsResult.value.ok) {
        const dJson = await docsResult.value.json();
        const rawDocs = dJson?.data?.documents || dJson?.data?.items || dJson?.data || dJson?.documents || [];
        docsList = Array.isArray(rawDocs) ? rawDocs.map(normalizeDocItem) : [];
      } else {
        failCount++;
      }

      if (mediaResult.status === 'fulfilled' && mediaResult.value.ok) {
        const mJson = await mediaResult.value.json();
        const rawMedia = mJson?.data?.medias || mJson?.data?.items || mJson?.data || mJson?.medias || [];
        mediaList = Array.isArray(rawMedia) ? rawMedia.map(normalizeMediaItem) : [];
      } else {
        failCount++;
      }

      if (failCount === 2) {
        throw new Error('Không thể kết nối đến cả 2 nguồn dữ liệu (Documents & Media Repository).');
      } else if (failCount === 1) {
        setWarningMsg('Một nguồn dữ liệu đang gián đoạn, hệ thống đang hiển thị nguồn khả dụng.');
      }

      const combined = [...docsList, ...mediaList];
      setAllItems(combined);
      if (combined.length > 0 && !selectedItem) {
        setSelectedItem(combined[0]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnifiedData();
  }, []);

  const filteredItems = useMemo(() => {
    return allItems
      .filter(item => {
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          const matchTitle = item.title.toLowerCase().includes(term);
          const matchDesc = item.description.toLowerCase().includes(term);
          const matchDept = item.department.toLowerCase().includes(term);
          const matchCat = item.category.toLowerCase().includes(term);
          if (!matchTitle && !matchDesc && !matchDept && !matchCat) return false;
        }
        if (filterSource !== 'ALL' && item.source !== filterSource) return false;
        if (filterType !== 'ALL' && item.fileType !== filterType) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.date) - new Date(a.date);
        if (sortBy === 'oldest') return new Date(a.date) - new Date(b.date);
        if (sortBy === 'title') return a.title.localeCompare(b.title);
        return 0;
      });
  }, [allItems, searchTerm, filterSource, filterType, sortBy]);

  const handlePreview = async (item) => {
    if (!item) return;
    setIsActionLoading(true);
    try {
      if (item.source === 'DOCUMENT') {
        const directUrl = item.raw?.fileUrl || item.raw?.driveUrl || item.raw?.url;
        if (directUrl) {
          const driveMatch = directUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
          if (driveMatch && driveMatch[1]) {
            window.open(`https://drive.google.com/file/d/${driveMatch[1]}/preview`, '_blank', 'noopener,noreferrer');
          } else {
            window.open(directUrl, '_blank', 'noopener,noreferrer');
          }
        } else {
          alert('Không tìm thấy đường dẫn xem trước tài liệu này.');
        }
      } else {
        const mediaUrl = await fetchMediaAccessUrl(item.id, 'preview');
        window.open(mediaUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      alert('Lỗi truy cập xem trước: ' + err.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDownload = async (item) => {
    if (!item) return;
    setIsActionLoading(true);
    try {
      if (item.source === 'DOCUMENT') {
        const downloadUrl = item.raw?.downloadUrl || item.raw?.fileUrl || item.raw?.url;
        if (downloadUrl) {
          const driveMatch = downloadUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
          if (driveMatch && driveMatch[1]) {
            window.open(`https://drive.google.com/uc?export=download&id=${driveMatch[1]}`, '_blank', 'noopener,noreferrer');
          } else {
            window.open(downloadUrl, '_blank', 'noopener,noreferrer');
          }
        } else {
          alert('Không tìm thấy đường dẫn tải về tài liệu.');
        }
      } else {
        const mediaDownloadUrl = await fetchMediaAccessUrl(item.id, 'download');
        const a = document.createElement('a');
        a.href = mediaDownloadUrl;
        a.download = item.title || 'downloaded-file';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (err) {
      alert('Lỗi tải tài liệu: ' + err.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="doc-search-page-container">
      
      {/* 1. HERO HEADER CARD */}
      <div className="doc-search-hero-card">
        <div className="doc-hero-top-row">
          
          <div className="doc-hero-text-block">
            {/* Tag nhỏ tiêu đề (Aurora Multi-Gradient Pill) */}
            <div className="doc-category-tag">
              <i className="fa fa-layer-group"></i>
              <span>Trung tâm tra cứu thông tin & tài liệu</span>
            </div>

            {/* Tiêu đề chính Multi-Color Gradient */}
            <h4 className="doc-hero-main-title">
              Tìm kiếm & Lọc dữ liệu hợp nhất
            </h4>
            
            <p className="doc-hero-subtitle">
              Tra cứu dữ liệu thời gian thực đồng thời từ 2 nguồn: <strong>Tài liệu & Biểu mẫu</strong> và <strong>Media Repository</strong>.
            </p>
          </div>

          <div className="doc-hero-actions-block">
            {/* Live Indicator Multi-Color Gradient Badge */}
            <div className="doc-live-indicator-badge">
              <span className="live-dot-ping"></span>
              <span className="live-dot-core"></span>
              <span className="live-badge-text">Dữ liệu thật từ 2 APIs</span>
            </div>

            {/* Nút Đồng bộ Radiant Multi-Gradient */}
            <button
              type="button"
              onClick={fetchUnifiedData}
              disabled={loading}
              className="doc-sync-btn"
              title="Đồng bộ lại toàn bộ dữ liệu mới nhất"
            >
              <i className={`fa fa-sync-alt ${loading ? 'fa-spin' : ''}`}></i>
              <span>Đồng bộ</span>
            </button>
          </div>
        </div>

        {/* 2. UNIFIED SEARCH & FILTER CONSOLE DECK */}
        <div className="doc-filter-console-wrapper">
          <div className="doc-filter-console-grid">
            
            {/* Ô Tìm kiếm */}
            <div className="doc-search-input-box">
              <i className="fa fa-search doc-search-icon"></i>
              <input
                type="text"
                className="doc-search-input"
                placeholder="Tìm theo tên tài liệu, mô tả, phòng ban..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm ? (
                <button
                  type="button"
                  className="doc-search-clear-btn"
                  onClick={() => setSearchTerm("")}
                  title="Xóa từ khóa"
                >
                  <i className="fa fa-times-circle"></i>
                </button>
              ) : (
                <span className="doc-search-shortcut-hint">⌘K</span>
              )}
            </div>

            {/* Dropdown Nguồn Dữ Liệu */}
            <CustomSelect 
              value={filterSource}
              onChange={setFilterSource}
              options={sourceOptions}
              icon="fa fa-database"
            />

            {/* Dropdown Định Dạng File */}
            <CustomSelect 
              value={filterType}
              onChange={setFilterType}
              options={typeOptions}
              icon="fa fa-file-code"
            />

            {/* Dropdown Sắp Xếp */}
            <CustomSelect 
              value={sortBy}
              onChange={setSortBy}
              options={sortOptions}
              icon="fa fa-sort-amount-down"
            />

            {/* Thống kê số lượng kết quả */}
            <div className="doc-result-counter-box">
              <span className="counter-label">Khả dụng:</span>
              <span className="counter-value">{filteredItems.length}</span>
              <span className="counter-unit">mục</span>
            </div>

          </div>
        </div>
      </div>

      {warningMsg && (
        <div className="doc-warning-banner">
          <i className="fa fa-exclamation-triangle"></i>
          <span>{warningMsg}</span>
        </div>
      )}

      {/* 3. KHU VỰC BẢNG DỮ LIỆU & CHI TIẾT */}
      <div className="doc-main-content-layout">
        <div className="row g-3 h-100 m-0">
          
          {/* CỘT TRÁI: BẢNG DỮ LIỆU */}
          <div className="col-lg-8 h-100 p-0 pe-lg-2">
            <div className="doc-table-card-container">
              
              <div className="doc-table-scroll-wrapper">
                <table className="doc-data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '36%' }}>Tài liệu</th>
                      <th style={{ width: '16%' }}>Nguồn</th>
                      <th style={{ width: '22%' }}>Phân loại / Nơi lưu</th>
                      <th style={{ width: '12%' }} className="text-center">Định dạng</th>
                      <th style={{ width: '14%' }} className="text-end">Cập nhật</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="5" className="doc-table-state-cell">
                          <div className="doc-loading-spinner"></div>
                          <span>Đang đồng bộ dữ liệu thời gian thực từ 2 APIs...</span>
                        </td>
                      </tr>
                    ) : filteredItems.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="doc-table-state-cell">
                          <div className="doc-empty-icon-wrap">
                            <i className="fa fa-folder-open"></i>
                          </div>
                          <div className="doc-empty-title">Không tìm thấy tài liệu phù hợp</div>
                          <div className="doc-empty-desc">Thử thay đổi từ khóa hoặc đặt lại bộ lọc tìm kiếm</div>
                        </td>
                      </tr>
                    ) : (
                      filteredItems.map(item => {
                        const isSelected = selectedItem?.id === item.id;
                        return (
                          <tr 
                            key={`${item.source}-${item.id}`} 
                            onClick={() => setSelectedItem(item)}
                            className={`doc-table-row ${isSelected ? 'row-active-selected' : ''}`}
                          >
                            <td>
                              <div className="doc-row-title-wrap">
                                <span className={`doc-row-title ${isSelected ? 'text-cyan-accent' : ''}`}>
                                  {item.title}
                                </span>
                                <span className="doc-row-desc">
                                  {item.description || 'Không có mô tả chi tiết'}
                                </span>
                              </div>
                            </td>

                            <td>
                              {item.source === 'DOCUMENT' ? (
                                <span className="doc-source-badge doc-badge-document">
                                  <i className="fa fa-folder"></i>
                                  <span>Document</span>
                                </span>
                              ) : (
                                <span className="doc-source-badge doc-badge-media">
                                  <i className="fa fa-photo-video"></i>
                                  <span>Media Repo</span>
                                </span>
                              )}
                            </td>

                            <td>
                              <div className="doc-row-dept-text">{item.department}</div>
                              <div className="doc-row-cat-text">{item.category}</div>
                            </td>

                            <td className="text-center">
                              {renderFileTypeBadge(item.fileType)}
                            </td>

                            <td className="text-end">
                              <span className="doc-row-date-text">{formatDate(item.date)}</span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          </div>

          {/* CỘT PHẢI: KHUNG CHI TIẾT */}
          <div className="col-lg-4 h-100 p-0 ps-lg-2">
            <div className="doc-detail-sidebar-card">
              
              {selectedItem ? (
                <div className="doc-detail-content-wrapper">
                  <div className="doc-detail-scroll-area">
                    
                    <div className="doc-detail-header-row">
                      <span className="doc-detail-section-title">
                        <i className="fa fa-info-circle me-1.5"></i>Chi tiết tài liệu
                      </span>
                      <span className="doc-detail-origin-chip">
                        {selectedItem.sourceLabel}
                      </span>
                    </div>

                    <h5 className="doc-detail-document-title">
                      {selectedItem.title}
                    </h5>
                    
                    <p className="doc-detail-document-description">
                      {selectedItem.description || 'Tài liệu chưa có ghi chú hoặc mô tả bổ sung.'}
                    </p>

                    <div className="doc-metadata-grid">
                      <div className="doc-meta-chip">
                        <span className="meta-label">Nguồn gốc</span>
                        <span className="meta-val">{selectedItem.sourceLabel}</span>
                      </div>

                      <div className="doc-meta-chip">
                        <span className="meta-label">Định dạng</span>
                        <span className="meta-val font-mono">{selectedItem.fileType}</span>
                      </div>

                      <div className="doc-meta-chip">
                        <span className="meta-label">Danh mục</span>
                        <span className="meta-val">{selectedItem.category}</span>
                      </div>

                      <div className="doc-meta-chip">
                        <span className="meta-label">Phòng ban / Nhóm</span>
                        <span className="meta-val">{selectedItem.department}</span>
                      </div>

                      <div className="doc-meta-chip">
                        <span className="meta-label">Phiên bản / Lưu trữ</span>
                        <span className="meta-val font-mono">{selectedItem.version}</span>
                      </div>

                      <div className="doc-meta-chip">
                        <span className="meta-label">Người tạo / Khách</span>
                        <span className="meta-val">{selectedItem.author}</span>
                      </div>
                    </div>
                  </div>

                  <div className="doc-detail-actions-footer">
                    <button
                      type="button"
                      className="doc-action-preview-btn"
                      onClick={() => handlePreview(selectedItem)}
                      disabled={isActionLoading}
                    >
                      <i className="fa fa-eye"></i>
                      <span>Xem trước</span>
                    </button>

                    <button
                      type="button"
                      className="doc-action-download-btn"
                      onClick={() => handleDownload(selectedItem)}
                      disabled={isActionLoading}
                    >
                      <i className="fa fa-download"></i>
                      <span>Tải về</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="doc-detail-empty-placeholder">
                  <div className="placeholder-icon-ring">
                    <i className="fa fa-mouse-pointer"></i>
                  </div>
                  <span className="placeholder-title">Chưa chọn tài liệu</span>
                  <span className="placeholder-sub">Nhấp vào một dòng trên bảng để xem chi tiết và tải xuống</span>
                </div>
              )}

            </div>
          </div>

        </div>
      </div>

    </div>
  );
});
