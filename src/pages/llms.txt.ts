// /llms.txt — site summary for AI assistants (llmstxt.org). Built at deploy time from the content.
import { buildLlms, textResponse } from "../lib/llms";
export const prerender = true;
export async function GET() {
  return textResponse(await buildLlms(false));
}
