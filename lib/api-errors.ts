import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

/** Message affiché à l'utilisateur — jamais de détails techniques. */
export const SERVICE_UNAVAILABLE_MESSAGE =
  "Le service est momentanément indisponible. Veuillez réessayer dans quelques instants.";

export const UNEXPECTED_ERROR_MESSAGE =
  "Une erreur inattendue s'est produite. Veuillez réessayer.";

export function isDatabaseError(error: unknown): boolean {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError ||
    error instanceof Prisma.PrismaClientUnknownRequestError ||
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientRustPanicError
  ) {
    return true;
  }

  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return (
      msg.includes("authenticationfailed") ||
      msg.includes("scram failure") ||
      msg.includes("bad auth") ||
      msg.includes("mongodb") ||
      msg.includes("server selection") ||
      msg.includes("mongo") ||
      msg.includes("timed out") ||
      msg.includes("econnrefused") ||
      msg.includes("enotfound") ||
      msg.includes("database_url") ||
      msg.includes("prisma")
    );
  }

  return false;
}

export function logApiError(scope: string, error: unknown) {
  if (error instanceof Error) {
    console.error(`[${scope}]`, error.message, error.stack);
    return;
  }
  console.error(`[${scope}]`, error);
}

export function databaseErrorResponse(scope: string, error: unknown) {
  logApiError(scope, error);
  return NextResponse.json({ error: SERVICE_UNAVAILABLE_MESSAGE }, { status: 503 });
}

export function unexpectedErrorResponse(scope: string, error: unknown) {
  logApiError(scope, error);
  return NextResponse.json({ error: UNEXPECTED_ERROR_MESSAGE }, { status: 500 });
}
