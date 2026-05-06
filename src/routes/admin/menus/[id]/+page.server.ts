import { error, fail } from '@sveltejs/kit';
import { asc } from 'drizzle-orm';
import { requireAdmin } from '$lib/server/admin-guard';
import {
	getMenu,
	MENU_ITEM_KINDS,
	MENU_LOCATIONS,
	replaceMenuItems,
	updateMenu,
	type MenuItemInput,
	type MenuItemKind
} from '$lib/server/cms/admin';
import { db } from '$lib/server/db';
import {
	category,
	post,
	page,
	product,
	projectCategory,
	showroom
} from '$lib/server/db/schema';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	requireAdmin(event);
	const { id } = event.params;
	const menu = await getMenu(id);
	if (!menu) throw error(404, 'Menu not found');

	const [cats, pcats, posts, pages, products, showrooms] = await Promise.all([
		db
			.select({ id: category.id, vi: category.nameVi, en: category.nameEn })
			.from(category)
			.orderBy(asc(category.sortOrder)),
		db
			.select({ id: projectCategory.id, vi: projectCategory.nameVi, en: projectCategory.nameEn })
			.from(projectCategory)
			.orderBy(asc(projectCategory.sortOrder)),
		db
			.select({ id: post.id, slug: post.slug, vi: post.titleVi, en: post.titleEn })
			.from(post)
			.orderBy(asc(post.publishedAt)),
		db
			.select({ id: page.id, slug: page.slug, vi: page.titleVi, en: page.titleEn })
			.from(page)
			.orderBy(asc(page.titleVi)),
		db
			.select({ id: product.id, code: product.code, vi: product.nameVi, en: product.nameEn })
			.from(product)
			.orderBy(asc(product.nameVi)),
		db
			.select({ id: showroom.id, city: showroom.city })
			.from(showroom)
			.orderBy(asc(showroom.sortOrder))
	]);

	return {
		menu,
		locations: [...MENU_LOCATIONS],
		kinds: [...MENU_ITEM_KINDS],
		picks: { cats, pcats, posts, pages, products, showrooms }
	};
};

function parseTreeJson(raw: string): MenuItemInput[] {
	let parsed: unknown;
	try {
		parsed = JSON.parse(raw || '[]');
	} catch {
		return [];
	}
	if (!Array.isArray(parsed)) return [];
	const KINDS = new Set<string>(MENU_ITEM_KINDS);
	const walk = (nodes: unknown[]): MenuItemInput[] => {
		const out: MenuItemInput[] = [];
		nodes.forEach((raw, i) => {
			if (!raw || typeof raw !== 'object') return;
			const n = raw as Record<string, unknown>;
			const kind = (typeof n.kind === 'string' && KINDS.has(n.kind) ? n.kind : 'custom') as MenuItemKind;
			const target = n.target === '_blank' ? '_blank' : '_self';
			const data = n.data && typeof n.data === 'object' ? (n.data as Record<string, unknown>) : {};
			const children =
				Array.isArray(n.children) ? walk(n.children as unknown[]) : [];
			out.push({
				id: typeof n.id === 'string' ? n.id : undefined,
				sortOrder: typeof n.sortOrder === 'number' ? n.sortOrder : i,
				kind,
				refId: typeof n.refId === 'string' && n.refId.length > 0 ? n.refId : null,
				url: typeof n.url === 'string' ? n.url : null,
				labelVi: typeof n.labelVi === 'string' ? n.labelVi : '',
				labelEn: typeof n.labelEn === 'string' ? n.labelEn : null,
				target,
				isMega: !!n.isMega,
				data,
				children
			});
		});
		return out;
	};
	return walk(parsed);
}

export const actions: Actions = {
	save: async (event) => {
		requireAdmin(event);
		const { id } = event.params;
		const fd = await event.request.formData();
		const name = fd.get('name')?.toString().trim() ?? '';
		const slug = fd.get('slug')?.toString().trim() ?? '';
		const location = fd.get('location')?.toString().trim() ?? '';
		const isActive = fd.get('isActive') === '1' || fd.get('isActive') === 'on';
		const treeRaw = fd.get('tree')?.toString() ?? '[]';
		if (!name) return fail(400, { message: 'Name is required.' });
		try {
			await updateMenu(id, {
				name,
				slug: slug || undefined,
				location: location || null,
				isActive
			});
			await replaceMenuItems(id, parseTreeJson(treeRaw));
		} catch (e) {
			return fail(500, { message: e instanceof Error ? e.message : String(e) });
		}
		return { success: true };
	}
};
