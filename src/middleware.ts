import { NextRequest } from "next/server";
import { proxy } from "./proxy";

export function middleware(request: NextRequest) {
  return proxy(request);
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
