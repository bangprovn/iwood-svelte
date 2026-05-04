<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import ProductCard from '$lib/components/ProductCard.svelte';
	import { fmt, IMG } from '$lib/data/iwood';
	import { useI18n, t } from '$lib/i18n';
	import { inquiry } from '$lib/state/inquiry.svelte';
	import type { PageData } from './$types';

	const i18n = useI18n();

	let { data }: { data: PageData } = $props();
	let p = $derived(data.product);
	let cat = $derived(data.category);
	let related = $derived(data.related);
	let gallery = $derived(p ? [p.img, IMG.prod3, IMG.prod5, IMG.prod8] : []);

	let tab = $state<'desc' | 'specs' | 'install' | 'warranty'>('desc');
	let qty = $state(20);
	let activeImg = $state(0);

	const features = [
		{ i: 'shield', k: 'product.feature_warranty' },
		{ i: 'truck', k: 'product.feature_delivery' },
		{ i: 'flame', k: 'product.feature_fireproof' },
		{ i: 'droplet', k: 'product.feature_waterproof' }
	];

	const tabs = [
		{ k: 'desc', l: 'product.tab_desc' },
		{ k: 'specs', l: 'product.tab_specs' },
		{ k: 'install', l: 'product.tab_install' },
		{ k: 'warranty', l: 'product.tab_warranty' }
	] as const;

	const installStepKeys = [
		'product.install_step_1',
		'product.install_step_2',
		'product.install_step_3',
		'product.install_step_4',
		'product.install_step_5'
	];

	const downloadKeys = [
		'product.download_catalog',
		'product.download_dwg',
		'product.download_iso',
		'product.download_quatest'
	];

	function localeName(locale: string, vi: string, en?: string) {
		return locale === 'en' && en ? en : vi;
	}
</script>

