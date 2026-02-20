import { z } from 'zod/v4';

export const signUpSchemaValidation = z.object({
  name: z.string().min(2, { error: 'Name must be at least 2 letters' }),
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
});

export const editUserSchemaValidation = z.object({
  name: z
    .string()
    .min(3, { error: 'Name must have at least 3 letters', abort: true })
    .max(50, { error: 'Name must be less than 50 letters' }),
});
