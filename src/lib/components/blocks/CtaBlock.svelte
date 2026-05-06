<script lang="ts">
	import type { CtaSettings, CtaContent } from '$lib/page-blocks/types';

	type Props = {
		block: { id: string; type: string };
		content: Record<string, unknown>;
		settings: CtaSettings;
		locale: string;
	};

	let { content, settings }: Props = $props();

	const c = content as unknown as CtaContent;
	const bgImage = settings.backgroundImage ? `url(${settings.backgroundImage})` : undefined;
	const paddingMap = { none: '2rem 2rem', sm: '3rem 2rem', md: '5rem 2rem', lg: '7rem 2rem' } as const;
	const padding = paddingMap[settings.paddingSize ?? 'lg'];
	const bg = settings.backgroundColor || 'var(--iwood-red)';
</script>

<section
	class="cta-block"
	style:background-color={bg}
	style:background-image={bgImage}
	style:padding={padding}
	style:color={settings.textColor || 'var(--paper)'}
>
	<div class="cta-content">
		{#if c.heading}
			<h2 class="cta-heading">{c.heading}</h2>
		{/if}
		{#if c.subheading}
			<p class="cta-subheading">{c.subheading}</p>
		{/if}
		{#if c.buttonLabel && c.buttonHref}
			<a
				href={c.buttonHref}
				class="cta-button"
				class:outline={settings.buttonStyle === 'outline'}
				style:background-color={settings.buttonStyle === 'outline' ? 'transparent' : settings.buttonColor || 'var(--ink)'}
				style:color={settings.buttonStyle === 'outline' ? (settings.backgroundColor || bg) : 'var(--paper)'}
				style:border-color={settings.buttonStyle === 'outline' ? (settings.buttonColor || 'var(--ink)') : 'transparent'}
			>
				{c.buttonLabel}
			</a>
		{/if}
	</div>
</section>

<style>
	.cta-block {
		text-align: center;
		background-size: cover;
		background-position: center;
	}

	.cta-content {
		max-width: 700px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	.cta-heading {
		font-family: var(--font-display);
		font-size: var(--fs-3xl);
		font-weight: 800;
		line-height: var(--lh-snug);
		margin: 0;
	}

	.cta-subheading {
		font-size: var(--fs-md);
		opacity: 0.9;
		margin: 0;
		line-height: var(--lh-normal);
	}

	.cta-button {
		display: inline-block;
		padding: 0.875rem 2.5rem;
		font-family: var(--font-body);
		font-size: var(--fs-sm);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: var(--tracking-wide);
		text-decoration: none;
		border: 2px solid transparent;
		border-radius: 2px;
		transition: all var(--dur-base) var(--ease-out);
		margin-top: 0.5rem;
	}

	.cta-button.outline {
		border-width: 2px;
	}

	.cta-button:hover {
		opacity: 0.9;
		transform: translateY(-1px);
	}
</style>