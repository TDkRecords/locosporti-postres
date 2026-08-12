<script>
    let { productos = [], onSelectProduct } = $props();
</script>

<div class="space-y-3">
    {#each productos as producto}
        <button
            type="button"
            onclick={() => onSelectProduct?.(producto)}
            class="flex w-full cursor-pointer items-center gap-4 rounded-2xl bg-white p-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99]"
        >
            <!-- Imagen -->
            <div
                class="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gray-100 sm:h-24 sm:w-24"
            >
                <img
                    src={producto.imagen}
                    alt={producto.nombre}
                    class="h-full w-full object-cover"
                />
            </div>

            <!-- Información -->
            <div class="min-w-0 flex-1">
                <div>
                    <span
                        class={`flex items-center gap-1 text-xs ${
                            producto.estado === "disponible"
                                ? "text-green-500"
                                : "text-red-500"
                        }`}
                    >
                        <i class="fa-solid fa-circle"></i>
                        <h3
                            class={`truncate text-base font-bold sm:text-lg ${
                                producto.estado === "disponible"
                                    ? "text-green-500"
                                    : "text-red-600"
                            }`}
                        >
                            {producto.nombre}
                        </h3>
                    </span>
                </div>

                <p class="mt-1 text-sm text-gray-500">
                    {producto.categoria}
                </p>

                <p class="mt-2 text-base font-bold text-gray-800">
                    ${producto.precio.toLocaleString("es-CO")}
                </p>
            </div>

            <!-- Indicador -->
            <div class="shrink-0 text-gray-400">
                <i class="fa-solid fa-chevron-right"></i>
            </div>
        </button>
    {/each}
</div>
