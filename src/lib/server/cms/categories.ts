import { eq } from 'drizzle-orm';
import { defineResource } from '$lib/server/admin';
import { categoryWriteSchema } from '$lib/server/schemas';
import { db } from '$lib/server/db';
import { category } from '$lib/server/db/schema';
import {
	createCategory,
	deleteCategory,
	listCategoriesAdmin,
	updateCategory
} from '$lib/server/admin-repos';

export const categoriesResource = defineResource({
	name: 'Category',
	schema: categoryWriteSchema,
	basePath: '/admin/categories',
	listAll: () => listCategoriesAdmin(),
	getOne: async (id) => {
		const [row] = await db.select().from(category).where(eq(category.id, id));
		return row ?? null;
	},
	create: (input) => createCategory(input),
	update: (id, input) => updateCategory(id, input),
	deleteOne: (id) => deleteCategory(id)
});
