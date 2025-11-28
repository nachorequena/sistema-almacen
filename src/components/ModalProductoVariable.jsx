import { useEffect } from "react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

export default function ModalProductoVariable({
  abierto,
  producto,
  onConfirm,
  onClose,
}) {
  useEffect(() => {
    if (!abierto || !producto) return;

    const mostrarModal = async () => {
      const { value: cantidad } = await MySwal.fire({
        title: `Producto: ${producto.description}`,
        input: "number",
        inputLabel: `$${producto.precio} x ${producto.unidadVenta || "unidad"}`,
        inputPlaceholder: `Ingresá la cantidad vendida en ${
          producto.unidadVenta || "unidad"
        }`,
        confirmButtonText: "Agregar",
        showCancelButton: true,
        cancelButtonText: "Cancelar",
        inputValidator: (value) => {
          if (!value || isNaN(value) || value <= 0) {
            return "Ingresá una cantidad válida";
          }
        },
      });

      if (cantidad !== undefined && cantidad !== null && cantidad !== "") {
        onConfirm({
          productoId: producto.id,
          cantidad: parseFloat(cantidad),
        });
      }

      onClose();
    };

    mostrarModal();
  }, [abierto, producto, onConfirm, onClose]);

  return null;
}
