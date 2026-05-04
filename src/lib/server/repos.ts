import { and, asc, desc, eq, inArray, ne, sql } from 'drizzle-orm';
import { db } from './db';
import { htmlToPlainText } from './sanitize-html';
import {
	category,
	contactMessage,
	newsletterSubscription,
	post,
	product,
	productSpec,
	project,
	projectCategory,
	projectProduct,
	quote,
	quoteItem,
	showroom
} from './db/schema';

export type {
	CategoryDTO,
	ProductDTO,
	ProjectCategoryDTO,
	ProjectDTO,
	PostDTO,
	ShowroomDTO
} from '$lib/types';
import type {
	CategoryDTO,
	ProductDTO,
	ProjectCategoryDTO,
	ProjectDTO,
	PostDTO,
	ShowroomDTO
} from '$lib/types';

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export async function listCategories(): Promise<CategoryDTO[]> {
	const rows = await db.select().from(category).orderBy(asc(category.sortOrder));
	return rows.map((r) => ({
		id: r.id,
		vi: r.nameVi,
		en: r.nameEn,
		blurb: r.blurb,
		priceFrom: r.priceFrom,
		img: r.imageUrl,
		count: r.displayCount
	}));
}

export async function getCategory(id: string): Promise<CategoryDTO | null> {
	const [r] = await db.select().from(category).where(eq(category.id, id));
	if (!r) return null;
	return {
		id: r.id,
		vi: r.nameVi,
		en: r.nameEn,
		blurb: r.blurb,
		priceFrom: r.priceFrom,
		img: r.imageUrl,
		count: r.displayCount
	};
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

async function attachSpecs(rows: { id: string }[]): Promise<Map<string, string[]>> {
	if (rows.length === 0) return new Map();
	const specs = await db
		.select({
			productId: productSpec.productId,
			label: productSpec.label,
			sortOrder: productSpec.sortOrder
		})
		.from(productSpec)
		.where(inArray(productSpec.productId, rows.map((r) => r.id)))
		.orderBy(asc(productSpec.productId), asc(productSpec.sortOrder));

	const byProduct = new Map<string, string[]>();
	for (const s of specs) {
		const list = byProduct.get(s.productId) ?? [];
		list.push(s.label);
		byProduct.set(s.productId, list);
	}
	return byProduct;
}

function toProductDTO(r: typeof product.$inferSelect, specs: string[]): ProductDTO {
	return {
		id: r.id,
		code: r.code,
		vi: r.nameVi,
		en: r.nameEn,
		cat: r.categoryId,
		price: r.price,
		img: r.imageUrl,
		tag: r.tag ?? undefined,
		desc: r.descVi,
		descEn: r.descEn ?? undefined,
		descText: htmlToPlainText(r.descVi),
		specs
	};
}

export type ListProductsOpts = {
	categoryId?: string;
	priceBand?: 'low' | 'mid' | 'high';
	sort?: 'featured' | 'price-asc' | 'price-desc' | 'name';
	limit?: number;
};

export async function listProducts(opts: ListProductsOpts = {}): Promise<ProductDTO[]> {
	const conds = [];
	if (opts.categoryId && opts.categoryId !== 'all') {
		conds.push(eq(product.categoryId, opts.categoryId));
	}
	if (opts.priceBand === 'low') conds.push(sql`${product.price} < 200000`);
	if (opts.priceBand === 'mid')
		conds.push(sql`${product.price} >= 200000 AND ${product.price} < 280000`);
	if (opts.priceBand === 'high') conds.push(sql`${product.price} >= 280000`);

	const order =
		opts.sort === 'price-asc'
			? asc(product.price)
			: opts.sort === 'price-desc'
				? desc(product.price)
				: opts.sort === 'name'
					? asc(product.nameVi)
					: asc(product.createdAt);

	let q = db
		.select()
		.from(product)
		.where(conds.length ? and(...conds) : undefined)
		.orderBy(order);
	if (opts.limit) q = q.limit(opts.limit) as typeof q;

	const rows = await q;
	const specs = await attachSpecs(rows);
	return rows.map((r) => toProductDTO(r, specs.get(r.id) ?? []));
}

export async function getProduct(id: string): Promise<ProductDTO | null> {
	const [r] = await db.select().from(product).where(eq(product.id, id));
	if (!r) return null;
	const specs = await attachSpecs([{ id: r.id }]);
	return toProductDTO(r, specs.get(r.id) ?? []);
}

export async function getProductByCode(code: string): Promise<ProductDTO | null> {
	const [r] = await db.select().from(product).where(eq(product.code, code));
	if (!r) return null;
	const specs = await attachSpecs([{ id: r.id }]);
	return toProductDTO(r, specs.get(r.id) ?? []);
}

export async function listRelatedProducts(
	productId: string,
	categoryId: string,
	limit = 4
): Promise<ProductDTO[]> {
	const rows = await db
		.select()
		.from(product)
		.where(and(eq(product.categoryId, categoryId), ne(product.id, productId)))
		.limit(limit);
	const specs = await attachSpecs(rows);
	return rows.map((r) => toProductDTO(r, specs.get(r.id) ?? []));
}

// ---------------------------------------------------------------------------
// Project categories
// ---------------------------------------------------------------------------

export async function listProjectCategories(): Promise<ProjectCategoryDTO[]> {
	const [cats, counts] = await Promise.all([
		db.select().from(projectCategory).orderBy(asc(projectCategory.sortOrder)),
		db
			.select({
				categoryId: project.categoryId,
				count: sql<number>`count(*)`
			})
			.from(project)
			.groupBy(project.categoryId)
	]);

	const byCat = new Map(counts.map((c) => [c.categoryId, Number(c.count)]));
	const total = Array.from(byCat.values()).reduce((s, n) => s + n, 0);

	return [
		{ id: 'all', vi: 'Tất cả', en: 'All', count: total },
		...cats.map((c) => ({
			id: c.id,
			vi: c.nameVi,
			en: c.nameEn,
			count: byCat.get(c.id) ?? 0
		}))
	];
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

async function attachProjectProducts(
	rows: { id: string }[]
): Promise<Map<string, string[]>> {
	if (rows.length === 0) return new Map();
	const links = await db
		.select({
			projectId: projectProduct.projectId,
			code: product.code
		})
		.from(projectProduct)
		.innerJoin(product, eq(product.id, projectProduct.productId))
		.where(inArray(projectProduct.projectId, rows.map((r) => r.id)));

	const byProject = new Map<string, string[]>();
	for (const l of links) {
		const list = byProject.get(l.projectId) ?? [];
		list.push(l.code);
		byProject.set(l.projectId, list);
	}
	return byProject;
}

function toProjectDTO(r: typeof project.$inferSelect, products: string[]): ProjectDTO {
	return {
		id: r.id,
		vi: r.nameVi,
		en: r.nameEn,
		cat: r.categoryId,
		year: r.year,
		area: r.area,
		loc: r.location,
		img: r.imageUrl,
		summary: r.summaryVi,
		summaryEn: r.summaryEn ?? undefined,
		summaryText: htmlToPlainText(r.summaryVi),
		products
	};
}

export async function listProjects(opts: {
	categoryId?: string;
	limit?: number;
} = {}): Promise<ProjectDTO[]> {
	const where =
		opts.categoryId && opts.categoryId !== 'all'
			? eq(project.categoryId, opts.categoryId)
			: undefined;

	let q = db.select().from(project).where(where).orderBy(desc(project.year));
	if (opts.limit) q = q.limit(opts.limit) as typeof q;
	const rows = await q;
	const links = await attachProjectProducts(rows);
	return rows.map((r) => toProjectDTO(r, links.get(r.id) ?? []));
}

export async function getProject(id: string): Promise<ProjectDTO | null> {
	const [r] = await db.select().from(project).where(eq(project.id, id));
	if (!r) return null;
	const links = await attachProjectProducts([{ id: r.id }]);
	return toProjectDTO(r, links.get(r.id) ?? []);
}

export async function listMoreProjects(
	excludeId: string,
	categoryId: string,
	limit = 3
): Promise<ProjectDTO[]> {
	const rows = await db
		.select()
		.from(project)
		.where(and(eq(project.categoryId, categoryId), ne(project.id, excludeId)))
		.limit(limit);
	const links = await attachProjectProducts(rows);
	return rows.map((r) => toProjectDTO(r, links.get(r.id) ?? []));
}

// ---------------------------------------------------------------------------
// Posts
// ---------------------------------------------------------------------------

function toPostDTO(r: typeof post.$inferSelect): PostDTO {
	const [y, m, d] = r.publishedAt.split('-');
	return {
		id: r.id,
		slug: r.slug,
		vi: r.titleVi,
		en: r.titleEn,
		cat: r.category,
		date: `${d}.${m}.${y}`,
		img: r.imageUrl,
		excerpt: r.excerptVi,
		content: r.contentVi ?? undefined,
		contentEn: r.contentEn ?? undefined
	};
}

export async function listPosts(opts: { category?: string; limit?: number } = {}): Promise<
	PostDTO[]
> {
	const where = opts.category && opts.category !== 'all' ? eq(post.category, opts.category) : undefined;
	let q = db.select().from(post).where(where).orderBy(desc(post.publishedAt));
	if (opts.limit) q = q.limit(opts.limit) as typeof q;
	const rows = await q;
	return rows.map(toPostDTO);
}

export async function getPost(slug: string): Promise<PostDTO | null> {
	const [r] = await db.select().from(post).where(eq(post.slug, slug));
	return r ? toPostDTO(r) : null;
}

export async function listMorePosts(
	excludeSlug: string,
	category: string,
	limit = 3
): Promise<PostDTO[]> {
	const rows = await db
		.select()
		.from(post)
		.where(and(eq(post.category, category), ne(post.slug, excludeSlug)))
		.orderBy(desc(post.publishedAt))
		.limit(limit);
	return rows.map(toPostDTO);
}

// ---------------------------------------------------------------------------
// Showrooms
// ---------------------------------------------------------------------------

export async function listShowrooms(): Promise<ShowroomDTO[]> {
	const rows = await db.select().from(showroom).orderBy(asc(showroom.sortOrder));
	return rows.map((r) => ({
		id: r.id,
		city: r.city,
		addr: r.address,
		phone: r.phone,
		hours: r.hours,
		img: r.imageUrl,
		mapUrl: r.mapUrl
	}));
}

// ---------------------------------------------------------------------------
// Quotes (lead capture)
// ---------------------------------------------------------------------------

export type QuoteInput = {
	name: string;
	phone: string;
	email?: string | null;
	city?: string | null;
	projectType: string;
	area: number;
	startWindow?: string | null;
	notes?: string | null;
	items?: Array<{ productId: string; qty: number }>;
};

export async function createQuote(input: QuoteInput): Promise<{ id: string }> {
	const id = crypto.randomUUID();

	await db.insert(quote).values({
		id,
		name: input.name,
		phone: input.phone,
		email: input.email ?? null,
		city: input.city ?? null,
		projectType: input.projectType,
		area: input.area,
		startWindow: input.startWindow ?? null,
		notes: input.notes ?? null
	});

	if (input.items && input.items.length) {
		const ids = input.items.map((i) => i.productId);
		const prods = await db
			.select({ id: product.id, price: product.price })
			.from(product)
			.where(inArray(product.id, ids));
		const priceById = new Map(prods.map((p) => [p.id, p.price]));

		const rows = input.items
			.filter((it) => priceById.has(it.productId))
			.map((it) => ({
				quoteId: id,
				productId: it.productId,
				qty: it.qty,
				unitPriceSnapshot: priceById.get(it.productId)!
			}));
		if (rows.length) await db.insert(quoteItem).values(rows);
	}

	return { id };
}

export async function listQuotes(): Promise<
	Array<typeof quote.$inferSelect & { items: typeof quoteItem.$inferSelect[] }>
> {
	const quotes = await db.select().from(quote).orderBy(desc(quote.createdAt));
	if (quotes.length === 0) return [];
	const items = await db
		.select()
		.from(quoteItem)
		.where(inArray(quoteItem.quoteId, quotes.map((q) => q.id)));
	const byQuote = new Map<string, typeof quoteItem.$inferSelect[]>();
	for (const it of items) {
		const list = byQuote.get(it.quoteId) ?? [];
		list.push(it);
		byQuote.set(it.quoteId, list);
	}
	return quotes.map((q) => ({ ...q, items: byQuote.get(q.id) ?? [] }));
}

// ---------------------------------------------------------------------------
// Contact messages
// ---------------------------------------------------------------------------

export type ContactInput = {
	name: string;
	phone: string;
	email?: string | null;
	subject: string;
	message: string;
};

export async function createContact(input: ContactInput): Promise<{ id: string }> {
	const id = crypto.randomUUID();
	await db.insert(contactMessage).values({
		id,
		name: input.name,
		phone: input.phone,
		email: input.email ?? null,
		subject: input.subject,
		message: input.message
	});
	return { id };
}

// ---------------------------------------------------------------------------
// Newsletter
// ---------------------------------------------------------------------------

export async function subscribeNewsletter(email: string): Promise<{ created: boolean }> {
	try {
		await db.insert(newsletterSubscription).values({ email });
		return { created: true };
	} catch {
		// unique violation = already subscribed
		return { created: false };
	}
}
