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
  licenseExpiry: z.string().optional().nullable(),
});

/** Schéma étendu pour le formulaire d'ajout de chauffeur (UI) */
export const createDriverFormSchema = z.object({
  name: z.string().min(1, "Le nom est requis."),
  email: z.string().email("Email invalide.").min(1, "L'email est requis."),
  phone: z.string().min(1, "Le téléphone est requis."),
  birthDate: z.string().min(1, "La date de naissance est requise.")
    .refine((d) => {
      if (!d) return false;
      const birth = new Date(d);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
      return age >= 18;
    }, "Le chauffeur doit avoir au moins 18 ans."),
  licenseNumber: z.string().min(1, "Le numéro de permis est requis."),
  licenseExpiry: z.string().min(1, "La date d'expiration est requise.")
    .refine((d) => {
      if (!d) return false;
      const expiry = new Date(d);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return expiry > today;
    }, "Le permis doit être valide (expiration future)."),
  employmentType: z.string().optional(),
  shift: z.string().optional(),
  avatarUrl: z.string().url("Une photo est requise."),
  vehicleId: z.string().optional(),
  docs: z.array(z.object({
    url: z.string(),
    publicId: z.string(),
    originalFilename: z.string(),
  })).min(1, "Au moins un document est requis."),
});

export const updateDriverSchema = createDriverSchema.partial();

export type CreateDriverInput = z.infer<typeof createDriverSchema>;
export type CreateDriverFormInput = z.infer<typeof createDriverFormSchema>;
export type UpdateDriverInput = z.infer<typeof updateDriverSchema>;
