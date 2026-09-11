import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { io } from 'socket.io-client';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { NotificationToast } from './components/NotificationToast';
import { DuplicateModal } from './components/DuplicateModal';
import { ColumnModal, ALL_COLUMNS } from './components/ColumnModal';
import Loader from './components/Loader';

import { Login } from './pages/Login';

const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const AllLeads = lazy(() => import('./pages/AllLeads').then(m => ({ default: m.AllLeads })));
const AddLeadModal = lazy(() => import('./pages/AddLeadModal').then(m => ({ default: m.AddLeadModal })));
const EditLeadModal = lazy(() => import('./pages/EditLeadModal').then(m => ({ default: m.EditLeadModal })));
const LeadWorkspace = lazy(() => import('./pages/LeadWorkspace').then(m => ({ default: m.LeadWorkspace })));
const ModuleView = lazy(() => import('./pages/ModuleView').then(m => ({ default: m.ModuleView })));

import { api } from './api/client';

export default function App() {
  // Session Persistence on Reload (User stays logged in until explicit Logout button click)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('aeero_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [currentRoute, setCurrentRoute] = useState(() => {
    try {
      const savedUser = localStorage.getItem('aeero_user');
      const savedRoute = localStorage.getItem('aeero_route');
      return savedUser ? (savedRoute && savedRoute !== 'login' ? savedRoute : 'dashboard') : 'login';
    } catch (e) {
      return 'login';
    }
  });

  // Dark / Light Mode state
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('AEERO_theme') === 'dark';
  });

  const toggleDarkMode = () => {
    setDarkMode(prev => {
      const next = !prev;
      localStorage.setItem('AEERO_theme', next ? 'dark' : 'light');
      return next;
    });
  };

  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [toast, setToast] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Modals
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [duplicateData, setDuplicateData] = useState(null);
  const [pendingLeadData, setPendingLeadData] = useState(null);
  const [showColumnModal, setShowColumnModal] = useState(false);

  // Visible Table Columns State
  const [visibleColumns, setVisibleColumns] = useState(
    ALL_COLUMNS.filter(c => c.default).map(c => c.id)
  );

  // Total Leads Counter for Sidebar Badge
  const [totalLeadsCount, setTotalLeadsCount] = useState(0);

  const currentRouteRef = useRef(currentRoute);
  useEffect(() => {
    currentRouteRef.current = currentRoute;
  }, [currentRoute]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('aeero_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('aeero_user');
      localStorage.removeItem('aeero_route');
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentRoute && currentRoute !== 'login') {
      localStorage.setItem('aeero_route', currentRoute);
    }
  }, [currentRoute]);

  useEffect(() => {
    if (currentUser) {
      loadLeadCount();
    }
  }, [currentRoute, currentUser, refreshKey]);

  const loadLeadCount = async () => {
    try {
      const data = await api.getLeadsCount();
      setTotalLeadsCount(data.totalLeads || 0);
    } catch (e) { }
  };

  // Live updates: keep the sidebar badge and Dashboard in sync when leads
  // arrive from Google Sheets / Meta webhooks, without touching pages
  // (like AllLeads or LeadWorkspace) that already handle 'newLead' themselves.
  useEffect(() => {
    if (!currentUser) return;

    const socket = io();
    let debounceTimer = null;

    socket.on('newLead', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        loadLeadCount();
        if (currentRouteRef.current === 'dashboard') {
          setRefreshKey(prev => prev + 1);
        }
      }, 800);
    });

    return () => {
      clearTimeout(debounceTimer);
      socket.disconnect();
    };
  }, [currentUser]);

  const handleRefreshData = async () => {
    try {
      await loadLeadCount();
      setRefreshKey(prev => prev + 1);
      showToast('Page data refreshed successfully!');
    } catch (e) {
      showToast('Failed to refresh data', 'error');
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Nav Handlers
  const handleSelectLead = (id) => {
    setSelectedLeadId(id);
    setCurrentRoute('lead-details');
  };

  const handleEditLead = (lead) => {
    setEditingLead(lead);
  };

  const handleLeadCreated = (createdLead) => {
    setShowAddLeadModal(false);
    showToast(`Lead created successfully! Lead ID: ${createdLead.leadId}`);
    loadLeadCount();
    handleSelectLead(createdLead.leadId);
  };

  const handleDuplicateDetected = (existingLead, draftFormData) => {
    setDuplicateData({ existingLead });
    setPendingLeadData(draftFormData);
  };

  const handleCreateAnyway = async () => {
    if (!pendingLeadData) return;
    try {
      const created = await api.createLead({ ...pendingLeadData, allowDuplicate: true });
      setDuplicateData(null);
      setPendingLeadData(null);
      setShowAddLeadModal(false);
      showToast(`Lead created anyway. Lead ID: ${created.leadId}`);
      loadLeadCount();
      handleSelectLead(created.leadId);
    } catch (err) {
      alert("Failed to force create lead: " + err.message);
    }
  };

  const handleLeadUpdated = (updatedLead) => {
    setEditingLead(null);
    showToast(`Lead updated successfully!`);
    loadLeadCount();
    if (currentRoute === 'lead-details' && selectedLeadId) {
      setSelectedLeadId(updatedLead.leadId);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('aeero_user');
    localStorage.removeItem('aeero_route');
    setCurrentRoute('login');
    showToast('Signed out successfully.');
  };

  // REQUIREMENT: Show Login Page FIRST until authenticated
  if (!currentUser || currentRoute === 'login') {
    return (
      <Login
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setCurrentRoute('dashboard');
          showToast(`Welcome back, ${user.name}!`);
        }}
      />
    );
  }

  return (
    <div className={`min-h-screen font-sans flex flex-col transition-colors duration-200 ${darkMode ? 'bg-[#0A0D14] text-slate-100 dark' : 'bg-[#F1F8FC] text-slate-800'
      }`}>

      {/* Top Fixed Header */}
      <Header
        onOpenAddLead={() => setShowAddLeadModal(true)}
        onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        globalSearch={globalSearch}
        setGlobalSearch={(val) => {
          setGlobalSearch(val);
          if (val && currentRoute !== 'leads') {
            setCurrentRoute('leads');
          }
        }}
        currentUser={currentUser}
        currentRoute={currentRoute}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
        onRefreshData={handleRefreshData}
      />

      {/* Left Fixed Sidebar matching exact AEERO screenshot design */}
      <Sidebar
        currentRoute={currentRoute}
        setCurrentRoute={(route) => {
          if (route === 'add-lead-modal') {
            setShowAddLeadModal(true);
          } else {
            setCurrentRoute(route);
          }
        }}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
        onLogout={handleLogout}
        leadCount={totalLeadsCount}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
        currentUser={currentUser}
      />

      {/* Main Content Area */}
      <main className={`flex-1 ml-0 md:ml-[220px] mt-[60px] p-4 md:p-6 custom-scrollbar overflow-y-auto transition-colors ${darkMode ? 'bg-[#0A0D14]' : 'bg-[#F1F8FC]'
        }`}>
        <Suspense fallback={<div className="h-[60vh] flex items-center justify-center"><Loader text="Loading..." /></div>}>
        <div className="max-w-7xl mx-auto">
          {currentRoute === 'dashboard' && (
            <Dashboard
              key={`dash-${refreshKey}`}
              onNavigate={(route, params) => {
                if (params && params.status) {
                  setCurrentRoute('leads');
                } else {
                  setCurrentRoute(route);
                }
              }}
              onOpenAddLead={() => setShowAddLeadModal(true)}
              currentUser={currentUser}
              darkMode={darkMode}
            />
          )}

          {currentRoute === 'leads' && (
            <AllLeads
              key={`leads-${refreshKey}`}
              onSelectLead={handleSelectLead}
              onEditLead={handleEditLead}
              onOpenAddLead={() => setShowAddLeadModal(true)}
              onOpenColumnModal={() => setShowColumnModal(true)}
              onNavigateToCustomers={() => setCurrentRoute('customers')}
              currentUser={currentUser}
              visibleColumns={visibleColumns}
              initialFilters={{ search: globalSearch }}
              darkMode={darkMode}
            />
          )}

          {currentRoute === 'lead-details' && (
            <LeadWorkspace
              key={`workspace-${selectedLeadId}-${refreshKey}`}
              leadId={selectedLeadId}
              onBack={() => setCurrentRoute('leads')}
              onEditLead={handleEditLead}
              currentUser={currentUser}
              onNotify={(msg) => showToast(msg)}
              darkMode={darkMode}
            />
          )}

          {currentRoute !== 'dashboard' && currentRoute !== 'leads' && currentRoute !== 'lead-details' && (
            <ModuleView
              key={`module-${currentRoute}-${refreshKey}`}
              routeId={currentRoute}
              onNavigateToLeads={() => setCurrentRoute('leads')}
              onSelectLead={handleSelectLead}
              currentUser={currentUser}
              onNotify={(msg) => showToast(msg)}
              darkMode={darkMode}
            />
          )}
        </div>
        </Suspense>
      </main>


      {/* MODALS */}
      <Suspense fallback={null}>
      {showAddLeadModal && (
        <AddLeadModal
          onClose={() => setShowAddLeadModal(false)}
          onLeadCreated={handleLeadCreated}
          onDuplicateDetected={handleDuplicateDetected}
          currentUser={currentUser}
          darkMode={darkMode}
        />
      )}

      {editingLead && (
        <EditLeadModal
          lead={editingLead}
          onClose={() => setEditingLead(null)}
          onLeadUpdated={handleLeadUpdated}
          darkMode={darkMode}
        />
      )}
      </Suspense>

      {duplicateData && (
        <DuplicateModal
          duplicateData={duplicateData}
          onViewExisting={(existingLeadId) => {
            setDuplicateData(null);
            setShowAddLeadModal(false);
            handleSelectLead(existingLeadId);
          }}
          onCreateAnyway={handleCreateAnyway}
          onClose={() => setDuplicateData(null)}
          darkMode={darkMode}
        />
      )}

      {showColumnModal && (
        <ColumnModal
          visibleColumns={visibleColumns}
          setVisibleColumns={setVisibleColumns}
          onClose={() => setShowColumnModal(false)}
          darkMode={darkMode}
        />
      )}

      {/* Toast Alerts */}
      {toast && (
        <NotificationToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          darkMode={darkMode}
        />
      )}

    </div>
  );
}
