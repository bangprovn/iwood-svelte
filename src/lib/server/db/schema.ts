import { sql, relations } from 'drizzle-orm';
import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

// --- Demo / sandbox table (kept from template) -------------------------------

export const task = sqliteTable('task', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	title: text('title').notNull(),
	priority: integer('priority').notNull().default(1)
});

// --- Catalog: categories + products -----------------------------------------

export const category = sqliteTable('category', {
	id: text('id').primaryKey(),
	nameVi: text('name_vi').notNull(),
	nameEn: text('name_en').notNull(),
	blurb: text('blurb').notNull(),
	priceFrom: integer('price_from').notNull(),
	imageUrl: text('image_url').notNull(),
	displayCount: integer('display_count').notNull().default(0),
	sortOrder: integer('sort_order').notNull().default(0)
});

export const product = sqliteTable(
	'product',
	{
		id: text('id').primaryKey(),
		code: text('code').notNull().unique(),
		nameVi: text('name_vi').notNull(),
		nameEn: text('name_en').notNull(),
		categoryId: text('category_id')
			.notNull()
			.references(() => category.id),
		price: integer('price').notNull(),
		imageUrl: text('image_url').notNull(),
		tag: text('tag'),
		descVi: text('desc_vi').notNull(),
		descEn: text('desc_en'),
		createdAt: integer('created_at', { mode: 'timestamp' })
			.notNull()
			.default(sql`(unixepoch())`)
	},
	(t) => [index('product_category_idx').on(t.categoryId)]
);

export const productSpec = sqliteTable(
	'product_spec',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		productId: text('product_id')
			.notNull()
			.references(() => product.id, { onDelete: 'cascade' }),
		label: text('label').notNull(),
		sortOrder: integer('sort_order').notNull().default(0)
	},
	(t) => [index('product_spec_product_idx').on(t.productId)]
);

// --- Projects + project↔product join ----------------------------------------

export const projectCategory = sqliteTable('project_category', {
	id: text('id').primaryKey(),
	nameVi: text('name_vi').notNull(),
	nameEn: text('name_en').notNull(),
	sortOrder: integer('sort_order').notNull().default(0)
});

export const project = sqliteTable(
	'project',
	{
		id: text('id').primaryKey(),
		nameVi: text('name_vi').notNull(),
		nameEn: text('name_en').notNull(),
		categoryId: text('category_id')
			.notNull()
			.references(() => projectCategory.id),
		year: integer('year').notNull(),
		area: text('area').notNull(),
		location: text('location').notNull(),
		imageUrl: text('image_url').notNull(),
		summaryVi: text('summary_vi').notNull(),
		summaryEn: text('summary_en'),
		createdAt: integer('created_at', { mode: 'timestamp' })
			.notNull()
			.default(sql`(unixepoch())`)
	},
	(t) => [index('project_category_idx').on(t.categoryId)]
);

export const projectProduct = sqliteTable(
	'project_product',
	{
		projectId: text('project_id')
			.notNull()
			.references(() => project.id, { onDelete: 'cascade' }),
		productId: text('product_id')
			.notNull()
			.references(() => product.id, { onDelete: 'cascade' })
	},
	(t) => [primaryKey({ columns: [t.projectId, t.productId] })]
);

// --- Editorial: blog posts --------------------------------------------------

export const post = sqliteTable('post', {
	id: text('id').primaryKey(),
	slug: text('slug').notNull().unique(),
	titleVi: text('title_vi').notNull(),
	titleEn: text('title_en').notNull(),
	category: text('category').notNull(),
	publishedAt: text('published_at').notNull(), // ISO YYYY-MM-DD
	imageUrl: text('image_url').notNull(),
	excerptVi: text('excerpt_vi').notNull(),
	excerptEn: text('excerpt_en'),
	contentVi: text('content_vi'),
	contentEn: text('content_en')
});

// --- Showrooms --------------------------------------------------------------

export const showroom = sqliteTable('showroom', {
	id: text('id').primaryKey(),
	city: text('city').notNull(),
	address: text('address').notNull(),
	phone: text('phone').notNull(),
	hours: text('hours').notNull(),
	imageUrl: text('image_url').notNull(),
	mapUrl: text('map_url'),
	sortOrder: integer('sort_order').notNull().default(0)
});

// --- Lead capture: quotes + line items, contacts, newsletter ---------------

export const quote = sqliteTable('quote', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: text('name').notNull(),
	phone: text('phone').notNull(),
	email: text('email'),
	city: text('city'),
	projectType: text('project_type').notNull(),
	area: integer('area').notNull(),
	startWindow: text('start_window'),
	notes: text('notes'),
	status: text('status').notNull().default('new'),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.default(sql`(unixepoch())`)
});

