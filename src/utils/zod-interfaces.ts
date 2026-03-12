import { z } from 'zod/v4';

//#region AUTH
export const signUpSchemaValidation = z.object({
  name: z.string().trim().min(2, { error: 'Name must be at least 2 letters' }),
  email: z.email({ error: 'Invalid email' }),
  password: z
    .string()
    .min(8, { error: 'Password must be at least 8 characters' })
    .refine((pwd) => /[A-Z]/.test(pwd), { error: 'At least 1 uppercase letter' })
    .refine((pwd) => /[a-z]/.test(pwd), { error: 'At least 1 lowercase letter' })
    .refine((pwd) => /[0-9]/.test(pwd), { error: 'At least 1 number' })
    .refine((pwd) => /[!@#$%^&*]/.test(pwd), {
      error: "At least 1 special character from: '! | @ | # | $ | % | ^ | & | *'",
    }),
});

export const signInSchemaValidation = z.object({
  email: z.email({ error: 'Invalid email' }),
  password: z.string().min(1, { error: 'Field cannot be empty' }),
  rememberMe: z.boolean().optional(),
});
//#endregion

//#region PROFILE
export const editUserSchemaValidation = z.object({
  name: z
    .string()
    .trim()
    .min(3, { error: 'Name must have at least 3 letters', abort: true })
    .max(50, { error: 'Name must be less than 50 letters' }),
});
//#endregion

//#region DB SCHEMAS
export const venueSchema = z.object({
  name: z.string(),
  city: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  contactName: z.string().nullable().optional(),
  contactEmail: z.email().nullable().optional(),
  contactPhone: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  createdAt: z.date().nullable().optional(),
  updatedAt: z.date().nullable().optional(),
});

export const venueResponseSchema = venueSchema.extend({
  id: z.string(),
});

export type Venue = z.infer<typeof venueResponseSchema>;

export const parseVenueSchema = z.object({
  name: z.string().trim().min(2, { error: 'Venue name must be at least 2 characters' }),
  city: z.string().trim().optional(),
  address: z.string().trim().optional(),
  contactName: z.string().trim().optional(),
  contactEmail: z.email({ error: 'Invalid contact email' }).optional(),
  contactPhone: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});
//#endregion
