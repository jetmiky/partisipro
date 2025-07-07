import { z } from 'zod';

// Project validation schemas
export const ProjectCreateSchema = z.object({
  name: z
    .string()
    .min(1, 'Project name is required')
    .max(100, 'Project name too long'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  targetAmount: z.string().min(1, 'Target amount is required'),
  duration: z.number().min(30, 'Duration must be at least 30 days'),
  category: z.enum([
    'infrastructure',
    'transportation',
    'energy',
    'healthcare',
    'education',
  ]),
});

export const ProjectUpdateSchema = ProjectCreateSchema.partial();

export type ProjectCreateData = z.infer<typeof ProjectCreateSchema>;
export type ProjectUpdateData = z.infer<typeof ProjectUpdateSchema>;
