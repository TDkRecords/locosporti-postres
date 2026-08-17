<script>
    import { onMount } from "svelte";
    import ListMeta from "./components/ListMeta.svelte";
    import DetailMeta from "./components/DetailMeta.svelte";
    import FormMeta from "./components/FormMeta.svelte";
    import ArchivarMeta from "./components/ArchivarMeta.svelte";
    import { watchCollection, saveMeta, eliminarMeta } from "$lib/firestore.js";

    let showForm = $state(false);
    let showArchivar = $state(false);
    let metaToArchivar = $state(null);
    let selectedMetaId = $state(null); // ID de la meta abierta en el detalle

    let clientes = $state([]);
    let metas = $state([]);
    let historialMetas = $state([]);
    let pedidos = $state([]);
    let loading = $state(true);

    let unsubClientes, unsubMetas, unsubHistorial, unsubPedidos;

    onMount(() => {
        unsubClientes = watchCollection(
            "clientes",
            (data) => {
                clientes = data.filter((c) => c.estado !== "eliminado");
                loading = false;
            },
            "createdAt",
        );

        unsubMetas = watchCollection(
            "metas",
            (data) => {
                metas = data;
            },
            "fecha",
        );

        unsubHistorial = watchCollection(
            "metas_historial",
            (data) => {
                historialMetas = data;
            },
            "archivedAt",
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
            unsubMetas?.();
            unsubHistorial?.();
            unsubPedidos?.();
        };
    });

    // Meta seleccionada, resuelta en vivo desde Firestore
    let selectedMeta = $derived(
        metas.find((m) => m.id === selectedMetaId) || null,
    );

    // Suma la cantidad de productos (no de pedidos) de un pedido entregado.
    // Un pedido con varios productos, o con cantidades > 1, cuenta cada
    // unidad, no solo "1 por pedido".
    function contarProductos(pedido) {
        return (pedido.items || []).reduce(
            (sum, it) => sum + (Number(it.cantidad) || 0),
            0,
        );
    }

    // Cuenta solo los productos entregados mientras la meta estuvo activa:
    // desde que se creó la meta (meta.fecha) hasta su caducidad (si tiene).
    // Así los pedidos anteriores a la meta no cuentan para el progreso.
    function getProductosEntregadosParaMeta(clienteId, meta) {
        const inicio = meta.fecha ? new Date(meta.fecha) : null;
        const fin = meta.caducidad ? new Date(meta.caducidad) : null;
        return pedidos
            .filter((p) => {
                if (p.clienteId !== clienteId || p.estado !== "Entregado")
                    return false;
                const fechaPedido = p.fecha ? new Date(p.fecha) : null;
                if (!fechaPedido) return false;
                if (inicio && fechaPedido < inicio) return false;
                if (fin && fechaPedido > fin) return false;
                return true;
            })
            .reduce((sum, p) => sum + contarProductos(p), 0);
    }

    // Progreso de cliente en meta activa
    function progresoCliente(clienteId, meta) {
        const completados = getProductosEntregadosParaMeta(clienteId, meta);
        return Math.min(completados, meta.meta);
    }

    let metasActivas = $derived(metas.filter((m) => m.activa));

    // Clientes que alcanzaron cada meta activa
    function clientesQueAlcanzaron(meta) {
        return clientes.filter(
            (c) => getProductosEntregadosParaMeta(c.id, meta) >= meta.meta,
        );
    }

    // Leaderboard de progreso para la meta abierta en el detalle
    let leaderboardSeleccionado = $derived.by(() => {
        if (!selectedMeta) return [];
        return clientes
            .map((cliente) => ({
                cliente,
                progreso: progresoCliente(cliente.id, selectedMeta),
                alcanzado:
                    getProductosEntregadosParaMeta(cliente.id, selectedMeta) >=
                    selectedMeta.meta,
            }))
            .sort((a, b) => b.progreso - a.progreso);
    });

    // ── KPIs ──────────────────────────────────────────────────────────────────
    let clientesQueAlcanzaronAlguna = $derived.by(() => {
        const ids = new Set();
        for (const meta of metasActivas) {
            for (const c of clientesQueAlcanzaron(meta)) ids.add(c.id);
        }
        return ids.size;
    });

    // ── Detalle ───────────────────────────────────────────────────────────────
    function openDetail(meta) {
        selectedMetaId = meta.id;
    }

    function closeDetail() {
        selectedMetaId = null;
    }

    // ── Acciones ──────────────────────────────────────────────────────────────
    function openCreate() {
        showForm = true;
    }

    function openArchivar(meta) {
        metaToArchivar = meta;
        showArchivar = true;
    }

    function closeArchivar() {
        showArchivar = false;
        metaToArchivar = null;
    }

    async function handleCrearMeta(payload) {
        try {
            await saveMeta(payload);
        } catch (err) {
            console.error("Error creando meta:", err);
        }
    }

    async function handleArchivarMeta(meta) {
        const alcanzaron = clientesQueAlcanzaron(meta).map((c) =>
            `${c.nombre || ""} ${c.apellido || ""}`.trim(),
        );
        try {
            await eliminarMeta(meta.id, alcanzaron);
            if (selectedMetaId === meta.id) closeDetail();
        } catch (err) {
            console.error("Error archivando meta:", err);
        } finally {
            closeArchivar();
        }
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
                        <i class="fa-solid fa-gift text-xl"></i>
                    </div>

                    <div class="min-w-0">
                        <p class="text-sm font-medium text-[#7C3AED]">
                            Fidelidad
                        </p>

                        <h1
                            class="mt-0.5 text-2xl font-bold text-gray-900 sm:text-3xl"
                        >
                            Programa de fidelidad
                        </h1>

                        <p class="mt-1 text-sm text-gray-500">
                            Crea metas, revisa el progreso de cada cliente y
                            consulta el historial de premios.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </header>

    <!-- KPIs -->
    <section class="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div
            class="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
            <div class="flex items-center justify-between">
                <i class="fa-solid fa-gift text-[#7C3AED]"></i>
                <span class="text-xs text-gray-500">Vigentes</span>
            </div>
            <p class="mt-4 text-3xl font-bold text-gray-900">
                {metasActivas.length}
            </p>
            <p class="text-sm text-gray-500">Metas activas</p>
        </div>

        <div
            class="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
            <div class="flex items-center justify-between">
                <i class="fa-solid fa-users text-blue-500"></i>
                <span class="text-xs text-gray-500">Total</span>
            </div>
            <p class="mt-4 text-3xl font-bold text-blue-600">
                {clientes.length}
            </p>
            <p class="text-sm text-gray-500">Clientes</p>
        </div>

        <div
            class="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
            <div class="flex items-center justify-between">
                <i class="fa-solid fa-trophy text-green-500"></i>
                <span class="text-xs text-gray-500">Ganando</span>
            </div>
            <p class="mt-4 text-3xl font-bold text-green-600">
                {clientesQueAlcanzaronAlguna}
            </p>
            <p class="text-sm text-gray-500">Alcanzaron una meta</p>
        </div>

        <div
            class="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
            <div class="flex items-center justify-between">
                <i class="fa-solid fa-box-archive text-amber-500"></i>
                <span class="text-xs text-gray-500">Histórico</span>
            </div>
            <p class="mt-4 text-3xl font-bold text-amber-600">
                {historialMetas.length}
            </p>
            <p class="text-sm text-gray-500">Metas archivadas</p>
        </div>
    </section>

    <!-- Metas activas -->
    <section class="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
        <div class="flex items-center gap-2">
            <i class="fa-solid fa-gift text-[#7C3AED]"></i>
            <h2 class="text-lg font-bold text-gray-800">Metas activas</h2>
        </div>
        <p class="mt-1 text-sm text-gray-500">
            Toca una meta para ver el progreso de cada cliente.
        </p>

        <div class="mt-4">
            {#if loading}
                <p class="p-8 text-center text-gray-400">Cargando metas...</p>
            {:else if metasActivas.length === 0}
                <div class="p-8 text-center text-gray-400">
                    <i class="fa-solid fa-gift text-4xl"></i>
                    <p class="mt-3 text-sm">
                        No hay metas activas. Crea una con el botón +.
                    </p>
                </div>
            {:else}
                <ListMeta
                    metas={metasActivas}
                    {clientesQueAlcanzaron}
                    onSelectMeta={openDetail}
                />
            {/if}
        </div>
    </section>

    <!-- Historial de metas -->
    <section class="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
        <div class="flex items-center gap-2">
            <i class="fa-solid fa-box-archive text-[#7C3AED]"></i>
            <h2 class="text-lg font-bold text-gray-800">Historial de metas</h2>
        </div>

        <div class="mt-4 space-y-3">
            {#each historialMetas as item}
                <article class="rounded-2xl border border-gray-100 px-4 py-3">
                    <div class="flex flex-wrap items-center gap-2">
                        <p class="font-semibold text-gray-800">{item.titulo}</p>
                        <span
                            class="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600"
                        >
                            Archivada {new Date(
                                item.archivedAt,
                            ).toLocaleDateString("es-CO")}
                        </span>
                    </div>
                    <p class="mt-1 text-sm text-gray-500">
                        Meta: {item.meta} productos ·
                        {item.caducidad
                            ? `Vencía ${item.caducidad}`
                            : "Sin caducidad"}
                    </p>
                    <p class="mt-1 text-sm text-gray-600">
                        {#if (item.clientesAlcanzaron || []).length > 0}
                            <i class="fa-solid fa-trophy mr-1.5 text-amber-500"
                            ></i>
                            {item.clientesAlcanzaron.join(", ")}
                        {:else}
                            Ningún cliente la alcanzó.
                        {/if}
                    </p>
                </article>
            {:else}
                <p class="text-sm text-gray-400">
                    No hay historial de metas aún.
                </p>
            {/each}
        </div>
    </section>
</div>

<!-- FAB -->
{#if !showForm && !selectedMeta}
    <div
        class="pointer-events-none fixed right-0 bottom-18 left-0 z-40 lg:bottom-6"
    >
        <div class="container mx-auto flex justify-end px-4">
            <button
                title="Nueva meta"
                type="button"
                onclick={openCreate}
                class="pointer-events-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#CDB9FE] text-2xl text-white shadow-xl transition-all duration-200 hover:scale-110 active:scale-95"
            >
                <i class="fa-solid fa-plus"></i>
            </button>
        </div>
    </div>
{/if}

<FormMeta bind:open={showForm} onSubmit={handleCrearMeta} />

<ArchivarMeta
    bind:open={showArchivar}
    meta={metaToArchivar}
    onConfirm={handleArchivarMeta}
/>

<!-- Detail -->
{#if selectedMeta}
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
            <DetailMeta
                meta={selectedMeta}
                leaderboard={leaderboardSeleccionado}
                onClose={closeDetail}
                onArchive={openArchivar}
            />
        </div>
    </div>
{/if}
