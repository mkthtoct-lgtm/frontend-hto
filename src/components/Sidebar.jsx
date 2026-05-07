export const Sidebar = ({ onNavigate, currentPage }) => {
    return (
        <aside className="app-menubar" id="menubar">
        <button className="app-toggler" type="button">
          <i className="fi fi-br-angle-small-left"></i>
        </button>
        <div className="app-navbar-brand">
          <a className="navbar-brand-logo" href="index-2.html">
            <img
              src="/assets/images/logo-HTO.png"
              alt="UrbanHub Admin Dashboard"
              width="40"
              height="40"
            />
          </a>
          <a className="navbar-brand-mini visible-light" href="index-2.html">
            <img src="/assets/images/logo-text.svg" alt="UrbanHub Admin Dashboard" />
          </a>
          <a className="navbar-brand-mini visible-dark" href="index-2.html">
            <img src="/assets/images/logo-text-white.svg" alt="UrbanHub Admin Dashboard" />
          </a>
        </div>
        <nav className="app-navbar" data-simplebar>
          <ul className="menubar">
            <li className="menu-item menu-arrow">
              <a
                className={`menu-link ${currentPage === "dashboard" ? "active" : ""}`}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate?.("dashboard");
                }}
              >
                <i className="icon-house"></i>
                <span className="menu-label">Dashboard</span>
              </a>
              <ul className="menu-inner">
                <li className="menu-item">
                  <a
                    className={`menu-link ${currentPage === "dashboard" ? "active" : ""}`}
                    href="index-2.html"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate?.("dashboard");
                    }}
                  >
                    <span className="menu-label">Dashboard</span>
                  </a>
                </li>
                <li className="menu-item">
                  <a className="menu-link" href="index-3.html">
                    <span className="menu-label">Agent Dashboard</span>
                  </a>
                </li>
                <li className="menu-item">
                  <a className="menu-link" href="index-4.html">
                    <span className="menu-label">Analytics Dashboard</span>
                  </a>
                </li>
                <li className="menu-item">
                  <a className="menu-link" href="add-agent.html">
                    <span className="menu-label">Add Agents</span>
                  </a>
                </li>
                <li className="menu-item">
                  <a className="menu-link" href="all-agents.html">
                    <span className="menu-label">All Agents</span>
                  </a>
                </li>
                <li className="menu-item">
                  <a className="menu-link" href="agent-profile.html">
                    <span className="menu-label">Agent Profile</span>
                  </a>
                </li>
                <li className="menu-item">
                  <a className="menu-link" href="add-property.html">
                    <span className="menu-label">Add Property</span>
                  </a>
                </li>
                <li className="menu-item">
                  <a className="menu-link" href="property-list.html">
                    <span className="menu-label">Property List</span>
                  </a>
                </li>
                <li className="menu-item">
                  <a className="menu-link" href="property-grid.html">
                    <span className="menu-label">Property Grid</span>
                  </a>
                </li>
                <li className="menu-item">
                  <a className="menu-link" href="property-details.html">
                    <span className="menu-label">Property Details</span>
                  </a>
                </li>
              </ul>
            </li>
            {/* <li className="menu-item">
              <a className="menu-link" href="chat.html">
                <i className="icon-message-square-text"></i>
                <span className="menu-label">Chat</span>
              </a>
            </li>
            <li className="menu-item">
              <a className="menu-link" href="calendar.html">
                <i className="icon-calendar-days"></i>
                <span className="menu-label">Calendar</span>
              </a>
            </li> */}

            {/* <li className="menu-item menu-arrow">
              <a
                className="menu-link"
                href="#"
                role="button"
              >
                <i className="icon-mail-open"></i>
                <span className="menu-label">Email</span>
              </a>
              <ul className="menu-inner">
                <li className="menu-item">
                  <a className="menu-link" href="email/inbox.html">
                    <span className="menu-label">Inbox</span>
                  </a>
                </li>
                <li className="menu-item">
                  <a className="menu-link" href="email/compose.html">
                    <span className="menu-label">Compose</span>
                  </a>
                </li>
                <li className="menu-item">
                  <a className="menu-link" href="email/read-email.html">
                    <span className="menu-label">Read email</span>
                  </a>
                </li>
              </ul>
            </li> */}

            {/* <li className="menu-item menu-arrow">
              <a className="menu-link" href="#" role="button">
                <i className="icon-file"></i>
                <span className="menu-label">Pages</span>
              </a>
              <ul className="menu-inner">
                <li className="menu-item">
                  <a className="menu-link" href="pages/pricing.html">
                    <span className="menu-label">Pricing</span>
                  </a>
                </li>
                <li className="menu-item">
                  <a className="menu-link" href="pages/faq.html">
                    <span className="menu-label">FAQ's</span>
                  </a>
                </li>
                <li className="menu-item">
                  <a className="menu-link" href="pages/coming-soon.html">
                    <span className="menu-label">Coming Soon</span>
                  </a>
                </li>
                <li className="menu-item">
                  <a className="menu-link" href="pages/error-404.html">
                    <span className="menu-label">Error 404</span>
                  </a>
                </li>
              </ul>
            </li>  */}

            {/* <li className="menu-item menu-arrow">
              <a className="menu-link" href="#" role="button">
                <i className="icon-circle-user-round"></i>
                <span className="menu-label">Authentication</span>
              </a>
              <ul className="menu-inner">
                <li className="menu-item">
                  <a className="menu-link" href="authentication/login.html">
                    <span className="menu-label">Login</span>
                  </a>
                </li>
                <li className="menu-item">
                  <a className="menu-link" href="authentication/register.html">
                    <span className="menu-label">Register</span>
                  </a>
                </li>
                <li className="menu-item">
                  <a className="menu-link" href="authentication/forgot-password.html">
                    <span className="menu-label">Forgot Password</span>
                  </a>
                </li>
                <li className="menu-item">
                  <a className="menu-link" href="authentication/new-password.html">
                    <span className="menu-label">New Password</span>
                  </a>
                </li>
              </ul>
            </li> */}
            
            {/* <li className="menu-item menu-arrow">
              <a className="menu-link" href="#" role="button">
                <i className="icon-folder-open"></i>
                <span className="menu-label">UI Components</span>
              </a>
              <ul className="menu-inner">
                <li className="menu-item">
                  <a className="menu-link" href="components/accordion.html">
                    <span className="menu-label">Accordion</span>
                  </a>
                </li>
                <li className="menu-item">
                  <a className="menu-link" href="components/alerts.html">
                    <span className="menu-label">Alerts</span>
                  </a>
                </li>
                <li className="menu-item">
                  <a className="menu-link" href="components/badge.html">
                    <span className="menu-label">Badge</span>
                  </a>
                </li>
                <li className="menu-item">
                  <a className="menu-link" href="components/breadcrumb.html">
                    <span className="menu-label">Breadcrumb</span>
                  </a>
                </li>
                <li className="menu-item">
                  <a className="menu-link" href="components/buttons.html">
                    <span className="menu-label">Buttons</span>
                  </a>
                </li>
                <li className="menu-item">
                  <a className="menu-link" href="components/typography.html">
                    <span className="menu-label">Typography</span>
                  </a>
                </li>
                <li className="menu-item">
                  <a className="menu-link" href="components/button-group.html">
                    <span className="menu-label">Button Group</span>
                  </a>
                </li>
                <li className="menu-item">
                  <a className="menu-link" href="components/card.html">
                    <span className="menu-label">Card</span>
                  </a>
                </li>
                <li className="menu-item">
                  <a className="menu-link" href="components/collapse.html">
                    <span className="menu-label">Collapse</span>
                  </a>
                </li>
                <li className="menu-item">
                  <a className="menu-link" href="components/carousel.html">
                    <span className="menu-label">Carousel</span>
                  </a>
                </li>
                <li className="menu-item">
                  <a className="menu-link" href="components/dropdowns.html">
                    <span className="menu-label">Dropdowns</span>
                  </a>
                </li>
                <li className="menu-item">
                  <a className="menu-link" href="components/modal.html">
                    <span className="menu-label">Modal</span>
                  </a>
                </li>
                <li className="menu-item">
                  <a className="menu-link" href="components/list-group.html">
                    <span className="menu-label">List Group</span>
                  </a>
                </li>
                <li className="menu-item">
                  <a className="menu-link" href="components/tabs.html">
                    <span className="menu-label">Tabs</span>
                  </a>
                </li>
                <li className="menu-item">
                  <a className="menu-link" href="components/offcanvas.html">
                    <span className="menu-label">Offcanvas</span>
                  </a>
                </li>
                <li className="menu-item">
                  <a className="menu-link" href="components/pagination.html">
                    <span className="menu-label">Pagination</span>
                  </a>
                </li>
                <li className="menu-item">
                  <a className="menu-link" href="components/popovers.html">
                    <span className="menu-label">Popovers</span>
                  </a>
                </li>
                <li className="menu-item">
                  <a className="menu-link" href="components/progress.html">
                    <span className="menu-label">Progress</span>
                  </a>
                </li>
                <li className="menu-item">
                  <a className="menu-link" href="components/scrollspy.html">
                    <span className="menu-label">Scrollspy</span>
                  </a>
                </li>
                <li className="menu-item">
                  <a className="menu-link" href="components/spinners.html">
                    <span className="menu-label">Spinners</span>
                  </a>
                </li>
                <li className="menu-item">
                  <a className="menu-link" href="components/toasts.html">
                    <span className="menu-label">Toasts</span>
                  </a>
                </li>
                <li className="menu-item">
                  <a className="menu-link" href="components/tooltips.html">
                    <span className="menu-label">Tooltips</span>
                  </a>
                </li>
              </ul>
            </li> */}

            {/* <li className="menu-item menu-arrow">
              <a className="menu-link" href="#" role="button">
                <i className="icon-star"></i>
                <span className="menu-label">Icons</span>
              </a>
              <ul className="menu-inner">
                <li className="menu-item">
                  <a className="menu-link" href="icons/flaticon.html">
                    <span className="menu-label">Flaticon</span>
                  </a>
                </li>
                <li className="menu-item">
                  <a className="menu-link" href="icons/lucide.html">
                    <span className="menu-label">Lucide</span>
                  </a>
                </li>
                <li className="menu-item">
                  <a className="menu-link" href="icons/fontawesome.html">
                    <span className="menu-label">Font Awesome</span>
                  </a>
                </li>
              </ul>
            </li> */}

            {/* Tài Liệu & Biểu Mẫu */}
            <li className="menu-item menu-arrow">
              <a
                className={`menu-link ${currentPage === "documents" ? "active" : ""}`}
                href="#"
                role="button"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate?.("documents");
                }}
              >
                <i className="icon-file-text"></i>
                <span className="menu-label">Tài Liệu & Biểu Mẫu</span>
              </a>
              <ul className="menu-inner">
                <li className="menu-item">
                  <a className="menu-link" href="forms/form-elements.html">
                    <span className="menu-label">Form Elements</span>
                  </a>
                </li>
                <li className="menu-item">
                  <a className="menu-link" href="forms/form-floating.html">
                    <span className="menu-label">Form floating</span>
                  </a>
                </li>
                <li className="menu-item">
                  <a className="menu-link" href="forms/form-input-group.html">
                    <span className="menu-label">Form input group</span>
                  </a>
                </li>
                <li className="menu-item">
                  <a className="menu-link" href="forms/form-layout.html">
                    <span className="menu-label">Form layout</span>
                  </a>
                </li>
                <li className="menu-item">
                  <a className="menu-link" href="forms/form-validation.html">
                    <span className="menu-label">Form validation</span>
                  </a>
                </li>
                <li className="menu-item">
                  <a className="menu-link" href="forms/flatpickr.html">
                    <span className="menu-label">Flatpickr</span>
                  </a>
                </li>
                <li className="menu-item">
                  <a className="menu-link" href="forms/tagify.html">
                    <span className="menu-label">Tagify</span>
                  </a>
                </li>
              </ul>
            </li>

            {/* <li className="menu-item menu-arrow">
              <a className="menu-link" href="#" role="button">
                <i className="icon-table-2"></i>
                <span className="menu-label">Table</span>
              </a>
              <ul className="menu-inner">
                <li className="menu-item">
                  <a className="menu-link" href="table/tables-basic.html">
                    <span className="menu-label">Table</span>
                  </a>
                </li>
                <li className="menu-item">
                  <a className="menu-link" href="table/tables-datatable.html">
                    <span className="menu-label">Datatable</span>
                  </a>
                </li>
              </ul>
            </li>
            <li className="menu-item menu-arrow">
              <a className="menu-link" href="#" role="button">
                <i className="icon-chart-pie"></i>
                <span className="menu-label">Charts</span>
              </a>
              <ul className="menu-inner">
                <li className="menu-item">
                  <a className="menu-link" href="chart/apexchart.html">
                    <span className="menu-label">Apex Chart</span>
                  </a>
                </li>
                <li className="menu-item">
                  <a className="menu-link" href="chart/chartjs.html">
                    <span className="menu-label">Chart JS</span>
                  </a>
                </li>
              </ul>
            </li>
            <li className="menu-item menu-arrow">
              <a className="menu-link" href="#" role="button">
                <i className="icon-map-pinned"></i>
                <span className="menu-label">Maps</span>
              </a>
              <ul className="menu-inner">
                <li className="menu-item">
                  <a className="menu-link" href="maps/jsvectormap.html">
                    <span className="menu-label">JS Vector Map</span>
                  </a>
                </li>
                <li className="menu-item">
                  <a className="menu-link" href="maps/leaflet.html">
                    <span className="menu-label">Leaflet</span>
                  </a>
                </li>
              </ul>
            </li>
            <li className="menu-item">
              <a className="menu-link" href="#">
                <i className="icon-badge-percent"></i>
                <span className="menu-label">Badge</span>
                <span className="badge badge-sm rounded-pill bg-secondary ms-2 float-end">5</span>
              </a>
            </li>
            <li className="menu-item menu-arrow">
              <a className="menu-link" href="#" role="button">
                <i className="icon-layers"></i>
                <span className="menu-label">Multi Level</span>
              </a>
              <ul className="menu-inner">
                <li className="menu-item menu-arrow">
                  <a className="menu-link" href="#">
                    <span className="menu-label">Multi Level 2</span>
                  </a>
                  <ul className="menu-inner">
                    <li className="menu-item">
                      <a className="menu-link" href="#">
                        <span className="menu-label">Multi Level 3</span>
                      </a>
                    </li>
                    <li className="menu-item">
                      <a className="menu-link" href="#">
                        <span className="menu-label">Multi Level 3</span>
                      </a>
                    </li>
                    <li className="menu-item">
                      <a className="menu-link" href="#">
                        <span className="menu-label">Multi Level 3</span>
                      </a>
                    </li>
                  </ul>
                </li>
              </ul>
            </li> */}
          </ul>
        </nav>
        <div className="app-footer">
          <a href="pages/faq.html" className="btn btn-outline-light btn-shadow btn-app-nav w-100">
            <i className="fi fi-rs-interrogation text-primary"></i>
            <span className="nav-text">Help and Support</span>
          </a>
        </div>
      </aside>
    );
  };