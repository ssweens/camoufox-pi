import { randomUUID } from "node:crypto";
import { EventEmitter } from "node:events";
export function createEventEmitter() {
    const ee = new EventEmitter();
    // Listener errors are logged via console.error but do NOT propagate —
    // they must never mask a CamoufoxErrorBox re-thrown to the caller.
    ee.on("error", () => undefined);
    // Listener isolation: a listener that throws (sync or async) must not mask
    // a CamoufoxErrorBox re-thrown to the caller, nor bring down other
    // listeners. Each registration is assumed to use a unique function
    // reference — re-registering the same reference via both on() and once()
    // would collide in the WeakMap below. Support isn't needed in practice.
    const wrap = (listener) => (payload) => {
        try {
            const result = listener(payload);
            if (result && typeof result.then === "function") {
                result.catch((err) => {
                    console.error("[camoufox] async event listener rejected:", err);
                });
            }
        }
        catch (err) {
            console.error("[camoufox] event listener threw:", err);
        }
    };
    // Keep a map so off() can find the wrapper.
    const wrapped = new WeakMap();
    return {
        on(event, listener) {
            const w = wrap(listener);
            wrapped.set(listener, w);
            ee.on(event, w);
            return this;
        },
        off(event, listener) {
            const w = wrapped.get(listener);
            if (w)
                ee.off(event, w);
            return this;
        },
        once(event, listener) {
            const w = wrap(listener);
            wrapped.set(listener, w);
            ee.once(event, w);
            return this;
        },
        emit(event, payload) {
            return ee.emit(event, payload);
        },
        listenerCount(event) {
            return ee.listenerCount(event);
        },
    };
}
export function newSpanId() {
    return randomUUID().replace(/-/g, "").slice(0, 16);
}
//# sourceMappingURL=events.js.map