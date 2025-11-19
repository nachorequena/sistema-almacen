import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import bcrypt from "bcryptjs";
import { db } from "../firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useAuth } from "../context/AuthContext"; // ← IMPORTANTE

export default function Login() {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
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

    try {
      const q = query(
        collection(db, "usuarios"),
        where("usuario", "==", usuario.toLowerCase())
      );

      const resultado = await getDocs(q);

      if (resultado.empty) {
        return Swal.fire("Error", "Usuario no encontrado", "error");
      }

      const userData = resultado.docs[0].data();
      const passwordCorrecta = await bcrypt.compare(
        password,
        userData.password
      );

      if (!passwordCorrecta) {
        return Swal.fire("Error", "Contraseña incorrecta", "error");
      }

      if (!userData.activo) {
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
      console.error(error);
      Swal.fire("Error", "Hubo un problema al iniciar sesión", "error");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0f172a] text-white">
      <form
        onSubmit={handleLogin}
        className="bg-[#111827] p-6 rounded shadow-lg w-80"
      >
        <h2 className="text-2xl mb-4 text-center">Iniciar Sesión</h2>

        <label className="mb-2 text-sm font-medium flex justify-start">
          Usuario
        </label>
        <input
          type="text"
          placeholder="Ej: juanperez"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          required
          className="w-full mb-3 p-2 bg-[#1f2937] border border-gray-600 rounded"
        />

        <label className="mb-2 text-sm font-medium flex justify-start">
          Contraseña
        </label>
        <input
          type="password"
          placeholder="********"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full mb-3 p-2 bg-[#1f2937] border border-gray-600 rounded"
        />

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 p-2 rounded"
        >
          Ingresar
        </button>
      </form>
    </div>
  );
}
