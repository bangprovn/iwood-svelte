<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import { useI18n, t } from '$lib/i18n';
	import type { PageData } from './$types';

	const i18n = useI18n();

	let { data }: { data: PageData } = $props();
	const post = $derived(data.post);
	const more = $derived(data.more);

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

	async function onShare() {
		const url = typeof location !== 'undefined' ? location.href : '';
		if (typeof navigator !== 'undefined' && navigator.share) {
			try {
				await navigator.share({ title: post.vi, text: post.excerpt, url });
				return;
			} catch {
				// fall through to clipboard
			}
		}
		if (typeof navigator !== 'undefined' && navigator.clipboard) {
			await navigator.clipboard.writeText(url);
		}
	}
</script>

<main>
	<section
		style="position: relative; min-height: 480px; color: white; overflow: hidden; padding: 96px 0 64px;"
	>
		<div
			style={`position: absolute; inset: 0; background-image: url(${post.img}); background-size: cover; background-position: center;`}
		></div>
		<div
			style="position: absolute; inset: 0; background: linear-gradient(to top, rgba(15,15,16,0.92) 0%, rgba(15,15,16,0.45) 60%, rgba(15,15,16,0.2));"
		></div>
		<div class="container" style="position: relative;">
			<div class="crumbs" style="color: rgba(255,255,255,0.7);">
				<a href="/" style="color: inherit;">{t($i18n, 'nav.home')}</a>
				<Icon name="chevR" size={12} class="sep" />
				<a href="/news" style="color: inherit;">{t($i18n, 'nav.news')}</a>
				<Icon name="chevR" size={12} class="sep" />
				<span style="color: white;">{post.cat}</span>
			</div>
			<span class="eyebrow" style="color: var(--tw-red);">{post.cat}</span>
			<h1 style="margin-top: 12px; color: white; font-size: clamp(32px, 4.5vw, 56px); max-width: 920px;">
				{$i18n.locale === 'en' && post.en ? post.en : post.vi}
			</h1>
			<p
				style="margin-top: 16px; max-width: 720px; font-size: 18px; line-height: 1.6; color: rgba(255,255,255,0.85);"
			>
				{post.excerpt}
			</p>
			<div
				style="display: flex; flex-wrap: wrap; gap: 24px; margin-top: 24px; font-size: 13px; color: rgba(255,255,255,0.75);"
			>
				<span>
					<Icon name="calendar" size={14} style="vertical-align: middle;" />
					{post.date}
				</span>
				<span>
					<Icon name="clock" size={14} style="vertical-align: middle;" /> {t($i18n, 'news_detail.read_time')}
				</span>
				<span>iWood Editorial</span>
			</div>
		</div>
	</section>

	<section class="section">
		<div class="container split split-3-2">
			<article>
				<p class="lead" style="font-size: 20px; color: var(--ink);">
					{post.excerpt}
				</p>

				{#if post.content}
					<div class="rt-content">{@html post.content}</div>
				{:else}
					<p style="color: var(--slate-2); font-style: italic;">
						{t($i18n, 'news_detail.pending')}
					</p>
				{/if}

				<div
					style="display: flex; align-items: center; gap: 12px; margin-top: 48px; padding-top: 24px; border-top: 1px solid var(--hairline);"
				>
					<span style="font-size: 13px; color: var(--slate-2);">{t($i18n, 'news_detail.share_label')}</span>
					<button
						type="button"
						class="btn btn-outline"
						onclick={onShare}
						style="padding: 8px 16px; font-size: 13px;"
					>
						<Icon name="arrowUR" size={14} /> {t($i18n, 'news_detail.share_btn')}
					</button>
					<a href="/news" class="btn btn-outline" style="padding: 8px 16px; font-size: 13px;">
						<Icon name="arrow" size={14} /> {t($i18n, 'news_detail.all_articles')}
					</a>
				</div>
			</article>

			<aside style="display: flex; flex-direction: column; gap: 24px;">
				<div style="padding: 24px; background: var(--bone); border-radius: 8px;">
					<h5
						style="margin: 0 0 12px; font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--slate-2);"
					>
						{t($i18n, 'news_detail.info_heading')}
					</h5>
					{#each [[t($i18n, 'news_detail.info_category'), post.cat], [t($i18n, 'news_detail.info_date'), post.date], [t($i18n, 'news_detail.info_read_time'), '5 phút'], [t($i18n, 'news_detail.info_author'), 'iWood Editorial']] as [k, v] (k)}
						<div
							style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--hairline); font-size: 14px;"
						>
							<span style="color: var(--slate-2);">{k}</span>
							<strong>{v}</strong>
						</div>
					{/each}
				</div>

				<div
					style="padding: 24px; background: var(--ink); color: white; border-radius: 8px;"
				>
					<span class="eyebrow" style="color: var(--tw-red);">{t($i18n, 'news_detail.advice_eyebrow')}</span>
					<h4 style="margin: 8px 0 12px; color: white;">{t($i18n, 'news_detail.advice_heading')}</h4>
					<p style="font-size: 14px; line-height: 1.6; color: rgba(255,255,255,0.75);">
						{t($i18n, 'news_detail.advice_desc')}
					</p>
					<a
						href="/quote"
						class="btn btn-primary"
						style="width: 100%; justify-content: center; margin-top: 16px;"
					>
						{t($i18n, 'cta.request_quote')}
					</a>
					<a
						href="tel:0915000000"
						style="display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 8px; padding: 12px; color: white; font-size: 13px; text-decoration: none;"
					>
						<Icon name="phone" size={14} /> 0915 000 000
					</a>
				</div>
			</aside>
		</div>
	</section>

	{#if more.length > 0}
		<section class="section section-bone">
			<div class="container">
				<div class="section-head">
					<span class="red-bar"></span>
					<span class="eyebrow">{t($i18n, 'news_detail.more_eyebrow')}</span>
					<h2>{t($i18n, 'news_detail.more_heading')}</h2>
				</div>
				<div class="grid grid-3">
					{#each more as p (p.id)}
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
