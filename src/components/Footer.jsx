export const Footer = () => {
    return (
        <footer className="footer-wrapper">
        <div className="container-fluid">
          {/* <div className="row g-3">
            <div className="col-md-8 text-center text-md-start">
              <p className="mb-0">© <span className="currentYear">2026</span> UrbanHub. Proudly powered by <a href="#">LayoutDrop</a>.</p>
            </div>
            <div className="col-md-4">
              <ul className="d-flex list-inline mb-0 gap-4 flex-wrap justify-content-center justify-content-md-end">
                <li>
                  <a className="text-body" href="index-2.html">Home</a>
                </li>
                <li>
                  <a className="text-body" href="pages/faq.html">Faq's</a>
                </li>
                <li>
                  <a className="text-body" href="pages/faq.html">Support</a>
                </li>
              </ul>
            </div>
          </div> */}
          {/* --- ROW 4: BOTTOM WIDGETS --- */}
            <div className="row gx-3">
              <div className="col-md-4 mb-3 mb-md-0">
                <div className="card border-0 h-100 position-relative overflow-hidden" style={{ borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", padding: "16px" }}>
                  <div className="d-flex align-items-center position-relative z-1">
                    <div className="me-3 d-flex align-items-center justify-content-center flex-shrink-0 text-warning">
                       <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2 19c0 .55-.45 1-1 1h-2c-.55 0-1-.45-1-1v-1h4v1z"/></svg>
                    </div>
                    <div className="flex-grow-1">
                      <h6 className="fw-bold mb-0 text-primary" style={{ fontSize: "14px" }}>HITO TIPS</h6>
                      <span className="text-body-secondary d-block mt-1" style={{ fontSize: "12px" }}>Bí kíp du học Đức</span>
                      <a href="#" className="text-decoration-none fw-bold mt-1 d-block text-primary" style={{ fontSize: "12px" }}>Xem ngay</a>
                    </div>
                  </div>
                  <img src="./assets/images/hito_4.png" alt="Mascot" className="position-absolute" style={{ width: "75px", height: "75px", right: "-10px", bottom: "-10px", objectFit: "cover", backgroundColor: "transparent" }} />
                </div>
              </div>
              
              <div className="col-md-4 mb-3 mb-md-0">
                <div className="card border-0 h-100 position-relative overflow-hidden" style={{ borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", padding: "16px" }}>
                  <div className="d-flex align-items-center position-relative z-1">
                    <div className="me-3 d-flex align-items-center justify-content-center flex-shrink-0 text-primary">
                       <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg>
                    </div>
                    <div className="flex-grow-1">
                      <h6 className="fw-bold mb-0 text-primary" style={{ fontSize: "14px" }}>LỊCH WEBINAR</h6>
                      <span className="text-body-secondary d-block mt-1" style={{ fontSize: "12px" }}>Hàng tuần cùng chuyên gia HTO</span>
                    </div>
                  </div>
                  <img src="./assets/images/hito_4.png" alt="Mascot" className="position-absolute" style={{ width: "75px", height: "75px", right: "-10px", bottom: "-10px", objectFit: "cover", backgroundColor: "transparent" }} />
                </div>
              </div>
              
              <div className="col-md-4">
                <div className="card border-0 h-100 position-relative overflow-hidden" style={{ borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", padding: "16px" }}>
                  <div className="d-flex align-items-center position-relative z-1">
                    <div className="me-3 d-flex align-items-center justify-content-center flex-shrink-0 text-primary">
                       <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                    </div>
                    <div className="flex-grow-1">
                      <h6 className="fw-bold mb-0 text-primary" style={{ fontSize: "14px" }}>CẬP NHẬT TIN TỨC MỚI</h6>
                      <span className="text-body-secondary d-block mt-1 text-truncate" style={{ fontSize: "12px", maxWidth: "160px" }}>Tin tức du học, visa, học bổng</span>
                      <a href="#" className="text-decoration-none fw-bold mt-1 d-block text-primary" style={{ fontSize: "12px" }}>Xem ngay</a>
                    </div>
                  </div>
                  <img src="./assets/images/hito_4.png" alt="Mascot" className="position-absolute" style={{ width: "75px", height: "75px", right: "-10px", bottom: "-10px", objectFit: "cover", backgroundColor: "transparent" }} />
                </div>
              </div>
            </div>
        </div>
      </footer>
    );
  };