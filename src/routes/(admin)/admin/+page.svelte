<script>
    import { onMount } from "svelte";
    import { watchCollection } from "$lib/firestore.js";

    let pedidos = $state([]);
    let productos = $state([]);
    let egresos = $state([]);
    let loading = $state(true);

    const hoy = new Date().toISOString().slice(0, 10);

    let unsubPedidos, unsubProductos, unsubEgresos;

    onMount(() => {
        loading = true;

        unsubPedidos = watchCollection("pedidos", (data) => {
            pedidos = data;
            loading = false;
        }, "fecha");

        unsubProductos = watchCollection("productos", (data) => {
            productos = data;
        }, "fecha");

        unsubEgresos = watchCollection("egresos", (data) => {
            egresos = data;
        }, "fecha");

        return () => {
            unsubPedidos?.();
            unsubProductos?.();
            unsubEgresos?.();
        };
    });

    // ── Métricas de pedidos ──────────────────────────────────────────────────
    let pedidosHoy = $derived(
        pedidos.filter((p) => (p.fecha || "").startsWith(hoy)).length,
    );
    let pendientes = $derived(
        pedidos.filter((p) => p.estado === "Preparando").length,
    );
    let preparando = $derived(
        pedidos.filter((p) => p.estado === "Empacado").length,
    );
    let enDomicilio = $derived(
        pedidos.filter((p) => p.estado === "A domicilio").length,
    );
    let entregados = $derived(
        pedidos.filter((p) => p.estado === "Entregado").length,
    );

    // ── Finanzas del día ─────────────────────────────────────────────────────
    let ingresosDia = $derived(
        pedidos
            .filter(
                (p) =>
                    (p.fecha || "").startsWith(hoy) &&
                    (p.estado === "Entregado" || p.metodoPago === "transferencia"),
            )
            .reduce((sum, p) => sum + (Number(p.total) || 0), 0),
    );

    let egresosDia = $derived(
        egresos
            .filter((e) => !e.eliminado && (e.fecha || "").startsWith(hoy))
            .reduce((sum, e) => sum + (Number(e.monto) || 0), 0),
    );

    let ganancia = $derived(ingresosDia - egresosDia);

    // ── Stock bajo (stock <= stockMinimo o stock == 0) ───────────────────────
    let productosStockBajo = $derived(
        productos.filter(
            (p) =>
                p.estado !== "eliminado" &&
                p.estado !== "descontinuado" &&
                ((p.stockMinimo !== undefined && Number(p.stock) <= Number(p.stockMinimo)) ||
                    Number(p.stock) === 0),
        ),
    );
</script>

<svelte:head>
    <title>Dashboard | Admin</title>
</svelte:head>

<div class="space-y-6 p-4 sm:p-6">
    <header class="rounded-3xl bg-white p-4 shadow-sm sm:p-6">
        <p class="text-sm font-semibold uppercase tracking-[0.2em] text-[#CDB9FE]">Dashboard</p>
        <h1 class="mt-2 text-2xl font-bold text-gray-800">Resumen del día</h1>
        <p class="mt-2 text-sm text-gray-500">
            Métricas operativas y financieras del negocio en tiempo real.
        </p>
    </header>

    {#if loading}
        <div class="rounded-3xl bg-white p-8 text-center shadow-sm">
            <p class="text-gray-500">Cargando datos en tiempo real...</p>
        </div>
    {:else}
        <!-- Pedidos -->
        <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div class="rounded-3xl bg-white p-4 shadow-sm">
                <p class="text-sm text-gray-500">Pedidos hoy</p>
                <p class="mt-2 text-2xl font-bold text-gray-800">{pedidosHoy}</p>
            </div>
            <div class="rounded-3xl bg-white p-4 shadow-sm">
                <p class="text-sm text-gray-500">Preparando</p>
                <p class="mt-2 text-2xl font-bold text-amber-600">{pendientes}</p>
            </div>
            <div class="rounded-3xl bg-white p-4 shadow-sm">
                <p class="text-sm text-gray-500">Empacado</p>
                <p class="mt-2 text-2xl font-bold text-blue-600">{preparando}</p>
            </div>
            <div class="rounded-3xl bg-white p-4 shadow-sm">
                <p class="text-sm text-gray-500">En domicilio</p>
                <p class="mt-2 text-2xl font-bold text-purple-600">{enDomicilio}</p>
            </div>
        </section>

        <!-- Finanzas -->
        <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <div class="rounded-3xl bg-white p-4 shadow-sm">
                <p class="text-sm text-gray-500">Entregados hoy</p>
                <p class="mt-2 text-2xl font-bold text-green-600">{entregados}</p>
            </div>
            <div class="rounded-3xl bg-white p-4 shadow-sm">
                <p class="text-sm text-gray-500">Ingresos del día</p>
                <p class="mt-2 text-2xl font-bold text-gray-800">
                    ${ingresosDia.toLocaleString("es-CO")}
                </p>
            </div>
            <div class="rounded-3xl bg-white p-4 shadow-sm">
                <p class="text-sm text-gray-500">Egresos</p>
                <p class="mt-2 text-2xl font-bold text-red-600">
                    ${egresosDia.toLocaleString("es-CO")}
                </p>
            </div>
            <div class="rounded-3xl bg-white p-4 shadow-sm">
                <p class="text-sm text-gray-500">Ganancia</p>
                <p
                    class={`mt-2 text-2xl font-bold ${ganancia >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                    ${ganancia.toLocaleString("es-CO")}
                </p>
            </div>
            <div class="rounded-3xl bg-white p-4 shadow-sm">
                <p class="text-sm text-gray-500">Stock bajo</p>
                <p class="mt-2 text-2xl font-bold text-orange-600">{productosStockBajo.length}</p>
            </div>
        </section>

        <!-- Productos con stock bajo -->
        {#if productosStockBajo.length > 0}
            <section class="rounded-3xl bg-white p-4 shadow-sm sm:p-6">
                <h2 class="text-lg font-bold text-gray-800">Productos con stock bajo</h2>
                <div class="mt-4 space-y-3">
                    {#each productosStockBajo as producto}
                        <div
                            class="flex items-center justify-between rounded-2xl bg-[#FFCDDB]/40 px-4 py-3"
                        >
                            <p class="font-semibold text-gray-800">{producto.nombre}</p>
                            <span class="text-sm font-semibold text-red-700">
                                Stock: {producto.stock}
                                {#if producto.stockMinimo !== undefined}
                                    / mín {producto.stockMinimo}
                                {/if}
                            </span>
                        </div>
                    {/each}
                </div>
            </section>
        {/if}

        <!-- Sin datos -->
        {#if pedidosHoy === 0 && ingresosDia === 0}
            <div class="rounded-3xl bg-[#FFFB96]/40 p-6 text-center">
                <i class="fa-solid fa-chart-line text-3xl text-gray-400"></i>
                <p class="mt-3 text-gray-500">
                    Aún no hay pedidos registrados hoy. ¡Empieza registrando el primero!
                </p>
            </div>
        {/if}
    {/if}
</div>
