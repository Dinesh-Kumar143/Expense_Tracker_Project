import sanitizeHtml from 'sanitize-html';

export function sanitizeText(input) {
    if (typeof input !== 'string') return input;
    return sanitizeHtml(input, { allowedTags: [], allowedAttributes: {} }).trim();
}