import { defineResource } from '$lib/server/admin';
import { productWriteSchema } from '$lib/server/schemas';
import {
	createProduct,
	deleteProduct,
	getProductAdmin,
	listCategoriesAdmin,
	listProductsAdmin,
	updateProduct
} from '$lib/server/admin-repos';

export const productsResource = defineResource({
	name: 'Product',
	schema: productWriteSchema,
	basePath: '/admin/products',
	listAll: async (event) => {
		const search = event.url.searchParams.get('q') ?? '';
		const categoryId = event.url.searchParams.get('cat') ?? 'all';
		const [rows, categories] = await Promise.all([
			listProductsAdmin({ search, categoryId }),
			listCategoriesAdmin()
		]);
		return { rows, categories, search, categoryId };
	},
	loadRelated: async () => ({ categories: await listCategoriesAdmin() }),
	getOne: (id) => getProductAdmin(id),
	create: (input) => createProduct(input),
	update: (id, input) => updateProduct(id, input),
	deleteOne: (id) => deleteProduct(id)
});
