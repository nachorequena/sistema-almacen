import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import {
  Card,
  Spinner,
  Select,
  Label,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableHeadCell,
  Badge,
} from "flowbite-react";
import {
  format,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
} from "date-fns";
import {
  FaDollarSign,
  FaChartLine,
  FaBox,
  FaPercentage,
  FaTags,
  FaStore,
} from "react-icons/fa";

// ************************************************************
// TU FUNCIÓN formatearVentas (SIN CAMBIOS, es solo para contexto)
// ************************************************************
const formatearVentas = (docs) => {
  return docs.map((doc) => {
    const data = doc.data();

    // Normalizar medios de pago (TU LÓGICA)
    const medioPago = Array.isArray(data.mediosPago)
      ? data.mediosPago.map((mp) =>
          typeof mp === "string"
            ? { nombre: mp, monto: null }
            : {
                nombre: mp.nombre ?? mp.id ?? "N/A",
                monto: mp.monto ?? null,
                recargoMonto: mp.recargoMonto ?? 0,
                montoBase: mp.monto ?? 0,
              }
        )
      : data.pagos
      ? data.pagos.map((p) => ({
          nombre: p.nombre,
          monto: p.montoConRecargo,
          montoBase: p.monto,
          recargoMonto: p.recargoMonto ?? 0,
        }))
      : data.mediosPago
      ? [
          typeof data.mediosPago === "string"
            ? {
                nombre: data.mediosPago,
                monto: null,
                montoBase: null,
                recargoMonto: 0,
              }
            : {
                nombre: data.mediosPago.nombre ?? data.mediosPago.id ?? "N/A",
                monto:
                  data.mediosPago.montoConRecargo ??
                  data.mediosPago.monto ??
                  null,
                montoBase: data.mediosPago.monto ?? null,
                recargoMonto: data.mediosPago.recargoMonto ?? 0,
              },
        ]
      : [];

    const items = [
      ...(data.products ?? data.productos ?? []),
      ...(data.rubros?.map((rubro) => ({
        descripcion: rubro.rubroNombre,
        cantidad: 1,
        precio: rubro.total,
        categoria: "Rubros",
        gananciaItem: rubro.total ?? 0,
      })) ?? []),
    ];

    return {
      id: doc.id,
      fecha: data.fecha.toDate(),
      totalBase: data.totalVenta ?? data.totalBase ?? 0,
      ganancia: data.ganancia ?? 0,
      medioPago,
      totalConRecargo: data.totalConRecargo ?? data.total ?? 0,
      recargoTotal: data.recargoTotal ?? 0,
      vuelto: data.vuelto ?? 0,
      items,
    };
  });
};
// ************************************************************

