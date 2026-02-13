import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword, createSession, setSessionCookie } from "@/lib/auth";
import { loginSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Email ou mot de passe invalide", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email },
      include: { company: true },
    });
    if (!user?.passwordHash) {
      return NextResponse.json({ error: "Email ou mot de passe incorrect" }, { status: 401 });
    }

    if (!verifyPassword(user.passwordHash, parsed.data.password)) {
      return NextResponse.json({ error: "Email ou mot de passe incorrect" }, { status: 401 });
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
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
