<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import { IMG, fmt } from '$lib/data/iwood';
	import { inquiry } from '$lib/state/inquiry.svelte';
	import { useI18n, t } from '$lib/i18n';
	import { get } from 'svelte/store';

	const i18n = useI18n();

	type Errors = {
		type?: string;
		area?: string;
		name?: string;
		phone?: string;
	};

	let step = $state(1);
	let type = $state('');
	let area = $state('');
	let start = $state('');
	let name = $state('');
	let phone = $state('');
	let email = $state('');
	let city = $state('');
	let notes = $state('');
	let errors = $state<Errors>({});
	let submitted = $state(false);
	let submitting = $state(false);
	let submitError = $state('');

	const projectTypeKeys = [
		'quote.type_residential',
		'quote.type_office',
		'quote.type_hotel',
		'quote.type_cafe',
		'quote.type_commercial',
		'quote.type_other'
	];

	const stepperItems = [
		{ n: 1, key: 'quote.step_project' },
		{ n: 2, key: 'quote.step_contact' },
		{ n: 3, key: 'quote.step_confirm' }
	];

	const commitmentKeys = [
		'quote.commitment_1',
		'quote.commitment_2',
		'quote.commitment_3',
		'quote.commitment_4',
		'quote.commitment_5'
	];

	function validate(s: number): boolean {
		const e: Errors = {};
		if (s === 1) {
			if (!type) e.type = 'quote.err_select_type';
			if (!area) e.area = 'quote.err_enter_area';
		}
		if (s === 2) {
			if (!name) e.name = 'quote.err_enter_name';
			if (!phone) e.phone = 'quote.err_enter_phone';
			else if (!/^0\d{9,10}$/.test(phone.replace(/\s/g, ''))) e.phone = 'quote.err_invalid_phone';
		}
		errors = e;
		return Object.keys(e).length === 0;
	}

	function next() {
		if (validate(step)) step = step + 1;
	}

	async function submit() {
		if (!validate(2)) return;
		submitting = true;
		submitError = '';
		const currentI18n = get(i18n);
		try {
			const res = await fetch('/api/quotes', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					name,
					phone,
					email: email || null,
					city: city ? t(currentI18n, city) : null,
					projectType: t(currentI18n, type),
					area: Number(area),
					startWindow: start ? t(currentI18n, start) : null,
					notes: notes || null,
					items: inquiry.items.map((it) => ({ productId: it.id, qty: it.qty }))
				})
			});
			if (!res.ok) {
				submitError = (await res.text()) || 'quote.err_submit';
				return;
			}
			submitted = true;
		} catch (e) {
			submitError = e instanceof Error ? e.message : 'quote.err_connection';
		} finally {
			submitting = false;
		}
	}
</script>

