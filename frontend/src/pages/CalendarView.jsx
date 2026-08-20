import React, { useState, useEffect } from 'react';
import { api } from '../api/client';

export const CalendarView = ({ onSelectLead, currentUser, onNotify, darkMode }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [leadId, setLeadId] = useState('');
  const [dueTime, setDueTime] = useState('12:00');
  const [priority, setPriority] = useState('Medium');
  const [assignedUser, setAssignedUser] = useState('Rahul Sharma');

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const data = await api.getTasks();
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load tasks:", err);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  // Calendar Logic
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  const days = [];
  // Padding for previous month
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  // Helper to format date string to match task dueDate format (YYYY-MM-DD)
  const getFormattedDate = (d) => {
    const pad = (n) => n < 10 ? '0' + n : n;
    return `${year}-${pad(month + 1)}-${pad(d)}`;
  };

  const handleDayClick = (day) => {
    if (!day || currentUser?.role?.toUpperCase() !== 'ADMIN') return;
    setSelectedDate(getFormattedDate(day));
    setShowModal(true);
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskTitle.trim() || !selectedDate) return;

    try {
      await api.addTask({
        title: taskTitle.trim(),
        description: taskDesc.trim(),
        leadId: leadId.trim(),
        assignedUser,
        dueDate: selectedDate,
        dueTime,
        priority,
        createdBy: currentUser ? currentUser.name : 'System'
      });

      setShowModal(false);
      setTaskTitle('');
      setTaskDesc('');
      setLeadId('');
      if (onNotify) onNotify("Task scheduled successfully!");
      loadTasks();
    } catch (err) {
      alert("Failed to create task: " + err.message);
    }
  };

  return (
    <div className={`space-y-6 transition-colors ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
      
      {/* Top Header */}
      <div className={`p-5 rounded-xl border shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors ${
        darkMode ? 'bg-[#181D26] border-[#262F3D]' : 'bg-white border-slate-200'
      }`}>
        <div>
          <h2 className={`font-bold text-xl flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            <span className="material-symbols-outlined text-[#7D610F]">calendar_month</span>
            <span>{monthNames[month]} {year}</span>
          </h2>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Scheduled counseling calls, student simulator sessions, and task deadlines</p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handlePrevMonth} className={`p-2 border rounded transition-colors ${
            darkMode ? 'border-[#262F3D] hover:bg-[#1E2633] text-slate-300' : 'border-slate-300 hover:bg-slate-50 text-slate-700'
          }`}>
            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>
          <button onClick={handleToday} className={`px-4 py-2 border rounded font-bold text-xs transition-colors ${
            darkMode ? 'border-[#262F3D] hover:bg-[#1E2633] text-slate-300' : 'border-slate-300 hover:bg-slate-50 text-slate-700'
          }`}>
            Today
          </button>
          <button onClick={handleNextMonth} className={`p-2 border rounded transition-colors ${
            darkMode ? 'border-[#262F3D] hover:bg-[#1E2633] text-slate-300' : 'border-slate-300 hover:bg-slate-50 text-slate-700'
          }`}>
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className={`rounded-xl border shadow-sm overflow-hidden transition-colors ${
        darkMode ? 'bg-[#181D26] border-[#262F3D]' : 'bg-white border-slate-200'
      }`}>
        {loading && (
          <div className="h-1 bg-amber-500 animate-pulse w-full"></div>
        )}
        <div className={`grid grid-cols-7 border-b ${
          darkMode ? 'border-[#262F3D] bg-[#12161F]' : 'border-slate-200 bg-slate-50'
        }`}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className={`py-3 text-center text-[11px] font-bold uppercase tracking-wider border-r last:border-r-0 ${
              darkMode ? 'text-slate-400 border-[#262F3D]' : 'text-slate-500 border-slate-200'
            }`}>
              {day}
            </div>
          ))}
        </div>
        
        <div className={`grid grid-cols-7 ${darkMode ? 'bg-[#181D26]' : 'bg-white'}`}>
          {days.map((day, idx) => {
            if (!day) {
              return <div key={`empty-${idx}`} className={`min-h-[120px] p-2 border-b border-r ${
                darkMode ? 'border-[#262F3D] bg-[#12161F]/40' : 'border-slate-100 bg-slate-50/50'
              }`}></div>;
            }
            
            const dateStr = getFormattedDate(day);
            const dayTasks = tasks.filter(t => t.dueDate === dateStr);
            const isToday = new Date().toISOString().split('T')[0] === dateStr;

            return (
              <div 
                key={day} 
                onClick={() => handleDayClick(day)}
                className={`min-h-[120px] p-2 border-b border-r transition-colors relative ${
                  darkMode ? 'border-[#262F3D]' : 'border-slate-100'
                } ${
                  currentUser?.role?.toUpperCase() === 'ADMIN' 
                    ? darkMode ? 'cursor-pointer hover:bg-[#1E2633] group' : 'cursor-pointer hover:bg-slate-50 group' 
                    : ''
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold ${
                    isToday 
                      ? 'bg-[#7D610F] text-white shadow-md' 
                      : darkMode ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    {day}
                  </span>
                  {currentUser?.role?.toUpperCase() === 'ADMIN' && (
                    <span className="material-symbols-outlined text-[16px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">add_circle</span>
                  )}
                </div>

                <div className="space-y-1.5 max-h-[85px] overflow-y-auto no-scrollbar">
                  {dayTasks.map(t => (
                    <div 
                      key={t.taskId}
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent triggering day click
                        if(t.leadId && onSelectLead) onSelectLead(t.leadId);
                      }}
                      className={`px-2 py-1.5 rounded border text-[10px] leading-tight truncate cursor-pointer transition-colors ${
                        t.status === 'Completed' 
                          ? darkMode 
                            ? 'bg-emerald-950/40 border-emerald-800/40 text-emerald-300 line-through'
                            : 'bg-emerald-50 border-emerald-100 text-emerald-700 line-through'
                          : darkMode
                            ? 'bg-amber-950/50 border-amber-800/40 text-amber-200 hover:bg-amber-900/60 shadow-sm'
                            : 'bg-amber-50 border-amber-100 text-amber-900 hover:bg-amber-100 hover:border-amber-200 shadow-sm'
                      }`}
                      title={`${t.title} - ${t.assignedUser}`}
                    >
                      <span className="font-bold block truncate">{t.title}</span>
                      <span className="opacity-80 block truncate">({t.assignedUser}) {t.dueTime}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Task Modal from Calendar */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className={`rounded-xl shadow-2xl border w-full max-w-md p-6 space-y-4 ${
            darkMode ? 'bg-[#181D26] border-[#262F3D] text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className={`flex justify-between items-center border-b pb-3 ${darkMode ? 'border-[#262F3D]' : 'border-slate-100'}`}>
              <h3 className={`font-bold text-base ${darkMode ? 'text-white' : 'text-slate-900'}`}>Schedule Task on {selectedDate}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-200">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
              <div>
                <label className={`block font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Follow-up meeting"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className={`w-full border rounded p-2 outline-none focus:ring-2 focus:ring-[#7D610F]/20 focus:border-[#7D610F] ${
                    darkMode ? 'bg-[#12161F] border-[#262F3D] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Description</label>
                <textarea
                  rows={2}
                  placeholder="Task action details..."
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  className={`w-full border rounded p-2 outline-none focus:ring-2 focus:ring-[#7D610F]/20 focus:border-[#7D610F] ${
                    darkMode ? 'bg-[#12161F] border-[#262F3D] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Linked Lead ID (Optional)</label>
                  <input
                    type="text"
                    placeholder="LD-000001"
                    value={leadId}
                    onChange={(e) => setLeadId(e.target.value)}
                    className={`w-full border rounded p-2 font-mono outline-none focus:ring-2 focus:ring-[#7D610F]/20 focus:border-[#7D610F] ${
                      darkMode ? 'bg-[#12161F] border-[#262F3D] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Assigned Counselor</label>
                  <select
                    value={assignedUser}
                    onChange={(e) => setAssignedUser(e.target.value)}
                    className={`w-full border rounded p-2 outline-none focus:ring-2 focus:ring-[#7D610F]/20 focus:border-[#7D610F] ${
                      darkMode ? 'bg-[#12161F] border-[#262F3D] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="Rahul Sharma">Rahul Sharma</option>
                    <option value="Anita Verma">Anita Verma</option>
                    <option value="Suresh Menon">Suresh Menon</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Due Time</label>
                  <input
                    type="time"
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                    className={`w-full border rounded p-2 outline-none focus:ring-2 focus:ring-[#7D610F]/20 focus:border-[#7D610F] ${
                      darkMode ? 'bg-[#12161F] border-[#262F3D] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className={`w-full border rounded p-2 outline-none focus:ring-2 focus:ring-[#7D610F]/20 focus:border-[#7D610F] ${
                      darkMode ? 'bg-[#12161F] border-[#262F3D] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div className={`pt-3 flex justify-end gap-2 border-t ${darkMode ? 'border-[#262F3D]' : 'border-slate-100'}`}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className={`px-4 py-2 rounded font-semibold transition-colors ${
                    darkMode ? 'bg-[#12161F] hover:bg-[#1E2633] text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#7D610F] hover:bg-[#68500C] text-white rounded font-bold shadow transition-colors"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
