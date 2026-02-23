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
  recipientName: z.string().optional(),
  recipientPhone: z.string().optional(),
  deliveryAddress: z.string().optional(),
  weightKg: z.number().optional(),
  dimensionsL: z.number().optional(),
  dimensionsW: z.number().optional(),
  dimensionsH: z.number().optional(),
  packageType: z.string().optional(),
  scheduledDate: z.string().optional(),
  scheduledTime: z.string().optional(),
  scheduledAt: z.string().datetime().optional().nullable(),
});

export const updateDeliverySchema = z.object({
  status: deliveryStatusEnum.optional(),
  amount: z.number().optional().nullable(),
  currency: z.string().optional(),
  driverId: z.string().optional().nullable(),
  vehicleId: z.string().optional().nullable(),
  recipientCompany: z.string().optional().nullable(),
  deliveryAddress: z.string().optional().nullable(),
  contactName: z.string().optional().nullable(),
  contactPhone: z.string().optional().nullable(),
  scheduledAt: z.string().datetime().optional().nullable(),
  startedAt: z.string().datetime().optional().nullable(),
  completedAt: z.string().datetime().optional().nullable(),
});

/** Schéma pour le formulaire de création de livraison (UI) */
export const createDeliveryFormSchema = z.object({
  companyName: z.string().min(1, "Le nom de l'entreprise est requis"),
  contactName: z.string().min(1, "Le nom du contact est requis"),
  phoneNumber: z.string().min(1, "Le numéro de téléphone est requis"),
  deliveryAddress: z.string().min(1, "L'adresse de livraison est requise"),
  weight: z.string().refine((v) => v && Number(v) > 0, "Le poids est requis et doit être supérieur à 0"),
  length: z.string().refine((v) => v && Number(v) > 0, "La longueur est requise"),
  width: z.string().refine((v) => v && Number(v) > 0, "La largeur est requise"),
  height: z.string().refine((v) => v && Number(v) > 0, "La hauteur est requise"),
  packageType: z.string().min(1, "Le type de colis est requis"),
  scheduledDate: z.string().min(1, "La date de livraison est requise")
    .refine((d) => {
      if (!d) return false;
      const selected = new Date(d);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return selected >= today;
    }, "La date de livraison ne peut pas être dans le passé"),
  scheduledTime: z.string().min(1, "L'heure de livraison est requise"),
  amount: z.string().refine((v) => v && Number(v) > 0, "Le prix de livraison est requis"),
  driverId: z.string().min(1, "Un chauffeur doit être sélectionné"),
  vehicleId: z.string().min(1, "Un véhicule doit être sélectionné"),
  currency: z.string().min(1, "Devise requise"),
});

/** Schéma pour le formulaire d'édition de livraison (modal) */
export const updateDeliveryFormSchema = z.object({
  status: z.string(),
  driverId: z.string().optional().nullable(),
  vehicleId: z.string().optional().nullable(),
  recipientCompany: z.string().optional(),
  deliveryAddress: z.string().optional(),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  amount: z.string().optional(),
  currency: z.string().optional(),
});

export type CreateDeliveryInput = z.infer<typeof createDeliverySchema>;
export type CreateDeliveryFormInput = z.infer<typeof createDeliveryFormSchema>;
export type UpdateDeliveryFormInput = z.infer<typeof updateDeliveryFormSchema>;
export type UpdateDeliveryInput = z.infer<typeof updateDeliverySchema>;
