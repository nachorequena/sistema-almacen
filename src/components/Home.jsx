import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";

import { HiOutlineViewList, HiShoppingBag } from "react-icons/hi";

import { BiCategoryAlt } from "react-icons/bi";
import { MdOutlinePayment } from "react-icons/md";
import { set } from "date-fns";
import { FaUser } from "react-icons/fa";
import { IoStatsChart } from "react-icons/io5";
import { MdOutlineWorkspaces } from "react-icons/md";
const CardLink = ({ to, icon: Icon, title, total, color }) => (
  <Link
    to={to}
    className="p-6  border border-gray-300 rounded-2xl shadow hover:bg-gray-200 hover:shadow-xl transition-all duration-300 flex items-center gap-4 transform hover:-translate-y-1"
  >
    <Icon size={36} className={`${color}`} />
    <div>
      <h5 className="mb-1 text-xl font-bold tracking-tight">{title}</h5>
      {total && <p className="text-gray-400">Total: {total}</p>}
    </div>
  </Link>
);

export default function Home() {
  const [totalVentas, setTotalVentas] = useState(0);
  const [totalRubros, setTotalRubros] = useState(0);
  const [totalProductos, setTotalProductos] = useState(0);
  const [totalUsuarios, setTotalUsuarios] = useState(0);
  const [totalCategorias, setTotalCategorias] = useState(0);
  const [totalMediosPago, setTotalMediosPago] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const ventasSnapshot = await getDocs(collection(db, "ventas"));
      const rubrosSnapshot = await getDocs(collection(db, "rubros"));
      const productosSnapshot = await getDocs(collection(db, "products"));
      const usuariosSnapshot = await getDocs(collection(db, "usuarios"));
      const categoriasSnapshot = await getDocs(collection(db, "categorias"));
      const mediosPagoSnapshot = await getDocs(collection(db, "mediosDePago"));

      setTotalVentas(ventasSnapshot.size);
      setTotalRubros(rubrosSnapshot.size);
      setTotalProductos(productosSnapshot.size);
      setTotalUsuarios(usuariosSnapshot.size);
      setTotalCategorias(categoriasSnapshot.size);
      setTotalMediosPago(mediosPagoSnapshot.size);
    };

    fetchData();
  }, []);

  return (
    <div className="max-w-6xl mx-auto mt-5 px-4 min-h-screen">
      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <CardLink
          to="/ventas"
          icon={HiShoppingBag}
          title="Ventas"
          total={totalVentas}
          color="text-green-400"
        />

        <CardLink
          to="/productos"
          icon={HiOutlineViewList}
          title="Productos"
          total={totalProductos}
          color="text-yellow-400"
        />

        <CardLink
          to="/categorias"
          icon={BiCategoryAlt}
          title="Categorías"
          total={totalCategorias}
          color="text-pink-400"
        />
        <CardLink
          to="/medios-de-pago"
          icon={MdOutlinePayment}
          title="Medios de Pago"
          total={totalMediosPago}
          color="text-red-400"
        />

        <CardLink
          to="/gestion-usuarios"
          icon={FaUser}
          title="Gestión de usuarios"
          total={totalUsuarios}
          color="text-blue-400"
        />

        <CardLink
          to="/ventas/estadisticas"
          icon={IoStatsChart}
          title="Estadísticas"
          color="text-purple-400"
        />

        <CardLink
          to="/rubros"
          icon={MdOutlineWorkspaces}
          title="Rubros"
          total={totalRubros}
          color="text-cyan-400"
        />
      </div>
    </div>
  );
}
