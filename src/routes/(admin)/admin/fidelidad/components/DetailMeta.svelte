<script>
    let { meta, leaderboard = [], onClose, onArchive } = $props();

    let alcanzaron = $derived(leaderboard.filter((row) => row.alcanzado));
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
        <p>Volver a metas</p>
    </button>

    <div class="space-y-4 p-4 sm:p-5">
        <!-- Encabezado -->
        <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                    <h2
                        class="text-lg font-bold leading-tight text-gray-800 sm:text-xl"
                    >
                        {meta.titulo}
                    </h2>

                    <span
                        class="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700"
                    >
                        Activa
                    </span>
                </div>

                <p class="mt-2 text-sm leading-relaxed text-gray-500">
                    {meta.indefinida || !meta.caducidad
                        ? "Esta meta no tiene fecha de vencimiento."
                        : `Vence el ${meta.caducidad}.`}
                </p>
            </div>

            <button
                type="button"
                onclick={() => onArchive?.(meta)}
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-600 transition hover:bg-red-200"
                title="Archivar meta"
            >
                <i class="fa-solid fa-box-archive"></i>
            </button>
        </div>

        <!-- KPIs -->
        <div class="grid grid-cols-2 gap-2 sm:gap-3">
            <div class="rounded-2xl bg-[#FFFB96]/40 p-3 sm:p-4">
                <p class="text-[11px] uppercase tracking-wide text-gray-500">
                    Requisito
                </p>
                <h4 class="text-lg font-bold text-gray-800 sm:text-xl">
                    {meta.meta} productos
                </h4>
            </div>

            <div class="rounded-2xl bg-green-50 p-3 sm:p-4">
                <p class="text-[11px] uppercase tracking-wide text-gray-500">
                    Alcanzada por
                </p>
                <h4 class="text-lg font-bold text-green-700 sm:text-xl">
                    {alcanzaron.length}
                    {alcanzaron.length === 1 ? "cliente" : "clientes"}
                </h4>
            </div>
        </div>

        {#if alcanzaron.length > 0}
            <div class="rounded-2xl bg-green-50 px-3 py-2.5">
                <p class="text-sm text-green-700">
                    <i class="fa-solid fa-trophy mr-1.5"></i>
                    {alcanzaron
                        .map((row) =>
                            `${row.cliente.nombre || ""} ${row.cliente.apellido || ""}`.trim(),
                        )
                        .join(", ")}
                </p>
            </div>
        {/if}

        <!-- Progreso de clientes -->
        <div>
            <p
                class="mb-2 text-[11px] font-bold uppercase tracking-wide text-gray-500"
            >
                Progreso de clientes
            </p>

            {#if leaderboard.length === 0}
                <p class="text-sm text-gray-400">
                    No hay clientes registrados aún.
                </p>
            {:else}
                <div class="space-y-2">
                    {#each leaderboard as row}
                        <div
                            class="flex items-center gap-3 rounded-2xl bg-gray-50 p-2.5"
                        >
                            {#if row.cliente.photoURL}
                                <img
                                    src={row.cliente.photoURL}
                                    alt={row.cliente.nombre}
                                    class="h-9 w-9 shrink-0 rounded-full object-cover"
                                />
                            {:else}
                                <div
                                    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#CDB9FE] text-gray-800"
                                >
                                    <i class="fa-solid fa-user text-xs"></i>
                                </div>
                            {/if}

                            <div class="min-w-0 flex-1">
                                <p
                                    class="truncate text-sm font-semibold text-gray-700"
                                >
                                    {row.cliente.nombre || ""}
                                    {row.cliente.apellido || ""}
                                </p>
                                <div class="mt-1 flex items-center gap-2">
                                    <div
                                        class="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200"
                                    >
                                        <div
                                            class={`h-full rounded-full transition-all duration-500 ${
                                                row.alcanzado
                                                    ? "bg-green-500"
                                                    : "bg-[#CDB9FE]"
                                            }`}
                                            style:width="{Math.min(
                                                100,
                                                Math.round(
                                                    (row.progreso / meta.meta) *
                                                        100,
                                                ),
                                            )}%"
                                        ></div>
                                    </div>
                                    <span
                                        class="shrink-0 text-xs text-gray-500"
                                    >
                                        {row.progreso}/{meta.meta}
                                    </span>
                                </div>
                            </div>

                            {#if row.alcanzado}
                                <i
                                    class="fa-solid fa-circle-check shrink-0 text-green-500"
                                ></i>
                            {/if}
                        </div>
                    {/each}
                </div>
            {/if}
        </div>
    </div>
</article>
