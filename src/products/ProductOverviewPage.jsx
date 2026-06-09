import { useState, useMemo, useEffect, useCallback, useRef } from "react";

// ==========================================
// INITIAL MOCK CATEGORIES AND PROGRAMS
// ==========================================
const INITIAL_CATEGORIES = [
  {
    id: "cat-1",
    name: "Du học hè",
    description: "Các chương trình du học hè ngắn hạn kết hợp học tập, rèn luyện kỹ năng và giao lưu văn hóa tại nhiều quốc gia phát triển.",
    status: "active",
    coverImageUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80",
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
    coverImageUrl: "https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=800&q=80",
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
    coverImageUrl: "https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?auto=format&fit=crop&w=800&q=80",
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
    coverImageUrl: "https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7?auto=format&fit=crop&w=800&q=80",
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
    coverImageUrl: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80",
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
    coverImageUrl: "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=800&q=80",
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
    coverImageUrl: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80",
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

const PRODUCT_STORAGE_KEY = "hto_products_categories_data";

// Fallback & validation helpers for mock data
const getMockData = () => {
  try {
    const stored = localStorage.getItem(PRODUCT_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Validate basic keys of the first item to ensure correct structure
        const first = parsed[0];
        if (first && typeof first === "object" && "id" in first && "name" in first && "programs" in first) {
          return parsed;
        }
      }
    }
  } catch (e) {
    console.warn("[LocalStorage] Error parsing mock categories data, using defaults:", e);
  }
  return INITIAL_CATEGORIES;
};

const saveMockData = (data) => {
  try {
    localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("[LocalStorage] Error writing mock categories data:", e);
  }
};


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

// ==========================================
// CUSTOM DROPDOWN COMPONENT
// ==========================================
function CustomDropdown({ value, options, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const selectedOption = options.find(opt => opt.value === value) || options[0];

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full h-10 bg-white border ${
          isOpen ? "border-cyan-400 ring-2 ring-cyan-500/20" : "border-slate-200"
        } rounded-xl force-rounded-xl px-3 text-sm text-slate-700 flex items-center justify-between shadow-sm transition-all duration-200 cursor-pointer focus:outline-none`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate pr-2">{selectedOption?.label}</span>
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 flex-shrink-0 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 z-[100] mt-1.5 max-h-[280px] overflow-y-auto rounded-xl force-rounded-xl border border-slate-200 bg-white shadow-xl p-1 animate-fade-in">
          <div role="listbox" className="flex flex-col gap-0.5">
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={`w-full rounded-lg force-rounded-lg px-3 py-2 text-left text-sm transition-colors duration-150 flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? "bg-cyan-100 text-cyan-800 font-semibold"
                      : "text-slate-700 hover:bg-cyan-50 hover:text-cyan-700"
                  }`}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                >
                  <span className="truncate pr-2">{opt.label}</span>
                  {isSelected && (
                    <svg className="w-4 h-4 text-cyan-700 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

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
  const [isCategoryCoverDragging, setIsCategoryCoverDragging] = useState(false);
  const categoryCoverInputRef = useRef(null);

  // Form states
  const [formCategory, setFormCategory] = useState({
    id: "",
    name: "",
    description: "",
    status: "active",
    coverImageUrl: "",
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

  // Load danh sách dữ liệu từ localStorage
  const loadData = useCallback(() => {
    setLoading(true);
    setError("");
    try {
      const data = getMockData();
      setCategories(data);
      setApiMode("mock");
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

  const categoryOptions = useMemo(() => {
    return categoryNames.map(name => ({ label: name, value: name }));
  }, [categoryNames]);

  const countryOptions = useMemo(() => {
    return ALL_COUNTRIES_MOCK.map(c => ({ label: c, value: c }));
  }, []);

  const statusOptions = useMemo(() => [
    { label: "Tất cả", value: "all" },
    { label: "Đang hoạt động", value: "active" },
    { label: "Sắp mở", value: "coming_soon" },
    { label: "Tạm ngưng", value: "expired" }
  ], []);

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
      coverImageUrl: "",
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
      coverImageUrl: cat.coverImageUrl || "",
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
        const updated = categories.map(cat => 
          cat.id === catId ? { ...cat, status: newStatus } : cat
        );
        saveMockData(updated);
        setCategories(updated);
        alert(`Đã ${statusText} danh mục!`);
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

    try {
      let updated;
      if (editingCategory === "new") {
        const newCat = {
          id: `cat-${Date.now()}`,
          name: formCategory.name,
          description: formCategory.description,
          status: formCategory.status,
          coverImageUrl: formCategory.coverImageUrl,
          programs: []
        };
        updated = [...categories, newCat];
        alert("Đã thêm danh mục mới thành công!");
      } else {
        updated = categories.map(cat => {
          if (cat.id === editingCategory) {
            return {
              ...cat,
              name: formCategory.name,
              description: formCategory.description,
              status: formCategory.status,
              coverImageUrl: formCategory.coverImageUrl
            };
          }
          return cat;
        });
        alert("Đã cập nhật danh mục thành công!");
      }
      saveMockData(updated);
      setCategories(updated);
      setEditingCategory(null);
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
        const updated = categories.map(cat => {
          const hasProg = cat.programs?.some(p => p.id === prodId);
          if (hasProg) {
            return {
              ...cat,
              programs: cat.programs.filter(p => p.id !== prodId)
            };
          }
          return cat;
        });
        saveMockData(updated);
        setCategories(updated);
        alert("Đã xóa sản phẩm con!");
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
      documents: formProduct.documents,
      updatedAt: new Date().toISOString().split("T")[0]
    };

    try {
      let updated;
      let savedProd = null;
      if (editingProduct === "new") {
        const newProd = {
          ...payload,
          id: `prod-${Date.now()}`,
          categoryId: editingProductParentCatId,
          categoryName: categories.find(c => c.id === editingProductParentCatId)?.name || ""
        };
        savedProd = newProd;
        updated = categories.map(cat => {
          if (cat.id === editingProductParentCatId) {
            return {
              ...cat,
              programs: [...(cat.programs || []), newProd]
            };
          }
          return cat;
        });
        alert("Đã thêm sản phẩm con mới thành công!");
      } else {
        updated = categories.map(cat => {
          const hasProg = cat.programs?.some(p => p.id === editingProduct);
          if (hasProg) {
            return {
              ...cat,
              programs: cat.programs.map(p => {
                if (p.id === editingProduct) {
                  const updatedP = {
                    ...p,
                    ...payload,
                    id: editingProduct,
                    categoryId: editingProductParentCatId,
                    categoryName: categories.find(c => c.id === editingProductParentCatId)?.name || ""
                  };
                  savedProd = updatedP;
                  return updatedP;
                }
                return p;
              })
            };
          }
          return cat;
        });
        alert("Đã cập nhật sản phẩm con thành công!");
      }
      saveMockData(updated);
      setCategories(updated);
      setEditingProduct(null);
      
      // Update selected view details if active
      if (selectedProduct && selectedProduct.id === editingProduct) {
        setSelectedProduct(savedProd);
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
            const updated = categories.map(cat => {
              const hasProg = cat.programs?.some(p => p.id === editingProduct);
              if (hasProg) {
                return {
                  ...cat,
                  programs: cat.programs.map(p => 
                    p.id === editingProduct ? { ...p, brochure: brochureData } : p
                  )
                };
              }
              return cat;
            });
            saveMockData(updated);
            setCategories(updated);
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
            const updated = categories.map(cat => {
              const hasProg = cat.programs?.some(p => p.id === editingProduct);
              if (hasProg) {
                return {
                  ...cat,
                  programs: cat.programs.map(p => 
                    p.id === editingProduct ? { ...p, brochure: brochureData } : p
                  )
                };
              }
              return cat;
            });
            saveMockData(updated);
            setCategories(updated);
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
          const updated = categories.map(cat => {
            const hasProg = cat.programs?.some(p => p.id === editingProduct);
            if (hasProg) {
              return {
                ...cat,
                programs: cat.programs.map(p => 
                  p.id === editingProduct ? { ...p, brochure: brochureData } : p
                )
              };
            }
            return cat;
          });
          saveMockData(updated);
          setCategories(updated);
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
          const updated = categories.map(cat => {
            const hasProg = cat.programs?.some(p => p.id === editingProduct);
            if (hasProg) {
              return {
                ...cat,
                programs: cat.programs.map(p => 
                  p.id === editingProduct ? { ...p, documents: [...(p.documents || []), ...newDocs] } : p
                )
              };
            }
            return cat;
          });
          saveMockData(updated);
          setCategories(updated);
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
          const updated = categories.map(cat => {
            const hasProg = cat.programs?.some(p => p.id === editingProduct);
            if (hasProg) {
              return {
                ...cat,
                programs: cat.programs.map(p => 
                  p.id === editingProduct ? { ...p, documents: [...(p.documents || []), ...newDocs] } : p
                )
              };
            }
            return cat;
          });
          saveMockData(updated);
          setCategories(updated);
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
          const updated = categories.map(cat => {
            const hasProg = cat.programs?.some(p => p.id === editingProduct);
            if (hasProg) {
              return {
                ...cat,
                programs: cat.programs.map(p => 
                  p.id === editingProduct ? { ...p, documents: (p.documents || []).filter(d => d.id !== docId) } : p
                )
              };
            }
            return cat;
          });
          saveMockData(updated);
          setCategories(updated);
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
                {apiMode === "real" ? "API Live" : "Mock Local Storage"}
              </span>
            </div>
            <p className="text-slate-500 text-sm m-0 mt-1">
              Kho danh mục chương trình và tài liệu tư vấn dành cho cộng tác viên, đại lý và nhân viên tư vấn.
            </p>
          </div>
          {canManageProducts && (
            <button
              className="bg-cyan-900 hover:bg-cyan-950 text-white text-sm font-semibold px-4 py-2 flex items-center gap-2 shadow-sm rounded-xl force-rounded-xl transition-all duration-200 cursor-pointer"
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
        <div className="bg-white rounded-2xl border border-slate-100 p-4 md:p-5 shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div className="md:col-span-12 xl:col-span-6">
              <label className="block font-semibold text-xs text-slate-500 mb-1">Tìm kiếm chương trình</label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-slate-400 flex items-center justify-center pointer-events-none">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  type="text"
                  className="w-full h-10 bg-white border border-slate-200 rounded-xl pl-9 pr-3 text-sm text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 focus:outline-none transition-all duration-200"
                  placeholder="Nhập tên chương trình, quốc gia, tag..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="md:col-span-4 xl:col-span-2">
              <label className="block font-semibold text-xs text-slate-500 mb-1">Danh mục lớn</label>
              <CustomDropdown
                value={selectedCategoryName}
                options={categoryOptions}
                onChange={setSelectedCategoryName}
              />
            </div>

            <div className="md:col-span-4 xl:col-span-2">
              <label className="block font-semibold text-xs text-slate-500 mb-1">Quốc gia</label>
              <CustomDropdown
                value={selectedCountry}
                options={countryOptions}
                onChange={setSelectedCountry}
              />
            </div>

            <div className="md:col-span-4 xl:col-span-2">
              <label className="block font-semibold text-xs text-slate-500 mb-1">Trạng thái</label>
              <CustomDropdown
                value={selectedStatus}
                options={statusOptions}
                onChange={setSelectedStatus}
              />
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
                  <div className="relative bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 transition-shadow duration-200 hover:shadow-md flex flex-col h-full">
                    {/* Header Card với Ảnh Nền */}
                    <div className={`relative overflow-hidden rounded-t-2xl h-[180px] md:h-[190px] ${isHidden ? "opacity-75" : ""}`}>
                      {/* Fallback pattern in case image fails or is empty */}
                      <div className="absolute inset-0 bg-slate-100 flex flex-col items-center justify-center text-slate-400 gap-1.5 force-rounded-t-2xl">
                        <svg className="w-10 h-10 text-slate-350" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-[11px] font-medium tracking-wide">Chưa có ảnh bìa</span>
                      </div>

                      {/* Actual Image */}
                      {cat.coverImageUrl && (
                        <img
                          src={cat.coverImageUrl}
                          alt={cat.name}
                          className="absolute inset-0 h-full w-full object-cover force-rounded-t-2xl"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      )}
                      
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-slate-900/25 to-slate-900/15" />

                      <div className="relative z-10 flex h-full flex-col p-5 justify-between">
                        <div className="flex items-start justify-between gap-3">
                          {canManageProducts ? (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleEditCategory(cat);
                                }}
                                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/60 bg-white/90 text-amber-500 shadow-sm transition hover:scale-105 hover:bg-white force-rounded-full cursor-pointer"
                                aria-label="Sửa danh mục"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-2.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleToggleCategoryStatus(cat.id, cat.status);
                                }}
                                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/60 bg-white/90 text-cyan-700 shadow-sm transition hover:scale-105 hover:bg-white force-rounded-full cursor-pointer"
                                aria-label="Ẩn hoặc hiện danh mục"
                              >
                                {isHidden ? (
                                  <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                )}
                              </button>
                            </div>
                          ) : (
                            <div />
                          )}

                          <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-semibold border border-white/15 text-white">
                            {displayPrograms.length} Chương trình
                          </span>
                        </div>

                        <div>
                          <h5 className="text-xl font-bold m-0 [text-shadow:0_2px_4px_rgba(0,0,0,0.15)] leading-tight flex items-center flex-wrap gap-2 text-white">
                            {cat.name}
                            {isHidden && (
                              <span className="bg-red-650 text-white font-bold px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider">ĐÃ ẨN</span>
                            )}
                          </h5>
                        </div>
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
                      <label className="block font-semibold text-xs text-slate-500 mb-1.5">Ảnh bìa danh mục</label>
                      
                      {!formCategory.coverImageUrl ? (
                        <div
                          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                            isCategoryCoverDragging ? "border-cyan-500 bg-cyan-50/30" : "border-slate-200 hover:border-slate-350 bg-slate-50/50"
                          }`}
                          onDragOver={(e) => {
                            e.preventDefault();
                            setIsCategoryCoverDragging(true);
                          }}
                          onDragLeave={() => setIsCategoryCoverDragging(false)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setIsCategoryCoverDragging(false);
                            const file = e.dataTransfer.files?.[0];
                            if (file) {
                              if (!file.type.startsWith("image/")) {
                                alert("Vui lòng chọn file ảnh hợp lệ!");
                                return;
                              }
                              if (file.size > 2 * 1024 * 1024) {
                                alert("Kích thước ảnh không được vượt quá 2MB!");
                                return;
                              }
                              const reader = new FileReader();
                              reader.onload = () => {
                                setFormCategory(prev => ({ ...prev, coverImageUrl: reader.result }));
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          onClick={() => categoryCoverInputRef.current?.click()}
                        >
                          <input
                            type="file"
                            ref={categoryCoverInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (!file.type.startsWith("image/")) {
                                  alert("Vui lòng chọn file ảnh hợp lệ!");
                                  return;
                                }
                                if (file.size > 2 * 1024 * 1024) {
                                  alert("Kích thước ảnh không được vượt quá 2MB!");
                                  return;
                                }
                                const reader = new FileReader();
                                reader.onload = () => {
                                  setFormCategory(prev => ({ ...prev, coverImageUrl: reader.result }));
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                          <svg className="mx-auto h-8 w-8 text-slate-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="text-xs font-semibold text-slate-600 mb-1">
                            Kéo thả ảnh vào đây hoặc nhấp để chọn ảnh
                          </p>
                          <p className="text-[10px] text-slate-400">
                            Hỗ trợ PNG, JPG, JPEG, WEBP lên đến 2MB
                          </p>
                        </div>
                      ) : (
                        <div className="relative border border-slate-200 rounded-2xl overflow-hidden bg-slate-50">
                          <div className="h-[140px] w-full relative">
                            {/* Fallback pattern in case the URL is invalid or broken */}
                            <div className="absolute inset-0 bg-slate-100 flex flex-col items-center justify-center text-slate-400 gap-1.5">
                              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span className="text-[10px] font-medium tracking-wide">Đường dẫn ảnh không khả dụng</span>
                            </div>
                            
                            <img
                              src={formCategory.coverImageUrl}
                              alt="Preview"
                              className="absolute inset-0 w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          </div>
                          <div className="p-3 bg-white border-t border-slate-100 flex items-center justify-between gap-2">
                            <div className="text-[11px] text-slate-500 truncate max-w-[65%]" title={formCategory.coverImageUrl}>
                              Link: {formCategory.coverImageUrl}
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                className="px-2.5 py-1.5 text-[11.5px] font-semibold border border-slate-250 hover:bg-slate-50 text-slate-650 rounded-xl transition-colors cursor-pointer"
                                onClick={() => categoryCoverInputRef.current?.click()}
                              >
                                Thay đổi
                              </button>
                              <button
                                type="button"
                                className="px-2.5 py-1.5 text-[11.5px] font-semibold bg-red-50 hover:bg-red-100 text-red-650 rounded-xl transition-colors cursor-pointer"
                                onClick={() => setFormCategory({ ...formCategory, coverImageUrl: "" })}
                              >
                                Xóa ảnh
                              </button>
                            </div>
                          </div>
                          
                          <input
                            type="file"
                            ref={categoryCoverInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (!file.type.startsWith("image/")) {
                                  alert("Vui lòng chọn file ảnh hợp lệ!");
                                  return;
                                }
                                if (file.size > 2 * 1024 * 1024) {
                                  alert("Kích thước ảnh không được vượt quá 2MB!");
                                  return;
                                }
                                const reader = new FileReader();
                                reader.onload = () => {
                                  setFormCategory(prev => ({ ...prev, coverImageUrl: reader.result }));
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </div>
                      )}
                      
                      <div className="mt-3">
                        <input
                          type="text"
                          placeholder="Dán hoặc nhập trực tiếp link ảnh bìa (URL)..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-[13px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all"
                          value={formCategory.coverImageUrl}
                          onChange={(e) => {
                            let value = e.target.value;
                            if (value && !/^https?:\/\//i.test(value) && !value.startsWith("data:")) {
                              if (value.includes(".") && value.length > 3) {
                                value = "https://" + value;
                              }
                            }
                            setFormCategory({ ...formCategory, coverImageUrl: value });
                          }}
                        />
                      </div>
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
