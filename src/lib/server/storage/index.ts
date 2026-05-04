// Pluggable storage abstraction. Default = local filesystem under
// /static/uploads served at /uploads/<key>. Swap to S3/etc by replacing
// the exported `storage` instance — same interface.

import { localStorage } from './local';

export type StoredObject = {
	key: string; // opaque storage id (e.g. 'products/2026/abc.jpg')
	url: string; // public URL the browser can fetch
	size: number; // bytes
	contentType: string;
};

export interface Storage {
	put(input: {
		buffer: Uint8Array;
		contentType: string;
		filenameHint?: string;
		prefix?: string; // e.g. 'products', 'projects'
	}): Promise<StoredObject>;
	delete(key: string): Promise<void>;
	urlFor(key: string): string;
}

export const storage: Storage = localStorage;
