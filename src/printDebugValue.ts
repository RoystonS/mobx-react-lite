import { getDependencyTree, Reaction } from "mobx"

export function printDebugValue(r: Reaction | undefined) {
    if (!r) {
        return "<unknown>"
    }
    return getDependencyTree(r)
}
