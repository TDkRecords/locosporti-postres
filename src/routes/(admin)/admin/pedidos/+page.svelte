<script>
    import { onMount } from "svelte";
    import FormPedido from "./components/FormPedido.svelte";
    import DeletePedido from "./components/DeletePedido.svelte";
    import ConfirmEntrega from "./components/ConfirmEntrega.svelte";
    import {
        watchCollection,
        updateDocument,
        crearPedidoConFactura,
        changeOrderStatus,
    } from "$lib/firestore.js";

    let showForm = $state(false);
    let showDelete = $state(false);
    let showConfirmEntrega = $state(false);
    let editingPedido = $state(null);
    let pedidoToDelete = $state(null);
    let pedidoToConfirm = $state(null);
    let expandedPedido = $state(null); // ID del pedido con historial/info expandida

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
        unsubPedidos = watchCollection("pedidos", (data) => {
            pedidos = data;
            loading = false;
        }, "fecha");
        unsubProductos = watchCollection("productos", (data) => {
            productos = data;
        }, "fecha");
        unsubClientes = watchCollection("clientes", (data) => {
            clientes = data;
        }, "createdAt");

        return () => {
            unsubPedidos?.();
            unsubProductos?.();
            unsubClientes?.();
        };
    });

    // ── Helpers ───────────────────────────────────────────────────────────────
    function getNombreCliente(clienteId) {
        const c = clientes.find((x) => x.id === clienteId || x.uid === clienteId);
        if (!c) return "Cliente no asignado";
        return `${c.nombre || ""} ${c.apellido || ""}`.trim() || c.email || "Cliente";
    }

    function getCliente(clienteId) {
        return clientes.find((x) => x.id === clienteId || x.uid === clienteId) || null;
    }

    function getProductosMap() {
        const map = {};
        for (const p of productos) map[p.id] = p;
        return map;
    }

    function getNombreProducto(productId) {
        const p = productos.find((x) => x.id === productId);
        return p ? p.nombre : "Producto";
    }

    function filtrarPorFecha(lista, campo = "fecha", rango = "ALL") {
        if (rango === "ALL") return lista;
        const corte = new Date();
        if (rango === "1D") corte.setDate(corte.getDate() - 1);
        else if (rango === "7D") corte.setDate(corte.getDate() - 7);
        else if (rango === "30D") corte.setDate(corte.getDate() - 30);
        else if (rango === "12M") corte.setMonth(corte.getMonth() - 12);
        return lista.filter((item) => item[campo] && new Date(item[campo]) >= corte);
    }

    // ── Pedidos filtrados ─────────────────────────────────────────────────────
    let pedidosFiltrados = $derived.by(() => {
        let lista = pedidos.filter((p) => p.estado !== "eliminado");
        lista = filtrarPorFecha(lista, "fecha", filtroFecha);

        if (filtroEstado) lista = lista.filter((p) => p.estado === filtroEstado);
        if (filtroMetodo) lista = lista.filter((p) => p.metodoPago === filtroMetodo);
        if (busquedaCliente) {
            const q = busquedaCliente.toLowerCase();
            lista = lista.filter((p) =>
                getNombreCliente(p.clienteId).toLowerCase().includes(q),
            );
        }

        return lista;
    });

    // ── Stats ─────────────────────────────────────────────────────────────────
    let totalPedidos = $derived(pedidos.filter((p) => p.estado !== "Cancelado").length);
    let pedidosEntregados = $derived(pedidos.filter((p) => p.estado === "Entregado").length);

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
        try {
            if (editingPedido && editingPedido.id) {
                // Actualizar pedido existente
                const updates = {
                    clienteId: payload.clienteId,
                    items: [{ productId: payload.productoId, cantidad: payload.cantidad }],
                    notas: payload.notas,
                    metodoPago: payload.metodoPago,
                    estado: payload.estado,
                };
                await updateDocument("pedidos", editingPedido.id, updates);
            } else {
                // Crear nuevo pedido + factura automáticamente
                const productosMap = getProductosMap();
                await crearPedidoConFactura(
                    {
                        clienteId: payload.clienteId,
                        items: [{ productId: payload.productoId, cantidad: payload.cantidad }],
                        notas: payload.notas,
                        metodoPago: payload.metodoPago,
                        estado: payload.estado,
                    },
                    productosMap,
                );
            }
        } catch (err) {
            console.error("Error guardando pedido:", err);
        } finally {
            closeForm();
        }
    }

    async function softDeletePedido(pedido) {
        try {
            await changeOrderStatus(pedido.id, "Cancelado");
        } catch (err) {
            console.error("Error cancelando pedido:", err);
        } finally {
            closeDelete();
        }
    }

    async function changeStatus(pedido, status, eventTarget) {
        if (!status || status === pedido.estado) return;

        if (status === "Entregado") {
            if (eventTarget) eventTarget.value = ""; // revert visual selection
            pedidoToConfirm = pedido;
            showConfirmEntrega = true;
            return;
        }

        try {
            await changeOrderStatus(pedido.id, status);
        } catch (err) {
            console.error("Error cambiando estado:", err);
        }
    }

    async function handleConfirmEntrega(url) {
        if (!pedidoToConfirm) return;
        try {
            await changeOrderStatus(pedidoToConfirm.id, "Entregado", { fotoEntrega: url });
        } catch (err) {
            console.error("Error confirmando entrega:", err);
        } finally {
            showConfirmEntrega = false;
            pedidoToConfirm = null;
        }
    }

    // ── UI helpers ────────────────────────────────────────────────────────────
    function estadoColor(estado) {
        const map = {
            "Entregado": "bg-green-100 text-green-700",
            "A domicilio": "bg-purple-100 text-purple-700",
            "Empacado": "bg-yellow-100 text-yellow-700",
            "Preparando": "bg-blue-100 text-blue-700",
            "Cancelado": "bg-red-100 text-red-700",
        };
        return map[estado] || "bg-gray-100 text-gray-700";
    }

    function toggleExpand(id) {
        expandedPedido = expandedPedido === id ? null : id;
    }
