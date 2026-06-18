import { NextResponse } from "next/server";
import { assertDatabaseConfigured, prisma } from "@/lib/db";
import { verifyPassword, createSession, applySessionCookie } from "@/lib/auth";
import { loginSchema } from "@/lib/validations/auth";
import {
  databaseErrorResponse,
  isDatabaseError,
  unexpectedErrorResponse,
} from "@/lib/api-errors";

export async function POST(request: Request) {
  try {
    assertDatabaseConfigured();

    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            email: "Email invalide",
            password: "Mot de passe incorrect",
          },
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const email = parsed.data.email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email },
      include: { company: true },
    });
    if (!user) {
      return NextResponse.json(
        {
          error: {
            email: "Email invalide",
          },
        },
        { status: 401 },
      );
    }

    if (!verifyPassword(user?.passwordHash ?? "", parsed.data.password)) {
      return NextResponse.json(
        {
          error: {
            password: "Mot de passe incorrect",
          },
        },
        { status: 401 },
      );
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
    if (isDatabaseError(e)) {
      return databaseErrorResponse("auth/login", e);
    }
    return unexpectedErrorResponse("auth/login", e);
  }
}
