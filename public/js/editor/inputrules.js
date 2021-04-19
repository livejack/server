import {
	inputRules, wrappingInputRule,
	smartQuotes, emDash, ellipsis
} from "/node_modules/@livejack/prosemirror";

export function blockQuoteRule(nodeType) {
	return wrappingInputRule(/^\s*>\s$/, nodeType);
}

export function orderedListRule(nodeType) {
	return wrappingInputRule(/^(\d+)\.\s$/, nodeType, match => ({order: +match[1]}),
		(match, node) => node.childCount + node.attrs.order == +match[1]);
}

export function bulletListRule(nodeType) {
	return wrappingInputRule(/^\s*([-+*])\s$/, nodeType);
}

export function buildInputRules(schema) {
	let rules = smartQuotes.concat(ellipsis, emDash), type;
	if ((type = schema.nodes.blockquote)) rules.push(blockQuoteRule(type));
	if ((type = schema.nodes.ordered_list)) rules.push(orderedListRule(type));
	if ((type = schema.nodes.bullet_list)) rules.push(bulletListRule(type));
	return inputRules({rules});
}
