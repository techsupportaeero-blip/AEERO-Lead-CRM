import { prisma } from '../config/database.js';
import { LeadStatus } from '../types/index.js';

export class DashboardService {
  static async getStats(query: any = {}) {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Build date filter for leads
    const where: any = { isArchived: false };

    if (query.dateFrom || query.dateTo || query.startDate || query.endDate) {
      const from = query.dateFrom || query.startDate;
      const to = query.dateTo || query.endDate;
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) {
        const endDate = new Date(to);
        endDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDate;
      }
    }

    // Fetch every dataset the dashboard needs in parallel instead of one
    // round-trip at a time - these queries don't depend on each other, so
    // sequential awaits were just adding up idle network latency for nothing.
    const [leads, activities, followups, payments, tasks, counselors] = await Promise.all([
      prisma.lead.findMany({ where, include: { payments: true } }),
      prisma.activity.findMany({ orderBy: { createdAt: 'desc' }, take: 200 }),
      prisma.followUp.findMany({
        where: { status: 'PENDING' },
        include: { lead: { select: { name: true, interestedCourse: true, status: true } } }
      }),
      prisma.payment.findMany(),
      prisma.task.findMany({ where: { status: { not: 'COMPLETED' } } }),
      prisma.user.findMany({ where: { isActive: true }, select: { name: true } })
    ]);

    const totalLeads = leads.length;

    // Status counts
    let newLeads = 0;
    let noAnswerLeads = 0;
    let givenDetailsLeads = 0;
    let followupLeads = 0;
    let interestedLeads = 0;
    let convertedLeads = 0;
    let lostLeads = 0;

    const statusCountsMap: Record<string, number> = {
      NEW: 0,
      NO_ANSWER: 0,
      GIVEN_DETAILS: 0,
      INTERESTED: 0,
      FOLLOW_UP: 0,
      CONVERTED: 0,
      LOST: 0,
      NOT_INTERESTED: 0,
      INVALID: 0
    };

    leads.forEach((l: any) => {
      const s = l.status;
      if (statusCountsMap[s] !== undefined) {
        statusCountsMap[s] += 1;
      }
      if (s === LeadStatus.NEW) newLeads += 1;
      else if (s === LeadStatus.NO_ANSWER) noAnswerLeads += 1;
      else if (s === LeadStatus.GIVEN_DETAILS) givenDetailsLeads += 1;
      else if (s === LeadStatus.FOLLOW_UP) followupLeads += 1;
      else if (s === LeadStatus.INTERESTED) interestedLeads += 1;
      else if (s === LeadStatus.CONVERTED) convertedLeads += 1;
      else if (s === LeadStatus.LOST || s === LeadStatus.NOT_INTERESTED) lostLeads += 1;
    });

    const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : '0.0';

    // Lead Pipeline Stages
    const pipelineColors: Record<string, string> = {
      NEW: '#38BDF8',
      NO_ANSWER: '#94A3B8',
      GIVEN_DETAILS: '#22D3EE',
      INTERESTED: '#FBBF24',
      FOLLOW_UP: '#FB923C',
      CONVERTED: '#34D399',
      LOST: '#F87171'
    };

    const statusLabels: Record<string, string> = {
      NEW: 'New',
      NO_ANSWER: 'No Answer',
      GIVEN_DETAILS: 'Given Details',
      INTERESTED: 'Interested',
      FOLLOW_UP: 'Follow-up',
      CONVERTED: 'Converted',
      LOST: 'Lost'
    };

    const leadPipeline = Object.keys(statusLabels).map((key: string) => {
      const count = statusCountsMap[key] || 0;
      const percent = totalLeads > 0 ? ((count / totalLeads) * 100).toFixed(1) + '%' : '0%';
      return {
        stage: statusLabels[key],
        code: key,
        count,
        percent,
        color: pipelineColors[key] || '#94A3B8'
      };
    });

    // Lead Trend (Last 7 days)
    const trendMap: Record<string, { date: string; leads: number; converted: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      const shortDay = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      trendMap[dateKey] = { date: shortDay, leads: 0, converted: 0 };
    }

    leads.forEach((l: any) => {
      const lDate = l.createdAt.toISOString().split('T')[0];
      if (trendMap[lDate]) {
        trendMap[lDate].leads += 1;
        if (l.status === LeadStatus.CONVERTED) {
          trendMap[lDate].converted += 1;
        }
      }
    });

    const leadTrend = Object.values(trendMap);

    // Source Performance
    const sourceColors: Record<string, string> = {
      'Meta Ads': '#1877F2',
      'Google Ads': '#EA4335',
      'Website': '#0EA5E9',
      'WhatsApp': '#25D366',
      'Referral': '#8B5CF6',
      'Walk-in': '#F59E0B',
      'Organic': '#10B981',
      'Other': '#64748B'
    };

