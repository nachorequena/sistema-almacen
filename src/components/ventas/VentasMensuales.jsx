import { Fragment, useEffect, useState } from "react";
import { collection, deleteDoc, getDocs, doc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import {
  Card,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableHeadCell,
  Select,
  Label,
  Button,
  Tooltip,
  Modal,
  ModalHeader,
  ModalBody,
} from "flowbite-react";
import {
  format,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import Pagination from "../Pagination";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const formatearVentas = (docs) => {
  return docs.map((doc) => {
    const data = doc.data();

    // Normalizar medios de pago siempre al nivel de la venta
    const medioPago = Array.isArray(data.mediosPago)
      ? data.mediosPago.map(
          (mp) =>
            typeof mp === "string"
              ? { nombre: mp, monto: null }
              : {
                  nombre: mp.nombre ?? mp.id ?? "N/A",
                  monto: mp.monto ?? null,
                  recargoMonto: mp.recargoMonto ?? 0,
                  montoBase: mp.monto ?? 0,
                } // Incluir montoBase y recargoMonto
        )
      : data.pagos // Usar el campo 'pagos' del componente CreateVenta si existe
      ? data.pagos.map((p) => ({
          nombre: p.nombre,
          monto: p.montoConRecargo, // El monto real ingresado/cobrado con recargo (si aplica)
          montoBase: p.monto, // El monto base que cubre el pago
          recargoMonto: p.recargoMonto ?? 0,
        }))
      : data.mediosPago // Para compatibilidad con estructuras anteriores
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

    return {
      id: doc.id,
      fecha: data.fecha.toDate(),
      totalBase: data.totalVenta ?? data.totalBase ?? 0,
      ganancia: data.ganancia ?? 0,
      medioPago,
      totalConRecargo: data.totalConRecargo ?? data.total ?? 0,
      recargoTotal: data.recargoTotal ?? 0,
      vuelto: data.vuelto ?? 0,
      cajeroId: data.cajeroId ?? null,
      cajeroNombre: data.cajeroNombre ?? "Sin asignar",
      productos: [
        ...(data.products ?? data.productos ?? []),
        ...(data.rubros?.map((rubro) => ({
          descripcion: rubro.rubroNombre,
          cantidad: 1,
          precio: rubro.total,
          categoria: "Rubros",
          ventaId: doc.id,
          fecha: data.fecha.toDate(),
        })) ?? []),
      ],
    };
  });
};

const VentasMensuales = () => {
  const [ventas, setVentas] = useState([]);
  const [productosMes, setProductosMes] = useState([]);
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().getMonth());
  const [anioSeleccionado, setAnioSeleccionado] = useState(
    new Date().getFullYear()
  );
  const [tipoVista, setTipoVista] = useState("mensual");

  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);

  const [mediosPago, setMediosPago] = useState([]);

  const [resumen, setResumen] = useState({
    total: 0,
    ganancia: 0,
    productosVendidos: 0,
  });

  const [categoriaFiltro, setCategoriaFiltro] = useState("");
  const [productoFiltro, setProductoFiltro] = useState("");
  const [ordenFecha, setOrdenFecha] = useState("desc");
  const [medioPagoFiltro, setMedioPagoFiltro] = useState("");

  const [paginaActual, setPaginaActual] = useState(1);
  const productosPorPagina = 10;
  const navigate = useNavigate();

  const [categorias, setCategorias] = useState([]);

  useEffect(() => {
    const obtenerCategorias = async () => {
      const snapshot = await getDocs(collection(db, "categorias"));
      const categoriasData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setCategorias([...categoriasData, { id: "rubros", nombre: "Rubros" }]);
      console.log("Categorías obtenidas:", categoriasData);
    };

    obtenerCategorias();
  }, []);

  useEffect(() => {
    const obtenerMediosPago = async () => {
      const snapshot = await getDocs(collection(db, "mediosDePago"));
      const mediosData = snapshot.docs.map((doc) => ({
        id: doc.id,
        nombre: doc.data().nombre,
      }));
      setMediosPago(mediosData);
    };

    obtenerMediosPago();
  }, []);

  const normalizarTexto = (texto) =>
    (texto || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();

  useEffect(() => {
    obtenerVentas();
  }, [
    mesSeleccionado,
    anioSeleccionado,
    categoriaFiltro,
    productoFiltro,
    ordenFecha,
    medioPagoFiltro,
    tipoVista,
  ]);

  const obtenerVentas = async () => {
    try {
      const snapshot = await getDocs(collection(db, "ventas"));
      const ventasData = formatearVentas(snapshot.docs);

      let fechaInicio, fechaFin;
      const hoy = new Date();

      // 1. LÓGICA DE FILTRADO POR TIEMPO
      if (tipoVista === "mensual") {
        fechaInicio = startOfMonth(new Date(anioSeleccionado, mesSeleccionado));
        fechaFin = endOfMonth(fechaInicio);
      } else if (tipoVista === "semanal") {
        fechaInicio = startOfWeek(hoy, { weekStartsOn: 1 });
        fechaFin = endOfWeek(hoy, { weekStartsOn: 1 });
      } else if (tipoVista === "diaria") {
        fechaInicio = startOfDay(hoy);
        fechaFin = endOfDay(hoy);
      }

      // Filtro inicial por fecha
      let ventasFiltradas = ventasData.filter(
        (v) => v.fecha >= fechaInicio && v.fecha <= fechaFin
      );

      // 2. FILTRO POR MEDIO DE PAGO (AHORA COMPARA POR NOMBRE)
      if (medioPagoFiltro) {
        ventasFiltradas = ventasFiltradas.filter((v) => {
          return v.medioPago.some(
            (mp) =>
              normalizarTexto(mp.nombre) === normalizarTexto(medioPagoFiltro)
          );
        });
      }

      // Extraer productos de ventas filtradas
      let productos = ventasFiltradas.flatMap((venta) =>
        venta.productos.map((p) => ({
          ...p,
          ventaId: venta.id,
          fecha: venta.fecha,
          medioPago: venta.medioPago,
        }))
      );

      let productosFinales = [];

      const esCategoriaRubros = normalizarTexto(categoriaFiltro) === "rubros";
      const esCategoriaTodas = categoriaFiltro === "";

      // 3. FILTRADO POR CATEGORÍA
      if (esCategoriaRubros || esCategoriaTodas) {
        const agrupado = {};

        productos.forEach((p) => {
          if (esCategoriaRubros && normalizarTexto(p.categoria) !== "rubros")
            return;

          if (normalizarTexto(p.categoria) === "rubros") {
            const key = `${p.descripcion}_${p.ventaId}`;

            if (!agrupado[key]) {
              agrupado[key] = {
                descripcion: p.descripcion,
                categoria: "Rubros",
                cantidad: 0,
                precio: 0,
                subtotal: 0,
                fecha: p.fecha,
                medioPago: p.medioPago,
                ventaId: p.ventaId,
              };
            }

            agrupado[key].cantidad += p.cantidad ?? 0;
            agrupado[key].subtotal += (p.precio ?? 0) * (p.cantidad ?? 0);
            agrupado[key].precio =
              agrupado[key].subtotal / agrupado[key].cantidad;
          }
        });

        const rubros = Object.values(agrupado);

        if (esCategoriaTodas) {
          const productosNormales = productos.filter(
            (p) => normalizarTexto(p.categoria) !== "rubros"
          );
          productosFinales = [...productosNormales, ...rubros];
        } else {
          productosFinales = rubros;
        }
      } else {
        productosFinales = productos.filter(
          (p) =>
            normalizarTexto(p.categoria) === normalizarTexto(categoriaFiltro)
        );
      }

      // 4. FILTRO POR PRODUCTO
      if (productoFiltro && !esCategoriaRubros) {
        productosFinales = productosFinales.filter(
          (p) =>
            normalizarTexto(p.descripcion) === normalizarTexto(productoFiltro)
        );
      }

      // 5. Ordenar por fecha
      productosFinales.sort((a, b) => {
        return ordenFecha === "asc" ? a.fecha - b.fecha : b.fecha - a.fecha;
      });

      // 6. CÁLCULO DE RESUMEN
      const total = ventasFiltradas.reduce(
        (acc, v) => acc + (v.totalConRecargo ?? v.total ?? 0),
        0
      );
      const ganancia = ventasFiltradas.reduce(
        (acc, v) => acc + (v.ganancia ?? 0),
        0
      );
      const productosVendidos = productosFinales.reduce(
        (acc, p) => acc + (p.cantidad ?? 0),
        0
      );

      // 7. ACTUALIZAR ESTADOS
      setVentas(ventasFiltradas);
      setProductosMes(productosFinales);
      setResumen({ total, ganancia, productosVendidos });
      setPaginaActual(1);
    } catch (error) {
      console.error("Error al obtener ventas: ", error);
    }
  };

  const handleEliminarVenta = async (id) => {
    Swal.fire({
      title: "¿Estás seguro de que quieres eliminar esta venta?",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    }).then(async (result) => {
      if (result.isConfirmed) {
        await deleteDoc(doc(db, "ventas", id));
        Swal.fire(
          "Eliminado",
          "La venta fue eliminada correctamente",
          "success"
        );

        obtenerVentas();
      }
    });
  };

  const meses = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  const totalPaginas = Math.ceil(ventas.length / productosPorPagina);
  const indiceUltimo = paginaActual * productosPorPagina;
  const indicePrimero = indiceUltimo - productosPorPagina;
  const productosActuales = productosMes.slice(indicePrimero, indiceUltimo);
  const ventasActuales = ventas.slice(indicePrimero, indiceUltimo);

  const obtenerNombreMedioPago = (id) => {
    const medio = mediosPago.find((m) => m.id === id);
    return medio ? medio.nombre : id;
  };

  const productosUnicos = [
    ...new Set(productosMes.map((p) => p.descripcion?.trim())),
  ]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  return (
    <div className="max-w-6xl mx-auto mt-10 px-4 min-h-screen text-gray-900">
      <Card className=" border border-gray-300 ">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Historial de ventas</h2>

          <Button
            onClick={() => navigate("/ventas/create")}
            className="bg-blue-600 hover:bg-blue-700 text-white hover:cursor-pointer"
          >
            + Registrar nueva venta
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex flex-col">
            <Label
              htmlFor="tipoVista"
              className="mb-2 font-semibold text-gray-700"
            >
              Tipo de vista
            </Label>
            <Select
              id="tipoVista"
              value={tipoVista}
              onChange={(e) => setTipoVista(e.target.value)}
              className="border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
            >
              <option value="diaria">Diaria</option>
              <option value="semanal">Semanal</option>
              <option value="mensual">Mensual</option>
            </Select>
          </div>

          <div className="flex flex-col">
            <Label htmlFor="mes" className="mb-2 font-semibold text-gray-700">
              Mes
            </Label>
            <Select
              id="mes"
              value={mesSeleccionado}
              onChange={(e) => setMesSeleccionado(parseInt(e.target.value))}
              className="border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
            >
              {meses.map((mes, idx) => (
                <option key={idx} value={idx}>
                  {mes}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex flex-col">
            <Label htmlFor="anio" className="mb-2 font-semibold text-gray-700">
              Año
            </Label>
            <Select
              id="anio"
              value={anioSeleccionado}
              onChange={(e) => setAnioSeleccionado(parseInt(e.target.value))}
              className="border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
            >
              {Array.from(
                { length: 5 },
                (_, i) => new Date().getFullYear() - i
              ).map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex flex-col">
            <Label
              htmlFor="categoria"
              className="mb-2 font-semibold text-gray-700"
            >
              Categoría
            </Label>
            <Select
              id="categoria"
              value={categoriaFiltro}
              onChange={(e) => setCategoriaFiltro(e.target.value)}
              className="border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
            >
              <option value="">Todas</option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.nombre}>
                  {cat.nombre}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex flex-col">
            <Label
              htmlFor="producto"
              className="mb-2 font-semibold text-gray-700"
            >
              Producto
            </Label>
            <Select
              id="producto"
              value={productoFiltro}
              onChange={(e) => setProductoFiltro(e.target.value)}
              disabled={categoriaFiltro === "Rubros"}
              className="border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 disabled:opacity-50 disabled:bg-gray-100"
            >
              <option value="">Todos</option>
              {productosUnicos.map((prod, idx) => (
                <option key={idx} value={prod}>
                  {prod}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex flex-col">
            <Label
              htmlFor="medioPago"
              className="mb-2 font-semibold text-gray-700"
            >
              Medio de Pago
            </Label>
            <Select
              id="medioPago"
              value={medioPagoFiltro}
              onChange={(e) => setMedioPagoFiltro(e.target.value)}
              className="border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
            >
              <option value="">Todos</option>
              {mediosPago.map((medio) => (
                <option key={medio.id} value={medio.nombre}>
                  {medio.nombre}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex flex-col">
            <Label htmlFor="orden" className="mb-2 font-semibold text-gray-700">
              Ordenar por fecha
            </Label>
            <Select
              id="orden"
              value={ordenFecha}
              onChange={(e) => setOrdenFecha(e.target.value)}
              className="border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
            >
              <option value="desc">Más reciente primero</option>
              <option value="asc">Más viejo primero</option>
            </Select>
          </div>
        </div>

        <Table striped={false}>
          <TableHead className="text-center">
            <TableRow>
              <TableHeadCell>ID de venta</TableHeadCell>
              <TableHeadCell>Fecha</TableHeadCell>
              <TableHeadCell>Hora</TableHeadCell>
              <TableHeadCell>Total Base</TableHeadCell>
              <TableHeadCell>Recargo</TableHeadCell>
              <TableHeadCell>Total Final</TableHeadCell>
              <TableHeadCell>Vuelto</TableHeadCell>
              <TableHeadCell>Empleado</TableHeadCell>
              <TableHeadCell>Acciones</TableHeadCell>
            </TableRow>
          </TableHead>
          <TableBody className="divide-y divide-gray-500 text-gray-900">
            {ventasActuales.map((venta) => (
              <Fragment key={venta.id}>
                <TableRow
                  onClick={() => setVentaSeleccionada(venta)}
                  className="cursor-pointer hover:bg-gray-200 uppercase text-center"
                >
                  <TableCell>{venta.id}</TableCell>
                  <TableCell>{format(venta.fecha, "dd/MM/yyyy")}</TableCell>
                  <TableCell>{format(venta.fecha, "HH:mm")}</TableCell>
                  <TableCell>${venta.totalBase}</TableCell>
                  <TableCell>${venta.recargoTotal}</TableCell>
                  <TableCell className="font-semibold">
                    ${venta.totalConRecargo}
                  </TableCell>
                  <TableCell
                    className={
                      venta.vuelto > 0
                        ? "text-green-500 font-medium"
                        : "text-gray-500"
                    }
                  >
                    ${parseFloat(venta.vuelto)}
                  </TableCell>
                  <TableCell>{venta.cajeroNombre || "Sin asignar"}</TableCell>

                  <TableCell>
                    <div className="flex gap-2 items-center justify-center lowercase">
                      <Tooltip content="Eliminar venta">
                        <Button
                          size="xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEliminarVenta(venta.id);
                          }}
                          className="bg-red-600 hover:bg-red-500 hover:cursor-pointer"
                        >
                          Eliminar
                        </Button>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              </Fragment>
            ))}
          </TableBody>
        </Table>
        <Modal
          show={!!ventaSeleccionada}
          onClose={() => setVentaSeleccionada(null)}
          size="md"
        >
          <ModalHeader>Ticket de venta</ModalHeader>
          <ModalBody>
            {ventaSeleccionada && (
              <div className="bg-white p-4 rounded-lg text-gray-900 font-mono">
                <h3 className="text-lg font-bold text-center mb-2">
                  TICKET DE VENTA
                </h3>
                <div className="border-t border-b border-gray-400 py-2 mb-2 text-sm">
                  <p>
                    <strong>ID:</strong> {ventaSeleccionada.id}
                  </p>
                  <p>
                    <strong>Fecha:</strong>{" "}
                    {format(ventaSeleccionada.fecha, "dd/MM/yyyy HH:mm")}
                  </p>

                  <p>
                    <strong>Total base:</strong> $
                    {ventaSeleccionada.totalBase?.toLocaleString() ?? 0}
                  </p>

                  {ventaSeleccionada.recargoTotal > 0 && (
                    <p>
                      <strong>Recargo total:</strong> $
                      {ventaSeleccionada.recargoTotal?.toLocaleString() ?? 0}
                    </p>
                  )}

                  <p>
                    <strong>Total con recargo:</strong> $
                    {ventaSeleccionada.totalConRecargo?.toLocaleString() ??
                      ventaSeleccionada.total?.toLocaleString()}
                  </p>

                  <p className="mt-1">
                    <strong>Medios de pago:</strong>
                  </p>
                  {ventaSeleccionada.medioPago?.map((mp, idx) => (
                    <p key={idx} className="ml-2">
                      - {mp.nombre}{" "}
                      {mp.montoConRecargo
                        ? `($${mp.montoConRecargo.toLocaleString()})`
                        : mp.monto
                        ? `($${mp.monto.toLocaleString()})`
                        : ""}
                    </p>
                  ))}
                </div>

                <h4 className="text-center font-semibold mb-1">
                  Detalle de productos
                </h4>
                <div className="text-sm border-t border-gray-300 mt-1">
                  {ventaSeleccionada.productos.map((p, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between border-b border-dotted border-gray-300 py-1"
                    >
                      <span className="w-1/2">
                        {p.descripcion.toLowerCase()}
                      </span>
                      <span>x{p.cantidad}</span>
                      <span>${(p.precio * p.cantidad).toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                <p className="text-center mt-4 font-semibold">
                  ¡Gracias por su compra!
                </p>
              </div>
            )}
          </ModalBody>
        </Modal>

        <Pagination
          paginaActual={paginaActual}
          setPaginaActual={setPaginaActual}
          totalPaginas={totalPaginas}
        />
      </Card>
    </div>
  );
};

export default VentasMensuales;
