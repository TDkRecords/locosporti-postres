<script>
    import { onMount } from "svelte";
    import { watchCollection, saveMeta, eliminarMeta } from "$lib/firestore.js";

    let clientes = $state([]);
    let metas = $state([]);
    let historialMetas = $state([]);
    let loading = $state(true);

    let nuevaMeta = $state({
        titulo: "",
        meta: "",
        caducidad: "",
        indefinida: false,
    });
    let loadingMeta = $state(false);

    let unsubClientes, unsubMetas, unsubHistorial;

    onMount(() => {
        unsubClientes = watchCollection("clientes", (data) => {
            clientes = data.filter((c) => c.estado !== "eliminado");
            loading = false;
        }, "createdAt");

        unsubMetas = watchCollection("metas", (data) => {
            metas = data;
        }, "fecha");

        unsubHistorial = watchCollection("metas_historial", (data) => {
            historialMetas = data;
        }, "archivedAt");

        return () => {
            unsubClientes?.();
            unsubMetas?.();
            unsubHistorial?.();
        };
    });

    // Para cada cliente, contar sus pedidos entregados desde los pedidos
    // Usamos los datos embebidos en clientes (si existen) o cargamos por separado
    let pedidos = $state([]);
    let unsubPedidos;
    onMount(() => {
        unsubPedidos = watchCollection("pedidos", (data) => {
            pedidos = data;
        }, "fecha");
        return () => unsubPedidos?.();
    });

    function getPedidosEntregados(clienteId) {
        return pedidos.filter(
            (p) => p.clienteId === clienteId && p.estado === "Entregado",
        ).length;
    }

    // Progreso de cliente en meta activa
    function progresoCliente(clienteId, metaRequired) {
        const completados = getPedidosEntregados(clienteId);
        return Math.min(completados, metaRequired);
    }

    let metasActivas = $derived(metas.filter((m) => m.activa));

    // Clientes que alcanzaron cada meta activa
    function clientesQueAlcanzaron(meta) {
        return clientes.filter(
            (c) => getPedidosEntregados(c.id) >= meta.meta,
        );
    }

    async function handleCrearMeta(event) {
        event.preventDefault();
        if (!nuevaMeta.titulo || !nuevaMeta.meta) return;
        loadingMeta = true;
        try {
            await saveMeta({
                titulo: nuevaMeta.titulo,
                meta: Number(nuevaMeta.meta),
                caducidad: nuevaMeta.indefinida ? null : nuevaMeta.caducidad || null,
                indefinida: nuevaMeta.indefinida,
            });
            nuevaMeta = { titulo: "", meta: "", caducidad: "", indefinida: false };
        } catch (err) {
            console.error("Error creando meta:", err);
        } finally {
            loadingMeta = false;
        }
    }

    async function handleEliminarMeta(meta) {
        const alcanzaron = clientesQueAlcanzaron(meta).map(
            (c) => `${c.nombre || ""} ${c.apellido || ""}`.trim(),
        );
        try {
            await eliminarMeta(meta.id, alcanzaron);
        } catch (err) {
            console.error("Error eliminando meta:", err);
        }
    }
</script>

