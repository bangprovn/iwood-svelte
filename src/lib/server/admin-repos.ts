// Admin-only write surface. The public read surface lives in `repos.ts`.
// Every function here assumes the caller has already passed `requireAdmin`.

import { and, asc, count, desc, eq, like, or } from 'drizzle-orm';
import { db } from './db';
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
	showroom,
	user
} from './db/schema';

// ---------------------------------------------------------------------------
// id helpers
// ---------------------------------------------------------------------------

export function slugify(s: string): string {
	return s
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.replace(/đ/gi, 'd')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 80);
}

async function uniqueSlug(
	base: string,
	exists: (candidate: string) => Promise<boolean>
): Promise<string> {
	const root = slugify(base) || 'item';
	let candidate = root;
	let i = 2;
	while (await exists(candidate)) {
		candidate = `${root}-${i++}`;
		if (i > 500) throw new Error('Could not allocate unique slug');
	}
	return candidate;
}

// ===========================================================================
// CATEGORIES
// ===========================================================================

export type CategoryWriteInput = {
	id?: string;
	nameVi: string;
	nameEn: string;
	blurb: string;
	priceFrom: number;
	imageUrl: string;
	displayCount?: number;
	sortOrder?: number;
};

export async function listCategoriesAdmin() {
	return db.select().from(category).orderBy(asc(category.sortOrder));
}

export async function createCategory(input: CategoryWriteInput) {
	const id =
		input.id?.trim() ||
		(await uniqueSlug(input.nameEn || input.nameVi, async (c) => {
			const [r] = await db.select({ id: category.id }).from(category).where(eq(category.id, c));
			return !!r;
		}));
	await db.insert(category).values({
		id,
		nameVi: input.nameVi,
		nameEn: input.nameEn,
		blurb: input.blurb,
		priceFrom: input.priceFrom,
		imageUrl: input.imageUrl,
		displayCount: input.displayCount ?? 0,
		sortOrder: input.sortOrder ?? 0
	});
	return { id };
}

export async function updateCategory(id: string, input: CategoryWriteInput) {
	await db
		.update(category)
		.set({
			nameVi: input.nameVi,
			nameEn: input.nameEn,
			blurb: input.blurb,
			priceFrom: input.priceFrom,
			imageUrl: input.imageUrl,
			displayCount: input.displayCount ?? 0,
			sortOrder: input.sortOrder ?? 0
		})
		.where(eq(category.id, id));
}

export async function deleteCategory(id: string) {
	// FK from product → category. Block delete when in use, surface to caller.
	const [{ n }] = await db
		.select({ n: count() })
		.from(product)
		.where(eq(product.categoryId, id));
	if (n > 0) throw new Error(`Category in use by ${n} product(s)`);
	await db.delete(category).where(eq(category.id, id));
}

// ===========================================================================
// PRODUCTS (+ specs)
// ===========================================================================

export type ProductWriteInput = {
	id?: string;
	code: string;
	nameVi: string;
	nameEn: string;
	categoryId: string;
	price: number;
	imageUrl: string;
	tag?: string | null;
	descVi: string;
	descEn?: string | null;
	specs: string[]; // ordered list of labels
};

export type ProductRow = typeof product.$inferSelect & { specs: string[] };

export async function listProductsAdmin(opts: { search?: string; categoryId?: string } = {}) {
	const conds = [];
	if (opts.categoryId && opts.categoryId !== 'all') {
		conds.push(eq(product.categoryId, opts.categoryId));
	}
	if (opts.search?.trim()) {
		const q = `%${opts.search.trim()}%`;
		conds.push(or(like(product.nameVi, q), like(product.nameEn, q), like(product.code, q))!);
	}
	return db
		.select()
		.from(product)
		.where(conds.length ? and(...conds) : undefined)
		.orderBy(desc(product.createdAt));
}

export async function getProductAdmin(id: string): Promise<ProductRow | null> {
	const [r] = await db.select().from(product).where(eq(product.id, id));
	if (!r) return null;
	const specs = await db
		.select({ label: productSpec.label })
		.from(productSpec)
		.where(eq(productSpec.productId, id))
		.orderBy(asc(productSpec.sortOrder));
	return { ...r, specs: specs.map((s) => s.label) };
}

async function replaceSpecs(productId: string, specs: string[]) {
	await db.delete(productSpec).where(eq(productSpec.productId, productId));
	const cleaned = specs.map((s) => s.trim()).filter(Boolean);
	if (cleaned.length === 0) return;
	await db.insert(productSpec).values(
		cleaned.map((label, i) => ({ productId, label, sortOrder: i }))
	);
}

