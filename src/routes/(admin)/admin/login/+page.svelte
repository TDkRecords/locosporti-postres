<script>
    import { signInAdminWithEmail } from "$lib/firebase.js";
    import { goto } from "$app/navigation";

    let usuario = $state("");
    let password = $state("");
    let mostrarPassword = $state(false);
    let loading = $state(false);
    let error = $state("");

    async function handleSubmit(event) {
        event.preventDefault();
        error = "";
        loading = true;

        try {
            await signInAdminWithEmail(usuario, password);
            goto("/admin");
        } catch (err) {
            console.error(err);
            error = "Usuario o contraseña inválidos.";
        } finally {
            loading = false;
        }
    }
</script>

<svelte:head>
    <title>Admin | Iniciar sesión</title>
</svelte:head>

<div class="min-h-screen px-4 py-8">
    <div class="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div
            class="w-full max-w-md rounded-3xl border border-white/40 bg-white p-6 shadow-2xl sm:p-8"
        >
            <div class="mb-8 text-center">
                <div
                    class="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-[#CDB9FE]"
                >
                    <i class="fa-solid fa-user text-3xl text-gray-800"></i>
                </div>

                <h1 class="text-3xl font-bold text-gray-800">
                    Locos por ti
                </h1>
                <p class="mt-2 text-sm text-gray-500">
                    Accede con tus credenciales de administrador.
                </p>
            </div>

            <form onsubmit={handleSubmit} class="flex flex-col gap-5">
                <div>
                    <label
                        for="usuario"
                        class="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700"
                        >Correo</label
                    >
                    <div class="relative">
                        <i
                            class="fa-solid fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                        ></i>
                        <input
                            id="usuario"
                            bind:value={usuario}
                            type="email"
                            placeholder="admin@tuempresa.com"
                            autocomplete="username"
                            class="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-gray-700 placeholder:text-gray-400 outline-none transition-all duration-200 focus:border-[#CDB9FE] focus:ring-4 focus:ring-[#CDB9FE]/20"
                        />
                    </div>
                </div>

                <div>
                    <div class="mb-2 flex items-center justify-between">
                        <label
                            for="password"
                            class="flex items-center gap-2 text-sm font-semibold text-gray-700"
                            >Contraseña</label
                        >
                    </div>

                    <div class="relative">
                        <i
                            class="fa-solid fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                        ></i>
                        <input
                            id="password"
                            bind:value={password}
                            type={mostrarPassword ? "text" : "password"}
                            placeholder="Ingresa tu contraseña"
                            autocomplete="current-password"
                            class="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-11 pr-12 text-gray-700 placeholder:text-gray-400 outline-none transition-all duration-200 focus:border-[#CDB9FE] focus:ring-4 focus:ring-[#CDB9FE]/20"
                        />
                        <button
                            type="button"
                            aria-label={mostrarPassword
                                ? "Ocultar contraseña"
                                : "Mostrar contraseña"}
                            onclick={() => (mostrarPassword = !mostrarPassword)}
                            class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-700"
                        >
                            <i
                                class={mostrarPassword
                                    ? "fa-solid fa-eye-slash"
                                    : "fa-solid fa-eye"}
                            ></i>
                        </button>
                    </div>
                </div>

                {#if error}
                    <p
                        class="rounded-2xl bg-red-100 px-4 py-3 text-sm text-red-700"
                    >
                        {error}
                    </p>
                {/if}

                <button
                    type="submit"
                    class="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#CDB9FE] px-6 py-3 font-semibold text-gray-800 shadow-lg transition-all duration-200 hover:-translate-y-1 hover:bg-[#bfa3fd] hover:shadow-xl active:scale-95"
                    disabled={loading}
                >
                    <i class="fa-solid fa-right-to-bracket"></i>
                    {#if loading}Cargando...{:else}Iniciar sesión{/if}
                </button>
            </form>
        </div>
    </div>
</div>
