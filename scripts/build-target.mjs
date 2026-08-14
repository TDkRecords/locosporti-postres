import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const target = process.argv[2];

if (!["admin", "cliente"].includes(target)) {
    console.error("Uso: node scripts/build-target.mjs admin|cliente");
    process.exit(1);
}

const root = process.cwd();

const routesDir = path.join(root, "src", "routes");
const tempDir = path.join(root, ".build-target");

const adminDir = path.join(routesDir, "(admin)");
const clienteDir = path.join(routesDir, "(cliente)");

const tempAdminDir = path.join(tempDir, "(admin)");
const tempClienteDir = path.join(tempDir, "(cliente)");

const isAdmin = target === "admin";

const sourceToMove = isAdmin ? clienteDir : adminDir;
const tempDestination = isAdmin ? tempClienteDir : tempAdminDir;

let moved = false;

try {
    console.log("");
    console.log("======================================");
    console.log(`  Construyendo aplicación: ${target}`);
    console.log("======================================");
    console.log("");

    // Crear directorio temporal
    fs.mkdirSync(tempDir, { recursive: true });

    // Limpiar posibles restos de una ejecución anterior
    if (fs.existsSync(tempDestination)) {
        fs.rmSync(tempDestination, { recursive: true, force: true });
    }

    // Mover temporalmente la aplicación que NO corresponde
    if (fs.existsSync(sourceToMove)) {
        console.log(`Moviendo temporalmente: ${sourceToMove}`);
        console.log(`                hacia: ${tempDestination}`);

        fs.renameSync(sourceToMove, tempDestination);
        moved = true;
    } else {
        console.warn(`No existe: ${sourceToMove}`);
    }

    console.log("");
    console.log(`Ejecutando Vite en modo: ${target}`);
    console.log("");

    const command = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

    const result = spawnSync(
        command,
        ["exec", "vite", "build", "--mode", target],
        {
            cwd: root,
            stdio: "inherit",
            shell: process.platform === "win32",
            env: {
                ...process.env,
                ADAPTER: "static"
            }
        }
    );

    if (result.error) {
        throw result.error;
    }

    if (result.status !== 0) {
        process.exitCode = result.status ?? 1;
    }
} finally {
    console.log("");
    console.log("Restaurando estructura del proyecto...");

    // Restaurar la carpeta original
    if (moved && fs.existsSync(tempDestination)) {
        if (fs.existsSync(sourceToMove)) {
            fs.rmSync(sourceToMove, { recursive: true, force: true });
        }

        fs.renameSync(tempDestination, sourceToMove);
        console.log(`Restaurado: ${sourceToMove}`);
    }

    // Eliminar directorio temporal si quedó vacío
    if (fs.existsSync(tempDir)) {
        try {
            fs.rmSync(tempDir, { recursive: true, force: true });
        } catch {
            // No detener el proceso por esto
        }
    }

    console.log("Estructura restaurada.");
    console.log("");
}