</script>

<div class="space-y-6 p-4 sm:p-6">
    <header class="rounded-3xl bg-white p-4 shadow-sm sm:p-6">
        <p class="text-sm font-semibold uppercase tracking-[0.2em] text-[#CDB9FE]">Pedidos</p>
        <h1 class="mt-2 text-2xl font-bold text-gray-800">Administración de pedidos</h1>
        <p class="mt-2 text-sm text-gray-500">
            Registra y gestiona pedidos. Cada pedido genera su factura automáticamente.
        </p>
    </header>

    <!-- Stats -->
    <section class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div class="rounded-3xl bg-white p-4 shadow-sm">
            <p class="text-sm text-gray-500">Total pedidos</p>
            <p class="mt-2 text-2xl font-bold text-gray-800">{totalPedidos}</p>
        </div>
        <div class="rounded-3xl bg-white p-4 shadow-sm">
            <p class="text-sm text-gray-500">Entregados</p>
            <p class="mt-2 text-2xl font-bold text-green-600">{pedidosEntregados}</p>
        </div>
        <div class="rounded-3xl bg-white p-4 shadow-sm">
            <p class="text-sm text-gray-500">Activos</p>
            <p class="mt-2 text-2xl font-bold text-blue-600">
                {pedidos.filter((p) => !["Entregado", "Cancelado"].includes(p.estado)).length}
            </p>
        </div>
        <div class="rounded-3xl bg-white p-4 shadow-sm">
            <p class="text-sm text-gray-500">Cancelados</p>
            <p class="mt-2 text-2xl font-bold text-red-600">
                {pedidos.filter((p) => p.estado === "Cancelado").length}
            </p>
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
    <section class="rounded-3xl bg-white shadow-sm overflow-hidden">
        {#if loading}
            <p class="p-8 text-center text-gray-400">Cargando pedidos...</p>
        {:else if pedidosFiltrados.length === 0}
            <div class="p-8 text-center text-gray-400">
                <i class="fa-solid fa-box text-4xl"></i>
                <p class="mt-3 text-sm">No hay pedidos en este período.</p>
            </div>
        {:else}
            <div class="divide-y divide-gray-100">
                {#each pedidosFiltrados as pedido}
                    {@const cliente = getCliente(pedido.clienteId)}
                    <div>
                        <!-- Fila principal -->
                        <div class="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:gap-4">
                            <!-- # Pedido + fecha -->
                            <div class="min-w-0 lg:w-40">
                                <p class="font-semibold text-gray-800">
                                    #{pedido.numero ?? pedido.id.slice(-6)}
                                </p>
                                <p class="text-xs text-gray-400">
                                    {new Date(pedido.fecha).toLocaleString("es-CO", {
                                        day: "2-digit",
                                        month: "short",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </p>
                            </div>

                            <!-- Cliente -->
                            <div class="flex-1 min-w-0">
                                <p class="truncate text-sm font-semibold text-gray-700">
                                    {getNombreCliente(pedido.clienteId)}
                                </p>
                                <p class="text-xs text-gray-400">
                                    {pedido.metodoPago === "transferencia" ? "Transferencia" : "Contra entrega"}
                                </p>
                            </div>

                            <!-- Productos -->
                            <div class="flex-1 min-w-0">
                                {#each (pedido.items || []) as item}
                                    <p class="truncate text-sm text-gray-700">
                                        {getNombreProducto(item.productId)} × {item.cantidad}
                                    </p>
                                {/each}
                            </div>

                            <!-- Total -->
                            <div class="w-28 shrink-0">
                                <p class="font-bold text-gray-800">
                                    ${(Number(pedido.total) || 0).toLocaleString("es-CO")}
                                </p>
                            </div>

                            <!-- Estado + cambiar -->
                            <div class="flex items-center gap-2">
                                <span class={`rounded-full px-2.5 py-1 text-xs font-semibold ${estadoColor(pedido.estado)}`}>
                                    {pedido.estado}
                                </span>
                                {#if pedido.estado !== "Cancelado" && pedido.estado !== "Entregado"}
                                    <select
                                        class="rounded-2xl border border-gray-200 px-2 py-1.5 text-xs"
                                        value=""
                                        onchange={(e) => {
                                            if (e.target.value) {
                                                changeStatus(pedido, e.target.value, e.target);
                                            }
                                        }}
                                    >
                                        <option value="">Cambiar</option>
                                        <option value="Preparando">Preparando</option>
                                        <option value="Empacado">Empacado</option>
                                        <option value="A domicilio">A domicilio</option>
                                        <option value="Entregado">Entregado</option>
                                    </select>
                                {/if}
                            </div>

                            <!-- Acciones -->
                            <div class="flex items-center gap-2 shrink-0">
                                <button
                                    type="button"
                                    onclick={() => toggleExpand(pedido.id)}
                                    class="flex h-8 w-8 items-center justify-center rounded-full bg-[#FFE28A]/60 text-sm text-gray-700 transition hover:scale-105"
                                    title="Ver detalle"
                                >
                                    <i class={expandedPedido === pedido.id ? "fa-solid fa-chevron-up" : "fa-solid fa-chevron-down"}></i>
                                </button>
                                {#if pedido.estado !== "Cancelado"}
                                    <button
                                        type="button"
                                        onclick={() => openEdit(pedido)}
                                        class="flex h-8 w-8 items-center justify-center rounded-full bg-[#CDB9FE] text-sm text-gray-800 transition hover:scale-105"
                                        title="Editar pedido"
                                    >
                                        <i class="fa-solid fa-pencil"></i>
                                    </button>
                                    <button
                                        type="button"
                                        onclick={() => openDelete(pedido)}
                                        class="flex h-8 w-8 items-center justify-center rounded-full text-red-700 transition hover:scale-105"
                                        title="Cancelar pedido"
                                    >
                                        <i class="fa-solid fa-ban"></i>
                                    </button>
                                {/if}
                            </div>
                        </div>

                        <!-- Detalle expandido -->
                        {#if expandedPedido === pedido.id}
                            <div class="border-t border-gray-100 bg-gray-50/60 px-5 py-4 space-y-4">
                                <!-- Info cliente -->
                                {#if cliente}
                                    <div>
                                        <h4 class="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">
                                            Información del cliente
                                        </h4>
                                        <div class="flex items-center gap-3">
                                            {#if cliente.photoURL}
                                                <img src={cliente.photoURL} alt={cliente.nombre} class="h-10 w-10 rounded-full object-cover" />
                                            {:else}
                                                <div class="flex h-10 w-10 items-center justify-center rounded-full bg-[#CDB9FE] text-gray-800">
                                                    <i class="fa-solid fa-user text-sm"></i>
                                                </div>
                                            {/if}
                                            <div>
                                                <p class="text-sm font-semibold text-gray-800">
                                                    {cliente.nombre || ""} {cliente.apellido || ""}
                                                </p>
                                                <p class="text-xs text-gray-500">{cliente.email || ""}</p>
                                                <p class="text-xs text-gray-500">{cliente.direccion || "Sin dirección"}</p>
                                                {#if cliente.sugerencias}
                                                    <p class="text-xs text-gray-400 italic">{cliente.sugerencias}</p>
                                                {/if}
                                            </div>
                                        </div>
                                    </div>
                                {/if}

                                <!-- Notas -->
                                {#if pedido.notas}
                                    <div>
                                        <h4 class="mb-1 text-xs font-bold uppercase tracking-wide text-gray-500">Notas</h4>
                                        <p class="rounded-2xl bg-[#FFE28A]/40 px-3 py-2 text-sm text-gray-700 italic">
                                            "{pedido.notas}"
                                        </p>
                                    </div>
                                {/if}

                                <!-- Foto de entrega -->
                                {#if pedido.fotoEntrega}
                                    <div>
                                        <h4 class="mb-1 text-xs font-bold uppercase tracking-wide text-gray-500">Comprobante de entrega</h4>
                                        <a href={pedido.fotoEntrega} target="_blank" rel="noopener noreferrer">
                                            <img src={pedido.fotoEntrega} alt="Foto de entrega" class="mt-2 h-32 w-32 rounded-2xl object-cover shadow-sm transition hover:scale-105" />
                                        </a>
                                    </div>
                                {/if}

                                <!-- Historial de estados -->
                                <div>
                                    <h4 class="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">
                                        Historial de estados
                                    </h4>
                                    <div class="space-y-1.5">
                                        {#each (pedido.history || []) as event}
                                            <div class="flex items-center gap-3 text-sm">
                                                <div class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#CDB9FE]/30 text-xs">
                                                    <i class="fa-solid fa-circle-dot text-[#7c4dff]"></i>
                                                </div>
                                                <span class={`rounded-full px-2 py-0.5 text-xs font-semibold ${estadoColor(event.to)}`}>
                                                    {event.to}
                                                </span>
                                                <span class="text-xs text-gray-400">
                                                    {new Date(event.at).toLocaleString("es-CO", {
                                                        day: "2-digit",
                                                        month: "short",
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}
                                                </span>
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

<!-- FAB -->
{#if !showForm}
    <div class="pointer-events-none fixed right-0 bottom-18 left-0 z-40 lg:bottom-6">
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

<ConfirmEntrega
    bind:open={showConfirmEntrega}
    pedido={pedidoToConfirm}
    onConfirm={handleConfirmEntrega}
    onCancel={() => {
        pedidoToConfirm = null;
    }}
/>
