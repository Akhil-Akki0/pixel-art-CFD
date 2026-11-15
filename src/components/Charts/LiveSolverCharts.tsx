import React, { useState } from 'react';
import {
  TrendingDown,
  Activity,
  Wind,
  Layers,
  BarChart3,
  Download,
  FileSpreadsheet,
  CheckCircle2
} from 'lucide-react';
import { downloadProjectExcel } from '../../utils/excelGenerator';
import { sound } from '../../utils/soundEffects';

interface LiveSolverChartsProps {
  iteration: number;
  maxIterations: number;
  isRunning: boolean;
  isConverged: boolean;
  continuityResidual: number | null;
  momentumResidual: number | null;
  energyResidual: number | null;
  mach: number;
  aoa: number;
  inletVelocity: number;
  projectName?: string;
  onExportExcel?: () => void;
  residualHistory?: Array<{ iteration: number; continuity?: number; xMomentum?: number; Ux?: number; h?: number; k?: number; kTurbulence?: number }>;
  realCoefficients?: { cL?: number | null; cD?: number | null; liftToDrag?: number | null } | null;
}

export const LiveSolverCharts: React.FC<LiveSolverChartsProps> = ({
  iteration,
  maxIterations,
  isRunning,
  isConverged,
  continuityResidual,
  momentumResidual,
  energyResidual,
  mach,
  aoa,
  inletVelocity,
  projectName = 'OpenFOAM-Case',
  onExportExcel,
  residualHistory = [],
  realCoefficients = null,
}) => {
  const [activeTab, setActiveTab] = useState<'residuals' | 'coefficients' | 'cp'>('residuals');

  const currentIter = Math.max(iteration, 1);
  const frac = Math.min(1, currentIter / maxIterations);

  const liveCl = realCoefficients?.cL ?? null;
  const liveCd = realCoefficients?.cD ?? null;
  const liveLd = realCoefficients?.liftToDrag ?? (liveCl !== null && liveCd ? liveCl / liveCd : null);

  const residualPoints = residualHistory
    .map((point) => ({
      iter: point.iteration,
      cont: point.continuity,
      mom: point.Ux ?? point.xMomentum,
      energy: point.h ?? point.k ?? point.kTurbulence,
    }))
    .filter((point) => [point.cont, point.mom, point.energy].some((value) => Number.isFinite(value)));
  const numPlotPoints = Math.max(residualPoints.length, 1);

  // SVG Chart Dimensions
  const svgWidth = 420;
  const svgHeight = 160;
  const padding = { top: 15, right: 20, bottom: 25, left: 45 };
  const plotWidth = svgWidth - padding.left - padding.right;
  const plotHeight = svgHeight - padding.top - padding.bottom;

  // Log scale mapping (-6 to 0)
  const mapY = (val: number) => {
    const logVal = Math.log10(Math.max(1e-6, Math.min(1, val)));
    // logVal goes from 0 down to -6
    const normalized = -logVal / 6; // 0 (val=1) to 1 (val=1e-6)
    return padding.top + normalized * plotHeight;
  };

  const mapX = (i: number) => {
    return padding.left + (i / Math.max(1, numPlotPoints - 1)) * plotWidth;
  };

  const contPath = residualPoints
    .filter((p) => Number.isFinite(p.cont))
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${mapX(i).toFixed(1)} ${mapY(p.cont as number).toFixed(1)}`)
    .join(' ');

  const momPath = residualPoints
    .filter((p) => Number.isFinite(p.mom))
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${mapX(i).toFixed(1)} ${mapY(p.mom as number).toFixed(1)}`)
    .join(' ');

  const energyPath = residualPoints
    .filter((p) => Number.isFinite(p.energy))
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${mapX(i).toFixed(1)} ${mapY(p.energy as number).toFixed(1)}`)
    .join(' ');

  // Surface Pressure (Cp) Distribution points
  const handleExport = () => {
    sound.playSave();
    if (onExportExcel) {
      onExportExcel();
    } else {
      downloadProjectExcel({
        projectName,
        simulationId: `SIM-${Math.round(iteration || 1)}`,
        mach,
        aoa,
        cl: liveCl ?? undefined,
        cd: liveCd ?? undefined,
        liftToDrag: liveLd ?? undefined,
        iterations: iteration,
        maxIterations,
        inletVelocity,
      });
    }
  };

  return (
    <div className="glass-surface rounded-3xl border border-white/60 dark:border-white/10 shadow-xl p-4 sm:p-5 text-slate-900 dark:text-slate-100 backdrop-blur-md space-y-4">
      {/* Cockpit Chart Header & Tab Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/40 dark:border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-2xl bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 flex items-center justify-center border border-cyan-400/40 shadow-xs">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold tracking-tight text-slate-950 dark:text-white flex items-center gap-2">
              <span>Live CFD Program Solver Charts</span>
              <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                isRunning ? 'bg-cyan-500/15 text-cyan-800 dark:text-cyan-300 border border-cyan-400/40 shadow-[0_0_6px_rgba(6,182,212,0.25)]' : 'bg-slate-200 dark:bg-slate-800 text-slate-600'
              }`}>
                {isRunning ? 'STREAMING' : 'STATIC'}
              </span>
            </h3>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              Iter: <strong className="font-mono text-cyan-800 dark:text-cyan-300">{iteration}</strong> / {maxIterations} ({Math.round(frac * 100)}% complete)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Chart View Switcher */}
          <div className="flex items-center p-1 rounded-2xl bg-white/40 dark:bg-slate-800/50 border border-white/50 dark:border-white/10 text-xs">
            <button
              onClick={() => setActiveTab('residuals')}
              className={`px-2.5 py-1 rounded-xl font-semibold transition-all cursor-pointer ${
                activeTab === 'residuals'
                  ? 'bg-white dark:bg-slate-700 text-cyan-700 dark:text-cyan-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Residuals
            </button>
            <button
              onClick={() => setActiveTab('coefficients')}
              className={`px-2.5 py-1 rounded-xl font-semibold transition-all cursor-pointer ${
                activeTab === 'coefficients'
                  ? 'bg-white dark:bg-slate-700 text-cyan-700 dark:text-cyan-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Forces (cL, cD)
            </button>
            <button
              onClick={() => setActiveTab('cp')}
              className={`px-2.5 py-1 rounded-xl font-semibold transition-all cursor-pointer ${
                activeTab === 'cp'
                  ? 'bg-white dark:bg-slate-700 text-cyan-700 dark:text-cyan-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Cp Chord
            </button>
          </div>

          {/* Quick Excel Export */}
          <button
            onClick={handleExport}
            title="Download Live Simulation Data in Excel (.xls)"
            aria-label="Export to Excel"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Excel</span>
          </button>
        </div>
      </div>

      {/* Main Chart Body depending on Tab */}
      {activeTab === 'residuals' && (
        <div className="p-3 rounded-2xl bg-white/30 dark:bg-slate-900/40 border border-white/50 dark:border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="font-bold text-slate-800 dark:text-slate-200">Logarithmic Convergence (Continuity, Momentum, Energy)</span>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1 text-cyan-600 dark:text-cyan-400 font-bold">
                <span className="w-2.5 h-0.5 bg-cyan-600 rounded"></span> Continuity: {continuityResidual?.toExponential(2) || '—'}
              </span>
              <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-bold">
                <span className="w-2.5 h-0.5 bg-blue-600 rounded"></span> Ux: {momentumResidual?.toExponential(2) || '—'}
              </span>
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                <span className="w-2.5 h-0.5 bg-emerald-600 rounded"></span> Energy: {energyResidual?.toExponential(2) || '—'}
              </span>
            </div>
          </div>

          {/* SVG Plot */}
          <div className="w-full overflow-x-auto">
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-40 select-none overflow-visible">
              {/* Grid Lines */}
              {[0, 1, 2, 3, 4, 5, 6].map((tick) => {
                const y = padding.top + (tick / 6) * plotHeight;
                return (
                  <g key={`ytick-${tick}`}>
                    <line x1={padding.left} y1={y} x2={svgWidth - padding.right} y2={y} stroke="rgba(148, 163, 184, 0.25)" strokeDasharray="2 2" />
                    <text x={padding.left - 6} y={y + 3} textAnchor="end" className="text-[8px] font-mono fill-slate-500">
                      1e-{tick}
                    </text>
                  </g>
                );
              })}

              {/* Curves */}
              {residualPoints.length > 0 ? (
                <>
                  <path d={contPath} fill="none" stroke="#06b6d4" strokeWidth="2" className="transition-all duration-200" />
                  <path d={momPath} fill="none" stroke="#2563eb" strokeWidth="1.5" strokeDasharray="3 1" className="transition-all duration-200" />
                  <path d={energyPath} fill="none" stroke="#10b981" strokeWidth="1.5" className="transition-all duration-200" />
                </>
              ) : (
                <text x={svgWidth / 2} y={svgHeight / 2} textAnchor="middle" className="text-[11px] font-mono fill-slate-500">
                  Awaiting native OpenFOAM residual telemetry
                </text>
              )}

              {/* Current Iteration Indicator */}
              <line
                x1={padding.left + frac * plotWidth}
                y1={padding.top}
                x2={padding.left + frac * plotWidth}
                y2={padding.top + plotHeight}
                stroke="#d97706"
                strokeWidth="1.5"
                strokeDasharray="2 2"
              />
            </svg>
          </div>
        </div>
      )}

      {activeTab === 'coefficients' && (
        <div className="p-3 rounded-2xl bg-white/30 dark:bg-slate-900/40 border border-white/50 dark:border-white/10 space-y-3">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-2.5 rounded-2xl bg-white/50 dark:bg-slate-800/60 border border-white/60 dark:border-white/10">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">Lift Coeff (cL)</span>
              <strong className="text-xl font-mono text-cyan-600 dark:text-cyan-400">{liveCl === null ? '—' : liveCl.toFixed(5)}</strong>
            </div>
            <div className="p-2.5 rounded-2xl bg-white/50 dark:bg-slate-800/60 border border-white/60 dark:border-white/10">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">Drag Coeff (cD)</span>
              <strong className="text-xl font-mono text-blue-600 dark:text-blue-400">{liveCd === null ? '—' : liveCd.toFixed(5)}</strong>
            </div>
            <div className="p-2.5 rounded-2xl bg-white/50 dark:bg-slate-800/60 border border-white/60 dark:border-white/10">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">Efficiency (L/D)</span>
              <strong className="text-xl font-mono text-emerald-600 dark:text-emerald-400">{liveLd === null ? '—' : liveLd.toFixed(3)}</strong>
            </div>
          </div>

          <div className="p-2 text-[11px] text-slate-600 dark:text-slate-400 flex items-center justify-between border-t border-white/30 dark:border-white/10">
            <span>Airfoil Inflow Angle: <strong>{aoa}°</strong></span>
            <span>Mach: <strong>{mach}</strong></span>
            <span>Free-stream Velocity: <strong>{inletVelocity} m/s</strong></span>
          </div>
        </div>
      )}

      {activeTab === 'cp' && (
        <div className="p-3 rounded-2xl bg-white/30 dark:bg-slate-900/40 border border-white/50 dark:border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="font-bold text-slate-800 dark:text-slate-200">Normalized Surface Pressure (Cp vs x/c)</span>
            <span className="text-slate-500 font-bold">Available after surface Cp sampling is enabled</span>
          </div>

          <div className="w-full overflow-x-auto">
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-40 select-none overflow-visible">
              <text x={svgWidth / 2} y={svgHeight / 2} textAnchor="middle" className="text-[11px] font-mono fill-slate-500">
                No native surface pressure samples in this run
              </text>
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveSolverCharts;
