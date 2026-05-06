import { and, asc, count, desc, eq, inArray } from 'drizzle-orm';
import { db } from '../db';
import { page, pageBlock, pageBlockContent, pageRevision } from '../db/schema';
import { getAllBlockDefinitions } from '$lib/page-blocks/registry';
import { listCategories, listProducts } from './public-repos';

export type PageDTO = typeof page.$inferSelect;
export type PageBlockDTO = typeof pageBlock.$inferSelect;
export type PageBlockContentDTO = typeof pageBlockContent.$inferSelect;

export type PageWithBlocks = PageDTO & {
	blocks: (PageBlockDTO & { content: Record<string, Record<string, unknown>> })[];
};

export async function listPages() {
	const pages = await db.select().from(page).orderBy(asc(page.sortOrder), desc(page.createdAt));
	if (pages.length === 0) return [];
	const counts = await db
		.select({ pageId: pageBlock.pageId, n: count() })
		.from(pageBlock)
		.where(
			inArray(
				pageBlock.pageId,
				pages.map((p) => p.id)
			)
		)
		.groupBy(pageBlock.pageId);
	const countMap = new Map(counts.map((c) => [c.pageId, Number(c.n)]));
	return pages.map((p) => ({ ...p, blockCount: countMap.get(p.id) ?? 0 }));
}

// Admin: returns the page row + LIVE (working-copy / draft) blocks. Used in
// the editor and in the preview route. Inactive blocks included so admins can
// see and reactivate them.
export async function getPage(id: string, locale = 'vi') {
	const [p] = await db.select().from(page).where(eq(page.id, id));
	if (!p) return null;
	const blocks = await listBlocksWithContent(p.id, locale, { onlyActive: false });
	return { ...p, blocks };
}

// Admin builder: returns the page row + LIVE blocks with content keyed by
// locale (so editors can see and edit every translation). Inactive blocks
// included.
export async function getPageWithAllLocales(id: string) {
	const [p] = await db.select().from(page).where(eq(page.id, id));
	if (!p) return null;
	const blocks = await listBlocks(p.id, { onlyActive: false });
	if (blocks.length === 0) return { ...p, blocks: [] as PageBlockAllLocales[] };

	const contentRows = await db
		.select()
		.from(pageBlockContent)
		.where(
			inArray(
				pageBlockContent.blockId,
				blocks.map((b) => b.id)
			)
		);

	const byBlock = new Map<string, Record<string, Record<string, unknown>>>();
	for (const row of contentRows) {
		const bag = byBlock.get(row.blockId) ?? {};
		bag[row.locale] = safeJson(row.content) as Record<string, unknown>;
		byBlock.set(row.blockId, bag);
	}

	const enriched: PageBlockAllLocales[] = blocks.map((b) => ({
		...b,
		content: byBlock.get(b.id) ?? {}
	}));
	return { ...p, blocks: enriched };
}

export type PageBlockAllLocales = PageBlockDTO & {
	content: Record<string, Record<string, unknown>>;
};

// Admin preview: live blocks but only active ones, enriched (matches public
// render except it bypasses the published-snapshot gate).
export async function getPagePreviewById(id: string, locale: string) {
	const [p] = await db.select().from(page).where(eq(page.id, id));
	if (!p) return null;
	const blocks = await listBlocksWithContent(p.id, locale, { onlyActive: true, enrichData: true });
	return { ...p, blocks };
}

// Public read: only ever serves the last-published snapshot. Pages that have
// never been published are treated as nonexistent (returns null). Dynamic
// blocks (product_grid, category_list) re-resolve catalog data at request
// time so published pages stay current with the catalog.
export async function getPageBySlug(slug: string, locale: string) {
	const [p] = await db
		.select()
		.from(page)
		.where(and(eq(page.slug, slug), eq(page.isActive, true)));
	if (!p) return null;
	const blocks = await blocksFromSnapshot(p.publishedSnapshot, locale);
	if (!blocks) return null;
	return { ...p, blocks };
}

export async function getPageOverride(routePattern: string, locale: string) {
	const [p] = await db
		.select()
		.from(page)
		.where(and(eq(page.routePattern, routePattern), eq(page.isActive, true)));
	if (!p) return null;
	const blocks = await blocksFromSnapshot(p.publishedSnapshot, locale);
	if (!blocks) return null;
	return { ...p, blocks };
}

