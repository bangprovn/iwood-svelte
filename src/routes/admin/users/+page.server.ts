import { fail } from '@sveltejs/kit';
import { requireAdmin } from '$lib/server/admin-guard';
import { listUsersAdmin, setUserRole } from '$lib/server/admin-repos';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	requireAdmin(event);
	return { rows: await listUsersAdmin() };
};

export const actions: Actions = {
	setRole: async (event) => {
		const me = requireAdmin(event);
		const fd = await event.request.formData();
		const id = fd.get('id')?.toString();
		const role = fd.get('role')?.toString();
		if (!id) return fail(400, { message: 'id required' });
		if (role !== 'admin' && role !== 'user') return fail(400, { message: 'bad role' });
		// Prevent removing your own admin access by accident.
		if (id === me.id && role !== 'admin') {
			return fail(400, { message: 'You cannot demote yourself.' });
		}
		await setUserRole(id, role);
		return { success: true };
	}
};
