import { onAuthStateChangedFirebase } from "$lib/firebase.js";
import { getClienteProfile } from "$lib/firestore.js";
import { currentUser, clientProfile } from "$lib/stores.js";

onAuthStateChangedFirebase(async (user) => {
    currentUser.set(user ?? null);

    if (!user) {
        clientProfile.set(null);
        return;
    }

    try {
        const profile = await getClienteProfile(user.uid);
        clientProfile.set(profile);
    } catch (error) {
        console.error("Error cargando perfil del cliente:", error);
        clientProfile.set(null);
    }
});
