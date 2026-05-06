import type { BlockType } from '$lib/page-blocks/types';
import { getBlockDefinition } from '$lib/page-blocks/registry';

export type BlockLike = {
	type: string;
	globalSettings: string | null;
	content: Record<string, Record<string, unknown>>;
};

const ICON_PATHS: Record<string, string> = {
	layout: 'M3 3h18v18H3zM3 9h18M9 21V9',
	type: 'M4 7V4h16v3M9 20h6M12 4v16',
	image: 'M3 3h18v18H3zM8.5 8.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM21 15l-5-5L5 21',
	grid: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
	'mouse-pointer-click': 'M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11',
	box: 'M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z',
	layers: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
	quote: 'M3 21c3 0 7-1 9-2 2 1 4 2 6 2M15 21c3 0 7-1 9-2 2 1 4 2 6 2',
	code: 'M16 18l6-6-6-6M8 6l-6 6 6 6'
};

export function blockIconPath(type: string): string {
	const def = getBlockDefinition(type as BlockType);
	const icon = def?.icon ?? 'box';
	return ICON_PATHS[icon] ?? ICON_PATHS.box;
}

export function getBlockSettings(block: BlockLike): Record<string, unknown> {
	try {
		return JSON.parse(block.globalSettings || '{}');
	} catch {
		return {};
	}
}

/**
 * One-line, human readable summary used in the left-rail block row.
 */
export function getBlockSummary(block: BlockLike): string {
	try {
		const content = (block.content?.['vi'] || block.content?.['en'] || {}) as Record<string, unknown>;
		const settings = getBlockSettings(block);
		switch (block.type) {
			case 'hero':
				return ((content.heading as string) || '').trim() || 'No heading yet';
			case 'text': {
				const body = (content.body as string) || '';
				const plain = body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
				return plain.slice(0, 80) || 'Empty text block';
			}
			case 'image':
				return settings.imageUrl ? (settings.alt as string) || 'Image' : 'No image set';
			case 'cta':
				return ((content.heading as string) || '').trim() || 'No heading yet';
			case 'testimonial':
				return content.authorName ? `“${truncate((content.quote as string) || '', 50)}” — ${content.authorName}` : 'Empty testimonial';
			case 'embed':
				return settings.embedType ? `${settings.embedType} embed` : 'No embed configured';
			case 'gallery': {
				const images = (content.images as string[]) || [];
				return images.length ? `${images.length} image${images.length === 1 ? '' : 's'}` : 'No images yet';
			}
			case 'product_grid':
				return ((content.title as string) || '').trim() || 'Product grid';
			case 'category_list':
				return ((content.title as string) || '').trim() || 'Category list';
			default:
				return block.type;
		}
	} catch {
		return block.type;
	}
}

/**
 * Returns a thumbnail URL that meaningfully represents the block, when one
 * is available (hero background, image, gallery first image, testimonial
 * author photo, cta background). Otherwise null — caller falls back to icon.
 */
export function getBlockThumb(block: BlockLike): string | null {
	const settings = getBlockSettings(block);
	const content = (block.content?.['vi'] || block.content?.['en'] || {}) as Record<string, unknown>;
	switch (block.type) {
		case 'hero':
			return (settings.backgroundImage as string) || null;
		case 'image':
			return (settings.imageUrl as string) || null;
		case 'cta':
			return (settings.backgroundImage as string) || null;
		case 'testimonial':
			return (content.authorImage as string) || null;
		case 'gallery': {
			const images = (content.images as string[]) || [];
			return images[0] || null;
		}
		default:
			return null;
	}
}

export function localeHasContent(block: BlockLike, locale: string): boolean {
	const def = getBlockDefinition(block.type as BlockType);
	if (!def) return false;
	const content = (block.content?.[locale] || {}) as Record<string, unknown>;
	return def.contentFields.some((f) => {
		const v = content[f.key];
		if (v == null || v === '') return false;
		if (Array.isArray(v)) return v.length > 0;
		return true;
	});
}

function truncate(s: string, n: number): string {
	if (s.length <= n) return s;
	return s.slice(0, n - 1) + '…';
}

export type BlockCategory = {
	key: string;
	label: string;
	types: BlockType[];
};

export const BLOCK_CATEGORIES: BlockCategory[] = [
	{ key: 'layout', label: 'Layout', types: ['hero'] },
	{ key: 'content', label: 'Content', types: ['text', 'cta', 'testimonial'] },
	{ key: 'media', label: 'Media', types: ['image', 'gallery', 'embed'] },
	{ key: 'commerce', label: 'Commerce', types: ['product_grid', 'category_list'] }
];
