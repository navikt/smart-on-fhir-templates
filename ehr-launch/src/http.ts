import { randomBytes } from 'node:crypto'

const RANDOM_TOKEN_BYTES = 32

const HTML_ESCAPES = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
}

export function escapeHtml(value: unknown): string {
    return String(value).replace(/[&<>"']/g, (char) => HTML_ESCAPES[char as keyof typeof HTML_ESCAPES])
}

export function page(title: string, content: string): string {
    const heading = escapeHtml(title)

    return `
        <!doctype html>
        <html lang="en">
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width">
                <title>${heading}</title>
            </head>
            <body>
                <main>
                    <h1>${heading}</h1>
                    ${content}
                </main>
            </body>
        </html>
    `.trim()
}

export function randomToken(): string {
    return randomBytes(RANDOM_TOKEN_BYTES).toString('base64url')
}
