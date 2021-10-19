import {
	inputRules, wrappingInputRule,
	emDash, ellipsis, InputRule
} from "/node_modules/@livejack/prosemirror";

export function blockQuoteRule(nodeType) {
	return wrappingInputRule(/^\s*>\s$/, nodeType);
}

export function orderedListRule(nodeType) {
	return wrappingInputRule(/^(\d+)\.\s$/, nodeType, (match) => {
		return { order: Number(match[1]) };
	}, (match, node) => {
		node.childCount + node.attrs.order == Number(match[1]);
	});
}

export function bulletListRule(nodeType) {
	return wrappingInputRule(/^\s*([-+*])\s$/, nodeType);
}

function buildSmartQuotes([apostrophe, singleOpen, singleClose, doubleOpen, doubleClose]) {
	return [
		new InputRule(
			/(?:\p{Letter})(')\p{Letter}$/u, apostrophe
		),
		new InputRule(
			new RegExp(`(?:^|[\\s{[(<'"${singleOpen}${doubleOpen}])(")$`),
			doubleOpen
		),
		new InputRule(
			/"$/, doubleClose
		),
		new InputRule(
			new RegExp(`(?:^|[\\s{[(<'"${singleOpen}${doubleOpen}])(')$`),
			singleOpen
		),
		new InputRule(
			/(?:\p{Letter})(')[^\p{Letter}]$/u, singleClose
		)
	];
}

export function buildInputRules(schema, { quotes }) {
	const rules = [ellipsis, emDash];
	if (quotes) rules.push(...buildSmartQuotes(quotes));
	let type;
	if ((type = schema.nodes.blockquote)) rules.push(blockQuoteRule(type));
	if ((type = schema.nodes.ordered_list)) rules.push(orderedListRule(type));
	if ((type = schema.nodes.bullet_list)) rules.push(bulletListRule(type));
	return inputRules({ rules });
}
