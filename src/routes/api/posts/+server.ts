import { json } from '@sveltejs/kit';
import { listPosts } from '$lib/server/repos';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const cat = url.searchParams.get('cat') ?? undefined;
	const limitParam = url.searchParams.get('limit');
	const limit = limitParam ? Math.max(1, Math.min(50, Number(limitParam) || 0)) : undefined;
	return json(await listPosts({ category: cat, limit }));
};
