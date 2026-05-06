import { requireAdmin } from '$lib/server/admin-guard';
import {
	getPage,
	getPageWithAllLocales,
	updatePage,
	validatePageInput,
	isRoutePatternTaken,
	createBlock,
	reorderBlocks,
	deleteBlock,
	setBlockActive,
	duplicateBlock,
	updateBlockContent,
	updateBlockSettings,
	getBlock,
	publishPage,
	hasUnpublishedChanges,
	listBlockTypes
} from '$lib/server/cms/admin';
import { sanitizeHtml } from '$lib/server/sanitize-html';
import type { ContentField, SettingsField } from '$lib/page-blocks/registry';
import { error, fail } from '@sveltejs/kit';

export async function load(event) {
	requireAdmin(event);
	const page = await getPageWithAllLocales(event.params.id);
	if (!page) error(404, 'Page not found');
	const dirty = await hasUnpublishedChanges(page.id);
	const blockDefinitions = await listBlockTypes();
	return { page, dirty, blockDefinitions };
}

function coerceField(field: SettingsField | ContentField, raw: FormDataEntryValue | null): unknown {
	if (field.type === 'boolean') {
		if (raw === null) return false;
		const v = String(raw);
		return v === '1' || v === 'true' || v === 'on';
	}
	if (raw === null) return field.type === 'number' ? 0 : '';
	const value = String(raw);
	if (field.type === 'number') {
		const n = Number(value);
		return Number.isFinite(n) ? n : 0;
	}
	if (field.type === 'imagelist') {
		try {
			const parsed = JSON.parse(value);
			return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
		} catch {
			return [];
		}
	}
	if ((field as ContentField).type === 'richtext') return sanitizeHtml(value);
	return value;
}

async function getDef(blockId: string) {
	const block = await getBlock(blockId);
	if (!block) return null;
	const defs = await listBlockTypes();
	const def = defs.find((d) => d.type === block.type);
	if (!def) return null;
	return { block, def };
}

