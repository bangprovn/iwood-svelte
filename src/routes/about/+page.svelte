<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import { useI18n, t } from '$lib/i18n';
	import { IMG } from '$lib/data/iwood';
	import type { Writable } from 'svelte/store';
	import type { I18nData } from '$lib/i18n';

	const i18n = useI18n() as Writable<I18nData>;

	const timeline = $derived([
		{ year: '2019', key: 'about.timeline.2019' },
		{ year: '2021', key: 'about.timeline.2021' },
		{ year: '2023', key: 'about.timeline.2023' },
		{ year: '2026', key: 'about.timeline.2026' }
	]);

	const values = [
		{ icon: 'shield', key: 'about.values.shield' },
		{ icon: 'award', key: 'about.values.award' },
		{ icon: 'truck', key: 'about.values.truck' },
		{ icon: 'wrench', key: 'about.values.wrench' }
	];

	const teamKeys = ['about.team.1', 'about.team.2', 'about.team.3', 'about.team.4'];
</script>

<main>
	<section class="page-hero">
		<div class="page-hero-bg" style={`background-image: url(${IMG.factory});`}></div>
		<div class="container">
			<div class="crumbs">
				<a href="/">{t($i18n, 'nav.home')}</a>
				<Icon name="chevR" size={12} class="sep" />
				<span class="current">{t($i18n, 'nav.about')}</span>
			</div>
			<span class="eyebrow" style="color: var(--tw-red);">{t($i18n, 'about.hero.eyebrow')}</span>
			<h1>{@html t($i18n, 'about.hero.heading')}</h1>
			<p class="lead">
				{t($i18n, 'about.hero.lead')}
			</p>
		</div>
	</section>

	<!-- MISSION -->
	<section class="section">
		<div class="container split split-5-6">
			<div>
				<span class="red-bar" style="margin-bottom: 16px;"></span>
				<span class="eyebrow">{t($i18n, 'about.mission.eyebrow')}</span>
				<h2 style="margin-top: 8px;">{t($i18n, 'about.mission.heading')}</h2>
				<p class="lead">
					{t($i18n, 'about.mission.lead')}
				</p>
				<p style="margin-top: 16px;">
					{t($i18n, 'about.mission.body')}
				</p>
			</div>
			<div
				style={`position: relative; aspect-ratio: 4/5; border-radius: 8px; overflow: hidden; background-image: url(${IMG.factory}); background-size: cover; background-position: center;`}
			></div>
		</div>
	</section>

	<!-- TIMELINE -->
	<section class="section section-bone">
		<div class="container">
			<div class="section-head center">
				<span class="red-bar"></span>
				<span class="eyebrow">{t($i18n, 'about.timeline.eyebrow')}</span>
				<h2>{t($i18n, 'about.timeline.heading')}</h2>
			</div>
			<div class="timeline-grid">
				<div class="timeline-line"></div>
				{#each timeline as item (item.year)}
					<div style="position: relative; padding-top: 56px;">
						<div
							style="position: absolute; top: 16px; left: 0; width: 32px; height: 32px; border-radius: 999px; background: var(--tw-red); color: white; display: inline-flex; align-items: center; justify-content: center;"
						>
							<Icon name="check" size={16} />
						</div>
						<div
							style="font-family: var(--font-display); font-weight: 800; font-size: 32px; color: var(--tw-red);"
						>
							{item.year}
						</div>
						<h4 style="margin: 4px 0 8px;">{t($i18n, `${item.key}.title`)}</h4>
						<p style="font-size: 14px; color: var(--slate-2); margin: 0;">{t($i18n, `${item.key}.body`)}</p>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- VALUES -->
	<section class="section">
		<div class="container">
			<div class="section-head">
				<span class="red-bar"></span>
				<span class="eyebrow">{t($i18n, 'about.values.eyebrow')}</span>
				<h2 style="max-width: 720px;">{t($i18n, 'about.values.heading')}</h2>
			</div>
			<div class="grid grid-4">
				{#each values as v (v.icon)}
					<div
						style="padding: 32px; border: 1px solid var(--hairline); border-radius: 8px; transition: all 200ms var(--ease-out);"
					>
						<Icon name={v.icon} size={36} style="color: var(--tw-red);" />
						<h4 style="margin: 20px 0 6px;">{t($i18n, `${v.key}.title`)}</h4>
						<div
							style="font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--slate-2); margin-bottom: 12px;"
						>
							{t($i18n, `${v.key}.en`)}
						</div>
						<p style="font-size: 14px; color: var(--slate-2); margin: 0;">{t($i18n, `${v.key}.body`)}</p>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- TEAM -->
	<section class="section section-bone">
		<div class="container">
			<div class="section-head">
				<span class="red-bar"></span>
				<span class="eyebrow">{t($i18n, 'about.team.eyebrow')}</span>
				<h2>{t($i18n, 'about.team.heading')}</h2>
			</div>
			<div class="grid grid-4">
				{#each [0, 1, 2, 3] as i (i)}
					<div
						style="border-radius: 8px; overflow: hidden; background: white; border: 1px solid var(--hairline);"
					>
						<div
							style={`aspect-ratio: 4/5; background-image: url(${IMG.team}); background-size: cover; background-position: center; filter: ${i % 2 ? 'none' : 'grayscale(0.3)'};`}
						></div>
						<div style="padding: 20px;">
							<h5 style="margin: 0;">{t($i18n, `${teamKeys[i]}.name`)}</h5>
							<div style="font-size: 13px; color: var(--slate-2);">{t($i18n, `${teamKeys[i]}.role`)}</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- CTA BANNER -->
	<section class="cinematic" style="padding: 96px 0;">
		<div class="cinematic-bg" style={`background-image: url(${IMG.heroHotel});`}></div>
		<div class="container" style="position: relative; text-align: center; max-width: 720px;">
			<span class="eyebrow" style="color: var(--tw-red);">{t($i18n, 'about.cta.eyebrow')}</span>
			<h2 style="margin-top: 12px; font-size: clamp(36px, 5vw, 56px); color: white;">
				{t($i18n, 'about.cta.heading')}
			</h2>
			<p class="lead" style="margin-top: 12px;">
				{t($i18n, 'about.cta.lead')}
			</p>
			<div style="display: flex; justify-content: center; gap: 12px; margin-top: 32px;">
				<a href="/quote" class="btn btn-primary">{t($i18n, 'cta.request_quote')}</a>
				<a href="tel:0915000000" class="btn btn-outline-white">
					<Icon name="phone" size={14} /> 0915 000 000
				</a>
			</div>
		</div>
	</section>
</main>