import { FountainConfig } from "../configloader";
import helpers from "../helpers";
import { token } from "../token";
import { htmlreplacements } from "./htmlreplacements";
import { lexer } from "./lexer";
import { FountainToken, ParsedOutput } from "./ParsedOutput";

export function generateHtml(result: ParsedOutput, config: FountainConfig): {
    scriptHtml: string,
    titleHtml: string | undefined
 } {
    var html: string[] = [];
    var titlehtml: string[] = [];
    var header: FountainToken | undefined = undefined;
    var footer: FountainToken | undefined = undefined;
    //Generate html for title page
    if(result.title_page){
        for (const section of Object.keys(result.title_page)) {
            result.title_page[section].sort(helpers.sort_index);
            titlehtml.push(`<div class="titlepagesection" data-position="${section}">`);
            let current_index = 0/*, previous_type = null*/;
            while (current_index < result.title_page[section].length) {
                var current_token: token = result.title_page[section][current_index];
                if(current_token.ignore){
                    current_index++;
                    continue;
                }
                if (current_token.text != "") {
                    current_token.html = lexer(current_token.text, undefined, htmlreplacements, true);
                }
                switch (current_token.type) {
                    case 'title': titlehtml.push(`<h1 class="haseditorline titlepagetoken" id="sourceline_${current_token.line}">${current_token.html}</h1>`); break;
                    case 'header': header = current_token; break;
                    case 'footer': footer = current_token; break;
                    default: titlehtml.push(`<p class="${current_token.type} haseditorline titlepagetoken" id="sourceline_${current_token.line}">${current_token.html}</p>`); break;
                }
                current_index++;
            }
            titlehtml.push(`</div>`);
        }
    }
    if(header)
        html.push(`<div class="header" id="sourceline_${header.line}">${header.html}</div>`);
    else if(config.print_header)
        html.push(`<div class="header">${lexer(config.print_header, undefined, htmlreplacements, true)}</div>`);

    if(footer)
        html.push(`<div class="footer" id="sourceline_${footer.line}">${footer.html}</div>`);
    else if(config.print_footer)
        html.push(`<div class="footer">${lexer(config.print_footer, undefined, htmlreplacements, true)}</div>`);



    //Generate html for script
    let current_index = 0;
    var isaction = false;
    while (current_index < result.tokens.length) {
        var current_token: token = result.tokens[current_index];
        if (current_token.text != "") {
            current_token.html = lexer(current_token.text, current_token.type, htmlreplacements);
        } else {
            current_token.html = "";
        }

        if ((current_token.type == "action" || current_token.type == "centered") && !current_token.ignore) {
            let classes = "haseditorline";

            let elStart = "\n";
            if(!isaction) elStart = "<p>" //first action element
            if(current_token.type == "centered"){
                if(isaction) elStart = ""; //It's centered anyway, no need to add anything
                classes += " centered";
            }
            html.push(`${elStart}<span class="${classes}" id="sourceline_${current_token.line}">${current_token.html}</span>`);
            
            isaction = true;
        }
        else if (current_token.type == "separator" && isaction) {
            if (current_index + 1 < result.tokens.length - 1) {
                //we're not at the end
                var next_type = result.tokens[current_index + 1].type
                if (next_type == "action" || next_type == "separator" || next_type == "centered") {
                    html.push("\n");
                }
            }
            else if (isaction) {
                //we're at the end
                html.push("</p>")
            }
        }
        else {
            if (isaction) {
                //no longer, close the paragraph
                isaction = false;
                html.push("</p>");
            }
            switch (current_token.type) {
                case 'scene_heading':
                    var content = current_token.html;
                    if (config.embolden_scene_headers) {
                        content = '<span class=\"bold haseditorline\" id="sourceline_' + current_token.line + '">' + content + '</span>';
                    }

                    html.push('<h3 class="haseditorline" data-scenenumber=\"' + current_token.number + '\" data-position=\"' + current_token.line + '\" ' + (current_token.number ? ' id=\"sourceline_' + current_token.line + '">' : '>') + content + '</h3>');
                    break;
                case 'transition': html.push('<h2 class="haseditorline" id="sourceline_' + current_token.line + '">' + current_token.text + '</h2>'); break;

                case 'dual_dialogue_begin': html.push('<div class=\"dual-dialogue\">'); break;

                case 'dialogue_begin': html.push('<div class=\"dialogue' + (current_token.dual ? ' ' + current_token.dual : '') + '\">'); break;

                case 'character':
                    if (current_token.dual == "left") {
                        html.push('<div class=\"dialogue left\">');
                    } else if (current_token.dual == "right") {
                        html.push('</div><div class=\"dialogue right\">');
                    }

                    if (config.print_dialogue_numbers) {
                        html.push('<h4 class="haseditorline" id="sourceline_' + current_token.line + '">' + current_token.takeNumber + ' – ' + current_token.text + '</h4>');
                    } else {
                        html.push('<h4 class="haseditorline" id="sourceline_' + current_token.line + '">' + current_token.text + '</h4>');
                    }

                    break;
                case 'parenthetical': html.push('<p class="haseditorline parenthetical\" id="sourceline_' + current_token.line + '" >' + current_token.html + '</p>'); break;
                case 'dialogue':
                    if (current_token.text == "  ")
                        html.push('<br>');
                    else
                        html.push('<p class="haseditorline" id="sourceline_' + current_token.line + '">' + current_token.html + '</p>');
                    break;
                case 'dialogue_end': html.push('</div> '); break;
                case 'dual_dialogue_end': html.push('</div></div> '); break;

                case 'section': html.push('<p class="haseditorline section" id="sourceline_' + current_token.line + '" data-position=\"' + current_token.line + '\" data-depth=\"' + current_token.level + '\">' + current_token.text + '</p>'); break;
                case 'synopsis': html.push('<p class="haseditorline synopsis" id="sourceline_' + current_token.line + '" >' + current_token.html + '</p>'); break;
                case 'lyric': html.push('<p class="haseditorline lyric" id="sourceline_' + current_token.line + '">' + current_token.html + '</p>'); break;

                case 'note': html.push('<p class="haseditorline note" id="sourceline_' + current_token.line + '">' + current_token.html + '</p>'); break;
                case 'boneyard_begin': html.push('<!-- '); break;
                case 'boneyard_end': html.push(' -->'); break;

                case 'page_break': html.push('<hr />'); break;
                /* case 'separator':
                     html.push('<br />');
                     break;*/
            }
        }

        //This has to be dealt with later, the tokens HAVE to stay, to keep track of the structure
        /*
        if (
            (!cfg.print_actions && current_token.is("action", "transition", "centered", "shot")) ||
            (!cfg.print_notes && current_token.type === "note") ||
            (!cfg.print_headers && current_token.type === "scene_heading") ||
            (!cfg.print_sections && current_token.type === "section") ||
            (!cfg.print_synopsis && current_token.type === "synopsis") ||
            (!cfg.print_dialogues && current_token.is_dialogue()) ||
            (cfg.merge_multiple_empty_lines && current_token.is("separator") && previous_type === "separator")) {

            result.tokens.splice(current_index, 1);
            continue;
        }
        */

        //previous_type = current_token.type;
        current_index++;
    }
    const scriptHtml = html.join('');
    return {
        scriptHtml,
        titleHtml: titlehtml?.join('')
    }
}