<script>
    import { onMount } from "svelte";
    import { watchCollection } from "$lib/firestore.js";

    const WA_NUMBER = "https://wa.me/573159603020";

    let productos = $state([]);
    let loading = $state(true);

    let busqueda = $state("");
    let ordenPrecio = $state("");
    let ordenFecha = $state("");

    let unsubProductos;

    let mostrarBusqueda = $state(false);
    let mostrarFiltros = $state(false);

    onMount(() => {
        unsubProductos = watchCollection(
            "productos",
            (data) => {
                productos = data;
                loading = false;
            },
            "fecha",
        );

        return () => {
            unsubProductos?.();
        };
    });

    const productosFiltrados = $derived.by(() => {
        let lista = productos.filter((producto) => {
            return (
                producto.estado !== "eliminado" &&
                producto.estado !== "descontinuado" &&
                producto.nombre?.toLowerCase().includes(busqueda.toLowerCase())
            );
        });

        if (ordenPrecio === "mayor") {
            lista = [...lista].sort((a, b) => b.precio - a.precio);
        } else if (ordenPrecio === "menor") {
            lista = [...lista].sort((a, b) => a.precio - b.precio);
        }

        if (ordenFecha === "primero") {
            lista = [...lista].sort(
                (a, b) => new Date(a.fecha) - new Date(b.fecha),
            );
        } else if (ordenFecha === "ultimo") {
            lista = [...lista].sort(
                (a, b) => new Date(b.fecha) - new Date(a.fecha),
            );
        }

        return lista;
    });

    function pedirWhatsApp(producto) {
        const mensaje = encodeURIComponent(
            `Hola, quiero pedir: ${producto.nombre} ($${Number(producto.precio).toLocaleString("es-CO")})`,
        );
        window.open(`${WA_NUMBER}?text=${mensaje}`, "_blank", "noopener");
    }
</script>

<svelte:head>
    <title>Home | Locos por ti</title>
</svelte:head>

