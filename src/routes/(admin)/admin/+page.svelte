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

        unsubPedidos = watchCollection(
            "pedidos",
            (data) => {
                pedidos = data;
                loading = false;
            },
            "fecha",
        );

        unsubProductos = watchCollection(
            "productos",
            (data) => {
                productos = data;
            },
            "fecha",
        );

        unsubEgresos = watchCollection(
            "egresos",
            (data) => {
                egresos = data;
            },
            "fecha",
        );

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
                    (p.estado === "Entregado" ||
                        p.metodoPago === "transferencia"),
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
                ((p.stockMinimo !== undefined &&
                    Number(p.stock) <= Number(p.stockMinimo)) ||
                    Number(p.stock) === 0),
        ),
    );
</script>

<svelte:head>
    <title>Dashboard | Admin</title>
</svelte:head>

<div class="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
    <!-- Header -->
    <header class="overflow-hidden rounded-3xl bg-white shadow-sm">
        <div class="p-5 sm:p-6">
            <div class="flex flex-wrap items-center justify-between gap-4">
                <div class="flex min-w-0 items-center gap-4">
                    <!-- Icono principal -->
                    <div
                        class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#CDB9FE]/20 text-[#7C3AED]"
                    >
                        <i class="fa-solid fa-chart-line text-xl"></i>
                    </div>

                    <!-- Título -->
                    <div class="min-w-0">
                        <p class="text-sm font-medium text-[#7C3AED]">
                            Dashboard
                        </p>

                        <h1
                            class="mt-0.5 text-2xl font-bold text-gray-900 sm:text-3xl"
                        >
                            Resumen del día
                        </h1>

                        <p class="mt-1 text-sm text-gray-500">
                            Métricas operativas y financieras del negocio
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </header>

    {#if loading}
        <div
            class="rounded-3xl border border-gray-100 bg-white p-10 text-center shadow-sm"
        >
            <i class="fa-solid fa-spinner fa-spin text-3xl text-[#CDB9FE]"></i>
            <p class="mt-3 text-gray-500">Cargando datos en tiempo real...</p>
        </div>
    {:else}
        <!-- Operación -->
        <section class="space-y-3">
            <div class="flex items-center gap-2 px-1">
                <i class="fa-solid fa-bag-shopping text-[#7C3AED]"></i>
                <h2 class="text-lg font-semibold text-gray-800">Operación</h2>
            </div>

            <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <div
                    class="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                    <div class="flex items-center justify-between">
                        <i class="fa-solid fa-receipt text-gray-500"></i>
                        <span class="text-xs text-gray-500">Hoy</span>
                    </div>
                    <p class="mt-4 text-3xl font-bold text-gray-800">
                        {pedidosHoy}
                    </p>
                    <p class="text-sm text-gray-500">Pedidos</p>
                </div>

                <div
                    class="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                    <div class="flex items-center justify-between">
                        <i class="fa-solid fa-fire-burner text-amber-500"></i>
                        <span class="text-xs text-gray-500">Proceso</span>
                    </div>
                    <p class="mt-4 text-3xl font-bold text-amber-600">
                        {pendientes}
                    </p>
                    <p class="text-sm text-gray-500">Preparando</p>
                </div>

                <div
                    class="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                    <div class="flex items-center justify-between">
                        <i class="fa-solid fa-box text-blue-500"></i>
                        <span class="text-xs text-gray-500">Listos</span>
                    </div>
                    <p class="mt-4 text-3xl font-bold text-blue-600">
                        {preparando}
                    </p>
                    <p class="text-sm text-gray-500">Empacado</p>
                </div>

                <div
                    class="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                    <div class="flex items-center justify-between">
                        <i class="fa-solid fa-motorcycle text-purple-500"></i>
                        <span class="text-xs text-gray-500">Ruta</span>
                    </div>
                    <p class="mt-4 text-3xl font-bold text-purple-600">
                        {enDomicilio}
                    </p>
                    <p class="text-sm text-gray-500">En domicilio</p>
                </div>
            </div>
        </section>

        <!-- Finanzas -->
        <section class="space-y-3">
            <div class="flex items-center gap-2 px-1">
                <i class="fa-solid fa-wallet text-[#7C3AED]"></i>
                <h2 class="text-lg font-semibold text-gray-800">Finanzas</h2>
            </div>

            <div class="grid grid-cols-2 gap-4 xl:grid-cols-5">
                <div
                    class="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                    <div class="flex items-center justify-between">
                        <i class="fa-solid fa-circle-check text-green-500"></i>
                        <span class="text-xs text-gray-500">Hoy</span>
                    </div>
                    <p class="mt-4 text-3xl font-bold text-green-600">
                        {entregados}
                    </p>
                    <p class="text-sm text-gray-500">Entregados</p>
                </div>

                <div
                    class="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                    <div class="flex items-center justify-between">
                        <i class="fa-solid fa-dollar-sign text-[#CDB9FE]"></i>
                        <span class="text-xs text-gray-500">Ingresos</span>
                    </div>
                    <p
                        class="mt-4 text-xl font-bold text-gray-800 wrap-break-words"
                    >
                        ${ingresosDia.toLocaleString("es-CO")}
                    </p>
                    <p class="text-sm text-gray-500">Del día</p>
                </div>

                <div
                    class="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                    <div class="flex items-center justify-between">
                        <i class="fa-solid fa-arrow-down text-red-500"></i>
                        <span class="text-xs text-gray-500">Egresos</span>
                    </div>
                    <p
                        class="mt-4 text-xl font-bold text-red-600 wrap-break-words"
                    >
                        ${egresosDia.toLocaleString("es-CO")}
                    </p>
                    <p class="text-sm text-gray-500">Del día</p>
                </div>

                <div
                    class="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                    <div class="flex items-center justify-between">
                        <i
                            class="fa-solid fa-chart-line {ganancia >= 0
                                ? 'text-green-500'
                                : 'text-red-500'}"
                        ></i>
                        <span class="text-xs text-gray-500">Balance</span>
                    </div>
                    <p
                        class="mt-4 text-xl font-bold {ganancia >= 0
                            ? 'text-green-600'
                            : 'text-red-600'} wrap-break-words"
                    >
                        ${ganancia.toLocaleString("es-CO")}
                    </p>
                    <p class="text-sm text-gray-500">Ganancia</p>
                </div>

                <div
                    class="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                    <div class="flex items-center justify-between">
                        <i
                            class="fa-solid fa-triangle-exclamation text-orange-500"
                        ></i>
                        <span class="text-xs text-gray-500">Inventario</span>
                    </div>
                    <p class="mt-4 text-3xl font-bold text-orange-600">
                        {productosStockBajo.length}
                    </p>
                    <p class="text-sm text-gray-500">Stock bajo</p>
                </div>
            </div>
        </section>

        <!-- Stock bajo -->
        {#if productosStockBajo.length > 0}
            <section
                class="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6"
            >
                <div class="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <div class="flex items-center gap-2">
                            <i class="fa-solid fa-box-open text-red-500"></i>
                            <h2 class="text-lg font-semibold text-gray-800">
                                Productos con stock bajo
                            </h2>
                        </div>
                        <p class="mt-1 text-sm text-gray-500">
                            Requieren reposición próximamente.
                        </p>
                    </div>

                    <span
                        class="rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-700"
                    >
                        {productosStockBajo.length} alerta(s)
                    </span>
                </div>

                <div class="mt-5 space-y-3">
                    {#each productosStockBajo as producto}
                        <div
                            class="rounded-2xl border border-pink-200 bg-[#FFF5F7] p-4 transition hover:shadow-sm"
                        >
                            <div
                                class="flex flex-wrap items-center justify-between gap-3"
                            >
                                <div>
                                    <p class="font-semibold text-gray-800">
                                        {producto.nombre}
                                    </p>
                                    <p class="text-sm text-gray-500">
                                        Inventario disponible
                                    </p>
                                </div>

                                <div class="text-right">
                                    <p class="font-semibold text-red-700">
                                        {producto.stock} unidades
                                    </p>
                                    {#if producto.stockMinimo !== undefined}
                                        <p class="text-sm text-gray-500">
                                            Mínimo: {producto.stockMinimo}
                                        </p>
                                    {/if}
                                </div>
                            </div>
                        </div>
                    {/each}
                </div>
            </section>
        {/if}

        <!-- Estado vacío -->
        {#if pedidosHoy === 0 && ingresosDia === 0}
            <div
                class="rounded-3xl border border-gray-300 bg-white p-8 text-center"
            >
                <i class="fa-solid fa-chart-line text-4xl text-[#7C3AED]"></i>
                <h3 class="mt-4 text-lg font-semibold text-gray-800">
                    Aún no hay actividad
                </h3>
                <p class="mx-auto mt-2 max-w-md text-sm text-gray-600">
                    No se han registrado pedidos hoy. El primer pedido aparecerá
                    aquí junto con las métricas del negocio.
                </p>
            </div>
        {/if}
    {/if}
</div>
