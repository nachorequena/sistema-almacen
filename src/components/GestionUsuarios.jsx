import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  deleteDoc,
  getDocs,
  updateDoc,
  doc,
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
  TextInput,
  Select,
} from "flowbite-react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import Pagination from "./Pagination";
import bcrypt from "bcryptjs"; // <-- Import HASH

const MySwal = withReactContent(Swal);
const usersCollection = collection(db, "usuarios");

const GestionUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [nuevoUsuario, setNuevoUsuario] = useState("");
  const [nuevoRol, setNuevoRol] = useState("empleado");
  const [paginaActual, setPaginaActual] = useState(1);

  const usuariosPorPagina = 10;

  useEffect(() => {
    obtenerUsuarios();
  }, []);

  const obtenerUsuarios = async () => {
    const snapshot = await getDocs(usersCollection);
    setUsuarios(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  };

  const agregarUsuario = async () => {
    const { value: formValues } = await MySwal.fire({
      title: "Nuevo Usuario",
      html: `
        <input id="usuario" class="swal2-input" placeholder="Nombre de usuario" />
        <input id="password" type="password" class="swal2-input" placeholder="Contraseña" />
        <select id="rol" class="swal2-input">
          <option value="empleado">Empleado</option>
          <option value="admin">Administrador</option>
        </select>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Guardar",
      cancelButtonText: "Cancelar",
      preConfirm: () => {
        const usuario = document.getElementById("usuario").value.trim();
        const password = document.getElementById("password").value.trim();
        const rol = document.getElementById("rol").value;

        if (!usuario || !password) {
          Swal.showValidationMessage("Todos los campos son obligatorios");
          return false;
        }

        return { usuario, password, rol };
      },
    });

    if (formValues) {
      const usuarioLower = formValues.usuario.toLowerCase();
      if (usuarios.some((u) => u.usuario.toLowerCase() === usuarioLower)) {
        return MySwal.fire("Duplicado", "Ese usuario ya existe.", "info");
      }

      // APLICAR HASH
      const hashedPassword = await bcrypt.hash(formValues.password, 10);

      await addDoc(usersCollection, {
        usuario: usuarioLower,
        password: hashedPassword,
        rol: formValues.rol,
        activo: true,
      });

      MySwal.fire("Creado", "Usuario registrado correctamente", "success");
      obtenerUsuarios();
    }
  };

  const iniciarEdicion = (id, usuario, rol) => {
    setEditandoId(id);
    setNuevoUsuario(usuario);
    setNuevoRol(rol);
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setNuevoUsuario("");
    setNuevoRol("empleado");
  };

  const guardarEdicion = async (id) => {
    if (!nuevoUsuario.trim()) {
      return MySwal.fire(
        "Error",
        "El nombre de usuario es obligatorio",
        "error"
      );
    }

    const userRef = doc(db, "usuarios", id);
    await updateDoc(userRef, {
      usuario: nuevoUsuario.toLowerCase(),
      rol: nuevoRol,
    });

    MySwal.fire("Actualizado", "Usuario modificado correctamente", "success");
    cancelarEdicion();
    obtenerUsuarios();
  };

  const cambiarPassword = async (id) => {
    const { value: nuevaPass } = await MySwal.fire({
      title: "Cambiar contraseña",
      input: "password",
      inputPlaceholder: "Nueva contraseña...",
      showCancelButton: true,
      confirmButtonText: "Actualizar",
    });

    if (nuevaPass) {
      const hashedPassword = await bcrypt.hash(nuevaPass, 10);

      await updateDoc(doc(db, "usuarios", id), { password: hashedPassword });

      MySwal.fire("Actualizada", "La contraseña fue cambiada", "success");
    }
  };

  const eliminarUsuario = async (id) => {
    Swal.fire({
      title: "¿Seguro?",
      text: "No podrás revertir esta acción",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Eliminar",
    }).then(async (result) => {
      if (result.isConfirmed) {
        await deleteDoc(doc(db, "usuarios", id));
        Swal.fire("Eliminado", "Usuario eliminado", "success");
        obtenerUsuarios();
      }
    });
  };

  const indiceUltimo = paginaActual * usuariosPorPagina;
  const indicePrimero = indiceUltimo - usuariosPorPagina;
  const usuariosActuales = usuarios.slice(indicePrimero, indiceUltimo);
  const totalPaginas = Math.ceil(usuarios.length / usuariosPorPagina);

  return (
    <div className="max-w-6xl mx-auto mt-10 px-4 min-h-screen text-gray-900">
      <Card className="border border-gray-300">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Gestión de usuarios</h2>
          <Button
            onClick={agregarUsuario}
            className="bg-blue-600 hover:bg-blue-500"
          >
            + Crear usuario
          </Button>
        </div>

        <Table className="text-center">
          <TableHead>
            <TableRow>
              <TableHeadCell>Usuario</TableHeadCell>
              <TableHeadCell>Rol</TableHeadCell>
              <TableHeadCell>Acciones</TableHeadCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {usuariosActuales.map((u) => (
              <TableRow
                key={u.id}
                className="hover:bg-gray-100 uppercase text-gray-900"
              >
                <TableCell>
                  {editandoId === u.id ? (
                    <TextInput
                      value={nuevoUsuario}
                      onChange={(e) => setNuevoUsuario(e.target.value)}
                    />
                  ) : (
                    u.usuario
                  )}
                </TableCell>

                <TableCell>
                  {editandoId === u.id ? (
                    <Select
                      value={nuevoRol}
                      onChange={(e) => setNuevoRol(e.target.value)}
                    >
                      <option value="empleado">Empleado</option>
                      <option value="admin">Administrador</option>
                    </Select>
                  ) : (
                    u.rol
                  )}
                </TableCell>

                <TableCell className="flex gap-2 justify-center">
                  {editandoId === u.id ? (
                    <>
                      <Button
                        size="xs"
                        className="bg-green-600"
                        onClick={() => guardarEdicion(u.id)}
                      >
                        Guardar
                      </Button>
                      <Button
                        size="xs"
                        className="bg-gray-500"
                        onClick={cancelarEdicion}
                      >
                        Cancelar
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="xs"
                        color="blue"
                        onClick={() => iniciarEdicion(u.id, u.usuario, u.rol)}
                      >
                        Editar
                      </Button>
                      <Button
                        size="xs"
                        onClick={() => cambiarPassword(u.id)}
                        className="bg-yellow-500 hover:bg-yellow-600"
                      >
                        Contraseña
                      </Button>
                      <Button
                        size="xs"
                        onClick={() => eliminarUsuario(u.id)}
                        className="bg-red-600 hover:bg-red-500"
                      >
                        Eliminar
                      </Button>
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

export default GestionUsuarios;
