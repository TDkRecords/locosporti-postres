<script>
    import { onMount } from "svelte";
    import { currentUser, clientProfile } from "$lib/stores.js";
    import { watchCollection } from "$lib/firestore.js";
    import QRCode from "qrcode";

    let pedidos = $state([]);
    let metas = $state([]);
    let historialMetas = $state([]);
    let qrDataUrl = $state("");

    let unsubPedidos, unsubMetas, unsubHistorial;

    onMount(() => {
        unsubPedidos = watchCollection("pedidos", (data) => {
            pedidos = data;
        }, "fecha");
        unsubMetas = watchCollection("metas", (data) => {
            metas = data.filter((m) => m.activa);
        }, "fecha");
        unsubHistorial = watchCollection("metas_historial", (data) => {
            historialMetas = data;
        }, "archivedAt");

        return () => {
            unsubPedidos?.();
            unsubMetas?.();
            unsubHistorial?.();
        };
    });

    // ── Datos del perfil ──────────────────────────────────────────────────────
    let profile = $derived($clientProfile);

    let pedidosCompletados = $derived(
        pedidos.filter(
            (p) =>
                (p.clienteId === $currentUser?.uid || p.clienteId === profile?.id) &&
                p.estado === "Entregado",
        ).length,
    );

    let tiempoConNosotros = $derived.by(() => {
        const fechaRegistro = profile?.createdAt;
        if (!fechaRegistro) return "Recién llegado";
        const inicio = new Date(fechaRegistro);
        const hoy = new Date();
        const meses =
            (hoy.getFullYear() - inicio.getFullYear()) * 12 +
            (hoy.getMonth() - inicio.getMonth());
        if (meses < 1) return "Menos de 1 mes";
        if (meses < 12) return `${meses} mes${meses > 1 ? "es" : ""}`;
        const años = Math.floor(meses / 12);
        const m = meses % 12;
        return m > 0
            ? `${años} año${años > 1 ? "s" : ""} y ${m} mes${m > 1 ? "es" : ""}`
            : `${años} año${años > 1 ? "s" : ""}`;
    });

    // ── QR del perfil ─────────────────────────────────────────────────────────
    $effect(() => {
        if (!profile) return;
        const qrContent = [
            `Nombre: ${(profile.nombre || "") + " " + (profile.apellido || "")}`,
            `Email: ${profile.email || ""}`,
            `Dirección: ${profile.direccion || ""}`,
            `Sugerencias: ${profile.sugerencias || ""}`,
        ].join("\n");

        QRCode.toDataURL(qrContent, {
            errorCorrectionLevel: "M",
            margin: 2,
            width: 256,
            color: { dark: "#1a1a2e", light: "#FFFB96" },
        })
            .then((url) => { qrDataUrl = url; })
            .catch((err) => console.error("QR error:", err));
    });

    // ── Metas para el cliente ─────────────────────────────────────────────────
    function progresoMeta(meta) {
        return Math.min(pedidosCompletados, meta.meta);
    }

    function porcentajeMeta(meta) {
        return Math.min(100, Math.round((pedidosCompletados / meta.meta) * 100));
    }

    // ── Historial de metas del cliente ────────────────────────────────────────
    let historialDelCliente = $derived(
        historialMetas.filter((h) => {
            const nombre = `${profile?.nombre || ""} ${profile?.apellido || ""}`.trim();
            return (h.clientesAlcanzaron || []).some((n) =>
                n.toLowerCase().includes((nombre || "").toLowerCase()),
            );
        }),
    );
</script>

<svelte:head>
    <title>Fidelidad | Locos por ti</title>
</svelte:head>

