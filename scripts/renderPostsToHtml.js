import { rp2h } from './rp2h.js'

rp2h().catch(err => {
	console.error(err);
	process.exit(1);
});