<script lang="ts">
	import type { GallerySettings, GalleryContent } from '$lib/page-blocks/types';
	import { lightbox } from '$lib/state/lightbox.svelte';

	type Props = {
		block: { id: string; type: string };
		content: Record<string, unknown>;
		settings: GallerySettings;
		locale: string;
	};

	let { content, settings }: Props = $props();

	const c = content as unknown as GalleryContent;
	const images: string[] = c.images || [];

	function openLightbox(startIndex: number) {
		if (!settings.lightboxEnabled) return;
		const items = images.map((src) => ({ img: src }));
		lightbox.show(items, startIndex);
	}
</script>

<div
	class="gallery-block"
	style:--cols={settings.columns || 3}
	style:gap={`${settings.gap || 16}px`}
	style:border-radius={settings.borderRadius ? 'var(--radius-md)' : '0'}
>
	{#each images as src, i}
		<button
			type="button"
			class="gallery-item"
			onclick={() => openLightbox(i)}
			style:border-radius={settings.borderRadius ? 'var(--radius-sm)' : '0'}
		>
			<img {src} alt={`Gallery image ${i + 1}`} loading="lazy" />
		</button>
	{/each}
</div>

<style>
	.gallery-block {
		display: grid;
		grid-template-columns: repeat(var(--cols, 3), 1fr);
		overflow: hidden;
	}

	@media (max-width: 900px) {
		.gallery-block {
			grid-template-columns: repeat(min(var(--cols, 3), 3), 1fr);
		}
	}
	@media (max-width: 640px) {
		.gallery-block {
			grid-template-columns: repeat(min(var(--cols, 3), 2), 1fr);
		}
	}
	@media (max-width: 420px) {
		.gallery-block {
			grid-template-columns: 1fr;
		}
	}

	.gallery-item {
		appearance: none;
		background: none;
		border: none;
		padding: 0;
		cursor: zoom-in;
		overflow: hidden;
		display: block;
	}

	.gallery-item img {
		width: 100%;
		aspect-ratio: 1;
		object-fit: cover;
		transition: transform var(--dur-base) var(--ease-out);
		display: block;
	}

	.gallery-item:hover img {
		transform: scale(1.03);
	}
</style>