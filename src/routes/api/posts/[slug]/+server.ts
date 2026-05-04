import { error, json } from '@sveltejs/kit';
import { getPost } from '$lib/server/repos';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	const p = await getPost(params.slug);
	if (!p) throw error(404, 'Post not found');
	return json(p);
};
