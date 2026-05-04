import { fail, type ActionFailure } from '@sveltejs/kit';
import { validateKey } from '$lib/server/admin-i18n';

export type KeyFormState = {
	values: { key?: string; description?: string };
	errors: Record<string, string>;
};

export type KeyFormFail = ActionFailure<KeyFormState>;

export function parseKeyForm(
	fd: FormData
): { input: { key: string; description: string | null } } | KeyFormFail {
	const key = (fd.get('key')?.toString() ?? '').trim();
	const description = (fd.get('description')?.toString() ?? '').trim();

	const errors: Record<string, string> = {};
	const keyError = validateKey(key);
	if (keyError) errors.key = keyError;

	if (Object.keys(errors).length) {
		return fail(400, { errors, values: { key, description } });
	}

	return { input: { key, description: description || null } };
}

export type ValuesFormState = {
	values: { description?: string; valuesByLocale: Record<string, string> };
	errors: Record<string, string>;
};

/**
 * Parses the per-locale values form. Locale codes are expected on inputs named
 * `value:<code>`. The description and (optional) rename targets are also pulled.
 */
export function parseValuesForm(fd: FormData): {
	description: string | null;
	valuesByLocale: Record<string, string>;
	renameTo: string | null;
} {
	const description = (fd.get('description')?.toString() ?? '').trim();
	const renameRaw = (fd.get('renameTo')?.toString() ?? '').trim();
	const valuesByLocale: Record<string, string> = {};
	for (const [name, val] of fd.entries()) {
		if (!name.startsWith('value:')) continue;
		const locale = name.slice('value:'.length);
		valuesByLocale[locale] = typeof val === 'string' ? val : '';
	}
	return {
		description: description || null,
		valuesByLocale,
		renameTo: renameRaw || null
	};
}
