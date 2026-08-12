<script>
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";

    onMount(() => {
        goto("/cliente");
    });
</script>

<svelte:head>
    <title>Redirigiendo...</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-gray-50">
    <p class="text-gray-500">Redirigiendo al portal de clientes...</p>
</div>
