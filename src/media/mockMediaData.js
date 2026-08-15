export const MEDIA_CATEGORIES = {
  VISA_PROOF: 'visa_proof',
  VIDEO: 'video',
  DOCUMENT: 'document',
};

export const MOCK_MEDIA_DATA = [
  // Visa Proofs
  {
    id: "m-1",
    title: "Visa Du học Canada",
    category_type: MEDIA_CATEGORIES.VISA_PROOF,
    country_code: "CA",
    media_url: "https://images.unsplash.com/photo-1576089172869-4f5f6f315620?q=80&w=2000&auto=format&fit=crop", // placeholder cho visa image
    thumbnail_url: "https://images.unsplash.com/photo-1576089172869-4f5f6f315620?q=80&w=600&auto=format&fit=crop",
    customer_name_masked: "Nguyễn V*** A",
    issued_date: "2026-07-15T00:00:00Z",
    status: "active"
  },
  {
    id: "m-2",
    title: "Visa Định cư Úc",
    category_type: MEDIA_CATEGORIES.VISA_PROOF,
    country_code: "AU",
    media_url: "https://images.unsplash.com/photo-1622322302324-4f81156550bf?q=80&w=2000&auto=format&fit=crop",
    thumbnail_url: "https://images.unsplash.com/photo-1622322302324-4f81156550bf?q=80&w=600&auto=format&fit=crop",
    customer_name_masked: "Trần T*** B",
    issued_date: "2026-07-10T00:00:00Z",
    status: "active"
  },
  {
    id: "m-3",
    title: "Visa Du lịch Mỹ",
    category_type: MEDIA_CATEGORIES.VISA_PROOF,
    country_code: "US",
    media_url: "https://images.unsplash.com/photo-1569949381669-ecf31ae8e613?q=80&w=2000&auto=format&fit=crop",
    thumbnail_url: "https://images.unsplash.com/photo-1569949381669-ecf31ae8e613?q=80&w=600&auto=format&fit=crop",
    customer_name_masked: "Lê V*** C",
    issued_date: "2026-06-25T00:00:00Z",
    status: "active"
  },
  {
    id: "m-4",
    title: "Visa Du học Nhật Bản",
    category_type: MEDIA_CATEGORIES.VISA_PROOF,
    country_code: "JP",
    media_url: "https://images.unsplash.com/photo-1542259009477-d625272157b7?q=80&w=2000&auto=format&fit=crop",
    thumbnail_url: "https://images.unsplash.com/photo-1542259009477-d625272157b7?q=80&w=600&auto=format&fit=crop",
    customer_name_masked: "Phạm T*** D",
    issued_date: "2026-07-28T00:00:00Z",
    status: "active"
  },
  {
    id: "m-5",
    title: "Visa Tham thân Schengen",
    category_type: MEDIA_CATEGORIES.VISA_PROOF,
    country_code: "FR", // France - Schengen
    media_url: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?q=80&w=2000&auto=format&fit=crop",
    thumbnail_url: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?q=80&w=600&auto=format&fit=crop",
    customer_name_masked: "Hoàng M*** E",
    issued_date: "2026-05-15T00:00:00Z",
    status: "active"
  },
  
  // Videos
  {
    id: "m-6",
    title: "Giới thiệu HTO Education",
    category_type: MEDIA_CATEGORIES.VIDEO,
    country_code: "ALL",
    media_url: "https://www.youtube.com/embed/dQw4w9WgXcQ", // Youtube embed link example
    thumbnail_url: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    customer_name_masked: "",
    issued_date: "2026-01-10T00:00:00Z",
    status: "active"
  },
  {
    id: "m-7",
    title: "Chia sẻ lộ trình du học Úc 2026",
    category_type: MEDIA_CATEGORIES.VIDEO,
    country_code: "AU",
    media_url: "https://www.youtube.com/embed/tgbNymZ7vqY",
    thumbnail_url: "https://img.youtube.com/vi/tgbNymZ7vqY/maxresdefault.jpg",
    customer_name_masked: "",
    issued_date: "2026-06-12T00:00:00Z",
    status: "active"
  },

  // Documents / PR Content
  {
    id: "m-8",
    title: "Brochure HTO 2026 (PDF)",
    category_type: MEDIA_CATEGORIES.DOCUMENT,
    country_code: "ALL",
    media_url: "#",
    thumbnail_url: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?q=80&w=600&auto=format&fit=crop", // placeholder document thumb
    customer_name_masked: "",
    issued_date: "2026-02-20T00:00:00Z",
    status: "active"
  },
  {
    id: "m-9",
    title: "Cẩm nang định cư Canada",
    category_type: MEDIA_CATEGORIES.DOCUMENT,
    country_code: "CA",
    media_url: "#",
    thumbnail_url: "https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?q=80&w=600&auto=format&fit=crop",
    customer_name_masked: "",
    issued_date: "2026-07-01T00:00:00Z",
    status: "active"
  }
];

export const MEDIA_COUNTRY_MAP = {
  ALL: "Tất cả / Không xác định",
  VN: "Việt Nam",
  JP: "Nhật Bản",
  KR: "Hàn Quốc",
  CN: "Trung Quốc",
  TW: "Đài Loan",
  HK: "Hồng Kông",
  MO: "Ma Cao",
  SG: "Singapore",
  MY: "Malaysia",
  TH: "Thái Lan",
  ID: "Indonesia",
  PH: "Philippines",
  IN: "Ấn Độ",
  AE: "UAE",
  CA: "Canada",
  US: "Mỹ",
  AU: "Úc",
  GB: "Anh Quốc",
  FR: "Pháp (Schengen)",
  DE: "Đức"
};
