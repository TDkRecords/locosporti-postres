// src/lib/config.js
import { PUBLIC_API_BASE } from '$env/static/public';

// PUBLIC_API_BASE se define en .env.admin y .env.cliente (ver abajo).
// En desarrollo local (npm run dev) puedes definirlo en .env.development
// apuntando a http://localhost:5173 para probar sin depender de Vercel.
export const API_BASE = PUBLIC_API_BASE;