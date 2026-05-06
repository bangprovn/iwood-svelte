// Menu repository: read + write surface for the WordPress-style menu
// editor and the public navigation. Items live in `menu_item` as a flat
// table with self-referencing `parent_id`; we materialise the tree here
// so consumers can traverse it without recursive SQL.

import { and, asc, eq, inArray } from 'drizzle-orm';
import { db } from '../db';
import {
	menu,
	menuItem,
	category,
	product,
	productSpec,
	projectCategory,
	post,
	page
} from '../db/schema';
import type { ProductDTO } from '$lib/types';
import { htmlToPlainText } from '../sanitize-html';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export const MENU_ITEM_KINDS = [
	'custom',
	'page',
	'category',
	'project_category',
	'post',
	'showroom',
	'route',
	'mega_column',
	'mega_promo',
	'mega_featured'
] as const;
export type MenuItemKind = (typeof MENU_ITEM_KINDS)[number];

export const MENU_LOCATIONS = ['primary', 'footer', 'mobile'] as const;
export type MenuLocation = (typeof MENU_LOCATIONS)[number];

export type MenuRow = typeof menu.$inferSelect;
export type MenuItemRow = typeof menuItem.$inferSelect;

export type MenuItemNode = MenuItemRow & {
	dataParsed: Record<string, unknown>;
	children: MenuItemNode[];
};

export type MenuTree = MenuRow & { items: MenuItemNode[] };

export type MenuItemInput = {
	id?: string;
	parentId?: string | null;
	sortOrder?: number;
	kind: MenuItemKind;
	refId?: string | null;
	url?: string | null;
	labelVi: string;
	labelEn?: string | null;
	target?: '_self' | '_blank';
	isMega?: boolean;
	data?: Record<string, unknown>;
	children?: MenuItemInput[];
};

// ---------------------------------------------------------------------------
// Cache (public reads only; admin writes go straight through)
// ---------------------------------------------------------------------------

const TTL_MS = 60_000;
type CacheEntry = { tree: MenuTree | null; loadedAt: number };
const byLocation = new Map<string, CacheEntry>();

