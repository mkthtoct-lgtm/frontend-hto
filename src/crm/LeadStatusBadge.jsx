import React from 'react';

export const LeadStatusBadge = ({ status }) => {
  const getStatusConfig = (s) => {
    switch (s) {
      case 'NEW':
        return { label: 'Mới', bg: 'bg-primary-subtle', text: 'text-primary' };
      case 'ASSIGNED':
        return { label: 'Đã phân công', bg: 'bg-info-subtle', text: 'text-info-emphasis' };
      case 'PROCESSING':
        return { label: 'Đang tư vấn', bg: 'bg-warning-subtle', text: 'text-warning-emphasis' };
      case 'SUBMITTED_PROOF':
        return { label: 'Chờ duyệt', bg: 'bg-indigo-subtle', text: 'text-indigo' }; // Custom class if needed, or use bg-secondary
      case 'APPROVED':
        return { label: 'Thành công (KPI)', bg: 'bg-success-subtle', text: 'text-success-emphasis' };
      case 'REJECTED':
        return { label: 'Từ chối', bg: 'bg-danger-subtle', text: 'text-danger-emphasis' };
      case 'CLOSED':
        return { label: 'Đóng', bg: 'bg-secondary-subtle', text: 'text-body-secondary' };
      default:
        return { label: s || 'Unknown', bg: 'bg-body-secondary', text: 'text-body-secondary' };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span className={`badge ${config.bg} ${config.text} px-2 py-1 rounded-pill fw-medium`} style={{ fontSize: '11.5px' }}>
      {config.label}
    </span>
  );
};
