<script>
    import { onMount } from "svelte";
    import ListProducto from "./components/ListProducto.svelte";
    import DetailProducto from "./components/DetailProducto.svelte";
    import FormProducto from "./components/FormProducto.svelte";
    import DeleteProducto from "./components/DeleteProducto.svelte";
    import {
        getCollectionOnce,
        saveDocument,
        updateDocument,
    } from "$lib/firestore.js";
    import { enviarNotificacion } from "$lib/notify.js";

    let showForm = $state(false);
    let showDelete = $state(false);

    let selectedProduct = $state(null);
    let productToDelete = $state(null);
    let editingProduct = $state(null);
    let busqueda = $state("");
    let filtroEstado = $state("todos");
    let productos = $state([]);
    let loading = $state(true);

    const normalizeProduct = (producto) => ({
        ...producto,
        precio: Number(producto.precio) || 0,
        costo: Number(producto.costo) || 0,
        stock: Number(producto.stock) || 0,
        ganancia: Number(producto.precio || 0) - Number(producto.costo || 0),
        rentabilidad: Number(producto.costo)
            ? Math.round(
                  (Number(producto.precio || 0) / Number(producto.costo || 1) -
                      1) *
                      100,
              )
            : 0,
        imagen:
            producto.imagen || "https://placehold.co/600x400?text=Sin+imagen",
        fecha:
            producto.fecha ||
            new Date().toLocaleDateString("es-CO", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }),
        uuid: producto.uuid || `${Date.now().toString(16).slice(-4)}...`,
    });

    async function loadProductos() {
        loading = true;
        try {
            const docs = await getCollectionOnce("productos", "fecha");
            productos = docs.map(normalizeProduct);
        } catch (error) {
            console.error("Error cargando productos:", error);
            productos = [];
        } finally {
            loading = false;
        }
    }

    onMount(loadProductos);

    let productosDisponibles = $derived(
        productos.filter((producto) => producto.estado === "disponible").length,
    );
    let productosDescontinuados = $derived(
        productos.filter((producto) => producto.estado === "descontinuado")
            .length,
    );
    let productosEliminados = $derived(
        productos.filter((producto) => producto.estado === "eliminado").length,
    );
    let valorInventario = $derived(
        productos.reduce(
            (sum, producto) => sum + producto.precio * producto.stock,
            0,
        ),
    );
    let productosFiltrados = $derived(
        productos.filter((producto) => {
            if (producto.estado === "eliminado") return false;

            const coincideBusqueda = `${producto.nombre} ${producto.categoria}`
                .toLowerCase()
                .includes(busqueda.toLowerCase());
            const coincideEstado =
                filtroEstado === "todos" || producto.estado === filtroEstado;

            return coincideBusqueda && coincideEstado;
        }),
    );

    function openDetail(producto) {
        selectedProduct = producto;
    }

    function closeDetail() {
        selectedProduct = null;
    }

    function openCreate() {
        editingProduct = null;
        showForm = true;
    }

    function openEdit(producto) {
        editingProduct = producto;
        showForm = true;
    }

    function closeForm() {
        showForm = false;
        editingProduct = null;
    }

    function openDelete(producto) {
        productToDelete = producto;
        showDelete = true;
    }

    function closeDelete() {
        showDelete = false;
        productToDelete = null;
    }

    async function guardarProducto(payload) {
        try {
            const record = editingProduct
                ? { ...editingProduct, ...payload }
                : {
                      ...payload,
                      fecha: new Date().toISOString(),
                      uuid: `${Date.now().toString(16).slice(-4)}...`,
                  };

            const saved = await saveDocument("productos", record);
            if (!record.id) {
                enviarNotificacion("nuevo_producto", { nombre: saved.nombre });
            }

            const normalized = normalizeProduct(saved);

            if (editingProduct) {
                const index = productos.findIndex(
                    (item) => item.id === editingProduct.id,
                );
                if (index !== -1) {
                    productos[index] = normalized;
                }
                if (selectedProduct?.id === editingProduct.id) {
                    selectedProduct = normalized;
                }
            } else {
                productos = [...productos, normalized];
            }
        } catch (error) {
            console.error("Error guardando producto:", error);
        } finally {
            closeForm();
        }
    }

    async function softDelete(producto) {
        const index = productos.findIndex((item) => item.id === producto.id);

        if (index !== -1) {
            productos[index] = {
                ...productos[index],
                estado: "eliminado",
            };

            await updateDocument("productos", producto.id, {
                estado: "eliminado",
            });

            if (selectedProduct?.id === producto.id) {
                selectedProduct = null;
            }
        }

        closeDelete();
    }
</script>

