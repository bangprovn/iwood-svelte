import { z } from 'zod';
import { checkbox, requiredText } from './_helpers';

const LOCALE_CODE_RE = /^[a-z]{2,3}(-[A-Za-z0-9]+)*$/;

export const localeWriteSchema = z.object({
	code: z
		.string()
		.trim()
		.regex(LOCALE_CODE_RE, 'Use BCP-47 form, e.g. "en", "vi", "zh-Hans"'),
	label: requiredText,
	dir: z
		.string()
		.optional()
		.transform((v) => (v === 'rtl' ? 'rtl' : 'ltr'))
		.pipe(z.enum(['ltr', 'rtl'])),
	isActive: checkbox,
	isDefault: checkbox,
	sortOrder: z.coerce.number().default(0)
});

export type LocaleWriteInput = z.infer<typeof localeWriteSchema>;
