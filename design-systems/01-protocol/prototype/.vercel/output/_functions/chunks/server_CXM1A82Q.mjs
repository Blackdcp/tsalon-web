import { Auth } from "@auth/core";
import { parseString } from "set-cookie-parser";
import GitHub from "@auth/core/providers/github";
//#region node_modules/auth-astro/src/config.ts
var defineConfig = (config) => {
	config.prefix ??= "/api/auth";
	config.basePath = config.prefix;
	return config;
};
//#endregion
//#region \0auth:config
var _auth_config_default = defineConfig({
	providers: [GitHub({
		clientId: process.env.GITHUB_CLIENT_ID,
		clientSecret: process.env.GITHUB_CLIENT_SECRET
	})],
	callbacks: { session: ({ session, token }) => {
		if (session?.user) session.user.id = token.sub;
		return session;
	} }
});
//#endregion
//#region node_modules/auth-astro/server.ts
var actions = [
	"providers",
	"session",
	"csrf",
	"signin",
	"signout",
	"callback",
	"verify-request",
	"error"
];
function AstroAuthHandler(prefix, options = _auth_config_default) {
	return async ({ cookies, request }) => {
		const url = new URL(request.url);
		const action = url.pathname.slice(prefix.length + 1).split("/")[0];
		if (!actions.includes(action) || !url.pathname.startsWith(prefix + "/")) return;
		const res = await Auth(request, options);
		if ([
			"callback",
			"signin",
			"signout"
		].includes(action)) {
			const getSetCookie = res.headers.getSetCookie();
			if (getSetCookie.length > 0) {
				getSetCookie.forEach((cookie) => {
					const { name, value, ...options2 } = parseString(cookie);
					cookies.set(name, value, options2);
				});
				res.headers.delete("Set-Cookie");
			}
		}
		return res;
	};
}
function AstroAuth(options = _auth_config_default) {
	const { AUTH_SECRET, AUTH_TRUST_HOST, VERCEL, NODE_ENV } = Object.assign({
		"ASSETS_PREFIX": void 0,
		"BASE_URL": "/",
		"DEV": false,
		"MODE": "production",
		"PROD": true,
		"SITE": "https://www.tsalon.tech",
		"SSR": true
	}, {
		AUTH_SECRET: "dummy12345678901234567890",
		NODE: "/Users/black/.nvm/versions/node/v22.23.2/bin/node",
		_: "/Users/black/Documents/T Salon/design-systems/01-protocol/prototype/node_modules/.bin/astro",
		NODE_ENV: "production"
	});
	options.secret ??= AUTH_SECRET;
	options.trustHost ??= !!(AUTH_TRUST_HOST ?? VERCEL ?? NODE_ENV !== "production");
	const { prefix = "/api/auth", ...authOptions } = options;
	const handler = AstroAuthHandler(prefix, authOptions);
	return {
		async GET(context) {
			return await handler(context);
		},
		async POST(context) {
			return await handler(context);
		}
	};
}
async function getSession(req, options = _auth_config_default) {
	options.secret ??= "dummy12345678901234567890";
	options.trustHost ??= true;
	const url = new URL(`${options.prefix}/session`, req.url);
	const response = await Auth(new Request(url, { headers: req.headers }), options);
	const { status = 200 } = response;
	const data = await response.json();
	if (!data || !Object.keys(data).length) return null;
	if (status === 200) return data;
	throw new Error(data.message);
}
//#endregion
export { getSession as n, AstroAuth as t };
