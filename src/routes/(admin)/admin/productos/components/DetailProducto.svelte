<script>
    let { producto, onClose, onEdit, onDelete } = $props();
</script>

<article
    class="mt-6 h-dvh w-full overflow-y-scroll rounded-3xl bg-white shadow-2xl"
>
    <button
        type="button"
        onclick={onClose}
        class="flex w-full items-center justify-center gap-2 bg-[#CDB9FE] py-2 text-sm font-semibold uppercase text-gray-800 transition-colors ease-in-out hover:bg-[#bfa3fd]"
    >
        <i class="fa-solid fa-arrow-left-long"></i>
        <p>Volver a productos</p>
    </button>

    <div class="relative">
        <img
            src={producto.imagen}
            alt={producto.nombre}
            class="h-52 w-full object-cover sm:h-56"
        />

        <span
            class={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold text-white sm:px-3 sm:text-xs ${
                producto.estado === "disponible"
                    ? "bg-green-500"
                    : producto.estado === "descontinuado"
                      ? "bg-gray-500"
                      : "bg-red-500"
            }`}
        >
            <i
                class={`mr-1 ${
                    producto.estado === "disponible"
                        ? "fa-solid fa-circle-check"
                        : "fa-solid fa-box-archive"
                }`}
            ></i>

            {producto.estado === "disponible"
                ? "Disponible"
                : producto.estado === "descontinuado"
                  ? "Descontinuado"
                  : "Eliminado"}
        </span>

        <span
            class="absolute right-3 top-3 max-w-[35%] truncate rounded-full bg-[#FFE28A] px-2.5 py-1 text-[10px] font-semibold text-gray-800 sm:px-3 sm:text-xs"
        >
            {producto.categoria}
        </span>
    </div>

    <div class="space-y-4 p-4 sm:p-5">
        <div class="flex items-start justify-between gap-3">
            <div>
                <h2
                    class="text-lg font-bold leading-tight text-gray-800 sm:text-xl"
                >
                    {producto.nombre}
                </h2>

                <p class="mt-2 text-sm leading-relaxed text-gray-500">
                    {producto.descripcion}
                </p>
            </div>

            <div class="flex gap-2">
                <button
                    type="button"
                    onclick={() => onEdit?.(producto)}
                    class="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#CDB9FE] text-gray-800 shadow-sm transition hover:bg-[#bfa3fd]"
                    title="Editar producto"
                >
                    <i class="fa-solid fa-pencil"></i>
                </button>
                <button
                    type="button"
                    onclick={() => onDelete?.(producto)}
                    class="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-100 text-red-600 transition hover:bg-red-200"
                    title="Eliminar producto"
                >
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        </div>

        <div
            class="flex items-center justify-between rounded-2xl bg-[#FFFB96]/40 p-3 sm:p-4"
        >
            <div>
                <p class="text-[11px] uppercase tracking-wide text-gray-500">
                    Precio
                </p>

                <h3 class="text-xl font-bold text-gray-800 sm:text-2xl">
                    ${producto.precio.toLocaleString("es-CO")}
                </h3>
            </div>

            <i
                class="fa-solid fa-dollar-sign text-2xl text-[#CDB9FE] sm:text-3xl"
            ></i>
        </div>

        <div class="grid grid-cols-2 gap-2 sm:gap-3">
            <div class="rounded-2xl bg-[#FFD2A8]/40 p-3 sm:p-4">
                <p class="text-[11px] text-gray-500">Costo</p>

                <h4 class="text-sm font-bold text-gray-800 sm:text-base">
                    ${producto.costo.toLocaleString("es-CO")}
                </h4>
            </div>

            <div class="rounded-2xl bg-[#FFCDDB]/40 p-3 sm:p-4">
                <p class="text-[11px] text-gray-500">Ganancia</p>

                <h4 class="text-sm font-bold text-green-600 sm:text-base">
                    ${producto.ganancia.toLocaleString("es-CO")}
                </h4>
            </div>

            <div class="rounded-2xl bg-[#FFE28A]/40 p-3 sm:p-4">
                <p class="text-[11px] text-gray-500">Rentabilidad</p>

                <h4 class="text-sm font-bold text-gray-800 sm:text-base">
                    {producto.rentabilidad}%
                </h4>
            </div>

            <div class="rounded-2xl bg-[#CDB9FE]/20 p-3 sm:p-4">
                <p class="text-[11px] text-gray-500">Stock</p>

                <h4 class="text-sm font-bold text-gray-800 sm:text-base">
                    {producto.stock} unidades
                </h4>
            </div>
        </div>

        <div
            class="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-4 text-xs text-gray-500 sm:text-sm"
        >
            <span class="truncate">
                <i class="fa-regular fa-calendar mr-1 sm:mr-2"></i>
                {producto.fecha}
            </span>

            <span class="truncate">
                <i class="fa-solid fa-cube mr-1 sm:mr-2"></i>
                UUID: {producto.uuid}
            </span>
        </div>
    </div>
</article>
