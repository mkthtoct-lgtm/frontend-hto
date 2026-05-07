import { useState } from "react";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { Footer } from "./components/Footer";
import { DocumentsPage } from "./components/DocumentsPage";

function App() {
  const [currentPage, setCurrentPage] = useState("dashboard");

  return (
    <div className="page-layout">
      {/* 1. Các thành phần cố định */}
      <Header />
      <Sidebar onNavigate={setCurrentPage} currentPage={currentPage} />

      {/* 2. Phần Main Content bạn vừa gửi */}
      <main className="app-wrapper">

      {currentPage === "documents" ? (
        <DocumentsPage />
      ) : (
      <div className="container-fluid">

        <div className="app-page-head d-flex flex-wrap gap-3 align-items-center justify-content-between">
          <div className="clearfix">
            <h1 className="app-page-title mb-0">Dashboard</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <a href="index-2.html" className="text-body">
                    <i className="fi fi-rr-home"></i>Home
                  </a>
                </li>
                <li className="breadcrumb-item active" aria-current="page">Dashboard</li>
              </ol>
            </nav>
          </div>
          <button type="button" className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#addPropertyModal">
            <i className="fi fi-rr-plus me-2"></i>Add Property
          </button>
        </div>

        <div className="row">

          <div className="col-xxl-6">
            <div className="card gradient-primary welcome-bx overflow-hidden border-0">
              <div className="card-body pb-0">
                <div className="row">
                  <div className="col-lg-5 col-md-5">
                    <div className="d-flex align-items-center mb-1">
                      <img src="/assets/images/icons/hand.svg" alt="" className="img-fluid me-2" />
                      <h3 className="mb-0 text-white">Hello, Robert Brown</h3>
                    </div>
                    <p className="mb-4">Track all property performance, availability, pricing trends, and occupancy easily</p>
                    <div className="rounded-2 p-3 bg-body mb-2">
                      <div className="d-flex align-items-center">
                        <div className="clearfix me-auto">
                          <h6>Total Properties</h6>
                          <h2 className="mb-0 fw-bold d-flex align-items-center">1,245 <span className="badge bg-success-subtle text-success rounded-pill ms-1">+8%</span>
                          </h2>
                        </div>
                        <div className="avatar avatar-md rounded-2 bg-primary-subtle text-primary">
                          <i className="fi fi-rr-apartment"></i>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-2 p-3 bg-body">
                      <div className="d-flex align-items-center">
                        <div className="clearfix me-auto">
                          <h6>Sold Properties</h6>
                          <h2 className="mb-0 fw-bold d-flex align-items-center">1,324 <span className="badge bg-success-subtle text-success rounded-pill ms-1">+2.3%</span>
                          </h2>
                        </div>
                        <div className="avatar avatar-md rounded-2 bg-secondary-subtle text-secondary">
                          <i className="fi fi-rr-mortgage"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-7 col-md-6">
                    <img src="/assets/images/house.png" alt="" className="img-fluid house" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-xxl-6">
            <div className="row">

              <div className="col-xxl-6 col-md-6">
                <div className="card">
                  <div className="card-header border-0 pb-0 d-flex justify-content-between align-items-center">
                    <h6 className="card-title mb-0">Total Client</h6>
                    <a href="all-agents.html" className="btn btn-sm btn-outline-primary">See Details</a>
                  </div>
                  <div className="card-body d-flex align-items-end justify-content-between pb-0 pt-1">
                    <div className="d-flex align-items-center mb-3">
                      <div className="avatar avatar-md rounded-2 bg-primary-subtle text-primary me-2">
                        <i className="fi fi-rr-apartment"></i>
                      </div>
                      <h2 className="fw-bold mb-0 me-2">1,175</h2>
                      <span className="badge badge-sm bg-success-subtle text-success">+8%</span>
                    </div>
                    <div id="Card1Chart" className="mx-n2 my-n4"></div>
                  </div>
                </div>
              </div>

              <div className="col-xxl-6 col-md-6">
                <div className="card">
                  <div className="card-header border-0 pb-0 d-flex justify-content-between align-items-center">
                    <h6 className="card-title mb-0">Total Leads</h6>
                    <a href="property-list.html" className="btn btn-sm btn-outline-secondary">See Details</a>
                  </div>
                  <div className="card-body d-flex align-items-end justify-content-between pb-0 pt-1">
                    <div className="d-flex align-items-center mb-3">
                      <div className="avatar avatar-md rounded-2 bg-secondary-subtle text-secondary me-2">
                        <i className="fi fi-rr-mortgage"></i>
                      </div>
                      <h2 className="fw-bold mb-0 me-2">1,024</h2>
                      <span className="badge badge-sm bg-success-subtle text-success">+5%</span>
                    </div>
                    <div id="Card2Chart" className="mx-n2 my-n2"></div>
                  </div>
                </div>
              </div>

              <div className="col-xxl-6 col-md-6">
                <div className="card">
                  <div className="card-header border-0 pb-0 d-flex justify-content-between align-items-center">
                    <h6 className="card-title mb-0">Active Agents</h6>
                    <a href="all-agents.html" className="btn btn-sm btn-outline-primary">See Details</a>
                  </div>
                  <div className="card-body d-flex align-items-end justify-content-between pb-0">
                    <div className="d-flex align-items-center mb-3">
                      <div className="avatar avatar-md rounded-2 bg-success-subtle text-success me-2">
                        <i className="fi fi-rr-users-alt"></i>
                      </div>
                      <h2 className="fw-bold mb-0 me-2">757</h2>
                      <span className="badge badge-sm bg-danger-subtle text-danger">-5%</span>
                    </div>
                    <div id="Card3Chart" className="mx-n2 my-n2"></div>
                  </div>
                </div>
              </div>

              <div className="col-xxl-6 col-md-6">
                <div className="card">
                  <div className="card-header border-0 pb-0 d-flex justify-content-between align-items-center">
                    <h6 className="card-title mb-0">New Clients</h6>
                  </div>
                  <div className="card-body d-flex align-items-end justify-content-between pb-0">
                    <div className="d-flex align-items-center mb-3">
                      <div className="avatar avatar-md rounded-2 bg-info-subtle text-info me-2">
                        <i className="fi fi-rr-heart-partner-handshake"></i>
                      </div>
                      <h2 className="fw-bold mb-0 me-2">524</h2>
                      <span className="badge badge-sm bg-danger-subtle text-danger">-2.1%</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <div className="col-xxl-6">
            <div className="card">
              <div className="card-header border-0 pb-0 d-flex align-items-center justify-content-between">
                <h6 className="card-title mb-0">Property Sales</h6>
                <div className="dropdown d-flex align-items-center gap-2">
                  <button className="btn dropdown-toggle btn-white btn-shadow btn-sm" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                    Today
                  </button>
                  <ul className="dropdown-menu">
                    <li>
                      <a className="dropdown-item" href="#">Today</a>
                    </li>
                    <li>
                      <a className="dropdown-item" href="#">Last Week</a>
                    </li>
                    <li>
                      <a className="dropdown-item" href="#">Last Month</a>
                    </li>
                    <li>
                      <a className="dropdown-item" href="#">Last Years</a>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="card-body pb-0 pt-2">
                <div className="mb-2 d-flex align-items-center gap-2">
                  <h2 className="mb-0 fw-bold">$345,783</h2>
                  <span className="text-success">+12.34%</span>
                </div>
                <div id="PropertySalesChart" className="mb-n3"></div>
              </div>
            </div>
          </div>

          <div className="col-xxl-6">
            <div className="card">
              <div className="card-header border-0 pb-0 d-flex align-items-center justify-content-between">
                <h6 className="card-title mb-0">Revenue Overview</h6>
                <div className="dropdown d-flex align-items-center gap-2">
                  <button className="btn dropdown-toggle btn-white btn-shadow btn-sm" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                    Today
                  </button>
                  <ul className="dropdown-menu">
                    <li>
                      <a className="dropdown-item" href="#">Today</a>
                    </li>
                    <li>
                      <a className="dropdown-item" href="#">Last Week</a>
                    </li>
                    <li>
                      <a className="dropdown-item" href="#">Last Month</a>
                    </li>
                    <li>
                      <a className="dropdown-item" href="#">Last Years</a>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="card-body pb-0 pt-2">
                <div className="mb-2 d-flex align-items-center gap-2">
                  <h2 className="mb-0 fw-bold">$236,423</h2>
                  <span className="text-danger">-10.34%</span>
                </div>
              </div>
              <div className="px-2">
                <div id="RevenueChart"></div>
              </div>
            </div>
          </div>

          <div className="col-xxl-8">
            <div className="card">
              <div className="card-header border-0 pb-0">
                <h6 className="card-title mb-0">Most Sales Location</h6>
              </div>
              <div className="card-body">
                <div className="row align-items-center justify-content-between">
                  <div className="col-xxl-8 col-xl-7">
                    <div id="jsVectorMap_Lines" className="jsvectormap"></div>
                  </div>
                  <div className="col-xxl-3 col-xl-4">
                    <ul className="list-group list-group-smooth list-group-space list-group-hover">
                      <li className="list-group-item rounded px-3 py-2">
                        <div className="d-flex align-items-center justify-content-between">
                          <div className="clearfix">
                            <h6 className="mb-0">Canada</h6>
                            <p className="text-body small mb-0">500 Unit</p>
                          </div>
                          <div className="clearfix">
                            <div id="Score1"></div>
                          </div>
                        </div>
                      </li>
                      <li className="list-group-item rounded px-3 py-2">
                        <div className="d-flex align-items-center justify-content-between">
                          <div className="clearfix">
                            <h6 className="mb-1">Brazil</h6>
                            <p className="text-body mb-0">600 Unit</p>
                          </div>
                          <div className="clearfix">
                            <div id="Score2"></div>
                          </div>
                        </div>
                      </li>
                      <li className="list-group-item rounded px-3 py-2">
                        <div className="d-flex align-items-center justify-content-between">
                          <div className="clearfix">
                            <h6 className="mb-1">China</h6>
                            <p className="text-body mb-0">700 Unit</p>
                          </div>
                          <div className="clearfix">
                            <div id="Score3"></div>
                          </div>
                        </div>
                      </li>
                      <li className="list-group-item rounded px-3 py-2">
                        <div className="d-flex align-items-center justify-content-between">
                          <div className="clearfix">
                            <h6 className="mb-1">Japan</h6>
                            <p className="text-body mb-0">450 Unit</p>
                          </div>
                          <div className="clearfix">
                            <div id="Score4"></div>
                          </div>
                        </div>
                      </li>
                      <li className="list-group-item rounded px-3 py-2">
                        <div className="d-flex align-items-center justify-content-between">
                          <div className="clearfix">
                            <h6 className="mb-1">Germany</h6>
                            <p className="text-body mb-0">350 Unit</p>
                          </div>
                          <div className="clearfix">
                            <div id="Score5"></div>
                          </div>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-xxl-4">
            <div className="card overflow-hidden">
              <div className="card-header border-0 d-flex align-items-center justify-content-between">
                <h6 className="card-title mb-0">Customer Review</h6>
                <div className="btn-group">
                  <button className="btn btn-action-primary btn-sm btn-icon btn-outline-light dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                    <i className="fi fi-bs-menu-dots"></i>
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end">
                    <li>
                      <a className="dropdown-item" href="#">Edit</a>
                    </li>
                    <li>
                      <a className="dropdown-item" href="#">Delete</a>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="card-body gradient-layer pt-0" style={{ height: "325px" }} data-simplebar>
                <div className="d-flex align-items-center border-bottom pb-3 mb-3">
                  <div className="me-3">
                    <img src="/assets/images/avatar/avatar1.webp" className="avatar avatar-xxl" alt="" />
                  </div>
                  <div className="clearfix w-100">
                    <h5 className="mb-1 fw-bold">Ethan Brown</h5>
                    <p className="mb-2">Highly recommend this service! The team was professional throughout.</p>
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex flex-wrap align-items-center gap-2">
                        <span className="text-1xs">Rating: (4.6)</span>
                        <div className="d-flex align-items-center gap-1">
                          <i className="fi fi-ss-star text-warning"></i>
                          <i className="fi fi-ss-star text-warning"></i>
                          <i className="fi fi-ss-star text-warning"></i>
                          <i className="fi fi-ss-star text-warning"></i>
                          <i className="fi fi-ss-star"></i>
                        </div>
                      </div>
                      <p className="mb-0 text-2xs">10h ago</p>
                    </div>
                  </div>
                </div>
                <div className="d-flex align-items-center border-bottom pb-3 mb-3">
                  <div className="me-3">
                    <img src="/assets/images/avatar/avatar2.webp" className="avatar avatar-xxl" alt="" />
                  </div>
                  <div className="clearfix w-100">
                    <h5 className="mb-1 fw-bold">Sophia Lee</h5>
                    <p className="mb-2">Great experience! Everything was smooth and the staff handled.</p>
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex flex-wrap align-items-center gap-2">
                        <span className="text-1xs">Rating: (4.8)</span>
                        <div className="d-flex align-items-center gap-1">
                          <i className="fi fi-ss-star text-warning"></i>
                          <i className="fi fi-ss-star text-warning"></i>
                          <i className="fi fi-ss-star text-warning"></i>
                          <i className="fi fi-ss-star text-warning"></i>
                          <i className="fi fi-ss-star text-warning"></i>
                        </div>
                      </div>
                      <p className="mb-0 text-2xs">1d ago</p>
                    </div>
                  </div>
                </div>
                <div className="d-flex align-items-center border-bottom pb-3 mb-3">
                  <div className="me-3">
                    <img src="/assets/images/avatar/avatar3.webp" className="avatar avatar-xxl" alt="" />
                  </div>
                  <div className="clearfix w-100">
                    <h5 className="mb-1 fw-bold">Liam Smith</h5>
                    <p className="mb-2">Impressed with the quick service and helpful customer support team.</p>
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex flex-wrap align-items-center gap-2">
                        <span className="text-1xs">Rating: (4.7)</span>
                        <div className="d-flex align-items-center gap-1">
                          <i className="fi fi-ss-star text-warning"></i>
                          <i className="fi fi-ss-star text-warning"></i>
                          <i className="fi fi-ss-star text-warning"></i>
                          <i className="fi fi-ss-star text-warning"></i>
                          <i className="fi fi-ss-star"></i>
                        </div>
                      </div>
                      <p className="mb-0 text-2xs">2d ago</p>
                    </div>
                  </div>
                </div>
                <div className="d-flex align-items-center border-bottom pb-3 mb-3">
                  <div className="me-3">
                    <img src="/assets/images/avatar/avatar2.webp" className="avatar avatar-xxl" alt="" />
                  </div>
                  <div className="clearfix w-100">
                    <h5 className="mb-1 fw-bold">Sophia Lee</h5>
                    <p className="mb-2">Great experience! Everything was smooth and the staff handled.</p>
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex flex-wrap align-items-center gap-2">
                        <span className="text-1xs">Rating: (4.8)</span>
                        <div className="d-flex align-items-center gap-1">
                          <i className="fi fi-ss-star text-warning"></i>
                          <i className="fi fi-ss-star text-warning"></i>
                          <i className="fi fi-ss-star text-warning"></i>
                          <i className="fi fi-ss-star text-warning"></i>
                          <i className="fi fi-ss-star text-warning"></i>
                        </div>
                      </div>
                      <p className="mb-0 text-2xs">1d ago</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        <div className="d-flex flex-wrap align-items-center justify-content-between mt-4 mb-3">
          <h5 className="mb-0">New Property Listings</h5>
          <button type="button" className="btn btn-sm btn-primary" data-bs-toggle="modal" data-bs-target="#addPropertyModal">
            Add New Property
          </button>
        </div>

        <div className="row">

          <div className="col-xxl-3 col-lg-6">
            <div className="card card-body p-2">
              <div className="rounded overflow-hidden mb-2">
                <img src="/assets/images/properties/pic1.jpg" alt="" className="w-100" />
              </div>
              <div className="clearfix p-2">
                <h5 className="mb-2 fw-bold">
                  <a href="property-details.html" className="text-dark stretched-link">Luxury Penthouse</a>
                </h5>
                <p className="mb-3">Elegant penthouse with modern design and stunning city views.</p>
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <span className="badge badge-lg bg-gray bg-opacity-10 text-dark d-flex align-items-center">
                    <i className="fi fi-rs-marker me-2"></i>Dubai, UAE
                  </span>
                  <span className="badge badge-lg bg-gray bg-opacity-10 text-dark d-flex align-items-center">
                    <i className="fi fi-rs-sack-dollar me-2"></i>$1,200,000
                  </span>
                  <span className="badge badge-lg bg-gray bg-opacity-10 text-dark d-flex align-items-center">
                    <i className="fi fi-sr-land-layers me-2"></i>2,350 sq.ft
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="col-xxl-3 col-lg-6">
            <div className="card card-body p-2">
              <div className="rounded overflow-hidden mb-2">
                <img src="/assets/images/properties/pic2.jpg" alt="" className="w-100" />
              </div>
              <div className="clearfix p-2">
                <h5 className="mb-2 fw-bold">
                  <a href="property-details.html" className="text-dark stretched-link">Modern Family Home</a>
                </h5>
                <p className="mb-3">Spacious family home featuring a garden, garage, and cozy interiors.</p>
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <span className="badge badge-lg bg-gray bg-opacity-10 text-dark d-flex align-items-center">
                    <i className="fi fi-rs-marker me-2"></i>Los Angeles, USA
                  </span>
                  <span className="badge badge-lg bg-gray bg-opacity-10 text-dark d-flex align-items-center">
                    <i className="fi fi-rs-sack-dollar me-2"></i>$420,000
                  </span>
                  <span className="badge badge-lg bg-gray bg-opacity-10 text-dark d-flex align-items-center">
                    <i className="fi fi-sr-land-layers me-2"></i>1,450 sq.ft
                  </span>
                  <span className="badge badge-lg bg-gray bg-opacity-10 text-dark d-flex align-items-center">
                    <i className="fi fi-rr-bed-alt me-2"></i>3 / 2
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="col-xxl-3 col-lg-6">
            <div className="card card-body p-2">
              <div className="rounded overflow-hidden mb-2">
                <img src="/assets/images/properties/pic3.jpg" alt="" className="w-100" />
              </div>
              <div className="clearfix p-2">
                <h5 className="mb-2 fw-bold">
                  <a href="property-details.html" className="text-dark stretched-link">Cozy Apartment</a>
                </h5>
                <p className="mb-3">Comfortable apartment ideal for couples, located near shopping and transport.</p>
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <span className="badge badge-lg bg-gray bg-opacity-10 text-dark d-flex align-items-center">
                    <i className="fi fi-rs-marker me-2"></i>New York, USA
                  </span>
                  <span className="badge badge-lg bg-gray bg-opacity-10 text-dark d-flex align-items-center">
                    <i className="fi fi-rs-sack-dollar me-2"></i>$250,000
                  </span>
                  <span className="badge badge-lg bg-gray bg-opacity-10 text-dark d-flex align-items-center">
                    <i className="fi fi-sr-land-layers me-2"></i>980 sq.ft
                  </span>
                  <span className="badge badge-lg bg-gray bg-opacity-10 text-dark d-flex align-items-center">
                    <i className="fi fi-rr-bed-alt me-2"></i>2 / 1
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="col-xxl-3 col-lg-6">
            <div className="card card-body p-2">
              <div className="rounded overflow-hidden mb-2">
                <img src="/assets/images/properties/pic4.jpg" alt="" className="w-100" />
              </div>
              <div className="clearfix p-2">
                <h5 className="mb-2 fw-bold">
                  <a href="property-details.html" className="text-dark stretched-link">Seaside Villa</a>
                </h5>
                <p className="mb-3">Beautiful seaside villa with private pool and ocean view balcony.</p>
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <span className="badge badge-lg bg-gray bg-opacity-10 text-dark d-flex align-items-center">
                    <i className="fi fi-rs-marker me-2"></i>Malibu, USA
                  </span>
                  <span className="badge badge-lg bg-gray bg-opacity-10 text-dark d-flex align-items-center">
                    <i className="fi fi-rs-sack-dollar me-2"></i>$850,000
                  </span>
                  <span className="badge badge-lg bg-gray bg-opacity-10 text-dark d-flex align-items-center">
                    <i className="fi fi-sr-land-layers me-2"></i>1,950 sq.ft
                  </span>
                  <span className="badge badge-lg bg-gray bg-opacity-10 text-dark d-flex align-items-center">
                    <i className="fi fi-rr-bed-alt me-2"></i>3 / 2
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>

        <div className="modal fade" id="addPropertyModal" tabIndex="-1" aria-labelledby="addPropertyModalLabel" aria-hidden="true">
          <div className="modal-dialog modal-xl modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="addPropertyModalLabel">Add New Property</h5>
                <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
              </div>
              <form>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Property Title</label>
                      <input type="text" className="form-control" placeholder="e.g. Luxury Villa" required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Property Type</label>
                      <select className="form-select" required defaultValue="">
                        <option value="" disabled>Select Type</option>
                        <option>Apartment</option>
                        <option>Villa</option>
                        <option>House</option>
                        <option>Office</option>
                        <option>Shop</option>
                        <option>Land</option>
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Price (₹)</label>
                      <input type="number" className="form-control" placeholder="e.g. 5000000" required />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Status</label>
                      <select className="form-select">
                        <option>For Sale</option>
                        <option>For Rent</option>
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Bedrooms</label>
                      <input type="number" className="form-control" placeholder="e.g. 3" />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Bathrooms</label>
                      <input type="number" className="form-control" placeholder="e.g. 2" />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Area (sq ft)</label>
                      <input type="number" className="form-control" placeholder="e.g. 1200" />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Garage</label>
                      <input type="number" className="form-control" placeholder="e.g. 1" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">City</label>
                      <input type="text" className="form-control" placeholder="e.g. Dubai" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Address</label>
                      <input type="text" className="form-control" placeholder="Full address" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Property Image</label>
                      <input type="file" className="form-control" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Gallery Images</label>
                      <input type="file" className="form-control" multiple />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Description</label>
                      <textarea className="form-control" rows="3" placeholder="Write property details..."></textarea>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light" data-bs-dismiss="modal">Cancel</button>
                  <button type="submit" className="btn btn-primary">Save Property</button>
                </div>
              </form>
            </div>
          </div>
        </div>

      </div>
      )}

    </main>

      {/* 3. Footer dùng chung */}
      <Footer />
    </div>
  );
}

export default App;