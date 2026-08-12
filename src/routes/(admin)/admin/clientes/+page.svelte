<script>
    import { onMount } from "svelte";
    import FormCliente from "./components/FormCliente.svelte";
    import { watchCollection, saveDocument, updateDocument } from "$lib/firestore.js";

    let showForm = $state(false);
    let editingCliente = $state(null);
    let clienteDetalle = $state(null);

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
        unsubClientes = watchCollection("clientes", (data) => {
            clientes = data;
            loading = false;
        }, "createdAt");
        unsubPedidos = watchCollection("pedidos", (data) => {
            pedidos = data;
        }, "fecha");

        return () => {
            unsubClientes?.();
            unsubPedidos?.();
        };
    });

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
        return lista.filter((item) => item[campo] && new Date(item[campo]) >= corte);
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
                    (`${c.nombre || ""} ${c.apellido || ""}`).toLowerCase().includes(q) ||
                    (c.email || "").toLowerCase().includes(q) ||
                    (c.direccion || "").toLowerCase().includes(q),
            );
        }

        if (ordenPedidos === "mayor") {
            lista = [...lista].sort(
                (a, b) => getPedidosDeCliente(b.id).length - getPedidosDeCliente(a.id).length,
            );
        } else if (ordenPedidos === "menor") {
            lista = [...lista].sort(
                (a, b) => getPedidosDeCliente(a.id).length - getPedidosDeCliente(b.id).length,
            );
        }

        return lista;
    });

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
            if (clienteDetalle?.id === cliente.id) clienteDetalle = null;
        } catch (err) {
            console.error("Error suspendiendo cliente:", err);
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
    <header class="rounded-3xl bg-white p-4 shadow-sm sm:p-6">
        <p class="text-sm font-semibold uppercase tracking-[0.2em] text-[#CDB9FE]">Clientes</p>
        <h1 class="mt-2 text-2xl font-bold text-gray-800">Gestión de clientes</h1>
        <p class="mt-2 text-sm text-gray-500">
            Consulta, edita y suspende clientes. Los clientes se registran automáticamente desde la app.
        </p>
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
    {#if loading}
        <p class="text-center text-gray-400">Cargando clientes...</p>
    {:else if clientesFiltrados.length === 0}
        <div class="rounded-3xl bg-white p-8 text-center shadow-sm">
            <i class="fa-solid fa-users text-4xl text-gray-300"></i>
            <p class="mt-3 text-gray-400">No hay clientes registrados aún.</p>
        </div>
    {:else}
        <div class="overflow-hidden rounded-3xl border border-[#CDB9FE]/30 bg-white shadow-sm">
            <div
                class="hidden bg-[#CDB9FE]/20 px-5 py-3 text-xs font-bold uppercase tracking-wide text-gray-600 lg:grid lg:grid-cols-[1.4fr_1.3fr_1.5fr_0.6fr_0.6fr_auto] lg:items-center lg:gap-4"
            >
                <span>Cliente</span>
                <span>Contacto</span>
                <span>Dirección</span>
                <span>Pedidos</span>
                <span>Estado</span>
                <span class="text-center">Acciones</span>
            </div>

            <div class="divide-y divide-[#CDB9FE]/20">
                {#each clientesFiltrados as cliente}
                    <article
                        class="bg-white p-4 transition hover:bg-[#CDB9FE]/5 sm:p-5 lg:grid lg:grid-cols-[1.4fr_1.3fr_1.5fr_0.6fr_0.6fr_auto] lg:items-center lg:gap-4"
                    >
                        <!-- Nombre + foto -->
                        <div class="flex items-center gap-3 min-w-0">
                            {#if cliente.photoURL}
                                <img
                                    src={cliente.photoURL}
                                    alt={cliente.nombre}
                                    class="h-10 w-10 rounded-full object-cover shrink-0"
                                />
                            {:else}
                                <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#CDB9FE] text-gray-800">
                                    <i class="fa-solid fa-user text-sm"></i>
                                </div>
                            {/if}
                            <div class="min-w-0">
                                <h3 class="truncate font-semibold text-gray-800">
                                    {cliente.nombre || ""} {cliente.apellido || ""}
                                </h3>
                                <p class="truncate text-sm text-gray-500">{cliente.email || ""}</p>
                            </div>
                        </div>

                        <!-- Teléfono -->
                        <div class="mt-3 lg:mt-0">
                            <p class="truncate text-sm text-gray-600">
                                <i class="fa-solid fa-phone mr-2 text-gray-400"></i>
                                {cliente.telefono || "Sin teléfono"}
                            </p>
                        </div>

                        <!-- Dirección -->
                        <div class="mt-2 lg:mt-0">
                            <p class="truncate text-sm text-gray-600" title={cliente.direccion}>
                                <i class="fa-solid fa-location-dot mr-2 text-gray-400"></i>
                                {cliente.direccion || "Sin dirección"}
                            </p>
                        </div>

                        <!-- Pedidos count -->
                        <div class="mt-2 lg:mt-0">
                            <span class="rounded-full bg-[#FFE28A]/60 px-2.5 py-1 text-xs font-semibold text-gray-700">
                                {getPedidosDeCliente(cliente.id).length}
                            </span>
                        </div>

                        <!-- Estado -->
                        <div class="hidden lg:block">
                            <span class={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${estadoColor(cliente.estado)}`}>
                                {cliente.estado}
                            </span>
                        </div>

                        <!-- Acciones -->
                        <div class="mt-4 flex items-center justify-end gap-2 border-t border-gray-100 pt-3 lg:mt-0 lg:border-0 lg:pt-0">
                            <button
                                type="button"
                                onclick={() => (clienteDetalle = clienteDetalle?.id === cliente.id ? null : cliente)}
                                class="flex h-9 w-9 items-center justify-center rounded-full bg-[#FFFB96] text-sm text-gray-800 transition hover:scale-105"
                                title="Ver detalle"
                            >
                                <i class="fa-solid fa-eye"></i>
                            </button>
                            <button
                                type="button"
                                onclick={() => openEdit(cliente)}
                                class="flex h-9 w-9 items-center justify-center rounded-full bg-[#CDB9FE] text-sm text-gray-800 transition hover:scale-105"
                                title="Editar cliente"
                            >
                                <i class="fa-solid fa-pencil"></i>
                            </button>
                            {#if cliente.estado === "suspendido"}
                                <button
                                    type="button"
                                    onclick={() => reactivarCliente(cliente)}
                                    class="flex h-9 w-9 items-center justify-center rounded-full bg-green-100 text-sm text-green-700 transition hover:scale-105"
                                    title="Reactivar cliente"
                                >
                                    <i class="fa-solid fa-check"></i>
                                </button>
                            {:else}
                                <button
                                    type="button"
                                    onclick={() => suspenderCliente(cliente)}
                                    class="flex h-9 w-9 items-center justify-center rounded-full text-red-700 transition hover:scale-105"
                                    title="Suspender cliente"
                                >
                                    <i class="fa-solid fa-ban"></i>
                                </button>
                            {/if}
                        </div>
                    </article>

                    <!-- Detalle expandido -->
                    {#if clienteDetalle?.id === cliente.id}
                        <div class="border-t border-[#CDB9FE]/20 bg-[#FFFB96]/20 px-5 py-4">
                            <h4 class="mb-3 text-sm font-bold text-gray-700">Historial de pedidos</h4>
                            {#if getPedidosDeCliente(cliente.id).length === 0}
                                <p class="text-sm text-gray-400">Sin pedidos aún.</p>
                            {:else}
                                <div class="space-y-2">
                                    {#each getPedidosDeCliente(cliente.id) as pedido}
                                        <div class="flex items-center justify-between rounded-2xl bg-white px-4 py-2">
                                            <div>
                                                <p class="text-sm font-semibold text-gray-800">
                                                    Pedido #{pedido.numero ?? pedido.id}
                                                </p>
                                                <p class="text-xs text-gray-500">
                                                    {new Date(pedido.fecha).toLocaleDateString("es-CO")} ·
                                                    {pedido.metodoPago === "transferencia" ? "Transferencia" : "Contra entrega"}
                                                </p>
                                            </div>
                                            <div class="flex items-center gap-2">
                                                <span class="text-sm font-bold text-gray-700">
                                                    ${(Number(pedido.total) || 0).toLocaleString("es-CO")}
                                                </span>
                                                <span class={`rounded-full px-2 py-0.5 text-xs font-semibold ${estadoPedidoColor(pedido.estado)}`}>
                                                    {pedido.estado}
                                                </span>
                                            </div>
                                        </div>
                                    {/each}
                                </div>
                            {/if}

                            {#if cliente.changeLog && cliente.changeLog.length > 0}
                                <h4 class="mb-2 mt-4 text-sm font-bold text-gray-700">Historial de cambios</h4>
                                <div class="space-y-1">
                                    {#each cliente.changeLog as log}
                                        <p class="text-xs text-gray-500">
                                            {new Date(log.at).toLocaleString("es-CO")} ·
                                            {Object.keys(log.cambios || {}).join(", ")}
                                        </p>
                                    {/each}
                                </div>
                            {/if}
                        </div>
                    {/if}
                {/each}
            </div>
        </div>
    {/if}
</div>

<!-- Botón agregar (solo admin puede crear clientes manualmente) -->
{#if !showForm}
    <div class="pointer-events-none fixed right-0 bottom-18 left-0 z-40 lg:bottom-6">
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
