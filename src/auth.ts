import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Mock authorization for Phase 2 UI testing.
        // In Phase 3, this will connect to the Prisma database and bcrypt compare.
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
    jwt({ token, user }) {
      if (user) { // User is available during sign-in
        token.role = (user as any).role
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role
      }
      return session
    },
  },
  pages: {
    signIn: '/login', // Will build this UI next if needed
  },
  session: { strategy: "jwt" },
})
