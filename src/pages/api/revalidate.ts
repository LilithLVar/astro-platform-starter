import type { APIRoute } from 'astro';
import { purgeCache } from '@netlify/functions';

export const prerender = false;

// Maximum number of tags that can be purged at once
const MAX_TAGS_COUNT = 100;
// Maximum length for each tag
const MAX_TAG_LENGTH = 256;

// Validate tag format to prevent injection attacks
function isValidTag(tag: string): boolean {
    if (!tag || typeof tag !== 'string') return false;
    if (tag.length > MAX_TAG_LENGTH) return false;
    // Only allow alphanumeric characters, hyphens, underscores, and dots
    // Prevent special characters that could be used for injection
    return /^[a-zA-Z0-9._-]+$/.test(tag);
}

export const POST: APIRoute = async ({ request }) => {
    let tags;
    try {
        const body = await request.json();
        tags = body?.tags;
    } catch (e) {
        return new Response('Bad Request: Invalid JSON', { status: 400 });
    }

    if (!Array.isArray(tags)) {
        return new Response(`Bad Request: expected tags attribute with array of strings in the body, got ${typeof tags}`, { status: 400 });
    }
    
    // Validate tags count
    if (tags.length === 0) {
        return new Response('Bad Request: tags array cannot be empty', { status: 400 });
    }
    
    if (tags.length > MAX_TAGS_COUNT) {
        return new Response(`Bad Request: too many tags (max ${MAX_TAGS_COUNT})`, { status: 400 });
    }
    
    // Validate each tag
    for (const tag of tags) {
        if (!isValidTag(tag)) {
            return new Response(`Bad Request: invalid tag format "${tag}"`, { status: 400 });
        }
    }

    try {
        await purgeCache({ tags });
        return new Response(
            JSON.stringify({
                invalidated: tags
            })
        );
    } catch (e) {
        console.error('Error purging cache:', e);
        return new Response('Internal Server Error', { status: 500 });
    }
};
