import { fail, type ActionFailure } from '@sveltejs/kit';
import type { ZodType } from 'zod';

export type FormFailState<T> = {
	values: Partial<T>;
	errors: Record<string, string>;
};

export type ParseFormResult<T> = { input: T } | ActionFailure<FormFailState<T>>;

/**
 * Parse a SvelteKit FormData with a Zod schema. Returns `{ input }` on success
 * or a `fail(400, …)` carrying the user's typed values + per-field error
 * messages on validation failure — exactly the shape SvelteKit `form` action
 * data expects.
 */
export function parseForm<T>(schema: ZodType<T>, fd: FormData): ParseFormResult<T> {
	const raw = formDataToObject(fd);
	const result = schema.safeParse(raw);
	if (result.success) return { input: result.data };

	const errors: Record<string, string> = {};
	for (const issue of result.error.issues) {
		const path = issue.path.join('.') || '_';
		// First error per field wins (SvelteKit form helpers expect a flat map).
		if (!errors[path]) errors[path] = issue.message;
	}
	return fail(400, { errors, values: raw as Partial<T> });
}

/**
 * Convert FormData → plain object. Repeated keys collapse into arrays so
 * Zod schemas can use `z.array(z.string())` for chip / multi-select inputs.
 */
function formDataToObject(fd: FormData): Record<string, unknown> {
	const out: Record<string, unknown> = {};
	for (const [key, value] of fd.entries()) {
		if (key in out) {
			const existing = out[key];
			if (Array.isArray(existing)) existing.push(value);
			else out[key] = [existing, value];
		} else {
			out[key] = value;
		}
	}
	return out;
}
