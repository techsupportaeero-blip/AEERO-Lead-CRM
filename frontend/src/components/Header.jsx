import React, { useState } from 'react';
import aeeroLogo from '../assets/logo/aeero-logo.png';

export const Header = ({ onOpenAddLead, onToggleMobileSidebar, globalSearch, setGlobalSearch, currentUser, currentRoute, darkMode, onToggleDarkMode, onRefreshData }) => {
  const [showPageInfoModal, setShowPageInfoModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshClick = () => {
    setIsRefreshing(true);
    if (onRefreshData) onRefreshData();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 800);
  };

  // Super Detailed, Bilingual (Hinglish + English) Page Working Guide for EVERY Page
  const ROUTE_EXPLANATIONS = {
    dashboard: {
      title: 'Analytics & Overview Dashboard',
      subtitle: 'Real-time performance summary & pipeline insights',
      icon: 'grid_view',
      color: 'bg-amber-100 text-[#7D610F]',
      purpose: 'Yeh AEERO CRM ka main command center hai. Yahan aapko ek hi jagah par saare active leads, naye inquiries, interested students, aaj ke callbacks, aur conversion rate ka real-time summary dikhta hai.',
      features: [
        '6 KPI Cards: Total Leads, New Inquiries, Interested Students, Today\'s Callbacks, Converted, aur Conversion Rate.',
        '4 Visual Charts: Pipeline Funnel, Daily Lead Trend, Source Breakdown (Meta/Google/Web), aur Activity Distribution.',
        'Today\'s Follow-ups & Overdue Callbacks Queue (Missed calls alert).',
        'Counselor Performance Leaderboard & Marketing Channel ROI Table.'
      ],
      howToUse: 'Subah sabse pehle Dashboard check karein. Aaj ke scheduled follow-ups aur overdue calls ko 100% complete karein taaki koi student dropout na ho.',
      proTip: 'Kisi bhi individual Card ya Chart ke side wale (i) icon par click karke uski specific definition aur formula dekh sakte hain.'
    },
    leads: {
      title: 'All Leads Directory',
      subtitle: 'Centralized prospective student database',
      icon: 'groups',
      color: 'bg-blue-100 text-blue-700',
      purpose: 'Yeh CRM ki main master table hai jisme Meta Ads, Google Ads, Website Forms, WhatsApp, aur manual entry se aane wali har ek student inquiry mehfooz (save) hoti hai.',
      features: [
        'Live Instant Search: Student ke Naam, Mobile Number, Email, ya City se 1 second me search karein.',
        'Multi-Filters: Status (New, Interested, Follow-up), Lead Source, Counselor Owner, aur Priority se filter karein.',
        'Duplicate Lead Pre-check: Nayi lead add karte hi mobile/email duplicate check karke double calls hone se bachata hai.',
        'Custom Columns Selector: Table me konsi details dikhani hain unhe customize karein.',
        'Export to CSV & Manual "+ Add Lead" creation modal.'
      ],
      howToUse: 'Counselors yahan se leads search karke specific target group filter kar sakte hain. Kisi bhi lead ki row par click karke uska 360° Counseling Workspace open karein.',
      proTip: 'Daily naye aaye "NEW" status wale leads ko sabse pehle contact karein — fast reply se admission chance 3x ho jata hai.'
    },
    kanban: {
      title: 'Visual Pipeline Kanban Board',
      subtitle: 'Drag & Drop lead stage management',
      icon: 'view_kanban',
      color: 'bg-purple-100 text-purple-700',
      purpose: 'Yeh visual drag-and-drop board hai jisse counseling progress ko stages me dekha aur move kiya ja sakta hai (New ➔ Contacted ➔ Interested ➔ Converted).',
      features: [
        '7 Pipeline Columns: New, No Answer, Given Details, Interested, Follow-up, Converted, Lost.',
        'Drag & Drop Movement: Lead card ko utha kar doosre column me drop karte hi backend status automatic update ho jata hai.',
        'Stage Counter: Har stage me kitne students hain unka live total count.',
        'Direct Call Button: Lead card se direct call log launch karein.'
      ],
      howToUse: 'Jab student se baat ho jaye aur woh course me interest dikhaye, toh uske card ko "Given Details" ya "Interested" column me drag kar dein.',
      proTip: '"Follow-up" column ke cards me specific date and time set rakhein taaki callback schedule yaad rahe.'
    },
    activities: {
      title: 'Counseling Activities & Call Logs',
      subtitle: 'Audit trail of student communications',
      icon: 'call',
      color: 'bg-emerald-100 text-emerald-700',
      purpose: 'Yeh page counselors dwara ki gayi saari phone calls, WhatsApp chats, emails, meetings, aur remarks ka complete timeline record rakhta hai.',
      features: [
        'Call Outcome Tracking (Interested, No Answer, Callback Scheduled, Given Details).',
        'Call Duration Counter (Kitne minute baat hui).',
        'Timestamped Activity Stream: Date, time, aur counselor name ke saath history.',
        'Direct Lead Profile Link: Activity se direct student details par jayein.'
      ],
      howToUse: 'Kisi student ko call karne se pehle uski pichli Call History check kar lein taaki repeat sawaal na poochna pade aur counseling personal lage.',
      proTip: 'Har call ke baad mandatory call outcome select karein taaki dashboard stats accurate rahein.'
    },
    tasks: {
      title: 'Counselor Tasks & Action Items',
      subtitle: 'Action-oriented task queue & reminders',
      icon: 'task_alt',
      color: 'bg-amber-100 text-amber-800',
      purpose: 'Yeh counselor ka personal to-do list manager hai jisme callbacks, fee quote sends, brochure dispatch, aur campus visit preparations ke reminders hote hain.',
      features: [
        'Priority Badges: High (Urgent), Medium, Low priority tags.',
        'Due Date & Time Tracking: Overdue tasks red color me highlight hote hain.',
        'One-Click Checkmark: Task complete hone par checkbox tick karein.',
        'Counselor-wise Task Filter.'
      ],
      howToUse: 'Har subah pehle High Priority aur Red Overdue tasks ko complete karein. Task poora hone par checkmark tick kar dein.',
      proTip: 'Counseling call ke dauran student ne jab bhi brochure mangwaya ho, turant ek task create kar lein.'
    },
    calendar: {
      title: 'Callback & Appointment Calendar',
      subtitle: 'Scheduled follow-ups queue by date & time',
      icon: 'calendar_month',
      color: 'bg-indigo-100 text-indigo-700',
      purpose: 'Yeh calendar view hai jo date aur specific time slot ke hisaab se aaj ke aur aane wale saare student callbacks aur academy campus visits ko organize karta hai.',
      features: [
        'Time Slot Sorting: 10:30 AM, 11:00 AM, 02:00 PM wise scheduled call list.',
        'Student Quick Info & Course interest details.',
        'Pending vs Completed follow-up status toggle.',
        'Filter by Counselor owner.'
      ],
      howToUse: 'Din bhar apne scheduled time slots dekhein aur promised time par exact call lagayein. Punctuality se student trust badhta hai.',
      proTip: 'Promised time par callback karne se Commercial Pilot (CPL) aur Cabin Crew enrollments 40% badhte hain.'
    },
    users: {
      title: 'User & Staff Management',
      subtitle: 'Counselors, Lead Finders & Admin accounts',
      icon: 'badge',
      color: 'bg-slate-100 text-slate-800',
      purpose: 'Yeh admin panel hai jahan se nayi staff accounts banaye ja sakte hain, roles (ADMIN, LEAD_FINDER/Counselor) set kiye ja sakte hain, aur password reset kiye ja sakte hain.',
      features: [
        'New Staff Account Creation (Username & Password setup).',
        'Role Assignment (ADMIN: Full Access, LEAD_FINDER: Counseling Access).',
        'Active / Inactive Account Toggle.',
        'Assigned Leads Counter per staff member.'
      ],
      howToUse: 'Admins naye counselors ki ID yahan se create karte hain aur check karte hain ki kis counselor par kitna lead load hai.',
      proTip: 'Hamesha har counselor ka account active rakhein taaki automatic lead distribution sahi se chale.'
    },
    courses: {
      title: 'Aviation Courses Catalog (Products & Services)',
      subtitle: 'Course details & fee structures',
      icon: 'school',
      color: 'bg-amber-100 text-[#7D610F]',
      purpose: 'Is page par AEERO ke saare active courses (CPL, Cabin Crew, AME, Airport Mgmt, Safety) aur unke official Fee Structure ko manage kiya jata hai.',
      features: [
        'Aviation Courses List (CPL, Cabin Crew, AME, Airport Mgmt, Safety).',
        'Official Program Fees (INR ₹) setup.',
        'Course Duration & Ground Theory Details.',
        'Active / Inactive Status Toggle.'
      ],
      howToUse: 'Admins yahan course fee update karte hain. Yeh fees auto-populate ho kar lead form aur pipeline deal value calculation me use hoti hai.',
      proTip: 'Fee details accurate rakhein taaki counselors call par sahi commercial pilot fee quotes de sakein.'
    },
    customers: {
      title: 'Converted Students Directory',
      subtitle: 'Enrolled student records & alumni database',
      icon: 'person',
      color: 'bg-emerald-100 text-emerald-800',
      purpose: 'Yeh un students ka directory hai jinhone counseling complete karke admission le liya hai aur fees deposit kar di hai.',
      features: [
        'Enrolled Student Contact Info & WhatsApp Numbers.',
        'Course Enrolled & Batch Joining Notes.',
        'Registration Date & Student ID Record.',
        'Quick Search across Enrolled Students.'
      ],
      howToUse: 'Is directory ka use onboarding, ground class batch allocation, aur flight simulator session scheduling ke liye karein.',
      proTip: 'Enrolled students ke batch notes up-to-date rakhein taaki training batch coordination smooth rahe.'
    },
    'lead-sources': {
      title: 'Lead Sources & Marketing Channels',
      subtitle: 'Inbound channel attribution setup',
      icon: 'hub',
      color: 'bg-blue-100 text-blue-800',
      purpose: 'Is page par incoming marketing channels (Meta Ads, Google Ads, Website, WhatsApp, Referral, Walk-in) ko configure kiya jata hai.',
      features: [
        'Lead Source Creation & Channel Code Setup.',
        'Channel Active / Inactive Toggle.',
        'UTM Tracking Integration mapping.',
        'Source Performance Analytics Configuration.'
      ],
      howToUse: 'Marketing sources add karein taaki har aane wali lead par exact source tag lage aur pata chale konsa ad sabse jyada pilot admissions la raha hai.',
      proTip: 'Meta Ads aur Google Ads sources ko correctly tag rakhein taaki ad budget ROI track ho sake.'
    },
    'audit-logs': {
      title: 'System Audit Logs',
      subtitle: 'Security & activity audit trail',
      icon: 'shield_person',
      color: 'bg-[#7D610F] text-white',
      purpose: 'Yeh system ka security audit log hai jo har data edit, lead creation, status update, aur deletion ka exact timestamped record rakhta hai.',
      features: [
        'Timestamped Security Log Entries (Date & Time).',
        'User Attribution (Kis staff member ne action liya).',
        'Detailed Action Summary & Module Name.',
        'Chronological Event Trail.'
      ],
      howToUse: 'Admins audit logs check karke dekh sakte hain ki kisi lead ka status kisne change kiya ya kisne record update kiya.',
      proTip: 'Security compliance ke liye audit logs automatic permanently background me log hote rehte hain.'
    },
    'lead-details': {
      title: '360° Lead Counseling Workspace',
      subtitle: 'Complete student profile & counseling tools',
      icon: 'contact_page',
      color: 'bg-amber-100 text-[#7D610F]',
      purpose: 'Yeh specific ek student ki poori profile aur counseling workspace hai. Single screen se call log, pinned notes, follow-up, aur status update sab hota hai.',
      features: [
        'Counseling Call Logger (Outcome select, Call Duration, Remarks, Next Callback Date).',
        'Notes System (Naya note likhein, Pinned note ko top par rakhein, Edit & Delete).',
        'Scheduled Follow-ups Queue & Completion Checkbox.',
        'Complete Activity History Timeline.',
        'Student Qualification, Course Interest, aur UTM Marketing Metadata.'
      ],
      howToUse: 'Counselor live call karte waqt is screen par rehte hain. Baat hone ke baad Call Outcome select karein, Pinned Note me student requirement likhein, aur aagli call ki date set kar dein.',
      proTip: 'Hamesha call end karne se pehle aagli Callback Date zaroor select karein taaki lead queue se kabhi gaayab na ho.'
    },
    'ai-assistant': {
      title: 'AEERO AI Sales & Counseling Assistant',
      subtitle: 'AI Lead Scoring, Chat, & Script Generator',
      icon: 'smart_toy',
      color: 'bg-amber-100 text-[#7D610F]',
      purpose: 'Yeh AEERO CRM ka AI Sales Suite hai jo lead conversion rate badhane ke liye intelligent chat, AI intent scoring (Hot/Warm/Cold), aur automated script generator pradan karta hai.',
      features: [
        'Interactive AI Chat: Funnel analysis, hot leads scanner, aur custom prompt suggestions.',
        'AI Lead Intent Scoring Matrix: High-converting lead attributes aur student conversion probabilities.',
        'AI Script Generator: Tailored WhatsApp messages, Email copy, aur Counselor phone pitch scripts for CPL/Cabin Crew.'
      ],
      howToUse: 'Counselors Chat tab par quick prompts click karke conversion analysis le sakte hain ya Script Generator tab se 1-click WhatsApp text copy kar sakte hain.',
      proTip: 'Script Generator se personalized WhatsApp scripts bhejkar prospective pilots se 2x faster reply payein.'
    }
  };

  const currentExplanation = ROUTE_EXPLANATIONS[currentRoute] || {
    title: String(currentRoute || 'Page').toUpperCase().replace('-', ' '),
    subtitle: 'AEERO CRM Lead Management Module',
    icon: 'info',
    color: 'bg-amber-100 text-[#7D610F]',
    purpose: 'This page provides dedicated functionality for managing AEERO CRM operations.',
    features: ['Real-time database connectivity', 'Role-based security', 'Automated activity logging'],
    howToUse: 'Use the controls on this page to perform your daily counseling or administrative workflow.',
    proTip: 'Need help? Click the (i) icon anytime to view page instructions.'
  };

  return (
    <>
      <header className={`fixed top-0 right-0 w-full md:w-[calc(100%-220px)] h-[55px] border-b shadow-xs flex justify-between items-center px-4 md:px-6 z-20 transition-colors ${darkMode ? 'bg-[#12161F] border-[#222936] text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}>
        <div className="flex items-center gap-3">
          {/* Mobile Sidebar Hamburger Toggle */}
          <button
            onClick={onToggleMobileSidebar}
            className={`md:hidden p-1.5 rounded-lg transition-colors ${darkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'
              }`}
            title="Toggle Navigation Menu"
          >
            <span className="material-symbols-outlined text-[20px]">menu</span>
          </button>

          {/* Dynamic Page Title + Interactive (i) Info Button */}
          <div className="flex items-center gap-2">
            <img 
              src={aeeroLogo} 
              alt="AEERO" 
              className="w-10 h-10 object-contain filter drop-shadow-md"
              onError={(e) => { e.target.src = 'https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id=100087907540113'; }}
            />
            <span className="material-symbols-outlined text-[#E5A812] text-[20px]">
              {currentExplanation.icon || 'explore'}
            </span>
            <h2 className={`font-bold text-sm md:text-base tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              {currentExplanation.title}
            </h2>

            {/* Glowing (i) Info Icon Button for EVERY Page matching Screenshot */}
            <button
              onClick={() => setShowPageInfoModal(true)}
              className={`flex items-center gap-1 border px-2 py-0.5 rounded-full text-xs font-bold transition-all shadow-2xs hover:scale-105 active:scale-95 cursor-pointer ml-1 ${darkMode
                  ? 'bg-[#E5A812]/10 border-[#E5A812]/50 text-[#E5A812] hover:bg-[#E5A812]/20'
                  : 'bg-amber-50 border-amber-200 text-[#7D610F] hover:bg-amber-100'
                }`}
              title={`Click to view how ${currentExplanation.title} works`}
            >
              <span className="material-symbols-outlined text-sm">info</span>
              <span className="hidden sm:inline text-[11px]">How it works</span>
            </button>
          </div>
        </div>

        {/* Right User Info & Actions matching Screenshot */}
        <div className="flex items-center gap-2.5">
          {/* Refresh Page Data Button (Without full website reload) */}
          <button
            onClick={handleRefreshClick}
            title="Refresh Page Data (Without full website reload)"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all active:scale-95 shadow-xs ${darkMode
                ? 'bg-[#181D26] hover:bg-[#222936] text-[#E5A812] border-[#262F3D]'
                : 'bg-amber-50 hover:bg-amber-100 text-[#7D610F] border-amber-200'
              }`}
          >
            <span className={`material-symbols-outlined text-[16px] ${isRefreshing ? 'animate-spin' : ''}`}>sync</span>
            <span className="hidden sm:inline">Refresh Page</span>
          </button>

          <span className={`text-xs font-medium hidden sm:inline ${darkMode ? 'text-slate-300' : 'text-slate-500'}`}>
            Welcome, <strong className={`font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{currentUser ? currentUser.name : 'Admin User 1'}</strong>
          </span>

          <button
            onClick={onOpenAddLead}
            className={`flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-xs font-black shadow-md transition-all active:scale-95 ${darkMode
                ? 'bg-[#D99B00] hover:bg-[#E5A812] text-slate-950'
                : 'bg-[#7D610F] hover:bg-[#68500C] text-white'
              }`}
          >
            <span className="material-symbols-outlined text-[16px] font-black">add</span>
            <span>Add Lead</span>
          </button>
        </div>
      </header>

      {/* ---------------------------------------------------- */}
      {/* PAGE WORKING EXPLANATION MODAL FOR EVERY PAGE        */}
      {/* ---------------------------------------------------- */}
      {showPageInfoModal && (
        <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className={`rounded-3xl max-w-xl w-full p-6 shadow-2xl border space-y-4 max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-[#1f2223] border-[#383d40] text-slate-100' : 'bg-white border-slate-100 text-slate-900'}`}>

            {/* Modal Header */}
            <div className={`flex items-start justify-between border-b pb-4 ${darkMode ? 'border-[#35393c]' : 'border-slate-100'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-2xl ${darkMode ? 'bg-amber-950/40 text-amber-300 border border-amber-800/40' : currentExplanation.color} flex items-center justify-center shadow-xs`}>
                  <span className="material-symbols-outlined text-2xl">{currentExplanation.icon}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#E5A812]">Page Working Guide</span>
                  <h3 className={`text-lg font-bold ${darkMode ? 'text-[#e8e6e3]' : 'text-slate-900'}`}>{currentExplanation.title}</h3>
                  <p className={`text-xs font-medium ${darkMode ? 'text-[#a19b91]' : 'text-slate-500'}`}>{currentExplanation.subtitle}</p>
                </div>
              </div>
              <button
                onClick={() => setShowPageInfoModal(false)}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${darkMode ? 'bg-[#161819] text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-400 hover:text-slate-700'}`}
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-3.5 text-xs">

              {/* Section 1: Purpose */}
              <div className={`p-3.5 rounded-2xl border ${darkMode ? 'bg-[#161819] border-[#35393c] text-[#cdc8c0]' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                <h4 className={`font-bold mb-1 flex items-center gap-1.5 text-xs ${darkMode ? 'text-[#e8e6e3]' : 'text-slate-900'}`}>
                  <span className="material-symbols-outlined text-[#E5A812] text-base">center_focus_strong</span>
                  <span>Page Purpose & Objective</span>
                </h4>
                <p className="leading-relaxed">{currentExplanation.purpose}</p>
              </div>

              {/* Section 2: Key Features */}
              <div className={`p-3.5 rounded-2xl border ${darkMode ? 'bg-[#122438] border-[#1a3c5e] text-[#90caf9]' : 'bg-blue-50/70 border-blue-200 text-slate-800'}`}>
                <h4 className={`font-bold mb-2 flex items-center gap-1.5 text-xs ${darkMode ? 'text-[#90caf9]' : 'text-blue-900'}`}>
                  <span className="material-symbols-outlined text-base">featured_play_list</span>
                  <span>Key Features & Tools</span>
                </h4>
                <ul className="space-y-1.5">
                  {currentExplanation.features.map((feat, idx) => (
                    <li key={idx} className={`flex items-start gap-2 font-medium ${darkMode ? 'text-[#d1ccc4]' : 'text-slate-700'}`}>
                      <span className="material-symbols-outlined text-sm mt-0.5">check_circle</span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Section 3: How to Use */}
              <div className={`p-3.5 rounded-2xl border ${darkMode ? 'bg-[#332900] border-[#594700] text-[#ffe082]' : 'bg-amber-50/80 border-amber-200 text-amber-950'}`}>
                <h4 className="font-bold text-[#E5A812] mb-1 flex items-center gap-1.5 text-xs">
                  <span className="material-symbols-outlined text-base">play_circle</span>
                  <span>How Counselors & Admins Use This Page</span>
                </h4>
                <p className={`leading-relaxed font-medium ${darkMode ? 'text-[#d1ccc4]' : 'text-slate-800'}`}>{currentExplanation.howToUse}</p>
              </div>

              {/* Section 4: Pro Tip */}
              <div className={`p-3.5 rounded-2xl border ${darkMode ? 'bg-[#142918] border-[#1e4624] text-[#81c784]' : 'bg-emerald-50/80 border-emerald-200 text-emerald-950'}`}>
                <h4 className="font-bold text-emerald-400 mb-1 flex items-center gap-1.5 text-xs">
                  <span className="material-symbols-outlined text-base">lightbulb</span>
                  <span>Pro Tip for Maximum Productivity</span>
                </h4>
                <p className={`leading-relaxed font-semibold ${darkMode ? 'text-[#a5d6a7]' : 'text-emerald-900'}`}>{currentExplanation.proTip}</p>
              </div>

            </div>

            {/* Modal Footer */}
            <div className={`pt-2 flex justify-end border-t ${darkMode ? 'border-[#35393c]' : 'border-slate-100'}`}>
              <button
                onClick={() => setShowPageInfoModal(false)}
                className={`font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-all ${darkMode ? 'bg-[#D99B00] hover:bg-[#E5A812] text-slate-950' : 'bg-[#7D610F] hover:bg-[#634C0A] text-white'}`}
              >
                Got it, close guide
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

