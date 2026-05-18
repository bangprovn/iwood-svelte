<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import ProductCard from '$lib/components/ProductCard.svelte';
	import { lightbox } from '$lib/state/lightbox.svelte';
	import { useI18n, t } from '$lib/i18n';
	import type { PageData } from './$types';

	const i18n = useI18n();
	let { data }: { data: PageData } = $props();
	const pj = $derived(data.project);
	const projectCategories = $derived(data.projectCategories);
	const usedProducts = $derived(data.usedProducts);
	const more = $derived(data.more);
	// Use the cover plus any extra images parsed from the project body. The
	// cover is excluded from `pj.gallery` server-side so we just prepend it.
	const gallery = $derived(pj ? [pj.img, ...pj.gallery] : []);

	// Editorial layout for the first 6 slots. Items 7+ tile uniformly below
	// (span 2 in a 6-col grid → 3 per row, 4/3 ratio).
	const gallerySpans = [3, 3, 2, 2, 2, 4];
	const galleryRatios = ['16/10', '16/10', '4/5', '4/5', '4/5', '21/9'];
	const GALLERY_PREVIEW = 12;
	let showAll = $state(false);
	const visibleGallery = $derived(
		showAll || gallery.length <= GALLERY_PREVIEW ? gallery : gallery.slice(0, GALLERY_PREVIEW)
	);

	function openLightbox(i: number) {
		if (!pj) return;
		const items = gallery.map((g) => ({
			img: g,
			vi: $i18n.locale === 'en' && pj.en ? pj.en : pj.vi,
			loc: pj.loc,
			year: pj.year,
			area: pj.area
		}));
		lightbox.show(items, i);
	}
</script>

