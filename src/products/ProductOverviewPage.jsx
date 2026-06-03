import { useState, useMemo, useEffect, useCallback } from "react";
import { productService } from "./services/productService";
import "./ProductOverviewPage.css";

// ==========================================
// PREDEFINED PALETTES FOR CARD BG
// ==========================================
const BG_PALETTES = [
  { value: "linear-gradient(135deg, #003366 0%, #002244 100%)", label: "Xanh dương HTO" },
  { value: "linear-gradient(135deg, #10B981 0%, #059669 100%)", label: "Xanh lá cây" },
  { value: "linear-gradient(135deg, #FF9900 0%, #FF5E36 100%)", label: "Cam mùa hè" },
  { value: "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)", label: "Tím du học" },
  { value: "linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)", label: "Xanh ngọc TTS" },
  { value: "custom", label: "Màu tùy chỉnh (Nhập mã gradient)" }
];

const ALL_COUNTRIES_MOCK = [
  "Tất cả", "Đức", "Hàn Quốc", "Nhật Bản", "Đài Loan", "Úc", "Mỹ", "Canada", "Singapore", "Philippines", "Anh Quốc", "Thụy Sĩ"
];

const ROLE_ID_MAP = {
  "69fc5af582ef85451120772a": "admin",
  "69fc5af582ef85451120772b": "bangiamdoc",
  "69fc5af582ef85451120772c": "truongbophan",
  "69fc5af582ef85451120772d": "nhansu",
  "69fc5af582ef85451120772e": "daily",
  "69fc5af682ef85451120772f": "congtacvien",
  "69fc5af782ef854511207730": "user",
};

const normalizeRoleKey = (roleValue) => {
  return String(roleValue || "")
    .trim()
    .toLowerCase()
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
};

const getUserRoleKey = (user) => {
  const roleFromObject = user?.role?.name || user?.roleName || user?.role || user?.role_key || "";
  const roleFromId = ROLE_ID_MAP[user?.roleId];
  return normalizeRoleKey(roleFromObject || roleFromId || "user");
};

