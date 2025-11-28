import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import bcrypt from "bcryptjs";
import { db } from "../firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useAuth } from "../context/AuthContext"; // ← IMPORTANTE
import { se } from "date-fns/locale";

export default function Login() {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { usuario: usuarioLogueado, login } = useAuth(); // ← usamos el contexto

  // 🚀 Si ya hay usuario logueado, redirigir automáticamente
  useEffect(() => {
    if (usuarioLogueado) {
      if (usuarioLogueado.rol === "empleado") {
        navigate("/ventas/create");
      } else {
        navigate("/");
      }
    }
  }, [usuarioLogueado, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loading) return; // prevenir múltiples envíos
    setLoading(true);

    try {
      const q = query(
        collection(db, "usuarios"),
        where("usuario", "==", usuario.toLowerCase())
      );

      const resultado = await getDocs(q);

      if (resultado.empty) {
        sertLoading(false);
        return Swal.fire("Error", "Usuario no encontrado", "error");
      }

      const userData = resultado.docs[0].data();
      const passwordCorrecta = await bcrypt.compare(
        password,
        userData.password
      );

      if (!passwordCorrecta) {
        setLoading(false);
        return Swal.fire("Error", "Contraseña incorrecta", "error");
      }

      if (!userData.activo) {
        setLoading(false);
        return Swal.fire(
          "Acceso denegado",
          "El usuario está deshabilitado",
          "warning"
        );
      }

      // 🚀 Guardar sesión con el CONTEXTO, no solo localStorage
      login({
        usuario: userData.usuario,
        rol: userData.rol,
        id: resultado.docs[0].id,
        loginTime: Date.now(),
      });
      setLoading(false);
      Swal.fire({
        title: `Hola ${userData.usuario.toUpperCase()}`,
        text: "Inicio de sesión correcto",
        icon: "success",
        timer: 1400,
        showConfirmButton: false,
      });

      // YA NO HACE navigate() ACÁ
      // La redirección la hace el useEffect cuando login() actualice el contexto
    } catch (error) {
      setLoading(false);
      console.error(error);
      Swal.fire("Error", "Hubo un problema al iniciar sesión", "error");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#8f8f91] via-[#fefeff] to-[#8f8f91]">
      <form
        onSubmit={handleLogin}
        className="bg-[#f7f7f7]/90 backdrop-blur-sm p-8 rounded-2xl shadow-2xl w-96 text-gray-900"
      >
        <h2 className="text-3xl font-semibold mb-6 text-center">
          Iniciar Sesión
        </h2>

        <label className="mb-1 text-sm font-medium text-gray-900 flex justify-start">
          Usuario
        </label>
        <input
          type="text"
          placeholder="Ej: juanperez"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          required
          disabled={loading}
          className="w-full mb-4 p-3 bg-[#eeeeff] border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />

        <label className="mb-1 text-sm font-medium text-gray-900 flex justify-start">
          Contraseña
        </label>
        <input
          type="password"
          placeholder="********"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
          className="w-full mb-4 p-3 bg-[#eeeeff] border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 p-3 rounded-lg font-medium transition-all duration-200 ease-in-out hover:cursor-pointer text-white disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
          aria-busy={loading}
        >
          {loading ? (
            <svg
              className="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              ></path>
            </svg>
          ) : (
            "Ingresar"
          )}
        </button>
      </form>
    </div>
  );
}
