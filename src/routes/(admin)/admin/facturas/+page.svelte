<script>
    import { onMount } from "svelte";
    import { watchCollection, aprobarFactura, cancelarFactura } from "$lib/firestore.js";

    let facturas = $state([]);
    let clientes = $state([]);
    let loading = $state(true);

    let filtroEstado = $state("");
    let filtroFecha = $state("1D");
    let busqueda = $state("");
    let ordenMonto = $state("");

    let unsubFacturas, unsubClientes;

    onMount(() => {
        unsubFacturas = watchCollection("facturas", (data) => {
            facturas = data;
            loading = false;
        }, "fecha");
        unsubClientes = watchCollection("clientes", (data) => {
            clientes = data;
        }, "createdAt");

        return () => {
            unsubFacturas?.();
            unsubClientes?.();
        };
    });

    function getNombreCliente(clienteId) {
        const c = clientes.find((x) => x.id === clienteId || x.uid === clienteId);
        if (!c) return "Cliente";
        return `${c.nombre || ""} ${c.apellido || ""}`.trim() || c.email || "Cliente";
    }

    function filtrarPorFecha(lista, campo = "fecha", rango = "1D") {
        if (rango === "ALL") return lista;
        const corte = new Date();
        if (rango === "1D") corte.setDate(corte.getDate() - 1);
        else if (rango === "7D") corte.setDate(corte.getDate() - 7);
        else if (rango === "30D") corte.setDate(corte.getDate() - 30);
        else if (rango === "12M") corte.setMonth(corte.getMonth() - 12);
        return lista.filter((item) => item[campo] && new Date(item[campo]) >= corte);
    }

    let facturasFiltradas = $derived.by(() => {
        let lista = filtrarPorFecha(facturas, "fecha", filtroFecha);

        lista = lista.filter((f) => {
            const nombreCliente = getNombreCliente(f.clienteId);
            const coincideBusqueda =
                nombreCliente.toLowerCase().includes(busqueda.toLowerCase()) ||
                (f.items || []).some((it) =>
                    (it.nombre || it.productId || "")
                        .toLowerCase()
                        .includes(busqueda.toLowerCase()),
                );
            const coincideEstado = !filtroEstado || f.estado === filtroEstado;
            return coincideBusqueda && coincideEstado;
        });

        if (ordenMonto === "mayor") lista = [...lista].sort((a, b) => b.monto - a.monto);
        else if (ordenMonto === "menor") lista = [...lista].sort((a, b) => a.monto - b.monto);

        return lista;
    });

    let aprobadas = $derived(facturas.filter((f) => f.estado === "aprobada").length);
    let pendientes = $derived(
        facturas.filter((f) => f.estado === "pendiente" || f.estado === "pendiente_pago").length,
    );
    let canceladas = $derived(facturas.filter((f) => f.estado === "cancelada").length);

    async function handleAprobar(id) {
        try {
            await aprobarFactura(id);
        } catch (err) {
            console.error("Error aprobando factura:", err);
        }
    }

    async function handleCancelar(id) {
        try {
            await cancelarFactura(id);
        } catch (err) {
            console.error("Error cancelando factura:", err);
        }
    }

    function estadoLabel(estado) {
        switch (estado) {
            case "aprobada": return "Aprobada";
            case "pendiente": return "Pendiente";
            case "pendiente_pago": return "Pendiente de pago";
            case "cancelada": return "Cancelada";
            default: return estado;
        }
    }

    function estadoColor(estado) {
        if (estado === "aprobada") return "bg-green-100 text-green-700";
        if (estado === "cancelada") return "bg-red-100 text-red-700";
        return "bg-amber-100 text-amber-700";
    }
</script>

