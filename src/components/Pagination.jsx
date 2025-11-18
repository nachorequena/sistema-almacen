const Pagination = ({ totalPaginas, paginaActual, setPaginaActual }) => {
  if (totalPaginas <= 1) return null;

  // 🔹 Genera un rango visible de páginas alrededor de la actual
  const paginas = [];
  const start = Math.max(1, paginaActual - 2);
  const end = Math.min(totalPaginas, paginaActual + 2);

  if (start > 1) paginas.push(1, "...");
  for (let i = start; i <= end; i++) paginas.push(i);
  if (end < totalPaginas) paginas.push("...", totalPaginas);

  return (
    <div className="flex justify-center mt-6">
      <ul className="flex items-center justify-center flex-wrap gap-1 px-2 py-1 text-sm md:gap-2">
        {/* Botón anterior */}
        <li>
          <button
            disabled={paginaActual === 1}
            onClick={() => setPaginaActual((prev) => Math.max(prev - 1, 1))}
            className="px-3 py-2 bg-[#1f2937] text-white border border-gray-600 rounded-l-lg disabled:opacity-50 hover:bg-[#374151]"
          >
            <svg className="w-2.5 h-2.5" viewBox="0 0 6 10">
              <path d="M5 1 1 5l4 4" stroke="currentColor" strokeWidth="2" />
            </svg>
          </button>
        </li>

        {/* Botones numerados con puntos suspensivos */}
        {paginas.map((num, i) =>
          num === "..." ? (
            <li key={`dots-${i}`} className="px-2 text-gray-400">
              ...
            </li>
          ) : (
            <li key={num}>
              <button
                onClick={() => setPaginaActual(num)}
                className={`px-3 py-2 border text-sm rounded-md transition-all ${
                  paginaActual === num
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-[#1f2937] text-gray-300 border-gray-600 hover:bg-[#374151]"
                }`}
              >
                {num}
              </button>
            </li>
          )
        )}

        {/* Botón siguiente */}
        <li>
          <button
            disabled={paginaActual === totalPaginas}
            onClick={() =>
              setPaginaActual((prev) => Math.min(prev + 1, totalPaginas))
            }
            className="px-3 py-2 bg-[#1f2937] text-white border border-gray-600 rounded-r-lg disabled:opacity-50 hover:bg-[#374151]"
          >
            <svg className="w-2.5 h-2.5" viewBox="0 0 6 10">
              <path d="m1 9 4-4-4-4" stroke="currentColor" strokeWidth="2" />
            </svg>
          </button>
        </li>
      </ul>
    </div>
  );
};

export default Pagination;
