<script lang="ts">
	import Icon from './Icon.svelte';
	import { fmt } from '$lib/data/iwood';
	import { inquiry } from '$lib/state/inquiry.svelte';
	import { useI18n, t } from '$lib/i18n';
	import type { ProductDTO } from '$lib/types';

	type Props = { p: ProductDTO; onQuick?: (p: ProductDTO) => void };
	let { p, onQuick }: Props = $props();
	const i18n = useI18n();
</script>

<div class="product-card">
	<a href={`/product/${p.id}`} class="media" style={`background-image: url(${p.img});`}>
		<div class="media-tags">
			{#if p.tag}
				<span class={'badge ' + (p.tag === 'NEW' ? 'badge-ink' : 'badge-red')}>{p.tag}</span>
			{/if}
		</div>
		<div class="media-actions">
			<button
				class="quick-btn"
				onclick={(e) => {
					e.preventDefault();
					onQuick?.(p);
				}}
				aria-label={t($i18n, 'card.quick_view')}
			>
				<Icon name="eye" size={18} />
			</button>
			<button
				class="quick-btn"
				onclick={(e) => {
					e.preventDefault();
					inquiry.add(p);
				}}
				aria-label={t($i18n, 'card.add_inquiry')}
			>
				<Icon name="plus" size={18} />
			</button>
		</div>
	</a>
	<div class="body">
		<span class="code">{p.code}</span>
		<h4><a href={`/product/${p.id}`}>{p.vi}</a></h4>
		<div style="font-size: 12px; color: var(--slate-2);">{p.en}</div>
		<div class="specs">
			{#each p.specs as s (s)}
				<span>{s}</span>
			{/each}
		</div>
		<div class="row">
			<div class="price">{fmt(p.price)}đ <span class="unit">/m²</span></div>
			<button class="add" onclick={() => inquiry.add(p)}>{t($i18n, 'card.inquiry_btn')}</button>
		</div>
	</div>
</div>
