<script lang="ts">
	import Icon from './Icon.svelte';
	import Logo from './Logo.svelte';
	import { useI18n, t } from '$lib/i18n';
	import type { CategoryDTO } from '$lib/types';

	type Props = { navCategories: CategoryDTO[] };
	let { navCategories }: Props = $props();

	const i18n = useI18n();
</script>

<footer class="site-footer">
	<div class="container">
		<div class="footer-grid">
			<div class="footer-brand">
				<Logo light />
				<p style="margin-top: 20px;">
					{t($i18n, 'footer.brand_blurb')}
				</p>
				<div class="footer-cert-row">
					<span class="footer-cert">ISO 9001</span>
					<span class="footer-cert">Quatest 3</span>
					<span class="footer-cert">{t($i18n, 'footer.cert_warranty')}</span>
				</div>
			</div>
			<div>
				<h5>{t($i18n, 'footer.heading_products')}</h5>
				<ul>
					{#each navCategories as c (c.id)}
						<li><a href={`/products?cat=${c.id}`}>{$i18n.locale === 'en' && c.en ? c.en : c.vi}</a></li>
					{/each}
				</ul>
			</div>
			<div>
				<h5>{t($i18n, 'footer.heading_company')}</h5>
				<ul>
					<li><a href="/about">{t($i18n, 'footer.company_about')}</a></li>
					<li><a href="/projects">{t($i18n, 'footer.company_projects')}</a></li>
					<li><a href="/news">{t($i18n, 'footer.company_news')}</a></li>
					<li><a href="/contact">{t($i18n, 'footer.company_contact')}</a></li>
					<li><a href="/quote">{t($i18n, 'footer.company_quote')}</a></li>
					<li><a href="#careers">{t($i18n, 'footer.company_careers')}</a></li>
					<li><a href="#warranty">{t($i18n, 'footer.company_warranty')}</a></li>
				</ul>
			</div>
			<div>
				<h5>{t($i18n, 'footer.heading_contact')}</h5>
				<div class="footer-contact-row">
					<Icon name="map" size={18} class="ico" />
					<div class="t">
						{t($i18n, 'footer.address_main')}<br />{t($i18n, 'footer.address_branches')}
					</div>
				</div>
				<div class="footer-contact-row">
					<Icon name="phone" size={18} class="ico" />
					<div class="t">0915 000 000 · 0916 000 000<br />{t($i18n, 'footer.phone_hours')}</div>
				</div>
				<div class="footer-contact-row">
					<Icon name="mail" size={18} class="ico" />
					<div class="t">cskh@iwood.com.vn<br />duan@iwood.com.vn</div>
				</div>
				<a href="/quote" class="footer-cta" style="margin-top: 16px;"
					>{t($i18n, 'footer.cta_free_quote')}</a
				>
			</div>
		</div>
		<div class="footer-bar">
			<div>{t($i18n, 'footer.copyright')}</div>
			<div class="legal">
				<a href="#facebook"><Icon name="facebook" size={16} style="vertical-align: middle;" /></a>
				<a href="#youtube"><Icon name="youtube" size={16} style="vertical-align: middle;" /></a>
				<a href="#instagram"
					><Icon name="instagram" size={16} style="vertical-align: middle;" /></a
				>
				<a href="#privacy">{t($i18n, 'footer.legal_privacy')}</a>
				<a href="#terms">{t($i18n, 'footer.legal_terms')}</a>
			</div>
		</div>
	</div>
</footer>
