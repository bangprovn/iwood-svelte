import type { Storage } from './index';

// S3-compatible storage. Stub for now — real impl belongs here when ready.
// To activate: set STORAGE_DRIVER=s3 plus S3_BUCKET, S3_REGION, S3_ACCESS_KEY,
// S3_SECRET_KEY, optional S3_ENDPOINT (for non-AWS providers like R2/MinIO),
// and S3_PUBLIC_URL_BASE (the CDN/bucket URL prefix used to construct public urls).
//
// Implementation outline (AWS SDK v3):
//   import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
//   const client = new S3Client({ region, endpoint, credentials });
//   await client.send(new PutObjectCommand({ Bucket, Key: key, Body: buffer, ContentType }));
//
// The url returned should be `${S3_PUBLIC_URL_BASE}/${key}`. Keep the same key
// scheme as local (prefix/year/uuid.ext) so existing rows remain valid if you
// migrate uploaded files between drivers.
export const s3Storage: Storage = {
	async put() {
		throw new Error('S3 storage driver is not implemented yet. Set STORAGE_DRIVER=local or implement src/lib/server/storage/s3.ts');
	},
	async delete() {
		throw new Error('S3 storage driver is not implemented yet.');
	},
	urlFor(key) {
		const base = (process.env.S3_PUBLIC_URL_BASE ?? '').replace(/\/+$/, '');
		return `${base}/${key}`;
	}
};
