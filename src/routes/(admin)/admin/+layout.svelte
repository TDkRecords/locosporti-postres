<script>
    import Sidebar from "$lib/components/Sidebar.svelte";
    import BottomBar from "$lib/components/BottomBar.svelte";
    import { page } from "$app/stores";
    import { currentUser } from "$lib/stores.js";
    import { goto } from "$app/navigation";
    import { browser } from "$app/environment";

    let { children } = $props();
    let sidebarOpen = $state(false);
    let isLoginPage = $derived($page.url.pathname.endsWith("/login"));

    $effect(() => {
        if (!browser) return;
        if (isLoginPage) return;
        // undefined = Firebase todavía está restaurando la sesión guardada
        if ($currentUser === undefined) return;
        // null = Firebase ya confirmó que no hay sesión activa
        if ($currentUser === null) {
            goto("/admin/login");
        }
    });
</script>

<div class="min-h-screen">
    {#if $currentUser === undefined && !isLoginPage}
        <div class="flex min-h-screen items-center justify-center">
            <i class="fa-solid fa-spinner fa-spin text-3xl text-gray-400"></i>
        </div>
    {:else}
        {#if $currentUser && !isLoginPage}
            <Sidebar bind:open={sidebarOpen} />
            {#if sidebarOpen}
                <button
                    type="button"
                    aria-label="Cerrar menú"
                    onclick={() => (sidebarOpen = false)}
                    class="fixed inset-0 z-30 hidden cursor-default bg-black/40 lg:block"
                ></button>
            {/if}
        {/if}

        <main
            class="min-h-screen pb-20 transition-all duration-300 lg:pb-0"
            class:lg:ml-64={sidebarOpen}
            class:lg:ml-20={!sidebarOpen}
        >
            {@render children()}
        </main>

        {#if $currentUser && !isLoginPage}
            <BottomBar />
        {/if}
    {/if}
</div>
