import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  Button,
} from "flowbite-react";

export default function ListaItemsVenta({
  itemsVendidos,
  productos,
  onEliminar,
}) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHead className="text-center sticky top-0 z-10 bg-white shadow-sm">
          <TableRow>
            <TableHeadCell>Descripción</TableHeadCell>
            <TableHeadCell>Cantidad</TableHeadCell>
            <TableHeadCell>Unidad de venta</TableHeadCell>
            <TableHeadCell>Precio Unitario</TableHeadCell>
            <TableHeadCell>Subtotal</TableHeadCell>
            <TableHeadCell>Tipo</TableHeadCell>
            <TableHeadCell>Acciones</TableHeadCell>
          </TableRow>
        </TableHead>
        <TableBody className=" text-gray-900 text-center">
          {itemsVendidos.map((item, idx) => {
            if (item.productoId) {
              const prod = productos.find((p) => p.id === item.productoId);
              const precioUnitario = prod?.precio || 0;
              const subtotal = precioUnitario * item.cantidad;

              return (
                <TableRow
                  key={idx}
                  className={
                    idx % 2 === 0
                      ? "bg-white uppercase"
                      : "bg-gray-100 uppercase"
                  }
                >
                  <TableCell>
                    {prod?.description || prod?.nombre || "Producto"}
                  </TableCell>
                  <TableCell>{item.cantidad}</TableCell>
                  <TableCell>{prod?.unidadVenta || "unidad"}</TableCell>
                  <TableCell>${precioUnitario.toFixed(2)}</TableCell>
                  <TableCell>${subtotal.toFixed(2)}</TableCell>
                  <TableCell>Producto</TableCell>
                  <TableCell className="flex gap-2 items-center justify-center ">
                    <Button
                      size="xs"
                      onClick={() => onEliminar(idx)}
                      className="bg-red-600 hover:bg-red-500 hover:cursor-pointer"
                    >
                      Eliminar
                    </Button>
                  </TableCell>
                </TableRow>
              );
            } else if (item.rubroId) {
              return (
                <TableRow
                  key={idx}
                  className={
                    idx % 2 === 0
                      ? "bg-white uppercase"
                      : "bg-gray-100 uppercase"
                  }
                >
                  <TableCell>{item.rubroNombre}</TableCell>
                  <TableCell>—</TableCell>
                  <TableCell>—</TableCell>
                  <TableCell>—</TableCell>
                  <TableCell>${item.cantidad.toFixed(2)}</TableCell>
                  <TableCell>Rubro</TableCell>
                  <TableCell className="flex gap-2 items-center justify-center ">
                    <Button
                      size="xs"
                      onClick={() => onEliminar(idx)}
                      className="bg-red-600 hover:bg-red-500 hover:cursor-pointer"
                    >
                      Eliminar
                    </Button>
                  </TableCell>
                </TableRow>
              );
            }
            return null;
          })}
        </TableBody>
      </Table>
    </div>
  );
}
