<script>
    import { onMount } from "svelte";
    import { currentUser, clientProfile } from "$lib/stores.js";
    import { watchCollection, watchCollectionWhere } from "$lib/firestore.js";
    import QRCode from "qrcode";

    let pedidos = $state([]);
    let metas = $state([]);
    let historialMetas = $state([]);
    let qrDataUrl = $state("");

    let unsubMetas, unsubHistorial;
    onMount(() => {
        unsubMetas = watchCollection(
            "metas",
            (data) => {
                metas = data.filter((m) => m.activa);
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

        return () => {
            unsubMetas?.();
            unsubHistorial?.();
        };
    });

    $effect(() => {
        const uid = $currentUser?.uid;
        if (!uid) {
            pedidos = [];
            return;
        }

        const unsub = watchCollectionWhere(
            "pedidos",
            "clienteId",
            "==",
            uid,
            (data) => {
                pedidos = data;
            },
            "fecha",
        );

        return () => unsub();
    });

    // ── Datos del perfil ──────────────────────────────────────────────────────
    let profile = $derived($clientProfile);

    let pedidosCompletados = $derived(
        pedidos.filter(
            (p) =>
                (p.clienteId === $currentUser?.uid ||
                    p.clienteId === profile?.id) &&
                p.estado === "Entregado",
        ).length,
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
    function productosCompletadosParaMeta(meta) {
        const inicio = meta.fecha ? new Date(meta.fecha) : null;
        const fin = meta.caducidad ? new Date(meta.caducidad) : null;
        return pedidos
            .filter((p) => {
                if (
                    p.clienteId !== $currentUser?.uid &&
                    p.clienteId !== profile?.id
                )
                    return false;
                if (p.estado !== "Entregado") return false;
                const fechaPedido = p.fecha ? new Date(p.fecha) : null;
                if (!fechaPedido) return false;
                if (inicio && fechaPedido < inicio) return false;
                if (fin && fechaPedido > fin) return false;
                return true;
            })
            .reduce((sum, p) => sum + contarProductos(p), 0);
    }

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
            .then((url) => {
                qrDataUrl = url;
            })
            .catch((err) => console.error("QR error:", err));
    });

    // ── Metas para el cliente ─────────────────────────────────────────────────
    function progresoMeta(meta) {
        return Math.min(productosCompletadosParaMeta(meta), meta.meta);
    }

    function porcentajeMeta(meta) {
        return Math.min(
            100,
            Math.round((productosCompletadosParaMeta(meta) / meta.meta) * 100),
        );
    }

    // ── Historial de metas del cliente ────────────────────────────────────────
    let historialDelCliente = $derived(
        historialMetas.filter((h) => {
            const nombre =
                `${profile?.nombre || ""} ${profile?.apellido || ""}`.trim();
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
    <header class="overflow-hidden rounded-3xl bg-white shadow-sm">
        <div class="p-5 sm:p-6">
            <div class="flex items-center gap-4">
                <div
                    class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#CDB9FE]/20 text-[#7C3AED]"
                >
                    <i class="fa-solid fa-gift text-xl"></i>
                </div>

                <div class="min-w-0">
                    <p class="text-sm font-medium text-[#7C3AED]">Fidelidad</p>

                    <h1
                        class="mt-0.5 text-2xl font-bold text-gray-900 sm:text-3xl"
                    >
                        Programa de lealtad
                    </h1>

                    <p class="mt-1 text-sm text-gray-500">
                        Revisa tu progreso, metas activas e historial de
                        premios.
                    </p>
                </div>
            </div>
        </div>
    </header>

    <!-- Resumen de membresía -->
    <section class="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
        <div class="flex items-center gap-4">
            <div
                class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#CDB9FE]/20 text-[#7C3AED]"
            >
                <i class="fa-solid fa-calendar-check text-xl"></i>
            </div>

            <div class="min-w-0">
                <p
                    class="text-xs font-semibold uppercase tracking-widest text-gray-400"
                >
                    Membresía
                </p>

                <h2 class="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">
                    {tiempoConNosotros}
                </h2>

                <p class="mt-1 text-sm text-gray-500">
                    Miembro desde
                    <span class="font-medium text-gray-700">
                        {#if profile?.createdAt}
                            {new Date(profile.createdAt).toLocaleDateString(
                                "es-CO",
                                {
                                    day: "2-digit",
                                    month: "long",
                                    year: "numeric",
                                },
                            )}
                        {:else}
                            recientemente
                        {/if}
                    </span>
                </p>
            </div>
        </div>
    </section>

    <div class="grid gap-3 md:grid-cols-3 items-stretch">
        <!-- Metas activas -->
        <section class="md:col-span-2 h-full">
            {#if metas.length > 0}
                {#each metas as meta}
                    <section
                        class="overflow-hidden h-full rounded-3xl bg-white shadow-sm"
                    >
                        <!-- Encabezado -->
                        <div class="border-b border-gray-100 p-5 sm:p-6">
                            <div class="flex items-start justify-between gap-4">
                                <div class="flex items-center gap-4">
                                    <div
                                        class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#CDB9FE]/20 text-[#7C3AED]"
                                    >
                                        <i class="fa-solid fa-trophy text-xl"
                                        ></i>
                                    </div>

                                    <div class="min-w-0">
                                        <p
                                            class="text-sm font-medium text-[#7C3AED]"
                                        >
                                            Meta activa
                                        </p>

                                        <h2
                                            class="mt-1 text-xl font-bold text-gray-900"
                                        >
                                            {meta.titulo}
                                        </h2>
                                    </div>
                                </div>

                                <span
                                    class="shrink-0 rounded-full bg-[#CDB9FE]/20 px-3 py-1 text-xs font-semibold text-[#7C3AED]"
                                >
                                    {meta.indefinida || !meta.caducidad
                                        ? "Sin caducidad"
                                        : `Vence ${meta.caducidad}`}
                                </span>
                            </div>
                        </div>

                        <!-- Contenido -->
                        <div class="p-5 sm:p-6">
                            <!-- Resumen -->
                            <div class="flex items-end justify-between gap-4">
                                <div>
                                    <p
                                        class="text-xs uppercase tracking-widest text-gray-400"
                                    >
                                        Progreso
                                    </p>

                                    <h3
                                        class="mt-1 text-3xl font-bold text-gray-900"
                                    >
                                        {porcentajeMeta(meta)}%
                                    </h3>
                                </div>

                                <div class="text-right">
                                    <p
                                        class="text-xs uppercase tracking-widest text-gray-400"
                                    >
                                        Productos
                                    </p>

                                    <p
                                        class="text-lg font-semibold text-gray-800"
                                    >
                                        {progresoMeta(meta)} / {meta.meta}
                                    </p>
                                </div>
                            </div>

                            <!-- Barra -->
                            <div class="mt-5">
                                <div
                                    class="h-3 overflow-hidden rounded-full bg-gray-100"
                                >
                                    <div
                                        class="h-full rounded-full bg-linear-to-r from-[#CDB9FE] to-[#7C3AED] transition-all duration-700"
                                        style:width="{porcentajeMeta(meta)}%"
                                    ></div>
                                </div>
                            </div>

                            <!-- Estado -->
                            <div
                                class="mt-5 border-t border-dashed border-gray-200 pt-4"
                            >
                                {#if progresoMeta(meta) >= meta.meta}
                                    <div
                                        class="flex items-start gap-3 rounded-2xl bg-green-50 p-4"
                                    >
                                        <div
                                            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-600"
                                        >
                                            <i class="fa-solid fa-circle-check"
                                            ></i>
                                        </div>

                                        <div>
                                            <p
                                                class="font-semibold text-green-700"
                                            >
                                                ¡Meta alcanzada!
                                            </p>

                                            <p
                                                class="mt-1 text-sm text-green-600"
                                            >
                                                Comunícate con nosotros para
                                                reclamar tu premio.
                                            </p>
                                        </div>
                                    </div>
                                {:else}
                                    <div class="flex items-start gap-3">
                                        <div
                                            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FFF7D6] text-[#B7791F]"
                                        >
                                            <i
                                                class="fa-solid fa-flag-checkered"
                                            ></i>
                                        </div>

                                        <div>
                                            <p
                                                class="font-semibold text-gray-900"
                                            >
                                                Estás muy cerca
                                            </p>

                                            <p
                                                class="mt-1 text-sm text-gray-500"
                                            >
                                                Te faltan
                                                <span
                                                    class="font-semibold text-[#7C3AED]"
                                                >
                                                    {meta.meta -
                                                        progresoMeta(meta)}
                                                </span>
                                                productos para conseguir tu recompensa.
                                            </p>
                                        </div>
                                    </div>
                                {/if}
                            </div>
                        </div>
                    </section>
                {/each}
            {:else}
                <section class="rounded-3xl bg-white p-8 text-center shadow-sm">
                    <div
                        class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#CDB9FE]/20 text-[#7C3AED]"
                    >
                        <i class="fa-solid fa-trophy text-2xl"></i>
                    </div>

                    <p class="mt-4 text-sm text-gray-500">
                        No hay metas activas en este momento.
                    </p>
                </section>
            {/if}
        </section>
        <!-- QR del perfil -->
        <section
            class="md:col-span-1 flex h-full flex-col rounded-3xl bg-white p-6 shadow-sm"
        >
            <div class="flex items-baseline gap-2">
                <h2 class="text-xl font-bold text-gray-900">Mi código QR</h2>
                <small class="text-gray-500 bg-[#CDB9FE]/56 px-2 rounded-2xl"
                    >Locos Por Ti</small
                >
            </div>

            <div class="mt-6 flex flex-1 items-center justify-center">
                {#if qrDataUrl}
                    <div
                        class="rounded-3xl border-2 border-[#CDB9FE] p-3 shadow-lg bg-[#FFFB96]/40"
                    >
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
                    {profile.nombre || ""}
                    {profile.apellido || ""} · {profile.direccion || ""}
                </p>
            {/if}
        </section>
    </div>
    <!-- Historial de metas -->
    {#if historialMetas.length > 0}
        <section class="rounded-3xl bg-white p-6 shadow-sm">
            <h2 class="text-xl font-bold text-gray-900">Historial de metas</h2>
            <div class="mt-4 space-y-3">
                {#each historialMetas as meta}
                    {@const cumplida = (meta.clientesAlcanzaron || []).some(
                        (n) =>
                            n
                                .toLowerCase()
                                .includes(
                                    `${profile?.nombre || ""} ${profile?.apellido || ""}`
                                        .trim()
                                        .toLowerCase(),
                                ),
                    )}
                    <article
                        class="rounded-2xl border border-gray-100 px-4 py-3 {cumplida
                            ? 'bg-[#FFFB96]/40'
                            : 'bg-[#FFCDDB]/30'}"
                    >
                        <div class="flex items-start justify-between gap-3">
                            <div>
                                <p class="font-semibold text-gray-800">
                                    {meta.titulo}
                                </p>
                                <p class="mt-1 text-sm text-gray-500">
                                    Meta: {meta.meta} productos · Archivada {new Date(
                                        meta.archivedAt,
                                    ).toLocaleDateString("es-CO")}
                                </p>
                                <p class="mt-1 text-sm text-gray-500">
                                    Tu progreso: {progresoMeta(
                                        meta,
                                    )}/{meta.meta}
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
</div>
