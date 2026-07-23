import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "./db";
import bcrypt from "bcryptjs";
import { AuthOptions } from "next-auth";

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
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
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        if (!user.email) return false;

        // Strictly search or create in the Guest database table.
        // Even if a Staff/Admin account exists with this email, Google login ONLY logs in as Guest.
        let guest = await prisma.guest.findUnique({
          where: { email: user.email }
        });

        if (!guest) {
          guest = await prisma.guest.create({
            data: {
              fullName: user.name || 'Google Guest',
              email: user.email,
              password: '', // OAuth users do not use passwords
              phone: '',
              nationality: '',
              idProofNum: '',
              isVerified: true
            }
          });
        }

        // Force session properties to strictly GUEST
        user.id = guest.id;
        (user as any).role = 'GUEST';
        (user as any).type = 'guest';
        delete (user as any).department;
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        // If logged in via Google, strictly force GUEST role and type
        if (account?.provider === 'google') {
          token.role = 'GUEST';
          token.type = 'guest';
          delete token.department;
        } else {
          token.role = (user as any).role || 'GUEST';
          token.type = (user as any).type || 'guest';
          token.department = (user as any).department;
        }
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
