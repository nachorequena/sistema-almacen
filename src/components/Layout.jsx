import {
  Sidebar,
  SidebarItems,
  SidebarItemGroup,
  SidebarItem,
  SidebarLogo,
  Button,
  SidebarCollapse,
} from "flowbite-react";
import {
  HiOutlineViewList,
  HiHome,
  HiShoppingBag,
  HiArrowSmRight,
} from "react-icons/hi";
import { MdOutlinePayment } from "react-icons/md";

import { Link, Outlet, useLocation } from "react-router-dom";
import { FaUser } from "react-icons/fa";
import { MdOutlineWorkspaces } from "react-icons/md";
import { useAuth } from "../context/AuthContext";
import Swal from "sweetalert2";

export default function Layout() {
  const { pathname } = useLocation();
  const { cerrarSesion } = useAuth();

  // 🚀 Lógica clave: Determina si estamos en la vista de venta.
  // Usamos endsWith para que funcione incluso si hay subrutas (aunque no aplica aquí).
  const isVentaCreation = pathname.endsWith("/ventas/create");

  // Define el ancho del sidebar para usarlo en las clases condicionales.
  const sidebarWidthClass = "w-64";
  const sidebarHiddenClass = "w-0"; // Cuando está oculto

  const handleLogout = () => {
    Swal.fire({
      title: "¿Cerrar sesión?",
      text: "¿Estás seguro que quieres cerrar la sesión?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, cerrar sesión",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        cerrarSesion();
      }
    });
  };
  const getItemClass = (path) =>
    `hover:bg-gray-200 ${pathname === path ? "bg-gray-200 font-semibold" : ""}`;

  return (
    <div className="flex h-screen bg-gray-200 text-gray-900">
      {/* 🚀 SIDEBAR: Añade un estilo condicional para ocultar y una transición */}
      <Sidebar
        className={`border-r border-gray-300 bg-gray-200 transition-all duration-300 overflow-hidden flex-shrink-0 ${
          isVentaCreation ? sidebarHiddenClass : sidebarWidthClass
        }`}
        aria-label="Menú principal"
      >
        {/* ... Contenido del Sidebar sin cambios ... */}
        <SidebarLogo
          href="/"
          className="p-2 flex justify-center items-center transition transform hover:scale-105"
        >
          <span className="self-center whitespace-nowrap text-xl text-center font-extrabold text-red-600 ">
            Minimercado Junior's
          </span>
        </SidebarLogo>

        <SidebarItems>
          <SidebarItemGroup>
            <SidebarItem
              as={Link}
              to="/"
              icon={HiHome}
              className={getItemClass("/")}
            >
              Inicio
            </SidebarItem>
            <SidebarCollapse
              icon={HiShoppingBag}
              label={<span className="flex w-full justify-center">Ventas</span>}
              className="hover:bg-gray-200"
            >
              <SidebarItem
                as={Link}
                to="/ventas/create"
                className={getItemClass("/ventas/create")}
              >
                Registrar venta
              </SidebarItem>
              <SidebarItem
                as={Link}
                to="/ventas/estadisticas"
                className={getItemClass("/ventas/estadisticas")}
              >
                Estadisticas
              </SidebarItem>
              <SidebarItem
                as={Link}
                to="/ventas"
                className={getItemClass("/ventas")}
              >
                Transacciones
              </SidebarItem>
            </SidebarCollapse>
            <SidebarCollapse
              icon={HiOutlineViewList}
              label={
                <span className="flex w-full justify-center">Productos</span>
              }
              className="hover:bg-gray-200"
            >
              <SidebarItem
                as={Link}
                to="/productos"
                className={getItemClass("/productos")}
              >
                Lista de productos
              </SidebarItem>
              <SidebarItem
                as={Link}
                to="/categorias"
                className={getItemClass("/categorias")}
              >
                Categorias
              </SidebarItem>
              <SidebarItem
                as={Link}
                to="/productos/unidades-de-venta"
                className={getItemClass("/productos/unidades-de-venta")}
              >
                Unidades de venta
              </SidebarItem>
            </SidebarCollapse>

            <SidebarItem
              as={Link}
              to="/rubros"
              icon={MdOutlineWorkspaces}
              className={getItemClass("/rubros")}
            >
              Rubros
            </SidebarItem>

            <SidebarItem
              as={Link}
              to="/medios-de-pago"
              icon={MdOutlinePayment}
              className={getItemClass("/medios-de-pago")}
            >
              Medios de pago
            </SidebarItem>
            <SidebarItem
              as={Link}
              to="/gestion-usuarios"
              icon={FaUser}
              className={getItemClass("/gestion-usuarios")}
            >
              Gestion de usuarios
            </SidebarItem>
            <SidebarItem
              onClick={handleLogout}
              icon={HiArrowSmRight}
              className="hover:bg-gray-200 text-red-600 hover:cursor-pointer"
            >
              Cerrar sesión
            </SidebarItem>
          </SidebarItemGroup>
        </SidebarItems>
      </Sidebar>

      {/* 🚀 CONTENIDO PRINCIPAL: Ajusta el margen si el sidebar está visible. */}
      {/* Si el sidebar está oculto, el ml-64 (margen) desaparece, y el contenido ocupa todo el ancho. */}
      <main className="flex-1 p-4 overflow-y-auto bg-gray-50 transition-all duration-300">
        <Outlet />
      </main>
    </div>
  );
}
