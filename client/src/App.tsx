import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext.js';
import { LiveProvider } from './context/LiveContext.js';
import { Navbar } from './components/Navbar.js';
import { Sidebar } from './components/Sidebar.js';
import { AlertBanner } from './components/AlertBanner.js';
import { ChaosModal } from './components/ChaosModal.js';

import { Dashboard } from './pages/Dashboard.js';
import { ServicesMonitor } from './pages/ServicesMonitor.js';
import { IncidentWarRoom } from './pages/IncidentWarRoom.js';
import { SprintKanban } from './pages/SprintKanban.js';
import { SupportDesk } from './pages/SupportDesk.js';
import { Analytics } from './pages/Analytics.js';
import { DevOpsPlatform } from './pages/DevOpsPlatform.js';

const MainLayout: React.FC = () => {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [isChaosOpen, setIsChaosOpen] = useState(false);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | undefined>();

  const handleNavigateToIncidents = (incidentId?: string) => {
    setSelectedIncidentId(incidentId);
    setCurrentTab('incidents');
  };

  return (
    <div className="min-h-screen flex flex-col bg-dark-950 text-slate-100">
      {/* Real-time Alert Banner */}
      <AlertBanner onGoToIncidents={() => handleNavigateToIncidents()} />

      {/* Main Top Navigation */}
      <Navbar onOpenChaos={() => setIsChaosOpen(true)} />

      {/* Body Layout: Sidebar + Main Content */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          openIncidentsCount={1}
        />

        <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-gradient-to-b from-dark-950 via-dark-900 to-dark-950">
          {currentTab === 'dashboard' && (
            <Dashboard
              onNavigateToIncidents={handleNavigateToIncidents}
              onNavigateToServices={() => setCurrentTab('services')}
            />
          )}
          {currentTab === 'services' && <ServicesMonitor />}
          {currentTab === 'incidents' && (
            <IncidentWarRoom initialIncidentId={selectedIncidentId} />
          )}
          {currentTab === 'tasks' && <SprintKanban />}
          {currentTab === 'support' && <SupportDesk />}
          {currentTab === 'analytics' && <Analytics />}
          {currentTab === 'devops' && <DevOpsPlatform />}
        </main>
      </div>

      {/* Interactive Chaos Simulator Modal */}
      <ChaosModal isOpen={isChaosOpen} onClose={() => setIsChaosOpen(false)} />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <LiveProvider>
        <MainLayout />
      </LiveProvider>
    </AuthProvider>
  );
};

export default App;
