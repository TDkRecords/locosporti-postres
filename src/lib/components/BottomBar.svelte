<script>
    const menuItems = [
        {
            name: "Dashboard",
            shortName: "Inicio",
            href: "/admin",
            icon: "fa-solid fa-chart-line",
        },
        {
            name: "Productos",
            shortName: "Prod.",
            href: "/admin/productos",
            icon: "fa-solid fa-box",
        },
        {
            name: "Cuentas",
            shortName: "Cuentas",
            href: "/admin/cuentas",
            icon: "fa-solid fa-bank",
        },
        {
            name: "Pedidos",
            shortName: "Pedidos",
            href: "/admin/pedidos",
            icon: "fa-solid fa-cart-shopping",
        },
        {
            name: "Facturas",
            shortName: "Fact.",
            href: "/admin/facturas",
            icon: "fa-solid fa-file-invoice-dollar",
        },
        {
            name: "Clientes",
            shortName: "Client.",
            href: "/admin/clientes",
            icon: "fa-solid fa-user-friends",
        },
        {
            name: "Fidelidad",
            shortName: "Fidel.",
            href: "/admin/fidelidad",
            icon: "fa-solid fa-gift",
        },
    ];
</script>

<nav
    class="fixed right-0 bottom-0 left-0 z-40 border-t border-gray-100 bg-white/95 px-1 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(0,0,0,0.06)] backdrop-blur-md lg:hidden"
>
    <div class="mx-auto flex h-16 w-full max-w-lg items-stretch justify-around overflow-x-auto">
        {#each menuItems as item}
            <a
                href={item.href}
                title={item.name}
                class="flex min-w-[3.5rem] flex-1 flex-col items-center justify-center gap-0.5 px-0.5 py-2 text-gray-500 transition-colors duration-200 hover:text-gray-800 active:scale-95"
            >
                <i class={`${item.icon} shrink-0 text-sm`}></i>
                <span class="w-full truncate text-center text-[8px] font-medium leading-tight">
                    {item.shortName}
                </span>
            </a>
        {/each}
    </div>
</nav>
