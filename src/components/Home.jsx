import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";

import { HiOutlineViewList, HiShoppingBag } from "react-icons/hi";

import { BiCategoryAlt } from "react-icons/bi";
import { MdOutlinePayment } from "react-icons/md";

const CardLink = ({ to, icon: Icon, title, total, color }) => (
  <Link
    to={to}
    className="p-6  border border-gray-300 rounded-2xl shadow hover:bg-gray-200 hover:shadow-xl transition-all duration-300 flex items-center gap-4 transform hover:-translate-y-1"
  >
    <Icon size={36} className={`${color}`} />
    <div>
      <h5 className="mb-1 text-xl font-bold tracking-tight">{title}</h5>
      <p className="text-gray-400">Total: {total}</p>
    </div>
  </Link>
);

export default function Home() {
  const [totalVentas, setTotalVentas] = useState(0);

  const [totalProductos, setTotalProductos] = useState(0);

  const [totalCategorias, setTotalCategorias] = useState(0);
  const [totalMediosPago, setTotalMediosPago] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const ventasSnapshot = await getDocs(collection(db, "ventas"));

      const productosSnapshot = await getDocs(collection(db, "products"));

      const categoriasSnapshot = await getDocs(collection(db, "categorias"));
      const mediosPagoSnapshot = await getDocs(collection(db, "mediosDePago"));

      setTotalVentas(ventasSnapshot.size);

      setTotalProductos(productosSnapshot.size);

      setTotalCategorias(categoriasSnapshot.size);
      setTotalMediosPago(mediosPagoSnapshot.size);

      const productosData = productosSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const categoriaContador = {};
      ventasSnapshot.forEach((venta) => {
        venta.data().productos.forEach((p) => {
          const producto = productosData.find(
            (prod) => prod.id === p.productoId
          );
          const categoria = producto?.categoria || "sin categoría";
          categoriaContador[categoria] =
            (categoriaContador[categoria] || 0) + p.cantidad;
        });
      });

      const ventasPorMesTemp = {};
      ventasSnapshot.forEach((venta) => {
        const fecha = venta.data().fecha.toDate();
        const year = fecha.getFullYear();
        const month = fecha.getMonth(); // numérico: 0-11
        const key = `${year}-${month}`; // ejemplo: 2024-0, 2024-1

        if (!ventasPorMesTemp[key]) {
          ventasPorMesTemp[key] = { year, month, total: 0 };
        }
        ventasPorMesTemp[key].total += venta.data().total;
      });

      // Luego convertimos a array y ordenamos por year + month
      const meses = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];

      const ventasPorMesOrdenadas = Object.values(ventasPorMesTemp)
        .sort((a, b) => a.year - b.year || a.month - b.month)
        .map((item) => ({
          mes: `${meses[item.month]} ${item.year}`,
          total: item.total,
        }));

      setVentasPorMes(ventasPorMesOrdenadas);

      const tempData = {};
      ventasSnapshot.forEach((venta) => {
        const fecha = venta.data().fecha.toDate();
        const mes = fecha.toLocaleString("default", {
          month: "short",
          year: "numeric",
        });
        tempData[mes] = tempData[mes] || { mes, ventas: 0, compras: 0 };
        tempData[mes].ventas += venta.data().total;
      });
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
      </div>
    </div>
  );
}
