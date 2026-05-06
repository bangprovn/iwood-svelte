import { json } from '@sveltejs/kit';
import { listShowrooms } from '$lib/server/cms';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	return json(await listShowrooms());
};
