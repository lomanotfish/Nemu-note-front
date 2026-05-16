import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    // ครั้งแรกที่ login: account มี access_token จาก Google → เก็บใน JWT
    jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.accessTokenExpires = account.expires_at;
      }
      return token;
    },
    // ทุกครั้งที่ useSession() / auth() ถูกเรียก → expose ออกมาจาก JWT
    session({ session, token }) {
      session.accessToken = token.accessToken;
      return session;
    },
  },
});

declare module "@auth/core/jwt" {
  interface JWT {
    accessToken?: string;
    accessTokenExpires?: number;
  }
}

declare module "next-auth" {
  interface Session {
    accessToken?: string;
  }
}
