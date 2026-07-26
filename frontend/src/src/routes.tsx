import { createBrowserRouter } from "react-router-dom";
import Landing from "./pages/Landing";
import Features from "./pages/Features";
import Docs from "./pages/Docs";
import Contact from "./pages/Contact";
import Pricing from "./pages/Pricing";
import Dashboard from "./pages/Dashboard";
import Charts from "./pages/Charts";
import Transactions from "./pages/Transactions";
import Webhooks from "./pages/Webhooks";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Register from "./pages/Register";
import {SessionChecker} from "../utils/sessionchecker";;

const router = createBrowserRouter([
  { path: "/", element: <Landing /> },
  { path: "/features", element: <Features /> },
  { path: "/docs", element: <Docs /> },
  { path: "/contact", element: <Contact /> },
  { path: "/pricing", element: <Pricing /> },
  {
    path: "/dashboard",
    element: (
      <SessionChecker>
        <Dashboard />{" "}
      </SessionChecker>
    ),
  },
  {
    path: "/charts",
    element: (
      <SessionChecker>
        {" "}
        <Charts />
      </SessionChecker>
    ),
  },
  {
    path: "/transactions",
    element: (
      <SessionChecker>
        {" "}
        <Transactions />
      </SessionChecker>
    ),
  },
  {
    path: "/webhooks",
    element: (
      <SessionChecker>
        {" "}
        <Webhooks />
      </SessionChecker>
    ),
  },
  {
    path: "/settings",
    element: (
      <SessionChecker>
        {" "}
        <Settings />
      </SessionChecker>
    ),
  },
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
]);

export default router;
