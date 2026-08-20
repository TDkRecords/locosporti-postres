import { browser } from "$app/environment";
import { ensureGoogleAuthInitialized, onAuthStateChangedFirebase } from "$lib/firebase.js";
import { getClienteProfile } from "$lib/firestore.js";
import { currentUser, clientProfile } from "$lib/stores.js";
import { initPushNotifications } from "$lib/notifications.js";

if (browser) {
    ensureGoogleAuthInitialized();

    onAuthStateChangedFirebase(async (user) => {
        currentUser.set(user ?? null);

        if (!user) {
            clientProfile.set(null);
            return;
        }

        clientProfile.set(undefined);

        try {
            const profile = await getClienteProfile(user.uid);
            clientProfile.set(profile);
        } catch (error) {
            console.error("Error cargando perfil del cliente:", error);
            clientProfile.set(null);
        }

        initPushNotifications(user.uid).catch(console.error);
    });
}