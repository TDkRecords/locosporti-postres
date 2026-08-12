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
        // don't redirect while on the login page
        if (isLoginPage) return;
        // if no user (null or undefined) redirect to login
        if (!$currentUser) {
            goto("/admin/login");
        }
    });
</script>

<div class="min-h-screen">
    {#if $currentUser && !isLoginPage}
        <!-- Sidebar PC -->
        <Sidebar bind:open={sidebarOpen} />

        <!-- Overlay Sidebar -->
        {#if sidebarOpen}
            <button
                type="button"
                aria-label="Cerrar menú"
                onclick={() => (sidebarOpen = false)}
                class="fixed inset-0 z-30 hidden cursor-default bg-black/40 lg:block"
            ></button>
        {/if}
    {/if}

    <!-- Contenido -->
    <main
        class="min-h-screen pb-20 transition-all duration-300 lg:pb-0"
        class:lg:ml-64={sidebarOpen}
        class:lg:ml-20={!sidebarOpen}
    >
        {@render children()}
    </main>

    {#if $currentUser && !isLoginPage}
        <!-- BottomBar móvil/tablet -->
        <BottomBar />
    {/if}
</div>
