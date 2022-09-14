import {
    regex,
    note_inline as note_inline_regex,
    link as link_regex
} from './regex';
import { LexerReplacements } from "./LexerReplacements";

export function lexer(s: string, type: string | undefined, replacer: LexerReplacements, titlepage: boolean = false) {
    if (!s) {
        return s;
    }

    var styles = ['underline', 'italic', 'bold', 'bold_italic', 'italic_underline', 'bold_underline', 'bold_italic_underline'], i = styles.length, style, match;

    if (titlepage) {
        s = s.replace(link_regex, replacer.link);
    }
    s = s.replace(note_inline_regex, replacer.note).replace(/\\\*/g, '[star]').replace(/\\_/g, '[underline]').replace(/\n/g, replacer.line_break);

    // if (emphasis.test(s)) {                         // this was causing only every other occurence of an emphasis syntax to be parsed
    while (i--) {
        style = styles[i];
        match = regex[style];

        if (match.test(s)) {
            s = s.replace(match, replacer[style]);
        }
    }
    // }
    s = s.replace(/\[star\]/g, '*').replace(/\[underline\]/g, '_');
    if (type != "action")
        s = s.trim();
    return s;
}
