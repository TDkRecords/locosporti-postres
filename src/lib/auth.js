import { goto } from "$app/navigation";
import { getClienteProfile, isProfileComplete } from "$lib/firestore.js";

/**
 * Redirige al cliente según si completó el registro en Firestore.
 * @param {import('firebase/auth').User} user
 */
export async function redirectClienteAfterLogin(user) {
    if (!user?.uid) {
        goto("/");
        return;
    }

    const profile = await getClienteProfile(user.uid);

    if (isProfileComplete(profile)) {
        goto("/cliente/home");
    } else {
        goto("/cliente/registro");
    }
}
