import {
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  TextInput,
  Table,
  TableHead,
  TableRow,
  TableHeadCell,
  TableBody,
  TableCell,
  Button,
} from "flowbite-react";

export default function ModalProductos({
  abierto,
  onClose,
  productos,
  busqueda,
  onBusquedaChange,
  onAgregar,
}) {
  const productosFiltrados = productos.filter((p) => {
    const palabrasBusqueda = (busqueda || "")
      .toLowerCase()
      .split(" ")
      .filter(Boolean);

    // Buscamos en descripción, atajo y barcode
    const textoBusquedaProducto = `${p.description || ""} ${p.atajo || ""} ${
      p.codigoBarra || ""
    }`.toLowerCase();

    // Si no hay término de búsqueda, retornar todos
    if (palabrasBusqueda.length === 0) return true;

    // Requerir que todas las palabras de búsqueda estén presentes
    return palabrasBusqueda.every((palabra) =>
      textoBusquedaProducto.includes(palabra)
    );
  });

  return (
    <Modal show={abierto} onClose={onClose} size="lg">
      <ModalHeader>Lista de productos</ModalHeader>

      <ModalBody>
        <TextInput
          placeholder="Buscar por nombre o código de barras..."
          value={busqueda}
          onChange={(e) => onBusquedaChange(e.target.value)}
          className="mb-3"
        />

        <div className="max-h-80 overflow-y-auto ">
          <Table>
            <TableHead>
              <TableHeadCell>Producto</TableHeadCell>
              <TableHeadCell>Precio</TableHeadCell>
              <TableHeadCell></TableHeadCell>
            </TableHead>

            <TableBody>
              {productosFiltrados.map((prod) => (
                <TableRow key={prod.id} className="text-gray-900">
                  <TableCell>{prod.description}</TableCell>

                  <TableCell>${prod.precio}</TableCell>

                  <TableCell>
                    <Button
                      className="bg-blue-600 hover:bg-blue-700 text-white hover:cursor-pointer"
                      size="xs"
                      onClick={() => onAgregar(prod)}
                    >
                      Agregar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </ModalBody>

      <ModalFooter>
        <Button color="gray" onClick={onClose}>
          Cerrar
        </Button>
      </ModalFooter>
    </Modal>
  );
}
