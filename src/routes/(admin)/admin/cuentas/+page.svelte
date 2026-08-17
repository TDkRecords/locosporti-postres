<script>
    import { onMount } from "svelte";
    import {
        watchCollection,
        saveEgreso,
        softDeleteEgreso,
        updateDocument,
    } from "$lib/firestore.js";

    let seccion = $state("ganancias");

    let pedidos = $state([]);
    let egresos = $state([]);
    let clientes = $state([]);
    let loading = $state(true);

    // Filtros ganancias
    let filtroFechaGanancias = $state("1D");
    let busquedaGanancias = $state("");
    let ordenGanancias = $state("");

    // Filtros egresos
    let filtroFechaEgresos = $state("1D");
    let busquedaEgresos = $state("");
    let ordenMontoEgresos = $state("");

    // Form egresos
    let formEgreso = $state({
        detalle: "",
        monto: "",
        fecha: new Date().toISOString().slice(0, 10),
    });
    let editingEgreso = $state(null);
    let loadingEgreso = $state(false);

    let unsubPedidos, unsubEgresos, unsubClientes;

    onMount(() => {
        unsubPedidos = watchCollection(
            "pedidos",
            (data) => {
                pedidos = data;
                loading = false;
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
        unsubClientes = watchCollection(
            "clientes",
            (data) => {
                clientes = data;
            },
            "createdAt",
        );

        return () => {
            unsubPedidos?.();
            unsubEgresos?.();
            unsubClientes?.();
        };
    });

    function getNombreCliente(clienteId) {
        const c = clientes.find(
            (x) => x.id === clienteId || x.uid === clienteId,
        );
        if (!c) return "Cliente";
        return (
            `${c.nombre || ""} ${c.apellido || ""}`.trim() ||
            c.email ||
            "Cliente"
        );
    }

    function filtrarPorFecha(lista, campo = "fecha", rango = "1D") {
        if (rango === "ALL") return lista;
        const now = new Date();
        const corte = new Date();
        if (rango === "1D") corte.setDate(now.getDate() - 1);
        else if (rango === "7D") corte.setDate(now.getDate() - 7);
        else if (rango === "30D") corte.setDate(now.getDate() - 30);
        else if (rango === "12M") corte.setMonth(now.getMonth() - 12);
        return lista.filter(
            (item) => item[campo] && new Date(item[campo]) >= corte,
        );
    }

    // ── Ganancias ──────────────────────────────────────────────────────────────
    let gananciasTransferencia = $derived(
        pedidos.filter(
            (p) => p.metodoPago === "transferencia" && p.estado !== "Cancelado",
        ),
    );

    let gananciasContraEntrega = $derived(
        pedidos.filter(
            (p) =>
                p.metodoPago === "contra_entrega" && p.estado === "Entregado",
        ),
    );

    let gananciasFiltradas = $derived.by(() => {
        let lista = [...gananciasTransferencia, ...gananciasContraEntrega];
        lista = filtrarPorFecha(lista, "fecha", filtroFechaGanancias);
        if (busquedaGanancias) {
            lista = lista.filter((p) =>
                getNombreCliente(p.clienteId)
                    .toLowerCase()
                    .includes(busquedaGanancias.toLowerCase()),
            );
        }
        if (ordenGanancias === "mayor")
            lista = [...lista].sort((a, b) => b.total - a.total);
        else if (ordenGanancias === "menor")
            lista = [...lista].sort((a, b) => a.total - b.total);
        return lista;
    });

    let totalTransferencia = $derived(
        gananciasTransferencia.reduce((s, p) => s + (Number(p.total) || 0), 0),
    );
    let totalContraEntrega = $derived(
        gananciasContraEntrega.reduce((s, p) => s + (Number(p.total) || 0), 0),
    );
    let totalGanancias = $derived(totalTransferencia + totalContraEntrega);

    // ── Egresos ────────────────────────────────────────────────────────────────
    let egresosFiltrados = $derived.by(() => {
        let lista = filtrarPorFecha(egresos, "fecha", filtroFechaEgresos);
        if (busquedaEgresos) {
            lista = lista.filter(
                (e) =>
                    (e.detalle || "")
                        .toLowerCase()
                        .includes(busquedaEgresos.toLowerCase()) ||
                    String(e.monto).includes(busquedaEgresos),
            );
        }
        if (ordenMontoEgresos === "mayor")
            lista = [...lista].sort((a, b) => b.monto - a.monto);
        else if (ordenMontoEgresos === "menor")
            lista = [...lista].sort((a, b) => a.monto - b.monto);
        return lista;
    });

    let totalEgresos = $derived(
        egresos
            .filter((e) => !e.eliminado)
            .reduce((s, e) => s + (Number(e.monto) || 0), 0),
    );
    let balanceGeneral = $derived(totalGanancias - totalEgresos);

    // ── Resumen mensual/anual ─────────────────────────────────────────────────
    function getMonthRange(offsetMonths = 0) {
        const now = new Date();
        const start = new Date(
            now.getFullYear(),
            now.getMonth() - offsetMonths,
            1,
        );
        const end = new Date(
            now.getFullYear(),
            now.getMonth() - offsetMonths + 1,
            0,
            23,
            59,
            59,
        );
        return { start, end };
    }

    function getYearRange(year) {
        return {
            start: new Date(year, 0, 1),
            end: new Date(year, 11, 31, 23, 59, 59),
        };
    }

    function sumGananciasRange(start, end) {
        return [...gananciasTransferencia, ...gananciasContraEntrega]
            .filter((p) => {
                const d = new Date(p.fecha);
                return d >= start && d <= end;
            })
            .reduce((s, p) => s + (Number(p.total) || 0), 0);
    }

    function sumEgresosRange(start, end) {
        return egresos
            .filter((e) => !e.eliminado && e.fecha)
            .filter((e) => {
                const d = new Date(e.fecha);
                return d >= start && d <= end;
            })
            .reduce((s, e) => s + (Number(e.monto) || 0), 0);
    }

    let balanceMesActual = $derived(() => {
        const { start, end } = getMonthRange(0);
        return sumGananciasRange(start, end) - sumEgresosRange(start, end);
    });

    let balanceAnioActual = $derived(() => {
        const year = new Date().getFullYear();
        const { start, end } = getYearRange(year);
        return sumGananciasRange(start, end) - sumEgresosRange(start, end);
    });

    // Años disponibles para historial
    let aniosDisponibles = $derived(() => {
        const set = new Set();
        [...pedidos, ...egresos].forEach((item) => {
            if (item.fecha) set.add(new Date(item.fecha).getFullYear());
        });
        return [...set].sort((a, b) => b - a);
    });

    // ── Form Egresos ──────────────────────────────────────────────────────────
    function openEditEgreso(egreso) {
        editingEgreso = egreso;
        formEgreso = {
            detalle: egreso.detalle || "",
            monto: String(egreso.monto || ""),
            fecha: (egreso.fecha || "").slice(0, 10),
        };
    }

    function resetFormEgreso() {
        formEgreso = {
            detalle: "",
            monto: "",
            fecha: new Date().toISOString().slice(0, 10),
        };
        editingEgreso = null;
    }

    async function handleGuardarEgreso(event) {
        event.preventDefault();
        if (!formEgreso.detalle || !formEgreso.monto) return;
        loadingEgreso = true;
        try {
            if (editingEgreso) {
                await updateDocument("egresos", editingEgreso.id, {
                    detalle: formEgreso.detalle,
                    monto: Number(formEgreso.monto),
                    fecha: formEgreso.fecha
                        ? new Date(formEgreso.fecha).toISOString()
                        : editingEgreso.fecha,
                });
            } else {
                await saveEgreso({
                    detalle: formEgreso.detalle,
                    monto: Number(formEgreso.monto),
                    fecha: formEgreso.fecha
                        ? new Date(formEgreso.fecha).toISOString()
                        : new Date().toISOString(),
                });
            }
            resetFormEgreso();
        } catch (err) {
            console.error("Error guardando egreso:", err);
        } finally {
            loadingEgreso = false;
        }
    }

    async function handleSoftDeleteEgreso(id) {
        await softDeleteEgreso(id);
    }

    async function handleRestoreEgreso(id) {
        await updateDocument("egresos", id, { eliminado: false });
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
                        <i class="fa-solid fa-wallet text-xl"></i>
                    </div>

                    <div class="min-w-0">
                        <p class="text-sm font-medium text-[#7C3AED]">
                            Cuentas
                        </p>

                        <h1
                            class="mt-0.5 text-2xl font-bold text-gray-900 sm:text-3xl"
                        >
                            Finanzas del negocio
                        </h1>

                        <p class="mt-1 text-sm text-gray-500">
                            Ganancias, egresos y resumen de balance general,
                            mensual y anual.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </header>

    <!-- Tabs -->
    <div class="flex flex-wrap gap-2">
        {#each [{ id: "ganancias", label: "Ganancias" }, { id: "egresos", label: "Egresos" }, { id: "resumen", label: "Resumen" }] as tab}
            <button
                type="button"
                onclick={() => (seccion = tab.id)}
                class="rounded-2xl px-4 py-2 text-sm font-semibold transition shadow-sm"
                class:bg-[#CDB9FE]={seccion === tab.id}
                class:text-gray-900={seccion === tab.id}
                class:bg-white={seccion !== tab.id}
                class:text-gray-600={seccion !== tab.id}
            >
                {tab.label}
            </button>
        {/each}
    </div>

    <!-- GANANCIAS -->
    {#if seccion === "ganancias"}
        <section class="space-y-4">
            <div class="grid gap-4 md:grid-cols-3">
                <div class="rounded-3xl bg-white p-4 shadow-sm">
                    <p class="text-sm text-gray-500">Transferencia</p>
                    <p class="mt-2 text-xl font-bold text-gray-800">
                        ${totalTransferencia.toLocaleString("es-CO")}
                    </p>
                </div>
                <div class="rounded-3xl bg-white p-4 shadow-sm">
                    <p class="text-sm text-gray-500">
                        Contra entrega (pagados)
                    </p>
                    <p class="mt-2 text-xl font-bold text-gray-800">
                        ${totalContraEntrega.toLocaleString("es-CO")}
                    </p>
                </div>
                <div class="rounded-3xl bg-white p-4 shadow-sm">
                    <p class="text-sm text-gray-500">Total ganancias</p>
                    <p class="mt-2 text-xl font-bold text-green-600">
                        ${totalGanancias.toLocaleString("es-CO")}
                    </p>
                </div>
            </div>

            <div class="rounded-3xl bg-white p-4 shadow-sm sm:p-6">
                <div class="mb-4 flex flex-col gap-3 sm:flex-row">
                    <input
                        bind:value={busquedaGanancias}
                        type="text"
                        placeholder="Buscar cliente"
                        class="rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-[#CDB9FE] sm:flex-1"
                    />
                    <select
                        bind:value={filtroFechaGanancias}
                        class="rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-[#CDB9FE]"
                    >
                        <option value="1D">1D</option>
                        <option value="7D">7D</option>
                        <option value="30D">30D</option>
                        <option value="12M">12M</option>
                        <option value="ALL">ALL</option>
                    </select>
                    <select
                        bind:value={ordenGanancias}
                        class="rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-[#CDB9FE]"
                    >
                        <option value="">Orden</option>
                        <option value="mayor">Mayor monto</option>
                        <option value="menor">Menor monto</option>
                    </select>
                </div>
                <div class="space-y-3">
                    {#each gananciasFiltradas as p}
                        <div
                            class="flex items-center justify-between rounded-2xl bg-[#FFFB96]/50 px-4 py-3"
                        >
                            <div>
                                <p class="font-semibold text-gray-800">
                                    {getNombreCliente(p.clienteId)}
                                </p>
                                <p class="text-sm text-gray-500">
                                    Pedido #{p.numero ?? p.id} ·
                                    {p.metodoPago === "transferencia"
                                        ? "Transferencia"
                                        : "Contra entrega"}
                                </p>
                            </div>
                            <span class="font-bold text-green-700">
                                +${(Number(p.total) || 0).toLocaleString(
                                    "es-CO",
                                )}
                            </span>
                        </div>
                    {:else}
                        <p class="text-sm text-gray-400">
                            No hay ganancias en el período seleccionado.
                        </p>
                    {/each}
                </div>
            </div>
        </section>

        <!-- EGRESOS -->
    {:else if seccion === "egresos"}
        <section class="space-y-4">
            <!-- Form -->
            <div class="rounded-3xl bg-white p-4 shadow-sm sm:p-6">
                <h2 class="text-lg font-bold text-gray-800">
                    {editingEgreso ? "Editar gasto" : "Registrar gasto"}
                </h2>
                <form
                    onsubmit={handleGuardarEgreso}
                    class="mt-4 grid gap-3 sm:grid-cols-4"
                >
                    <input
                        bind:value={formEgreso.detalle}
                        type="text"
                        placeholder="Detalle"
                        class="rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-[#CDB9FE] sm:col-span-2"
                    />
                    <input
                        bind:value={formEgreso.monto}
                        type="number"
                        placeholder="Monto"
                        class="rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-[#CDB9FE]"
                    />
                    <input
                        bind:value={formEgreso.fecha}
                        type="date"
                        class="rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-[#CDB9FE]"
                    />
                    <div class="flex gap-2 sm:col-span-4">
                        <button
                            type="submit"
                            disabled={loadingEgreso}
                            class="flex-1 rounded-2xl bg-[#CDB9FE] px-4 py-3 font-semibold text-gray-900 transition hover:bg-[#bfa3fd] disabled:opacity-70"
                        >
                            {loadingEgreso
                                ? "Guardando..."
                                : editingEgreso
                                  ? "Actualizar"
                                  : "Guardar gasto"}
                        </button>
                        {#if editingEgreso}
                            <button
                                type="button"
                                onclick={resetFormEgreso}
                                class="rounded-2xl border border-gray-200 px-4 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                        {/if}
                    </div>
                </form>
            </div>

            <!-- Filters + List -->
            <div class="rounded-3xl bg-white p-4 shadow-sm sm:p-6">
                <h2 class="text-lg font-bold text-gray-800">
                    Listado de egresos
                </h2>
                <div class="mt-3 flex flex-col gap-3 sm:flex-row">
                    <input
                        bind:value={busquedaEgresos}
                        type="text"
                        placeholder="Buscar detalle o monto"
                        class="rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-[#CDB9FE] sm:flex-1"
                    />
                    <select
                        bind:value={filtroFechaEgresos}
                        class="rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-[#CDB9FE]"
                    >
                        <option value="1D">1D</option>
                        <option value="7D">7D</option>
                        <option value="30D">30D</option>
                        <option value="12M">12M</option>
                        <option value="ALL">ALL</option>
                    </select>
                    <select
                        bind:value={ordenMontoEgresos}
                        class="rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-[#CDB9FE]"
                    >
                        <option value="">Monto</option>
                        <option value="mayor">Mayor</option>
                        <option value="menor">Menor</option>
                    </select>
                </div>

                <div class="mt-4 space-y-3">
                    {#each egresosFiltrados as egreso}
                        <div
                            class="flex items-center justify-between rounded-2xl px-4 py-3 {egreso.eliminado
                                ? 'bg-gray-100 opacity-60'
                                : 'bg-[#FFCDDB]/40'}"
                        >
                            <div>
                                <p class="font-semibold text-gray-800">
                                    {egreso.detalle}
                                </p>
                                <p class="text-sm text-gray-500">
                                    {new Date(egreso.fecha).toLocaleDateString(
                                        "es-CO",
                                    )}
                                </p>
                            </div>
                            <div class="flex items-center gap-3">
                                <span class="font-bold text-red-600">
                                    -${(
                                        Number(egreso.monto) || 0
                                    ).toLocaleString("es-CO")}
                                </span>
                                {#if !egreso.eliminado}
                                    <button
                                        type="button"
                                        onclick={() => openEditEgreso(egreso)}
                                        class="flex h-8 w-8 items-center justify-center rounded-full bg-[#CDB9FE] text-sm text-gray-800 transition hover:scale-105"
                                        title="Editar gasto"
                                    >
                                        <i class="fa-solid fa-pencil"></i>
                                    </button>
                                    <button
                                        type="button"
                                        onclick={() =>
                                            handleSoftDeleteEgreso(egreso.id)}
                                        class="flex h-8 w-8 items-center justify-center rounded-full text-red-700 transition hover:scale-105"
                                        title="Eliminar gasto"
                                    >
                                        <i class="fa-solid fa-trash"></i>
                                    </button>
                                {:else}
                                    <span
                                        class="text-xs font-semibold text-gray-500"
                                        >Eliminado</span
                                    >
                                    <button
                                        type="button"
                                        onclick={() =>
                                            handleRestoreEgreso(egreso.id)}
                                        class="rounded-xl bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 transition hover:bg-gray-300"
                                    >
                                        Restaurar
                                    </button>
                                {/if}
                            </div>
                        </div>
                    {:else}
                        <p class="text-sm text-gray-400">
                            No hay egresos en el período seleccionado.
                        </p>
                    {/each}
                </div>
            </div>
        </section>

        <!-- RESUMEN -->
    {:else}
        <section class="space-y-4">
            <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div class="rounded-3xl bg-white p-4 shadow-sm">
                    <p class="text-sm text-gray-500">Balance general</p>
                    <p
                        class={`mt-2 text-2xl font-bold ${balanceGeneral >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                        ${balanceGeneral.toLocaleString("es-CO")}
                    </p>
                </div>
                <div class="rounded-3xl bg-white p-4 shadow-sm">
                    <p class="text-sm text-gray-500">Balance mensual</p>
                    <p
                        class={`mt-2 text-2xl font-bold ${balanceMesActual() >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                        ${balanceMesActual().toLocaleString("es-CO")}
                    </p>
                </div>
                <div class="rounded-3xl bg-white p-4 shadow-sm">
                    <p class="text-sm text-gray-500">Balance anual</p>
                    <p
                        class={`mt-2 text-2xl font-bold ${balanceAnioActual() >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                        ${balanceAnioActual().toLocaleString("es-CO")}
                    </p>
                </div>
                <div class="rounded-3xl bg-white p-4 shadow-sm">
                    <p class="text-sm text-gray-500">Ingresos vs Egresos</p>
                    <p class="mt-2 text-sm text-gray-600">
                        ${totalGanancias.toLocaleString("es-CO")} − ${totalEgresos.toLocaleString(
                            "es-CO",
                        )}
                    </p>
                </div>
            </div>

            <!-- Historial por año -->
            {#if aniosDisponibles().length > 1}
                <div class="rounded-3xl bg-white p-4 shadow-sm sm:p-6">
                    <h2 class="text-lg font-bold text-gray-800">
                        Historial anual
                    </h2>
                    <div class="mt-4 space-y-3">
                        {#each aniosDisponibles() as year}
                            {#if year !== new Date().getFullYear()}
                                {@const { start, end } = getYearRange(year)}
                                {@const g = sumGananciasRange(start, end)}
                                {@const e = sumEgresosRange(start, end)}
                                {@const b = g - e}
                                <div
                                    class="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3"
                                >
                                    <p class="font-semibold text-gray-800">
                                        {year}
                                    </p>
                                    <p
                                        class={`font-bold ${b >= 0 ? "text-green-600" : "text-red-600"}`}
                                    >
                                        ${b.toLocaleString("es-CO")}
                                    </p>
                                </div>
                            {/if}
                        {/each}
                    </div>
                </div>
            {/if}
        </section>
    {/if}
</div>
