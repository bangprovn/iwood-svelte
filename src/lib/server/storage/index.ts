// Pluggable storage abstraction. Default = local filesystem under
// /static/uploads served at /uploads/<key>. Swap drivers via STORAGE_DRIVER
// env var (currently: 'local' | 's3'). All drivers share the same interface
// and key scheme so migrations between them are mechanical.

import { env } from '$env/dynamic/private';
import { localStorage } from './local';
import { s3Storage } from './s3';

export type StoredObject = {
	key: string; // opaque storage id (e.g. 'pages/2026/abc.jpg')
	url: string; // public URL the browser can fetch
	size: number; // bytes
	contentType: string;
};

export interface Storage {
	put(input: {
		buffer: Uint8Array;
		contentType: string;
		filenameHint?: string;
		prefix?: string; // e.g. 'pages', 'products', 'projects'
	}): Promise<StoredObject>;
	delete(key: string): Promise<void>;
	urlFor(key: string): string;
}

const driver = (env.STORAGE_DRIVER ?? 'local').toLowerCase();

export const storage: Storage = driver === 's3' ? s3Storage : localStorage;
