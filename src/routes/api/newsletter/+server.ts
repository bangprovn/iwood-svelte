import { error, json } from '@sveltejs/kit';
import { subscribeNewsletter } from '$lib/server/repos';
import type { RequestHandler } from './$types';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const POST: RequestHandler = async ({ request }) => {
	let body: { email?: string };
	try {
		body = await request.json();
	} catch {
		throw error(400, 'Invalid JSON');
	}

	const email = (body.email ?? '').trim().toLowerCase();
	if (!EMAIL.test(email)) throw error(400, 'email is invalid');

	const result = await subscribeNewsletter(email);
	return json(result, { status: result.created ? 201 : 200 });
};