export function invalidateMenus(): void {
	byLocation.clear();
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

export async function listMenus(): Promise<Array<MenuRow & { itemCount: number }>> {
	const rows = await db.select().from(menu).orderBy(asc(menu.name));
	if (rows.length === 0) return [];
	const items = await db
		.select({ menuId: menuItem.menuId })
		.from(menuItem)
		.where(
			inArray(
				menuItem.menuId,
				rows.map((r) => r.id)
			)
		);
	const counts = new Map<string, number>();
	for (const it of items) counts.set(it.menuId, (counts.get(it.menuId) ?? 0) + 1);
	return rows.map((r) => ({ ...r, itemCount: counts.get(r.id) ?? 0 }));
}

export async function getMenu(id: string): Promise<MenuTree | null> {
	const [row] = await db.select().from(menu).where(eq(menu.id, id));
	if (!row) return null;
	const items = await db
		.select()
		.from(menuItem)
		.where(eq(menuItem.menuId, id))
		.orderBy(asc(menuItem.sortOrder));
	return { ...row, items: buildTree(items) };
}

export async function getMenuByLocation(location: string): Promise<MenuTree | null> {
	const cached = byLocation.get(location);
	if (cached && Date.now() - cached.loadedAt < TTL_MS) return cached.tree;
	const [row] = await db
		.select()
		.from(menu)
		.where(and(eq(menu.location, location), eq(menu.isActive, true)));
	if (!row) {
		byLocation.set(location, { tree: null, loadedAt: Date.now() });
		return null;
	}
	const items = await db
		.select()
		.from(menuItem)
		.where(eq(menuItem.menuId, row.id))
		.orderBy(asc(menuItem.sortOrder));
	const tree = { ...row, items: buildTree(items) };
	byLocation.set(location, { tree, loadedAt: Date.now() });
	return tree;
}

function buildTree(rows: MenuItemRow[]): MenuItemNode[] {
	const byId = new Map<string, MenuItemNode>();
	for (const r of rows) {
		byId.set(r.id, { ...r, dataParsed: safeJson(r.data), children: [] });
	}
	const roots: MenuItemNode[] = [];
	for (const node of byId.values()) {
		if (node.parentId && byId.has(node.parentId)) {
			byId.get(node.parentId)!.children.push(node);
		} else {
			roots.push(node);
		}
	}
	const sortRec = (list: MenuItemNode[]) => {
		list.sort((a, b) => a.sortOrder - b.sortOrder);
		for (const n of list) sortRec(n.children);
	};
	sortRec(roots);
	return roots;
}

function safeJson(raw: string): Record<string, unknown> {
	try {
		const v = JSON.parse(raw || '{}');
		return v && typeof v === 'object' ? (v as Record<string, unknown>) : {};
	} catch {
		return {};
	}
}

// ---------------------------------------------------------------------------
// Write
// ---------------------------------------------------------------------------

export type MenuWriteInput = {
	slug?: string;
	name: string;
	location?: string | null;
	isActive?: boolean;
};

export async function createMenu(input: MenuWriteInput): Promise<{ id: string }> {
	const id = crypto.randomUUID();
	const slug = await uniqueSlug(input.slug || input.name || 'menu');
	const now = new Date();
	await db.insert(menu).values({
		id,
		slug,
		name: input.name,
		location: input.location?.trim() ? input.location.trim() : null,
		isActive: input.isActive ?? true,
		createdAt: now,
		updatedAt: now
	});
	invalidateMenus();
	return { id };
}

export async function updateMenu(id: string, input: MenuWriteInput): Promise<void> {
	const now = new Date();
	const updates: Partial<typeof menu.$inferInsert> = {
		name: input.name,
		location: input.location?.trim() ? input.location.trim() : null,
		updatedAt: now
	};
	if (input.isActive !== undefined) updates.isActive = input.isActive;
	if (input.slug?.trim()) updates.slug = await uniqueSlug(input.slug, id);
	await db.update(menu).set(updates).where(eq(menu.id, id));
	invalidateMenus();
}

export async function deleteMenu(id: string): Promise<void> {
	await db.delete(menu).where(eq(menu.id, id));
	invalidateMenus();
}

export async function replaceMenuItems(menuId: string, items: MenuItemInput[]): Promise<void> {
	await db.delete(menuItem).where(eq(menuItem.menuId, menuId));
	const flat = flattenForInsert(menuId, null, items);
	if (flat.length > 0) {
		// SQLite has a 999 bind-var limit per statement; chunk for safety.
		const CHUNK = 200;
		for (let i = 0; i < flat.length; i += CHUNK) {
			await db.insert(menuItem).values(flat.slice(i, i + CHUNK));
		}
	}
	const now = new Date();
	await db.update(menu).set({ updatedAt: now }).where(eq(menu.id, menuId));
	invalidateMenus();
}

function flattenForInsert(
	menuId: string,
	parentId: string | null,
	nodes: MenuItemInput[]
): (typeof menuItem.$inferInsert)[] {
	const out: (typeof menuItem.$inferInsert)[] = [];
	nodes.forEach((n, i) => {
		const id = n.id?.trim() || crypto.randomUUID();
		out.push({
			id,
			menuId,
			parentId,
			sortOrder: n.sortOrder ?? i,
			kind: n.kind,
			refId: n.refId ?? null,
			url: n.url ?? null,
			labelVi: n.labelVi ?? '',
			labelEn: n.labelEn ?? null,
			target: n.target ?? '_self',
			isMega: !!n.isMega,
			data: JSON.stringify(n.data ?? {})
		});
		if (n.children?.length) out.push(...flattenForInsert(menuId, id, n.children));
	});
	return out;
}

// Slug uniqueness helper. `excludeId` lets an existing menu keep its slug.
async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
	const root = slugifyMenu(base) || 'menu';
	let candidate = root;
	let i = 2;
	for (;;) {
		const rows = await db.select({ id: menu.id }).from(menu).where(eq(menu.slug, candidate));
		const conflict = rows.find((r) => r.id !== excludeId);
		if (!conflict) return candidate;
		candidate = `${root}-${i++}`;
		if (i > 500) throw new Error('Could not allocate unique menu slug');
	}
}

