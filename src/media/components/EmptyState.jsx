import React from 'react';

export const EmptyState = ({ onClearFilter }) => {
  return (
    <div className="col-span-full d-flex flex-column align-items-center justify-content-center py-5 text-center">
      <div className="bg-slate-100 app-dark:bg-slate-800! rounded-circle d-flex align-items-center justify-content-center mb-3" style={{ width: "64px", height: "64px" }}>
        <i className="fa fa-folder-open text-slate-400 fs-3"></i>
      </div>
      <h6 className="fw-bold text-slate-700 app-dark:text-slate-300!">Không tìm thấy dữ liệu</h6>
      <p className="text-slate-500 small mb-3">Vui lòng thử bộ lọc hoặc từ khóa tìm kiếm khác.</p>
      {onClearFilter && (
        <button className="btn btn-outline-secondary btn-sm" onClick={onClearFilter}>
          Xóa bộ lọc
        </button>
      )}
    </div>
  );
};
