import type { CapacitorConfig } from '@capacitor/cli';

const target = process.env.CAPACITOR_TARGET ?? 'cliente';

const configs: Record<string, CapacitorConfig> = {
    admin: {
        appId: 'com.locosporti.admin',
        appName: 'Locos Por Ti Admin',
        webDir: 'build'
    },

    cliente: {
        appId: 'com.locosporti.cliente',
        appName: 'Locos Por Ti',
        webDir: 'build'
    }
};

const config = configs[target];

if (!config) {
    throw new Error(
        `CAPACITOR_TARGET inválido: "${target}". Usa "admin" o "cliente".`
    );
}

console.log(`📱 Capacitor target: ${target}`);
console.log(`📦 App ID: ${config.appId}`);

export default config;