import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { verifyPassword, createSession, setSessionCookie } from "@/lib/auth";
import { loginSchema } from "@/lib/validations/auth";

function isDbAuthError(e: unknown): boolean {
  return (
    e instanceof Prisma.PrismaClientKnownRequestError ||
    e instanceof Prisma.PrismaClientUnknownRequestError ||
    (e instanceof Error &&
      (e.message.includes("AuthenticationFailed") || e.message.includes("SCRAM failure")))
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error:{
          email: "Email invalide",
          password: "Mot de passe incorrect",
        },
          details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email },
      include: { company: true },
    });
    if (!user) {
      return NextResponse.json({ error:{
        email: "Email invalide",
      } }, { status: 401 });
    }

    if (!verifyPassword(user?.passwordHash ?? '', parsed.data.password)) {
      return NextResponse.json({ error:{
        password: "Mot de passe incorrect",
      } }, { status: 401 });
    }

    const session = createSession(user.id, user.companyId);
    await setSessionCookie(session);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        companyId: user.companyId,
      },
      redirect: "/dashboard",
    });
  } catch (e) {
    console.error("Login error:", e);
    if (isDbAuthError(e)) {
      return NextResponse.json(
        { error: "Connexion à la base de données impossible. Vérifiez DATABASE_URL dans .env." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
