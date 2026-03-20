import { z } from 'zod/v4';

const emptyToUndefined = (schema: z.ZodTypeAny) =>
  z.preprocess((val) => (val === '' ? undefined : val), schema);

const valueToNull = (schema: z.ZodTypeAny) =>
  z.preprocess((val) => (val === undefined || val === '' ? null : val), schema);

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
const bookingStatusSchema = z.enum([
  'draft',
  'requested',
  'negotiating',
  'confirmed',
  'rejected',
  'cancelled',
]);

export const gigEventSchema = z.object({
  venueId: z.string().trim().min(1),
  date: z.iso.datetime(),
  status: bookingStatusSchema,
  title: z.string().trim().min(1),
  setlistName: z.string().optional(),
  notes: z.string().optional(),
  bookingId: z.string().optional(),
  ownerId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const venueSchema = z.object({
  name: z.string(),
  city: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  contactName: z.string().nullable().optional(),
  contactEmail: z.email().nullable().optional(),
  contactPhone: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
});

export const venueResponseSchema = venueSchema.extend({
  id: z.string(),
});

export type Venue = z.infer<typeof venueResponseSchema>;

export const parseVenueSchema = z.object({
  name: z.string().trim().min(2, { error: 'Venue name must be at least 2 characters' }),
  city: emptyToUndefined(z.string().trim().optional()),
  address: emptyToUndefined(z.string().trim().optional()),
  contactName: emptyToUndefined(z.string().trim().optional()),
  contactEmail: emptyToUndefined(z.email({ error: 'Invalid contact email' }).optional()),
  contactPhone: emptyToUndefined(z.string().trim().optional()),
  notes: emptyToUndefined(z.string().trim().optional()),
});

export const validParseVenueSchema = z.object({
  name: z.string().trim().min(2, { error: 'Venue name must be at least 2 characters' }),
  city: valueToNull(z.string().trim().nullable()),
  address: valueToNull(z.string().trim().nullable()),
  contactName: valueToNull(z.string().trim().nullable()),
  contactEmail: valueToNull(z.email({ error: 'Invalid contact email' }).nullable()),
  contactPhone: valueToNull(z.string().trim().nullable()),
  notes: valueToNull(z.string().trim().nullable()),
});

export const bookingSchema = z.object({
  venueId: z.string().trim().min(1),
  requestedDate: z.string().nullable().optional(),
  status: bookingStatusSchema,
  feeProposal: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
  venueName: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  ownerId: z.string(),
  gigId: z.string().nullable().optional(),
  gig: gigEventSchema.nullable().optional(),
});

export const bookingResponseSchema = bookingSchema.omit({ ownerId: true }).extend({
  id: z.string(),
});

export type Booking = z.infer<typeof bookingResponseSchema>;

export const parseBookingSchema = z.object({
  venueId: z.string().trim().min(1, { error: 'Venue is required' }),
  requestedDate: emptyToUndefined(z.iso.datetime().optional()),
  status: bookingStatusSchema,
  feeProposal: z.number().positive().optional(),
  notes: emptyToUndefined(z.string().trim().optional()),
});

export const validParseBookingSchema = z.object({
  venueId: z.string().trim().min(1, { error: 'Venue is required' }),
  requestedDate: valueToNull(z.iso.datetime().nullable()),
  status: bookingStatusSchema,
  feeProposal: valueToNull(z.number().positive().nullable()),
  notes: valueToNull(z.string().trim().nullable()),
});

export const gigEventResponseSchema = gigEventSchema.extend({
  id: z.string(),
});

export type GigEvent = z.infer<typeof gigEventResponseSchema>;

export const parseGigEventSchema = z.object({
  venueId: z.string().trim().min(1, { error: 'Venue is required' }),
  date: z.iso.datetime({ error: 'Gig date must be a valid ISO datetime' }),
  status: bookingStatusSchema,
  title: z.string().trim().min(1, { error: 'Gig title must be at least 2 characters' }),
  setlistName: emptyToUndefined(z.string().trim().optional()),
  notes: emptyToUndefined(z.string().trim().optional()),
  bookingId: emptyToUndefined(z.string().trim().optional()),
});

export const validParseGigEventSchema = z.object({
  venueId: z.string().trim().min(1, { error: 'Venue is required' }),
  date: z.iso.datetime({ error: 'Gig date must be a valid ISO datetime' }),
  status: bookingStatusSchema,
  title: z.string().trim().min(1, { error: 'Gig title must be at least 2 characters' }),
  setlistName: valueToNull(z.string().trim().nullable()),
  notes: valueToNull(z.string().trim().nullable()),
  bookingId: valueToNull(z.string().trim().nullable()),
});
//#endregion