<div class="space-y-6 p-4 sm:p-6">
    <section class="overflow-hidden rounded-3xl bg-white shadow-sm">
        <div class="p-5 sm:p-6">
            <!-- Header -->
            <div class="flex items-center justify-between gap-4">
                <!-- Identidad -->
                <div class="flex min-w-0 items-center gap-4">
                    <div
                        class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#CDB9FE]/20 text-[#7C3AED]"
                    >
                        <i class="fa-solid fa-shop"></i>
                    </div>

                    <div class="min-w-0">
                        <p class="text-sm font-medium text-[#7C3AED]">Home</p>

                        <h1
                            class="mt-0.5 text-2xl font-bold text-gray-900 sm:text-3xl"
                        >
                            Catalogo
                        </h1>

                        <p class="mt-1 text-sm text-gray-500">
                            Productos para ti.
                        </p>
                    </div>
                </div>

                <!-- Desktop -->
                <div class="hidden items-center gap-3 md:flex">
                    <div class="relative w-72 lg:w-80">
                        <i
                            class="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                        ></i>

                        <input
                            type="text"
                            bind:value={busqueda}
                            placeholder="Buscar postre..."
                            class="h-12 w-full rounded-2xl border border-gray-200 bg-gray-50 pl-11 pr-4 text-sm outline-none transition focus:border-[#CDB9FE] focus:ring-4 focus:ring-[#CDB9FE]/20"
                        />
                    </div>

                    <button
                        type="button"
                        onclick={() => (mostrarFiltros = !mostrarFiltros)}
                        class={`flex h-12 items-center gap-2 rounded-2xl border px-4 text-sm font-medium transition ${
                            mostrarFiltros
                                ? "border-[#CDB9FE] bg-[#CDB9FE]/15 text-[#7C3AED]"
                                : "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"
                        }`}
                    >
                        <i class="fa-solid fa-sliders"></i>
                        Filtros
                    </button>
                </div>

                <!-- Móvil -->
                <div class="flex gap-2 md:hidden">
                    <button
                        title="Buscar"
                        type="button"
                        onclick={() => {
                            mostrarBusqueda = !mostrarBusqueda;
                            if (mostrarBusqueda) mostrarFiltros = false;
                        }}
                        class={`flex h-11 w-11 items-center justify-center rounded-xl transition ${
                            mostrarBusqueda
                                ? "bg-[#CDB9FE]/20 text-[#7C3AED]"
                                : "bg-gray-100 text-gray-600"
                        }`}
                    >
                        <i class="fa-solid fa-magnifying-glass"></i>
                    </button>

                    <button
                        title="Filtros"
                        type="button"
                        onclick={() => {
                            mostrarFiltros = !mostrarFiltros;
                            if (mostrarFiltros) mostrarBusqueda = false;
                        }}
                        class={`flex h-11 w-11 items-center justify-center rounded-xl transition ${
                            mostrarFiltros
                                ? "bg-[#CDB9FE]/20 text-[#7C3AED]"
                                : "bg-gray-100 text-gray-600"
                        }`}
                    >
                        <i class="fa-solid fa-sliders"></i>
                    </button>
                </div>
            </div>

            <!-- Buscador móvil -->
            {#if mostrarBusqueda}
                <div class="mt-4 md:hidden">
                    <div class="relative">
                        <i
                            class="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                        ></i>

                        <input
                            type="text"
                            bind:value={busqueda}
                            placeholder="Buscar postre..."
                            class="h-12 w-full rounded-2xl border border-gray-200 bg-gray-50 pl-11 pr-4 text-sm outline-none transition focus:border-[#CDB9FE] focus:ring-4 focus:ring-[#CDB9FE]/20"
                        />
                    </div>
                </div>
            {/if}

            <!-- Panel de filtros -->
            {#if mostrarFiltros}
                <div class="mt-5 border-t border-gray-100 pt-5">
                    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <div class="relative">
                            <i
                                class="fa-solid fa-dollar-sign absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                            ></i>

                            <select
                                bind:value={ordenPrecio}
                                class="h-12 w-full appearance-none rounded-2xl border border-gray-200 bg-gray-50 pl-10 pr-10 text-sm outline-none transition focus:border-[#CDB9FE] focus:ring-2 focus:ring-[#CDB9FE]/20"
                            >
                                <option value="">Ordenar por precio</option>
                                <option value="mayor">Mayor precio</option>
                                <option value="menor">Menor precio</option>
                            </select>

                            <i
                                class="fa-solid fa-chevron-down pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400"
                            ></i>
                        </div>

                        <div class="relative">
                            <i
                                class="fa-solid fa-calendar absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                            ></i>

                            <select
                                bind:value={ordenFecha}
                                class="h-12 w-full appearance-none rounded-2xl border border-gray-200 bg-gray-50 pl-10 pr-10 text-sm outline-none transition focus:border-[#CDB9FE] focus:ring-2 focus:ring-[#CDB9FE]/20"
                            >
                                <option value="">Ordenar por fecha</option>
                                <option value="primero">Más antiguos</option>
                                <option value="ultimo">Más recientes</option>
                            </select>

                            <i
                                class="fa-solid fa-chevron-down pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400"
                            ></i>
                        </div>

                        {#if busqueda || ordenPrecio || ordenFecha}
                            <button
                                type="button"
                                onclick={() => {
                                    busqueda = "";
                                    ordenPrecio = "";
                                    ordenFecha = "";
                                }}
                                class="h-12 rounded-2xl bg-gray-100 px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-200"
                            >
                                <i class="fa-solid fa-xmark mr-2"></i>
                                Limpiar filtros
                            </button>
                        {/if}
                    </div>
                </div>
            {/if}
        </div>
    </section>

    <section class="rounded-3xl">
        {#if loading}
            <div
                class="flex flex-col items-center justify-center py-16 text-gray-500"
            >
                <div
                    class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#CDB9FE]/20"
                >
                    <i
                        class="fa-solid fa-spinner fa-spin text-3xl text-[#8B5CF6]"
                    ></i>
                </div>
                <p class="text-sm font-medium">Preparando los postres...</p>
            </div>
        {:else if productosFiltrados.length === 0}
            <div
                class="flex flex-col items-center justify-center py-16 text-center"
            >
                <div
                    class="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100"
                >
                    <i class="fa-solid fa-box-open text-3xl text-gray-400"></i>
                </div>

                <h3 class="text-lg font-semibold text-gray-800">
                    No encontramos resultados
                </h3>

                <p class="mt-2 max-w-sm text-sm text-gray-500">
                    {busqueda
                        ? "Prueba con otro nombre o limpia los filtros."
                        : "Todavía no hay postres disponibles."}
                </p>
            </div>
        {:else}
            <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {#each productosFiltrados as producto}
                    <article
                        class="group overflow-hidden rounded-[28px] bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                    >
                        <!-- Imagen -->
                        <div class="relative overflow-hidden">
                            <img
                                src={producto.imagen ||
                                    "https://placehold.co/600x400?text=Sin+imagen"}
                                alt={producto.nombre}
                                class="h-56 w-full object-cover transition duration-500 group-hover:scale-105"
                            />

                            {#if producto.estado === "agotado"}
                                <span
                                    class="absolute top-3 right-3 rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white shadow"
                                >
                                    Agotado
                                </span>
                            {/if}

                            <div
                                class="absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-black/30 to-transparent"
                            ></div>
                        </div>

                        <!-- Contenido -->
                        <div class="flex flex-col gap-4 p-5">
                            <div class="flex items-start justify-between gap-3">
                                <h3
                                    class="text-lg font-bold leading-tight text-gray-900"
                                >
                                    {producto.nombre}
                                </h3>

                                <span
                                    class="shrink-0 rounded-full bg-[#CDB9FE]/20 px-3 py-1 text-sm font-bold text-[#7C3AED]"
                                >
                                    ${Number(producto.precio).toLocaleString(
                                        "es-CO",
                                    )}
                                </span>
                            </div>

                            {#if producto.estado === "agotado"}
                                <div
                                    class="flex items-center justify-center gap-2 rounded-2xl bg-gray-100 py-3 text-sm font-semibold text-gray-500"
                                >
                                    <i class="fa-solid fa-clock"></i>
                                    Agotado temporalmente
                                </div>
                            {:else}
                                <button
                                    type="button"
                                    onclick={() => pedirWhatsApp(producto)}
                                    class="mt-auto flex items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-[#CDB9FE] to-[#B794F6] px-4 py-3 font-semibold text-gray-900 transition hover:brightness-105 active:scale-[0.98]"
                                >
                                    <i class="fa-brands fa-whatsapp text-base"
                                    ></i>
                                    Pedir por WhatsApp
                                </button>
                            {/if}
                        </div>
                    </article>
                {/each}
            </div>
        {/if}
    </section>
</div>
