import type { Page } from "playwright-core";
export type RenderMode = "static" | "render" | "render-and-wait";
export type Format = "html" | "markdown";
export declare const MAX_MARKDOWN_INPUT_BYTES: number;
export declare const SCREENSHOT_MAX_BYTES: number;
export declare const MAX_SCREENSHOT_DIMENSION_PX = 16384;
export declare const MAX_SCREENSHOT_PIXELS = 50000000;
export interface FetchUrlOpts {
    signal: AbortSignal;
    timeoutMs?: number;
    maxBytes?: number;
    isolate?: boolean;
    renderMode?: RenderMode;
    waitForSelector?: string;
    selector?: string;
    format?: Format;
    screenshot?: ScreenshotOpts;
}
export interface ValidatedFetchUrlOpts {
    renderMode: RenderMode;
    format: Format;
}
export declare function validateFetchUrlOpts(opts: FetchUrlOpts): ValidatedFetchUrlOpts;
export declare function resolveWaitUntil(mode: RenderMode): "domcontentloaded" | "load" | "networkidle";
export declare function htmlToMarkdown(html: string, baseUrl: string): string;
export declare function extractSlice(page: Page, selector: string | undefined): Promise<{
    html: string;
}>;
export declare function waitForSelectorOrThrow(page: Page, selector: string, timeoutMs: number): Promise<void>;
export interface ScreenshotOpts {
    fullPage?: boolean;
    format?: "png" | "jpeg";
    quality?: number;
}
export interface ScreenshotResult {
    data: string;
    bytes: number;
    mimeType: "image/png" | "image/jpeg";
}
export declare function capturePageScreenshot(page: Page, opts: ScreenshotOpts): Promise<ScreenshotResult>;
//# sourceMappingURL=fetch-pipeline.d.ts.map