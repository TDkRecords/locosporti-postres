<script>
    let {
        pedidos = [],
        getNombreCliente,
        estadoColor,
        onSelectPedido,
    } = $props();
</script>

<div class="space-y-3">
    {#each pedidos as pedido}
        <button
            type="button"
            onclick={() => onSelectPedido?.(pedido)}
            class="flex w-full cursor-pointer items-center gap-4 rounded-2xl bg-white p-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99]"
        >
            <!-- Icono -->
            <div
                class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#CDB9FE]/20 text-[#7C3AED] sm:h-16 sm:w-16"
            >
                <i class="fa-solid fa-receipt text-lg sm:text-xl"></i>
            </div>

            <!-- Información -->
            <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-2">
                    <h3
                        class="truncate text-base font-bold text-gray-800 sm:text-lg"
                    >
                        #{pedido.numero ?? pedido.id.slice(-6)}
                    </h3>

                    <span
                        class={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${estadoColor(pedido.estado)}`}
                    >
                        {pedido.estado}
                    </span>
                </div>

                <p class="mt-1 truncate text-sm text-gray-500">
                    {getNombreCliente(pedido.clienteId)}
                </p>

                <p class="mt-1 text-xs text-gray-400">
                    {new Date(pedido.fecha).toLocaleString("es-CO", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                    })}
                </p>
            </div>

            <!-- Total -->
            <div class="shrink-0 text-right">
                <p class="text-base font-bold text-gray-800">
                    ${(Number(pedido.total) || 0).toLocaleString("es-CO")}
                </p>
            </div>

            <!-- Indicador -->
            <div class="shrink-0 text-gray-400">
                <i class="fa-solid fa-chevron-right"></i>
            </div>
        </button>
    {/each}
</div>
