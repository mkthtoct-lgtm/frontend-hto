import React from 'react';

export const ErrorState = ({ message, onRetry }) => {
  return (
    <div className="col-span-full d-flex flex-column align-items-center justify-content-center py-5 text-center">
      <div className="bg-red-50 app-dark:bg-red-900/20! rounded-circle d-flex align-items-center justify-content-center mb-3" style={{ width: "64px", height: "64px" }}>
        <i className="fa fa-triangle-exclamation text-danger fs-3"></i>
      </div>
      <h6 className="fw-bold text-danger">Đã xảy ra lỗi</h6>
      <p className="text-slate-600 app-dark:text-slate-400! small mb-3">{message || "Không thể tải dữ liệu từ máy chủ."}</p>
      {onRetry && (
        <button className="btn btn-outline-danger btn-sm" onClick={onRetry}>
          <i className="fa fa-rotate-right me-1"></i> Thử lại
        </button>
      )}
    </div>
  );
};