    const sourceMap: Record<string, { source: string; count: number; converted: number; interested: number; total: number }> = {};
    leads.forEach((l: any) => {
      const src = l.source || 'Other';
      if (!sourceMap[src]) {
        sourceMap[src] = { source: src, count: 0, converted: 0, interested: 0, total: 0 };
      }
      sourceMap[src].count += 1;
      sourceMap[src].total += 1;
      if (l.status === LeadStatus.CONVERTED) {
        sourceMap[src].converted += 1;
      }
      if (l.status === LeadStatus.INTERESTED) {
        sourceMap[src].interested += 1;
      }
    });

    const sourcePerformance = Object.values(sourceMap)
      .map((s: any) => ({
        ...s,
        percent: totalLeads > 0 ? ((s.count / totalLeads) * 100).toFixed(1) + '%' : '0%',
        color: sourceColors[s.source] || '#64748B',
        conversionRate: s.total > 0 ? ((s.converted / s.total) * 100).toFixed(1) : '0.0'
      }))
      .sort((a: any, b: any) => b.count - a.count);

    // Activity distribution
    const actTypeMap: Record<string, number> = { Calls: 0, WhatsApp: 0, Emails: 0, Meetings: 0, Notes: 0, Other: 0 };
    activities.forEach((a: any) => {
      const type = (a.activityType || a.subject || a.type || '').toLowerCase();
      if (type.includes('call') || type.includes('phone')) actTypeMap.Calls += 1;
      else if (type.includes('whatsapp') || type.includes('chat') || type.includes('msg')) actTypeMap.WhatsApp += 1;
      else if (type.includes('email') || type.includes('mail')) actTypeMap.Emails += 1;
      else if (type.includes('meeting') || type.includes('visit') || type.includes('campus')) actTypeMap.Meetings += 1;
      else if (type.includes('note') || type.includes('remark')) actTypeMap.Notes += 1;
      else actTypeMap.Other += 1;
    });

    const totalActivitiesCount = Object.values(actTypeMap).reduce((acc, v) => acc + v, 0);

    const activityColors: Record<string, string> = {
      Calls: '#EAB308',
      WhatsApp: '#10B981',
      Emails: '#3B82F6',
      Meetings: '#A855F7',
      Notes: '#F97316',
      Other: '#64748B'
    };

    const activityDistribution = Object.keys(actTypeMap)
      .filter((k: string) => actTypeMap[k] > 0 || totalActivitiesCount === 0)
      .map((k: string) => ({
        name: k,
        count: actTypeMap[k],
        percent: totalActivitiesCount > 0 ? ((actTypeMap[k] / totalActivitiesCount) * 100).toFixed(1) + '%' : '0%',
        color: activityColors[k]
      }));

    // Follow-ups & Tasks
    const todaysFollowupsList = followups
      .filter((f: any) => f.date === todayStr)
      .map((f: any) => ({
        id: f.id,
        name: f.lead?.name || 'Student Follow-up',
        sub: `${f.lead?.interestedCourse || 'Aviation'} • ${f.lead?.status || 'Follow-up'}`,
        time: f.time || 'Today',
        leadId: f.leadId,
        icon: (f.type || '').toLowerCase().includes('call') ? 'call' : 'event',
        iconBg: 'bg-emerald-100 text-emerald-700'
      }));

    const overdueFollowupsList = followups
      .filter((f: any) => f.date && f.date < todayStr)
      .map((f: any) => ({
        id: f.id,
        name: f.lead?.name || 'Overdue Follow-up',
        sub: `${f.lead?.interestedCourse || 'Aviation'} • Due: ${f.date}`,
        time: f.time || f.date,
        leadId: f.leadId
      }));

    const followupsToday = todaysFollowupsList.length;
    const overdueFollowups = overdueFollowupsList.length;

    // Recent activities (5 items)
    const recentActivities = activities.slice(0, 5).map((a: any) => {
      const parentLead = leads.find((l: any) => l.leadId === a.leadId);
      const t = (a.activityType || '').toLowerCase();
      return {
        id: a.id,
        title: a.subject || `${a.activityType || 'Activity'} with ${parentLead?.name || a.leadId}`,
        sub: a.description || `Outcome: ${a.outcome || 'Logged'}`,
        time: a.createdAt ? new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
        type: a.activityType || 'Call',
        icon: t.includes('chat') || t.includes('whatsapp') ? 'chat' :
          t.includes('email') ? 'mail' :
          t.includes('meeting') ? 'groups' :
          t.includes('note') ? 'article' : 'call',
        iconBg: t.includes('chat') || t.includes('whatsapp') ? 'bg-emerald-500 text-white' :
          t.includes('email') ? 'bg-blue-100 text-blue-700' :
          t.includes('meeting') ? 'bg-purple-100 text-purple-700' :
          t.includes('note') ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
      };
    });

