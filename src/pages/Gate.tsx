import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "@/store/game";
import { GateView } from "@/components/GateView";

/** Static route: shows the one open gate. Ended gates are summarised on /gates. */
export default function GatePage() {
  const gate = useGame((s) => s.gates.find((g) => !g.endedAt));
  const hydrated = useGame((s) => s.hydrated);
  const navigate = useNavigate();
  useEffect(() => {
    if (hydrated && !gate) navigate("/gates", { replace: true });
  }, [hydrated, gate, navigate]);
  if (!gate) return null;
  return <GateView gate={gate} />;
}
