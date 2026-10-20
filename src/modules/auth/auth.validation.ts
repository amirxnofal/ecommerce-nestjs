import z from 'zod';

export const registerSchema = z
  .strictObject({
    email: z.string().email(),
    p: z.string().min(3).max(6),
    cp: z.string().min(3).max(6),
    age: z.number().min(18),
  })
  .refine((data) => data.p === data.cp, {
    message: 'Passwords do not match',
  });
