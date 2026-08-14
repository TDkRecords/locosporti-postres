<script>
    import { currentUser, clientProfile } from "$lib/stores.js";
    import { signOutFirebase } from "$lib/firebase.js";
    import { goto } from "$app/navigation";
    import { updateClienteProfile, updateDocument } from "$lib/firestore.js";

    let showEditForm = $state(false);
    let showDeactivateConfirm = $state(false);
    let showDeleteConfirm = $state(false);
    let loadingAction = $state(false);
    let successMsg = $state("");
    let errorMsg = $state("");

    // Formulario de edición
    let editForm = $state({
        nombre: "",
        apellido: "",
        edad: "",
        direccion: "",
        calle: "",
        numeroCalle: "",
        complemento: "",
        tipoVivienda: "",
        sugerencias: "",
        telefono: "",
    });

    function openEditForm() {
        const p = $clientProfile;
        editForm = {
            nombre: p?.nombre || "",
            apellido: p?.apellido || "",
            edad: String(p?.edad || ""),
            direccion: p?.direccion || "",
            calle: p?.calle || "",
            numeroCalle: p?.numeroCalle || "",
            complemento: p?.complemento || "",
            tipoVivienda: p?.tipoVivienda || "",
            sugerencias: p?.sugerencias || "",
            telefono: p?.telefono || "",
        };
        showEditForm = true;
        errorMsg = "";
        successMsg = "";
    }

    async function handleActualizarPerfil(event) {
        event.preventDefault();
        if (!$currentUser?.uid) return;

        errorMsg = "";
        loadingAction = true;
        try {
            const direccionCompleta = editForm.calle
                ? `${editForm.calle} #${editForm.numeroCalle}${editForm.complemento ? ` - ${editForm.complemento}` : ""}, ${editForm.tipoVivienda}`
                : editForm.direccion;

            await updateClienteProfile($currentUser.uid, {
                nombre: editForm.nombre.trim(),
                apellido: editForm.apellido.trim(),
                edad: Number(editForm.edad) || $clientProfile?.edad,
                direccion: direccionCompleta,
                calle: editForm.calle.trim(),
                numeroCalle: editForm.numeroCalle.trim(),
                complemento: editForm.complemento.trim(),
                tipoVivienda: editForm.tipoVivienda.trim(),
                sugerencias: editForm.sugerencias.trim(),
                telefono: editForm.telefono.trim(),
            });

            successMsg = "¡Información actualizada correctamente!";
            showEditForm = false;
        } catch (err) {
            console.error(err);
            errorMsg = "No se pudo actualizar la información.";
        } finally {
            loadingAction = false;
        }
    }

    async function handleDesactivarCuenta() {
        if (!$currentUser?.uid) return;
        loadingAction = true;
        try {
            await updateDocument("clientes", $currentUser.uid, {
                estado: "inactivo",
                desactivadaAt: new Date().toISOString(),
            });
            await signOutFirebase();
            goto("/");
        } catch (err) {
            console.error(err);
            errorMsg = "Error al desactivar la cuenta.";
        } finally {
            loadingAction = false;
            showDeactivateConfirm = false;
        }
    }

    async function handleEliminarCuenta() {
        if (!$currentUser?.uid) return;
        loadingAction = true;
        try {
            await updateDocument("clientes", $currentUser.uid, {
                estado: "eliminado",
                eliminadaAt: new Date().toISOString(),
            });
            await signOutFirebase();
            goto("/");
        } catch (err) {
            console.error(err);
            errorMsg = "Error al eliminar la cuenta.";
        } finally {
            loadingAction = false;
            showDeleteConfirm = false;
        }
    }

    async function handleLogout() {
        await signOutFirebase();
        goto("/");
    }
</script>

<svelte:head>
    <title>Perfil | Locos por ti</title>
</svelte:head>

