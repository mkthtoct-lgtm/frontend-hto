export const Footer = () => {
    return (
        <footer className="footer-wrapper">
        <div className="container-fluid">
          <div className="row g-3">
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
          </div>
        </div>
      </footer>
    );
  };