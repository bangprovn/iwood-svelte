import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';
import type { Storage, StoredObject } from './index';

// S3-compatible storage. Activate with STORAGE_DRIVER=s3.
//
// Required env:
//   S3_BUCKET            destination bucket
//   S3_REGION            e.g. auto (R2), us-east-1
//   S3_ACCESS_KEY        access key id
//   S3_SECRET_KEY        secret access key
//   S3_PUBLIC_URL_BASE   public URL prefix used by the browser (CDN/bucket base, no trailing slash)
//
// Optional:
//   S3_ENDPOINT          custom endpoint for non-AWS providers (R2, MinIO, etc.)
//   S3_FORCE_PATH_STYLE  "true" to force path-style addressing (MinIO/some R2 setups)

const EXT_BY_MIME: Record<string, string> = {
	'image/jpeg': '.jpg',
	'image/png': '.png',
	'image/webp': '.webp',
	'image/gif': '.gif',
	'image/svg+xml': '.svg',
	'image/avif': '.avif'
};

function safeExt(contentType: string, hint?: string): string {
	const fromMime = EXT_BY_MIME[contentType.toLowerCase()];
	if (fromMime) return fromMime;
	if (hint) {
		const dot = hint.lastIndexOf('.');
		const ext = dot >= 0 ? hint.slice(dot).toLowerCase() : '';
		if (/^\.[a-z0-9]{2,5}$/i.test(ext)) return ext;
	}
	return '.bin';
}

let _client: S3Client | null = null;
function client(): S3Client {
	if (_client) return _client;
	const region = process.env.S3_REGION;
	const accessKeyId = process.env.S3_ACCESS_KEY;
	const secretAccessKey = process.env.S3_SECRET_KEY;
	if (!region || !accessKeyId || !secretAccessKey) {
		throw new Error('S3 storage misconfigured: S3_REGION, S3_ACCESS_KEY, S3_SECRET_KEY required');
	}
	_client = new S3Client({
		region,
		endpoint: process.env.S3_ENDPOINT || undefined,
		forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
		credentials: { accessKeyId, secretAccessKey }
	});
	return _client;
}

function publicBase(): string {
	const base = (process.env.S3_PUBLIC_URL_BASE ?? '').replace(/\/+$/, '');
	if (!base) throw new Error('S3 storage misconfigured: S3_PUBLIC_URL_BASE required');
	return base;
}

function bucket(): string {
	const b = process.env.S3_BUCKET;
	if (!b) throw new Error('S3 storage misconfigured: S3_BUCKET required');
	return b;
}

export const s3Storage: Storage = {
	async put({ buffer, contentType, filenameHint, prefix }) {
		const cleanPrefix = (prefix ?? 'misc').replace(/[^a-z0-9_-]/gi, '').slice(0, 32) || 'misc';
		const year = new Date().getFullYear();
		const ext = safeExt(contentType, filenameHint);
		const key = `${cleanPrefix}/${year}/${randomUUID()}${ext}`;

		await client().send(
			new PutObjectCommand({
				Bucket: bucket(),
				Key: key,
				Body: buffer,
				ContentType: contentType
			})
		);

		const obj: StoredObject = {
			key,
			url: `${publicBase()}/${key}`,
			size: buffer.byteLength,
			contentType
		};
		return obj;
	},

	async delete(key) {
		if (!key || key.includes('..')) return;
		await client().send(new DeleteObjectCommand({ Bucket: bucket(), Key: key }));
	},

	urlFor(key) {
		return `${publicBase()}/${key}`;
	}
};
