const API_BASE_URL = "http://localhost:3000/api/v1";
const USE_MOCK_WHEN_API_FAIL = true;
const PRODUCT_STORAGE_KEY = "hto_products_categories_data";

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

// Initial mock data if localStorage is empty
const INITIAL_CATEGORIES = [
  {
    id: "cat-1",
    name: "Du học hè",
    description: "Các chương trình du học hè ngắn hạn kết hợp học tập, rèn luyện kỹ năng và giao lưu văn hóa tại nhiều quốc gia phát triển.",
    status: "active",
    imageGradient: "linear-gradient(135deg, #FF9900 0%, #FF5E36 100%)",
    programs: [
      {
        id: "prod-1-1",
        name: "Du học hè Philippines (Mô hình Sparta)",
        categoryId: "cat-1",
        categoryName: "Du học hè",
        country: "Philippines",
        region: "Châu Á",
        status: "active",
        description: "Trại hè tiếng Anh cường độ cao tại Philippines giúp học viên nâng cao kỹ năng nhanh chóng.",
        detailDescription: "Chương trình trại hè Anh ngữ tại các thành phố học thuật lớn của Philippines như Cebu, Baguio. Áp dụng mô hình Sparta học tập 10-12 tiếng mỗi ngày, kết hợp hoạt động dã ngoại cuối tuần bổ ích.",
        targetAudience: "Học sinh từ 7 đến 17 tuổi muốn cải thiện tiếng Anh cấp tốc trong kỳ nghỉ hè.",
        highlights: [
          "Học tập mô hình 1 kèm 1 và 1 kèm 4 với giáo viên bản xứ",
          "Môi trường bắt buộc sử dụng 100% tiếng Anh (EOP)",
          "Hệ thống quản lý và chăm sóc học viên 24/7 từ quản lý người Việt",
          "Hoạt động dã ngoại cuối tuần tại bãi biển, resort cao cấp"
        ],
        processSteps: [
          "Đăng ký tư vấn và kiểm tra trình độ đầu vào",
          "Chọn trường, khóa học và thời gian học tập",
          "Đóng phí ghi danh và nhận thư mời nhập học (LOA)",
          "Chuẩn bị hồ sơ du học, mua vé máy bay và ủy quyền giám hộ",
          "Xuất cảnh và bắt đầu chương trình học tập tại Philippines"
        ],
        tags: ["Tiếng Anh cấp tốc", "Mô hình Sparta", "Học 1-kèm-1", "Phù hợp mọi trình độ"],
        websiteUrl: "https://htocean.edu.vn/du-hoc-he-philippines",
        brochure: { name: "Brochure_SummerCamp_Philippines_2026.pdf", size: "3.2 MB", type: "PDF", sourceType: "file", fileType: "PDF", url: "" },
        documents: [
          { id: "doc-1-1-1", name: "Checklist hồ sơ ủy quyền giám hộ WEG.docx", type: "DOCX", sourceType: "file", fileType: "DOCX", size: "120 KB", updatedAt: "2026-05-15" },
          { id: "doc-1-1-2", name: "Bảng chi phí chi tiết trại hè Philippines 4 tuần.pdf", type: "PDF", sourceType: "file", fileType: "PDF", size: "850 KB", updatedAt: "2026-05-15" },
          { id: "doc-1-1-3", name: "Nội quy và cẩm nang chuẩn bị hành lý.pdf", type: "PDF", sourceType: "file", fileType: "PDF", size: "1.4 MB", updatedAt: "2026-05-15" }
        ],
        updatedAt: "2026-05-15"
      },
      {
        id: "prod-1-2",
        name: "Trại hè Tiếng Anh Singapore (2 tuần)",
        categoryId: "cat-1",
        categoryName: "Du học hè",
        country: "Singapore",
        region: "Châu Á",
        status: "active",
        description: "Trải nghiệm môi trường sống văn minh an toàn bậc nhất kết hợp học tiếng Anh và kỹ năng lãnh đạo.",
        detailDescription: "Khóa học ngắn hạn 2 tuần kết hợp giảng dạy tiếng Anh chuẩn quốc tế và các hoạt động teambuilding, tham quan các địa danh nổi tiếng tại Singapore như Universal Studios, Marina Bay Sands.",
        targetAudience: "Học sinh từ 8 đến 16 tuổi muốn phát triển kỹ năng mềm tự lập.",
        highlights: [
          "Môi trường sống văn minh an toàn bậc nhất thế giới",
          "Tham quan và giao lưu tại Đại học Quốc gia Singapore (NUS)",
          "Rèn luyện kỹ năng sinh hoạt độc lập và làm việc nhóm"
        ],
        processSteps: [
          "Tư vấn chọn lịch trình và khóa học",
          "Đóng chi phí trọn gói",
          "Hoàn tất tờ khai nhập cảnh trực tuyến",
          "Xuất phát cùng trưởng đoàn HTO"
        ],
        tags: ["Sinh hoạt tự lập", "Quốc tế hóa", "An toàn cao"],
        websiteUrl: "https://htocean.edu.vn/du-hoc-he-singapore",
        brochure: { name: "Brochure_Singapore_Summer_2026.pdf", size: "2.8 MB", type: "PDF", sourceType: "file", fileType: "PDF", url: "" },
        documents: [
          { id: "doc-1-2-1", name: "Quy chế bảo hiểm du lịch quốc tế.pdf", type: "PDF", sourceType: "file", fileType: "PDF", size: "1.1 MB", updatedAt: "2026-05-18" },
          { id: "doc-1-2-2", name: "Lịch trình sinh hoạt 14 ngày chi tiết.pdf", type: "PDF", sourceType: "file", fileType: "PDF", size: "1.9 MB", updatedAt: "2026-05-18" }
        ],
        updatedAt: "2026-05-18"
      },
      {
        id: "prod-1-3",
        name: "Trải nghiệm văn hóa Hàn Quốc",
        categoryId: "cat-1",
        categoryName: "Du học hè",
        country: "Hàn Quốc",
        region: "Châu Á",
        status: "active",
        description: "Tìm hiểu văn hóa xứ sở Kim Chi, giao lưu ngôn ngữ và tham quan các trường đại học nổi tiếng.",
        detailDescription: "Học tiếng Hàn cơ bản kết hợp tham quan các cung điện cổ kính, lớp học nhảy K-pop và trải nghiệm giảng đường thực tế tại các trường Đại học danh tiếng ở Seoul.",
        targetAudience: "Học sinh THPT yêu thích văn hóa Hàn Quốc và có định hướng du học tương lai.",
        highlights: [
          "Trải nghiệm văn hóa nghệ thuật ẩm thực độc đáo",
          "Thực hành giao tiếp tiếng Hàn cơ bản với sinh viên bản địa",
          "Định hướng chọn trường đại học phù hợp tại Seoul"
        ],
        processSteps: [
          "Tư vấn & Nhận hồ sơ",
          "Xin Visa du lịch ngắn hạn C-3",
          "Hướng dẫn chuẩn bị trang phục & đồ cá nhân",
          "Xuất phát đoàn bay"
        ],
        tags: ["Văn hóa K-Pop", "Học tiếng Hàn", "Hướng nghiệp"],
        websiteUrl: "https://htocean.edu.vn/du-hoc-he-han-quoc",
        brochure: { name: "Brochure_Trai_Nghiem_Han_Quoc.pdf", size: "4.1 MB", type: "PDF", sourceType: "file", fileType: "PDF", url: "" },
        documents: [
          { id: "doc-1-3-1", name: "Checklist xin Visa du lịch Hàn Quốc tự túc.docx", type: "DOCX", sourceType: "file", fileType: "DOCX", size: "90 KB", updatedAt: "2026-05-20" }
        ],
        updatedAt: "2026-05-20"
      }
    ]
  },
  {
    id: "cat-2",
    name: "Du học nghề",
    description: "Lộ trình du học nghề kép vừa học vừa làm có hưởng lương. Miễn 100% học phí, nhận trợ cấp thực hành và cam kết việc làm sau tốt nghiệp.",
    status: "active",
    imageGradient: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
    programs: [
      {
        id: "prod-2-1",
        name: "Du học nghề Đức (Điều dưỡng, Nhà hàng, Cơ khí)",
        categoryId: "cat-2",
        categoryName: "Du học nghề",
        country: "Đức",
        region: "Châu Âu",
        status: "active",
        description: "Chương trình vừa học vừa làm miễn 100% học phí và nhận lương thực hành từ 1.100 - 1.300 Euro/tháng.",
        detailDescription: "Lộ trình định cư bền vững tại Đức thông qua học nghề kép. Thời gian đào tạo 3 năm kết hợp 30% lý thuyết và 70% thực hành trực tiếp tại các bệnh viện, nhà hàng, xưởng cơ khí đối tác của HTO.",
        targetAudience: "Học sinh tốt nghiệp THPT tuổi từ 18 - 30, sức khỏe tốt, mong muốn lập nghiệp lâu dài tại Châu Âu.",
        highlights: [
          "Miễn 100% học phí trong suốt 3 năm học học nghề",
          "Trợ cấp sinh hoạt phí thực hành hàng tháng đảm bảo tự trang trải cuộc sống",
          "Cam kết hợp đồng lao động chính thức ngay sau khi tốt nghiệp",
          "Cơ hội định cư vĩnh viễn sau 5 năm học tập và làm việc tại Đức"
        ],
        processSteps: [
          "Học tiếng Đức tại Việt Nam đạt chứng chỉ B1/B2",
          "Thẩm định hồ sơ và phỏng vấn với doanh nghiệp đối tác tại Đức",
          "Nhận hợp đồng học nghề và hợp đồng thực hành từ bên Đức",
          "Chuẩn bị hồ sơ xin Visa và chứng minh tài chính nếu cần",
          "Nhập cảnh Đức, bắt đầu học tiếng bổ trợ và học chuyên môn"
        ],
        tags: ["Miễn học phí", "Trợ cấp cao", "Định cư Châu Âu", "Cam kết việc làm"],
        websiteUrl: "https://htocean.edu.vn/du-hoc-nghe-duc",
        brochure: { name: "Cam_nang_Nghe_Duc_HTO_2026.pdf", size: "5.5 MB", type: "PDF", sourceType: "file", fileType: "PDF", url: "" },
        documents: [
          { id: "doc-2-1-1", name: "Mẫu hợp đồng đào tạo nghề song ngữ Đức-Việt.pdf", type: "PDF", sourceType: "file", fileType: "PDF", size: "2.1 MB", updatedAt: "2026-05-15" },
          { id: "doc-2-1-2", name: "Checklist hồ sơ xin Visa Đại sứ quán Đức.docx", type: "DOCX", sourceType: "file", fileType: "DOCX", size: "130 KB", updatedAt: "2026-05-15" },
          { id: "doc-2-1-3", name: "Quy trình chuyển đổi bằng cấp và thẩm định Defa.pdf", type: "PDF", sourceType: "file", fileType: "PDF", size: "980 KB", updatedAt: "2026-05-15" }
        ],
        updatedAt: "2026-05-15"
      },
      {
        id: "prod-2-2",
        name: "Du học nghề Hàn Quốc (Visa D4-6)",
        categoryId: "cat-2",
        categoryName: "Du học nghề",
        country: "Hàn Quốc",
        region: "Châu Á",
        status: "active",
        description: "Học nghề kết hợp làm thêm có thu nhập tốt. Visa linh hoạt chuyển đổi sang E-7 sau khi ra trường.",
        detailDescription: "Học nghề tại các trường Cao đẳng/Đại học Hàn Quốc đào tạo các ngành Làm đẹp (Beauty), Nấu ăn, Công nghệ thông tin, Thiết kế. Lịch học linh động cho phép sinh viên đi làm thêm trang trải chi phí.",
        targetAudience: "Nam/nữ tốt nghiệp THPT, điểm GPA từ 6.0 trở lên.",
        highlights: [
          "Học tập thời gian ngắn (chỉ từ 1.5 - 2 năm)",
          "Quy định làm thêm thông thoáng giúp tự lập tài chính",
          "Cơ hội chuyển đổi sang Visa lao động chuyên môn E-7 dễ dàng"
        ],
        processSteps: [
          "Nộp hồ sơ phỏng vấn chọn trường",
          "Học tiếng Hàn sơ cấp đạt Topik 1 hoặc 2",
          "Nộp hồ sơ xin mã code Visa từ Cục xuất nhập cảnh Hàn Quốc",
          "Nhận Visa và xuất cảnh học tập"
        ],
        tags: ["Học phí ưu đãi", "Làm thêm 30h/tuần", "Visa D4-6"],
        websiteUrl: "https://htocean.edu.vn/du-hoc-nghe-han-quoc",
        brochure: { name: "Cam_nang_Nghe_Han_Quoc.pdf", size: "3.7 MB", type: "PDF", sourceType: "file", fileType: "PDF", url: "" },
        documents: [
          { id: "doc-2-2-1", name: "Danh sách các trường Cao đẳng liên kết Visa D4-6.pdf", type: "PDF", sourceType: "file", fileType: "PDF", size: "640 KB", updatedAt: "2026-05-22" }
        ],
        updatedAt: "2026-05-22"
      }
    ]
  },
  {
    id: "cat-3",
    name: "Visa",
    description: "Dịch vụ tư vấn, thẩm định hồ sơ, luyện phỏng vấn và hoàn thiện thủ tục xin Visa du học, du lịch, định cư và công tác các nước.",
    status: "active",
    imageGradient: "linear-gradient(135deg, #003366 0%, #002244 100%)",
    programs: [
      {
        id: "prod-3-1",
        name: "Dịch vụ Visa du học & thăm thân Đức",
        categoryId: "cat-3",
        categoryName: "Visa",
        country: "Đức",
        region: "Châu Âu",
        status: "active",
        description: "Tư vấn hồ sơ và xử lý visa thăm thân, visa du học tự túc đạt tỷ lệ đỗ cao.",
        detailDescription: "Dịch vụ hỗ trợ điền tờ khai, chuẩn bị checklist giấy tờ pháp lý, dịch thuật công chứng, mở tài khoản phong tỏa và mua bảo hiểm du lịch đúng chuẩn của Đại Sứ Quán Đức.",
        targetAudience: "Khách hàng cần xin visa du học tự túc hoặc có người thân bảo lãnh sang Đức.",
        highlights: [
          "Tỷ lệ đỗ visa đạt trên 98% nhờ đội ngũ thẩm định hồ sơ dày dặn kinh nghiệm",
          "Xử lý nhanh chóng các trường hợp hồ sơ khó, khoảng trống học tập dài",
          "Tư vấn lộ trình chứng minh tài chính tối ưu nhất"
        ],
        processSteps: [
          "Tiếp nhận thông tin hồ sơ và đánh giá sơ bộ tỷ lệ đỗ",
          "Ký hợp đồng dịch vụ và hoàn thiện checklist giấy tờ",
          "Đặt lịch hẹn nộp hồ sơ tại VFS Global",
          "Nhận kết quả Visa bàn giao khách hàng"
        ],
        tags: ["Tỷ lệ đỗ 98%", "Xử lý nhanh", "Tài khoản phong tỏa"],
        websiteUrl: "https://htocean.edu.vn/visa-du-hoc-duc",
        brochure: { name: "Cam_nang_Visa_Duc_HTO.pdf", size: "1.9 MB", type: "PDF", sourceType: "file", fileType: "PDF", url: "" },
        documents: [
          { id: "doc-3-1-1", name: "Checklist giấy tờ xin Visa du học Đức tự túc.pdf", type: "PDF", sourceType: "file", fileType: "PDF", size: "750 KB", updatedAt: "2026-05-20" }
        ],
        updatedAt: "2026-05-20"
      }
    ]
  },
  {
    id: "cat-4",
    name: "Định cư",
    description: "Giải pháp định cư an toàn cho cả gia đình thông qua các chương trình lao động tay nghề cao, đầu tư kinh doanh hoặc bảo lãnh nhân thân.",
    status: "active",
    imageGradient: "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)",
    programs: [
      {
        id: "prod-4-1",
        name: "Định cư Canada Express Entry (PR)",
        categoryId: "cat-4",
        categoryName: "Định cư",
        country: "Canada",
        region: "Châu Mỹ",
        status: "active",
        description: "Hỗ trợ nộp hồ sơ định cư tay nghề cao nhanh nhất để nhận thẻ Thường trú nhân (PR) Canada.",
        detailDescription: "Tư vấn tối ưu hóa điểm số CRS, thẩm định bằng cấp ECA, chuẩn bị chứng chỉ ngôn ngữ IELTS/CELPIP và nộp hồ sơ Express Entry vào các luồng định cư liên bang.",
        targetAudience: "Khách hàng có trình độ đại học trở lên, khả năng tiếng Anh tốt và kinh nghiệm làm việc chuyên môn.",
        highlights: [
          "Nhận trực tiếp thẻ Thường trú nhân PR cho cả gia đình",
          "Được hưởng đầy đủ phúc lợi y tế, giáo dục miễn phí của Canada",
          "Thời gian xét duyệt hồ sơ nhanh từ 6 - 8 tháng sau khi nhận thư mời ITA"
        ],
        processSteps: [
          "Đánh giá điểm số CRS sơ bộ",
          "Thẩm định bằng cấp nước ngoài (ECA) và thi chứng chỉ tiếng Anh",
          "Tạo hồ sơ Express Entry trên hệ thống IRCC",
          "Nhận thư mời nộp hồ sơ (ITA) và hoàn tất nộp giấy tờ",
          "Nhận COPR và nhập cảnh Canada nhận thẻ PR"
        ],
        tags: ["Thẻ PR định cư", "Express Entry", "Xét duyệt nhanh"],
        websiteUrl: "https://htocean.edu.vn/dinh-cu-canada",
        brochure: { name: "Cam_nang_Dinh_cu_Canada_PR.pdf", size: "4.8 MB", type: "PDF", sourceType: "file", fileType: "PDF", url: "" },
        documents: [
          { id: "doc-4-1-1", name: "Hướng dẫn tính điểm CRS định cư Canada.pdf", type: "PDF", sourceType: "file", fileType: "PDF", size: "1.2 MB", updatedAt: "2026-05-25" }
        ],
        updatedAt: "2026-05-25"
      }
    ]
  },
  {
    id: "cat-5",
    name: "Đào tạo ngôn ngữ",
    description: "Khóa đào tạo ngoại ngữ cấp tốc chất lượng cao (Tiếng Đức, Anh, Hàn, Nhật) cam kết chuẩn đầu ra phục vụ làm việc và xin visa.",
    status: "active",
    imageGradient: "linear-gradient(135deg, #EC4899 0%, #BE185D 100%)",
    programs: [
      {
        id: "prod-5-1",
        name: "Tiếng Đức sơ cấp & trung cấp (A1 - B1/B2)",
        categoryId: "cat-5",
        categoryName: "Đào tạo ngôn ngữ",
        country: "Đức",
        region: "Châu Âu",
        status: "active",
        description: "Khóa đào tạo tiếng Đức bài bản từ con số 0 giúp học viên tự tin thi đạt B1/B2.",
        detailDescription: "Chương trình học tiếng Đức chất lượng cao tại HTO. Đội ngũ giáo viên bản xứ và giáo viên Việt Nam giàu kinh nghiệm, lộ trình cá nhân hóa kết hợp các bài thi thử Goethe/Telc hàng tuần.",
        targetAudience: "Học viên chuẩn bị đi du học nghề Đức hoặc làm việc định cư tại Đức.",
        highlights: [
          "Lớp học sĩ số vàng tối đa 12 học viên đảm bảo tương tác liên tục",
          "Luyện phản xạ nghe nói hàng tuần với giáo viên người Đức bản địa",
          "Cam kết đào tạo lại miễn phí nếu không đạt đầu ra đúng tiến độ"
        ],
        processSteps: [
          "Kiểm tra trình độ đầu vào miễn phí",
          "Đăng ký lớp học theo khung giờ sáng / chiều / tối",
          "Học tập chuyên sâu theo giáo trình chuẩn quốc tế",
          "Thi thử và tham gia kỳ thi chứng chỉ chính thức tại viện Goethe"
        ],
        tags: ["Luyện thi B1/B2", "Cam kết đầu ra", "Sĩ số 12 học viên"],
        websiteUrl: "https://htocean.edu.vn/hoc-tieng-duc",
        brochure: { name: "Lich_Khai_Giang_Tieng_Duc_HTO.pdf", size: "2.5 MB", type: "PDF", sourceType: "file", fileType: "PDF", url: "" },
        documents: [
          { id: "doc-5-1-1", name: "Đề thi mẫu Goethe B1 có đáp án chi tiết.pdf", type: "PDF", sourceType: "file", fileType: "PDF", size: "3.2 MB", updatedAt: "2026-05-28" }
        ],
        updatedAt: "2026-05-28"
      }
    ]
  },
  {
    id: "cat-6",
    name: "TTS Quốc tế",
    description: "Chương trình thực tập sinh, làm việc ngắn hạn có lương dành cho sinh viên các trường Đại học, Cao đẳng tích lũy kinh nghiệm nước ngoài.",
    status: "coming_soon",
    imageGradient: "linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)",
    programs: [
      {
        id: "prod-6-1",
        name: "TTS ngành dịch vụ & du học nghề Nhật Bản",
        categoryId: "cat-6",
        categoryName: "TTS Quốc tế",
        country: "Nhật Bản",
        region: "Châu Á",
        status: "active",
        description: "Cơ hội làm việc tại hệ thống khách sạn, nhà hàng Nhật Bản với mức lương hấp dẫn.",
        detailDescription: "Chương trình Internship quốc tế 1 năm dành cho sinh viên ngành Khách sạn, Nhà hàng, Quản trị du lịch. Làm việc thực tế nhận lương như nhân viên chính thức, tích lũy chứng chỉ quốc tế.",
        targetAudience: "Sinh viên năm 3 hoặc năm cuối các trường Đại học, Cao đẳng trên toàn quốc.",
        highlights: [
          "Mức lương thực tập sinh từ 130.000 - 150.000 Yên/tháng",
          "Hỗ trợ chỗ ở ký túc xá và bữa ăn trong ca làm việc",
          "Nhận chứng nhận thực tập quốc tế thuận lợi xin việc sau tốt nghiệp"
        ],
        processSteps: [
          "Nộp bảng điểm và CV tiếng Nhật theo mẫu HTO",
          "Phỏng vấn trực tiếp qua Zoom với quản lý nghiệp đoàn Nhật Bản",
          "Xin COE và hoàn tất thủ tục cấp Visa Internship",
          "Nhập cảnh thực tập 1 năm"
        ],
        tags: ["Internship 1 năm", "Lương 150k Yên", "Ngành Khách sạn"],
        websiteUrl: "https://htocean.edu.vn/thuc-tap-sinh-nhat-ban",
        brochure: { name: "Thong_Tin_TTS_Nhat_Ban_HTO.pdf", size: "3.9 MB", type: "PDF", sourceType: "file", fileType: "PDF", url: "" },
        documents: [
          { id: "doc-6-1-1", name: "Mẫu sơ yếu lý lịch CV tiếng Nhật tiêu chuẩn.docx", type: "DOCX", sourceType: "file", fileType: "DOCX", size: "110 KB", updatedAt: "2026-05-20" }
        ],
        updatedAt: "2026-05-20"
      }
    ]
  },
  {
    id: "cat-7",
    name: "Du học hè Thụy Sĩ (Quản trị Khách sạn) - Bản nháp",
    description: "Chương trình trại hè cao cấp trải nghiệm làm bánh, quản trị du lịch, khách sạn chuẩn Thụy Sĩ. Đang trong tiến trình kiểm duyệt.",
    status: "hidden",
    imageGradient: "linear-gradient(135deg, #64748B 0%, #475569 100%)",
    programs: [
      {
        id: "prod-7-1",
        name: "Trại hè Quản trị du lịch học viện BHMS Thụy Sĩ",
        categoryId: "cat-7",
        categoryName: "Du học hè Thụy Sĩ (Quản trị Khách sạn) - Bản nháp",
        country: "Thụy Sĩ",
        region: "Châu Âu",
        status: "active",
        description: "Khóa trải nghiệm cuộc sống sinh viên Thụy Sĩ và tham gia các hội thảo chuyên ngành du lịch.",
        detailDescription: "Hành trình 10 ngày tại học viện BHMS Lucerne. Học sinh được học về văn hóa giao tiếp Âu Châu, quy trình vận hành khách sạn 5 sao, tham quan các xưởng sản xuất chocolate truyền thống.",
        targetAudience: "Học sinh khá giả có định hướng du học Thụy Sĩ.",
        highlights: [
          "Trực tiếp sinh hoạt tại campus hiện đại của BHMS tại Lucerne",
          "Chứng chỉ hoàn thành khóa trại hè cấp bởi BHMS Thụy Sĩ",
          "Gặp gỡ và chia sẻ kinh nghiệm cùng cựu học sinh thành đạt"
        ],
        processSteps: [
          "Xét duyệt điều kiện hồ sơ và phỏng vấn ngoại ngữ",
          "Xin Visa Schengen qua Đại sứ quán Thụy Sĩ",
          "Hoàn thiện học phí và xuất cảnh theo đoàn"
        ],
        tags: ["Trại hè Thụy Sĩ", "Học viện BHMS", "Định hướng Quản trị"],
        brochure: { name: "Brochure_Summer_Camp_Swiss_BHMS.pdf", size: "5.1 MB", type: "PDF", sourceType: "file", fileType: "PDF", url: "" },
        documents: [
          { id: "doc-7-1-1", name: "Lịch trình hoạt động 10 ngày Thụy Sĩ.pdf", type: "PDF", sourceType: "file", fileType: "PDF", size: "2.3 MB", updatedAt: "2026-06-01" }
        ],
        updatedAt: "2026-06-01"
      }
    ]
  }
];

