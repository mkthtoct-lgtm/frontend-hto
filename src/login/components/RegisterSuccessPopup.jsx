import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";

const SUCCESS_BACKGROUND_IMAGE = "/assets/images/BIA%20%C4%90S/BIA_HTO-02.png";

export const RegisterSuccessPopup = ({ customerName, onBackToLogin }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isOverlayActive, setIsOverlayActive] = useState(false);

  const images = [
    {
      id: 1,
      text: "Tư vấn 24/7",
      subLabel: "Hỗ trợ khẩn cấp",
      color: "linear-gradient(135deg, #074b80 0%, #0b6fb3 100%)",
      iconSvg: (className = "w-5 h-5") => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      )
    },
    {
      id: 2,
      text: "Hồ sơ Online",
      subLabel: "Nộp hồ sơ trực tuyến",
      color: "linear-gradient(135deg, #b71c1c 0%, #ef5350 100%)",
      iconSvg: (className = "w-5 h-5") => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      id: 3,
      text: "Du học Đức",
      subLabel: "Hệ nghề & Đại học",
      color: "linear-gradient(135deg, #003366 0%, #0055aa 100%)",
      iconSvg: (className = "w-5 h-5") => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-9-2v7a2 2 0 002 2h14a2 2 0 002-2v-7" />
        </svg>
      )
    },
    {
      id: 4,
      text: "Du học Hè",
      subLabel: "Trại hè tiếng Anh",
      color: "linear-gradient(135deg, #e65100 0%, #ffb74d 100%)",
      iconSvg: (className = "w-5 h-5") => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
        </svg>
      )
    },
    {
      id: 5,
      text: "Visa",
      subLabel: "Hồ sơ tỷ lệ đỗ cao",
      color: "linear-gradient(135deg, #2e7d32 0%, #81c784 100%)",
      iconSvg: (className = "w-5 h-5") => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    },
    {
      id: 6,
      text: "Định cư",
      subLabel: "Tư vấn định cư",
      color: "linear-gradient(135deg, #1b5e20 0%, #4caf50 100%)",
      iconSvg: (className = "w-5 h-5") => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
    {
      id: 7,
      text: "AI Trợ lý",
      subLabel: "Phỏng vấn & Dịch thuật",
      color: "linear-gradient(135deg, #4a148c 0%, #ab47bc 100%)",
      iconSvg: (className = "w-5 h-5") => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 113.536 0V21h2v-5.457a5 5 0 013.536 0z" />
        </svg>
      )
    },
    {
      id: 8,
      text: "Tài liệu tư vấn",
      subLabel: "Brochure & SOP",
      color: "linear-gradient(135deg, #d84315 0%, #ff8a65 100%)",
      iconSvg: (className = "w-5 h-5") => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    },
    {
      id: 9,
      text: "Lịch Webinar",
      subLabel: "Hội thảo tuyển sinh",
      color: "linear-gradient(135deg, #074b80 0%, #0288d1 100%)",
      iconSvg: (className = "w-5 h-5") => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      id: 10,
      text: "Cập nhật tin tức",
      subLabel: "Thông tin học bổng",
      color: "linear-gradient(135deg, #374151 0%, #78909c 100%)",
      iconSvg: (className = "w-5 h-5") => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
      )
    }
  ];

  // Auto rotate carousel every 3 seconds
  useEffect(() => {
    if (isTransitioning) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isTransitioning, images.length]);

  const triggerTransition = () => {
    setIsTransitioning(true);
    setIsOverlayActive(true);
    setTimeout(() => {
      onBackToLogin();
    }, 1100); // Trigger callback after animation completes
  };

  const modalElement = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <style>{`
        /* Modal card layout */
        .success-popup-modal-card {
          background-color: transparent;
          border-radius: 24px;
          width: 100%;
          max-width: 1024px;
          overflow: hidden;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25);
          position: relative;
          display: flex;
          flex-direction: column;
          animation: popup-scale-in 500ms cubic-bezier(0.34, 1.56, 0.64, 1);
          transition: transform 900ms cubic-bezier(0.4, 0, 0.2, 1), opacity 900ms ease;
        }

        .success-popup-modal-card.transition-out {
          transform: scale(0.85);
          opacity: 0;
          pointer-events: none;
        }

        @keyframes popup-scale-in {
          0% { transform: scale(0.8) translateY(20px); opacity: 0; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }

        .success-popup-grid {
          display: grid;
          grid-template-columns: 4.5fr 5.5fr; /* 45% left, 55% right */
          min-height: 480px;
        }

        @media (max-width: 767px) {
          .success-popup-grid {
            grid-template-columns: 1fr;
            min-height: auto;
          }
        }

        /* Content side styling */
        .success-popup-content-column {
          padding: 48px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          background: rgba(255, 255, 255, 0.82);
          backdrop-filter: blur(4px);
          border-radius: 24px 0 0 24px;
          box-shadow: 0 20px 25px -5px rgba(15, 23, 42, 0.10), 0 8px 10px -6px rgba(15, 23, 42, 0.10);
          z-index: 5;
          position: relative;
          overflow: hidden;
        }

        .success-popup-content-column::before {
          content: "";
          position: absolute;
          inset: 0;
          background: transparent;
          z-index: 0;
          pointer-events: none;
        }

        .success-popup-content-column > * {
          position: relative;
          z-index: 1;
        }

        @media (max-width: 576px) {
          .success-popup-content-column {
            padding: 28px;
          }
        }

        /* Carousel side styling (Exhibition area) */
        .success-popup-carousel-column {
          padding: 0; 
          background-image: url("${SUCCESS_BACKGROUND_IMAGE}");
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          display: flex;
          align-items: center;
          justify-content: center;
          border-left: 1px solid #e2e8f0;
          overflow: hidden;
          position: relative;
        }

        .success-popup-carousel-column::before {
          content: "";
          position: absolute;
          inset: 0;
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(3px);
          z-index: 1;
          pointer-events: none;
        }

        @media (max-width: 767px) {
          .success-popup-carousel-column {
            border-left: 0;
            border-top: 1px solid #e2e8f0;
            padding: 0;
            min-height: 320px;
          }
        }

        /* Orbital Stage & Container with offset center */
        .orbital-carousel-container {
          position: absolute;
          width: 540px;
          height: 540px;
          right: -240px; 
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
        }

        @media (max-width: 767px) {
          .orbital-carousel-container {
            right: auto;
            left: 50%;
            bottom: -230px;
            top: auto;
            transform: translateX(-50%);
          }
        }

        .orbital-orbit-line {
          position: absolute;
          width: 500px;
          height: 500px;
          border: 2px dashed rgba(0, 51, 102, 0.08);
          border-radius: 50%;
          pointer-events: none;
          animation: rotate-orbit 100s linear infinite;
        }

        @keyframes rotate-orbit {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Orbital nodes (Thumbnail cards style) */
        .orbital-node {
          position: absolute;
          width: 80px;
          height: 54px;
          border-radius: 12px;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0,0,0,0.12);
          border: 1.5px solid rgba(255, 255, 255, 0.45);
          overflow: hidden;
          
          /* Translate by radius 250px to circle path of 500px diameter */
          transform: rotate(var(--angle-deg)) translate(250px) rotate(calc(-1 * var(--angle-deg))) scale(var(--node-scale));
          transition: transform 800ms cubic-bezier(0.34, 1.56, 0.64, 1), 
                      width 800ms cubic-bezier(0.34, 1.56, 0.64, 1), 
                      height 800ms cubic-bezier(0.34, 1.56, 0.64, 1), 
                      opacity 800ms ease, 
                      filter 800ms ease, 
                      box-shadow 0.3s;
          opacity: var(--node-opacity);
          filter: grayscale(var(--node-grayscale)) blur(var(--node-blur));
          z-index: var(--node-zindex);
        }

        .orbital-node:hover {
          opacity: 0.95 !important;
          filter: none !important;
          box-shadow: 0 6px 16px rgba(0,0,0,0.18);
        }

        /* Active thumbnail card */
        .orbital-node.active {
          width: 140px; 
          height: 95px;
          border-color: rgba(255, 255, 255, 0.85);
          box-shadow: 0 12px 28px rgba(0, 51, 102, 0.22), 0 5px 15px rgba(0, 0, 0, 0.12);
        }

        /* Transition fullscreen zoom effects */
        .fullscreen-transition-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 1100;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }

        .animate-zoom-fill {
          animation: zoom-fill-run 1100ms cubic-bezier(0.7, 0, 0.3, 1) forwards;
        }

        @keyframes zoom-fill-run {
          0% {
            clip-path: circle(40px at 50% 50%);
            opacity: 0.3;
          }
          40% {
            opacity: 1;
          }
          100% {
            clip-path: circle(150% at 50% 50%);
            opacity: 1;
          }
        }

        .fullscreen-transition-content {
          animation: text-pop-up 800ms cubic-bezier(0.16, 1, 0.3, 1) 200ms forwards;
          opacity: 0;
          transform: translateY(20px);
        }

        @keyframes text-pop-up {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        .animate-fade-in {
          animation: fade-in-anim 600ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes fade-in-anim {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className={`success-popup-modal-card ${isTransitioning ? "transition-out" : ""}`}>
        <div className="success-popup-grid">
          {/* Left Side: Message and Action */}
          <div className="success-popup-content-column text-left">
            <h3 
              className="font-bold text-slate-900 mb-4 flex items-center flex-wrap gap-2 text-2xl" 
              style={{ letterSpacing: "-0.5px" }}
            >
              <span>Chúc mừng, <span className="text-indigo-600">{customerName}</span>!</span>
              <svg className="w-6 h-6 text-emerald-600 animate-[bounce_2s_infinite]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </h3>
            
            <p className="text-slate-500 mb-6 text-sm leading-relaxed">
              Tài khoản của bạn đã được khởi tạo thành công trên hệ thống nội bộ HTO. Bạn đã sẵn sàng để truy cập kho tài liệu tư vấn, thông tin chương trình và các trợ lý thông minh.
            </p>

            <button 
              className="py-3 px-6 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md flex items-center justify-center gap-2 transition-all duration-200 w-full"
              onClick={triggerTransition}
              style={{ fontSize: "14.5px" }}
            >
              Quay lại đăng nhập
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>

          {/* Right Side: Orbital Carousel */}
          <div className="success-popup-carousel-column">
            <div className="orbital-carousel-container">
              {/* Guidance dash line */}
              <div className="orbital-orbit-line"></div>

              {/* Orbiting nodes */}
              {images.map((img, idx) => {
                const isActive = idx === activeIndex;
                const angle = ((idx - activeIndex) * 360) / images.length + 180;
                
                const total = images.length;
                const diff = Math.abs(idx - activeIndex);
                const distance = Math.min(diff, total - diff);
                
                let scale = 0.7;
                let opacity = 0.3;
                let zIndex = 1;
                let blur = "1px";
                let grayscale = "60%";

                if (distance === 0) {
                  scale = 1.0;
                  opacity = 1.0;
                  zIndex = 10;
                  blur = "0px";
                  grayscale = "0%";
                } else if (distance === 1) {
                  scale = 0.95;
                  opacity = 0.75;
                  zIndex = 5;
                  blur = "0px";
                  grayscale = "15%";
                } else if (distance === 2) {
                  scale = 0.8;
                  opacity = 0.5;
                  zIndex = 3;
                  blur = "0.5px";
                  grayscale = "35%";
                }
                
                return (
                  <div
                    key={img.id}
                    className={`orbital-node ${isActive ? "active" : ""} relative overflow-hidden`}
                    style={{
                      "--angle-deg": `${angle}deg`,
                      "--node-scale": scale,
                      "--node-opacity": opacity,
                      "--node-zindex": zIndex,
                      "--node-blur": blur,
                      "--node-grayscale": grayscale,
                    }}
                    onClick={() => {
                      if (!isTransitioning) {
                        setActiveIndex(idx);
                      }
                    }}
                  >
                    {/* Visual Card Gradient - scalable container, can load custom image easily */}
                    <div 
                      className="absolute inset-0 z-0 transition-transform duration-500 hover:scale-105"
                      style={{ background: img.color }}
                    ></div>
                    {/* Dark gradient overlay for text readability */}
                    <div className="absolute inset-0 bg-black/40 z-1"></div>

                    {/* Node Content */}
                    <div className="relative z-10 flex flex-col items-center justify-center h-full text-white px-2">
                      <div className="mb-1 text-white">
                        {img.iconSvg(isActive ? "w-6 h-6" : "w-4 h-4")}
                      </div>
                      
                      <span 
                        className="font-bold text-white text-center text-truncate d-block w-100" 
                        style={{ fontSize: isActive ? "12px" : "10px", lineHeight: "1.2" }}
                      >
                        {img.text}
                      </span>

                      {isActive && (
                        <span 
                          className="text-white/80 text-center text-truncate d-block w-100 animate-fade-in" 
                          style={{ fontSize: "8.5px", marginTop: "2.5px", fontWeight: "normal" }}
                        >
                          {img.subLabel}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Screen zoom-fill transition */}
      {isOverlayActive && (
        <div 
          className="fullscreen-transition-overlay animate-zoom-fill"
          style={{
            backgroundColor: "#0b6fb3",
            backgroundImage: `linear-gradient(rgba(3, 37, 76, 0.22), rgba(3, 37, 76, 0.22)), url("${SUCCESS_BACKGROUND_IMAGE}")`,
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
          }}
        >
          <div className="fullscreen-transition-content text-center text-white p-6">
            <div className="mb-4 text-white flex justify-center">
              {images[activeIndex].iconSvg("w-20 h-20")}
            </div>
            <h1 className="text-4xl font-bold mb-2">{images[activeIndex].text}</h1>
            <h4 className="text-lg text-white/70 mb-6">{images[activeIndex].subLabel}</h4>
            <div className="flex justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/30 border-t-white"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return createPortal(modalElement, document.body);
};
