/**
 * Robust UTF-8 safe Base64 encoding and decoding.
 * Handles non-ASCII characters correctly in both Node.js and Browser environments.
 */

export function encodeBase64(str: string): string {
    if (typeof Buffer !== 'undefined') {
        return Buffer.from(str, 'utf8').toString('base64');
    }
    // Browser fallback
    const bytes = new TextEncoder().encode(str);
    const binString = String.fromCodePoint(...bytes);
    return btoa(binString);
}

export function decodeBase64(base64: string): string {
    if (typeof Buffer !== 'undefined') {
        return Buffer.from(base64, 'base64').toString('utf8');
    }
    // Browser fallback
    const binString = atob(base64);
    const bytes = Uint8Array.from(binString, (m) => m.codePointAt(0)!);
    return new TextDecoder().decode(bytes);
}
