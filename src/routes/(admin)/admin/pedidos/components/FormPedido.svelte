<script>
    let {
        open = $bindable(false),
        pedido = null,
        clientes = [],
        productos = [],
        onSubmit,
    } = $props();

    let form = $state({
        clienteId: "",
        productoId: "",
        cantidad: 1,
        notas: "",
        metodoPago: "contra_entrega",
        estado: "Preparando",
    });

    let isEditing = $derived(Boolean(pedido));

    function resetForm() {
        form = {
            clienteId: "",
            productoId: "",
            cantidad: 1,
            notas: "",
            metodoPago: "contra_entrega",
            estado: "Preparando",
        };
    }

    function close() {
        open = false;
        resetForm();
    }

    $effect(() => {
        if (open && pedido) {
            const first = (pedido.items && pedido.items[0]) || {};
            form = {
                clienteId: pedido.clienteId?.toString() ?? "",
                productoId: first.productId?.toString() ?? "",
                cantidad: first.cantidad ?? 1,
                notas: pedido.notas ?? "",
                metodoPago: pedido.metodoPago ?? "contra_entrega",
                estado: pedido.estado ?? "Preparando",
            };
        } else if (!open) {
            resetForm();
        }
    });

    // Precio calculado en tiempo real
    let precioUnitario = $derived(() => {
        const prod = productos.find((p) => String(p.id) === String(form.productoId));
        return prod ? Number(prod.precio) || 0 : 0;
    });

    let totalEstimado = $derived(() => precioUnitario() * (Number(form.cantidad) || 0));

    function handleSubmit(event) {
        event.preventDefault();

        if (!form.clienteId || !form.productoId) return;

        onSubmit?.({
            clienteId: form.clienteId,
            productoId: form.productoId,
            cantidad: Number(form.cantidad) || 1,
            notas: form.notas.trim(),
            metodoPago: form.metodoPago,
            estado: form.estado,
        });

        close();
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
                    class="flex items-center gap-2 self-start rounded-2xl bg-[#CDB9FE] px-4 py-2 text-sm font-semibold text-gray-800 w-full"
                    onclick={close}
                >
                    <i class="fa-solid fa-arrow-left-long"></i>
                    <span>Volver a pedidos</span>
                </button>

                <div>
                    <h1 class="text-3xl font-bold text-gray-800">
                        {isEditing ? "Editar pedido" : "Nuevo pedido"}
                    </h1>
                    <p class="mt-2 text-sm text-gray-500">
                        {isEditing
                            ? "Actualiza el estado y los datos del pedido."
                            : "Completa los datos para registrar un pedido nuevo."}
                    </p>
                </div>

                <!-- Cliente -->
                <div>
                    <label for="cliente" class="mb-2 block text-sm font-semibold text-gray-700">
                        Cliente
                    </label>
                    <select
                        id="cliente"
                        bind:value={form.clienteId}
                        class="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-700 outline-none transition-all duration-200 focus:border-[#CDB9FE] focus:ring-4 focus:ring-[#CDB9FE]/20"
                    >
                        <option value="">Selecciona un cliente</option>
                        {#each clientes as cliente}
                            <option value={cliente.id}>
                                {cliente.nombre || ""} {cliente.apellido || ""} {cliente.email ? `· ${cliente.email}` : ""}
                            </option>
                        {/each}
                    </select>
                </div>

                <!-- Producto -->
                <div>
                    <label for="producto" class="mb-2 block text-sm font-semibold text-gray-700">
                        Producto
                    </label>
                    <select
                        id="producto"
                        bind:value={form.productoId}
                        class="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-700 outline-none transition-all duration-200 focus:border-[#CDB9FE] focus:ring-4 focus:ring-[#CDB9FE]/20"
                    >
                        <option value="">Selecciona un producto</option>
                        {#each productos.filter((p) => p.estado !== "eliminado" && p.estado !== "descontinuado") as producto}
                            <option value={producto.id}>
                                {producto.nombre} — ${Number(producto.precio).toLocaleString("es-CO")}
                                {producto.estado === "agotado" ? " (Agotado)" : ""}
                            </option>
                        {/each}
                    </select>
                </div>

                <!-- Cantidad + estado -->
                <div class="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label for="cantidad" class="mb-2 block text-sm font-semibold text-gray-700">
                            Cantidad
                        </label>
                        <input
                            id="cantidad"
                            type="number"
                            min="1"
                            bind:value={form.cantidad}
                            class="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-700 outline-none transition-all duration-200 focus:border-[#CDB9FE] focus:ring-4 focus:ring-[#CDB9FE]/20"
                        />
                    </div>

                    <div>
                        <label for="estado" class="mb-2 block text-sm font-semibold text-gray-700">
                            Estado inicial
                        </label>
                        <select
                            id="estado"
                            bind:value={form.estado}
                            class="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-700 outline-none transition-all duration-200 focus:border-[#CDB9FE] focus:ring-4 focus:ring-[#CDB9FE]/20"
                        >
                            <option value="Preparando">Preparando</option>
                            <option value="Empacado">Empacado</option>
                            <option value="A domicilio">A domicilio</option>
                            <option value="Entregado">Entregado</option>
                        </select>
                    </div>
                </div>

                <!-- Método de pago -->
                <div>
                    <label for="metodoPago" class="mb-2 block text-sm font-semibold text-gray-700">
                        Método de pago
                    </label>
                    <select
                        id="metodoPago"
                        bind:value={form.metodoPago}
                        class="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-700 outline-none transition-all duration-200 focus:border-[#CDB9FE] focus:ring-4 focus:ring-[#CDB9FE]/20"
                    >
                        <option value="contra_entrega">Contra entrega</option>
                        <option value="transferencia">Transferencia (factura se aprueba automáticamente)</option>
                    </select>
                </div>

                <!-- Notas -->
                <div>
                    <label for="notas" class="mb-2 block text-sm font-semibold text-gray-700">
                        Notas <span class="font-normal text-gray-400">(opcional)</span>
                    </label>
                    <textarea
                        id="notas"
                        bind:value={form.notas}
                        rows="3"
                        placeholder="Instrucciones especiales, alergias, referencias..."
                        class="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-700 outline-none transition-all duration-200 focus:border-[#CDB9FE] focus:ring-4 focus:ring-[#CDB9FE]/20"
                    ></textarea>
                </div>

                <!-- Total estimado -->
                {#if form.productoId && form.cantidad}
                    <div class="rounded-2xl bg-[#FFFB96]/60 px-4 py-3">
                        <p class="text-sm text-gray-500">Total estimado</p>
                        <p class="mt-1 text-xl font-bold text-gray-800">
                            ${totalEstimado().toLocaleString("es-CO")}
                        </p>
                        {#if form.metodoPago === "transferencia"}
                            <p class="mt-1 text-xs text-green-700">
                                ✓ La factura se aprobará automáticamente al guardar.
                            </p>
                        {/if}
                    </div>
                {/if}

                <div class="mt-2 flex flex-col gap-3 sm:flex-row sm:justify-end">
                    <button
                        type="submit"
                        class="rounded-2xl bg-[#CDB9FE] px-6 py-3 font-semibold text-gray-800 shadow-lg transition-all duration-200 hover:-translate-y-1 hover:bg-[#bfa3fd] hover:shadow-xl active:scale-95"
                    >
                        {isEditing ? "Actualizar pedido" : "Guardar pedido"}
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
