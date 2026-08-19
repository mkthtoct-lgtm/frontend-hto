import React, { useState, useEffect } from 'react';
import { formatDate, calculateAge, getFileExtension, getImageUrl, getMediaThumbnailUrl, fetchMediaAccessUrl, renderVisaResultBadge } from './mediaUtils.jsx';
import { MEDIA_COUNTRY_MAP } from '../mockMediaData';

export const MediaDetailModal = ({
  selectedMedia,
  onClose,
  canUpdate,
  canDelete,
  onEdit,
  onDelete
}) => {
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoError, setVideoError] = useState('');

  const [isDocLoading, setIsDocLoading] = useState(false);
  const [docPreviewUrl, setDocPreviewUrl] = useState('');
  const [docError, setDocError] = useState('');

  const [visaImgUrl, setVisaImgUrl] = useState('');
  const [hasVisaImgError, setHasVisaImgError] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    if (selectedMedia) {
      setVisaImgUrl(getMediaThumbnailUrl(selectedMedia));
      setHasVisaImgError(false);
      setVideoUrl('');
      setVideoError('');
      setDocPreviewUrl('');
      setDocError('');

      // 1. Auto-play Video when modal opens (except YouTube which handles its own iframe auto-play)
      if (selectedMedia.category === 'video_library' && selectedMedia.storageProvider !== 'YOUTUBE') {
        const fetchVideo = async () => {
          setIsVideoLoading(true);
          setVideoError('');
          try {
            const url = await fetchMediaAccessUrl(selectedMedia._id, 'preview');
            if (!isCancelled) setVideoUrl(url);
          } catch (err) {
            if (!isCancelled) setVideoError(err.message);
          } finally {
            if (!isCancelled) setIsVideoLoading(false);
          }
        };
        fetchVideo();
      }

      // 2. Auto-load PDF preview when modal opens
      if (selectedMedia.category === 'document' && getFileExtension(selectedMedia.fileName) === 'pdf') {
        const fetchPdf = async () => {
          setIsDocLoading(true);
          setDocError('');
          try {
            const url = await fetchMediaAccessUrl(selectedMedia._id, 'preview');
            if (!isCancelled) setDocPreviewUrl(url);
          } catch (err) {
            if (!isCancelled) setDocError(err.message);
          } finally {
            if (!isCancelled) setIsDocLoading(false);
          }
        };
        fetchPdf();
      }
    }

    return () => {
      isCancelled = true;
    };
  }, [selectedMedia]);

  if (!selectedMedia) return null;

  const handleVisaImgError = async (e) => {
    if (!hasVisaImgError && selectedMedia?._id) {
      setHasVisaImgError(true);
      const imgElement = e.target;
      const placeholder = e.target.nextElementSibling;

      // Fallback Google Drive lh3
      if (selectedMedia.storageFileId || selectedMedia.imageFileId) {
        const fileId = selectedMedia.storageFileId || selectedMedia.imageFileId;
        const fallbackUrl = `https://lh3.googleusercontent.com/d/${fileId}=w800`;
        if (visaImgUrl !== fallbackUrl) {
          setVisaImgUrl(fallbackUrl);
          return;
        }
      }

      // Tạm ẩn ảnh lỗi, hiện placeholder
      imgElement.style.display = 'none';
      if (placeholder) placeholder.style.display = 'flex';

      try {
        const url = await fetchMediaAccessUrl(selectedMedia._id, 'preview');
        imgElement.style.display = 'block';
        if (placeholder) placeholder.style.display = 'none';
        setVisaImgUrl(url);
      } catch (err) {
        imgElement.style.display = 'none';
        if (placeholder) placeholder.style.display = 'flex';
      }
    } else {
      e.target.style.display = 'none';
      if (e.target.nextElementSibling) e.target.nextElementSibling.style.display = 'flex';
    }
  };

  const handlePlayVideo = async () => {
    setIsVideoLoading(true);
    setVideoError('');
    try {
      const url = await fetchMediaAccessUrl(selectedMedia._id, 'preview');
      setVideoUrl(url);
    } catch (err) {
      setVideoError(err.message);
    } finally {
      setIsVideoLoading(false);
    }
  };

  const handleDocAction = async (action) => {
    setIsDocLoading(true);
    setDocError('');
    try {
      const url = await fetchMediaAccessUrl(selectedMedia._id, action);
      window.open(url, '_blank');
    } catch (err) {
      setDocError(err.message);
      alert('Lỗi truy cập tài liệu: ' + err.message);
    } finally {
      setIsDocLoading(false);
    }
  };

  // Hàm lấy link xem trước tài liệu Google Drive & Office
  const getDocPreviewEmbedUrl = (media, directUrl) => {
    // 1. Nếu lưu trên Google Drive: Dùng trực tiếp Drive Preview
    let fileId = media.storageFileId || media.driveFileId || media.imageFileId;
    if (!fileId && directUrl) {
      const match = directUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || directUrl.match(/id=([a-zA-Z0-9_-]+)/);
      if (match) fileId = match[1];
    }
    
    if (media.storageProvider === 'GOOGLE_DRIVE' && fileId) {
      return `https://drive.google.com/file/d/${fileId}/preview`;
    }

    // 2. Dùng Google Docs Viewer cho mọi định dạng Word/Excel/PDF khác
    return `https://docs.google.com/viewer?url=${encodeURIComponent(directUrl)}&embedded=true`;
  };

  // Hàm mở xem trước tài liệu trực tiếp (PDF, DOCX, XLSX...)
  const handlePreviewDoc = async () => {
    setIsDocLoading(true);
    setDocError('');
    try {
      const rawUrl = await fetchMediaAccessUrl(selectedMedia._id, 'preview');
      const ext = getFileExtension(selectedMedia.fileName || selectedMedia.title);

      if (ext === 'pdf' && selectedMedia.storageProvider !== 'GOOGLE_DRIVE') {
        setDocPreviewUrl(rawUrl);
      } else {
        const embedUrl = getDocPreviewEmbedUrl(selectedMedia, rawUrl);
        setDocPreviewUrl(embedUrl);
      }
    } catch (err) {
      setDocError(err.message || 'Không thể tải bản xem trước tài liệu.');
    } finally {
      setIsDocLoading(false);
    }
  };

  return (
    <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.85)", zIndex: 1050 }} onClick={onClose}>
      <div className="modal-dialog modal-dialog-centered modal-xl" onClick={e => e.stopPropagation()}>
        <div className="modal-content bg-white app-dark:bg-[#1e293b]! border-0 shadow-lg rounded-4 overflow-hidden flex-column h-100">

          <div className="modal-header border-bottom border-slate-200 app-dark:border-slate-700! bg-slate-50 app-dark:bg-slate-800! py-3">
            <h5 className="modal-title fw-bold text-slate-800 app-dark:text-slate-100! mb-0 text-truncate">{selectedMedia.title}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>

          <div className="modal-body p-0 flex-grow-1" style={{ overflowY: 'auto' }}>
            <div className="row g-0 h-100">
              <div className="col-md-7 bg-slate-100 app-dark:bg-slate-900! d-flex align-items-center justify-content-center position-relative" style={{ minHeight: "450px" }}>

                {/* 1. VISA RESULT PREVIEW */}
                {selectedMedia.category === 'visa_result' && (
                  <img
                    src={visaImgUrl || "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="}
                    alt={selectedMedia.title}
                    className="img-fluid"
                    style={{ maxHeight: "70vh", objectFit: "contain" }}
                    onError={handleVisaImgError}
                  />
                )}

                {/* Fallback for Image Error */}
                {selectedMedia.category === 'visa_result' && (
                  <div className="w-100 h-100 position-absolute top-0 start-0 flex-column align-items-center justify-content-center bg-slate-100 app-dark:bg-slate-900!" style={{ display: 'none' }}>
                    <i className="fa fa-image text-slate-300 fs-1 mb-2"></i>
                    <span className="text-slate-400 small">Chưa có bản xem trước</span>
                  </div>
                )}

                {/* 2. YOUTUBE VIDEO (Audio enabled via click) */}
                {selectedMedia.category === 'video_library' && selectedMedia.storageProvider === 'YOUTUBE' && (
                  <div className="ratio ratio-16x9 w-100">
                    <iframe
                      src={`https://www.youtube.com/embed/${selectedMedia.youtubeVideoId}?autoplay=1&enablejsapi=1`}
                      title="YouTube video"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-100 h-100 border-0"
                    ></iframe>
                  </div>
                )}

                {/* 3. GOOGLE DRIVE / NATIVE VIDEO (Audio enabled, with full controls) */}
                {selectedMedia.category === 'video_library' && selectedMedia.storageProvider !== 'YOUTUBE' && (
                  <div className="w-100 h-100 d-flex flex-column align-items-center justify-content-center bg-black position-relative" style={{ minHeight: "450px" }}>
                    {videoUrl ? (
                      <video
                        src={videoUrl}
                        controls
                        autoPlay
                        className="w-100"
                        style={{ maxHeight: "70vh" }}
                      ></video>
                    ) : (
                      <>
                        {isVideoLoading ? (
                          <div className="d-flex flex-column align-items-center">
                            <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }} role="status"></div>
                            <span className="text-white">Đang chuẩn bị video...</span>
                          </div>
                        ) : videoError ? (
                          <div className="text-danger mt-3 bg-white px-3 py-2 rounded shadow-sm text-center">
                            <i className="fa fa-exclamation-triangle me-2"></i>{videoError}
                            <div className="mt-2">
                              <button className="btn btn-sm btn-outline-danger" onClick={handlePlayVideo}>Thử lại</button>
                            </div>
                          </div>
                        ) : (
                          <button
                            className="btn btn-primary rounded-circle shadow"
                            style={{ width: "64px", height: "64px" }}
                            onClick={handlePlayVideo}
                          >
                            <i className="fa fa-play fs-3 ms-1"></i>
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* 4. EMBEDDED PDF & OFFICE DOCUMENT PREVIEW (.pdf, .docx, .xlsx...) */}
                {selectedMedia.category === 'document' && (
                  <div className="w-100 h-100 d-flex flex-column align-items-center justify-content-center p-3 position-relative" style={{ minHeight: "450px" }}>
                    {docPreviewUrl ? (
                      <div className="w-100 h-100 d-flex flex-column" style={{ minHeight: "65vh" }}>
                        <div className="d-flex justify-content-end mb-2">
                          <button 
                            className="btn btn-sm btn-outline-secondary" 
                            onClick={() => setDocPreviewUrl('')}
                          >
                            <i className="fa fa-times me-1"></i> Thu nhỏ
                          </button>
                        </div>
                        <iframe 
                          src={docPreviewUrl} 
                          title="Document Preview" 
                          className="w-100 flex-grow-1 rounded border border-slate-200" 
                          style={{ minHeight: "60vh" }}
                        ></iframe>
                      </div>
                    ) : (
                      <div className="text-center p-4">
                        <i className={`fa ${getFileExtension(selectedMedia.fileName) === 'pdf' ? 'fa-file-pdf text-danger' : 'fa-file-word text-primary'} display-1 mb-4`}></i>
                        <h5 className="fw-bold mb-3 text-slate-800 app-dark:text-slate-200!">
                          {selectedMedia.fileName || selectedMedia.title}
                        </h5>
                        
                        <div className="d-flex justify-content-center gap-2">
                          <button 
                            className="btn btn-outline-primary"
                            onClick={handlePreviewDoc}
                            disabled={isDocLoading}
                          >
                            {isDocLoading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="fa fa-eye me-2"></i>}
                            Xem trước tài liệu
                          </button>

                          <button 
                            className="btn btn-primary"
                            onClick={() => handleDocAction('download')}
                            disabled={isDocLoading}
                          >
                            <i className="fa fa-download me-2"></i> Tải xuống
                          </button>
                        </div>
                        {docError && <div className="text-danger small mt-2">{docError}</div>}
                      </div>
                    )}
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
                      <div><strong>Ngày kết quả:</strong> <span className="ms-2 text-slate-700 app-dark:text-slate-300!">{formatDate(selectedMedia.visa_result_date) || "Chưa cập nhật"}</span></div>
                    </div>
                  )}

                  <div className="border-bottom border-slate-200 app-dark:border-slate-700! pb-2">
                    <h6 className="fw-bold text-slate-700 app-dark:text-slate-300!"><i className="fa fa-user-circle me-2 opacity-70"></i>Thông tin Khách hàng</h6>
                    <table className="table table-sm table-borderless text-slate-600 app-dark:text-slate-400! mb-0">
                      <tbody>
                        <tr>
                          <td style={{ width: "120px" }} className="text-sm">Họ & Tên:</td>
                          <td className="fw-semibold text-slate-800 app-dark:text-slate-200! text-sm">
                            {selectedMedia.customer_name ? selectedMedia.customer_name : (selectedMedia.customer_name_masked ? <span className="text-slate-500 italic">{selectedMedia.customer_name_masked}</span> : "Chưa cập nhật")}
                          </td>
                        </tr>
                        <tr><td className="text-sm">Ngày sinh:</td><td className="text-sm">{formatDate(selectedMedia.dob) || "Chưa cập nhật"} {selectedMedia.dob && `(${calculateAge(selectedMedia.dob)} tuổi)`}</td></tr>
                        <tr><td className="text-sm">Quốc gia KH:</td><td className="text-sm">{selectedMedia.customer_country !== 'ALL' && selectedMedia.customer_country ? MEDIA_COUNTRY_MAP[selectedMedia.customer_country] || selectedMedia.customer_country : "Chưa cập nhật"}</td></tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="border-bottom border-slate-200 app-dark:border-slate-700! pb-2">
                    <h6 className="fw-bold text-slate-700 app-dark:text-slate-300!"><i className="fa fa-info-circle me-2 opacity-70"></i>Thông tin thêm</h6>
                    <table className="table table-sm table-borderless text-slate-600 app-dark:text-slate-400! mb-0">
                      <tbody>
                        <tr><td style={{ width: "120px" }} className="text-sm">Danh mục:</td><td className="text-sm">
                          {selectedMedia.category === 'visa_result' ? 'Kết quả Visa' :
                            selectedMedia.category === 'video_library' ? 'Thư viện Video' : 'Ấn phẩm & Tài liệu'}
                        </td></tr>

                        {selectedMedia.category === 'visa_result' && (
                          <>
                            <tr><td className="text-sm">Quốc gia Visa:</td><td className="text-sm">{selectedMedia.visa_country !== 'ALL' && selectedMedia.visa_country ? MEDIA_COUNTRY_MAP[selectedMedia.visa_country] || selectedMedia.visa_country : "Chưa cập nhật"}</td></tr>
                            <tr><td className="text-sm">Country Tag:</td><td className="text-sm">{selectedMedia.country_tag !== 'ALL' ? MEDIA_COUNTRY_MAP[selectedMedia.country_tag] || selectedMedia.country_tag : "Tất cả"}</td></tr>
                          </>
                        )}

                        {selectedMedia.category !== 'visa_result' && (
                          <>
                            <tr><td className="text-sm">Provider:</td><td className="text-sm"><span className={`badge ${selectedMedia.storageProvider === 'YOUTUBE' ? 'bg-danger' : 'bg-primary'}`}>{selectedMedia.storageProvider}</span></td></tr>
                            <tr><td className="text-sm">Nguồn:</td><td className="text-sm"><span className="badge bg-slate-200 text-slate-700">{selectedMedia.sourceType === 'EXTERNAL_LINK' ? 'Link ngoài' : 'Upload'}</span></td></tr>
                          </>
                        )}
                        {selectedMedia.category === 'video_library' && (
                          <>
                            <tr><td className="text-sm">Loại Video:</td><td className="text-sm">{selectedMedia.videoType || "Chưa cập nhật"}</td></tr>
                            <tr><td className="text-sm">Mục đích:</td><td className="text-sm">{selectedMedia.videoPurpose || "Chưa cập nhật"}</td></tr>
                          </>
                        )}
                        {selectedMedia.category === 'document' && (
                          <tr><td className="text-sm">Loại tài liệu:</td><td className="text-sm">{selectedMedia.documentType || "Chưa cập nhật"}</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {selectedMedia.notes && (
                    <div>
                      <h6 className="fw-bold text-slate-700 app-dark:text-slate-300!"><i className="fa fa-sticky-note me-2 opacity-70"></i>Ghi chú</h6>
                      <div className="p-3 bg-slate-50 app-dark:bg-slate-800! rounded-3 text-slate-600 app-dark:text-slate-400! text-break text-sm" style={{ whiteSpace: "pre-wrap" }}>
                        {selectedMedia.notes}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer bg-slate-50 app-dark:bg-slate-800/80! border-top border-slate-200 app-dark:border-slate-700/80! d-flex justify-content-between py-3 px-4">
            <button 
              type="button" 
              className="btn btn-secondary px-4 py-2 rounded-xl text-xs font-semibold" 
              onClick={onClose}
            >
              Đóng
            </button>
            
            <div className="d-flex gap-2">
              {canUpdate && (
                <button 
                  className="btn px-4 py-2 rounded-xl text-xs font-bold text-white border-0 shadow-md hover:brightness-110 transition-all"
                  style={{
                    background: "linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)",
                    boxShadow: "0 4px 14px rgba(6, 182, 212, 0.35)"
                  }}
                  onClick={onEdit}
                >
                  <i className="fa fa-edit me-1.5"></i> Sửa
                </button>
              )}
              {canDelete && (
                <button 
                  className="btn px-4 py-2 rounded-xl text-xs font-bold text-white border-0 shadow-md hover:brightness-110 transition-all"
                  style={{
                    background: "linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)",
                    boxShadow: "0 4px 14px rgba(244, 63, 94, 0.35)"
                  }}
                  onClick={onDelete}
                >
                  <i className="fa fa-trash me-1.5"></i> Xóa
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