const Estadisticas = () => {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState("diario");
  // La fecha inicial es la de hoy
  const [fechaSeleccionada, setFechaSeleccionada] = useState(
    format(new Date(), "yyyy-MM-dd")
  );

  const [estadisticas, setEstadisticas] = useState({
    totalVentas: 0,
    gananciaTotal: 0,
    ventasCount: 0,
    mediosPago: {},
    topProductos: [],
    topRubros: [],
  });

  useEffect(() => {
    obtenerVentas();
  }, []);

  useEffect(() => {
    calcularEstadisticas();
  }, [ventas, periodo, fechaSeleccionada]);

  const obtenerVentas = async () => {
    try {
      setLoading(true);
      const snapshot = await getDocs(collection(db, "ventas"));
      const ventasData = formatearVentas(snapshot.docs);
      setVentas(ventasData);
    } catch (error) {
      console.error("Error al obtener las ventas:", error);
    } finally {
      setLoading(false);
    }
  };

  const getFechaIntervalo = () => {
    // CORRECCIÓN CLAVE 1: Agregamos T12:00:00 para forzar la interpretación en la zona horaria local.
    const today = new Date(fechaSeleccionada + "T12:00:00");

    if (periodo === "diario") {
      return {
        start: startOfDay(today),
        end: endOfDay(today),
      };
    } else {
      // mensual
      return {
        start: startOfMonth(today),
        end: endOfMonth(today),
      };
    }
  };

  const calcularEstadisticas = () => {
    if (ventas.length === 0) {
      setEstadisticas({
        totalVentas: 0,
        gananciaTotal: 0,
        ventasCount: 0,
        mediosPago: {},
        topProductos: [],
        topRubros: [],
      });
      return;
    }

    const { start, end } = getFechaIntervalo();

    // 1. Filtrar ventas por el período seleccionado
    const ventasFiltradas = ventas.filter((venta) => {
      // Obtenemos el inicio del día local de la venta para hacer una comparación segura 'día a día'.
      const fechaNormalizada = startOfDay(venta.fecha);
      return isWithinInterval(fechaNormalizada, { start, end });
    });

    let totalVentas = 0;
    let gananciaTotal = 0;
    const mediosPagoMap = {};
    const productosMap = {};
    const rubrosMap = {};

    ventasFiltradas.forEach((venta) => {
      totalVentas += venta.totalConRecargo;
      gananciaTotal += venta.ganancia;

      // 2. Acumular medios de pago (CORREGIDO)
      venta.medioPago.forEach((pago) => {
        if (pago.monto !== null) {
          let montoNeto = pago.monto; // 💡 AJUSTE CLAVE: Si hay vuelto (vuelto > 0) y el medio de pago es 'Efectivo', // se descuenta el vuelto del monto total ingresado por ese medio.

          if (venta.vuelto > 0 && pago.nombre === "efectivo") {
            // El monto neto ingresado es: (Monto Pagado - Vuelto)
            montoNeto = pago.monto - venta.vuelto;
          }
          // Nota: Si el vuelto es negativo (faltante), `venta.vuelto` es un número negativo,
          // y el cálculo sigue siendo correcto para el total de la venta.
          if (!mediosPagoMap[pago.nombre]) {
            mediosPagoMap[pago.nombre] = { count: 0, total: 0 };
          }
          mediosPagoMap[pago.nombre].count += 1;
          mediosPagoMap[pago.nombre].total += montoNeto; // ✅ SUMAR EL MONTO NETO
        }
      });

      // 3. Acumular productos y rubros
      venta.items.forEach((item) => {
        if (item.categoria !== "Rubros") {
          // Producto
          const gananciaItem = item.gananciaItem ?? 0;

          if (!productosMap[item.descripcion]) {
            productosMap[item.descripcion] = { vendidos: 0, ganancia: 0 };
          }
          productosMap[item.descripcion].vendidos += item.cantidad;
          productosMap[item.descripcion].ganancia += gananciaItem;
        } else {
          // Rubro
          const descripcion = item.descripcion;
          const totalVendido = item.precio * item.cantidad;
          const gananciaRubro = item.gananciaItem ?? totalVendido;

          if (!rubrosMap[descripcion]) {
            rubrosMap[descripcion] = { totalVendido: 0, ganancia: 0 };
          }
          rubrosMap[descripcion].totalVendido += totalVendido;
          rubrosMap[descripcion].ganancia += gananciaRubro;
        }
      });
    });

    // 4. Calcular Top Productos
    const topProductos = Object.entries(productosMap)
      .map(([descripcion, data]) => ({ descripcion, ...data }))
      .sort((a, b) => b.vendidos - a.vendidos)
      .slice(0, 5);

    // 5. Calcular Top Rubros
    const topRubros = Object.entries(rubrosMap)
      .map(([descripcion, data]) => ({ descripcion, ...data }))
      .sort((a, b) => b.ganancia - a.ganancia)
      .slice(0, 5);

    setEstadisticas({
      totalVentas,
      gananciaTotal,
      ventasCount: ventasFiltradas.length,
      mediosPago: mediosPagoMap,
      topProductos,
      topRubros,
    });
  };

  const handlePeriodoChange = (e) => {
    const newPeriodo = e.target.value;
    setPeriodo(newPeriodo);
    // Ajustar la fecha al día/mes actual
    if (newPeriodo === "mensual") {
      // Usar el primer día del mes actual
      setFechaSeleccionada(format(startOfMonth(new Date()), "yyyy-MM-dd"));
    } else {
      // Usar el día actual
      setFechaSeleccionada(format(new Date(), "yyyy-MM-dd"));
    }
  };

  const handleFechaChange = (e) => {
    let value = e.target.value;
    if (periodo === "mensual") {
      // Aseguramos que la fecha tenga el formato yyyy-MM-dd (primer día del mes)
      value = value + "-01";
    }
    setFechaSeleccionada(value);
  };

  const periodoTitle =
    periodo === "diario"
      ? `Diarias (${format(
          new Date(fechaSeleccionada + "T12:00:00"),
          "dd/MM/yyyy"
        )})`
      : `Mensuales (${format(
          new Date(fechaSeleccionada + "T12:00:00"),
          "MM/yyyy"
        )})`;

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">
        Estadísticas de Ventas
      </h1>

      {/* --- Controles de Filtro --- */}
      <Card className="flex justify-between items-center">
        <div>
          <Label htmlFor="periodo">Seleccionar Período</Label>
          <Select
            id="periodo"
            value={periodo}
            onChange={handlePeriodoChange}
            required
          >
            <option value="diario">Diario</option>
            <option value="mensual">Mensual</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="fecha">{periodo === "diario" ? "Día" : "Mes"}</Label>
          <input
            id="fecha"
            type={periodo === "diario" ? "date" : "month"}
            // CORRECCIÓN CLAVE 2: Usamos 'T12:00:00' para que el input muestre el mes correcto sin desfase.
            value={
              periodo === "diario"
                ? fechaSeleccionada
                : format(new Date(fechaSeleccionada + "T12:00:00"), "yyyy-MM")
            }
            onChange={handleFechaChange}
            className="border border-gray-300 p-2 rounded-lg"
          />
        </div>
      </Card>

      <Card>
        <h2 className="text-2xl font-semibold text-gray-800">
          Resumen ventas {periodoTitle}
        </h2>

        {/* --- Tarjetas de Resumen --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Vendido */}
          <Card className="shadow-lg bg-blue-50">
            <div className="flex items-center space-x-3">
              <FaDollarSign className="w-8 h-8 text-blue-600" />
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-500">
                  Total Vendido
                </span>
                <span className="text-2xl font-extrabold text-blue-900">
                  ${estadisticas.totalVentas.toFixed(2)}
                </span>
              </div>
            </div>
          </Card>
          {/* Ganancia Total */}
          <Card className="shadow-lg bg-green-50">
            <div className="flex items-center space-x-3">
              <FaChartLine className="w-8 h-8 text-green-600" />
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-500">
                  Ganancia Total
                </span>
                <span className="text-2xl font-extrabold text-green-900">
                  ${estadisticas.gananciaTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </Card>
          {/* Total Ventas (Count) */}
          <Card className="shadow-lg bg-yellow-50">
            <div className="flex items-center space-x-3">
              <FaTags className="w-8 h-8 text-yellow-600" />
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-500">
                  Cantidad de Ventas
                </span>
                <span className="text-2xl font-extrabold text-yellow-900">
                  {estadisticas.ventasCount}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </Card>
      {/* --- Medios de Pago y Top Ítems --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Tabla de Medios de Pago */}
        <Card className="h-full lg:col-span-2">
          <h3 className="text-xl font-semibold flex items-center mb-4">
            <FaDollarSign className="w-5 h-5 mr-2 text-blue-600" /> Cantidad y
            Total Recaudado por Medio de Pago {periodoTitle}
          </h3>
          <Table size="sm">
            <TableHead>
              <TableHeadCell>Medio de Pago</TableHeadCell>
              <TableHeadCell># Ventas</TableHeadCell>
              <TableHeadCell className="text-right">
                Total Recaudado
              </TableHeadCell>
            </TableHead>
            <TableBody className="divide-y">
              {Object.entries(estadisticas.mediosPago)
                .sort(([, a], [, b]) => b.total - a.total)
                .map(([nombre, data]) => (
                  <TableRow key={nombre}>
                    <TableCell className="font-medium">{nombre}</TableCell>
                    <TableCell>{data.count}</TableCell>
                    <TableCell className="font-semibold text-right">
                      ${data.total.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </Card>

        {/* Tabla de Top Productos */}
        <Card className="h-full">
          <h3 className="text-xl font-semibold flex items-center mb-4">
            <FaBox className="w-5 h-5 mr-2 text-green-600" /> Top 5 Productos
            Vendidos {periodoTitle}
          </h3>
          <Table size="sm">
            <TableHead>
              <TableHeadCell>Producto</TableHeadCell>
              <TableHeadCell>Cantidad</TableHeadCell>
              <TableHeadCell className="text-right">
                Ganancia Estimada
              </TableHeadCell>
            </TableHead>
            <TableBody className="divide-y">
              {estadisticas.topProductos.map((prod, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    {prod.descripcion}
                  </TableCell>
                  <TableCell>
                    <Badge color="info" className="w-fit">
                      {prod.vendidos.toFixed(prod.vendidos % 1 === 0 ? 0 : 2)}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-semibold text-right">
                    ${prod.ganancia.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {/* Tabla de Top Rubros */}
        <Card className="h-full">
          <h3 className="text-xl font-semibold flex items-center mb-4">
            <FaStore className="w-5 h-5 mr-2 text-yellow-600" /> Top 5 Rubros
            por Ganancia {periodoTitle}
          </h3>
          <Table size="sm">
            <TableHead>
              <TableHeadCell>Rubro</TableHeadCell>
              <TableHeadCell>Total Vendido</TableHeadCell>
              <TableHeadCell className="text-right">Ganancia</TableHeadCell>
            </TableHead>
            <TableBody className="divide-y">
              {estadisticas.topRubros.map((rubro, index) => (
                <TableRow key={index} className="bg-yellow-50/50">
                  <TableCell className="font-medium">
                    {rubro.descripcion}
                  </TableCell>
                  <TableCell>${rubro.totalVendido.toFixed(2)}</TableCell>
                  <TableCell className="font-semibold text-right">
                    ${rubro.ganancia.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
};

export default Estadisticas;
