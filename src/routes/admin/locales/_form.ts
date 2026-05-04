import { fail, type ActionFailure } from '@sveltejs/kit';
import type { LocaleWriteInput } from '$lib/server/admin-i18n';
import { validateLocaleCode } from '$lib/server/admin-i18n';

export type LocaleFormState = {
	values: Partial<LocaleWriteInput>;
	errors: Record<string, string>;
};

export type LocaleFormFail = ActionFailure<LocaleFormState>;

export function parseLocaleForm(fd: FormData): { input: LocaleWriteInput } | LocaleFormFail {
	const code = (fd.get('code')?.toString() ?? '').trim();
	const label = (fd.get('label')?.toString() ?? '').trim();
	const dirRaw = (fd.get('dir')?.toString() ?? 'ltr').trim();
	const dir: 'ltr' | 'rtl' = dirRaw === 'rtl' ? 'rtl' : 'ltr';
	const isActive = fd.get('isActive') != null;
	const isDefault = fd.get('isDefault') != null;
	const sortOrder = Number(fd.get('sortOrder') ?? 0);

	const errors: Record<string, string> = {};
	const codeError = validateLocaleCode(code);
	if (codeError) errors.code = codeError;
	if (!label) errors.label = 'Required';
	if (!Number.isFinite(sortOrder)) errors.sortOrder = 'Must be a number';

	if (Object.keys(errors).length) {
		return fail(400, {
			errors,
			values: { code, label, dir, isActive, isDefault, sortOrder }
		});
	}

	return {
		input: { code, label, dir, isActive, isDefault, sortOrder }
	};
}
