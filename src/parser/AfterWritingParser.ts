import { calculateDialogueDuration, trimCharacterExtension, trimCharacterForceSymbol } from "../utils";
import { create_token, token } from "../token";
import { getFountainConfig } from "../configloader";
import { latestSectionOrScene } from "./latestSectionOrScene";
import { defaultParsedOutput, ParsedOutput, StructToken } from ".";
import {
    note_inline as note_inline_regex,
    title_page as title_page_regex,
    line_break as line_break_regex,
    scene_heading as scene_heading_regex,
    scene_number as scene_number_regex,
    page_break as page_break_regex,
    centered as centered_regex,
    transition as transition_regex,
    synopsis as synopsis_regex,
    section as section_regex,
    character as character_regex,
    parenthetical as parenthetical_regex
} from './regex';
import { Position, Range } from "vscode";
import { titlePageDisplay } from "./titlePageDisplay";
import { AddDialogueNumberDecoration } from "../providers/Decorations";
import { pushLocationMetadata } from "./pushLocationMetadata";

export function matchedRange(linenumber: number, match: RegExpMatchArray, i: number): Range {
    return new Range(new Position(linenumber, 0), new Position(linenumber, match[i].length + 4));
}


export class AfterwritingParser {
    private result: ParsedOutput = defaultParsedOutput();
    private nested_comments = 0;

    private title_page_started = false;
    private lines_length = 0;
    private current = 0;
    private scene_number = 1;
    private current_depth = 0;
    private thistoken: token;
    private last_was_separator = false;
    // top_or_separated = false;
    private token_category = "none";
    private state = "normal";

    private lengthActionSoFar = 0; //total action length until the previous scene header
    private lengthDialogueSoFar = 0; //total dialogue length until the previous scene header
    private takeCount = 1; //total number of takes
    private ignoredLastToken = false;

    private lines: string[] = [];

    private last_title_page_token: token | undefined;
    private last_character_index: number = -1;
    private dual_right: boolean = false;
    private previousCharacter: string | undefined;
    private cache_state_for_comment: string | undefined;

    constructor(private script: string, private config = getFountainConfig()) {

    }

    private reduceComment(prev: string, current: string): string {
        if (current === "/*") {
            this.nested_comments++;
        } else if (current === "*/") {
            this.nested_comments--;
        } else if (!this.nested_comments) {
            prev = prev + current;
        }
        return prev;
    }

    private pushToken(token: token, line: number | undefined): void {
        this.result.tokens.push(token);
        if (line)
            this.result.tokenLines[line] = this.result.tokens.length - 1;
    }

    private updatePreviousSceneLength() {
        var action = this.result.lengthAction - this.lengthActionSoFar;
        var dialogue = this.result.lengthDialogue - this.lengthDialogueSoFar;
        this.lengthActionSoFar = this.result.lengthAction;
        this.lengthDialogueSoFar = this.result.lengthDialogue;

        if (this.result.properties.scenes.length > 0) {
            this.result.properties.scenes[this.result.properties.scenes.length - 1].actionLength = action;
            this.result.properties.scenes[this.result.properties.scenes.length - 1].dialogueLength = dialogue;
        }
    }

    private processInlineNote(text: string, linenumber: number): number {
        let irrelevantTextLength = 0;
        const match = text.match(note_inline_regex);
        if (match) {
            var level = latestSectionOrScene(this.result.properties, this.current_depth + 1, () => true);
            if (level) {
                level.notes = level.notes || [];
                for (let i = 0; i < match.length; i++) {
                    match[i] = match[i].slice(2, match[i].length - 2);
                    level.notes.push({ note: match[i], line: this.thistoken.line });
                    irrelevantTextLength += match[i].length + 4;
                }
            }
            else {
                for (let i = 0; i < match.length; i++) {
                    match[i] = match[i].slice(2, match[i].length - 2);
                    this.result.properties.structure.push({
                        text: match[i],
                        id: '/' + linenumber,
                        isnote: true,
                        children: [],
                        level: 0,
                        notes: [],
                        range: matchedRange(linenumber, match, i),
                        section: false,
                        synopses: []
                    });
                    irrelevantTextLength += match[i].length + 4;
                }
            }
        }
        return irrelevantTextLength;
    }
    private processDialogueBlock(token: token): void {
        let textWithoutNotes = token.text.replace(note_inline_regex, "");
        this.processInlineNote(token.text, token.line);
        token.time = calculateDialogueDuration(textWithoutNotes);
        if (!this.config.print_notes) {
            token.text = textWithoutNotes;
            if (token.text.trim().length == 0)
                token.ignore = true;
        }
        this.result.lengthDialogue += token.time;
    }
    private processActionBlock(token: token): void {
        let irrelevantActionLength = this.processInlineNote(token.text, token.line);
        token.time = (token.text.length - irrelevantActionLength) / 20;
        if (!this.config.print_notes) {
            token.text = token.text.replace(note_inline_regex, "");
            if (token.text.trim().length == 0)
                token.ignore = true;
        }
        this.result.lengthAction += token.time;
    }

