export const Header = ({ onToggleSidebar, onToggleTheme, onLogout }) => {
  return (
    <header className="app-header">
      <div className="app-header-inner">
        <div className="app-header-start">
          <button
            className="app-toggler"
            type="button"
            onClick={onToggleSidebar}
          >
            <i className="fi fi-br-angle-small-left"></i>
          </button>
          <div className="app-header-brand">
            <a className="navbar-brand-logo" href="index-2.html">
              <img
                src="/assets/images/logo-HTO.png"
                alt="UrbanHub Admin Dashboard"
                width="40"
                height="40"
              />
            </a>
            <a
              className="navbar-brand-mini visible-light"
              href="index-2.html"
              style={{ textDecoration: "none" }}
            >
              <span
                style={{
                  fontSize: "18px",
                  fontWeight: "bold",
                  color: "#003366",
                  display: "inline-block",
                  lineHeight: "30px",
                }}
              >
                HT OCEAN GROUP
              </span>
            </a>
          </div>
          <form
            className="d-none d-xl-flex align-items-center h-100 w-lg-250px w-xxl-300px position-relative"
            action="#"
          >
            <input
              type="text"
              className="form-control px-sm-3 bg-light"
              placeholder="Search anything"
            />
            <button
              type="button"
              className="btn btn-sm text-primary border-0 position-absolute end-0 me-3 p-0"
            >
              <i className="fi fi-rr-search"></i>
            </button>
          </form>
        </div>
        <div className="app-header-end">
          <div className="d-flex align-items-center gap-sm-1 gap-0 px-lg-2 px-sm-2 px-1">
            <div className="dropdown text-end">
              <a
                href="#"
                className="btn btn-icon btn-action-gray"
                data-bs-toggle="dropdown"
                data-bs-auto-close="outside"
                aria-expanded="true"
              >
                <i className="icon-bell">
                  <span className="visually-hidden">New alerts</span>
                </i>
              </a>
              <div className="dropdown-menu dropdown-menu-lg-end p-0 w-300px mt-2">
                <div className="px-3 py-3 border-bottom d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">
                    Notifications{" "}
                    <span className="badge badge-sm rounded-pill bg-primary ms-1">
                      9
                    </span>
                  </h6>
                  <i className="bi bi-x-lg cursor-pointer"></i>
                </div>
                <div className="p-2" style={{ height: "300px" }} data-simplebar>
                  <ul className="list-group list-group-hover list-group-smooth list-group-unlined">
                    <li className="list-group-item d-flex justify-content-between align-items-center">
                      <div className="avatar avatar-xs avatar-status-success rounded-circle me-1">
                        <img src="/assets/images/avatar/avatar2.webp" alt="" />
                      </div>
                      <div className="ms-2 me-auto">
                        <h6 className="mb-0">Emma Smith</h6>
                        <small className="text-body d-block">
                          Need to update the details.
                        </small>
                        <small className="text-muted position-absolute end-0 top-0 mt-2 me-3">
                          7 hr ago
                        </small>
                      </div>
                    </li>
                    <li className="list-group-item d-flex justify-content-between align-items-center">
                      <div className="avatar avatar-xs bg-success rounded-circle text-white">
                        D
                      </div>
                      <div className="ms-2 me-auto">
                        <h6 className="mb-0">Design Team</h6>
                        <small className="text-body d-block">
                          Check your shared folder.
                        </small>
                        <small className="text-muted position-absolute end-0 top-0 mt-2 me-3">
                          6 hr ago
                        </small>
                      </div>
                    </li>
                    <li className="list-group-item d-flex justify-content-between align-items-center">
                      <div className="avatar avatar-xs bg-dark rounded-circle text-white">
                        <i className="fi fi-rr-lock"></i>
                      </div>
                      <div className="ms-2 me-auto">
                        <h6 className="mb-0">Security Update</h6>
                        <small className="text-body d-block">
                          Password successfully set.
                        </small>
                        <small className="text-muted position-absolute end-0 top-0 mt-2 me-3">
                          5 hr ago
                        </small>
                      </div>
                    </li>
                    <li className="list-group-item d-flex justify-content-between align-items-center">
                      <div className="avatar avatar-xs bg-info rounded-circle text-white">
                        <i className="fi fi-rr-shopping-cart"></i>
                      </div>
                      <div className="ms-2 me-auto">
                        <h6 className="mb-0">Invoice #1432</h6>
                        <small className="text-body d-block">
                          has been paid Amount: $899.00
                        </small>
                        <small className="text-muted position-absolute end-0 top-0 mt-2 me-3">
                          5 hr ago
                        </small>
                      </div>
                    </li>
                    <li className="list-group-item d-flex justify-content-between align-items-center">
                      <div className="avatar avatar-xs bg-danger rounded-circle text-white">
                        R
                      </div>
                      <div className="ms-2 me-auto">
                        <h6 className="mb-0">Emma Smith</h6>
                        <small className="text-body d-block">
                          added you to Dashboard Analytics
                        </small>
                        <small className="text-muted position-absolute end-0 top-0 mt-2 me-3">
                          5 hr ago
                        </small>
                      </div>
                    </li>
                    <li className="list-group-item d-flex justify-content-between align-items-center">
                      <div className="avatar avatar-xs avatar-status-success rounded-circle me-1">
                        <img src="/assets/images/avatar/avatar3.webp" alt="" />
                      </div>
                      <div className="ms-2 me-auto">
                        <h6 className="mb-0">Olivia Clark</h6>
                        <small className="text-body d-block">
                          You can now view the “Report”.
                        </small>
                        <small className="text-muted position-absolute end-0 top-0 mt-2 me-3">
                          4 hr ago
                        </small>
                      </div>
                    </li>
                    <li className="list-group-item d-flex justify-content-between align-items-center">
                      <div className="avatar avatar-xs avatar-status-danger rounded-circle me-1">
                        <img src="/assets/images/avatar/avatar5.webp" alt="" />
                      </div>
                      <div className="ms-2 me-auto">
                        <h6 className="mb-0">Isabella Walker</h6>
                        <small className="text-body d-block">
                          @Isabella please review.
                        </small>
                        <small className="text-muted position-absolute end-0 top-0 mt-2 me-3">
                          2 hr ago
                        </small>
                      </div>
                    </li>
                  </ul>
                </div>
                <div className="p-2">
                  <a href="#" className="btn w-100 btn-primary">
                    View all notifications
                  </a>
                </div>
              </div>
            </div>
            <a
              href="email/inbox.html"
              className="btn btn-md btn-icon btn-action-gray"
            >
              <i className="icon-message-square-text"></i>
              <span className="visually-hidden">Inbox</span>
            </a>
            <a
              href="calendar.html"
              className="btn btn-md btn-icon btn-action-gray d-none d-sm-flex"
            >
              <i className="icon-calendar"></i>
              <span className="visually-hidden">Calendar</span>
            </a>
            <a
              href="#"
              className="btn btn-md btn-icon btn-action-gray theme-btn"
              onClick={onToggleTheme}
            >
              <i className="icon-sun-medium icon-light"></i>
              <i className="icon-moon icon-dark"></i>
            </a>
          </div>
          <div className="d-flex align-items-center gap-sm-2 gap-0 px-lg-2 px-sm-2 px-1">
            <div className="dropdown text-end">
              <a
                href="#"
                className="d-flex align-items-center py-2"
                data-bs-toggle="dropdown"
                data-bs-auto-close="outside"
                aria-expanded="true"
              >
                <div className="text-end me-2 d-none d-lg-inline-block">
                  <div className="fw-bold text-dark">Robert Brown</div>
                  <small className="text-body d-block lh-sm">
                    <i className="fi fi-rr-angle-down text-3xs me-1"></i>{" "}
                    Manager
                  </small>
                </div>
                <div className="avatar avatar-sm rounded-circle avatar-status-success">
                  <img src="/assets/images/avatar/avatar1.webp" alt="" />
                </div>
              </a>
              <ul className="dropdown-menu dropdown-menu-end w-225px mt-1">
                <li className="d-flex align-items-center p-2">
                  <div className="avatar avatar-sm rounded-circle">
                    <img src="/assets/images/avatar/avatar1.webp" alt="" />
                  </div>
                  <div className="ms-2">
                    <div className="fw-bold text-dark">John Carter </div>
                    <small className="text-body d-block lh-sm">
                      john@gamil.com
                    </small>
                  </div>
                </li>
                <li>
                  <div className="dropdown-divider my-1"></div>
                </li>
                <li>
                  <a
                    className="dropdown-item d-flex align-items-center gap-2"
                    href="profile.html"
                  >
                    <i className="fi fi-rr-user scale-1x"></i> View Profile
                  </a>
                </li>
                <li>
                  <a
                    className="dropdown-item d-flex align-items-center gap-2"
                    href="pages/faq.html"
                  >
                    <i className="fi fi-rs-interrogation scale-1x"></i> Help
                    Center
                  </a>
                </li>
                <li>
                  <a
                    className="dropdown-item d-flex align-items-center gap-2"
                    href="profile.html"
                  >
                    <i className="fi fi-rr-settings scale-1x"></i> Account
                    Settings
                  </a>
                </li>
                <li>
                  <a
                    className="dropdown-item d-flex align-items-center gap-2"
                    href="pages/pricing.html"
                  >
                    <i className="fi fi-rr-usd-circle scale-1x"></i> Upgrade
                    Plan
                  </a>
                </li>
                <li>
                  <div className="dropdown-divider my-1"></div>
                </li>
                <li>
                  <a
                    className="dropdown-item d-flex align-items-center gap-2 text-danger"
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      onLogout?.();
                    }}
                  >
                    <i className="fi fi-sr-exit scale-1x"></i> Log Out
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
