<script>
    import { currentUser, clientProfile } from "$lib/stores.js";
    import { goto } from "$app/navigation";
    import { saveClienteProfile, isProfileComplete } from "$lib/firestore.js";

    let paso = $state(1);

    let nombre = $state("");
    let apellido = $state("");
    let edad = $state("");

    let calle = $state("");
    let numeroCalle = $state("");
    let complemento = $state("");
    let tipoVivienda = $state("");
    let sugerencias = $state("");

    let aceptaTerminos = $state(false);
    let error = $state("");
    let loading = $state(false);

    // Si no hay usuario autenticado → volver al login
    $effect(() => {
        if ($currentUser === null) {
            goto("/");
        }
    });

    // Si el perfil ya está completo → ir al home
    $effect(() => {
        if ($clientProfile && isProfileComplete($clientProfile)) {
            goto("/cliente/home");
        }
    });

    function siguientePaso() {
        error = "";
        if (paso === 1) {
            if (!nombre.trim() || !apellido.trim() || !String(edad).trim()) {
                error = "Completa nombre, apellido y edad para continuar.";
                return;
            }
            paso = 2;
            return;
        }

        if (paso === 2) {
            if (!calle.trim() || !numeroCalle.trim() || !tipoVivienda.trim()) {
                error = "Completa la dirección principal para continuar.";
                return;
            }
            paso = 3;
        }
    }

    function pasoAnterior() {
        error = "";
        if (paso > 1) paso -= 1;
    }

    async function completarRegistro(event) {
        event.preventDefault();
        error = "";

        if (!aceptaTerminos) {
            error = "Debes aceptar los términos, condiciones y tratamiento de datos.";
            return;
        }

        if (!$currentUser?.uid) {
            error = "No hay sesión activa. Por favor inicia sesión nuevamente.";
            return;
        }

        loading = true;
        try {
            const direccionCompleta = `${calle} #${numeroCalle}${complemento ? ` - ${complemento}` : ""}, ${tipoVivienda}`;

            const newProfile = await saveClienteProfile($currentUser.uid, {
                nombre: nombre.trim(),
                apellido: apellido.trim(),
                edad: Number(edad),
                email: $currentUser.email || "",
                photoURL: $currentUser.photoURL || "",
                direccion: direccionCompleta,
                calle: calle.trim(),
                numeroCalle: numeroCalle.trim(),
                complemento: complemento.trim(),
                tipoVivienda: tipoVivienda.trim(),
                sugerencias: sugerencias.trim(),
                estado: "activo",
                createdAt: new Date().toISOString(),
                changeLog: [],
            });

            clientProfile.set(newProfile);

            goto("/cliente/home");
        } catch (err) {
            console.error(err);
            error = "No se pudo completar el registro. Intenta nuevamente.";
        } finally {
            loading = false;
        }
    }
</script>

<svelte:head>
    <title>Registro | Locos por ti</title>
</svelte:head>

