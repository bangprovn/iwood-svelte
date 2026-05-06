<script lang="ts">
	import type { TextSettings, TextContent } from '$lib/page-blocks/types';

	type Props = {
		block: { id: string; type: string };
		content: Record<string, unknown>;
		settings: TextSettings;
		locale: string;
	};

	let { content, settings }: Props = $props();

	const c = content as unknown as TextContent;
	const paddingMap = { none: '0', sm: '1.5rem', md: '3rem', lg: '5rem' } as const;
	const padding = paddingMap[settings.paddingSize ?? 'md'];
	const bg = settings.backgroundColor || undefined;
	const maxWidth = settings.maxWidth || '720px';
	const textAlign = settings.textAlign ?? 'left';
	const borderRadius = settings.borderRadius ? 'var(--radius-md)' : '0';
</script>

<section
	class="text-block"
	style:padding={padding}
	style:background-color={bg}
	style:max-width={maxWidth}
	style:text-align={textAlign}
	style:border-radius={borderRadius}
>
	<div class="body prose">
		{@html c.body || ''}
	</div>
</section>

<style>
	.text-block {
		margin: 0 auto;
		width: 100%;
	}

	.prose :global(h2) {
		font-family: var(--font-display);
		font-size: var(--fs-3xl);
		font-weight: 800;
		color: var(--ink);
		margin: 1.5em 0 0.5em;
		line-height: var(--lh-snug);
	}

	.prose :global(h3) {
		font-family: var(--font-display);
		font-size: var(--fs-xl);
		font-weight: 700;
		color: var(--ink);
		margin: 1.2em 0 0.4em;
	}

	.prose :global(p) {
		font-size: var(--fs-md);
		color: var(--fg-2);
		line-height: var(--lh-loose);
		margin: 0 0 1em;
	}

	.prose :global(p:last-child) {
		margin-bottom: 0;
	}

	.prose :global(ul), .prose :global(ol) {
		padding-left: 1.5rem;
		margin: 0.5em 0 1em;
	}

	.prose :global(li) {
		font-size: var(--fs-md);
		color: var(--fg-2);
		line-height: var(--lh-normal);
		margin-bottom: 0.25em;
	}

	.prose :global(blockquote) {
		margin: 1em 0;
		padding: 0.5rem 1.5rem;
		border-left: 4px solid var(--iwood-red);
		background: var(--bone);
		font-style: italic;
		color: var(--fg-2);
	}

	.prose :global(a) {
		color: var(--iwood-red);
		text-decoration: underline;
	}

	.prose :global(img) {
		max-width: 100%;
		height: auto;
		border-radius: var(--radius-sm);
	}
</style>