export async function createProduct(input: ProductWriteInput) {
	const id =
		input.id?.trim() ||
		(await uniqueSlug(input.code || input.nameEn || input.nameVi, async (c) => {
			const [r] = await db.select({ id: product.id }).from(product).where(eq(product.id, c));
			return !!r;
		}));
	await db.insert(product).values({
		id,
		code: input.code,
		nameVi: input.nameVi,
		nameEn: input.nameEn,
		categoryId: input.categoryId,
		price: input.price,
		imageUrl: input.imageUrl,
		tag: input.tag?.trim() || null,
		descVi: input.descVi,
		descEn: input.descEn?.trim() || null
	});
	await replaceSpecs(id, input.specs);
	return { id };
}

export async function updateProduct(id: string, input: ProductWriteInput) {
	await db
		.update(product)
		.set({
			code: input.code,
			nameVi: input.nameVi,
			nameEn: input.nameEn,
			categoryId: input.categoryId,
			price: input.price,
			imageUrl: input.imageUrl,
			tag: input.tag?.trim() || null,
			descVi: input.descVi,
			descEn: input.descEn?.trim() || null
		})
		.where(eq(product.id, id));
	await replaceSpecs(id, input.specs);
}

export async function deleteProduct(id: string) {
	// FK from quoteItem → product would block deletion. Check + surface.
	const [{ n }] = await db
		.select({ n: count() })
		.from(quoteItem)
		.where(eq(quoteItem.productId, id));
	if (n > 0) throw new Error(`Product appears in ${n} quote line item(s); delete those first`);
	// project_product cascades; product_spec cascades.
	await db.delete(product).where(eq(product.id, id));
}

// ===========================================================================
// PROJECT CATEGORIES
// ===========================================================================

export type ProjectCategoryWriteInput = {
	id?: string;
	nameVi: string;
	nameEn: string;
	sortOrder?: number;
};

export async function listProjectCategoriesAdmin() {
	return db.select().from(projectCategory).orderBy(asc(projectCategory.sortOrder));
}

export async function createProjectCategory(input: ProjectCategoryWriteInput) {
	const id =
		input.id?.trim() ||
		(await uniqueSlug(input.nameEn || input.nameVi, async (c) => {
			const [r] = await db
				.select({ id: projectCategory.id })
				.from(projectCategory)
				.where(eq(projectCategory.id, c));
			return !!r;
		}));
	await db.insert(projectCategory).values({
		id,
		nameVi: input.nameVi,
		nameEn: input.nameEn,
		sortOrder: input.sortOrder ?? 0
	});
	return { id };
}

export async function updateProjectCategory(id: string, input: ProjectCategoryWriteInput) {
	await db
		.update(projectCategory)
		.set({
			nameVi: input.nameVi,
			nameEn: input.nameEn,
			sortOrder: input.sortOrder ?? 0
		})
		.where(eq(projectCategory.id, id));
}

export async function deleteProjectCategory(id: string) {
	const [{ n }] = await db
		.select({ n: count() })
		.from(project)
		.where(eq(project.categoryId, id));
	if (n > 0) throw new Error(`Category in use by ${n} project(s)`);
	await db.delete(projectCategory).where(eq(projectCategory.id, id));
}

// ===========================================================================
// PROJECTS (+ product links)
// ===========================================================================

export type ProjectWriteInput = {
	id?: string;
	nameVi: string;
	nameEn: string;
	categoryId: string;
	year: number;
	area: string;
	location: string;
	imageUrl: string;
	summaryVi: string;
	summaryEn?: string | null;
	productIds: string[];
};

export type ProjectRow = typeof project.$inferSelect & { productIds: string[] };

export async function listProjectsAdmin() {
	return db.select().from(project).orderBy(desc(project.year), desc(project.createdAt));
}

export async function getProjectAdmin(id: string): Promise<ProjectRow | null> {
	const [r] = await db.select().from(project).where(eq(project.id, id));
	if (!r) return null;
	const links = await db
		.select({ productId: projectProduct.productId })
		.from(projectProduct)
		.where(eq(projectProduct.projectId, id));
	return { ...r, productIds: links.map((l) => l.productId) };
}

async function replaceProjectProducts(projectId: string, productIds: string[]) {
	await db.delete(projectProduct).where(eq(projectProduct.projectId, projectId));
	const ids = Array.from(new Set(productIds.filter(Boolean)));
	if (ids.length === 0) return;
	await db.insert(projectProduct).values(ids.map((productId) => ({ projectId, productId })));
}

