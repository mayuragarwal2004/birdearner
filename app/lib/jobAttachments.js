// Job attachments are stored as a list of URLs in `attachedFiles`.
// Voice notes are uploaded to the "job_voice_notes" folder, so they are recognised by that folder name.
const VOICE_NOTE_FOLDER = "/job_voice_notes/";

export const isVoiceNoteUrl = (url) =>
  typeof url === "string" && url.includes(VOICE_NOTE_FOLDER);

// Splits the attachment list into picture attachments and voice notes
export const splitJobAttachments = (attachments) => {
  const list = Array.isArray(attachments) ? attachments.filter(Boolean) : [];
  return {
    images: list.filter((item) => !isVoiceNoteUrl(item)),
    voiceNotes: list.filter((item) => isVoiceNoteUrl(item)),
  };
};