export const quoteItem = sqliteTable(
	'quote_item',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		quoteId: text('quote_id')
			.notNull()
			.references(() => quote.id, { onDelete: 'cascade' }),
		productId: text('product_id')
			.notNull()
			.references(() => product.id),
		qty: integer('qty').notNull(),
		unitPriceSnapshot: integer('unit_price_snapshot').notNull()
	},
	(t) => [index('quote_item_quote_idx').on(t.quoteId)]
);

export const contactMessage = sqliteTable('contact_message', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: text('name').notNull(),
	phone: text('phone').notNull(),
	email: text('email'),
	subject: text('subject').notNull(),
	message: text('message').notNull(),
	status: text('status').notNull().default('new'),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.default(sql`(unixepoch())`)
});

export const newsletterSubscription = sqliteTable('newsletter_subscription', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	email: text('email').notNull().unique(),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.default(sql`(unixepoch())`)
});

// --- i18n: locales + translation keys + per-locale values --------------------

export const appLocale = sqliteTable('app_locale', {
	code: text('code').primaryKey(),
	label: text('label').notNull(),
	dir: text('dir').notNull().default('ltr'),
	isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
	isDefault: integer('is_default', { mode: 'boolean' }).notNull().default(false),
	sortOrder: integer('sort_order').notNull().default(0),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.default(sql`(unixepoch())`)
});

export const appTranslationKey = sqliteTable('app_translation_key', {
	key: text('key').primaryKey(),
	description: text('description'),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.default(sql`(unixepoch())`)
});

export const appTranslation = sqliteTable(
	'app_translation',
	{
		key: text('key')
			.notNull()
			.references(() => appTranslationKey.key, {
				onDelete: 'cascade',
				onUpdate: 'cascade'
			}),
		locale: text('locale')
			.notNull()
			.references(() => appLocale.code, { onDelete: 'cascade', onUpdate: 'cascade' }),
		value: text('value').notNull(),
		updatedAt: integer('updated_at', { mode: 'timestamp' })
			.notNull()
			.default(sql`(unixepoch())`)
	},
	(t) => [
		primaryKey({ columns: [t.key, t.locale] }),
		index('app_translation_locale_idx').on(t.locale)
	]
);

// --- Relations (drizzle relational queries) --------------------------------

export const categoryRelations = relations(category, ({ many }) => ({
	products: many(product)
}));

export const productRelations = relations(product, ({ one, many }) => ({
	category: one(category, {
		fields: [product.categoryId],
		references: [category.id]
	}),
	specs: many(productSpec),
	projectLinks: many(projectProduct)
}));

export const productSpecRelations = relations(productSpec, ({ one }) => ({
	product: one(product, {
		fields: [productSpec.productId],
		references: [product.id]
	})
}));

export const projectCategoryRelations = relations(projectCategory, ({ many }) => ({
	projects: many(project)
}));

export const projectRelations = relations(project, ({ one, many }) => ({
	category: one(projectCategory, {
		fields: [project.categoryId],
		references: [projectCategory.id]
	}),
	productLinks: many(projectProduct)
}));

export const projectProductRelations = relations(projectProduct, ({ one }) => ({
	project: one(project, {
		fields: [projectProduct.projectId],
		references: [project.id]
	}),
	product: one(product, {
		fields: [projectProduct.productId],
		references: [product.id]
	})
}));

export const quoteRelations = relations(quote, ({ many }) => ({
	items: many(quoteItem)
}));

export const quoteItemRelations = relations(quoteItem, ({ one }) => ({
	quote: one(quote, {
		fields: [quoteItem.quoteId],
		references: [quote.id]
	}),
	product: one(product, {
		fields: [quoteItem.productId],
		references: [product.id]
	})
}));

export * from './auth.schema';

// --- Page Layout Builder ------------------------------------------------

export const page = sqliteTable(
	'page',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		slug: text('slug').notNull().unique(),
		type: text('type', { enum: ['custom', 'override'] }).notNull().default('custom'),
		routePattern: text('route_pattern'),
		titleVi: text('title_vi').notNull(),
		titleEn: text('title_en').notNull(),
		metaDescVi: text('meta_desc_vi'),
		metaDescEn: text('meta_desc_en'),
		ogImage: text('og_image'),
		canonicalUrl: text('canonical_url'),
		robots: text('robots').notNull().default('index,follow'),
		publishedAt: integer('published_at', { mode: 'timestamp' }),
		publishedSnapshot: text('published_snapshot'),
		isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
		sortOrder: integer('sort_order').notNull().default(0),
		createdAt: integer('created_at', { mode: 'timestamp' })
			.notNull()
			.default(sql`(unixepoch())`),
		updatedAt: integer('updated_at', { mode: 'timestamp' })
			.notNull()
			.default(sql`(unixepoch())`)
	},
	(t) => [
		uniqueIndex('page_override_route_uniq')
			.on(t.routePattern)
			.where(sql`type = 'override' AND route_pattern IS NOT NULL`)
	]
);

