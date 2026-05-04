<script lang="ts">
	import Icon from './Icon.svelte';
	import { useI18n, t } from '$lib/i18n';

	const i18n = useI18n();
</script>

<div class="fab-stack">
	<a href="tel:0915000000" class="fab" aria-label={t($i18n, 'floating.call_now')}>
		<Icon name="phone" size={22} />
		<span class="pulse"></span>
	</a>
	<a href="https://zalo.me/0915000000" class="fab zalo" aria-label="Zalo">
		<span style="font-size: 14px; font-weight: 800; letter-spacing: -0.02em;">Zalo</span>
	</a>
</div>
