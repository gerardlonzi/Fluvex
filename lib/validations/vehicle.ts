import { z } from "zod";

export const vehicleStatusEnum = z.enum(["ACTIVE", "MAINTENANCE", "INACTIVE"]);

export const createVehicleSchema = z.object({
  name: z.string().min(1, "Nom requis"),
  plateNumber: z.string().optional().nullable(),
  status: vehicleStatusEnum.default("ACTIVE"),
});

/** Schéma pour le formulaire d'ajout de véhicule (UI) */
export const createVehicleFormSchema = z.object({
  name: z.string().min(1, "Le nom du véhicule est requis."),
  plateNumber: z.string().min(1, "Le numéro de plaque est requis."),
});

export const updateVehicleSchema = createVehicleSchema.partial();

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type CreateVehicleFormInput = z.infer<typeof createVehicleFormSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
