import {
  ArgumentMetadata,
  Injectable,
  PipeTransform,
  BadRequestException,
  Logger,
  Type,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import * as DOMPurify from 'isomorphic-dompurify';

@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  private readonly logger = new Logger(ValidationPipe.name);

  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    // Sanitize input data
    const sanitizedValue = this.sanitizeInput(value);

    // Transform plain object to class instance
    const object = plainToClass(metatype, sanitizedValue);

    // Validate the object
    const errors = await validate(object, {
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    });

    if (errors.length > 0) {
      const errorMessage = this.formatValidationErrors(errors);
      this.logger.warn(`Validation failed: ${errorMessage}`);
      throw new BadRequestException(errorMessage);
    }

    return object;
  }

  private toValidate(metatype: Type<any>): boolean {
    const types: Type<any>[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }

  private sanitizeInput(value: any): any {
    if (typeof value === 'string') {
      // Remove HTML tags and prevent XSS
      return DOMPurify.sanitize(value, { ALLOWED_TAGS: [] });
    }

    if (typeof value === 'object' && value !== null) {
      const sanitized = {};
      for (const key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          sanitized[key] = this.sanitizeInput(value[key]);
        }
      }
      return sanitized;
    }

    if (Array.isArray(value)) {
      return value.map(item => this.sanitizeInput(item));
    }

    return value;
  }

  private formatValidationErrors(errors: any[]): string {
    return errors
      .map(error => {
        if (error.constraints) {
          return Object.values(error.constraints).join(', ');
        }
        return 'Validation failed';
      })
      .join('; ');
  }
}

@Injectable()
export class SanitizationPipe implements PipeTransform {
  private readonly logger = new Logger(SanitizationPipe.name);

  transform(value: any, _metadata: ArgumentMetadata) {
    if (!value) {
      return value;
    }

    return this.sanitizeValue(value);
  }

  private sanitizeValue(value: any): any {
    if (typeof value === 'string') {
      // Remove potential SQL injection patterns
      value = value.replace(/['"`;\\]/g, '');

      // Remove script tags and javascript protocols
      value = value.replace(
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        ''
      );
      value = value.replace(/javascript:/gi, '');

      // Sanitize HTML
      value = DOMPurify.sanitize(value, {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: [],
      });

      // Trim whitespace
      value = value.trim();
    }

    if (typeof value === 'object' && value !== null) {
      const sanitized = {};
      for (const key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          sanitized[key] = this.sanitizeValue(value[key]);
        }
      }
      return sanitized;
    }

    if (Array.isArray(value)) {
      return value.map(item => this.sanitizeValue(item));
    }

    return value;
  }
}

@Injectable()
export class FileValidationPipe implements PipeTransform {
  private readonly logger = new Logger(FileValidationPipe.name);
  private readonly allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  private readonly maxFileSize = 5 * 1024 * 1024; // 5MB

  transform(value: any, _metadata: ArgumentMetadata) {
    if (!value) {
      return value;
    }

    if (value.mimetype && !this.allowedMimes.includes(value.mimetype)) {
      throw new BadRequestException(
        `File type ${value.mimetype} not allowed. Allowed types: ${this.allowedMimes.join(', ')}`
      );
    }

    if (value.size && value.size > this.maxFileSize) {
      throw new BadRequestException(
        `File size ${value.size} exceeds maximum allowed size of ${this.maxFileSize} bytes`
      );
    }

    // Additional security checks
    if (value.filename) {
      // Check for suspicious file names
      if (
        value.filename.includes('..') ||
        value.filename.includes('/') ||
        value.filename.includes('\\')
      ) {
        throw new BadRequestException('Invalid filename');
      }

      // Check for executable extensions
      const suspiciousExtensions = [
        '.exe',
        '.bat',
        '.cmd',
        '.com',
        '.scr',
        '.vbs',
        '.js',
        '.jar',
      ];
      const extension = value.filename
        .toLowerCase()
        .substring(value.filename.lastIndexOf('.'));

      if (suspiciousExtensions.includes(extension)) {
        throw new BadRequestException('Executable files are not allowed');
      }
    }

    return value;
  }
}
