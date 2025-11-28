import { useEffect, useRef } from "react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

export default function ModalRubro({ abierto, rubro, onConfirm, onClose }) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (!abierto || !rubro) return;

    const mostrarModal = async () => {
      const { value: total } = await MySwal.fire({
        title: `Rubro: ${rubro.nombre}`,
        input: "number",
        inputLabel: "Total vendido",
        inputPlaceholder: "Ingresá el total vendido",
        confirmButtonText: "Guardar",
        showCancelButton: true,
        cancelButtonText: "Cancelar",
        inputValidator: (value) => {
          if (!value || isNaN(value) || value <= 0) {
            return "Ingresá un número válido";
          }
        },
      });

      if (total !== undefined && total !== null && total !== "") {
        onConfirm({
          rubroId: rubro.id,
          rubroNombre: rubro.nombre,
          categoria: rubro.categoria || "sin categoria",
          total: parseFloat(total),
        });
      }

      onClose();
    };

    mostrarModal();
  }, [abierto, rubro, onConfirm, onClose]);

  return null;
}
