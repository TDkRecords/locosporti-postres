<script>
    import { siguienteEstadoPedido } from "$lib/firestore.js";
    import { uploadImage } from "$lib/upload.js";

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
    });

    // El estado solo se puede editar avanzando al siguiente paso del flujo,
    // nunca eligiéndolo libremente ni retrocediendo.
    let avanzarEstado = $state(false);
    let fotoEntregaFile = $state(null);
    let fotoEntregaPreview = $state("");
    let subiendoFoto = $state(false);
    let errorFoto = $state("");
    let errorStock = $state("");

    let isEditing = $derived(Boolean(pedido));

    // Estado actual del pedido (para pedidos nuevos siempre empieza en "Preparando")
    let estadoActual = $derived(pedido?.estado ?? "Preparando");
    let proximoEstado = $derived(siguienteEstadoPedido(estadoActual));
    let esEstadoFinal = $derived(
        estadoActual === "Entregado" || estadoActual === "Cancelado",
    );

    function resetForm() {
        form = {
            clienteId: "",
            productoId: "",
            cantidad: 1,
            notas: "",
            metodoPago: "contra_entrega",
        };
        avanzarEstado = false;
        fotoEntregaFile = null;
        fotoEntregaPreview = "";
        subiendoFoto = false;
        errorFoto = "";
        errorStock = "";
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
            };
        } else if (!open) {
            resetForm();
        }
    });

    // Precio calculado en tiempo real
    let precioUnitario = $derived(() => {
        const prod = productos.find(
            (p) => String(p.id) === String(form.productoId),
        );
        return prod ? Number(prod.precio) || 0 : 0;
    });

    let totalEstimado = $derived(
        () => precioUnitario() * (Number(form.cantidad) || 0),
    );

    // Stock disponible para el producto seleccionado. Si el pedido ya
    // descontó stock (Empacado o más adelante) y el producto no cambió, se
    // suma de vuelta esa cantidad reservada para no bloquear su propia edición.
    let stockDisponible = $derived(() => {
        const prod = productos.find(
            (p) => String(p.id) === String(form.productoId),
        );
        if (!prod) return 0;
        let stock = Number(prod.stock) || 0;

        if (isEditing && pedido) {
            const yaDescontado = [
                "Empacado",
                "A domicilio",
                "Entregado",
            ].includes(pedido.estado);
            const first = (pedido.items && pedido.items[0]) || {};
            if (
                yaDescontado &&
                String(first.productId) === String(form.productoId)
            ) {
                stock += Number(first.cantidad) || 0;
            }
        }

        return stock;
    });

    let excedeStock = $derived(
        () =>
            Boolean(form.productoId) &&
            (Number(form.cantidad) || 0) > stockDisponible(),
    );

    function handleFotoChange(event) {
        const file = event.target.files[0];
        if (!file) return;
        fotoEntregaFile = file;
        fotoEntregaPreview = URL.createObjectURL(file);
        errorFoto = "";
    }

    async function handleSubmit(event) {
        event.preventDefault();
        errorStock = "";
        errorFoto = "";

        if (!form.clienteId || !form.productoId) return;

        if (excedeStock()) {
            errorStock = `No hay stock suficiente. Disponible: ${stockDisponible()}.`;
            return;
        }

        const estadoFinal =
            isEditing && avanzarEstado && proximoEstado
                ? proximoEstado
                : estadoActual;

        let fotoEntrega;
        if (estadoFinal === "Entregado" && avanzarEstado) {
            if (!fotoEntregaFile) {
                errorFoto = "Sube una foto como comprobante de entrega.";
                return;
            }
            subiendoFoto = true;
            try {
                fotoEntrega = await uploadImage(fotoEntregaFile);
            } catch (err) {
                console.error(err);
                errorFoto = "Error al subir la imagen. Intenta nuevamente.";
                subiendoFoto = false;
                return;
            }
            subiendoFoto = false;
        }

        onSubmit?.({
            clienteId: form.clienteId,
            productoId: form.productoId,
            cantidad: Number(form.cantidad) || 1,
            notas: form.notas.trim(),
            metodoPago: form.metodoPago,
            estado: estadoFinal,
            fotoEntrega,
        });

        close();
    }
</script>

