<script>
    let {
        pedido,
        cliente,
        productos = [],
        estadoColor,
        onClose,
        onEdit,
        onCancel,
        onChangeStatus,
    } = $props();

    function getNombreProducto(productId) {
        const p = productos.find((x) => x.id === productId);
        return p ? p.nombre : "Producto";
    }

    function getPrecioProducto(productId) {
        const p = productos.find((x) => x.id === productId);
        return p ? Number(p.precio) || 0 : 0;
    }

    let puedeGestionar = $derived(pedido.estado !== "Cancelado");
    let puedeCambiarEstado = $derived(
        pedido.estado !== "Cancelado" && pedido.estado !== "Entregado",
    );
</script>

<article
    class="mt-6 h-dvh w-full overflow-y-scroll rounded-3xl bg-white shadow-2xl"
>
    <button
        type="button"
        onclick={onClose}
        class="flex w-full items-center justify-center gap-2 bg-[#CDB9FE] py-2 text-sm font-semibold uppercase text-gray-800 transition-colors ease-in-out hover:bg-[#bfa3fd] cursor-pointer"
    >
        <i class="fa-solid fa-arrow-left-long"></i>
        <p>Volver a pedidos</p>
    </button>

    <div class="space-y-4 p-4 sm:p-5">
        <!-- Encabezado -->
        <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                    <h2
                        class="text-lg font-bold leading-tight text-gray-800 sm:text-xl"
                    >
                        Pedido #{pedido.numero ?? pedido.id.slice(-6)}
                    </h2>

                    <span
                        class={`rounded-full px-2.5 py-1 text-xs font-semibold ${estadoColor(pedido.estado)}`}
                    >
                        {pedido.estado}
                    </span>
                </div>

                <p class="mt-2 text-sm leading-relaxed text-gray-500">
                    {new Date(pedido.fecha).toLocaleString("es-CO", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                    })}
                </p>
            </div>

            {#if puedeGestionar}
                <div class="flex shrink-0 gap-2">
                    <button
                        type="button"
                        onclick={() => onEdit?.(pedido)}
                        class="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#CDB9FE] text-gray-800 shadow-sm transition hover:bg-[#bfa3fd]"
                        title="Editar pedido"
                    >
                        <i class="fa-solid fa-pencil"></i>
                    </button>
                    <button
                        type="button"
                        onclick={() => onCancel?.(pedido)}
                        class="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-100 text-red-600 transition hover:bg-red-200"
                        title="Cancelar pedido"
                    >
                        <i class="fa-solid fa-ban"></i>
                    </button>
                </div>
            {/if}
        </div>

        <!-- Total -->
        <div
            class="flex items-center justify-between rounded-2xl bg-[#FFFB96]/40 p-3 sm:p-4"
        >
            <div>
                <p class="text-[11px] uppercase tracking-wide text-gray-500">
                    Total
                </p>

                <h3 class="text-xl font-bold text-gray-800 sm:text-2xl">
                    ${(Number(pedido.total) || 0).toLocaleString("es-CO")}
                </h3>
            </div>

            <i
                class="fa-solid fa-dollar-sign text-2xl text-[#CDB9FE] sm:text-3xl"
            ></i>
        </div>

        <!-- Método de pago + cambiar estado -->
        <div class="grid grid-cols-2 gap-2 sm:gap-3">
            <div class="rounded-2xl bg-[#FFD2A8]/40 p-3 sm:p-4">
                <p class="text-[11px] text-gray-500">Método de pago</p>

                <h4 class="text-sm font-bold text-gray-800 sm:text-base">
                    {pedido.metodoPago === "transferencia"
                        ? "Transferencia"
                        : "Contra entrega"}
                </h4>
            </div>

            <div class="rounded-2xl bg-[#CDB9FE]/20 p-3 sm:p-4">
                <p class="text-[11px] text-gray-500">Cambiar estado</p>

                {#if puedeCambiarEstado}
                    <select
                        class="mt-1 w-full rounded-xl border border-gray-200 bg-white px-2 py-1.5 text-xs font-semibold text-gray-700"
                        value=""
                        onchange={(e) => {
                            if (e.target.value) {
                                onChangeStatus?.(
                                    pedido,
                                    e.target.value,
                                    e.target,
                                );
                            }
                        }}
                    >
                        <option value="">Seleccionar</option>
                        <option value="Preparando">Preparando</option>
                        <option value="Empacado">Empacado</option>
                        <option value="A domicilio">A domicilio</option>
                        <option value="Entregado">Entregado</option>
                    </select>
                {:else}
                    <h4 class="text-sm font-bold text-gray-800 sm:text-base">
                        {pedido.estado === "Entregado"
                            ? "Ya entregado"
                            : "Pedido cancelado"}
                    </h4>
                {/if}
            </div>
        </div>

        <!-- Cliente -->
        {#if cliente}
            <div class="rounded-2xl border border-gray-100 p-3 sm:p-4">
                <p
                    class="mb-2 text-[11px] font-bold uppercase tracking-wide text-gray-500"
                >
                    Cliente
                </p>

                <div class="flex items-center gap-3">
                    {#if cliente.photoURL}
                        <img
                            src={cliente.photoURL}
                            alt={cliente.nombre}
                            class="h-10 w-10 rounded-full object-cover"
                        />
                    {:else}
                        <div
                            class="flex h-10 w-10 items-center justify-center rounded-full bg-[#CDB9FE] text-gray-800"
                        >
                            <i class="fa-solid fa-user text-sm"></i>
                        </div>
                    {/if}

                    <div class="min-w-0">
                        <p class="truncate text-sm font-semibold text-gray-800">
                            {cliente.nombre || ""}
                            {cliente.apellido || ""}
                        </p>
                        <p class="truncate text-xs text-gray-500">
                            {cliente.email || ""}
                        </p>
                        <p class="truncate text-xs text-gray-500">
                            {cliente.direccion || "Sin dirección"}
                        </p>
                        {#if cliente.sugerencias}
                            <p class="truncate text-xs italic text-gray-400">
                                {cliente.sugerencias}
                            </p>
                        {/if}
                    </div>
                </div>
            </div>
        {/if}

        <!-- Productos -->
        <div>
            <p
                class="mb-2 text-[11px] font-bold uppercase tracking-wide text-gray-500"
            >
                Productos
            </p>

            <div class="space-y-2">
                {#each pedido.items || [] as item}
                    <div
                        class="flex items-center gap-3 rounded-2xl bg-gray-50 p-2.5"
                    >
                        <div
                            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#CDB9FE]/20 text-[#7C3AED]"
                        >
                            <i class="fa-solid fa-cookie-bite text-sm"></i>
                        </div>

                        <div class="min-w-0 flex-1">
                            <p
                                class="truncate text-sm font-semibold text-gray-700"
                            >
                                {getNombreProducto(item.productId)}
                            </p>
                            <p class="text-xs text-gray-400">
                                ×{item.cantidad}
                            </p>
                        </div>

                        <p class="shrink-0 text-sm font-semibold text-gray-700">
                            ${(
                                getPrecioProducto(item.productId) *
                                (Number(item.cantidad) || 0)
                            ).toLocaleString("es-CO")}
                        </p>
                    </div>
                {/each}
            </div>
        </div>

        <!-- Notas -->
        {#if pedido.notas}
            <div>
                <p
                    class="mb-1 text-[11px] font-bold uppercase tracking-wide text-gray-500"
                >
                    Notas
                </p>
                <p
                    class="rounded-2xl bg-[#FFE28A]/40 px-3 py-2 text-sm italic text-gray-700"
                >
                    "{pedido.notas}"
                </p>
            </div>
        {/if}

        <!-- Foto de entrega -->
        {#if pedido.fotoEntrega}
            <div>
                <p
                    class="mb-1 text-[11px] font-bold uppercase tracking-wide text-gray-500"
                >
                    Comprobante de entrega
                </p>
                <a
                    href={pedido.fotoEntrega}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <img
                        src={pedido.fotoEntrega}
                        alt="Foto de entrega"
                        class="mt-1 h-32 w-32 rounded-2xl object-cover shadow-sm transition hover:scale-105"
                    />
                </a>
            </div>
        {/if}

        <!-- Historial -->
        <div class="border-t border-gray-100 pt-4">
            <p
                class="mb-2 text-[11px] font-bold uppercase tracking-wide text-gray-500"
            >
                Historial de estados
            </p>

            <div class="space-y-1.5">
                {#each pedido.history || [] as event}
                    <div class="flex items-center gap-3 text-sm">
                        <div
                            class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#CDB9FE]/30 text-xs"
                        >
                            <i class="fa-solid fa-circle-dot text-[#7c4dff]"
                            ></i>
                        </div>
                        <span
                            class={`rounded-full px-2 py-0.5 text-xs font-semibold ${estadoColor(event.to)}`}
                        >
                            {event.to}
                        </span>
                        <span class="text-xs text-gray-400">
                            {new Date(event.at).toLocaleString("es-CO", {
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                            })}
                        </span>
                    </div>
                {/each}
            </div>
        </div>
    </div>
</article>
