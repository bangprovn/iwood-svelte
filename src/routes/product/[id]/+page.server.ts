import { error } from '@sveltejs/kit';
import { getCategory, getProduct, listRelatedProducts } from '$lib/server/cms';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const product = await getProduct(params.id);
	if (!product) throw error(404, 'Product not found');

	const [category, related] = await Promise.all([
		getCategory(product.cat),
		listRelatedProducts(product.id, product.cat, 4)
	]);

	return { product, category, related };
};
