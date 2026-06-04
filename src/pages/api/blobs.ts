import type { APIRoute } from 'astro';
import { getStore } from '@netlify/blobs';
import { uploadDisabled } from '../../utils';

export const prerender = false;

// Maximum allowed size for blob parameters
const MAX_PARAM_SIZE = 10000;

// Validate blob parameter names to prevent injection attacks
function isValidParameterName(name: string): boolean {
    if (!name || typeof name !== 'string') return false;
    // Only allow alphanumeric characters, hyphens, and underscores
    return /^[a-zA-Z0-9_-]+$/.test(name) && name.length <= 256;
}

// Sanitize and validate input parameters
function sanitizeParameters(params: any): any {
    if (!params || typeof params !== 'object') {
        throw new Error('Invalid parameters');
    }
    
    // Validate name
    if (!isValidParameterName(params.name)) {
        throw new Error('Invalid parameter name');
    }
    
    // Limit size of serialized data
    const serializedSize = JSON.stringify(params).length;
    if (serializedSize > MAX_PARAM_SIZE) {
        throw new Error('Parameters too large');
    }
    
    return {
        seed: params.seed ?? null,
        size: params.size ?? 512,
        edges: params.edges ?? randomInt(3, 20),
        growth: params.growth ?? randomInt(2, 9),
        name: params.name,
        colors: params.colors ?? []
    };
}

function randomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

export const POST: APIRoute = async ({ request }) => {
    if (uploadDisabled) throw new Error('Sorry, uploads are disabled');

    let parameters;
    try {
        parameters = await request.json();
    } catch (e) {
        return new Response('Bad Request: Invalid JSON', { status: 400 });
    }
    
    try {
        parameters = sanitizeParameters(parameters);
    } catch (e) {
        return new Response(`Bad Request: ${e.message}`, { status: 400 });
    }
    
    const blobStore = getStore('shapes');
    const key = parameters.name;
    await blobStore.setJSON(key, parameters);
    return new Response(
        JSON.stringify({
            message: `Stored shape "${key}"`
        })
    );
};

export const GET: APIRoute = async ({ request }) => {
    try {
        const blobStore = getStore({ name: 'shapes', consistency: 'strong' });
        const data = await blobStore.list();
        const keys = data.blobs.map(({ key }) => key);
        return new Response(
            JSON.stringify({
                keys
            })
        );
    } catch (e) {
        console.error(e);
        return new Response(
            JSON.stringify({
                keys: [],
                error: 'Failed listing blobs'
            })
        );
    }
};
