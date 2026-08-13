/**
 * Sube una imagen al servidor (Cloudinary vía /api/upload).
 * @param {File} file
 * @returns {Promise<string>} URL segura de la imagen
 */
import { API_BASE } from "$lib/config.js";

export async function uploadImage(file) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE}/api/upload`, {
        method: "POST",
        body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error ?? "Error subiendo la imagen.");
    }

    return data.url;
}