export function slugifyMenu(s: string): string {
	return s
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.replace(/đ/gi, 'd')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 80);
}

// ---------------------------------------------------------------------------
// Resolver: turn a menu tree into renderable, locale-aware nav data.
// ---------------------------------------------------------------------------

export type ResolvedLink = {
	id: string;
	href: string;
	target: '_self' | '_blank';
	label: string;
	kind: MenuItemKind;
};

export type ResolvedMegaPromo = {
	imageUrl: string;
	eyebrow: string;
	heading: string;
	desc: string;
	ctaLabel: string;
	ctaUrl: string;
};

export type ResolvedMegaColumn = {
	heading: string;
	links: ResolvedLink[];
};

export type ResolvedMegaFeatured = {
	heading: string;
	products: ProductDTO[];
};

export type ResolvedNavItem = ResolvedLink & {
	children: ResolvedNavItem[];
	isMega: boolean;
	mega?: {
		columns: ResolvedMegaColumn[];
		featured?: ResolvedMegaFeatured;
		promo?: ResolvedMegaPromo;
	};
};

type RefMaps = {
	categoryHrefs: Map<string, string>;
	categoryLabelsVi: Map<string, string>;
	categoryLabelsEn: Map<string, string>;
	projectCategoryHrefs: Map<string, string>;
	projectCategoryLabelsVi: Map<string, string>;
	projectCategoryLabelsEn: Map<string, string>;
	postHrefs: Map<string, string>;
	postLabelsVi: Map<string, string>;
	postLabelsEn: Map<string, string>;
	pageHrefs: Map<string, string>;
	pageLabelsVi: Map<string, string>;
	pageLabelsEn: Map<string, string>;
	products: Map<string, ProductDTO>;
};

export async function resolveMenuTree(
	tree: MenuTree | null,
	locale: 'vi' | 'en' = 'vi'
): Promise<ResolvedNavItem[]> {
	if (!tree || tree.items.length === 0) return [];
	const refs = await loadRefMaps(tree.items);
	return tree.items.map((n) => resolveNode(n, locale, refs));
}

function resolveNode(node: MenuItemNode, locale: 'vi' | 'en', refs: RefMaps): ResolvedNavItem {
	const link = resolveLink(node, locale, refs);
	const item: ResolvedNavItem = {
		...link,
		children: node.children
			.filter((c) => !isMegaSpecial(c.kind))
			.map((c) => resolveNode(c, locale, refs)),
		isMega: node.isMega
	};
	if (node.isMega) {
		const columns: ResolvedMegaColumn[] = [];
		let promo: ResolvedMegaPromo | undefined;
		let featured: ResolvedMegaFeatured | undefined;
		for (const c of node.children) {
			if (c.kind === 'mega_column') {
				columns.push({
					heading: pickLocale(c.labelVi, c.labelEn, locale),
					links: c.children.map((cl) => resolveLink(cl, locale, refs))
				});
			} else if (c.kind === 'mega_promo') {
				const d = c.dataParsed as Record<string, unknown>;
				promo = {
					imageUrl: String(d.imageUrl ?? ''),
					eyebrow: pickLocale(String(d.eyebrowVi ?? ''), String(d.eyebrowEn ?? ''), locale),
					heading: pickLocale(c.labelVi, c.labelEn, locale),
					desc: pickLocale(String(d.descVi ?? ''), String(d.descEn ?? ''), locale),
					ctaLabel: pickLocale(String(d.ctaLabelVi ?? ''), String(d.ctaLabelEn ?? ''), locale),
					ctaUrl: String(d.ctaUrl ?? c.url ?? '')
				};
			} else if (c.kind === 'mega_featured') {
				const d = c.dataParsed as Record<string, unknown>;
				const ids = Array.isArray(d.productIds) ? (d.productIds as string[]) : [];
				const products = ids.map((id) => refs.products.get(id)).filter((p): p is ProductDTO => !!p);
				featured = {
					heading: pickLocale(c.labelVi, c.labelEn, locale),
					products
				};
			}
		}
		item.mega = { columns, promo, featured };
	}
	return item;
}

