import { useAuth } from "../context/AuthContext";

export default function AdminRoute({ children }) {
  const { usuario } = useAuth();

  // Si no hay sesión → Login
  if (!usuario) return <Navigate to="/login" />;

  // Si está logueado pero NO es admin → ventas/create
  if (usuario.rol !== "admin") return <Navigate to="/ventas/create" />;

  return children;
}
