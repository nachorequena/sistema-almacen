import { useState, useEffect, useRef } from "react";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import {
  Card,
  TextInput,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Kbd,
} from "flowbite-react";
import { useNavigate } from "react-router-dom";
import { useCallback } from "react";
const MySwal = withReactContent(Swal);

const CreateVenta = () => {
  const [productos, setProductos] = useState([]);
  const [rubros, setRubros] = useState([]);
  const [mediosPago, setMediosPago] = useState([]);
  const [itemsVendidos, setItemsVendidos] = useState([]);
  const [mostrarModalCobro, setMostrarModalCobro] = useState(false);

  const [inputValue, setInputValue] = useState("");
  const [openModalAtajos, setOpenModalAtajos] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const montoClienteInputRef = useRef(null);
  useEffect(() => {
    // Solo enfocamos el input si no hay un modal abierto
    if (!mostrarModalCobro) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100); // pequeño delay por seguridad
    }
  }, [itemsVendidos, mostrarModalCobro]);

  useEffect(() => {
    if (!mostrarModalCobro) return;

    const totalBase = calcularTotal();

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
    <p id="total-info" class="mb-2 font-semibold">Total base: $${totalBase.toFixed(
      2
    )}</p>
    <div style="text-align: left; margin-top: 10px;">
      <p class="mb-2 font-semibold">Seleccionar medios de pago:</p>
      ${buildMediosHtml(mediosPago)}
    </div>
    <p id="recargo-info" class="mt-2 text-gray-700">Recargo total: $0.00</p>
    <p id="total-con-recargo" class="mt-1 font-bold text-black">Total con recargo: $${totalBase.toFixed(
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

          const totalConRecargo = totalBase + recargoTotal;

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
        const totalConRecargo = totalBase + recargoTotal;

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
        if (sumaBaseCubiertaRecargo > totalBase) {
          Swal.showValidationMessage(
            `Error de división de pago: La suma de los montos ingresados en medios con **recargo** ($${sumaBaseCubiertaRecargo.toFixed(
              2
            )}) excede el Total Base de la venta ($${totalBase.toFixed(2)}).`
          );
          return false;
        }
        // ------------------------------------

        // LÓGICA DE CÁLCULO DE BASE REALMENTE CUBIERTA (para Validación 2)

        // 1. ¿Cuánto de la base falta cubrir después de los pagos con recargo?
        const baseRestante = totalBase - sumaBaseCubiertaRecargo;

        // 2. ¿Cuánto del monto sin recargo (efectivo) es necesario para cubrir la base restante?
        const baseCubiertaPorEfectivo = Math.min(
          sumaBaseCubiertaSinRecargo,
          baseRestante
        );

        // 3. La suma total de la base cubierta para la Validación 2
        const sumaBaseCubiertaFinal =
          sumaBaseCubiertaRecargo + baseCubiertaPorEfectivo;

        // VALIDACIÓN 2: Se debe cubrir el Total Base
        if (sumaBaseCubiertaFinal < totalBase) {
          Swal.showValidationMessage(
            `El total base de la venta ($${totalBase.toFixed(
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
        confirmarVenta(result.value);
      }
      setMostrarModalCobro(false);
    });
  }, [mostrarModalCobro]);

  useEffect(() => {
    const fetchData = async () => {
      const productosSnap = await getDocs(collection(db, "products"));
      const rubrosSnap = await getDocs(collection(db, "rubros"));
      const pagosSnap = await getDocs(collection(db, "mediosDePago"));
      const productosList = productosSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setProductos(productosList);
      setRubros(rubrosSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setMediosPago(
        pagosSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
    };
    fetchData();
  }, []);

  const mostrarModalRubro = async (rubro) => {
    inputRef.current?.blur();

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
      setItemsVendidos((prev) => {
        const index = prev.findIndex((i) => i.rubroId === rubro.id);

        if (index !== -1) {
          //  Si ya existe, sumamos
          const copia = [...prev];
          copia[index].cantidad += parseFloat(total);
          return copia;
        } else {
          //  Si no existe, lo agregamos
          return [
            ...prev,
            {
              rubroId: rubro.id,
              rubroNombre: rubro.nombre,
              categoria: rubro.categoria || "sin categoria",
              cantidad: parseFloat(total),
            },
          ];
        }
      });
    }
  };
  const mostrarModalProductoVariable = async (producto) => {
    inputRef.current?.blur();

    const { value: cantidad } = await MySwal.fire({
      title: `Producto: ${producto.description}`,
      input: "number",
      inputLabel: `Cantidad en ${producto.unidadVenta || "unidad"}`,
      inputPlaceholder: "Ingresá la cantidad vendida",
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
      setItemsVendidos((prev) => {
        const index = prev.findIndex((i) => i.productoId === producto.id);

        if (index !== -1) {
          // Si ya existe, le sumamos la cantidad
          const copia = [...prev];
          copia[index].cantidad += parseFloat(cantidad);
          return copia;
        } else {
          // Si no existe, lo agregamos nuevo
          return [
            ...prev,
            {
              productoId: producto.id,
              cantidad: parseFloat(cantidad),
            },
          ];
        }
      });
    }
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleInputKeyDown = (e) => {
    // ENTER → Buscar producto/rubro
    if (e.key === "Enter") {
      e.preventDefault();
      const value = inputValue.trim();
      if (!value) return;
      const cleanValue = value.replace(/\s/g, "");
      const rubro = rubros.find(
        (r) => String(r.atajo).trim().toLowerCase() === value.toLowerCase()
      );

      if (rubro) {
        mostrarModalRubro(rubro);
      } else {
        const prodCodigo = productos.find((p) => p.codigoBarra === cleanValue);
        if (prodCodigo) {
          agregarProducto(prodCodigo);
        } else {
          const prodAtajo = productos.find(
            (p) =>
              p.atajo &&
              String(p.atajo).trim().toLowerCase() === value.toLowerCase()
          );
          if (prodAtajo) {
            mostrarModalProductoVariable(prodAtajo);
          } else {
            Swal.fire("Atajo o producto no encontrado", "", "error");
          }
        }
      }
      setInputValue("");
    }

    // "+" → Sumar al último producto
    else if (e.key === "+") {
      e.preventDefault();
      if (itemsVendidos.length > 0) {
        const ultimo = itemsVendidos[itemsVendidos.length - 1];
        if (ultimo.productoId) {
          const producto = productos.find((p) => p.id === ultimo.productoId);
          if (producto) {
            agregarProducto(producto);
            console.log(
              "Producto agregado por el + dentro del input:",
              producto
            );
          }
        }
      }
    }

    // "Backspace" → Eliminar el último producto
    else if (e.key === "Backspace" && inputValue === "") {
      // Solo si el input está vacío
      e.preventDefault();
      eliminarUltimoProducto();
    }
  };

  const agregarProducto = (prod) => {
    setItemsVendidos((prev) => {
      const index = prev.findIndex((i) => i.productoId === prod.id);
      if (index !== -1) {
        const copia = [...prev];
        copia[index].cantidad += 1;
        return copia;
      } else {
        return [...prev, { productoId: prod.id, cantidad: 1 }];
      }
    });
  };

  useEffect(() => {
    if (mostrarModalCobro && montoClienteInputRef.current) {
      montoClienteInputRef.current.select();
    }
  }, [mostrarModalCobro]);

  const eliminarUltimoProducto = () => {
    setItemsVendidos((prev) => prev.slice(0, -1));
  };

  const eliminarItem = (index) => {
    setItemsVendidos((prev) => prev.filter((_, i) => i !== index));
    // Volver a focus para seguir escaneando
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const calcularTotal = () => {
    return itemsVendidos.reduce((acc, item) => {
      if (item.productoId) {
        const prod = productos.find((p) => p.id === item.productoId);
        return acc + (prod?.precio || 0) * item.cantidad;
      } else if (item.rubroId) {
        return acc + item.cantidad;
      }
      return acc;
    }, 0);
  };

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === " " && !mostrarModalCobro && !openModalAtajos) {
        e.preventDefault();

        setMostrarModalCobro(true);
        return;
      }

      const isInputFocused =
        document.activeElement.tagName.toLowerCase() === "input";
      if (isInputFocused) return;

      if (e.key === "+") {
        e.preventDefault();
        if (itemsVendidos.length > 0) {
          const ultimo = itemsVendidos[itemsVendidos.length - 1];
          if (ultimo.productoId) {
            const producto = productos.find((p) => p.id === ultimo.productoId);
            if (producto) {
              agregarProducto(producto);
              console.log("Producto agregado por el +:", producto);
            }
          }
        }
      } else if (e.key === "Backspace") {
        e.preventDefault();
        eliminarUltimoProducto();
      }
    },
    [mostrarModalCobro, itemsVendidos, productos, openModalAtajos]
  );

  useEffect(() => {
    console.log("Agregando listener global");
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      console.log("Removiendo listener global");
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  const confirmarVenta = async (result) => {
    if (itemsVendidos.length === 0) {
      Swal.fire("No hay productos para vender", "", "warning");
      return;
    }

    const productosDetalles = itemsVendidos
      .filter((item) => item.productoId)
      .map((item) => {
        const p = productos.find((p) => p.id === item.productoId);
        return {
          productoId: p.id,
          descripcion: p.description,
          precio: p.precio,
          cantidad: item.cantidad,
          categoria: p.categoria || "sin categoria",
          unidadVenta: p.unidadVenta || "unidad",
        };
      });

    const rubrosDetalles = itemsVendidos
      .filter((item) => item.rubroId)
      .map((item) => ({
        rubroId: item.rubroId,
        rubroNombre: item.rubroNombre,
        categoria: item.categoria,
        total: item.cantidad,
      }));

    const totalBase = calcularTotal();

    try {
      await addDoc(collection(db, "ventas"), {
        productos: productosDetalles,
        rubros: rubrosDetalles,
        totalBase: totalBase,
        totalConRecargo: result?.totalConRecargo || totalBase,
        recargoTotal: result?.recargoTotal || 0,
        pagos: result?.pagos || [],
        vuelto: parseFloat(result?.vuelto) || 0,
        fecha: new Date(),
      });

      setItemsVendidos([]);
      setMostrarModalCobro(false);
      Swal.fire("Venta confirmada", "", "success");
    } catch (error) {
      console.error("Error al guardar la venta:", error);
      Swal.fire("Error al guardar la venta", error.message, "error");
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="flex-1 p-6 rounded-xl space-y-4 pr-72" tabIndex={0}>
        <Card>
          <div className="flex justify-start">
            <Button
              pill
              size="s"
              className="z-50 text-blue-500 bg-transparent hover:bg-transparent hover:text-blue-600 transition transform hover:scale-105 hover:cursor-pointer"
              onClick={() => navigate("/ventas")}
            >
              Volver
            </Button>
          </div>
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
                    const prod = productos.find(
                      (p) => p.id === item.productoId
                    );
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
                            onClick={() => eliminarItem(idx)}
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
                            onClick={() => eliminarItem(idx)}
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
          <div className="h-28" />
          {/* 🚀 FIXED COLUMNA DERECHA (Fixed Footer movido) */}
          <div className="fixed top-0 bottom-0 right-0 z-40 bg-white border-l border-blue-600 shadow-2xl p-4 flex flex-col justify-between items-center space-y-4 w-72 h-full">
            <div className="w-full px-2">
              <TextInput
                ref={inputRef}
                placeholder="Escaneá código o escribí atajo"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleInputKeyDown}
                className="w-full"
              />
              <Button
                onClick={() => setOpenModalAtajos(true)}
                className="hover:cursor-pointer mt-2 w-full border border-yellow-400 text-yellow-400 bg-transparent hover:bg-yellow-400 hover:text-white transition"
              >
                Ver atajos
              </Button>
              <Modal
                dismissible
                show={openModalAtajos}
                onClose={() => setOpenModalAtajos(false)}
              >
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
                            const textoBusquedaProducto = `${
                              p.description || ""
                            } ${p.atajo || ""}`.toLowerCase();

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
                  <Button
                    onClick={() => setOpenModalAtajos(false)}
                    className="hover:cursor-pointer"
                  >
                    Cerrar
                  </Button>
                </ModalFooter>
              </Modal>
            </div>
            {/* Parte Superior de la Columna: Total */}

            {/* Parte Media de la Columna: Input de Escaneo/Atajo */}

            {/* Parte Inferior de la Columna: Botón de Cobrar */}
            <div className="w-full p-2 pb-8">
              <div className="flex flex-col items-center justify-center py-8 flex-grow">
                <p className="text-2xl font-semibold text-gray-600 uppercase">
                  Total a Pagar
                </p>
                <p className="text-5xl font-extrabold text-green-700 tracking-tight">
                  ${calcularTotal().toFixed(2)}
                </p>
              </div>
              <Button
                // Dispara el SweetAlert modal de cobro
                onClick={() => setMostrarModalCobro(true)}
                size="xl"
                className={`w-full h-20 transition duration-200 shadow-xl ${
                  itemsVendidos.length === 0
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 cursor-pointer"
                }`}
                disabled={itemsVendidos.length === 0}
              >
                <span className="text-xl font-extrabold">Cobrar (Espacio)</span>
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CreateVenta;
