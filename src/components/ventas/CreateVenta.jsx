import { useState, useEffect, useRef } from "react";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import ModalCobro from "../ModalCobro";
import ModalAtajos from "../ModalAtajos";
import ModalProductos from "../ModalProductos";
import ModalRubro from "../ModalRubro";
import ModalProductoVariable from "../ModalProductoVariable";
import ListaItemsVenta from "../ListaItemsVenta";
import SidebarVenta from "./SidebarVenta";
import { Card, TextInput, Button } from "flowbite-react";
import { useNavigate } from "react-router-dom";
import { useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
const MySwal = withReactContent(Swal);

const CreateVenta = () => {
  const { cerrarSesion } = useAuth();
  const [productos, setProductos] = useState([]);
  const [rubros, setRubros] = useState([]);
  const [mediosPago, setMediosPago] = useState([]);
  const [itemsVendidos, setItemsVendidos] = useState([]);
  const [mostrarModalCobro, setMostrarModalCobro] = useState(false);
  const [openModalProductos, setOpenModalProductos] = useState(false);
  const [busquedaProducto, setBusquedaProducto] = useState("");

  const [inputValue, setInputValue] = useState("");
  const [openModalAtajos, setOpenModalAtajos] = useState(false);
  const [rubroSeleccionado, setRubroSeleccionado] = useState(null);
  const [productoVariableSeleccionado, setProductoVariableSeleccionado] =
    useState(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const montoClienteInputRef = useRef(null);

  const usuario = JSON.parse(localStorage.getItem("usuario"));

  useEffect(() => {
    // Solo enfocamos el input si no hay un modal abierto
    if (!mostrarModalCobro) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100); // pequeño delay por seguridad
    }
  }, [itemsVendidos, mostrarModalCobro]);

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

  const handleConfirmarRubro = (data) => {
    setItemsVendidos((prev) => {
      const index = prev.findIndex((i) => i.rubroId === data.rubroId);

      if (index !== -1) {
        // Si ya existe, sumamos
        const copia = [...prev];
        copia[index].cantidad += data.total;
        return copia;
      } else {
        // Si no existe, lo agregamos
        return [
          ...prev,
          {
            rubroId: data.rubroId,
            rubroNombre: data.rubroNombre,
            categoria: data.categoria,
            cantidad: data.total,
          },
        ];
      }
    });
  };

  const handleConfirmarProductoVariable = (data) => {
    setItemsVendidos((prev) => {
      const index = prev.findIndex((i) => i.productoId === data.productoId);

      if (index !== -1) {
        // Si ya existe, le sumamos la cantidad
        const copia = [...prev];
        copia[index].cantidad += data.cantidad;
        return copia;
      } else {
        // Si no existe, lo agregamos nuevo
        return [
          ...prev,
          {
            productoId: data.productoId,
            cantidad: data.cantidad,
          },
        ];
      }
    });
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
        setRubroSeleccionado(rubro);
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
            setProductoVariableSeleccionado(prodAtajo);
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
      if (
        e.key === " " &&
        !mostrarModalCobro &&
        !openModalAtajos &&
        !openModalProductos
      ) {
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
        cajeroId: usuario.id,
        cajeroNombre: usuario.usuario,
      });

      setItemsVendidos([]);
      setMostrarModalCobro(false);
      Swal.fire({
        title: "Venta confirmada",
        icon: "success",
        timer: 1000, // duración en ms
        showConfirmButton: false,
        timerProgressBar: true,
      });
    } catch (error) {
      console.error("Error al guardar la venta:", error);
      Swal.fire("Error al guardar la venta", error.message, "error");
    }
  };

  const handleLogout = async () => {
    await cerrarSesion();
    navigate("/login");
  };

  const agregarProductoPorSeleccion = (producto) => {
    agregarProducto(producto);
    setOpenModalProductos(false);
    // Volver a enfocar el input para seguir escaneando
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  return (
    <div className="flex min-h-screen">
      <div className="flex-1 p-6 rounded-xl space-y-4 pr-72" tabIndex={0}>
        <Card>
          <div className="flex justify-start">
            {usuario?.rol === "empleado" ? (
              <Button
                size="s"
                className="z-50 text-red-600 bg-transparent hover:bg-transparent hover:text-red-500 transition transform hover:scale-105 hover:cursor-pointer"
                onClick={handleLogout}
              >
                Cerrar sesión
              </Button>
            ) : (
              <Button
                size="s"
                className="z-50 text-blue-500 bg-transparent hover:bg-transparent hover:text-blue-600 transition transform hover:scale-105 hover:cursor-pointer"
                onClick={() => navigate(-1)}
              >
                Volver
              </Button>
            )}
          </div>
          <div className="overflow-x-auto">
            <ListaItemsVenta
              itemsVendidos={itemsVendidos}
              productos={productos}
              onEliminar={eliminarItem}
            />
          </div>
          <div className="h-28" />
          <SidebarVenta
            inputRef={inputRef}
            inputValue={inputValue}
            onInputChange={handleInputChange}
            onInputKeyDown={handleInputKeyDown}
            onOpenModalAtajos={() => setOpenModalAtajos(true)}
            onOpenModalProductos={() => setOpenModalProductos(true)}
            onCobrar={() => setMostrarModalCobro(true)}
            calcularTotal={calcularTotal}
            disabledCobrar={itemsVendidos.length === 0}
          />
        </Card>
      </div>

      {/* Componente ModalCobro integrado */}
      <ModalCobro
        abierto={mostrarModalCobro}
        onClose={() => setMostrarModalCobro(false)}
        itemsVendidos={itemsVendidos}
        mediosPago={mediosPago}
        totalBase={calcularTotal()}
        onConfirm={confirmarVenta}
      />

      {/* Componente ModalAtajos integrado */}
      <ModalAtajos
        abierto={openModalAtajos}
        onClose={() => setOpenModalAtajos(false)}
        productos={productos}
        rubros={rubros}
      />

      {/* Componente ModalProductos integrado */}
      <ModalProductos
        abierto={openModalProductos}
        onClose={() => setOpenModalProductos(false)}
        productos={productos}
        busqueda={busquedaProducto}
        onBusquedaChange={setBusquedaProducto}
        onAgregar={agregarProductoPorSeleccion}
      />

      {/* Componente ModalRubro integrado */}
      <ModalRubro
        abierto={!!rubroSeleccionado}
        rubro={rubroSeleccionado}
        onConfirm={handleConfirmarRubro}
        onClose={() => setRubroSeleccionado(null)}
      />

      {/* Componente ModalProductoVariable integrado */}
      <ModalProductoVariable
        abierto={!!productoVariableSeleccionado}
        producto={productoVariableSeleccionado}
        onConfirm={handleConfirmarProductoVariable}
        onClose={() => setProductoVariableSeleccionado(null)}
      />
    </div>
  );
};

export default CreateVenta;