export async function createProject(input: ProjectWriteInput) {
	const id =
		input.id?.trim() ||
		(await uniqueSlug(input.nameEn || input.nameVi, async (c) => {
			const [r] = await db.select({ id: project.id }).from(project).where(eq(project.id, c));
			return !!r;
		}));
	await db.insert(project).values({
		id,
		nameVi: input.nameVi,
		nameEn: input.nameEn,
		categoryId: input.categoryId,
		year: input.year,
		area: input.area,
		location: input.location,
		imageUrl: input.imageUrl,
		summaryVi: input.summaryVi,
		summaryEn: input.summaryEn?.trim() || null
	});
	await replaceProjectProducts(id, input.productIds);
	return { id };
}

export async function updateProject(id: string, input: ProjectWriteInput) {
	await db
		.update(project)
		.set({
			nameVi: input.nameVi,
			nameEn: input.nameEn,
			categoryId: input.categoryId,
			year: input.year,
			area: input.area,
			location: input.location,
			imageUrl: input.imageUrl,
			summaryVi: input.summaryVi,
			summaryEn: input.summaryEn?.trim() || null
		})
		.where(eq(project.id, id));
	await replaceProjectProducts(id, input.productIds);
}

export async function deleteProject(id: string) {
	await db.delete(project).where(eq(project.id, id));
}

// ===========================================================================
// POSTS
// ===========================================================================

export type PostWriteInput = {
	id?: string;
	slug?: string;
	titleVi: string;
	titleEn: string;
	category: string;
	publishedAt: string; // YYYY-MM-DD
	imageUrl: string;
	excerptVi: string;
	excerptEn?: string | null;
	contentVi?: string | null;
	contentEn?: string | null;
};

export async function listPostsAdmin() {
	return db.select().from(post).orderBy(desc(post.publishedAt));
}

export async function getPostAdmin(id: string) {
	const [r] = await db.select().from(post).where(eq(post.id, id));
	return r ?? null;
}

export async function createPost(input: PostWriteInput) {
	const baseSlug = input.slug?.trim() || input.titleEn || input.titleVi;
	const slug = await uniqueSlug(baseSlug, async (c) => {
		const [r] = await db.select({ slug: post.slug }).from(post).where(eq(post.slug, c));
		return !!r;
	});
	const id = input.id?.trim() || slug;
	await db.insert(post).values({
		id,
		slug,
		titleVi: input.titleVi,
		titleEn: input.titleEn,
		category: input.category,
		publishedAt: input.publishedAt,
		imageUrl: input.imageUrl,
		excerptVi: input.excerptVi,
		excerptEn: input.excerptEn?.trim() || null,
		contentVi: input.contentVi?.trim() || null,
		contentEn: input.contentEn?.trim() || null
	});
	return { id, slug };
}

export async function updatePost(id: string, input: PostWriteInput) {
	const updates: Partial<typeof post.$inferInsert> = {
		titleVi: input.titleVi,
		titleEn: input.titleEn,
		category: input.category,
		publishedAt: input.publishedAt,
		imageUrl: input.imageUrl,
		excerptVi: input.excerptVi,
		excerptEn: input.excerptEn?.trim() || null,
		contentVi: input.contentVi?.trim() || null,
		contentEn: input.contentEn?.trim() || null
	};
	if (input.slug?.trim()) updates.slug = input.slug.trim();
	await db.update(post).set(updates).where(eq(post.id, id));
}

export async function deletePost(id: string) {
	await db.delete(post).where(eq(post.id, id));
}

// ===========================================================================
// SHOWROOMS
// ===========================================================================

export type ShowroomWriteInput = {
	id?: string;
	city: string;
	address: string;
	phone: string;
	hours: string;
	imageUrl: string;
	mapUrl?: string | null;
	sortOrder?: number;
};

export async function listShowroomsAdmin() {
	return db.select().from(showroom).orderBy(asc(showroom.sortOrder));
}

export async function getShowroomAdmin(id: string) {
	const [r] = await db.select().from(showroom).where(eq(showroom.id, id));
	return r ?? null;
}

export async function createShowroom(input: ShowroomWriteInput) {
	const id =
		input.id?.trim() ||
		(await uniqueSlug(input.city, async (c) => {
			const [r] = await db.select({ id: showroom.id }).from(showroom).where(eq(showroom.id, c));
			return !!r;
		}));
	await db.insert(showroom).values({
		id,
		city: input.city,
		address: input.address,
		phone: input.phone,
		hours: input.hours,
		imageUrl: input.imageUrl,
		mapUrl: input.mapUrl?.trim() || null,
		sortOrder: input.sortOrder ?? 0
	});
	return { id };
}

