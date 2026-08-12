<script>
    import { uploadImage } from "$lib/upload.js";

    let { open = $bindable(false), pedido = null, onConfirm, onCancel } = $props();

    let uploading = $state(false);
    let previewUrl = $state("");
    let fileToUpload = $state(null);
    let error = $state("");

    function close() {
        open = false;
        reset();
        onCancel?.();
    }

    function reset() {
        previewUrl = "";
        fileToUpload = null;
        uploading = false;
        error = "";
    }

    $effect(() => {
        if (!open) {
            reset();
        }
    });

    function handleFileChange(event) {
        const file = event.target.files[0];
        if (!file) return;

        fileToUpload = file;
        previewUrl = URL.createObjectURL(file);
    }

    async function handleConfirm() {
        if (!fileToUpload) {
            error = "Por favor selecciona una imagen como comprobante.";
            return;
        }

        uploading = true;
        error = "";
        try {
            const url = await uploadImage(fileToUpload);
            await onConfirm(url);
            open = false;
            reset();
        } catch (err) {
            console.error(err);
            error = "Error al subir la imagen. Intenta nuevamente.";
            uploading = false;
        }
    }
</script>

{#if open}
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div class="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-fade-in">
            <h2 class="text-xl font-bold text-gray-900">Confirmar entrega</h2>
            <p class="mt-2 text-sm text-gray-500">
                Sube el registro fotográfico para confirmar que el pedido 
                {#if pedido}
                    <span class="font-bold text-gray-700">#{pedido.numero ?? pedido.id.slice(-6)}</span>
                {/if}
                fue entregado exitosamente.
            </p>

            <div class="mt-6">
                <label class="mb-2 block text-sm font-semibold text-gray-700">
                    Evidencia fotográfica
                </label>

                {#if previewUrl}
                    <div class="relative mb-4">
                        <img
                            src={previewUrl}
                            alt="Vista previa"
                            class="h-48 w-full rounded-2xl object-cover border border-gray-200"
                        />
                        <button
                            type="button"
                            onclick={() => {
                                fileToUpload = null;
                                previewUrl = "";
                            }}
                            class="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600 transition hover:bg-red-200"
                        >
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                {/if}

                {#if !previewUrl}
                    <div class="relative flex h-32 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#CDB9FE] bg-[#CDB9FE]/10 transition hover:bg-[#CDB9FE]/20">
                        <i class="fa-solid fa-camera text-3xl text-[#7c4dff]"></i>
                        <span class="mt-2 text-sm font-semibold text-[#7c4dff]">Tomar o subir foto</span>
                        <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onchange={handleFileChange}
                            class="absolute inset-0 cursor-pointer opacity-0"
                        />
                    </div>
                {/if}

                {#if error}
                    <p class="mt-3 text-sm text-red-600">{error}</p>
                {/if}
            </div>

            <div class="mt-6 flex gap-3">
                <button
                    type="button"
                    disabled={uploading || !fileToUpload}
                    onclick={handleConfirm}
                    class="flex-1 rounded-2xl bg-green-100 px-4 py-3 font-semibold text-green-700 transition hover:bg-green-200 disabled:opacity-50"
                >
                    {uploading ? "Subiendo..." : "Confirmar"}
                </button>
                <button
                    type="button"
                    disabled={uploading}
                    onclick={close}
                    class="flex-1 rounded-2xl border border-gray-200 px-4 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                    Cancelar
                </button>
            </div>
        </div>
    </div>
{/if}

<style>
    @keyframes fadeIn {
        from { opacity: 0; transform: scale(0.95); }
        to { opacity: 1; transform: scale(1); }
    }
    .animate-fade-in {
        animation: fadeIn 0.2s ease-out;
    }
</style>
