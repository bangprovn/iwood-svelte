<script lang="ts">
	import Icon from './Icon.svelte';
	import { fmt, IMG } from '$lib/data/iwood';
	import { useI18n, t } from '$lib/i18n';
	import type { CategoryDTO, ProductDTO } from '$lib/types';
	import type { ResolvedNavItem } from '$lib/server/cms/admin';

	type Props = {
		open: boolean;
		onClose: () => void;
		item: ResolvedNavItem;
		// Fallbacks used when the active mega item omits a column / featured /
		// promo block, so a partly-configured mega menu still looks complete.
		fallbackCategories?: CategoryDTO[];
		fallbackFeatured?: ProductDTO[];
	};
	let { open, onClose, item, fallbackCategories = [], fallbackFeatured = [] }: Props = $props();
	const i18n = useI18n();

	const isMega = $derived(item.isMega && !!item.mega);
	const mega = $derived(item.mega);
	const columns = $derived(mega?.columns ?? []);
	const featured = $derived(mega?.featured);
	const promo = $derived(mega?.promo);
</script>

<div class={'mega ' + (open ? 'open' : '')} onmouseleave={onClose} role="menu" tabindex="-1">
	<div class="mega-inner">
		{#if isMega}
			{#each columns as col, ci (ci)}
				<div class="mega-col">
					<h5>{col.heading}</h5>
					<ul class="mega-list">
						{#each col.links as link (link.id)}
							<li>
								<a class="mega-link" href={link.href || '#'} target={link.target}>
									<span>{link.label}</span>
									<Icon name="arrow" size={14} class="arrow" />
								</a>
							</li>
						{/each}
					</ul>
				</div>
			{/each}

			{#if columns.length === 0 && fallbackCategories.length}
				<div class="mega-col">
					<h5>{t($i18n, 'mega.by_type')}</h5>
					<ul class="mega-list">
						{#each fallbackCategories.slice(0, 6) as c (c.id)}
							<li>
								<a class="mega-link" href={`/products?cat=${c.id}`}>
									<span>{c.vi}</span>
									<span class="count">{c.count}</span>
								</a>
							</li>
						{/each}
					</ul>
				</div>
			{/if}

			{#if featured && featured.products.length}
				<div class="mega-col">
					<h5>{featured.heading}</h5>
					<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
						{#each featured.products as p (p.id)}
							<a href={`/product/${p.id}`} class="mega-feature">
								<div class="photo" style={`background-image: url(${p.img});`}></div>
								<div class="body">
									<h4>{p.vi}</h4>
									<p>{p.code}</p>
									<div class="price">
										{fmt(p.price)}đ
										<span style="font-size: 11px; color: var(--slate-2); font-weight: 400;">/m²</span>
									</div>
								</div>
							</a>
						{/each}
					</div>
				</div>
			{:else if !featured && fallbackFeatured.length}
				<div class="mega-col">
					<h5>{t($i18n, 'mega.featured')}</h5>
					<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
						{#each fallbackFeatured as p (p.id)}
							<a href={`/product/${p.id}`} class="mega-feature">
								<div class="photo" style={`background-image: url(${p.img});`}></div>
								<div class="body">
									<h4>{p.vi}</h4>
									<p>{p.code}</p>
									<div class="price">
										{fmt(p.price)}đ
										<span style="font-size: 11px; color: var(--slate-2); font-weight: 400;">/m²</span>
									</div>
								</div>
							</a>
						{/each}
					</div>
				</div>
			{/if}

			{#if promo}
				<div class="mega-col">
					<div
						class="mega-promo"
						style={`--promo-img: url(${promo.imageUrl || IMG.heroLobby});`}
					>
						{#if promo.eyebrow}<span class="eyebrow">{promo.eyebrow}</span>{/if}
						{#if promo.heading}<h4>{promo.heading}</h4>{/if}
						{#if promo.desc}<p>{promo.desc}</p>{/if}
						{#if promo.ctaUrl && promo.ctaLabel}
							<a href={promo.ctaUrl} class="btn btn-primary btn-sm" style="align-self: flex-start;">
								{promo.ctaLabel} <Icon name="arrow" size={14} />
							</a>
						{/if}
					</div>
				</div>
			{/if}
		{:else if item.children.length > 0}
			<div class="mega-col">
				<h5>{item.label}</h5>
				<ul class="mega-list">
					{#each item.children as link (link.id)}
						<li>
							<a class="mega-link" href={link.href || '#'} target={link.target}>
								<span>{link.label}</span>
								<Icon name="arrow" size={14} class="arrow" />
							</a>
						</li>
					{/each}
				</ul>
			</div>
		{/if}
	</div>
</div>
