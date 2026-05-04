import { listPosts } from '$lib/server/repos';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const posts = await listPosts();
	return { posts };
};
