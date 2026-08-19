<script>
    import { onMount } from "svelte";
    import ListPedido from "./components/ListPedido.svelte";
    import DetailPedido from "./components/DetailPedido.svelte";
    import FormPedido from "./components/FormPedido.svelte";
    import DeletePedido from "./components/DeletePedido.svelte";
    import {
        watchCollection,
        crearPedidoConFactura,
        changeOrderStatus,
        editarPedido,
    } from "$lib/firestore.js";

    let showForm = $state(false);
    let showDelete = $state(false);
    let editingPedido = $state(null);
    let pedidoToDelete = $state(null);
    let selectedPedidoId = $state(null); // ID del pedido abierto en el detalle
    let errorPedido = $state("");

    let productos = $state([]);
    let clientes = $state([]);
    let pedidos = $state([]);
    let loading = $state(true);

    // Filtros
    let filtroEstado = $state("");
    let filtroFecha = $state("ALL");
    let filtroMetodo = $state("");
    let busquedaCliente = $state("");

    let unsubPedidos, unsubProductos, unsubClientes;

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
        unsubClientes = watchCollection(
            "clientes",
            (data) => {
                clientes = data;
            },
            "createdAt",
        );

        return () => {
            unsubPedidos?.();
            unsubProductos?.();
            unsubClientes?.();
        };
    });

    // Pedido seleccionado, resuelto en vivo desde la lista de Firestore
    // (así el detalle refleja cambios de estado, foto de entrega, etc. al instante)
    let selectedPedido = $derived(
        pedidos.find((p) => p.id === selectedPedidoId) || null,
    );

    // ── Helpers ───────────────────────────────────────────────────────────────
    function getNombreCliente(clienteId) {
        const c = clientes.find(
            (x) => x.id === clienteId || x.uid === clienteId,
        );
        if (!c) return "Cliente no asignado";
        return (
            `${c.nombre || ""} ${c.apellido || ""}`.trim() ||
            c.email ||
            "Cliente"
        );
    }

    function getCliente(clienteId) {
        return (
            clientes.find((x) => x.id === clienteId || x.uid === clienteId) ||
            null
        );
    }

    function getProductosMap() {
        const map = {};
        for (const p of productos) map[p.id] = p;
        return map;
    }

    function filtrarPorFecha(lista, campo = "fecha", rango = "ALL") {
        if (rango === "ALL") return lista;
        const corte = new Date();
        if (rango === "1D") corte.setDate(corte.getDate() - 1);
        else if (rango === "7D") corte.setDate(corte.getDate() - 7);
        else if (rango === "30D") corte.setDate(corte.getDate() - 30);
        else if (rango === "12M") corte.setMonth(corte.getMonth() - 12);
        return lista.filter(
            (item) => item[campo] && new Date(item[campo]) >= corte,
        );
    }

    // ── Pedidos filtrados ─────────────────────────────────────────────────────
    let pedidosFiltrados = $derived.by(() => {
        let lista = pedidos.filter((p) => p.estado !== "eliminado");
        lista = filtrarPorFecha(lista, "fecha", filtroFecha);

        if (filtroEstado)
            lista = lista.filter((p) => p.estado === filtroEstado);
        if (filtroMetodo)
            lista = lista.filter((p) => p.metodoPago === filtroMetodo);
        if (busquedaCliente) {
            const q = busquedaCliente.toLowerCase();
            lista = lista.filter((p) =>
                getNombreCliente(p.clienteId).toLowerCase().includes(q),
            );
        }

        return lista;
    });

    // ── Stats ─────────────────────────────────────────────────────────────────
    let totalPedidos = $derived(
        pedidos.filter((p) => p.estado !== "Cancelado").length,
    );
    let pedidosEntregados = $derived(
        pedidos.filter((p) => p.estado === "Entregado").length,
    );

    // ── Detalle ───────────────────────────────────────────────────────────────
    function openDetail(pedido) {
        selectedPedidoId = pedido.id;
    }

    function closeDetail() {
        selectedPedidoId = null;
    }

    // ── Acciones ──────────────────────────────────────────────────────────────
    function openCreate() {
        editingPedido = null;
        showForm = true;
    }

    function openEdit(pedido) {
        editingPedido = pedido;
        showForm = true;
    }

    function closeForm() {
        showForm = false;
        editingPedido = null;
    }

    function openDelete(pedido) {
        pedidoToDelete = pedido;
        showDelete = true;
    }

    function closeDelete() {
        showDelete = false;
        pedidoToDelete = null;
    }

    async function agregarPedido(payload) {
        errorPedido = "";
        const productosMap = getProductosMap();
        const items = [
            {
                productId: payload.productoId,
                cantidad: payload.cantidad,
            },
        ];

        try {
            if (editingPedido && editingPedido.id) {
                // Actualizar pedido existente. El cambio de estado (si lo hay)
                // se valida y aplica de forma lineal dentro de editarPedido.
                await editarPedido(
                    editingPedido.id,
                    editingPedido,
                    {
                        clienteId: payload.clienteId,
                        items,
                        notas: payload.notas,
                        metodoPago: payload.metodoPago,
                        estado: payload.estado,
                    },
                    productosMap,
                    payload.fotoEntrega
                        ? { fotoEntrega: payload.fotoEntrega }
                        : {},
                );
            } else {
                // Crear nuevo pedido + factura automáticamente.
                // Siempre inicia en "Preparando"; se valida que haya stock suficiente.
                await crearPedidoConFactura(
                    {
                        clienteId: payload.clienteId,
                        items,
                        notas: payload.notas,
                        metodoPago: payload.metodoPago,
                        estado: "Preparando",
                    },
                    productosMap,
                );
            }
            closeForm();
        } catch (err) {
            console.error("Error guardando pedido:", err);
            errorPedido = err?.message || "No se pudo guardar el pedido.";
            alert(errorPedido);
        }
    }

    async function softDeletePedido(pedido) {
        try {
            await changeOrderStatus(pedido.id, "Cancelado");
            if (selectedPedidoId === pedido.id) {
                closeDetail();
            }
        } catch (err) {
            console.error("Error cancelando pedido:", err);
        } finally {
            closeDelete();
        }
    }

    // ── UI helpers ────────────────────────────────────────────────────────────
    function estadoColor(estado) {
        const map = {
            Entregado: "bg-green-100 text-green-700",
            "A domicilio": "bg-purple-100 text-purple-700",
            Empacado: "bg-yellow-100 text-yellow-700",
            Preparando: "bg-blue-100 text-blue-700",
            Cancelado: "bg-red-100 text-red-700",
        };
        return map[estado] || "bg-gray-100 text-gray-700";
    }
