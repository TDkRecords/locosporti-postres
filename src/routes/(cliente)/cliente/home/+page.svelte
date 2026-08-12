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

    onMount(() => {
        unsubProductos = watchCollection("productos", (data) => {
            productos = data;
            loading = false;
        }, "fecha");

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
    <header class="rounded-3xl bg-white p-5 shadow-sm">
        <p
            class="text-sm font-semibold uppercase tracking-[0.2em] text-[#CDB9FE]"
        >
            Home
        </p>
        <h1 class="mt-2 text-3xl font-bold text-gray-900">Bienvenido a Locos por ti</h1>
        <p class="mt-2 text-sm text-gray-500">
            Elige tus postres favoritos y pídelos por WhatsApp.
        </p>
    </header>

    <section class="rounded-3xl bg-white p-5 shadow-sm">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
                <h2 class="text-xl font-bold text-gray-900">Catálogo de postres</h2>
                <p class="mt-1 text-sm text-gray-500">Filtra por nombre, precio o fecha.</p>
            </div>
            <div class="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
                <input
                    type="text"
                    bind:value={busqueda}
                    placeholder="Buscar producto"
                    class="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 outline-none focus:border-[#CDB9FE] focus:ring-4 focus:ring-[#CDB9FE]/20 sm:w-56"
                />
                <select
                    bind:value={ordenPrecio}
                    class="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 outline-none focus:border-[#CDB9FE]"
                >
                    <option value="">Precio</option>
                    <option value="mayor">Mayor precio</option>
                    <option value="menor">Menor precio</option>
                </select>
                <select
                    bind:value={ordenFecha}
                    class="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 outline-none focus:border-[#CDB9FE]"
                >
                    <option value="">Fecha</option>
                    <option value="primero">El primero</option>
                    <option value="ultimo">El último</option>
                </select>
            </div>
        </div>

        {#if loading}
            <div class="mt-8 text-center text-gray-500">
                <i class="fa-solid fa-spinner fa-spin text-2xl"></i>
                <p class="mt-2 text-sm">Cargando postres...</p>
            </div>
        {:else if productosFiltrados.length === 0}
            <div class="mt-8 text-center text-gray-400">
                <i class="fa-solid fa-box-open text-4xl"></i>
                <p class="mt-3 text-sm">
                    {busqueda ? "No se encontraron productos con esa búsqueda." : "Aún no hay productos disponibles."}
                </p>
            </div>
        {:else}
            <div class="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {#each productosFiltrados as producto}
                    <article
                        class="rounded-3xl border border-gray-100 bg-[#FFFB96]/60 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                        <div class="overflow-hidden rounded-3xl bg-white">
                            <img
                                src={producto.imagen || "https://placehold.co/600x400?text=Sin+imagen"}
                                alt={producto.nombre}
                                class="h-48 w-full object-cover"
                            />
                        </div>
                        <div class="mt-4">
                            <div class="flex items-center justify-between gap-3">
                                <h3 class="text-lg font-bold text-gray-900">{producto.nombre}</h3>
                                {#if producto.estado === "agotado"}
                                    <span class="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                                        Agotado
                                    </span>
                                {/if}
                            </div>
                            <p class="mt-2 text-lg font-bold text-gray-800">
                                ${Number(producto.precio).toLocaleString("es-CO")}
                            </p>
                            {#if producto.estado === "agotado"}
                                <div
                                    class="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-500"
                                >
                                    <i class="fa-solid fa-clock"></i>
                                    Agotado temporalmente
                                </div>
                            {:else}
                                <button
                                    type="button"
                                    onclick={() => pedirWhatsApp(producto)}
                                    class="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#CDB9FE] px-4 py-3 text-sm font-semibold text-gray-900 transition hover:bg-[#bfa3fd]"
                                >
                                    <i class="fa-brands fa-whatsapp"></i>
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
