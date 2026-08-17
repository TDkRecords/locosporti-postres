<script>
    let { metas = [], clientesQueAlcanzaron, onSelectMeta } = $props();
</script>

<div class="space-y-3">
    {#each metas as meta}
        {@const alcanzaron = clientesQueAlcanzaron(meta)}
        <button
            type="button"
            onclick={() => onSelectMeta?.(meta)}
            class="flex w-full cursor-pointer items-center gap-4 rounded-2xl bg-white p-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99]"
        >
            <!-- Icono -->
            <div
                class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#CDB9FE]/20 text-[#7C3AED] sm:h-16 sm:w-16"
            >
                <i class="fa-solid fa-gift text-lg sm:text-xl"></i>
            </div>

            <!-- Información -->
            <div class="min-w-0 flex-1">
                <h3
                    class="truncate text-base font-bold text-gray-800 sm:text-lg"
                >
                    {meta.titulo}
                </h3>

                <p class="mt-1 truncate text-sm text-gray-500">
                    Meta: {meta.meta} productos
                </p>

                <div class="mt-1 flex flex-wrap items-center gap-2">
                    <span
                        class={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            meta.indefinida || !meta.caducidad
                                ? "bg-gray-100 text-gray-600"
                                : "bg-[#FFD2A8]/60 text-gray-700"
                        }`}
                    >
                        {meta.indefinida || !meta.caducidad
                            ? "Sin caducidad"
                            : `Vence ${meta.caducidad}`}
                    </span>

                    {#if alcanzaron.length > 0}
                        <span
                            class="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700"
                        >
                            {alcanzaron.length} la alcanzó{alcanzaron.length ===
                            1
                                ? ""
                                : "n"}
                        </span>
                    {/if}
                </div>
            </div>

            <!-- Indicador -->
            <div class="shrink-0 text-gray-400">
                <i class="fa-solid fa-chevron-right"></i>
            </div>
        </button>
    {/each}
</div>