<div class="space-y-6 p-4 sm:p-6">
    <header class="rounded-3xl bg-white p-4 shadow-sm sm:p-6">
        <p class="text-sm font-semibold uppercase tracking-[0.2em] text-[#CDB9FE]">Facturas</p>
        <h1 class="mt-2 text-2xl font-bold text-gray-800">Gestión de facturas</h1>
        <p class="mt-2 text-sm text-gray-500">
            Aprueba facturas pendientes, consulta el historial y gestiona cancelaciones.
            Las facturas por transferencia se aprueban automáticamente al crear el pedido.
        </p>
    </header>

    <section class="grid gap-4 sm:grid-cols-3">
        <div class="rounded-3xl bg-white p-4 shadow-sm">
            <p class="text-sm text-gray-500">Aprobadas</p>
            <p class="mt-2 text-2xl font-bold text-green-600">{aprobadas}</p>
        </div>
        <div class="rounded-3xl bg-white p-4 shadow-sm">
            <p class="text-sm text-gray-500">Por aprobar</p>
            <p class="mt-2 text-2xl font-bold text-amber-600">{pendientes}</p>
        </div>
        <div class="rounded-3xl bg-white p-4 shadow-sm">
            <p class="text-sm text-gray-500">Canceladas</p>
            <p class="mt-2 text-2xl font-bold text-red-600">{canceladas}</p>
        </div>
    </section>

    <section class="rounded-3xl bg-white p-4 shadow-sm sm:p-6">
        <!-- Filtros -->
        <div class="flex flex-col gap-4 lg:flex-row lg:items-end">
            <input
                type="text"
                bind:value={busqueda}
                placeholder="Buscar cliente o producto"
                class="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-[#CDB9FE] lg:flex-1"
            />
            <select
                bind:value={filtroEstado}
                class="rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-[#CDB9FE]"
            >
                <option value="">Todas</option>
                <option value="aprobada">Aprobadas</option>
                <option value="pendiente">Pendientes</option>
                <option value="pendiente_pago">Pendiente de pago</option>
                <option value="cancelada">Canceladas</option>
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
                bind:value={ordenMonto}
                class="rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-[#CDB9FE]"
            >
                <option value="">Monto</option>
                <option value="mayor">Mayor</option>
                <option value="menor">Menor</option>
            </select>
        </div>

        <!-- Lista -->
        {#if loading}
            <p class="mt-6 text-center text-gray-400">Cargando facturas...</p>
        {:else}
            <div class="mt-6 space-y-3">
                {#each facturasFiltradas as factura}
                    <article class="rounded-2xl border border-gray-100 px-4 py-4">
                        <div
                            class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                            <div class="min-w-0">
                                <p class="font-semibold text-gray-800">
                                    Factura #{factura.numero ?? factura.id}
                                </p>
                                <p class="text-sm text-gray-500">
                                    {getNombreCliente(factura.clienteId)} ·
                                    {new Date(factura.fecha).toLocaleDateString("es-CO")}
                                </p>
                                <p class="mt-1 text-xs uppercase tracking-[0.15em] text-gray-400">
                                    {factura.metodoPago === "transferencia"
                                        ? "Transferencia (auto-aprobada)"
                                        : "Contra entrega"}
                                </p>
                                {#if factura.notas}
                                    <p class="mt-1 text-sm text-gray-500 italic">"{factura.notas}"</p>
                                {/if}
                            </div>
                            <div class="flex flex-col items-start gap-2 sm:items-end">
                                <p class="text-lg font-bold text-gray-800">
                                    ${(Number(factura.monto) || 0).toLocaleString("es-CO")}
                                </p>
                                <span
                                    class={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${estadoColor(factura.estado)}`}
                                >
                                    {estadoLabel(factura.estado)}
                                </span>
                                {#if factura.estado === "pendiente" || factura.estado === "pendiente_pago"}
                                    <div class="flex gap-2">
                                        <button
                                            type="button"
                                            onclick={() => handleAprobar(factura.id)}
                                            class="rounded-xl bg-[#CDB9FE] px-3 py-1.5 text-xs font-semibold text-gray-900 transition hover:bg-[#bfa3fd]"
                                        >
                                            Marcar pagada
                                        </button>
                                        <button
                                            type="button"
                                            onclick={() => handleCancelar(factura.id)}
                                            class="rounded-xl bg-[#FFCDDB] px-3 py-1.5 text-xs font-semibold text-gray-900 transition hover:bg-[#ffb6c0]"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                {/if}
                            </div>
                        </div>
                    </article>
                {:else}
                    <div class="py-8 text-center text-gray-400">
                        <i class="fa-solid fa-file-invoice text-4xl"></i>
                        <p class="mt-3 text-sm">No hay facturas en el período seleccionado.</p>
                    </div>
                {/each}
            </div>
        {/if}
    </section>
</div>
