import { error, json } from '@sveltejs/kit';
import { createContact, type ContactInput } from '$lib/server/repos';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	let body: Partial<ContactInput>;
	try {
		body = await request.json();
	} catch {
		throw error(400, 'Invalid JSON');
	}

	const name = (body.name ?? '').trim();
	const phone = (body.phone ?? '').trim();
	const subject = (body.subject ?? '').trim();
	const message = (body.message ?? '').trim();

	if (!name) throw error(400, 'name is required');
	if (!phone) throw error(400, 'phone is required');
	if (!subject) throw error(400, 'subject is required');
	if (!message) throw error(400, 'message is required');

	const result = await createContact({
		name,
		phone,
		email: body.email?.toString().trim() || null,
		subject,
		message
	});

	return json(result, { status: 201 });
};