export const actions = {
	// ---- Page-level ----
	savePage: async (event) => {
		requireAdmin(event);
		const data = await event.request.formData();
		const titleVi = (data.get('titleVi') as string) ?? '';
		const titleEn = (data.get('titleEn') as string) ?? '';
		const slug = ((data.get('slug') as string) ?? '').trim();
		const type = ((data.get('type') as string) || 'custom') as 'custom' | 'override';
		const routePattern = ((data.get('routePattern') as string) ?? '').trim() || null;
		const ogImage = ((data.get('ogImage') as string) ?? '').trim() || null;
		const canonicalUrl = ((data.get('canonicalUrl') as string) ?? '').trim() || null;
		const robots = ((data.get('robots') as string) ?? 'index,follow').trim();

		const err = validatePageInput({ titleVi, slug, type, routePattern });
		if (err) return fail(400, { error: err, scope: 'page' });

		if (type === 'override' && routePattern && (await isRoutePatternTaken(routePattern, event.params.id))) {
			return fail(400, { error: `Route ${routePattern} is already overridden by another page`, scope: 'page' });
		}

		await updatePage(event.params.id, {
			titleVi,
			titleEn,
			slug,
			type,
			routePattern,
			metaDescVi: (data.get('metaDescVi') as string) || null,
			metaDescEn: (data.get('metaDescEn') as string) || null,
			isActive: data.get('isActive') === '1',
			ogImage,
			canonicalUrl,
			robots
		});
		return { success: true, scope: 'page' };
	},

	publish: async (event) => {
		const admin = requireAdmin(event);
		const result = await publishPage(event.params.id, { userId: admin.id });
		return { success: true, scope: 'publish', publishedAt: result.publishedAt.toISOString() };
	},

	// ---- Block list ops ----
	addBlock: async (event) => {
		requireAdmin(event);
		const data = await event.request.formData();
		const type = data.get('type') as string;
		const insertAfterRaw = data.get('insertAfter');
		const page = await getPage(event.params.id);
		if (!page) error(404, 'Page not found');
		const sortOrder = page.blocks.length;
		const result = await createBlock(event.params.id, type, sortOrder);

		if (insertAfterRaw && typeof insertAfterRaw === 'string') {
			const ids = page.blocks.map((b) => b.id);
			const insertIdx = insertAfterRaw === '__start__' ? 0 : ids.indexOf(insertAfterRaw) + 1;
			if (insertIdx >= 0) {
				ids.splice(insertIdx, 0, result.id);
				await reorderBlocks(ids);
			}
		}
		return { success: true, scope: 'block', blockId: result.id };
	},
	reorder: async (event) => {
		requireAdmin(event);
		const data = await event.request.formData();
		const order = JSON.parse(data.get('order') as string) as string[];
		await reorderBlocks(order);
		return { success: true, scope: 'block' };
	},
	deleteBlock: async (event) => {
		requireAdmin(event);
		const data = await event.request.formData();
		const blockId = data.get('blockId') as string;
		await deleteBlock(blockId);
		return { success: true, scope: 'block' };
	},
	toggleActive: async (event) => {
		requireAdmin(event);
		const data = await event.request.formData();
		const blockId = data.get('blockId') as string;
		const isActive = data.get('isActive') === '1';
		await setBlockActive(blockId, isActive);
		return { success: true, scope: 'block' };
	},
	duplicate: async (event) => {
		requireAdmin(event);
		const data = await event.request.formData();
		const blockId = data.get('blockId') as string;
		const result = await duplicateBlock(blockId);
		return { success: true, scope: 'block', blockId: result.id };
	},
	copyLocale: async (event) => {
		requireAdmin(event);
		const data = await event.request.formData();
		const from = (data.get('from') as string) || 'vi';
		const to = (data.get('to') as string) || 'en';
		const page = await getPage(event.params.id);
		if (!page) error(404, 'Page not found');
		for (const block of page.blocks) {
			const full = await getBlock(block.id);
			if (!full) continue;
			const fromContent = full.content[from] || {};
			await updateBlockContent(block.id, to, fromContent as Record<string, unknown>);
		}
		return { success: true, scope: 'page', copiedLocale: to };
	},

	// ---- Inspector save (per-block, used by auto-save) ----
	saveBlockSettings: async (event) => {
		requireAdmin(event);
		const data = await event.request.formData();
		const blockId = data.get('blockId') as string;
		const ctx = await getDef(blockId);
		if (!ctx) error(404, 'Block not found');
		const settings: Record<string, unknown> = {};
		for (const field of ctx.def.settingsFields) {
			settings[field.key] = coerceField(field, data.get(`setting_${field.key}`));
		}
		await updateBlockSettings(blockId, settings);
		return { success: true, scope: 'inspector', tab: 'settings', blockId };
	},
	saveBlockContent: async (event) => {
		requireAdmin(event);
		const data = await event.request.formData();
		const blockId = data.get('blockId') as string;
		const locale = (data.get('locale') as string) || 'vi';
		const ctx = await getDef(blockId);
		if (!ctx) error(404, 'Block not found');
		const content: Record<string, unknown> = {};
		for (const field of ctx.def.contentFields) {
			content[field.key] = coerceField(field, data.get(`content_${field.key}`));
		}
		await updateBlockContent(blockId, locale, content);
		return { success: true, scope: 'inspector', tab: 'content', blockId, locale };
	},
	copyBlockFromVi: async (event) => {
		requireAdmin(event);
		const data = await event.request.formData();
		const blockId = data.get('blockId') as string;
		const block = await getBlock(blockId);
		if (!block) error(404, 'Block not found');
		const viContent = block.content['vi'] || {};
		await updateBlockContent(blockId, 'en', viContent as Record<string, unknown>);
		return { success: true, scope: 'inspector', tab: 'content', blockId, locale: 'en', copied: true };
	}
};
