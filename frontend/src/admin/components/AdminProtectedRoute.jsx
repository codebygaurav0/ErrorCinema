import { Navigate } from "react-router-dom";

function AdminProtectedRoute({ children }) {
  const token = localStorage.getItem("errorcinema_admin_token");
  let user = null;

  try {
    user = JSON.parse(
      localStorage.getItem("errorcinema_admin_user") || "null"
    );
  } catch {
    localStorage.removeItem("errorcinema_admin_token");
    localStorage.removeItem("errorcinema_admin_user");
  }

  if (!token || user?.role !== "admin") {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

export default AdminProtectedRoute;
