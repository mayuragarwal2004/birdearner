/**
 * Chat timestamps are always interpreted in Indian Standard Time (Asia/Kolkata)
 * so date headers and calendar-day grouping are consistent regardless of device
 * timezone. Ordering itself uses raw epoch values and is timezone-independent.
 */
const IST = 'Asia/Kolkata';

// 'YYYY-MM-DD' calendar key in IST (en-CA yields ISO-style dates)
const istCalendarKey = (date) => date.toLocaleDateString('en-CA', { timeZone: IST });

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

  const msgKey = istCalendarKey(date);
  const nowKey = istCalendarKey(new Date());

  const toUtcDay = (key) => {
    const [y, m, d] = key.split('-').map(Number);
    return Date.UTC(y, m - 1, d);
  };
  const diffInDays = Math.round((toUtcDay(nowKey) - toUtcDay(msgKey)) / (1000 * 60 * 60 * 24));

  const msgYear = Number(msgKey.slice(0, 4));
  const nowYear = Number(nowKey.slice(0, 4));

  if (diffInDays === 0) {
    return 'Today';
  } else if (diffInDays === 1) {
    return 'Yesterday';
  } else if (diffInDays > 1 && diffInDays < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'long', timeZone: IST });
  } else {
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: IST,
    });
  }
};

/**
 * Checks if two timestamps fall on different calendar days (in IST).
 */
export const isDifferentCalendarDay = (timestamp1, timestamp2) => {
  if (!timestamp1 || !timestamp2) return true;
  const d1 = new Date(timestamp1);
  const d2 = new Date(timestamp2);
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return true;

  return istCalendarKey(d1) !== istCalendarKey(d2);
};
