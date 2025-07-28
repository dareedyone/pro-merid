import axios from 'axios';
import { Readable } from 'stream';
import { basename } from 'path';
import type { Express } from 'express';

export async function downloadUrlAsMulterFile(
  url: string,
): Promise<Express.Multer.File> {
  const response = await axios.get(url, { responseType: 'arraybuffer' });

  const buffer = Buffer.from(response.data);
  const contentType =
    response.headers['content-type'] || 'application/octet-stream';
  const contentLengthHeader = response.headers['content-length'];
  const contentLength =
    typeof contentLengthHeader === 'string'
      ? parseInt(contentLengthHeader, 10)
      : buffer.length;

  return {
    fieldname: 'file',
    originalname: basename(url),
    encoding: '7bit',
    mimetype: contentType,
    size: contentLength,
    buffer,
    destination: '',
    filename: basename(url),
    path: '',
    stream: Readable.from(buffer),
  };
}