type SnapshotBlock = {
	id: string;
	type: string;
	sortOrder: number;
	isActive: boolean;
	globalSettings: Record<string, unknown>;
	content: Record<string, unknown>;
};

type SerializedSnapshot = {
	blocksByLocale: Record<string, SnapshotBlock[]>;
};

async function blocksFromSnapshot(
	snapshotJson: string | null,
	locale: string
): Promise<(PageBlockDTO & { content: Record<string, unknown>; data?: unknown })[] | null> {
	if (!snapshotJson) return null;
	let snap: SerializedSnapshot;
	try {
		snap = JSON.parse(snapshotJson);
	} catch {
		return null;
	}
	const localeBlocks = snap.blocksByLocale?.[locale] ?? snap.blocksByLocale?.['vi'] ?? [];
	const shaped = localeBlocks.map((b) => ({
		id: b.id,
		pageId: '', // not preserved in snapshot; not needed by renderer
		type: b.type,
		sortOrder: b.sortOrder,
		isActive: b.isActive,
		globalSettings: JSON.stringify(b.globalSettings ?? {}),
		content: b.content ?? {},
		data: undefined as unknown
	}));
	await enrichBlockData(shaped);
	return shaped;
}

async function enrichBlockData(
	blocks: { type: string; globalSettings: string; data?: unknown }[]
): Promise<void> {
	await Promise.all(
		blocks.map(async (b) => {
			const settings = safeJson(b.globalSettings) as Record<string, unknown>;
			if (b.type === 'product_grid') {
				const categoryId = settings.categoryId as string | undefined;
				if (!categoryId) {
					b.data = [];
					return;
				}
				const max = Number(settings.maxItems) || 8;
				b.data = await listProducts({ categoryId, limit: Math.max(1, Math.min(48, max)) });
			} else if (b.type === 'category_list') {
				const max = Number(settings.maxItems) || 8;
				const all = await listCategories();
				b.data = all.slice(0, Math.max(1, Math.min(48, max)));
			}
		})
	);
}

export type PageWriteInput = {
	id?: string;
	slug?: string;
	type?: 'custom' | 'override';
	routePattern?: string | null;
	titleVi: string;
	titleEn: string;
	metaDescVi?: string | null;
	metaDescEn?: string | null;
	ogImage?: string | null;
	canonicalUrl?: string | null;
	robots?: string;
	isActive?: boolean;
	sortOrder?: number;
};

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ROUTE_RE = /^\/[A-Za-z0-9\-_/]*$/;

export function validatePageInput(
	input: Partial<PageWriteInput> & {
		titleVi?: string;
		slug?: string;
		type?: string;
		routePattern?: string | null;
	}
): string | null {
	if (input.titleVi !== undefined && !input.titleVi.trim()) return 'Vietnamese title is required';
	if (input.slug !== undefined) {
		const s = input.slug.trim();
		if (!s) return 'Slug is required';
		if (s.length > 80) return 'Slug must be 80 characters or fewer';
		if (!SLUG_RE.test(s)) return 'Slug must be lowercase letters, numbers, and single hyphens';
	}
	if (input.type === 'override') {
		const rp = (input.routePattern ?? '').trim();
		if (!rp) return 'Override route is required for override pages';
		if (!ROUTE_RE.test(rp))
			return 'Route must start with / and contain only letters, numbers, hyphens, underscores, slashes';
		if (rp.includes('..')) return 'Route may not contain ..';
		if (rp.startsWith('/admin') || rp.startsWith('/api/') || rp.startsWith('/_app/'))
			return 'Cannot override system routes (/admin, /api, /_app)';
	}
	return null;
}

export async function isRoutePatternTaken(
	routePattern: string,
	excludeId?: string
): Promise<boolean> {
	const rows = await db
		.select({ id: page.id })
		.from(page)
		.where(and(eq(page.type, 'override'), eq(page.routePattern, routePattern)));
	return rows.some((r) => r.id !== excludeId);
}

export async function createPage(input: PageWriteInput) {
	const id = input.id || crypto.randomUUID();
	await db.insert(page).values({
		id,
		slug: input.slug || id,
		type: input.type || 'custom',
		routePattern: input.routePattern || null,
		titleVi: input.titleVi,
		titleEn: input.titleEn,
		metaDescVi: input.metaDescVi || null,
		metaDescEn: input.metaDescEn || null,
		ogImage: input.ogImage ?? null,
		canonicalUrl: input.canonicalUrl ?? null,
		robots: input.robots ?? 'index,follow',
		isActive: input.isActive ?? true,
		sortOrder: input.sortOrder ?? 0
	});
	return { id };
}

