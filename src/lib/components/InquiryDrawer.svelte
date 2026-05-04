<script lang="ts">
	import Icon from './Icon.svelte';
	import { fmt } from '$lib/data/iwood';
	import { inquiry } from '$lib/state/inquiry.svelte';
	import { useI18n, t } from '$lib/i18n';

	const i18n = useI18n();
</script>

<button
	class={'drawer-backdrop ' + (inquiry.drawerOpen ? 'open' : '')}
	onclick={() => inquiry.close()}
	aria-label={t($i18n, 'inquiry.close_aria')}
></button>
<aside class={'drawer ' + (inquiry.drawerOpen ? 'open' : '')} aria-label={t($i18n, 'inquiry.title')}>
	<div class="drawer-head">
		<h3>
			{t($i18n, 'inquiry.title')} <span style="color: var(--tw-red); font-family: var(--font-body);"
				>({inquiry.items.length})</span
			>
		</h3>
		<button class="icon-btn" onclick={() => inquiry.close()} aria-label={t($i18n, 'inquiry.close_aria')}>
			<Icon name="close" size={20} />
		</button>
	</div>
	<div class="drawer-body dark-scroll">
		{#if inquiry.items.length === 0}
			<div style="text-align: center; padding: 48px 16px; color: var(--slate-2);">
				<Icon name="bag" size={48} style="opacity: 0.3; margin-bottom: 12px;" />
				<p style="font-size: 15px; margin: 0 0 4px; color: var(--ink); font-weight: 600;">
					{t($i18n, 'inquiry.empty_title')}
				</p>
				<p style="font-size: 13px; margin: 0;">{t($i18n, 'inquiry.empty_desc')}</p>
				<a
					href="/products"
					class="btn btn-outline btn-sm"
					style="margin-top: 20px;"
					onclick={() => inquiry.close()}>{t($i18n, 'inquiry.view_products')}</a
				>
			</div>
		{/if}
		{#each inquiry.items as it (it.id)}
			<div class="drawer-item">
				<div class="thumb" style={`background-image: url(${it.img});`}></div>
				<div class="info">
					<div class="code">{it.code}</div>
					<h5>{it.vi}</h5>
					<div class="qty">
						<button
							onclick={() => inquiry.setQty(it.id, Math.max(1, it.qty - 1))}
							aria-label={t($i18n, 'inquiry.decrease')}
						>
							<Icon name="minus" size={12} />
						</button>
						<input
							value={it.qty}
							oninput={(e) =>
								inquiry.setQty(it.id, parseInt((e.target as HTMLInputElement).value) || 1)}
						/>
						<span style="font-size: 12px; color: var(--slate-2);">m²</span>
						<button onclick={() => inquiry.setQty(it.id, it.qty + 1)} aria-label={t($i18n, 'inquiry.increase')}>
							<Icon name="plus" size={12} />
						</button>
					</div>
					<div class="price-line">{fmt(it.price * it.qty)}đ</div>
				</div>
				<button class="remove" onclick={() => inquiry.remove(it.id)} aria-label={t($i18n, 'inquiry.remove')}>
					<Icon name="close" size={16} />
				</button>
			</div>
		{/each}
	</div>
	{#if inquiry.items.length > 0}
		<div class="drawer-foot">
			<div
				style="display: flex; justify-content: space-between; margin-bottom: 16px; font-size: 14px;"
			>
				<span style="color: var(--slate-2);">{t($i18n, 'inquiry.subtotal_label')}</span>
				<strong style="color: var(--tw-red); font-size: 18px;">{fmt(inquiry.total)}đ</strong>
			</div>
			<a
				href="/quote"
				onclick={() => inquiry.close()}
				class="btn btn-primary"
				style="width: 100%; justify-content: center;"
			>
				{t($i18n, 'inquiry.submit')} <Icon name="arrow" size={14} />
			</a>
			<p style="font-size: 12px; color: var(--slate-2); text-align: center; margin: 12px 0 0;">
				{t($i18n, 'inquiry.foot_note')}
			</p>
		</div>
	{/if}
</aside>
