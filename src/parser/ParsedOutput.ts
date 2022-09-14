import { Range } from "vscode";

export class ScriptLocation {
    scene_number: number;
    name: string;
    interior: boolean;
    exterior: boolean;
    time_of_day: string;
}

export class StructToken {
    text: string;
    isnote: boolean;
    id: string;
    children: any; //Children of the section
    range: Range; //Range of the scene/section header
    level: number;
    section: boolean; // true->section, false->scene
    synopses: { synopsis: string; line: number }[];
    notes: { note: string; line: number }[];
}

export class ScreenplayProperties {
    scenes: { scene: string; text: string, line: number, actionLength: number, dialogueLength: number }[];
    sceneLines: number[];
    sceneNames: string[];
    titleKeys: string[];
    firstTokenLine: number;
    fontLine: number;
    lengthAction: number; //Length of the action character count
    lengthDialogue: number; //Length of the dialogue character count
    characters: Map<string, number[]>;
    locations: Map<string, ScriptLocation[]>;
    structure: StructToken[];
}

export interface FountainToken {
    text: string;
    type: string;
    start: number;
    end: number;
    line: number;
    number: string;
    dual: string;
    html: string;
    level: number;
    time: number;
    takeNumber: number;
    is: Function;
    is_dialogue: Function;
    name: Function;
    location: Function;
    has_scene_time: Function;
    location_type: Function;
    character: string;
    ignore: boolean;
    index: number;
}

export interface ParsedOutput {
    title_page: { [index: string]: FountainToken[] },
    tokens: FountainToken[],
    tokenLines: { [line: number]: number }
    lengthAction: number,
    lengthDialogue: number,
    parseTime: number,
    properties: ScreenplayProperties
}

export function defaultParsedOutput(): ParsedOutput {
    return {
        title_page: {
            tl: [],
            tc: [],
            tr: [],
            cc: [],
            bl: [],
            br: [],
            hidden: []
        },
        tokens: [],
        lengthAction: 0,
        lengthDialogue: 0,
        tokenLines: {},
        parseTime: +new Date(),
        properties:
        {
            sceneLines: [],
            scenes: [],
            sceneNames: [],
            titleKeys: [],
            firstTokenLine: Infinity,
            fontLine: -1,
            lengthAction: 0,
            lengthDialogue: 0,
            characters: new Map<string, number[]>(),
            locations: new Map<string, ScriptLocation[]>(),
            structure: []
        }
    };
}