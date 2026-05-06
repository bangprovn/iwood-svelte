import { requireAdmin } from '$lib/server/auth';
import { reorderBlocks } from '$lib/server/cms/admin';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
	requireAdmin(event);
	const body = (await event.request.json()) as { order?: unknown };
	if (!Array.isArray(body.order) || !body.order.every((x) => typeof x === 'string')) {
		throw error(400, 'order must be an array of block ids');
	}
	await reorderBlocks(body.order as string[]);
	return json({ ok: true });
};
