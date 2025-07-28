import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

interface FileValidationOptions {
  allowedMimeTypes?: string[];
  maxSizeInBytes?: number;
  isOptional?: boolean;
}

@Injectable()
export class FileValidationPipe implements PipeTransform {
  constructor(private options: FileValidationOptions = {}) {}

  transform(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const {
      allowedMimeTypes = ['image/jpeg', 'image/png'],
      maxSizeInBytes = 5 * 1024 * 1024,
      isOptional = false,
    } = this.options;

    if (!allowedMimeTypes.includes(file.mimetype)) {
      if (isOptional) return file;
      throw new BadRequestException(
        `Invalid file type: ${file.mimetype}. Allowed: ${allowedMimeTypes.join(', ')}`,
      );
    }

    if (file.size > maxSizeInBytes) {
      throw new BadRequestException(
        `File size exceeds limit of ${maxSizeInBytes / (1024 * 1024)}MB`,
      );
    }

    return file;
  }
}
