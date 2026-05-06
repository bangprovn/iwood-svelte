import { fail } from '@sveltejs/kit';
import { requireAdmin } from '$lib/server/auth';
import {
	CONTACT_STATUSES,
	deleteContact,
	listContactsAdmin,
	updateContactStatus,
	type ContactStatus
} from '$lib/server/cms/admin';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	requireAdmin(event);
	return { rows: await listContactsAdmin(), statuses: CONTACT_STATUSES };
};

export const actions: Actions = {
	setStatus: async (event) => {
		requireAdmin(event);
		const fd = await event.request.formData();
		const id = fd.get('id')?.toString();
		const status = fd.get('status')?.toString();
		if (!id) return fail(400, { message: 'id required' });
		if (!CONTACT_STATUSES.includes(status as ContactStatus))
			return fail(400, { message: 'bad status' });
		await updateContactStatus(id, status as ContactStatus);
		return { success: true };
	},
	delete: async (event) => {
		requireAdmin(event);
		const fd = await event.request.formData();
		const id = fd.get('id')?.toString();
		if (!id) return fail(400, { message: 'id required' });
		await deleteContact(id);
		return { success: true };
	}
};
