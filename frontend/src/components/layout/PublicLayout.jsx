import { Outlet } from "react-router-dom";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import "../../styles/site.css";

const PublicLayout = () => {
  return (
    <div className="site">
      <SiteHeader />
      <main>
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
};

export default PublicLayout;
