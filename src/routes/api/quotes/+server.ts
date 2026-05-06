import { error, json } from '@sveltejs/kit';
import { createQuote, type QuoteInput } from '$lib/server/cms';
import type { RequestHandler } from './$types';

const PHONE = /^0\d{9,10}$/;

export const POST: RequestHandler = async ({ request }) => {
	let body: Partial<QuoteInput>;
	try {
		body = await request.json();
	} catch {
		throw error(400, 'Invalid JSON');
	}

	const name = (body.name ?? '').trim();
	const phone = (body.phone ?? '').replace(/\s/g, '');
	const projectType = (body.projectType ?? '').trim();
	const area = Number(body.area);

	if (!name) throw error(400, 'name is required');
	if (!PHONE.test(phone)) throw error(400, 'phone is invalid');
	if (!projectType) throw error(400, 'projectType is required');
	if (!Number.isFinite(area) || area <= 0) throw error(400, 'area must be a positive number');

	const items = Array.isArray(body.items)
		? body.items
				.map((it) => ({
					productId: String(it?.productId ?? ''),
					qty: Math.max(1, Math.floor(Number(it?.qty) || 1))
				}))
				.filter((it) => it.productId)
		: [];

	const result = await createQuote({
		name,
		phone,
		email: body.email?.toString().trim() || null,
		city: body.city?.toString().trim() || null,
		projectType,
		area,
		startWindow: body.startWindow?.toString().trim() || null,
		notes: body.notes?.toString().trim() || null,
		items
	});

	return json(result, { status: 201 });
};
