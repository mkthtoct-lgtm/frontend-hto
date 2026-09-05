// Tiện ích xuất dữ liệu Dashboard ra file Excel (.xlsx) ngay trên trình
// duyệt - không cần gọi API backend vì toàn bộ dữ liệu hiển thị trên trang
// Dashboard đã có sẵn ở phía client. Dùng thư viện SheetJS (xlsx).
import * as XLSX from "xlsx";

/**
 * Tạo 1 sheet từ dữ liệu dạng mảng-các-mảng (array of arrays), dòng đầu tiên
 * là tiêu đề cột. Dùng aoa (array-of-arrays) thay vì json_to_sheet để kiểm
 * soát chính xác thứ tự & tiêu đề cột, tránh phụ thuộc vào thứ tự key object.
 */
function appendSheet(workbook, sheetName, aoa, colWidths) {
  const worksheet = XLSX.utils.aoa_to_sheet(aoa);
  if (colWidths) {
    worksheet["!cols"] = colWidths.map((wch) => ({ wch }));
  }
  // Excel giới hạn tên sheet tối đa 31 ký tự và cấm 1 số ký tự đặc biệt
  const safeName = String(sheetName).replace(/[\\/*?:[\]]/g, "").slice(0, 31) || "Sheet";
  XLSX.utils.book_append_sheet(workbook, worksheet, safeName);
}

/**
 * Xuất Dashboard hiện tại ra file Excel nhiều sheet.
 * @param {Object} params
 * @param {string} params.fileLabel - Nhãn ngắn dùng trong tên file (không dấu, không khoảng trắng), vd "BanGiamDoc"
 * @param {Array<{name: string, aoa: any[][], colWidths?: number[]}>} params.sheets - Danh sách sheet cần ghi, mỗi sheet đã được dashboard chuẩn bị sẵn dữ liệu hiển thị
 */
export function exportDashboardToExcel({ fileLabel, sheets }) {
  if (!sheets || sheets.length === 0) return;
  const workbook = XLSX.utils.book_new();
  sheets.forEach((sheet) => appendSheet(workbook, sheet.name, sheet.aoa, sheet.colWidths));

  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const datePart = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
  const fileName = `HTOcean_Dashboard_${fileLabel}_${datePart}.xlsx`;

  XLSX.writeFile(workbook, fileName);
}
