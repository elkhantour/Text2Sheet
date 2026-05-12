import { STORAGE_KEY } from "./constants";

export async function getStoredIds(): Promise<string[]> {
  const raw = await figma.clientStorage.getAsync(STORAGE_KEY);
  if (Array.isArray(raw)) return raw as string[];
  return [];
}

export async function saveIds(ids: string[]): Promise<void> {
  await figma.clientStorage.setAsync(STORAGE_KEY, ids);
}


