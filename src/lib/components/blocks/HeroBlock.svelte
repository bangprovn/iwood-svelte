<script lang="ts">
	import type { HeroSettings, HeroContent } from '$lib/page-blocks/types';

	type Props = {
		block: { id: string; type: string };
		content: Record<string, unknown>;
		settings: HeroSettings;
		locale: string;
	};

	let { content, settings }: Props = $props();

	const c = content as unknown as HeroContent;
	const bg = settings.backgroundImage ? `url(${settings.backgroundImage})` : undefined;
	const overlayStyle = `rgba(${hexToRgb(settings.overlayColor)}, ${settings.overlayOpacity})`;
	const fullHeight = settings.fullscreen ? '100vh' : settings.minHeight;
	const textAlign = settings.textAlign ?? 'center';
</script>

<section
	class="hero-block"
	style:background-image={bg}
	style:min-height={fullHeight}
	style:text-align={textAlign}
>
	{#if bg}
		<div class="overlay" style:background={overlayStyle}></div>
	{/if}
	<div class="content">
		{#if c.eyebrow}
			<p class="eyebrow">{c.eyebrow}</p>
		{/if}
		{#if c.heading}
			<h1 class="heading">{c.heading}</h1>
		{/if}
		{#if c.subheading}
			<p class="subheading">{c.subheading}</p>
		{/if}
		{#if settings.ctaLabel && settings.ctaHref}
			<a href={settings.ctaHref} class="cta-btn">{settings.ctaLabel}</a>
		{/if}
	</div>
</section>

<style>
	.hero-block {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		background-size: cover;
		background-position: center;
		background-color: var(--ink);
		overflow: hidden;
	}

	.overlay {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}

	.content {
		position: relative;
		z-index: 1;
		padding: 3rem 2rem;
		max-width: 900px;
		width: 100%;
	}

	.eyebrow {
		font-family: var(--font-body);
		font-size: var(--fs-xs);
		font-weight: 600;
		letter-spacing: var(--tracking-caps);
		text-transform: uppercase;
		color: var(--iwood-red);
		margin-bottom: 0.75rem;
	}

	.heading {
		font-family: var(--font-display);
		font-size: var(--fs-5xl);
		font-weight: 800;
		color: var(--paper);
		line-height: var(--lh-tight);
		margin: 0 0 1rem;
		text-shadow: 0 2px 20px rgba(0,0,0,0.3);
	}

	.subheading {
		font-size: var(--fs-lg);
		color: rgba(255,255,255,0.85);
		line-height: var(--lh-normal);
		margin: 0 0 2rem;
		max-width: 600px;
		margin-left: auto;
		margin-right: auto;
	}

	.cta-btn {
		display: inline-block;
		padding: 0.875rem 2.5rem;
		background: var(--iwood-red);
		color: var(--paper);
		font-family: var(--font-body);
		font-size: var(--fs-sm);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: var(--tracking-wide);
		text-decoration: none;
		border-radius: 2px;
		transition: background var(--dur-base) var(--ease-out), transform var(--dur-fast) var(--ease-out);
	}

	.cta-btn:hover {
		background: var(--iwood-red-deep);
		transform: translateY(-1px);
	}
</style>

<script lang="ts" module>
	function hexToRgb(hex: string): string {
		const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		if (!result) return '0,0,0';
		return `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}`;
	}
</script>