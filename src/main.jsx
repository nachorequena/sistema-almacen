import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";

createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);
//StrictMode Está comentado para evitar el doble renderizado en el desarrollo. agregar luego
// <StrictMode>
//   <AuthProvider>
//     <App />
//   </AuthProvider>
// </StrictMode>
