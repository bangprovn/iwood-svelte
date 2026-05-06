import {
	error,
	fail,
	redirect,
	type ActionFailure,
	type RequestEvent
} from '@sveltejs/kit';
import type { ZodType } from 'zod';
import { requireAdmin } from '$lib/server/admin-guard';
import { parseForm, type FormFailState } from './parse-form';

/**
 * Generic admin CRUD resource. Captures the load/actions skeleton that every
 * admin resource (categories, products, projects, …) repeats, so each route
 * file becomes a one-line `export const { load, actions } = …`.
 *
 * Forms stay bespoke per-resource — only the server scaffolding is unified.
 */
export type ResourceConfig<
	TListData extends object,
	TRow,
	TInput,
	TRelated extends object = object
> = {
	/** Display name for log messages / errors. */
	name: string;
	/** Zod schema validating create/update form input. */
	schema: ZodType<TInput>;
	/** Base path under /admin (e.g. "/admin/categories"). */
	basePath: string;
	/** Route param name for the edit page (default: "id"). */
	paramName?: string;
	/** Form field name carrying the row id on the list-page delete form. Default: "id". */
	deleteIdField?: string;
	/**
	 * List page data loader. Returns the full page-data shape, e.g.
	 * `{ rows, categories, search, categoryId }` — defineResource does NOT
	 * wrap. Caller controls everything past the auth check.
	 */
	listAll: (event: RequestEvent) => Promise<TListData>;
	/** Edit page row loader; return null/undefined for 404. */
	getOne: (id: string, event: RequestEvent) => Promise<TRow | null | undefined>;
	/**
	 * Optional extra data for new/edit pages — merged into the page-data
	 * result alongside `row` (on edit). Typical use: dropdown options shared
	 * by both create and update forms.
	 */
	loadRelated?: (event: RequestEvent) => Promise<TRelated>;
	create: (input: TInput, event: RequestEvent) => Promise<unknown>;
	update: (id: string, input: TInput, event: RequestEvent) => Promise<unknown>;
	deleteOne: (id: string, event: RequestEvent) => Promise<unknown>;
	/**
	 * Optional hook invoked when create/update throws. Lets a resource turn
	 * domain errors (e.g. unique-violation in locales) into a `fail(409, …)`
	 * with field-level error attribution. If unset, errors propagate as 500.
	 */
	onWriteError?: (
		err: unknown,
		input: TInput
	) => ActionFailure<FormFailState<TInput>>;
};

type DeleteActionResult = { success: true } | ActionFailure<{ message: string }>;
type WriteActionResult<TInput> =
	| ActionFailure<FormFailState<TInput>>
	| ActionFailure<{ message: string }>;

export function defineResource<
	TListData extends object,
	TRow,
	TInput,
	TRelated extends object = Record<string, never>
>(config: ResourceConfig<TListData, TRow, TInput, TRelated>) {
	const paramName = config.paramName ?? 'id';
	const getParam = (event: RequestEvent): string => {
		const params = event.params as Record<string, string | undefined>;
		const value = params[paramName];
		if (!value) throw error(400, `Missing ${paramName} param`);
		return value;
	};

	const listLoad = async (event: RequestEvent) => {
		requireAdmin(event);
		return config.listAll(event);
	};

	const deleteIdField = config.deleteIdField ?? 'id';

	const deleteAction = async (event: RequestEvent): Promise<DeleteActionResult> => {
		requireAdmin(event);
		const fd = await event.request.formData();
		const id = fd.get(deleteIdField)?.toString();
		if (!id) return fail(400, { message: `${deleteIdField} required` });
		try {
			await config.deleteOne(id, event);
		} catch (e) {
			return fail(409, { message: e instanceof Error ? e.message : String(e) });
		}
		return { success: true };
	};

	const newLoad = async (event: RequestEvent) => {
		requireAdmin(event);
		return config.loadRelated ? await config.loadRelated(event) : ({} as TRelated);
	};

	const createAction = async (
		event: RequestEvent
	): Promise<WriteActionResult<TInput> | undefined> => {
		requireAdmin(event);
		const fd = await event.request.formData();
		const parsed = parseForm(config.schema, fd);
		if (!('input' in parsed)) return parsed;
		if (config.onWriteError) {
			try {
				await config.create(parsed.input, event);
			} catch (err) {
				return config.onWriteError(err, parsed.input);
			}
		} else {
			await config.create(parsed.input, event);
		}
		throw redirect(303, config.basePath);
	};

	const editLoad = async (event: RequestEvent) => {
		requireAdmin(event);
		const id = getParam(event);
		const row = await config.getOne(id, event);
		if (!row) throw error(404, `${config.name} not found`);
		const related = config.loadRelated
			? await config.loadRelated(event)
			: ({} as TRelated);
		return { row, ...related };
	};

	const updateAction = async (
		event: RequestEvent
	): Promise<WriteActionResult<TInput> | undefined> => {
		requireAdmin(event);
		const id = getParam(event);
		const fd = await event.request.formData();
		const parsed = parseForm(config.schema, fd);
		if (!('input' in parsed)) return parsed;
		if (config.onWriteError) {
			try {
				await config.update(id, parsed.input, event);
			} catch (err) {
				return config.onWriteError(err, parsed.input);
			}
		} else {
			await config.update(id, parsed.input, event);
		}
		throw redirect(303, config.basePath);
	};

	return {
		list: { load: listLoad, actions: { delete: deleteAction } },
		new: { load: newLoad, actions: { default: createAction } },
		edit: { load: editLoad, actions: { default: updateAction } }
	};
}
