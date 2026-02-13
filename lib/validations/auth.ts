import { z } from "zod";

export const registerCompanySchema = z.object({
  companyName: z.string().min(1, "Nom requis"),
  email: z.string().email("Email invalide"),
  address: z.string().min(1, "Adresse requise"),
  city: z.string().min(1, "Ville requise"),
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
  email: z.string().email(),
  password: z.string().min(1),
});

export type RegisterCompanyInput = z.infer<typeof registerCompanySchema>;
export type RegisterUserInput = z.infer<typeof registerUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
