import React, { useState, useRef, useEffect } from "react";

// Danh sách font chữ thông dụng
const FONT_FAMILIES = [
  { label: "Mặc định (Inter)", value: "Inter, sans-serif" },
  { label: "Arial", value: "Arial, Helvetica, sans-serif" },
  { label: "Times New Roman", value: "'Times New Roman', Times, serif" },
  { label: "Roboto", value: "'Roboto', sans-serif" },
  { label: "Segoe UI", value: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" },
  { label: "Tahoma", value: "Tahoma, Verdana, sans-serif" },
  { label: "Courier New", value: "'Courier New', Courier, monospace" },
  { label: "Georgia", value: "Georgia, serif" },
];

// Danh sách kích thước chữ
const FONT_SIZES = [
  { label: "12px", value: "12px" },
  { label: "13px", value: "13px" },
  { label: "14px (Chuẩn)", value: "14px" },
  { label: "15px", value: "15px" },
  { label: "16px", value: "16px" },
  { label: "18px (Lớn)", value: "18px" },
  { label: "20px", value: "20px" },
  { label: "24px (Tiêu đề phụ)", value: "24px" },
  { label: "28px (Tiêu đề chính)", value: "28px" },
  { label: "32px (Rất lớn)", value: "32px" },
];

// Bảng màu nhanh
const QUICK_COLORS = [
  "#000000", "#334155", "#64748b", "#0284c7", "#005bbf", 
  "#059669", "#16a34a", "#d97706", "#dc2626", "#9333ea", "#c026d3"
];

const HIGHLIGHT_COLORS = [
  "#fef08a", "#bbf7d0", "#bae6fd", "#fed7aa", "#fbcfe8", "#e9d5ff", "#ffffff"
];

export const RichTextEditor = ({
  value = "",
  onChange,
  placeholder = "Nhập hoặc dán nội dung văn bản tại đây...",
  minHeight = "240px",
  className = "",
}) => {
  const editorRef = useRef(null);
  const [viewMode, setViewMode] = useState("editor"); // 'editor' | 'preview' | 'code'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showCalloutModal, setShowCalloutModal] = useState(false);

  // Form states cho modals
  const [linkForm, setLinkForm] = useState({ text: "", url: "https://", targetBlank: true });
  const [imageForm, setImageForm] = useState({ url: "", alt: "", caption: "" });
  const [tableForm, setTableForm] = useState({ rows: 3, cols: 3, hasHeader: true });
  const [calloutForm, setCalloutForm] = useState({ type: "info", title: "", text: "" });

  const [stats, setStats] = useState({ words: 0, chars: 0 });
  const isInternalUpdate = useRef(false);

  // Khởi tạo và đồng bộ value vào editor
  useEffect(() => {
    if (editorRef.current && !isInternalUpdate.current) {
      if (editorRef.current.innerHTML !== (value || "")) {
        editorRef.current.innerHTML = value || "";
      }
      updateStats(value || "");
    }
    isInternalUpdate.current = false;
  }, [value]);

  const updateStats = (html) => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    const text = tempDiv.textContent || tempDiv.innerText || "";
    const chars = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    setStats({ words, chars });
  };

  const handleInput = () => {
    if (editorRef.current) {
      isInternalUpdate.current = true;
      const html = editorRef.current.innerHTML;
      if (onChange) onChange(html);
      updateStats(html);
    }
  };

  // Thực thi lệnh định dạng
  const executeCmd = (command, val = null) => {
    if (viewMode !== "editor") return;
    if (editorRef.current) {
      editorRef.current.focus();
    }
    document.execCommand(command, false, val);
    handleInput();
  };

  // Áp dụng định dạng khối (Heading / Paragraph / Quote)
  const handleFormatBlock = (tag) => {
    if (tag === "blockquote") {
      executeCmd("formatBlock", "<blockquote>");
    } else if (tag === "p") {
      executeCmd("formatBlock", "<p>");
    } else {
      executeCmd("formatBlock", `<${tag}>`);
    }
  };

  // Áp dụng Font size
  const handleFontSize = (size) => {
    if (!size) return;
    executeCmd("fontSize", "7");
    if (editorRef.current) {
      const fontElements = editorRef.current.getElementsByTagName("font");
      for (let el of fontElements) {
        if (el.size === "7") {
          el.removeAttribute("size");
          el.style.fontSize = size;
        }
      }
    }
    handleInput();
  };

  // Áp dụng Font family
  const handleFontFamily = (font) => {
    if (!font) return;
    executeCmd("fontName", font);
  };

  // Chèn Bảng (Table)
  const handleInsertTable = (e) => {
    e.preventDefault();
    const { rows, cols, hasHeader } = tableForm;
    if (rows < 1 || cols < 1) return;

    let html = `<table class="word-editor-table" style="width: 100%; border-collapse: collapse; margin: 12px 0; border: 1px solid #cbd5e1;">`;
    if (hasHeader) {
      html += `<thead><tr style="background-color: #f1f5f9;">`;
      for (let c = 0; c < cols; c++) {
        html += `<th style="border: 1px solid #cbd5e1; padding: 8px 12px; font-weight: 700; text-align: left;">Tiêu đề ${c + 1}</th>`;
      }
      html += `</tr></thead>`;
    }
    html += `<tbody>`;
    for (let r = 0; r < rows; r++) {
      html += `<tr>`;
      for (let c = 0; c < cols; c++) {
        html += `<td style="border: 1px solid #cbd5e1; padding: 8px 12px;">Dữ liệu ${r + 1}-${c + 1}</td>`;
      }
      html += `</tr>`;
    }
    html += `</tbody></table><p><br></p>`;

    executeCmd("insertHTML", html);
    setShowTableModal(false);
  };

  // Chèn Link
  const handleInsertLink = (e) => {
    e.preventDefault();
    const { text, url, targetBlank } = linkForm;
    if (!url) return;
    const linkHtml = `<a href="${url}" ${targetBlank ? 'target="_blank" rel="noopener noreferrer"' : ''} style="color: #0284c7; text-decoration: underline; font-weight: 600;">${text || url}</a> `;
    executeCmd("insertHTML", linkHtml);
    setShowLinkModal(false);
    setLinkForm({ text: "", url: "https://", targetBlank: true });
  };

  // Chèn Ảnh
  const handleInsertImage = (e) => {
    e.preventDefault();
    const { url, alt, caption } = imageForm;
    if (!url) return;
    let imgHtml = `<figure style="margin: 14px 0; text-align: center;"><img src="${url}" alt="${alt || ''}" style="max-width: 100%; height: auto; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.06);" />`;
    if (caption) {
      imgHtml += `<figcaption style="font-size: 12px; color: #64748b; margin-top: 6px; font-style: italic;">${caption}</figcaption>`;
    }
    imgHtml += `</figure><p><br></p>`;
    executeCmd("insertHTML", imgHtml);
    setShowImageModal(false);
    setImageForm({ url: "", alt: "", caption: "" });
  };

  // Chèn Hộp Callout / Ghi chú
  const handleInsertCallout = (e) => {
    e.preventDefault();
    const { type, title, text } = calloutForm;
    
    let bg = "#f0fdf4";
    let border = "#22c55e";
    let icon = "fa-circle-check";
    let textColor = "#15803d";

    if (type === "info") {
      bg = "#f0f9ff";
      border = "#0284c7";
      icon = "fa-circle-info";
      textColor = "#0369a1";
    } else if (type === "warning") {
      bg = "#fffbeb";
      border = "#f59e0b";
      icon = "fa-triangle-exclamation";
      textColor = "#b45309";
    } else if (type === "tip") {
      bg = "#faf5ff";
      border = "#a855f7";
      icon = "fa-lightbulb";
      textColor = "#7e22ce";
    }

    const calloutHtml = `
      <div class="word-editor-callout" style="background-color: ${bg}; border-left: 4px solid ${border}; padding: 12px 16px; border-radius: 8px; margin: 12px 0;">
        ${title ? `<div style="font-weight: 800; color: ${textColor}; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;"><i class="fa ${icon}"></i> <span>${title}</span></div>` : ''}
        <div style="color: #334155; font-size: 13.5px; line-height: 1.6;">${text || "Nội dung ghi chú..."}</div>
      </div><p><br></p>
    `;

    executeCmd("insertHTML", calloutHtml);
    setShowCalloutModal(false);
    setCalloutForm({ type: "info", title: "", text: "" });
  };

  // Phím tắt bàn phím chuẩn Microsoft Word
  const handleKeyDown = (e) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case "b":
          e.preventDefault();
          executeCmd("bold");
          break;
        case "i":
          e.preventDefault();
          executeCmd("italic");
          break;
        case "u":
          e.preventDefault();
          executeCmd("underline");
          break;
        case "z":
          e.preventDefault();
          executeCmd("undo");
          break;
        case "y":
          e.preventDefault();
          executeCmd("redo");
          break;
        default:
          break;
      }
    }
  };

  return (
    <div
      className={`word-editor-container bg-white app-dark:bg-[#0f172a]! border border-slate-300 app-dark:border-slate-700! rounded-2xl shadow-sm overflow-hidden d-flex flex-column transition-all ${
        isFullscreen ? "fixed inset-0 z-[2000] rounded-none m-0 p-0 h-screen w-screen" : ""
      } ${className}`}
    >
      <style>{`
        .word-editor-content {
          outline: none;
          min-height: ${minHeight};
          line-height: 1.65;
          font-size: 14px;
          color: #1e293b;
        }
        html.app-dark .word-editor-content,
        .app-dark .word-editor-content {
          color: #e2e8f0 !important;
        }
        .word-editor-content h1 { font-size: 1.75rem; font-weight: 800; margin: 16px 0 8px; color: #0f172a; }
        .word-editor-content h2 { font-size: 1.4rem; font-weight: 750; margin: 14px 0 6px; color: #1e293b; }
        .word-editor-content h3 { font-size: 1.15rem; font-weight: 700; margin: 12px 0 4px; color: #334155; }
        .word-editor-content p { margin-bottom: 8px; }
        .word-editor-content ul { list-style-type: disc; padding-left: 24px; margin-bottom: 8px; }
        .word-editor-content ol { list-style-type: decimal; padding-left: 24px; margin-bottom: 8px; }
        .word-editor-content blockquote {
          border-left: 4px solid #0284c7;
          padding-left: 12px;
          margin: 10px 0;
          font-style: italic;
          color: #475569;
          background: #f8fafc;
          padding: 8px 12px;
          border-radius: 0 8px 8px 0;
        }
        .word-editor-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 12px 0;
        }
        .word-editor-content table th,
        .word-editor-content table td {
          border: 1px solid #cbd5e1;
          padding: 8px 10px;
        }
        html.app-dark .word-editor-content h1,
        html.app-dark .word-editor-content h2,
        html.app-dark .word-editor-content h3 {
          color: #f8fafc !important;
        }
        html.app-dark .word-editor-content blockquote {
          background: #1e293b !important;
          color: #94a3b8 !important;
        }
        html.app-dark .word-editor-content table th,
        html.app-dark .word-editor-content table td {
          border-color: #334155 !important;
        }
        .editor-ribbon-btn {
          height: 30px;
          min-width: 30px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 2px 6px;
          border-radius: 6px;
          font-size: 12px;
          color: #334155;
          background: transparent;
          border: 1px solid transparent;
          transition: all 0.15s;
          cursor: pointer;
        }
        .editor-ribbon-btn:hover {
          background: #e2e8f0;
          color: #0f172a;
          border-color: #cbd5e1;
        }
        html.app-dark .editor-ribbon-btn {
          color: #cbd5e1;
        }
        html.app-dark .editor-ribbon-btn:hover {
          background: #334155 !important;
          color: #ffffff !important;
          border-color: #475569 !important;
        }
      `}</style>

      {/* ── 1. RIBBON TOOLBAR CHUẨN MICROSOFT WORD ── */}
      <div className="border-bottom border-slate-200 app-dark:border-slate-800! bg-slate-100/90 app-dark:bg-slate-900/90! p-2 d-flex flex-wrap align-items-center justify-content-between gap-1 select-none">
        
        {/* Nhóm lệnh bên trái */}
        <div className="d-flex flex-wrap align-items-center gap-1">
          
          {/* Lịch sử Undo / Redo */}
          <div className="btn-group me-1">
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); executeCmd("undo"); }}
              className="editor-ribbon-btn"
              title="Hoàn tác (Ctrl+Z)"
            >
              <i className="fa fa-rotate-left"></i>
            </button>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); executeCmd("redo"); }}
              className="editor-ribbon-btn"
              title="Làm lại (Ctrl+Y)"
            >
              <i className="fa fa-rotate-right"></i>
            </button>
          </div>

          <div className="vr d-none d-sm-inline-block mx-1 text-slate-300"></div>

          {/* Định dạng Tiêu đề / Heading */}
          <select
            className="form-select form-select-sm py-1 px-2 rounded-lg text-xs font-semibold bg-white app-dark:bg-slate-800! text-slate-700 app-dark:text-slate-200! border-slate-300 app-dark:border-slate-700! w-auto"
            onChange={(e) => handleFormatBlock(e.target.value)}
            defaultValue="p"
            title="Định dạng đoạn văn bản / Tiêu đề"
          >
            <option value="p">Đoạn văn (Normal)</option>
            <option value="h1">Tiêu đề lớn (Heading 1)</option>
            <option value="h2">Tiêu đề vừa (Heading 2)</option>
            <option value="h3">Tiêu đề nhỏ (Heading 3)</option>
            <option value="blockquote">Trích dẫn (Quote)</option>
          </select>

          {/* Phông chữ */}
          <select
            className="form-select form-select-sm py-1 px-2 rounded-lg text-xs font-semibold bg-white app-dark:bg-slate-800! text-slate-700 app-dark:text-slate-200! border-slate-300 app-dark:border-slate-700! w-auto d-none d-md-inline-block"
            onChange={(e) => handleFontFamily(e.target.value)}
            defaultValue="Inter, sans-serif"
            title="Phông chữ (Font Family)"
          >
            {FONT_FAMILIES.map(f => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>

          {/* Cỡ chữ */}
          <select
            className="form-select form-select-sm py-1 px-2 rounded-lg text-xs font-semibold bg-white app-dark:bg-slate-800! text-slate-700 app-dark:text-slate-200! border-slate-300 app-dark:border-slate-700! w-auto"
            onChange={(e) => handleFontSize(e.target.value)}
            defaultValue="14px"
            title="Cỡ chữ (Font Size)"
          >
            {FONT_SIZES.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          <div className="vr d-none d-sm-inline-block mx-1 text-slate-300"></div>

          {/* Định dạng In đậm, Nghiêng, Gạch chân */}
          <div className="d-flex align-items-center gap-0.5">
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); executeCmd("bold"); }}
              className="editor-ribbon-btn fw-black text-sm"
              title="In đậm (Ctrl+B)"
            >
              <strong>B</strong>
            </button>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); executeCmd("italic"); }}
              className="editor-ribbon-btn fst-italic text-sm"
              title="In nghiêng (Ctrl+I)"
            >
              <em>I</em>
            </button>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); executeCmd("underline"); }}
              className="editor-ribbon-btn text-decoration-underline text-sm"
              title="Gạch chân (Ctrl+U)"
            >
              <u>U</u>
            </button>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); executeCmd("strikeThrough"); }}
              className="editor-ribbon-btn text-decoration-line-through text-sm"
              title="Gạch ngang (Strikethrough)"
            >
              <s>S</s>
            </button>
          </div>

          <div className="vr d-none d-sm-inline-block mx-1 text-slate-300"></div>

          {/* Màu chữ & Tô màu nền */}
          <div className="position-relative d-inline-block">
            <button
              type="button"
              onClick={() => { setShowColorPicker(!showColorPicker); setShowHighlightPicker(false); }}
              className="editor-ribbon-btn d-inline-flex align-items-center gap-1"
              title="Màu chữ (Text Color)"
            >
              <span className="font-extrabold text-sm text-red-600">A</span>
              <i className="fa fa-caret-down text-[10px] text-slate-400"></i>
            </button>
            {showColorPicker && (
              <div className="position-absolute top-100 start-0 mt-1 p-2 bg-white app-dark:bg-slate-800! border border-slate-200 app-dark:border-slate-700! rounded-xl shadow-xl z-50" style={{ width: "160px" }}>
                <div className="text-[11px] font-bold text-slate-500 mb-1.5">Màu chữ nhanh</div>
                <div className="d-grid grid-cols-5 gap-1.5 mb-2" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
                  {QUICK_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); executeCmd("foreColor", c); setShowColorPicker(false); }}
                      className="w-5 h-5 rounded-md border border-slate-300 hover:scale-110 transition-transform"
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                </div>
                <input
                  type="color"
                  className="form-control form-control-sm p-0 h-6 w-100 cursor-pointer"
                  onChange={(e) => { executeCmd("foreColor", e.target.value); }}
                  title="Chọn màu tùy biến"
                />
              </div>
            )}
          </div>

          <div className="position-relative d-inline-block">
            <button
              type="button"
              onClick={() => { setShowHighlightPicker(!showHighlightPicker); setShowColorPicker(false); }}
              className="editor-ribbon-btn d-inline-flex align-items-center gap-1"
              title="Màu tô sáng nền chữ (Highlight Color)"
            >
              <i className="fa fa-highlighter text-amber-500 text-xs"></i>
              <i className="fa fa-caret-down text-[10px] text-slate-400"></i>
            </button>
            {showHighlightPicker && (
              <div className="position-absolute top-100 start-0 mt-1 p-2 bg-white app-dark:bg-slate-800! border border-slate-200 app-dark:border-slate-700! rounded-xl shadow-xl z-50" style={{ width: "160px" }}>
                <div className="text-[11px] font-bold text-slate-500 mb-1.5">Màu tô sáng</div>
                <div className="d-grid grid-cols-4 gap-1.5 mb-2" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
                  {HIGHLIGHT_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); executeCmd("hiliteColor", c); setShowHighlightPicker(false); }}
                      className="w-6 h-6 rounded-md border border-slate-300 hover:scale-110 transition-transform"
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="vr d-none d-sm-inline-block mx-1 text-slate-300"></div>

          {/* Căn lề */}
          <div className="d-flex align-items-center gap-0.5">
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); executeCmd("justifyLeft"); }}
              className="editor-ribbon-btn"
              title="Căn trái"
            >
              <i className="fa fa-align-left"></i>
            </button>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); executeCmd("justifyCenter"); }}
              className="editor-ribbon-btn"
              title="Căn giữa"
            >
              <i className="fa fa-align-center"></i>
            </button>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); executeCmd("justifyRight"); }}
              className="editor-ribbon-btn"
              title="Căn phải"
            >
              <i className="fa fa-align-right"></i>
            </button>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); executeCmd("justifyFull"); }}
              className="editor-ribbon-btn"
              title="Căn đều hai bên (Justify)"
            >
              <i className="fa fa-align-justify"></i>
            </button>
          </div>

          <div className="vr d-none d-sm-inline-block mx-1 text-slate-300"></div>

          {/* Danh sách & Thụt lề */}
          <div className="d-flex align-items-center gap-0.5">
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); executeCmd("insertUnorderedList"); }}
              className="editor-ribbon-btn"
              title="Danh sách dấu chấm tròn (Bullet List)"
            >
              <i className="fa fa-list-ul"></i>
            </button>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); executeCmd("insertOrderedList"); }}
              className="editor-ribbon-btn"
              title="Danh sách đánh số thứ tự (Numbered List)"
            >
              <i className="fa fa-list-ol"></i>
            </button>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); executeCmd("outdent"); }}
              className="editor-ribbon-btn"
              title="Giảm thụt lề (Outdent)"
            >
              <i className="fa fa-outdent"></i>
            </button>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); executeCmd("indent"); }}
              className="editor-ribbon-btn"
              title="Tăng thụt lề (Indent)"
            >
              <i className="fa fa-indent"></i>
            </button>
          </div>

          <div className="vr d-none d-sm-inline-block mx-1 text-slate-300"></div>

          {/* Chèn Bảng, Link, Ảnh, Callout */}
          <div className="d-flex align-items-center gap-0.5">
            <button
              type="button"
              onClick={() => setShowTableModal(true)}
              className="editor-ribbon-btn text-cyan-700 app-dark:text-cyan-400"
              title="Chèn Bảng biểu (Table)"
            >
              <i className="fa fa-table me-1"></i>
              <span className="text-[11px] font-bold">Bảng</span>
            </button>
            <button
              type="button"
              onClick={() => setShowLinkModal(true)}
              className="editor-ribbon-btn text-blue-700 app-dark:text-blue-400"
              title="Chèn Liên kết (Link)"
            >
              <i className="fa fa-link me-1"></i>
              <span className="text-[11px] font-bold">Link</span>
            </button>
            <button
              type="button"
              onClick={() => setShowImageModal(true)}
              className="editor-ribbon-btn text-purple-700 app-dark:text-purple-400"
              title="Chèn Hình ảnh"
            >
              <i className="fa fa-image me-1"></i>
              <span className="text-[11px] font-bold">Ảnh</span>
            </button>
            <button
              type="button"
              onClick={() => setShowCalloutModal(true)}
              className="editor-ribbon-btn text-emerald-700 app-dark:text-emerald-400"
              title="Chèn Hộp ghi chú / Khuyến mãi (Callout)"
            >
              <i className="fa fa-bullhorn me-1"></i>
              <span className="text-[11px] font-bold">Ghi chú</span>
            </button>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); executeCmd("insertHorizontalRule"); }}
              className="editor-ribbon-btn"
              title="Đường kẻ ngang phân cách"
            >
              <i className="fa fa-minus"></i>
            </button>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); executeCmd("removeFormat"); }}
              className="editor-ribbon-btn text-rose-600"
              title="Xóa định dạng (Clear Formatting)"
            >
              <i className="fa fa-eraser"></i>
            </button>
          </div>

        </div>

        {/* Nhóm công cụ bên phải: Chế độ View & Fullscreen */}
        <div className="d-flex align-items-center gap-1.5">
          <div className="btn-group btn-group-sm bg-slate-200/80 app-dark:bg-slate-800! p-0.5 rounded-xl border border-slate-300 app-dark:border-slate-700!">
            <button
              type="button"
              onClick={() => setViewMode("editor")}
              className={`btn btn-xs px-2 py-0.5 rounded-lg text-[11px] font-bold border-0 ${
                viewMode === "editor" ? "bg-white text-cyan-700 app-dark:bg-cyan-600! app-dark:text-white! shadow-xs" : "text-slate-600 app-dark:text-slate-400!"
              }`}
            >
              Soạn thảo
            </button>
            <button
              type="button"
              onClick={() => setViewMode("preview")}
              className={`btn btn-xs px-2 py-0.5 rounded-lg text-[11px] font-bold border-0 ${
                viewMode === "preview" ? "bg-white text-cyan-700 app-dark:bg-cyan-600! app-dark:text-white! shadow-xs" : "text-slate-600 app-dark:text-slate-400!"
              }`}
            >
              Xem trước
            </button>
            <button
              type="button"
              onClick={() => setViewMode("code")}
              className={`btn btn-xs px-2 py-0.5 rounded-lg text-[11px] font-bold border-0 ${
                viewMode === "code" ? "bg-white text-cyan-700 app-dark:bg-cyan-600! app-dark:text-white! shadow-xs" : "text-slate-600 app-dark:text-slate-400!"
              }`}
            >
              HTML
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="editor-ribbon-btn text-slate-600 app-dark:text-slate-300"
            title={isFullscreen ? "Thu nhỏ cửa sổ" : "Mở rộng toàn màn hình"}
          >
            <i className={`fa ${isFullscreen ? "fa-compress" : "fa-expand"}`}></i>
          </button>
        </div>

      </div>

      {/* ── 2. KHÔNG GIAN SOẠN THẢO VĂN BẢN (CONTENT EDITABLE AREA) ── */}
      <div className="flex-1 overflow-y-auto p-4 bg-white app-dark:bg-[#0b1120]!">
        {viewMode === "editor" && (
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            className="word-editor-content p-2"
            data-placeholder={placeholder}
            style={{ minHeight }}
          />
        )}

        {viewMode === "preview" && (
          <div className="word-editor-preview p-2">
            <div className="p-3 mb-3 rounded-xl bg-cyan-50 text-cyan-800 border border-cyan-200 text-xs font-semibold d-flex align-items-center gap-2">
              <i className="fa fa-eye"></i>
              <span>Xem trước giao diện hiển thị cho khách hàng & cộng tác viên:</span>
            </div>
            <div
              className="word-editor-content"
              dangerouslySetInnerHTML={{ __html: value || "<p class='text-slate-400 italic'>Chưa có nội dung văn bản...</p>" }}
            />
          </div>
        )}

        {viewMode === "code" && (
          <div className="p-1 h-100">
            <textarea
              className="form-control font-mono text-xs p-3 bg-slate-900 text-emerald-400 border-0 rounded-xl w-100 h-100"
              rows="12"
              value={value}
              onChange={(e) => {
                const val = e.target.value;
                if (onChange) onChange(val);
                if (editorRef.current) editorRef.current.innerHTML = val;
                updateStats(val);
              }}
              placeholder="<!-- Mã nguồn HTML của văn bản -->"
            />
          </div>
        )}
      </div>

      {/* ── 3. THANH TRẠNG THÁI (STATUS BAR / STATS) ── */}
      <div className="border-top border-slate-200 app-dark:border-slate-800! bg-slate-50 app-dark:bg-slate-900/60! px-4 py-1.5 d-flex align-items-center justify-content-between text-[11px] text-slate-500 app-dark:text-slate-400! select-none font-medium">
        <div className="d-flex align-items-center gap-3">
          <span><strong className="text-slate-800 app-dark:text-slate-200 font-bold">{stats.words}</strong> từ</span>
          <span>•</span>
          <span><strong className="text-slate-800 app-dark:text-slate-200 font-bold">{stats.chars}</strong> ký tự</span>
          <span>•</span>
          <span className="text-cyan-700 app-dark:text-cyan-400"><i className="fa fa-keyboard me-1"></i>Hỗ trợ Ctrl+B, Ctrl+I, Ctrl+U, Ctrl+Z</span>
        </div>
        <div className="d-flex align-items-center gap-2">
          <span>Trình soạn thảo trực quan Microsoft Word Style</span>
        </div>
      </div>

      {/* ── MODAL 1: CHÈN BẢNG (INSERT TABLE) ── */}
      {showTableModal && (
        <div className="fixed inset-0 z-[2100] flex items-center justify-center bg-black/60 p-3 backdrop-blur-xs">
          <div className="bg-white app-dark:bg-slate-900 rounded-2xl p-4 shadow-2xl border border-slate-200 app-dark:border-slate-800 max-w-sm w-full">
            <h6 className="font-extrabold text-sm text-slate-900 app-dark:text-white mb-3 d-flex align-items-center gap-2">
              <i className="fa fa-table text-cyan-600"></i>
              <span>Chèn Bảng Biểu Mới</span>
            </h6>
            <form onSubmit={handleInsertTable} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 app-dark:text-slate-300 block mb-1">Số dòng (Rows)</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    className="form-control form-control-sm rounded-lg"
                    value={tableForm.rows}
                    onChange={(e) => setTableForm({ ...tableForm, rows: parseInt(e.target.value, 10) || 1 })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 app-dark:text-slate-300 block mb-1">Số cột (Columns)</label>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    className="form-control form-control-sm rounded-lg"
                    value={tableForm.cols}
                    onChange={(e) => setTableForm({ ...tableForm, cols: parseInt(e.target.value, 10) || 1 })}
                  />
                </div>
              </div>
              <div className="form-check">
                <input
                  type="checkbox"
                  id="hasHeader"
                  className="form-check-input"
                  checked={tableForm.hasHeader}
                  onChange={(e) => setTableForm({ ...tableForm, hasHeader: e.target.checked })}
                />
                <label htmlFor="hasHeader" className="form-check-label text-xs font-semibold text-slate-700 app-dark:text-slate-300">
                  Tạo hàng tiêu đề nổi bật (Header row)
                </label>
              </div>
              <div className="d-flex justify-content-end gap-2 pt-2 border-top">
                <button type="button" onClick={() => setShowTableModal(false)} className="btn btn-xs btn-outline-secondary rounded-lg px-3 py-1.5 font-bold">Hủy</button>
                <button type="submit" className="btn btn-xs btn-primary rounded-lg px-4 py-1.5 font-bold">Chèn bảng</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: CHÈN LINK ── */}
      {showLinkModal && (
        <div className="fixed inset-0 z-[2100] flex items-center justify-center bg-black/60 p-3 backdrop-blur-xs">
          <div className="bg-white app-dark:bg-slate-900 rounded-2xl p-4 shadow-2xl border border-slate-200 app-dark:border-slate-800 max-w-sm w-full">
            <h6 className="font-extrabold text-sm text-slate-900 app-dark:text-white mb-3 d-flex align-items-center gap-2">
              <i className="fa fa-link text-blue-600"></i>
              <span>Chèn Liên Kết Web (Link)</span>
            </h6>
            <form onSubmit={handleInsertLink} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-600 app-dark:text-slate-300 block mb-1">Văn bản hiển thị</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Bấm xem chi tiết chương trình..."
                  className="form-control form-control-sm rounded-lg"
                  value={linkForm.text}
                  onChange={(e) => setLinkForm({ ...linkForm, text: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 app-dark:text-slate-300 block mb-1">Địa chỉ URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://example.com"
                  className="form-control form-control-sm rounded-lg"
                  value={linkForm.url}
                  onChange={(e) => setLinkForm({ ...linkForm, url: e.target.value })}
                />
              </div>
              <div className="form-check">
                <input
                  type="checkbox"
                  id="targetBlank"
                  className="form-check-input"
                  checked={linkForm.targetBlank}
                  onChange={(e) => setLinkForm({ ...linkForm, targetBlank: e.target.checked })}
                />
                <label htmlFor="targetBlank" className="form-check-label text-xs font-semibold text-slate-700 app-dark:text-slate-300">
                  Mở trong tab mới (target="_blank")
                </label>
              </div>
              <div className="d-flex justify-content-end gap-2 pt-2 border-top">
                <button type="button" onClick={() => setShowLinkModal(false)} className="btn btn-xs btn-outline-secondary rounded-lg px-3 py-1.5 font-bold">Hủy</button>
                <button type="submit" className="btn btn-xs btn-primary rounded-lg px-4 py-1.5 font-bold">Chèn Link</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 3: CHÈN ẢNH (INSERT IMAGE) ── */}
      {showImageModal && (
        <div className="fixed inset-0 z-[2100] flex items-center justify-center bg-black/60 p-3 backdrop-blur-xs">
          <div className="bg-white app-dark:bg-slate-900 rounded-2xl p-4 shadow-2xl border border-slate-200 app-dark:border-slate-800 max-w-sm w-full">
            <h6 className="font-extrabold text-sm text-slate-900 app-dark:text-white mb-3 d-flex align-items-center gap-2">
              <i className="fa fa-image text-purple-600"></i>
              <span>Chèn Hình Ảnh Minh Họa</span>
            </h6>
            <form onSubmit={handleInsertImage} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-600 app-dark:text-slate-300 block mb-1">Đường dẫn ảnh (Image URL)</label>
                <input
                  type="url"
                  required
                  placeholder="https://example.com/photo.jpg"
                  className="form-control form-control-sm rounded-lg"
                  value={imageForm.url}
                  onChange={(e) => setImageForm({ ...imageForm, url: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 app-dark:text-slate-300 block mb-1">Chú thích ảnh (Caption)</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Khuôn viên trường đại học..."
                  className="form-control form-control-sm rounded-lg"
                  value={imageForm.caption}
                  onChange={(e) => setImageForm({ ...imageForm, caption: e.target.value })}
                />
              </div>
              <div className="d-flex justify-content-end gap-2 pt-2 border-top">
                <button type="button" onClick={() => setShowImageModal(false)} className="btn btn-xs btn-outline-secondary rounded-lg px-3 py-1.5 font-bold">Hủy</button>
                <button type="submit" className="btn btn-xs btn-primary rounded-lg px-4 py-1.5 font-bold">Chèn ảnh</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 4: CHÈN HỘP GHI CHÚ (CALLOUT ALERT) ── */}
      {showCalloutModal && (
        <div className="fixed inset-0 z-[2100] flex items-center justify-center bg-black/60 p-3 backdrop-blur-xs">
          <div className="bg-white app-dark:bg-slate-900 rounded-2xl p-4 shadow-2xl border border-slate-200 app-dark:border-slate-800 max-w-md w-full">
            <h6 className="font-extrabold text-sm text-slate-900 app-dark:text-white mb-3 d-flex align-items-center gap-2">
              <i className="fa fa-bullhorn text-emerald-600"></i>
              <span>Chèn Khối Thông Báo / Điểm Nhấn (Callout)</span>
            </h6>
            <form onSubmit={handleInsertCallout} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-600 app-dark:text-slate-300 block mb-1">Loại thông báo</label>
                <select
                  className="form-select form-select-sm rounded-lg"
                  value={calloutForm.type}
                  onChange={(e) => setCalloutForm({ ...calloutForm, type: e.target.value })}
                >
                  <option value="info">🔵 Thông tin chung (Info Blue)</option>
                  <option value="success">🟢 Điểm nổi bật / Thành công (Success Green)</option>
                  <option value="warning">🟠 Lưu ý quan trọng (Warning Orange)</option>
                  <option value="tip">🟣 Mẹo / Ưu đãi đặc biệt (Tip Purple)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 app-dark:text-slate-300 block mb-1">Tiêu đề khối</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Ưu đãi học bổng lên đến 50%..."
                  className="form-control form-control-sm rounded-lg"
                  value={calloutForm.title}
                  onChange={(e) => setCalloutForm({ ...calloutForm, title: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 app-dark:text-slate-300 block mb-1">Nội dung chi tiết</label>
                <textarea
                  rows="3"
                  required
                  placeholder="Nhập chi tiết điều kiện hoặc nội dung nổi bật..."
                  className="form-control form-control-sm rounded-lg"
                  value={calloutForm.text}
                  onChange={(e) => setCalloutForm({ ...calloutForm, text: e.target.value })}
                />
              </div>
              <div className="d-flex justify-content-end gap-2 pt-2 border-top">
                <button type="button" onClick={() => setShowCalloutModal(false)} className="btn btn-xs btn-outline-secondary rounded-lg px-3 py-1.5 font-bold">Hủy</button>
                <button type="submit" className="btn btn-xs btn-primary rounded-lg px-4 py-1.5 font-bold">Chèn khối</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
