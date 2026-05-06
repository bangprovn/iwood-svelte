<script lang="ts">
	import type { CategoryListSettings, CategoryListContent } from '$lib/page-blocks/types';

	type Category = {
		id: string;
		nameVi: string;
		nameEn: string;
		blurb: string;
		priceFrom: number;
		imageUrl: string;
	};

	type Props = {
		block: { id: string; type: string };
		content: Record<string, unknown>;
		settings: CategoryListSettings;
		locale: string;
		data?: Category[];
	};

	let { content, settings, data = [], locale }: Props = $props();

	const c = content as unknown as CategoryListContent;
	const categories = $derived(data ?? []);
</script>

<section class="category-list-block">
	{#if c.title}
		<h2 class="section-title">{c.title}</h2>
	{/if}
	{#if categories.length > 0}
		<div
			class="categories"
			class:grid-layout={settings.style === 'grid'}
			class:list-layout={settings.style === 'list'}
			style:gap={`${settings.gapSize ?? 24}px`}
		>
			{#each categories as cat (cat.id)}
				<a href={`/products?cat=${cat.id}`} class="category-item">
					{#if settings.showImages}
						<img src={cat.imageUrl} alt={locale === 'en' ? cat.nameEn : cat.nameVi} class="cat-image" loading="lazy" />
					{/if}
					<div class="cat-info">
						<h3 class="cat-name">{locale === 'en' ? cat.nameEn : cat.nameVi}</h3>
						{#if settings.showDescription}
							<p class="cat-desc">{cat.blurb}</p>
						{/if}
						{#if settings.style === 'grid'}
							<span class="cat-price">Từ {new Intl.NumberFormat('vi-VN').format(cat.priceFrom)}đ</span>
						{/if}
					</div>
				</a>
			{/each}
		</div>
	{:else}
		<p class="empty">No categories found.</p>
	{/if}
</section>

<style>
	.category-list-block {
		padding: 3rem 0;
	}

	.section-title {
		font-family: var(--font-display);
		font-size: var(--fs-2xl);
		font-weight: 800;
		color: var(--ink);
		margin: 0 0 2rem;
		text-align: center;
	}

	.grid-layout {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
	}

	.list-layout {
		display: flex;
		flex-direction: column;
	}

	.category-item {
		display: flex;
		gap: 1rem;
		text-decoration: none;
		color: inherit;
		background: var(--paper);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		overflow: hidden;
		transition: box-shadow var(--dur-base) var(--ease-out);
	}

	.grid-layout .category-item {
		flex-direction: column;
	}

	.category-item:hover {
		box-shadow: 0 4px 20px rgba(0,0,0,0.1);
	}

	.cat-image {
		width: 180px;
		height: 120px;
		object-fit: cover;
		flex-shrink: 0;
	}

	@media (max-width: 480px) {
		.list-layout .cat-image {
			width: 120px;
			height: 100px;
		}
		.list-layout .cat-info {
			padding: 0.75rem;
		}
	}

	.grid-layout .cat-image {
		width: 100%;
		height: 160px;
	}

	.cat-info {
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.cat-name {
		font-family: var(--font-display);
		font-size: var(--fs-lg);
		font-weight: 700;
		color: var(--ink);
		margin: 0;
	}

	.cat-desc {
		font-size: var(--fs-sm);
		color: var(--fg-3);
		margin: 0;
		line-height: var(--lh-normal);
	}

	.cat-price {
		font-size: var(--fs-sm);
		color: var(--iwood-red);
		font-weight: 600;
		margin-top: 0.25rem;
	}

	.empty {
		text-align: center;
		color: var(--fg-3);
		padding: 2rem;
	}
</style>
