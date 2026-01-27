
import { put, del } from '@vercel/blob';

export async function uploadImage(base64Data: string, fileName: string): Promise<string> {
    // Convert base64 to buffer
    const base64Content = base64Data.split(';base64,').pop();
    if (!base64Content) {
        throw new Error('Invalid base64 data');
    }
    const buffer = Buffer.from(base64Content, 'base64');

    // Upload to Vercel Blob
    const blob = await put(fileName, buffer, {
        access: 'public',
    });

    return blob.url;
}

export async function deleteImage(url: string): Promise<void> {
    await del(url);
}
