<script>
    let {
        clientes = [],
        getPedidosDeCliente,
        estadoColor,
        onSelectCliente,
    } = $props();
</script>

<div class="space-y-3">
    {#each clientes as cliente}
        <button
            type="button"
            onclick={() => onSelectCliente?.(cliente)}
            class="flex w-full cursor-pointer items-center gap-4 rounded-2xl bg-white p-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99]"
        >
            <!-- Foto -->
            {#if cliente.photoURL}
                <img
                    src={cliente.photoURL}
                    alt={cliente.nombre}
                    class="h-14 w-14 shrink-0 rounded-full object-cover sm:h-16 sm:w-16"
                />
            {:else}
                <div
                    class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#CDB9FE] text-gray-800 sm:h-16 sm:w-16"
                >
                    <i class="fa-solid fa-user text-lg sm:text-xl"></i>
                </div>
            {/if}

            <!-- Información -->
            <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-2">
                    <h3
                        class="truncate text-base font-bold text-gray-800 sm:text-lg"
                    >
                        {cliente.nombre || ""}
                        {cliente.apellido || ""}
                    </h3>

                    <span
                        class={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${estadoColor(cliente.estado)}`}
                    >
                        {cliente.estado}
                    </span>
                </div>

                <p class="mt-1 truncate text-sm text-gray-500">
                    {cliente.email || "Sin correo"}
                </p>

                <p class="mt-1 truncate text-xs text-gray-400">
                    {cliente.direccion || "Sin dirección"}
                </p>
            </div>

            <!-- Pedidos -->
            <div class="shrink-0 text-right">
                <span
                    class="rounded-full bg-[#FFE28A]/60 px-2.5 py-1 text-xs font-semibold text-gray-700"
                >
                    {getPedidosDeCliente(cliente.id).length} pedidos
                </span>
            </div>

            <!-- Indicador -->
            <div class="shrink-0 text-gray-400">
                <i class="fa-solid fa-chevron-right"></i>
            </div>
        </button>
    {/each}
</div>
