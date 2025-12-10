import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// Credenziali hardcodate
const validCredentials = {
  email: "xxx",
  password: "xxxx",
};

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "user@example.com",
        },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Verificare le credenziali
        if (
          credentials?.email === validCredentials.email &&
          credentials?.password === validCredentials.password
        ) {
          return {
            id: "1",
            email: credentials.email,
            name: "Test User",
          };
        }
        // Se le credenziali non sono valide, ritorna null
        return null;
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.id;
        session.user.email = token.email;
      }
      return session;
    },
  },
});

export { handler as GET, handler as POST };
