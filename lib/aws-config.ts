import { S3Client } from '@aws-sdk/client-s3';

export const AWS_REGION = process.env.AWS_REGION || 'us-west-2';
export const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME || '';
export const AWS_FOLDER_PREFIX = process.env.AWS_FOLDER_PREFIX || '';

export const s3Client = new S3Client({
  region: AWS_REGION,
});

// Build the full object key with the required folder prefix.
export function buildKey(path: string): string {
  const clean = path.replace(/^\/+/, '');
  return `${AWS_FOLDER_PREFIX}${clean}`;
}

// Public URL for objects that are meant to be publicly readable (bucket policy handles access).
export function getPublicUrl(key: string): string {
  const encoded = key.split('/').map(encodeURIComponent).join('/');
  return `https://${AWS_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${encoded}`;
}
