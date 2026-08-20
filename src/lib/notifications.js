// src/lib/notifications.js
import { PushNotifications } from '@capacitor/push-notifications';
import { FCM } from '@capacitor-community/fcm';
import { doc, setDoc, arrayUnion } from 'firebase/firestore';
import { db } from '$lib/firebase.js';

export async function initPushNotifications(uid) {
    const perm = await PushNotifications.requestPermissions();
    if (perm.receive !== 'granted') return;

    await PushNotifications.register();

    // src/lib/notifications.js
    PushNotifications.addListener('registration', async (token) => {
        try {
            await setDoc(doc(db, 'clientes', uid), { uid, fcmTokens: arrayUnion(token.value) }, { merge: true });
            await FCM.subscribeTo({ topic: 'nuevos_productos' });
            await FCM.subscribeTo({ topic: 'fidelidad' });
        } catch (e) {
            console.warn('No se pudo registrar el token de push:', e);
        }
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        // navegar según action.notification.data.tipo
    });
}
