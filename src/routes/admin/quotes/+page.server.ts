import { fail } from '@sveltejs/kit';
import { requireAdmin } from '$lib/server/admin-guard';
import {
	deleteQuote,
	listQuotesAdmin,
	QUOTE_STATUSES,
	updateQuoteStatus,
	type QuoteStatus
} from '$lib/server/cms/admin';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	requireAdmin(event);
	return { rows: await listQuotesAdmin(), statuses: QUOTE_STATUSES };
};

export const actions: Actions = {
	setStatus: async (event) => {
		requireAdmin(event);
		const fd = await event.request.formData();
		const id = fd.get('id')?.toString();
		const status = fd.get('status')?.toString();
		if (!id) return fail(400, { message: 'id required' });
		if (!QUOTE_STATUSES.includes(status as QuoteStatus))
			return fail(400, { message: 'bad status' });
		await updateQuoteStatus(id, status as QuoteStatus);
		return { success: true };
	},
	delete: async (event) => {
		requireAdmin(event);
		const fd = await event.request.formData();
		const id = fd.get('id')?.toString();
		if (!id) return fail(400, { message: 'id required' });
		await deleteQuote(id);
		return { success: true };
	}
};
