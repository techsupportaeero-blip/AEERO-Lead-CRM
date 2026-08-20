import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { AVIATION_COURSES } from '../config/constants';

export const AiAssistantView = ({ onSelectLead, onNotify }) => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'lead-scoring' | 'script-generator'

  // Chat State
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: "Hello! I am your AEERO AI Sales & Aviation Admissions Assistant. How can I help you boost enrollment and optimize counselor follow-ups today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Script Generator State
  const [selectedCourse, setSelectedCourse] = useState(AVIATION_COURSES[0]);
  const [scriptChannel, setScriptChannel] = useState('whatsapp'); // 'whatsapp' | 'email' | 'call_script'
  const [scriptTone, setScriptTone] = useState('Professional & Urgent');
  const [generatedScript, setGeneratedScript] = useState('');

  useEffect(() => {
    loadLeadsData();
  }, []);

  const loadLeadsData = async () => {
    try {
      setLoading(true);
      const data = await api.getLeads();
      setLeads(data);
    } catch (err) {
      console.error("Failed to load leads for AI analysis:", err);
    } finally {
      setLoading(false);
    }
  };

  // Pre-configured Quick Prompts
  const quickPrompts = [
    { label: "📊 Analyze my lead conversion funnel", query: "Analyze my current lead conversion funnel and give 3 actionable steps to increase CPL enrollments." },
    { label: "🔥 Show top 5 hottest leads ready to convert", query: "Show me the top hot leads with High priority and INTERESTED status who need callback today." },
    { label: "✉️ Draft WhatsApp follow-up for CPL prospect", query: "Draft a compelling WhatsApp follow-up message for a student interested in Commercial Pilot License." },
    { label: "🎯 Predict high conversion lead profiles", query: "What are the common attributes of leads with the highest conversion rate in our CRM?" }
  ];

  const handleSendMessage = async (textToSend) => {
    const query = textToSend || inputQuery;
    if (!query.trim()) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: query.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputQuery('');
    setIsTyping(true);

    setTimeout(() => {
      let aiResponseText = "";
      const qLower = query.toLowerCase();

      if (qLower.includes('funnel') || qLower.includes('analyze') || qLower.includes('conversion')) {
        const total = leads.length;
        const interested = leads.filter(l => l.status === 'INTERESTED').length;
        const converted = leads.filter(l => l.status === 'CONVERTED').length;
        aiResponseText = `📊 **AEERO CRM Conversion Funnel Analysis**:\n\n` +
          `• **Total Active Leads**: ${total}\n` +
          `• **Interested Prospects**: ${interested} (${total > 0 ? Math.round((interested / total) * 100) : 0}%)\n` +
          `• **Converted Students**: ${converted} (${total > 0 ? ((converted / total) * 100).toFixed(1) : 0}%)\n\n` +
          `💡 **Actionable AI Recommendations**:\n` +
          `1. Follow up with the ${interested} **INTERESTED** leads within 2 hours to offer a free flight simulator demonstration session.\n` +
          `2. Meta Ads lead source has high volume. Ensure instant automated WhatsApp response within 5 minutes of form submission.\n` +
          `3. Schedule DGCA Ground Classes webinar for leads pending in 'Given Details' stage.`;
      } else if (qLower.includes('hot') || qLower.includes('top') || qLower.includes('ready')) {
        const hotLeads = leads.filter(l => l.priority === 'Urgent' || l.priority === 'High' || l.status === 'INTERESTED');
        if (hotLeads.length === 0) {
          aiResponseText = "No hot leads currently flagged. Try adding high-priority tags or updating lead statuses to INTERESTED.";
        } else {
          aiResponseText = `🔥 **Top Hot Prospects Ready for Callback**:\n\n` +
            hotLeads.slice(0, 4).map(l => `• **${l.name}** (${l.leadId}) — ${l.interestedCourse} | ${l.mobile} | Status: ${l.status}`).join('\n') +
            `\n\n🎯 *Tip: Click on any lead to open their workspace and log call outcomes directly.*`;
        }
      } else if (qLower.includes('whatsapp') || qLower.includes('draft') || qLower.includes('cpl')) {
        aiResponseText = `✉️ **Recommended WhatsApp Follow-up Script**:\n\n` +
          `"Hi [Student Name]! 👋 Greetings from AEERO .\n\n` +
          `We noticed your inquiry regarding our **Commercial Pilot License (CPL)** flying program. Our next 2026 Batch includes:\n` +
          `✈️ 200 Hours Multi-Engine Flying Experience\n` +
          `🎮 Full Motion DGCA Flight Simulator Training\n` +
          `📚 Complete DGCA Ground Subjects Preparation\n\n` +
          `Would you like to schedule a 1-on-1 counseling call with Senior Captain Rahul Sharma today?\n\n` +
          `Reply *YES* or call us directly at +91 98765 43210."`;
      } else {
        aiResponseText = `I analyzed your CRM dataset (${leads.length} active leads). To maximize enrollment conversions, focus on contacting leads created within the last 24 hours and ensure every counselor logs call outcomes after each conversation.`;
      }

      const aiMsg = {
        id: Date.now() + 1,
        sender: 'ai',
        text: aiResponseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1000);
  };

  const handleGenerateScript = () => {
    let script = "";
    if (scriptChannel === 'whatsapp') {
      script = `Hi [Student Name]! 👋 Thank you for inquiring about ${selectedCourse} at AEERO.\n\n` +
        `Our admissions for the 2026 academic session are now open! We offer 100% placement assistance, state-of-the-art flight simulator labs, and DGCA certified instructors.\n\n` +
        `Would you be available for a quick 5-minute counseling call today at 3:00 PM?\n\n` +
        `Best regards,\nAEERO Admissions Team\n📞 +91 98765 43210`;
    } else if (scriptChannel === 'email') {
      script = `Subject: Admission Opportunity: ${selectedCourse} at AEERO\n\n` +
        `Dear [Student Name],\n\n` +
        `Thank you for expressing interest in the ${selectedCourse} program at AEERO.\n\n` +
        `Key Course Highlights:\n` +
        `- DGCA & Industry Compliant Curriculum\n` +
        `- Practical Hands-on Training & Flight Simulator Labs\n` +
        `- Flexible Study Modes (Offline & Online Ground Classes)\n` +
        `- Guaranteed Airline Placement Support\n\n` +
        `Please find attached the official prospectus and fee breakdown. Feel free to reply to this email or schedule a campus visit.\n\n` +
        `Warm regards,\n` +
        `Admissions Directorate\n` +
        `AEERO`;
    } else {
      script = `[Counselor Telephonic Script]\n\n` +
        `Counselor: "Hello [Student Name], this is Anita from AEERO. I am calling regarding your recent inquiry for ${selectedCourse}."\n` +
        `Student Answer: [Listen & Acknowledge]\n` +
        `Counselor Pitch: "Great! Are you looking for full-time offline pilot training or online ground subject preparation?"\n` +
        `Closing Call-to-Action: "Let me schedule a flight simulator demo session for you this Saturday. Would morning or afternoon suit you better?"`;
    }

    setGeneratedScript(script);
  };

  // Lead Scoring Calculator
  const getLeadScore = (lead) => {
    let score = 50;
    if (lead.priority === 'Urgent') score += 30;
    if (lead.priority === 'High') score += 20;
    if (lead.status === 'INTERESTED') score += 20;
    if (lead.status === 'FOLLOW_UP') score += 10;
    if (lead.source === 'Walk-in') score += 15;
    if (lead.source === 'Meta Ads' || lead.source === 'Google Ads') score += 10;
    if (lead.email) score += 5;
    return Math.min(score, 98);
  };

  return (
    <div className="space-y-6">

      {/* Top Banner */}
      <div
        style={{ background: 'linear-gradient(135deg, #7D610F 0%, #4A3807 100%)' }}
        className="rounded-xl p-6 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-[#CDB46A]/40"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 border-2 border-[#CDB46A] flex items-center justify-center shadow-inner">
            <span className="material-symbols-outlined text-[32px] text-[#CDB46A]">smart_toy</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">AEERO AI Sales Assistant</h1>
              <span className="px-2.5 py-0.5 bg-[#CDB46A] text-[#1F2937] text-[10px] font-extrabold rounded-full uppercase tracking-wider">
                v2.5 Flight Intelligence
              </span>
            </div>
            <p className="text-amber-100 text-xs mt-1">
              AI Lead Scoring • Intelligent Response Generation • Automated Follow-up Scripts
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="bg-black/20 p-1 rounded-xl flex gap-1 border border-white/10 text-xs font-semibold">
          {[
            { id: 'chat', label: 'AI Copilot Chat', icon: 'chat' },
            { id: 'lead-scoring', label: 'AI Lead Scoring', icon: 'analytics' },
            { id: 'script-generator', label: 'Script Generator', icon: 'description' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-3 py-2 rounded-lg flex items-center gap-1.5 transition-all ${activeTab === t.id
                ? 'bg-white text-[#7D610F] font-bold shadow-md'
                : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
            >
              <span className="material-symbols-outlined text-[16px]">{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: AI COPILOT CHAT */}
      {activeTab === 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Main Chat Conversation (2 Cols) */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[640px] overflow-hidden">

            {/* Chat Header */}
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-bold text-xs text-slate-800">AEERO Intelligence AI Agent</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">Context: {leads.length} Leads Analyzed</span>
            </div>

            {/* Messages Body */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4 custom-scrollbar bg-[#F1F8FC]/30">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'ai' && (
                    <div className="w-8 h-8 rounded-full bg-[#7D610F] text-white flex items-center justify-center flex-shrink-0 text-xs font-bold shadow-sm">
                      <span className="material-symbols-outlined text-[18px]">smart_toy</span>
                    </div>
                  )}

                  <div
                    className={`max-w-[82%] rounded-2xl p-4 text-xs space-y-1.5 shadow-xs ${msg.sender === 'user'
                      ? 'bg-[#7D610F] text-white rounded-br-none'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                      }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed font-sans">{msg.text}</p>
                    <span className={`block text-[9px] text-right font-mono ${msg.sender === 'user' ? 'text-amber-100' : 'text-slate-400'}`}>
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-3 items-center">
                  <div className="w-8 h-8 rounded-full bg-[#7D610F] text-white flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl p-3 text-xs text-slate-500 font-medium">
                    AEERO AI is analyzing CRM dataset & generating response...
                  </div>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="p-4 bg-white border-t border-slate-200 space-y-3">
              <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ask AI Assistant e.g. 'Draft a follow-up email' or 'Which leads need callback?'..."
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-[#7D610F] font-medium"
                />
                <button
                  type="submit"
                  disabled={!inputQuery.trim() || isTyping}
                  className="px-5 py-2.5 bg-[#7D610F] hover:bg-[#68500C] text-white rounded-xl font-bold text-xs shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[18px]">send</span>
                  <span>Send</span>
                </button>
              </form>
            </div>

          </div>

          {/* Quick Prompts Panel (1 Col) */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 border-b pb-2">
                <span className="material-symbols-outlined text-[#7D610F]">bolt</span>
                <span>Suggested AI Prompts</span>
              </h3>
              <div className="space-y-2">
                {quickPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(p.query)}
                    className="w-full text-left p-3 bg-amber-50/50 hover:bg-amber-100/60 border border-[#CDB46A]/40 rounded-xl text-xs font-semibold text-slate-800 transition-all flex items-center justify-between group"
                  >
                    <span>{p.label}</span>
                    <span className="material-symbols-outlined text-[16px] text-[#7D610F] group-hover:translate-x-1 transition-transform">
                      arrow_forward
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* AI Assistant Quick Summary Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
              <h3 className="font-bold text-sm text-slate-900 border-b pb-2">CRM Health Index</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-medium">Lead Engagement Score</span>
                  <span className="font-bold text-emerald-600 font-mono">88 / 100</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-emerald-500 h-2 rounded-full w-[88%]" />
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-slate-600 font-medium">AI Qualification Accuracy</span>
                  <span className="font-bold text-[#7D610F] font-mono">94.2%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-[#7D610F] h-2 rounded-full w-[94%]" />
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: AI LEAD SCORING */}
      {activeTab === 'lead-scoring' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b pb-3">
            <div>
              <h2 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#7D610F]">analytics</span>
                <span>Predictive AI Lead Intent & Qualification Scores</span>
              </h2>
              <p className="text-xs text-slate-500">AI algorithm evaluates lead engagement, priority, status, and source probability</p>
            </div>
            <span className="text-xs font-bold text-[#7D610F] bg-amber-50 border border-[#CDB46A] px-3 py-1 rounded-full">
              {leads.length} Active Leads Scored
            </span>
          </div>

          {loading ? (
            <div className="py-16 text-center text-slate-500">
              <span className="material-symbols-outlined text-[36px] animate-spin text-[#7D610F]">sync</span>
              <p className="text-xs font-semibold mt-2">Computing lead intent scores...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#0F2438] text-white font-bold uppercase text-[11px]">
                    <th className="py-3 px-4">Lead ID</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Interested Course</th>
                    <th className="py-3 px-4">Source</th>
                    <th className="py-3 px-4 text-center">AI Intent Score</th>
                    <th className="py-3 px-4 text-center">AI Qualification Badge</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leads.map(lead => {
                    const score = getLeadScore(lead);
                    let badgeColor = 'bg-blue-100 text-blue-800';
                    let badgeText = 'Warm Lead';
                    if (score >= 80) {
                      badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
                      badgeText = '🔥 Hot Prospect';
                    } else if (score < 60) {
                      badgeColor = 'bg-slate-100 text-slate-700';
                      badgeText = 'Cold Prospect';
                    }

                    return (
                      <tr key={lead.leadId || lead.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-[#7D610F]">
                          {lead.leadId}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {lead.name}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800">
                          {lead.interestedCourse}
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          {lead.source}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-2 rounded-full ${score >= 80 ? 'bg-emerald-500' : 'bg-[#7D610F]'}`}
                                style={{ width: `${score}%` }}
                              />
                            </div>
                            <span className="font-mono font-bold text-slate-900 text-xs">{score}/100</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${badgeColor}`}>
                            {badgeText}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => onSelectLead(lead.leadId || lead.id)}
                            className="px-3 py-1.5 bg-[#7D610F] hover:bg-[#68500C] text-white rounded text-[11px] font-semibold transition-colors"
                          >
                            Open Workspace
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SCRIPT GENERATOR */}
      {activeTab === 'script-generator' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Form Settings Panel */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-slate-900 border-b pb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#7D610F]">description</span>
              <span>AI Follow-Up Script Generator</span>
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Aviation Course</label>
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-semibold text-slate-900 outline-none"
                >
                  {AVIATION_COURSES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Communication Channel</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'whatsapp', label: 'WhatsApp', icon: 'chat' },
                    { id: 'email', label: 'Email Letter', icon: 'mail' },
                    { id: 'call_script', label: 'Call Pitch Script', icon: 'call' }
                  ].map(ch => (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => setScriptChannel(ch.id)}
                      className={`p-3 rounded-lg border font-semibold flex items-center justify-center gap-1.5 transition-all ${scriptChannel === ch.id
                        ? 'bg-amber-50 border-[#7D610F] text-[#7D610F] font-bold shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">{ch.icon}</span>
                      <span>{ch.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tone & Persuasion Level</label>
                <select
                  value={scriptTone}
                  onChange={(e) => setScriptTone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-medium text-slate-900 outline-none"
                >
                  <option value="Professional & Urgent">Professional & Urgent</option>
                  <option value="Warm & Counseling Focused">Warm & Counseling Focused</option>
                  <option value="Discount & Early Bird Offer">Discount & Early Bird Offer</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleGenerateScript}
                className="w-full py-3 bg-[#7D610F] hover:bg-[#68500C] text-white font-bold rounded-lg text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                <span>GENERATE AI SCRIPT</span>
              </button>
            </div>
          </div>

          {/* Generated Output Box */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-bold text-base text-slate-900">Generated Script Result</h3>
                {generatedScript && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedScript);
                      if (onNotify) onNotify("Script copied to clipboard!");
                    }}
                    className="px-3 py-1 bg-amber-50 text-[#7D610F] border border-[#CDB46A] rounded text-xs font-bold hover:bg-amber-100 transition-colors flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">content_copy</span>
                    <span>Copy Text</span>
                  </button>
                )}
              </div>

              {generatedScript ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {generatedScript}
                </div>
              ) : (
                <div className="py-20 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-400 space-y-2">
                  <span className="material-symbols-outlined text-[40px] text-slate-300">smart_toy</span>
                  <p className="text-xs font-medium">Select course and channel, then click Generate AI Script.</p>
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-400 text-center pt-3 border-t">
              Copy generated text directly into WhatsApp Web or your email client for fast lead follow-up.
            </p>
          </div>

        </div>
      )}

    </div>
  );
};