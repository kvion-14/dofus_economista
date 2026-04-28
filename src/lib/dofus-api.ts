import { DofusAPIResponse, DofusItem } from "@/types/dofus";

const API_BASE_URL = "https://api.dofusdb.fr";
const RUNE_TYPE_ID = 78; // typeId para runas de forjamagia

export async function fetchRunes(skip: number = 0, limit: number = 50): Promise<DofusAPIResponse> {
  const response = await fetch(
    `${API_BASE_URL}/items?typeId=${RUNE_TYPE_ID}&$limit=${limit}&$skip=${skip}`
  );
  
  if (!response.ok) {
    throw new Error(`Error fetching runes: ${response.statusText}`);
  }
  
  return response.json();
}

export async function fetchAllRunes(): Promise<DofusItem[]> {
  const allRunes: DofusItem[] = [];
  let skip = 0;
  const limit = 50;
  let hasMore = true;

  while (hasMore) {
    const response = await fetchRunes(skip, limit);
    allRunes.push(...response.data);
    
    if (response.data.length < limit) {
      hasMore = false;
    } else {
      skip += limit;
    }
  }

  return allRunes;
}

export function getRuneName(rune: DofusItem, lang: string = "es"): string {
  return rune.name[lang as keyof typeof rune.name] || rune.name.es;
}
