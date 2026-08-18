import React, { useState, useRef, useEffect } from 'react';
import { formatDate, getFileExtension, getMediaThumbnailUrl, renderVisaResultBadge, fetchMediaAccessUrl } from './mediaUtils.jsx';
import { MEDIA_COUNTRY_MAP } from '../mockMediaData';

export const MediaCard = ({ item, onOpenModal, playingMediaId, setPlayingMediaId }) => {
  const isDocument = item.category === 'document';
  const isVideo = item.category === 'video_library';
  const isVisa = item.category === 'visa_result';

  const isPlaying = playingMediaId === item._id;
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [playError, setPlayError] = useState('');

  const [isHovered, setIsHovered] = useState(false);
  const [isHoverLoading, setIsHoverLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  
  const hoverTimeoutRef = useRef(null);
  const isHoverActiveRef = useRef(false);
  const videoRef = useRef(null);
  const iframeRef = useRef(null);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      isHoverActiveRef.current = false;
    };
  }, []);

  const handleMouseEnter = () => {
    if (!isVideo || isPlaying) return;
    isHoverActiveRef.current = true;
    
    hoverTimeoutRef.current = setTimeout(async () => {
      if (!isHoverActiveRef.current) return;
      setIsHovered(true);
      setIsMuted(true);
      
      if (item.storageProvider === 'GOOGLE_DRIVE' && !videoUrl) {
        setIsHoverLoading(true);
        try {
          const url = await fetchMediaAccessUrl(item._id, 'preview');
          if (isHoverActiveRef.current) {
            setVideoUrl(url);
          }
        } catch (err) {
          if (isHoverActiveRef.current) {
            console.warn('Hover preview error:', err.message);
          }
        } finally {
          if (isHoverActiveRef.current) {
            setIsHoverLoading(false);
          }
        }
      }
    }, 250);
  };

  const handleMouseLeave = () => {
    isHoverActiveRef.current = false;
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsHovered(false);
    setIsHoverLoading(false);
    setIsMuted(true);
    
    if (videoRef.current && !isPlaying) {
      try {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      } catch (e) {}
    }
  };

  const handleToggleSound = (e) => {
    e.stopPropagation();
    const nextMuteState = !isMuted;
    setIsMuted(nextMuteState);

    if (videoRef.current) {
      videoRef.current.muted = nextMuteState;
    }

    if (iframeRef.current && item.storageProvider === 'YOUTUBE') {
      const command = nextMuteState ? 'mute' : 'unMute';
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func: command, args: [] }),
        '*'
      );
    }
  };

  const handleCardClick = () => {
    handleMouseLeave();
    onOpenModal(item);
  };

  const handlePlayClick = async (e) => {
    e.stopPropagation();
    if (item.storageProvider === 'YOUTUBE') {
      handleCardClick();
      return;
    }
    
    setIsLoadingVideo(true);
    setPlayError('');
    try {
      const url = videoUrl || await fetchMediaAccessUrl(item._id, 'preview');
      setVideoUrl(url);
      setPlayingMediaId(item._id);
    } catch (err) {
      setPlayError(err.message);
    } finally {
      setIsLoadingVideo(false);
    }
  };

  const [isDownloading, setIsDownloading] = useState(false);

  // Tải file trực tiếp từ nút ngoài card
  const handleQuickDownload = async (e) => {
    e.stopPropagation();
    setIsDownloading(true);
    try {
      const url = await fetchMediaAccessUrl(item._id, 'download');
      const a = document.createElement('a');
      a.href = url;
      a.download = item.fileName || item.title || 'tai-lieu';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      alert('Không thể tải file: ' + err.message);
    } finally {
      setIsDownloading(false);
    }
  };

  const [imgError, setImgError] = useState(false);
  const thumbnailUrl = getMediaThumbnailUrl(item);

  useEffect(() => {
    setImgError(false);
  }, [item]);

  return (
    <div 
      className="card h-100 border border-slate-200/80 app-dark:border-slate-800/80 shadow-md hover:shadow-2xl rounded-2xl overflow-hidden transition-all duration-300 bg-white app-dark:bg-[#0f172a]! group hover:-translate-y-1"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {!isDocument ? (
        <div 
          className="position-relative cursor-pointer overflow-hidden bg-slate-950" 
          style={{ aspectRatio: "4/3" }}
          onClick={handleCardClick}
        >
          {/* 1. Video Player khi Click phát trực tiếp */}
          {isVideo && item.storageProvider !== 'YOUTUBE' && isPlaying && videoUrl ? (
            <video 
              ref={videoRef}
              src={videoUrl} 
              className="w-100 h-100 object-cover"
              controls
              autoPlay
              onClick={(e) => e.stopPropagation()}
            />
          ) : isVideo && isHovered && item.storageProvider !== 'YOUTUBE' && videoUrl ? (
            /* 2. Hover Preview cho Google Drive / Video File */
            <div className="w-100 h-100 position-relative">
              <video 
                ref={videoRef}
                src={videoUrl} 
                className="w-100 h-100 object-cover"
                autoPlay
                muted={isMuted}
                loop
                playsInline
              />
            </div>
          ) : isVideo && isHovered && item.storageProvider === 'YOUTUBE' && item.youtubeVideoId ? (
            /* 3. Hover Preview cho YouTube Video */
            <div className="w-100 h-100 position-relative">
              <iframe 
                ref={iframeRef}
                src={`https://www.youtube-nocookie.com/embed/${item.youtubeVideoId}?autoplay=1&mute=1&controls=0&modestbranding=1&loop=1&playlist=${item.youtubeVideoId}&enablejsapi=1`}
                title={item.title}
                className="w-100 h-100 border-0 pointer-events-none"
                allow="autoplay; encrypted-media"
              />
            </div>
          ) : thumbnailUrl && !imgError ? (
            /* 4. Thumbnail Hình ảnh */
            <img 
              src={thumbnailUrl} 
              alt={item.title} 
              className="w-100 h-100 object-cover group-hover:scale-105 transition-transform duration-500"
              onError={() => setImgError(true)}
            />
          ) : isVideo ? (
            /* 5. Fallback khi không có Thumbnail */
            <div className="w-100 h-100 d-flex flex-column align-items-center justify-content-center text-slate-400 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950">
              <div 
                className="rounded-circle p-3 mb-2 d-flex align-items-center justify-content-center shadow-lg"
                style={{ background: "linear-gradient(135deg, #06b6d4, #3b82f6)" }}
              >
                <i className="fa fa-play text-white fs-4 ms-0.5"></i>
              </div>
              <span className="text-xs text-slate-300 font-medium">Rê chuột xem preview</span>
            </div>
          ) : (
            /* 6. Fallback ảnh Visa */
            <div className="w-100 h-100 d-flex flex-column align-items-center justify-content-center text-slate-400 bg-slate-100 app-dark:bg-slate-800!">
              <i className="fa fa-image text-slate-400 fs-1 mb-2"></i>
              <span className="text-xs text-slate-500">Chưa có bản xem trước</span>
            </div>
          )}
          
          {/* NÚT BẬT/TẮT ÂM THANH GRADIENT (HOVER PREVIEW) */}
          {isVideo && isHovered && (
            <div className="position-absolute top-3 end-3 d-flex align-items-center gap-2 z-10 animate-fade-in">
              {isHoverLoading ? (
                <div 
                  className="rounded-full px-3 py-1 text-white text-[11px] font-medium d-flex align-items-center gap-1.5 shadow-lg backdrop-blur-md"
                  style={{ background: "linear-gradient(135deg, rgba(15,23,42,0.85), rgba(30,41,59,0.85))", border: "1px solid rgba(255,255,255,0.15)" }}
                >
                  <div className="spinner-border spinner-border-sm text-cyan-400" style={{ width: '12px', height: '12px' }} role="status"></div>
                  <span>Đang tải...</span>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn p-0 d-flex align-items-center justify-content-center rounded-full shadow-xl transition-all duration-300 hover:scale-110 active:scale-95 border-0"
                  style={{
                    width: "36px",
                    height: "36px",
                    background: isMuted 
                      ? "linear-gradient(135deg, rgba(30,41,59,0.9), rgba(15,23,42,0.9))" 
                      : "linear-gradient(135deg, #06b6d4, #3b82f6)",
                    boxShadow: isMuted ? "0 4px 12px rgba(0,0,0,0.5)" : "0 4px 15px rgba(6,182,212,0.6)",
                    border: "1px solid rgba(255,255,255,0.25)",
                    backdropFilter: "blur(6px)"
                  }}
                  onClick={handleToggleSound}
                  title={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
                >
                  <i className={`fa ${isMuted ? 'fa-volume-mute text-slate-300' : 'fa-volume-up text-white'} text-sm`}></i>
                </button>
              )}
            </div>
          )}

          {/* NÚT PLAY TRUNG TÂM GRADIENT GLOW (KHI CHƯA HOVER) */}
          {isVideo && !isPlaying && !isHovered && thumbnailUrl && !imgError && (
            <div 
              className="position-absolute top-50 start-50 translate-middle cursor-pointer" 
              onClick={handlePlayClick}
              title="Phát video"
            >
              <div 
                className="rounded-full d-flex align-items-center justify-content-center shadow-2xl group-hover:scale-115 transition-all duration-300"
                style={{ 
                  width: "56px", 
                  height: "56px", 
                  background: item.storageProvider === 'YOUTUBE' 
                    ? "linear-gradient(135deg, rgba(255, 0, 0, 0.85) 0%, rgba(200, 0, 0, 0.95) 100%)" 
                    : "linear-gradient(135deg, rgba(6, 182, 212, 0.85) 0%, rgba(59, 130, 246, 0.95) 100%)",
                  boxShadow: item.storageProvider === 'YOUTUBE' 
                    ? "0 6px 20px rgba(255, 0, 0, 0.5)" 
                    : "0 6px 20px rgba(6, 182, 212, 0.5)",
                  border: "2px solid rgba(255, 255, 255, 0.4)",
                  backdropFilter: "blur(6px)"
                }}
              >
                {isLoadingVideo ? (
                  <div className="spinner-border spinner-border-sm text-white" role="status"></div>
                ) : item.storageProvider === 'YOUTUBE' ? (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="#ffffff">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                ) : (
                  <i className="fa fa-play text-white fs-5 ms-1"></i>
                )}
              </div>
            </div>
          )}

          {playError && (
            <div className="position-absolute bottom-0 start-0 w-100 bg-danger/90 text-white text-xs p-1.5 text-center backdrop-blur-sm">
              <i className="fa fa-exclamation-circle me-1"></i> {playError}
              <button className="btn btn-link btn-sm text-white p-0 ms-2 text-xs font-bold" onClick={handlePlayClick}>Thử lại</button>
            </div>
          )}
        </div>
      ) : (
        /* Tài liệu Preview Card */
        <div 
          className="position-relative overflow-hidden bg-slate-50 app-dark:bg-slate-800/60! d-flex flex-column align-items-center justify-content-center p-4 border-bottom border-slate-100 app-dark:border-slate-800!" 
          style={{ aspectRatio: "4/3" }}
        >
          {/* Icon loại file */}
          <i className={`fa ${getFileExtension(item.fileName) === 'pdf' ? 'fa-file-pdf text-rose-500' : 'fa-file-word text-blue-500'} display-3 mb-2 group-hover:scale-110 transition-transform duration-300`}></i>
          
          <span 
            className="badge text-white text-[11px] font-bold px-2.5 py-1 rounded-md shadow-sm mb-3"
            style={{
              background: getFileExtension(item.fileName) === 'pdf' 
                ? "linear-gradient(135deg, #f43f5e, #e11d48)" 
                : "linear-gradient(135deg, #2563eb, #1d4ed8)"
            }}
          >
            {getFileExtension(item.fileName).toUpperCase()}
          </span>

          {/* Cụm nút thao tác trực tiếp trên Card */}
          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className="btn btn-sm px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700 app-dark:text-slate-200! bg-white app-dark:bg-slate-700! border border-slate-200 app-dark:border-slate-600! shadow-sm hover:bg-slate-100 app-dark:hover:bg-slate-600!"
              onClick={(e) => {
                e.stopPropagation();
                onOpenModal(item);
              }}
            >
              <i className="fa fa-eye me-1 text-cyan-500"></i> Xem
            </button>

            {/* Nút Tải Về Trực Tiếp Nổi Bật */}
            <button
              type="button"
              className="btn btn-sm px-3 py-1 rounded-lg text-xs font-bold text-white border-0 shadow-md hover:brightness-110 active:scale-95 transition-all d-flex align-items-center gap-1.5"
              style={{
                background: "linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)",
                boxShadow: "0 2px 8px rgba(6, 182, 212, 0.4)"
              }}
              onClick={handleQuickDownload}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <span className="spinner-border spinner-border-sm" style={{ width: '10px', height: '10px' }}></span>
              ) : (
                <i className="fa fa-download text-xs"></i>
              )}
              <span>Tải về</span>
            </button>
          </div>
        </div>
      )}
      
      {/* THÔNG TIN CHI TIẾT VÀ CÁC NÚT BADGE DƯỚI CARD */}
      <div className="card-body p-3.5">
        <div className="d-flex justify-content-between align-items-start mb-2 gap-2">
          <h6 className="card-title fw-bold text-slate-800 app-dark:text-slate-100! mb-0 line-clamp-2 text-sm leading-snug" title={item.title}>
            {item.title}
          </h6>
          {isVisa && (
            <div className="shrink-0 scale-90 origin-top-right">
              {renderVisaResultBadge(item.visa_result_status)}
            </div>
          )}
        </div>
        
        <div className="text-slate-600 app-dark:text-slate-400! small d-flex flex-column gap-2 mt-2">
          {item.customer_name && (
            <div className="d-flex align-items-center gap-2">
              <i className="fa fa-user w-4 text-center opacity-70 text-slate-400"></i>
              <span className="fw-semibold text-truncate">{item.customer_name}</span>
            </div>
          )}
          {!item.customer_name && item.customer_name_masked && (
            <div className="d-flex align-items-center gap-2">
              <i className="fa fa-user w-4 text-center opacity-70 text-slate-400"></i>
              <span className="fw-semibold text-truncate text-slate-400 italic">{item.customer_name_masked}</span>
            </div>
          )}
          {isVisa && (
            <div className="d-flex align-items-center gap-2">
              <i className="fa fa-earth-americas w-4 text-center opacity-70 text-slate-400"></i>
              <span className="text-truncate">Visa: {item.visa_country !== 'ALL' && item.visa_country ? MEDIA_COUNTRY_MAP[item.visa_country] || item.visa_country : 'Chưa cập nhật'}</span>
            </div>
          )}
          {isDocument && item.fileSize && (
            <div className="d-flex align-items-center gap-2">
              <i className="fa fa-hdd w-4 text-center opacity-70 text-slate-400"></i>
              <span>Size: {(item.fileSize / 1024 / 1024).toFixed(2)} MB</span>
            </div>
          )}

          {/* NHÓM BADGE NGUỒN VÀ LINK NGOÀI (GRADIENT BẮT MẮT) */}
          {isVideo && (
            <div className="d-flex align-items-center gap-2 mt-0.5">
              <i className="fa fa-server w-4 text-center opacity-70 text-slate-400"></i>
              <div className="d-flex flex-wrap gap-1.5 align-items-center">
                
                {/* Badge YouTube / Google Drive */}
                <span 
                  className="badge text-[11px] font-bold text-white px-2.5 py-1 rounded-md shadow-sm d-flex align-items-center gap-1.5"
                  style={{
                    background: item.storageProvider === 'YOUTUBE' 
                      ? "linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)" 
                      : "linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)",
                    boxShadow: item.storageProvider === 'YOUTUBE'
                      ? "0 2px 8px rgba(255, 65, 108, 0.35)"
                      : "0 2px 8px rgba(6, 182, 212, 0.35)"
                  }}
                >
                  <i className={`fa ${item.storageProvider === 'YOUTUBE' ? 'fab fa-youtube' : 'fab fa-google-drive'} text-xs`}></i>
                  {item.storageProvider === 'YOUTUBE' ? 'YouTube' : 'Google Drive'}
                </span>
                
                {/* Badge Link Ngoài (Gradient Cam/Hổ Phách cực nét) */}
                {item.sourceType === 'EXTERNAL_LINK' && (
                  <span 
                    className="badge text-[11px] font-bold text-white px-2.5 py-1 rounded-md shadow-sm d-flex align-items-center gap-1"
                    style={{
                      background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                      boxShadow: "0 2px 8px rgba(245, 158, 11, 0.35)"
                    }}
                  >
                    <i className="fa fa-external-link-alt text-[10px]"></i>
                    Link ngoài
                  </span>
                )}
              </div>
            </div>
          )}

          {/* NHÓM TAG PHÂN LOẠI (DU HỌC / VISA / LOẠI TÀI LIỆU) */}
          {(isVideo && item.videoType) && (
            <div className="d-flex align-items-center gap-2 mt-0.5">
              <i className="fa fa-tag w-4 text-center opacity-70 text-slate-400"></i>
              <span 
                className="text-truncate text-[11px] font-semibold text-white px-2.5 py-0.5 rounded-md shadow-sm d-inline-block"
                style={{
                  background: "linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)",
                  boxShadow: "0 2px 6px rgba(13, 148, 136, 0.3)"
                }}
              >
                {item.videoType}
              </span>
            </div>
          )}

          {(isDocument && item.documentType) && (
            <div className="d-flex align-items-center gap-2 mt-0.5">
              <i className="fa fa-tag w-4 text-center opacity-70 text-slate-400"></i>
              <span 
                className="text-truncate text-[11px] font-semibold text-white px-2.5 py-0.5 rounded-md shadow-sm d-inline-block"
                style={{
                  background: "linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)",
                  boxShadow: "0 2px 6px rgba(13, 148, 136, 0.3)"
                }}
              >
                {item.documentType}
              </span>
            </div>
          )}
          
          <div className="d-flex justify-content-between text-slate-400 mt-2 text-[11px]">
            {isVisa && (
              <span title="Ngày kết quả Visa">KQ: {formatDate(item.visa_result_date) || 'Chưa cập nhật'}</span>
            )}
            <span title="Ngày tạo" className="ms-auto"><i className="fa fa-clock me-1 opacity-70"></i> {formatDate(item.createdAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
