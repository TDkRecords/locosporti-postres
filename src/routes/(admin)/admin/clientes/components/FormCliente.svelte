<script>
    let { open = $bindable(false), cliente = null, onSubmit } = $props();

    let form = $state({
        nombre: "",
        email: "",
        telefono: "",
        direccion: "",
        estado: "activo",
    });

    let isEditing = $derived(Boolean(cliente));

    function resetForm() {
        form = {
            nombre: "",
            email: "",
            telefono: "",
            direccion: "",
            estado: "activo",
        };
    }

    function close() {
        open = false;
        resetForm();
    }

    $effect(() => {
        if (open && cliente) {
            form = {
                nombre: cliente.nombre ?? "",
                email: cliente.email ?? "",
                telefono: cliente.telefono ?? "",
                direccion: cliente.direccion ?? "",
                estado: cliente.estado ?? "activo",
            };
        } else if (!open) {
            resetForm();
        }
    });

    function handleSubmit(event) {
        event.preventDefault();

        if (!form.nombre.trim()) return;

        onSubmit?.({
            nombre: form.nombre.trim(),
            email: form.email.trim(),
            telefono: form.telefono.trim(),
            direccion: form.direccion.trim(),
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
                    class="flex items-center gap-2 self-start rounded-2xl bg-[#CDB9FE] px-4 py-2 text-sm font-semibold text-gray-800 w-full cursor-pointer"
                    onclick={close}
                >
                    <i class="fa-solid fa-arrow-left-long"></i>
                    <span>Volver a clientes</span>
                </button>

                <div>
                    <h1 class="text-3xl font-bold text-gray-800">
                        {isEditing
                            ? "Editar cliente"
                            : "Añadir un nuevo cliente"}
                    </h1>
                    <p class="mt-2 text-sm text-gray-500">
                        {isEditing
                            ? "Actualiza la información del cliente."
                            : "Registra los datos básicos de un cliente nuevo."}
                    </p>
                </div>

                <div>
                    <label
                        for="nombre"
                        class="mb-2 block text-sm font-semibold text-gray-700"
                    >
                        Nombre completo
                    </label>
                    <input
                        id="nombre"
                        type="text"
                        bind:value={form.nombre}
                        placeholder="Nombre completo"
                        class="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-700 outline-none transition-all duration-200 focus:border-[#CDB9FE] focus:ring-4 focus:ring-[#CDB9FE]/20"
                    />
                </div>

                <div class="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label
                            for="email"
                            class="mb-2 block text-sm font-semibold text-gray-700"
                        >
                            Correo electrónico
                        </label>
                        <input
                            id="email"
                            type="email"
                            bind:value={form.email}
                            placeholder="cliente@mail.com"
                            class="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-700 outline-none transition-all duration-200 focus:border-[#CDB9FE] focus:ring-4 focus:ring-[#CDB9FE]/20"
                        />
                    </div>

                    <div>
                        <label
                            for="telefono"
                            class="mb-2 block text-sm font-semibold text-gray-700"
                        >
                            Teléfono
                        </label>
                        <input
                            id="telefono"
                            type="tel"
                            bind:value={form.telefono}
                            placeholder="3001234567"
                            class="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-700 outline-none transition-all duration-200 focus:border-[#CDB9FE] focus:ring-4 focus:ring-[#CDB9FE]/20"
                        />
                    </div>
                </div>

                <div>
                    <label
                        for="direccion"
                        class="mb-2 block text-sm font-semibold text-gray-700"
                    >
                        Dirección
                    </label>
                    <input
                        id="direccion"
                        type="text"
                        bind:value={form.direccion}
                        placeholder="Cra 12 #34-56"
                        class="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-700 outline-none transition-all duration-200 focus:border-[#CDB9FE] focus:ring-4 focus:ring-[#CDB9FE]/20"
                    />
                </div>

                <div class="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label
                            for="estado"
                            class="mb-2 block text-sm font-semibold text-gray-700"
                        >
                            Estado
                        </label>
                        <select
                            id="estado"
                            bind:value={form.estado}
                            class="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-700 outline-none transition-all duration-200 focus:border-[#CDB9FE] focus:ring-4 focus:ring-[#CDB9FE]/20"
                        >
                            <option value="activo">Activo</option>
                            <option value="inactivo">Inactivo</option>
                            <option value="suspendido">Suspendido</option>
                        </select>
                    </div>
                </div>

                <div
                    class="mt-2 flex flex-col gap-3 sm:flex-row sm:justify-end"
                >
                    <button
                        type="submit"
                        class="rounded-2xl bg-[#CDB9FE] px-6 py-3 font-semibold text-gray-800 shadow-lg transition-all duration-200 hover:-translate-y-1 hover:bg-[#bfa3fd] hover:shadow-xl active:scale-95"
                    >
                        {isEditing ? "Actualizar cliente" : "Guardar cliente"}
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
