import { FountainConfig } from '../configloader';
import { AfterwritingParser } from './AfterWritingParser';
import { ParsedOutput } from './ParsedOutput';

export * as regex from './regex';
export * from './ParsedOutput';


export function parse(originalScript: string, cfg: FountainConfig): ParsedOutput {
    return new AfterwritingParser(originalScript, cfg).parse();
}