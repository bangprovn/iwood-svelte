import { error } from '@sveltejs/kit';
import { getPost, listMorePosts } from '$lib/server/repos';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const post = await getPost(params.slug);
	if (!post) throw error(404, 'Post not found');

	const more = await listMorePosts(post.slug, post.cat);
	return { post, more };
};
