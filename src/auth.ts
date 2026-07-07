import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Try database lookup first (for newly registered users)
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        });

        if (user && user.password_hash === credentials.password) {
          const emailStr = user.email || "";
          return { id: user.id, name: user.name || emailStr.split("@")[0], email: user.email, role: user.role };
        }

        // Mock authorization for local testing
        if (credentials?.email === "admin@consultancy.com" && credentials?.password === "admin") {
          return { id: "1", name: "Admin User", email: "admin@consultancy.com", role: "ADMIN" }
        }
        if (credentials?.email === "counselor@consultancy.com" && credentials?.password === "counselor") {
          return { id: "2", name: "John Doe", email: "counselor@consultancy.com", role: "COUNSELOR" }
        }
        if (credentials?.email === "student@gmail.com" && credentials?.password === "student") {
          return { id: "3", name: "Student", email: "student@gmail.com", role: "STUDENT" }
        }
        return null
      }
    })
  ],
  callbacks: {
    jwt({ token, user, trigger, session }) {
      if (user) { // User is available during sign-in
        token.role = (user as any).role
        token.name = user.name
      }
      if (trigger === "update" && session?.name) token.name = session.name
      return token
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role
        session.user.name = token.name || session.user.name
      }
      return session
    },
  },
  pages: {
    signIn: '/login', // Will build this UI next if needed
  },
  session: { strategy: "jwt" },
})
