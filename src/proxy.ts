import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * PUBLIC_ROUTES – paths that never require authentication.
 * Everything else in the ecosystem is considered protected.
 */
const PUBLIC_ROUTES = ["/login", "/registro", "/landing", "/marketplace", "/canjes", "/rewards", "/afiliados", "/politica-de-cookies", "/checkout", "/lunaviajera"];

/**
 * SESSION_COOKIE – lightweight presence signal set by AuthContext on login/logout.
 * AuthContext sets/clears this cookie via document.cookie.
 */
const SESSION_COOKIE = "ta_session";
const VIP_PREVIEW_COOKIE = "ta_vip_preview";

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const hostHeader = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
  const hostname = hostHeader.toLowerCase().split(":")[0];
  const cleanPath = pathname.replace(/\/$/, "");

  // ─── 0. MODO VIP / PREVIEW PARA ENTRAR A LAS WEBS REALES (?vip=1) ──────────
  const vipParam = searchParams.get("vip") || searchParams.get("preview");
  if (vipParam === "1" || vipParam === "true") {
    const cleanUrl = new URL(request.url);
    cleanUrl.searchParams.delete("vip");
    cleanUrl.searchParams.delete("preview");
    const response = NextResponse.redirect(cleanUrl);
    response.cookies.set(VIP_PREVIEW_COOKIE, "1", {
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 días
      sameSite: "lax",
    });
    return response;
  }
  if (vipParam === "0" || vipParam === "false") {
    const cleanUrl = new URL(request.url);
    cleanUrl.searchParams.delete("vip");
    cleanUrl.searchParams.delete("preview");
    const response = NextResponse.redirect(cleanUrl);
    response.cookies.delete(VIP_PREVIEW_COOKIE);
    return response;
  }

  const hasVipAccess =
    request.cookies.get(VIP_PREVIEW_COOKIE)?.value === "1" ||
    Boolean(request.cookies.get(SESSION_COOKIE)?.value);

  // ─── 0.1 TELÓN TEASER 01/11 PARA ECOSISTEMA TRAVELAPP ──────────────────────
  const isTravelAppEcosystemHost =
    (hostname.includes("travelapp.ar") && !hostname.startsWith("admin.")) ||
    hostname.includes("lunaviajera");

  const isBypassedPath =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/assets") ||
    pathname.startsWith("/public") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/landing/") ||
    pathname.startsWith("/descargar") ||
    pathname.startsWith("/apk") ||
    pathname.includes(".");

  if (isTravelAppEcosystemHost && !hasVipAccess && !isBypassedPath) {
    return NextResponse.rewrite(new URL("/landing/preparate", request.url));
  }

  // ─── 1. DOMAIN-SPECIFIC REWRITES (TOP PRIORITY) ────────────────────────────

  // A) afiliados.travelapp.ar ➡️ Landing de Afiliados directamente
  if (hostname.includes("afiliados")) {
    if (cleanPath === "" || cleanPath === "/home") {
      return NextResponse.rewrite(new URL("/landing/afiliados", request.url));
    }
  }

  // B) experience.travelapp.ar ➡️ Landing de Experience & Marketplace Receptivo
  const isExperienceHost = (hostname.includes("experience") && !hostname.includes("travelapp.ar")) || hostname.startsWith("experience.");
  if (isExperienceHost) {
    if (cleanPath === "" || cleanPath === "/home") {
      return NextResponse.rewrite(new URL("/landing/experience", request.url));
    }
    if (cleanPath === "/marketplace" || cleanPath === "/marketplaces") {
      return NextResponse.rewrite(new URL("/landing/experience/marketplace", request.url));
    }
  }

  // C) rewards.travelapp.ar ➡️ Landing de Rewards directamente
  if (hostname.startsWith("rewards.")) {
    if (cleanPath === "" || cleanPath === "/home") {
      return NextResponse.rewrite(new URL("/landing/rewards", request.url));
    }
  }

  // D) travelcab.ar / www.travelcab.ar ➡️ Landing de TravelCab directamente
  if (hostname.includes("travelcab")) {
    if (cleanPath === "" || cleanPath === "/home") {
      return NextResponse.rewrite(new URL("/landing/travelcab", request.url));
    }
  }

  // E) lunaviajera.travelapp.ar / lunaviajera.ar ➡️ Landing de Luna Viajera directamente
  if (hostname.includes("lunaviajera")) {
    if (cleanPath === "" || cleanPath === "/home") {
      return NextResponse.rewrite(new URL("/landing/lunaviajera", request.url));
    }
    if (cleanPath === "/experiencias" || cleanPath === "/excursiones") {
      return NextResponse.rewrite(new URL("/landing/lunaviajera#experiencias", request.url));
    }
  }

  // ─── 2. GLOBAL PUBLIC REWRITES ─────────────────────────────────────────────

  // La landing pública de Luna Viajera
  if (cleanPath === "/lunaviajera") {
    return NextResponse.rewrite(new URL("/landing/lunaviajera", request.url));
  }

  // El catálogo de canjes de Rewards funciona públicamente en cualquier dominio
  if (cleanPath === "/canjes") {
    return NextResponse.rewrite(new URL("/landing/rewards/canjes", request.url));
  }

  // La landing pública de Rewards
  if (cleanPath === "/rewards") {
    return NextResponse.rewrite(new URL("/landing/rewards", request.url));
  }

  // La landing pública de Afiliados
  if (cleanPath === "/afiliados") {
    return NextResponse.rewrite(new URL("/landing/afiliados", request.url));
  }

  // ─── 3. INSTITUTIONAL ROOT REWRITE ──────────────────────────────────────────
  if (hostname.includes("travelapp.ar") && !hostname.startsWith("admin.") && !hostname.startsWith("experience.") && !hostname.startsWith("rewards.") && !hostname.startsWith("afiliados.") && !hostname.startsWith("lunaviajera.")) {
    if (cleanPath === "" || cleanPath === "/home") {
      // travelapp.ar/ ➡️ landing institucional (ecosistema)
      return NextResponse.rewrite(new URL("/landing/ecosistema", request.url));
    }
    if (cleanPath === "/experience") {
      return NextResponse.rewrite(new URL("/landing/experience", request.url));
    }
    if (cleanPath === "/rewards") {
      return NextResponse.rewrite(new URL("/landing/rewards", request.url));
    }
    if (cleanPath === "/afiliados") {
      return NextResponse.rewrite(new URL("/landing/afiliados", request.url));
    }
  }

  // ─── 2. ALLOW PUBLIC ROUTES WITHOUT AUTH CHECK ─────────────────────────────
  const isPublic = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
  if (isPublic) {
    return NextResponse.next();
  }

  // ─── 3. ALLOW NEXT.JS INTERNALS AND STATIC FILES ───────────────────────────
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/assets") ||
    pathname.startsWith("/public") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // ─── 4. CHECK SESSION COOKIE ────────────────────────────────────────────────
  const session = request.cookies.get(SESSION_COOKIE);
  if (!session || !session.value) {
    const loginUrl = new URL("/login", request.url);
    // Preserve the originally requested URL so we can redirect back after login
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ─── 5. AUTHENTICATED DOMAIN REWRITES ──────────────────────────────────────
  // travelapp.ar/admin → dashboard principal (requiere sesión activa)
  if (hostname.includes("travelapp.ar") && pathname === "/admin") {
    return NextResponse.rewrite(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  /*
   * Match all routes EXCEPT:
   *  - _next/static  (static files)
   *  - _next/image   (image optimization)
   *  - favicon.ico
   */
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