<div class="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
    <!-- Header -->
    <header class="overflow-hidden rounded-3xl bg-white shadow-sm">
        <div class="p-5 sm:p-6">
            <div class="flex flex-wrap items-center justify-between gap-4">
                <div class="flex min-w-0 items-center gap-4">
                    <div
                        class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#CDB9FE]/20 text-[#7C3AED]"
                    >
                        <i class="fa-solid fa-boxes-stacked text-xl"></i>
                    </div>

                    <div class="min-w-0">
                        <p class="text-sm font-medium text-[#7C3AED]">
                            Productos
                        </p>

                        <h1
                            class="mt-0.5 text-2xl font-bold text-gray-900 sm:text-3xl"
                        >
                            Gestión de catálogo
                        </h1>

                        <p class="mt-1 text-sm text-gray-500">
                            Administra el inventario, disponibilidad y estado de
                            cada producto.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </header>

    <!-- KPIs -->
    <section class="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div
            class="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
            <div class="flex items-center justify-between">
                <i class="fa-solid fa-circle-check text-green-500"></i>
                <span class="text-xs text-gray-500">Disponibles</span>
            </div>

            <p class="mt-4 text-3xl font-bold text-gray-900">
                {productosDisponibles}
            </p>

            <p class="text-sm text-gray-500">Listos para vender</p>
        </div>

        <div
            class="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
            <div class="flex items-center justify-between">
                <i class="fa-solid fa-pause-circle text-amber-500"></i>
                <span class="text-xs text-gray-500">Descontinuados</span>
            </div>

            <p class="mt-4 text-3xl font-bold text-gray-900">
                {productosDescontinuados}
            </p>

            <p class="text-sm text-gray-500">Fuera de venta</p>
        </div>

        <div
            class="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
            <div class="flex items-center justify-between">
                <i class="fa-solid fa-trash text-red-500"></i>
                <span class="text-xs text-gray-500">Eliminados</span>
            </div>

            <p class="mt-4 text-3xl font-bold text-gray-900">
                {productosEliminados}
            </p>

            <p class="text-sm text-gray-500">Histórico</p>
        </div>

        <div
            class="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
            <div class="flex items-center justify-between">
                <i class="fa-solid fa-wallet text-[#7C3AED]"></i>
                <span class="text-xs text-gray-500">Inventario</span>
            </div>

            <p class="mt-4 wrap-break-words text-2xl font-bold text-gray-900">
                ${valorInventario.toLocaleString("es-CO")}
            </p>

            <p class="text-sm text-gray-500">Valor estimado</p>
        </div>
    </section>

    <!-- Catálogo -->
    <section class="rounded-3xl bg-white shadow-sm">
        <div class="border-b border-gray-100 p-5 sm:p-6">
            <div
                class="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between"
            >
                <div>
                    <div class="flex items-center gap-2">
                        <i class="fa-solid fa-box-open text-[#7C3AED]"></i>
                        <h2 class="text-xl font-bold text-gray-900">
                            Catálogo
                        </h2>
                    </div>

                    <p class="mt-1 text-sm text-gray-500">
                        Busca productos y filtra por estado para encontrar lo
                        que necesitas rápidamente.
                    </p>
                </div>

                <!-- Filtros -->
                <div class="flex w-full flex-col gap-3 sm:flex-row xl:w-auto">
                    <div class="relative flex-1 xl:min-w-65">
                        <i
                            class="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                        ></i>

                        <input
                            bind:value={busqueda}
                            placeholder="Buscar producto..."
                            class="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-sm transition focus:border-[#CDB9FE] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#CDB9FE]/20"
                        />
                    </div>

                    <select
                        bind:value={filtroEstado}
                        class="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm transition focus:border-[#CDB9FE] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#CDB9FE]/20"
                    >
                        <option value="todos">Todos</option>
                        <option value="disponible">Disponibles</option>
                        <option value="descontinuado">Descontinuados</option>
                    </select>
                </div>
            </div>
        </div>

        <!-- Lista -->
        <div class="p-5 sm:p-6">
            <ListProducto
                productos={productosFiltrados}
                onSelectProduct={openDetail}
            />
        </div>
    </section>
</div>

<!-- Botón agregar -->
{#if !showForm && !selectedProduct}
    <div
        class="pointer-events-none fixed right-0 bottom-18 left-0 z-40 lg:bottom-6"
    >
        <div class="container mx-auto flex justify-end px-4">
            <button
                title="Abrir formulario para agregar un nuevo producto"
                type="button"
                onclick={openCreate}
                class="pointer-events-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#CDB9FE] text-2xl text-white shadow-xl transition-all duration-200 hover:scale-110 active:scale-95"
            >
                <i class="fa-solid fa-plus"></i>
            </button>
        </div>
    </div>
{/if}

<!-- Formulario -->
<FormProducto
    bind:open={showForm}
    producto={editingProduct}
    onSubmit={guardarProducto}
/>

<!-- Eliminar -->
<DeleteProducto
    bind:open={showDelete}
    producto={productToDelete}
    onConfirm={softDelete}
/>

<!-- Detail -->
{#if selectedProduct}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm"
    >
        <button
            type="button"
            aria-label="Cerrar detalle"
            onclick={closeDetail}
            class="absolute inset-0 cursor-default"
        ></button>

        <div class="relative z-10 w-full max-w-xl">
            <DetailProducto
                producto={selectedProduct}
                onClose={closeDetail}
                onEdit={openEdit}
                onDelete={openDelete}
            />
        </div>
    </div>
{/if}
