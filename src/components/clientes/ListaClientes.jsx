// src/pages/clientes/ListaClientes.jsx
import { useEffect, useState } from "react";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  Card,
  Button,
  TextInput,
  Table,
  Badge,
  TableHead,
  TableHeadCell,
  TableBody,
  TableRow,
  TableCell,
} from "flowbite-react";

const ListaClientes = () => {
  const [clientes, setClientes] = useState([]);
  const [busqueda, setBusqueda] = useState("");

  const navigate = useNavigate();
  const clientesCollection = collection(db, "clientes");

  // -----------------------------------
  // CARGAR CLIENTES
  // -----------------------------------
  const obtenerClientes = async () => {
    const data = await getDocs(clientesCollection);
    const lista = data.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    setClientes(lista);
  };

  useEffect(() => {
    obtenerClientes();
  }, []);

  // -----------------------------------
  // ELIMINAR CLIENTE
  // -----------------------------------
  const eliminarCliente = async (id, nombre) => {
    const confirm = await Swal.fire({
      title: "¿Eliminar cliente?",
      html: `<b>${nombre}</b> será eliminado permanentemente.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
    });

    if (confirm.isConfirmed) {
      await deleteDoc(doc(db, "clientes", id));
      Swal.fire("Eliminado", "El cliente ha sido eliminado.", "success");
      obtenerClientes();
    }
  };

  // -----------------------------------
  // FILTRO DE BÚSQUEDA
  // -----------------------------------
  const clientesFiltrados = clientes.filter((c) => {
    const term = busqueda.toLowerCase();
    return (
      c.nombre.toLowerCase().includes(term) ||
      c.telefono?.toLowerCase().includes(term)
    );
  });

  // -----------------------------------
  // ETIQUETAS DE CUENTA CORRIENTE
  // -----------------------------------
  const renderTipoCC = (tipo) => {
    switch (tipo) {
      case "ficha":
        return <Badge color="purple">Ficha</Badge>;
      case "facturero":
        return <Badge color="yellow">Facturero</Badge>;
      default:
        return <Badge color="gray">Sin CC</Badge>;
    }
  };

  return (
    <div className="p-6 mx-auto max-w-6xl">
      <Card>
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-black">Clientes</h1>

          <Button color="blue" onClick={() => navigate("/clientes/create")}>
            + Nuevo Cliente
          </Button>
        </div>

        {/* BUSCADOR */}
        <div className="mb-4">
          <TextInput
            placeholder="Buscar por nombre o teléfono..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        {/* TABLA */}
        <div className="overflow-x-auto">
          <Table hoverable>
            <TableHead>
              <TableHeadCell>Nombre</TableHeadCell>
              <TableHeadCell>Teléfono</TableHeadCell>
              <TableHeadCell>Dirección</TableHeadCell>
              <TableHeadCell>Tipo CC</TableHeadCell>
              <TableHeadCell>Saldo CC</TableHeadCell>
              <TableHeadCell>Acciones</TableHeadCell>
            </TableHead>

            <TableBody className="divide-y">
              {clientesFiltrados.map((cliente) => (
                <TableRow key={cliente.id}>
                  <TableCell className="font-medium text-black">
                    {cliente.nombre}
                  </TableCell>

                  <TableCell>{cliente.telefono || "-"}</TableCell>

                  <TableCell>{cliente.direccion || "-"}</TableCell>

                  <TableCell>
                    {renderTipoCC(cliente.tipoCuentaCorriente)}
                  </TableCell>

                  <TableCell className="font-semibold">
                    {cliente.saldoCC
                      ? `$${cliente.saldoCC.toFixed(2)}`
                      : "$0.00"}
                  </TableCell>

                  <TableCell className="flex gap-2">
                    <Button
                      size="xs"
                      color="light"
                      onClick={() => navigate(`/clientes/edit/${cliente.id}`)}
                    >
                      Editar
                    </Button>

                    <Button
                      size="xs"
                      color="failure"
                      onClick={() =>
                        eliminarCliente(cliente.id, cliente.nombre)
                      }
                    >
                      Eliminar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}

              {clientesFiltrados.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6">
                    No hay clientes que coincidan con la búsqueda.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};

export default ListaClientes;
