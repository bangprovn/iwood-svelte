<script lang="ts">
	import Icon from './Icon.svelte';
	import { fmt, IMG } from '$lib/data/iwood';
	import { useI18n, t } from '$lib/i18n';
	import type { CategoryDTO, ProductDTO } from '$lib/types';

	type Props = {
		open: boolean;
		onClose: () => void;
		categories: CategoryDTO[];
		featured: ProductDTO[];
	};
	let { open, onClose, categories, featured }: Props = $props();
	const i18n = useI18n();
</script>

<div class={'mega ' + (open ? 'open' : '')} onmouseleave={onClose} role="menu" tabindex="-1">
	<div class="mega-inner">
		<div class="mega-col">
			<h5>{t($i18n, 'mega.by_type')} <span style="opacity: 0.5;">· {t($i18n, 'mega.by_type_en')}</span></h5>
			<ul class="mega-list">
				{#each categories.slice(0, 6) as c (c.id)}
					<li>
						<a class="mega-link" href={`/products?cat=${c.id}`}>
							<span>{c.vi}</span>
							<span class="count">{c.count}</span>
						</a>
					</li>
				{/each}
			</ul>
		</div>
		<div class="mega-col">
			<h5>{t($i18n, 'mega.by_app')} <span style="opacity: 0.5;">· {t($i18n, 'mega.by_app_en')}</span></h5>
			<ul class="mega-list">
				<li>
					<a class="mega-link" href="/projects?cat=residential"
						>{t($i18n, 'mega.app_residential')} · {t($i18n, 'mega.app_residential_en')} <Icon name="arrow" size={14} class="arrow" /></a
					>
				</li>
				<li>
					<a class="mega-link" href="/projects?cat=commercial"
						>{t($i18n, 'mega.app_office')} · {t($i18n, 'mega.app_office_en')} <Icon name="arrow" size={14} class="arrow" /></a
					>
				</li>
				<li>
					<a class="mega-link" href="/projects?cat=hotel"
						>{t($i18n, 'mega.app_hotel')} · {t($i18n, 'mega.app_hotel_en')} <Icon name="arrow" size={14} class="arrow" /></a
					>
				</li>
				<li>
					<a class="mega-link" href="/projects?cat=cafe"
						>{t($i18n, 'mega.app_cafe')} <Icon name="arrow" size={14} class="arrow" /></a
					>
				</li>
				<li>
					<a class="mega-link" href="/products"
						>{t($i18n, 'mega.app_bathroom')} · {t($i18n, 'mega.app_bathroom_en')} <Icon name="arrow" size={14} class="arrow" /></a
					>
				</li>
				<li>
					<a class="mega-link" href="/products"
						>{t($i18n, 'mega.app_ceiling')} · {t($i18n, 'mega.app_ceiling_en')} <Icon name="arrow" size={14} class="arrow" /></a
					>
				</li>
			</ul>
		</div>
		<div class="mega-col">
			<h5>{t($i18n, 'mega.featured')} <span style="opacity: 0.5;">· {t($i18n, 'mega.featured_en')}</span></h5>
			<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
				{#each featured as p (p.id)}
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
		<div class="mega-col">
			<div class="mega-promo" style={`--promo-img: url(${IMG.heroLobby});`}>
				<span class="eyebrow">{t($i18n, 'mega.promo_eyebrow')}</span>
				<h4>{t($i18n, 'mega.promo_heading')}</h4>
				<p>{t($i18n, 'mega.promo_desc')}</p>
				<a href="/quote" class="btn btn-primary btn-sm" style="align-self: flex-start;">
					{t($i18n, 'mega.promo_cta')} <Icon name="arrow" size={14} />
				</a>
			</div>
		</div>
	</div>
</div>
