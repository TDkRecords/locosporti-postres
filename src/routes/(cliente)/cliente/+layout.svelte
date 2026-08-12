<script>
    import ClientBottomBar from "$lib/components/ClientBottomBar.svelte";
    import { page } from "$app/stores";
    import { currentUser } from "$lib/stores.js";
    import { goto } from "$app/navigation";
    import { browser } from "$app/environment";

    let { children } = $props();

    let isRegistroPage = $derived($page.url.pathname.startsWith("/cliente/registro"));
    let isLoginPage = $derived($page.url.pathname === "/cliente");

    $effect(() => {
        if (!browser) return;
        if (isRegistroPage || isLoginPage) return;
        if ($currentUser === null) {
            goto("/cliente");
        }
    });
</script>

<div class="min-h-screen bg-[radial-gradient(circle_at_top_left,#FFFB96,#FFE28A_25%,#FFD2A8_70%)]">
    <main class="min-h-screen pb-20">
        {@render children()}
    </main>

    {#if $currentUser && !isRegistroPage}
        <ClientBottomBar />
    {/if}
</div>
