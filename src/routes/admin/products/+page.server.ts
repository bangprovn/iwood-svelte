import { productsResource } from '$lib/server/cms/products';

export const load = productsResource.list.load;
export const actions = productsResource.list.actions;
