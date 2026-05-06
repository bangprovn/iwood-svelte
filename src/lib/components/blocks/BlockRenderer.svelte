<script lang="ts">
	import type { Component } from 'svelte';
	import type { PageBlockDTO } from '$lib/server/repos/page.repo';
	import type { BlockType } from '$lib/page-blocks/types';
	import HeroBlock from './HeroBlock.svelte';
	import TextBlock from './TextBlock.svelte';
	import ImageBlock from './ImageBlock.svelte';
	import GalleryBlock from './GalleryBlock.svelte';
	import CtaBlock from './CtaBlock.svelte';
	import ProductGridBlock from './ProductGridBlock.svelte';
	import CategoryListBlock from './CategoryListBlock.svelte';
	import TestimonialBlock from './TestimonialBlock.svelte';
	import EmbedBlock from './EmbedBlock.svelte';

	const COMPONENTS: Record<BlockType, Component<any>> = {
		hero: HeroBlock,
		text: TextBlock,
		image: ImageBlock,
		gallery: GalleryBlock,
		cta: CtaBlock,
		product_grid: ProductGridBlock,
		category_list: CategoryListBlock,
		testimonial: TestimonialBlock,
		embed: EmbedBlock
	};

	type Props = {
		block: PageBlockDTO & { content: Record<string, unknown>; data?: unknown };
		locale: string;
	};

	let { block, locale }: Props = $props();

	const settings = $derived(JSON.parse(block.globalSettings || '{}'));
	const Comp = $derived(COMPONENTS[block.type as BlockType]);
</script>

{#if Comp}
	<Comp {block} content={block.content} {settings} {locale} data={block.data} />
{:else}
	<div class="unknown-block">
		<p>Unknown block type: {block.type}</p>
	</div>
{/if}

<style>
	.unknown-block {
		padding: 2rem;
		background: #fff3cd;
		border: 1px solid #ffc107;
		border-radius: var(--radius-sm);
		color: #856404;
		text-align: center;
	}
</style>
