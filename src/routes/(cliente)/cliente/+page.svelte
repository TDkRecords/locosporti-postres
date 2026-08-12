<script>
    import { signInWithGoogle } from "$lib/firebase.js";
    import { currentUser, clientProfile } from "$lib/stores.js";
    import { goto } from "$app/navigation";
    import { isProfileComplete } from "$lib/firestore.js";

    let error = $state("");
    let loading = $state(false);

    // If already logged in with complete profile → go home
    $effect(() => {
        if ($currentUser && $clientProfile !== undefined) {
            if (isProfileComplete($clientProfile)) {
                goto("/cliente/home");
            } else if ($currentUser && $clientProfile === null) {
                // signed in but no profile → registration
                goto("/cliente/registro");
            }
        }
    });

    async function handleGoogle() {
        error = "";
        loading = true;

        try {
            await signInWithGoogle();
            // hooks.client.js will set clientProfile, $effect above will navigate
        } catch (err) {
            console.error(err);
            error = "No se pudo iniciar sesión con Google. Intenta nuevamente.";
        } finally {
            loading = false;
        }
    }
</script>

<svelte:head>
    <title>Locos por ti | Iniciar sesión</title>
</svelte:head>

<div class="px-4 py-10 pt-[10vh] text-gray-900">
    <div class="mx-auto max-w-xl rounded-4xl border border-white/60 bg-white/95 p-8 shadow-2xl backdrop-blur-sm">
        <div class="mb-8 text-center">
            <div class="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-[#CDB9FE] text-3xl text-gray-800">
                <i class="fa-solid fa-heart"></i>
            </div>
            <h1 class="text-4xl font-bold">Locos por ti</h1>
            <p class="mt-3 text-sm text-gray-600">
                Inicia sesión con Google para continuar y acceder al catálogo de postres.
            </p>
        </div>

        <button
            type="button"
            class="flex w-full items-center justify-center gap-3 rounded-3xl bg-black px-5 py-4 text-white transition hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-70"
            onclick={handleGoogle}
            disabled={loading}
        >
            <i class="fa-brands fa-google text-xl"></i>
            {#if loading}
                Autenticando...
            {:else}
                Iniciar sesión con Google
            {/if}
        </button>

        {#if error}
            <p class="mt-5 rounded-2xl bg-red-100 px-4 py-3 text-sm text-red-700">
                {error}
            </p>
        {/if}

        <div class="mt-8 text-center text-sm text-gray-500">
            Al ingresar aceptas nuestros
            <a class="underline" href="/terminos" rel="noopener">Términos de Servicio</a>
            y
            <a class="underline" href="/privacidad" rel="noopener">Política de Privacidad</a>.
        </div>
    </div>
</div>
