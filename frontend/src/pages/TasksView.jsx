import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { ConfirmModal } from '../components/ConfirmModal';

export const TasksView = ({ currentUser, onNotify, darkMode }) => {
  const [tasks, setTasks] = useState([]);
  const [filterStatus, setFilterStatus] = useState('All');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [confirmTask, setConfirmTask] = useState(null);

  // New Task Form
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [leadId, setLeadId] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueTime, setDueTime] = useState('12:00');
  const [priority, setPriority] = useState('Medium');
  const [assignedUser, setAssignedUser] = useState('Rahul Sharma');

  useEffect(() => {
    loadTasks();
  }, [filterStatus]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const data = await api.getTasks({ status: filterStatus });
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load tasks:", err);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    try {
      await api.addTask({
        title: taskTitle.trim(),
        description: taskDesc.trim(),
        leadId: leadId.trim(),
        assignedUser,
        dueDate,
        dueTime,
        priority,
        createdBy: currentUser ? currentUser.name : 'System'
      });

      setShowModal(false);
      setTaskTitle('');
      setTaskDesc('');
      setLeadId('');
      if (onNotify) onNotify("Task created successfully!");
      loadTasks();
    } catch (err) {
      alert("Failed to create task: " + err.message);
    }
  };

  const handleToggleStatus = async (task) => {
    // Once completed, task cannot be unchecked
    if (task.status === 'Completed') return;
    setConfirmTask(task);
  };

  const executeTaskCompletion = async (task) => {
    try {
      await api.updateTask(task.taskId, { status: 'Completed' });
      loadTasks();
    } catch (err) {
      alert("Failed to complete task");
    }
  };

  return (
    <div className={`space-y-6 transition-colors ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
      
      {/* Header Controls */}
      <div className={`p-5 rounded-xl border shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors ${
        darkMode ? 'bg-[#181D26] border-[#262F3D]' : 'bg-white border-slate-200'
      }`}>
        <div>
          <h2 className={`font-bold text-xl flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            <span className="material-symbols-outlined text-[#7D610F]">check_box</span>
            <span>Tasks & Follow-up Reminders</span>
          </h2>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Manage daily counselor assignments and lead follow-up action items</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={`border rounded-lg py-2 px-3 text-xs font-semibold outline-none transition-colors ${
              darkMode ? 'bg-[#12161F] border-[#262F3D] text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-900'
            }`}
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          {currentUser?.role?.toUpperCase() === 'ADMIN' && (
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-[#7D610F] hover:bg-[#68500C] text-white rounded-lg text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>Create Task</span>
            </button>
          )}
        </div>
      </div>

      {/* Tasks Table List */}
      <div className={`rounded-xl border shadow-sm overflow-hidden transition-colors ${
        darkMode ? 'bg-[#181D26] border-[#262F3D]' : 'bg-white border-slate-200'
      }`}>
        {loading ? (
          <div className="py-16 text-center text-slate-500">
            <span className="material-symbols-outlined text-[36px] animate-spin text-[#7D610F]">sync</span>
            <p className="text-xs font-semibold mt-2">Loading tasks...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <span className="material-symbols-outlined text-[48px]">task</span>
            <p className="text-xs font-medium">No tasks found matching filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#0F2438] text-white font-bold uppercase text-[11px]">
                  <th className="py-3 px-4 w-10">Done</th>
                  <th className="py-3 px-4">Task Details</th>
                  <th className="py-3 px-4">Linked Lead</th>
                  <th className="py-3 px-4">Assigned To</th>
                  <th className="py-3 px-4">Due Date & Time</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? 'divide-[#222936]' : 'divide-slate-100'}`}>
                {tasks.map(t => (
                  <tr key={t.taskId} className={`transition-colors ${
                    darkMode ? 'hover:bg-[#1E2633]' : 'hover:bg-slate-50'
                  }`}>
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={t.status === 'Completed'}
                        disabled={t.status === 'Completed'}
                        onChange={() => handleToggleStatus(t)}
                        className={`w-4 h-4 text-[#7D610F] focus:ring-[#7D610F] rounded ${t.status === 'Completed' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      />
                    </td>
                    <td className="py-3 px-4">
                      <p className={`font-bold ${t.status === 'Completed' ? 'line-through text-slate-500' : (darkMode ? 'text-white' : 'text-slate-900')}`}>
                        {t.title}
                      </p>
                      {t.description && <p className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t.description}</p>}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-[#7D610F]">
                      {t.leadId || 'N/A'}
                    </td>
                    <td className={`py-3 px-4 font-medium ${darkMode ? 'text-slate-300' : 'text-slate-800'}`}>
                      {t.assignedUser}
                    </td>
                    <td className={`py-3 px-4 font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      📅 {t.dueDate} at {t.dueTime}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        t.priority === 'High' ? 'bg-red-100 text-red-700' : (darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700')
                      }`}>
                        {t.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        t.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className={`rounded-xl shadow-2xl border w-full max-w-md p-6 space-y-4 ${
            darkMode ? 'bg-[#181D26] border-[#262F3D] text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className={`flex justify-between items-center border-b pb-3 ${darkMode ? 'border-[#262F3D]' : 'border-slate-100'}`}>
              <h3 className={`font-bold text-base ${darkMode ? 'text-white' : 'text-slate-900'}`}>Create New Task</h3>
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
                  placeholder="e.g. Call lead regarding simulator fees"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className={`w-full border rounded p-2 outline-none ${
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
                  className={`w-full border rounded p-2 outline-none ${
                    darkMode ? 'bg-[#12161F] border-[#262F3D] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Linked Lead ID</label>
                  <input
                    type="text"
                    placeholder="LD-000001"
                    value={leadId}
                    onChange={(e) => setLeadId(e.target.value)}
                    className={`w-full border rounded p-2 font-mono outline-none ${
                      darkMode ? 'bg-[#12161F] border-[#262F3D] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Assigned Counselor</label>
                  <select
                    value={assignedUser}
                    onChange={(e) => setAssignedUser(e.target.value)}
                    className={`w-full border rounded p-2 outline-none ${
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
                  <label className={`block font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className={`w-full border rounded p-2 outline-none ${
                      darkMode ? 'bg-[#12161F] border-[#262F3D] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Due Time</label>
                  <input
                    type="time"
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                    className={`w-full border rounded p-2 outline-none ${
                      darkMode ? 'bg-[#12161F] border-[#262F3D] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className={`w-full border rounded p-2 outline-none ${
                    darkMode ? 'bg-[#12161F] border-[#262F3D] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div className={`pt-3 flex justify-end gap-2 border-t ${darkMode ? 'border-[#262F3D]' : 'border-slate-100'}`}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className={`px-4 py-2 rounded font-semibold ${
                    darkMode ? 'bg-[#12161F] hover:bg-[#1E2633] text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#7D610F] text-white rounded font-bold shadow"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={!!confirmTask}
        title="Confirm Task Completion"
        message="Are you really done your task bcoz it shown directly on dashboard changes may not be retrive"
        confirmText="Yes, I'm Done"
        type="warning"
        darkMode={darkMode}
        onConfirm={() => executeTaskCompletion(confirmTask)}
        onClose={() => setConfirmTask(null)}
      />

    </div>
  );
};
