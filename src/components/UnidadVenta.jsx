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

const UnidadVenta = () => {
  const [unidadVenta, setUnidadVenta] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const unidadVentaPorPagina = 10;
  const unidadVentaCol = collection(db, "unidadVenta");

  const fetchUnidadVenta = async () => {
    const data = await getDocs(unidadVentaCol);
    setUnidadVenta(data.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  };

  useEffect(() => {
    fetchUnidadVenta();
  }, []);

  const agregarUnidadVenta = async () => {
    const { value: nombreUnidadVenta } = await MySwal.fire({
      title: "Nueva Categoría",
      input: "text",
      inputLabel: "Nombre de la categoría",
      inputPlaceholder: "Ej: Kg, Litro, Unidad...",
      showCancelButton: true,
      confirmButtonText: "Agregar",
      cancelButtonText: "Cancelar",
    });

    if (nombreUnidadVenta) {
      const nombreLower = nombreUnidadVenta.toLowerCase();
      const existe = unidadVenta.some((uni) => uni.nombre === nombreLower);
      if (existe) {
        MySwal.fire("Duplicado", "La unidad ya existe.", "info");
        return;
      }
      try {
        await addDoc(unidadVentaCol, { nombre: nombreLower });
        MySwal.fire(
          "Agregado",
          "Unidad de venta creada exitosamente",
          "success"
        );
        fetchUnidadVenta();
      } catch (error) {
        console.error("Error al agregar unidad de venta", error);
        MySwal.fire("Error", "No se pudo crear la unidad de venta", "error");
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
      const unidadVentaRef = doc(db, "unidadVenta", id);
      await updateDoc(unidadVentaRef, { nombre: nuevoNombre.toLowerCase() });
      MySwal.fire(
        "Actualizado",
        "Unidad de venta actualizada correctamente",
        "success"
      );
      setEditandoId(null);
      setNuevoNombre("");
      fetchUnidadVenta();
    } catch (error) {
      console.error("Error al actualizar unidad de venta:", error);
      MySwal.fire("Error", "No se pudo actualizar la unidad de venta", "error");
    }
  };

  const handleEliminar = async (id) => {
    const confirm = await Swal.fire({
      title: "¿Eliminar unidad de venta?",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });
    if (confirm.isConfirmed) {
      await deleteDoc(doc(db, "unidadVenta", id));
      Swal.fire("Unidad de venta eliminada", "", "success");
      fetchUnidadVenta();
    }
  };

  // 🔹 Lógica de paginación
  const indiceUltimo = paginaActual * unidadVentaPorPagina;
  const indicePrimero = indiceUltimo - unidadVentaPorPagina;
  const unidadesDeVentaActuales = unidadVenta.slice(
    indicePrimero,
    indiceUltimo
  );
  const totalPaginas = Math.ceil(unidadVenta.length / unidadVentaPorPagina);

  return (
    <div className="max-w-6xl mx-auto mt-10 px-4 min-h-screen text-gray-900">
      <Card className=" border border-gray-300">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Unidades de venta</h2>
          <Button
            onClick={agregarUnidadVenta}
            className="bg-yellow-500 hover:bg-yellow-600 text-white hover:cursor-pointer"
          >
            + Nueva unidad de venta
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
              {unidadesDeVentaActuales.map((u) => (
                <TableRow key={u.id} className="hover:bg-gray-200 uppercase">
                  <TableCell>
                    {editandoId === u.id ? (
                      <TextInput
                        value={nuevoNombre}
                        onChange={(e) => setNuevoNombre(e.target.value)}
                        className="text-black"
                      />
                    ) : (
                      u.nombre
                    )}
                  </TableCell>

                  <TableCell className="flex gap-2 items-center justify-center lowercase">
                    {editandoId === u.id ? (
                      <>
                        <Button
                          size="xs"
                          className="bg-green-600 hover:bg-green-500 hover:cursor-pointer"
                          onClick={() => guardarEdicion(u.id)}
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
                            onClick={() => iniciarEdicion(u.id, u.nombre)}
                            className="hover:cursor-pointer"
                          >
                            Editar
                          </Button>
                        </Tooltip>
                        <Tooltip content="Eliminar unidad de venta">
                          <Button
                            size="xs"
                            className="bg-red-600 hover:bg-red-500 hover:cursor-pointer"
                            onClick={() => handleEliminar(u.id)}
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

export default UnidadVenta;
