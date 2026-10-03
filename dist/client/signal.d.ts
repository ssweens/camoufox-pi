export interface CombinedSignal {
    readonly signal: AbortSignal;
    cleanup(): void;
}
export declare function combineSignals(external: AbortSignal | undefined, timeoutMs: number): CombinedSignal;
//# sourceMappingURL=signal.d.ts.map