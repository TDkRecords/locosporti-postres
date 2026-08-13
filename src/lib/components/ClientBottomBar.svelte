<script>
    import { page } from "$app/stores";

    const menuItems = [
        {
            name: "Home",
            shortName: "Home",
            href: "/cliente/home",
            icon: "fa-solid fa-house",
        },
        /* {
            name: "Blog",
            shortName: "Blog",
            href: "/cliente/blog",
            icon: "fa-solid fa-newspaper",
        }, */
        {
            name: "Fidelidad",
            shortName: "Fidelidad",
            href: "/cliente/fidelidad",
            icon: "fa-solid fa-gift",
        },
        {
            name: "Perfil",
            shortName: "Perfil",
            href: "/cliente/perfil",
            icon: "fa-solid fa-user",
        },
    ];

    function isActive(href) {
        return (
            $page.url.pathname === href ||
            $page.url.pathname.startsWith(`${href}/`)
        );
    }
</script>

<nav
    class="fixed right-0 bottom-0 left-0 z-40 border-t border-gray-100 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(0,0,0,0.06)] backdrop-blur-md"
>
    <div class="mx-auto flex h-16 w-full max-w-lg items-stretch justify-around">
        {#each menuItems as item}
            <a
                href={item.href}
                title={item.name}
                aria-current={isActive(item.href) ? "page" : undefined}
                class="flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 py-2 transition-colors duration-200 active:scale-95"
                class:text-[#7c4dff]={isActive(item.href)}
                class:font-semibold={isActive(item.href)}
                class:text-gray-500={!isActive(item.href)}
            >
                <i class={`${item.icon} shrink-0 text-base sm:text-lg`}></i>
                <span
                    class="w-full truncate text-center text-[9px] font-medium leading-tight sm:text-xs"
                >
                    {item.shortName}
                </span>
            </a>
        {/each}
    </div>
</nav>
