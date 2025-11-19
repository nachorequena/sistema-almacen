// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import Swal from "sweetalert2";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null); // { usuario, rol, id }
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const data = localStorage.getItem("usuario");

    if (data) {
      const parsed = JSON.parse(data);

      // Duración de la sesión: 8 horas (en milisegundos)
      const EXPIRACION = 8 * 60 * 60 * 1000;

      if (Date.now() - parsed.loginTime > EXPIRACION) {
        // Expiró la sesión
        localStorage.removeItem("usuario");
        setUsuario(null);
      } else {
        setUsuario(parsed);
      }
    }

    setCargando(false);
  }, []);

  const login = (userData) => {
    localStorage.setItem("usuario", JSON.stringify(userData));
    setUsuario(userData);
  };
  const cerrarSesion = async () => {
    localStorage.removeItem("usuario");
    setUsuario(null);
    await signOut(auth);

    Swal.fire("Sesión cerrada", "", "success");
  };

  return (
    <AuthContext.Provider value={{ usuario, cargando, login, cerrarSesion }}>
      {!cargando && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
