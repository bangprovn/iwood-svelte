import { defineResource } from '$lib/server/admin';
import { postWriteSchema } from '$lib/server/schemas';
import {
	createPost,
	deletePost,
	getPostAdmin,
	listPostsAdmin,
	updatePost
} from '$lib/server/admin-repos';

export const postsResource = defineResource({
	name: 'Post',
	schema: postWriteSchema,
	basePath: '/admin/posts',
	listAll: async () => ({ rows: await listPostsAdmin() }),
	getOne: (id) => getPostAdmin(id),
	create: (input) => createPost(input),
	update: (id, input) => updatePost(id, input),
	deleteOne: (id) => deletePost(id)
});
