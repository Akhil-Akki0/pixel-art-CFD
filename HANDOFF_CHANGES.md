# CFD Website Backend/OpenFOAM Changes

Commit included in this package: `6c55ffe`

## What was changed

### Native OpenFOAM live simulation
- The native OpenFOAM runner remains the authoritative execution path.
- Live residual and force-coefficient charts now use telemetry parsed from the running OpenFOAM case.
- Fabricated `Math.random()` curves and synthetic coefficient values were removed from the native runner flow.
- When native telemetry is unavailable, the UI shows an unavailable state instead of inventing a value.
- Native velocity and pressure metrics are collected from solver output when available, including average velocity and pressure drop.

### Reports and Excel exports
- Reports now export only completed native OpenFOAM runs.
- Sample solver logs and hard-coded fallback metrics were removed from the reporting flow.
- Excel residual rows are generated from persisted native residual history only.
- The report charts and tables therefore represent the actual solver telemetry received by the application.

### STL and backend security
- Binary STL files are checked for exact size consistency.
- Binary STL coordinates and normals must be finite numeric values.
- Invalid or malformed STL files are rejected before storage or execution.
- Staged STL cases include uploader ownership metadata.
- A staged case can only be executed by its uploader or an administrator.
- OpenFOAM cases continue to run in isolated temporary directories with whitelisted commands.
- CORS was restricted to configured/local origins instead of allowing every origin.

## Important distinction

The repository also contains a separate browser-side interactive preview page named `LiveSimulationPage.tsx`. That page is not a native OpenFOAM solver and must not be treated as authoritative CFD output. The verified results are produced through the native OpenFOAM runner page and its SSE telemetry stream.

## Validation completed in the development sandbox

- `npm run lint` passed.
- `npm run build` passed.
- `node --test tests/*.test.mjs` passed all 18 tests.
- `git diff --check` passed.

Native `blockMesh`, `snappyHexMesh`, and `simpleFoam` execution was not run in the sandbox because OpenFOAM v2606 is not installed there. Validate one real STL case on the target Linux/WSL2 machine after installing and configuring OpenFOAM.

## Run on Linux/WSL2

1. Install Node.js and OpenFOAM v2606 on the Linux/WSL2 environment.
2. Copy this project folder to the Linux filesystem.
3. Install the repository dependencies using the package manager expected by the project (`bun install`, or the equivalent supported install command).
4. Configure the backend environment variables, especially authentication, CORS/local origins, upload directories, and the OpenFOAM executable paths.
5. Start the backend and frontend using the existing package scripts.
6. Upload a valid STL, run it through the native Simulation Runner page, and verify the residual/coefficient charts and exported Excel/PDF values against the OpenFOAM logs.

Do not expose the OpenFOAM backend directly to the public internet without HTTPS, authentication, upload limits, and a production process supervisor/container boundary.


## Latest UI and environment fixes

- Replaced the Simulation Runner canvas preview with a deterministic looping pixel-art CFD monitor showing an airfoil, mesh grid, flow particles, wake, solver state, and progress. It is explicitly presentation-only; native telemetry remains in the OpenFOAM residual and result panels.
- Added visible `SELECTED` badges, glow, border, and elevation to solver cards, live simulation model cards, and selected geometry cards.
- Added optional `OPENFOAM_BASHRC` support so Linux/WSL2 installations outside the standard paths can be sourced by the runner.
- Expanded the yellow environment banner with the exact host-side recovery steps.

The yellow OpenFOAM banner will remain until OpenFOAM v2606 is installed and sourced on the machine running the backend. The application now fails safely and explains the required setup rather than showing fabricated solver output.


## Supplied pixel-world asset

The supplied `CFDPixelWorld.html` is copied unchanged to `public/assets/CFDPixelWorld.html` and embedded only in the Simulation Runner Flow Visualization panel through a sandboxed local iframe. It has no external links, fetch calls, WebSockets, or backend access. The animation is presentation-only and does not replace native OpenFOAM residuals, coefficients, logs, or report values.
