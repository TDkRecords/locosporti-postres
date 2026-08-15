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

    function getImagenProducto(productId) {
        return productos.find((p) => p.id === productId)?.imagen;
    }

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
    <header class="overflow-hidden rounded-3xl bg-white shadow-sm">
        <div class="p-5 sm:p-6">
            <div class="flex items-center gap-4">
                <div
                    class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#CDB9FE]/20 text-[#7C3AED]"
                >
                    <i class="fa-solid fa-bag-shopping text-xl"></i>
                </div>

                <div class="min-w-0">
                    <p class="text-sm font-medium text-[#7C3AED]">Pedidos</p>

                    <h1
                        class="mt-0.5 text-2xl font-bold text-gray-900 sm:text-3xl"
                    >
                        Mis pedidos
                    </h1>

                    <p class="mt-1 text-sm text-gray-500">
                        Consulta el estado de tus pedidos y su historial
                        completo.
                    </p>
                </div>
            </div>
        </div>
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

    <!-- lista de pedidos -->
    <section class="rounded-2xl sm:rounded-4xl">
        {#if loadingPedidos}
            <div
                class="flex flex-col items-center justify-center py-12 sm:py-16 text-gray-500"
            >
                <div
                    class="mb-4 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-[#CDB9FE]/20"
                >
                    <i
                        class="fa-solid fa-spinner fa-spin text-2xl sm:text-3xl text-[#7C3AED]"
                    ></i>
                </div>
                <p class="text-sm font-medium">Cargando pedidos...</p>
            </div>
        {:else if pedidosFiltrados.length === 0}
            <div
                class="flex flex-col items-center justify-center py-12 sm:py-16 px-4 text-center"
            >
                <div
                    class="mb-5 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-white"
                >
                    <i
                        class="fa-solid fa-bag-shopping text-2xl sm:text-3xl text-gray-400"
                    ></i>
                </div>

                <h3 class="text-base sm:text-lg font-semibold text-gray-800">
                    No tienes pedidos
                </h3>

                <p class="mt-2 max-w-sm text-sm text-gray-500">
                    Aún no hay pedidos en esta categoría.
                </p>
            </div>
        {:else}
            <!-- GRID RESPONSIVE -->
            <div
                class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:gap-5 auto-rows-max"
            >
                {#each pedidosFiltrados as pedido}
                    <article
                        class="group h-fit overflow-hidden rounded-2xl border border-[#F6E8B6] bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:rounded-[26px]"
                    >
                        <!-- PARTE VISIBLE -->
                        <button
                            type="button"
                            onclick={() => toggleExpand(pedido.id)}
                            class="w-full p-3 sm:p-4 text-left"
                        >
                            <!-- Cabecera -->
                            <div class="flex items-start justify-between gap-3">
                                <div class="min-w-0 flex-1">
                                    <h3
                                        class="text-sm font-bold text-gray-900 sm:text-base lg:text-lg"
                                    >
                                        Pedido # {pedido.numero ??
                                            pedido.id.slice(-6)}
                                    </h3>

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

                                <div class="text-right shrink-0">
                                    <p class="text-xs text-gray-500">Total</p>
                                    <p
                                        class="text-lg lg:text-xl font-bold text-[#7C3AED]"
                                    >
                                        ${(
                                            Number(pedido.total) || 0
                                        ).toLocaleString("es-CO")}
                                    </p>
                                </div>
                            </div>

                            <!-- Productos -->
                            <div
                                class="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2"
                            >
                                {#each (pedido.items || []).slice(0, 4) as item}
                                    <div
                                        class="flex items-center gap-2 rounded-xl bg-[#F3F4F6] p-2.5 w-100"
                                    >
                                        <img
                                            src={getImagenProducto(
                                                item.productId,
                                            ) ||
                                                "https://placehold.co/64x64?text=🍰"}
                                            alt={getNombreProducto(
                                                item.productId,
                                            )}
                                            class="h-12 w-12 rounded-lg object-cover"
                                        />

                                        <div class="min-w-0 flex-1">
                                            <p
                                                class="truncate text-sm font-semibold text-gray-800"
                                            >
                                                {getNombreProducto(
                                                    item.productId,
                                                )}
                                            </p>

                                            <p class="text-xs text-gray-500">
                                                ×{item.cantidad}
                                            </p>
                                        </div>
                                    </div>
                                {/each}
                            </div>

                            {#if (pedido.items || []).length > 4}
                                <p class="mt-3 text-xs text-gray-400">
                                    +{pedido.items.length - 4} productos más
                                </p>
                            {/if}

                            <!-- Botón expandir -->
                            <div class="mt-4 border-t border-gray-100 pt-3">
                                <div
                                    class="flex items-center justify-center gap-2 text-xs sm:text-sm font-medium text-gray-500 transition-colors group-hover:text-[#7C3AED]"
                                >
                                    <span>
                                        {expandedPedido === pedido.id
                                            ? "Ocultar detalles"
                                            : "Ver detalles"}
                                    </span>

                                    <i
                                        class={`fa-solid ${expandedPedido === pedido.id ? "fa-chevron-up" : "fa-chevron-down"} transition-transform duration-300`}
                                    ></i>
                                </div>
                            </div>
                        </button>

                        <!-- PARTE DESPLEGABLE -->
                        {#if expandedPedido === pedido.id}
                            <div
                                class="border-t border-gray-200 bg-[#FCFCFC] p-4 sm:p-5 animate-[fadeIn_.25s_ease-out]"
                            >
                                <!-- Seguimiento (ahora es lo primero) -->
                                {#if pedido.history?.length}
                                    <div class="mb-6">
                                        <p
                                            class="mb-4 text-[11px] font-semibold uppercase tracking-widest text-gray-400"
                                        >
                                            Seguimiento del pedido
                                        </p>

                                        <div class="relative">
                                            <!-- Línea horizontal -->
                                            <div
                                                class="absolute left-0 right-0 top-2 h-0.5 bg-[#7C3AED]/20"
                                            ></div>

                                            <!-- Estados -->
                                            <div
                                                class="relative grid"
                                                style={`grid-template-columns: repeat(${pedido.history.length}, minmax(0,1fr));`}
                                            >
                                                {#each pedido.history as event, index}
                                                    {@const isLast =
                                                        index ===
                                                        pedido.history.length -
                                                            1}

                                                    <div
                                                        class="min-w-0 flex flex-col items-center text-center px-1"
                                                    >
                                                        <!-- Punto -->
                                                        <div
                                                            class={`z-10 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white ${
                                                                isLast
                                                                    ? "bg-[#7C3AED]"
                                                                    : "bg-gray-500 border-[#7C3AED]"
                                                            }`}
                                                        >
                                                            {#if isLast}
                                                                <i
                                                                    class="fa-solid fa-check text-[7px] text-white"
                                                                ></i>
                                                            {/if}
                                                        </div>

                                                        <!-- Texto -->
                                                        <div
                                                            class="mt-3 min-w-0"
                                                        >
                                                            <p
                                                                class={`text-xs font-semibold capitalize leading-tight ${
                                                                    isLast
                                                                        ? "text-[#7C3AED]"
                                                                        : "text-gray-700"
                                                                }`}
                                                            >
                                                                {event.to}
                                                            </p>

                                                            <div
                                                                class="mt-1 flex flex-col items-center text-[10px] leading-tight text-gray-400"
                                                            >
                                                                <span>
                                                                    {new Date(
                                                                        event.at,
                                                                    ).toLocaleDateString(
                                                                        "es-CO",
                                                                        {
                                                                            day: "2-digit",
                                                                            month: "short",
                                                                        },
                                                                    )}
                                                                </span>

                                                                <span>
                                                                    {new Date(
                                                                        event.at,
                                                                    ).toLocaleTimeString(
                                                                        "es-CO",
                                                                        {
                                                                            hour: "2-digit",
                                                                            minute: "2-digit",
                                                                            hour12: true,
                                                                        },
                                                                    )}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                {/each}
                                            </div>
                                        </div>
                                    </div>
                                {/if}

                                <!-- Información del pedido -->
                                <div class="space-y-5">
                                    <!-- Comprobante -->
                                    {#if pedido.fotoEntrega}
                                        <div
                                            class="border-b border-dashed border-gray-200 pb-5"
                                        >
                                            <p
                                                class="mb-3 text-[11px] font-semibold uppercase tracking-widest text-gray-400"
                                            >
                                                Comprobante
                                            </p>

                                            <a
                                                href={pedido.fotoEntrega}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                class="block overflow-hidden rounded-xl border border-gray-200"
                                            >
                                                <img
                                                    src={pedido.fotoEntrega}
                                                    alt="Comprobante"
                                                    class="aspect-4/5 w-full object-cover transition-transform duration-300 hover:scale-[1.02]"
                                                />
                                            </a>
                                        </div>
                                    {/if}

                                    <!-- Método de pago -->
                                    <div
                                        class="border-b border-dashed border-gray-200 pb-5"
                                    >
                                        <p
                                            class="mb-3 text-[11px] font-semibold uppercase tracking-widest text-gray-400"
                                        >
                                            Método de pago
                                        </p>

                                        <div class="flex items-center gap-3">
                                            <div
                                                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#7C3AED]/10 text-[#7C3AED]"
                                            >
                                                <i
                                                    class={pedido.metodoPago ===
                                                    "transferencia"
                                                        ? "fa-solid fa-building-columns"
                                                        : "fa-solid fa-truck"}
                                                ></i>
                                            </div>

                                            <div class="min-w-0">
                                                <p
                                                    class="text-sm font-medium text-gray-800"
                                                >
                                                    {pedido.metodoPago ===
                                                    "transferencia"
                                                        ? "Transferencia bancaria"
                                                        : "Pago contra entrega"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Notas -->
                                    {#if pedido.notas}
                                        <div>
                                            <p
                                                class="mb-2 text-[11px] font-semibold uppercase tracking-widest text-gray-400"
                                            >
                                                Notas
                                            </p>

                                            <p
                                                class="text-sm italic leading-relaxed text-gray-700 wrap-break-words"
                                            >
                                                "{pedido.notas}"
                                            </p>
                                        </div>
                                    {/if}
                                </div>
                            </div>
                        {/if}
                    </article>
                {/each}
            </div>
        {/if}
    </section>

    <style>
        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(-6px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    </style>
</div>
