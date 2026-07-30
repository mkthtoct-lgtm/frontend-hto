import { Header } from "../components/Header";
import { Sidebar } from "../components/Sidebar";
import { Footer } from "../components/Footer";

const MainLayout = ({ children }) => {
  return (
    <div className="page-layout">
      <Header />
      <Sidebar />
      <main className="app-wrapper">
        <div className="container-fluid">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;