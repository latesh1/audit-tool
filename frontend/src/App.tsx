import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { OverviewPage } from "./pages/OverviewPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { NewAuditPage } from "./pages/NewAuditPage";
import { AuditHistoryPage } from "./pages/AuditHistoryPage";
import { AuditResultPage } from "./pages/AuditResultPage";
import { SerpStudioPage } from "./pages/SerpStudioPage";
import { SettingsPage } from "./pages/SettingsPage";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<OverviewPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/new-audit" element={<NewAuditPage />} />
          <Route path="/history" element={<AuditHistoryPage />} />
          <Route path="/serp-studio" element={<SerpStudioPage />} />
          <Route path="/audits/:id" element={<AuditResultPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
