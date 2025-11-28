import { useEffect } from "react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

export default function ModalCobro({
  abierto,
  onClose,
  itemsVendidos,
  mediosPago,
  totalBase,
  onConfirm,
}) {
  useEffect(() => {
    if (!abierto) return;

    const total = totalBase; // Usar el prop totalBase directamente

    const buildMediosHtml = (medios) =>
      (medios || [])
        .map(
          (m) => `
        <div style="margin-bottom:6px;">
          <label style="display:flex;align-items:center;gap:6px;">
            <input type="checkbox" id="check-${m.id}" />
            ${m.nombre} ${
            m.recargo && m.recargo > 0
              ? `<span style="color:gray;">(+${m.recargo.toFixed(0)}%)</span>`
              : ""
          }
          </label>
          <input type="number" id="medio-${m.id}" class="swal2-input"
            placeholder="Monto" style="width:120px; display:none; margin-top:4px;"
            min="0" step="0.01" />
        </div>`
        )
        .join("");

    const html = `
    <p id="total-info" class="mb-2 font-semibold">Total base: $${total.toFixed(
      2
    )}</p>
    <div style="text-align: left; margin-top: 10px;">
      <p class="mb-2 font-semibold">Seleccionar medios de pago:</p>
      ${buildMediosHtml(mediosPago)}
    </div>
    <p id="recargo-info" class="mt-2 text-gray-700">Recargo total: $0.00</p>
    <p id="total-con-recargo" class="mt-1 font-bold text-black">Total con recargo: $${total.toFixed(
      2
    )}</p>
    <p id="vuelto-info" class="mt-2 font-bold text-orange-500";">Vuelto: $0.00</p>
  `;

    MySwal.fire({
      title: "Cobro",
      html,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Confirmar",
      cancelButtonText: "Cancelar",
      didOpen: () => {
        if (!mediosPago || !mediosPago.length) return;

        function recalcularTotales() {
          let sumaMontosBaseCubiertos = 0; // Parte del Total Base cubierta por pagos con recargo
          let sumaIngresos = 0; // Suma de lo que el cliente entregó (monto de efectivo, monto cargado a tarjeta)
          let recargoTotal = 0;

          // 1. Calcular recargos y montos bases cubiertos
          mediosPago.forEach((m) => {
            const checkbox = document.getElementById(`check-${m.id}`);
            const input = document.getElementById(`medio-${m.id}`);
            if (!checkbox || !input) return;

            const monto = checkbox.checked ? parseFloat(input.value) || 0 : 0;

            // normalizar recargo
            let factor = 0;
            if (m.recargo) {
              factor = m.recargo > 1 ? m.recargo / 100 : m.recargo;
            }

            // --- LA LÓGICA DE RECARGO CRÍTICA ---
            if (factor > 0) {
              // Si es un medio con recargo (Tarjeta A):
              // El 'monto' ingresado representa la porción del Total Base que cubre.
              // A ese monto (base) se le aplica el recargo.
              recargoTotal += monto * factor;
              sumaMontosBaseCubiertos += monto;

              // Lo que realmente "se paga" con este medio es el monto recargado
              sumaIngresos += monto * (1 + factor);
            } else {
              // Si es Efectivo o Tarjeta B (sin recargo):
              // El 'monto' ingresado es el dinero entregado (cubre base y/o vuelto).
              sumaIngresos += monto;

              // Solo una parte de este monto (hasta cubrir el Total Base restante)
              // se considera "base cubierto" para fines de registro si es necesario.
              // Para el cálculo de recargo/vuelto, solo necesitamos 'sumaIngresos'.
            }
          });

          const totalConRecargo = total + recargoTotal;

          // --- LÓGICA DE FALTANTE/VUELTO ---
          // Diferencia entre lo que el cliente *entregó* (sumaIngresos) y la *deuda final* (totalConRecargo)
          const diferencia = sumaIngresos - totalConRecargo;

          // Se usa 'diferencia' para mostrar Faltante o Vuelto

          // ... (Actualización de elementos HTML: elRecargo, elTotal, elVuelto)
          const elRecargo = document.getElementById("recargo-info");
          const elTotal = document.getElementById("total-con-recargo");
          const elVuelto = document.getElementById("vuelto-info");

          if (elRecargo)
            elRecargo.innerText = `Recargo total: $${recargoTotal.toFixed(2)}`;
          if (elTotal)
            elTotal.innerText = `Total con recargo: $${totalConRecargo.toFixed(
              2
            )}`;

          if (elVuelto) {
            if (diferencia < 0) {
              elVuelto.innerText = `Faltante: $${(diferencia * -1).toFixed(2)}`;
              // ✅ Aplicar clase Tailwind para FALTANTE (rojo)
              elVuelto.className = "mt-1 font-bold text-red-500";
            } else {
              elVuelto.innerText = `Vuelto: $${diferencia.toFixed(2)}`;
              // ✅ Aplicar clase Tailwind para VUELTO (naranja)
              elVuelto.className = "mt-1 font-bold text-orange-500";
            }
          }
        }

        mediosPago.forEach((m) => {
          const checkbox = document.getElementById(`check-${m.id}`);
          const input = document.getElementById(`medio-${m.id}`);
          if (!checkbox || !input) return;

          checkbox.addEventListener("change", () => {
            input.style.display = checkbox.checked ? "inline-block" : "none";
            // Puedes inicializar el valor del input aquí si es el primer medio seleccionado
            // input.value = checkbox.checked ? (totalBase - sumaOtrosPagos) : '';
            input.value = "";
            recalcularTotales();
          });
          input.addEventListener("input", recalcularTotales);
        });
      },
      preConfirm: () => {
        Swal.showLoading();
        const pagosConMontos = (mediosPago || [])
          .map((m) => {
            const checkbox = document.getElementById(`check-${m.id}`);
            const val =
              parseFloat(document.getElementById(`medio-${m.id}`).value) || 0;
            if (!checkbox || !checkbox.checked || val <= 0) return null;

            const factor = m.recargo
              ? m.recargo > 1
                ? m.recargo / 100
                : m.recargo
              : 0;
            const montoConRecargo = val + val * factor;

            return {
              medioId: m.id,
              nombre: m.nombre,
              monto: val, // Monto base ingresado por el cajero (sin recargo)
              recargoFactor: factor,
              montoConRecargo, // Monto base + recargo
              recargoMonto: val * factor,
            };
          })
          .filter((p) => p && p.monto > 0);

        // 1. Recalcula los totales
        const sumaIngresos = pagosConMontos.reduce(
          (acc, p) => acc + p.montoConRecargo,
          0
        ); // Lo que realmente el cliente entregó (incluye vuelto/recargos)

        const recargoTotal = pagosConMontos.reduce(
          (acc, p) => acc + p.recargoMonto,
          0
        );
        const totalConRecargo = total + recargoTotal;

        // Separamos la suma de la base cubierta:
        let sumaBaseCubiertaRecargo = 0;
        let sumaBaseCubiertaSinRecargo = 0; // Efectivo, etc.

        pagosConMontos.forEach((p) => {
          if (p.recargoFactor > 0) {
            // Para medios con recargo, el monto ingresado es la porción de la Base
            sumaBaseCubiertaRecargo += p.monto;
          } else {
            // Para medios sin recargo (Efectivo), el monto es el dinero entregado
            sumaBaseCubiertaSinRecargo += p.monto;
          }
        });

        // ------------------------------------
        // VALIDACIÓN 1 REEMPLAZADA: Solo aplica a pagos con recargo.
        // Evita que se duplique la base con tarjetas/medios con recargo.
        if (sumaBaseCubiertaRecargo > total) {
          Swal.hideLoading();
          Swal.showValidationMessage(
            `Error de división de pago: La suma de los montos ingresados en medios con **recargo** ($${sumaBaseCubiertaRecargo.toFixed(
              2
            )}) excede el Total Base de la venta ($${total.toFixed(2)}).`
          );
          return false;
        }
        // ------------------------------------

        // LÓGICA DE CÁLCULO DE BASE REALMENTE CUBIERTA (para Validación 2)

        // 1. ¿Cuánto de la base falta cubrir después de los pagos con recargo?
        const baseRestante = total - sumaBaseCubiertaRecargo;

        // 2. ¿Cuánto del monto sin recargo (efectivo) es necesario para cubrir la base restante?
        const baseCubiertaPorEfectivo = Math.min(
          sumaBaseCubiertaSinRecargo,
          baseRestante
        );

        // 3. La suma total de la base cubierta para la Validación 2
        const sumaBaseCubiertaFinal =
          sumaBaseCubiertaRecargo + baseCubiertaPorEfectivo;
        const redondear = (n) => Math.round(n * 100) / 100;

        // VALIDACIÓN 2: Se debe cubrir el Total Base
        if (redondear(sumaBaseCubiertaFinal) < redondear(total)) {
          Swal.hideLoading();
          Swal.showValidationMessage(
            `El total base de la venta ($${total.toFixed(
              2
            )}) no está cubierto por los pagos ingresados ($${sumaBaseCubiertaFinal.toFixed(
              2
            )}).`
          );
          return false;
        }

        return {
          pagos: pagosConMontos,
          totalConRecargo,
          recargoTotal,
          vuelto: (sumaIngresos - totalConRecargo).toFixed(2),
        };
      },
    }).then((result) => {
      if (result.isConfirmed) {
        onConfirm(result.value);
      }
      onClose();
    });
  }, [abierto, mediosPago, totalBase, onConfirm, onClose, itemsVendidos]);

  // Función auxiliar para calcular el total (copiada de CreateVenta)
  function calcularTotal() {
    return itemsVendidos.reduce((acc, item) => {
      // Aquí necesitarías acceso a 'productos' desde props o context
      // Por ahora retorna totalBase que viene como prop
      return totalBase;
    }, 0);
  }

  return null;
}
