// Formats any date/timestamp as its IST (Asia/Kolkata) calendar date
// 'YYYY-MM-DD'. `new Date('YYYY-MM-DD')` always parses as UTC midnight
// regardless of the browser's own timezone, so comparing raw Date instants
// against a date-only filter is a timezone trap - comparing IST calendar
// date strings instead matches what a counselor actually means by "Oct 04".
export const toISTDateKey = (dateInput) => {
  if (!dateInput) return '';
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date(dateInput));
  } catch (e) {
    return '';
  }
};
