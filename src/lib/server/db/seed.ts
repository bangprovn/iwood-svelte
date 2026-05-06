import { IMG } from '$lib/data/iwood';
import {
	categories,
	products,
	projects,
	projectCategories,
	posts
} from '$lib/server/db/fixtures';
import { db } from './index';
import * as s from './schema';

/**
 * Dev-only: wipes every app-owned table and re-seeds catalog + editorial data
 * from the static fixtures in `$lib/server/seed-fixtures`. Lead-capture rows
 * (quotes, contacts, newsletter) are also wiped so FK references to products
 * don't block re-seeding.
 */
export async function seed(): Promise<{
	categories: number;
	products: number;
	specs: number;
	projectCategories: number;
	projects: number;
	projectProducts: number;
	posts: number;
	showrooms: number;
}> {
	// Wipe in dependency order — leads first because they FK into product
	await db.delete(s.quoteItem);
	await db.delete(s.quote);
	await db.delete(s.contactMessage);
	await db.delete(s.newsletterSubscription);
	await db.delete(s.projectProduct);
	await db.delete(s.productSpec);
	await db.delete(s.project);
	await db.delete(s.projectCategory);
	await db.delete(s.product);
	await db.delete(s.category);
	await db.delete(s.post);
	await db.delete(s.showroom);

	// Categories
	await db.insert(s.category).values(
		categories.map((c, i) => ({
			id: c.id,
			nameVi: c.vi,
			nameEn: c.en,
			blurb: c.blurb,
			priceFrom: c.priceFrom,
			imageUrl: c.img,
			displayCount: c.count,
			sortOrder: i
		}))
	);

	// Products
	await db.insert(s.product).values(
		products.map((p) => ({
			id: p.id,
			code: p.code,
			nameVi: p.vi,
			nameEn: p.en,
			categoryId: p.cat,
			price: p.price,
			imageUrl: p.img,
			tag: p.tag ?? null,
			descVi: p.desc
		}))
	);

	// Specs
	const specRows = products.flatMap((p) =>
		p.specs.map((label, i) => ({
			productId: p.id,
			label,
			sortOrder: i
		}))
	);
	if (specRows.length) await db.insert(s.productSpec).values(specRows);

	// Project categories — drop the synthetic 'all'
	const realProjectCats = projectCategories.filter((c) => c.id !== 'all');
	await db.insert(s.projectCategory).values(
		realProjectCats.map((c, i) => ({
			id: c.id,
			nameVi: c.vi,
			nameEn: c.en,
			sortOrder: i
		}))
	);

	// Projects
	await db.insert(s.project).values(
		projects.map((p) => ({
			id: p.id,
			nameVi: p.vi,
			nameEn: p.en,
			categoryId: p.cat,
			year: p.year,
			area: p.area,
			location: p.loc,
			imageUrl: p.img,
			summaryVi: p.summary
		}))
	);

	// project ↔ product (resolve product code → product id)
	const codeToId = new Map(products.map((p) => [p.code, p.id]));
	const linkRows = projects.flatMap((pj) =>
		pj.products
			.map((code) => codeToId.get(code))
			.filter((v): v is string => Boolean(v))
			.map((productId) => ({ projectId: pj.id, productId }))
	);
	if (linkRows.length) await db.insert(s.projectProduct).values(linkRows);

	// Posts — convert "12.04.2026" -> "2026-04-12" for sortable storage
	await db.insert(s.post).values(
		posts.map((p) => {
			const [d, m, y] = p.date.split('.');
			return {
				id: p.id,
				slug: p.id,
				titleVi: p.vi,
				titleEn: p.en,
				category: p.cat,
				publishedAt: `${y}-${m}-${d}`,
				imageUrl: p.img,
				excerptVi: p.excerpt
			};
		})
	);

	// Showrooms (taken from /contact static data)
	await db.insert(s.showroom).values([
		{
			id: 'hcm',
			city: 'TP.HCM',
			address: '123 Nguyễn Văn Linh, Quận 7',
			phone: '0915 000 000',
			hours: '8:00 — 17:30 (T2-T7)',
			imageUrl: IMG.heroLobby,
			sortOrder: 0
		},
		{
			id: 'hn',
			city: 'Hà Nội',
			address: '456 Trường Chinh, Đống Đa',
			phone: '0916 000 000',
			hours: '8:00 — 17:30 (T2-T7)',
			imageUrl: IMG.heroHotel,
			sortOrder: 1
		},
		{
			id: 'dn',
			city: 'Đà Nẵng',
			address: '789 Nguyễn Văn Linh, Hải Châu',
			phone: '0917 000 000',
			hours: '8:00 — 17:30 (T2-T7)',
			imageUrl: IMG.heroCafe,
			sortOrder: 2
		}
	]);

	return {
		categories: categories.length,
		products: products.length,
		specs: specRows.length,
		projectCategories: realProjectCats.length,
		projects: projects.length,
		projectProducts: linkRows.length,
		posts: posts.length,
		showrooms: 3
	};
}
