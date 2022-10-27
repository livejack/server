import { ready } from './doc-events.js';
import { Matchdom, DomPlugin, DatePlugin } from "/node_modules/matchdom";
import * as DateFormats from "./date-formats.js";
import filters from "./filters.js";
import "./array-like.js";
import '/node_modules/@ungap/custom-elements';
import req from "./req.js";
import './elements/form.js';



document.body.reload = async () => {
	const url = new URL(document.location);
	const pathname = `/.api${url.pathname}/pages`;
	const pages = await req(pathname);
	const md = new Matchdom(DomPlugin, DatePlugin, DateFormats, { filters });
	for (const node of document.body.querySelectorAll('template')) {
		md.merge(node, { pages });
	}
	document.body.hidden = false;
};

ready(async () => {
	return document.body.reload();
});
