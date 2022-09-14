export const title_page = /(title|credit|author[s]?|source|notes|draft date|date|watermark|contact( info)?|revision|copyright|font|tl|tc|tr|cc|br|bl|header|footer)\:.*/i;
export const section = /^[ \t]*(#+)(?: *)(.*)/;
export const synopsis = /^[ \t]*(?:\=(?!\=+) *)(.*)/;
export const scene_heading = /^[ \t]*([.](?![.])|(?:[*]{0,3}_?)(?:int|ext|est|int[.]?\/ext|i[.]?\/e)[. ])(.+?)(#[-.0-9a-z]+#)?$/i;
export const scene_number = /#(.+)#/;
export const transition = /^[ \t]*((?:FADE (?:TO BLACK|OUT)|CUT TO BLACK)\.|.+ TO\:|^TO\:$)|^(?:> *)(.+)/;
export const dialogue = /^[ \t]*([*_]+[^\p{Ll}\p{Lo}\p{So}\r\n]*)(\^?)?(?:\n(?!\n+))([\s\S]+)/u;
export const character = /^[ \t]*(?![#!]|(\[\[)|(SUPERIMPOSE:))(((?!@)[^\p{Ll}\r\n]*?\p{Lu}[^\p{Ll}\r\n]*?)|((@)[^\r\n]*?))(\(.*\))?(\s*\^)?$/u;
export const parenthetical = /^[ \t]*(\(.+\))$/;
export const action = /^(.+)/g;
export const centered = /^[ \t]*(?:> *)(.+)(?: *<)(\n.+)*/g;
export const page_break = /^\={3,}$/;
export const line_break = /^ {2}$/;
export const note_inline = /(?:\[{2}(?!\[+))([\s\S]+?)(?:\]{2}(?!\[+))/g;
export const emphasis = /(_|\*{1,3}|_\*{1,3}|\*{1,3}_)(.+)(_|\*{1,3}|_\*{1,3}|\*{1,3}_)/g;
export const bold_italic_underline = /(_{1}\*{3}(?=.+\*{3}_{1})|\*{3}_{1}(?=.+_{1}\*{3}))(.+?)(\*{3}_{1}|_{1}\*{3})/g;
export const bold_underline = /(_{1}\*{2}(?=.+\*{2}_{1})|\*{2}_{1}(?=.+_{1}\*{2}))(.+?)(\*{2}_{1}|_{1}\*{2})/g;
export const italic_underline = /(?:_{1}\*{1}(?=.+\*{1}_{1})|\*{1}_{1}(?=.+_{1}\*{1}))(.+?)(\*{1}_{1}|_{1}\*{1})/g;
export const bold_italic = /(\*{3}(?=.+\*{3}))(.+?)(\*{3})/g;
export const bold = /(\*{2}(?=.+\*{2}))(.+?)(\*{2})/g;
export const italic = /(\*{1}(?=.+\*{1}))(.+?)(\*{1})/g;
export const link = /(\[?(\[)([^\]\[]*\[?[^\]\[]*\]?[^\]\[]*)(\])(\()(.+?)(?:\s+(["'])(.*?)\4)?(\)))/g;
export const image = /(!\[?(\[)([^\]\[]*\[?[^\]\[]*[^\]\[]*)(\])(\()(.+?)(?:\s+(["'])(.*?)\4)?(\)))/g;
export const lyric = /^(\~.+)/g;
export const underline = /(_{1}(?=.+_{1}))(.+?)(_{1})/g;

export const regex: {[k: string]: RegExp} = {
    title_page,
    section,
    synopsis,
    scene_heading,
    scene_number,
    transition,
    dialogue,
    character,
    parenthetical,
    action,
    centered,
    page_break,
    line_break,
    note_inline,
    emphasis,
    bold_italic_underline,
    bold_underline,
    italic_underline,
    bold_italic,
    bold,
    italic,
    link,
    image,
    lyric,
    underline,
};
