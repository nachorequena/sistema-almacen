import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import Swal from "sweetalert2";
import { Card, Label, TextInput, Button, Select, Radio } from "flowbite-react";

const Create = () => {
  const [description, setDescription] = useState("");
  const [precio, setPrecio] = useState("");
  const [costo, setCosto] = useState("");
  const [categoria, setCategoria] = useState("");
  const [categorias, setCategorias] = useState([]);
  const [codigoBarra, setCodigoBarra] = useState("");
  const [atajo, setAtajo] = useState("");
  const [unidadVenta, setUnidadVenta] = useState([]);
  const [unidadVentaSeleccionada, setUnidadVentaSeleccionada] = useState("");
  const [tipoProducto, setTipoProducto] = useState("codigo"); // "codigo" o "atajo"
  const navigate = useNavigate();
  const productsCollection = collection(db, "products");

  const getCategorias = async () => {
    const snapshot = await getDocs(collection(db, "categorias"));
    const listaCategorias = snapshot.docs.map((doc) =>
      doc.data().nombre.toLowerCase()
    );
    setCategorias(listaCategorias);
  };

  const getUnidadesVenta = async () => {
    const snapshot = await getDocs(collection(db, "unidadVenta"));
    const listaUnidadesVenta = snapshot.docs.map((doc) =>
      doc.data().nombre.toLowerCase()
    );
    setUnidadVenta(listaUnidadesVenta);
  };

  useEffect(() => {
    getCategorias();
    getUnidadesVenta();
  }, []);

  const store = async (e) => {
    e.preventDefault();

    if (!description || precio === "" || costo === "") {
      Swal.fire("Error", "Todos los campos son obligatorios", "error");
      return;
    }

    if (Number(precio) < Number(costo)) {
      Swal.fire(
        "Error",
        "El precio de costo no puede ser mayor al precio de venta",
        "error"
      );
      return;
    }

    if (tipoProducto === "atajo" && atajo) {
      const atajoDuplicado = await verificarAtajoDuplicado(atajo);
      if (atajoDuplicado) {
        Swal.fire("Error", "El atajo ya está en uso", "error");
        return;
      }
    }

    await addDoc(productsCollection, {
      description: description.trim(),
      costo: Number(costo),
      precio: Number(precio),
      ganancia: Number(precio) - Number(costo),
      categoria: categoria.toLowerCase(),
      codigoBarra: tipoProducto === "codigo" ? codigoBarra : null,
      atajo: tipoProducto === "atajo" ? atajo.toLowerCase() : null,
      unidadVenta: tipoProducto === "atajo" ? unidadVentaSeleccionada : null,
    });

    const Toast = Swal.mixin({
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 2500,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.onmouseenter = Swal.stopTimer;
        toast.onmouseleave = Swal.resumeTimer;
      },
    });

    Toast.fire({ icon: "success", title: "Producto creado con éxito" });
    navigate("/productos");
  };

  const verificarAtajoDuplicado = async (nuevoAtajo) => {
    const atajoLower = nuevoAtajo.toLowerCase();

    const [productosSnap, rubrosSnap] = await Promise.all([
      getDocs(collection(db, "products")),
      getDocs(collection(db, "rubros")),
    ]);

    const productosAtajos = productosSnap.docs.map((doc) =>
      doc.data().atajo?.toLowerCase()
    );

    const rubrosAtajos = rubrosSnap.docs.map((doc) =>
      doc.data().atajo?.toLowerCase()
    );

    return [...productosAtajos, ...rubrosAtajos].includes(atajoLower);
  };

  return (
    <div className="flex justify-center mt-10">
      <Card className="w-full max-w-md">
        <form onSubmit={store}>
          <h1 className="text-2xl font-bold mb-4 text-center text-black">
            Crear Producto
          </h1>

          {/* Nombre */}
          <div className="mb-4">
            <Label htmlFor="description" className="mb-2">
              Nombre:
            </Label>
            <TextInput
              id="description"
              placeholder="Ej: Fideos tirabuzón 500g"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          {/* Precio */}
          <div className="mb-4">
            <Label htmlFor="precio">Precio de venta:</Label>
            <TextInput
              id="precio"
              type="number"
              placeholder="Precio de venta"
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              required
              min="0"
              addon="$"
            />
          </div>

          {/* Costo */}
          <div className="mb-4">
            <Label htmlFor="costo">Precio de costo:</Label>
            <TextInput
              id="costo"
              type="number"
              placeholder="Precio de costo"
              value={costo}
              onChange={(e) => setCosto(e.target.value)}
              required
              min="0"
              addon="$"
            />
          </div>

          {/* Categoría */}
          <div className="mb-4">
            <Label htmlFor="categoria">Categoría:</Label>
            <Select
              id="categoria"
              onChange={(e) => setCategoria(e.target.value)}
              value={categoria}
              required
            >
              <option value="">Selecciona una categoría</option>
              {categorias.map((cat, idx) => (
                <option key={idx} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </Select>
          </div>

          {/* Selector tipo de producto */}
          <div className="mb-4">
            <Label className="mb-2 block">Tipo de producto:</Label>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Radio
                  id="codigo"
                  name="tipoProducto"
                  value="codigo"
                  checked={tipoProducto === "codigo"}
                  onChange={() => setTipoProducto("codigo")}
                />
                <Label htmlFor="codigo">Con código de barras</Label>
              </div>
              <div className="flex items-center gap-2">
                <Radio
                  id="atajo"
                  name="tipoProducto"
                  value="atajo"
                  checked={tipoProducto === "atajo"}
                  onChange={() => setTipoProducto("atajo")}
                />
                <Label htmlFor="atajo">Con atajo</Label>
              </div>
            </div>
          </div>

          {/* Código de barras */}
          <div className="mb-4">
            <Label htmlFor="codigoBarra">Código de barras:</Label>
            <TextInput
              id="codigoBarra"
              placeholder="Ej: 1234567890123"
              value={codigoBarra}
              onChange={(e) => setCodigoBarra(e.target.value)}
              disabled={tipoProducto !== "codigo"}
              required={tipoProducto === "codigo"}
            />
          </div>

          {/* Atajo */}
          <div className="mb-4">
            <Label htmlFor="atajo">Atajo:</Label>
            <TextInput
              id="atajo"
              placeholder="Ej: 7, 8, a2, b1"
              value={atajo}
              onChange={(e) => setAtajo(e.target.value)}
              disabled={tipoProducto !== "atajo"}
              required={tipoProducto === "atajo"}
            />
          </div>

          {/* Unidad de venta */}
          <div className="mb-4">
            <Label htmlFor="unidadVenta">Unidad de venta:</Label>
            <Select
              id="unidadVenta"
              value={unidadVentaSeleccionada}
              onChange={(e) => setUnidadVentaSeleccionada(e.target.value)}
              disabled={tipoProducto !== "atajo"}
              required={tipoProducto === "atajo"}
            >
              <option value="">Selecciona una unidad</option>
              {unidadVenta.map((unidad, idx) => (
                <option key={idx} value={unidad}>
                  {unidad.charAt(0).toUpperCase() + unidad.slice(1)}
                </option>
              ))}
            </Select>
          </div>

          {/* Botón */}
          <div className="text-center">
            <Button type="submit" color="blue">
              Guardar
            </Button>
          </div>
        </form>
      </Card>

      <Button
        color="gray"
        pill
        className="fixed bottom-6 left-6 z-50 shadow-lg"
        onClick={() => navigate("/productos")}
      >
        <svg
          className="w-5 h-5 inline-block mr-1"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Volver
      </Button>
    </div>
  );
};

export default Create;
