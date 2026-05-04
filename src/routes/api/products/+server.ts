import { json } from '@sveltejs/kit';
import { listProducts, type ListProductsOpts } from '$lib/server/repos';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const opts: ListProductsOpts = {};
	const cat = url.searchParams.get('cat');
	if (cat) opts.categoryId = cat;
	const band = url.searchParams.get('priceBand');
	if (band === 'low' || band === 'mid' || band === 'high') opts.priceBand = band;
	const sort = url.searchParams.get('sort');
	if (sort === 'price-asc' || sort === 'price-desc' || sort === 'name' || sort === 'featured')
		opts.sort = sort;
	const limit = url.searchParams.get('limit');
	if (limit) opts.limit = Math.max(1, Math.min(100, Number(limit) || 0));

	return json(await listProducts(opts));
};