<div class="space-y-6 p-4 sm:p-6">
    <header class="rounded-3xl bg-white p-5 shadow-sm">
        <p class="text-sm font-semibold uppercase tracking-[0.2em] text-[#CDB9FE]">Fidelidad</p>
        <h1 class="mt-2 text-3xl font-bold text-gray-900">Programa de lealtad</h1>
        <p class="mt-2 text-sm text-gray-500">
            Revisa tu progreso, metas activas e historial de premios.
        </p>
    </header>

    <!-- Stats -->
    <section class="grid gap-4 sm:grid-cols-2">
        <div class="rounded-3xl bg-white p-5 shadow-sm">
            <p class="text-sm text-gray-500">Pedidos completados</p>
            <p class="mt-2 text-3xl font-bold text-gray-900">{pedidosCompletados}</p>
        </div>
        <div class="rounded-3xl bg-white p-5 shadow-sm">
            <p class="text-sm text-gray-500">Tiempo con nosotros</p>
            <p class="mt-2 text-3xl font-bold text-gray-900">{tiempoConNosotros}</p>
        </div>
    </section>

    <!-- Metas activas -->
    {#if metas.length > 0}
        {#each metas as meta}
            <section class="rounded-3xl bg-white p-6 shadow-sm">
                <div class="flex items-center justify-between gap-3">
                    <h2 class="text-xl font-bold text-gray-900">Meta activa</h2>
                    <span class="rounded-full bg-[#CDB9FE]/20 px-3 py-1 text-xs font-semibold text-[#7c4dff]">
                        {meta.indefinida || !meta.caducidad ? "Sin caducidad" : `Vence ${meta.caducidad}`}
                    </span>
                </div>
                <p class="mt-3 font-semibold text-gray-800">{meta.titulo}</p>
                <div class="mt-4">
                    <div class="mb-2 flex justify-between text-sm text-gray-600">
                        <span>{progresoMeta(meta)}/{meta.meta} pedidos</span>
                        <span>{porcentajeMeta(meta)}%</span>
                    </div>
                    <div class="h-3 overflow-hidden rounded-full bg-gray-100">
                        <div
                            class="h-full rounded-full bg-[#CDB9FE] transition-all duration-500"
                            style:width="{porcentajeMeta(meta)}%"
                        ></div>
                    </div>
                    {#if pedidosCompletados >= meta.meta}
                        <p class="mt-3 rounded-2xl bg-green-100 px-4 py-2 text-sm font-semibold text-green-700">
                            🎉 ¡Meta alcanzada! Comunícate con nosotros para reclamar tu premio.
                        </p>
                    {:else}
                        <p class="mt-2 text-sm text-gray-400">
                            Te faltan {meta.meta - pedidosCompletados} pedidos para ganar.
                        </p>
                    {/if}
                </div>
            </section>
        {/each}
    {:else}
        <section class="rounded-3xl bg-white p-6 shadow-sm text-center text-gray-400">
            <i class="fa-solid fa-trophy text-3xl"></i>
            <p class="mt-3 text-sm">No hay metas activas en este momento.</p>
        </section>
    {/if}

    <!-- Historial de metas -->
    {#if historialMetas.length > 0}
        <section class="rounded-3xl bg-white p-6 shadow-sm">
            <h2 class="text-xl font-bold text-gray-900">Historial de metas</h2>
            <div class="mt-4 space-y-3">
                {#each historialMetas as meta}
                    {@const cumplida = (meta.clientesAlcanzaron || []).some(
                        (n) => n.toLowerCase().includes(
                            `${profile?.nombre || ""} ${profile?.apellido || ""}`.trim().toLowerCase()
                        )
                    )}
                    <article
                        class="rounded-2xl border border-gray-100 px-4 py-3 {cumplida ? 'bg-[#FFFB96]/40' : 'bg-[#FFCDDB]/30'}"
                    >
                        <div class="flex items-start justify-between gap-3">
                            <div>
                                <p class="font-semibold text-gray-800">{meta.titulo}</p>
                                <p class="mt-1 text-sm text-gray-500">
                                    Meta: {meta.meta} pedidos ·
                                    Archivada {new Date(meta.archivedAt).toLocaleDateString("es-CO")}
                                </p>
                                <p class="mt-1 text-sm text-gray-500">
                                    Tu progreso: {progresoMeta(meta)}/{meta.meta}
                                </p>
                            </div>
                            <span
                                class="shrink-0 rounded-full px-3 py-1 text-xs font-semibold"
                                class:bg-green-100={cumplida}
                                class:text-green-700={cumplida}
                                class:bg-gray-100={!cumplida}
                                class:text-gray-600={!cumplida}
                            >
                                {cumplida ? "Cumplida ✓" : "Expirada"}
                            </span>
                        </div>
                    </article>
                {/each}
            </div>
        </section>
    {/if}

    <!-- QR del perfil -->
    <section class="rounded-3xl bg-white p-6 shadow-sm">
        <h2 class="text-xl font-bold text-gray-900">Mi código QR</h2>
        <p class="mt-2 text-sm text-gray-500">
            Presenta este código con tus datos de perfil. Se actualiza automáticamente
            si cambias tu dirección o información personal.
        </p>
        <div class="mt-6 flex justify-center">
            {#if qrDataUrl}
                <div class="rounded-3xl border-2 border-[#CDB9FE] p-3 shadow-lg bg-[#FFFB96]/40">
                    <img
                        src={qrDataUrl}
                        alt="Código QR de mi perfil"
                        class="h-48 w-48 rounded-2xl"
                    />
                </div>
            {:else}
                <div
                    class="flex h-52 w-52 items-center justify-center rounded-3xl border-2 border-dashed border-[#CDB9FE] bg-[#FFFB96]/40"
                >
                    <div class="text-center text-gray-500">
                        <i class="fa-solid fa-qrcode text-5xl"></i>
                        <p class="mt-3 text-sm">Cargando QR...</p>
                    </div>
                </div>
            {/if}
        </div>
        {#if profile}
            <p class="mt-4 text-center text-xs text-gray-400">
                {profile.nombre || ""} {profile.apellido || ""} · {profile.direccion || ""}
            </p>
        {/if}
    </section>
</div>
