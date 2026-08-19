<script>
    import { uploadImage } from "$lib/upload.js";

    let { open = $bindable(false), producto = null, onSubmit } = $props();

    let form = $state({
        nombre: "",
        costo: "",
        precio: "",
        stock: "",
        categoria: "",
        descripcion: "",
        fecha: "",
        estado: "disponible",
        imagen: "",
    });

    let isEditing = $derived(Boolean(producto));
    let uploadingImage = $state(false);

    let ingresosTotales = $derived(
        (Number(form.precio) || 0) * (Number(form.stock) || 0),
    );
    let costoTotal = $derived(Number(form.costo) || 0);
    let ganancia = $derived(ingresosTotales - costoTotal);
    let rentabilidad = $derived(
        costoTotal > 0
            ? (ganancia / costoTotal) * 100
            : ingresosTotales > 0
              ? 100
              : 0,
    );

    function resetForm() {
        form = {
            nombre: "",
            costo: "",
            precio: "",
            stock: "",
            categoria: "",
            descripcion: "",
            fecha: "",
            estado: "disponible",
            imagen: "",
        };
    }

    function close() {
        open = false;
        resetForm();
    }

    $effect(() => {
        if (open && producto) {
            form = {
                nombre: producto.nombre ?? "",
                costo: producto.costo ?? "",
                precio: producto.precio ?? "",
                stock: producto.stock ?? "",
                categoria: producto.categoria ?? "",
                descripcion: producto.descripcion ?? "",
                fecha: producto.fecha ?? "",
                estado: producto.estado ?? "disponible",
                imagen: producto.imagen ?? "",
            };
        } else if (!open) {
            resetForm();
        }
    });

    async function handleFileChange(event) {
        const file = event.target.files[0];
        if (!file) return;

        uploadingImage = true;
        try {
            const url = await uploadImage(file);
            form.imagen = url;
        } catch (error) {
            console.error("Error subiendo imagen:", error);
            alert("No se pudo subir la imagen.");
        } finally {
            uploadingImage = false;
        }
    }

    function handleSubmit(event) {
        event.preventDefault();

        if (!form.nombre.trim()) return;

        onSubmit?.({
            nombre: form.nombre.trim(),
            costo: Number(form.costo) || 0,
            precio: Number(form.precio) || 0,
            stock: Number(form.stock) || 0,
            categoria: form.categoria.trim(),
            descripcion: form.descripcion.trim(),
            fecha: form.fecha || new Date().toISOString().slice(0, 10),
            estado: form.estado,
            imagen: form.imagen,
        });

        close();
    }
</script>

