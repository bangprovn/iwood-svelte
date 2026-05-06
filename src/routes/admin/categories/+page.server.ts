import { categoriesResource } from '$lib/server/cms/categories';

export const load = categoriesResource.list.load;
export const actions = categoriesResource.list.actions;