    private handleBlankLine(line_number: number) {
        const skip_separator = (this.config.merge_multiple_empty_lines && this.last_was_separator) ||
            (this.ignoredLastToken && this.result.tokens.length > 1 && this.result.tokens[this.result.tokens.length - 1].type == "separator");

        if (this.ignoredLastToken) this.ignoredLastToken = false;

        if (this.state == "dialogue")
            this.pushToken(create_token(undefined, undefined, undefined, undefined, "dialogue_end"), line_number);
        if (this.state == "dual_dialogue")
            this.pushToken(create_token(undefined, undefined, undefined, undefined, "dual_dialogue_end"), line_number);
        this.state = "normal";


        if (skip_separator || this.state === "title_page") {
            return;
        }

        this.dual_right = false;
        this.thistoken.type = "separator";
        this.last_was_separator = true;
        this.pushToken(this.thistoken, line_number);
    }


    private setStateAndCommentCache() {
        if (this.nested_comments && this.state !== "ignore") {
            this.cache_state_for_comment = this.state;
            this.state = "ignore";
        } else if (this.state === "ignore") {
            this.state = this.cache_state_for_comment;
        }

        if (this.nested_comments === 0 && this.state === "ignore") {
            this.state = this.cache_state_for_comment;
        }
    }
    private handleTitlePageProperties(): boolean {
        if (title_page_regex.test(this.thistoken.text)) {
            var index = this.thistoken.text.indexOf(":");
            this.thistoken.type = this.thistoken.text.substr(0, index).toLowerCase().replace(" ", "_");
            this.thistoken.text = this.thistoken.text.substr(index + 1).trim();
            this.last_title_page_token = this.thistoken;
            let keyformat = titlePageDisplay[this.thistoken.type];
            if (keyformat) {
                this.thistoken.index = keyformat.index;
                this.result.title_page[keyformat.position].push(this.thistoken);
            }
            this.title_page_started = true;
            return true;
        } else if (this.title_page_started) {
            this.last_title_page_token.text += (this.last_title_page_token.text ? "\n" : "") + this.thistoken.text.trim();
            return true;
        }
        return false;
    }

    private latestSection(depth: number): StructToken | null {
        return latestSectionOrScene(this.result.properties, depth, token => token.section)
    }

