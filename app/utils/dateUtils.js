/**
 * Formats a timestamp into a WhatsApp-style date header label for chat.
 * - Current calendar day -> "Today"
 * - Yesterday -> "Yesterday"
 * - Within 2..6 days ago -> Day of week (e.g., "Monday")
 * - Older than 6 days -> Formatted date (e.g., "15 September 2026")
 */
export const getWhatsAppDateHeader = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return '';

  const now = new Date();

  const msgYear = date.getFullYear();
  const msgMonth = date.getMonth();
  const msgDay = date.getDate();

  const nowYear = now.getFullYear();
  const nowMonth = now.getMonth();
  const nowDay = now.getDate();

  const msgStartOfDay = new Date(msgYear, msgMonth, msgDay);
  const nowStartOfDay = new Date(nowYear, nowMonth, nowDay);

  const diffInMs = nowStartOfDay.getTime() - msgStartOfDay.getTime();
  const diffInDays = Math.round(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) {
    return 'Today';
  } else if (diffInDays === 1) {
    return 'Yesterday';
  } else if (diffInDays > 1 && diffInDays < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  } else {
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: msgYear !== nowYear ? 'numeric' : 'numeric',
    });
  }
};

/**
 * Checks if two timestamps fall on different calendar days.
 */
export const isDifferentCalendarDay = (timestamp1, timestamp2) => {
  if (!timestamp1 || !timestamp2) return true;
  const d1 = new Date(timestamp1);
  const d2 = new Date(timestamp2);
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return true;

  return (
    d1.getFullYear() !== d2.getFullYear() ||
    d1.getMonth() !== d2.getMonth() ||
    d1.getDate() !== d2.getDate()
  );
};
