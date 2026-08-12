import React, { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import { Calendar, ChevronRight, Tag } from 'lucide-react';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

import { fetchNewsPosts } from '../newsEvents/newsEventsApi';

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr || "-";
  return date.toLocaleDateString("vi-VN");
};

export const SteamCarousel = ({ onNavigate, theme }) => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const isDark = theme === "dark";

  useEffect(() => {
    let mounted = true;
    const loadNews = async () => {
      setLoading(true);
      try {
        const data = await fetchNewsPosts();
        if (mounted) {
          // Format data to match carousel structure
          const formattedData = data.slice(0, 5).map((article) => ({
            id: article.id,
            title: article.title,
            category: article.category || 'Tin tức',
            date: formatDate(article.date),
            slug: `/tin-tuc/${article.id}`,
            tags: ['#TinTuc', '#HTO'], // Default tags since API doesn't return them
            mainImage: article.image || 'assets/images/banner-second.jpg',
            gallery: [
              article.image || 'assets/images/hito_2.png',
              'assets/images/hito_3.png',
              'assets/images/hito_4.png',
              'assets/images/Artboard1.png'
            ]
          }));
          setNews(formattedData);
        }
      } catch (error) {
        console.error('Failed to fetch featured news:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadNews();
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto my-12 animate-pulse px-4">
        <div className="h-[400px] bg-slate-200 dark:bg-slate-800 rounded-xl w-full"></div>
      </div>
    );
  }

  if (news.length === 0) return null;

  return (
    <div className="w-full max-w-[1600px] mx-auto my-12 px-2 md:px-4 relative steam-carousel-container">
      <style>{`
        .steam-carousel-container .swiper {
          padding-bottom: 50px;
          padding-top: 10px;
          overflow: visible !important;
        }
        .steam-carousel-container .swiper-slide {
          transition: all 0.4s ease;
          opacity: 0.4;
          transform: scale(0.96);
          filter: grayscale(40%) brightness(30%);
        }
        .steam-carousel-container .swiper-slide-active {
          opacity: 1;
          transform: scale(1);
          z-index: 10;
          filter: grayscale(0%) brightness(100%);
          box-shadow: 0 20px 40px rgba(0,0,0,0.5);
        }
        .steam-carousel-container .swiper-button-next,
        .steam-carousel-container .swiper-button-prev {
          color: #fff;
          background: rgba(0, 0, 0, 0.5);
          width: 44px;
          height: 72px;
          border-radius: 6px;
          backdrop-filter: blur(4px);
          transition: background 0.2s, transform 0.2s;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .steam-carousel-container .swiper-button-next:hover,
        .steam-carousel-container .swiper-button-prev:hover {
          background: rgba(11, 111, 179, 0.9);
          transform: scale(1.05);
        }
        .steam-carousel-container .swiper-button-next:after,
        .steam-carousel-container .swiper-button-prev:after {
          font-size: 20px;
          font-weight: bold;
        }
        /* Keep arrows inside container but on edges */
        .steam-carousel-container .swiper-button-prev {
          left: 10px;
        }
        .steam-carousel-container .swiper-button-next {
          right: 10px;
        }
        .steam-carousel-container .swiper-pagination-bullet {
          width: 32px;
          height: 4px;
          border-radius: 2px;
          background: #cbd5e1;
          opacity: 1;
          transition: all 0.3s ease;
        }
        .steam-carousel-container .swiper-pagination-bullet-active {
          background: #0b6fb3;
          width: 48px;
        }
      `}</style>
      
      <div className="mb-5 px-2 md:px-6">
        {/* First Row: Main Heading and View All button */}
        <div className="flex justify-between items-end mb-2">
          <h2 className="font-black uppercase text-2xl md:text-4xl m-0 leading-none" style={{ color: isDark ? "#f8fafc" : "#1e293b", letterSpacing: "0.5px" }}>
            TIN TỨC & SỰ KIỆN
          </h2>
          <button
            className="flex items-center gap-1.5 font-semibold transition-colors bg-transparent border-none p-0 cursor-pointer"
            onClick={(e) => onNavigate && onNavigate('tintuc')}
            style={{
              color: isDark ? "#94a3b8" : "#64748b",
              fontSize: "15px",
            }}
            onMouseOver={(e) => e.currentTarget.style.color = "#0b6fb3"}
            onMouseOut={(e) => e.currentTarget.style.color = isDark ? "#94a3b8" : "#64748b"}
          >
            Xem tất cả <span aria-hidden="true">&rarr;</span>
          </button>
        </div>
        
        {/* Second Row: Sub-heading (Stylized) */}
        <h4 className="font-bold uppercase text-base md:text-lg m-0 inline-block relative" style={{ color: "#0b6fb3", letterSpacing: "1px" }}>
          NỔI BẬT & ĐỀ XUẤT
          {/* Subtle underline for active tab look */}
          <div className="absolute -bottom-1.5 left-0 w-3/4 h-[3px] bg-[#0b6fb3] rounded-full"></div>
        </h4>
      </div>

      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        spaceBetween={20}
        slidesPerView={1.05}
        centeredSlides={true}
        navigation={true}
        pagination={{ clickable: true }}
        autoplay={{ delay: 6000, disableOnInteraction: false }}
        loop={true}
        breakpoints={{
          768: { slidesPerView: 1.15, spaceBetween: 24 },
          1280: { slidesPerView: 1.25, spaceBetween: 30 }
        }}
        slideToClickedSlide={true}
        className="w-full"
      >
        {news.map((item) => (
          <SwiperSlide key={item.id}>
            {({ isActive }) => (
              <div 
                className={`rounded-2xl overflow-hidden ${isActive ? 'cursor-pointer' : 'cursor-default'}`}
                onClick={(e) => {
                  if (isActive && onNavigate) {
                    onNavigate('tintuc', { articleId: item.id });
                  }
                }}
              >
                <div className="flex flex-col md:flex-row h-full min-h-[420px] md:h-[460px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xl group">
              
              {/* Left Side: Main Image (65%) */}
              <div className="md:w-[65%] h-[250px] md:h-full relative overflow-hidden bg-slate-900">
                <img 
                  src={item.mainImage || 'assets/images/banner-second.jpg'} 
                  alt={item.title} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                  onError={(e) => { e.target.src = 'assets/images/banner-second.jpg'; }}
                />
                
                {/* Steam-style gradient fade into the right panel */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-white dark:to-slate-900 hidden md:block" style={{ width: '100%', right: 0, left: 'auto', background: isDark ? 'linear-gradient(to right, transparent 75%, #0f172a 100%)' : 'linear-gradient(to right, transparent 75%, #ffffff 100%)' }}></div>
              </div>

              {/* Right Side: Content Panel (35%) */}
              <div className="md:w-[35%] p-5 md:p-6 lg:p-8 flex flex-col justify-between bg-white dark:bg-slate-900 z-10 relative border-l border-slate-100 dark:border-slate-800/50">
                
                {/* Top: Title & Meta */}
                <div>
                  <h2 className="text-xl md:text-2xl lg:text-[26px] font-bold leading-snug mb-3 text-slate-800 dark:text-slate-100 line-clamp-3">
                    {item.title}
                  </h2>
                  <div className="flex items-center gap-3 text-xs font-semibold mb-5 text-slate-500 dark:text-slate-400">
                    <span className="px-2 py-1 rounded bg-[#0b6fb3]/10 text-[#0b6fb3] uppercase tracking-wider">
                      {item.category}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar size={14} />
                      {item.date}
                    </span>
                  </div>
                </div>

                {/* Middle: 2x2 Grid of Thumbnails (The Steam Aesthetic) */}
                <div className="grid grid-cols-2 gap-2 mb-5 hidden sm:grid">
                  {item.gallery.slice(0, 4).map((thumb, idx) => (
                    <div key={idx} className="aspect-[4/3] rounded-md overflow-hidden bg-slate-200 dark:bg-slate-800 relative group/thumb cursor-pointer">
                      <img 
                        src={thumb || 'assets/images/banner-second.jpg'} 
                        alt="gallery" 
                        className="w-full h-full object-cover transition-opacity duration-300 opacity-90 group-hover/thumb:opacity-100"
                        onError={(e) => { e.target.src = 'assets/images/banner-second.jpg'; }}
                      />
                      {/* Play icon overlay if it were a video (optional aesthetic) */}
                      {idx === 0 && (
                         <div className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                            <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                              <ChevronRight size={16} className="text-black ml-0.5" />
                            </div>
                         </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Bottom: Tags & CTA */}
                <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center flex-wrap gap-2 mb-5">
                    <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wide flex items-center gap-1 mr-1">
                      <Tag size={12} /> Phân loại:
                    </span>
                    {item.tags.map(tag => (
                      <span key={tag} className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-[#0b6fb3] hover:text-white transition-colors">
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex justify-between items-end">
                    <div className="text-[11px] font-medium text-slate-400 max-w-[120px] leading-tight hidden md:block">
                      Dành riêng cho bạn dựa trên lịch sử xem
                    </div>
                    <button 
                      className="flex items-center justify-center gap-1 bg-[#0b6fb3] hover:bg-[#074b80] text-white px-5 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all font-semibold text-sm w-full md:w-auto"
                      onClick={(e) => { e.stopPropagation(); onNavigate && onNavigate('tintuc', { articleId: item.id }); }}
                    >
                      Đọc tiếp <ChevronRight size={16} />
                    </button>
                  </div>
                </div>

              </div>
            </div>
            </div>
            )}
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};
