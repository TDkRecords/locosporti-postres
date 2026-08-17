<script>
    import { onMount } from "svelte";
    import ListCliente from "./components/ListCliente.svelte";
    import DetailCliente from "./components/DetailCliente.svelte";
    import FormCliente from "./components/FormCliente.svelte";
    import DeleteCliente from "./components/DeleteCliente.svelte";
    import {
        watchCollection,
        saveDocument,
        updateDocument,
    } from "$lib/firestore.js";

    let showForm = $state(false);
    let showSuspend = $state(false);
    let editingCliente = $state(null);
    let clienteToSuspend = $state(null);
    let selectedClienteId = $state(null); // ID del cliente abierto en el detalle

    let clientes = $state([]);
    let pedidos = $state([]);
    let loading = $state(true);

    // Filtros
    let busqueda = $state("");
    let filtroEstado = $state("todos");
    let filtroFecha = $state("ALL");
    let ordenPedidos = $state("");

    let unsubClientes, unsubPedidos;

    onMount(() => {
        unsubClientes = watchCollection(
            "clientes",
            (data) => {
                clientes = data;
                loading = false;
            },
            "createdAt",
        );
        unsubPedidos = watchCollection(
            "pedidos",
            (data) => {
                pedidos = data;
            },
            "fecha",
        );

        return () => {
            unsubClientes?.();
            unsubPedidos?.();
        };
    });

    // Cliente seleccionado, resuelto en vivo desde la lista de Firestore
    // (así el detalle refleja cambios de estado, edición, etc. al instante)
    let selectedCliente = $derived(
        clientes.find((c) => c.id === selectedClienteId) || null,
    );

    function getPedidosDeCliente(clienteId) {
        return pedidos.filter((p) => p.clienteId === clienteId);
    }

    function filtrarPorFecha(lista, campo = "createdAt", rango = "ALL") {
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

    let clientesFiltrados = $derived.by(() => {
        let lista = clientes.filter((c) => c.estado !== "eliminado");

        lista = filtrarPorFecha(lista, "createdAt", filtroFecha);

        if (filtroEstado !== "todos") {
            lista = lista.filter((c) => c.estado === filtroEstado);
        }

        if (busqueda) {
            const q = busqueda.toLowerCase();
            lista = lista.filter(
                (c) =>
                    `${c.nombre || ""} ${c.apellido || ""}`
                        .toLowerCase()
                        .includes(q) ||
                    (c.email || "").toLowerCase().includes(q) ||
                    (c.direccion || "").toLowerCase().includes(q),
            );
        }

        if (ordenPedidos === "mayor") {
            lista = [...lista].sort(
                (a, b) =>
                    getPedidosDeCliente(b.id).length -
                    getPedidosDeCliente(a.id).length,
            );
        } else if (ordenPedidos === "menor") {
            lista = [...lista].sort(
                (a, b) =>
                    getPedidosDeCliente(a.id).length -
                    getPedidosDeCliente(b.id).length,
            );
        }

        return lista;
    });

    // ── Detalle ───────────────────────────────────────────────────────────────
    function openDetail(cliente) {
        selectedClienteId = cliente.id;
    }

    function closeDetail() {
        selectedClienteId = null;
    }

    // ── Acciones ──────────────────────────────────────────────────────────────
    function openCreate() {
        editingCliente = null;
        showForm = true;
    }

    function openEdit(cliente) {
        editingCliente = cliente;
        showForm = true;
    }

    function closeForm() {
        showForm = false;
        editingCliente = null;
    }

    function openSuspend(cliente) {
        clienteToSuspend = cliente;
        showSuspend = true;
    }

    function closeSuspend() {
        showSuspend = false;
        clienteToSuspend = null;
    }

    async function guardarCliente(payload) {
        try {
            if (editingCliente) {
                await updateDocument("clientes", editingCliente.id, payload);
            } else {
                await saveDocument("clientes", {
                    ...payload,
                    estado: "activo",
                    createdAt: new Date().toISOString(),
                });
            }
        } catch (err) {
            console.error("Error guardando cliente:", err);
        } finally {
            closeForm();
        }
    }

    async function suspenderCliente(cliente) {
        try {
            await updateDocument("clientes", cliente.id, {
                estado: "suspendido",
                suspendidoAt: new Date().toISOString(),
            });
        } catch (err) {
            console.error("Error suspendiendo cliente:", err);
        } finally {
            closeSuspend();
        }
    }

    async function reactivarCliente(cliente) {
        try {
            await updateDocument("clientes", cliente.id, { estado: "activo" });
        } catch (err) {
            console.error("Error reactivando cliente:", err);
        }
    }

    function estadoColor(estado) {
        if (estado === "activo") return "bg-green-100 text-green-700";
        if (estado === "inactivo") return "bg-yellow-100 text-yellow-700";
        if (estado === "suspendido") return "bg-red-100 text-red-700";
        return "bg-gray-100 text-gray-700";
    }

    function estadoPedidoColor(estado) {
        if (estado === "Entregado") return "bg-green-100 text-green-700";
        if (estado === "Cancelado") return "bg-red-100 text-red-700";
        if (estado === "A domicilio") return "bg-purple-100 text-purple-700";
        if (estado === "Empacado") return "bg-yellow-100 text-yellow-700";
        return "bg-gray-100 text-gray-700";
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
                        <i class="fa-solid fa-users text-xl"></i>
                    </div>

                    <div class="min-w-0">
                        <p class="text-sm font-medium text-[#7C3AED]">
                            Clientes
                        </p>

                        <h1
                            class="mt-0.5 text-2xl font-bold text-gray-900 sm:text-3xl"
                        >
                            Gestión de clientes
                        </h1>

                        <p class="mt-1 text-sm text-gray-500">
                            Consulta, edita y suspende clientes. Los clientes se
                            registran automáticamente desde la app.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </header>

    <!-- Filtros -->
    <section class="rounded-3xl bg-white p-4 shadow-sm sm:p-6">
        <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <input
                bind:value={busqueda}
                type="text"
                placeholder="Buscar por nombre, correo o dirección"
                class="flex-1 rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-[#CDB9FE]"
            />
            <select
                bind:value={filtroEstado}
                class="rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-[#CDB9FE]"
            >
                <option value="todos">Todos</option>
                <option value="activo">Activos</option>
                <option value="inactivo">Inactivos</option>
                <option value="suspendido">Suspendidos</option>
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
            <select
                bind:value={ordenPedidos}
                class="rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-[#CDB9FE]"
            >
                <option value="">Ordenar por pedidos</option>
                <option value="mayor">Más pedidos primero</option>
                <option value="menor">Menos pedidos primero</option>
            </select>
        </div>
    </section>

    <!-- Lista -->
    <section class="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
        {#if loading}
            <p class="p-8 text-center text-gray-400">Cargando clientes...</p>
        {:else if clientesFiltrados.length === 0}
            <div class="p-8 text-center text-gray-400">
                <i class="fa-solid fa-users text-4xl"></i>
                <p class="mt-3 text-sm">No hay clientes registrados aún.</p>
            </div>
        {:else}
            <ListCliente
                clientes={clientesFiltrados}
                {getPedidosDeCliente}
                {estadoColor}
                onSelectCliente={openDetail}
            />
        {/if}
    </section>
</div>

<!-- Botón agregar (solo admin puede crear clientes manualmente) -->
{#if !showForm && !selectedCliente}
    <div
        class="pointer-events-none fixed right-0 bottom-18 left-0 z-40 lg:bottom-6"
    >
        <div class="container mx-auto flex justify-end px-4">
            <button
                title="Agregar cliente manualmente"
                type="button"
                onclick={openCreate}
                class="pointer-events-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#CDB9FE] text-2xl text-white shadow-xl transition-all duration-200 hover:scale-110 active:scale-95"
            >
                <i class="fa-solid fa-plus"></i>
            </button>
        </div>
    </div>
{/if}

<FormCliente
    bind:open={showForm}
    cliente={editingCliente}
    onSubmit={guardarCliente}
/>

<DeleteCliente
    bind:open={showSuspend}
    cliente={clienteToSuspend}
    onConfirm={suspenderCliente}
/>

<!-- Detail -->
{#if selectedCliente}
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
            <DetailCliente
                cliente={selectedCliente}
                pedidos={getPedidosDeCliente(selectedCliente.id)}
                {estadoColor}
                {estadoPedidoColor}
                onClose={closeDetail}
                onEdit={openEdit}
                onSuspend={openSuspend}
                onReactivate={reactivarCliente}
            />
        </div>
    </div>
{/if}
