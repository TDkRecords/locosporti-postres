<script>
    import { onMount } from "svelte";

    const BLOG_URL = "https://locosporti.netlify.app/blog";

    let posts = $state([]);
    let loading = $state(true);
    let error = $state("");

    onMount(async () => {
        try {
            const response = await fetch(BLOG_URL);
            if (!response.ok) {
                throw new Error("La landing del blog no está disponible.");
            }

            const html = await response.text();
            const titulos = [
                ...html.matchAll(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/gi),
            ].map((match) => match[1].replace(/<[^>]+>/g, "").trim());

            posts = titulos.slice(0, 6).map((title, index) => ({
                id: index + 1,
                title,
                excerpt:
                    "Actualización publicada en la landing oficial del negocio.",
                tags: ["Landing", "Actualización"],
            }));

            if (posts.length === 0) {
                throw new Error("No se encontraron entradas en la landing.");
            }
        } catch (err) {
            console.error(err);
            error =
                "No pudimos cargar el blog desde la landing. Mostramos contenido de ejemplo.";
            posts = [
                /* 
                {
                    id: 1,
                    title: "Próximo stock de brownies",
                    excerpt: "Nueva tanda disponible esta semana.",
                    tags: ["Stock", "Novedades"],
                },
                {
                    id: 2,
                    title: "Política de domicilios actualizada",
                    excerpt: "Consulta los cambios en tiempos y cobertura.",
                    tags: ["Política", "Domicilios"],
                },
             */
            ];
        } finally {
            loading = false;
        }
    });
</script>

<svelte:head>
    <title>Blog | Locos por ti</title>
</svelte:head>

<div class="space-y-6 p-4 sm:p-6">
    <header class="rounded-3xl bg-white p-5 shadow-sm">
        <p
            class="text-sm font-semibold uppercase tracking-[0.2em] text-[#CDB9FE]"
        >
            Blog
        </p>
        <h1 class="mt-2 text-3xl font-bold text-gray-900">
            Noticias sobre Locos por ti
        </h1>
        <p class="mt-2 text-sm text-gray-500">
            Las novedades se consultan desde
            <a
                class="font-semibold text-[#7c4dff] underline"
                href={BLOG_URL}
                target="_blank"
                rel="noopener">locosporti.netlify.app/blog</a
            >.
        </p>
    </header>

    {#if loading}
        <div class="rounded-3xl bg-white p-8 text-center shadow-sm">
            <p class="text-gray-500">Cargando actualizaciones...</p>
        </div>
    {:else}
        {#if error}
            <p
                class="rounded-2xl bg-[#FFE28A]/60 px-4 py-3 text-sm text-gray-700"
            >
                {error}
            </p>
        {/if}

        <section class="grid gap-4 lg:grid-cols-2">
            {#each posts as post}
                <article
                    class="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                    <div class="flex items-center justify-between gap-3">
                        <h2 class="text-xl font-bold text-gray-900">
                            {post.title}
                        </h2>
                        <span
                            class="rounded-full bg-[#FFFB96]/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-gray-700"
                        >
                            Post
                        </span>
                    </div>
                    <p class="mt-4 text-sm leading-6 text-gray-600">
                        {post.excerpt}
                    </p>
                    <div class="mt-5 flex flex-wrap gap-2">
                        {#each post.tags as tag}
                            <span
                                class="rounded-full bg-[#CDB9FE]/20 px-3 py-1 text-xs font-semibold text-gray-800"
                            >
                                {tag}
                            </span>
                        {/each}
                    </div>
                </article>
            {/each}
        </section>
    {/if}
</div>
