import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import EventDrawer from "./components/EventDrawer";
import IncidentTimelineModal from "./components/IncidentTimelineModal";
import AICopilotDrawer from "./components/AICopilotDrawer";
import NotificationToast from "./components/NotificationToast";
import DemoCompleteModal from "./components/DemoCompleteModal";

import Dashboard from "./pages/Dashboard";
import AttackSimulatorPage from "./pages/AttackSimulatorPage";
import VulnerableAppPage from "./pages/VulnerableAppPage";
import InvestigationWorkspacePage from "./pages/InvestigationWorkspacePage";
import TelemetryConsolePage from "./pages/TelemetryConsolePage";
import AttackIntelligencePage from "./pages/AttackIntelligencePage";
import StressTestPage from "./pages/StressTestPage";
import SystemStatusPage from "./pages/SystemStatusPage";
import ArchitecturePage from "./pages/ArchitecturePage";
import JudgeRequirementsPage from "./pages/JudgeRequirementsPage";

// Legacy fallback pages (maintained for deep-linking)
import LiveEvents from "./pages/LiveEvents";
import AlertsPage from "./pages/AlertsPage";
import IncidentsPage from "./pages/IncidentsPage";
import AttackTimelinePage from "./pages/AttackTimelinePage";
import AttackSurfacePage from "./pages/AttackSurfacePage";
import AISecurityAnalystPage from "./pages/AISecurityAnalystPage";

import { socketService } from "./services/socket";
import { 
  fetchContainmentStatus, 
  fetchIncidents, 
  fetchIncidentDetails,
  fetchStatistics 
} from "./services/api";

