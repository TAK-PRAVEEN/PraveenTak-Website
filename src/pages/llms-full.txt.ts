// /llms-full.txt — the same summary plus the full text of every project and experiment.
import { buildLlms, textResponse } from "../lib/llms";
export const prerender = true;
export async function GET() {
  return textResponse(await buildLlms(true));
}
