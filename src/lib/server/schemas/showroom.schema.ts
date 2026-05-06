import { z } from 'zod';
import { optionalId, optionalText, requiredText } from './_helpers';

export const showroomWriteSchema = z.object({
	id: optionalId,
	city: requiredText,
	address: requiredText,
	phone: requiredText,
	hours: requiredText,
	imageUrl: requiredText,
	mapUrl: optionalText,
	sortOrder: z.coerce.number().default(0)
});

export type ShowroomWriteInput = z.infer<typeof showroomWriteSchema>;