<div class="px-4 py-8 sm:px-6">
    <div class="mx-auto max-w-xl rounded-4xl border border-white/60 bg-white/95 p-6 shadow-2xl sm:p-8">
        <div class="mb-8 text-center">
            <div
                class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-[#CDB9FE] text-2xl text-gray-800"
            >
                <i class="fa-solid fa-user-plus"></i>
            </div>
            <h1 class="text-2xl font-bold text-gray-900">Completa tu registro</h1>
            <p class="mt-2 text-sm text-gray-500">
                Paso {paso} de 3 · {$currentUser?.email ?? "Cuenta Google"}
            </p>
        </div>

        <div class="mb-8 flex gap-2">
            {#each [1, 2, 3] as step}
                <div
                    class="h-2 flex-1 rounded-full transition-colors"
                    class:bg-[#CDB9FE]={paso >= step}
                    class:bg-gray-200={paso < step}
                ></div>
            {/each}
        </div>

        {#if paso === 1}
            <form
                class="space-y-4"
                onsubmit={(event) => {
                    event.preventDefault();
                    siguientePaso();
                }}
            >
                <div>
                    <label for="nombre" class="mb-2 block text-sm font-semibold text-gray-700"
                        >Nombre</label
                    >
                    <input
                        id="nombre"
                        bind:value={nombre}
                        type="text"
                        placeholder="Tu nombre"
                        class="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-[#CDB9FE] focus:ring-4 focus:ring-[#CDB9FE]/20"
                    />
                </div>
                <div>
                    <label for="apellido" class="mb-2 block text-sm font-semibold text-gray-700"
                        >Apellido</label
                    >
                    <input
                        id="apellido"
                        bind:value={apellido}
                        type="text"
                        placeholder="Tu apellido"
                        class="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-[#CDB9FE] focus:ring-4 focus:ring-[#CDB9FE]/20"
                    />
                </div>
                <div>
                    <label for="edad" class="mb-2 block text-sm font-semibold text-gray-700"
                        >Edad</label
                    >
                    <input
                        id="edad"
                        bind:value={edad}
                        type="number"
                        min="1"
                        placeholder="Tu edad"
                        class="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-[#CDB9FE] focus:ring-4 focus:ring-[#CDB9FE]/20"
                    />
                </div>
                <button
                    type="submit"
                    class="w-full rounded-2xl bg-[#CDB9FE] px-4 py-3 font-semibold text-gray-900 transition hover:bg-[#bfa3fd]"
                >
                    Siguiente
                </button>
            </form>
        {:else if paso === 2}
            <form
                class="space-y-4"
                onsubmit={(event) => {
                    event.preventDefault();
                    siguientePaso();
                }}
            >
                <div>
                    <label for="calle" class="mb-2 block text-sm font-semibold text-gray-700"
                        >Calle, carrera, mnz o diagonal</label
                    >
                    <input
                        id="calle"
                        bind:value={calle}
                        type="text"
                        placeholder="Ej: Calle 22"
                        class="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-[#CDB9FE] focus:ring-4 focus:ring-[#CDB9FE]/20"
                    />
                </div>
                <div>
                    <label
                        for="numeroCalle"
                        class="mb-2 block text-sm font-semibold text-gray-700"
                        ># de calle</label
                    >
                    <input
                        id="numeroCalle"
                        bind:value={numeroCalle}
                        type="text"
                        placeholder="Ej: 1 - 30"
                        class="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-[#CDB9FE] focus:ring-4 focus:ring-[#CDB9FE]/20"
                    />
                </div>
                <div>
                    <label
                        for="complemento"
                        class="mb-2 block text-sm font-semibold text-gray-700"
                        >Complemento de calle <span class="font-normal text-gray-400">(opcional)</span></label
                    >
                    <input
                        id="complemento"
                        bind:value={complemento}
                        type="text"
                        placeholder="Opcional"
                        class="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-[#CDB9FE] focus:ring-4 focus:ring-[#CDB9FE]/20"
                    />
                </div>
                <div>
                    <label
                        for="tipoVivienda"
                        class="mb-2 block text-sm font-semibold text-gray-700"
                        >Casa, condominio, edificio, piso, apto o tienda</label
                    >
                    <input
                        id="tipoVivienda"
                        bind:value={tipoVivienda}
                        type="text"
                        placeholder="Ej: Condominio Los Pinos, Apto 304"
                        class="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-[#CDB9FE] focus:ring-4 focus:ring-[#CDB9FE]/20"
                    />
                </div>
                <div>
                    <label
                        for="sugerencias"
                        class="mb-2 block text-sm font-semibold text-gray-700"
                        >Sugerencias para llegar <span class="font-normal text-gray-400">(opcional)</span></label
                    >
                    <textarea
                        id="sugerencias"
                        bind:value={sugerencias}
                        rows="3"
                        placeholder="Ej: Portería color verde, timbre 304"
                        class="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-[#CDB9FE] focus:ring-4 focus:ring-[#CDB9FE]/20"
                    ></textarea>
                </div>
                <div class="flex gap-3">
                    <button
                        type="button"
                        onclick={pasoAnterior}
                        class="flex-1 rounded-2xl border border-gray-200 px-4 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
                    >
                        Atrás
                    </button>
                    <button
                        type="submit"
                        class="flex-1 rounded-2xl bg-[#CDB9FE] px-4 py-3 font-semibold text-gray-900 transition hover:bg-[#bfa3fd]"
                    >
                        Siguiente
                    </button>
                </div>
            </form>
        {:else}
            <form class="space-y-4" onsubmit={completarRegistro}>
                <div class="rounded-2xl bg-[#FFFB96]/60 p-4 text-sm text-gray-700">
                    <p class="font-semibold">Dirección registrada:</p>
                    <p class="mt-2">
                        {calle} #{numeroCalle}{complemento ? ` - ${complemento}` : ""}, {tipoVivienda}
                    </p>
                    {#if sugerencias}
                        <p class="mt-2 text-gray-500">{sugerencias}</p>
                    {/if}
                </div>

                <label class="flex items-start gap-3 rounded-2xl border border-gray-200 p-4">
                    <input
                        type="checkbox"
                        bind:checked={aceptaTerminos}
                        class="mt-1 h-4 w-4 rounded border-gray-300 text-[#CDB9FE] focus:ring-[#CDB9FE]"
                    />
                    <span class="text-sm text-gray-700">
                        Acepto los términos, condiciones y el tratamiento de mis datos personales.
                    </span>
                </label>

                <div class="flex gap-3">
                    <button
                        type="button"
                        onclick={pasoAnterior}
                        class="flex-1 rounded-2xl border border-gray-200 px-4 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
                    >
                        Atrás
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        class="flex-1 rounded-2xl bg-[#CDB9FE] px-4 py-3 font-semibold text-gray-900 transition hover:bg-[#bfa3fd] disabled:opacity-70"
                    >
                        {loading ? "Guardando..." : "Finalizar registro"}
                    </button>
                </div>
            </form>
        {/if}

        {#if error}
            <p class="mt-4 rounded-2xl bg-red-100 px-4 py-3 text-sm text-red-700">{error}</p>
        {/if}
    </div>
</div>
