import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import AdminApp from "./admin/AdminApp.jsx";
import "./styles.css";
import "./admin/admin.css";

function Root() {
  const [isAdmin, setIsAdmin] = useState(window.location.hash.startsWith("#admin"));

  useEffect(() => {
    const onHashChange = () => setIsAdmin(window.location.hash.startsWith("#admin"));
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return isAdmin ? <AdminApp /> : <App />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
