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

<div class="space-y-6 p-4 sm:p-6">
    <header class="rounded-3xl bg-white p-4 shadow-sm sm:p-6">
        <p
            class="text-sm font-semibold uppercase tracking-[0.2em] text-[#CDB9FE]"
        >
            Productos
        </p>
        <h1 class="mt-2 text-2xl font-bold text-gray-800">
            Gestión de catálogo y disponibilidad
        </h1>
        <p class="mt-2 text-sm text-gray-500">
            Administra tus productos con una vista resumida del inventario y el
            estado de cada item.
        </p>
    </header>

    <section class="grid gap-4 md:grid-cols-4">
        <div class="rounded-3xl bg-white p-4 shadow-sm">
            <p class="text-sm text-gray-500">Disponibles</p>
            <p class="mt-2 text-2xl font-bold text-gray-800">
                {productosDisponibles}
            </p>
        </div>
        <div class="rounded-3xl bg-white p-4 shadow-sm">
            <p class="text-sm text-gray-500">Descontinuados</p>
            <p class="mt-2 text-2xl font-bold text-gray-800">
                {productosDescontinuados}
            </p>
        </div>
        <div class="rounded-3xl bg-white p-4 shadow-sm">
            <p class="text-sm text-gray-500">Eliminados</p>
            <p class="mt-2 text-2xl font-bold text-gray-800">
                {productosEliminados}
            </p>
        </div>
        <div class="rounded-3xl bg-white p-4 shadow-sm">
            <p class="text-sm text-gray-500">Valor de inventario</p>
            <p class="mt-2 text-2xl font-bold text-gray-800">
                ${valorInventario.toLocaleString("es-CO")}
            </p>
        </div>
    </section>

    <section class="rounded-3xl bg-white p-4 shadow-sm sm:p-6">
        <div
            class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
        >
            <div>
                <h2 class="text-lg font-bold text-gray-800">Catálogo</h2>
                <p class="mt-1 text-sm text-gray-500">
                    Busca productos y filtra por estado para encontrar lo que
                    necesites rápido.
                </p>
            </div>

            <div class="flex flex-col gap-2 sm:flex-row">
                <input
                    bind:value={busqueda}
                    placeholder="Buscar producto"
                    class="rounded-2xl border border-gray-200 px-3 py-2.5 text-sm outline-none"
                />
                <select
                    bind:value={filtroEstado}
                    class="rounded-2xl border border-gray-200 px-3 py-2.5 text-sm"
                >
                    <option value="todos">Todos</option>
                    <option value="disponible">Disponibles</option>
                    <option value="descontinuado">Descontinuados</option>
                </select>
            </div>
        </div>

        <div class="mt-5">
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
