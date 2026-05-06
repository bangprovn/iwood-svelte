<script lang="ts">
	import type { ImageSettings, ImageContent } from '$lib/page-blocks/types';

	type Props = {
		block: { id: string; type: string };
		content: Record<string, unknown>;
		settings: ImageSettings;
		locale: string;
	};

	let { content, settings }: Props = $props();

	const c = content as unknown as ImageContent;
	const widthMap = { sm: '400px', md: '600px', lg: '900px', full: '100%' } as const;
	const imgWidth = widthMap[settings.width ?? 'lg'];
	const align = settings.align ?? 'center';
	const borderRadius = settings.borderRadius ? 'var(--radius-md)' : '0';
</script>

<figure class="image-block" style:text-align={align} style:border-radius={borderRadius}>
	<img
		src={settings.imageUrl}
		alt={settings.alt || ''}
		loading={settings.lazy ? 'lazy' : 'eager'}
		style:width={imgWidth}
		style:max-width='100%'
		style:border-radius={borderRadius}
	/>
	{#if c.caption}
		<figcaption>{c.caption}</figcaption>
	{/if}
</figure>

<style>
	.image-block {
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
	}

	.image-block img {
		display: block;
		object-fit: cover;
	}

	figcaption {
		font-size: var(--fs-sm);
		color: var(--fg-3);
		font-style: italic;
		text-align: center;
	}
</style>