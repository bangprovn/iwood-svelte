<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import Icon from '$lib/components/Icon.svelte';
	import { useI18n, t } from '$lib/i18n';
	import { IMG } from '$lib/data/iwood';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const i18n = useI18n();
	const projects = $derived(data.projects);
	const projectCategories = $derived(data.projectCategories);

	const cat = $derived(page.url.searchParams.get('cat') || 'all');
	const filtered = $derived(projects);

	function selectCat(id: string) {
		const url = new URL(page.url);
		if (id === 'all') {
			url.searchParams.delete('cat');
		} else {
			url.searchParams.set('cat', id);
		}
		goto(url.pathname + (url.search ? url.search : ''), { replaceState: false, keepFocus: true });
	}

	const spans = [8, 4, 4, 4, 4, 6, 6, 4, 4, 4];
</script>

<main>
	<section class="page-hero">
		<div class="page-hero-bg" style={`background-image: url(${IMG.proj1});`}></div>
		<div class="container">
			<div class="crumbs">
				<a href="/">{t($i18n, 'nav.home')}</a>
				<Icon name="chevR" size={12} class="sep" />
				<span class="current">{t($i18n, 'nav.projects')}</span>
			</div>
			<span class="eyebrow" style="color: var(--tw-red);">{t($i18n, 'projects.hero.eyebrow')}</span>
			<h1>{t($i18n, 'projects.hero.heading')}</h1>
			<p class="lead">
				{t($i18n, 'projects.hero.lead')}
			</p>
		</div>
	</section>

	<section class="section">
		<div class="container">
			<div class="filter-bar">
				{#each projectCategories as c (c.id)}
					<button
						class={'filter-chip ' + (cat === c.id ? 'active' : '')}
						onclick={() => selectCat(c.id)}
					>
						{$i18n.locale === 'en' && c.en ? c.en : c.vi} <span class="count">({c.count})</span>
					</button>
				{/each}
			</div>
			<div class="projects-mosaic">
				{#each filtered as pj, i (pj.id)}
					{@const span = spans[i % 10] || 4}
					{@const ratio = span >= 8 ? '21/9' : '4/3'}
					<a
						class="project-card"
						href={`/project/${pj.id}`}
						style={`grid-column: span ${span};`}
					>
						<div
							class="media"
							style={`background-image: url(${pj.img}); aspect-ratio: ${ratio};`}
						></div>
						<div class="body">
							<span class="cat">{$i18n.locale === 'en' && projectCategories.find((c) => c.id === pj.cat)?.en ? projectCategories.find((c) => c.id === pj.cat)?.en : projectCategories.find((c) => c.id === pj.cat)?.vi}</span>
							<h4>{$i18n.locale === 'en' && pj.en ? pj.en : pj.vi}</h4>
							<div class="meta">
								<span>
									<Icon name="map" size={12} style="vertical-align: middle;" />
									{pj.loc}
								</span>
								<span>·</span><span>{pj.area}</span><span>·</span><span>{pj.year}</span>
							</div>
						</div>
					</a>
				{/each}
			</div>
		</div>
	</section>
</main>