    // Revenue
    let totalCollectedRevenueNum = 0;
    payments.forEach((p: any) => {
      totalCollectedRevenueNum += Number(p.amount) || 0;
    });
    const totalCollectedRevenue = totalCollectedRevenueNum.toLocaleString('en-IN');

    // Tasks metrics
    const activeTasksCount = tasks.length;
    const overdueTasksCount = tasks.filter((t: any) => t.dueDate && t.dueDate < todayStr).length;

    // Counselor Performance
    const counselorNames = counselors.map((c: any) => c.name);
    if (!counselorNames.includes('MS. INDU')) counselorNames.push('MS. INDU');
    if (!counselorNames.includes('MS. AYESHA')) counselorNames.push('MS. AYESHA');
    if (!counselorNames.includes('MS. PRITI')) counselorNames.push('MS. PRITI');
    if (!counselorNames.includes('Admin User 1')) counselorNames.push('Admin User 1');

    const employeeMap: Record<string, any> = {};
    counselorNames.forEach((cName: string) => {
      if (cName) {
        employeeMap[cName] = { name: cName, assigned: 0, contacted: 0, interested: 0, followups: 0, converted: 0, lost: 0 };
      }
    });

    leads.forEach((l: any) => {
      let owner = l.ownerId || 'MS. INDU';
      if (owner === 'Rahul Sharma' || owner === 'Sourav Sharma') owner = 'MS. INDU';
      if (owner === 'Anita Verma') owner = 'MS. AYESHA';
      if (owner === 'Suresh Menon') owner = 'MS. PRITI';

      if (!employeeMap[owner]) {
        employeeMap[owner] = { name: owner, assigned: 0, contacted: 0, interested: 0, followups: 0, converted: 0, lost: 0 };
      }
      employeeMap[owner].assigned += 1;
      if (l.status !== LeadStatus.NEW) employeeMap[owner].contacted += 1;
      if (l.status === LeadStatus.INTERESTED) employeeMap[owner].interested += 1;
      if (l.status === LeadStatus.FOLLOW_UP) employeeMap[owner].followups += 1;
      if (l.status === LeadStatus.CONVERTED) employeeMap[owner].converted += 1;
      if (l.status === LeadStatus.LOST || l.status === LeadStatus.NOT_INTERESTED) employeeMap[owner].lost += 1;
    });

    const employeePerformance = Object.values(employeeMap).map((e: any) => ({
      ...e,
      conversionRate: e.assigned > 0 ? ((e.converted / e.assigned) * 100).toFixed(1) : '0.0'
    }));

    // Course distribution
    const courseMap: Record<string, number> = {};
    leads.forEach((l: any) => {
      const course = l.interestedCourse || 'General Aviation';
      courseMap[course] = (courseMap[course] || 0) + 1;
    });
    const courseDistribution = Object.keys(courseMap)
      .map((c: string) => ({ course: c, count: courseMap[c] }))
      .sort((a: any, b: any) => b.count - a.count);

    return {
      totalLeads,
      newLeads,
      noAnswerLeads,
      givenDetailsLeads,
      followupLeads,
      interestedLeads,
      convertedLeads,
      lostLeads,
      conversionRate,
      totalCollectedRevenue,
      totalCollectedRevenueNum,
      activeTasksCount,
      overdueTasksCount,
      followupsToday,
      overdueFollowups,
      statusCounts: Object.entries(statusCountsMap).map(([status, count]) => ({ status, count })),
      leadPipeline,
      leadTrend,
      sourcePerformance,
      activityDistribution,
      totalActivitiesCount,
      todaysFollowupsList,
      overdueFollowupsList,
      recentActivities,
      employeePerformance,
      courseDistribution
    };
  }

  static async getConfig() {
    const courses = await prisma.course.findMany({ where: { isActive: true }, orderBy: { id: 'asc' } });
    const leadSources = await prisma.leadSource.findMany({ where: { isActive: true }, orderBy: { id: 'asc' } });
    const users = await prisma.user.findMany({ where: { isActive: true }, select: { name: true } });

    const statusMap = {
      NEW: 'New',
      NO_ANSWER: 'No Answer',
      GIVEN_DETAILS: 'Given Details',
      INTERESTED: 'Interested',
      FOLLOW_UP: 'Follow-up',
      CONVERTED: 'Converted',
      LOST: 'Lost',
      NOT_INTERESTED: 'Not Interested',
      INVALID: 'Invalid'
    };

    return {
      statusMap,
      counselors: users.map((u: any) => u.name),
      courses,
      leadSources
    };
  }
}
