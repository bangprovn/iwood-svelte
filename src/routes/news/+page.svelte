<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import { IMG } from '$lib/data/iwood';
	import { useI18n, t } from '$lib/i18n';
	import type { PageData } from './$types';

	const i18n = useI18n();

	let { data }: { data: PageData } = $props();
	const posts = $derived(data.posts);

	let cat = $state('all');
	const cats = ['all', 'Tin tức', 'Kiến thức', 'Hướng dẫn', 'Cảm hứng'];
	const filtered = $derived(cat === 'all' ? posts : posts.filter((p) => p.cat === cat));

	let newsletterEmail = $state('');
	let newsletterStatus = $state<'idle' | 'sending' | 'ok' | 'dup' | 'err'>('idle');
	let newsletterError = $state('');

	async function onNewsletterSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (newsletterStatus === 'sending') return;
		newsletterStatus = 'sending';
		newsletterError = '';
		try {
			const res = await fetch('/api/newsletter', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ email: newsletterEmail })
			});
			if (!res.ok) {
				newsletterError = (await res.text()) || t($i18n, 'news.err_subscribe');
				newsletterStatus = 'err';
				return;
			}
			const body = (await res.json()) as { created: boolean };
			newsletterStatus = body.created ? 'ok' : 'dup';
			newsletterEmail = '';
		} catch (err) {
			newsletterError = err instanceof Error ? err.message : t($i18n, 'news.err_connection');
			newsletterStatus = 'err';
		}
	}
</script>

<main>
	<section class="page-hero">
		<div class="page-hero-bg" style={`background-image: url(${IMG.blog4});`}></div>
		<div class="container">
			<div class="crumbs">
				<a href="/">{t($i18n, 'nav.home')}</a>
				<Icon name="chevR" size={12} class="sep" />
				<span class="current">{t($i18n, 'nav.news')} · Blog</span>
			</div>
			<span class="eyebrow" style="color: var(--tw-red);">{t($i18n, 'news.hero.eyebrow')}</span>
			<h1>{t($i18n, 'news.hero.heading')}</h1>
			<p class="lead">
				{t($i18n, 'news.hero.lead')}
			</p>
		</div>
	</section>

	<!-- FEATURED -->
	{#if posts.length > 0}
		<section class="section">
			<div class="container">
				<a
					href={`/news/${posts[0].slug}`}
					class="split split-7-5"
					style="margin-bottom: 48px; gap: 48px;"
				>
					<div
						style={`aspect-ratio: 16/10; background-image: url(${posts[0].img}); background-size: cover; background-position: center; border-radius: 8px;`}
					></div>
					<div style="display: flex; flex-direction: column; justify-content: center;">
						<span class="eyebrow" style="color: var(--tw-red);">
							{t($i18n, 'news.featured_label')} · {posts[0].cat}
						</span>
						<h2
							style="margin-top: 12px; font-family: var(--font-display); font-size: clamp(28px, 3.5vw, 48px);"
						>
							{$i18n.locale === 'en' && posts[0].en ? posts[0].en : posts[0].vi}
						</h2>
						<p style="margin-top: 12px; font-size: 16px; color: var(--slate); line-height: 1.7;">
							{posts[0].excerpt}
						</p>
						<div
							style="display: flex; align-items: center; gap: 16px; margin-top: 24px; font-size: 13px; color: var(--slate-2);"
						>
							<span>
								<Icon name="calendar" size={14} style="vertical-align: middle;" />
								{posts[0].date}
							</span>
							<span>
								<Icon name="clock" size={14} style="vertical-align: middle;" /> {t($i18n, 'news.read_time')}
							</span>
						</div>
						<span class="btn btn-outline" style="align-self: flex-start; margin-top: 24px;">
							{t($i18n, 'news.read_article')} <Icon name="arrow" size={14} />
						</span>
					</div>
				</a>

				<div class="filter-bar" style="margin-bottom: 32px;">
					{#each cats as c (c)}
						<button
							class={'filter-chip ' + (cat === c ? 'active' : '')}
							onclick={() => (cat = c)}
						>
							{c === 'all' ? t($i18n, 'news.filter_all') : c}
						</button>
					{/each}
				</div>
				<div class="grid grid-3">
					{#each filtered.slice(1) as p (p.id)}
						<a href={`/news/${p.slug}`} class="project-card">
							<div
								class="media"
								style={`background-image: url(${p.img}); aspect-ratio: 16/10;`}
							></div>
							<div class="body">
								<span class="cat">{p.cat} · {p.date}</span>
								<h4>{$i18n.locale === 'en' && p.en ? p.en : p.vi}</h4>
								<p
									style="font-size: 14px; color: var(--slate-2); margin: 4px 0 0; line-height: 1.5;"
								>
									{p.excerpt}
								</p>
							</div>
						</a>
					{/each}
				</div>
			</div>
		</section>
	{/if}

	<!-- NEWSLETTER -->
	<section class="section section-bone" style="padding: 64px 0;">
		<div class="container split split-1-1 center">
			<div>
				<span class="red-bar" style="margin-bottom: 16px;"></span>
				<span class="eyebrow">Newsletter</span>
				<h2 style="margin-top: 8px;">{t($i18n, 'news.newsletter_heading')}</h2>
				<p>{t($i18n, 'news.newsletter_desc')}</p>
			</div>
			<form style="display: flex; flex-direction: column; gap: 8px;" onsubmit={onNewsletterSubmit}>
				<div style="display: flex; gap: 8px; flex-wrap: wrap;">
					<input
						type="email"
						placeholder={t($i18n, 'news.newsletter_placeholder')}
						required
						bind:value={newsletterEmail}
						disabled={newsletterStatus === 'sending'}
						style="flex: 1; min-width: 220px; padding: 16px; border: 1px solid var(--hairline); border-radius: 4px; font-family: inherit;"
					/>
					<button type="submit" class="btn btn-primary" disabled={newsletterStatus === 'sending'}>
						{newsletterStatus === 'sending' ? t($i18n, 'news.newsletter_sending') : t($i18n, 'news.newsletter_subscribe')}
					</button>
				</div>
				{#if newsletterStatus === 'ok'}
					<span style="color: #065f46; font-size: 13px;">{t($i18n, 'news.newsletter_success')}</span>
				{:else if newsletterStatus === 'dup'}
					<span style="color: var(--slate-2); font-size: 13px;">{t($i18n, 'news.newsletter_dup')}</span>
				{:else if newsletterStatus === 'err'}
					<span style="color: #991b1b; font-size: 13px;">{newsletterError}</span>
				{/if}
			</form>
		</div>
	</section>
</main>
