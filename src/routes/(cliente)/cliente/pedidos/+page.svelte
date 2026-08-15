<script>
    import { onMount } from "svelte";
    import { currentUser } from "$lib/stores.js";
    import { watchCollection, watchCollectionWhere } from "$lib/firestore.js";

    let pedidos = $state([]);
    let productos = $state([]);
    let loadingPedidos = $state(true);
    let expandedPedido = $state(null);
    let filtroEstado = $state("todos"); // todos | activos | completados | cancelados

    let unsubProductos;

    onMount(() => {
        unsubProductos = watchCollection(
            "productos",
            (data) => {
                productos = data;
            },
            "fecha",
        );

        return () => {
            unsubProductos?.();
        };
    });

    // Se suscribe (o re-suscribe) a los pedidos del cliente en cuanto se conoce su uid
    $effect(() => {
        const uid = $currentUser?.uid;
        if (!uid) {
            pedidos = [];
            loadingPedidos = false;
            return;
        }

        loadingPedidos = true;
        const unsub = watchCollectionWhere(
            "pedidos",
            "clienteId",
            "==",
            uid,
            (data) => {
                pedidos = data;
                loadingPedidos = false;
            },
            "fecha",
        );

        return () => unsub();
    });

    // ── Helpers ───────────────────────────────────────────────────────────────
    function getNombreProducto(productId) {
        const p = productos.find((x) => x.id === productId);
        return p ? p.nombre : "Producto";
    }

    function estadoColor(estado) {
        const map = {
            Entregado: " text-green-700",
            "A domicilio": "text-purple-700",
            Empacado: "text-yellow-700",
            Preparando: "text-blue-700",
            Cancelado: "text-red-700",
        };
        return map[estado] || "bg-gray-100 text-gray-700";
    }

    function toggleExpand(id) {
        expandedPedido = expandedPedido === id ? null : id;
    }

    // ── Stats (sobre TODOS los pedidos del cliente, sin filtrar por tab) ───────
    let totalPedidos = $derived(pedidos.length);
    let pedidosActivos = $derived(
        pedidos.filter((p) => !["Entregado", "Cancelado"].includes(p.estado))
            .length,
    );
    let pedidosCompletados = $derived(
        pedidos.filter((p) => p.estado === "Entregado").length,
    );
    let pedidosCancelados = $derived(
        pedidos.filter((p) => p.estado === "Cancelado").length,
    );

    // ── Lista según el tab seleccionado ─────────────────────────────────────────
    let pedidosFiltrados = $derived.by(() => {
        if (filtroEstado === "activos") {
            return pedidos.filter(
                (p) => !["Entregado", "Cancelado"].includes(p.estado),
            );
        }
        if (filtroEstado === "completados") {
            return pedidos.filter((p) => p.estado === "Entregado");
        }
        if (filtroEstado === "cancelados") {
            return pedidos.filter((p) => p.estado === "Cancelado");
        }
        return pedidos;
    });
</script>

<svelte:head>
    <title>Mis pedidos | Locos por ti</title>
</svelte:head>

