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

function buildSmartQuotes({ apostrophe, open, close }) {
	return [
		new InputRule(
			// single quote between letters is an apostrophe
			new RegExp("\\p{Letter}(')\\p{Letter}$", "u"), apostrophe
		),
		new InputRule(
			// starting single quote after opening is left alone
			new RegExp(`(?:^|\\s)${open}[^${close}]*\\s(')$`), "'"
		),
		new InputRule(
			// ending single quote after single quote is left alone
			new RegExp(`(?:^|\\s)'.*\\p{Letter}(')$`, "u"), "'"
		),
		new InputRule(
			// starting double quote after opening is left alone
			new RegExp(`(?:^|\\s)${open}[^${close}]*\\s(")$`), '"'
		),
		new InputRule(
			// ending double quote after starting double quote is left alone
			new RegExp(`(?:^|\\s|${open}|\\()"[^"]*\\p{Letter}(")$`, "u"), '"'
		),
		new InputRule(
			// starting double quote becomes an opening quote
			new RegExp(`(?:^|\\s)(")$`), open
		),
		new InputRule(
			// ending double quote becomes a closing quote
			new RegExp(`(?:^|\\s)${open}[^${open}]*(?:\\p{Letter}|'|"|\\))(")$`, "u"), close
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
