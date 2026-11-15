import React from 'react';

type CfdPixelSolverLoopProps = {
  isRunning: boolean;
  isConverged: boolean;
  iteration: number;
  maxIterations: number;
  solverLabel: string;
};

/**
 * Embeds the user-supplied self-contained CFD Pixel World animation.
 * It is intentionally isolated from the application origin and does not
 * provide or represent numerical solver telemetry.
 */
export const CfdPixelSolverLoop: React.FC<CfdPixelSolverLoopProps> = ({
  isRunning,
  isConverged,
  iteration,
  maxIterations,
  solverLabel,
}) => {
  const state = isRunning ? 'SOLVER ACTIVE' : isConverged ? 'CONVERGED' : 'STANDBY';
  const progress = Math.min(100, Math.round((iteration / Math.max(1, maxIterations)) * 100));

  return (
    <div
      className="cfd-pixel-loop cfd-pixel-loop--iframe"
      data-solver-state={state}
      data-progress={progress}
      data-solver={solverLabel}
      role="img"
      aria-label="User-supplied looping CFD Pixel World animation"
    >
      <iframe
        src="/assets/CFDPixelWorld.html"
        title="CFD Pixel World animation"
        className="cfd-pixel-loop__iframe"
        sandbox="allow-scripts"
        loading="eager"
      />
      <div className="cfd-pixel-loop__caption">
        <span>CFD PIXEL WORLD</span>
        <span>Presentation visual · native telemetry remains in the panels</span>
      </div>
    </div>
  );
};
