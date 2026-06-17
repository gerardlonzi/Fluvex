import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { verifyPassword, createSession, applySessionCookie } from "@/lib/auth";
import { loginSchema } from "@/lib/validations/auth";

function isDbAuthError(e: unknown): boolean {
  if (
    e instanceof Prisma.PrismaClientKnownRequestError ||
    e instanceof Prisma.PrismaClientUnknownRequestError ||
    e instanceof Prisma.PrismaClientInitializationError
  ) {
    return true;
  }
  if (e instanceof Error) {
    const msg = e.message.toLowerCase();
    return (
      msg.includes("authenticationfailed") ||
      msg.includes("scram failure") ||
      msg.includes("mongodb") ||
      msg.includes("server selection") ||
      msg.includes("timed out") ||
      msg.includes("econnrefused") ||
      msg.includes("connect")
    );
  }
  return false;
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

    const email = parsed.data.email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email },
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

    const session = await createSession(user.id, user.companyId);
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        companyId: user.companyId,
      },
      redirect: "/dashboard",
    });
    applySessionCookie(response, session);
    return response;
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
