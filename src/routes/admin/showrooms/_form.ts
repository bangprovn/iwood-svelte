import { fail, type ActionFailure } from '@sveltejs/kit';
import type { ShowroomWriteInput } from '$lib/server/admin-repos';

export type ShowroomFormState = {
	values: Partial<ShowroomWriteInput>;
	errors: Record<string, string>;
};

export type ShowroomFormFail = ActionFailure<ShowroomFormState>;

export function parseShowroomForm(
	fd: FormData
): { input: ShowroomWriteInput } | ShowroomFormFail {
	const id = (fd.get('id')?.toString() ?? '').trim();
	const city = (fd.get('city')?.toString() ?? '').trim();
	const address = (fd.get('address')?.toString() ?? '').trim();
	const phone = (fd.get('phone')?.toString() ?? '').trim();
	const hours = (fd.get('hours')?.toString() ?? '').trim();
	const imageUrl = (fd.get('imageUrl')?.toString() ?? '').trim();
	const mapUrl = (fd.get('mapUrl')?.toString() ?? '').trim();
	const sortOrder = Number(fd.get('sortOrder') ?? 0);

	const errors: Record<string, string> = {};
	if (!city) errors.city = 'Required';
	if (!address) errors.address = 'Required';
	if (!phone) errors.phone = 'Required';
	if (!hours) errors.hours = 'Required';
	if (!imageUrl) errors.imageUrl = 'Required';

	if (Object.keys(errors).length) {
		return fail(400, {
			errors,
			values: { id, city, address, phone, hours, imageUrl, mapUrl, sortOrder }
		});
	}

	return {
		input: {
			id: id || undefined,
			city,
			address,
			phone,
			hours,
			imageUrl,
			mapUrl: mapUrl || null,
			sortOrder
		}
	};
}
