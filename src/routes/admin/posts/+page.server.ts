import { postsResource } from '$lib/server/cms/posts';

export const load = postsResource.list.load;
export const actions = postsResource.list.actions;
