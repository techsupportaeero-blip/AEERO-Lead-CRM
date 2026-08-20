const getApiBaseUrl = () => {
  let url = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '/api';
  url = url.trim().replace(/\/+$/, '');
  if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/')) {
    url = `/${url}`;
  }
  if (!url.endsWith('/api')) {
    url = `${url}/api`;
  }
  return url;
};

const API_BASE = getApiBaseUrl();


export const api = {
  // Authentication
  async login(username, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to login');
    return data;
  },

  async getUsers() {
    const res = await fetch(`${API_BASE}/users`);
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },

  // Stats
  async getStats() {
    const res = await fetch(`${API_BASE}/stats`);
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
  },

  // Config
  async getConfig() {
    const res = await fetch(`${API_BASE}/config`);
    if (!res.ok) throw new Error('Failed to fetch config');
    return res.json();
  },

  // Public Website Lead Capture API (POST /api/public/leads)
  async submitPublicLead(publicData) {
    const res = await fetch(`${API_BASE}/public/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(publicData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to submit public lead');
    return data;
  },

  // Leads
  async getLeads(filters = {}) {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.status) params.append('status', filters.status);
    if (filters.source) params.append('source', filters.source);
    if (filters.owner) params.append('owner', filters.owner);
    if (filters.course) params.append('course', filters.course);
    if (filters.priority) params.append('priority', filters.priority);
    if (filters.city) params.append('city', filters.city);
    if (filters.tag) params.append('tag', filters.tag);
    if (filters.onlyArchived) params.append('onlyArchived', 'true');
    if (filters.includeArchived) params.append('includeArchived', 'true');

    const res = await fetch(`${API_BASE}/leads?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch leads');
    return res.json();
  },

  async getLeadById(id) {
    const res = await fetch(`${API_BASE}/leads/${id}`);
    if (!res.ok) throw new Error('Failed to fetch lead details');
    return res.json();
  },

  async checkDuplicate(data) {
    const res = await fetch(`${API_BASE}/leads/check-duplicate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to check duplicate');
    return res.json();
  },

  async createLead(leadData) {
    const res = await fetch(`${API_BASE}/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(leadData),
    });
    const data = await res.json();
    if (!res.ok) {
      const error = new Error(data.error || 'Failed to create lead');
      error.isDuplicate = data.isDuplicate;
      error.existingLead = data.existingLead;
      throw error;
    }
    return data;
  },

  async updateLead(id, leadData) {
    const res = await fetch(`${API_BASE}/leads/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(leadData),
    });
    if (!res.ok) throw new Error('Failed to update lead');
    return res.json();
  },

  async updateLeadStatus(id, status, updatedBy) {
    const res = await fetch(`${API_BASE}/leads/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, updatedBy }),
    });
    if (!res.ok) throw new Error('Failed to update lead status');
    return res.json();
  },

  // Soft Archive Lead instead of permanent deletion
  async archiveLead(id, currentUser = 'System') {
    const res = await fetch(`${API_BASE}/leads/${id}/archive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentUser }),
    });
    if (!res.ok) throw new Error('Failed to archive lead');
    return res.json();
  },

  // Unarchive / Restore Lead
  async unarchiveLead(id, currentUser = 'Admin') {
    const res = await fetch(`${API_BASE}/leads/${id}/unarchive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentUser }),
    });
    if (!res.ok) throw new Error('Failed to unarchive lead');
    return res.json();
  },

  // Payments
  async getLeadPayments(leadId) {
    const res = await fetch(`${API_BASE}/leads/${leadId}/payments`);
    if (!res.ok) throw new Error('Failed to fetch payments');
    return res.json();
  },

  async recordPayment(leadId, paymentData) {
    const res = await fetch(`${API_BASE}/leads/${leadId}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to record payment');
    }
    return res.json();
  },

  // Activities
  async getActivities(leadId) {
    const res = await fetch(`${API_BASE}/leads/${leadId}/activities`);
    if (!res.ok) throw new Error('Failed to fetch activities');
    return res.json();
  },

  async recordActivity(leadId, activityData) {
    const res = await fetch(`${API_BASE}/leads/${leadId}/activities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(activityData),
    });
    if (!res.ok) throw new Error('Failed to record call activity');
    return res.json();
  },

  // Followups
  async getFollowups(leadId) {
    const res = await fetch(`${API_BASE}/leads/${leadId}/followups`);
    if (!res.ok) throw new Error('Failed to fetch followups');
    return res.json();
  },

  async addFollowup(leadId, followupData) {
    const res = await fetch(`${API_BASE}/leads/${leadId}/followups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(followupData),
    });
    if (!res.ok) throw new Error('Failed to schedule followup');
    return res.json();
  },

  // Notes
  async getNotes(leadId) {
    const res = await fetch(`${API_BASE}/leads/${leadId}/notes`);
    if (!res.ok) throw new Error('Failed to fetch notes');
    return res.json();
  },

  async addNote(leadId, noteData) {
    const res = await fetch(`${API_BASE}/leads/${leadId}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(noteData),
    });
    if (!res.ok) throw new Error('Failed to add note');
    return res.json();
  },

  async updateNote(noteId, noteData) {
    const res = await fetch(`${API_BASE}/notes/${noteId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(noteData),
    });
    if (!res.ok) throw new Error('Failed to update note');
    return res.json();
  },

  async deleteNote(noteId) {
    const res = await fetch(`${API_BASE}/notes/${noteId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete note');
    return res.json();
  },

  // Tasks
  async getTasks(filters = {}) {
    const params = new URLSearchParams();
    if (filters.leadId) params.append('leadId', filters.leadId);
    if (filters.status) params.append('status', filters.status);
    const res = await fetch(`${API_BASE}/tasks?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch tasks');
    return res.json();
  },

  async addTask(taskData) {
    const res = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData),
    });
    if (!res.ok) throw new Error('Failed to create task');
    return res.json();
  },

  async updateTask(taskId, taskData) {
    const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData),
    });
    if (!res.ok) throw new Error('Failed to update task');
    return res.json();
  },

  // Customers
  async getCustomers() {
    const res = await fetch(`${API_BASE}/customers`);
    if (!res.ok) throw new Error('Failed to fetch customers');
    return res.json();
  },

  // Courses
  async getCourses() {
    const res = await fetch(`${API_BASE}/courses`);
    if (!res.ok) throw new Error('Failed to fetch courses');
    return res.json();
  },

  async addCourse(courseData) {
    const res = await fetch(`${API_BASE}/courses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(courseData),
    });
    if (!res.ok) throw new Error('Failed to add course');
    return res.json();
  },

  async updateCourse(id, courseData) {
    const res = await fetch(`${API_BASE}/courses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(courseData),
    });
    if (!res.ok) throw new Error('Failed to update course');
    return res.json();
  },

  async deleteCourse(id) {
    const res = await fetch(`${API_BASE}/courses/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete course');
    return res.json();
  },

  // Lead Sources
  async getLeadSources() {
    const res = await fetch(`${API_BASE}/lead-sources`);
    if (!res.ok) throw new Error('Failed to fetch lead sources');
    return res.json();
  },

  async addLeadSource(sourceData) {
    const res = await fetch(`${API_BASE}/lead-sources`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sourceData),
    });
    if (!res.ok) throw new Error('Failed to add lead source');
    return res.json();
  },

  async updateLeadSource(id, sourceData) {
    const res = await fetch(`${API_BASE}/lead-sources/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sourceData),
    });
    if (!res.ok) throw new Error('Failed to update lead source');
    return res.json();
  },

  async deleteLeadSource(id) {
    const res = await fetch(`${API_BASE}/lead-sources/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete lead source');
    return res.json();
  },

  // Audit Logs & Notifications
  async getAuditLogs() {
    const res = await fetch(`${API_BASE}/audit-logs`);
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    return res.json();
  },

  async getNotifications(userId) {
    const res = await fetch(`${API_BASE}/notifications${userId ? `?userId=${userId}` : ''}`);
    if (!res.ok) throw new Error('Failed to fetch notifications');
    return res.json();
  },

  async markNotificationRead(id) {
    const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'PUT',
    });
    if (!res.ok) throw new Error('Failed to update notification');
    return res.json();
  }
};

