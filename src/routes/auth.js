const Router = require('express-promise-router');
const { WorkOS } = require('@workos-inc/node');
const db = require('../db');

const router = new Router();
const workos = new WorkOS(process.env.WORKOS_API_KEY);

router.get('/', (_req, res) => {
	const authorizationUrl = workos.sso.getAuthorizationURL({
		organization: process.env.WORKOS_ORG_ID,
		redirectURI: process.env.WORKOS_REDIRECT_URI,
		clientID: process.env.WORKOS_CLIENT_ID,
	});

	res.redirect(authorizationUrl);
});

router.get('/callback', async (req, res) => {
	const { code } = req.query;

	// get the user’s details from their identity provider
	const { profile } = await workos.sso.getProfileAndToken({
		code,
		clientID: process.env.WORKOS_CLIENT_ID,
	});

	req.session.user = profile;

	// get the app ID and saved roles from the app DB
	const user = await db.getUserByEmail(req.session.user.email);
	req.session.user.id = user.id;
	req.session.user.roles = user.roles;

	res.redirect('/dashboard');
});

router.get('/logout', (req, res) => {
	req.session.user = null;
	req.session.save();

	res.redirect('/');
});

module.exports = router;
