<script lang="ts">
	import Icon from './Icon.svelte';
	import { lightbox } from '$lib/state/lightbox.svelte';

	$effect(() => {
		if (!lightbox.open) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') lightbox.close();
			else if (e.key === 'ArrowLeft') lightbox.prev();
			else if (e.key === 'ArrowRight') lightbox.next();
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});
</script>

{#if lightbox.open}
	{@const it = lightbox.items[lightbox.index]}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class={'lightbox ' + (lightbox.open ? 'open' : '')}
		onclick={() => lightbox.close()}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
	>
		<button class="close-btn" onclick={() => lightbox.close()} aria-label="Đóng">
			<Icon name="close" size={20} />
		</button>
		<button
			class="nav-btn prev"
			onclick={(e) => {
				e.stopPropagation();
				lightbox.prev();
			}}
			aria-label="Ảnh trước"
		>
			<Icon name="chevL" size={20} />
		</button>
		{#if it}
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
			<img
				src={it.img}
				class="lightbox-img"
				onclick={(e) => e.stopPropagation()}
				alt={it.vi ?? ''}
			/>
		{/if}
		<button
			class="nav-btn next"
			onclick={(e) => {
				e.stopPropagation();
				lightbox.next();
			}}
			aria-label="Ảnh kế"
		>
			<Icon name="chevR" size={20} />
		</button>
		{#if it && (it.vi || it.loc || it.year || it.area)}
			<div class="lightbox-caption">
				{#if it.vi}
					<div style="font-weight: 600;">{it.vi}</div>
				{/if}
				{#if it.loc || it.year || it.area}
					<div style="font-size: 12px; opacity: 0.6;">
						{[it.loc, it.year, it.area].filter(Boolean).join(' · ')}
					</div>
				{/if}
			</div>
		{/if}
	</div>
{/if}
