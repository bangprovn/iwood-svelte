<script lang="ts">
	import { enhance } from '$app/forms';
	import Icon from '$lib/components/Icon.svelte';
	import { IMG } from '$lib/data/iwood';
	import { useI18n, t } from '$lib/i18n';
	import type { ActionData, PageData } from './$types';

	const i18n = useI18n();

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const showrooms = $derived(data.showrooms);

	let name = $state('');
	let phone = $state('');
	let email = $state('');
	let subject = $state('Tư vấn sản phẩm');
	let message = $state('');
	let sending = $state(false);
</script>

<main>
	<section class="page-hero">
		<div class="page-hero-bg" style={`background-image: url(${IMG.heroLobby});`}></div>
		<div class="container">
			<div class="crumbs">
				<a href="/">{t($i18n, 'nav.home')}</a>
				<Icon name="chevR" size={12} class="sep" />
				<span class="current">{t($i18n, 'nav.contact')}</span>
			</div>
			<span class="eyebrow" style="color: var(--tw-red);">{t($i18n, 'contact.hero.eyebrow')}</span>
			<h1>{t($i18n, 'contact.hero.heading')}</h1>
			<p class="lead">
				{t($i18n, 'contact.hero.lead')}
			</p>
		</div>
	</section>

	<section class="section">
		<div class="container">
			<div class="grid grid-3">
				{#each showrooms as s (s.city)}
					<div
						style="border-radius: 8px; overflow: hidden; border: 1px solid var(--hairline);"
					>
						<div
							style={`aspect-ratio: 16/10; background-image: url(${s.img}); background-size: cover; background-position: center;`}
						></div>
						<div style="padding: 24px;">
							<span class="eyebrow">{t($i18n, 'contact.showroom_label')}</span>
							<h3 style="margin: 4px 0 16px;">iWood {s.city}</h3>
							<div style="display: flex; gap: 10px; margin-bottom: 12px;">
								<Icon
									name="map"
									size={18}
									style="color: var(--tw-red); flex-shrink: 0;"
								/>
								<span style="font-size: 14px;">{s.addr}</span>
							</div>
							<div style="display: flex; gap: 10px; margin-bottom: 12px;">
								<Icon
									name="phone"
									size={18}
									style="color: var(--tw-red); flex-shrink: 0;"
								/>
								<span style="font-size: 14px;">{s.phone}</span>
							</div>
							<div style="display: flex; gap: 10px; margin-bottom: 16px;">
								<Icon
									name="clock"
									size={18}
									style="color: var(--tw-red); flex-shrink: 0;"
								/>
								<span style="font-size: 14px;">{s.hours}</span>
							</div>
							<a
								href="/contact"
								class="btn btn-outline btn-sm"
								style="width: 100%; justify-content: center;"
							>
								{t($i18n, 'contact.view_map')} <Icon name="arrow" size={12} />
							</a>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<section class="section section-bone">
		<div class="container split split-5-7">
			<div>
				<span class="red-bar" style="margin-bottom: 16px;"></span>
				<span class="eyebrow">{t($i18n, 'contact.form_eyebrow')}</span>
				<h2 style="margin-top: 8px;">{t($i18n, 'contact.form_heading')}</h2>
				<p>{t($i18n, 'contact.form_desc')}</p>
				<div style="margin-top: 32px;">
					<div style="display: flex; gap: 12px; padding: 12px 0;">
						<Icon name="phone" size={20} style="color: var(--tw-red);" />
						<div>
							<div style="font-size: 13px; color: var(--slate-2);">{t($i18n, 'contact.label_hotline')}</div>
							<strong>0915 000 000 · 0916 000 000</strong>
						</div>
					</div>
					<div style="display: flex; gap: 12px; padding: 12px 0;">
						<Icon name="mail" size={20} style="color: var(--tw-red);" />
						<div>
							<div style="font-size: 13px; color: var(--slate-2);">{t($i18n, 'contact.label_email')}</div>
							<strong>cskh@iwood.com.vn</strong>
						</div>
					</div>
					<div style="display: flex; gap: 12px; padding: 12px 0;">
						<Icon name="chat" size={20} style="color: var(--tw-red);" />
						<div>
							<div style="font-size: 13px; color: var(--slate-2);">{t($i18n, 'contact.label_zalo')}</div>
							<strong>0915 000 000 (24/7)</strong>
						</div>
					</div>
				</div>
			</div>
			<form
				method="POST"
				action="?/send"
				use:enhance={() => {
					sending = true;
					return async ({ update }) => {
						await update({ reset: false });
						sending = false;
					};
				}}
				style="background: white; padding: 32px; border-radius: 8px;"
			>
				{#if form?.success}
					<div
						style="padding: 12px 16px; background: #ecfdf5; color: #065f46; border-radius: 6px; margin-bottom: 16px;"
					>
						{t($i18n, 'contact.success_msg')}
					</div>
				{/if}
				<div class="form-row-2">
					<div class="field">
						<label for="contact-name">{t($i18n, 'contact.name')} <span class="req">{t($i18n, 'contact.required')}</span></label>
						<input id="contact-name" name="name" required bind:value={name} />
						{#if form?.errors?.name}<span class="err">{form.errors.name}</span>{/if}
					</div>
					<div class="field">
						<label for="contact-phone">{t($i18n, 'contact.phone')} <span class="req">{t($i18n, 'contact.required')}</span></label>
						<input id="contact-phone" name="phone" required bind:value={phone} />
						{#if form?.errors?.phone}<span class="err">{form.errors.phone}</span>{/if}
					</div>
				</div>
				<div class="field" style="margin-top: 16px;">
					<label for="contact-email">{t($i18n, 'contact.email_label')}</label>
					<input id="contact-email" name="email" type="email" bind:value={email} />
				</div>
				<div class="field" style="margin-top: 16px;">
					<label for="contact-subject">{t($i18n, 'contact.subject')}</label>
					<select id="contact-subject" name="subject" bind:value={subject}>
						<option>Tư vấn sản phẩm</option>
						<option>Báo giá dự án</option>
						<option>Bảo hành</option>
						<option>Khác</option>
					</select>
				</div>
				<div class="field" style="margin-top: 16px;">
					<label for="contact-message">{t($i18n, 'contact.message')} <span class="req">{t($i18n, 'contact.required')}</span></label>
					<textarea id="contact-message" name="message" rows={5} required bind:value={message}
					></textarea>
					{#if form?.errors?.message}<span class="err">{form.errors.message}</span>{/if}
				</div>
				<button type="submit" class="btn btn-primary" style="margin-top: 20px;" disabled={sending}>
					{sending ? t($i18n, 'contact.sending') : t($i18n, 'contact.send')} <Icon name="arrow" size={14} />
				</button>
			</form>
		</div>
	</section>

	<section class="contact-map">
		<div
			style="position: absolute; inset: 0; background-image: url(https://images.unsplash.com/photo-1524813686514-a57563d77965?w=1600&q=80); background-size: cover; background-position: center; filter: grayscale(0.4);"
		></div>
		<div style="position: absolute; inset: 0; background: rgba(15,15,16,0.3);"></div>
		<div class="contact-map-card">
			<strong style="display: block; font-size: 18px;">iWood TP.HCM</strong>
			<div style="font-size: 14px; color: var(--slate-2); margin-top: 4px;">
				123 Nguyễn Văn Linh, Q.7
			</div>
			<a href="/contact" class="btn btn-primary btn-sm" style="margin-top: 16px;">{t($i18n, 'contact.directions')}</a>
		</div>
	</section>
</main>
