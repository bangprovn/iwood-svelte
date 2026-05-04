<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import ProductCard from '$lib/components/ProductCard.svelte';
	import { fmt, IMG } from '$lib/data/iwood';
	import { inquiry } from '$lib/state/inquiry.svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { useI18n, t } from '$lib/i18n';
	import type { PageData } from './$types';

	const i18n = useI18n();

	let { data }: { data: PageData } = $props();

	let cat = $derived(page.url.searchParams.get('cat') || 'all');
	let sort = $state('featured');
	let priceBand = $state('all');
	let view = $state<'grid' | 'list'>('grid');

	const cats = $derived([
		{ id: 'all', vi: t($i18n, 'products.all_short'), en: 'All', count: data.products.length },
		...data.categories.map((c) => ({ id: c.id, vi: c.vi, en: c.en, count: c.count }))
	]);

	const curCat = $derived(data.categories.find((c) => c.id === cat));

	const filtered = $derived.by(() => {
		let list = cat === 'all' ? data.products : data.products.filter((p) => p.cat === cat);
		if (priceBand === 'low') list = list.filter((p) => p.price < 200000);
		if (priceBand === 'mid') list = list.filter((p) => p.price >= 200000 && p.price < 280000);
		if (priceBand === 'high') list = list.filter((p) => p.price >= 280000);
		if (sort === 'price-asc') list = [...list].sort((a, b) => a.price - b.price);
		else if (sort === 'price-desc') list = [...list].sort((a, b) => b.price - a.price);
		else if (sort === 'name') list = [...list].sort((a, b) => a.vi.localeCompare(b.vi));
		return list;
	});

	function setCat(id: string) {
		if (id === 'all') goto('/products');
		else goto('/products?cat=' + id);
	}

	function clearFilters() {
		priceBand = 'all';
		goto('/products');
	}
</script>