{#if open}
    <div class="fixed inset-0 z-51 bg-black/40">
        <div
            class="absolute bottom-0 left-0 right-0 max-h-[95vh] overflow-y-auto rounded-t-3xl shadow-2xl animate-slide-up"
        >
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
                    <label
                        for="cliente"
                        class="mb-2 block text-sm font-semibold text-gray-700"
                    >
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
                                {cliente.nombre || ""}
                                {cliente.apellido || ""}
                                {cliente.email ? `· ${cliente.email}` : ""}
                            </option>
                        {/each}
                    </select>
                </div>

                <!-- Producto -->
                <div>
                    <label
                        for="producto"
                        class="mb-2 block text-sm font-semibold text-gray-700"
                    >
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
                                {producto.nombre} — ${Number(
                                    producto.precio,
                                ).toLocaleString("es-CO")}
                                {producto.estado === "agotado"
                                    ? " (Agotado)"
                                    : ""}
                            </option>
                        {/each}
                    </select>
                </div>

                <!-- Cantidad -->
                <div>
                    <label
                        for="cantidad"
                        class="mb-2 block text-sm font-semibold text-gray-700"
                    >
                        Cantidad
                    </label>
                    <input
                        id="cantidad"
                        type="number"
                        min="1"
                        max={form.productoId ? stockDisponible() : undefined}
                        bind:value={form.cantidad}
                        class="w-full rounded-2xl border px-4 py-3 text-gray-700 outline-none transition-all duration-200 focus:ring-4 {excedeStock()
                            ? 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-200'
                            : 'border-gray-200 bg-white focus:border-[#CDB9FE] focus:ring-[#CDB9FE]/20'}"
                    />
                    {#if form.productoId}
                        <p
                            class="mt-1 text-xs {excedeStock()
                                ? 'font-semibold text-red-600'
                                : 'text-gray-400'}"
                        >
                            Stock disponible: {stockDisponible()}
                        </p>
                    {/if}
                    {#if errorStock}
                        <p class="mt-1 text-xs font-semibold text-red-600">
                            {errorStock}
                        </p>
                    {/if}
                </div>

                <!-- Estado -->
                <div class="rounded-2xl bg-[#CDB9FE]/10 p-4">
                    <p class="mb-2 text-sm font-semibold text-gray-700">
                        Estado del pedido
                    </p>

                    {#if !isEditing}
                        <p class="text-sm text-gray-500">
                            Los pedidos nuevos siempre inician como
                            <span class="font-semibold text-gray-700"
                                >Preparando</span
                            >. El estado solo se puede avanzar luego desde la
                            edición del pedido.
                        </p>
                    {:else}
                        <div class="flex items-center gap-2">
                            <span
                                class="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 shadow-sm"
                            >
                                {estadoActual}
                            </span>
                            {#if proximoEstado}
                                <i
                                    class="fa-solid fa-arrow-right-long text-xs text-gray-400"
                                ></i>
                                <span
                                    class="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-gray-400 shadow-sm"
                                >
                                    {proximoEstado}
                                </span>
                            {/if}
                        </div>

                        {#if esEstadoFinal}
                            <p class="mt-2 text-sm text-gray-500">
                                {estadoActual === "Entregado"
                                    ? "Este pedido ya fue entregado y no puede cambiar de estado."
                                    : "Este pedido fue cancelado y no puede cambiar de estado."}
                            </p>
                        {:else}
                            <label
                                class="mt-3 flex cursor-pointer items-center gap-2 text-sm text-gray-700"
                            >
                                <input
                                    type="checkbox"
                                    bind:checked={avanzarEstado}
                                    class="h-4 w-4 rounded border-gray-300 text-[#7C3AED] focus:ring-[#CDB9FE]"
                                />
                                Avanzar estado a
                                <span class="font-semibold"
                                    >{proximoEstado}</span
                                >
                            </label>

                            {#if avanzarEstado && proximoEstado === "Entregado"}
                                <div class="mt-3">
                                    <label
                                        for="fotoEntrega"
                                        class="mb-2 block text-xs font-semibold text-gray-700"
                                    >
                                        Comprobante fotográfico de entrega
                                    </label>

                                    {#if fotoEntregaPreview}
                                        <div class="relative mb-2">
                                            <img
                                                src={fotoEntregaPreview}
                                                alt="Vista previa"
                                                class="h-32 w-full rounded-2xl border border-gray-200 object-cover"
                                            />
                                            <button
                                                title="Quitar foto"
                                                type="button"
                                                onclick={() => {
                                                    fotoEntregaFile = null;
                                                    fotoEntregaPreview = "";
                                                }}
                                                class="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-100 text-red-600 transition hover:bg-red-200"
                                            >
                                                <i class="fa-solid fa-xmark"
                                                ></i>
                                            </button>
                                        </div>
                                    {:else}
                                        <div
                                            class="relative flex h-24 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#CDB9FE] bg-white"
                                        >
                                            <i
                                                class="fa-solid fa-camera text-xl text-[#7c4dff]"
                                            ></i>
                                            <span
                                                class="mt-1 text-xs font-semibold text-[#7c4dff]"
                                                >Tomar o subir foto</span
                                            >
                                            <input
                                                id="fotoEntrega"
                                                type="file"
                                                accept="image/*"
                                                capture="environment"
                                                onchange={handleFotoChange}
                                                class="absolute inset-0 cursor-pointer opacity-0"
                                            />
                                        </div>
                                    {/if}

                                    {#if errorFoto}
                                        <p
                                            class="mt-1 text-xs font-semibold text-red-600"
                                        >
                                            {errorFoto}
                                        </p>
                                    {/if}
                                </div>
                            {/if}
                        {/if}
                    {/if}
                </div>

                <!-- Método de pago -->
                <div>
                    <label
                        for="metodoPago"
                        class="mb-2 block text-sm font-semibold text-gray-700"
                    >
                        Método de pago
                    </label>
                    <select
                        id="metodoPago"
                        bind:value={form.metodoPago}
                        class="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-700 outline-none transition-all duration-200 focus:border-[#CDB9FE] focus:ring-4 focus:ring-[#CDB9FE]/20"
                    >
                        <option value="contra_entrega">Contra entrega</option>
                        <option value="transferencia"
                            >Transferencia (factura se aprueba automáticamente)</option
                        >
                    </select>
                </div>

                <!-- Notas -->
                <div>
                    <label
                        for="notas"
                        class="mb-2 block text-sm font-semibold text-gray-700"
                    >
                        Notas <span class="font-normal text-gray-400"
                            >(opcional)</span
                        >
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
                                ✓ La factura se aprobará automáticamente al
                                guardar.
                            </p>
                        {/if}
                    </div>
                {/if}

                <div
                    class="mt-2 flex flex-col gap-3 sm:flex-row sm:justify-end"
                >
                    <button
                        type="submit"
                        disabled={excedeStock() || subiendoFoto}
                        class="rounded-2xl bg-[#CDB9FE] px-6 py-3 font-semibold text-gray-800 shadow-lg transition-all duration-200 hover:-translate-y-1 hover:bg-[#bfa3fd] hover:shadow-xl active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                    >
                        {subiendoFoto
                            ? "Subiendo comprobante..."
                            : isEditing
                              ? "Actualizar pedido"
                              : "Guardar pedido"}
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
