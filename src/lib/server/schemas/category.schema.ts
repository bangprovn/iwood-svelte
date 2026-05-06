import { z } from 'zod';

export const categoryWriteSchema = z.object({
	id: z
		.string()
		.trim()
		.optional()
		.transform((v) => (v ? v : undefined)),
	nameVi: z.string().trim().min(1, 'Required'),
	nameEn: z.string().trim().min(1, 'Required'),
	blurb: z.string().trim().min(1, 'Required'),
	priceFrom: z.coerce.number().min(0, 'Must be ≥ 0'),
	imageUrl: z.string().trim().min(1, 'Required'),
	displayCount: z.coerce.number().min(0).default(0),
	sortOrder: z.coerce.number().default(0)
});

export type CategoryWriteInput = z.infer<typeof categoryWriteSchema>;
