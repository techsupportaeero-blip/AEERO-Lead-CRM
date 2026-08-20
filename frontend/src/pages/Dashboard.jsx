import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../api/client';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ComposedChart,
  Line
} from 'recharts';

export const Dashboard = ({ onNavigate, onOpenAddLead, currentUser, darkMode }) => {
  const [stats, setStats] = useState({
    totalLeads: 0,
    newLeads: 0,
    noAnswerLeads: 0,
    givenDetailsLeads: 0,
    followupLeads: 0,
    interestedLeads: 0,
    convertedLeads: 0,
    lostLeads: 0,
    conversionRate: '0.0',
    totalCollectedRevenue: '0',
    totalCollectedRevenueNum: 0,
    activeTasksCount: 0,
    overdueTasksCount: 0,
    followupsToday: 0,
    overdueFollowups: 0,
    statusCounts: [],
    leadPipeline: [],
    leadTrend: [],
    sourcePerformance: [],
    activityDistribution: [],
    totalActivitiesCount: 0,
    todaysFollowupsList: [],
    overdueFollowupsList: [],
    recentActivities: [],
    employeePerformance: [],
    courseDistribution: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('This Month');
  const [activeInfoModal, setActiveInfoModal] = useState(null);
  const [detailModal, setDetailModal] = useState(null);
  const [detailData, setDetailData] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // Dynamic Real-Time Date & Range Calculations
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthNum = String(now.getMonth() + 1).padStart(2, '0');
  const todayDateStr = now.toISOString().split('T')[0];
  const firstDayOfMonthStr = `${currentYear}-${currentMonthNum}-01`;

  const [dateFrom, setDateFrom] = useState(firstDayOfMonthStr);
  const [dateTo, setDateTo] = useState(todayDateStr);
  const [isCustomRangeActive, setIsCustomRangeActive] = useState(false);
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);

  const currentMonthShort = now.toLocaleDateString('en-US', { month: 'short' });
  const todayNum = now.getDate();

  const currentDateRangeString = useMemo(() => {
    if (selectedPeriod === 'This Month') {
      return `${currentMonthShort} 1 – ${currentMonthShort} ${todayNum}, ${currentYear}`;
    }
    if (selectedPeriod === 'Last Month') {
      const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevMonthShort = prevDate.toLocaleDateString('en-US', { month: 'short' });
      const lastDayOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
      return `${prevMonthShort} 1 – ${prevMonthShort} ${lastDayOfPrevMonth}, ${prevDate.getFullYear()}`;
    }
    if (selectedPeriod === 'This Quarter') {
      const q = Math.floor(now.getMonth() / 3) + 1;
      const qStartMonth = (q - 1) * 3;
      const qStartName = new Date(currentYear, qStartMonth, 1).toLocaleDateString('en-US', { month: 'short' });
      return `Q${q} (${qStartName} 1 – ${currentMonthShort} ${todayNum}, ${currentYear})`;
    }
    if (selectedPeriod.startsWith('Year')) {
      return `Jan 1 – ${currentMonthShort} ${todayNum}, ${currentYear}`;
    }
    return `${currentMonthShort} 1 – ${currentMonthShort} ${todayNum}, ${currentYear}`;
  }, [selectedPeriod, currentMonthShort, todayNum, currentYear]);

  const displayDateString = useMemo(() => {
    if (isCustomRangeActive && dateFrom && dateTo) {
      const d1 = new Date(dateFrom);
      const d2 = new Date(dateTo);
      if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
        const f1 = d1.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: d1.getFullYear() !== d2.getFullYear() ? 'numeric' : undefined });
        const f2 = d2.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        return `${f1} – ${f2}`;
      }
    }
    return currentDateRangeString;
  }, [isCustomRangeActive, dateFrom, dateTo, currentDateRangeString]);

  const loadStats = async (overrideFilters = null) => {
    try {
      setLoading(true);
      const filters = overrideFilters !== null 
        ? overrideFilters 
        : (isCustomRangeActive ? { startDate: dateFrom, endDate: dateTo } : {});
      const data = await api.getStats(filters);
      if (data) {
        setStats(prev => ({
          ...prev,
          ...data
        }));
      }
    } catch (err) {
      console.error("Error loading dashboard stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const applyPreset = (preset) => {
    setSelectedPeriod(preset);
    const n = new Date();
    let s = '';
    let e = n.toISOString().split('T')[0];

    if (preset === 'Today') {
      s = e;
    } else if (preset === 'Yesterday') {
      const y = new Date(n);
      y.setDate(y.getDate() - 1);
      s = y.toISOString().split('T')[0];
      e = s;
    } else if (preset === 'Last 7 Days') {
      const d = new Date(n);
      d.setDate(d.getDate() - 7);
      s = d.toISOString().split('T')[0];
    } else if (preset === 'Last 30 Days') {
      const d = new Date(n);
      d.setDate(d.getDate() - 30);
      s = d.toISOString().split('T')[0];
    } else if (preset === 'This Month') {
      s = `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-01`;
    } else if (preset === 'Last Month') {
      const prev = new Date(n.getFullYear(), n.getMonth() - 1, 1);
      const lastDay = new Date(n.getFullYear(), n.getMonth(), 0);
      s = prev.toISOString().split('T')[0];
      e = lastDay.toISOString().split('T')[0];
    } else if (preset === 'This Quarter') {
      const q = Math.floor(n.getMonth() / 3);
      s = new Date(n.getFullYear(), q * 3, 1).toISOString().split('T')[0];
    } else if (preset.startsWith('Year')) {
      s = `${n.getFullYear()}-01-01`;
    }

    setDateFrom(s);
    setDateTo(e);
    setIsCustomRangeActive(true);
    setShowDatePickerModal(false);
    loadStats({ startDate: s, endDate: e });
  };

  const handleApplyCustomRange = () => {
    if (!dateFrom || !dateTo) {
      alert("Please select both Start Date and End Date.");
      return;
    }
    if (dateFrom > dateTo) {
      alert("Start Date cannot be after End Date.");
      return;
    }
    setIsCustomRangeActive(true);
    setSelectedPeriod('Custom');
    setShowDatePickerModal(false);
    loadStats({ startDate: dateFrom, endDate: dateTo });
  };

  const handleResetDateFilter = () => {
    const s = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const e = now.toISOString().split('T')[0];
    setDateFrom(s);
    setDateTo(e);
    setIsCustomRangeActive(false);
    setSelectedPeriod('This Month');
    setShowDatePickerModal(false);
    loadStats({});
  };

  useEffect(() => {
    loadStats();
  }, []);

  // Detailed Metric & Chart Explanation Dictionary for the (i) Info Icons
  const EXPLANATION_GUIDE = {
    totalLeads: {
      title: 'Total Leads (Kull Total Enquiries)',
      category: 'KPI Summary Card',
      howItWorks: 'Yeh card CRM database me stored sabhi active prospective student inquiries ki live count dikhata hai jo Meta Ads, Google Ads, Website forms aur Walk-in channels se aayi hain.',
      whoAndHow: '👤 Kisko Karna Hai: Marketing Team, Lead Finders aur Admins.\n🎯 Kaise Karna Hai: Active campaigns ko monitor karein, website inquiry forms maintain rakhein aur CSV bulk upload se regular prospective student leads import karein.',
      growthStrategy: '🚀 Growth Tips: Multiple lead generation channels (Instagram Reels, Google Search, Campus Open Days) active rakhein. Fresh inquiries aane par system me lead volume har mahine 25-30% badhta hai.',
      formula: 'Sum of all active non-archived lead records in database'
    },
    newLeads: {
      title: 'New Leads (Nayi Aayi Enquiries)',
      category: 'KPI Summary Card',
      howItWorks: 'Aise fresh student inquiries jinhe abhi tak kisi bhi counselor ne call ya WhatsApp nahi kiya hai (Status = NEW). Yeh card immediate response pending queue ko show karta hai.',
      whoAndHow: '👤 Kisko Karna Hai: Tele-Counselors aur Admission Officers.\n🎯 Kaise Karna Hai: Nayi lead aate hi 15 minute ke andar Direct Call ya WhatsApp karein, course eligibility check karein aur status ko "GIVEN_DETAILS" ya "INTERESTED" me update karein.',
      growthStrategy: '🚀 Growth Tips: 15-Minute Rule follow karein! Inquiry aate hi pehle 15 minute me contact karne se student ka conversion rate 300% tak badh jata hai bcoz student ka interest peak par hota hai.',
      formula: 'Count of leads with status = "NEW"'
    },
    interestedLeads: {
      title: 'Interested Leads (Ruci Rakhne Wale Students)',
      category: 'KPI Summary Card',
      howItWorks: 'Aise high-intent prospective students jinhone counseling call attend kar li hai aur aviation courses (CPL, Cabin Crew, AME, Safety) me admission lene me strong positive interest dikhaya hai.',
      whoAndHow: '👤 Kisko Karna Hai: Senior Admission Counselors aur Course Advisors.\n🎯 Kaise Karna Hai: Student aur parents ke sath Flight Simulator Trial session book karein, syllabus & fee structure PDF bhejein aur scholarship options discuss karein.',
      growthStrategy: '🚀 Growth Tips: 48-Hour Follow-up rule! Interested students ko 48 ghante ke andar Campus Visit / Simulator Experience offer karein, jisse 70%+ students immediate registration fee deposit karte hain.',
      formula: 'Count of leads with status = "INTERESTED"'
    },
    followupsToday: {
      title: "Today's Follow-ups (Aaj ke Scheduled Callbacks)",
      category: 'KPI Summary Card',
      howItWorks: 'Aaj ki tareekh ke liye scheduled counselor callback appointments aur tasks ki real-time count. Yeh counselors ka daily high-priority action queue hai.',
      whoAndHow: '👤 Kisko Karna Hai: Case Assigned Counselors aur Student Relationship Officers.\n🎯 Kaise Karna Hai: Subah dashboard open karke scheduled time par student ko call karein, parent doubts resolve karein aur outcome CRM me log karein.',
      growthStrategy: '🚀 Growth Tips: Zero Pending Target! Sham 5 baje se pehle 100% daily callbacks complete karein. Promised time par call karne se student dusri academy jane se bach jata hai.',
      formula: 'Pending follow-up records with due date = Today'
    },
    convertedLeads: {
      title: 'Converted Leads (Enrolled Admissions)',
      category: 'KPI Summary Card',
      howItWorks: 'Un successful students ki total count jinhone counseling poori karke AEERO me final registration form submit kiya aur admission fee deposit kar di hai.',
      whoAndHow: '👤 Kisko Karna Hai: Admission Cell, Accounts Department & Counselors.\n🎯 Kaise Karna Hai: "Record Payment" button se student fee deposit enter karein, admission confirmation slip issue karein aur batch orientation schedule karein.',
      growthStrategy: '🚀 Growth Tips: Enrolled students se referral program promote karwayein aur batch orientation simulator videos share karein jisse high-quality word-of-mouth leads attract hon.',
      formula: 'Count of leads marked with status = "CONVERTED" or "WON"'
    },
    conversionRate: {
      title: 'Conversion Rate Percentage (% Admission Ratio)',
      category: 'KPI Summary Card',
      howItWorks: 'Yeh percentage dikhata hai ki total aayi hui inquiries me se kitne percent students ne final enrolled admission complete kiya.',
      whoAndHow: '👤 Kisko Karna Hai: Center Head, Admission Directors & Team Leads.\n🎯 Kaise Karna Hai: Counselor-wise aur Source-wise conversion report compare karein, regular objection-handling workshops lein aur counseling scripts optimize karein.',
      growthStrategy: '🚀 Growth Tips: Industry benchmark 8% se 15% maintain rakhein. High-converting marketing sources (Google Search, Referrals) me ad budget concentrate karne se overall conversion 2x hoti hai.',
      formula: '(Total Converted Leads / Total Leads) * 100'
    },
    totalCollectedRevenue: {
      title: 'Total Collected Income (Course Fee Revenue)',
      category: 'KPI Summary Card',
      howItWorks: 'Enrolled students dwara deposit ki gayi admission fee, registration fee aur installment payments ka real-time aggregate total verified revenue.',
      whoAndHow: '👤 Kisko Karna Hai: Accounts Team, Cashier & Admission Officers.\n🎯 Kaise Karna Hai: Har payment aate hi UPI/Cash/NEFT transaction ID ke sath "Record Payment" submit karein aur automated digital receipt generate karein.',
      growthStrategy: '🚀 Growth Tips: Flexible installment plans aur 0-cost EMI options offer karein, sath hi upcoming installment alerts set karein taaki fee recovery 98%+ on-time ho.',
      formula: 'Sum of all verified payments recorded in database'
    },
    leadPipeline: {
      title: 'Lead Pipeline Funnel (Stage-by-Stage Progression)',
      category: 'Pipeline Analysis Chart',
      howItWorks: 'Visual funnel chart jo dikhata hai ki students admission journey ke kis stage me hain (New ➔ No Answer ➔ Given Details ➔ Interested ➔ Follow-up ➔ Converted ➔ Lost).',
      whoAndHow: '👤 Kisko Karna Hai: All Admission Counselors & Team Supervisors.\n🎯 Kaise Karna Hai: Har phone call ya counseling meeting ke turant baad lead ka status next stage me update karein taaki funnel live rahe.',
      growthStrategy: '🚀 Growth Tips: Funnel bottlenecks detect karein! Agar "Given Details" me leads ruke hain toh fee breakdown simple karein; agar "No Answer" jyada hai toh WhatsApp updates send karein.',
      formula: 'Stage-wise lead count distribution'
    },
    leadsTrend: {
      title: 'Leads Trend Area Chart (Inquiry Velocity & Growth)',
      category: 'Acquisition Velocity Chart',
      howItWorks: 'Day-by-day aur Month-by-month lead generation speed ka smooth area curve chart jo marketing campaigns ki daily inquiry velocity dikhata hai.',
      whoAndHow: '👤 Kisko Karna Hai: Digital Marketing Manager & Campaign Coordinators.\n🎯 Kaise Karna Hai: Lead spikes track karein aur dekhein kis weekend ya course ad campaign ke doran sabse jyada inquiries aayi hain.',
      growthStrategy: '🚀 Growth Tips: Peak inquiry days (usually Sunday aur Monday) identify karke us waqt marketing ad spend badhayein aur counselor shifts active rakhein.',
      formula: 'Time-series aggregation of active leads by creation date'
    },
    sourcePerformanceChart: {
      title: 'Lead Source Performance (Marketing Channels Donut)',
      category: 'Marketing Source Analytics',
      howItWorks: 'Donut chart jo batata hai ki students kis marketing channel se aa rahe hain (Meta Ads, Website, Google Ads, WhatsApp, Referral, Walk-in).',
      whoAndHow: '👤 Kisko Karna Hai: Marketing Team & Performance Media Buyers.\n🎯 Kaise Karna Hai: Har digital campaign aur website form me source UTM tagging enable rakhein taaki 100% leads auto-categorize hon.',
      growthStrategy: '🚀 Growth Tips: Channel ROI Analyze karein! Lowest cost per converted student dene wale channels (jaise Website organic aur Meta Ads) me 70% ad budget invest karein.',
      formula: 'Proportional percentage of total leads generated per source channel'
    },
    activityDistributionChart: {
      title: 'Activity Distribution (Counselor Touchpoints Donut)',
      category: 'Counselor Effort Breakdown',
      howItWorks: 'Counselors dwara kiye gaye communication touchpoints (Calls, WhatsApp messages, Emails, Campus Meetings, Counselor Notes) ka real-time distribution.',
      whoAndHow: '👤 Kisko Karna Hai: Tele-Counselors, Support Staff & Admissions.\n🎯 Kaise Karna Hai: Har call, chat ya meeting ke baad "Log Activity" button se record enter karein.',
      growthStrategy: '🚀 Growth Tips: 3-Touchpoint Rule apply karein! Har prospective student ko 1 Call + 1 WhatsApp Syllabus + 1 Campus Invitation Email bhejne se response 400% badhta hai.',
      formula: 'Count of logged communication activities grouped by activity type'
    },
    todaysFollowupsList: {
      title: "Today's Follow-ups List (Counselor Work Queue)",
      category: 'Daily Work List',
      howItWorks: 'Aaj ke scheduled callback appointments ki prioritized list time ke hisab se sorted. Counselors yahan se directly lead open karke call kar sakte hain.',
      whoAndHow: '👤 Kisko Karna Hai: Assigned Counselors.\n🎯 Kaise Karna Hai: Lead name par click karein, counseling workspace se direct dial karein, remarks note karein aur next followup date set karein.',
      growthStrategy: '🚀 Growth Tips: Daily morning standup me aaj ki list review karein aur sham tak 100% callbacks complete karke conversion speed maximize karein.',
      formula: 'Pending follow-up appointments scheduled for today'
    },
    overdueFollowupsList: {
      title: 'Overdue Follow-ups Alert (Missed Callbacks Queue)',
      category: 'Urgent Action Queue',
      howItWorks: '🚨 Emergency Alert Queue! Un callback appointments ko highlight karta hai jinki scheduled tareekh nikal chuki hai aur missed ho gayi hain.',
      whoAndHow: '👤 Kisko Karna Hai: Team Lead & Assigned Counselors.\n🎯 Kaise Karna Hai: Overdue leads ko turant priority call lagayein ya active counselor ko re-assign karke list ko clean karein.',
      growthStrategy: '🚀 Growth Tips: Overdue leads ko 24 ghante ke andar clear karein. Overdue count 0 rakhne se student drop-off rate 90% kam hota hai.',
      formula: 'Pending callbacks where scheduled date is earlier than today'
    },
    recentActivitiesList: {
      title: 'Recent Activities Feed (Live Audit Stream)',
      category: 'Live Audit Log',
      howItWorks: 'Counselors aur system dwara CRM me kiye gaye latest actions (calls logged, status updates, fee deposits) ka real-time audit feed.',
      whoAndHow: '👤 Kisko Karna Hai: Admins, Supervisors & Counselors.\n🎯 Kaise Karna Hai: Real-time feed se counseling interactions monitor karein aur team activity quality check karein.',
      growthStrategy: '🚀 Growth Tips: High activity volume directly higher conversions create karti hai. Top counselors ke best call remarks baki team ke sath share karein.',
      formula: 'Latest 5 audit and activity events sorted by timestamp'
    },
    employeePerformanceTable: {
      title: 'Employee Performance Leaderboard',
      category: 'Counselor Productivity Table',
      howItWorks: 'Har counselor ki individual productivity report: Assigned Leads, Contacted Count, Interested Count, Converted Admissions aur Conversion Rate %.',
      whoAndHow: '👤 Kisko Karna Hai: Admission Counselors & Team Managers.\n🎯 Kaise Karna Hai: Counselors apne individual conversion rate bar ko target 10%+ par push karein.',
      growthStrategy: '🚀 Growth Tips: Monthly top-performing counselor ko recognition & incentives dein, aur low conversion staff ko mock-call practice coaching dein.',
      formula: 'Assigned leads vs Converted admissions and conversion % per counselor'
    },
    topLeadSourcesTable: {
      title: 'Top Lead Sources Efficiency Table (Channel ROI)',
      category: 'Channel ROI Table',
      howItWorks: 'Marketing channels ko rank karta hai based on Student Lead Quality, Interested count aur final Admission Conversion %.',
      whoAndHow: '👤 Kisko Karna Hai: Management & Performance Marketing Team.\n🎯 Kaise Karna Hai: Har channel ke conversion rate aur lead volume ko analyze karein.',
      growthStrategy: '🚀 Growth Tips: Low-converting ad sources ko pause ya revamp karein aur highest converting channels me budget double karein for exponential growth.',
      formula: 'Source breakdown of leads, interested leads, conversions, and conversion rate'
    }
  };

  // Helper to open info popover
  const showInfo = (key) => {
    if (EXPLANATION_GUIDE[key]) {
      setActiveInfoModal(EXPLANATION_GUIDE[key]);
    }
  };

  // Open KPI Detail Modal with real data
  const openDetail = async (type) => {
    setDetailModal(type);
    setDetailLoading(true);
    setDetailData([]);
    try {
      if (type === 'totalLeads' || type === 'leadPipeline' || type === 'leadsTrend' || type === 'sourcePerformance') {
        const leads = await api.getLeads({});
        setDetailData(Array.isArray(leads) ? leads : []);
      } else if (type === 'newLeads') {
        const leads = await api.getLeads({ status: 'New' });
        setDetailData(Array.isArray(leads) ? leads : []);
      } else if (type === 'interested') {
        const leads = await api.getLeads({ status: 'Interested' });
        setDetailData(Array.isArray(leads) ? leads : []);
      } else if (type === 'converted') {
        const leads = await api.getLeads({ status: 'Converted' });
        setDetailData(Array.isArray(leads) ? leads : []);
      } else if (type === 'followups') {
        const tasks = await api.getTasks();
        const today = new Date().toISOString().split('T')[0];
        const todayTasks = (Array.isArray(tasks) ? tasks : []).filter(t => t.dueDate === today);
        setDetailData(todayTasks);
      } else if (type === 'payments') {
        const leads = await api.getLeads({ includeArchived: true });
        const allLeads = Array.isArray(leads) ? leads : [];
        const paymentRows = [];
        for (const lead of allLeads) {
          if (lead.payments && lead.payments.length > 0) {
            lead.payments.forEach(p => {
              paymentRows.push({ ...p, leadName: lead.name, leadId: lead.leadId, course: lead.interestedCourse });
            });
          }
          if (lead.paidAmount && Number(lead.paidAmount) > 0 && (!lead.payments || lead.payments.length === 0)) {
            paymentRows.push({ amount: lead.paidAmount, leadName: lead.name, leadId: lead.leadId, course: lead.interestedCourse, method: '-', date: lead.updatedAt || '-' });
          }
        }
        setDetailData(paymentRows);
      } else if (type === 'activityDistribution') {
        const auditLogs = await api.getAuditLogs();
        setDetailData(Array.isArray(auditLogs) ? auditLogs : []);
      }
    } catch (err) {
      console.error('Failed to load detail data:', err);
      setDetailData([]);
    } finally {
      setDetailLoading(false);
    }
  };

  const DETAIL_TITLES = {
    totalLeads: 'All Leads — Detailed Directory',
    newLeads: 'New Leads — Pending First Contact',
    interested: 'Interested Leads — Positive Response',
    converted: 'Converted Leads — Enrolled Students',
    followups: "Today's Follow-ups & Tasks",
    payments: 'Payment Records — Course Fee Collection',
    leadPipeline: 'Lead Pipeline — Stage Breakdown',
    leadsTrend: 'Leads Trend — Acquisition History',
    sourcePerformance: 'Lead Source Channels — Channel Breakdown',
    activityDistribution: 'Activity Distribution — Communication Logs'
  };

  // 1. Real Pipeline Funnel Data
  const pipelineData = (stats.leadPipeline && stats.leadPipeline.length > 0)
    ? stats.leadPipeline
    : [
      { name: 'New', count: stats.newLeads || 0, fill: '#3B82F6', label: String(stats.newLeads || 0) },
      { name: 'No Answer', count: stats.noAnswerLeads || 0, fill: '#F59E0B', label: String(stats.noAnswerLeads || 0) },
      { name: 'Given Details', count: stats.givenDetailsLeads || 0, fill: '#8B5CF6', label: String(stats.givenDetailsLeads || 0) },
      { name: 'Interested', count: stats.interestedLeads || 0, fill: '#10B981', label: String(stats.interestedLeads || 0) },
      { name: 'Follow-up', count: stats.followupLeads || 0, fill: '#0EA5E9', label: String(stats.followupLeads || 0) },
      { name: 'Converted', count: stats.convertedLeads || 0, fill: '#16A34A', label: String(stats.convertedLeads || 0) },
      { name: 'Lost', count: stats.lostLeads || 0, fill: '#EF4444', label: String(stats.lostLeads || 0) }
    ];

  const maxPipelineCount = Math.max(...pipelineData.map(p => p.count), 1);

  // 2. Real Leads Trend Data
  const trendLineData = (stats.leadTrend && stats.leadTrend.length > 0)
    ? stats.leadTrend.map(t => ({
      label: t.label || t.day || t.month || 'Date',
      value: Number(t.value ?? t.count ?? t.total ?? 0)
    }))
    : [{ label: 'Today', value: stats.totalLeads || 0 }];

  // 3. Real Lead Source Performance Donut Data
  const sourceDonutData = (stats.sourcePerformance && stats.sourcePerformance.length > 0)
    ? stats.sourcePerformance.map(s => ({
      name: s.source || s.name || 'Direct',
      count: Number(s.count ?? s.total ?? 0),
      percent: s.percent || '0%',
      color: s.color || '#EAB308'
    }))
    : [{ name: 'Meta Ads', count: stats.totalLeads || 0, percent: '100%', color: '#EAB308' }];

  // 4. Real Activity Distribution Donut Data
  const activityDonutData = (stats.activityDistribution && stats.activityDistribution.length > 0)
    ? stats.activityDistribution.map(a => ({
      name: a.name,
      count: Number(a.count ?? 0),
      percent: a.percent || '0%',
      color: a.color || '#EAB308'
    }))
    : [{ name: 'Calls', count: 0, percent: '0%', color: '#EAB308' }];

  const totalActivitiesDisplay = stats.totalActivitiesCount ?? activityDonutData.reduce((s, a) => s + (a.count || 0), 0);

  // 5. Today's Follow-ups List
  const todaysFollowups = stats.todaysFollowupsList || [];

  // 6. Overdue Follow-ups List
  const overdueFollowups = stats.overdueFollowupsList || [];

  // 7. Recent Activities Feed
  const recentActivities = stats.recentActivities || [];

  // 8. Employee Performance Data
  const employeePerfData = (stats.employeePerformance && stats.employeePerformance.length > 0)
    ? stats.employeePerformance.map((emp, idx) => {
      const initials = (emp.name || 'User')
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
      const badgeBgs = ['bg-amber-700 text-white', 'bg-amber-800 text-white', 'bg-amber-900 text-white', 'bg-[#5C4509] text-white', 'bg-blue-800 text-white'];
      const rateVal = parseFloat(emp.conversionRate) || 0;
      return {
        badge: initials,
        badgeBg: badgeBgs[idx % badgeBgs.length],
        name: emp.name,
        assigned: emp.assigned || 0,
        contacted: emp.contacted || 0,
        interested: emp.interested || 0,
        converted: emp.converted || 0,
        rate: `${rateVal}%`,
        barWidth: `${Math.min(100, Math.max(8, rateVal * 8))}%`
      };
    })
    : [];

  // 9. Top Lead Sources Data
  const topSourcesData = (stats.sourcePerformance && stats.sourcePerformance.length > 0)
    ? stats.sourcePerformance.map((s) => {
      const rateVal = parseFloat(s.conversionRate) || 0;
      return {
        source: s.source,
        leads: s.leads || s.count || 0,
        interested: s.interested || 0,
        converted: s.converted || 0,
        rate: `${rateVal}%`,
        barWidth: `${Math.min(100, Math.max(8, rateVal * 8))}%`
      };
    })
    : [];

  return (
    <div className={`space-y-6 -m-6 p-6 min-h-screen font-sans transition-colors ${darkMode ? 'bg-[#0F1217] text-slate-100' : 'bg-[#EEF2F6] text-slate-800'
      }`}>

      {/* ---------------------------------------------------- */}
      {/* PAGE HEADER BAR WITH ACTIONS & DATE FILTER           */}
      {/* ---------------------------------------------------- */}
      <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5 rounded-2xl border shadow-xs transition-colors ${darkMode ? 'bg-[#181D26] border-[#262F3D] text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
        <div>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${darkMode ? 'bg-[#E5A812]/20 border border-[#E5A812]/40 text-[#E5A812]' : 'bg-amber-50 border border-amber-200 text-[#7D610F]'
              }`}>
              <span className="material-symbols-outlined text-2xl">grid_view</span>
            </div>
            <div>
              <h1 className={`text-2xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>Dashboard</h1>
              <p className={`text-xs font-medium mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Welcome back, <strong className={darkMode ? 'text-white' : 'text-slate-900'}>{currentUser?.name || 'Admin User 1'}</strong>! Here's what's happening with your leads today.
              </p>
            </div>
          </div>
        </div>

        {/* Right Header Actions */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">

          {/* Date Picker Button with Real Dynamic Date Range & Popover Trigger */}
          <div 
            onClick={() => setShowDatePickerModal(true)}
            className={`flex items-center gap-2 border rounded-xl px-3 py-2 text-xs font-semibold shadow-xs cursor-pointer transition-all ${
              isCustomRangeActive
                ? (darkMode ? 'bg-amber-950/40 border-[#E5A812] text-amber-200 ring-1 ring-[#E5A812]/50' : 'bg-amber-50 border-[#7D610F] text-[#7D610F] ring-1 ring-[#7D610F]/30')
                : (darkMode ? 'bg-[#12161F] border-[#262F3D] text-slate-200 hover:bg-[#1C222D]' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100')
            }`}
            title="Click to select custom Start Date and End Date range for analytics"
          >
            <span className={`material-symbols-outlined text-lg ${isCustomRangeActive ? (darkMode ? 'text-[#E5A812]' : 'text-[#7D610F]') : (darkMode ? 'text-slate-400' : 'text-slate-500')}`}>calendar_today</span>
            <span>{displayDateString}</span>
            <span className={`material-symbols-outlined text-base ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>edit_calendar</span>
          </div>

          {/* Timeframe Dropdown with Real Current Month & Year */}
          <select
            value={selectedPeriod}
            onChange={(e) => {
              const val = e.target.value;
              if (val === 'Custom') {
                setShowDatePickerModal(true);
              } else {
                applyPreset(val);
              }
            }}
            className={`border rounded-xl px-3 py-2 text-xs font-semibold outline-none cursor-pointer shadow-xs focus:ring-2 focus:ring-[#D99B00] ${darkMode ? 'bg-[#12161F] border-[#262F3D] text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
          >
            <option value="This Month">This Month ({currentMonthShort})</option>
            <option value="Today">Today</option>
            <option value="Yesterday">Yesterday</option>
            <option value="Last 7 Days">Last 7 Days</option>
            <option value="Last 30 Days">Last 30 Days</option>
            <option value="Last Month">Last Month</option>
            <option value="This Quarter">This Quarter</option>
            <option value={`Year ${currentYear}`}>Year {currentYear}</option>
            {isCustomRangeActive && selectedPeriod === 'Custom' && (
              <option value="Custom">Custom Range</option>
            )}
          </select>

          {/* Notifications Icon */}
          <button
            onClick={() => onNavigate('notifications')}
            className={`relative w-9 h-9 rounded-xl border flex items-center justify-center transition-all shadow-xs ${darkMode ? 'bg-[#12161F] border-[#262F3D] text-slate-300 hover:text-white hover:bg-[#1C222D]' : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            title="Notifications"
          >
            <span className="material-symbols-outlined text-xl">notifications</span>
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#D99B00] text-black font-extrabold text-[9px] rounded-full flex items-center justify-center">3</span>
          </button>

          {/* User Profile Badge */}
          <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-xs font-bold shadow-xs ${darkMode ? 'bg-[#2A2100] text-amber-200 border-[#D4AF37]/40' : 'bg-amber-100 text-[#7D610F] border-amber-200'
            }`}>
            <span className="w-6 h-6 rounded-lg bg-[#D99B00] text-black flex items-center justify-center text-[10px] font-black">
              {(currentUser?.name || 'Admin User 1').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </span>
            <span>{currentUser?.name || 'Admin User 1'}</span>
          </div>

          {/* Add Lead CTA Button */}
          <button
            onClick={onOpenAddLead}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all shadow-sm active:scale-95 ${darkMode
              ? 'bg-[#D99B00] hover:bg-[#E5A812] text-slate-950'
              : 'bg-[#7D610F] hover:bg-[#634C0A] text-white'
              }`}
          >
            <span className="material-symbols-outlined text-lg font-black">add</span>
            <span>Add Lead</span>
          </button>

        </div>
      </div>

      {/* Active Custom Date Range Indicator Banner */}
      {isCustomRangeActive && (
        <div className={`flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-xl border text-xs font-semibold shadow-xs transition-colors ${
          darkMode ? 'bg-amber-950/40 text-amber-200 border-[#E5A812]/40' : 'bg-amber-50 text-[#7D610F] border-amber-200'
        }`}>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-[#E5A812]">filter_alt</span>
            <span>Filtered Analytics Date Window: <strong className={darkMode ? 'text-white' : 'text-slate-900'}>{displayDateString}</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDatePickerModal(true)}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20 transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">edit_calendar</span>
              <span>Change Range</span>
            </button>
            <button
              onClick={handleResetDateFilter}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
              <span>Clear Filter</span>
            </button>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* ROW 1: TOP KPI CARDS WITH (i) INFO BUTTONS           */}
      {/* ---------------------------------------------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-7 gap-3.5">

        {/* Card 1: TOTAL LEADS */}
        <div onClick={() => openDetail('totalLeads')} className={`rounded-xl p-3.5 border shadow-xs hover:shadow-md transition-all relative group flex flex-col justify-between cursor-pointer ${darkMode ? 'bg-[#181D26] border-[#262F3D] text-white hover:border-[#E5A812]/50' : 'bg-white border-slate-300/80 text-slate-900 hover:border-[#7D610F]/50'
          }`}>
          <div className="flex items-start justify-between">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 shadow-2xs ${darkMode ? 'bg-[#E5A812]/20 text-[#E5A812]' : 'bg-amber-100 text-[#7D610F]'
              }`}>
              <span className="material-symbols-outlined text-xl">group</span>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); showInfo('totalLeads'); }}
              className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${darkMode ? 'bg-[#12161F] text-slate-400 hover:text-[#E5A812]' : 'bg-slate-100 hover:bg-amber-100 text-slate-400 hover:text-[#7D610F]'
                }`}
              title="Click for metric explanation"
            >
              <span className="material-symbols-outlined text-xs">info</span>
            </button>
          </div>
          <div className="mt-2">
            <p className="text-[10px] font-bold tracking-wider uppercase text-slate-400 truncate">TOTAL LEADS</p>
            <h3 className={`text-xl md:text-2xl font-black mt-0.5 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              {loading ? '...' : (stats.totalLeads ?? 0)}
            </h3>
            <div className="flex items-center gap-1 text-[10px] font-semibold text-amber-500 mt-0.5 truncate">
              <span className="material-symbols-outlined text-xs flex-shrink-0">database</span>
              <span>Active pipeline enquiries</span>
            </div>
          </div>
        </div>

        {/* Card 2: NEW LEADS */}
        <div onClick={() => openDetail('newLeads')} className={`rounded-xl p-3.5 border shadow-xs hover:shadow-md transition-all relative group flex flex-col justify-between cursor-pointer ${darkMode ? 'bg-[#181D26] border-[#262F3D] text-white hover:border-[#3B82F6]/50' : 'bg-white border-slate-300/80 text-slate-900 hover:border-blue-400/50'
          }`}>
          <div className="flex items-start justify-between">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 shadow-2xs ${darkMode ? 'bg-[#3B82F6]/20 text-[#3B82F6]' : 'bg-blue-100 text-blue-600'
              }`}>
              <span className="material-symbols-outlined text-xl">person_add</span>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); showInfo('newLeads'); }}
              className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${darkMode ? 'bg-[#12161F] text-slate-400 hover:text-[#3B82F6]' : 'bg-slate-100 hover:bg-blue-100 text-slate-400 hover:text-blue-600'
                }`}
              title="Click for metric explanation"
            >
              <span className="material-symbols-outlined text-xs">info</span>
            </button>
          </div>
          <div className="mt-2">
            <p className="text-[10px] font-bold tracking-wider uppercase text-slate-400 truncate">NEW LEADS</p>
            <h3 className={`text-xl md:text-2xl font-black mt-0.5 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              {loading ? '...' : (stats.newLeads ?? 0)}
            </h3>
            <div className="flex items-center gap-1 text-[10px] font-semibold text-blue-400 mt-0.5 truncate">
              <span className="material-symbols-outlined text-xs flex-shrink-0">fiber_new</span>
              <span>{stats.totalLeads > 0 ? `${((stats.newLeads / stats.totalLeads) * 100).toFixed(1)}% of total` : '0% of total'}</span>
            </div>
          </div>
        </div>

        {/* Card 3: INTERESTED */}
        <div onClick={() => openDetail('interested')} className={`rounded-xl p-3.5 border shadow-xs hover:shadow-md transition-all relative group flex flex-col justify-between cursor-pointer ${darkMode ? 'bg-[#181D26] border-[#262F3D] text-white hover:border-[#10B981]/50' : 'bg-white border-slate-300/80 text-slate-900 hover:border-emerald-400/50'
          }`}>
          <div className="flex items-start justify-between">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 shadow-2xs ${darkMode ? 'bg-[#10B981]/20 text-[#10B981]' : 'bg-emerald-100 text-emerald-600'
              }`}>
              <span className="material-symbols-outlined text-xl">track_changes</span>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); showInfo('interestedLeads'); }}
              className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${darkMode ? 'bg-[#12161F] text-slate-400 hover:text-[#10B981]' : 'bg-slate-100 hover:bg-emerald-100 text-slate-400 hover:text-emerald-600'
                }`}
              title="Click for metric explanation"
            >
              <span className="material-symbols-outlined text-xs">info</span>
            </button>
          </div>
          <div className="mt-2">
            <p className="text-[10px] font-bold tracking-wider uppercase text-slate-400 truncate">INTERESTED</p>
            <h3 className={`text-xl md:text-2xl font-black mt-0.5 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              {loading ? '...' : (stats.interestedLeads ?? 0)}
            </h3>
            <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-500 mt-0.5 truncate">
              <span className="material-symbols-outlined text-xs flex-shrink-0">thumb_up</span>
              <span>{stats.totalLeads > 0 ? `${((stats.interestedLeads / stats.totalLeads) * 100).toFixed(1)}% warm leads` : '0% warm leads'}</span>
            </div>
          </div>
        </div>

        {/* Card 4: FOLLOW-UPS TODAY */}
        <div onClick={() => openDetail('followups')} className={`rounded-xl p-3.5 border shadow-xs hover:shadow-md transition-all relative group flex flex-col justify-between cursor-pointer ${darkMode ? 'bg-[#181D26] border-[#262F3D] text-white hover:border-[#F59E0B]/50' : 'bg-white border-slate-300/80 text-slate-900 hover:border-orange-400/50'
          }`}>
          <div className="flex items-start justify-between">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 shadow-2xs ${darkMode ? 'bg-[#F59E0B]/20 text-[#F59E0B]' : 'bg-orange-100 text-orange-600'
              }`}>
              <span className="material-symbols-outlined text-xl">calendar_clock</span>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); showInfo('followupsToday'); }}
              className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${darkMode ? 'bg-[#12161F] text-slate-400 hover:text-[#F59E0B]' : 'bg-slate-100 hover:bg-orange-100 text-slate-400 hover:text-orange-600'
                }`}
              title="Click for metric explanation"
            >
              <span className="material-symbols-outlined text-xs">info</span>
            </button>
          </div>
          <div className="mt-2">
            <p className="text-[10px] font-bold tracking-wider uppercase text-slate-400 truncate">FOLLOW-UPS TODAY</p>
            <h3 className={`text-xl md:text-2xl font-black mt-0.5 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              {loading ? '...' : (stats.followupsToday ?? 0)}
            </h3>
            <div className="flex items-center gap-1 text-[10px] font-semibold text-orange-400 mt-0.5 truncate">
              <span className="material-symbols-outlined text-xs flex-shrink-0">schedule</span>
              <span>{stats.overdueFollowups || 0} overdue tasks</span>
            </div>
          </div>
        </div>

        {/* Card 5: CONVERTED */}
        <div onClick={() => openDetail('converted')} className={`rounded-xl p-3.5 border shadow-xs hover:shadow-md transition-all relative group flex flex-col justify-between cursor-pointer ${darkMode ? 'bg-[#181D26] border-[#262F3D] text-white hover:border-[#A855F7]/50' : 'bg-white border-slate-300/80 text-slate-900 hover:border-purple-400/50'
          }`}>
          <div className="flex items-start justify-between">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 shadow-2xs ${darkMode ? 'bg-[#A855F7]/20 text-[#A855F7]' : 'bg-purple-100 text-purple-600'
              }`}>
              <span className="material-symbols-outlined text-xl">person_check</span>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); showInfo('convertedLeads'); }}
              className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${darkMode ? 'bg-[#12161F] text-slate-400 hover:text-[#A855F7]' : 'bg-slate-100 hover:bg-purple-100 text-slate-400 hover:text-purple-600'
                }`}
              title="Click for metric explanation"
            >
              <span className="material-symbols-outlined text-xs">info</span>
            </button>
          </div>
          <div className="mt-2">
            <p className="text-[10px] font-bold tracking-wider uppercase text-slate-400 truncate">CONVERTED</p>
            <h3 className={`text-xl md:text-2xl font-black mt-0.5 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              {loading ? '...' : (stats.convertedLeads ?? 0)}
            </h3>
            <div className="flex items-center gap-1 text-[10px] font-semibold text-purple-400 mt-0.5 truncate">
              <span className="material-symbols-outlined text-xs flex-shrink-0">check_circle</span>
              <span>{stats.totalLeads > 0 ? `${((stats.convertedLeads / stats.totalLeads) * 100).toFixed(1)}% admissions` : '0% admissions'}</span>
            </div>
          </div>
        </div>

        {/* Card 6: CONVERSION RATE */}
        <div className={`rounded-xl p-3.5 border shadow-xs hover:shadow-md transition-all relative group flex flex-col justify-between ${darkMode ? 'bg-[#181D26] border-[#262F3D] text-white' : 'bg-white border-slate-300/80 text-slate-900'
          }`}>
          <div className="flex items-start justify-between">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 shadow-2xs ${darkMode ? 'bg-[#E5A812]/20 text-[#E5A812]' : 'bg-amber-100 text-amber-700'
              }`}>
              <span className="material-symbols-outlined text-xl">insights</span>
            </div>
            <button
              onClick={() => showInfo('conversionRate')}
              className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${darkMode ? 'bg-[#12161F] text-slate-400 hover:text-[#E5A812]' : 'bg-slate-100 hover:bg-amber-100 text-slate-400 hover:text-amber-700'
                }`}
              title="Click for metric explanation"
            >
              <span className="material-symbols-outlined text-xs">info</span>
            </button>
          </div>
          <div className="mt-2">
            <p className="text-[10px] font-bold tracking-wider uppercase text-slate-400 truncate">CONVERSION RATE</p>
            <h3 className={`text-xl md:text-2xl font-black mt-0.5 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              {loading ? '...' : `${stats.conversionRate ?? '0.0'}%`}
            </h3>
            <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-500 mt-0.5 truncate">
              <span className="material-symbols-outlined text-xs flex-shrink-0">trending_up</span>
              <span>{stats.convertedLeads ?? 0} of {stats.totalLeads ?? 0} won</span>
            </div>
          </div>
        </div>

        {/* Card 7: TOTAL COLLECTED REVENUE */}
        <div onClick={() => openDetail('payments')} className={`rounded-xl p-3.5 border shadow-xs hover:shadow-md transition-all relative group flex flex-col justify-between cursor-pointer ${darkMode ? 'bg-[#181D26] border-[#262F3D] text-white hover:border-emerald-500/50' : 'bg-white border-slate-300/80 text-slate-900 hover:border-emerald-400/50'
          }`}>
          <div className="flex items-start justify-between">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 shadow-2xs ${darkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
              }`}>
              <span className="material-symbols-outlined text-xl">payments</span>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); showInfo('totalCollectedRevenue'); }}
              className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${darkMode ? 'bg-[#12161F] text-slate-400 hover:text-emerald-400' : 'bg-slate-100 hover:bg-emerald-100 text-slate-400 hover:text-emerald-700'
                }`}
              title="Recorded student course fee payments"
            >
              <span className="material-symbols-outlined text-xs">info</span>
            </button>
          </div>
          <div className="mt-2">
            <p className="text-[10px] font-bold tracking-wider uppercase text-slate-400 truncate">TOTAL COLLECTED INCOME</p>
            <h3 className={`text-lg md:text-xl font-black mt-0.5 ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
              ₹ {loading ? '...' : (stats.totalCollectedRevenue ?? '0')}
            </h3>
            <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-500 mt-0.5 truncate">
              <span className="material-symbols-outlined text-xs flex-shrink-0">verified</span>
              <span>Live recorded payments</span>
            </div>
          </div>
        </div>

      </div>

      {/* ---------------------------------------------------- */}
      {/* ROW 2: 4 MIDDLE CHARTS GRID                          */}
      {/* ---------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

        {/* Chart 1: Lead Pipeline (Funnel Visual Bar Chart) */}
        <div className={`p-4 rounded-xl border shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${darkMode ? 'bg-[#181D26] border-[#262F3D] text-white' : 'bg-white border-slate-300/80 text-slate-900'
          }`}>
          <div className={`flex items-center justify-between border-b pb-2 mb-2 ${darkMode ? 'border-[#222936]' : 'border-slate-100'}`}>
            <div className="cursor-pointer" onClick={() => openDetail('leadPipeline')}>
              <h3 className={`font-bold text-xs hover:text-[#E5A812] transition-colors ${darkMode ? 'text-white' : 'text-slate-900'}`}>Lead Pipeline</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Total leads in each stage</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => openDetail('leadPipeline')}
                className="text-[10px] font-bold text-[#E5A812] hover:underline px-1"
                title="View detailed breakdown"
              >
                View
              </button>
              <button
                onClick={() => showInfo('leadPipeline')}
                className={`transition-colors p-0.5 rounded-lg ${darkMode ? 'text-slate-400 hover:text-[#E5A812]' : 'text-slate-400 hover:text-[#7D610F] hover:bg-slate-50'}`}
                title="Click for explanation"
              >
                <span className="material-symbols-outlined text-base">info</span>
              </button>
            </div>
          </div>

          {/* Custom Sleek Funnel Visual Representation with Real Data */}
          <div className="space-y-1.5 py-1">
            {pipelineData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 min-w-[90px]">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.fill }}></span>
                  <span className={`font-semibold truncate ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{item.name}</span>
                </div>
                {/* Horizontal Progress Bar Visual */}
                <div className={`flex-1 max-w-[110px] h-2.5 rounded-full overflow-hidden mx-2 ${darkMode ? 'bg-[#12161F]' : 'bg-slate-100'}`}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${item.count > 0 ? Math.min(100, Math.max(8, (item.count / maxPipelineCount) * 100)) : 0}%`,
                      backgroundColor: item.fill
                    }}
                  ></div>
                </div>
                <span className={`font-bold w-6 text-right flex-shrink-0 text-[10px] ${darkMode ? 'text-white' : 'text-slate-900'}`}>{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 2: Leads Trend (Smooth Curved Line Chart) */}
        <div className={`p-4 rounded-xl border shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${darkMode ? 'bg-[#181D26] border-[#262F3D] text-white' : 'bg-white border-slate-300/80 text-slate-900'
          }`}>
          <div className={`flex items-center justify-between border-b pb-2 mb-2 ${darkMode ? 'border-[#222936]' : 'border-slate-100'}`}>
            <div className="cursor-pointer" onClick={() => openDetail('leadsTrend')}>
              <h3 className={`font-bold text-xs hover:text-[#E5A812] transition-colors ${darkMode ? 'text-white' : 'text-slate-900'}`}>Leads Trend</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Leads created over time</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => openDetail('leadsTrend')}
                className="text-[10px] font-bold text-[#E5A812] hover:underline px-1"
                title="View leads directory"
              >
                View
              </button>
              <button
                onClick={() => showInfo('leadsTrend')}
                className={`transition-colors p-0.5 rounded-lg ${darkMode ? 'text-slate-400 hover:text-[#E5A812]' : 'text-slate-400 hover:text-[#7D610F] hover:bg-slate-50'}`}
                title="Click for explanation"
              >
                <span className="material-symbols-outlined text-base">info</span>
              </button>
            </div>
          </div>

          <div className="h-44 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendLineData} margin={{ top: 5, right: 5, left: -28, bottom: 0 }}>
                <defs>
                  <linearGradient id="leadTrendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E5A812" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#E5A812" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#222936' : '#F1F5F9'} />
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: darkMode ? '#9CA3AF' : '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: darkMode ? '#9CA3AF' : '#64748B' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={darkMode ? { backgroundColor: '#12161F', borderColor: '#262F3D', color: '#FFF', borderRadius: '8px' } : undefined} />
                <Area
                  type="monotone"
                  dataKey="value"
                  name="Leads"
                  stroke="#E5A812"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#leadTrendGrad)"
                  dot={{ r: 3.5, fill: '#ffffff', stroke: '#E5A812', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Lead Source Performance (Donut Chart with Legend) */}
        <div className={`p-4 rounded-xl border shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${darkMode ? 'bg-[#181D26] border-[#262F3D] text-white' : 'bg-white border-slate-300/80 text-slate-900'
          }`}>
          <div className={`flex items-center justify-between border-b pb-2 mb-1 ${darkMode ? 'border-[#222936]' : 'border-slate-100'}`}>
            <div className="cursor-pointer" onClick={() => openDetail('sourcePerformance')}>
              <h3 className={`font-bold text-xs hover:text-[#E5A812] transition-colors ${darkMode ? 'text-white' : 'text-slate-900'}`}>Lead Source Performance</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Leads by source channel</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => openDetail('sourcePerformance')}
                className="text-[10px] font-bold text-[#E5A812] hover:underline px-1"
                title="View sources"
              >
                View
              </button>
              <button
                onClick={() => showInfo('sourcePerformanceChart')}
                className={`transition-colors p-0.5 rounded-lg ${darkMode ? 'text-slate-400 hover:text-[#E5A812]' : 'text-slate-400 hover:text-[#7D610F] hover:bg-slate-50'}`}
                title="Click for explanation"
              >
                <span className="material-symbols-outlined text-base">info</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-0.5 min-h-[140px]">
            {/* Donut graphic with center text - Compact SVG Size */}
            <div className="w-[110px] h-[110px] relative flex items-center justify-center flex-shrink-0">
              <PieChart width={110} height={110}>
                <Pie
                  data={sourceDonutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={28}
                  outerRadius={45}
                  paddingAngle={2}
                  dataKey="count"
                >
                  {sourceDonutData.map((entry, index) => (
                    <Cell key={`src-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={darkMode ? { backgroundColor: '#12161F', borderColor: '#262F3D', color: '#FFF', borderRadius: '8px' } : undefined} />
              </PieChart>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className={`text-xs font-black leading-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>{stats.totalLeads || 0}</span>
                <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Total</span>
              </div>
            </div>

            {/* Vertical Legend on Right */}
            <div className="space-y-1 text-[10px] font-medium flex-1 min-w-0">
              {sourceDonutData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between gap-1">
                  <span className="flex items-center gap-1 min-w-0">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }}></span>
                    <span className={`truncate font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{item.name}</span>
                  </span>
                  <span className={`font-bold text-[9px] flex-shrink-0 ml-0.5 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    {item.count} <span className="text-slate-400 font-normal">({item.percent})</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chart 4: Activity Distribution (Donut Chart with Legend) */}
        <div className={`p-4 rounded-xl border shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${darkMode ? 'bg-[#181D26] border-[#262F3D] text-white' : 'bg-white border-slate-300/80 text-slate-900'
          }`}>
          <div className={`flex items-center justify-between border-b pb-2 mb-1 ${darkMode ? 'border-[#222936]' : 'border-slate-100'}`}>
            <div className="cursor-pointer" onClick={() => openDetail('activityDistribution')}>
              <h3 className={`font-bold text-xs hover:text-[#E5A812] transition-colors ${darkMode ? 'text-white' : 'text-slate-900'}`}>Activity Distribution</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Total activities by type</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => openDetail('activityDistribution')}
                className="text-[10px] font-bold text-[#E5A812] hover:underline px-1"
                title="View activities"
              >
                View
              </button>
              <button
                onClick={() => showInfo('activityDistributionChart')}
                className={`transition-colors p-0.5 rounded-lg ${darkMode ? 'text-slate-400 hover:text-[#E5A812]' : 'text-slate-400 hover:text-[#7D610F] hover:bg-slate-50'}`}
                title="Click for explanation"
              >
                <span className="material-symbols-outlined text-base">info</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-0.5 min-h-[140px]">
            {/* Donut graphic with center text - Compact SVG Size */}
            <div className="w-[110px] h-[110px] relative flex items-center justify-center flex-shrink-0">
              <PieChart width={110} height={110}>
                <Pie
                  data={activityDonutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={28}
                  outerRadius={45}
                  paddingAngle={2}
                  dataKey="count"
                >
                  {activityDonutData.map((entry, index) => (
                    <Cell key={`act-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={darkMode ? { backgroundColor: '#12161F', borderColor: '#262F3D', color: '#FFF', borderRadius: '8px' } : undefined} />
              </PieChart>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className={`text-xs font-black leading-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>{totalActivitiesDisplay}</span>
                <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Total</span>
              </div>
            </div>

            {/* Vertical Legend on Right */}
            <div className="space-y-1 text-[10px] font-medium flex-1 min-w-0">
              {activityDonutData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between gap-1">
                  <span className="flex items-center gap-1 min-w-0">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }}></span>
                    <span className={`truncate font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{item.name}</span>
                  </span>
                  <span className={`font-bold text-[9px] flex-shrink-0 ml-0.5 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    {item.count} <span className="text-slate-400 font-normal">({item.percent})</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>


      {/* ---------------------------------------------------- */}
      {/* ROW 3: 3 ACTIVITY & FOLLOW-UP LISTS                  */}
      {/* ---------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* List 1: Today's Follow-ups */}
        <div className={`rounded-2xl border p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${darkMode ? 'bg-[#181D26] border-[#262F3D] text-white' : 'bg-white border-slate-300/80 text-slate-900'
          }`}>
          <div>
            <div className={`flex items-center justify-between border-b pb-3 mb-3 ${darkMode ? 'border-[#222936]' : 'border-slate-100'}`}>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-500 text-xl">event_available</span>
                <h3 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-slate-900'}`}>Today's Follow-ups</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => showInfo('todaysFollowupsList')}
                  className={`transition-colors p-1 ${darkMode ? 'text-slate-400 hover:text-[#E5A812]' : 'text-slate-400 hover:text-[#7D610F]'}`}
                  title="Click for explanation"
                >
                  <span className="material-symbols-outlined text-lg">info</span>
                </button>
                <button
                  onClick={() => onNavigate('calendar')}
                  className="text-[11px] font-bold text-[#E5A812] hover:underline"
                >
                  View All
                </button>
              </div>
            </div>

            {todaysFollowups.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                <span className="material-symbols-outlined text-2xl text-emerald-500 mb-1">check_circle</span>
                <p className={`font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>No follow-ups for today</p>
                <p className="text-[11px] text-slate-400 mt-0.5">All scheduled callbacks are completed.</p>
              </div>
            ) : (
              <div className={`space-y-3 divide-y ${darkMode ? 'divide-[#222936]' : 'divide-slate-100'}`}>
                {todaysFollowups.map(item => (
                  <div key={item.id} className="pt-2.5 first:pt-0 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-full ${item.iconBg || 'bg-emerald-100 text-emerald-700'} flex items-center justify-center flex-shrink-0 shadow-xs`}>
                        <span className="material-symbols-outlined text-[16px]">{item.icon || 'call'}</span>
                      </div>
                      <div className="min-w-0">
                        <h4 className={`font-bold truncate ${darkMode ? 'text-white' : 'text-slate-900'}`}>{item.name}</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5 truncate">{item.sub}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-md flex-shrink-0 ${darkMode ? 'bg-[#12161F] text-amber-300 border border-[#262F3D]' : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                      {item.time}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* List 2: Overdue Follow-ups */}
        <div className={`rounded-2xl border p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${darkMode ? 'bg-[#181D26] border-[#262F3D] text-white' : 'bg-white border-slate-300/80 text-slate-900'
          }`}>
          <div>
            <div className={`flex items-center justify-between border-b pb-3 mb-3 ${darkMode ? 'border-[#222936]' : 'border-slate-100'}`}>
              <div className="flex items-center gap-2 text-rose-500">
                <span className="material-symbols-outlined text-xl">warning</span>
                <h3 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-slate-900'}`}>Overdue Follow-ups</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => showInfo('overdueFollowupsList')}
                  className={`transition-colors p-1 ${darkMode ? 'text-slate-400 hover:text-[#E5A812]' : 'text-slate-400 hover:text-[#7D610F]'}`}
                  title="Click for explanation"
                >
                  <span className="material-symbols-outlined text-lg">info</span>
                </button>
                <button
                  onClick={() => onNavigate('leads')}
                  className="text-[11px] font-bold text-rose-500 hover:underline"
                >
                  View All
                </button>
              </div>
            </div>

            {overdueFollowups.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                <span className="material-symbols-outlined text-2xl text-emerald-500 mb-1">verified</span>
                <p className={`font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>No overdue follow-ups!</p>
                <p className="text-[11px] text-slate-400 mt-0.5">All scheduled callbacks are on track.</p>
              </div>
            ) : (
              <div className={`space-y-3 divide-y ${darkMode ? 'divide-[#222936]' : 'divide-slate-100'}`}>
                {overdueFollowups.map(item => (
                  <div key={item.id} className="pt-2.5 first:pt-0 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center flex-shrink-0 shadow-xs">
                        <span className="material-symbols-outlined text-[16px]">error</span>
                      </div>
                      <div className="min-w-0">
                        <h4 className={`font-bold truncate ${darkMode ? 'text-white' : 'text-slate-900'}`}>{item.name}</h4>
                        <p className="text-[11px] text-rose-400 font-semibold mt-0.5 truncate">{item.sub}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-md flex-shrink-0 ${darkMode ? 'bg-rose-950/40 text-rose-300 border border-rose-800/40' : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                      {item.time}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* List 3: Recent Activities */}
        <div className={`rounded-2xl border p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${darkMode ? 'bg-[#181D26] border-[#262F3D] text-white' : 'bg-white border-slate-300/80 text-slate-900'
          }`}>
          <div>
            <div className={`flex items-center justify-between border-b pb-3 mb-3 ${darkMode ? 'border-[#222936]' : 'border-slate-100'}`}>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-500 text-xl">history</span>
                <h3 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-slate-900'}`}>Recent Activities</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => showInfo('recentActivitiesList')}
                  className={`transition-colors p-1 ${darkMode ? 'text-slate-400 hover:text-[#E5A812]' : 'text-slate-400 hover:text-[#7D610F]'}`}
                  title="Click for explanation"
                >
                  <span className="material-symbols-outlined text-lg">info</span>
                </button>
                <button
                  onClick={() => onNavigate('activities')}
                  className="text-[11px] font-bold text-[#E5A812] hover:underline"
                >
                  View All
                </button>
              </div>
            </div>

            {recentActivities.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                <span className="material-symbols-outlined text-2xl text-slate-500 mb-1">hourglass_empty</span>
                <p className={`font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>No recent activities</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Logged calls & notes will appear here.</p>
              </div>
            ) : (
              <div className={`space-y-3 divide-y ${darkMode ? 'divide-[#222936]' : 'divide-slate-100'}`}>
                {recentActivities.map(item => (
                  <div key={item.id} className="pt-2.5 first:pt-0 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-full ${item.iconBg || 'bg-emerald-100 text-emerald-700'} flex items-center justify-center flex-shrink-0 shadow-xs`}>
                        <span className="material-symbols-outlined text-[16px]">{item.icon || 'call'}</span>
                      </div>
                      <div className="min-w-0">
                        <h4 className={`font-bold truncate ${darkMode ? 'text-white' : 'text-slate-900'}`}>{item.title}</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5 truncate">{item.sub}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-medium text-slate-400 flex-shrink-0">
                      {item.time}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ---------------------------------------------------- */}
      {/* ROW 4: 2 BOTTOM PERFORMANCE TABLES                    */}
      {/* ---------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Table 1: Employee Performance */}
        <div className={`rounded-2xl border p-5 shadow-sm hover:shadow-md transition-all ${darkMode ? 'bg-[#181D26] border-[#262F3D] text-white' : 'bg-white border-slate-300/80 text-slate-900'
          }`}>
          <div className={`flex items-center justify-between border-b pb-3 mb-4 ${darkMode ? 'border-[#222936]' : 'border-slate-100'}`}>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#E5A812] text-xl">badge</span>
              <h3 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-slate-900'}`}>Employee Performance</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => showInfo('employeePerformanceTable')}
                className={`transition-colors p-1 ${darkMode ? 'text-slate-400 hover:text-[#E5A812]' : 'text-slate-400 hover:text-[#7D610F]'}`}
                title="Click for explanation"
              >
                <span className="material-symbols-outlined text-lg">info</span>
              </button>
              <button
                onClick={() => onNavigate('users')}
                className="text-[11px] font-bold text-[#E5A812] hover:underline"
              >
                View All
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className={`text-[11px] font-bold uppercase tracking-wider border-b ${darkMode ? 'text-slate-400 border-[#222936]' : 'text-slate-400 border-slate-100'
                  }`}>
                  <th className="pb-2 font-bold">Employee</th>
                  <th className="pb-2 text-center font-bold">Assigned Leads</th>
                  <th className="pb-2 text-center font-bold">Contacted</th>
                  <th className="pb-2 text-center font-bold">Interested</th>
                  <th className="pb-2 text-center font-bold">Converted</th>
                  <th className="pb-2 text-right font-bold">Conversion Rate</th>
                </tr>
              </thead>
              <tbody className={`divide-y font-medium ${darkMode ? 'divide-[#222936]' : 'divide-slate-100'}`}>
                {employeePerfData.map((emp, idx) => (
                  <tr key={idx} className={`transition-colors ${darkMode ? 'hover:bg-[#1E2532]' : 'hover:bg-slate-50'}`}>
                    <td className="py-3 flex items-center gap-2.5">
                      <span className={`w-7 h-7 rounded-full ${emp.badgeBg} text-[10px] font-black flex items-center justify-center shadow-xs`}>
                        {emp.badge}
                      </span>
                      <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{emp.name}</span>
                    </td>
                    <td className={`py-3 text-center font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{emp.assigned}</td>
                    <td className={`py-3 text-center ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{emp.contacted}</td>
                    <td className={`py-3 text-center ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{emp.interested}</td>
                    <td className={`py-3 text-center font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{emp.converted}</td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className={`font-bold text-xs ${darkMode ? 'text-white' : 'text-slate-900'}`}>{emp.rate}</span>
                        <div className={`w-12 h-2 rounded-full overflow-hidden ${darkMode ? 'bg-[#12161F]' : 'bg-slate-100'}`}>
                          <div className="bg-[#D99B00] h-full rounded-full" style={{ width: emp.barWidth }}></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 2: Top Lead Sources */}
        <div className={`rounded-2xl border p-5 shadow-sm hover:shadow-md transition-all ${darkMode ? 'bg-[#181D26] border-[#262F3D] text-white' : 'bg-white border-slate-300/80 text-slate-900'
          }`}>
          <div className={`flex items-center justify-between border-b pb-3 mb-4 ${darkMode ? 'border-[#222936]' : 'border-slate-100'}`}>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-500 text-xl">hub</span>
              <h3 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-slate-900'}`}>Top Lead Sources</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => showInfo('topLeadSourcesTable')}
                className={`transition-colors p-1 ${darkMode ? 'text-slate-400 hover:text-[#E5A812]' : 'text-slate-400 hover:text-[#7D610F]'}`}
                title="Click for explanation"
              >
                <span className="material-symbols-outlined text-lg">info</span>
              </button>
              <button
                onClick={() => onNavigate('lead-sources')}
                className="text-[11px] font-bold text-[#E5A812] hover:underline"
              >
                View All
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className={`text-[11px] font-bold uppercase tracking-wider border-b ${darkMode ? 'text-slate-400 border-[#222936]' : 'text-slate-400 border-slate-100'
                  }`}>
                  <th className="pb-2 font-bold">Source</th>
                  <th className="pb-2 text-center font-bold">Leads</th>
                  <th className="pb-2 text-center font-bold">Interested</th>
                  <th className="pb-2 text-center font-bold">Converted</th>
                  <th className="pb-2 text-right font-bold">Conversion Rate</th>
                </tr>
              </thead>
              <tbody className={`divide-y font-medium ${darkMode ? 'divide-[#222936]' : 'divide-slate-100'}`}>
                {topSourcesData.map((src, idx) => (
                  <tr key={idx} className={`transition-colors ${darkMode ? 'hover:bg-[#1E2532]' : 'hover:bg-slate-50'}`}>
                    <td className={`py-3 font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{src.source}</td>
                    <td className={`py-3 text-center font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{src.leads}</td>
                    <td className={`py-3 text-center ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{src.interested}</td>
                    <td className={`py-3 text-center font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{src.converted}</td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className={`font-bold text-xs ${darkMode ? 'text-white' : 'text-slate-900'}`}>{src.rate}</span>
                        <div className={`w-12 h-2 rounded-full overflow-hidden ${darkMode ? 'bg-[#12161F]' : 'bg-slate-100'}`}>
                          <div className="bg-[#D99B00] h-full rounded-full" style={{ width: src.barWidth }}></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* ---------------------------------------------------- */}
      {/* INTERACTIVE INFO (i) EXPLANATION POP-UP MODAL        */}
      {/* ---------------------------------------------------- */}
      {activeInfoModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className={`rounded-3xl max-w-xl w-full p-6 shadow-2xl border space-y-4 max-h-[90vh] flex flex-col ${darkMode ? 'bg-[#181D26] border-[#262F3D] text-slate-100' : 'bg-white border-slate-100 text-slate-900'
            }`}>

            {/* Modal Header */}
            <div className={`flex items-start justify-between border-b pb-3 flex-shrink-0 ${darkMode ? 'border-[#222936]' : 'border-slate-100'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${darkMode ? 'bg-[#E5A812]/20 text-[#E5A812]' : 'bg-amber-100 text-[#7D610F]'
                  }`}>
                  <span className="material-symbols-outlined text-2xl">info</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#E5A812]">{activeInfoModal.category}</span>
                  <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{activeInfoModal.title}</h3>
                </div>
              </div>
              <button
                onClick={() => setActiveInfoModal(null)}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${darkMode ? 'bg-[#12161F] text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-400 hover:text-slate-700'
                  }`}
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Modal Body with 4 Structured Guide Cards */}
            <div className="space-y-3 text-xs overflow-y-auto flex-1 pr-1">
              {/* Section 1: How it Works */}
              <div className={`p-3.5 rounded-xl border ${darkMode ? 'bg-[#12161F] border-[#262F3D] text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                <h4 className={`font-bold mb-1.5 flex items-center gap-1.5 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  <span className="material-symbols-outlined text-[#E5A812] text-base">center_focus_strong</span>
                  <span>1. Kaise Work Karta Hai (How It Works)</span>
                </h4>
                <p className="leading-relaxed whitespace-pre-line">{activeInfoModal.howItWorks || activeInfoModal.purpose}</p>
              </div>

              {/* Section 2: Who & How */}
              <div className={`p-3.5 rounded-xl border ${darkMode ? 'bg-[#161D2B] border-blue-900/40 text-blue-200' : 'bg-blue-50/80 border-blue-200 text-blue-950'}`}>
                <h4 className="font-bold text-blue-400 mb-1.5 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-blue-400 text-base">engineering</span>
                  <span>2. Kisko Aur Kaise Karna Hai (Roles & Action Plan)</span>
                </h4>
                <p className="leading-relaxed whitespace-pre-line font-medium">{activeInfoModal.whoAndHow || activeInfoModal.action}</p>
              </div>

              {/* Section 3: Growth Strategy */}
              <div className={`p-3.5 rounded-xl border ${darkMode ? 'bg-emerald-950/40 border-emerald-800/40 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-950'}`}>
                <h4 className="font-bold text-emerald-400 mb-1.5 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-emerald-400 text-base">trending_up</span>
                  <span>3. Growth Kaise Hogi (Performance & Admission Boost)</span>
                </h4>
                <p className="leading-relaxed font-medium whitespace-pre-line">{activeInfoModal.growthStrategy || activeInfoModal.action}</p>
              </div>

              {/* Section 4: Formula & Logic */}
              <div className={`p-3 rounded-xl border ${darkMode ? 'bg-[#2A2100] border-[#D4AF37]/40 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-900'}`}>
                <h4 className="font-bold text-[#E5A812] mb-1 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#E5A812] text-base">functions</span>
                  <span>Calculation Formula & Logic</span>
                </h4>
                <p className="font-mono text-[11px] font-semibold">{activeInfoModal.formula}</p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className={`pt-2.5 flex justify-end flex-shrink-0 border-t ${darkMode ? 'border-[#222936]' : 'border-slate-100'}`}>
              <button
                onClick={() => setActiveInfoModal(null)}
                className={`font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-all ${darkMode ? 'bg-[#D99B00] text-slate-950 hover:bg-[#E5A812]' : 'bg-[#7D610F] text-white hover:bg-[#634C0A]'
                  }`}
              >
                Got it
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* KPI DETAIL DRILL-DOWN MODAL                          */}
      {/* ---------------------------------------------------- */}
      {detailModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className={`rounded-2xl max-w-3xl w-full max-h-[80vh] flex flex-col shadow-2xl border ${darkMode ? 'bg-[#181D26] border-[#262F3D] text-slate-100' : 'bg-white border-slate-100 text-slate-900'}`}>

            {/* Header */}
            <div className={`flex items-center justify-between p-5 border-b flex-shrink-0 ${darkMode ? 'border-[#222936]' : 'border-slate-100'}`}>
              <div>
                <h3 className={`font-extrabold text-base ${darkMode ? 'text-white' : 'text-slate-900'}`}>{DETAIL_TITLES[detailModal] || 'Details'}</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">{detailData.length} records found</p>
              </div>
              <button
                onClick={() => setDetailModal(null)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${darkMode ? 'hover:bg-[#262F3D] text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Body */}
            <div className="overflow-auto flex-1 p-5">
              {detailLoading ? (
                <div className="py-16 text-center">
                  <span className="material-symbols-outlined text-[36px] animate-spin text-[#7D610F]">sync</span>
                  <p className="text-xs font-semibold mt-2 text-slate-400">Loading details...</p>
                </div>
              ) : detailData.length === 0 ? (
                <div className="py-16 text-center text-slate-400">
                  <span className="material-symbols-outlined text-[48px]">inbox</span>
                  <p className="text-xs font-medium mt-2">No records found for this category.</p>
                </div>
              ) : detailModal === 'payments' ? (
                /* Payment Records Table */
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className={`font-bold uppercase text-[10px] ${darkMode ? 'bg-[#0F2438] text-slate-300' : 'bg-[#0F2438] text-white'}`}>
                      <th className="py-2.5 px-3 text-left">Lead ID</th>
                      <th className="py-2.5 px-3 text-left">Student Name</th>
                      <th className="py-2.5 px-3 text-left">Course</th>
                      <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                      <th className="py-2.5 px-3 text-left">Method</th>
                      <th className="py-2.5 px-3 text-left">Date</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${darkMode ? 'divide-[#222936]' : 'divide-slate-100'}`}>
                    {detailData.map((p, i) => (
                      <tr key={i} className={`${darkMode ? 'hover:bg-[#1C222D]' : 'hover:bg-slate-50'} transition-colors`}>
                        <td className="py-2.5 px-3 font-mono font-bold text-[#7D610F]">{p.leadId || '-'}</td>
                        <td className={`py-2.5 px-3 font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{p.leadName || '-'}</td>
                        <td className="py-2.5 px-3 text-slate-500">{p.course || '-'}</td>
                        <td className={`py-2.5 px-3 text-right font-bold ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>₹ {Number(p.amount || 0).toLocaleString('en-IN')}</td>
                        <td className="py-2.5 px-3">{p.method || '-'}</td>
                        <td className="py-2.5 px-3 text-slate-500">{p.date ? String(p.date).split('T')[0] : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className={`font-bold ${darkMode ? 'bg-[#12161F] text-emerald-400' : 'bg-slate-50 text-emerald-700'}`}>
                      <td colSpan={3} className="py-2.5 px-3">TOTAL ({detailData.length} payments)</td>
                      <td className="py-2.5 px-3 text-right">₹ {detailData.reduce((s, p) => s + Number(p.amount || 0), 0).toLocaleString('en-IN')}</td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              ) : detailModal === 'followups' ? (
                /* Follow-ups / Tasks Table */
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className={`font-bold uppercase text-[10px] ${darkMode ? 'bg-[#0F2438] text-slate-300' : 'bg-[#0F2438] text-white'}`}>
                      <th className="py-2.5 px-3 text-left">Task</th>
                      <th className="py-2.5 px-3 text-left">Assigned To</th>
                      <th className="py-2.5 px-3 text-left">Linked Lead</th>
                      <th className="py-2.5 px-3 text-left">Due Time</th>
                      <th className="py-2.5 px-3 text-left">Priority</th>
                      <th className="py-2.5 px-3 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${darkMode ? 'divide-[#222936]' : 'divide-slate-100'}`}>
                    {detailData.map((t, i) => (
                      <tr key={i} className={`${darkMode ? 'hover:bg-[#1C222D]' : 'hover:bg-slate-50'} transition-colors`}>
                        <td className={`py-2.5 px-3 font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{t.title}</td>
                        <td className="py-2.5 px-3">{t.assignedUser || '-'}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-[#7D610F]">{t.leadId || 'N/A'}</td>
                        <td className="py-2.5 px-3">{t.dueTime || '-'}</td>
                        <td className="py-2.5 px-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${t.priority === 'High' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'}`}>{t.priority}</span></td>
                        <td className="py-2.5 px-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${t.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{t.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : detailModal === 'activityDistribution' ? (
                /* Activity Logs Table */
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className={`font-bold uppercase text-[10px] ${darkMode ? 'bg-[#0F2438] text-slate-300' : 'bg-[#0F2438] text-white'}`}>
                      <th className="py-2.5 px-3 text-left">Action</th>
                      <th className="py-2.5 px-3 text-left">User</th>
                      <th className="py-2.5 px-3 text-left">Entity</th>
                      <th className="py-2.5 px-3 text-left">Target ID</th>
                      <th className="py-2.5 px-3 text-left">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${darkMode ? 'divide-[#222936]' : 'divide-slate-100'}`}>
                    {detailData.map((log, i) => (
                      <tr key={i} className={`${darkMode ? 'hover:bg-[#1C222D]' : 'hover:bg-slate-50'} transition-colors`}>
                        <td className="py-2.5 px-3 font-semibold">{log.action || '-'}</td>
                        <td className="py-2.5 px-3 font-medium">{log.user || '-'}</td>
                        <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-[#12161F] text-slate-700 dark:text-slate-300">{log.entity || '-'}</span></td>
                        <td className="py-2.5 px-3 font-mono font-bold text-[#E5A812]">{log.entityId || '-'}</td>
                        <td className="py-2.5 px-3 text-slate-400">{log.timestamp ? new Date(log.timestamp).toLocaleString() : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                /* Leads Table (totalLeads, newLeads, interested, converted) */
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className={`font-bold uppercase text-[10px] ${darkMode ? 'bg-[#0F2438] text-slate-300' : 'bg-[#0F2438] text-white'}`}>
                      <th className="py-2.5 px-3 text-left">Lead ID</th>
                      <th className="py-2.5 px-3 text-left">Name</th>
                      <th className="py-2.5 px-3 text-left">Mobile</th>
                      <th className="py-2.5 px-3 text-left">Course</th>
                      <th className="py-2.5 px-3 text-left">Status</th>
                      <th className="py-2.5 px-3 text-left">Counselor</th>
                      <th className="py-2.5 px-3 text-left">Source</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${darkMode ? 'divide-[#222936]' : 'divide-slate-100'}`}>
                    {detailData.map((l, i) => (
                      <tr key={i} className={`${darkMode ? 'hover:bg-[#1C222D]' : 'hover:bg-slate-50'} transition-colors`}>
                        <td className="py-2.5 px-3 font-mono font-bold text-[#7D610F]">{l.leadId || '-'}</td>
                        <td className={`py-2.5 px-3 font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{l.name || '-'}</td>
                        <td className="py-2.5 px-3">{l.mobile || '-'}</td>
                        <td className="py-2.5 px-3">{l.interestedCourse || '-'}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            l.status === 'CONVERTED' ? 'bg-purple-100 text-purple-800' :
                            l.status === 'INTERESTED' ? 'bg-emerald-100 text-emerald-800' :
                            l.status === 'NEW' ? 'bg-blue-100 text-blue-800' :
                            'bg-slate-100 text-slate-700'
                          }`}>{l.status || '-'}</span>
                        </td>
                        <td className="py-2.5 px-3">{l.ownerId || '-'}</td>
                        <td className="py-2.5 px-3">{l.source || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer */}
            <div className={`p-4 border-t flex justify-end flex-shrink-0 ${darkMode ? 'border-[#222936]' : 'border-slate-100'}`}>
              <button
                onClick={() => setDetailModal(null)}
                className={`font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-all ${darkMode ? 'bg-[#D99B00] text-slate-950 hover:bg-[#E5A812]' : 'bg-[#7D610F] text-white hover:bg-[#634C0A]'}`}
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* CUSTOM DATE-TO-DATE RANGE PICKER MODAL              */}
      {/* ---------------------------------------------------- */}
      {showDatePickerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className={`relative w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden transition-colors ${
            darkMode ? 'bg-[#151B24] border-[#262F3D] text-slate-200' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            
            {/* Header */}
            <div className={`p-5 border-b flex items-center justify-between ${
              darkMode ? 'bg-[#181D26] border-[#262F3D]' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  darkMode ? 'bg-[#E5A812]/20 text-[#E5A812]' : 'bg-amber-100 text-[#7D610F]'
                }`}>
                  <span className="material-symbols-outlined text-xl">date_range</span>
                </div>
                <div>
                  <h3 className={`font-bold text-base ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    Select Analytics Date Range
                  </h3>
                  <p className="text-[11px] text-slate-400">Choose start & end dates or pick a quick timeframe preset</p>
                </div>
              </div>

              <button
                onClick={() => setShowDatePickerModal(false)}
                className={`p-1.5 rounded-lg border transition-colors ${
                  darkMode ? 'bg-[#12161F] hover:bg-[#1E2633] text-slate-400 hover:text-white border-[#262F3D]' : 'bg-white hover:bg-slate-100 text-slate-500 border-slate-200'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-5">
              
              {/* Quick Presets */}
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Quick Presets
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    'Today',
                    'Yesterday',
                    'Last 7 Days',
                    'Last 30 Days',
                    'This Month',
                    'Last Month',
                    'This Quarter',
                    `Year ${currentYear}`
                  ].map(preset => (
                    <button
                      key={preset}
                      onClick={() => applyPreset(preset)}
                      className={`px-2.5 py-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                        selectedPeriod === preset && isCustomRangeActive
                          ? (darkMode ? 'bg-[#E5A812] text-black font-bold border-[#E5A812]' : 'bg-[#7D610F] text-white font-bold border-[#7D610F]')
                          : (darkMode ? 'bg-[#181D26] hover:bg-[#1E2633] text-slate-300 border-[#262F3D]' : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200')
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Date Inputs (Date to Date) */}
              <div className={`p-4 rounded-xl border ${darkMode ? 'bg-[#12161F] border-[#262F3D]' : 'bg-slate-50 border-slate-200'}`}>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-3 ${darkMode ? 'text-amber-300' : 'text-[#7D610F]'}`}>
                  Custom Date-to-Date Filter
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="block text-[11px] font-bold text-slate-400 mb-1">From Start Date</span>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className={`w-full px-3 py-2 text-xs font-semibold rounded-lg border outline-none ${
                        darkMode ? 'bg-[#181D26] border-[#262F3D] text-white focus:border-[#E5A812]' : 'bg-white border-slate-300 text-slate-900 focus:border-[#7D610F]'
                      }`}
                    />
                  </div>

                  <div>
                    <span className="block text-[11px] font-bold text-slate-400 mb-1">To End Date</span>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className={`w-full px-3 py-2 text-xs font-semibold rounded-lg border outline-none ${
                        darkMode ? 'bg-[#181D26] border-[#262F3D] text-white focus:border-[#E5A812]' : 'bg-white border-slate-300 text-slate-900 focus:border-[#7D610F]'
                      }`}
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className={`p-4 border-t flex flex-wrap items-center justify-between gap-2 ${
              darkMode ? 'bg-[#181D26] border-[#262F3D]' : 'bg-slate-50 border-slate-200'
            }`}>
              <button
                onClick={handleResetDateFilter}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  darkMode ? 'bg-[#12161F] hover:bg-[#1E2633] text-slate-300 border-[#262F3D]' : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                }`}
              >
                Reset to Full Range
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowDatePickerModal(false)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold ${
                    darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleApplyCustomRange}
                  className={`px-5 py-2 rounded-xl text-xs font-black shadow-sm transition-all active:scale-95 ${
                    darkMode ? 'bg-[#E5A812] hover:bg-[#F5B822] text-slate-950' : 'bg-[#7D610F] hover:bg-[#634C0A] text-white'
                  }`}
                >
                  Apply Date Range
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