<div class="space-y-6 p-4 sm:p-6">
    <header class="rounded-3xl bg-white p-5 shadow-sm">
        <p
            class="text-sm font-semibold uppercase tracking-[0.2em] text-[#CDB9FE]"
        >
            Pedidos
        </p>
        <h1 class="mt-2 text-3xl font-bold text-gray-900">Mis pedidos</h1>
        <p class="mt-2 text-sm text-gray-500">
            Consulta el estado de tus pedidos y su historial completo.
        </p>
    </header>

    <!-- Stats + Filtros -->
    <section class="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {#each [{ value: "todos", label: "Todos", count: totalPedidos, icon: "fa-box", activeBg: "from-[#CDB9FE] to-[#B69BFF]", activeText: "text-white", iconBg: "bg-white/20", iconColor: "text-white" }, { value: "activos", label: "En curso", count: pedidosActivos, icon: "fa-clock", activeBg: "from-blue-500 to-blue-600", activeText: "text-white", iconBg: "bg-blue-100", iconColor: "text-blue-600" }, { value: "completados", label: "Completados", count: pedidosCompletados, icon: "fa-circle-check", activeBg: "from-green-500 to-green-600", activeText: "text-white", iconBg: "bg-green-100", iconColor: "text-green-600" }, { value: "cancelados", label: "Cancelados", count: pedidosCancelados, icon: "fa-circle-xmark", activeBg: "from-red-500 to-red-600", activeText: "text-white", iconBg: "bg-red-100", iconColor: "text-red-600" }] as stat}
            <button
                type="button"
                onclick={() => (filtroEstado = stat.value)}
                class={`rounded-3xl p-4 text-left shadow-sm transition-all duration-200 active:scale-[0.98]
                ${stat.value === "todos" ? "col-span-1 lg:col-span-1" : ""}
                ${
                    filtroEstado === stat.value
                        ? `bg-linear-to-r ${stat.activeBg} ${stat.activeText} shadow-md`
                        : "bg-white hover:shadow-md hover:-translate-y-0.5"
                }`}
            >
                <div class="flex items-center justify-between">
                    <div class="min-w-0">
                        <p
                            class={`text-xs ${
                                filtroEstado === stat.value
                                    ? "text-white/80 uppercase tracking-wider"
                                    : "text-gray-500"
                            }`}
                        >
                            {stat.label}
                        </p>

                        <p
                            class={`mt-1 text-2xl font-bold sm:text-3xl ${
                                filtroEstado === stat.value
                                    ? "text-white"
                                    : stat.value === "activos"
                                      ? "text-blue-600"
                                      : stat.value === "completados"
                                        ? "text-green-600"
                                        : stat.value === "cancelados"
                                          ? "text-red-600"
                                          : "text-gray-800"
                            }`}
                        >
                            {stat.count}
                        </p>
                    </div>

                    <div
                        class={`flex h-10 w-10 items-center justify-center rounded-2xl sm:h-12 sm:w-12 ${
                            filtroEstado === stat.value
                                ? "bg-white/20 backdrop-blur-sm"
                                : stat.iconBg
                        }`}
                    >
                        <i
                            class={`fa-solid ${stat.icon} text-lg ${
                                filtroEstado === stat.value
                                    ? "text-white"
                                    : stat.iconColor
                            }`}
                        ></i>
                    </div>
                </div>
            </button>
        {/each}
    </section>

    <!-- Lista de pedidos -->
    <section class="overflow-hidden rounded-3xl bg-white shadow-sm">
        {#if loadingPedidos}
            <div class="flex flex-col items-center gap-3 p-10 text-gray-400">
                <icon name="loader" class="animate-spin"></icon>
                <p>Cargando pedidos...</p>
            </div>
        {:else if pedidosFiltrados.length === 0}
            <div class="flex flex-col items-center gap-3 p-10 text-gray-400">
                <icon name="package" size="2xl"></icon>
                <p class="text-sm">No tienes pedidos en esta categoría.</p>
            </div>
        {:else}
            <div class="divide-y divide-gray-100">
                {#each pedidosFiltrados as pedido}
                    <div class="transition-colors hover:bg-gray-50/40">
                        <!-- Card principal -->
                        <button
                            type="button"
                            onclick={() => toggleExpand(pedido.id)}
                            class="w-full p-4 text-left transition active:scale-[0.99] hover:bg-gray-50/40"
                        >
                            <!-- Encabezado -->
                            <div class="flex items-start justify-between gap-3">
                                <div class="min-w-0">
                                    <p
                                        class="text-base font-bold text-gray-800"
                                    >
                                        Pedido #{pedido.numero ??
                                            pedido.id.slice(-6)}
                                    </p>

                                    <p class="mt-1 text-xs text-gray-400">
                                        {new Date(pedido.fecha).toLocaleString(
                                            "es-CO",
                                            {
                                                day: "2-digit",
                                                month: "short",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            },
                                        )}
                                    </p>
                                </div>

                                <div class="flex items-center gap-2">
                                    <span
                                        class={`rounded-full px-3 py-1 text-xs font-semibold ${estadoColor(pedido.estado)}`}
                                    >
                                        {pedido.estado}
                                    </span>

                                    <i
                                        class={expandedPedido === pedido.id
                                            ? "fa-solid fa-chevron-up text-gray-400"
                                            : "fa-solid fa-chevron-down text-gray-400"}
                                    ></i>
                                </div>
                            </div>

                            <!-- Productos -->
                            <div class="mt-4 space-y-1">
                                {#each (pedido.items || []).slice(0, 2) as item}
                                    <p class="truncate text-sm text-gray-700">
                                        {getNombreProducto(item.productId)} × {item.cantidad}
                                    </p>
                                {/each}

                                {#if (pedido.items || []).length > 2}
                                    <p class="text-xs text-gray-400">
                                        +{pedido.items.length - 2} productos más
                                    </p>
                                {/if}
                            </div>

                            <!-- Total -->
                            <div
                                class="mt-4 flex items-center justify-between border-t border-gray-100 pt-3"
                            >
                                <span class="text-sm text-gray-500">Total</span>

                                <span class="text-lg font-bold text-gray-800">
                                    ${(
                                        Number(pedido.total) || 0
                                    ).toLocaleString("es-CO")}
                                </span>
                            </div>
                        </button>

                        <!-- Detalle expandido -->
                        {#if expandedPedido === pedido.id}
                            <div
                                class="space-y-5 border-t border-gray-100 bg-gray-50/60 px-4 py-5"
                            >
                                <!-- Notas -->
                                {#if pedido.notas}
                                    <div>
                                        <h4
                                            class="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500"
                                        >
                                            Notas
                                        </h4>

                                        <div
                                            class="rounded-2xl border border-[#FFE28A] bg-[#FFE28A]/30 px-3 py-2"
                                        >
                                            <p
                                                class="text-sm italic text-gray-700"
                                            >
                                                “{pedido.notas}”
                                            </p>
                                        </div>
                                    </div>
                                {/if}

                                <!-- Método de pago -->
                                <div>
                                    <h4
                                        class="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500"
                                    >
                                        Método de pago
                                    </h4>

                                    <div
                                        class="flex items-center gap-2 text-sm text-gray-700"
                                    >
                                        <i
                                            class={pedido.metodoPago ===
                                            "transferencia"
                                                ? "fa-solid fa-building-columns text-[#7c4dff]"
                                                : "fa-solid fa-truck text-[#7c4dff]"}
                                        ></i>

                                        <span>
                                            {pedido.metodoPago ===
                                            "transferencia"
                                                ? "Transferencia"
                                                : "Contra entrega"}
                                        </span>
                                    </div>
                                </div>

                                <!-- Foto -->
                                {#if pedido.fotoEntrega}
                                    <div>
                                        <h4
                                            class="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500"
                                        >
                                            Comprobante de entrega
                                        </h4>

                                        <a
                                            href={pedido.fotoEntrega}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            class="inline-block"
                                        >
                                            <img
                                                src={pedido.fotoEntrega}
                                                alt="Foto de entrega"
                                                class="h-32 w-32 rounded-2xl object-cover shadow-sm transition-transform hover:scale-105"
                                            />
                                        </a>
                                    </div>
                                {/if}

                                <!-- Historial -->
                                <div>
                                    <h4
                                        class="mb-3 text-xs font-bold uppercase tracking-wide text-gray-500"
                                    >
                                        Historial de estados
                                    </h4>

                                    <div class="space-y-3">
                                        {#each pedido.history || [] as event}
                                            <div
                                                class="flex items-center gap-3"
                                            >
                                                <div
                                                    class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#CDB9FE]/30"
                                                >
                                                    <i
                                                        class="fa-solid fa-circle-dot text-[#7c4dff] text-xs"
                                                    ></i>
                                                </div>

                                                <div class="min-w-0 flex-1">
                                                    <span
                                                        class={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${estadoColor(event.to)}`}
                                                    >
                                                        {event.to}
                                                    </span>

                                                    <p
                                                        class="mt-1 text-xs text-gray-400"
                                                    >
                                                        {new Date(
                                                            event.at,
                                                        ).toLocaleString(
                                                            "es-CO",
                                                            {
                                                                day: "2-digit",
                                                                month: "short",
                                                                hour: "2-digit",
                                                                minute: "2-digit",
                                                            },
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        {/each}
                                    </div>
                                </div>
                            </div>
                        {/if}
                    </div>
                {/each}
            </div>
        {/if}
    </section>
</div>