export default function App() {
  const [activeTab, setActiveTab] = useState("command_center");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedIncidentData, setSelectedIncidentData] = useState(null);
  const [isAICopilotOpen, setIsAICopilotOpen] = useState(false);
  const [isDemoCompleteOpen, setIsDemoCompleteOpen] = useState(false);
  const [demoCompleteIncidentId, setDemoCompleteIncidentId] = useState("INC-001");
  const [activeContainmentsCount, setActiveContainmentsCount] = useState(0);
  const [activeIncidentsCount, setActiveIncidentsCount] = useState(0);
  const [criticalAlertsCount, setCriticalAlertsCount] = useState(0);
  const [globalSearch, setGlobalSearch] = useState("");
  const [aiTargetIncidentId, setAiTargetIncidentId] = useState(null);
  const [notifications, setNotifications] = useState([]);

  const refreshCounts = async () => {
    try {
      const stats = await fetchStatistics();
      if (stats && stats.metrics) {
        setActiveIncidentsCount(stats.metrics.active_incidents || 0);
        setCriticalAlertsCount(stats.metrics.critical_alerts || 0);
        setActiveContainmentsCount(stats.metrics.contained_threats || 0);
      }

      const contain = await fetchContainmentStatus();
      if (contain && contain.active_blocks) {
        setActiveContainmentsCount(contain.active_blocks.length);
      }

      const incs = await fetchIncidents(50);
      if (incs && incs.incidents) {
        const active = incs.incidents.filter(i => i.status === "OPEN" || i.status === "INVESTIGATING").length;
        setActiveIncidentsCount(active);
        if (incs.incidents[0]) {
          setDemoCompleteIncidentId(incs.incidents[0].incident_id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const addNotification = (notif) => {
    const id = Date.now() + Math.random();
    setNotifications((prev) => [{ ...notif, id }, ...prev.slice(0, 4)]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter(n => n.id !== id));
    }, 6000);
  };

  useEffect(() => {
    socketService.connect();
    refreshCounts();

    const unsubContained = socketService.on("threat_contained", (action) => {
      refreshCounts();
      addNotification({
        type: "containment",
        title: "THREAT CONTAINED",
        idTag: action.source_ip,
        message: `Firewall isolated source IP ${action.source_ip}. Subsequent traffic dropped with HTTP 403.`,
        actionLabel: "View Containment"
      });
    });

    const unsubUnblocked = socketService.on("threat_unblocked", () => refreshCounts());
    const unsubInc = socketService.on("incident_updated", (inc) => {
      refreshCounts();
      if (inc && inc.incident_id) {
        setDemoCompleteIncidentId(inc.incident_id);
      }
    });

    const unsubAlert = socketService.on("new_alert", (alert) => {
      refreshCounts();
      if (alert.severity === "CRITICAL" || alert.severity === "HIGH") {
        addNotification({
          type: "alert",
          severity: alert.severity,
          title: `INCOMING ${alert.severity} ALERT`,
          idTag: alert.attack_type,
          message: `${alert.detection_rule || 'Signature matched'}: Source ${alert.source_ip}`,
          actionLabel: "Investigate Incident"
        });
      }
    });

    const unsubStats = socketService.on("stats_updated", (newStats) => {
      if (newStats) {
        if (newStats.active_incidents !== undefined) setActiveIncidentsCount(newStats.active_incidents);
        if (newStats.critical_alerts !== undefined) setCriticalAlertsCount(newStats.critical_alerts);
        if (newStats.contained_threats !== undefined) setActiveContainmentsCount(newStats.contained_threats);
      }
    });

    return () => {
      unsubContained();
      unsubUnblocked();
      unsubInc();
      unsubAlert();
      unsubStats();
    };
  }, []);

  const handleSelectIncident = async (incidentId) => {
    try {
      const res = await fetchIncidentDetails(incidentId);
      if (res && res.incident) {
        setSelectedIncidentData(res.incident);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLaunchAiWithIncident = (incidentId) => {
    setAiTargetIncidentId(incidentId);
    setActiveTab("investigation");
  };

  const handleNotificationAction = (notif) => {
    setActiveTab("investigation");
  };

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* Top Command Navigation Bar */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        activeContainmentsCount={activeContainmentsCount}
        criticalAlertsCount={criticalAlertsCount}
        activeIncidentsCount={activeIncidentsCount}
        onReset={refreshCounts}
        globalSearch={globalSearch}
        setGlobalSearch={setGlobalSearch}
        onOpenAICopilot={() => setIsAICopilotOpen(true)}
        onOpenDemoComplete={() => setIsDemoCompleteOpen(true)}
      />

      {/* Main Full-Width Command Stage (No side navigation) */}
      <main className="flex-1 overflow-y-auto p-3.5 sm:p-5 md:p-6 bg-[#03060d]/60">
        <div className="max-w-[1680px] mx-auto">
          {/* Console 1: COMMAND CENTER */}
          {(activeTab === "command_center" || activeTab === "dashboard") && (
            <Dashboard 
              onSelectEvent={(evt) => setSelectedEvent(evt)} 
              onSelectIncident={handleSelectIncident}
              setActiveTab={setActiveTab}
              onLaunchAiWithIncident={handleLaunchAiWithIncident}
            />
          )}

          {/* Console 2: ATTACK LAB */}
          {activeTab === "simulator" && (
            <AttackSimulatorPage 
              setActiveTab={setActiveTab} 
              onLaunchAiWithIncident={handleLaunchAiWithIncident}
            />
          )}

          {/* Console 3: TRAINING TARGET */}
          {activeTab === "vulnerable_app" && (
            <VulnerableAppPage />
          )}

          {/* Console 4: INVESTIGATION FORENSICS WORKSPACE */}
          {activeTab === "investigation" && (
            <InvestigationWorkspacePage
              preselectedIncidentId={aiTargetIncidentId}
              onSelectEvent={(evt) => setSelectedEvent(evt)}
              onOpenAICopilot={() => setIsAICopilotOpen(true)}
            />
          )}

          {/* Console 5: TELEMETRY OBSERVABILITY TERMINAL */}
          {(activeTab === "telemetry" || activeTab === "live_events" || activeTab === "live_threats") && (
            <TelemetryConsolePage 
              onSelectEvent={(evt) => setSelectedEvent(evt)} 
              globalSearch={globalSearch}
            />
          )}

          {/* Console 6: ATTACK INTELLIGENCE & HEURISTICS MATRIX */}
          {activeTab === "intelligence" && (
            <AttackIntelligencePage />
          )}

          {/* Console 7: PERFORMANCE & STRESS TEST */}
          {(activeTab === "performance" || activeTab === "stress_test" || activeTab === "analytics") && (
            <StressTestPage />
          )}

          {/* Console 8: SYSTEM DIAGNOSTICS & HEALTH */}
          {(activeTab === "system" || activeTab === "system_status") && (
            <SystemStatusPage />
          )}

          {/* Console 9: ARCHITECTURE SPECIFICATION */}
          {activeTab === "architecture" && (
            <ArchitecturePage />
          )}

          {/* Supplementary / Legacy Views */}
          {activeTab === "requirements" && (
            <JudgeRequirementsPage setActiveTab={setActiveTab} />
          )}

          {activeTab === "alerts" && (
            <AlertsPage 
              onLaunchAiWithIncident={handleLaunchAiWithIncident}
              onSelectEvent={(evt) => setSelectedEvent(evt)}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === "incidents" && (
            <IncidentsPage 
              onSelectIncident={handleSelectIncident}
              onLaunchAiWithIncident={handleLaunchAiWithIncident}
            />
          )}

          {activeTab === "timeline" && (
            <AttackTimelinePage 
              onSelectEvent={(evt) => setSelectedEvent(evt)}
              onLaunchAiWithIncident={handleLaunchAiWithIncident}
              preselectedIncidentId={aiTargetIncidentId}
            />
          )}

          {activeTab === "attack_surface" && (
            <AttackSurfacePage />
          )}

          {activeTab === "ai_analyst" && (
            <AISecurityAnalystPage 
              initialIncidentId={aiTargetIncidentId}
            />
          )}
        </div>
      </main>

      {/* Real-time Contextual Alert & Containment Toasts */}
      <NotificationToast 
        notifications={notifications}
        onDismiss={(id) => setNotifications(prev => prev.filter(n => n.id !== id))}
        onAction={handleNotificationAction}
      />

      {/* 15-Second Guided Demo Complete Modal */}
      <DemoCompleteModal
        isOpen={isDemoCompleteOpen}
        onClose={() => setIsDemoCompleteOpen(false)}
        incidentId={demoCompleteIncidentId}
        onReset={refreshCounts}
      />

      {/* Structured Raw Event Details Drawer */}
      {selectedEvent && (
        <EventDrawer 
          event={selectedEvent} 
          onClose={() => setSelectedEvent(null)} 
        />
      )}

      {/* Incident Dossier Deep Inspection Modal */}
      {selectedIncidentData && (
        <IncidentTimelineModal
          incident={selectedIncidentData}
          onClose={() => setSelectedIncidentData(null)}
          onSelectEvent={(evt) => setSelectedEvent(evt)}
          onLaunchAiWithIncident={handleLaunchAiWithIncident}
        />
      )}

      {/* Global AI Copilot Slide-over Assistant Drawer */}
      <AICopilotDrawer
        isOpen={isAICopilotOpen}
        onClose={() => setIsAICopilotOpen(false)}
        targetIncidentId={aiTargetIncidentId}
        onSelectIncident={handleSelectIncident}
      />
    </div>
  );
}
