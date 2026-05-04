<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import TrustStrip from '$lib/components/TrustStrip.svelte';
	import ProductCard from '$lib/components/ProductCard.svelte';
	import { useI18n, t } from '$lib/i18n';
	import { fmt, IMG } from '$lib/data/iwood';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const i18n = useI18n();
	const categories = $derived(data.categories);
	const products = $derived(data.products);
	const projects = $derived(data.projects);
	const projectCategories = $derived(data.projectCategories);
	const posts = $derived(data.posts);

	const heroSlides = $derived([
		{
			img: IMG.heroBambooWall,
			eyebrow: t($i18n, 'home.hero.slide_1.eyebrow'),
			pre: t($i18n, 'home.hero.slide_1.pre'),
			accent: t($i18n, 'home.hero.slide_1.accent'),
			post: t($i18n, 'home.hero.slide_1.post'),
			en: t($i18n, 'home.hero.slide_1.en')
		},
		{
			img: IMG.heroLobby,
			eyebrow: t($i18n, 'home.hero.slide_2.eyebrow'),
			pre: t($i18n, 'home.hero.slide_2.pre'),
			accent: t($i18n, 'home.hero.slide_2.accent'),
			post: t($i18n, 'home.hero.slide_2.post'),
			en: t($i18n, 'home.hero.slide_2.en')
		},
		{
			img: IMG.heroHotel,
			eyebrow: t($i18n, 'home.hero.slide_3.eyebrow'),
			pre: t($i18n, 'home.hero.slide_3.pre'),
			accent: t($i18n, 'home.hero.slide_3.accent'),
			post: t($i18n, 'home.hero.slide_3.post'),
			en: t($i18n, 'home.hero.slide_3.en')
		}
	]);

	let heroIdx = $state(0);
	const cur = $derived(heroSlides[heroIdx]);

	$effect(() => {
		const id = setInterval(() => {
			heroIdx = (heroIdx + 1) % heroSlides.length;
		}, 7000);
		return () => clearInterval(id);
	});
</script>

