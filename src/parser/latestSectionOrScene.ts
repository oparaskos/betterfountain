import { last } from "../utils";
import { ScreenplayProperties, StructToken } from ".";

export function latestSectionOrScene(properties: ScreenplayProperties, depth: number, condition: (token: StructToken) => boolean): StructToken | null {
    try {
        if (depth <= 0) {
            return null;
        }
        else if (depth == 1) {
            var lastItem: StructToken = last(properties.structure.filter(condition));
            return lastItem;
        }
        else {
            var prevSection = latestSectionOrScene(properties, depth - 1, condition);
            if (prevSection?.children != null) {
                var lastChild = last(prevSection.children.filter(condition));
                if (lastChild)
                    return lastChild;
            }
            // nest ###xyz inside #abc if there's no ##ijk to nest within
            return prevSection;
        }
    }
    catch {
        let section: StructToken | null = null;
        while (!section && depth > 0)
            section = latestSectionOrScene(properties, --depth, condition);
        return section;
    }
}