<div class="space-y-6 p-4 sm:p-6">
    <header class="rounded-3xl bg-white p-5 shadow-sm">
        <p
            class="text-sm font-semibold uppercase tracking-[0.2em] text-[#CDB9FE]"
        >
            Perfil
        </p>
        <h1 class="mt-2 text-3xl font-bold text-gray-900">Mi perfil</h1>
        <p class="mt-2 text-sm text-gray-500">
            Actualiza tus datos, desactiva o elimina tu cuenta.
        </p>
    </header>

    {#if successMsg}
        <div
            class="rounded-2xl bg-green-100 px-4 py-3 text-sm text-green-700 font-semibold"
        >
            {successMsg}
        </div>
    {/if}
    {#if errorMsg}
        <div class="rounded-2xl bg-red-100 px-4 py-3 text-sm text-red-700">
            {errorMsg}
        </div>
    {/if}

    <main class="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <!-- Info personal -->
        <section class="rounded-3xl bg-white p-6 shadow-sm">
            <div class="flex flex-col items-center gap-4 text-center">
                {#if $currentUser?.photoURL}
                    <img
                        src={$currentUser.photoURL}
                        alt="Foto de perfil"
                        class="h-28 w-28 rounded-full object-cover ring-4 ring-[#CDB9FE]/30"
                    />
                {:else}
                    <div
                        class="flex h-28 w-28 items-center justify-center rounded-full bg-[#CDB9FE] text-4xl text-gray-900"
                    >
                        <i class="fa-solid fa-user"></i>
                    </div>
                {/if}
                <h2 class="text-2xl font-bold text-gray-900">
                    {$clientProfile?.nombre || ""}
                    {$clientProfile?.apellido ||
                        $currentUser?.displayName ||
                        "Cliente"}
                </h2>
                <p class="text-sm text-gray-500">
                    {$currentUser?.email ?? "Sin correo registrado"}
                </p>
            </div>

            <div class="mt-8 space-y-4">
                <div class="rounded-3xl bg-[#FFFB96]/60 p-4">
                    <h3
                        class="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500"
                    >
                        Información personal
                    </h3>
                    <dl class="mt-3 space-y-2 text-sm text-gray-700">
                        <div class="flex gap-2">
                            <dt class="font-semibold w-24 shrink-0">Nombre:</dt>
                            <dd>
                                {$clientProfile?.nombre || "—"}
                                {$clientProfile?.apellido || ""}
                            </dd>
                        </div>
                        <div class="flex gap-2">
                            <dt class="font-semibold w-24 shrink-0">Edad:</dt>
                            <dd>{$clientProfile?.edad || "—"}</dd>
                        </div>
                        <div class="flex gap-2">
                            <dt class="font-semibold w-24 shrink-0">
                                Teléfono:
                            </dt>
                            <dd>{$clientProfile?.telefono || "—"}</dd>
                        </div>
                        <div class="flex gap-2">
                            <dt class="font-semibold w-24 shrink-0">Email:</dt>
                            <dd class="break-all">
                                {$currentUser?.email || "—"}
                            </dd>
                        </div>
                        <div class="flex gap-2">
                            <dt class="font-semibold w-24 shrink-0">
                                Dirección:
                            </dt>
                            <dd>
                                {$clientProfile?.direccion || "Sin dirección"}
                            </dd>
                        </div>
                        {#if $clientProfile?.sugerencias}
                            <div class="flex gap-2">
                                <dt class="font-semibold w-24 shrink-0">
                                    Notas:
                                </dt>
                                <dd class="italic text-gray-500">
                                    {$clientProfile.sugerencias}
                                </dd>
                            </div>
                        {/if}
                    </dl>
                </div>

                <!-- Historial de cambios -->
                {#if $clientProfile?.changeLog && $clientProfile.changeLog.length > 0}
                    <div class="rounded-3xl bg-[#FFE28A]/60 p-4">
                        <h3
                            class="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500"
                        >
                            Historial de cambios
                        </h3>
                        <div class="mt-3 space-y-2">
                            {#each $clientProfile.changeLog
                                .slice()
                                .reverse() as log}
                                <p class="text-xs text-gray-500">
                                    {new Date(log.at).toLocaleString("es-CO")} ·
                                    Cambió: {Object.keys(
                                        log.cambios || {},
                                    ).join(", ")}
                                </p>
                            {/each}
                        </div>
                    </div>
                {/if}
            </div>
        </section>

        <!-- Acciones -->
        <section class="space-y-6">
            <div class="rounded-3xl bg-white p-6 shadow-sm">
                <h2 class="text-xl font-bold text-gray-900">
                    Acciones de cuenta
                </h2>
                <div class="mt-6 space-y-3">
                    <button
                        type="button"
                        onclick={openEditForm}
                        class="w-full rounded-2xl bg-[#CDB9FE] px-4 py-3 font-semibold text-gray-900 transition hover:bg-[#bfa3fd]"
                    >
                        <i class="fa-solid fa-pencil mr-2"></i>
                        Actualizar información
                    </button>
                    <button
                        type="button"
                        onclick={() => {
                            showDeactivateConfirm = true;
                            errorMsg = "";
                        }}
                        class="w-full rounded-2xl bg-[#FFCDDB] px-4 py-3 font-semibold text-gray-900 transition hover:bg-[#ffb6c0]"
                    >
                        <i class="fa-solid fa-pause mr-2"></i>
                        Desactivar cuenta
                    </button>
                    <button
                        type="button"
                        onclick={() => {
                            showDeleteConfirm = true;
                            errorMsg = "";
                        }}
                        class="w-full rounded-2xl bg-[#FFE28A] px-4 py-3 font-semibold text-gray-900 transition hover:bg-[#FFD2A8]"
                    >
                        <i class="fa-solid fa-trash mr-2"></i>
                        Eliminar cuenta
                    </button>
                </div>
            </div>

            <div class="rounded-3xl bg-white p-6 shadow-sm">
                <h2 class="text-xl font-bold text-gray-900">Sesión</h2>
                <button
                    type="button"
                    onclick={handleLogout}
                    class="mt-4 w-full rounded-2xl border border-gray-200 px-4 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                    <i class="fa-solid fa-right-from-bracket mr-2"></i>
                    Cerrar sesión
                </button>
            </div>
        </section>
    </main>
</div>

<!-- Modal: Editar perfil -->
{#if showEditForm}
    <div
        class="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
    >
        <div
            class="w-full max-w-lg rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl sm:m-4 max-h-[90vh] overflow-y-auto"
        >
            <h2 class="text-xl font-bold text-gray-900">
                Actualizar información
            </h2>
            <form onsubmit={handleActualizarPerfil} class="mt-4 space-y-3">
                <div class="grid gap-3 sm:grid-cols-2">
                    <div>
                        <label
                            for="nombre"
                            class="mb-1 block text-sm font-semibold text-gray-700"
                            >Nombre</label
                        >
                        <input
                            id="nombre"
                            bind:value={editForm.nombre}
                            type="text"
                            class="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-[#CDB9FE]"
                        />
                    </div>
                    <div>
                        <label
                            for="apellido"
                            class="mb-1 block text-sm font-semibold text-gray-700"
                            >Apellido</label
                        >
                        <input
                            id="apellido"
                            bind:value={editForm.apellido}
                            type="text"
                            class="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-[#CDB9FE]"
                        />
                    </div>
                </div>
                <div class="grid gap-3 sm:grid-cols-2">
                    <div>
                        <label
                            for="edad"
                            class="mb-1 block text-sm font-semibold text-gray-700"
                            >Edad</label
                        >
                        <input
                            id="edad"
                            bind:value={editForm.edad}
                            type="number"
                            min="1"
                            class="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-[#CDB9FE]"
                        />
                    </div>
                    <div>
                        <label
                            for="telefono"
                            class="mb-1 block text-sm font-semibold text-gray-700"
                            >Teléfono</label
                        >
                        <input
                            id="telefono"
                            bind:value={editForm.telefono}
                            type="tel"
                            class="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-[#CDB9FE]"
                        />
                    </div>
                </div>
                <div>
                    <label
                        for="calle"
                        class="mb-1 block text-sm font-semibold text-gray-700"
                        >Calle / Carrera</label
                    >
                    <input
                        id="calle"
                        bind:value={editForm.calle}
                        type="text"
                        placeholder="Ej: Calle 22"
                        class="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-[#CDB9FE]"
                    />
                </div>
                <div class="grid gap-3 sm:grid-cols-2">
                    <div>
                        <label
                            for="numeroCalle"
                            class="mb-1 block text-sm font-semibold text-gray-700"
                            ># de calle</label
                        >
                        <input
                            id="numeroCalle"
                            bind:value={editForm.numeroCalle}
                            type="text"
                            class="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-[#CDB9FE]"
                        />
                    </div>
                    <div>
                        <label
                            for="complemento"
                            class="mb-1 block text-sm font-semibold text-gray-700"
                            >Complemento</label
                        >
                        <input
                            id="complemento"
                            bind:value={editForm.complemento}
                            type="text"
                            class="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-[#CDB9FE]"
                        />
                    </div>
                </div>
                <div>
                    <label
                        for="tipoVivienda"
                        class="mb-1 block text-sm font-semibold text-gray-700"
                        >Casa / Apto / Edificio</label
                    >
                    <input
                        id="tipoVivienda"
                        bind:value={editForm.tipoVivienda}
                        type="text"
                        class="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-[#CDB9FE]"
                    />
                </div>
                <div>
                    <label
                        for="sugerencias"
                        class="mb-1 block text-sm font-semibold text-gray-700"
                        >Sugerencias para llegar</label
                    >
                    <textarea
                        id="sugerencias"
                        bind:value={editForm.sugerencias}
                        rows="2"
                        class="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-[#CDB9FE]"
                    ></textarea>
                </div>
                {#if errorMsg}
                    <p class="text-sm text-red-700">{errorMsg}</p>
                {/if}
                <div class="flex gap-3 pt-2">
                    <button
                        type="submit"
                        disabled={loadingAction}
                        class="flex-1 rounded-2xl bg-[#CDB9FE] px-4 py-3 font-semibold text-gray-900 transition hover:bg-[#bfa3fd] disabled:opacity-70"
                    >
                        {loadingAction ? "Guardando..." : "Guardar cambios"}
                    </button>
                    <button
                        type="button"
                        onclick={() => (showEditForm = false)}
                        class="rounded-2xl border border-gray-200 px-4 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
                    >
                        Cancelar
                    </button>
                </div>
            </form>
        </div>
    </div>
{/if}

<!-- Modal: Desactivar cuenta -->
{#if showDeactivateConfirm}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
        <div class="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
            <h2 class="text-xl font-bold text-gray-900">¿Desactivar cuenta?</h2>
            <p class="mt-2 text-sm text-gray-500">
                Tu cuenta quedará inactiva. Podrás reactivarla iniciando sesión
                nuevamente.
            </p>
            <div class="mt-6 flex gap-3">
                <button
                    type="button"
                    onclick={handleDesactivarCuenta}
                    disabled={loadingAction}
                    class="flex-1 rounded-2xl bg-[#FFCDDB] px-4 py-3 font-semibold text-gray-900 transition hover:bg-[#ffb6c0] disabled:opacity-70"
                >
                    {loadingAction ? "Procesando..." : "Desactivar"}
                </button>
                <button
                    type="button"
                    onclick={() => (showDeactivateConfirm = false)}
                    class="flex-1 rounded-2xl border border-gray-200 px-4 py-3 font-semibold text-gray-700"
                >
                    Cancelar
                </button>
            </div>
        </div>
    </div>
{/if}

<!-- Modal: Eliminar cuenta (soft delete) -->
{#if showDeleteConfirm}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
        <div class="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
            <h2 class="text-xl font-bold text-gray-900">¿Eliminar cuenta?</h2>
            <p class="mt-2 text-sm text-gray-500">
                Tu cuenta será marcada como eliminada. El administrador aún
                tendrá acceso a tu historial para gestión interna.
            </p>
            <div class="mt-6 flex gap-3">
                <button
                    type="button"
                    onclick={handleEliminarCuenta}
                    disabled={loadingAction}
                    class="flex-1 rounded-2xl bg-red-100 px-4 py-3 font-semibold text-red-700 transition hover:bg-red-200 disabled:opacity-70"
                >
                    {loadingAction ? "Procesando..." : "Eliminar"}
                </button>
                <button
                    type="button"
                    onclick={() => (showDeleteConfirm = false)}
                    class="flex-1 rounded-2xl border border-gray-200 px-4 py-3 font-semibold text-gray-700"
                >
                    Cancelar
                </button>
            </div>
        </div>
    </div>
{/if}
