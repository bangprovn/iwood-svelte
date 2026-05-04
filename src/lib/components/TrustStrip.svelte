<script lang="ts">
	import Icon from './Icon.svelte';
	import { useI18n, t } from '$lib/i18n';

	const i18n = useI18n();
</script>

<section class="trust-strip">
	<div class="container">
		<div class="trust-row">
			<div class="trust-item">
				<Icon name="shield" size={32} class="ico" />
				<div>
					<div class="lbl-en">{t($i18n, 'trust.warranty_en')}</div>
					<div class="lbl-vi">{t($i18n, 'trust.warranty_vi')}</div>
				</div>
			</div>
			<div class="trust-item">
				<Icon name="award" size={32} class="ico" />
				<div>
					<div class="lbl-en">{t($i18n, 'trust.certified_en')}</div>
					<div class="lbl-vi">{t($i18n, 'trust.certified_vi')}</div>
				</div>
			</div>
			<div class="trust-item">
				<Icon name="truck" size={32} class="ico" />
				<div>
					<div class="lbl-en">{t($i18n, 'trust.delivery_en')}</div>
					<div class="lbl-vi">{t($i18n, 'trust.delivery_vi')}</div>
				</div>
			</div>
			<div class="trust-item">
				<Icon name="flame" size={32} class="ico" />
				<div>
					<div class="lbl-en">{t($i18n, 'trust.fireproof_en')}</div>
					<div class="lbl-vi">{t($i18n, 'trust.fireproof_vi')}</div>
				</div>
			</div>
		</div>
	</div>
</section>
