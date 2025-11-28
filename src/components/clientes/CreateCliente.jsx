import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import Swal from "sweetalert2";
import { Card, Label, TextInput, Button, Radio } from "flowbite-react";

const CreateCliente = () => {
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [tipoCC, setTipoCC] = useState("none");

  const navigate = useNavigate();
  const clientesCollection = collection(db, "clientes");

  // Verifica clientes duplicados por nombre o teléfono
  const validarClienteExistente = async () => {
    const q = query(clientesCollection, where("nombre", "==", nombre.trim()));
    const snap = await getDocs(q);

    if (!snap.empty) return true;

    if (telefono.trim() !== "") {
      const q2 = query(
        clientesCollection,
        where("telefono", "==", telefono.trim())
      );
      const snap2 = await getDocs(q2);
      if (!snap2.empty) return true;
    }

    return false;
  };

  const store = async (e) => {
    e.preventDefault();

    if (!nombre.trim()) {
      Swal.fire("Error", "El nombre es obligatorio", "error");
      return;
    }

    if (telefono.trim() !== "" && !/^\d+$/.test(telefono.trim())) {
      Swal.fire("Error", "El teléfono solo puede contener números", "error");
      return;
    }

    const existe = await validarClienteExistente();
    if (existe) {
      Swal.fire(
        "Error",
        "Ya existe un cliente con ese nombre o teléfono",
        "error"
      );
      return;
    }

    await addDoc(clientesCollection, {
      nombre: nombre.trim().toLowerCase(),
      telefono: telefono.trim(),
      direccion: direccion.trim(),
      tipoCuentaCorriente: tipoCC,

      saldoCC: 0, // Cuando crea un cliente, su deuda es siempre 0
      estado: "activo",
    });

    Swal.fire({
      icon: "success",
      title: "Cliente creado con éxito",
      timer: 1500,
      showConfirmButton: false,
    });

    navigate("/clientes");
  };

  return (
    <div className="flex justify-center mt-10">
      <Card className="w-full max-w-md">
        <form onSubmit={store}>
          <h1 className="text-2xl font-bold mb-4 text-center text-black">
            Crear Cliente
          </h1>

          {/* Nombre */}
          <div className="mb-4">
            <Label>Nombre:</Label>
            <TextInput
              placeholder="Ej: Juan Pérez"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>

          {/* Teléfono */}
          <div className="mb-4">
            <Label>Teléfono:</Label>
            <TextInput
              type="text"
              placeholder="Ej: 3425123456"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
            />
          </div>

          {/* Dirección */}
          <div className="mb-4">
            <Label>Dirección:</Label>
            <TextInput
              placeholder="Ej: San Jerónimo 2230"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
            />
          </div>

          {/* Tipo de cuenta corriente */}
          <div className="mb-4">
            <Label className="block mb-2">Cuenta Corriente:</Label>

            <div className="flex flex-col gap-2">
              <div className="flex gap-2 items-center">
                <Radio
                  id="none"
                  name="tipoCC"
                  value="none"
                  checked={tipoCC === "none"}
                  onChange={() => setTipoCC("none")}
                />
                <Label htmlFor="none">Sin cuenta corriente</Label>
              </div>

              <div className="flex gap-2 items-center">
                <Radio
                  id="ficha"
                  name="tipoCC"
                  value="ficha"
                  checked={tipoCC === "ficha"}
                  onChange={() => setTipoCC("ficha")}
                />
                <Label htmlFor="ficha">Ficha</Label>
              </div>

              <div className="flex gap-2 items-center">
                <Radio
                  id="facturero"
                  name="tipoCC"
                  value="facturero"
                  checked={tipoCC === "facturero"}
                  onChange={() => setTipoCC("facturero")}
                />
                <Label htmlFor="facturero">Facturero</Label>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Button type="submit" color="blue">
              Guardar Cliente
            </Button>
          </div>
        </form>
      </Card>

      <Button
        color="gray"
        pill
        className="fixed bottom-6 left-6 z-50 shadow-lg"
        onClick={() => navigate("/clientes")}
      >
        Volver
      </Button>
    </div>
  );
};

export default CreateCliente;
