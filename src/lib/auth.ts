import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./db";
import bcrypt from "bcryptjs";
import { AuthOptions } from "next-auth";

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
        roleType: { label: "Role Type", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        const { email, password, roleType } = credentials;
        
        if (roleType === 'STAFF') {
          const staff = await prisma.staff.findUnique({
            where: { email },
            include: { department: true }
          });
          if (staff && bcrypt.compareSync(password, staff.password)) {
            return {
              id: staff.id,
              name: staff.fullName,
              email: staff.email,
              role: staff.role,
              type: 'staff',
              department: staff.department.name
            } as any;
          }
        } else {
          const guest = await prisma.guest.findUnique({
            where: { email }
          });
          if (guest && bcrypt.compareSync(password, guest.password)) {
            if (!guest.isVerified) return null;
            return {
              id: guest.id,
              name: guest.fullName,
              email: guest.email,
              role: 'GUEST',
              type: 'guest'
            } as any;
          }
        }
        return null;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.type = (user as any).type;
        token.department = (user as any).department;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).type = token.type;
        (session.user as any).department = token.department;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