    public parse(): ParsedOutput {
        if (!this.script) {
            return this.result;
        }
        var new_line_length = this.script.match(/\r\n/) ? 2 : 1;
        this.lines = this.script.split(/\r\n|\r|\n/);
        this.lines_length = this.lines.length;
        for (var line_number = 0; line_number < this.lines_length; line_number++) {
            const line = this.lines[line_number];
            // replace inline comments
            const text = line.split(/(\/\*){1}|(\*\/){1}|([^\/\*]+)/g).filter(a => !!a).reduce((prev, curr) => this.reduceComment(prev, curr), "");
            this.setStateAndCommentCache();

            this.thistoken = create_token(text, this.current, line_number, new_line_length);
            this.current = this.thistoken.end + 1;



            // If the line is empty but not exactly 2 spaces.
            if (text.trim().length === 0 && text !== "  ") {
                this.handleBlankLine(line_number);
                continue;
            }

            //top_or_separated = last_was_separator || i === 0;
            this.token_category = "script";

            if (!this.title_page_started && title_page_regex.test(this.thistoken.text)) {
                this.state = "title_page";
            }
            if (this.state === "title_page") {
                if (this.handleTitlePageProperties()) { continue; }
            }

            if (this.state === "normal") {
                this.handleToken(this.thistoken, line_number);
            } else {
                if (this.thistoken.text.match(parenthetical_regex)) {
                    this.thistoken.type = "parenthetical";
                } else {
                    this.thistoken.type = "dialogue";
                    this.processDialogueBlock(this.thistoken);
                    this.thistoken.character = this.previousCharacter;
                }
                if (this.dual_right) {
                    this.thistoken.dual = "right";
                }
            }

            if (this.thistoken.type != "action" && !(this.thistoken.type == "dialogue" && this.thistoken.text == "  ")) {
                this.thistoken.text = this.thistoken.text.trim();
            }

            this.last_was_separator = false;

            if (this.token_category === "script" && this.state !== "ignore") {
                if (this.thistoken.is("scene_heading", "transition")) {
                    this.thistoken.text = this.thistoken.text.toUpperCase();
                    this.title_page_started = true; // ignore title tags after first heading
                }
                if (this.thistoken.text && this.thistoken.text[0] === "~") {
                    this.thistoken.text = "*" + this.thistoken.text.substring(1) + "*";
                }
                if (this.thistoken.type != "action" && this.thistoken.type != "dialogue")
                    this.thistoken.text = this.thistoken.text.trim();

                if (this.thistoken.ignore) {
                    this.ignoredLastToken = true;
                }
                else {
                    this.ignoredLastToken = false;
                    this.pushToken(this.thistoken, line_number);
                }
            }

        }

        if (this.state == "dialogue") {
            this.pushToken(create_token(undefined, undefined, undefined, undefined, "dialogue_end"), line_number);
        }

        if (this.state == "dual_dialogue") {
            this.pushToken(create_token(undefined, undefined, undefined, undefined, "dual_dialogue_end"), line_number);
        }

        if (!this.title_page_started) {
            this.result.title_page = {};
        }

        // clean separators at the end
        while (this.result.tokens.length > 0 && this.result.tokens[this.result.tokens.length - 1].type === "separator") {
            this.result.tokens.pop();
        }

        return this.result;
    }
    

    private handleToken(token: token, line_number: number) {
        if (token.text.match(line_break_regex)) {
            this.token_category = "none";
        } else if (this.result.properties.firstTokenLine == Infinity) {
            this.result.properties.firstTokenLine = token.line;
        }

        if (token.text.match(scene_heading_regex)) {
            this.processSceneHeading(token, line_number);
            return;
        }
        if (token.text.length && token.text[0] === "!") {
            token.type = "action";
            token.text = token.text.substr(1);
            this.processActionBlock(token);
            return;
        }
        if (token.text.match(centered_regex)) {
            token.type = "centered";
            token.text = token.text.replace(/>|</g, "").trim();
            return;
        }
        if (token.text.match(transition_regex)) {
            token.text = token.text.replace(/> ?/, "");
            token.type = "transition";
            return;
        }
        const synopsis_match = token.text.match(synopsis_regex)
        if (synopsis_match) {
            this.processSynopsis(token, synopsis_match);
            return;
        }
        const section_match = token.text.match(section_regex);
        if (section_match) {
            this.processSection(token, section_match);
            return;
        }
        if (token.text.match(page_break_regex)) {
            token.text = "";
            token.type = "page_break";
            return;
        }
        if (
            token.text.match(character_regex) &&
            line_number < this.lines_length - 1 &&
            this.nextLineIsBlank(line_number)) {
            this.processCharacter(token, line_number);
            return;
        }

        token.type = "action";
        this.processActionBlock(token);
    }



    private processSynopsis(token: token, synopsis_match: RegExpMatchArray) {
        token.text = synopsis_match[1];
        token.type = token.text ? "synopsis" : "separator";

        var level = latestSectionOrScene(this.result.properties, this.current_depth + 1, () => true);
        if (level) {
            level.synopses = level.synopses || [];
            level.synopses.push({ synopsis: token.text, line: token.line });
        }
    }

    private nextLineIsBlank(line_number: number) {
        // The last part of the above statement ('(lines[i + 1].trim().length == 0) ? (lines[i+1] == "  ") : false)')
        // means that if the trimmed length of the following line (i+1) is equal to zero, the statement will only return 'true',
        // and therefore consider the token as a character, if the content of the line is exactly two spaces.
        // If the trimmed length is larger than zero, then it will be accepted as dialogue regardless
        return (this.lines[line_number + 1].trim().length == 0) ? (this.lines[line_number + 1] == "  ") : true;
    }

