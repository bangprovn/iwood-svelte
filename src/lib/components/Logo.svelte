<script lang="ts">
	type Props = { light?: boolean };
	let { light = false }: Props = $props();
</script>

<a href="/" class="brand" aria-label="iWood — Trang chủ">
	<div
		style="width: 44px; height: 44px; background: var(--tw-red); display: inline-flex; align-items: center; justify-content: center; border-radius: 4px;"
	>
		<span
			style="font-family: var(--font-display); font-weight: 900; font-size: 24px; color: white; letter-spacing: -0.02em;"
			>iW</span
		>
	</div>
	<div class="brand-text">
		<strong style={light ? 'color: white;' : ''}>iWood</strong>
		<span style={light ? 'color: rgba(255,255,255,0.6);' : ''}>Trần · Tường · Vách</span>
	</div>
</a>
