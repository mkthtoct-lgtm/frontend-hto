import { useMemo, useState } from "react";

const initialCategories = [
  { id: 1, name: "Hành chính", description: "Biểu mẫu nội bộ", isHidden: false },
  { id: 2, name: "Nhân sự", description: "Hợp đồng, nghỉ phép", isHidden: false },
  { id: 3, name: "Kế toán", description: "Phiếu thu/chi", isHidden: false },
];

const initialDocuments = [
  { id: 1, title: "Đơn xin nghỉ phép", categoryId: 2, updatedAt: "2026-05-05", status: "Đang dùng" },
  { id: 2, title: "Phiếu đề nghị thanh toán", categoryId: 3, updatedAt: "2026-05-02", status: "Đang dùng" },
  { id: 3, title: "Biên bản bàn giao", categoryId: 1, updatedAt: "2026-05-01", status: "Nháp" },
];

const emptyForm = { name: "", description: "" };

export const DocumentsPage = () => {
  const [categories, setCategories] = useState(initialCategories);
  const [documents] = useState(initialDocuments);
  const [activeCategory, setActiveCategory] = useState("all");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  );

  const visibleCategories = categories.filter((c) => !c.isHidden);
  const filteredDocuments = documents.filter((doc) => {
    if (activeCategory === "all") return true;
    return doc.categoryId === Number(activeCategory);
  });

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    if (editingId) {
      setCategories((prev) =>
        prev.map((item) =>
          item.id === editingId
            ? { ...item, name: form.name.trim(), description: form.description.trim() }
            : item,
        ),
      );
      resetForm();
      return;
    }

    setCategories((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: form.name.trim(),
        description: form.description.trim(),
        isHidden: false,
      },
    ]);
    resetForm();
  };

  const startEdit = (category) => {
    setEditingId(category.id);
    setForm({ name: category.name, description: category.description });
  };

  const toggleHidden = (categoryId) => {
    setCategories((prev) =>
      prev.map((item) =>
        item.id === categoryId ? { ...item, isHidden: !item.isHidden } : item,
      ),
    );
  };

  return (
    <div className="container-fluid">
      <div className="app-page-head d-flex flex-wrap gap-3 align-items-center justify-content-between">
        <div className="clearfix">
          <h1 className="app-page-title mb-0">Tài Liệu & Biểu Mẫu</h1>
          <p className="text-body mb-0">Quản lý danh mục và danh sách tài liệu</p>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-xxl-4">
          <div className="card">
            <div className="card-header border-0 pb-0">
              <h6 className="card-title mb-0">
                {editingId ? "Sửa danh mục" : "Tạo danh mục mới"}
              </h6>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
                <div>
                  <label className="form-label">Tên danh mục</label>
                  <input
                    className="form-control"
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Ví dụ: Pháp lý"
                  />
                </div>
                <div>
                  <label className="form-label">Mô tả</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={form.description}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, description: e.target.value }))
                    }
                    placeholder="Mô tả ngắn cho danh mục"
                  />
                </div>
                <div className="d-flex gap-2">
                  <button type="submit" className="btn btn-primary">
                    {editingId ? "Lưu thay đổi" : "Tạo danh mục"}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      className="btn btn-light"
                      onClick={resetForm}
                    >
                      Hủy
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="col-xxl-8">
          <div className="card">
            <div className="card-header border-0 pb-0 d-flex justify-content-between align-items-center">
              <h6 className="card-title mb-0">Danh mục tài liệu</h6>
              <span className="badge bg-primary-subtle text-primary">
                {visibleCategories.length} danh mục đang dùng
              </span>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table align-middle">
                  <thead>
                    <tr>
                      <th>Tên danh mục</th>
                      <th>Mô tả</th>
                      <th>Trạng thái</th>
                      <th className="text-end">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((category) => (
                      <tr key={category.id}>
                        <td>{category.name}</td>
                        <td>{category.description || "-"}</td>
                        <td>
                          <span
                            className={`badge ${
                              category.isHidden
                                ? "bg-danger-subtle text-danger"
                                : "bg-success-subtle text-success"
                            }`}
                          >
                            {category.isHidden ? "Đang ẩn" : "Hiển thị"}
                          </span>
                        </td>
                        <td className="text-end">
                          <button
                            className="btn btn-sm btn-outline-primary me-2"
                            onClick={() => startEdit(category)}
                          >
                            Sửa
                          </button>
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => toggleHidden(category.id)}
                          >
                            {category.isHidden ? "Hiện" : "Ẩn"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card mt-3">
        <div className="card-header border-0 pb-0 d-flex justify-content-between align-items-center">
          <h6 className="card-title mb-0">Danh sách tài liệu</h6>
          <select
            className="form-select w-auto"
            value={activeCategory}
            onChange={(e) => setActiveCategory(e.target.value)}
          >
            <option value="all">Tất cả danh mục</option>
            {visibleCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead>
                <tr>
                  <th>Tài liệu</th>
                  <th>Danh mục</th>
                  <th>Cập nhật</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.map((doc) => (
                  <tr key={doc.id}>
                    <td>{doc.title}</td>
                    <td>{categoryMap.get(doc.categoryId)?.name || "Danh mục ẩn"}</td>
                    <td>{doc.updatedAt}</td>
                    <td>{doc.status}</td>
                  </tr>
                ))}
                {filteredDocuments.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-center text-body">
                      Không có tài liệu trong bộ lọc này.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