</script>

<div class="space-y-6 p-4 sm:p-6">
    <header class="overflow-hidden rounded-3xl bg-white shadow-sm">
        <div class="p-5 sm:p-6">
            <div class="flex flex-wrap items-center justify-between gap-4">
                <div class="flex min-w-0 items-center gap-4">
                    <div
                        class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#CDB9FE]/20 text-[#7C3AED]"
                    >
                        <i class="fa-solid fa-bag-shopping text-xl"></i>
                    </div>

                    <div class="min-w-0">
                        <p class="text-sm font-medium text-[#7C3AED]">
                            Pedidos
                        </p>

                        <h1
                            class="mt-0.5 text-2xl font-bold text-gray-900 sm:text-3xl"
                        >
                            Administración de pedidos
                        </h1>

                        <p class="mt-1 text-sm text-gray-500">
                            Registra, administra y realiza el seguimiento
                            completo de cada pedido.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </header>

    <!-- Stats -->
    <section class="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div
            class="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
            <div class="flex items-center justify-between">
                <i class="fa-solid fa-receipt text-[#7C3AED]"></i>
                <span class="text-xs text-gray-500">Hoy</span>
            </div>

            <p class="mt-4 text-3xl font-bold text-gray-900">{totalPedidos}</p>
            <p class="text-sm text-gray-500">Total pedidos</p>
        </div>

        <div
            class="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
            <div class="flex items-center justify-between">
                <i class="fa-solid fa-circle-check text-green-500"></i>
                <span class="text-xs text-gray-500">Completados</span>
            </div>

            <p class="mt-4 text-3xl font-bold text-green-600">
                {pedidosEntregados}
            </p>
            <p class="text-sm text-gray-500">Entregados</p>
        </div>

        <div
            class="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
            <div class="flex items-center justify-between">
                <i class="fa-solid fa-motorcycle text-blue-500"></i>
                <span class="text-xs text-gray-500">En proceso</span>
            </div>

            <p class="mt-4 text-3xl font-bold text-blue-600">
                {pedidos.filter(
                    (p) => !["Entregado", "Cancelado"].includes(p.estado),
                ).length}
            </p>

            <p class="text-sm text-gray-500">Activos</p>
        </div>

        <div
            class="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
            <div class="flex items-center justify-between">
                <i class="fa-solid fa-ban text-red-500"></i>
                <span class="text-xs text-gray-500">Incidencias</span>
            </div>

            <p class="mt-4 text-3xl font-bold text-red-600">
                {pedidos.filter((p) => p.estado === "Cancelado").length}
            </p>

            <p class="text-sm text-gray-500">Cancelados</p>
        </div>
    </section>

    <!-- Filtros -->
    <section class="rounded-3xl bg-white p-4 shadow-sm sm:p-6">
        <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <input
                bind:value={busquedaCliente}
                type="text"
                placeholder="Buscar por cliente"
                class="flex-1 rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-[#CDB9FE]"
            />
            <select
                bind:value={filtroEstado}
                class="rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-[#CDB9FE]"
            >
                <option value="">Todos los estados</option>
                <option value="Preparando">Preparando</option>
                <option value="Empacado">Empacado</option>
                <option value="A domicilio">A domicilio</option>
                <option value="Entregado">Entregado</option>
                <option value="Cancelado">Cancelado</option>
            </select>
            <select
                bind:value={filtroMetodo}
                class="rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-[#CDB9FE]"
            >
                <option value="">Todo método de pago</option>
                <option value="transferencia">Transferencia</option>
                <option value="contra_entrega">Contra entrega</option>
            </select>
            <select
                bind:value={filtroFecha}
                class="rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-[#CDB9FE]"
            >
                <option value="1D">1D</option>
                <option value="7D">7D</option>
                <option value="30D">30D</option>
                <option value="12M">12M</option>
                <option value="ALL">ALL</option>
            </select>
        </div>
    </section>

    <!-- Lista pedidos -->
    <section class="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
        {#if loading}
            <p class="p-8 text-center text-gray-400">Cargando pedidos...</p>
        {:else if pedidosFiltrados.length === 0}
            <div class="p-8 text-center text-gray-400">
                <i class="fa-solid fa-box text-4xl"></i>
                <p class="mt-3 text-sm">No hay pedidos en este período.</p>
            </div>
        {:else}
            <ListPedido
                pedidos={pedidosFiltrados}
                {getNombreCliente}
                {estadoColor}
                onSelectPedido={openDetail}
            />
        {/if}
    </section>
</div>

<!-- FAB -->
{#if !showForm && !selectedPedido}
    <div
        class="pointer-events-none fixed right-0 bottom-18 left-0 z-40 lg:bottom-6"
    >
        <div class="container mx-auto flex justify-end px-4">
            <button
                title="Nuevo pedido"
                type="button"
                onclick={openCreate}
                class="pointer-events-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#CDB9FE] text-2xl text-white shadow-xl transition-all duration-200 hover:scale-110 active:scale-95"
            >
                <i class="fa-solid fa-plus"></i>
            </button>
        </div>
    </div>
{/if}

<FormPedido
    bind:open={showForm}
    pedido={editingPedido}
    {clientes}
    {productos}
    onSubmit={agregarPedido}
/>

<DeletePedido
    bind:open={showDelete}
    pedido={pedidoToDelete}
    onConfirm={softDeletePedido}
/>

<!-- Detail -->
{#if selectedPedido}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm"
    >
        <button
            type="button"
            aria-label="Cerrar detalle"
            onclick={closeDetail}
            class="absolute inset-0 cursor-default"
        ></button>

        <div class="relative z-10 w-full max-w-xl">
            <DetailPedido
                pedido={selectedPedido}
                cliente={getCliente(selectedPedido.clienteId)}
                {productos}
                {estadoColor}
                onClose={closeDetail}
                onEdit={openEdit}
                onCancel={openDelete}
            />
        </div>
    </div>
{/if}
