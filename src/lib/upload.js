import { PUBLIC_CLOUDINARY_CLOUD_NAME, PUBLIC_CLOUDINARY_UPLOAD_PRESET } from "$env/static/public";

/**
 * Sube una imagen directo a Cloudinary desde el dispositivo (sin pasar por Vercel).
 * @param {File} file
 * @returns {Promise<string>} URL segura de la imagen
 */
export async function uploadImage(file) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", PUBLIC_CLOUDINARY_UPLOAD_PRESET);
    formData.append("folder", "locosporti");

    const response = await fetch(
        `https://api.cloudinary.com/v1_1/${PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData },
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error?.message ?? "Error subiendo la imagen.");
    }

    return data.secure_url;
}