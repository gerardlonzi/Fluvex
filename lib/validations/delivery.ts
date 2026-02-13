import { z } from "zod";

export const deliveryStatusEnum = z.enum([
  "PENDING", "LOADING", "TRANSIT", "DELAYED", "COMPLETED", "CANCELLED"
]);

export const createDeliverySchema = z.object({
  status: deliveryStatusEnum.default("PENDING"),
  amount: z.number().optional().nullable(),
  currency: z.string().default("CFA"),
  driverId: z.string().optional().nullable(),
  vehicleId: z.string().optional().nullable(),
  // Optionnel: infos destinataire / colis (à étendre selon le formulaire)
  recipientCompany: z.string().optional(),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  deliveryAddress: z.string().optional(),
  weightKg: z.number().optional(),
  dimensionsL: z.number().optional(),
  dimensionsW: z.number().optional(),
  dimensionsH: z.number().optional(),
  packageType: z.string().optional(),
});

export const updateDeliverySchema = z.object({
  status: deliveryStatusEnum.optional(),
  amount: z.number().optional().nullable(),
  currency: z.string().optional(),
  driverId: z.string().optional().nullable(),
  vehicleId: z.string().optional().nullable(),
  startedAt: z.string().datetime().optional().nullable(),
  completedAt: z.string().datetime().optional().nullable(),
});

export type CreateDeliveryInput = z.infer<typeof createDeliverySchema>;
export type UpdateDeliveryInput = z.infer<typeof updateDeliverySchema>;
