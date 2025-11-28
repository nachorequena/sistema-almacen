import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  deleteDoc,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";
import {
  Card,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableHeadCell,
  Tooltip,
  TextInput,
} from "flowbite-react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import Pagination from "../Pagination";

const MySwal = withReactContent(Swal);

const mediosPagoCollection = collection(db, "mediosDePago");

const MediosPago = () => {
  const [mediosPago, setMediosPago] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoRecargo, setNuevoRecargo] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const mediosDePagoPorPagina = 10;
  useEffect(() => {
    obtenerMediosPago();
  }, []);

  const obtenerMediosPago = async () => {
    const snapshot = await getDocs(mediosPagoCollection);
    setMediosPago(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  };

  //  Modal con dos campos: nombre y recargo
  const agregarMedioPago = async () => {
    const { value: formValues } = await MySwal.fire({
      title: "Nuevo Medio de Pago",
      html: `
        <input id="nombre" class="swal2-input" placeholder="Nombre del medio de pago (Ej: Crédito, Efectivo)" />
        <input id="recargo" type="number" step="0.01" min="0" class="swal2-input" placeholder="Recargo % (Ej: 10)" />
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Agregar",
      cancelButtonText: "Cancelar",
      preConfirm: () => {
        const nombre = document.getElementById("nombre").value.trim();
        const recargo = parseFloat(
          document.getElementById("recargo").value || 0
        );
        if (!nombre) {
          Swal.showValidationMessage("El nombre es obligatorio");
          return false;
        }
        if (isNaN(recargo) || recargo < 0) {
          Swal.showValidationMessage("El recargo debe ser un número válido");
          return false;
        }
        return { nombre, recargo };
      },
    });

    if (formValues) {
      const nombreLower = formValues.nombre.toLowerCase();
      if (
        mediosPago.some((medio) => medio.nombre.toLowerCase() === nombreLower)
      ) {
        MySwal.fire("Duplicado", "El medio de pago ya existe.", "info");
        return;
      }

      try {
        await addDoc(mediosPagoCollection, {
          nombre: nombreLower,
          recargo: formValues.recargo || 0,
        });
        MySwal.fire("Agregado", "Medio de pago creado exitosamente", "success");
        obtenerMediosPago();
      } catch (error) {
        console.error("Error al agregar medio de pago", error);
        MySwal.fire("Error", "No se pudo crear el medio de pago", "error");
      }
    }
  };

  const iniciarEdicion = (id, nombreActual, recargoActual) => {
    setEditandoId(id);
    setNuevoNombre(nombreActual);
    setNuevoRecargo(recargoActual || 0);
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setNuevoNombre("");
    setNuevoRecargo("");
  };

  const guardarEdicion = async (id) => {
    if (!nuevoNombre.trim()) {
      MySwal.fire("Error", "El nombre no puede estar vacío.", "error");
      return;
    }

    try {
      const medioRef = doc(db, "mediosDePago", id);
      await updateDoc(medioRef, {
        nombre: nuevoNombre.toLowerCase(),
        recargo: parseFloat(nuevoRecargo) || 0,
      });
      MySwal.fire(
        "Actualizado",
        "Medio de pago actualizado correctamente",
        "success"
      );
      setEditandoId(null);
      setNuevoNombre("");
      setNuevoRecargo("");
      obtenerMediosPago();
    } catch (error) {
      console.error("Error al actualizar medio de pago:", error);
      MySwal.fire("Error", "No se pudo actualizar el medio de pago", "error");
    }
  };

  const eliminarMedioPago = async (id) => {
    Swal.fire({
      title: "¿Estás seguro de que quieres eliminar este medio de pago?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    }).then(async (result) => {
      if (result.isConfirmed) {
        await deleteDoc(doc(db, "mediosDePago", id));
        Swal.fire(
          "Eliminado",
          "El medio de pago fue eliminado correctamente",
          "success"
        );
        obtenerMediosPago();
      }
    });
  };

  // 🔹 Lógica de paginación
  const indiceUltimo = paginaActual * mediosDePagoPorPagina;
  const indicePrimero = indiceUltimo - mediosDePagoPorPagina;
  const mediosDePagoActuales = mediosPago.slice(indicePrimero, indiceUltimo);
  const totalPaginas = Math.ceil(mediosPago.length / mediosDePagoPorPagina);

  return (
    <div className="max-w-6xl mx-auto mt-10 px-4 min-h-screen text-gray-900">
      <Card className="border border-gray-300">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Medios de Pago</h2>
          <Button
            onClick={agregarMedioPago}
            className="bg-blue-600 hover:cursor-pointer"
          >
            + Agregar medio de pago
          </Button>
        </div>

        <Table striped={false} className="text-center">
          <TableHead>
            <TableRow>
              <TableHeadCell>Nombre</TableHeadCell>
              <TableHeadCell>Recargo (%)</TableHeadCell>
              <TableHeadCell>Acciones</TableHeadCell>
            </TableRow>
          </TableHead>
          <TableBody className="divide-y divide-gray-500 text-gray-900">
            {mediosDePagoActuales.map((medio) => (
              <TableRow key={medio.id} className="hover:bg-gray-200 uppercase">
                <TableCell>
                  {editandoId === medio.id ? (
                    <TextInput
                      value={nuevoNombre}
                      onChange={(e) => setNuevoNombre(e.target.value)}
                      className="text-black"
                    />
                  ) : (
                    medio.nombre
                  )}
                </TableCell>

                {/*  Celda de recargo */}
                <TableCell>
                  {editandoId === medio.id ? (
                    <TextInput
                      type="number"
                      step="0.01"
                      min="0"
                      value={nuevoRecargo}
                      onChange={(e) => setNuevoRecargo(e.target.value)}
                      className="text-black w-24 mx-auto"
                    />
                  ) : (
                    `${medio.recargo ?? 0}%`
                  )}
                </TableCell>

                <TableCell className="flex gap-2 justify-center lowercase">
                  {editandoId === medio.id ? (
                    <>
                      <Button
                        size="xs"
                        className="bg-green-600 hover:bg-green-500 hover:cursor-pointer"
                        onClick={() => guardarEdicion(medio.id)}
                      >
                        Guardar
                      </Button>
                      <Button
                        size="xs"
                        className="hover:cursor-pointer bg-gray-500 hover:bg-gray-400"
                        onClick={cancelarEdicion}
                      >
                        Cancelar
                      </Button>
                    </>
                  ) : (
                    <>
                      <Tooltip content="Editar medio de pago">
                        <Button
                          size="xs"
                          color="blue"
                          onClick={() =>
                            iniciarEdicion(
                              medio.id,
                              medio.nombre,
                              medio.recargo
                            )
                          }
                          className="hover:cursor-pointer"
                        >
                          Editar
                        </Button>
                      </Tooltip>
                      <Tooltip content="Eliminar medio de pago">
                        <Button
                          size="xs"
                          onClick={() => eliminarMedioPago(medio.id)}
                          className="bg-red-600 hover:bg-red-500 hover:cursor-pointer"
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
        <Pagination
          paginaActual={paginaActual}
          totalPaginas={totalPaginas}
          setPaginaActual={setPaginaActual}
        />
      </Card>
    </div>
  );
};

export default MediosPago;
