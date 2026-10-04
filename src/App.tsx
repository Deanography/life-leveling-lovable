import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Boot } from "@/components/Boot";
import { EventOverlay } from "@/components/EventOverlay";
import { Tour } from "@/components/Tour";
import { ThemeApplier } from "@/components/ThemeApplier";
import Status from "@/pages/Status";
import Daily from "@/pages/Daily";
import Gates from "@/pages/Gates";
import Gate from "@/pages/Gate";
import Quests from "@/pages/Quests";
import Bosses from "@/pages/Bosses";
import Army from "@/pages/Army";
import History from "@/pages/History";
import Hunter from "@/pages/Hunter";
import Codex from "@/pages/Codex";
import More from "@/pages/More";
import Onboarding from "@/pages/Onboarding";
import Settings from "@/pages/Settings";

export default function App() {
  return (
    <BrowserRouter>
      <Boot />
      <main className="mx-auto min-h-dvh w-full max-w-md px-4 pb-24 pt-[max(1rem,env(safe-area-inset-top))]">
        <Routes>
          <Route path="/" element={<Status />} />
          <Route path="/daily" element={<Daily />} />
          <Route path="/gates" element={<Gates />} />
          <Route path="/gate" element={<Gate />} />
          <Route path="/quests" element={<Quests />} />
          <Route path="/bosses" element={<Bosses />} />
          <Route path="/army" element={<Army />} />
          <Route path="/history" element={<History />} />
          <Route path="/hunter" element={<Hunter />} />
          <Route path="/codex" element={<Codex />} />
          <Route path="/more" element={<More />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <EventOverlay />
      <Tour />
      <ThemeApplier />
    </BrowserRouter>
  );
}