export async function updatePage(id: string, input: Partial<PageWriteInput>) {
	await db
		.update(page)
		.set({
			...(input.slug !== undefined ? { slug: input.slug } : {}),
			...(input.type !== undefined ? { type: input.type } : {}),
			...(input.routePattern !== undefined ? { routePattern: input.routePattern } : {}),
			...(input.titleVi !== undefined ? { titleVi: input.titleVi } : {}),
			...(input.titleEn !== undefined ? { titleEn: input.titleEn } : {}),
			...(input.metaDescVi !== undefined ? { metaDescVi: input.metaDescVi } : {}),
			...(input.metaDescEn !== undefined ? { metaDescEn: input.metaDescEn } : {}),
			...(input.ogImage !== undefined ? { ogImage: input.ogImage } : {}),
			...(input.canonicalUrl !== undefined ? { canonicalUrl: input.canonicalUrl } : {}),
			...(input.robots !== undefined ? { robots: input.robots } : {}),
			...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
			...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
			updatedAt: new Date()
		})
		.where(eq(page.id, id));
}

export async function deletePage(id: string) {
	await db.delete(page).where(eq(page.id, id));
}

export async function duplicatePage(id: string) {
	const original = await getPage(id);
	if (!original) throw new Error('Page not found');
	const newId = crypto.randomUUID();
	await db.insert(page).values({
		id: newId,
		slug: `${original.slug}-copy-${Date.now()}`,
		type: original.type,
		routePattern: null,
		titleVi: `${original.titleVi} (Copy)`,
		titleEn: `${original.titleEn} (Copy)`,
		metaDescVi: original.metaDescVi,
		metaDescEn: original.metaDescEn,
		isActive: false,
		sortOrder: original.sortOrder + 1
	});
	for (const block of original.blocks) {
		const newBlockId = crypto.randomUUID();
		await db.insert(pageBlock).values({
			id: newBlockId,
			pageId: newId,
			type: block.type,
			sortOrder: block.sortOrder,
			isActive: block.isActive,
			globalSettings: block.globalSettings
		});
		for (const [locale, content] of Object.entries(block.content)) {
			await db.insert(pageBlockContent).values({
				blockId: newBlockId,
				locale,
				content: JSON.stringify(content)
			});
		}
	}
	return { id: newId };
}

async function listBlocks(pageId: string, opts: { onlyActive?: boolean } = {}) {
	const where = opts.onlyActive
		? and(eq(pageBlock.pageId, pageId), eq(pageBlock.isActive, true))
		: eq(pageBlock.pageId, pageId);
	const blocks = await db.select().from(pageBlock).where(where).orderBy(asc(pageBlock.sortOrder));
	return blocks;
}

async function listBlocksWithContent(
	pageId: string,
	locale: string,
	opts: { onlyActive?: boolean; enrichData?: boolean } = {}
) {
	const blocks = await listBlocks(pageId, opts);
	if (blocks.length === 0) return [];

	const contentRows = await db
		.select()
		.from(pageBlockContent)
		.where(
			and(
				inArray(
					pageBlockContent.blockId,
					blocks.map((b) => b.id)
				),
				eq(pageBlockContent.locale, locale)
			)
		);
	const contentMap = new Map<string, Record<string, unknown>>();
	for (const row of contentRows) {
		contentMap.set(row.blockId, JSON.parse(row.content));
	}

	const enriched = blocks.map((b) => ({
		...b,
		content: contentMap.get(b.id) ?? {},
		data: undefined as unknown
	}));

	if (opts.enrichData) await enrichBlockData(enriched);
	return enriched;
}

// --- Publish / revisions ---------------------------------------------------

const SUPPORTED_LOCALES = ['vi', 'en'] as const;

