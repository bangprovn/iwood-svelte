import { fail } from '@sveltejs/kit';
import { createContact, listShowrooms } from '$lib/server/repos';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return { showrooms: await listShowrooms() };
};

export const actions: Actions = {
	send: async ({ request }) => {
		const form = await request.formData();
		const name = String(form.get('name') ?? '').trim();
		const phone = String(form.get('phone') ?? '').trim();
		const email = String(form.get('email') ?? '').trim();
		const subject = String(form.get('subject') ?? '').trim();
		const message = String(form.get('message') ?? '').trim();

		const errors: Record<string, string> = {};
		if (!name) errors.name = 'Nhập họ tên';
		if (!phone) errors.phone = 'Nhập số điện thoại';
		if (!subject) errors.subject = 'Chọn chủ đề';
		if (!message) errors.message = 'Nhập nội dung';

		if (Object.keys(errors).length) {
			return fail(400, { errors, values: { name, phone, email, subject, message } });
		}

		await createContact({ name, phone, email: email || null, subject, message });
		return { success: true };
	}
};
