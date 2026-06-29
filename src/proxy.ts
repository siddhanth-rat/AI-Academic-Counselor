import { auth } from "@/auth"

export default auth((req) => {
  const url = req.nextUrl
  const isLoggedIn = !!req.auth
  const role = req.auth?.user ? (req.auth.user as any).role : "GUEST"

  // 1. Dashboard is protected for Counselors and Admins
  if (url.pathname.startsWith('/dashboard')) {
    /* Temporarily disabled for UI demo without database
    if (!isLoggedIn) {
      return Response.redirect(new URL('/login', req.nextUrl))
    }
    if (role !== "COUNSELOR" && role !== "ADMIN") {
      return Response.redirect(new URL('/', req.nextUrl))
    }
    */
  }

  // 2. Admin routes are protected for Admins only
  if (url.pathname.startsWith('/admin')) {
    if (!isLoggedIn) {
      return Response.redirect(new URL('/login', req.nextUrl))
    }
    if (role !== "ADMIN") {
      return Response.redirect(new URL('/', req.nextUrl))
    }
  }

  // Allow all other routes (e.g. '/' for guests to chat)
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
