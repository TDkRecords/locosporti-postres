<script>
    let { open = $bindable(false) } = $props();

    const menuItems = [
        {
            name: "Dashboard",
            href: "/admin",
            icon: "fa-solid fa-chart-line",
        },
        {
            name: "Productos",
            href: "/admin/productos",
            icon: "fa-solid fa-box",
        },
        {
            name: "Cuentas",
            href: "/admin/cuentas",
            icon: "fa-solid fa-bank",
        },
        {
            name: "Pedidos",
            href: "/admin/pedidos",
            icon: "fa-solid fa-cart-shopping",
        },
        {
            name: "Facturas",
            href: "/admin/facturas",
            icon: "fa-solid fa-file-invoice-dollar",
        },
        {
            name: "Clientes",
            href: "/admin/clientes",
            icon: "fa-solid fa-user-friends",
        },
        {
            name: "Fidelidad",
            href: "/admin/fidelidad",
            icon: "fa-solid fa-gift",
        },
    ];
</script>

<aside
    class="fixed top-0 left-0 z-40 hidden h-screen flex-col border-r border-gray-100 bg-white shadow-sm transition-all duration-300 lg:flex"
    class:w-64={open}
    class:w-20={!open}
>
    <div
        class="flex h-20 items-center border-b border-gray-100"
        class:justify-between={open}
        class:justify-center={!open}
        class:px-5={open}
    >
        {#if open}
            <div class="flex min-w-0 items-center gap-3">
                <div
                    class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#CDB9FE]"
                >
                    <i class="fa-solid fa-store text-lg text-gray-800"></i>
                </div>
                <div class="min-w-0">
                    <h1 class="truncate font-bold text-gray-800">Locos por ti</h1>
                    <p class="text-xs text-gray-400">Administración</p>
                </div>
            </div>
        {:else}
            <div
                class="flex h-10 w-10 items-center justify-center rounded-xl bg-[#CDB9FE]"
            >
                <i class="fa-solid fa-store text-lg text-gray-800"></i>
            </div>
        {/if}
    </div>

    <nav class="flex-1 space-y-2 overflow-y-auto p-3">
        {#each menuItems as item}
            <a
                href={item.href}
                title={!open ? item.name : undefined}
                class="group flex h-12 items-center rounded-xl text-gray-500 transition-all duration-200 hover:bg-[#CDB9FE]/20 hover:text-gray-800"
                class:justify-start={open}
                class:justify-center={!open}
                class:px-4={open}
            >
                <i class={`${item.icon} w-5 shrink-0 text-center text-lg`}></i>
                {#if open}
                    <span class="ml-3 truncate font-medium">{item.name}</span>
                {/if}
            </a>
        {/each}
    </nav>

    <div class="border-t border-gray-100 p-3">
        <button
            type="button"
            onclick={() => (open = !open)}
            class="flex h-12 w-full cursor-pointer items-center rounded-xl text-gray-500 transition-all duration-200 hover:bg-gray-100 hover:text-gray-800"
            class:justify-start={open}
            class:justify-center={!open}
            class:px-4={open}
            title={open ? "Cerrar menú" : "Abrir menú"}
        >
            <i
                class="fa-solid shrink-0 text-lg"
                class:fa-angles-left={open}
                class:fa-angles-right={!open}
            ></i>
            {#if open}
                <span class="ml-3 font-medium">Cerrar menú</span>
            {/if}
        </button>
    </div>
</aside>