{#if !p}
	<main class="container" style="padding: 80px;">
		<h1>{t($i18n, 'product.not_found')}</h1>
		<a href="/products" class="btn btn-primary">{t($i18n, 'product.view_all')}</a>
	</main>
{:else}
	{@const specsRows = [
		[t($i18n, 'product.spec_code'), p.code],
		[t($i18n, 'product.spec_size'), p.specs[1] || t($i18n, 'product.spec_val_size')],
		[t($i18n, 'product.spec_thickness'), p.specs[0] || t($i18n, 'product.spec_val_thickness')],
		[t($i18n, 'product.spec_surface'), t($i18n, 'product.spec_val_surface')],
		[t($i18n, 'product.spec_core'), t($i18n, 'product.spec_val_core')],
		[t($i18n, 'product.spec_weight'), t($i18n, 'product.spec_val_weight')],
		[t($i18n, 'product.spec_fire'), t($i18n, 'product.spec_val_fire')],
		[t($i18n, 'product.spec_water'), t($i18n, 'product.spec_val_water')],
		[t($i18n, 'product.spec_warranty'), t($i18n, 'product.spec_val_warranty')],
		[t($i18n, 'product.spec_origin'), t($i18n, 'product.spec_val_origin')]
	]}
	<main>
		<div class="container">
			<div class="crumbs">
				<a href="/">{t($i18n, 'nav.home')}</a>
				<Icon name="chevR" size={12} class="sep" />
				<a href="/products">{t($i18n, 'nav.products')}</a>
				<Icon name="chevR" size={12} class="sep" />
				<a href={`/products?cat=${p.cat}`}>{localeName($i18n.locale, cat?.vi ?? '', cat?.en)}</a>
				<Icon name="chevR" size={12} class="sep" />
				<span class="current">{p.code}</span>
			</div>
		</div>

		<section style="padding: 32px 0 64px;">
			<div class="container split split-11-10">
				<div>
					<div
						style={`aspect-ratio: 4/5; border-radius: 8px; overflow: hidden; background-image: url(${gallery[activeImg]}); background-size: cover; background-position: center; position: relative;`}
					>
						{#if p.tag}
							<span
								style="position: absolute; top: 16px; left: 16px;"
								class={'badge ' + (p.tag === 'NEW' ? 'badge-ink' : 'badge-red')}
							>
								{p.tag}
							</span>
						{/if}
					</div>
					<div
						style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 12px;"
					>
						{#each gallery as g, i (i)}
							<button
								type="button"
								onclick={() => (activeImg = i)}
								style={`aspect-ratio: 4/3; background-image: url(${g}); background-size: cover; background-position: center; border-radius: 4px; cursor: pointer; outline: ${i === activeImg ? '2px solid var(--tw-red)' : '1px solid var(--hairline)'}; outline-offset: -1px; border: none; padding: 0;`}
								aria-label={t($i18n, 'product.photo_n', { n: i + 1 })}
							></button>
						{/each}
					</div>
				</div>

				<div>
					<span class="eyebrow">{localeName($i18n.locale, cat?.vi ?? '', cat?.en)} · {p.code}</span>
					<h1
						style="margin-top: 8px; margin-bottom: 8px; font-size: clamp(28px, 3vw, 40px); line-height: 1.15;"
					>
						{localeName($i18n.locale, p.vi, p.en)}
					</h1>
					<div
						style="display: block; font-size: 16px; color: var(--slate-2); margin-top: 4px; margin-bottom: 20px;"
					>
						{localeName($i18n.locale, p.en, p.vi)}
					</div>
					<div class="rt-content rt-content--compact" style="font-size: 16px;">{@html p.desc}</div>
					<div style="display: flex; gap: 8px; flex-wrap: wrap; margin: 20px 0;">
						{#each p.specs as s (s)}
							<span
								style="padding: 6px 12px; background: var(--bone); border-radius: 4px; font-size: 13px; font-weight: 600;"
							>
								{s}
							</span>
						{/each}
					</div>

					<div
						style="padding: 24px; background: var(--bone); border-radius: 8px; margin-top: 24px;"
					>
						<div style="display: flex; align-items: baseline; gap: 12px;">
							<span class="price" style="font-size: 36px;">{fmt(p.price)}đ</span>
							<span style="font-size: 14px; color: var(--slate-2);">{t($i18n, 'product.price_per_m2')}</span>
						</div>
						<div style="font-size: 13px; color: var(--slate-2); margin-top: 4px;">
							{t($i18n, 'product.discount_note')}
							<a class="inline" href="/quote">{t($i18n, 'product.request_project_quote')}</a>
						</div>
						<div class="product-purchase-row" style="display: flex; gap: 12px; align-items: center; margin-top: 20px; flex-wrap: wrap;">
							<div
								style="display: flex; align-items: center; border: 1px solid var(--hairline); background: white; border-radius: 4px; overflow: hidden;"
							>
								<button
									onclick={() => (qty = Math.max(1, qty - 1))}
									style="padding: 12px; border: none; background: transparent; cursor: pointer;"
									aria-label={t($i18n, 'product.decrease')}
								>
									<Icon name="minus" size={14} />
								</button>
								<input
									bind:value={qty}
									type="number"
									min="1"
									style="width: 60px; text-align: center; border: none; padding: 12px; font-family: inherit; font-size: 15px; font-weight: 600;"
								/>
								<span style="padding-right: 12px; color: var(--slate-2); font-size: 13px;">m²</span>
								<button
									onclick={() => (qty = qty + 1)}
									style="padding: 12px; border: none; background: transparent; cursor: pointer;"
									aria-label={t($i18n, 'product.increase')}
								>
									<Icon name="plus" size={14} />
								</button>
							</div>
							<button
								class="btn btn-primary"
								onclick={() => inquiry.add(p, qty)}
								style="flex: 1;"
							>
								<Icon name="plus" size={14} /> {t($i18n, 'product.add_to_inquiry')}
							</button>
						</div>
						<div style="display: flex; gap: 12px; margin-top: 12px;">
							<a href="/quote" class="btn btn-outline" style="flex: 1; justify-content: center;">
								{t($i18n, 'product.quick_quote')}
							</a>
							<a
								href="tel:0915000000"
								class="btn btn-outline"
								style="flex: 1; justify-content: center;"
							>
								<Icon name="phone" size={14} /> {t($i18n, 'product.call_advice')}
							</a>
						</div>
					</div>

					<div
						style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-top: 24px;"
					>
						{#each features as f (f.i)}
							<div
								style="display: flex; align-items: center; gap: 10px; padding: 12px; border: 1px solid var(--hairline); border-radius: 4px;"
							>
								<Icon name={f.i} size={20} style="color: var(--tw-red);" />
								<span style="font-size: 13px; font-weight: 600;">{t($i18n, f.k)}</span>
							</div>
						{/each}
					</div>
				</div>
			</div>
		</section>

		<!-- TABS -->
		<section class="section section-bone" style="padding: 64px 0;">
			<div class="container">
				<div
					style="display: flex; gap: 0; border-bottom: 1px solid var(--hairline); margin-bottom: 32px;"
				>
					{#each tabs as tabItem (tabItem.k)}
						<button
							onclick={() => (tab = tabItem.k)}
							style={`padding: 16px 24px; background: transparent; border: none; cursor: pointer; font-family: inherit; font-size: 14px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: ${tab === tabItem.k ? 'var(--ink)' : 'var(--slate-2)'}; border-bottom: ${tab === tabItem.k ? '2px solid var(--tw-red)' : '2px solid transparent'}; margin-bottom: -1px;`}
						>
							{t($i18n, tabItem.l)}
						</button>
					{/each}
				</div>

				<div class="split split-3-2">
					<div>
						{#if tab === 'desc'}
							<h3>{t($i18n, 'product.desc_heading', { code: p.code })}</h3>
							<div class="rt-content">{@html p.desc}</div>
						{:else if tab === 'specs'}
							<table style="width: 100%; border-collapse: collapse;">
								<tbody>
									{#each specsRows as [k, v] (k)}
										<tr style="border-bottom: 1px solid var(--hairline);">
											<td
												style="padding: 14px 0; font-weight: 600; font-size: 14px; width: 220px; color: var(--slate);"
											>
												{k}
											</td>
											<td style="padding: 14px 0; font-size: 14px;">{v}</td>
										</tr>
									{/each}
								</tbody>
							</table>
						{:else if tab === 'install'}
							<h3>{t($i18n, 'product.install_heading')}</h3>
							{#each installStepKeys as stepKey, i (i)}
								<div
									style="display: flex; gap: 16px; padding: 16px 0; border-bottom: 1px solid var(--hairline);"
								>
									<div
										style="width: 32px; height: 32px; background: var(--tw-red); color: white; border-radius: 999px; display: inline-flex; align-items: center; justify-content: center; font-weight: 700; flex-shrink: 0;"
									>
										{i + 1}
									</div>
									<p style="margin: 0;">{t($i18n, stepKey)}</p>
								</div>
							{/each}
						{:else if tab === 'warranty'}
							<h3>{t($i18n, 'product.warranty_heading')}</h3>
							<p>{t($i18n, 'product.warranty_body')}</p>
							<p>{t($i18n, 'product.warranty_process')}</p>
							<h4 style="margin-top: 24px;">{t($i18n, 'product.shipping_heading')}</h4>
							<p>{t($i18n, 'product.shipping_body')}</p>
						{/if}
					</div>
					<div>
						<div
							style="padding: 24px; background: white; border: 1px solid var(--hairline); border-radius: 8px;"
						>
							<h4 style="margin-top: 0;">{t($i18n, 'product.downloads_heading')}</h4>
							{#each downloadKeys as dk (dk)}
								<a
									href="#"
									style="display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--hairline);"
								>
									<Icon name="download" size={18} style="color: var(--tw-red);" />
									<span style="font-size: 13px; flex: 1;">{t($i18n, dk)}</span>
									<Icon name="arrow" size={14} style="color: var(--slate-2);" />
								</a>
							{/each}
						</div>
					</div>
				</div>
			</div>
		</section>

		<!-- RELATED -->
		<section class="section">
			<div class="container">
				<div class="section-head">
					<span class="red-bar"></span>
					<span class="eyebrow">{t($i18n, 'product.related_eyebrow')}</span>
					<h2>{t($i18n, 'product.related_heading', { cat: localeName($i18n.locale, cat?.vi ?? '', cat?.en) })}</h2>
				</div>
				<div class="grid grid-4">
					{#each related as rp (rp.id)}
						<ProductCard p={rp} />
					{/each}
				</div>
			</div>
		</section>
	</main>
{/if}
