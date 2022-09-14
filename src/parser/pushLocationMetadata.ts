import { parseLocationInformation, slugify } from "../utils";
import { token } from "../token";
import { ParsedOutput } from ".";

export function pushLocationMetadata(thistoken: token, result: ParsedOutput, scene_number: number) {
    const location = parseLocationInformation(thistoken.text);
    if (location) {
        const locationSlug = slugify(location.name);
        const values = result.properties.locations.get(locationSlug);
        if (values) {
            if (values.findIndex(it => it.scene_number == scene_number) == -1) {
                values.push({
                    scene_number: scene_number,
                    ...location
                });
            }
            result.properties.locations.set(locationSlug, values);
        }
        else {
            result.properties.locations.set(locationSlug, [{ scene_number, ...location }]);
        }
    }
}