<div class="space-y-6 p-4 sm:p-6">
    <header class="rounded-3xl bg-white p-4 shadow-sm sm:p-6">
        <p class="text-sm font-semibold uppercase tracking-[0.2em] text-[#CDB9FE]">Fidelidad</p>
        <h1 class="mt-2 text-2xl font-bold text-gray-800">Programa de fidelidad</h1>
        <p class="mt-2 text-sm text-gray-500">
            Gestiona metas, revisa el progreso de clientes y conserva el historial de premios.
        </p>
    </header>

    <!-- Clientes y pedidos entregados -->
    <section class="rounded-3xl bg-white p-4 shadow-sm sm:p-6">
        <h2 class="text-lg font-bold text-gray-800">Clientes y pedidos completados</h2>
        {#if loading}
            <p class="mt-4 text-sm text-gray-400">Cargando clientes...</p>
        {:else if clientes.length === 0}
            <p class="mt-4 text-sm text-gray-400">No hay clientes registrados aún.</p>
        {:else}
            <div class="mt-4 space-y-3">
                {#each clientes as cliente}
                    {@const entregados = getPedidosEntregados(cliente.id)}
                    <div
                        class="flex items-center justify-between rounded-2xl border border-gray-100 px-4 py-3"
                    >
                        <div class="flex items-center gap-3">
                            {#if cliente.photoURL}
                                <img
                                    src={cliente.photoURL}
                                    alt={cliente.nombre}
                                    class="h-9 w-9 rounded-full object-cover"
                                />
                            {:else}
                                <div class="flex h-9 w-9 items-center justify-center rounded-full bg-[#CDB9FE] text-gray-800">
                                    <i class="fa-solid fa-user text-xs"></i>
                                </div>
                            {/if}
                            <p class="font-semibold text-gray-800">
                                {cliente.nombre || ""} {cliente.apellido || ""}
                            </p>
                        </div>
                        <div class="flex items-center gap-3">
                            <!-- Progreso en metas activas -->
                            {#each metasActivas as meta}
                                <div class="hidden sm:flex items-center gap-1">
                                    <div class="h-2 w-24 overflow-hidden rounded-full bg-gray-100">
                                        <div
                                            class="h-full rounded-full bg-[#CDB9FE] transition-all duration-500"
                                            style:width="{Math.min(100, Math.round((entregados / meta.meta) * 100))}%"
                                        ></div>
                                    </div>
                                    <span class="text-xs text-gray-500">
                                        {progresoCliente(cliente.id, meta.meta)}/{meta.meta}
                                    </span>
                                </div>
                            {/each}
                            <span class="rounded-full bg-[#FFFB96]/70 px-3 py-1 text-sm font-semibold">
                                {entregados} entregados
                            </span>
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    </section>

    <!-- Metas activas + Nueva meta -->
    <section class="grid gap-6 lg:grid-cols-2">
        <!-- Metas activas -->
        <div class="rounded-3xl bg-white p-4 shadow-sm sm:p-6">
            <h2 class="text-lg font-bold text-gray-800">Metas activas</h2>
            <div class="mt-4 space-y-3">
                {#each metasActivas as meta}
                    {@const alcanzaron = clientesQueAlcanzaron(meta)}
                    <article class="rounded-2xl bg-[#CDB9FE]/10 px-4 py-3">
                        <p class="font-semibold text-gray-800">{meta.titulo}</p>
                        <p class="mt-1 text-sm text-gray-500">
                            Meta: {meta.meta} pedidos ·
                            {meta.indefinida || !meta.caducidad
                                ? "Sin caducidad"
                                : `Vence ${meta.caducidad}`}
                        </p>
                        {#if alcanzaron.length > 0}
                            <p class="mt-2 text-sm font-semibold text-green-700">
                                ✓ {alcanzaron.length} cliente(s) alcanzó la meta:
                                {alcanzaron.map((c) => `${c.nombre || ""} ${c.apellido || ""}`.trim()).join(", ")}
                            </p>
                        {/if}
                        <button
                            type="button"
                            onclick={() => handleEliminarMeta(meta)}
                            class="mt-3 rounded-xl bg-[#FFCDDB] px-3 py-1.5 text-xs font-semibold text-gray-900 transition hover:bg-[#ffb6c0]"
                        >
                            Archivar meta
                        </button>
                    </article>
                {:else}
                    <p class="text-sm text-gray-400">No hay metas activas.</p>
                {/each}
            </div>
        </div>

        <!-- Nueva meta -->
        <div class="rounded-3xl bg-white p-4 shadow-sm sm:p-6">
            <h2 class="text-lg font-bold text-gray-800">Nueva meta</h2>
            <form class="mt-4 space-y-3" onsubmit={handleCrearMeta}>
                <input
                    bind:value={nuevaMeta.titulo}
                    type="text"
                    placeholder="Título del premio"
                    class="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-[#CDB9FE]"
                />
                <input
                    bind:value={nuevaMeta.meta}
                    type="number"
                    min="1"
                    placeholder="Pedidos requeridos para ganar"
                    class="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-[#CDB9FE]"
                />
                <input
                    bind:value={nuevaMeta.caducidad}
                    type="date"
                    disabled={nuevaMeta.indefinida}
                    class="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-[#CDB9FE] disabled:opacity-50"
                />
                <label class="flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" bind:checked={nuevaMeta.indefinida} />
                    Meta sin caducidad
                </label>
                <button
                    type="submit"
                    disabled={loadingMeta}
                    class="w-full rounded-2xl bg-[#CDB9FE] px-4 py-3 font-semibold text-gray-900 transition hover:bg-[#bfa3fd] disabled:opacity-70"
                >
                    {loadingMeta ? "Creando..." : "Crear meta"}
                </button>
            </form>
        </div>
    </section>

    <!-- Historial de metas archivadas -->
    <section class="rounded-3xl bg-white p-4 shadow-sm sm:p-6">
        <h2 class="text-lg font-bold text-gray-800">Historial de metas</h2>
        <div class="mt-4 space-y-3">
            {#each historialMetas as item}
                <article class="rounded-2xl border border-gray-100 px-4 py-3">
                    <p class="font-semibold text-gray-800">{item.titulo}</p>
                    <p class="mt-1 text-sm text-gray-500">
                        Meta: {item.meta} pedidos ·
                        Archivada {new Date(item.archivedAt).toLocaleDateString("es-CO")}
                        {item.caducidad ? `· Vencía ${item.caducidad}` : "· Sin caducidad"}
                    </p>
                    <p class="mt-1 text-sm text-gray-600">
                        Clientes que la alcanzaron:
                        {(item.clientesAlcanzaron || []).length > 0
                            ? item.clientesAlcanzaron.join(", ")
                            : "Ninguno"}
                    </p>
                </article>
            {:else}
                <p class="text-sm text-gray-400">No hay historial de metas aún.</p>
            {/each}
        </div>
    </section>
</div>
