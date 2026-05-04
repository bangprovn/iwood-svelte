import { requireAdmin } from '$lib/server/admin-guard';
import { dashboardCounts, listContactsAdmin, listQuotesAdmin } from '$lib/server/admin-repos';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	requireAdmin(event);
	const [counts, quotes, contacts] = await Promise.all([
		dashboardCounts(),
		listQuotesAdmin(),
		listContactsAdmin()
	]);
	return {
		counts,
		recentQuotes: quotes.slice(0, 5),
		recentContacts: contacts.slice(0, 5)
	};
};
