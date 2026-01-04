import '@ant-design/v5-patch-for-react-19';
import {
  createBrowserRouter,
  RouterProvider,
  ScrollRestoration,
  useParams,
} from "react-router-dom";

// Layouts
import AdministratorLayout from "@layouts/AdministratorLayout.jsx";
import CustomerLayout from "@layouts/CustomerLayout.jsx";

import { UserProvider } from "@utils/UserContext";
import "./App.css";

// Public Pages
import V_HomepageView from "@pages/public/V_HomepageView.jsx";
import V_CatalogPageView from "@pages/public/V_CatalogPageView.jsx";
import V_ProductPageView from "@pages/public/V_ProductPageView.jsx";
import V_SearchPageView from "@pages/public/V_SearchPageView";

// Authentication Pages
import V_LoginPageView from "@pages/auth/V_LoginPageView.jsx";
import V_RegistrationFormView from "@pages/auth/V_RegistrationFormView.jsx";

// Customer Pages
import V_CartPageView from "@pages/customer/V_CartPageView.jsx";
import V_PaymentPageView from "@pages/customer/V_PaymentPageView.jsx";
import V_OrderPageView from "@pages/customer/V_OrderPageView.jsx";
import V_ReviewPageView from "@pages/customer/V_ReviewPageView.jsx";
import V_ProfilePageView from "@pages/customer/V_ProfilePageView.jsx";

// Admin Pages
import V_DashboardPageView from "@pages/admin/V_DashboardPageView.jsx";
import V_InventoryPageView from "@pages/admin/V_InventoryPageView.jsx";
import V_AddProductPageView from "@pages/admin/V_AddProductPageView.jsx";
import V_EditProductPageView from "@pages/admin/V_EditProductPageView.jsx";
import V_OrderDashboardView from "@pages/admin/V_OrderDashboardView.jsx";
import V_RefundPanelView from "@pages/admin/V_RefundPanelView.jsx";

// Wrapper components to extract URL params and pass as props
function CatalogPageWrapper() {
  const { brand } = useParams();
  return <V_CatalogPageView brand={brand} />;
}

function ProductPageWrapper() {
  const { id } = useParams();
  return <V_ProductPageView productId={id} />;
}

function EditProductPageWrapper() {
  const { id } = useParams();
  return <V_EditProductPageView productId={id} />;
}


const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <>
        <ScrollRestoration />
        <V_HomepageView />
      </>
    ),
  },
  {
    path: "/customer/login",
    element: (
      <>
        <ScrollRestoration />
        <V_LoginPageView />
      </>
    ),
  },
  {
    path: "/customer/place-order",
    element: (
      <>
        <ScrollRestoration />
        <V_PaymentPageView />
      </>
    ),
  },
  {
    path: "/register",
    element: (
      <>
        <ScrollRestoration />
        <V_RegistrationFormView />
      </>
    ),
  },
  {
    path: "/admin",
    element: (
      <>
        <ScrollRestoration />
        <AdministratorLayout />
      </>
    ),
    children: [
      { index: true, element: <V_DashboardPageView /> },
      { path: "dashboard", element: <V_DashboardPageView /> },
      { path: "inventory", element: <V_InventoryPageView /> },
      { path: "inventory/:brand", element: <V_InventoryPageView /> },
      { path: "products/add", element: <V_AddProductPageView /> },
      { path: "products/edit/:id", element: <EditProductPageWrapper /> },
      { path: "detail", element: <V_AddProductPageView /> },
      { path: "detail/:id", element: <EditProductPageWrapper /> },
      { path: "refund", element: <V_RefundPanelView /> },
      { path: "orders", element: <V_OrderDashboardView /> },
    ],
  },
  {
    path: "/customer",
    element: (
      <>
        <ScrollRestoration />
        <CustomerLayout />
      </>
    ),
    children: [
      { index: true, element: <V_ProfilePageView /> },
      { path: "accountInformation", element: <V_ProfilePageView /> },
      { path: "orders", element: <V_OrderPageView /> },
      { path: "productReviews", element: <V_ReviewPageView /> },
    ],
  },
  {
    path: "/laptops/:brand",
    element: (
      <>
        <ScrollRestoration />
        <CatalogPageWrapper />
      </>
    ),
  },
  {
    path: "/product/:id",
    element: (
      <>
        <ScrollRestoration />
        <ProductPageWrapper />
      </>
    ),
  },
  {
    path: "/shopping-cart",
    element: (
      <>
        <ScrollRestoration />
        <V_CartPageView />
      </>
    ),
  },
  {
    path: "/search",
    element: (
      <>
        <ScrollRestoration />
        <V_SearchPageView />
      </>
    ),
  }
]);

function App() {
  return (
    <UserProvider>
      <div>
        <RouterProvider router={router} />
      </div>
    </UserProvider>
  );
}

export default App;