<main>
	<!-- HERO — split editorial -->
	<section class="hero">
		<div class="hero-grid">
			<div class="hero-left reveal">
				<span class="hero-eyebrow">{cur.eyebrow}</span>
				<h1>
					{cur.pre}<span class="accent">{cur.accent}</span>{cur.post}
					<span class="en">{cur.en}</span>
				</h1>
				<p class="hero-lead">
					{t($i18n, 'home.hero.lead')}
				</p>
				<div class="hero-actions">
					<a href="/products" class="btn btn-primary">
						{t($i18n, 'home.hero.cta_explore')} <Icon name="arrow" size={14} />
					</a>
					<a href="/quote" class="btn btn-outline">{t($i18n, 'home.hero.cta_quote')}</a>
				</div>
				<div class="hero-stats">
					<div class="hero-stat">
						<div class="num">{t($i18n, 'home.hero.stat_price_prefix')} <em>180k</em></div>
						<div class="lbl">{t($i18n, 'home.hero.stat_price_label')}</div>
					</div>
					<div class="hero-stat">
						<div class="num"><em>5</em> {t($i18n, 'home.hero.stat_warranty_suffix')}</div>
						<div class="lbl">{t($i18n, 'home.hero.stat_warranty_label')}</div>
					</div>
					<div class="hero-stat">
						<div class="num"><em>1.200+</em></div>
						<div class="lbl">{t($i18n, 'home.hero.stat_projects_label')}</div>
					</div>
				</div>
			</div>
			<div class="hero-right">
				<div class="hero-img" style={`background-image: url(${cur.img});`}></div>
				<div class="hero-floater">
					<div class="dot"><Icon name="award" size={18} /></div>
					<div>
						<div class="t1">{t($i18n, 'home.hero.cert_iso')}</div>
						<div class="t2">{t($i18n, 'home.hero.cert_quatest')}</div>
					</div>
				</div>
				<div class="hero-thumbs">
					{#each heroSlides as s, i (i)}
						<button
							class={'hero-thumb ' + (i === heroIdx ? 'active' : '')}
							style={`background-image: url(${s.img});`}
							onclick={() => (heroIdx = i)}
							aria-label={t($i18n, 'home.hero.slide_aria', { n: i + 1 })}
						></button>
					{/each}
				</div>
			</div>
		</div>
	</section>

	<TrustStrip />

	<!-- CATEGORIES -->
	<section class="section">
		<div class="container">
			<div class="section-head section-head-row">
				<div>
					<span class="red-bar" style="margin-bottom: 16px;"></span>
					<span class="eyebrow">{t($i18n, 'home.categories.eyebrow')}</span>
					<h2 style="margin-top: 8px;">{t($i18n, 'home.categories.heading')}</h2>
					<p class="sub" style="margin-top: 12px; max-width: 560px;">
						{t($i18n, 'home.categories.sub')}
					</p>
				</div>
				<a href="/products" class="btn btn-outline">
					{t($i18n, 'home.categories.cta_all')} <Icon name="arrow" size={14} />
				</a>
			</div>
			<div class="grid grid-3">
				{#each categories as c, i (c.id)}
					<a
						href={`/products?cat=${c.id}`}
						class="cat-card"
						style={`background-image: url(${c.img});`}
					>
						<span class="num">0{i + 1} / 0{categories.length}</span>
						<h3>{$i18n.locale === 'en' && c.en ? c.en : c.vi}</h3>
						<div class="en">{$i18n.locale === 'en' ? c.vi : c.en}</div>
						<div class="meta-row">
							<span class="price">{t($i18n, 'home.categories.price_from', { amount: fmt(c.priceFrom) })}</span>
							<span class="arrow"><Icon name="arrow" size={16} /></span>
						</div>
					</a>
				{/each}
			</div>
		</div>
	</section>

	<!-- CINEMATIC FACTORY -->
	<section class="cinematic">
		<div class="cinematic-bg" style={`background-image: url(${IMG.factory});`}></div>
		<div class="container" style="position: relative;">
			<div class="split split-1-1 center gap-80">
				<div>
					<span class="tag-line" style="color: rgba(255,255,255,0.7);">
						{t($i18n, 'home.factory.eyebrow')}
					</span>
					<h2 style="margin-top: 16px; font-size: clamp(40px, 5vw, 72px); color: white;">
						{t($i18n, 'home.factory.heading_l1')}<br />{t($i18n, 'home.factory.heading_l2')}
					</h2>
					<p class="lead" style="margin-top: 20px;">
						{t($i18n, 'home.factory.lead')}
					</p>
					<div
						class="stat-row-3"
						style="margin-top: 40px; padding-top: 32px; border-top: 1px solid rgba(255,255,255,0.1);"
					>
						<div>
							<div
								style="font-family: var(--font-display); font-weight: 800; font-size: 48px; color: var(--tw-red); line-height: 1;"
							>
								12k
							</div>
							<div
								style="font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.6); margin-top: 6px;"
							>
								{t($i18n, 'home.factory.stat_size_label')}
							</div>
						</div>
						<div>
							<div
								style="font-family: var(--font-display); font-weight: 800; font-size: 48px; color: var(--tw-red); line-height: 1;"
							>
								180+
							</div>
							<div
								style="font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.6); margin-top: 6px;"
							>
								{t($i18n, 'home.factory.stat_skus_label')}
							</div>
						</div>
						<div>
							<div
								style="font-family: var(--font-display); font-weight: 800; font-size: 48px; color: var(--tw-red); line-height: 1;"
							>
								2019
							</div>
							<div
								style="font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.6); margin-top: 6px;"
							>
								{t($i18n, 'home.factory.stat_year_label')}
							</div>
						</div>
					</div>
					<div style="margin-top: 40px; display: flex; gap: 12px;">
						<a href="/about" class="btn btn-primary">
							{t($i18n, 'home.factory.cta_about')} <Icon name="arrow" size={14} />
						</a>
						<a href="#tour" class="btn btn-outline-white">
							<Icon name="play" size={14} /> {t($i18n, 'home.factory.cta_tour')}
						</a>
					</div>
				</div>
				<div style="position: relative; aspect-ratio: 4/5; border-radius: 8px; overflow: hidden;">
					<div
						style={`position: absolute; inset: 0; background-image: url(${IMG.factory}); background-size: cover; background-position: center;`}
					></div>
					<button
						style="position: absolute; inset: 0; margin: auto; width: 80px; height: 80px; border-radius: 999px; background: var(--tw-red); border: none; color: white; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 12px 32px rgba(227,6,19,0.6);"
						aria-label={t($i18n, 'home.factory.aria_play')}
					>
						<Icon name="play" size={28} />
					</button>
				</div>
			</div>
		</div>
	</section>

	<!-- FEATURED PRODUCTS -->
	<section class="section section-bone">
		<div class="container">
			<div class="section-head section-head-row">
				<div>
					<span class="red-bar" style="margin-bottom: 16px;"></span>
					<span class="eyebrow">{t($i18n, 'home.featured.eyebrow')}</span>
					<h2 style="margin-top: 8px;">{t($i18n, 'home.featured.heading')}</h2>
				</div>
				<a href="/products" class="btn btn-outline">
					{t($i18n, 'home.featured.cta_count', { count: products.length })} <Icon name="arrow" size={14} />
				</a>
			</div>
			<div class="grid grid-4">
				{#each products.slice(0, 8) as p (p.id)}
					<ProductCard {p} />
				{/each}
			</div>
		</div>
	</section>

	<!-- PROJECTS PREVIEW -->
	<section class="section">
		<div class="container">
			<div class="section-head section-head-row">
				<div>
					<span class="red-bar" style="margin-bottom: 16px;"></span>
					<span class="eyebrow">{t($i18n, 'home.projects.eyebrow')}</span>
					<h2 style="margin-top: 8px;">{t($i18n, 'home.projects.heading')}</h2>
					<p class="sub" style="margin-top: 12px;">
						{t($i18n, 'home.projects.sub')}
					</p>
				</div>
				<a href="/projects" class="btn btn-outline">
					{t($i18n, 'home.projects.cta_all')} <Icon name="arrow" size={14} />
				</a>
			</div>
			<div class="home-project-grid">
				{#each projects.slice(0, 3) as pj, i (pj.id)}
					<a
						class="project-card"
						href={`/project/${pj.id}`}
						style={i === 0 ? 'grid-row: span 2;' : ''}
					>
						<div
							class="media"
							style={`background-image: url(${pj.img}); aspect-ratio: ${i === 0 ? '4/5' : '4/3'};`}
						></div>
						<div class="body">
							<span class="cat">{$i18n.locale === 'en' && projectCategories.find((c) => c.id === pj.cat)?.en ? projectCategories.find((c) => c.id === pj.cat)?.en : projectCategories.find((c) => c.id === pj.cat)?.vi}</span>
							<h4>{$i18n.locale === 'en' && pj.en ? pj.en : pj.vi}</h4>
							<div class="meta">
								<span>
									<Icon name="map" size={12} style="vertical-align: middle;" />
									{pj.loc}
								</span>
								<span>·</span>
								<span>{pj.area}</span>
								<span>·</span>
								<span>{pj.year}</span>
							</div>
						</div>
					</a>
				{/each}
			</div>
		</div>
	</section>

	<!-- QUOTE BANNER -->
	<section class="cinematic" style="padding: 96px 0;">
		<div class="cinematic-bg" style={`background-image: url(${IMG.heroLobby});`}></div>
		<div class="container" style="position: relative; text-align: center; max-width: 760px;">
			<span class="eyebrow" style="color: var(--tw-red);">{t($i18n, 'home.quote.eyebrow')}</span>
			<h2 style="margin-top: 12px; font-size: clamp(36px, 5vw, 64px); color: white;">
				{t($i18n, 'home.quote.heading_l1')}<br />{t($i18n, 'home.quote.heading_l2')}
			</h2>
			<p class="lead" style="margin-top: 16px;">
				{t($i18n, 'home.quote.lead')}
			</p>
			<div style="display: flex; justify-content: center; gap: 12px; margin-top: 32px;">
				<a href="/quote" class="btn btn-primary">
					{t($i18n, 'home.quote.cta_send')} <Icon name="arrow" size={14} />
				</a>
				<a href="tel:0915000000" class="btn btn-outline-white">
					<Icon name="phone" size={14} /> 0915 000 000
				</a>
			</div>
		</div>
	</section>

	<!-- BLOG PREVIEW -->
	<section class="section">
		<div class="container">
			<div class="section-head section-head-row">
				<div>
					<span class="red-bar" style="margin-bottom: 16px;"></span>
					<span class="eyebrow">{t($i18n, 'home.blog.eyebrow')}</span>
					<h2 style="margin-top: 8px;">{t($i18n, 'home.blog.heading')}</h2>
				</div>
				<a href="/news" class="btn btn-outline">
					{t($i18n, 'home.blog.cta_all')} <Icon name="arrow" size={14} />
				</a>
			</div>
			<div class="grid grid-3">
				{#each posts.slice(0, 3) as p (p.id)}
					<a href="/news" class="project-card">
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
</main>
