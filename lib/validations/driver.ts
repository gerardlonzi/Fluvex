import { z } from "zod";

export const driverStatusEnum = z.enum(["ACTIVE", "IDLE", "MAINTENANCE"]);

export const createDriverSchema = z.object({
  name: z.string().min(1, "Nom requis"),
  email: z.string().email("Email invalide"),
  phone: z.string().optional(),
  role: z.string().optional(),
  status: driverStatusEnum.default("ACTIVE"),
  region: z.string().optional(),
  avatarUrl: z.string().url().optional().nullable(),
  vehicleId: z.string().optional().nullable(),
});

export const updateDriverSchema = createDriverSchema.partial();

export type CreateDriverInput = z.infer<typeof createDriverSchema>;
export type UpdateDriverInput = z.infer<typeof updateDriverSchema>;
