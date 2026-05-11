import { betterAuth } from 'better-auth/minimal';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { env } from '$env/dynamic/private';
import { getRequestEvent } from '$app/server';
import { db } from '$lib/server/db';

function create() {
	return betterAuth({
		baseURL: env.ORIGIN,
		secret: env.BETTER_AUTH_SECRET,
		database: drizzleAdapter(db, { provider: 'sqlite' }),
		emailAndPassword: { enabled: true },
		plugins: [
			sveltekitCookies(getRequestEvent) // make sure this is the last plugin in the array
		]
	});
}

type Auth = ReturnType<typeof create>;

let instance: Auth | undefined;

function init(): Auth {
	if (!instance) instance = create();
	return instance;
}

export const auth = new Proxy({} as Auth, {
	get: (_t, p, r) => Reflect.get(init() as object, p, r),
	has: (_t, p) => Reflect.has(init() as object, p)
});
