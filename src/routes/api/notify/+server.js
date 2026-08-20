// src/routes/api/notify/+server.js
import { json } from '@sveltejs/kit';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import {
    FIREBASE_ADMIN_CLIENT_EMAIL,
    FIREBASE_ADMIN_PRIVATE_KEY,
    FIREBASE_ADMIN_PROJECT_ID
} from '$env/static/private';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*', // o restringe a tu origen real si prefieres
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

if (!getApps().length) {
    initializeApp({
        credential: cert({
            projectId: FIREBASE_ADMIN_PROJECT_ID,
            clientEmail: FIREBASE_ADMIN_CLIENT_EMAIL,
            privateKey: FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n')
        })
    });
}

const messaging = getMessaging();
const db = getFirestore();

export async function OPTIONS() {
    return new Response(null, { headers: corsHeaders });
}

export async function POST({ request }) {
    const authHeader = request.headers.get('authorization') || '';
    const idToken = authHeader.replace('Bearer ', '');

    let decoded;
    try {
        decoded = await getAuth().verifyIdToken(idToken);
    } catch {
        return json({ error: 'No autorizado' }, { status: 401 });
    }

    // solo el/los admin(es) pueden disparar notificaciones
    const adminSnap = await db.doc(`admins/${decoded.uid}`).get();
    if (!adminSnap.exists) {
        return json({ error: 'No autorizado' }, { status: 403 });
    }

    const { tipo, payload } = await request.json();

    switch (tipo) {
        case 'nuevo_producto':
            await messaging.send({
                topic: 'nuevos_productos',
                notification: { title: '¡Nuevo postre! 🍰', body: payload.nombre }
            });
            break;

        case 'stock_recuperado':
            await messaging.send({
                topic: 'nuevos_productos',
                notification: { title: '¡Ya volvió el stock! 🎉', body: `${payload.nombre} está disponible` }
            });
            break;

        case 'pedido_estado': {
            const tokens = await tokensDeCliente(payload.clienteId);
            if (tokens.length) {
                await messaging.sendEachForMulticast({
                    tokens,
                    notification: { title: 'Tu pedido cambió de estado', body: `Ahora está: ${payload.estado}` }
                });
            }
            break;
        }

        case 'fidelidad': {
            const tokens = await tokensDeCliente(payload.clienteId);
            if (tokens.length) {
                await messaging.sendEachForMulticast({
                    tokens,
                    notification: { title: '¡Meta de fidelidad alcanzada! ⭐', body: payload.metaNombre || 'Ya tienes una recompensa' }
                });
            }
            break;
        }

        default:
            return json({ error: 'Tipo desconocido' }, { status: 400 });
    }

    return json({ ok: true }, { headers: corsHeaders });
}

async function tokensDeCliente(clienteId) {
    const snap = await db.doc(`clientes/${clienteId}`).get();
    return snap.exists ? (snap.data().fcmTokens || []) : [];
}