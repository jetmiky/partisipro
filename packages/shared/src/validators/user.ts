import { z } from 'zod';

// User validation schemas
export const UserRegistrationSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  phoneNumber: z
    .string()
    .regex(/^(\+62|62|0)8[1-9][0-9]{6,9}$/, 'Invalid Indonesian phone number'),
  address: z.string().min(10, 'Address must be at least 10 characters'),
});

export const UserLoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const UserUpdateSchema = UserRegistrationSchema.partial().omit({
  password: true,
});

export const KYCSubmissionSchema = z.object({
  idType: z.enum(['ktp', 'passport', 'sim']),
  idNumber: z.string().min(1, 'ID number is required'),
  fullName: z.string().min(2, 'Full name is required'),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  placeOfBirth: z.string().min(2, 'Place of birth is required'),
  nationality: z.string().default('Indonesia'),
  occupation: z.string().min(2, 'Occupation is required'),
});

export type UserRegistrationData = z.infer<typeof UserRegistrationSchema>;
export type UserLoginData = z.infer<typeof UserLoginSchema>;
export type UserUpdateData = z.infer<typeof UserUpdateSchema>;
export type KYCSubmissionData = z.infer<typeof KYCSubmissionSchema>;
