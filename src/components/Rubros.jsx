import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  deleteDoc,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
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
import Pagination from "./Pagination";

const MySwal = withReactContent(Swal);
const rubrosCollection = collection(db, "rubros");

const Rubros = () => {
  const [rubros, setRubros] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoAtajo, setNuevoAtajo] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const rubrosPorPagina = 10;
  useEffect(() => {
    obtenerRubros();
  }, []);

  const obtenerRubros = async () => {
    const snapshot = await getDocs(rubrosCollection);
    const rubrosData = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setRubros(rubrosData);
  };

  const agregarRubro = async () => {
    const { value: formValues } = await MySwal.fire({
      title: "Nuevo Rubro",
      html:
        `<input id="nombre" class="swal2-input" placeholder="Nombre del rubro">` +
        `<input id="atajo" class="swal2-input" placeholder="Atajo (ej: 1, 2, 3...)">`,
      focusConfirm: false,
      showCancelButton: true,
      cancelButtonText: "Cancelar",
      confirmButtonText: "Agregar",
      preConfirm: () => {
        const nombre = document.getElementById("nombre").value.trim();
        const atajo = document.getElementById("atajo").value.trim();
        if (!nombre || !atajo) {
          Swal.showValidationMessage("Todos los campos son obligatorios");
        }
        return { nombre, atajo };
      },
    });

    if (formValues) {
      const { nombre, atajo } = formValues;
      const nombreLower = nombre.toLowerCase();
      const atajoLower = atajo.toLowerCase();

      const nombreRepetido = rubros.some(
        (r) => r.nombre.toLowerCase() === nombreLower
      );
      const atajoDuplicado = await verificarAtajoDuplicado(atajoLower);
      if (nombreRepetido || atajoDuplicado) {
        MySwal.fire("Duplicado", "El nombre o el atajo ya existen.", "info");
        return;
      }

      try {
        await addDoc(rubrosCollection, {
          nombre: nombreLower,
          atajo: atajoLower,
          categoria: "rubro",
        });
        MySwal.fire("Agregado", "Rubro creado exitosamente", "success");
        obtenerRubros();
      } catch (error) {
        console.error("Error al agregar rubro", error);
        MySwal.fire("Error", "No se pudo crear el rubro", "error");
      }
    }
  };

  const iniciarEdicion = (id, nombreActual, atajoActual) => {
    setEditandoId(id);
    setNuevoNombre(nombreActual);
    setNuevoAtajo(atajoActual);
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setNuevoNombre("");
    setNuevoAtajo("");
  };

  const guardarEdicion = async (id) => {
    if (!nuevoNombre.trim() || !nuevoAtajo.trim()) {
      MySwal.fire("Error", "Todos los campos son obligatorios.", "error");
      return;
    }

    try {
      const rubroRef = doc(db, "rubros", id);
      const atajoDuplicado = await verificarAtajoDuplicado(nuevoAtajo);

      const mismoRubro = rubros.find((r) => r.id === id);
      if (
        atajoDuplicado &&
        nuevoAtajo.toLowerCase() !== mismoRubro.atajo.toLowerCase()
      ) {
        MySwal.fire("Error", "Ese atajo ya está en uso", "error");
        return;
      }

      await updateDoc(rubroRef, {
        nombre: nuevoNombre.toLowerCase(),
        atajo: nuevoAtajo.toLowerCase(),
        categoria: "rubro",
      });
      MySwal.fire("Actualizado", "Rubro actualizado correctamente", "success");
      cancelarEdicion();
      obtenerRubros();
    } catch (error) {
      console.error("Error al actualizar rubro:", error);
      MySwal.fire("Error", "No se pudo actualizar el rubro", "error");
    }
  };

  const eliminarRubro = async (id) => {
    Swal.fire({
      title: "¿Estás seguro de que quieres eliminar este rubro?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    }).then(async (result) => {
      if (result.isConfirmed) {
        await deleteDoc(doc(db, "rubros", id));
        Swal.fire(
          "Eliminado",
          "El rubro fue eliminado correctamente",
          "success"
        );
        obtenerRubros();
      }
    });
  };

  const verificarAtajoDuplicado = async (nuevoAtajo) => {
    const atajoLower = nuevoAtajo.toLowerCase();

    const [productosSnap, rubrosSnap] = await Promise.all([
      getDocs(collection(db, "products")),
      getDocs(collection(db, "rubros")),
    ]);

    const productosAtajos = productosSnap.docs.map((doc) =>
      doc.data().atajo?.toLowerCase()
    );

    const rubrosAtajos = rubrosSnap.docs.map((doc) =>
      doc.data().atajo?.toLowerCase()
    );

    return [...productosAtajos, ...rubrosAtajos].includes(atajoLower);
  };

  // 🔹 Lógica de paginación
  const indiceUltimo = paginaActual * rubrosPorPagina;
  const indicePrimero = indiceUltimo - rubrosPorPagina;
  const rubrosActuales = rubros.slice(indicePrimero, indiceUltimo);
  const totalPaginas = Math.ceil(rubros.length / rubrosPorPagina);

  return (
    <div className="max-w-6xl mx-auto mt-10 px-4 min-h-screen text-gray-900">
      <Card className=" border border-gray-300">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Rubros</h2>
          <Button
            onClick={agregarRubro}
            className="bg-blue-600 hover:cursor-pointer"
          >
            + Agregar Rubro
          </Button>
        </div>

        <Table striped={false} className="text-center">
          <TableHead className="bg-[#1f2937]">
            <TableHeadCell>Nombre</TableHeadCell>
            <TableHeadCell>Atajo</TableHeadCell>
            <TableHeadCell>Acciones</TableHeadCell>
          </TableHead>
          <TableBody className="divide-y divide-gray-500 text-gray-900">
            {rubrosActuales.map((rubro) => (
              <TableRow key={rubro.id} className="hover:bg-gray-200 uppercase">
                <TableCell>
                  {editandoId === rubro.id ? (
                    <TextInput
                      value={nuevoNombre}
                      onChange={(e) => setNuevoNombre(e.target.value)}
                      className="text-black"
                    />
                  ) : (
                    rubro.nombre
                  )}
                </TableCell>
                <TableCell>
                  {editandoId === rubro.id ? (
                    <TextInput
                      value={nuevoAtajo}
                      onChange={(e) => setNuevoAtajo(e.target.value)}
                      className="text-black"
                    />
                  ) : (
                    rubro.atajo
                  )}
                </TableCell>
                <TableCell className="flex gap-2 justify-center lowercase">
                  {editandoId === rubro.id ? (
                    <>
                      <Button
                        size="xs"
                        className="bg-green-600 hover:bg-green-500 hover:cursor-pointer"
                        onClick={() => guardarEdicion(rubro.id)}
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
                      <Tooltip content="Editar rubro">
                        <Button
                          size="xs"
                          color="blue"
                          onClick={() =>
                            iniciarEdicion(rubro.id, rubro.nombre, rubro.atajo)
                          }
                          className="hover:cursor-pointer"
                        >
                          Editar
                        </Button>
                      </Tooltip>
                      <Tooltip content="Eliminar rubro">
                        <Button
                          size="xs"
                          onClick={() => eliminarRubro(rubro.id)}
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

export default Rubros;
