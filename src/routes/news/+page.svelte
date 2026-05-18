<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import { IMG } from '$lib/data/iwood';
	import { useI18n, t } from '$lib/i18n';
	import type { PageData } from './$types';

	const i18n = useI18n();

	let { data }: { data: PageData } = $props();

	const posts = $derived(data.posts);
	const totalPages = $derived(Math.max(1, Math.ceil(data.total / data.pageSize)));
	const showFeatured = $derived(data.page === 1 && data.category === 'all' && posts.length > 0);
	const gridPosts = $derived(showFeatured ? posts.slice(1) : posts);

	function pageHref(p: number, cat: string = data.category): string {
		const params = new URLSearchParams();
		if (cat && cat !== 'all') params.set('category', cat);
		if (p > 1) params.set('page', String(p));
		const qs = params.toString();
		return qs ? `/news?${qs}` : '/news';
	}

	function catHref(cat: string): string {
		// Switching category always resets to page 1.
		return pageHref(1, cat);
	}

	function pageRange(current: number, total: number): number[] {
		// Show up to 5 pages around the current one, clamped to [1, total].
		const span = 2;
		const start = Math.max(1, current - span);
		const end = Math.min(total, current + span);
		const out: number[] = [];
		for (let p = start; p <= end; p++) out.push(p);
		return out;
	}

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

	<section class="section">
		<div class="container">
			{#if showFeatured}
				<a
					href={`/news/${posts[0].slug}`}
					class="split split-7-5"
					style="margin-bottom: 48px; gap: 48px;"
					data-sveltekit-preload-data="hover"
				>
					<div
						class={'news-media' + (posts[0].img ? '' : ' news-media-placeholder')}
						style={`aspect-ratio: 16/10; border-radius: 8px;${posts[0].img ? ` background-image: url(${posts[0].img});` : ''}`}
					>
						{#if !posts[0].img}
							<span class="news-media-wordmark">iWood</span>
						{/if}
					</div>
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
			{/if}

			<div class="filter-bar" style="margin-bottom: 32px;">
				{#each data.categories as c (c)}
					<a
						class={'filter-chip ' + (data.category === c ? 'active' : '')}
						href={catHref(c)}
						data-sveltekit-noscroll
					>
						{c === 'all' ? t($i18n, 'news.filter_all') : c}
					</a>
				{/each}
			</div>

			{#if gridPosts.length === 0 && !showFeatured}
				<p style="color: var(--slate-2); padding: 48px 0; text-align: center;">
					{t($i18n, 'news.empty')}
				</p>
			{:else}
				<div class="grid grid-3 news-grid">
					{#each gridPosts as p (p.id)}
						<a href={`/news/${p.slug}`} class="project-card news-card">
							<div
								class={'media' + (p.img ? '' : ' news-media-placeholder')}
								style={p.img ? `background-image: url(${p.img});` : ''}
							>
								{#if !p.img}
									<span class="news-media-wordmark">iWood</span>
								{/if}
							</div>
							<div class="body">
								<span class="cat">{p.cat} · {p.date}</span>
								<h4 class="news-card-title">{$i18n.locale === 'en' && p.en ? p.en : p.vi}</h4>
								<p class="news-card-excerpt">
									{p.excerpt}
								</p>
							</div>
						</a>
					{/each}
				</div>
			{/if}

			{#if totalPages > 1}
				<nav
					aria-label="Pagination"
					style="display: flex; justify-content: center; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 48px;"
				>
					{#if data.page > 1}
						<a class="filter-chip" href={pageHref(data.page - 1)} rel="prev">
							<Icon name="chevR" size={12} style="transform: rotate(180deg);" />
							{t($i18n, 'news.prev_page')}
						</a>
					{/if}

					{#if pageRange(data.page, totalPages)[0] > 1}
						<a class="filter-chip" href={pageHref(1)}>1</a>
						{#if pageRange(data.page, totalPages)[0] > 2}
							<span style="color: var(--slate-2);">…</span>
						{/if}
					{/if}

					{#each pageRange(data.page, totalPages) as p (p)}
						<a class={'filter-chip ' + (p === data.page ? 'active' : '')} href={pageHref(p)}>
							{p}
						</a>
					{/each}

					{#if pageRange(data.page, totalPages).at(-1)! < totalPages}
						{#if pageRange(data.page, totalPages).at(-1)! < totalPages - 1}
							<span style="color: var(--slate-2);">…</span>
						{/if}
						<a class="filter-chip" href={pageHref(totalPages)}>{totalPages}</a>
					{/if}

					{#if data.page < totalPages}
						<a class="filter-chip" href={pageHref(data.page + 1)} rel="next">
							{t($i18n, 'news.next_page')}
							<Icon name="chevR" size={12} />
						</a>
					{/if}
				</nav>
			{/if}
		</div>
	</section>

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

<style>
	.news-grid {
		align-items: stretch;
	}
	.news-card {
		height: 100%;
	}
	.news-card .media {
		aspect-ratio: 16 / 10;
	}
	.news-card .body {
		flex: 1;
		display: flex;
		flex-direction: column;
	}
	.news-card-title {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		min-height: calc(1.3em * 2);
	}
	.news-card-excerpt {
		font-size: 14px;
		color: var(--slate-2);
		margin: 4px 0 0;
		line-height: 1.5;
		display: -webkit-box;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	.news-media-placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: var(--bone);
		background-image:
			linear-gradient(135deg, transparent 46%, rgba(0, 0, 0, 0.04) 46%, rgba(0, 0, 0, 0.04) 54%, transparent 54%),
			linear-gradient(45deg, transparent 46%, rgba(0, 0, 0, 0.04) 46%, rgba(0, 0, 0, 0.04) 54%, transparent 54%);
		background-size: 24px 24px;
	}
	.news-media-wordmark {
		font-family: var(--font-display, serif);
		font-size: clamp(28px, 4vw, 44px);
		font-weight: 600;
		letter-spacing: 0.04em;
		color: var(--slate-2);
		opacity: 0.55;
		user-select: none;
	}
</style>