function resolveLink(node: MenuItemNode, locale: 'vi' | 'en', refs: RefMaps): ResolvedLink {
	let href: string;
	let labelFallback = '';
	switch (node.kind) {
		case 'category':
			href = node.refId ? (refs.categoryHrefs.get(node.refId) ?? '/products') : '/products';
			labelFallback = node.refId
				? ((locale === 'en'
						? refs.categoryLabelsEn.get(node.refId)
						: refs.categoryLabelsVi.get(node.refId)) ?? '')
				: '';
			break;
		case 'project_category':
			href = node.refId ? (refs.projectCategoryHrefs.get(node.refId) ?? '/projects') : '/projects';
			labelFallback = node.refId
				? ((locale === 'en'
						? refs.projectCategoryLabelsEn.get(node.refId)
						: refs.projectCategoryLabelsVi.get(node.refId)) ?? '')
				: '';
			break;
		case 'post':
			href = node.refId ? (refs.postHrefs.get(node.refId) ?? '/news') : '/news';
			labelFallback = node.refId
				? ((locale === 'en'
						? refs.postLabelsEn.get(node.refId)
						: refs.postLabelsVi.get(node.refId)) ?? '')
				: '';
			break;
		case 'page':
			href = node.refId ? (refs.pageHrefs.get(node.refId) ?? '/') : '/';
			labelFallback = node.refId
				? ((locale === 'en'
						? refs.pageLabelsEn.get(node.refId)
						: refs.pageLabelsVi.get(node.refId)) ?? '')
				: '';
			break;
		case 'route':
		case 'custom':
			href = node.url ?? '';
			break;
		case 'showroom':
			href = '/contact';
			break;
		default:
			href = node.url ?? '';
	}
	const label = pickLocale(node.labelVi, node.labelEn, locale) || labelFallback;
	return {
		id: node.id,
		href,
		target: (node.target === '_blank' ? '_blank' : '_self') as '_self' | '_blank',
		label,
		kind: node.kind as MenuItemKind
	};
}

async function loadProductsByIds(ids: string[]): Promise<ProductDTO[]> {
	if (ids.length === 0) return [];
	const rows = await db.select().from(product).where(inArray(product.id, ids));
	const specs = await db
		.select({
			productId: productSpec.productId,
			label: productSpec.label,
			sortOrder: productSpec.sortOrder
		})
		.from(productSpec)
		.where(inArray(productSpec.productId, ids))
		.orderBy(asc(productSpec.productId), asc(productSpec.sortOrder));
	const byProduct = new Map<string, string[]>();
	for (const s of specs) {
		const list = byProduct.get(s.productId) ?? [];
		list.push(s.label);
		byProduct.set(s.productId, list);
	}
	const orderById = new Map(ids.map((id, i) => [id, i] as const));
	return rows
		.map((r) => ({
			id: r.id,
			code: r.code,
			vi: r.nameVi,
			en: r.nameEn,
			cat: r.categoryId,
			price: r.price,
			img: r.imageUrl,
			tag: r.tag ?? undefined,
			desc: r.descVi,
			descEn: r.descEn ?? undefined,
			descText: htmlToPlainText(r.descVi),
			specs: byProduct.get(r.id) ?? []
		}))
		.sort((a, b) => (orderById.get(a.id) ?? 0) - (orderById.get(b.id) ?? 0));
}