// Initialize localStorage if needed
const getMockData = () => {
  const data = localStorage.getItem(PRODUCT_STORAGE_KEY);
  if (!data) {
    localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(INITIAL_CATEGORIES));
    return INITIAL_CATEGORIES;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return INITIAL_CATEGORIES;
  }
};

const saveMockData = (data) => {
  localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(data));
};

export const productService = {
  // Get all product categories
  async getProductCategories() {
    try {
      const response = await fetch(`${API_BASE_URL}/products/categories`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error("API failed");
      const json = await response.json();
      return { data: json.data || json, apiMode: "real" };
    } catch (err) {
      if (USE_MOCK_WHEN_API_FAIL) {
        console.warn("[productService] API getProductCategories failed. Falling back to mock data:", err);
        return { data: getMockData(), apiMode: "mock" };
      }
      throw err;
    }
  },

  // Get details for a specific product child
  async getProductDetail(productId) {
    try {
      const response = await fetch(`${API_BASE_URL}/products/programs/${productId}`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error("API failed");
      const json = await response.json();
      return { data: json.data || json, apiMode: "real" };
    } catch (err) {
      if (USE_MOCK_WHEN_API_FAIL) {
        console.warn(`[productService] API getProductDetail for ID ${productId} failed. Falling back to mock data:`, err);
        const categories = getMockData();
        for (const cat of categories) {
          const prod = cat.programs?.find(p => p.id === productId);
          if (prod) return { data: prod, apiMode: "mock" };
        }
        throw new Error("Không tìm thấy sản phẩm con");
      }
      throw err;
    }
  },

  // Create new category
  async createProductCategory(payload) {
    try {
      const response = await fetch(`${API_BASE_URL}/products/categories`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error("API failed");
      const json = await response.json();
      return { data: json.data || json, apiMode: "real" };
    } catch (err) {
      if (USE_MOCK_WHEN_API_FAIL) {
        console.warn("[productService] API createProductCategory failed. Falling back to mock data:", err);
        const data = getMockData();
        const newCat = {
          ...payload,
          id: `cat-${Date.now()}`,
          programs: []
        };
        data.push(newCat);
        saveMockData(data);
        return { data: newCat, apiMode: "mock" };
      }
      throw err;
    }
  },

  // Update existing category
  async updateProductCategory(categoryId, payload) {
    try {
      const response = await fetch(`${API_BASE_URL}/products/categories/${categoryId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error("API failed");
      const json = await response.json();
      return { data: json.data || json, apiMode: "real" };
    } catch (err) {
      if (USE_MOCK_WHEN_API_FAIL) {
        console.warn(`[productService] API updateProductCategory for ID ${categoryId} failed. Falling back to mock data:`, err);
        const data = getMockData();
        const idx = data.findIndex(c => c.id === categoryId);
        if (idx !== -1) {
          data[idx] = { ...data[idx], ...payload };
          saveMockData(data);
          return { data: data[idx], apiMode: "mock" };
        }
        throw new Error("Không tìm thấy danh mục");
      }
      throw err;
    }
  },

  // Toggle category status
  async toggleProductCategoryStatus(categoryId, status) {
    try {
      const response = await fetch(`${API_BASE_URL}/products/categories/${categoryId}/status`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error("API failed");
      const json = await response.json();
      return { data: json.data || json, apiMode: "real" };
    } catch (err) {
      if (USE_MOCK_WHEN_API_FAIL) {
        console.warn(`[productService] API toggleProductCategoryStatus for ID ${categoryId} failed. Falling back to mock data:`, err);
        const data = getMockData();
        const idx = data.findIndex(c => c.id === categoryId);
        if (idx !== -1) {
          data[idx].status = status;
          saveMockData(data);
          return { data: data[idx], apiMode: "mock" };
        }
        throw new Error("Không tìm thấy danh mục");
      }
      throw err;
    }
  },

  // Create product child under category
  async createProductChild(categoryId, payload) {
    try {
      const response = await fetch(`${API_BASE_URL}/products/categories/${categoryId}/programs`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error("API failed");
      const json = await response.json();
      return { data: json.data || json, apiMode: "real" };
    } catch (err) {
      if (USE_MOCK_WHEN_API_FAIL) {
        console.warn(`[productService] API createProductChild under category ${categoryId} failed. Falling back to mock data:`, err);
        const data = getMockData();
        const idx = data.findIndex(c => c.id === categoryId);
        if (idx !== -1) {
          const newProduct = {
            ...payload,
            id: `prod-${Date.now()}`,
            categoryId,
            categoryName: data[idx].name,
            documents: payload.documents || [],
            brochure: payload.brochure || null,
            updatedAt: new Date().toISOString().split("T")[0]
          };
          if (!data[idx].programs) data[idx].programs = [];
          data[idx].programs.push(newProduct);
          saveMockData(data);
          return { data: newProduct, apiMode: "mock" };
        }
        throw new Error("Không tìm thấy danh mục lớn");
      }
      throw err;
    }
  },

  // Update existing product child
  async updateProductChild(productId, payload) {
    try {
      const response = await fetch(`${API_BASE_URL}/products/programs/${productId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error("API failed");
      const json = await response.json();
      return { data: json.data || json, apiMode: "real" };
    } catch (err) {
      if (USE_MOCK_WHEN_API_FAIL) {
        console.warn(`[productService] API updateProductChild for ID ${productId} failed. Falling back to mock data:`, err);
        const data = getMockData();
        let foundProduct = null;
        for (let cat of data) {
          const pIdx = cat.programs?.findIndex(p => p.id === productId);
          if (pIdx !== -1 && pIdx !== undefined) {
            cat.programs[pIdx] = {
              ...cat.programs[pIdx],
              ...payload,
              updatedAt: new Date().toISOString().split("T")[0]
            };
            foundProduct = cat.programs[pIdx];
            break;
          }
        }
        if (foundProduct) {
          saveMockData(data);
          return { data: foundProduct, apiMode: "mock" };
        }
        throw new Error("Không tìm thấy sản phẩm con");
      }
      throw err;
    }
  },

  // Upload brochure for a product
  async uploadProductBrochure(productId, payload) {
    try {
      const formData = new FormData();
      formData.append("file", payload.file);
      const response = await fetch(`${API_BASE_URL}/products/programs/${productId}/brochure`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: formData
      });
      if (!response.ok) throw new Error("API failed");
      const json = await response.json();
      return { data: json.data || json, apiMode: "real" };
    } catch (err) {
      if (USE_MOCK_WHEN_API_FAIL) {
        console.warn(`[productService] API uploadProductBrochure for ID ${productId} failed. Falling back to mock data:`, err);
        const data = getMockData();
        let foundProduct = null;
        for (let cat of data) {
          const pIdx = cat.programs?.findIndex(p => p.id === productId);
          if (pIdx !== -1 && pIdx !== undefined) {
            cat.programs[pIdx].brochure = payload;
            cat.programs[pIdx].updatedAt = new Date().toISOString().split("T")[0];
            foundProduct = cat.programs[pIdx];
            break;
          }
        }
        if (foundProduct) {
          saveMockData(data);
          return { data: foundProduct.brochure, apiMode: "mock" };
        }
        throw new Error("Không tìm thấy sản phẩm con");
      }
      throw err;
    }
  },

  // Upload documents (multiple) for a product
  async uploadProductDocuments(productId, payload) {
    try {
      const formData = new FormData();
      payload.files.forEach(f => formData.append("files", f));
      const response = await fetch(`${API_BASE_URL}/products/programs/${productId}/documents`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: formData
      });
      if (!response.ok) throw new Error("API failed");
      const json = await response.json();
      return { data: json.data || json, apiMode: "real" };
    } catch (err) {
      if (USE_MOCK_WHEN_API_FAIL) {
        console.warn(`[productService] API uploadProductDocuments for ID ${productId} failed. Falling back to mock data:`, err);
        const data = getMockData();
        let foundProduct = null;
        for (let cat of data) {
          const pIdx = cat.programs?.findIndex(p => p.id === productId);
          if (pIdx !== -1 && pIdx !== undefined) {
            if (!cat.programs[pIdx].documents) cat.programs[pIdx].documents = [];
            cat.programs[pIdx].documents.push(...payload.newDocs);
            cat.programs[pIdx].updatedAt = new Date().toISOString().split("T")[0];
            foundProduct = cat.programs[pIdx];
            break;
          }
        }
        if (foundProduct) {
          saveMockData(data);
          return { data: foundProduct.documents, apiMode: "mock" };
        }
        throw new Error("Không tìm thấy sản phẩm con");
      }
      throw err;
    }
  },

  // Remove document from a product
  async removeProductDocument(productId, documentId) {
    try {
      const response = await fetch(`${API_BASE_URL}/products/programs/${productId}/documents/${documentId}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error("API failed");
      const json = await response.json();
      return { data: json.data || json, apiMode: "real" };
    } catch (err) {
      if (USE_MOCK_WHEN_API_FAIL) {
        console.warn(`[productService] API removeProductDocument for ID ${productId} and doc ID ${documentId} failed. Falling back to mock data:`, err);
        const data = getMockData();
        let success = false;
        for (let cat of data) {
          const pIdx = cat.programs?.findIndex(p => p.id === productId);
          if (pIdx !== -1 && pIdx !== undefined) {
            cat.programs[pIdx].documents = cat.programs[pIdx].documents.filter(d => d.id !== documentId);
            cat.programs[pIdx].updatedAt = new Date().toISOString().split("T")[0];
            success = true;
            break;
          }
        }
        if (success) {
          saveMockData(data);
          return { success: true, apiMode: "mock" };
        }
        throw new Error("Không tìm thấy sản phẩm hoặc tài liệu");
      }
      throw err;
    }
  },

  // Create Product Interest Lead (CRM)
  async createProductInterestLead(payload) {
    try {
      const response = await fetch(`${API_BASE_URL}/products/leads`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error("API failed");
      const json = await response.json();
      return { data: json.data || json, apiMode: "real" };
    } catch (err) {
      if (USE_MOCK_WHEN_API_FAIL) {
        console.warn("[productService] API createProductInterestLead failed. Falling back to mock data:", err);
        // Save to leads array in localStorage
        const leads = JSON.parse(localStorage.getItem("hto_product_interest_leads") || "[]");
        const newLead = {
          ...payload,
          id: `lead-${Date.now()}`,
          createdAt: new Date().toISOString()
        };
        leads.push(newLead);
        localStorage.setItem("hto_product_interest_leads", JSON.stringify(leads));
        return { data: newLead, apiMode: "mock" };
      }
      throw err;
    }
  }
};