<main>
	<section class="page-hero">
		<div class="page-hero-bg" style={`background-image: url(${IMG.cat1});`}></div>
		<div class="container">
			<div class="crumbs">
				<a href="/">{t($i18n, 'nav.home')}</a>
				<Icon name="chevR" size={12} class="sep" />
				<span class="current">{t($i18n, 'nav.products')}{curCat ? ` — ${$i18n.locale === 'en' && curCat.en ? curCat.en : curCat.vi}` : ''}</span>
			</div>
			<span class="eyebrow" style="color: var(--tw-red);">
				{t($i18n, 'products.catalog', { count: filtered.length })}
			</span>
			<h1>{curCat ? ($i18n.locale === 'en' && curCat.en ? curCat.en : curCat.vi) : t($i18n, 'products.all')}</h1>
			<p class="lead">
				{curCat?.blurb || t($i18n, 'products.default_blurb')}
			</p>
		</div>
	</section>

	<section class="section">
		<div class="container">
			<div class="filter-bar">
				{#each cats as c (c.id)}
					<button
						class={'filter-chip ' + (cat === c.id ? 'active' : '')}
						onclick={() => setCat(c.id)}
					>
						{$i18n.locale === 'en' && c.en ? c.en : c.vi} <span class="count">({c.count})</span>
					</button>
				{/each}
				<span class="filter-spacer"></span>
				<select class="sort-select" bind:value={priceBand}>
					<option value="all">{t($i18n, 'products.all_prices')}</option>
					<option value="low">{t($i18n, 'products.price_low')}</option>
					<option value="mid">{t($i18n, 'products.price_mid')}</option>
					<option value="high">{t($i18n, 'products.price_high')}</option>
				</select>
				<select class="sort-select" bind:value={sort}>
					<option value="featured">{t($i18n, 'products.sort_featured')}</option>
					<option value="price-asc">{t($i18n, 'products.sort_price_asc')}</option>
					<option value="price-desc">{t($i18n, 'products.sort_price_desc')}</option>
					<option value="name">{t($i18n, 'products.sort_name')}</option>
				</select>
				<div
					style="display: flex; border: 1px solid var(--hairline); border-radius: 4px; overflow: hidden;"
				>
					<button
						onclick={() => (view = 'grid')}
						style={`padding: 8px; background: ${view === 'grid' ? 'var(--ink)' : 'white'}; color: ${view === 'grid' ? 'white' : 'var(--ink)'}; border: none; cursor: pointer;`}
						aria-label={t($i18n, 'products.view_grid')}
					>
						<Icon name="grid" size={16} />
					</button>
					<button
						onclick={() => (view = 'list')}
						style={`padding: 8px; background: ${view === 'list' ? 'var(--ink)' : 'white'}; color: ${view === 'list' ? 'white' : 'var(--ink)'}; border: none; cursor: pointer;`}
						aria-label={t($i18n, 'products.view_list')}
					>
						<Icon name="list" size={16} />
					</button>
				</div>
			</div>

			<div
				class={view === 'grid' ? 'grid grid-4' : 'grid'}
				style={view === 'list' ? 'grid-template-columns: 1fr;' : ''}
			>
				{#each filtered as p (p.id)}
					{#if view === 'grid'}
						<ProductCard {p} />
					{:else}
						<div class="product-card product-list-row" style="padding: 0;">
							<a
								href={`/product/${p.id}`}
								class="media product-list-media"
								style={`background-image: url(${p.img}); aspect-ratio: 4/3; height: 100%;`}
								aria-label={p.vi}
							></a>
							<div style="padding: 20px;">
								<span class="code">{p.code}</span>
								<h4 style="margin: 4px 0;">
									<a href={`/product/${p.id}`}>{p.vi}</a>
								</h4>
								<p style="font-size: 14px; color: var(--slate-2); margin: 4px 0;">{p.descText}</p>
								<div class="specs">
									{#each p.specs as s (s)}
										<span>{s}</span>
									{/each}
								</div>
							</div>
							<div class="product-list-meta" style="padding: 20px; text-align: right;">
								<div class="price" style="font-size: 24px;">{fmt(p.price)}đ</div>
								<div style="font-size: 12px; color: var(--slate-2); margin-bottom: 12px;">
									{t($i18n, 'products.per_m2')}
								</div>
								<button class="btn btn-primary btn-sm" onclick={() => inquiry.add(p)}>
									{t($i18n, 'card.inquiry_btn')}
								</button>
							</div>
						</div>
					{/if}
				{/each}
			</div>

			{#if filtered.length === 0}
				<div style="text-align: center; padding: 80px; color: var(--slate-2);">
					<p>
						{t($i18n, 'products.no_results')}
						<a
							class="inline"
							href="/products"
							onclick={(e) => {
								e.preventDefault();
								clearFilters();
							}}
						>
							{t($i18n, 'products.clear_filters')}
						</a>
					</p>
				</div>
			{/if}
		</div>
	</section>

	<!-- CTA BANNER -->
	<section class="cinematic" style="padding: 96px 0;">
		<div class="cinematic-bg" style={`background-image: url(${IMG.heroLobby});`}></div>
		<div class="container" style="position: relative; text-align: center; max-width: 760px;">
			<span class="eyebrow" style="color: var(--tw-red);">{t($i18n, 'products.cta.eyebrow')}</span>
			<h2 style="margin-top: 12px; font-size: clamp(36px, 5vw, 64px); color: white;">
				{@html t($i18n, 'products.cta.heading').replace('\n', '<br />')}
			</h2>
			<p class="lead" style="margin-top: 16px;">
				{t($i18n, 'products.cta.lead')}
			</p>
			<div style="display: flex; justify-content: center; gap: 12px; margin-top: 32px;">
				<a href="/quote" class="btn btn-primary">
					{t($i18n, 'products.cta.send')} <Icon name="arrow" size={14} />
				</a>
				<a href="tel:0915000000" class="btn btn-outline-white">
					<Icon name="phone" size={14} /> 0915 000 000
				</a>
			</div>
		</div>
	</section>
</main>