function isMegaSpecial(kind: string): boolean {
	return kind === 'mega_column' || kind === 'mega_promo' || kind === 'mega_featured';
}

function pickLocale(vi: string, en: string | null | undefined, locale: 'vi' | 'en'): string {
	if (locale === 'en') return (en && en.trim()) || vi;
	return vi;
}

async function loadRefMaps(roots: MenuItemNode[]): Promise<RefMaps> {
	const collect = {
		category: new Set<string>(),
		project_category: new Set<string>(),
		post: new Set<string>(),
		page: new Set<string>(),
		products: new Set<string>()
	};
	const walk = (nodes: MenuItemNode[]): void => {
		for (const n of nodes) {
			if (n.refId) {
				if (n.kind === 'category') collect.category.add(n.refId);
				else if (n.kind === 'project_category') collect.project_category.add(n.refId);
				else if (n.kind === 'post') collect.post.add(n.refId);
				else if (n.kind === 'page') collect.page.add(n.refId);
			}
			if (n.kind === 'mega_featured') {
				const d = n.dataParsed;
				const ids = Array.isArray(d.productIds) ? (d.productIds as string[]) : [];
				for (const id of ids) collect.products.add(id);
			}
			walk(n.children);
		}
	};
	walk(roots);

	const [cats, pcats, posts, pages, products] = await Promise.all([
		collect.category.size
			? db
					.select({ id: category.id, vi: category.nameVi, en: category.nameEn })
					.from(category)
					.where(inArray(category.id, [...collect.category]))
			: Promise.resolve([]),
		collect.project_category.size
			? db
					.select({
						id: projectCategory.id,
						vi: projectCategory.nameVi,
						en: projectCategory.nameEn
					})
					.from(projectCategory)
					.where(inArray(projectCategory.id, [...collect.project_category]))
			: Promise.resolve([]),
		collect.post.size
			? db
					.select({ id: post.id, slug: post.slug, vi: post.titleVi, en: post.titleEn })
					.from(post)
					.where(inArray(post.id, [...collect.post]))
			: Promise.resolve([]),
		collect.page.size
			? db
					.select({ id: page.id, slug: page.slug, vi: page.titleVi, en: page.titleEn })
					.from(page)
					.where(inArray(page.id, [...collect.page]))
			: Promise.resolve([]),
		collect.products.size
			? loadProductsByIds([...collect.products])
			: Promise.resolve([] as ProductDTO[])
	]);

	const refs: RefMaps = {
		categoryHrefs: new Map(),
		categoryLabelsVi: new Map(),
		categoryLabelsEn: new Map(),
		projectCategoryHrefs: new Map(),
		projectCategoryLabelsVi: new Map(),
		projectCategoryLabelsEn: new Map(),
		postHrefs: new Map(),
		postLabelsVi: new Map(),
		postLabelsEn: new Map(),
		pageHrefs: new Map(),
		pageLabelsVi: new Map(),
		pageLabelsEn: new Map(),
		products: new Map()
	};
	for (const r of cats) {
		refs.categoryHrefs.set(r.id, `/products?cat=${encodeURIComponent(r.id)}`);
		refs.categoryLabelsVi.set(r.id, r.vi);
		refs.categoryLabelsEn.set(r.id, r.en);
	}
	for (const r of pcats) {
		refs.projectCategoryHrefs.set(r.id, `/projects?cat=${encodeURIComponent(r.id)}`);
		refs.projectCategoryLabelsVi.set(r.id, r.vi);
		refs.projectCategoryLabelsEn.set(r.id, r.en);
	}
	for (const r of posts) {
		refs.postHrefs.set(r.id, `/news/${r.slug}`);
		refs.postLabelsVi.set(r.id, r.vi);
		refs.postLabelsEn.set(r.id, r.en);
	}
	for (const r of pages) {
		refs.pageHrefs.set(r.id, `/${r.slug}`);
		refs.pageLabelsVi.set(r.id, r.vi);
		refs.pageLabelsEn.set(r.id, r.en);
	}
	for (const p of products) refs.products.set(p.id, p);
	return refs;
}

