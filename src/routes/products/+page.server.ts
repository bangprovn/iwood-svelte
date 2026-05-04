import { listCategories, listProducts, type ListProductsOpts } from '$lib/server/repos';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const cat = url.searchParams.get('cat') ?? undefined;
	const band = url.searchParams.get('priceBand');
	const sort = url.searchParams.get('sort');

	const opts: ListProductsOpts = {};
	if (cat) opts.categoryId = cat;
	if (band === 'low' || band === 'mid' || band === 'high') opts.priceBand = band;
	if (sort === 'price-asc' || sort === 'price-desc' || sort === 'name' || sort === 'featured')
		opts.sort = sort;

	const [categories, products] = await Promise.all([listCategories(), listProducts(opts)]);

	return { categories, products };
};
