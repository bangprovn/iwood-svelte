import { json } from '@sveltejs/kit';
import { listCategories } from '$lib/server/repos';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	return json(await listCategories());
};
