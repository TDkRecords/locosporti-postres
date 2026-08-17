<script>
    let {
        cliente,
        pedidos = [],
        estadoColor,
        estadoPedidoColor,
        onClose,
        onEdit,
        onSuspend,
        onReactivate,
    } = $props();

    let estaSuspendido = $derived(cliente.estado === "suspendido");
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
        <p>Volver a clientes</p>
    </button>

    <div class="space-y-4 p-4 sm:p-5">
        <!-- Encabezado -->
        <div class="flex items-start justify-between gap-3">
            <div class="flex min-w-0 items-center gap-3">
                {#if cliente.photoURL}
                    <img
                        src={cliente.photoURL}
                        alt={cliente.nombre}
                        class="h-14 w-14 shrink-0 rounded-full object-cover"
                    />
                {:else}
                    <div
                        class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#CDB9FE] text-gray-800"
                    >
                        <i class="fa-solid fa-user text-lg"></i>
                    </div>
                {/if}

                <div class="min-w-0">
                    <h2
                        class="truncate text-lg font-bold leading-tight text-gray-800 sm:text-xl"
                    >
                        {cliente.nombre || ""}
                        {cliente.apellido || ""}
                    </h2>

                    <span
                        class={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${estadoColor(cliente.estado)}`}
                    >
                        {cliente.estado}
                    </span>
                </div>
            </div>

            <div class="flex shrink-0 gap-2">
                <button
                    type="button"
                    onclick={() => onEdit?.(cliente)}
                    class="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#CDB9FE] text-gray-800 shadow-sm transition hover:bg-[#bfa3fd]"
                    title="Editar cliente"
                >
                    <i class="fa-solid fa-pencil"></i>
                </button>
            </div>
        </div>

        <!-- Pedidos totales -->

        <div class="rounded-2xl bg-[#7C3AED]/20 p-3 sm:p-4">
            <p class="text-[11px] text-gray-500">Correo</p>

            <h4 class="truncate text-sm font-bold text-gray-800 sm:text-base">
                {cliente.email || "Sin correo"}
            </h4>
        </div>

        <!-- Contacto -->
        <div class="grid grid-cols-2 gap-2 sm:gap-3">
            <div class="rounded-2xl bg-[#7C3AED]/20 p-3 sm:p-4">
                <p class="text-[11px] text-gray-500">Teléfono</p>

                <h4 class="text-sm font-bold text-gray-800 sm:text-base">
                    {cliente.telefono || "Sin teléfono"}
                </h4>
            </div>
            <div
                class="flex items-center justify-between rounded-2xl bg-[#FFFB96]/40 p-3 sm:p-4"
            >
                <div>
                    <p
                        class="text-[11px] uppercase tracking-wide text-gray-500"
                    >
                        Pedidos realizados
                    </p>

                    <h3 class="text-xl font-bold text-gray-800 sm:text-2xl">
                        {pedidos.length}
                    </h3>
                </div>

                <i
                    class="fa-solid fa-bag-shopping text-2xl text-[#CDB9FE] sm:text-3xl"
                ></i>
            </div>
        </div>

        <div class="rounded-2xl border border-gray-100 p-3 sm:p-4">
            <p
                class="text-[11px] font-bold uppercase tracking-wide text-gray-500"
            >
                Dirección
            </p>
            <p class="mt-1 text-sm text-gray-700">
                {cliente.direccion || "Sin dirección"}
            </p>
        </div>

        <!-- Historial de pedidos -->
        <div>
            <p
                class="mb-2 text-[11px] font-bold uppercase tracking-wide text-gray-500"
            >
                Historial de pedidos
            </p>

            {#if pedidos.length === 0}
                <p class="text-sm text-gray-400">Sin pedidos aún.</p>
            {:else}
                <div class="space-y-2">
                    {#each pedidos as pedido}
                        <div
                            class="flex items-center justify-between rounded-2xl bg-gray-50 px-3 py-2.5"
                        >
                            <div class="min-w-0">
                                <p
                                    class="truncate text-sm font-semibold text-gray-800"
                                >
                                    Pedido #{pedido.numero ?? pedido.id}
                                </p>
                                <p class="text-xs text-gray-500">
                                    {new Date(pedido.fecha).toLocaleDateString(
                                        "es-CO",
                                    )} ·
                                    {pedido.metodoPago === "transferencia"
                                        ? "Transferencia"
                                        : "Contra entrega"}
                                </p>
                            </div>
                            <div class="flex shrink-0 items-center gap-2">
                                <span class="text-sm font-bold text-gray-700">
                                    ${(
                                        Number(pedido.total) || 0
                                    ).toLocaleString("es-CO")}
                                </span>
                                <span
                                    class={`rounded-full px-2 py-0.5 text-xs font-semibold ${estadoPedidoColor(pedido.estado)}`}
                                >
                                    {pedido.estado}
                                </span>
                            </div>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>

        <!-- Historial de cambios -->
        {#if cliente.changeLog && cliente.changeLog.length > 0}
            <div class="border-t border-gray-100 pt-4">
                <p
                    class="mb-2 text-[11px] font-bold uppercase tracking-wide text-gray-500"
                >
                    Historial de cambios
                </p>
                <div class="space-y-1.5">
                    {#each cliente.changeLog as log}
                        <div class="flex items-center gap-3 text-sm">
                            <div
                                class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#CDB9FE]/30 text-xs"
                            >
                                <i class="fa-solid fa-circle-dot text-[#7c4dff]"
                                ></i>
                            </div>
                            <span class="truncate text-xs text-gray-500">
                                {new Date(log.at).toLocaleString("es-CO")} ·
                                {Object.keys(log.cambios || {}).join(", ")}
                            </span>
                        </div>
                    {/each}
                </div>
            </div>
        {/if}
    </div>
</article>
