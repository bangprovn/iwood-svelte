import { drizzle, type LibSQLDatabase } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';
import { env } from '$env/dynamic/private';

type DB = LibSQLDatabase<typeof schema>;

let instance: DB | undefined;

function init(): DB {
	if (instance) return instance;
	if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
	instance = drizzle(createClient({ url: env.DATABASE_URL }), { schema });
	return instance;
}

export const db = new Proxy({} as DB, {
	get: (_t, p, r) => Reflect.get(init() as object, p, r),
	has: (_t, p) => Reflect.has(init() as object, p)
});
