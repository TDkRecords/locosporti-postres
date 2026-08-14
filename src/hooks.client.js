import { browser } from "$app/environment";
import { GoogleAuth } from "@codetrix-studio/capacitor-google-auth";

import { onAuthStateChangedFirebase } from "$lib/firebase.js";
import { getClienteProfile } from "$lib/firestore.js";
import { currentUser, clientProfile } from "$lib/stores.js";

if (browser) {
    GoogleAuth.initialize({
        clientId: "561979279173-bo6ig9enek4apmks0g0gqun1ni3mf1av.apps.googleusercontent.com",
        scopes: ["profile", "email"],
        grantOfflineAccess: true
    });

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
}