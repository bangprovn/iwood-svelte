import { fail } from '@sveltejs/kit';
import { APIError } from 'better-auth/api';
import { requireAdmin } from '$lib/server/admin-guard';
import {
	adminResetPassword,
	createUserAdmin,
	deleteUserAdmin,
	listUsersAdmin,
	setUserRole,
	updateUserName
} from '$lib/server/cms/admin';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	requireAdmin(event);
	return { rows: await listUsersAdmin() };
};

export const actions: Actions = {
	create: async (event) => {
		requireAdmin(event);
		const fd = await event.request.formData();
		const email = fd.get('email')?.toString().trim() ?? '';
		const name = fd.get('name')?.toString().trim() ?? '';
		const password = fd.get('password')?.toString() ?? '';
		const role = fd.get('role')?.toString() === 'admin' ? 'admin' : 'user';
		if (!email || !name || !password) {
			return fail(400, { scope: 'create', message: 'Email, name, and password are required' });
		}
		if (password.length < 8) {
			return fail(400, { scope: 'create', message: 'Password must be at least 8 characters' });
		}
		try {
			await createUserAdmin({ email, name, password, role });
		} catch (e) {
			if (e instanceof APIError) {
				return fail(400, { scope: 'create', message: e.message || 'Could not create user' });
			}
			return fail(500, {
				scope: 'create',
				message: e instanceof Error ? e.message : 'Unexpected error'
			});
		}
		return { scope: 'create', success: true };
	},

	setRole: async (event) => {
		const me = requireAdmin(event);
		const fd = await event.request.formData();
		const id = fd.get('id')?.toString();
		const role = fd.get('role')?.toString();
		if (!id) return fail(400, { message: 'id required' });
		if (role !== 'admin' && role !== 'user') return fail(400, { message: 'bad role' });
		if (id === me.id && role !== 'admin') {
			return fail(400, { message: 'You cannot demote yourself.' });
		}
		await setUserRole(id, role);
		return { success: true };
	},

	updateName: async (event) => {
		requireAdmin(event);
		const fd = await event.request.formData();
		const id = fd.get('id')?.toString();
		const name = fd.get('name')?.toString().trim() ?? '';
		if (!id || !name) return fail(400, { message: 'id and name required' });
		await updateUserName(id, name);
		return { success: true };
	},

	resetPassword: async (event) => {
		requireAdmin(event);
		const fd = await event.request.formData();
		const id = fd.get('id')?.toString();
		const newPassword = fd.get('newPassword')?.toString() ?? '';
		if (!id || !newPassword) return fail(400, { message: 'id and password required' });
		if (newPassword.length < 8) {
			return fail(400, { scope: 'reset', id, message: 'Password must be at least 8 characters' });
		}
		try {
			await adminResetPassword(id, newPassword);
		} catch (e) {
			return fail(500, {
				scope: 'reset',
				id,
				message: e instanceof Error ? e.message : 'Unexpected error'
			});
		}
		return { scope: 'reset', id, success: true };
	},

	delete: async (event) => {
		const me = requireAdmin(event);
		const fd = await event.request.formData();
		const id = fd.get('id')?.toString();
		if (!id) return fail(400, { message: 'id required' });
		if (id === me.id) {
			return fail(400, { message: 'You cannot delete your own account.' });
		}
		await deleteUserAdmin(id);
		return { success: true };
	}
};
