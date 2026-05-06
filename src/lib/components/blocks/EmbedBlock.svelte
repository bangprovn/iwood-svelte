<script lang="ts">
	import type { EmbedSettings, EmbedContent } from '$lib/page-blocks/types';

	type Props = {
		block: { id: string; type: string };
		content: Record<string, unknown>;
		settings: EmbedSettings;
		locale: string;
	};

	let { content, settings }: Props = $props();

	const c = content as unknown as EmbedContent;
	const aspectRatio = settings.aspectRatio || '16:9';
</script>

<figure class="embed-block">
	<div class="embed-container" style:aspect-ratio={aspectRatio}>
		{#if settings.embedType === 'youtube' || settings.embedType === 'vimeo'}
			{#if settings.iframeUrl}
				<iframe
					src={settings.iframeUrl}
					title={c.caption || 'Video embed'}
					frameborder="0"
					allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
					allowfullscreen
				></iframe>
			{/if}
		{:else if settings.embedType === 'google_maps'}
			{#if settings.iframeUrl}
				<iframe
					src={settings.iframeUrl}
					title={c.caption || 'Map'}
					frameborder="0"
					style="border:0"
					allowfullscreen
				></iframe>
			{/if}
		{:else if settings.embedType === 'custom'}
			{@html settings.embedCode || ''}
		{/if}
	</div>
	{#if c.caption}
		<figcaption class="caption">{c.caption}</figcaption>
	{/if}
</figure>

<style>
	.embed-block {
		margin: 0;
	}

	.embed-container {
		position: relative;
		width: 100%;
		overflow: hidden;
		border-radius: var(--radius-md);
		background: var(--ink);
	}

	.embed-container iframe,
	.embed-container :global(iframe) {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
	}

	.embed-container :global(html) {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
	}

	.caption {
		margin-top: 0.75rem;
		font-size: var(--fs-sm);
		color: var(--fg-3);
		font-style: italic;
		text-align: center;
	}
</style>