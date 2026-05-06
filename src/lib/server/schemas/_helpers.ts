import { z } from 'zod';
import { sanitizeHtml, htmlToPlainText } from '$lib/server/sanitize-html';

/** id-style field: trims, returns `undefined` for empty so DB auto-generates. */
export const optionalId = z
	.string()
	.trim()
	.transform((v) => (v ? v : undefined))
	.optional();

/** Required string with trim + non-empty check. */
export const requiredText = z.string().trim().min(1, 'Required');

/** Optional text → null when empty (matches our DB nullable columns). */
export const optionalText = z
	.string()
	.trim()
	.transform((v) => (v ? v : null))
	.nullable();

/** Required HTML field: sanitized; must yield non-empty plain text. */
export const requiredHtml = z
	.string()
	.transform((v) => sanitizeHtml(v ?? ''))
	.refine((v) => htmlToPlainText(v).length > 0, 'Required');

/** Optional HTML field: sanitized; null when sanitized result is empty. */
export const optionalHtml = z
	.string()
	.transform((v) => sanitizeHtml(v ?? ''))
	.transform((v) => (v ? v : null))
	.nullable();

/** HTML form checkbox: any present value → true, missing key → false. */
export const checkbox = z.preprocess((v) => Boolean(v), z.boolean());

/**
 * Repeated FormData key → array of trimmed non-empty strings. Scalar →
 * `[scalar]`, missing key → `[]`. Use for chip / multi-select inputs.
 */
export const stringArray = z.preprocess(
	(v) => {
		if (Array.isArray(v)) return v;
		if (v == null || v === '') return [];
		return [v];
	},
	z.array(z.string()).transform((arr) => arr.map((s) => s.trim()).filter(Boolean))
);
