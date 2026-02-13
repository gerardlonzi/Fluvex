import { z } from "zod";

export const updateCompanySchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional().nullable(),
  taxId: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  country: z.string().optional(),
  fleetSize: z.string().optional().nullable(),
  industry: z.string().optional(),
  logoUrl: z.string().url().optional().nullable(),
  currency: z.string().optional().nullable(),
});

export const notificationPrefsSchema = z.object({
  shipments: z.boolean(),
  fleet: z.boolean(),
  billing: z.boolean(),
});

export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
export type NotificationPrefsInput = z.infer<typeof notificationPrefsSchema>;