async function buildSnapshot(pageId: string): Promise<string> {
	const blocks = await listBlocks(pageId, { onlyActive: true });
	const blockIds = blocks.map((b) => b.id);
	const allContent = blockIds.length
		? await db.select().from(pageBlockContent).where(inArray(pageBlockContent.blockId, blockIds))
		: [];

	const blocksByLocale: Record<string, SnapshotBlock[]> = {};
	for (const locale of SUPPORTED_LOCALES) blocksByLocale[locale] = [];

	for (const b of blocks) {
		const settings = safeJson(b.globalSettings) as Record<string, unknown>;
		const contentByLocale: Record<string, Record<string, unknown>> = {};
		for (const row of allContent) {
			if (row.blockId !== b.id) continue;
			contentByLocale[row.locale] = safeJson(row.content) as Record<string, unknown>;
		}
		const baseLocale = contentByLocale['vi'] ?? Object.values(contentByLocale)[0] ?? {};
		for (const locale of SUPPORTED_LOCALES) {
			blocksByLocale[locale].push({
				id: b.id,
				type: b.type,
				sortOrder: b.sortOrder,
				isActive: b.isActive,
				globalSettings: settings,
				content: contentByLocale[locale] ?? baseLocale
			});
		}
	}

	return JSON.stringify({ blocksByLocale });
}

export async function publishPage(
	pageId: string,
	opts: { userId?: string | null; note?: string | null } = {}
) {
	const snapshot = await buildSnapshot(pageId);
	const now = new Date();
	await db
		.update(page)
		.set({ publishedAt: now, publishedSnapshot: snapshot, updatedAt: now })
		.where(eq(page.id, pageId));
	await db.insert(pageRevision).values({
		pageId,
		snapshot,
		publishedAt: now,
		publishedBy: opts.userId ?? null,
		note: opts.note ?? null
	});
	return { publishedAt: now };
}

export async function listRevisions(pageId: string) {
	return db
		.select({
			id: pageRevision.id,
			pageId: pageRevision.pageId,
			publishedAt: pageRevision.publishedAt,
			publishedBy: pageRevision.publishedBy,
			note: pageRevision.note
		})
		.from(pageRevision)
		.where(eq(pageRevision.pageId, pageId))
		.orderBy(desc(pageRevision.publishedAt));
}

export async function getRevision(revisionId: number) {
	const [rev] = await db.select().from(pageRevision).where(eq(pageRevision.id, revisionId));
	return rev ?? null;
}

// Restore the live page_block / page_block_content tables from a past
// revision's snapshot, then re-publish it. Note: this overwrites the working
// copy. Caller may want to publish a new revision marker as well.
export async function revertToRevision(
	pageId: string,
	revisionId: number,
	opts: { userId?: string | null } = {}
) {
	const rev = await getRevision(revisionId);
	if (!rev || rev.pageId !== pageId) throw new Error('Revision not found for this page');
	let snap: SerializedSnapshot;
	try {
		snap = JSON.parse(rev.snapshot);
	} catch {
		throw new Error('Revision snapshot is corrupt');
	}
	// Use any locale's structure as the source of truth for block ids/types/settings
	const sourceLocale =
		Object.keys(snap.blocksByLocale).find((l) => snap.blocksByLocale[l]?.length) ?? 'vi';
	const sourceBlocks = snap.blocksByLocale[sourceLocale] ?? [];

	// Wipe live blocks for this page (cascade clears content rows)
	await db.delete(pageBlock).where(eq(pageBlock.pageId, pageId));

	for (const b of sourceBlocks) {
		await db.insert(pageBlock).values({
			id: b.id,
			pageId,
			type: b.type,
			sortOrder: b.sortOrder,
			isActive: b.isActive,
			globalSettings: JSON.stringify(b.globalSettings ?? {})
		});
		for (const locale of Object.keys(snap.blocksByLocale)) {
			const localeBlock = snap.blocksByLocale[locale].find((x) => x.id === b.id);
			if (!localeBlock) continue;
			await db.insert(pageBlockContent).values({
				blockId: b.id,
				locale,
				content: JSON.stringify(localeBlock.content ?? {})
			});
		}
	}

	// Re-publish: writes a fresh snapshot + new revision row marked as a revert
	await publishPage(pageId, {
		userId: opts.userId ?? null,
		note: `Reverted to revision ${revisionId}`
	});
}

// True if the live blocks/content differ from the last published snapshot.
// Used to show a "you have unpublished changes" indicator.
export async function hasUnpublishedChanges(pageId: string): Promise<boolean> {
	const [p] = await db.select().from(page).where(eq(page.id, pageId));
	if (!p) return false;
	if (!p.publishedSnapshot) return true;
	const liveSnapshot = await buildSnapshot(pageId);
	return liveSnapshot !== p.publishedSnapshot;
}

