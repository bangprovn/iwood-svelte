<script lang="ts">
	import type { TestimonialSettings, TestimonialContent } from '$lib/page-blocks/types';

	type Props = {
		block: { id: string; type: string };
		content: Record<string, unknown>;
		settings: TestimonialSettings;
		locale: string;
	};

	let { content, settings }: Props = $props();

	const c = content as unknown as TestimonialContent;
	const style = settings.style || 'card';
</script>

<figure
	class="testimonial-block"
	class:card={style === 'card'}
	class:mini={style === 'mini'}
	style:background-color={settings.backgroundColor || 'var(--bone)'}
	style:color={settings.textColor || 'var(--ink)'}
	style:border-color={settings.borderColor || 'var(--iwood-red)'}
>
	{#if style === 'card' && c.authorImage}
		<img src={c.authorImage} alt={c.authorName} class="author-img" />
	{/if}
	<blockquote class="quote">
		<p class="quote-text">"{c.quote}"</p>
	</blockquote>
	<figcaption class="author">
		<strong class="author-name">{c.authorName}</strong>
		{#if c.authorTitle}
			<span class="author-title">{c.authorTitle}</span>
		{/if}
	</figcaption>
</figure>

<style>
	.testimonial-block {
		border-left: 4px solid;
		padding: 2rem 2.5rem;
		margin: 0;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 1rem;
	}

	.mini {
		padding: 1.5rem;
	}

	.author-img {
		width: 64px;
		height: 64px;
		border-radius: 50%;
		object-fit: cover;
		border: 3px solid var(--border);
	}

	.quote-text {
		font-size: var(--fs-lg);
		font-style: italic;
		line-height: var(--lh-loose);
		margin: 0;
	}

	.mini .quote-text {
		font-size: var(--fs-md);
	}

	.author {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.author-name {
		font-size: var(--fs-sm);
		font-weight: 700;
		color: var(--ink);
	}

	.author-title {
		font-size: var(--fs-xs);
		color: var(--fg-3);
	}
</style>