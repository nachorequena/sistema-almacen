import { useState } from "react";
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
  Kbd,
  Button,
} from "flowbite-react";

export default function ModalAtajos({ abierto, onClose, productos, rubros }) {
  const [busqueda, setBusqueda] = useState("");

  return (
    <Modal dismissible show={abierto} onClose={onClose}>
      <ModalHeader>Atajos disponibles</ModalHeader>
      <ModalBody>
        <div className="space-y-4">
          <TextInput
            placeholder="Buscar atajo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="mb-4 mx-10"
          />

          <Table className="text-center">
            <TableHead>
              <TableRow>
                <TableHeadCell>Nombre</TableHeadCell>
                <TableHeadCell>Atajo</TableHeadCell>
              </TableRow>
            </TableHead>
            <TableBody className="divide-y">
              {/* 🚀 Productos filtrados */}
              {productos
                .filter((p) => {
                  const palabrasBusqueda = busqueda
                    .toLowerCase()
                    .split(" ")
                    .filter(Boolean);
                  const tieneAtajo = !!p.atajo; // Verifica que tenga atajo

                  // Prepara los textos a buscar (descripción y atajo)
                  const textoBusquedaProducto = `${p.description || ""} ${
                    p.atajo || ""
                  }`.toLowerCase();

                  // Si no hay atajo, lo ignoramos. Si hay atajo, filtramos.
                  if (!tieneAtajo) return false;

                  // Si no hay texto de búsqueda, mostramos todos los que tienen atajo
                  if (palabrasBusqueda.length === 0) return true;

                  // Verifica que TODAS las palabras de la búsqueda estén presentes
                  return palabrasBusqueda.every((palabra) =>
                    textoBusquedaProducto.includes(palabra)
                  );
                })
                .map((p) => (
                  <TableRow
                    key={p.id}
                    className="bg-white dark:border-gray-700 dark:bg-gray-800"
                  >
                    <TableCell className="whitespace-nowrap font-medium text-gray-800 dark:text-white uppercase">
                      {p.description}
                    </TableCell>
                    <TableCell>
                      <Kbd>{p.atajo}</Kbd> + <Kbd>Enter</Kbd>
                    </TableCell>
                  </TableRow>
                ))}

              {/* 🚀 Rubros filtrados */}
              {rubros
                .filter((r) => {
                  const palabrasBusqueda = busqueda
                    .toLowerCase()
                    .split(" ")
                    .filter(Boolean);
                  const tieneAtajo = !!r.atajo; // Verifica que tenga atajo

                  // Prepara los textos a buscar (nombre y atajo)
                  // NOTA: Para rubros usas 'r.nombre' en lugar de 'r.description'
                  const textoBusquedaRubro = `${r.nombre || ""} ${
                    r.atajo || ""
                  }`.toLowerCase();

                  // Si no hay atajo, lo ignoramos. Si hay atajo, filtramos.
                  if (!tieneAtajo) return false;

                  // Si no hay texto de búsqueda, mostramos todos los que tienen atajo
                  if (palabrasBusqueda.length === 0) return true;

                  // Verifica que TODAS las palabras de la búsqueda estén presentes
                  return palabrasBusqueda.every((palabra) =>
                    textoBusquedaRubro.includes(palabra)
                  );
                })
                .map((r) => (
                  <TableRow
                    key={r.id}
                    className="bg-white dark:border-gray-700 dark:bg-gray-800"
                  >
                    <TableCell className="whitespace-nowrap font-medium text-gray-800 dark:text-white uppercase">
                      {r.nombre}
                    </TableCell>
                    <TableCell>
                      <Kbd>{r.atajo}</Kbd> + <Kbd>Enter</Kbd>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button onClick={onClose} className="hover:cursor-pointer">
          Cerrar
        </Button>
      </ModalFooter>
    </Modal>
  );
}
