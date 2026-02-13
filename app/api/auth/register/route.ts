import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, createSession, setSessionCookie } from "@/lib/auth";
import { registerCompanySchema, registerUserSchema, registerSecuritySchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const companyData = registerCompanySchema.safeParse({
      companyName: body.companyName,
      email: body.email,
      address: body.address,
      city: body.city,
      country: body.country ?? "FR",
      fleetSize: body.fleetSize,
      industry: body.industry ?? "logistics",
    });
    const userData = registerUserSchema.safeParse({
      firstName: body.firstName,
      lastName: body.lastName,
      phone: body.phone,
      jobTitle: body.jobTitle,
    });
    const securityData = registerSecuritySchema.safeParse({
      password: body.password,
      confirmPassword: body.confirmPassword,
      agreeTerms: body.agreeTerms,
    });

    if (!companyData.success) {
      return NextResponse.json(
        { error: "Données entreprise invalides", details: companyData.error.flatten() },
        { status: 400 }
      );
    }
    if (!userData.success) {
      return NextResponse.json(
        { error: "Données utilisateur invalides", details: userData.error.flatten() },
        { status: 400 }
      );
    }
    if (!securityData.success) {
      return NextResponse.json(
        { error: "Mot de passe ou CGU invalides", details: securityData.error.flatten() },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({
      where: { email: body.email },
    });
    if (existing) {
      return NextResponse.json({ error: "Un compte existe déjà avec cet email" }, { status: 409 });
    }

    const company = await prisma.company.create({
      data: {
        name: companyData.data.companyName,
        email: companyData.data.email,
        address: companyData.data.address,
        city: companyData.data.city,
        country: companyData.data.country,
        fleetSize: companyData.data.fleetSize ?? null,
        industry: companyData.data.industry,
      },
    });

    const user = await prisma.user.create({
      data: {
        email: companyData.data.email,
        passwordHash: hashPassword(securityData.data.password),
        firstName: userData.data.firstName,
        lastName: userData.data.lastName,
        phone: userData.data.phone ?? null,
        jobTitle: userData.data.jobTitle ?? null,
        companyId: company.id,
      },
    });

    await prisma.notificationPreference.create({
      data: {
        companyId: company.id,
        shipments: true,
        fleet: true,
        billing: false,
      },
    });

    const session = createSession(user.id, company.id);
    await setSessionCookie(session);

    // Créer une notification de bienvenue
    await prisma.alert.create({
      data: {
        companyId: company.id,
        type: 'OTHER',
        title: 'Bienvenue sur Fluvex !',
        description: `Bienvenue ${user.firstName} ${user.lastName} ! Votre compte a été créé avec succès. Commencez à gérer votre flotte dès maintenant.`,
      },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        companyId: company.id,
      },
    });
  } catch (e) {
    console.error("Register error:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
