import { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  addDoc,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import {
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  Button,
  Dropdown,
  DropdownItem,
  Tooltip,
  TextInput,
} from "flowbite-react";
import { HiPencil, HiTrash } from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import Pagination from "../Pagination";

const MySwal = withReactContent(Swal);

const Show = () => {
  const [products, setProducts] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("Todas");
  const [categorias, setCategorias] = useState([]);
  const [paginaActual, setPaginaActual] = useState(1);
  const [busqueda, setBusqueda] = useState("");
  const [tipoProducto, setTipoProducto] = useState("codigoBarra");

  const productosPorPagina = 8;
  const navigate = useNavigate();
  const productsCollection = collection(db, "products");
  const categoriasCollection = collection(db, "categorias");
  const unidadVentaCollection = collection(db, "unidadVenta");
  const getProducts = async () => {
    const data = await getDocs(productsCollection);
    setProducts(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
  };

  const getCategorias = async () => {
    const data = await getDocs(categoriasCollection);
    const cats = data.docs.map((doc) => doc.data().nombre.toLowerCase());
    const uniqueCats = Array.from(new Set(cats)).sort();
    setCategorias(["Todas", ...uniqueCats]);
  };

  const deleteProduct = async (id) => {
    const confirm = await MySwal.fire({
      title: "¿Eliminar producto?",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (confirm.isConfirmed) {
      const productDoc = doc(db, "products", id);
      await deleteDoc(productDoc);
      getProducts();
      MySwal.fire("Eliminado", "Producto eliminado con éxito", "success");
    }
  };

  const handleCategoriaChange = (categoria) => {
    setCategoriaSeleccionada(categoria);
    setPaginaActual(1);
  };

  const agregarUnidadVenta = async () => {
    const { value: nombreUnidad } = await MySwal.fire({
      title: "Nueva Unidad de Venta",
      input: "text",
      inputLabel: "Nombre de la unidad",
      inputPlaceholder: "Ej: unidad, kg, docena, litro...",
      showCancelButton: true,
      confirmButtonText: "Agregar",
      cancelButtonText: "Cancelar",
    });

    if (nombreUnidad) {
      try {
        await addDoc(unidadVentaCollection, {
          nombre: nombreUnidad.toLowerCase(),
        });
        MySwal.fire(
          "Agregado",
          "Unidad de venta creada exitosamente",
          "success"
        );
        // Podés recargar una lista de unidades si tenés
      } catch (error) {
        console.error("Error al agregar unidad", error);
        MySwal.fire("Error", "No se pudo crear la unidad", "error");
      }
    }
  };

  const agregarCategoria = async () => {
    const { value: nombreCategoria } = await MySwal.fire({
      title: "Nueva Categoría",
      input: "text",
      inputLabel: "Nombre de la categoría",
      inputPlaceholder: "Ej: Mates, Termos, Bombillas...",
      showCancelButton: true,
      confirmButtonText: "agregar",
      cancelButtonText: "cancelar",
    });

    if (nombreCategoria) {
      const nombreLower = nombreCategoria.toLowerCase();
      if (categorias.includes(nombreLower)) {
        MySwal.fire("Duplicado", "La categoría ya existe.", "info");
        return;
      }
      try {
        await addDoc(categoriasCollection, { nombre: nombreLower });
        MySwal.fire("Agregado", "Categoría creada exitosamente", "success");
        getCategorias();
      } catch (error) {
        console.error("Error al agregar categoría", error);
        MySwal.fire("Error", "No se pudo crear la categoría", "error");
      }
    }
  };

  useEffect(() => {
    getProducts();
    getCategorias();
  }, []);

  const normalize = (s) =>
    (s || "")
      .toString()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // quita acentos
      .toLowerCase()
      .trim();

  const productosFiltrados = products.filter((p) => {
    // Normalizar categoría seleccionada
    const catSel = normalize(categoriaSeleccionada);

    // Obtener la(s) categoría(s) del producto en varios formatos posibles
    let prodCats = [];
    if (!p.categoria && p.categoria !== "") {
      // si viene como objeto con nombre
      if (
        p.categoria &&
        typeof p.categoria === "object" &&
        p.categoria.nombre
      ) {
        prodCats = [normalize(p.categoria.nombre)];
      } else {
        prodCats = [];
      }
    } else if (Array.isArray(p.categoria)) {
      prodCats = p.categoria.map((c) => normalize(c));
    } else {
      prodCats = [normalize(p.categoria)];
    }

    const coincideCategoria = catSel === "todas" || prodCats.includes(catSel);

    const descripcion = normalize(p.description);
    const codigo = normalize(p.codigoBarra);
    const atajo = normalize(p.atajo);

    const palabrasBusqueda = busqueda.toLowerCase().split(" ").filter(Boolean);

    const coincideBusqueda =
      palabrasBusqueda.length === 0 ||
      palabrasBusqueda.every((palabra) => {
        const np = normalize(palabra);
        return (
          descripcion.includes(np) || codigo.includes(np) || atajo.includes(np)
        );
      });

    return coincideCategoria && coincideBusqueda;
  });

  const indiceUltimo = paginaActual * productosPorPagina;
  const indicePrimero = indiceUltimo - productosPorPagina;
  const productosFiltradosPorTipo = productosFiltrados.filter((p) => {
    if (tipoProducto === "codigoBarra") return p.codigoBarra;
    if (tipoProducto === "atajo") return p.atajo;
    return true;
  });

  const productosActuales = productosFiltradosPorTipo.slice(
    indicePrimero,
    indiceUltimo
  );

  const totalPaginas = Math.ceil(
    productosFiltrados.length / productosPorPagina
  );

  return (
    <div className="max-w-6xl mx-auto mt-10 px-4 min-h-screen text-gray-900">
      <Card className=" border border-gray-300">
        <div className="flex justify-between">
          <div className="flex items-center gap-4 mb-6">
            {/* Radio estilizado: ocultamos el input nativo y estilizamos la label */}{" "}
            <div className="flex items-center gap-3">
              <input
                type="radio"
                id="codigoBarra"
                name="tipoProducto"
                value="codigoBarra"
                checked={tipoProducto === "codigoBarra"}
                onChange={(e) => setTipoProducto(e.target.value)}
                className="hidden"
              />
              <label
                htmlFor="codigoBarra"
                role="radio"
                aria-checked={tipoProducto === "codigoBarra"}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full transition-transform transform origin-center cursor-pointer select-none border
                ${
                  tipoProducto === "codigoBarra"
                    ? "bg-blue-600 text-white border-blue-700 shadow-md"
                    : "bg-white text-gray-800 border-gray-200 hover:scale-105"
                }
                focus:outline-none focus:ring-2 focus:ring-blue-300`}
              >
                <span className="text-sm font-medium">
                  Con código de barras
                </span>
              </label>
              <input
                type="radio"
                id="atajo"
                name="tipoProducto"
                value="atajo"
                checked={tipoProducto === "atajo"}
                onChange={(e) => setTipoProducto(e.target.value)}
                className="hidden"
              />
              <label
                htmlFor="atajo"
                role="radio"
                aria-checked={tipoProducto === "atajo"}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full transition-transform transform origin-center cursor-pointer select-none border
                ${
                  tipoProducto === "atajo"
                    ? "bg-blue-600 text-white border-blue-700 shadow-md"
                    : "bg-white text-gray-800 border-gray-200 hover:scale-105"
                }                focus:outline-none focus:ring-2 focus:ring-blue-300`}
              >
                <span className="text-sm font-medium">Con atajo</span>
              </label>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold">Lista de Productos</h2>
          </div>
        </div>
        <div className="flex gap-4 justify-center items-center mb-6">
          <Dropdown
            label={`Categoría: ${categoriaSeleccionada}`}
            dismissOnClick={false}
            className="bg-[#1f2937] text-white border border-gray-600 hover:cursor-pointer"
          >
            {categorias.map((categoria) => (
              <DropdownItem
                key={categoria}
                onClick={() => handleCategoriaChange(categoria)}
                className="hover:bg-gray-700 text-white hover:text-black hover:cursor-pointer"
              >
                {categoria}
              </DropdownItem>
            ))}
          </Dropdown>
          <Button
            onClick={agregarUnidadVenta}
            className="bg-yellow-500 hover:bg-yellow-600 text-white hover:cursor-pointer"
          >
            + Nueva unidad de venta
          </Button>

          <Button
            onClick={agregarCategoria}
            className="bg-green-600 hover:bg-green-700 text-white hover:cursor-pointer"
          >
            + Nueva categoría
          </Button>

          <Button
            onClick={() => navigate("/productos/create")}
            className="bg-blue-600 hover:bg-blue-700 text-white hover:cursor-pointer"
          >
            + Agregar producto
          </Button>
        </div>

        <TextInput
          placeholder="Buscar producto por nombre o código de barras..."
          value={busqueda}
          onChange={(e) => {
            setBusqueda(e.target.value);
            setPaginaActual(1);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              // Evita que el formulario se envíe
              e.preventDefault();
            }
          }}
          className="mb-4 mx-10"
        />

        <Table striped={false} className="text-center">
          <TableHead>
            <TableRow>
              {tipoProducto === "codigoBarra" ? (
                <>
                  <TableHeadCell>Nombre</TableHeadCell>
                  <TableHeadCell>Precio</TableHeadCell>
                  <TableHeadCell>Precio costo</TableHeadCell>
                  <TableHeadCell>Ganancia</TableHeadCell>
                  <TableHeadCell>Categoría</TableHeadCell>
                  <TableHeadCell>Codigo de barras</TableHeadCell>
                  <TableHeadCell>Acciones</TableHeadCell>
                </>
              ) : (
                <>
                  <TableHeadCell>Nombre</TableHeadCell>
                  <TableHeadCell>Unidad de venta</TableHeadCell>
                  <TableHeadCell>Precio</TableHeadCell>
                  <TableHeadCell>Precio costo</TableHeadCell>
                  <TableHeadCell>Ganancia</TableHeadCell>
                  <TableHeadCell>Categoría</TableHeadCell>
                  <TableHeadCell>Atajo</TableHeadCell>
                  <TableHeadCell>Acciones</TableHeadCell>
                </>
              )}
            </TableRow>
          </TableHead>

          <TableBody className="divide-y divide-gray-500 text-gray-900">
            {productosActuales.map((producto) => (
              <TableRow
                key={producto.id}
                className="hover:bg-gray-200 uppercase"
              >
                <TableCell>{producto.description}</TableCell>

                {tipoProducto === "codigoBarra" ? (
                  <>
                    <TableCell>${producto.precio}</TableCell>
                    <TableCell>${producto.costo}</TableCell>
                    <TableCell>${producto.ganancia}</TableCell>
                    <TableCell>{producto.categoria}</TableCell>
                    <TableCell>{producto.codigoBarra}</TableCell>
                  </>
                ) : (
                  <>
                    <TableCell>{producto.unidadVenta || "-"}</TableCell>
                    <TableCell>${producto.precio}</TableCell>
                    <TableCell>${producto.costo}</TableCell>
                    <TableCell>${producto.ganancia}</TableCell>
                    <TableCell>{producto.categoria}</TableCell>
                    <TableCell>{producto.atajo}</TableCell>
                  </>
                )}

                <TableCell className="flex lowercase">
                  <Tooltip content="Editar producto">
                    <Button
                      size="xs"
                      color="gray"
                      onClick={() => navigate(`/productos/edit/${producto.id}`)}
                      className="text-blue-500 hover:text-blue-400 bg-transparent hover:cursor-pointer"
                    >
                      <HiPencil className="w-5 h-5" />
                    </Button>
                  </Tooltip>
                  <Tooltip content="Eliminar producto">
                    <Button
                      size="xs"
                      onClick={() => deleteProduct(producto.id)}
                      className="text-red-500 hover:text-red-400 bg-transparent hover:cursor-pointer"
                    >
                      <HiTrash className="w-5 h-5" />
                    </Button>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Pagination
          paginaActual={paginaActual}
          setPaginaActual={setPaginaActual}
          totalPaginas={totalPaginas}
        />
      </Card>
    </div>
  );
};

export default Show;