{#if submitted}
	<main>
		<section class="section" style="padding: 120px 0; text-align: center;">
			<div class="container" style="max-width: 600px;">
				<div
					style="width: 96px; height: 96px; border-radius: 999px; background: var(--tw-red); color: white; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 24px;"
				>
					<Icon name="check" size={48} />
				</div>
				<h1>{t($i18n, 'quote.thank_you', { name })}</h1>
				<p class="lead">
					{@html t($i18n, 'quote.thank_you_desc', { phone })}
				</p>
				<div style="display: flex; gap: 12px; justify-content: center; margin-top: 32px;">
					<a href="/" class="btn btn-outline">{t($i18n, 'quote.go_home')}</a>
					<a href="/products" class="btn btn-primary">{t($i18n, 'quote.view_more')}</a>
				</div>
			</div>
		</section>
	</main>
{:else}
	<main>
		<section class="page-hero">
			<div class="page-hero-bg" style={`background-image: url(${IMG.heroBambooWall});`}></div>
			<div class="container">
				<div class="crumbs">
					<a href="/">{t($i18n, 'nav.home')}</a>
					<Icon name="chevR" size={12} class="sep" />
					<span class="current">{t($i18n, 'quote.breadcrumb')}</span>
				</div>
				<span class="eyebrow" style="color: var(--tw-red);">
					{t($i18n, 'quote.hero.eyebrow')}
				</span>
				<h1>{@html t($i18n, 'quote.hero.heading').replace(/\n/g, '<br />')}</h1>
				<p class="lead">
					{t($i18n, 'quote.hero.lead')}
				</p>
			</div>
		</section>

		<section class="section">
			<div class="container split split-7-5">
				<div>
					<!-- Stepper -->
					<div class="quote-stepper" style="position: relative;">
						{#each stepperItems as s, i (s.n)}
							<div class={step === s.n ? 'quote-stepper-active' : ''}>
								<div
									style={`width: 36px; height: 36px; border-radius: 999px; background: ${step >= s.n ? 'var(--tw-red)' : 'var(--bone)'}; color: ${step >= s.n ? 'white' : 'var(--slate-2)'}; display: inline-flex; align-items: center; justify-content: center; font-weight: 700; flex-shrink: 0;`}
								>
									{#if step > s.n}
										<Icon name="check" size={16} />
									{:else}
										{s.n}
									{/if}
								</div>
								<div class="quote-stepper-label" style="min-width: 0;">
									<div
										style="font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--slate-2);"
									>
										{t($i18n, 'quote.step_n', { n: s.n })}
									</div>
									<strong>{t($i18n, s.key)}</strong>
								</div>
								{#if i < stepperItems.length - 1}
									<div
										style={`flex: 1; min-width: 16px; height: 2px; background: ${step > s.n ? 'var(--tw-red)' : 'var(--hairline)'}; margin: 0 12px;`}
									></div>
								{/if}
							</div>
						{/each}
					</div>

					{#if step === 1}
						<div>
							<h3>{t($i18n, 'quote.project_heading')}</h3>
							<p style="color: var(--slate-2);">
								{t($i18n, 'quote.project_desc')}
							</p>
							<div class="field" style="margin-top: 24px;">
								<div
									style="font-size: 12px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--slate);"
								>
									{t($i18n, 'quote.project_type')} <span class="req">*</span>
								</div>
								<div class="quote-types">
									{#each projectTypeKeys as pt (pt)}
										<button
											type="button"
											onclick={() => (type = pt)}
											style={`padding: 16px; background: ${type === pt ? 'var(--ink)' : 'white'}; color: ${type === pt ? 'white' : 'var(--ink)'}; border: 1px solid ${type === pt ? 'var(--ink)' : 'var(--hairline)'}; border-radius: 4px; font-family: inherit; font-weight: 600; cursor: pointer; text-align: left;`}
										>
											{t($i18n, pt)}
										</button>
									{/each}
								</div>
								{#if errors.type}
									<span class="err">{t($i18n, errors.type)}</span>
								{/if}
							</div>
							<div class="form-row-2" style="margin-top: 16px;">
								<div class="field">
									<label for="quote-area">
										{t($i18n, 'quote.area_label')} <span class="req">*</span>
									</label>
									<input
										id="quote-area"
										type="number"
										placeholder="100"
										class={errors.area ? 'has-error' : ''}
										bind:value={area}
									/>
									{#if errors.area}
										<span class="err">{t($i18n, errors.area)}</span>
									{/if}
								</div>
								<div class="field">
									<label for="quote-start">{t($i18n, 'quote.start_label')}</label>
									<select id="quote-start" bind:value={start}>
										<option value="">{t($i18n, 'quote.start_select')}</option>
										<option value="quote.start_this_month">{t($i18n, 'quote.start_this_month')}</option>
										<option value="quote.start_1_3">{t($i18n, 'quote.start_1_3')}</option>
										<option value="quote.start_3_6">{t($i18n, 'quote.start_3_6')}</option>
										<option value="quote.start_surveying">{t($i18n, 'quote.start_surveying')}</option>
									</select>
								</div>
							</div>
							<div style="margin-top: 32px;">
								<button onclick={next} class="btn btn-primary">
									{t($i18n, 'quote.next')} <Icon name="arrow" size={14} />
								</button>
							</div>
						</div>
					{/if}

					{#if step === 2}
						<div>
							<h3>{t($i18n, 'quote.contact_heading')}</h3>
							<p style="color: var(--slate-2);">{t($i18n, 'quote.contact_desc')}</p>
							<div class="form-row-2" style="margin-top: 24px;">
								<div class="field">
									<label for="quote-name">{t($i18n, 'quote.name')} <span class="req">*</span></label>
									<input
										id="quote-name"
										class={errors.name ? 'has-error' : ''}
										bind:value={name}
									/>
									{#if errors.name}
										<span class="err">{t($i18n, errors.name)}</span>
									{/if}
								</div>
								<div class="field">
									<label for="quote-phone">{t($i18n, 'quote.phone')} <span class="req">*</span></label>
									<input
										id="quote-phone"
										placeholder="0915..."
										class={errors.phone ? 'has-error' : ''}
										bind:value={phone}
									/>
									{#if errors.phone}
										<span class="err">{t($i18n, errors.phone)}</span>
									{/if}
								</div>
								<div class="field">
									<label for="quote-email">{t($i18n, 'quote.email_label')}</label>
									<input id="quote-email" type="email" bind:value={email} />
								</div>
								<div class="field">
									<label for="quote-city">{t($i18n, 'quote.city_label')}</label>
									<select id="quote-city" bind:value={city}>
										<option value="">{t($i18n, 'quote.city_select')}</option>
										<option value="quote.city_hcmc">{t($i18n, 'quote.city_hcmc')}</option>
										<option value="quote.city_hanoi">{t($i18n, 'quote.city_hanoi')}</option>
										<option value="quote.city_danang">{t($i18n, 'quote.city_danang')}</option>
										<option value="quote.city_other">{t($i18n, 'quote.city_other')}</option>
									</select>
								</div>
							</div>
							<div class="field" style="margin-top: 16px;">
								<label for="quote-notes">{t($i18n, 'quote.notes_label')}</label>
								<textarea
									id="quote-notes"
									rows={4}
									bind:value={notes}
									placeholder={t($i18n, 'quote.notes_placeholder')}
								></textarea>
							</div>
							<div style="margin-top: 32px; display: flex; gap: 12px;">
								<button onclick={() => (step = 1)} class="btn btn-outline">
									<Icon name="chevL" size={14} /> {t($i18n, 'quote.back')}
								</button>
								<button onclick={next} class="btn btn-primary">
									{t($i18n, 'quote.review')} <Icon name="arrow" size={14} />
								</button>
							</div>
						</div>
					{/if}

					{#if step === 3}
						<div>
							<h3>{t($i18n, 'quote.confirm_heading')}</h3>
							<p style="color: var(--slate-2);">{t($i18n, 'quote.confirm_desc')}</p>
							<div
								style="background: var(--bone); padding: 24px; border-radius: 8px; margin-top: 24px;"
							>
								<h5
									style="margin-top: 0; font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--slate-2);"
								>
									{t($i18n, 'quote.section_project')}
								</h5>
								<div class="form-row-2" style="gap: 12px; margin-bottom: 16px;">
									<div>
										<div style="font-size: 13px; color: var(--slate-2);">{t($i18n, 'quote.field_type')}</div>
										<strong>{t($i18n, type)}</strong>
									</div>
									<div>
										<div style="font-size: 13px; color: var(--slate-2);">{t($i18n, 'quote.field_area')}</div>
										<strong>{area} m²</strong>
									</div>
									{#if start}
										<div>
											<div style="font-size: 13px; color: var(--slate-2);">{t($i18n, 'quote.field_start')}</div>
											<strong>{t($i18n, start)}</strong>
										</div>
									{/if}
								</div>
								<h5
									style="font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--slate-2);"
								>
									{t($i18n, 'quote.section_contact')}
								</h5>
								<div class="form-row-2" style="gap: 12px;">
									<div>
										<div style="font-size: 13px; color: var(--slate-2);">{t($i18n, 'quote.field_name')}</div>
										<strong>{name}</strong>
									</div>
									<div>
										<div style="font-size: 13px; color: var(--slate-2);">{t($i18n, 'quote.field_phone')}</div>
										<strong>{phone}</strong>
									</div>
									{#if email}
										<div>
											<div style="font-size: 13px; color: var(--slate-2);">{t($i18n, 'quote.field_email')}</div>
											<strong>{email}</strong>
										</div>
									{/if}
									{#if city}
										<div>
											<div style="font-size: 13px; color: var(--slate-2);">{t($i18n, 'quote.field_city')}</div>
											<strong>{t($i18n, city)}</strong>
										</div>
									{/if}
								</div>
								{#if inquiry.items.length > 0}
									<h5
										style="margin-top: 16px; font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--slate-2);"
									>
										{t($i18n, 'quote.section_products', { count: inquiry.items.length })}
									</h5>
									{#each inquiry.items as it (it.id)}
										<div
											style="display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px;"
										>
											<span>{it.code} — {it.qty}m²</span>
											<strong>{fmt(it.price * it.qty)}đ</strong>
										</div>
									{/each}
								{/if}
							</div>
							{#if submitError}
								<div
									style="margin-top: 16px; padding: 12px 16px; background: #fef2f2; color: #991b1b; border-radius: 6px; font-size: 14px;"
								>
									{t($i18n, submitError)}
								</div>
							{/if}
							<div style="margin-top: 32px; display: flex; gap: 12px;">
								<button onclick={() => (step = 2)} class="btn btn-outline" disabled={submitting}>
									<Icon name="chevL" size={14} /> {t($i18n, 'quote.edit')}
								</button>
								<button onclick={submit} class="btn btn-primary" disabled={submitting}>
									{submitting ? t($i18n, 'quote.submitting') : t($i18n, 'quote.submit')} <Icon name="check" size={14} />
								</button>
							</div>
						</div>
					{/if}
				</div>

				<!-- Sidebar -->
				<aside style="position: sticky; top: 100px; align-self: flex-start;">
					<div
						style="padding: 24px; background: var(--ink); color: white; border-radius: 8px;"
					>
						<span class="eyebrow" style="color: var(--tw-red);">Cam kết iWood</span>
						<h4 style="margin: 8px 0 16px; color: white;">
							{t($i18n, 'quote.sidebar_heading')}
						</h4>
						{#each commitmentKeys as cm (cm)}
							<div style="display: flex; gap: 10px; padding: 8px 0;">
								<Icon
									name="check"
									size={18}
									style="color: var(--tw-red); flex-shrink: 0; margin-top: 2px;"
								/>
								<span style="font-size: 14px;">{t($i18n, cm)}</span>
							</div>
						{/each}
					</div>
					{#if inquiry.items.length > 0}
						<div
							style="margin-top: 16px; padding: 24px; background: var(--bone); border-radius: 8px;"
						>
							<h5 style="margin-top: 0;">
								{t($i18n, 'quote.sidebar_products', { count: inquiry.items.length })}
							</h5>
							{#each inquiry.items as it (it.id)}
								<div
									style="display: flex; gap: 10px; padding: 10px 0; border-bottom: 1px solid var(--hairline);"
								>
									<div
										style={`width: 48px; height: 48px; border-radius: 4px; background-image: url(${it.img}); background-size: cover; flex-shrink: 0;`}
									></div>
									<div style="flex: 1; min-width: 0;">
										<div
											style="font-size: 11px; color: var(--slate-2); letter-spacing: 0.1em; text-transform: uppercase;"
										>
											{it.code}
										</div>
										<div style="font-size: 13px; font-weight: 600; line-height: 1.3;">
											{it.vi}
										</div>
										<div
											style="font-size: 12px; color: var(--tw-red); font-weight: 700; margin-top: 2px;"
										>
											{it.qty}m² · {fmt(it.price * it.qty)}đ
										</div>
									</div>
									<button
										onclick={() => inquiry.remove(it.id)}
										style="background: none; border: none; color: var(--slate-2); cursor: pointer;"
										aria-label={t($i18n, 'quote.delete')}
									>
										<Icon name="close" size={14} />
									</button>
								</div>
							{/each}
						</div>
					{/if}
				</aside>
			</div>
		</section>
	</main>
{/if}
