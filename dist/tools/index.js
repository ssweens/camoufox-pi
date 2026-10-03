import "./formats.js";
import { createFetchSourcesTool } from "./fetch-sources.js";
import { createFetchUrlTool } from "./fetch-url.js";
import { createSearchWebTool } from "./search-web.js";
export function createAllTools(service) {
    const client = service.getClient();
    return [createFetchUrlTool(client), createSearchWebTool(client), createFetchSourcesTool(client)];
}
//# sourceMappingURL=index.js.map