// ---------------------------------------------------------------------------
// Default seed: bootstrap a "Primary" menu that mirrors the static header.
// Called by the loader when `primary` location has no menu yet.
// ---------------------------------------------------------------------------

export async function ensurePrimaryMenuSeed(): Promise<void> {
	const [existing] = await db
		.select({ id: menu.id })
		.from(menu)
		.where(eq(menu.location, 'primary'));
	if (existing) return;

	const cats = await db
		.select({ id: category.id, vi: category.nameVi, en: category.nameEn })
		.from(category)
		.orderBy(asc(category.sortOrder))
		.limit(6);
	const featured = await db
		.select({ id: product.id })
		.from(product)
		.orderBy(asc(product.createdAt))
		.limit(2);

	const tree: MenuItemInput[] = [
		{ kind: 'route', url: '/', labelVi: 'Trang chủ', labelEn: 'Home' },
		{ kind: 'route', url: '/about', labelVi: 'Giới thiệu', labelEn: 'About' },
		{
			kind: 'route',
			url: '/products',
			labelVi: 'Sản phẩm',
			labelEn: 'Products',
			isMega: true,
			children: [
				{
					kind: 'mega_column',
					labelVi: 'Theo loại sản phẩm',
					labelEn: 'By product type',
					children: cats.map((c) => ({
						kind: 'category',
						refId: c.id,
						labelVi: c.vi,
						labelEn: c.en
					}))
				},
				{
					kind: 'mega_column',
					labelVi: 'Theo ứng dụng',
					labelEn: 'By application',
					children: [
						{
							kind: 'custom',
							url: '/projects?cat=residential',
							labelVi: 'Nhà ở',
							labelEn: 'Residential'
						},
						{
							kind: 'custom',
							url: '/projects?cat=commercial',
							labelVi: 'Văn phòng',
							labelEn: 'Office'
						},
						{
							kind: 'custom',
							url: '/projects?cat=hotel',
							labelVi: 'Khách sạn',
							labelEn: 'Hotels'
						},
						{
							kind: 'custom',
							url: '/projects?cat=cafe',
							labelVi: 'Cafe & F&B',
							labelEn: 'Cafe & F&B'
						},
						{
							kind: 'custom',
							url: '/products',
							labelVi: 'Phòng tắm',
							labelEn: 'Bathroom'
						},
						{
							kind: 'custom',
							url: '/products',
							labelVi: 'Trần thả',
							labelEn: 'Ceiling'
						}
					]
				},
				{
					kind: 'mega_featured',
					labelVi: 'Sản phẩm nổi bật',
					labelEn: 'Featured products',
					data: { productIds: featured.map((p) => p.id) }
				},
				{
					kind: 'mega_promo',
					labelVi: 'Giảm 12% đơn từ 200m² + lắp đặt miễn phí',
					labelEn: '12% off orders from 200m² + free installation',
					url: '/quote',
					data: {
						imageUrl: '',
						eyebrowVi: 'Ưu đãi tháng 5',
						eyebrowEn: 'May offers',
						descVi: 'Áp dụng cho dự án thi công nội thất tháng 5/2026.',
						descEn: 'Applicable for interior construction projects in May 2026.',
						ctaLabelVi: 'Nhận báo giá',
						ctaLabelEn: 'Get a quote',
						ctaUrl: '/quote'
					}
				}
			]
		},
		{ kind: 'route', url: '/projects', labelVi: 'Dự án', labelEn: 'Projects' },
		{ kind: 'route', url: '/news', labelVi: 'Tin tức', labelEn: 'News' },
		{ kind: 'route', url: '/contact', labelVi: 'Liên hệ', labelEn: 'Contact' }
	];

	const { id } = await createMenu({
		name: 'Primary',
		slug: 'primary',
		location: 'primary',
		isActive: true
	});
	await replaceMenuItems(id, tree);
}
