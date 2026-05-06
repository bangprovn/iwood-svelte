import { defineResource } from '$lib/server/admin';
import { showroomWriteSchema } from '$lib/server/schemas';
import {
	createShowroom,
	deleteShowroom,
	getShowroomAdmin,
	listShowroomsAdmin,
	updateShowroom
} from '$lib/server/admin-repos';

export const showroomsResource = defineResource({
	name: 'Showroom',
	schema: showroomWriteSchema,
	basePath: '/admin/showrooms',
	listAll: async () => ({ rows: await listShowroomsAdmin() }),
	getOne: (id) => getShowroomAdmin(id),
	create: (input) => createShowroom(input),
	update: (id, input) => updateShowroom(id, input),
	deleteOne: (id) => deleteShowroom(id)
});
