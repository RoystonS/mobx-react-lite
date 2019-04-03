import { Reaction } from "mobx"
import { useDebugValue, useEffect, useState } from "react"
import { printDebugValue } from "./printDebugValue"
import { isUsingStaticRendering } from "./staticRendering"
import { useForceUpdate } from "./utils"

export type ForceUpdateHook = () => () => void

export interface IUseObserverOptions {
    useForceUpdate?: ForceUpdateHook
}

const EMPTY_OBJECT = {}

export function useObserver<T>(
    fn: () => T,
    baseComponentName: string = "observed",
    options: IUseObserverOptions = EMPTY_OBJECT
): T {
    if (isUsingStaticRendering()) {
        return fn()
    }

    const wantedForceUpdateHook = options.useForceUpdate || useForceUpdate
    const forceUpdate = wantedForceUpdateHook()

    const [reaction, setReaction] = useState<Reaction | undefined>(undefined)

    useEffect(() => {
        const newReaction = new Reaction(`observer(${baseComponentName})`, () => {
            forceUpdate()
        })
        setReaction(newReaction)
        return () => newReaction.dispose()
    }, [])

    useDebugValue(reaction, printDebugValue)

    // render the original component, but have the
    // reaction track the observables, so that rendering
    // can be invalidated (see above) once a dependency changes
    let exception
    if (reaction) {
        let rendering!: T
        reaction.track(() => {
            try {
                rendering = fn()
            } catch (e) {
                exception = e
            }
        })
        if (exception) {
            throw exception // re-throw any exceptions catched during rendering
        }
        return rendering
    } else {
        // We're not yet committed; we can't create a reaction in case it leaks
        return fn()
    }
}
