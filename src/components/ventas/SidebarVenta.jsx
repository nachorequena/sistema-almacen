import React from "react";
import { TextInput, Button } from "flowbite-react";

const SidebarVenta = ({
  inputRef,
  inputValue,
  onInputChange,
  onInputKeyDown,
  onOpenModalAtajos,
  onOpenModalProductos,
  onCobrar,
  calcularTotal,
  disabledCobrar,
}) => {
  return (
    <div className="fixed top-0 bottom-0 right-0 z-40 bg-white border-l border-blue-600 shadow-2xl p-4 flex flex-col justify-between items-center space-y-4 w-72 h-full">
      <div className="w-full px-2">
        <TextInput
          ref={inputRef}
          placeholder="Escaneá código o escribí atajo"
          value={inputValue}
          onChange={onInputChange}
          onKeyDown={onInputKeyDown}
          className="w-full"
        />
        <Button
          onClick={onOpenModalAtajos}
          className="hover:cursor-pointer mt-2 w-full border border-yellow-400 text-yellow-400 bg-transparent hover:bg-yellow-400 hover:text-white transition"
        >
          Ver atajos
        </Button>
        <Button
          onClick={onOpenModalProductos}
          className="hover:cursor-pointer mt-2 w-full border border-green-400 text-green-400 bg-transparent hover:bg-green-400 hover:text-white transition"
        >
          Ver productos
        </Button>
      </div>

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
          onClick={onCobrar}
          size="xl"
          className={`w-full h-20 transition duration-200 shadow-xl ${
            disabledCobrar
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 cursor-pointer"
          }`}
          disabled={disabledCobrar}
        >
          <span className="text-xl font-extrabold">Cobrar (Espacio)</span>
        </Button>
      </div>
    </div>
  );
};

export default SidebarVenta;
