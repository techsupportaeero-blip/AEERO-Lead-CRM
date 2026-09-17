import React, { useState } from 'react';

// This page is written to be READ, not skimmed - it's meant to let a brand
// new employee learn every page and every button in the CRM without having
// to ask a teammate. Every entry below describes what actually exists in the
// code today (verified by reading each page's source), including things
// that are still mockups/placeholders - a new joinee needs to know what NOT
// to rely on just as much as what works.

const STATUS_META = {
  live: { label: 'Fully Working', bg: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  partial: { label: 'Partially Working', bg: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  stub: { label: 'Not Built Yet', bg: 'bg-slate-200 text-slate-600 border-slate-300', dot: 'bg-slate-400' }
};

export const AboutAppView = ({ darkMode }) => {
  const [selectedFeature, setSelectedFeature] = useState(null);

  const features = [
    {
      id: 'roles',
      title: 'Roles & Permissions',
      icon: 'shield_person',
      color: 'from-slate-600 to-slate-800',
      status: 'live',
      description: 'There are 3 real permission levels in the CRM today. Knowing which one you have explains why some buttons you see on other pages might be missing or disabled.',
      highlights: ['3 Access Levels', 'Sr. Counsellor = Admin minus Clear All', 'Name-based, not a formal roles table'],
      deepDive: {
        howItWorks: 'Most of the app has NO permission checks at all (Dashboard, Leads directory, Kanban, Lead Workspace, Customers, Courses, Lead Sources, Activities are all open to anyone who can log in). Only a handful of specific, more sensitive actions are actually gated, and the check is simple: is your role ADMIN, or does your name contain "INDU"?',
        buttons: [
          { name: 'Admin', desc: 'Full access to everything, including the "Clear All" bulk-archive / permanent-delete buttons on the Leads page.' },
          { name: 'Sr. Counsellor (currently only Indu)', desc: 'Gets every Admin-level ability EXCEPT "Clear All" - can restore archived leads, create Tasks, schedule from the Calendar, and bulk-assign a Campaign to a counselor. This is granted by checking if the logged-in user\'s name contains "INDU", not a real database role.' },
          { name: 'Counselor (everyone else)', desc: 'Standard access - can view/search/edit/call leads and log activities, but cannot restore an archived lead, create a Task, schedule from the Calendar, bulk-assign a Campaign, or use "Clear All". Buttons for these are simply hidden.' }
        ],
        capabilities: [
          'Restore an archived lead: Admin or Sr. Counsellor only.',
          'Create a Task (Tasks page or by clicking a Calendar day): Admin or Sr. Counsellor only.',
          'Bulk-assign a Campaign to one counselor (Leads page): Admin or Sr. Counsellor only.',
          '"Clear All" (bulk-archive every active lead, or permanently delete every archived lead): Admin only - Sr. Counsellor is deliberately excluded from this one.'
        ],
        knownIssues: [
          'Permission checks are done by matching the literal text "INDU" inside a user\'s name, not a real role/permission in the database. If a second Sr. Counsellor is ever added, or Indu\'s account name changes, this will need a code change.',
          'Every other page in the CRM (Dashboard, Leads, Kanban, Lead Workspace, Customers, Courses, Lead Sources, Activities) has no permission checks at all today - anyone who can log in can see and use all of it.'
        ]
      }
    },
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: 'dashboard',
      color: 'from-blue-500 to-indigo-600',
      status: 'partial',
      description: 'The home landing page. A live summary of your pipeline: 7 KPI cards, 4 charts, today\'s/overdue follow-ups, a recent activity feed, and a counselor leaderboard.',
      highlights: ['7 Clickable KPI Cards', '4 Live Charts', 'Custom Date Range Filter'],
      deepDive: {
        howItWorks: 'Every number on this page is calculated live from your real lead/activity/payment data for whichever date range is selected (defaults to "This Month"). Almost every card and chart has a small (i) info icon in its corner - click it to see exactly how that number is calculated and get suggested next actions.',
        buttons: [
          { name: 'Date Range control (top right)', desc: 'Click the date text, or use the dropdown, to pick Today / Yesterday / Last 7 Days / Last 30 Days / This Month / Last Month / This Quarter / a specific Year, or open a Custom Range picker with From/To date fields.' },
          { name: 'Notification Bell', desc: 'Opens the Notifications page (see below).' },
          { name: '+ Add Lead', desc: 'Opens the Add Lead form directly, without leaving the Dashboard.' },
          { name: 'KPI Card (click the card body)', desc: 'Every card except "Conversion Rate" opens a popup listing the actual leads/records behind that number. "Total Collected Income" opens a payments list with a total at the bottom.' },
          { name: '"View" link on each chart', desc: 'Opens the same kind of detail popup as clicking a KPI card.' },
          { name: 'Today\'s Follow-ups → View All', desc: 'Goes to the Calendar page.' },
          { name: 'Overdue Follow-ups → View All', desc: 'Goes to the All Leads page (not pre-filtered to just overdue leads - see Known Issues).' },
          { name: 'Recent Activities → View All', desc: 'Goes to the Activities (Audit Log) page.' },
          { name: 'Employee Performance → View All', desc: 'Opens the full counselor leaderboard in a popup, right on this page.' },
          { name: 'Top Lead Sources → View All', desc: 'Goes to the Lead Sources page.' }
        ],
        capabilities: [
          'See total/new/interested/converted lead counts and your conversion rate at a glance.',
          'Track today\'s and overdue follow-up calls so nobody gets missed.',
          'Compare every counselor side-by-side: assigned, contacted, interested, converted, lost, and conversion %.'
        ],
        knownIssues: [
          'The Notification Bell\'s badge always shows the number "3" - it does not reflect your real unread count. Use the bell dropdown itself (or the Notifications page) to see the real list.',
          '"Overdue Follow-ups → View All" takes you to the general Leads list, not a list filtered to just overdue leads.',
          '"Conversion Rate" is the only KPI card that does not open a detail popup when clicked.',
          'When there is no real data yet for a chart, it shows a placeholder instead of an honest empty state - e.g. the Lead Source chart can show a fake "100% Meta Ads" slice, and Activity Distribution can show a fake "0 Calls" slice.',
          'The (i) info popups contain Hinglish coaching tips with specific numbers ("conversion 300% badhta hai", "70%+ students turant fee deposit karte hain") - these are motivational suggestions written into the product, not measured statistics about your actual team.'
        ]
      }
    },
    {
      id: 'leads',
      title: 'All Leads (Directory)',
      icon: 'view_list',
      color: 'from-emerald-500 to-teal-600',
      status: 'live',
      description: 'The master table of every lead in the CRM, whichever channel they came from - Meta Ads, Google Ads, Google Sheets, website, or manual entry. Search, filter, bulk-message, and manage from here.',
      highlights: ['7 Filters incl. live Campaign list', 'Bulk WhatsApp & Bulk Campaign Assign', 'CSV / PDF / Print Export'],
      deepDive: {
        howItWorks: 'Loads leads from the database and applies whatever Filters panel selections and search text you\'ve set. The Campaign filter is not a fixed list - it grows automatically as new campaign names show up in your data.',
        buttons: [
          { name: '+ Add Lead', desc: 'Opens the manual Add Lead form.' },
          { name: 'Archived Leads / View Active Leads (toggle)', desc: 'Switches the whole table between active leads and soft-deleted (archived) ones. Switching resets your filters.' },
          { name: 'Enrolled Customers', desc: 'Jumps to the Customers directory (converted leads).' },
          { name: 'Reset Filters (icon)', desc: 'Clears every filter and the search box, for everyone.' },
          { name: 'Select All Matching (N)', desc: 'Selects every lead that matches your current filters across ALL pages, not just the page you\'re looking at.' },
          { name: 'Clear (N)', desc: 'Clears your current selection. Only shown once something is selected.' },
          { name: 'WhatsApp (N)', desc: 'Opens the Bulk WhatsApp modal to message every selected lead with one approved template. Only shown once something is selected.' },
          { name: 'Assign Campaign', desc: 'Admin or Sr. Counsellor only. Bulk-assigns a chosen campaign to a single counselor across selected leads.' },
          { name: 'Clear All', desc: 'Admin ONLY (Sr. Counsellor cannot use this, on purpose). On the Active view: archives every active lead in one go. On the Archived view: PERMANENTLY deletes every archived lead - this requires typing "DELETE ALL" to confirm and cannot be undone.' },
          { name: 'CSV / PDF / Print', desc: 'CSV downloads a spreadsheet of the currently filtered leads. PDF opens a print-formatted view and triggers your browser\'s print dialog. Print does the same for the current page.' },
          { name: 'Columns', desc: 'Choose which table columns are visible.' },
          { name: 'Show [10/25/50/100] entries', desc: 'Changes the page size.' },
          { name: 'Filters panel', desc: 'Date From/To, Status, Priority, Source, Campaign (live list), and Assigned To (Counselor).' },
          { name: 'Row action icons', desc: 'History icon opens the Lead Workspace; payments icon records a payment; chat icon opens WhatsApp with that number; pencil icon edits the lead; trash icon archives it (Active view) or, in the Archived view, a green "Restore" button appears for Admin/Sr. Counsellor (everyone else sees a locked "Admin Only" badge instead).' }
        ],
        capabilities: [
          'Any field value containing a Facebook "enough permissions" error is automatically cleaned up and shown as "No Permission" everywhere in the table.',
          'Selecting leads and using "WhatsApp" lets you message an entire filtered segment (e.g. everyone with status = Interested) in one action.'
        ]
      }
    },
    {
      id: 'workspace',
      title: 'Lead Workspace',
      icon: 'person',
      color: 'from-purple-500 to-fuchsia-600',
      status: 'live',
      description: 'The full 360° profile of one lead, opened by clicking their name anywhere in the CRM. Contact info, course interest, source/marketing data, counselor notes, a call-log form, and the complete activity timeline.',
      highlights: ['Call & Update Form', 'Pinned Counselor Notes', 'Full Activity Timeline'],
      deepDive: {
        howItWorks: 'Everything you see is scoped to this one lead: their details, every note ever added, every logged call/activity, and every scheduled follow-up.',
        buttons: [
          { name: 'Edit Lead', desc: 'Opens the Edit Lead form for this person.' },
          { name: 'All Leads / Back arrow', desc: 'Returns you to the Leads directory.' },
          { name: 'SAVE & UPDATE LEAD', desc: 'The main call-log form: pick a Call Outcome, write Counselor Remarks and any Additional Information, optionally schedule a Follow-Up (date, time, and type), and optionally update the lead\'s overall Status - all in one save.' },
          { name: '+ Save Note', desc: 'Adds a counselor note, optionally pinned to the top.' },
          { name: 'Pin / Unpin / Delete (per note)', desc: 'Manage existing notes.' }
        ],
        capabilities: [
          'The "Additional Sheet Data" box (when present) shows any extra columns from the original Google Sheet that didn\'t map to a standard field - including Hindi text or custom questions - so that data is never silently lost.',
          'The Activity Timeline is a complete, chronological record of every call/update logged for this lead.'
        ]
      }
    },
    {
      id: 'add-edit-lead',
      title: 'Add / Edit Lead Forms',
      icon: 'person_add',
      color: 'from-teal-500 to-cyan-600',
      status: 'live',
      description: 'The two modal forms used to manually create a new lead, or edit an existing one.',
      highlights: ['Duplicate Detection on Add', 'Tabbed Edit Form', 'Tag Support'],
      deepDive: {
        howItWorks: 'Add Lead is one scrollable form (Company & Customer Details, Classification, Assignment & Follow-up, Location, Additional Information). Edit Lead is the same kind of data split across 4 tabs (Basic Info, Course Interest, Source & Marketing, Management & Tags) pre-filled with the lead\'s current values.',
        buttons: [
          { name: 'Save (Add Lead)', desc: 'Before creating the lead, the system checks the mobile number and email against existing leads. If a match is found, it does NOT create a duplicate - it hands you off to a duplicate-resolution screen instead.' },
          { name: 'SAVE CHANGES (Edit Lead)', desc: 'Updates the lead. There is no duplicate check on edit (only on creating a brand new lead).' },
          { name: 'Cancel / X', desc: 'Closes without saving, on both forms.' }
        ],
        capabilities: [
          'Add Lead required fields: Customer Name, Mobile Number, Lead Source, Lead Status, Assigned Counselor, Interested Course.',
          'Edit Lead\'s "Source & Marketing" tab only exposes Lead Source, Campaign, Campaign ID, Ad Set and Ad Set ID for editing - a few other marketing fields exist in the data but aren\'t editable from this tab.'
        ]
      }
    },
    {
      id: 'whatsapp',
      title: 'Bulk WhatsApp Messaging',
      icon: 'forum',
      color: 'from-green-500 to-emerald-700',
      status: 'partial',
      description: 'Send one Meta-approved WhatsApp template to many selected leads at once, from the Leads page.',
      highlights: ['Template Preview Before Sending', 'Per-Lead Sent/Failed Report', 'Notification on Every Send'],
      deepDive: {
        howItWorks: 'WhatsApp only allows businesses to message people in bulk through pre-approved message templates (free-form text is blocked outside a 24-hour reply window), so this tool is a template picker + sender, not a free-text composer.',
        buttons: [
          { name: 'Template dropdown', desc: 'Choose which approved template to send. The first available template is selected automatically.' },
          { name: 'Preview', desc: 'Shows the template text with the {{1}} slot filled in using the first selected lead\'s name, as a representative example (not a per-lead preview).' },
          { name: 'Send to N Lead(s)', desc: 'Sends the message to every selected lead, one at a time, with a short delay between each to avoid rate limits.' },
          { name: 'Done', desc: 'Closes the results screen; your selection on the Leads page is cleared.' }
        ],
        capabilities: [
          'After sending, you get a full Sent ✅ / Failed ❌ breakdown per lead, right in the modal.',
          'Every send attempt (success or failure, with the reason) is also logged as a notification and an Activity entry on that lead - so you can check "who got it and who didn\'t" later from the lead\'s own Activity Timeline, or from Dashboard → Activity Distribution.'
        ],
        knownIssues: [
          'The {{1}} name placeholder is not resolving correctly with the WhatsApp provider (Omtel) yet - most templates currently show the literal text "bodyvar0" instead of the lead\'s real name. The correct field name for passing the value is still being confirmed with Omtel\'s support/docs. Templates with no variables (like the fire-safety course template) are unaffected and send correctly today.',
          'Each WhatsApp template is tied to one specific "WhatsApp Business Account" in Omtel, and only phone numbers connected to that same account can send it - a template can look fine in the CRM\'s dropdown but fail to send if no phone is connected to its account.'
        ]
      }
    },
    {
      id: 'kanban',
      title: 'Kanban Board',
      icon: 'view_kanban',
      color: 'from-amber-500 to-orange-600',
      status: 'live',
      description: 'A visual, drag-and-drop view of your pipeline across 7 fixed stages: New, No Answer, Given Details, Interested, Follow-up, Converted, Lost.',
      highlights: ['Drag-and-Drop Status Change', 'Live Count per Column', 'No Filters (shows everything)'],
      deepDive: {
        howItWorks: 'Every active lead appears as a card in the column matching its current status. Dragging a card into a different column immediately updates that lead\'s status in the database.',
        buttons: [
          { name: 'Refresh Pipeline', desc: 'Reloads the board from the server.' },
          { name: 'Drag a card', desc: 'Drop it on a different column to change that lead\'s status. The board updates instantly, then confirms with the server.' },
          { name: 'Click a card (without dragging)', desc: 'Opens that lead\'s Workspace.' }
        ],
        capabilities: [
          'Column headers show a live count of how many leads are in that stage.'
        ],
        knownIssues: [
          'There is no status filter or search on this page - it always shows every active lead across all 7 columns.',
          'There is no permission gating here - any logged-in user can drag any lead into any status.'
        ]
      }
    },
    {
      id: 'tasks',
      title: 'Tasks',
      icon: 'check_box',
      color: 'from-rose-500 to-red-600',
      status: 'live',
      description: 'A checklist of action items, optionally linked to a specific lead, with due dates and priorities.',
      highlights: ['Status Filter', 'Assignment Notification', 'Admin / Sr. Counsellor Create-Only'],
      deepDive: {
        howItWorks: 'Each row shows the task, its linked lead (if any), who it\'s assigned to, due date/time, priority, and status. Marking a task complete cannot be undone from the UI.',
        buttons: [
          { name: 'Status filter dropdown', desc: 'All Statuses / Pending / Completed / Cancelled.' },
          { name: 'Create Task', desc: 'Admin or Sr. Counsellor only. Opens a form: Title (required), Description, Linked Lead ID, Assigned Counselor, Due Date & Time, Priority.' },
          { name: 'Checkbox (per task)', desc: 'Clicking an incomplete task\'s checkbox opens a confirmation popup ("Are you really done...") before marking it Completed. Once completed, the checkbox is locked - there is no way to mark it incomplete again from here.' }
        ],
        capabilities: [
          'Whoever a task is assigned to (or re-assigned to) gets a notification instantly.'
        ],
        knownIssues: [
          'The "Assigned Counselor" dropdown on this page\'s Create Task form is a different, older hardcoded list ("Rahul Sharma", "Anita Verma", "Suresh Menon") than the one used on the Calendar page and everywhere else in the CRM ("MS. INDU", "MS. AYESHA", "MS. PRITI", "Admin User 1") - worth knowing this inconsistency exists until it\'s cleaned up.'
        ]
      }
    },
    {
      id: 'calendar',
      title: 'Calendar',
      icon: 'calendar_month',
      color: 'from-cyan-500 to-blue-600',
      status: 'live',
      description: 'A month view of every task by due date, with quick navigation and (for Admin/Sr. Counsellor) the ability to schedule a task by clicking straight on a date.',
      highlights: ['Click-a-Day to Schedule', 'Task Chips per Day', 'Month Navigation'],
      deepDive: {
        howItWorks: 'Every task with a due date shows as a small chip on its day. Completed tasks are shown with strikethrough/green styling.',
        buttons: [
          { name: '‹ / Today / ›', desc: 'Move to the previous month, jump back to the current month, or move to the next month.' },
          { name: 'Click a day cell', desc: 'Admin or Sr. Counsellor only - opens "Schedule Task on [date]" with the same fields as the Tasks page\'s Create Task form. For everyone else, day cells are not clickable.' },
          { name: 'Click a task chip', desc: 'If the task is linked to a lead, opens that lead\'s Workspace. Available to everyone.' }
        ],
        capabilities: [
          'Gives a fast at-a-glance view of how loaded any given day/week is.'
        ]
      }
    },
    {
      id: 'activities',
      title: 'Activities (Audit Log)',
      icon: 'pulse',
      color: 'from-indigo-500 to-purple-600',
      status: 'partial',
      description: 'A full audit trail of what every team member (and the system) has done - calls logged, leads created/updated, status changes, and more.',
      highlights: ['Per-User Trace Drill-down', 'Raw Chronological Stream', 'Jump to Any Lead'],
      deepDive: {
        howItWorks: 'Two view modes: "User Pulse" shows one summary row per user (their latest action + total activity count); "Raw Stream" shows every single log entry in order.',
        buttons: [
          { name: 'User Pulse (N) / Raw Stream (N)', desc: 'Switch between the two view modes.' },
          { name: 'Refresh', desc: 'Reloads the logs and user list.' },
          { name: 'Search', desc: 'Filters users (Pulse mode) or raw log rows (Stream mode) by user/action/entity text.' },
          { name: 'Click a user row / View Trace', desc: 'Opens a drill-down modal of just that user\'s activity, with its own search box and action filter pills (All / CREATE / UPDATE / CALL / NOTE / STATUS).' },
          { name: 'Any entity ID starting "LD-"', desc: 'Clickable anywhere in this page - jumps straight to that lead\'s Workspace.' }
        ],
        capabilities: [
          'Useful for checking exactly what happened to a specific lead, or how active a specific counselor has been.'
        ],
        knownIssues: [
          'The "Sync Status" card always displays "Real-Time Active" with a green dot - it is not a real live-connection check, just static text. Data only refreshes when you click Refresh or reload the page.',
          'There is no permission gating - any user who can open this page can see every other user\'s complete activity trace.'
        ]
      }
    },
    {
      id: 'customers',
      title: 'Customers',
      icon: 'group',
      color: 'from-fuchsia-500 to-pink-600',
      status: 'partial',
      description: 'A read-only directory of converted/enrolled leads (paying students) - contact details and a link back to their original lead record.',
      highlights: ['Search by Name/Phone', 'Jump Back to Original Lead'],
      deepDive: {
        howItWorks: 'Populated automatically whenever a lead is marked Converted. Shows Customer ID, name, mobile/WhatsApp, email, city/state, notes, and enrolled date.',
        buttons: [
          { name: 'Search box', desc: 'Filters by student name, phone, or email.' },
          { name: 'View Lead', desc: 'Only shown if the customer record still has a linked lead ID - jumps to that lead\'s Workspace.' }
        ],
        capabilities: [],
        knownIssues: [
          'This page is read-only - there is no Add, Edit, Delete, CSV export, or pagination here today. All records load and display at once.'
        ]
      }
    },
    {
      id: 'products',
      title: 'Products & Services (Courses)',
      icon: 'inventory_2',
      color: 'from-orange-500 to-amber-700',
      status: 'partial',
      description: 'The catalog of courses/programs sold to leads - name, code, category, duration, and fee. These populate the "Interested Course" dropdown everywhere else in the CRM.',
      highlights: ['Table & Card View Toggle', 'CSV Export', 'Filters by Status/Category/Duration'],
      deepDive: {
        howItWorks: 'Standard catalog CRUD, with a Table view and an alternate Card grid view showing the same data.',
        buttons: [
          { name: '+ Add Product/Service', desc: 'Opens the add form (Name, auto-generated Code, Description, Category, Duration, Tuition Fee).' },
          { name: 'Filters: Status / Category / Duration', desc: 'Narrow the list, plus a Clear All button to reset.' },
          { name: 'CSV / PDF / Print', desc: 'Export the filtered list.' },
          { name: 'Table / Cards toggle', desc: 'Switch layout.' },
          { name: 'Edit / Delete (per row or card)', desc: 'Edit opens the pre-filled form; Delete asks for confirmation first.' },
          { name: 'Previous / Next', desc: 'Pagination.' }
        ],
        capabilities: [],
        knownIssues: [
          'The "PDF" export button currently downloads the exact same CSV file as the "CSV" button - it does not produce a real PDF.',
          'The "Top Specialization" summary card is a hardcoded value ("Technical Diploma"), not calculated from your real data.',
          'A course\'s "Created" date falls back to a fixed placeholder date if the real created date is missing.',
          'New course codes are randomly generated on the spot and are not guaranteed to be unique.'
        ]
      }
    },
    {
      id: 'lead-sources',
      title: 'Lead Sources',
      icon: 'share',
      color: 'from-sky-500 to-blue-700',
      status: 'partial',
      description: 'The catalog of marketing channels/sources (Meta Ads, Walk-In, Google Ads, etc.), each with live performance stats pulled from your real leads.',
      highlights: ['Auto-Detected Sources', 'Conversion Rate per Source', 'CSV Export'],
      deepDive: {
        howItWorks: 'If a lead comes in tagged with a source that isn\'t in the catalog yet, it shows here with an "Auto-detected" badge and a one-click "+ Add to Catalog" action, so nothing gets lost.',
        buttons: [
          { name: '+ Add Source', desc: 'Opens the add form (Name, Cost per Lead, Description, Type, Category, Status).' },
          { name: 'Filters: Status / Source Type / Category', desc: 'Plus a Clear All button.' },
          { name: 'CSV / PDF / Print', desc: 'Export.' },
          { name: 'View Details / Edit / Delete', desc: 'Per row.' },
          { name: '+ Add to Catalog', desc: 'Only shown for auto-detected sources - pre-fills and opens the Add form with that source\'s name.' }
        ],
        capabilities: [
          'Each source shows Total Leads, Converted count, and Conversion Rate %, so you can see which channels are actually paying off.'
        ],
        knownIssues: [
          'Same as Courses: the "PDF" export button just re-downloads the CSV file, not a real PDF.',
          '"View Details" opens a plain browser pop-up dumping the raw fields as text, rather than a proper details panel.',
          '"Cost per Lead" is a free-text field with no number validation or currency formatting.'
        ]
      }
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: 'notifications',
      color: 'from-yellow-500 to-amber-600',
      status: 'live',
      description: 'Real-time alerts for the two things that matter most: a new lead being assigned to you, and a task being assigned (or re-assigned) to you.',
      highlights: ['Bell Icon in Header (every page)', 'Full List Page', 'Click to Jump Straight There'],
      deepDive: {
        howItWorks: 'There are two ways to see notifications: the bell icon in the top header (available on every page, shows a live unread-count badge and a dropdown preview), and this full Notifications page for the complete list. Both update instantly via a live connection - no need to refresh.',
        buttons: [
          { name: 'Bell icon (header, every page)', desc: 'Click to open a dropdown of your recent notifications. Updates live the instant a new one arrives, without needing a page refresh.' },
          { name: 'All / Unread toggle', desc: 'Filter the list on the full Notifications page.' },
          { name: 'Mark All Read', desc: 'Only shown when you have unread notifications.' },
          { name: 'Click a notification', desc: 'Marks it read, then jumps you straight to the relevant place: a task notification opens the Tasks page; a lead notification opens that specific lead\'s Workspace.' }
        ],
        capabilities: [
          'You get notified the instant a new lead (manual entry or from Google Sheets) is assigned to you, or a task is assigned/re-assigned to you.'
        ]
      }
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: 'settings',
      color: 'from-slate-500 to-slate-700',
      status: 'stub',
      description: 'Your personal account settings page - Profile, Preferences, Security, and Notification toggles.',
      highlights: ['UI Preview Only', 'Nothing Saves Yet'],
      deepDive: {
        howItWorks: 'This page currently exists as a visual mockup for planned functionality - the layout is built, but none of it is wired up to real data yet.',
        buttons: [
          { name: 'Save Changes', desc: 'Shows a "Settings saved successfully!" message, but does not actually save anything.' },
          { name: 'Every other field/toggle on this page', desc: '(Name, Email, Phone, Department, display toggles, Timezone, password fields, "Update Password", "Setup 2FA", notification toggles) - all currently decorative. None of them read or write real data.' }
        ],
        capabilities: [],
        knownIssues: [
          'Nothing on this page is functional yet - treat it as a preview of what\'s coming, not a working settings screen.'
        ]
      }
    },
    {
      id: 'system-settings',
      title: 'System Settings',
      icon: 'tune',
      color: 'from-zinc-600 to-zinc-800',
      status: 'stub',
      description: 'Company-wide configuration - Company Profile, Branding, Integrations, and Data Backup.',
      highlights: ['UI Preview Only', 'Integrations List is Hardcoded'],
      deepDive: {
        howItWorks: 'Like Settings, this page is a built-but-not-wired-up mockup of planned admin functionality.',
        buttons: [
          { name: 'Save Configuration', desc: 'Shows a success message but does not save anything.' },
          { name: 'Upload/Remove Logo, color swatches, + Add Webhook, gear icons, Generate New Backup, Data Retention dropdown', desc: 'All currently non-functional.' }
        ],
        capabilities: [],
        knownIssues: [
          'The Integrations tab shows 4 fixed, hardcoded connection statuses (Meta Leads: Connected, Google Sheets: Connected, WhatsApp Business API: Disconnected, Zapier: Disconnected) - this is not a live check of your actual integrations.',
          'Nothing on this page is functional yet.'
        ]
      }
    },
    {
      id: 'not-built',
      title: 'Not Built Yet',
      icon: 'construction',
      color: 'from-gray-500 to-gray-700',
      status: 'stub',
      description: 'These sidebar links currently just show a spinning "In Progress" loader - there is no page behind them yet.',
      highlights: ['Users Management', 'Email Templates', 'Email Triggers'],
      deepDive: {
        howItWorks: 'Clicking any of these 3 items in the sidebar (under MANAGEMENT) opens a placeholder loading screen with no content, because the actual page hasn\'t been built.',
        buttons: [],
        capabilities: [],
        knownIssues: [
          '"Users Management" - intended for adding staff accounts and assigning roles, not built yet. Right now new User accounts have to be created directly in the database.',
          '"Email Templates" and "Email Triggers" - intended for automated email campaigns, not built yet.'
        ]
      }
    },
    {
      id: 'navigation',
      title: 'Top Bar & Sidebar (Always Visible)',
      icon: 'apps',
      color: 'from-[#7D610F] to-[#3E3100]',
      status: 'live',
      description: 'The header and sidebar are visible on every single page - here\'s what every icon in them does.',
      highlights: ['Global Search', 'Dark/Light Mode', 'Per-Page "How it works" Guide'],
      deepDive: {
        howItWorks: 'The Sidebar (left) holds all page navigation, grouped into MAIN, MANAGEMENT, SETTINGS, and SYSTEM. The Header (top) holds page-level actions plus things that follow you everywhere: search, notifications, and your account.',
        buttons: [
          { name: 'AEERO logo + page title', desc: 'Shows which page you\'re on, with its icon.' },
          { name: 'How it works (i button, header)', desc: 'Opens a quick guide popup for whichever page you\'re currently on - a shorter, built-in version of what this About App page covers in full.' },
          { name: 'Notification Bell', desc: 'See the Notifications entry above.' },
          { name: 'Refresh Page', desc: 'Re-fetches the current page\'s data without a full browser reload.' },
          { name: '+ Add Lead (header)', desc: 'Opens the Add Lead form from anywhere in the app.' },
          { name: 'Sidebar: role badge', desc: 'Under your name/avatar - shows ADMIN ROLE, COUNSELOR, or SR. COUNSELLOR depending on who you are (see the Roles & Permissions card above).' },
          { name: 'Dark Mode / Light Mode toggle', desc: 'In the sidebar footer - switches the whole app\'s theme.' },
          { name: 'Sign Out', desc: 'In the sidebar footer.' }
        ],
        capabilities: [
          'The Leads badge in the sidebar always shows a live count of active leads.'
        ]
      }
    }
  ];

  return (
    <div className={`space-y-6 font-sans transition-colors min-h-[80vh] relative ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>

      {/* Hero Section */}
      <div className={`relative overflow-hidden rounded-3xl p-8 md:p-12 shadow-2xl ${
        darkMode ? 'bg-gradient-to-br from-[#151C24] to-[#0A0D14] border border-slate-800' : 'bg-gradient-to-br from-[#7D610F] to-[#3E3100] text-white'
      }`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4"></div>

        <div className="relative z-10 flex flex-col items-center text-center max-w-3xl mx-auto space-y-6">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 flex items-center justify-center shadow-inner mb-2">
            <span className="material-symbols-outlined text-[40px] text-amber-300">rocket_launch</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white">
            AEERO Lead Management CRM
          </h1>
          <p className={`text-lg md:text-xl font-medium leading-relaxed ${darkMode ? 'text-slate-300' : 'text-amber-100'}`}>
            A page-by-page, button-by-button guide to every part of this CRM - written so a new team member can learn the whole system on their own, no questions needed.
          </p>
          <p className={`text-sm font-semibold px-4 py-2 rounded-xl backdrop-blur-sm border ${darkMode ? 'bg-white/5 border-white/10 text-slate-200' : 'bg-white/15 border-white/20 text-white'}`}>
            Every card below is honest about what actually works today, and what's still a work-in-progress mockup - click any card to see the full breakdown.
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="space-y-8 animate-fade-in pt-4 pb-10">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className={`text-2xl font-extrabold mb-3 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Explore Every Page
          </h2>
          <p className={darkMode ? 'text-slate-400' : 'text-slate-600'}>
            <strong className="block mt-1 text-amber-500">Click on any card below to see exactly how that page works and what each button does.</strong>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => {
            const statusMeta = STATUS_META[feature.status] || STATUS_META.live;
            return (
              <div
                key={feature.id}
                onClick={() => setSelectedFeature(feature)}
                className={`group relative rounded-2xl p-6 border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer overflow-hidden ${
                  darkMode ? 'bg-[#151C24] border-slate-800 hover:border-slate-600' : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity`}></div>

                <div className="flex justify-between items-start mb-4">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br ${feature.color} text-white shadow-lg`}>
                    <span className="material-symbols-outlined text-[28px]">{feature.icon}</span>
                  </div>
                  <span className={`material-symbols-outlined transition-transform group-hover:translate-x-1 ${darkMode ? 'text-slate-600' : 'text-slate-300'}`}>
                    arrow_forward
                  </span>
                </div>

                <div className="mb-2">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${statusMeta.bg}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`}></span>
                    {statusMeta.label}
                  </span>
                </div>

                <h3 className={`text-xl font-extrabold mb-3 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  {feature.title}
                </h3>

                <p className={`text-sm leading-relaxed mb-6 h-20 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  {feature.description}
                </p>

                <div className={`space-y-2 pt-4 border-t ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                  {feature.highlights.map((highlight, hIdx) => (
                    <div key={hIdx} className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-emerald-500">check_circle</span>
                      <span className={`text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{highlight}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Feature Deep Dive Modal */}
      {selectedFeature && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className={`relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl flex flex-col md:flex-row border ${
            darkMode ? 'bg-[#0A0D14] border-slate-700' : 'bg-white border-slate-200'
          }`}>

            {/* Modal Left Sidebar / Header */}
            <div className={`p-8 md:w-1/3 flex flex-col justify-between bg-gradient-to-br ${selectedFeature.color} text-white flex-shrink-0`}>
              <div>
                <button
                  onClick={() => setSelectedFeature(null)}
                  className="mb-6 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center backdrop-blur-md transition-colors"
                >
                  <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6 shadow-inner backdrop-blur-sm">
                  <span className="material-symbols-outlined text-[36px]">{selectedFeature.icon}</span>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border mb-3 ${(STATUS_META[selectedFeature.status] || STATUS_META.live).bg}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${(STATUS_META[selectedFeature.status] || STATUS_META.live).dot}`}></span>
                  {(STATUS_META[selectedFeature.status] || STATUS_META.live).label}
                </span>
                <h2 className="text-3xl font-black mb-4 leading-tight">{selectedFeature.title}</h2>
                <p className="text-white/80 text-sm leading-relaxed font-medium">
                  {selectedFeature.description}
                </p>
              </div>
            </div>

            {/* Modal Right Content Area */}
            <div className="p-8 md:w-2/3 space-y-8">

              {/* How it works */}
              <section>
                <h3 className={`text-sm font-extrabold uppercase tracking-wider mb-3 flex items-center gap-2 ${darkMode ? 'text-[#E2B134]' : 'text-[#7D610F]'}`}>
                  <span className="material-symbols-outlined text-[18px]">lightbulb</span>
                  How It Works
                </h3>
                <p className={`text-sm leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  {selectedFeature.deepDive.howItWorks}
                </p>
              </section>

              {/* Key Capabilities */}
              {selectedFeature.deepDive.capabilities && selectedFeature.deepDive.capabilities.length > 0 && (
                <section>
                  <h3 className={`text-sm font-extrabold uppercase tracking-wider mb-4 flex items-center gap-2 ${darkMode ? 'text-[#E2B134]' : 'text-[#7D610F]'}`}>
                    <span className="material-symbols-outlined text-[18px]">workspace_premium</span>
                    What You Can Do
                  </h3>
                  <ul className="space-y-3">
                    {selectedFeature.deepDive.capabilities.map((cap, idx) => (
                      <li key={idx} className="flex gap-3 items-start">
                        <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${darkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>
                          <span className="material-symbols-outlined text-[12px]">done</span>
                        </div>
                        <span className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{cap}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Interface Buttons Explained */}
              {selectedFeature.deepDive.buttons && selectedFeature.deepDive.buttons.length > 0 && (
                <section className={`pt-6 border-t ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                  <h3 className={`text-sm font-extrabold uppercase tracking-wider mb-4 flex items-center gap-2 ${darkMode ? 'text-[#E2B134]' : 'text-[#7D610F]'}`}>
                    <span className="material-symbols-outlined text-[18px]">touch_app</span>
                    Interface Guide (Buttons & Actions)
                  </h3>
                  <div className="grid gap-4">
                    {selectedFeature.deepDive.buttons.map((btn, idx) => (
                      <div key={idx} className={`p-4 rounded-xl border ${darkMode ? 'bg-[#151C24] border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                        <h4 className={`font-bold mb-1 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                          <span className="material-symbols-outlined text-[16px] text-slate-400">smart_button</span>
                          {btn.name}
                        </h4>
                        <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                          {btn.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Known Issues / Not Yet Working */}
              {selectedFeature.deepDive.knownIssues && selectedFeature.deepDive.knownIssues.length > 0 && (
                <section className={`pt-6 border-t ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                  <h3 className="text-sm font-extrabold uppercase tracking-wider mb-4 flex items-center gap-2 text-amber-600">
                    <span className="material-symbols-outlined text-[18px]">warning</span>
                    Known Issues / Not Yet Working
                  </h3>
                  <ul className="space-y-3">
                    {selectedFeature.deepDive.knownIssues.map((issue, idx) => (
                      <li key={idx} className={`flex gap-3 items-start p-3 rounded-xl border ${darkMode ? 'bg-amber-950/20 border-amber-900/40' : 'bg-amber-50 border-amber-200'}`}>
                        <span className="material-symbols-outlined text-[16px] text-amber-500 mt-0.5 flex-shrink-0">info</span>
                        <span className={`text-xs font-medium leading-relaxed ${darkMode ? 'text-amber-200' : 'text-amber-900'}`}>{issue}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}} />
    </div>
  );
};
