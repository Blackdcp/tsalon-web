import GitHub from '@auth/core/providers/github';
import { defineConfig } from 'auth-astro';

export default defineConfig({
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    jwt: ({ token, profile }) => {
      // Upon initial sign-in, profile contains the GitHub user profile
      if (profile?.id) {
        token.sub = profile.id.toString();
      }
      // Capture the GitHub LOGIN (username) so the leaderboard can show the
      // canonical GitHub handle instead of the free-text display name.
      if ((profile as any)?.login) {
        (token as any).login = (profile as any).login;
      }
      return token;
    },
    session: ({ session, token }) => {
      if (session?.user) {
        session.user.id = token.sub;
        if ((token as any).login) {
          (session.user as any).login = (token as any).login;
        }
      }
      return session;
    },
  },
});
