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
            location.reload();
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
    <header class="overflow-hidden rounded-3xl bg-white shadow-sm">
        <div class="p-5 sm:p-6">
            <div class="flex items-center gap-4">
                <div
                    class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#CDB9FE]/20 text-[#7C3AED]"
                >
                    <i class="fa-solid fa-user text-xl"></i>
                </div>

                <div class="min-w-0">
                    <p class="text-sm font-medium text-[#7C3AED]">Perfil</p>

                    <h1
                        class="mt-0.5 text-2xl font-bold text-gray-900 sm:text-3xl"
                    >
                        Mi perfil
                    </h1>

                    <p class="mt-1 text-sm text-gray-500">
                        Actualiza tus datos, administra tu cuenta y revisa tu
                        información personal.
                    </p>
                </div>
            </div>
        </div>
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

    <main class="grid gap-5 lg:grid-cols-[1.2fr_0.8fr] lg:gap-6">
        <!-- Perfil -->
        <section class="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
            <!-- Cabecera del perfil -->
            <div class="flex flex-col items-center text-center">
                {#if $currentUser?.photoURL}
                    <img
                        src={$currentUser.photoURL}
                        alt="Foto de perfil"
                        class="h-24 w-24 rounded-full object-cover ring-4 ring-[#CDB9FE]/30 sm:h-28 sm:w-28"
                    />
                {:else}
                    <div
                        class="flex h-24 w-24 items-center justify-center rounded-full bg-[#CDB9FE]/20 text-[#7C3AED] ring-4 ring-[#CDB9FE]/30 sm:h-28 sm:w-28"
                    >
                        <i class="fa-solid fa-user text-3xl sm:text-4xl"></i>
                    </div>
                {/if}

                <h2 class="mt-4 text-xl font-bold text-gray-900 sm:text-2xl">
                    {$clientProfile?.nombre || ""}
                    {$clientProfile?.apellido ||
                        $currentUser?.displayName ||
                        "Cliente"}
                </h2>

                <p class="mt-1 break-all text-sm text-gray-500">
                    {$currentUser?.email ?? "Sin correo registrado"}
                </p>
            </div>

            <!-- Información -->
            <div class="mt-8">
                <div class="border-b border-dashed border-gray-200 pb-5">
                    <p
                        class="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-400"
                    >
                        Información personal
                    </p>

                    <div class="space-y-4">
                        <div class="flex items-start gap-3">
                            <i
                                class="fa-solid fa-id-card mt-1 w-5 text-[#7C3AED]"
                            ></i>
                            <div>
                                <p class="text-xs text-gray-400">Nombre</p>
                                <p class="text-sm font-medium text-gray-800">
                                    {$clientProfile?.nombre || "—"}
                                    {$clientProfile?.apellido || ""}
                                </p>
                            </div>
                        </div>

                        <div class="flex items-start gap-3">
                            <i
                                class="fa-solid fa-cake-candles mt-1 w-5 text-[#7C3AED]"
                            ></i>
                            <div>
                                <p class="text-xs text-gray-400">Edad</p>
                                <p class="text-sm font-medium text-gray-800">
                                    {$clientProfile?.edad || "—"}
                                </p>
                            </div>
                        </div>

                        <div class="flex items-start gap-3">
                            <i class="fa-solid fa-phone mt-1 w-5 text-[#7C3AED]"
                            ></i>
                            <div>
                                <p class="text-xs text-gray-400">Teléfono</p>
                                <p class="text-sm font-medium text-gray-800">
                                    {$clientProfile?.telefono || "—"}
                                </p>
                            </div>
                        </div>

                        <div class="flex items-start gap-3">
                            <i
                                class="fa-solid fa-envelope mt-1 w-5 text-[#7C3AED]"
                            ></i>
                            <div class="min-w-0">
                                <p class="text-xs text-gray-400">Correo</p>
                                <p
                                    class="break-all text-sm font-medium text-gray-800"
                                >
                                    {$currentUser?.email || "—"}
                                </p>
                            </div>
                        </div>

                        <div class="flex items-start gap-3">
                            <i
                                class="fa-solid fa-location-dot mt-1 w-5 text-[#7C3AED]"
                            ></i>
                            <div>
                                <p class="text-xs text-gray-400">Dirección</p>
                                <p class="text-sm font-medium text-gray-800">
                                    {$clientProfile?.direccion ||
                                        "Sin dirección"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Notas -->
                {#if $clientProfile?.sugerencias}
                    <div class="border-b border-dashed border-gray-200 py-5">
                        <p
                            class="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400"
                        >
                            Notas
                        </p>

                        <p class="text-sm italic leading-relaxed text-gray-600">
                            {$clientProfile.sugerencias}
                        </p>
                    </div>
                {/if}
            </div>
        </section>

        <!-- Acciones -->
        <section class="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
            <h2 class="text-xl font-bold text-gray-900">Acciones de cuenta</h2>

            <div class="mt-5">
                <!-- Actualizar -->
                <button
                    type="button"
                    onclick={openEditForm}
                    class="flex w-full items-center gap-4 border-b border-dashed border-gray-200 py-4 text-left transition hover:bg-gray-50 cursor-pointer"
                >
                    <div
                        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#CDB9FE]/20 text-[#7C3AED]"
                    >
                        <i class="fa-solid fa-pencil"></i>
                    </div>

                    <div class="min-w-0 flex-1">
                        <p class="font-semibold text-gray-900">
                            Actualizar información
                        </p>
                        <p class="text-sm text-gray-500">
                            Edita tus datos personales.
                        </p>
                    </div>

                    <i class="fa-solid fa-chevron-right text-sm text-gray-300"
                    ></i>
                </button>

                <!-- Desactivar -->
                <button
                    type="button"
                    onclick={() => {
                        showDeactivateConfirm = true;
                        errorMsg = "";
                    }}
                    class="flex w-full items-center gap-4 border-b border-dashed border-gray-200 py-4 text-left transition hover:bg-gray-50 cursor-pointer"
                >
                    <div
                        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFCDDB]/40 text-[#D9466E]"
                    >
                        <i class="fa-solid fa-pause"></i>
                    </div>

                    <div class="min-w-0 flex-1">
                        <p class="font-semibold text-gray-900">
                            Desactivar cuenta
                        </p>
                        <p class="text-sm text-gray-500">
                            Suspende temporalmente tu cuenta.
                        </p>
                    </div>

                    <i class="fa-solid fa-chevron-right text-sm text-gray-300"
                    ></i>
                </button>

                <!-- Eliminar -->
                <button
                    type="button"
                    onclick={() => {
                        showDeleteConfirm = true;
                        errorMsg = "";
                    }}
                    class="flex w-full items-center gap-4 border-b border-dashed border-gray-200 py-4 text-left transition hover:bg-gray-50 cursor-pointer"
                >
                    <div
                        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFE28A]/40 text-[#B7791F]"
                    >
                        <i class="fa-solid fa-trash"></i>
                    </div>

                    <div class="min-w-0 flex-1">
                        <p class="font-semibold text-gray-900">
                            Eliminar cuenta
                        </p>
                        <p class="text-sm text-gray-500">
                            Elimina permanentemente tu cuenta.
                        </p>
                    </div>

                    <i class="fa-solid fa-chevron-right text-sm text-gray-300"
                    ></i>
                </button>

                <!-- Cerrar sesión -->
                <button
                    type="button"
                    onclick={handleLogout}
                    class="flex w-full items-center gap-4 py-4 text-left transition hover:bg-gray-50 cursor-pointer"
                >
                    <div
                        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-600"
                    >
                        <i class="fa-solid fa-right-from-bracket"></i>
                    </div>

                    <div class="min-w-0 flex-1">
                        <p class="font-semibold text-gray-900">Cerrar sesión</p>
                        <p class="text-sm text-gray-500">
                            Sal de tu cuenta en este dispositivo.
                        </p>
                    </div>

                    <i class="fa-solid fa-chevron-right text-sm text-gray-300"
                    ></i>
                </button>
            </div>
        </section>
    </main>
</div>

<!-- Modal: Editar perfil -->
{#if showEditForm}
    <div
        class="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px] flex items-end justify-center sm:items-center p-0 sm:p-4"
    >
        <div
            class="w-full max-w-xl rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl max-h-[92vh] flex flex-col overflow-hidden"
        >
            <!-- Header -->
            <div class="border-b border-gray-100 p-5 sm:p-6">
                <div class="flex items-center gap-4">
                    <div
                        class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#CDB9FE]/20 text-[#7C3AED]"
                    >
                        <i class="fa-solid fa-user-pen text-xl"></i>
                    </div>

                    <div class="min-w-0">
                        <p class="text-sm font-medium text-[#7C3AED]">Perfil</p>

                        <h2 class="mt-0.5 text-2xl font-bold text-gray-900">
                            Actualizar información
                        </h2>

                        <p class="mt-1 text-sm text-gray-500">
                            Mantén tus datos actualizados para facilitar tus
                            entregas.
                        </p>
                    </div>
                </div>
            </div>

            <!-- Contenido -->
            <form
                id="edit-profile-form"
                onsubmit={handleActualizarPerfil}
                class="flex-1 overflow-y-auto p-5 sm:p-6"
            >
                <div class="space-y-6">
                    <!-- Datos personales -->
                    <section
                        class="border-b border-dashed border-gray-200 pb-6"
                    >
                        <p
                            class="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-400"
                        >
                            Datos personales
                        </p>

                        <div class="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label
                                    for="nombre"
                                    class="mb-2 block text-sm font-medium text-gray-700"
                                >
                                    Nombre
                                </label>
                                <input
                                    id="nombre"
                                    bind:value={editForm.nombre}
                                    type="text"
                                    class="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 transition focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#CDB9FE]/30 outline-none"
                                />
                            </div>

                            <div>
                                <label
                                    for="apellido"
                                    class="mb-2 block text-sm font-medium text-gray-700"
                                >
                                    Apellido
                                </label>
                                <input
                                    id="apellido"
                                    bind:value={editForm.apellido}
                                    type="text"
                                    class="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 transition focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#CDB9FE]/30 outline-none"
                                />
                            </div>

                            <div>
                                <label
                                    for="edad"
                                    class="mb-2 block text-sm font-medium text-gray-700"
                                >
                                    Edad
                                </label>
                                <input
                                    id="edad"
                                    bind:value={editForm.edad}
                                    type="number"
                                    min="1"
                                    class="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 transition focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#CDB9FE]/30 outline-none"
                                />
                            </div>

                            <div>
                                <label
                                    for="telefono"
                                    class="mb-2 block text-sm font-medium text-gray-700"
                                >
                                    Teléfono
                                </label>
                                <input
                                    id="telefono"
                                    bind:value={editForm.telefono}
                                    type="tel"
                                    class="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 transition focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#CDB9FE]/30 outline-none"
                                />
                            </div>
                        </div>
                    </section>

                    <!-- Dirección -->
                    <section
                        class="border-b border-dashed border-gray-200 pb-6"
                    >
                        <p
                            class="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-400"
                        >
                            Dirección
                        </p>

                        <div class="space-y-4">
                            <div>
                                <label
                                    for="calle"
                                    class="mb-2 block text-sm font-medium text-gray-700"
                                >
                                    Calle o Carrera
                                </label>
                                <input
                                    id="calle"
                                    bind:value={editForm.calle}
                                    type="text"
                                    placeholder="Ej: Calle 22"
                                    class="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 transition focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#CDB9FE]/30 outline-none"
                                />
                            </div>

                            <div class="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label
                                        for="numeroCalle"
                                        class="mb-2 block text-sm font-medium text-gray-700"
                                    >
                                        Número
                                    </label>
                                    <input
                                        id="numeroCalle"
                                        bind:value={editForm.numeroCalle}
                                        type="text"
                                        class="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 transition focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#CDB9FE]/30 outline-none"
                                    />
                                </div>

                                <div>
                                    <label
                                        for="complemento"
                                        class="mb-2 block text-sm font-medium text-gray-700"
                                    >
                                        Complemento
                                    </label>
                                    <input
                                        id="complemento"
                                        bind:value={editForm.complemento}
                                        type="text"
                                        placeholder="Apto, piso..."
                                        class="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 transition focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#CDB9FE]/30 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label
                                    for="tipoVivienda"
                                    class="mb-2 block text-sm font-medium text-gray-700"
                                >
                                    Casa, apartamento o edificio
                                </label>
                                <input
                                    id="tipoVivienda"
                                    bind:value={editForm.tipoVivienda}
                                    type="text"
                                    class="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 transition focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#CDB9FE]/30 outline-none"
                                />
                            </div>
                        </div>
                    </section>

                    <!-- Indicaciones -->
                    <section>
                        <p
                            class="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-400"
                        >
                            Indicaciones adicionales
                        </p>

                        <div>
                            <label
                                for="sugerencias"
                                class="mb-2 block text-sm font-medium text-gray-700"
                            >
                                Sugerencias para llegar
                            </label>

                            <textarea
                                id="sugerencias"
                                bind:value={editForm.sugerencias}
                                rows="3"
                                placeholder="Ej: Casa de esquina con portón negro..."
                                class="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 transition focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-[#CDB9FE]/30 outline-none resize-none"
                            ></textarea>
                        </div>
                    </section>

                    {#if errorMsg}
                        <div
                            class="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                        >
                            <i class="fa-solid fa-circle-exclamation mr-2"></i>
                            {errorMsg}
                        </div>
                    {/if}
                </div>
            </form>

            <!-- Footer fijo -->
            <div class="border-t border-gray-100 bg-white p-5">
                <div class="flex flex-col-reverse gap-3 sm:flex-row">
                    <button
                        type="button"
                        onclick={() => (showEditForm = false)}
                        class="w-full rounded-2xl border border-gray-200 px-4 py-3 font-semibold text-gray-700 transition hover:bg-gray-50 sm:w-auto"
                    >
                        Cancelar
                    </button>

                    <button
                        type="submit"
                        disabled={loadingAction}
                        class="w-full flex-1 rounded-2xl bg-[#CDB9FE] px-4 py-3 font-semibold text-gray-900 transition hover:bg-[#bfa3fd] disabled:opacity-70 cursor-pointer"
                        form="edit-profile-form"
                    >
                        {loadingAction ? "Guardando..." : "Guardar cambios"}
                    </button>
                </div>
            </div>
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
