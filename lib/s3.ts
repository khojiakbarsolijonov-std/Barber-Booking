import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, AWS_BUCKET_NAME, buildKey } from './aws-config';

// Upload a buffer to S3. `path` is the relative storage path (e.g. 'avatars/avatar-1.jpg').
// Returns the same relative path, which is what we persist and later resolve via buildKey().
export async function uploadFile(
  path: string,
  body: Buffer,
  contentType: string
): Promise<string> {
  const clean = path.replace(/^\/+/, '');
  await s3Client.send(
    new PutObjectCommand({
      Bucket: AWS_BUCKET_NAME,
      Key: buildKey(clean),
      Body: body,
      ContentType: contentType,
    })
  );
  return clean;
}

// Fetch an object by its relative storage path. Used by the media proxy route.
export async function getObjectByPath(
  path: string
): Promise<{ body: Buffer; contentType: string }> {
  const clean = path.replace(/^\/+/, '');
  const res = await s3Client.send(
    new GetObjectCommand({
      Bucket: AWS_BUCKET_NAME,
      Key: buildKey(clean),
    })
  );
  const bytes = await res.Body!.transformToByteArray();
  return {
    body: Buffer.from(bytes),
    contentType: res.ContentType || 'application/octet-stream',
  };
}
