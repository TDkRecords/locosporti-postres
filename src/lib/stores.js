import { writable } from "svelte/store";

// undefined = auth not yet initialized, null = no user, object = signed-in user
export const currentUser = writable(undefined);

// Perfil del cliente en Firestore (null = sin perfil, object = perfil cargado)
export const clientProfile = writable(undefined);