    private processCharacter(token: token, line_number: number) {
        this.state = "dialogue";
        token.type = "character";
        token.takeNumber = this.takeCount++;
        if (this.config.print_dialogue_numbers)
            AddDialogueNumberDecoration(token);
        token.text = trimCharacterForceSymbol(token.text);
        if (token.text[token.text.length - 1] === "^") {
            if (this.config.use_dual_dialogue) {
                this.state = "dual_dialogue";
                // update last dialogue to be dual:left
                var dialogue_tokens = ["dialogue", "character", "parenthetical"];
                while (dialogue_tokens.indexOf(this.result.tokens[this.last_character_index].type) !== -1) {
                    this.result.tokens[this.last_character_index].dual = "left";
                    this.last_character_index++;
                }
                //update last dialogue_begin to be dual_dialogue_begin and remove last dialogue_end
                var foundmatch = false;
                var temp_index = this.result.tokens.length;
                temp_index = temp_index - 1;
                while (!foundmatch) {
                    temp_index--;
                    switch (this.result.tokens[temp_index].type) {
                        case "dialogue_end":
                            this.result.tokens.splice(temp_index);
                            temp_index--;
                            break;
                        case "separator": break;
                        case "character": break;
                        case "dialogue": break;
                        case "parenthetical": break;
                        case "dialogue_begin":
                            this.result.tokens[temp_index].type = "dual_dialogue_begin";
                            foundmatch = true;
                            break;
                        default: foundmatch = true;
                    }
                }
                this.dual_right = true;
                token.dual = "right";
            }
            else {
                this.pushToken(create_token(undefined, undefined, undefined, undefined, "dialogue_begin"), line_number);
            }
            token.text = token.text.replace(/\^$/, "");
        }
        else {
            this.pushToken(create_token(undefined, undefined, undefined, undefined, "dialogue_begin"), line_number);
        }
        let character = trimCharacterExtension(token.text).trim();
        this.previousCharacter = character;
        var values = this.result.properties.characters.get(character);
        if (values) {
            if (values.indexOf(this.scene_number) == -1) {
                values.push(this.scene_number);
            }
            this.result.properties.characters.set(character, values);
        }
        else {
            this.result.properties.characters.set(character, [this.scene_number]);
        }
        this.last_character_index = this.result.tokens.length;
    }

    private processSceneHeading(token: token, line_number: number) {
        token.text = token.text.replace(/^\./, "");
        if (this.config.each_scene_on_new_page && this.scene_number !== 1) {
            var page_break = create_token();
            page_break.type = "page_break";
            page_break.start = token.start;
            page_break.end = token.end;
            this.pushToken(page_break, line_number);
        }
        token.type = "scene_heading";
        token.number = this.scene_number.toString();
        const scene_number_match = token.text.match(scene_number_regex);
        if (scene_number_match) {
            token.text = token.text.replace(scene_number_regex, "");
            token.number = scene_number_match[1];
        }
        let cobj: StructToken = new StructToken();
        cobj.text = token.text;
        cobj.children = null;
        cobj.range = new Range(new Position(token.line, 0), new Position(token.line, token.text.length));



        if (this.current_depth == 0) {
            cobj.id = '/' + token.line;
            this.result.properties.structure.push(cobj);
        }
        else {
            var level = this.latestSection(this.current_depth);
            if (level) {
                cobj.id = level.id + '/' + token.line;
                level.children.push(cobj);
            }
            else {
                cobj.id = '/' + token.line;
                this.result.properties.structure.push(cobj);
            }
        }

        this.updatePreviousSceneLength();
        this.result.properties.scenes.push({ scene: token.number, text: token.text, line: token.line, actionLength: 0, dialogueLength: 0 });
        this.result.properties.sceneLines.push(token.line);
        this.result.properties.sceneNames.push(token.text);

        pushLocationMetadata(token, this.result, this.scene_number);
        this.scene_number++;
        return level;
    }

    private processSection(token: token, section_match: RegExpMatchArray) {
        token.level = section_match[1].length;
        token.text = section_match[2];
        token.type = "section";
        let cobj: StructToken = new StructToken();
        cobj.text = token.text;
        this.current_depth = token.level;
        cobj.level = token.level;
        cobj.children = [];
        cobj.range = new Range(new Position(token.line, 0), new Position(token.line, token.text.length));
        cobj.section = true;

        const level = this.current_depth > 1 && latestSectionOrScene(this.result.properties, this.current_depth, token => token.section && token.level < this.current_depth);
        if (this.current_depth == 1 || !level) {
            cobj.id = '/' + token.line;
            this.result.properties.structure.push(cobj);
        }
        else {
            cobj.id = level.id + '/' + token.line;
            level.children.push(cobj);
        }
    }
}

