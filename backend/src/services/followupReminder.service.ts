import { prisma } from '../config/database.js';
import { NotificationService } from './notification.service.js';

// Follow-up dates/times are stored as plain strings entered by counselors
// in India, while the server may run in UTC (e.g. Render) - so "is this due
// yet" has to be evaluated in IST, not server-local time.
const TZ = 'Asia/Kolkata';

function nowInIST() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false
  }).formatToParts(new Date());
  const get = (t: string) => parts.find(p => p.type === t)?.value || '00';
  const hour = get('hour') === '24' ? '00' : get('hour');
  return { date: `${get('year')}-${get('month')}-${get('day')}`, minutes: parseInt(hour, 10) * 60 + parseInt(get('minute'), 10) };
}

function shiftDate(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split('T')[0];
}

// Accepts "14:30" or "02:30 PM"; anything unparseable counts as start of day
// so the reminder still fires on the right date.
function timeToMinutes(time?: string | null): number {
  const m = String(time || '').trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!m) return 0;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const ap = m[3]?.toUpperCase();
  if (ap === 'PM' && h < 12) h += 12;
  if (ap === 'AM' && h === 12) h = 0;
  return h * 60 + min;
}

export class FollowupReminderService {
  /**
   * Notifies the assigned counselor once for every PENDING follow-up whose
   * date/time has arrived. Only looks back one day so that switching this
   * on doesn't dump a notification for every stale follow-up already in the
   * database. De-duplication uses the notification's `type` field
   * ("followup:<id>") instead of a new column, so no schema migration is
   * needed to remember which follow-ups were already reminded.
   */
  static async runOnce(): Promise<number> {
    const { date: today, minutes: nowMinutes } = nowInIST();
    const yesterday = shiftDate(today, -1);

    const candidates = await prisma.followUp.findMany({
      where: { status: 'PENDING', date: { gte: yesterday, lte: today } },
      include: { lead: { select: { leadId: true, name: true, ownerId: true } } }
    });

    let sent = 0;
    for (const f of candidates) {
      const isDue = f.date < today || timeToMinutes(f.time) <= nowMinutes;
      if (!isDue || !f.lead) continue;

      const marker = `followup:${f.id}`;
      const already = await prisma.notification.findFirst({ where: { type: marker }, select: { id: true } });
      if (already) continue;

      const assignee = f.assignedTo || f.lead.ownerId;
      const created = await NotificationService.notifyUserByName(
        assignee,
        'Follow-up Due',
        `Follow-up with ${f.lead.name} (${f.lead.leadId}) is due - ${f.type} scheduled for ${f.date} at ${f.time}.`,
        marker
      );
      if (created) sent++;
    }
    return sent;
  }

  static start(intervalMs = 60 * 1000) {
    const tick = () => {
      FollowupReminderService.runOnce().catch(err => console.error('Follow-up reminder run failed:', err));
    };
    setTimeout(tick, 15 * 1000);
    setInterval(tick, intervalMs);
  }
}
