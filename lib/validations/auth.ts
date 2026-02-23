import { z } from "zod";

export const registerCompanySchema = z.object({
  companyName: z.string().min(1, "Nom requis"),
  email: z.string().email("Email invalide"),
  address: z.string().min(1, "Adresse requise"),
  country: z.string().default("FR"),
  fleetSize: z.string().optional(),
  industry: z.string().default("logistics"),
});

export const registerUserSchema = z.object({
  firstName: z.string().min(1, "Prénom requis"),
  lastName: z.string().min(1, "Nom requis"),
  phone: z.string().optional(),
  jobTitle: z.string().optional(),
});

export const registerSecuritySchema = z.object({
  password: z.string().min(8, "8 caractères minimum"),
  confirmPassword: z.string(),
  agreeTerms: z.literal(true),
}).refine((d) => d.password === d.confirmPassword, { message: "Mots de passe différents", path: ["confirmPassword"] });

export const loginSchema = z.object({
  email: z.string().min(1, "L'email est requis.").email("Adresse email invalide."),
  password: z.string().min(1, "Le mot de passe est requis."),
});

/** Schéma combiné pour le formulaire d'inscription (étapes 1-2-3) */
export const registerFormSchema = z.object({
  companyName: z.string().min(1, "Nom de l'entreprise requis"),
  email: z.string().min(1, "Email requis").email("Email invalide"),
  address: z.string().min(1, "Adresse requise"),
  country: z.string().min(1, "Pays requis"),
  fleetSize: z.string().min(1, "Taille de flotte requise"),
  industry: z.string().min(1, "Secteur requis"),
  firstName: z.string().min(1, "Prénom requis"),
  lastName: z.string().min(1, "Nom requis"),
  phone: z.string().min(1, "Numéro de téléphone requis"),
  password: z.string().min(1, "Mot de passe requis").min(8, "8 caractères minimum"),
  confirmPassword: z.string().min(1, "Confirmation requise"),
  agreeTerms: z.boolean().refine((v) => v === true, { message: "Vous devez accepter les conditions" }),
}).refine((d) => d.password === d.confirmPassword, { message: "Les mots de passe ne correspondent pas", path: ["confirmPassword"] });

export type RegisterCompanyInput = z.infer<typeof registerCompanySchema>;
export type RegisterUserInput = z.infer<typeof registerUserSchema>;
export type RegisterFormInput = z.infer<typeof registerFormSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