function safeJson(s: string | null | undefined): unknown {
	if (!s) return {};
	try {
		return JSON.parse(s);
	} catch {
		return {};
	}
}

export async function createBlock(pageId: string, type: string, sortOrder: number) {
	const def = getAllBlockDefinitions().find((d) => d.type === type);
	if (!def) throw new Error(`Unknown block type: ${type}`);
	const id = crypto.randomUUID();
	await db.insert(pageBlock).values({
		id,
		pageId,
		type,
		sortOrder,
		isActive: true,
		globalSettings: JSON.stringify(def.defaultSettings)
	});
	const defaultContent: Record<string, unknown> = { ...def.defaultContent };
	for (const locale of ['vi', 'en']) {
		await db.insert(pageBlockContent).values({
			blockId: id,
			locale,
			content: JSON.stringify(defaultContent)
		});
	}
	return { id };
}

export async function updateBlockSettings(blockId: string, settings: Record<string, unknown>) {
	await db
		.update(pageBlock)
		.set({ globalSettings: JSON.stringify(settings) })
		.where(eq(pageBlock.id, blockId));
}

export async function updateBlockContent(
	blockId: string,
	locale: string,
	content: Record<string, unknown>
) {
	const [existing] = await db
		.select()
		.from(pageBlockContent)
		.where(and(eq(pageBlockContent.blockId, blockId), eq(pageBlockContent.locale, locale)));
	if (existing) {
		await db
			.update(pageBlockContent)
			.set({ content: JSON.stringify(content) })
			.where(eq(pageBlockContent.id, existing.id));
	} else {
		await db.insert(pageBlockContent).values({ blockId, locale, content: JSON.stringify(content) });
	}
}

export async function reorderBlocks(blockIds: string[]) {
	for (let i = 0; i < blockIds.length; i++) {
		await db.update(pageBlock).set({ sortOrder: i }).where(eq(pageBlock.id, blockIds[i]));
	}
}

export async function deleteBlock(blockId: string) {
	await db.delete(pageBlock).where(eq(pageBlock.id, blockId));
}

export async function setBlockActive(blockId: string, isActive: boolean) {
	await db.update(pageBlock).set({ isActive }).where(eq(pageBlock.id, blockId));
}

export async function duplicateBlock(blockId: string) {
	const [original] = await db.select().from(pageBlock).where(eq(pageBlock.id, blockId));
	if (!original) throw new Error('Block not found');
	const newId = crypto.randomUUID();
	await db.insert(pageBlock).values({
		id: newId,
		pageId: original.pageId,
		type: original.type,
		sortOrder: original.sortOrder + 1,
		isActive: original.isActive,
		globalSettings: original.globalSettings
	});
	const contents = await db
		.select()
		.from(pageBlockContent)
		.where(eq(pageBlockContent.blockId, blockId));
	for (const c of contents) {
		await db.insert(pageBlockContent).values({
			blockId: newId,
			locale: c.locale,
			content: c.content
		});
	}
	return { id: newId };
}

export async function getBlock(id: string) {
	const [block] = await db.select().from(pageBlock).where(eq(pageBlock.id, id));
	if (!block) return null;
	const contents = await db.select().from(pageBlockContent).where(eq(pageBlockContent.blockId, id));
	const contentMap: Record<string, Record<string, unknown>> = {};
	for (const c of contents) {
		contentMap[c.locale] = JSON.parse(c.content);
	}
	return { ...block, content: contentMap };
}

export async function getBlockWithPage(blockId: string) {
	const block = await getBlock(blockId);
	if (!block) return null;
	const [pageRow] = await db.select().from(page).where(eq(page.id, block.pageId));
	return { block, page: pageRow };
}

export async function listBlockTypes() {
	const categories = await listCategories();
	return getAllBlockDefinitions().map((def) => {
		if (def.type === 'product_grid') {
			return {
				...def,
				settingsFields: def.settingsFields.map((f) =>
					f.key === 'categoryId'
						? { ...f, options: categories.map((c) => ({ value: c.id, label: c.vi })) }
						: f
				)
			};
		}
		return def;
	});
}
