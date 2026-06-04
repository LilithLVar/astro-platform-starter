import type { APIRoute } from 'astro';
import { getStore } from '@netlify/blobs';

export const prerender = false;

// Maximum allowed key length
const MAX_KEY_LENGTH = 256;

// Validate key format to prevent path traversal and injection
function isValidKey(key: string | null): boolean {
    if (!key || typeof key !== 'string') return false;
    if (key.length > MAX_KEY_LENGTH) return false;
    // Only allow alphanumeric characters, hyphens, and underscores
    // Prevent path traversal attempts
    if (key.includes('..') || key.includes('/') || key.includes('\\')) return false;
    return /^[a-zA-Z0-9_-]+$/.test(key);
}

export const GET: APIRoute = async (context) => {
    const urlParams = new URL(context.url);
    const key = urlParams.searchParams.get('key');
    
    if (!isValidKey(key)) {
        return new Response('Bad Request: Invalid key format', { status: 400 });
    }

    const blobStore = getStore('shapes');
    try {
        const blob = await blobStore.get(key, { type: 'json' });
        if (!blob) {
            return new Response('Not Found', { status: 404 });
        }
        return new Response(
            JSON.stringify({
                blob
            })
        );
    } catch (e) {
        console.error('Error retrieving blob:', e);
        return new Response('Internal Server Error', { status: 500 });
    }
};
