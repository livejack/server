import { ready } from './doc-events.js';
import { Matchdom } from "/node_modules/matchdom";
import * as DatePlugin from "./date-plugin.js";
import filters from "./filters.js";
import "./array-like.js";
import '/node_modules/@ungap/custom-elements';
import req from "./req.js";
import './elements/form.js';

ready(async () => {
	const url = new URL(document.location);
	url.pathname = "/.api" + url.pathname;
	const pages = await req(url.pathname);
	const md = new Matchdom().extend([DatePlugin, { filters }]);
	md.merge(document.body, { pages });
	document.body.hidden = false;
});
