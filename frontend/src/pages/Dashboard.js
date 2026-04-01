import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { useAuth, API } from "../App";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Progress } from "../components/ui/progress";
import { ScrollArea } from "../components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import {
  Cube,
  Plus,
  Trash,
  Play,
  SignOut,
  User,
  Lightning,
  ShieldCheck,
  ChartBar,
  Clock,
  Hash,
  Cpu,
  WifiHigh,
  Camera,
  Timer,
  Database,
  ArrowClockwise,
  Gear,
  CaretDown,
} from "@phosphor-icons/react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

const Dashboard = () => {
  const { user, loading: authLoading, login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // State
  const [sessionId, setSessionId] = useState(null);
  const [validators, setValidators] = useState([]);
  const [selectedValidator, setSelectedValidator] = useState(null);
  const [selectionHistory, setSelectionHistory] = useState([]);
  const [fairnessReport, setFairnessReport] = useState(null);
  const [entropyStatus, setEntropyStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSelecting, setIsSelecting] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationProgress, setSimulationProgress] = useState(0);
  const [simulationResults, setSimulationResults] = useState([]);
  const [newValidatorName, setNewValidatorName] = useState("");
  const [newValidatorWeight, setNewValidatorWeight] = useState(1.0);
  const [addValidatorOpen, setAddValidatorOpen] = useState(false);

  // Chart colors
  const CHART_COLORS = ["#00F0FF", "#00FF41", "#FF3B30", "#A1A1AA", "#52525B"];

  // Initialize session
  const initSession = useCallback(async () => {
    try {
      const response = await axios.post(
        `${API}/session/create`,
        {},
        { withCredentials: true }
      );
      setSessionId(response.data.session_id);
      return response.data.session_id;
    } catch (error) {
      console.error("Failed to create session:", error);
      toast.error("Failed to initialize session");
      return null;
    }
  }, []);

  // Fetch all data
  const fetchData = useCallback(async (sid) => {
    if (!sid) return;

    try {
      const [validatorsRes, historyRes, fairnessRes, entropyRes] = await Promise.all([
        axios.get(`${API}/validators?session_id=${sid}`),
        axios.get(`${API}/selection-history?session_id=${sid}&limit=100`),
        axios.get(`${API}/fairness-report?session_id=${sid}`),
        axios.get(`${API}/entropy-status`),
      ]);

      setValidators(validatorsRes.data);
      setSelectionHistory(historyRes.data.selections);
      setFairnessReport(fairnessRes.data);
      setEntropyStatus(entropyRes.data);

      // Set latest selected validator
      if (historyRes.data.selections.length > 0) {
        const latest = historyRes.data.selections[0];
        setSelectedValidator(latest);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    const init = async () => {
      // Use user from location state if available (from OAuth callback)
      const stateUser = location.state?.user;
      
      const sid = await initSession();
      if (sid) {
        await fetchData(sid);
      }
    };
    init();
  }, [initSession, fetchData, location.state]);

  // Periodic entropy status update
  useEffect(() => {
    if (!sessionId) return;
    
    const interval = setInterval(async () => {
      try {
        const response = await axios.get(`${API}/entropy-status`);
        setEntropyStatus(response.data);
      } catch (error) {
        console.error("Failed to fetch entropy status:", error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [sessionId]);

  // Select validator
  const handleSelectValidator = async () => {
    if (!sessionId || isSelecting) return;
    setIsSelecting(true);

    try {
      const response = await axios.post(
        `${API}/select-validator?session_id=${sessionId}`
      );
      setSelectedValidator(response.data);
      toast.success(`Selected: ${response.data.validator_name}`);
      await fetchData(sessionId);
    } catch (error) {
      toast.error("Selection failed");
    } finally {
      setIsSelecting(false);
    }
  };

  // Run 1000-round simulation
  const handleSimulation = async () => {
    if (!sessionId || isSimulating) return;
    setIsSimulating(true);
    setSimulationProgress(0);
    setSimulationResults([]);

    try {
      // Run in batches
      const batchSize = 100;
      const totalRounds = 1000;
      let allResults = [];

      for (let i = 0; i < totalRounds; i += batchSize) {
        const response = await axios.post(
          `${API}/simulate-rounds?session_id=${sessionId}&rounds=${batchSize}`
        );
        allResults = [...allResults, ...response.data.results];
        setSimulationProgress(Math.min(100, ((i + batchSize) / totalRounds) * 100));
        setSimulationResults([...allResults]);

        // Small delay for visual effect
        await new Promise((r) => setTimeout(r, 200));
      }

      toast.success("Simulation complete! 1000 rounds executed.");
      await fetchData(sessionId);
    } catch (error) {
      toast.error("Simulation failed");
    } finally {
      setIsSimulating(false);
    }
  };

  // Add validator
  const handleAddValidator = async () => {
    if (!sessionId || !newValidatorName.trim()) return;

    try {
      await axios.post(
        `${API}/validators/add?session_id=${sessionId}`,
        {
          validator_name: newValidatorName,
          weight: newValidatorWeight,
        }
      );
      toast.success("Validator added");
      setNewValidatorName("");
      setNewValidatorWeight(1.0);
      setAddValidatorOpen(false);
      await fetchData(sessionId);
    } catch (error) {
      toast.error("Failed to add validator");
    }
  };

  // Remove validator
  const handleRemoveValidator = async (validatorId) => {
    if (!sessionId) return;

    try {
      await axios.delete(
        `${API}/validators/remove/${validatorId}?session_id=${sessionId}`
      );
      toast.success("Validator removed");
      await fetchData(sessionId);
    } catch (error) {
      toast.error("Failed to remove validator");
    }
  };

  // Toggle validator status
  const handleToggleStatus = async (validator) => {
    if (!sessionId) return;
    const newStatus = validator.status === "active" ? "inactive" : "active";

    try {
      await axios.patch(
        `${API}/validators/${validator.validator_id}?session_id=${sessionId}`,
        { status: newStatus }
      );
      await fetchData(sessionId);
    } catch (error) {
      toast.error("Failed to update validator");
    }
  };

  // Clear history
  const handleClearHistory = async () => {
    if (!sessionId) return;

    try {
      await axios.delete(`${API}/session/${sessionId}/clear-history`);
      toast.success("History cleared");
      setSelectedValidator(null);
      setSimulationResults([]);
      await fetchData(sessionId);
    } catch (error) {
      toast.error("Failed to clear history");
    }
  };

  // Prepare chart data
  const getBarChartData = () => {
    if (!fairnessReport?.validators) return [];
    return fairnessReport.validators.map((v) => ({
      name: v.validator_name.replace("Validator-", ""),
      count: v.selection_count,
      percentage: v.percentage,
    }));
  };

  const getPieChartData = () => {
    if (!fairnessReport?.validators) return [];
    return fairnessReport.validators
      .filter((v) => v.selection_count > 0)
      .map((v) => ({
        name: v.validator_name,
        value: v.selection_count,
      }));
  };

  const getLineChartData = () => {
    if (simulationResults.length === 0) return [];
    // Sample every 50th result for performance
    return simulationResults
      .filter((_, i) => i % 50 === 0)
      .map((r, i) => ({
        round: r.round_id,
        confidence: r.confidence,
      }));
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-[#00F0FF] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#A1A1AA] font-mono text-sm">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#050505]/80 backdrop-blur-xl border-b border-[#1E2028]">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Cube size={28} weight="duotone" className="text-[#00F0FF]" />
              <span className="font-heading text-lg font-semibold tracking-tight text-white">
                EntropyX
              </span>
              <span className="badge-info font-mono text-xs px-2 py-0.5 ml-2">
                DASHBOARD
              </span>
            </div>

            <div className="flex items-center gap-4">
              {/* Session indicator */}
              <div className="hidden sm:flex items-center gap-2 text-xs text-[#52525B] font-mono">
                <Database size={14} />
                <span className="truncate max-w-[100px]">{sessionId?.slice(0, 12)}...</span>
              </div>

              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      data-testid="user-menu-btn"
                      className="flex items-center gap-2 text-[#A1A1AA] hover:text-white hover:bg-[#1A1C23]"
                    >
                      {user.picture ? (
                        <img
                          src={user.picture}
                          alt={user.name}
                          className="w-6 h-6 rounded-full"
                        />
                      ) : (
                        <User size={20} />
                      )}
                      <span className="hidden sm:inline text-sm">{user.name}</span>
                      <CaretDown size={14} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="bg-[#0A0B10] border-[#1E2028] text-white"
                  >
                    <DropdownMenuItem
                      onClick={logout}
                      className="cursor-pointer hover:bg-[#1A1C23]"
                      data-testid="logout-btn"
                    >
                      <SignOut size={16} className="mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  onClick={login}
                  data-testid="dashboard-login-btn"
                  className="bg-[#00F0FF] text-black font-semibold px-4 hover:bg-[#00F0FF]/80 rounded-none"
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Button
              onClick={handleSelectValidator}
              disabled={isSelecting || validators.filter((v) => v.status === "active").length === 0}
              data-testid="select-validator-btn"
              className="btn-primary rounded-none flex items-center gap-2"
            >
              {isSelecting ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <Lightning size={18} weight="bold" />
              )}
              Select Validator
            </Button>

            <Button
              onClick={handleSimulation}
              disabled={isSimulating || validators.filter((v) => v.status === "active").length === 0}
              data-testid="run-simulation-btn"
              className="btn-terminal rounded-none flex items-center gap-2"
            >
              {isSimulating ? (
                <div className="w-4 h-4 border-2 border-[#00FF41] border-t-transparent rounded-full animate-spin" />
              ) : (
                <Play size={16} weight="fill" />
              )}
              Run 1000-Round Simulation
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Dialog open={addValidatorOpen} onOpenChange={setAddValidatorOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  data-testid="add-validator-btn"
                  className="bg-transparent border-[#1E2028] text-white hover:bg-[#1A1C23] rounded-none"
                >
                  <Plus size={16} className="mr-2" />
                  Add Validator
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#0A0B10] border-[#1E2028] text-white">
                <DialogHeader>
                  <DialogTitle className="font-heading">Add New Validator</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <label className="text-xs uppercase tracking-widest text-[#A1A1AA] mb-2 block">
                      Validator Name
                    </label>
                    <Input
                      value={newValidatorName}
                      onChange={(e) => setNewValidatorName(e.target.value)}
                      placeholder="Validator-Zeta"
                      data-testid="validator-name-input"
                      className="bg-[#050505] border-[#1E2028] text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-widest text-[#A1A1AA] mb-2 block">
                      Weight
                    </label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="10"
                      value={newValidatorWeight}
                      onChange={(e) => setNewValidatorWeight(parseFloat(e.target.value))}
                      data-testid="validator-weight-input"
                      className="bg-[#050505] border-[#1E2028] text-white"
                    />
                  </div>
                  <Button
                    onClick={handleAddValidator}
                    data-testid="confirm-add-validator-btn"
                    className="w-full btn-primary rounded-none"
                  >
                    Add Validator
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              variant="ghost"
              onClick={handleClearHistory}
              data-testid="clear-history-btn"
              className="text-[#A1A1AA] hover:text-white hover:bg-[#1A1C23]"
            >
              <ArrowClockwise size={16} className="mr-2" />
              Reset
            </Button>
          </div>
        </div>

        {/* Simulation Progress Overlay */}
        {isSimulating && (
          <div className="fixed inset-0 z-50 simulation-overlay flex items-center justify-center scanlines">
            <div className="bg-[#0A0B10] border border-[#00FF41]/50 p-8 max-w-md w-full mx-4 glow-green">
              <div className="text-center mb-6">
                <h3 className="font-mono text-[#00FF41] text-xl mb-2 glow-text-green">
                  SIMULATION IN PROGRESS
                </h3>
                <p className="text-[#A1A1AA] text-sm">
                  Executing 1000 entropy-based selections...
                </p>
              </div>

              <div className="mb-6">
                <Progress value={simulationProgress} className="h-2 bg-[#1E2028]" />
                <div className="flex justify-between mt-2 text-xs font-mono text-[#52525B]">
                  <span>Round {Math.floor(simulationProgress * 10)}</span>
                  <span>{Math.floor(simulationProgress)}%</span>
                </div>
              </div>

              {simulationResults.length > 0 && (
                <div className="bg-[#050505] border border-[#1E2028] p-4 font-mono text-xs">
                  <div className="text-[#00F0FF] mb-2">Latest Selection:</div>
                  <div className="text-white">
                    {simulationResults[simulationResults.length - 1]?.validator_name}
                  </div>
                  <div className="text-[#52525B] truncate">
                    {simulationResults[simulationResults.length - 1]?.entropy_hash}...
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {/* Selected Validator Panel */}
          <div className="col-span-1 md:col-span-2 lg:col-span-1 bg-[#0A0B10] border border-[#1E2028] p-6">
            <h4 className="text-sm uppercase tracking-[0.2em] font-semibold text-[#00F0FF] mb-4">
              Current Selection
            </h4>
            {selectedValidator ? (
              <div className="space-y-4">
                <div className="text-center py-4 bg-[#050505] border border-[#00F0FF]/50 glow-cyan">
                  <div className="font-mono text-2xl text-white mb-1" data-testid="selected-validator-name">
                    {selectedValidator.validator_name}
                  </div>
                  <div className="text-xs text-[#A1A1AA]">
                    Round #{selectedValidator.round_id}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#050505] p-3 border border-[#1E2028]">
                    <div className="text-xs uppercase tracking-widest text-[#A1A1AA] mb-1">
                      Confidence
                    </div>
                    <div className="font-mono text-lg text-[#00FF41]" data-testid="entropy-confidence">
                      {selectedValidator.entropy_confidence}%
                    </div>
                  </div>
                  <div className="bg-[#050505] p-3 border border-[#1E2028]">
                    <div className="text-xs uppercase tracking-widest text-[#A1A1AA] mb-1">
                      Freshness
                    </div>
                    <div className="font-mono text-lg text-[#00F0FF]">
                      {entropyStatus?.freshness?.toFixed(1)}%
                    </div>
                  </div>
                </div>

                <div className="bg-[#050505] p-3 border border-[#1E2028]">
                  <div className="text-xs uppercase tracking-widest text-[#A1A1AA] mb-2">
                    Entropy Hash
                  </div>
                  <div className="font-mono text-xs text-[#52525B] break-all" data-testid="entropy-hash">
                    {selectedValidator.entropy_hash}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-[#52525B]">
                <Lightning size={48} weight="duotone" className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No selection yet</p>
              </div>
            )}
          </div>

          {/* Entropy Engine Status */}
          <div className="col-span-1 bg-[#0A0B10] border border-[#1E2028] p-6">
            <h4 className="text-sm uppercase tracking-[0.2em] font-semibold text-[#00F0FF] mb-4">
              Entropy Engine
            </h4>
            {entropyStatus && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-[#A1A1AA]">
                    <Camera size={16} />
                    <span>Camera Noise</span>
                  </div>
                  <span
                    className={`font-mono text-xs px-2 py-0.5 ${
                      entropyStatus.camera_noise_status === "active"
                        ? "badge-success"
                        : "badge-warning"
                    }`}
                    data-testid="camera-status"
                  >
                    {entropyStatus.camera_noise_status.toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-[#A1A1AA]">
                    <WifiHigh size={16} />
                    <span>Network Jitter</span>
                  </div>
                  <span
                    className={`font-mono text-xs px-2 py-0.5 ${
                      entropyStatus.network_jitter_status === "active"
                        ? "badge-success"
                        : "badge-warning"
                    }`}
                    data-testid="network-status"
                  >
                    {entropyStatus.network_jitter_status.toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-[#A1A1AA]">
                    <Timer size={16} />
                    <span>Timestamp</span>
                  </div>
                  <span className="badge-success font-mono text-xs px-2 py-0.5">
                    {entropyStatus.timestamp_entropy_status.toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-[#A1A1AA]">
                    <Cpu size={16} />
                    <span>System Pool</span>
                  </div>
                  <span className="badge-success font-mono text-xs px-2 py-0.5">
                    {entropyStatus.system_entropy_status.toUpperCase()}
                  </span>
                </div>

                <div className="pt-3 border-t border-[#1E2028]">
                  <div className="text-xs uppercase tracking-widest text-[#A1A1AA] mb-2">
                    Pool Health
                  </div>
                  <div className="flex items-center gap-3">
                    <Progress
                      value={entropyStatus.pool_health}
                      className="h-2 flex-1 bg-[#1E2028]"
                    />
                    <span className="font-mono text-sm text-[#00FF41]" data-testid="pool-health">
                      {entropyStatus.pool_health.toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="text-xs uppercase tracking-widest text-[#A1A1AA] mb-2">
                    Pool Hash
                  </div>
                  <div className="font-mono text-xs text-[#52525B] truncate">
                    {entropyStatus.pool_hash}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Fairness Metrics */}
          <div className="col-span-1 bg-[#0A0B10] border border-[#1E2028] p-6">
            <h4 className="text-sm uppercase tracking-[0.2em] font-semibold text-[#00F0FF] mb-4">
              Fairness Metrics
            </h4>
            {fairnessReport && (
              <div className="space-y-4">
                <div className="text-center py-3 bg-[#050505] border border-[#1E2028]">
                  <div className="text-xs uppercase tracking-widest text-[#A1A1AA] mb-1">
                    Total Rounds
                  </div>
                  <div className="font-mono text-3xl text-white" data-testid="total-rounds">
                    {fairnessReport.total_rounds.toLocaleString()}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#050505] p-3 border border-[#1E2028]">
                    <div className="text-xs uppercase tracking-widest text-[#A1A1AA] mb-1">
                      Fairness
                    </div>
                    <div className="font-mono text-lg text-[#00FF41]" data-testid="fairness-score">
                      {fairnessReport.fairness_percentage.toFixed(1)}%
                    </div>
                  </div>
                  <div className="bg-[#050505] p-3 border border-[#1E2028]">
                    <div className="text-xs uppercase tracking-widest text-[#A1A1AA] mb-1">
                      Decentral.
                    </div>
                    <div className="font-mono text-lg text-[#00F0FF]" data-testid="decentralization-score">
                      {fairnessReport.decentralization_score.toFixed(1)}%
                    </div>
                  </div>
                </div>

                {fairnessReport.most_selected && (
                  <div className="bg-[#050505] p-3 border border-[#1E2028]">
                    <div className="text-xs uppercase tracking-widest text-[#A1A1AA] mb-1">
                      Most Selected
                    </div>
                    <div className="font-mono text-sm text-white">
                      {fairnessReport.most_selected.validator_name}
                    </div>
                    <div className="text-xs text-[#52525B]">
                      {fairnessReport.most_selected.selection_count} times (
                      {fairnessReport.most_selected.percentage.toFixed(1)}%)
                    </div>
                  </div>
                )}

                {fairnessReport.least_selected && (
                  <div className="bg-[#050505] p-3 border border-[#1E2028]">
                    <div className="text-xs uppercase tracking-widest text-[#A1A1AA] mb-1">
                      Least Selected
                    </div>
                    <div className="font-mono text-sm text-white">
                      {fairnessReport.least_selected.validator_name}
                    </div>
                    <div className="text-xs text-[#52525B]">
                      {fairnessReport.least_selected.selection_count} times (
                      {fairnessReport.least_selected.percentage.toFixed(1)}%)
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Validator Network */}
          <div className="col-span-1 row-span-2 bg-[#0A0B10] border border-[#1E2028] p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm uppercase tracking-[0.2em] font-semibold text-[#00F0FF]">
                Validator Network
              </h4>
              <span className="font-mono text-xs text-[#52525B]">
                {validators.filter((v) => v.status === "active").length} active
              </span>
            </div>

            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {validators.map((validator) => (
                  <div
                    key={validator.validator_id}
                    data-testid={`validator-card-${validator.validator_id}`}
                    className={`p-4 border transition-all duration-200 ${
                      selectedValidator?.validator_id === validator.validator_id
                        ? "border-[#00F0FF]/50 bg-[#0A0B10] glow-cyan"
                        : validator.status === "active"
                        ? "border-[#1E2028] bg-[#050505] hover:border-white/20"
                        : "border-[#1E2028]/50 bg-[#050505]/50 opacity-60"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-mono text-sm text-white">
                          {validator.validator_name}
                        </div>
                        <div className="text-xs text-[#52525B]">
                          Weight: {validator.weight}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleStatus(validator)}
                          className={`font-mono text-xs px-2 py-0.5 cursor-pointer transition-colors ${
                            validator.status === "active"
                              ? "badge-success hover:bg-[#00FF41]/20"
                              : "badge-inactive hover:bg-[#1E2028]"
                          }`}
                          data-testid={`toggle-status-${validator.validator_id}`}
                        >
                          {validator.status.toUpperCase()}
                        </button>
                        <button
                          onClick={() => handleRemoveValidator(validator.validator_id)}
                          className="text-[#52525B] hover:text-[#FF3B30] transition-colors"
                          data-testid={`remove-validator-${validator.validator_id}`}
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                    </div>

                    {validator.last_selected_at && (
                      <div className="flex items-center gap-1 text-xs text-[#52525B]">
                        <Clock size={12} />
                        <span>
                          Last: {new Date(validator.last_selected_at).toLocaleTimeString()}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Frequency Bar Chart */}
          <div className="col-span-1 md:col-span-2 bg-[#0A0B10] border border-[#1E2028] p-6">
            <h4 className="text-sm uppercase tracking-[0.2em] font-semibold text-[#00F0FF] mb-4">
              Selection Frequency
            </h4>
            <div className="h-[200px]" data-testid="frequency-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getBarChartData()}>
                  <XAxis
                    dataKey="name"
                    stroke="#52525B"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#52525B"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0A0B10",
                      border: "1px solid #1E2028",
                      borderRadius: 0,
                    }}
                    labelStyle={{ color: "#FFFFFF" }}
                  />
                  <Bar dataKey="count" fill="#00F0FF" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Distribution Pie Chart */}
          <div className="col-span-1 bg-[#0A0B10] border border-[#1E2028] p-6">
            <h4 className="text-sm uppercase tracking-[0.2em] font-semibold text-[#00F0FF] mb-4">
              Distribution
            </h4>
            <div className="h-[200px]" data-testid="distribution-chart">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={getPieChartData()}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {getPieChartData().map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0A0B10",
                      border: "1px solid #1E2028",
                      borderRadius: 0,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Entropy Confidence Line Chart */}
          <div className="col-span-1 md:col-span-2 lg:col-span-3 bg-[#0A0B10] border border-[#1E2028] p-6">
            <h4 className="text-sm uppercase tracking-[0.2em] font-semibold text-[#00F0FF] mb-4">
              Entropy Confidence Over Time
            </h4>
            <div className="h-[200px]" data-testid="confidence-chart">
              {getLineChartData().length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={getLineChartData()}>
                    <XAxis
                      dataKey="round"
                      stroke="#52525B"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      domain={[70, 100]}
                      stroke="#52525B"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0A0B10",
                        border: "1px solid #1E2028",
                        borderRadius: 0,
                      }}
                      labelStyle={{ color: "#FFFFFF" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="confidence"
                      stroke="#00FF41"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-[#52525B] text-sm">
                  Run simulation to see entropy confidence trend
                </div>
              )}
            </div>
          </div>

          {/* Selection History */}
          <div className="col-span-1 md:col-span-3 lg:col-span-4 bg-[#0A0B10] border border-[#1E2028] p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm uppercase tracking-[0.2em] font-semibold text-[#00F0FF]">
                Selection History
              </h4>
              <span className="font-mono text-xs text-[#52525B]">
                {selectionHistory.length} records
              </span>
            </div>

            <ScrollArea className="h-[300px]">
              <table className="w-full" data-testid="history-table">
                <thead>
                  <tr className="border-b border-[#1E2028]">
                    <th className="text-left text-xs uppercase tracking-widest text-[#A1A1AA] py-3 font-medium">
                      Round
                    </th>
                    <th className="text-left text-xs uppercase tracking-widest text-[#A1A1AA] py-3 font-medium">
                      Validator
                    </th>
                    <th className="text-left text-xs uppercase tracking-widest text-[#A1A1AA] py-3 font-medium hidden sm:table-cell">
                      Entropy Hash
                    </th>
                    <th className="text-left text-xs uppercase tracking-widest text-[#A1A1AA] py-3 font-medium">
                      Confidence
                    </th>
                    <th className="text-left text-xs uppercase tracking-widest text-[#A1A1AA] py-3 font-medium hidden md:table-cell">
                      Timestamp
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {selectionHistory.map((selection) => (
                    <tr
                      key={selection.selection_id}
                      className="border-b border-[#1E2028]/50 hover:bg-[#1A1C23]/50 transition-colors"
                    >
                      <td className="py-3 font-mono text-sm text-white">
                        #{selection.round_id}
                      </td>
                      <td className="py-3 font-mono text-sm text-[#00F0FF]">
                        {selection.validator_name}
                      </td>
                      <td className="py-3 font-mono text-xs text-[#52525B] hidden sm:table-cell">
                        {selection.entropy_hash.slice(0, 16)}...
                      </td>
                      <td className="py-3">
                        <span className="badge-success font-mono text-xs px-2 py-0.5">
                          {selection.entropy_confidence}%
                        </span>
                      </td>
                      <td className="py-3 text-xs text-[#A1A1AA] hidden md:table-cell">
                        {new Date(selection.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {selectionHistory.length === 0 && (
                <div className="text-center py-12 text-[#52525B]">
                  <Hash size={48} weight="duotone" className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No selection history yet</p>
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
