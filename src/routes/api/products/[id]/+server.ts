import { error, json } from '@sveltejs/kit';
import { getProduct } from '$lib/server/cms';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	const p = await getProduct(params.id);
	if (!p) throw error(404, 'Product not found');
	return json(p);
};