export function ProductOverviewPage({ currentUser }) {
  // 1. Phân quyền người dùng thật từ currentUser
  const userRole = getUserRoleKey(currentUser);
  const canManageProducts = ["admin", "bangiamdoc", "truongbophan"].includes(userRole);

  // 2. State dữ liệu & API
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [apiMode, setApiMode] = useState("mock");

  // 3. Điều hướng chế độ xem trong trang
  const [viewMode, setViewMode] = useState("overview"); // "overview" | "detail"
  const [selectedProduct, setSelectedProduct] = useState(null);

  // 4. Lọc tìm kiếm
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryName, setSelectedCategoryName] = useState("Tất cả");
  const [selectedCountry, setSelectedCountry] = useState("Tất cả");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // 5. Accordion danh sách con
  const [openCardPrograms, setOpenCardPrograms] = useState({
    "cat-1": true
  });

  // 6. Quản lý Modal thêm/sửa
  const [editingCategory, setEditingCategory] = useState(null); // null | 'new' | category_id
  const [editingProduct, setEditingProduct] = useState(null); // null | 'new' | product_id
  const [editingProductParentCatId, setEditingProductParentCatId] = useState("");
  const [showInterestModal, setShowInterestModal] = useState(false);

  // Tabs của Modal
  const [activeCategoryTab, setActiveCategoryTab] = useState("info");
  const [activeProductTab, setActiveProductTab] = useState("basic");

  // Local state lưu trữ link inputs
  const [brochureLinkInput, setBrochureLinkInput] = useState("");
  const [docLinkNameInput, setDocLinkNameInput] = useState("");
  const [docLinkUrlInput, setDocLinkUrlInput] = useState("");
  const [docLinkTypeInput, setDocLinkTypeInput] = useState("Checklist");

  // Drag & drop visual states
  const [isBrochureDragging, setIsBrochureDragging] = useState(false);
  const [isDocsDragging, setIsDocsDragging] = useState(false);

  // Form states
  const [formCategory, setFormCategory] = useState({
    id: "",
    name: "",
    description: "",
    status: "active",
    imagePalette: "linear-gradient(135deg, #003366 0%, #002244 100%)",
    customGradient: "",
    programs: []
  });

  const [formProduct, setFormProduct] = useState({
    id: "",
    name: "",
    categoryId: "",
    categoryName: "",
    country: "",
    region: "Châu Á",
    status: "active",
    description: "",
    detailDescription: "",
    targetAudience: "",
    highlightsText: "",
    processStepsText: "",
    tagsText: "",
    websiteUrl: "",
    brochure: null,
    documents: [],
    updatedAt: ""
  });

  const [interestForm, setInterestForm] = useState({
    customerName: "",
    phone: "",
    email: "",
    note: "",
    sourceChannel: "CTV/Đại lý"
  });

  const currentUserName = useMemo(() => {
    return currentUser?.name || currentUser?.username || "CTV/Đại lý HTO";
  }, [currentUser]);

  // Load danh sách dữ liệu từ Service
  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await productService.getProductCategories();
      setCategories(res.data);
      setApiMode(res.apiMode);
    } catch (err) {
      console.error(err);
      setError("Không thể tải danh sách sản phẩm.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Toggle Collapse
  const toggleProgramsAccordion = (catId) => {
    setOpenCardPrograms(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCategoryName("Tất cả");
    setSelectedCountry("Tất cả");
    setSelectedStatus("all");
  };

  const handleGoBack = () => {
    setSelectedProduct(null);
    setViewMode("overview");
  };

  // Lọc danh mục & sản phẩm con
  const filteredCategories = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return categories
      .map(cat => {
        // Lọc các sản phẩm con
        const filteredProgs = (cat.programs || []).filter(prog => {
          const matchSearch =
            !q ||
            prog.name.toLowerCase().includes(q) ||
            prog.country.toLowerCase().includes(q) ||
            (prog.tags && prog.tags.some(t => t.toLowerCase().includes(q)));

          const matchCountry = selectedCountry === "Tất cả" || prog.country === selectedCountry;
          const matchStatus = selectedStatus === "all" || prog.status === selectedStatus;

          return matchSearch && matchCountry && matchStatus;
        });

        // Kiểm tra xem danh mục có khớp tìm kiếm không
        const isCatMatch =
          !q ||
          cat.name.toLowerCase().includes(q) ||
          cat.description.toLowerCase().includes(q);

        const hasMatchingPrograms = filteredProgs.length > 0;

        // Nếu lọc theo nước/trạng thái hoặc có từ khóa tìm kiếm
        const shouldShow =
          (selectedCategoryName === "Tất cả" || cat.name === selectedCategoryName) &&
          (isCatMatch || hasMatchingPrograms || (!q && selectedCountry === "Tất cả" && selectedStatus === "all"));

        if (!shouldShow) return null;

        return {
          ...cat,
          filteredPrograms: filteredProgs
        };
      })
      .filter(Boolean);
  }, [categories, searchQuery, selectedCategoryName, selectedCountry, selectedStatus]);

  // Bộ lọc danh mục (tên)
  const categoryNames = useMemo(() => {
    return ["Tất cả", ...categories.map(c => c.name)];
  }, [categories]);

  // Tính toán thống kê dashboard
  const stats = useMemo(() => {
    let totalChildren = 0;
    let activeChildren = 0;
    let docsCount = 0;

    categories.forEach(c => {
      const progs = c.programs || [];
      totalChildren += progs.length;
      progs.forEach(p => {
        if (p.status === "active") activeChildren++;
        if (p.brochure) docsCount++;
        docsCount += p.documents?.length || 0;
      });
    });

    return {
      totalCategories: categories.length,
      totalPrograms: totalChildren,
      activePrograms: activeChildren,
      totalDocuments: docsCount,
      hiddenCategories: categories.filter(c => c.status === "hidden").length
    };
  }, [categories]);

  // Link normalization and validation helpers
  const isValidUrl = (url) => {
    const trimmed = url.trim();
    if (!trimmed) return false;
    return trimmed.includes(".") && trimmed.length > 3;
  };

  const normalizeUrl = (url) => {
    if (!url) return "";
    let target = url.trim();
    if (!/^https?:\/\//i.test(target)) {
      target = "https://" + target;
    }
    return target;
  };

  const handleOpenWebsite = (url) => {
    if (!url) return;
    const finalUrl = normalizeUrl(url);
    window.open(finalUrl, "_blank", "noopener,noreferrer");
  };

  const handleDownloadDoc = (name) => {
    alert(`Bắt đầu tải tài liệu giả lập: ${name}`);
  };

  // --- MOCK LEADS FORM ---
  const handleOpenInterestModal = () => {
    setInterestForm({
      customerName: "",
      phone: "",
      email: "",
      note: "",
      sourceChannel: "CTV/Đại lý"
    });
    setShowInterestModal(true);
  };

  const handleSubmitInterest = async (e) => {
    e.preventDefault();
    try {
      await productService.createProductInterestLead({
        ...interestForm,
        productProgramId: selectedProduct.id,
        productProgramName: selectedProduct.name,
        sourceUser: currentUserName
      });
      alert(`Gửi yêu cầu tư vấn thành công!\nKhách hàng: ${interestForm.customerName}\nSản phẩm: ${selectedProduct.name}`);
      setShowInterestModal(false);
    } catch (err) {
      alert("Gửi liên hệ thất bại: " + err.message);
    }
  };

  // --- CRUD: CATEGORY ACTIONS ---
  const handleOpenNewCategory = () => {
    if (!canManageProducts) return;
    setFormCategory({
      id: "new",
      name: "",
      description: "",
      status: "active",
      imagePalette: "linear-gradient(135deg, #003366 0%, #002244 100%)",
      customGradient: "",
      programs: []
    });
    setActiveCategoryTab("info");
    setEditingCategory("new");
  };

  const handleEditCategory = (cat) => {
    if (!canManageProducts) return;
    setFormCategory({
      id: cat.id,
      name: cat.name,
      description: cat.description || "",
      status: cat.status || "active",
      imagePalette: BG_PALETTES.some(p => p.value === cat.imageGradient) ? cat.imageGradient : "custom",
      customGradient: BG_PALETTES.some(p => p.value === cat.imageGradient) ? "" : cat.imageGradient,
      programs: cat.programs || []
    });
    setActiveCategoryTab("info");
    setEditingCategory(cat.id);
  };

  const handleToggleCategoryStatus = async (catId, currentStatus) => {
    if (!canManageProducts) return;
    const newStatus = currentStatus === "active" ? "hidden" : "active";
    const statusText = newStatus === "active" ? "hiện" : "ẩn";
    if (confirm(`Bạn có chắc chắn muốn ${statusText} danh mục này không?`)) {
      try {
        await productService.toggleProductCategoryStatus(catId, newStatus);
        alert(`Đã ${statusText} danh mục!`);
        loadData();
      } catch (err) {
        alert("Lỗi khi thay đổi trạng thái danh mục: " + err.message);
      }
    }
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!canManageProducts) return;

    if (!formCategory.name.trim()) {
      alert("Tên danh mục không được để trống!");
      return;
    }

    const imageGradient = formCategory.imagePalette === "custom"
      ? (formCategory.customGradient || "linear-gradient(135deg, #64748B 0%, #475569 100%)")
      : formCategory.imagePalette;

    const payload = {
      name: formCategory.name,
      description: formCategory.description,
      status: formCategory.status,
      imageGradient
    };

    try {
      if (editingCategory === "new") {
        await productService.createProductCategory(payload);
        alert("Đã thêm danh mục mới thành công!");
      } else {
        await productService.updateProductCategory(editingCategory, payload);
        alert("Đã cập nhật danh mục thành công!");
      }
      setEditingCategory(null);
      loadData();
    } catch (err) {
      alert("Lỗi khi lưu danh mục: " + err.message);
    }
  };

  // --- CRUD: CHILD PRODUCT ACTIONS ---
  const handleOpenNewProduct = (catId) => {
    if (!canManageProducts) return;
    setEditingProductParentCatId(catId);
    setFormProduct({
      id: "new",
      name: "",
      categoryId: catId,
      country: "",
      region: "Châu Á",
      status: "active",
      description: "",
      detailDescription: "",
      targetAudience: "",
      highlightsText: "",
      processStepsText: "",
      tagsText: "",
      websiteUrl: "",
      brochure: null,
      documents: []
    });
    setBrochureLinkInput("");
    setDocLinkNameInput("");
    setDocLinkUrlInput("");
    setDocLinkTypeInput("Checklist");
    setActiveProductTab("basic");
    setEditingProduct("new");
  };

  const handleEditProduct = (prod) => {
    if (!canManageProducts) return;
    setEditingProductParentCatId(prod.categoryId);
    setFormProduct({
      id: prod.id,
      name: prod.name,
      categoryId: prod.categoryId,
      categoryName: prod.categoryName,
      country: prod.country,
      region: prod.region || "Châu Á",
      status: prod.status || "active",
      description: prod.description || "",
      detailDescription: prod.detailDescription || "",
      targetAudience: prod.targetAudience || "",
      highlightsText: (prod.highlights || []).join("\n"),
      processStepsText: (prod.processSteps || []).join("\n"),
      tagsText: (prod.tags || []).join(", "),
      websiteUrl: prod.websiteUrl || "",
      brochure: prod.brochure || null,
      documents: prod.documents || []
    });
    setBrochureLinkInput("");
    setDocLinkNameInput("");
    setDocLinkUrlInput("");
    setDocLinkTypeInput("Checklist");
    setActiveProductTab("basic");
    setEditingProduct(prod.id);
  };

  const handleDeleteProduct = async (prodId) => {
    if (!canManageProducts) return;
    if (confirm("Bạn có chắc chắn muốn xóa sản phẩm con này không?")) {
      try {
        // Mock remove by updating category programs list directly via update
        const data = categories;
        let success = false;
        for (let cat of data) {
          const pIdx = cat.programs?.findIndex(p => p.id === prodId);
          if (pIdx !== -1 && pIdx !== undefined) {
            cat.programs = cat.programs.filter(p => p.id !== prodId);
            await productService.updateProductCategory(cat.id, { programs: cat.programs });
            success = true;
            break;
          }
        }
        if (success) {
          alert("Đã xóa sản phẩm con!");
          loadData();
        } else {
          throw new Error("Không tìm thấy sản phẩm");
        }
      } catch (err) {
        alert("Lỗi khi xóa sản phẩm con: " + err.message);
      }
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!canManageProducts) return;

    if (!formProduct.name.trim()) {
      alert("Tên sản phẩm con không được để trống!");
      return;
    }
    if (!formProduct.country.trim()) {
      alert("Quốc gia không được để trống!");
      return;
    }

    const highlights = formProduct.highlightsText.split("\n").map(s => s.trim()).filter(Boolean);
    const processSteps = formProduct.processStepsText.split("\n").map(s => s.trim()).filter(Boolean);
    const tags = formProduct.tagsText.split(",").map(s => s.trim()).filter(Boolean);

    const payload = {
      name: formProduct.name,
      country: formProduct.country,
      region: formProduct.region,
      status: formProduct.status,
      description: formProduct.description,
      detailDescription: formProduct.detailDescription,
      targetAudience: formProduct.targetAudience,
      highlights,
      processSteps,
      tags,
      websiteUrl: formProduct.websiteUrl,
      brochure: formProduct.brochure,
      documents: formProduct.documents
    };

    try {
      if (editingProduct === "new") {
        await productService.createProductChild(editingProductParentCatId, payload);
        alert("Đã thêm sản phẩm con mới thành công!");
      } else {
        await productService.updateProductChild(editingProduct, payload);
        alert("Đã cập nhật sản phẩm con thành công!");
      }
      setEditingProduct(null);
      loadData();
      
      // Update selected view details if active
      if (selectedProduct && selectedProduct.id === editingProduct) {
        const detailRes = await productService.getProductDetail(editingProduct);
        setSelectedProduct(detailRes.data);
      }
    } catch (err) {
      alert("Lỗi khi lưu sản phẩm con: " + err.message);
    }
  };

  // --- BROCHURE & DOCUMENTS UPLOAD / LINK HANDLERS ---
  const checkAndReplaceBrochure = (onConfirm) => {
    if (formProduct.brochure) {
      if (confirm("Sản phẩm đã có Brochure. Bạn có chắc chắn muốn thay thế bằng Brochure mới không?")) {
        onConfirm();
      }
    } else {
      onConfirm();
    }
  };

  const handleProductBrochureUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const ext = file.name.split(".").pop().toLowerCase();
      const isPdf = ext === "pdf";
      const isImg = ["jpg", "jpeg", "png", "webp"].includes(ext);
      if (!isPdf && !isImg) {
        alert("Vui lòng tải lên file PDF hoặc hình ảnh (JPG, JPEG, PNG, WEBP)!");
        return;
      }
      checkAndReplaceBrochure(async () => {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        const previewUrl = isImg ? URL.createObjectURL(file) : "";
        const brochureData = {
          id: `brochure-file-${Date.now()}`,
          name: file.name,
          sourceType: "file",
          fileType: isPdf ? "PDF" : "IMAGE",
          size: `${sizeMB} MB`,
          url: previewUrl,
          updatedAt: new Date().toISOString().split("T")[0]
        };

        if (editingProduct === "new") {
          setFormProduct(prev => ({ ...prev, brochure: brochureData }));
        } else {
          try {
            await productService.uploadProductBrochure(editingProduct, { file, ...brochureData });
            setFormProduct(prev => ({ ...prev, brochure: brochureData }));
            alert(`Đã tải brochure: ${file.name}`);
          } catch (err) {
            alert("Lỗi khi tải brochure lên: " + err.message);
          }
        }
      });
      e.target.value = "";
    }
  };

  const handleBrochureDragOver = (e) => {
    e.preventDefault();
    setIsBrochureDragging(true);
  };

  const handleBrochureDragLeave = (e) => {
    e.preventDefault();
    setIsBrochureDragging(false);
  };

  const handleBrochureDrop = (e) => {
    e.preventDefault();
    setIsBrochureDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      const ext = file.name.split(".").pop().toLowerCase();
      const isPdf = ext === "pdf";
      const isImg = ["jpg", "jpeg", "png", "webp"].includes(ext);
      if (!isPdf && !isImg) {
        alert("Vui lòng tải lên file PDF hoặc hình ảnh (JPG, JPEG, PNG, WEBP)!");
        return;
      }
      checkAndReplaceBrochure(async () => {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        const previewUrl = isImg ? URL.createObjectURL(file) : "";
        const brochureData = {
          id: `brochure-file-${Date.now()}`,
          name: file.name,
          sourceType: "file",
          fileType: isPdf ? "PDF" : "IMAGE",
          size: `${sizeMB} MB`,
          url: previewUrl,
          updatedAt: new Date().toISOString().split("T")[0]
        };

        if (editingProduct === "new") {
          setFormProduct(prev => ({ ...prev, brochure: brochureData }));
        } else {
          try {
            await productService.uploadProductBrochure(editingProduct, { file, ...brochureData });
            setFormProduct(prev => ({ ...prev, brochure: brochureData }));
            alert(`Đã tải brochure: ${file.name}`);
          } catch (err) {
            alert("Lỗi khi tải brochure lên: " + err.message);
          }
        }
      });
    }
  };

  const handleAddBrochureLink = async () => {
    if (!brochureLinkInput.trim()) {
      alert("Vui lòng nhập link Brochure.");
      return;
    }
    if (!isValidUrl(brochureLinkInput)) {
      alert("Vui lòng nhập link hợp lệ.");
      return;
    }
    checkAndReplaceBrochure(async () => {
      const finalUrl = normalizeUrl(brochureLinkInput);
      const brochureData = {
        id: `brochure-link-${Date.now()}`,
        name: brochureLinkInput.trim(),
        sourceType: "link",
        fileType: "LINK",
        size: "",
        url: finalUrl,
        updatedAt: new Date().toISOString().split("T")[0]
      };

      if (editingProduct === "new") {
        setFormProduct(prev => ({ ...prev, brochure: brochureData }));
      } else {
        try {
          await productService.uploadProductBrochure(editingProduct, brochureData);
          setFormProduct(prev => ({ ...prev, brochure: brochureData }));
          alert("Đã gắn link Brochure thành công!");
        } catch (err) {
          alert("Lỗi khi gắn link: " + err.message);
        }
      }
      setBrochureLinkInput("");
    });
  };

  const removeProductBrochure = () => {
    setFormProduct(prev => ({ ...prev, brochure: null }));
  };

  // Product Documents multiple upload & drag-drop mock
  const handleProductDocsUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const validFiles = files.filter(file => {
        const ext = file.name.split(".").pop().toLowerCase();
        return ["pdf", "docx", "xlsx"].includes(ext);
      });
      if (validFiles.length === 0) {
        alert("Vui lòng chọn các file PDF, DOCX hoặc XLSX!");
        return;
      }
      const newDocs = validFiles.map((file, index) => {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        const kbSize = (file.size / 1024).toFixed(0);
        const finalSize = parseFloat(sizeMB) > 0.1 ? `${sizeMB} MB` : `${kbSize} KB`;
        const ext = file.name.split(".").pop().toUpperCase();
        return {
          id: `prod-doc-${Date.now()}-${index}`,
          name: file.name,
          type: ext === "PDF" ? "PDF" : (ext === "DOCX" ? "DOCX" : "XLSX"),
          sourceType: "file",
          fileType: ext,
          size: finalSize,
          url: "",
          updatedAt: new Date().toISOString().split("T")[0]
        };
      });

      if (editingProduct === "new") {
        setFormProduct(prev => ({
          ...prev,
          documents: [...(prev.documents || []), ...newDocs]
        }));
      } else {
        try {
          await productService.uploadProductDocuments(editingProduct, { files: validFiles, newDocs });
          setFormProduct(prev => ({
            ...prev,
            documents: [...(prev.documents || []), ...newDocs]
          }));
          alert(`Đã đính kèm ${newDocs.length} tài liệu tư vấn mới!`);
        } catch (err) {
          alert("Lỗi khi tải tài liệu lên: " + err.message);
        }
      }
    }
  };

  const handleDocsDragOver = (e) => {
    e.preventDefault();
    setIsDocsDragging(true);
  };

  const handleDocsDragLeave = (e) => {
    e.preventDefault();
    setIsDocsDragging(false);
  };

  const handleDocsDrop = async (e) => {
    e.preventDefault();
    setIsDocsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const validFiles = files.filter(file => {
        const ext = file.name.split(".").pop().toLowerCase();
        return ["pdf", "docx", "xlsx"].includes(ext);
      });
      if (validFiles.length === 0) {
        alert("Vui lòng kéo thả các tệp PDF, DOCX hoặc XLSX!");
        return;
      }
      const newDocs = validFiles.map((file, index) => {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        const kbSize = (file.size / 1024).toFixed(0);
        const finalSize = parseFloat(sizeMB) > 0.1 ? `${sizeMB} MB` : `${kbSize} KB`;
        const ext = file.name.split(".").pop().toUpperCase();
        return {
          id: `prod-doc-${Date.now()}-${index}`,
          name: file.name,
          type: ext === "PDF" ? "PDF" : (ext === "DOCX" ? "DOCX" : "XLSX"),
          sourceType: "file",
          fileType: ext,
          size: finalSize,
          url: "",
          updatedAt: new Date().toISOString().split("T")[0]
        };
      });

      if (editingProduct === "new") {
        setFormProduct(prev => ({
          ...prev,
          documents: [...(prev.documents || []), ...newDocs]
        }));
      } else {
        try {
          await productService.uploadProductDocuments(editingProduct, { files: validFiles, newDocs });
          setFormProduct(prev => ({
            ...prev,
            documents: [...(prev.documents || []), ...newDocs]
          }));
          alert(`Đã đính kèm ${newDocs.length} tài liệu tư vấn mới!`);
        } catch (err) {
          alert("Lỗi khi tải tài liệu lên: " + err.message);
        }
      }
    }
  };

  const handleAddDocLink = () => {
    if (!docLinkNameInput.trim()) {
      alert("Vui lòng nhập tên tài liệu.");
      return;
    }
    if (!docLinkUrlInput.trim() || !isValidUrl(docLinkUrlInput)) {
      alert("Vui lòng nhập link tài liệu hợp lệ.");
      return;
    }

    const finalUrl = normalizeUrl(docLinkUrlInput);
    const newDoc = {
      id: `prod-doc-link-${Date.now()}`,
      name: docLinkNameInput.trim(),
      type: docLinkTypeInput,
      sourceType: "link",
      fileType: "LINK",
      size: "",
      url: finalUrl,
      updatedAt: new Date().toISOString().split("T")[0]
    };

    setFormProduct(prev => ({
      ...prev,
      documents: [...(prev.documents || []), newDoc]
    }));

    setDocLinkNameInput("");
    setDocLinkUrlInput("");
    alert("Đã thêm liên kết tài liệu tư vấn!");
  };

  const deleteProductDoc = async (docId) => {
    if (confirm("Bạn có chắc chắn muốn xóa tài liệu tư vấn này không?")) {
      if (editingProduct === "new") {
        setFormProduct(prev => ({
          ...prev,
          documents: (prev.documents || []).filter(d => d.id !== docId)
        }));
      } else {
        try {
          await productService.removeProductDocument(editingProduct, docId);
          setFormProduct(prev => ({
            ...prev,
            documents: (prev.documents || []).filter(d => d.id !== docId)
          }));
          alert("Đã xóa tài liệu tư vấn!");
        } catch (err) {
          alert("Lỗi khi xóa tài liệu tư vấn: " + err.message);
        }
      }
    }
  };
  if (loading) {
    return (
      <div className="w-full py-20 text-center flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-cyan-200 border-t-cyan-900" role="status">
          <span className="sr-only">Đang tải...</span>
        </div>
        <p className="mt-4 text-slate-500 text-sm">Đang đồng bộ dữ liệu sản phẩm HTO...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 py-6">
      {/* HEADER SECTION */}
      {viewMode === "overview" ? (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-slate-900 m-0">Tổng quan sản phẩm</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                apiMode === "real" 
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                  : "bg-amber-50 text-amber-700 border-amber-200"
              }`}>
                {apiMode === "real" ? "API Live" : "Mock Data Mode"}
              </span>
            </div>
            <p className="text-slate-500 text-sm m-0 mt-1">
              Kho danh mục chương trình và tài liệu tư vấn dành cho cộng tác viên, đại lý và nhân viên tư vấn.
            </p>
          </div>
          {canManageProducts && (
            <button
              className="bg-cyan-900 hover:bg-cyan-950 text-white text-sm font-semibold px-4 py-2 flex items-center gap-2 shadow-sm rounded-xl force-rounded-xl transition-all duration-200"
              onClick={handleOpenNewCategory}
            >
              <i className="fa fa-folder-plus text-base"></i> + Thêm danh mục
            </button>
          )}
        </div>
      ) : (
        <div className="mb-6">
          <button 
            className="border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl force-rounded-xl px-4 py-2 flex items-center gap-2 transition-colors duration-200" 
            onClick={handleGoBack}
          >
            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Quay lại danh sách
          </button>
        </div>
      )}

      {/* 1. THỐNG KÊ (Chỉ hiện ở view tổng quan) */}
      {viewMode === "overview" && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4.5 shadow-sm border border-slate-100 flex items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-900 flex-shrink-0 mr-4">
              <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <div>
              <span className="text-slate-450 text-xs block font-medium">Danh mục lớn</span>
              <span className="font-bold text-slate-800 text-lg md:text-xl leading-none block mt-1">{stats.totalCategories}</span>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4.5 shadow-sm border border-slate-100 flex items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-650 flex-shrink-0 mr-4">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0v6m-7.244-2.244L12 20l7.244-2.244" />
              </svg>
            </div>
            <div>
              <span className="text-slate-455 text-xs block font-medium">Sản phẩm/Chương trình con</span>
              <span className="font-bold text-slate-800 text-lg md:text-xl leading-none block mt-1">{stats.totalPrograms}</span>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4.5 shadow-sm border border-slate-100 flex items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-650 flex-shrink-0 mr-4">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <span className="text-slate-455 text-xs block font-medium">Đang tuyển sinh</span>
              <span className="font-bold text-slate-800 text-lg md:text-xl leading-none block mt-1">{stats.activePrograms}</span>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4.5 shadow-sm border border-slate-100 flex items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-650 flex-shrink-0 mr-4">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <span className="text-slate-455 text-xs block font-medium">Brochures & Tài liệu tư vấn</span>
              <span className="font-bold text-slate-800 text-lg md:text-xl leading-none block mt-1">{stats.totalDocuments}</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. BỘ LỌC TÌM KIẾM (Chỉ hiện ở view tổng quan) */}
      {viewMode === "overview" && (
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-4">
              <label className="block font-semibold text-xs text-slate-500 mb-1.5">Tìm kiếm chương trình</label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-slate-450">
                  <i className="fa fa-search"></i>
                </span>
                <input
                  type="text"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-[13px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all"
                  placeholder="Nhập tên chương trình, quốc gia, tag..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block font-semibold text-xs text-slate-500 mb-1.5">Danh mục lớn</label>
              <select
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[13.5px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all cursor-pointer"
                value={selectedCategoryName}
                onChange={(e) => setSelectedCategoryName(e.target.value)}
              >
                {categoryNames.map((name, i) => (
                  <option key={i} value={name}>{name}</option>
                ))}
              </select>
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block font-semibold text-xs text-slate-500 mb-1.5">Quốc gia</label>
              <select
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[13.5px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all cursor-pointer"
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
              >
                {ALL_COUNTRIES_MOCK.map((country, i) => (
                  <option key={i} value={country}>{country}</option>
                ))}
              </select>
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block font-semibold text-xs text-slate-500 mb-1.5">Trạng thái</label>
              <select
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[13.5px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all cursor-pointer"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="all">Tất cả</option>
                <option value="active">Đang hoạt động</option>
                <option value="coming_soon">Sắp mở</option>
                <option value="expired">Tạm ngưng</option>
              </select>
            </div>

            <div className="col-span-1 md:col-span-2">
              <button
                className="w-full bg-transparent hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-xl py-2 flex items-center justify-center gap-2 font-semibold text-[13.5px] transition-colors"
                onClick={handleResetFilters}
              >
                <i className="fa fa-rotate"></i> Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. GRID DANH MỤC LỚN (View tổng quan) */}
      {viewMode === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
          {filteredCategories.length > 0 ? (
            filteredCategories.map((cat) => {
              const isHidden = cat.status === "hidden";
              const isExpanded = !!openCardPrograms[cat.id];
              const displayPrograms = cat.filteredPrograms || cat.programs || [];

              return (
                <div key={cat.id} className="flex flex-col">
                  <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 transition-all duration-305 hover:-translate-y-1.5 hover:shadow-lg hover:shadow-cyan-900/10 flex flex-col h-full">
                    {/* Header Card với Nền Gradient */}
                    <div
                      className="h-[120px] p-6 text-white relative flex flex-col justify-end"
                      style={{
                        background: cat.imageGradient || "linear-gradient(135deg, #003366 0%, #002244 100%)",
                        opacity: isHidden ? 0.75 : 1
                      }}
                    >
                      {/* Quản lý category buttons (Admin/Quản lý mới thấy) */}
                      {canManageProducts && (
                        <div className="absolute top-4 left-4 flex gap-2 z-10">
                          <button
                            type="button"
                            className="bg-black/40 backdrop-blur-md text-white border border-white/20 w-8 h-8 rounded-full force-rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer hover:bg-white/95 hover:text-cyan-900 hover:scale-110"
                            title="Sửa danh mục"
                            onClick={() => handleEditCategory(cat)}
                          >
                            <svg className="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-2.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            className="bg-black/40 backdrop-blur-md text-white border border-white/20 w-8 h-8 rounded-full force-rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer hover:bg-white/95 hover:text-cyan-900 hover:scale-110"
                            title={isHidden ? "Hiện danh mục" : "Ẩn danh mục"}
                            onClick={() => handleToggleCategoryStatus(cat.id, cat.status)}
                          >
                            {isHidden ? (
                              <svg className="w-3.5 h-3.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                              </svg>
                            ) : (
                              <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            )}
                          </button>
                        </div>
                      )}

                      <span className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold border border-white/15">
                        {displayPrograms.length} Chương trình
                      </span>

                      <div>
                        <h5 className="text-xl font-bold m-0 [text-shadow:0_2px_4px_rgba(0,0,0,0.15)] leading-tight flex items-center flex-wrap gap-2">
                          {cat.name}
                          {isHidden && (
                            <span className="bg-red-650 text-white font-bold px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider">ĐÃ ẨN</span>
                          )}
                        </h5>
                      </div>
                    </div>

                    {/* Body Card */}
                    <div className="p-5 flex-grow flex flex-col">
                      <p className="text-slate-500 text-xs mb-4 line-clamp-2 h-10 overflow-hidden leading-relaxed">
                        {cat.description || "Chưa có mô tả danh mục lớn."}
                      </p>

                      {/* Dropdown toggle programs list */}
                      <div className="border-t border-slate-100 pt-4 mt-4">
                        <button
                          type="button"
                          className="w-full flex justify-between items-center font-semibold text-xs text-cyan-905 hover:text-cyan-955 transition-colors"
                          onClick={() => toggleProgramsAccordion(cat.id)}
                        >
                          <span>Các chương trình cụ thể</span>
                          <i className={`fa ${isExpanded ? "fa-chevron-up" : "fa-chevron-down"} text-[10px]`}></i>
                        </button>

                        {isExpanded && (
                          <div className="mt-4 max-h-[420px] overflow-y-auto pr-1 animate-[fadeIn_0.2s_ease-out]">
                            {displayPrograms.length > 0 ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {displayPrograms.map((prog) => {
                                  const totalDocs = (prog.brochure ? 1 : 0) + (prog.documents?.length || 0);
                                  return (
                                    <div key={prog.id} className="h-full">
                                      <div
                                        className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 transition-all duration-200 hover:bg-cyan-50/50 hover:border-cyan-200 hover:translate-x-0.5 cursor-pointer h-full flex flex-col justify-between"
                                        onClick={() => {
                                          setSelectedProduct(prog);
                                          setViewMode("detail");
                                        }}
                                      >
                                        <div>
                                          <div className="font-semibold text-xs text-slate-800 mb-2 line-clamp-2 leading-snug min-h-[2.8em]" title={prog.name}>
                                            {prog.name}
                                          </div>
                                        </div>

                                        <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-slate-200/40">
                                          <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-lg text-[10px] font-medium flex items-center gap-1">
                                            <i className="fa fa-earth-asia text-cyan-705"></i>
                                            {prog.country}
                                          </span>

                                          <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                                            <i className="fa fa-folder-open text-slate-400"></i>
                                            {totalDocs} Tài liệu
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="text-slate-400 text-xs italic py-4 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                Chưa có chương trình nào hoạt động khớp bộ lọc.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center py-16 bg-white border border-slate-100 rounded-2xl shadow-sm">
              <i className="fa fa-folder-open text-slate-350 text-5xl mb-4 d-block"></i>
              <h5 className="text-slate-500 font-semibold text-sm">Không tìm thấy danh mục sản phẩm nào phù hợp</h5>
              <button className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-4 py-2 rounded-xl mt-3 transition-colors" onClick={handleResetFilters}>
                Xóa bộ lọc để thử lại
              </button>
            </div>
          )}
        </div>
      )}

      {/* 4. MÀN HÌNH CHI TIẾT SẢN PHẨM (Detail View) */}
      {viewMode === "detail" && selectedProduct && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8">
          {/* Header Chi tiết */}
          <div className="border-b border-slate-100 pb-6 mb-6 flex flex-col md:flex-row justify-between items-start gap-4">
            <div className="flex gap-4 items-start">
              <div
                className="w-14 h-14 rounded-2xl text-white flex items-center justify-center text-2xl flex-shrink-0"
                style={{
                  background: "linear-gradient(135deg, #003366 0%, #002244 100%)",
                  boxShadow: "0 4px 10px rgba(0,51,102,0.2)"
                }}
              >
                <i className="fa fa-graduation-cap"></i>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold text-slate-800 m-0 leading-tight">{selectedProduct.name}</h2>
                  <span className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-cyan-50 text-cyan-800 border border-cyan-150">
                    {selectedProduct.categoryName || "Chương trình"}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200">
                    {selectedProduct.region} · {selectedProduct.country}
                  </span>
                </div>
                <p className="text-slate-400 text-xs m-0 mt-1.5 font-medium">
                  Cập nhật lần cuối: {selectedProduct.updatedAt || "2026-06-01"}
                </p>
              </div>
            </div>

            <div className="flex gap-2 w-full md:w-auto flex-wrap">
              {selectedProduct.websiteUrl && (
                <button
                  className="flex-1 md:flex-none bg-transparent hover:bg-slate-50 text-cyan-900 hover:text-cyan-950 font-semibold text-xs border-2 border-cyan-900 rounded-xl force-rounded-xl px-4 py-2 flex items-center justify-center gap-1.5 transition-all duration-200"
                  onClick={() => handleOpenWebsite(selectedProduct.websiteUrl)}
                >
                  <i className="fa fa-globe"></i> Xem trang web sản phẩm
                </button>
              )}
              {canManageProducts && (
                <button
                  className="flex-1 md:flex-none bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold text-xs rounded-xl force-rounded-xl px-4 py-2 flex items-center justify-center gap-1.5 transition-all duration-200 shadow-sm"
                  onClick={() => handleEditProduct(selectedProduct)}
                >
                  <i className="fa fa-pen"></i> Sửa sản phẩm
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cột trái: Thông tin nội dung tư vấn */}
            <div className="lg:col-span-2 space-y-6">
              {/* Mô tả chi tiết */}
              <div>
                <h5 className="font-bold text-cyan-900 text-sm tracking-wide uppercase mb-3 flex items-center gap-2">
                  <i className="fa fa-circle-info text-cyan-800"></i>Tổng quan chương trình
                </h5>
                <p className="text-slate-600 text-[13.5px] leading-relaxed whitespace-pre-line">
                  {selectedProduct.detailDescription || selectedProduct.description || "Đang cập nhật nội dung chi tiết..."}
                </p>
              </div>

              {/* Đối tượng phù hợp */}
              {selectedProduct.targetAudience && (
                <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-105">
                  <h6 className="font-bold text-slate-800 text-xs tracking-wide uppercase mb-2 flex items-center gap-2">
                    <i className="fa fa-users text-cyan-800"></i>Đối tượng tuyển sinh phù hợp
                  </h6>
                  <p className="text-slate-600 text-[13px] leading-relaxed m-0">{selectedProduct.targetAudience}</p>
                </div>
              )}

              {/* Điểm nổi bật (Highlights) */}
              {selectedProduct.highlights && selectedProduct.highlights.length > 0 && (
                <div>
                  <h5 className="font-bold text-cyan-900 text-sm tracking-wide uppercase mb-3 flex items-center gap-2">
                    <i className="fa fa-star text-amber-500"></i>Điểm nổi bật chương trình
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedProduct.highlights.map((hl, i) => (
                      <div key={i} className="bg-emerald-50/40 border border-emerald-100 text-emerald-800 rounded-xl p-3 text-[13px] flex items-start gap-2.5">
                        <i className="fa fa-circle-check text-emerald-650 text-base mt-0.5 flex-shrink-0"></i>
                        <span className="leading-relaxed font-medium">{hl}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quy trình tư vấn & xử lý hồ sơ */}
              {selectedProduct.processSteps && selectedProduct.processSteps.length > 0 && (
                <div>
                  <h5 className="font-bold text-cyan-900 text-sm tracking-wide uppercase mb-3 flex items-center gap-2">
                    <i className="fa fa-list-check text-cyan-800"></i>Quy trình xử lý hồ sơ
                  </h5>
                  <div className="flex flex-col gap-3">
                    {selectedProduct.processSteps.map((step, i) => (
                      <div className="flex items-center gap-4 bg-slate-50/80 p-3.5 border border-slate-100 rounded-2xl" key={i}>
                        <span className="w-6 h-6 bg-cyan-900 text-white font-bold rounded-full flex items-center justify-center text-[11px] flex-shrink-0">{i + 1}</span>
                        <span className="text-slate-700 text-[13px] font-medium leading-normal">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags nhãn dán */}
              {selectedProduct.tags && selectedProduct.tags.length > 0 && (
                <div className="flex items-center flex-wrap gap-2 pt-2">
                  <span className="text-slate-400 text-xs font-semibold">Nhãn nhãn dán:</span>
                  {selectedProduct.tags.map((tag, i) => (
                    <span key={i} className="bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-lg text-[11px] font-medium">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Cột phải: Brochures, Tài liệu tư vấn, Nút quan tâm */}
            <div className="space-y-6">
              <div className="border border-slate-100 rounded-2xl p-5 bg-slate-50/40">
                <h5 className="font-bold text-slate-800 mb-4 text-[14.5px] border-b border-slate-100 pb-3 flex items-center gap-2">
                  <i className="fa fa-folder-open text-cyan-900"></i> Tài liệu &amp; Brochure
                </h5>

                {/* Brochure file */}
                <div className="mb-5">
                  <label className="font-bold text-slate-550 text-xs tracking-wider uppercase d-block mb-2.5">Brochure chính thức:</label>
                  {selectedProduct.brochure ? (
                    <div className="bg-white border border-slate-200/80 rounded-xl p-3 flex justify-between items-center shadow-sm">
                      <div className="text-truncate pr-2 flex items-center" style={{ minWidth: 0 }}>
                        {selectedProduct.brochure.sourceType === "link" ? (
                          <i className="fa fa-link text-cyan-900 mr-2.5 text-lg flex-shrink-0"></i>
                        ) : selectedProduct.brochure.fileType === "IMAGE" ? (
                          selectedProduct.brochure.url ? (
                            <img
                              src={selectedProduct.brochure.url}
                              alt="preview"
                              className="rounded border mr-2.5 w-8 h-8 object-cover flex-shrink-0"
                            />
                          ) : (
                            <i className="fa fa-file-image text-emerald-650 mr-2.5 text-lg flex-shrink-0"></i>
                          )
                        ) : (
                          <i className="fa fa-file-pdf text-red-500 mr-2.5 text-lg flex-shrink-0"></i>
                        )}
                        <div className="text-truncate" style={{ minWidth: 0 }}>
                          <span className="font-semibold text-xs text-slate-800 d-block text-truncate" title={selectedProduct.brochure.name}>{selectedProduct.brochure.name}</span>
                          {selectedProduct.brochure.sourceType === "link" ? (
                            <span className="text-slate-400 d-block text-[10px] mt-0.5">Link đính kèm</span>
                          ) : selectedProduct.brochure.fileType === "IMAGE" ? (
                            <span className="text-slate-400 d-block text-[10px] mt-0.5">Ảnh tải lên ({selectedProduct.brochure.size})</span>
                          ) : (
                            <span className="text-slate-400 d-block text-[10px] mt-0.5">{selectedProduct.brochure.size}</span>
                          )}
                        </div>
                      </div>
                      {selectedProduct.brochure.sourceType === "link" ? (
                        <button className="bg-transparent hover:bg-slate-50 text-cyan-900 border border-slate-200 text-xs font-semibold py-1 px-3 rounded-lg transition-colors flex-shrink-0" onClick={() => handleOpenWebsite(selectedProduct.brochure.url)}>
                          Mở link
                        </button>
                      ) : selectedProduct.brochure.fileType === "IMAGE" && selectedProduct.brochure.url ? (
                        <a
                          href={selectedProduct.brochure.url}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-transparent hover:bg-slate-50 text-cyan-900 border border-slate-200 text-xs font-semibold py-1 px-3 rounded-lg text-decoration-none transition-colors flex-shrink-0 inline-block text-center"
                        >
                          Xem ảnh
                        </a>
                      ) : (
                        <button className="bg-transparent hover:bg-slate-50 text-cyan-900 border border-slate-200 text-xs font-semibold py-1 px-3 rounded-lg transition-colors flex-shrink-0" onClick={() => handleDownloadDoc(selectedProduct.brochure.name)}>
                          Tải về
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="text-slate-400 text-xs italic bg-white border border-dashed border-slate-200 rounded-xl py-3 px-4 text-center">Chưa có brochure riêng cho sản phẩm này.</div>
                  )}
                </div>

                {/* Consulting documents list */}
                <div>
                  <label className="font-bold text-slate-550 text-xs tracking-wider uppercase d-block mb-2.5">Tài liệu hướng dẫn tư vấn:</label>
                  {selectedProduct.documents && selectedProduct.documents.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {selectedProduct.documents.map((doc) => (
                        <div key={doc.id} className="bg-white border border-slate-200/80 rounded-xl p-3 flex justify-between items-center shadow-sm">
                          <div className="text-truncate pr-2 flex-grow" style={{ minWidth: 0 }}>
                            <div className="flex items-center text-truncate">
                              {doc.sourceType === "link" ? (
                                <i className="fa fa-link text-cyan-900 mr-2 flex-shrink-0"></i>
                              ) : (
                                <i className={`fa ${doc.type === "PDF" ? "fa-file-pdf text-red-500" : (doc.type === "XLSX" ? "fa-file-excel text-emerald-650" : "fa-file-lines text-sky-505")} mr-2 flex-shrink-0`}></i>
                              )}
                              <span className="font-semibold text-xs text-slate-800 text-truncate" title={doc.name}>{doc.name}</span>
                            </div>
                            {doc.sourceType === "link" ? (
                              <span className="text-slate-400 d-block text-[10px] mt-1 pl-6">Link đính kèm ({doc.type}) · {doc.updatedAt || "2026-06-01"}</span>
                            ) : (
                              <span className="text-slate-400 d-block text-[10px] mt-1 pl-6">{doc.size} · {doc.updatedAt || "2026-06-01"}</span>
                            )}
                          </div>
                          {doc.sourceType === "link" ? (
                            <button className="bg-transparent hover:bg-slate-50 text-slate-750 border border-slate-200 text-xs font-semibold py-1 px-3 rounded-lg transition-colors flex-shrink-0" onClick={() => handleOpenWebsite(doc.url)}>
                              Mở link
                            </button>
                          ) : (
                            <button className="bg-transparent hover:bg-slate-50 text-slate-750 border border-slate-200 text-xs font-semibold py-1 px-3 rounded-lg transition-colors flex-shrink-0" onClick={() => handleDownloadDoc(doc.name)}>
                              Tải về
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-slate-400 text-xs italic bg-white border border-dashed border-slate-200 rounded-xl py-3 px-4 text-center">Chưa đính kèm tài liệu tư vấn nào khác.</div>
                  )}
                </div>
              </div>

              {/* Gửi yêu cầu tư vấn khách hàng (Nút chính cho CTV) */}
              <button
                className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-xl force-rounded-xl font-bold shadow-md hover:shadow-lg transition-all duration-250 flex items-center justify-center gap-2"
                onClick={handleOpenInterestModal}
                style={{ fontSize: "14.5px" }}
              >
                <i className="fa fa-paper-plane"></i> QUAN TÂM SẢN PHẨM
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: THÊM / SỬA DANH MỤC LỚN
          ========================================== */}
      {editingCategory && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[4px] flex items-center justify-center p-6 z-[1050] animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-[650px] max-h-[90vh] flex flex-col overflow-hidden animate-[slideUp_0.3s_cubic-bezier(0.16,1,0.3,1)]">
            <div className="bg-slate-50 border-b border-slate-100 px-5 py-4 flex justify-between items-center">
              <h5 className="font-bold text-slate-800 text-base m-0">
                {editingCategory === "new" ? "Thêm danh mục lớn mới" : "Sửa danh mục lớn"}
              </h5>
              <button className="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 w-8 h-8 rounded-lg flex items-center justify-center transition-colors" onClick={() => setEditingCategory(null)}>
                <i className="fa fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="flex flex-col flex-grow overflow-hidden">
              {/* Tab Selector Links */}
              <div className="bg-slate-50/50 border-b border-slate-150 px-5 flex gap-4">
                <button
                  type="button"
                  className={`border-b-2 px-1 py-3 text-[13.5px] font-semibold transition-all duration-200 ${
                    activeCategoryTab === "info"
                      ? "text-cyan-900 border-cyan-900"
                      : "text-slate-400 border-transparent hover:text-slate-600"
                  }`}
                  onClick={() => setActiveCategoryTab("info")}
                >
                  <i className="fa fa-info-circle mr-1.5"></i> 1. Thông tin danh mục
                </button>
                <button
                  type="button"
                  className={`border-b-2 px-1 py-3 text-[13.5px] font-semibold transition-all duration-200 ${
                    activeCategoryTab === "programs"
                      ? "text-cyan-900 border-cyan-900"
                      : "text-slate-400 border-transparent hover:text-slate-600 disabled:opacity-40"
                  }`}
                  onClick={() => setActiveCategoryTab("programs")}
                  disabled={editingCategory === "new"}
                >
                  <i className="fa fa-list-check mr-1.5"></i> 2. Sản phẩm con ({formCategory.programs?.length || 0})
                </button>
              </div>

              {/* Tab Contents */}
              <div className="p-6 overflow-y-auto text-[13.5px] flex-grow">
                {activeCategoryTab === "info" ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block font-semibold text-xs text-slate-500 mb-1.5">Tên danh mục lớn <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[13.5px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all"
                        placeholder="Ví dụ: Du học hè, Định cư..."
                        value={formCategory.name}
                        onChange={(e) => setFormCategory({ ...formCategory, name: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-xs text-slate-500 mb-1.5">Trạng thái hoạt động</label>
                      <select
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[13.5px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all cursor-pointer"
                        value={formCategory.status}
                        onChange={(e) => setFormCategory({ ...formCategory, status: e.target.value })}
                      >
                        <option value="active">Đang hoạt động</option>
                        <option value="coming_soon">Sắp mở</option>
                        <option value="hidden">Ẩn tạm thời</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-xs text-slate-500 mb-1.5">Nền Gradient danh mục (Chọn bảng màu hoặc điền mã màu)</label>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {BG_PALETTES.slice(0, 5).map((palette, i) => (
                          <div
                            key={i}
                            className={`w-10 h-10 rounded-lg cursor-pointer border-2 transition-all duration-200 [box-shadow:inset_0_2px_4px_rgba(0,0,0,0.1)] hover:scale-105 ${
                              formCategory.imagePalette === palette.value 
                                ? "border-slate-900 scale-110 shadow-md" 
                                : "border-transparent"
                            }`}
                            style={{ background: palette.value }}
                            title={palette.label}
                            onClick={() => setFormCategory({ ...formCategory, imagePalette: palette.value, customGradient: "" })}
                          />
                        ))}
                        <button
                          type="button"
                          className={`border rounded-xl text-xs px-3.5 py-2 font-semibold transition-all ${
                            formCategory.imagePalette === "custom" 
                              ? "bg-slate-800 text-white border-slate-800" 
                              : "bg-transparent text-slate-650 border-slate-250 hover:bg-slate-50"
                          }`}
                          onClick={() => setFormCategory({ ...formCategory, imagePalette: "custom" })}
                        >
                          Tự điền mã màu
                        </button>
                      </div>

                      {formCategory.imagePalette === "custom" && (
                        <div className="animate-[fadeIn_0.2s_ease-out]">
                          <input
                            type="text"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[13px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all"
                            placeholder="Ví dụ: linear-gradient(135deg, #FF0000 0%, #000000 100%)"
                            value={formCategory.customGradient}
                            onChange={(e) => setFormCategory({ ...formCategory, customGradient: e.target.value })}
                          />
                          <span className="text-slate-400 block mt-1.5 text-[11px]">
                            Điền mã CSS Gradient hợp lệ. Định dạng: linear-gradient(...)
                          </span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block font-semibold text-xs text-slate-500 mb-1.5">Mô tả tóm tắt</label>
                      <textarea
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[13.5px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all"
                        rows="4"
                        placeholder="Mô tả ngắn gọn mục đích và nội dung cốt lõi của danh mục lớn này..."
                        value={formCategory.description}
                        onChange={(e) => setFormCategory({ ...formCategory, description: e.target.value })}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-500 text-xs">Danh sách sản phẩm con thuộc danh mục:</span>
                      <button
                        type="button"
                        className="bg-cyan-900 hover:bg-cyan-950 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                        onClick={() => handleOpenNewProduct(formCategory.id)}
                      >
                        + Thêm sản phẩm con
                      </button>
                    </div>

                    {formCategory.programs && formCategory.programs.length > 0 ? (
                      <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
                        {formCategory.programs.map((prod) => (
                          <div key={prod.id} className="p-3 border border-slate-100 rounded-xl bg-slate-50 flex justify-between items-center">
                            <div className="text-truncate pr-4 flex-grow" style={{ minWidth: 0 }}>
                              <span className="font-bold text-slate-800 text-[13px] block text-truncate" title={prod.name}>
                                {prod.name}
                              </span>
                              <span className="text-slate-450 block text-[11px] mt-0.5">
                                {prod.region} · {prod.country}
                              </span>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                              <button
                                type="button"
                                className="bg-transparent hover:bg-amber-50 text-amber-600 border border-amber-200 text-xs font-semibold py-1 px-3 rounded-lg transition-colors"
                                onClick={() => handleEditProduct(prod)}
                              >
                                Sửa
                              </button>
                              <button
                                type="button"
                                className="bg-transparent hover:bg-red-50 text-red-600 border border-red-200 text-xs font-semibold py-1 px-3 rounded-lg transition-colors"
                                onClick={() => handleDeleteProduct(prod.id)}
                              >
                                Xóa
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 border-2 border-dashed border-slate-200 bg-slate-50 text-slate-400 text-xs rounded-xl">
                        Chưa có sản phẩm con nào trong danh mục này. Bấm nút phía trên để tạo mới.
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-slate-50 p-4 border-t border-slate-100 flex gap-3 justify-end">
                <button type="button" className="bg-transparent hover:bg-slate-150 text-slate-650 border border-slate-250 text-xs font-semibold py-2 px-4 rounded-xl transition-colors" onClick={() => setEditingCategory(null)}>
                  Hủy bỏ
                </button>
                <button type="submit" className="bg-cyan-900 hover:bg-cyan-950 text-white text-xs font-semibold py-2 px-5 rounded-xl transition-colors">
                  {editingCategory === "new" ? "Lưu danh mục" : "Cập nhật danh mục"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: THÊM / SỬA SẢN PHẨM CON
          ========================================== */}
      {editingProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[4px] flex items-center justify-center p-6 z-[1060] animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-[1000px] max-h-[90vh] flex flex-col overflow-hidden animate-[slideUp_0.3s_cubic-bezier(0.16,1,0.3,1)]">
            <div className="bg-slate-50 border-b border-slate-100 px-5 py-4 flex justify-between items-center">
              <h5 className="font-bold text-slate-800 text-base m-0">
                {editingProduct === "new" ? "Thêm sản phẩm con mới" : "Sửa thông tin sản phẩm con"}
              </h5>
              <button className="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 w-8 h-8 rounded-lg flex items-center justify-center transition-colors" onClick={() => setEditingProduct(null)}>
                <i className="fa fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="flex flex-col flex-grow overflow-hidden">
              {/* Tab Selector Links */}
              <div className="bg-slate-50/50 border-b border-slate-150 px-5 flex gap-4">
                <button
                  type="button"
                  className={`border-b-2 px-1 py-3 text-[13.5px] font-semibold transition-all duration-200 ${
                    activeProductTab === "basic"
                      ? "text-cyan-900 border-cyan-900"
                      : "text-slate-400 border-transparent hover:text-slate-600"
                  }`}
                  onClick={() => setActiveProductTab("basic")}
                >
                  <i className="fa fa-info-circle mr-1.5"></i> 1. Thông tin cơ bản
                </button>
                <button
                  type="button"
                  className={`border-b-2 px-1 py-3 text-[13.5px] font-semibold transition-all duration-200 ${
                    activeProductTab === "content"
                      ? "text-cyan-900 border-cyan-900"
                      : "text-slate-400 border-transparent hover:text-slate-600"
                  }`}
                  onClick={() => setActiveProductTab("content")}
                >
                  <i className="fa fa-file-invoice mr-1.5"></i> 2. Nội dung tư vấn
                </button>
                <button
                  type="button"
                  className={`border-b-2 px-1 py-3 text-[13.5px] font-semibold transition-all duration-200 ${
                    activeProductTab === "docs"
                      ? "text-cyan-900 border-cyan-900"
                      : "text-slate-400 border-transparent hover:text-slate-600"
                  }`}
                  onClick={() => setActiveProductTab("docs")}
                >
                  <i className="fa fa-file-pdf mr-1.5"></i> 3. Tài liệu ({formProduct.brochure ? 1 : 0} Brochure / {formProduct.documents?.length || 0} Tư vấn)
                </button>
              </div>

              {/* Tab Contents */}
              <div className="p-6 overflow-y-auto text-[13.5px] flex-grow">
                {/* TAB 1: BASIC INFORMATION */}
                {activeProductTab === "basic" && (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-6">
                      <label className="block font-semibold text-xs text-slate-500 mb-1.5">Tên sản phẩm <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[13.5px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all"
                        value={formProduct.name}
                        onChange={(e) => setFormProduct({ ...formProduct, name: e.target.value })}
                        placeholder="Ví dụ: Du học hè tiếng Anh Philippines"
                        required
                      />
                    </div>
                    <div className="md:col-span-6">
                      <label className="block font-semibold text-xs text-slate-500 mb-1.5">Thuộc danh mục lớn <span className="text-red-500">*</span></label>
                      <select
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[13.5px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all cursor-pointer"
                        value={formProduct.categoryId}
                        onChange={(e) => setFormProduct({ ...formProduct, categoryId: e.target.value, categoryName: categories.find(c => c.id === e.target.value)?.name || "" })}
                        required
                      >
                        <option value="">-- Chọn danh mục lớn --</option>
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-1 md:col-span-4">
                      <label className="block font-semibold text-xs text-slate-500 mb-1.5">Quốc gia <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[13.5px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all"
                        value={formProduct.country}
                        onChange={(e) => setFormProduct({ ...formProduct, country: e.target.value })}
                        placeholder="Ví dụ: Đức, Hàn Quốc"
                        required
                      />
                    </div>
                    <div className="col-span-1 md:col-span-4">
                      <label className="block font-semibold text-xs text-slate-500 mb-1.5">Khu vực địa lý</label>
                      <select
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[13.5px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all cursor-pointer"
                        value={formProduct.region}
                        onChange={(e) => setFormProduct({ ...formProduct, region: e.target.value })}
                      >
                        <option value="Châu Á">Châu Á</option>
                        <option value="Châu Âu">Châu Âu</option>
                        <option value="Châu Mỹ">Châu Mỹ</option>
                        <option value="Châu Đại Dương">Châu Đại Dương</option>
                      </select>
                    </div>
                    <div className="col-span-1 md:col-span-4">
                      <label className="block font-semibold text-xs text-slate-500 mb-1.5">Trạng thái sản phẩm</label>
                      <select
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[13.5px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all cursor-pointer"
                        value={formProduct.status}
                        onChange={(e) => setFormProduct({ ...formProduct, status: e.target.value })}
                      >
                        <option value="active">Đang hoạt động</option>
                        <option value="coming_soon">Sắp mở đăng ký</option>
                        <option value="expired">Hết hạn tuyển sinh</option>
                      </select>
                    </div>

                    <div className="md:col-span-12">
                      <label className="block font-semibold text-xs text-slate-500 mb-1.5">Link trang web sản phẩm</label>
                      <input
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[13.5px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all"
                        value={formProduct.websiteUrl}
                        onChange={(e) => setFormProduct({ ...formProduct, websiteUrl: e.target.value })}
                        placeholder="Ví dụ: https://htocean.edu.vn/du-hoc-he-singapore"
                      />
                      <span className="text-slate-450 block mt-1.5 text-[11px]">
                        Dán link trang WordPress/public landing page của sản phẩm để CTV mở xem khi cần.
                      </span>
                    </div>

                    <div className="md:col-span-12">
                      <label className="block font-semibold text-xs text-slate-500 mb-1.5">Mô tả tóm tắt chương trình</label>
                      <textarea
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[13.5px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all"
                        rows="3"
                        value={formProduct.description}
                        onChange={(e) => setFormProduct({ ...formProduct, description: e.target.value })}
                        placeholder="Nhập mô tả ngắn gọn giới thiệu chung về chương trình..."
                      />
                    </div>
                  </div>
                )}

                {/* TAB 2: CONSULTING CONTENT */}
                {activeProductTab === "content" && (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-12">
                      <label className="block font-semibold text-xs text-slate-500 mb-1.5">Mô tả chi tiết chương trình</label>
                      <textarea
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[13.5px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all"
                        rows="4"
                        value={formProduct.detailDescription}
                        onChange={(e) => setFormProduct({ ...formProduct, detailDescription: e.target.value })}
                        placeholder="Nhập nội dung chi tiết lộ trình học tập, chỗ ở, thời gian biểu..."
                      />
                    </div>

                    <div className="md:col-span-12">
                      <label className="block font-semibold text-xs text-slate-500 mb-1.5">Đối tượng phù hợp tuyển sinh</label>
                      <input
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[13.5px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all"
                        value={formProduct.targetAudience}
                        onChange={(e) => setFormProduct({ ...formProduct, targetAudience: e.target.value })}
                        placeholder="Ví dụ: Học sinh từ 7 đến 17 tuổi..."
                      />
                    </div>

                    <div className="md:col-span-6">
                      <label className="block font-semibold text-xs text-slate-500 mb-1.5">Điểm nổi bật (Mỗi dòng một điểm nổi bật)</label>
                      <textarea
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[13.5px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all"
                        rows="4"
                        value={formProduct.highlightsText}
                        onChange={(e) => setFormProduct({ ...formProduct, highlightsText: e.target.value })}
                        placeholder="Ví dụ:&#10;Học 1 kèm 1 với giáo viên bản ngữ&#10;Hỗ trợ 24/7..."
                      />
                    </div>

                    <div className="md:col-span-6">
                      <label className="block font-semibold text-xs text-slate-500 mb-1.5">Các bước quy trình (Mỗi dòng một bước)</label>
                      <textarea
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[13.5px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all"
                        rows="4"
                        value={formProduct.processStepsText}
                        onChange={(e) => setFormProduct({ ...formProduct, processStepsText: e.target.value })}
                        placeholder="Ví dụ:&#10;Tư vấn chọn lịch trình&#10;Nộp phí ghi danh&#10;Phỏng vấn chọn trường..."
                      />
                    </div>

                    <div className="md:col-span-12">
                      <label className="block font-semibold text-xs text-slate-500 mb-1.5">Tags nhãn dán (Ngăn cách bởi dấu phẩy)</label>
                      <input
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[13.5px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all"
                        value={formProduct.tagsText}
                        onChange={(e) => setFormProduct({ ...formProduct, tagsText: e.target.value })}
                        placeholder="Chất lượng cao, Miễn học phí, Cơ hội PR"
                      />
                    </div>
                  </div>
                )}

                {/* TAB 3: DOCUMENTS */}
                {activeProductTab === "docs" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Brochure Column */}
                    <div>
                      <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 h-full flex flex-col justify-start gap-4">
                        <div>
                          <label className="block font-bold text-cyan-900 text-[14px] mb-2">
                            <i className="fa fa-file-invoice text-cyan-900 mr-2"></i>Tài liệu chính (Brochure)
                          </label>
                          <p className="text-slate-400 text-xs mb-3">Hỗ trợ PDF, hình ảnh hoặc link tài liệu</p>

                          {/* Drag and Drop Zone */}
                          <div
                            className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all duration-200 cursor-pointer ${
                              isBrochureDragging 
                                ? "border-cyan-600 bg-cyan-50/50" 
                                : "border-slate-300 bg-white hover:bg-slate-55"
                            }`}
                            onDragOver={handleBrochureDragOver}
                            onDragLeave={handleBrochureDragLeave}
                            onDrop={handleBrochureDrop}
                          >
                            <input
                              type="file"
                              className="hidden"
                              id="prod-brochure-file"
                              accept="application/pdf,image/*"
                              onChange={handleProductBrochureUpload}
                            />
                            <label htmlFor="prod-brochure-file" style={{ cursor: "pointer" }} className="w-full m-0 block">
                              <i className="fa fa-cloud-arrow-up text-cyan-900 text-2xl mb-2 block"></i>
                              <span className="text-xs font-semibold text-cyan-900 block">
                                {isBrochureDragging ? "Thả file để tải lên" : "Kéo thả Brochure hoặc bấm để chọn file"}
                              </span>
                              <span className="text-slate-400 block mt-1 text-[10px]">Hỗ trợ PDF, hình ảnh hoặc link tài liệu</span>
                            </label>
                          </div>

                          {/* Divider */}
                          <div className="flex items-center my-4">
                            <hr className="flex-grow border-slate-200 my-0" />
                            <span className="mx-3 text-slate-400 text-xs font-semibold uppercase tracking-wider">hoặc</span>
                            <hr className="flex-grow border-slate-200 my-0" />
                          </div>

                          {/* Link Input */}
                          <div>
                            <label className="block font-semibold text-xs text-slate-500 mb-1.5">Link Brochure</label>
                            <div className="flex rounded-xl overflow-hidden border border-slate-200 bg-white">
                              <input
                                type="text"
                                className="w-full px-3 py-1.5 text-xs text-slate-705 placeholder-slate-400 focus:outline-none"
                                placeholder="Ví dụ: https://drive.google.com/..."
                                value={brochureLinkInput}
                                onChange={(e) => setBrochureLinkInput(e.target.value)}
                              />
                              <button
                                type="button"
                                className="bg-cyan-900 hover:bg-cyan-950 text-white text-xs font-semibold px-4 transition-colors"
                                onClick={handleAddBrochureLink}
                              >
                                Gắn link
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="mt-auto pt-3 border-t border-slate-100">
                          <label className="font-semibold text-slate-500 text-xs mb-2 block">Brochure hiện tại:</label>
                          {formProduct.brochure ? (
                            <div className="flex items-center justify-between p-2.5 border border-slate-100 rounded-xl bg-white shadow-sm">
                              <div className="text-truncate pr-3 flex items-center" style={{ minWidth: 0 }}>
                                {formProduct.brochure.sourceType === "link" ? (
                                  <i className="fa fa-link text-cyan-900 mr-2 text-base flex-shrink-0"></i>
                                ) : formProduct.brochure.fileType === "IMAGE" ? (
                                  formProduct.brochure.url ? (
                                    <img
                                      src={formProduct.brochure.url}
                                      alt="preview"
                                      className="rounded border mr-2 w-8 h-8 object-cover flex-shrink-0"
                                    />
                                  ) : (
                                    <i className="fa fa-file-image text-emerald-600 mr-2 text-base flex-shrink-0"></i>
                                  )
                                ) : (
                                  <i className="fa fa-file-pdf text-red-500 mr-2 text-base flex-shrink-0"></i>
                                )}
                                <div className="text-truncate" style={{ minWidth: 0 }}>
                                  <span
                                    className="font-bold text-slate-800 text-xs block text-truncate"
                                    title={formProduct.brochure.name}
                                    style={{ maxWidth: "160px" }}
                                  >
                                    {formProduct.brochure.name}
                                  </span>
                                  <span className="text-slate-405 block text-[10px] text-truncate mt-0.5">
                                    {formProduct.brochure.sourceType === "link" ? (
                                      <span className="text-cyan-700 font-medium">Link đính kèm</span>
                                    ) : formProduct.brochure.fileType === "IMAGE" ? (
                                      <span>Ảnh tải lên ({formProduct.brochure.size})</span>
                                    ) : (
                                      <span>File tải lên ({formProduct.brochure.size})</span>
                                    )}
                                  </span>
                                </div>
                              </div>
                              <div className="flex gap-1.5 items-center flex-shrink-0">
                                {formProduct.brochure.sourceType === "link" && (
                                  <button
                                    type="button"
                                    className="bg-transparent hover:bg-slate-50 text-cyan-900 border border-slate-200 text-[11px] font-semibold px-2 py-1 rounded"
                                    onClick={() => handleOpenWebsite(formProduct.brochure.url)}
                                  >
                                    Mở link
                                  </button>
                                )}
                                {formProduct.brochure.fileType === "IMAGE" && formProduct.brochure.url && (
                                  <a
                                    href={formProduct.brochure.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="bg-transparent hover:bg-slate-50 text-cyan-900 border border-slate-200 text-[11px] font-semibold px-2 py-1 rounded text-decoration-none inline-block text-center leading-normal"
                                  >
                                    Xem ảnh
                                  </a>
                                )}
                                <button
                                  type="button"
                                  className="bg-transparent hover:bg-red-550 hover:text-white text-red-650 border border-red-200 text-[11px] font-semibold px-2 py-1 rounded"
                                  onClick={removeProductBrochure}
                                >
                                  <i className="fa fa-trash-can"></i> Gỡ
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="text-slate-400 text-xs italic text-center py-3 border border-dashed border-slate-200 bg-white/50 rounded-xl">Chưa có Brochure</div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Consulting Documents Column */}
                    <div>
                      <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 h-full flex flex-col justify-between">
                        <div>
                          <label className="block font-bold text-sky-900 text-[14px] mb-2">
                            <i className="fa fa-folder-open text-sky-800 mr-2"></i>Tài liệu hướng dẫn tư vấn kèm theo
                          </label>
                          <p className="text-slate-400 text-xs mb-3">Tải lên file hoặc gắn link tài liệu tư vấn nội bộ.</p>

                          {/* Drag and Drop Zone */}
                          <div
                            className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all duration-200 cursor-pointer ${
                              isDocsDragging 
                                ? "border-sky-500 bg-sky-50/50" 
                                : "border-slate-300 bg-white hover:bg-slate-50"
                            }`}
                            onDragOver={handleDocsDragOver}
                            onDragLeave={handleDocsDragLeave}
                            onDrop={handleDocsDrop}
                          >
                            <input
                              type="file"
                              multiple
                              className="hidden"
                              id="prod-docs-file"
                              onChange={handleProductDocsUpload}
                            />
                            <label htmlFor="prod-docs-file" style={{ cursor: "pointer" }} className="w-full m-0 block">
                              <i className="fa fa-cloud-arrow-up text-sky-800 text-2xl mb-2 block"></i>
                              <span className="text-xs font-semibold text-sky-800 block">
                                {isDocsDragging ? "Thả file để tải lên" : "Kéo thả tài liệu hoặc bấm để chọn file"}
                              </span>
                              <span className="text-slate-400 block mt-1 text-[10px]">Hỗ trợ PDF, DOCX, XLSX hoặc link tài liệu</span>
                            </label>
                          </div>

                          {/* Divider */}
                          <div className="flex items-center my-4">
                            <hr className="flex-grow border-slate-200 my-0" />
                            <span className="mx-3 text-slate-400 text-xs font-semibold uppercase tracking-wider">hoặc</span>
                            <hr className="flex-grow border-slate-200 my-0" />
                          </div>

                          {/* Link Input Section */}
                          <div className="p-3 border border-slate-150 rounded-xl bg-white shadow-sm mb-3 space-y-2">
                            <span className="font-semibold text-slate-500 text-xs block mb-1">Gắn link tài liệu mới</span>
                            <div className="space-y-2">
                              <input
                                type="text"
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none"
                                placeholder="Tên tài liệu..."
                                value={docLinkNameInput}
                                onChange={(e) => setDocLinkNameInput(e.target.value)}
                              />
                              <input
                                type="text"
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none"
                                placeholder="Link tài liệu (ví dụ: drive.google.com/...)"
                                value={docLinkUrlInput}
                                onChange={(e) => setDocLinkUrlInput(e.target.value)}
                              />
                              <div className="flex gap-2">
                                <select
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none cursor-pointer"
                                  value={docLinkTypeInput}
                                  onChange={(e) => setDocLinkTypeInput(e.target.value)}
                                >
                                  <option value="Checklist">Checklist</option>
                                  <option value="Bảng phí">Bảng phí</option>
                                  <option value="Quy trình tư vấn">Quy trình tư vấn</option>
                                  <option value="FAQ">FAQ</option>
                                  <option value="Mẫu form khách hàng">Mẫu form khách hàng</option>
                                  <option value="Khác">Khác</option>
                                </select>
                                <button
                                  type="button"
                                  className="bg-sky-800 hover:bg-sky-900 text-white text-xs font-semibold px-4 rounded-lg transition-colors flex-shrink-0"
                                  onClick={handleAddDocLink}
                                >
                                  Thêm link
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Documents List */}
                        <div className="mt-3">
                          <span className="fw-semibold text-slate-500 text-xs block mb-2">Các tài liệu tư vấn đính kèm:</span>
                          {formProduct.documents && formProduct.documents.length > 0 ? (
                            <div className="flex flex-col gap-2 max-h-[150px] overflow-y-auto pr-1">
                              {formProduct.documents.map((doc) => (
                                <div key={doc.id} className="flex items-center justify-between p-2.5 border border-slate-100 rounded-xl bg-white shadow-sm">
                                  <div className="text-truncate pr-3 flex items-center" style={{ minWidth: 0 }}>
                                    {doc.sourceType === "link" ? (
                                      <i className="fa fa-link text-sky-850 mr-2 text-base flex-shrink-0"></i>
                                    ) : (
                                      <i className={`fa ${doc.type === "PDF" ? "fa-file-pdf text-red-500" : (doc.type === "XLSX" ? "fa-file-excel text-emerald-650" : "fa-file-word text-primary")} mr-2 text-base flex-shrink-0`}></i>
                                    )}
                                    <div className="text-truncate" style={{ minWidth: 0 }}>
                                      <span className="font-bold text-slate-800 text-xs block text-truncate" title={doc.name}>
                                        {doc.name}
                                      </span>
                                      <span className="text-slate-400 block text-[10px] mt-0.5">
                                        {doc.sourceType === "link" ? (
                                          <span className="text-sky-700 font-semibold">{doc.type} (Link)</span>
                                        ) : (
                                          <span>File ({doc.size})</span>
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    className="bg-transparent hover:bg-red-50 text-red-600 border border-red-200 text-xs font-semibold py-1 px-3 rounded-lg transition-colors flex-shrink-0"
                                    onClick={() => deleteProductDoc(doc.id)}
                                  >
                                    Xóa
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-slate-400 text-xs italic text-center py-3 border border-dashed border-slate-200 bg-white/50 rounded-xl">Chưa có tài liệu đính kèm</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-slate-50 p-4 border-t border-slate-100 flex gap-3 justify-end">
                <button type="button" className="bg-transparent hover:bg-slate-150 text-slate-650 border border-slate-250 text-xs font-semibold py-2 px-4 rounded-xl transition-colors" onClick={() => setEditingProduct(null)}>
                  Hủy bỏ
                </button>
                <button type="submit" className="bg-cyan-900 hover:bg-cyan-950 text-white text-xs font-semibold py-2 px-5 rounded-xl transition-colors">
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: FORM QUAN TÂM SẢN PHẨM (CRM CRM)
          ========================================== */}
      {showInterestModal && selectedProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[4px] flex items-center justify-center p-6 z-[1050] animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-[550px] max-h-[90vh] flex flex-col overflow-hidden animate-[slideUp_0.3s_cubic-bezier(0.16,1,0.3,1)]">
            <div className="bg-slate-50 border-b border-slate-100 px-5 py-4 flex justify-between items-center">
              <h5 className="font-bold text-slate-800 text-base m-0 flex items-center gap-2">
                <i className="fa fa-envelope-open-text text-red-500"></i> Đăng ký khách hàng quan tâm
              </h5>
              <button className="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 w-8 h-8 rounded-lg flex items-center justify-center transition-colors" onClick={() => setShowInterestModal(false)}>
                <i className="fa fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleSubmitInterest}>
              <div className="p-6 overflow-y-auto text-[13.5px]">
                <div className="mb-4">
                  <label className="block font-semibold text-xs text-slate-500 mb-1.5">Sản phẩm quan tâm</label>
                  <input
                    type="text"
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2 text-[13.5px] text-slate-600 focus:outline-none"
                    value={selectedProduct.name}
                    readOnly
                  />
                </div>

                <div className="mb-4">
                  <label className="block font-semibold text-xs text-slate-500 mb-1.5">Họ tên khách hàng <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[13.5px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all"
                    placeholder="Ví dụ: Nguyễn Văn A"
                    value={interestForm.customerName}
                    onChange={(e) => setInterestForm({ ...interestForm, customerName: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block font-semibold text-xs text-slate-500 mb-1.5">Số điện thoại <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[13.5px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all"
                      placeholder="Ví dụ: 0987654321"
                      value={interestForm.phone}
                      onChange={(e) => setInterestForm({ ...interestForm, phone: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-xs text-slate-500 mb-1.5">Email (nếu có)</label>
                    <input
                      type="email"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[13.5px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all"
                      placeholder="customer@email.com"
                      value={interestForm.email}
                      onChange={(e) => setInterestForm({ ...interestForm, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block font-semibold text-xs text-slate-500 mb-1.5">Người phụ trách / CTV giới thiệu</label>
                    <input
                      type="text"
                      className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2 text-[13.5px] text-slate-600 focus:outline-none"
                      value={currentUserName}
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-xs text-slate-500 mb-1.5">Kênh nguồn tuyển sinh</label>
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[13.5px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all cursor-pointer"
                      value={interestForm.sourceChannel}
                      onChange={(e) => setInterestForm({ ...interestForm, sourceChannel: e.target.value })}
                    >
                      <option value="CTV/Đại lý">CTV / Đại lý</option>
                      <option value="Nhân viên tư vấn">Nhân viên tư vấn</option>
                      <option value="Website">Website</option>
                      <option value="Facebook">Facebook</option>
                      <option value="Zalo">Zalo</option>
                      <option value="Sự kiện">Sự kiện hội thảo</option>
                      <option value="Khác">Khác</option>
                    </select>
                  </div>
                </div>

                <div className="mb-2">
                  <label className="block font-semibold text-xs text-slate-500 mb-1.5">Nhu cầu cụ thể / Ghi chú</label>
                  <textarea
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[13.5px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all"
                    rows="3"
                    placeholder="Nhập yêu cầu đặc biệt của khách hàng hoặc khu giờ liên hệ phù hợp..."
                    value={interestForm.note}
                    onChange={(e) => setInterestForm({ ...interestForm, note: e.target.value })}
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-4 border-t border-slate-100 flex gap-3 justify-end">
                <button type="button" className="bg-transparent hover:bg-slate-150 text-slate-650 border border-slate-250 text-xs font-semibold py-2 px-4 rounded-xl transition-colors" onClick={() => setShowInterestModal(false)}>
                  Hủy bỏ
                </button>
                <button type="submit" className="bg-cyan-900 hover:bg-cyan-950 text-white text-xs font-semibold py-2 px-5 rounded-xl transition-colors">
                  Gửi liên hệ tư vấn
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