export async function updateShowroom(id: string, input: ShowroomWriteInput) {
	await db
		.update(showroom)
		.set({
			city: input.city,
			address: input.address,
			phone: input.phone,
			hours: input.hours,
			imageUrl: input.imageUrl,
			mapUrl: input.mapUrl?.trim() || null,
			sortOrder: input.sortOrder ?? 0
		})
		.where(eq(showroom.id, id));
}

export async function deleteShowroom(id: string) {
	await db.delete(showroom).where(eq(showroom.id, id));
}

// ===========================================================================
// QUOTES (lead capture — read + status + delete)
// ===========================================================================

export const QUOTE_STATUSES = ['new', 'contacted', 'won', 'lost'] as const;
export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

export async function listQuotesAdmin() {
	const quotes = await db.select().from(quote).orderBy(desc(quote.createdAt));
	if (quotes.length === 0) return [];

	const items = await db
		.select({
			id: quoteItem.id,
			quoteId: quoteItem.quoteId,
			productId: quoteItem.productId,
			qty: quoteItem.qty,
			unitPriceSnapshot: quoteItem.unitPriceSnapshot,
			productCode: product.code,
			productNameVi: product.nameVi
		})
		.from(quoteItem)
		.leftJoin(product, eq(product.id, quoteItem.productId));

	const byQuote = new Map<string, typeof items>();
	for (const it of items) {
		const list = byQuote.get(it.quoteId) ?? [];
		list.push(it);
		byQuote.set(it.quoteId, list);
	}
	return quotes.map((q) => ({ ...q, items: byQuote.get(q.id) ?? [] }));
}

export async function updateQuoteStatus(id: string, status: QuoteStatus) {
	await db.update(quote).set({ status }).where(eq(quote.id, id));
}

export async function deleteQuote(id: string) {
	await db.delete(quote).where(eq(quote.id, id));
}

// ===========================================================================
// CONTACT MESSAGES
// ===========================================================================

export const CONTACT_STATUSES = ['new', 'replied', 'archived'] as const;
export type ContactStatus = (typeof CONTACT_STATUSES)[number];

export async function listContactsAdmin() {
	return db.select().from(contactMessage).orderBy(desc(contactMessage.createdAt));
}

export async function updateContactStatus(id: string, status: ContactStatus) {
	await db.update(contactMessage).set({ status }).where(eq(contactMessage.id, id));
}

export async function deleteContact(id: string) {
	await db.delete(contactMessage).where(eq(contactMessage.id, id));
}

// ===========================================================================
// NEWSLETTER
// ===========================================================================

export async function listNewsletterAdmin() {
	return db
		.select()
		.from(newsletterSubscription)
		.orderBy(desc(newsletterSubscription.createdAt));
}

export async function deleteNewsletter(id: number) {
	await db.delete(newsletterSubscription).where(eq(newsletterSubscription.id, id));
}

// ===========================================================================
// USERS
// ===========================================================================

export async function listUsersAdmin() {
	return db
		.select({
			id: user.id,
			name: user.name,
			email: user.email,
			role: user.role,
			emailVerified: user.emailVerified,
			createdAt: user.createdAt
		})
		.from(user)
		.orderBy(desc(user.createdAt));
}

export async function setUserRole(id: string, role: 'user' | 'admin') {
	await db.update(user).set({ role }).where(eq(user.id, id));
}

// ===========================================================================
// DASHBOARD COUNTS
// ===========================================================================

export async function dashboardCounts() {
	const [[c1], [c2], [c3], [c4], [c5], [c6], [c7], [c8], [c9]] = await Promise.all([
		db.select({ n: count() }).from(category),
		db.select({ n: count() }).from(product),
		db.select({ n: count() }).from(projectCategory),
		db.select({ n: count() }).from(project),
		db.select({ n: count() }).from(post),
		db.select({ n: count() }).from(showroom),
		db.select({ n: count() }).from(quote),
		db.select({ n: count() }).from(contactMessage),
		db.select({ n: count() }).from(newsletterSubscription)
	]);
	return {
		categories: c1.n,
		products: c2.n,
		projectCategories: c3.n,
		projects: c4.n,
		posts: c5.n,
		showrooms: c6.n,
		quotes: c7.n,
		contacts: c8.n,
		newsletter: c9.n
	};
}
