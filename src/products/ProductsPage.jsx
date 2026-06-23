import { ProductOverviewPage } from "./ProductOverviewPage";
import { OnlineApplicationPage } from "./OnlineApplicationPage";

export function ProductsPage({ currentUser, currentPage, onNavigate }) {
  if (currentPage === "nophosoonline") {
    return <OnlineApplicationPage currentUser={currentUser} onNavigate={onNavigate} />;
  }
  return <ProductOverviewPage currentUser={currentUser} />;
}
