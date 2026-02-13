import { z } from "zod";

export const vehicleStatusEnum = z.enum(["ACTIVE", "MAINTENANCE", "INACTIVE"]);

export const createVehicleSchema = z.object({
  name: z.string().min(1, "Nom requis"),
  plateNumber: z.string().optional().nullable(),
  status: vehicleStatusEnum.default("ACTIVE"),
});

export const updateVehicleSchema = createVehicleSchema.partial();

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
