// HTMLエスケープ
export function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  })[char]);
}

// 日付を YYYY-MM-DD 形式に変換
export function getMealDateString(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('-');
}

// 献立の日付表示
export function formatMealDate(date) {
  return new Intl.DateTimeFormat('ja-JP', {
    month: 'long',
    day: 'numeric',
    weekday: 'short'
  }).format(date);
}

// 月日表示
export function formatMonthDay(date) {
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

// 賞味期限までの日数
export function daysLeft(expiryDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(expiryDate + 'T00:00:00');

  return Math.ceil((target - today) / 86400000);
}
