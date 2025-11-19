import { useState, useEffect } from "react";
import { db } from "../firebaseConfig";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  addDoc,
  updateDoc,
} from "firebase/firestore";
import {
  Card,
  Button,
  Table,
  TableHead,
  TableHeadCell,
  TableBody,
  TableRow,
  TableCell,
  Tooltip,
  TextInput,
} from "flowbite-react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import Pagination from "./Pagination";
const MySwal = withReactContent(Swal);

const Categorias = () => {
  const [categorias, setCategorias] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const categoriasPorPagina = 10;
  const categoriasCol = collection(db, "categorias");

  const fetchCategorias = async () => {
    const data = await getDocs(categoriasCol);
    setCategorias(data.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  };

  useEffect(() => {
    fetchCategorias();
  }, []);

  const agregarCategoria = async () => {
    const { value: nombreCategoria } = await MySwal.fire({
      title: "Nueva Categoría",
      input: "text",
      inputLabel: "Nombre de la categoría",
      inputPlaceholder: "Ej: Galletitas, bebidas, cigarrillos,etc...",
      showCancelButton: true,
      confirmButtonText: "Agregar",
      cancelButtonText: "Cancelar",
    });

    if (nombreCategoria) {
      const nombreLower = nombreCategoria.toLowerCase();
      const existe = categorias.some((cat) => cat.nombre === nombreLower);
      if (existe) {
        MySwal.fire("Duplicado", "La categoría ya existe.", "info");
        return;
      }
      try {
        await addDoc(categoriasCol, { nombre: nombreLower });
        MySwal.fire("Agregado", "Categoría creada exitosamente", "success");
        fetchCategorias();
      } catch (error) {
        console.error("Error al agregar categoría", error);
        MySwal.fire("Error", "No se pudo crear la categoría", "error");
      }
    }
  };

  const iniciarEdicion = (id, nombreActual) => {
    setEditandoId(id);
    setNuevoNombre(nombreActual);
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setNuevoNombre("");
  };

  const guardarEdicion = async (id) => {
    if (!nuevoNombre.trim()) {
      MySwal.fire("Error", "El nombre no puede estar vacío.", "error");
      return;
    }

    try {
      const categoriaRef = doc(db, "categorias", id);
      await updateDoc(categoriaRef, { nombre: nuevoNombre.toLowerCase() });
      MySwal.fire(
        "Actualizado",
        "Categoría actualizada correctamente",
        "success"
      );
      setEditandoId(null);
      setNuevoNombre("");
      fetchCategorias();
    } catch (error) {
      console.error("Error al actualizar categoría:", error);
      MySwal.fire("Error", "No se pudo actualizar la categoría", "error");
    }
  };

  const handleEliminar = async (id) => {
    const confirm = await Swal.fire({
      title: "¿Eliminar categoría?",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });
    if (confirm.isConfirmed) {
      await deleteDoc(doc(db, "categorias", id));
      Swal.fire("Categoría eliminada", "", "success");
      fetchCategorias();
    }
  };

  // 🔹 Lógica de paginación
  const indiceUltimo = paginaActual * categoriasPorPagina;
  const indicePrimero = indiceUltimo - categoriasPorPagina;
  const categoriasActuales = categorias.slice(indicePrimero, indiceUltimo);
  const totalPaginas = Math.ceil(categorias.length / categoriasPorPagina);

  return (
    <div className="max-w-6xl mx-auto mt-10 px-4 min-h-screen text-gray-900">
      <Card className=" border border-gray-300">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Categorías</h2>
          <Button
            onClick={agregarCategoria}
            className="bg-green-600 hover:bg-green-700 text-white hover:cursor-pointer"
          >
            + Nueva categoría
          </Button>
        </div>

        <div className="overflow-x-auto">
          <Table striped={false} className="text-center">
            <TableHead>
              <TableRow>
                <TableHeadCell>Nombre</TableHeadCell>
                <TableHeadCell>Acciones</TableHeadCell>
              </TableRow>
            </TableHead>
            <TableBody className="divide-y divide-gray-500 text-gray-900">
              {categoriasActuales.map((c) => (
                <TableRow key={c.id} className="hover:bg-gray-200 uppercase">
                  <TableCell>
                    {editandoId === c.id ? (
                      <TextInput
                        value={nuevoNombre}
                        onChange={(e) => setNuevoNombre(e.target.value)}
                        className="text-black"
                      />
                    ) : (
                      c.nombre
                    )}
                  </TableCell>

                  <TableCell className="flex gap-2 items-center justify-center lowercase">
                    {editandoId === c.id ? (
                      <>
                        <Button
                          size="xs"
                          className="bg-green-600 hover:bg-green-500 hover:cursor-pointer"
                          onClick={() => guardarEdicion(c.id)}
                        >
                          Guardar
                        </Button>
                        <Button
                          size="xs"
                          className="bg-gray-500 hover:bg-gray-400 hover:cursor-pointer"
                          onClick={cancelarEdicion}
                        >
                          Cancelar
                        </Button>
                      </>
                    ) : (
                      <>
                        <Tooltip content="Editar categoría">
                          <Button
                            size="xs"
                            color="blue"
                            onClick={() => iniciarEdicion(c.id, c.nombre)}
                            className="hover:cursor-pointer"
                          >
                            Editar
                          </Button>
                        </Tooltip>
                        <Tooltip content="Eliminar categoría">
                          <Button
                            size="xs"
                            className="bg-red-600 hover:bg-red-500 hover:cursor-pointer"
                            onClick={() => handleEliminar(c.id)}
                          >
                            Eliminar
                          </Button>
                        </Tooltip>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <Pagination
          paginaActual={paginaActual}
          totalPaginas={totalPaginas}
          setPaginaActual={setPaginaActual}
        />
      </Card>
    </div>
  );
};

export default Categorias;