export const pageBlock = sqliteTable(
	'page_block',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		pageId: text('page_id')
			.notNull()
			.references(() => page.id, { onDelete: 'cascade' }),
		type: text('type').notNull(),
		sortOrder: integer('sort_order').notNull().default(0),
		isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
		globalSettings: text('global_settings').notNull().default('{}')
	},
	(t) => [index('page_block_page_idx').on(t.pageId)]
);

export const pageBlockContent = sqliteTable(
	'page_block_content',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		blockId: text('block_id')
			.notNull()
			.references(() => pageBlock.id, { onDelete: 'cascade' }),
		locale: text('locale').notNull(),
		content: text('content').notNull().default('{}')
	},
	(t) => [
		index('page_block_content_block_idx').on(t.blockId),
		index('page_block_content_locale_idx').on(t.locale)
	]
);

export const pageRevision = sqliteTable(
	'page_revision',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		pageId: text('page_id')
			.notNull()
			.references(() => page.id, { onDelete: 'cascade' }),
		snapshot: text('snapshot').notNull(),
		publishedAt: integer('published_at', { mode: 'timestamp' })
			.notNull()
			.default(sql`(unixepoch())`),
		publishedBy: text('published_by'),
		note: text('note')
	},
	(t) => [index('page_revision_page_idx').on(t.pageId)]
);

// --- Relations (must come after all tables) ----------------------------

export const pageRelations = relations(page, ({ many }) => ({
	blocks: many(pageBlock)
}));

export const pageBlockRelations = relations(pageBlock, ({ one, many }) => ({
	page: one(page, {
		fields: [pageBlock.pageId],
		references: [page.id]
	}),
	contents: many(pageBlockContent)
}));

export const pageBlockContentRelations = relations(pageBlockContent, ({ one }) => ({
	block: one(pageBlock, {
		fields: [pageBlockContent.blockId],
		references: [pageBlock.id]
	})
}));

// --- Site settings (WordPress-style key/value bag) ---------------------
// Flat options table backing /admin/settings. Schema is intentionally
// generic; the typed shape lives in src/lib/server/settings-registry.ts.
// `value` holds JSON.stringify'd content (string, number, boolean, object).
// `is_public` gates whether the value is exposed to the browser via
// +layout.server.ts. `group` matches a registry group (appearance, theme,
// system, seo, integrations, social).

export const siteSetting = sqliteTable(
	'site_setting',
	{
		key: text('key').primaryKey(),
		group: text('group').notNull(),
		value: text('value').notNull().default(''),
		isPublic: integer('is_public', { mode: 'boolean' }).notNull().default(false),
		updatedAt: integer('updated_at', { mode: 'timestamp' })
			.notNull()
			.default(sql`(unixepoch())`)
	},
	(t) => [index('site_setting_group_idx').on(t.group)]
);

// --- Menus (WordPress-style customizable navigation) -------------------
// A `menu` is a named container assigned to a slot ("location") on the
// public site (e.g. `primary`, `footer`). `menu_item` is a tree of nodes
// (parent_id self-ref) covering custom links, refs to internal entities
// (page/category/post/...), and special mega-menu nodes whose extras live
// in the `data` JSON column.

export const menu = sqliteTable(
	'menu',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		slug: text('slug').notNull().unique(),
		name: text('name').notNull(),
		location: text('location'),
		isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
		createdAt: integer('created_at', { mode: 'timestamp' })
			.notNull()
			.default(sql`(unixepoch())`),
		updatedAt: integer('updated_at', { mode: 'timestamp' })
			.notNull()
			.default(sql`(unixepoch())`)
	},
	(t) => [uniqueIndex('menu_location_uniq').on(t.location).where(sql`location IS NOT NULL`)]
);

export const menuItem = sqliteTable(
	'menu_item',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		menuId: text('menu_id')
			.notNull()
			.references(() => menu.id, { onDelete: 'cascade' }),
		parentId: text('parent_id'),
		sortOrder: integer('sort_order').notNull().default(0),
		// Kinds: 'custom' | 'page' | 'category' | 'project_category' | 'post' |
		// 'showroom' | 'route' | 'mega_column' | 'mega_promo' | 'mega_featured'
		kind: text('kind').notNull().default('custom'),
		refId: text('ref_id'),
		url: text('url'),
		labelVi: text('label_vi').notNull().default(''),
		labelEn: text('label_en'),
		target: text('target').notNull().default('_self'),
		isMega: integer('is_mega', { mode: 'boolean' }).notNull().default(false),
		data: text('data').notNull().default('{}')
	},
	(t) => [
		index('menu_item_menu_idx').on(t.menuId),
		index('menu_item_parent_idx').on(t.parentId)
	]
);

export const menuRelations = relations(menu, ({ many }) => ({
	items: many(menuItem)
}));

export const menuItemRelations = relations(menuItem, ({ one }) => ({
	menu: one(menu, { fields: [menuItem.menuId], references: [menu.id] })
}));
