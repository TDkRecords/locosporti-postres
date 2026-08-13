// src/routes/api/upload/+server.js
import { json } from "@sveltejs/kit";
import cloudinary from "$lib/cloudinary.js";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*", // idealmente restringe a tus orígenes reales
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
};

export const OPTIONS = () => new Response(null, { headers: corsHeaders });

export const POST = async ({ request }) => {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
        return json({ error: "No se recibió ningún archivo." }, { status: 400, headers: corsHeaders });
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const dataUri = `data:${file.type};base64,${base64}`;

    try {
        const result = await cloudinary.uploader.upload(dataUri, {
            folder: "locosporti",
            resource_type: "image",
            overwrite: false,
            unique_filename: true,
        });
        return json({ url: result.secure_url }, { headers: corsHeaders });
    } catch (error) {
        return json({ error: error.message ?? "Error subiendo la imagen." }, { status: 500, headers: corsHeaders });
    }
};