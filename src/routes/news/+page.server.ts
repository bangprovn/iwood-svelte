import { countPosts, listPosts } from '$lib/server/cms';
import type { PageServerLoad } from './$types';

const PAGE_SIZE = 9;
const CATEGORIES = ['all', 'Tin tức', 'Kiến thức', 'Hướng dẫn', 'Cảm hứng'];

export const load: PageServerLoad = async ({ url }) => {
	const rawCat = url.searchParams.get('category') ?? 'all';
	const category = CATEGORIES.includes(rawCat) ? rawCat : 'all';
	const page = Math.max(1, Number(url.searchParams.get('page') ?? '1') || 1);
	const offset = (page - 1) * PAGE_SIZE;

	const [posts, total] = await Promise.all([
		listPosts({ category, limit: PAGE_SIZE, offset }),
		countPosts(category)
	]);

	return {
		posts,
		total,
		page,
		pageSize: PAGE_SIZE,
		category,
		categories: CATEGORIES
	};
};