{#if !pj}
	<main class="container" style="padding: 80px;">
		<h1>{t($i18n, 'project.not_found')}</h1>
	</main>
{:else}
	<main>
		<section
			style="position: relative; height: 70vh; min-height: 500px; color: white; overflow: hidden;"
		>
			<div
				style={`position: absolute; inset: 0; background-image: url(${pj.img}); background-size: cover; background-position: center;`}
			></div>
			<div
				style="position: absolute; inset: 0; background: linear-gradient(to top, rgba(15,15,16,0.9) 0%, rgba(15,15,16,0.2) 60%, transparent);"
			></div>
			<div style="position: absolute; bottom: 0; left: 0; right: 0; padding: 48px 0;">
				<div class="container">
					<div class="crumbs" style="color: rgba(255,255,255,0.6);">
						<a href="/" style="color: inherit;">{t($i18n, 'nav.home')}</a>
						<Icon name="chevR" size={12} class="sep" />
						<a href="/projects" style="color: inherit;">{t($i18n, 'nav.projects')}</a>
						<Icon name="chevR" size={12} class="sep" />
						<span style="color: white;">{$i18n.locale === 'en' && pj.en ? pj.en : pj.vi}</span>
					</div>
					<span class="eyebrow" style="color: var(--tw-red);"
						>{$i18n.locale === 'en' && projectCategories.find((c) => c.id === pj.cat)?.en ? projectCategories.find((c) => c.id === pj.cat)?.en : projectCategories.find((c) => c.id === pj.cat)?.vi} · {pj.year}</span
					>
					<h1 style="margin-top: 8px; color: white; font-size: clamp(40px, 6vw, 80px);">
						{$i18n.locale === 'en' && pj.en ? pj.en : pj.vi}
					</h1>
					<div class="project-hero-meta" style="display: flex; flex-wrap: wrap; gap: 24px 32px; margin-top: 16px; font-size: 14px;">
						<span>
							<Icon name="map" size={14} style="vertical-align: middle;" />
							{pj.loc}
						</span>
						<span>
							<Icon name="layers" size={14} style="vertical-align: middle;" />
							{pj.area}
						</span>
						<span>
							<Icon name="calendar" size={14} style="vertical-align: middle;" />
							{t($i18n, 'project.completed', { year: pj.year })}
						</span>
					</div>
				</div>
			</div>
		</section>

		<section class="section">
			<div class="container split split-3-2">
				<div>
					<span class="red-bar" style="margin-bottom: 16px;"></span>
					<span class="eyebrow">{t($i18n, 'project.overview_eyebrow')}</span>
					<h2 style="margin-top: 8px;">{t($i18n, 'project.overview_heading')}</h2>
					<div class="rt-content">{@html pj.summary}</div>
				</div>
				<div>
					<div style="padding: 24px; background: var(--bone); border-radius: 8px;">
						<h5
							style="margin: 0 0 16px; font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--slate-2);"
						>
							{t($i18n, 'project.info_heading')}
						</h5>
						{#each [[t($i18n, 'project.info_category'), $i18n.locale === 'en' && projectCategories.find((c) => c.id === pj.cat)?.en ? projectCategories.find((c) => c.id === pj.cat)?.en : projectCategories.find((c) => c.id === pj.cat)?.vi ?? ''], [t($i18n, 'project.info_location'), pj.loc], [t($i18n, 'project.info_area'), pj.area], [t($i18n, 'project.info_year'), String(pj.year)], [t($i18n, 'project.info_role'), t($i18n, 'project.info_role_value')]] as [k, v] (k)}
							<div
								style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--hairline); font-size: 14px;"
							>
								<span style="color: var(--slate-2);">{k}</span>
								<strong>{v}</strong>
							</div>
						{/each}
						<a
							href="/quote"
							class="btn btn-primary"
							style="width: 100%; justify-content: center; margin-top: 16px;"
							>{t($i18n, 'project.similar_quote')}</a
						>
					</div>
				</div>
			</div>
		</section>

		<section class="section section-bone">
			<div class="container">
				<div class="section-head">
					<span class="red-bar"></span>
					<span class="eyebrow">{t($i18n, 'project.gallery_eyebrow')}</span>
					<h2>{t($i18n, 'project.gallery_heading')}</h2>
				</div>
				<div class="gallery-mosaic">
					{#each visibleGallery as g, i (i)}
						{@const span = i < gallerySpans.length ? gallerySpans[i] : 2}
						{@const ratio = i < galleryRatios.length ? galleryRatios[i] : '4/3'}
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div
							onclick={() => openLightbox(i)}
							style={`grid-column: span ${span}; aspect-ratio: ${ratio}; background-image: url(${g}); background-size: cover; background-position: center; border-radius: 8px; cursor: pointer; overflow: hidden; position: relative; transition: transform 200ms var(--ease-out);`}
						></div>
					{/each}
				</div>
				{#if gallery.length > GALLERY_PREVIEW}
					<div style="text-align: center; margin-top: 24px;">
						<button
							type="button"
							class="btn btn-secondary"
							onclick={() => (showAll = !showAll)}
						>
							{showAll
								? t($i18n, 'project.gallery_show_less')
								: t($i18n, 'project.gallery_show_all', { n: gallery.length })}
						</button>
					</div>
				{/if}
			</div>
		</section>

		{#if usedProducts.length > 0}
			<section class="section">
				<div class="container">
					<div class="section-head">
						<span class="red-bar"></span>
						<span class="eyebrow">{t($i18n, 'project.materials_eyebrow')}</span>
						<h2>{t($i18n, 'project.materials_heading')}</h2>
					</div>
					<div class="grid grid-4">
						{#each usedProducts as p (p.id)}
							<ProductCard {p} />
						{/each}
					</div>
				</div>
			</section>
		{/if}

		{#if more.length > 0}
			<section class="section section-bone">
				<div class="container">
					<div class="section-head">
						<span class="red-bar"></span>
						<span class="eyebrow">{t($i18n, 'project.more_eyebrow')}</span>
						<h2>{t($i18n, 'project.more_heading')}</h2>
					</div>
					<div class="grid grid-3">
						{#each more as m (m.id)}
							<a class="project-card" href={`/project/${m.id}`}>
								<div
									class="media"
									style={`background-image: url(${m.img}); aspect-ratio: 4/3;`}
								></div>
								<div class="body">
									<span class="cat">{$i18n.locale === 'en' && projectCategories.find((c) => c.id === m.cat)?.en ? projectCategories.find((c) => c.id === m.cat)?.en : projectCategories.find((c) => c.id === m.cat)?.vi}</span>
									<h4>{$i18n.locale === 'en' && m.en ? m.en : m.vi}</h4>
									<div class="meta">
										<span>{m.loc}</span><span>·</span><span>{m.area}</span>
									</div>
								</div>
							</a>
						{/each}
					</div>
				</div>
			</section>
		{/if}
	</main>
{/if}