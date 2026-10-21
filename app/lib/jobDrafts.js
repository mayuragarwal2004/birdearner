import AsyncStorage from "@react-native-async-storage/async-storage";

// Job drafts are stored on this phone as one list. The older single-draft key is moved into the list once.
const DRAFTS_KEY = "jobDrafts";
const LEGACY_DRAFT_KEY = "jobRequirementsDraft";

const readList = async () => {
  const raw = await AsyncStorage.getItem(DRAFTS_KEY);
  return raw ? JSON.parse(raw) : null;
};

// Newest first
export const getJobDrafts = async () => {
  let drafts = await readList();

  if (drafts === null) {
    drafts = [];
    const legacyRaw = await AsyncStorage.getItem(LEGACY_DRAFT_KEY);
    if (legacyRaw) {
      const legacy = JSON.parse(legacyRaw);
      drafts.push({ ...legacy, id: `draft-${Date.now()}`, savedAt: legacy.savedAt || new Date().toISOString() });
      await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
      await AsyncStorage.removeItem(LEGACY_DRAFT_KEY);
    }
  }

  return [...drafts].sort((a, b) => String(b.savedAt || "").localeCompare(String(a.savedAt || "")));
};

export const getJobDraft = async (id) => {
  const drafts = await getJobDrafts();
  return drafts.find((draft) => draft.id === id) || null;
};

// Saves a draft. Pass an existing id to update that draft, or nothing to create a new one.
export const saveJobDraft = async (draft, id = null) => {
  const drafts = await getJobDrafts();
  const draftId = id || `draft-${Date.now()}`;
  const saved = { ...draft, id: draftId, savedAt: new Date().toISOString() };
  const next = drafts.some((item) => item.id === draftId)
    ? drafts.map((item) => (item.id === draftId ? saved : item))
    : [saved, ...drafts];
  await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(next));
  return saved;
};

export const deleteJobDraft = async (id) => {
  const drafts = await getJobDrafts();
  await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts.filter((draft) => draft.id !== id)));
};
