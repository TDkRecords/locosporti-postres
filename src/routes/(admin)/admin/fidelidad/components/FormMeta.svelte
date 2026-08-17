<script>
    let { open = $bindable(false), onSubmit } = $props();

    let form = $state({
        titulo: "",
        meta: "",
        caducidad: "",
        indefinida: false,
    });

    let loading = $state(false);

    function resetForm() {
        form = {
            titulo: "",
            meta: "",
            caducidad: "",
            indefinida: false,
        };
    }

    function close() {
        open = false;
        resetForm();
    }

    $effect(() => {
        if (!open) resetForm();
    });

    async function handleSubmit(event) {
        event.preventDefault();

        if (!form.titulo.trim() || !form.meta) return;

        loading = true;
        try {
            await onSubmit?.({
                titulo: form.titulo.trim(),
                meta: Number(form.meta),
                caducidad: form.indefinida ? null : form.caducidad || null,
                indefinida: form.indefinida,
            });
            close();
        } finally {
            loading = false;
        }
    }
</script>

{#if open}
    <div class="fixed inset-0 z-50 bg-black/40">
        <div
            class="absolute bottom-0 left-0 right-0 max-h-[95vh] overflow-y-auto rounded-t-3xl shadow-2xl animate-slide-up"
        >
            <form
                onsubmit={handleSubmit}
                class="mx-auto mt-3 flex w-full max-w-2xl flex-col gap-6 rounded-t-3xl border border-white/40 bg-white p-6 shadow-2xl"
            >
                <button
                    type="button"
                    class="flex w-full items-center gap-2 self-start rounded-2xl bg-[#CDB9FE] px-4 py-2 text-sm font-semibold text-gray-800 cursor-pointer"
                    onclick={close}
                >
                    <i class="fa-solid fa-arrow-left-long"></i>
                    <span>Volver a metas</span>
                </button>

                <div>
                    <h1 class="text-3xl font-bold text-gray-800">Nueva meta</h1>
                    <p class="mt-2 text-sm text-gray-500">
                        Define el premio y la cantidad de productos que un
                        cliente debe comprar mientras la meta esté activa.
                    </p>
                </div>

                <div>
                    <label
                        for="titulo"
                        class="mb-2 block text-sm font-semibold text-gray-700"
                    >
                        Título del premio
                    </label>
                    <input
                        id="titulo"
                        type="text"
                        bind:value={form.titulo}
                        placeholder="Ej. Postre gratis"
                        class="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-700 outline-none transition-all duration-200 focus:border-[#CDB9FE] focus:ring-4 focus:ring-[#CDB9FE]/20"
                    />
                </div>

                <div>
                    <label
                        for="meta"
                        class="mb-2 block text-sm font-semibold text-gray-700"
                    >
                        Productos requeridos para ganar
                    </label>
                    <input
                        id="meta"
                        type="number"
                        min="1"
                        bind:value={form.meta}
                        placeholder="Ej. 10"
                        class="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-700 outline-none transition-all duration-200 focus:border-[#CDB9FE] focus:ring-4 focus:ring-[#CDB9FE]/20"
                    />
                </div>

                <div>
                    <label
                        for="caducidad"
                        class="mb-2 block text-sm font-semibold text-gray-700"
                    >
                        Fecha de vencimiento
                    </label>
                    <input
                        id="caducidad"
                        type="date"
                        bind:value={form.caducidad}
                        disabled={form.indefinida}
                        class="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-700 outline-none transition-all duration-200 focus:border-[#CDB9FE] focus:ring-4 focus:ring-[#CDB9FE]/20 disabled:opacity-50"
                    />
                </div>

                <label class="flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" bind:checked={form.indefinida} />
                    Meta sin caducidad
                </label>

                <div class="rounded-2xl bg-[#FFFB96]/60 px-4 py-3">
                    <p class="text-xs text-gray-600">
                        <i class="fa-solid fa-circle-info mr-1.5"></i>
                        Solo cuentan los productos entregados desde que la meta se
                        crea hasta que se archiva o vence. Las compras anteriores
                        no suman.
                    </p>
                </div>

                <div
                    class="mt-2 flex flex-col gap-3 sm:flex-row sm:justify-end"
                >
                    <button
                        type="submit"
                        disabled={loading}
                        class="rounded-2xl bg-[#CDB9FE] px-6 py-3 font-semibold text-gray-800 shadow-lg transition-all duration-200 hover:-translate-y-1 hover:bg-[#bfa3fd] hover:shadow-xl active:scale-95 disabled:opacity-70"
                    >
                        {loading ? "Creando..." : "Crear meta"}
                    </button>

                    <button
                        type="button"
                        onclick={close}
                        class="rounded-2xl bg-white px-6 py-3 font-semibold text-gray-700 transition-all duration-200 hover:text-red-600"
                    >
                        Cancelar
                    </button>
                </div>
            </form>
        </div>
    </div>
{/if}

<style>
    @keyframes slideUp {
        from {
            transform: translateY(100%);
        }

        to {
            transform: translateY(0);
        }
    }

    .animate-slide-up {
        animation: slideUp 0.25s ease;
    }
</style>
