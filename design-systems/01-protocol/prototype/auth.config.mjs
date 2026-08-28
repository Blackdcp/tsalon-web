import GitHub from '@auth/core/providers/github';
import { defineConfig } from 'auth-astro';

export default defineConfig({
  // Vercel serves behind a proxy; Auth.js requires trustHost in this setup or
  // it refuses to set session cookies (login appears to "not stick").
  trustHost: true,
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      // GitHub includes `iss=https://github.com/login/oauth` in the authorization
      // response. Auth.js otherwise uses its placeholder issuer here and
      // rejects the callback before exchanging the code.
      issuer: 'https://github.com/login/oauth',
    }),
  ],
  callbacks: {
    jwt: ({ token, profile }) => {
      // Upon initial sign-in, profile contains the GitHub user profile
      const p = /** @type {any} */ (profile);
      const t = /** @type {any} */ (token);
      if (p?.id) {
        t.sub = p.id.toString();
      }
      // Capture the GitHub LOGIN (username) so the leaderboard can show the
      // canonical GitHub handle instead of the free-text display name.
      if (p?.login) {
        t.login = p.login;
      }
      return t;
    },
    session: ({ session, token }) => {
      const s = /** @type {any} */ (session);
      const t = /** @type {any} */ (token);
      if (s?.user) {
        s.user.id = t.sub;
        if (t?.login) {
          s.user.login = t.login;
        }
      }
      return s;
    },
  },
});
