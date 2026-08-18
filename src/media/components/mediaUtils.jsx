import React from "react";
import { API_BASE_URL } from "../../config/api";
import { authFetch } from "../../auth/session";

export const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (isNaN(date)) return '';
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export const calculateAge = (dob) => {
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

export const getFileExtension = (filename) => {
  if (!filename) return '';
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
};

export const getImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }
  const cleanUrl = url.startsWith('/api/v1') ? url.substring(7) : url;
  return `${API_BASE_URL}${cleanUrl}`;
};

export const getMediaThumbnailUrl = (item) => {
  if (!item) return '';
  if (item.thumbnail_url) {
    return getImageUrl(item.thumbnail_url);
  }
  if (item.category === 'visa_result' && item.imageFileId) {
    return getImageUrl(`/api/v1/drive/${item.imageFileId}?mimeType=${encodeURIComponent(item.imageMimeType || 'image/jpeg')}`);
  }
  if (item.storageProvider === 'YOUTUBE' && item.youtubeVideoId) {
    return `https://img.youtube.com/vi/${item.youtubeVideoId}/hqdefault.jpg`;
  }
  let driveFileId = item.storageFileId || item.driveFileId || item.imageFileId;
  if (!driveFileId && item.url) {
    const match = item.url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match) driveFileId = match[1];
  }
  if (item.storageProvider === 'GOOGLE_DRIVE' && driveFileId) {
    return `https://drive.google.com/thumbnail?id=${driveFileId}&sz=w800`;
  }
  return '';
};

export const fetchMediaAccessUrl = async (mediaId, action = 'preview') => {
  try {
    const response = await authFetch(`${API_BASE_URL}/media/${mediaId}/access?action=${action}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Không thể lấy quyền truy cập tệp');
    }
    const data = await response.json();
    if (data.success && data.url) {
      return `${API_BASE_URL.replace('/api/v1', '')}${data.url}`;
    }
    throw new Error('Định dạng phản hồi không hợp lệ');
  } catch (error) {
    throw error;
  }
};

export const getDownloadUrl = (media) => {
  // Hàm cũ, chỉ dùng cho fallback hoặc xóa bỏ nếu không cần thiết.
  // Các component nên chuyển sang gọi fetchMediaAccessUrl(mediaId, 'download')
  return `${API_BASE_URL}/media/${media._id}/download?forceDownload=true`;
};

export const getPreviewUrl = (media) => {
  return `${API_BASE_URL}/media/${media._id}/download`;
};

export const renderVisaResultBadge = (status) => {
  switch (status) {
    case 'approved': return <span className="badge bg-success"><i className="fa fa-check-circle"></i> Đậu Visa</span>;
    case 'rejected': return <span className="badge bg-danger"><i className="fa fa-times-circle"></i> Trượt Visa</span>;
    case 'pending': return <span className="badge bg-warning text-dark"><i className="fa fa-hourglass-half"></i> Đang xử lý</span>;
    case 'cancelled': return <span className="badge bg-secondary"><i className="fa fa-ban"></i> Đã hủy</span>;
    default: return <span className="badge bg-light text-muted border">Chưa cập nhật</span>;
  }
};
