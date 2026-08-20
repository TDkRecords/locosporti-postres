// src/lib/notify.js
import { auth } from '$lib/firebase.js';

const API_BASE = 'https://api-locosporti.vercel.app';

export async function enviarNotificacion(tipo, payload) {
    try {
        const idToken = await auth.currentUser?.getIdToken();
        if (!idToken) return;
        await fetch(`${API_BASE}/api/notify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
            body: JSON.stringify({ tipo, payload })
        });
    } catch (e) {
        console.warn('No se pudo enviar la notificación push:', e);
    }
}