{#if open}
    <div class="fixed inset-0 z-51 bg-black/40">
        <div
            class="absolute bottom-0 left-0 right-0 max-h-[95vh] overflow-y-auto rounded-t-3xl shadow-2xl animate-slide-up"
        >
            <div>
                <form
                    onsubmit={handleSubmit}
                    class="mx-auto mt-3 flex w-full max-w-2xl flex-col gap-6 rounded-t-3xl border border-white/40 bg-white p-6 shadow-2xl"
                >
                    <button
                        type="button"
                        class="flex items-center gap-2 self-start rounded-2xl bg-[#CDB9FE] px-4 py-2 text-sm font-semibold text-gray-800 w-full cursor-pointer"
                        onclick={close}
                    >
                        <i class="fa-solid fa-arrow-left-long"></i>
                        <p>Volver a productos</p>
                    </button>
                    <h1 class="text-3xl font-bold text-gray-800">
                        {isEditing
                            ? "Editar producto"
                            : "Añadir un nuevo producto"}
                    </h1>

                    <!-- Imagen -->
                    <div>
                        <label
                            for="imagen"
                            class="mb-2 block text-sm font-semibold text-gray-700"
                        >
                            Imagen del producto
                        </label>
                        <div class="flex items-center gap-4">
                            {#if form.imagen}
                                <img
                                    src={form.imagen}
                                    alt="Vista previa"
                                    class="h-20 w-20 rounded-2xl object-cover border border-gray-200"
                                />
                            {:else}
                                <div
                                    class="flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-100 text-gray-400"
                                >
                                    <i class="fa-regular fa-image text-2xl"></i>
                                </div>
                            {/if}
                            <div class="flex-1">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onchange={handleFileChange}
                                    disabled={uploadingImage}
                                    class="w-full text-sm text-gray-500 file:mr-4 file:rounded-2xl file:border-0 file:bg-[#CDB9FE]/30 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#7c4dff] hover:file:bg-[#CDB9FE]/50"
                                />
                                {#if uploadingImage}
                                    <p
                                        class="mt-2 text-xs font-semibold text-blue-600"
                                    >
                                        Subiendo imagen...
                                    </p>
                                {/if}
                            </div>
                        </div>
                    </div>

                    <div>
                        <label
                            for="nombre"
                            class="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700"
                        >
                            Nombre del producto
                        </label>

                        <input
                            id="nombre"
                            bind:value={form.nombre}
                            type="text"
                            placeholder="Ej: Brownie de Oreo"
                            class="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-700 placeholder:text-gray-400 transition-all duration-200 outline-none focus:border-[#CDB9FE] focus:ring-4 focus:ring-[#CDB9FE]/20"
                        />
                    </div>

                    <div>
                        <label
                            for="costo"
                            class="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700"
                        >
                            Costo de creación
                        </label>

                        <input
                            id="costo"
                            bind:value={form.costo}
                            type="number"
                            placeholder="$0"
                            class="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-700 placeholder:text-gray-400 transition-all duration-200 outline-none focus:border-[#CDB9FE] focus:ring-4 focus:ring-[#CDB9FE]/20"
                        />
                    </div>

                    <div>
                        <label
                            for="precio"
                            class="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700"
                        >
                            Precio de venta
                        </label>

                        <input
                            id="precio"
                            bind:value={form.precio}
                            type="number"
                            placeholder="$0"
                            class="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-700 placeholder:text-gray-400 transition-all duration-200 outline-none focus:border-[#CDB9FE] focus:ring-4 focus:ring-[#CDB9FE]/20"
                        />
                    </div>

                    <div>
                        <label
                            for="stock"
                            class="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700"
                        >
                            Stock inicial
                        </label>

                        <input
                            id="stock"
                            bind:value={form.stock}
                            type="number"
                            placeholder="0"
                            class="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-700 placeholder:text-gray-400 transition-all duration-200 outline-none focus:border-[#CDB9FE] focus:ring-4 focus:ring-[#CDB9FE]/20"
                        />
                    </div>

                    <div class="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label
                                for="ganancia"
                                class="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700"
                            >
                                Ganancia total (estimada)
                            </label>

                            <input
                                id="ganancia"
                                type="text"
                                disabled
                                value={`$${ganancia.toLocaleString("es-CO")}`}
                                class="w-full rounded-2xl bg-gray-100 px-4 py-3 text-gray-700 font-semibold"
                            />
                        </div>

                        <div>
                            <label
                                for="rentabilidad"
                                class="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700"
                            >
                                Rentabilidad %
                            </label>

                            <input
                                id="rentabilidad"
                                type="text"
                                disabled
                                value={`${rentabilidad.toFixed(2)}%`}
                                class="w-full rounded-2xl bg-gray-100 px-4 py-3 text-gray-700 font-semibold"
                            />
                        </div>
                    </div>

                    <div>
                        <label
                            for="categoria"
                            class="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700"
                        >
                            Categoría
                        </label>

                        <input
                            id="categoria"
                            bind:value={form.categoria}
                            type="text"
                            placeholder="Brownies"
                            class="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-700 placeholder:text-gray-400 transition-all duration-200 outline-none focus:border-[#CDB9FE] focus:ring-4 focus:ring-[#CDB9FE]/20"
                        />
                    </div>

                    <div>
                        <label
                            for="descripcion"
                            class="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700"
                        >
                            Descripción
                        </label>

                        <textarea
                            id="descripcion"
                            bind:value={form.descripcion}
                            rows="5"
                            placeholder="Describe el producto..."
                            class="w-full resize-none rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-700 placeholder:text-gray-400 transition-all duration-200 outline-none focus:border-[#CDB9FE] focus:ring-4 focus:ring-[#CDB9FE]/20"
                        ></textarea>
                    </div>

                    <div class="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label
                                for="fecha"
                                class="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700"
                            >
                                Fecha de creación
                            </label>

                            <input
                                id="fecha"
                                bind:value={form.fecha}
                                type="date"
                                class="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-700 placeholder:text-gray-400 transition-all duration-200 outline-none focus:border-[#CDB9FE] focus:ring-4 focus:ring-[#CDB9FE]/20"
                            />
                        </div>

                        <div>
                            <label
                                for="estado"
                                class="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700"
                            >
                                Estado
                            </label>

                            <select
                                id="estado"
                                bind:value={form.estado}
                                class="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-700 outline-none transition-all duration-200 focus:border-[#CDB9FE] focus:ring-4 focus:ring-[#CDB9FE]/20"
                            >
                                <option value="disponible">Disponible</option>
                                <option value="descontinuado"
                                    >Descontinuado</option
                                >
                            </select>
                        </div>
                    </div>

                    <div
                        class="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end"
                    >
                        <button
                            type="submit"
                            disabled={uploadingImage}
                            class="rounded-2xl bg-[#CDB9FE] px-6 py-3 font-semibold text-gray-800 shadow-lg transition-all duration-200 hover:-translate-y-1 hover:bg-[#bfa3fd] hover:shadow-xl active:scale-95 disabled:opacity-70 disabled:hover:translate-y-0"
                        >
                            {isEditing
                                ? "Actualizar producto"
                                : "Guardar producto"}
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
