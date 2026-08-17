<script>
    let { open = $bindable(false), meta = null, onConfirm } = $props();

    function close() {
        open = false;
    }

    function confirm() {
        if (!meta) return;

        onConfirm?.(meta);
        open = false;
    }
</script>

{#if open && meta}
    <div
        class="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
    >
        <button
            type="button"
            aria-label="Cancelar"
            onclick={close}
            class="absolute inset-0 cursor-default"
        ></button>

        <div
            class="relative z-10 w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl sm:p-6"
        >
            <div
                class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50"
            >
                <i class="fa-solid fa-box-archive text-xl text-red-500"></i>
            </div>

            <div class="mt-4 text-center">
                <h2 class="text-lg font-bold text-gray-800 sm:text-xl">
                    ¿Archivar "{meta.titulo}"?
                </h2>

                <p class="mt-2 text-sm leading-relaxed text-gray-500">
                    La meta pasará al historial y dejará de sumar compras. El
                    progreso actual de los clientes en esta meta quedará
                    registrado, pero no aplicará a futuras metas.
                </p>
            </div>

            <div class="mt-6 grid grid-cols-2 gap-3">
                <button
                    type="button"
                    onclick={close}
                    class="cursor-pointer rounded-2xl bg-gray-100 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-200"
                >
                    Cancelar
                </button>

                <button
                    type="button"
                    onclick={confirm}
                    class="cursor-pointer rounded-2xl bg-red-500 py-3 text-sm font-semibold text-white transition hover:bg-red-600"
                >
                    Archivar
                </button>
            </div>
        </div>
    </div>
{/if}
