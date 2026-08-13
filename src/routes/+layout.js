import { redirect } from '@sveltejs/kit';
import { PUBLIC_APP_TARGET } from '$env/static/public';

export const prerender = true;
export const ssr = false;

export const load = ({ url }) => {
    const path = url.pathname;

    // APK ADMIN
    if (PUBLIC_APP_TARGET === 'admin' && !path.startsWith('/admin')) {
        throw redirect(307, '/admin');
    }

    // APK CLIENTE
    if (PUBLIC_APP_TARGET === 'cliente') {
        if (path === '/') {
            throw redirect(307, '/cliente');
        }

        if (path.startsWith('/admin')) {
            throw redirect(307, '/cliente');
        }
    }
};