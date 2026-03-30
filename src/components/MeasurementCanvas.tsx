"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { useMeasurementStore, Point } from "@/store/useMeasurementStore";
import { cn, calculateShoelaceArea, calculateDistance, getGradeEmoji } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Pencil, Ruler, TrendingUp, Trash2, Undo, Info, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { Input } from "@/components/ui/input";

interface MeasurementCanvasProps {
  image: string;
}

export function MeasurementCanvas({ image }: MeasurementCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);
  const [naturalSize, setNaturalSize] = useState({ width: 800, height: 600 });
  const [zoom, setZoom] = useState(1);
  const [showScaleInput, setShowScaleInput] = useState(false);
  const [tempScaleLength, setTempScaleLength] = useState("10");
  
  // Zoom state
  const [zoom, setZoom] = useState(1);
  const [hoverPoint, setHoverPoint] = useState<Point | null>(null);
  const [toast, setToast] = useState("");
  const [toastVisible, setToastVisible] = useState(false);

  const {
    activeTool,
    perimeterPoints,
    areaClosed,
    scaleStart,
    scaleEnd,
    scaleLengthFeet,
    slopeStart,
    slopeEnd,
    slopeRiseInches,
    setActiveTool,
    addPerimeterPoint,
    setAreaClosed,
    clearPerimeter,
    setScaleStart,
    setScaleEnd,
    setScaleLength,
    setSlopeStart,
    setSlopeEnd,
    setSlopeRise,
    undoLastPoint,
  } = useMeasurementStore();

  const showToast = (msg: string) => {
    setToast(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2200);
  };

  // Load image
  useEffect(() => {
    const img = new window.Image();
    img.src = image;
    img.onload = () => {
      setImageObj(img);
      setNaturalSize({ width: img.width, height: img.height });
      // Use ResizeObserver so we get real dimensions once layout is complete.
      // Falls back to a short retry loop for browsers without ResizeObserver.
      const computeZoom = (w: number, h: number) => {
        if (w <= 0 || h <= 0) return;
        const z = Math.min((w - 32) / img.width, (h - 32) / img.height, 1);
        if (z > 0 && isFinite(z)) setZoom(z);
      };

      const container = containerRef.current;
      if (container) {
        if (container.clientWidth > 0) {
          computeZoom(container.clientWidth, container.clientHeight);
        } else if (typeof ResizeObserver !== "undefined") {
          const ro = new ResizeObserver((entries) => {
            const { width, height } = entries[0].contentRect;
            computeZoom(width, height);
            ro.disconnect();
          });
          ro.observe(container);
        } else {
          // Fallback: retry a few times
          let attempts = 0;
          const retry = setInterval(() => {
            attempts++;
            if (container.clientWidth > 0) {
              computeZoom(container.clientWidth, container.clientHeight);
              clearInterval(retry);
            }
            if (attempts > 10) clearInterval(retry);
          }, 50);
        }
      }
    };
  }, [image]);

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageObj) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = naturalSize.width;
    canvas.height = naturalSize.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imageObj, 0, 0);

    const lw = 2 / zoom;

    // Area polygon
    if (perimeterPoints.length >= 2) {
      ctx.beginPath();
      ctx.moveTo(perimeterPoints[0].x, perimeterPoints[0].y);
      perimeterPoints.forEach((p) => ctx.lineTo(p.x, p.y));
      if (areaClosed) ctx.closePath();
      ctx.fillStyle = "rgba(59,130,246,0.18)";
      if (areaClosed) ctx.fill();
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = lw;
      ctx.setLineDash(areaClosed ? [] : [6 / zoom, 3 / zoom]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Preview line
    if (!areaClosed && hoverPoint && activeTool === "perimeter" && perimeterPoints.length >= 1) {
      const last = perimeterPoints[perimeterPoints.length - 1];
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(hoverPoint.x, hoverPoint.y);
      ctx.strokeStyle = "rgba(59,130,246,0.4)";
      ctx.lineWidth = 1.5 / zoom;
      ctx.setLineDash([4 / zoom, 4 / zoom]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Points
    perimeterPoints.forEach((pt, i) => {
      const isFirst = i === 0;
      const r = (isFirst ? 8 : 6) / zoom;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
      ctx.fillStyle = isFirst ? "#22c55e" : "#3b82f6";
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1.5 / zoom;
      ctx.stroke();
      ctx.fillStyle = "#fff";
      ctx.font = `bold ${Math.max(10, 13 / zoom)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`${i + 1}`, pt.x, pt.y);
    });

    // Scale line
    if (scaleStart) {
      const p2 = scaleEnd || (activeTool === "scale" && hoverPoint) || scaleStart;
      ctx.setLineDash([8 / zoom, 4 / zoom]);
      ctx.strokeStyle = "#22c55e";
      ctx.lineWidth = 2.5 / zoom;
      ctx.beginPath();
      ctx.moveTo(scaleStart.x, scaleStart.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
      ctx.setLineDash([]);
      [scaleStart, scaleEnd || (activeTool === "scale" && hoverPoint)].forEach((pt) => {
        if (!pt) return;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 7 / zoom, 0, Math.PI * 2);
        ctx.fillStyle = "#22c55e";
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1.5 / zoom;
        ctx.stroke();
      });
      if (scaleEnd && scaleLengthFeet) {
        const mx = (scaleStart.x + scaleEnd.x) / 2;
        const my = (scaleStart.y + scaleEnd.y) / 2 - 12 / zoom;
        ctx.fillStyle = "#22c55e";
        ctx.font = `bold ${Math.max(10, 13 / zoom)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`${scaleLengthFeet} ft`, mx, my);
      }
    }

    // Slope line
    if (slopeStart) {
      const p2 = slopeEnd || (activeTool === "slope" && hoverPoint) || slopeStart;
      ctx.setLineDash([8 / zoom, 4 / zoom]);
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 2.5 / zoom;
      ctx.beginPath();
      ctx.moveTo(slopeStart.x, slopeStart.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
      ctx.setLineDash([]);
      [slopeStart, slopeEnd || (activeTool === "slope" && hoverPoint)].forEach((pt) => {
        if (!pt) return;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 7 / zoom, 0, Math.PI * 2);
        ctx.fillStyle = "#f59e0b";
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1.5 / zoom;
        ctx.stroke();
      });
    }
  }, [imageObj, naturalSize, zoom, perimeterPoints, areaClosed, scaleStart, scaleEnd, scaleLengthFeet, slopeStart, slopeEnd, activeTool, hoverPoint]);

  const getCanvasCoordinates = useCallback((e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / zoom,
      y: (e.clientY - rect.top) / zoom,
    };
  }, [zoom]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    setHoverPoint(getCanvasCoordinates(e));
  }, [getCanvasCoordinates]);

  const handleMouseLeave = useCallback(() => setHoverPoint(null), []);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const point = getCanvasCoordinates(e);
    if (activeTool === "perimeter") {
      if (areaClosed) return;
      if (perimeterPoints.length >= 3) {
        const dist = calculateDistance(point, perimeterPoints[0]);
        if (dist < 15 / zoom) {
          setAreaClosed(true);
          setActiveTool(null);
          showToast("Area closed!");
          return;
        }
      }
      addPerimeterPoint(point);
    } else if (activeTool === "scale") {
      if (!scaleStart) { setScaleStart(point); }
      else if (!scaleEnd) { setScaleEnd(point); setShowScaleInput(true); }
    } else if (activeTool === "slope") {
      if (!slopeStart) { setSlopeStart(point); }
      else if (!slopeEnd) {
        setSlopeEnd(point);
        setActiveTool(null);
        showToast("Slope line set. Enter rise to calculate grade.");
      }
    }
  }, [activeTool, areaClosed, perimeterPoints, scaleStart, scaleEnd, slopeStart, slopeEnd, zoom,
      addPerimeterPoint, setAreaClosed, setActiveTool, setScaleStart, setScaleEnd, setSlopeStart, setSlopeEnd]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") { e.preventDefault(); handleUndo(); }
      if (e.key === "Escape") setActiveTool(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTool, perimeterPoints, scaleStart, scaleEnd, slopeStart, slopeEnd, areaClosed]);

  const handleUndo = () => {
    if (activeTool === "perimeter" && !areaClosed) { undoLastPoint(); return; }
    if (activeTool === "scale") {
      if (scaleEnd) { setScaleEnd(null); setShowScaleInput(false); }
      else if (scaleStart) setScaleStart(null);
      return;
    }
    if (activeTool === "slope") {
      if (slopeEnd) setSlopeEnd(null);
      else if (slopeStart) setSlopeStart(null);
      return;
    }
    if (perimeterPoints.length > 0 && !areaClosed) undoLastPoint();
  };

  const handleClearTool = () => {
    if (activeTool === "perimeter" || perimeterPoints.length > 0) {
      clearPerimeter(); setAreaClosed(false);
    } else if (activeTool === "scale") {
      setScaleStart(null); setScaleEnd(null); setShowScaleInput(false);
    } else if (activeTool === "slope") {
      setSlopeStart(null); setSlopeEnd(null);
    }
  };

  const handleScaleSubmit = () => {
    const length = parseFloat(tempScaleLength);
    if (length > 0) {
      setScaleLength(length);
      setShowScaleInput(false);
      setActiveTool(null);
      showToast("Scale set!");
    }
  };

  const fitToScreen = () => {
    const container = containerRef.current;
    if (!container) return;
    setZoom(Math.min(
      (container.clientWidth - 32) / naturalSize.width,
      (container.clientHeight - 32) / naturalSize.height,
      1
    ));
  };

  // Measurements
  const scalePixels = scaleStart && scaleEnd ? calculateDistance(scaleStart, scaleEnd) : 0;
  const ftPerPixel = scalePixels > 0 && scaleLengthFeet > 0 ? scaleLengthFeet / scalePixels : 0;
  const areaPixels = calculateShoelaceArea(perimeterPoints);
  const areaSqFt = ftPerPixel > 0 && perimeterPoints.length >= 3 ? areaPixels * ftPerPixel * ftPerPixel : 0;
  const slopePixels = slopeStart && slopeEnd ? calculateDistance(slopeStart, slopeEnd) : 0;
  const runFeet = ftPerPixel > 0 && slopePixels > 0 ? slopePixels * ftPerPixel : 0;
  const grade = runFeet > 0 && slopeRiseInches > 0 ? ((slopeRiseInches / 12) / runFeet) * 100 : 0;
  const asphaltTons = areaSqFt > 0 ? (areaSqFt * 3 * 112) / 2000 : 0;
  const concreteYards = areaSqFt > 0 ? (areaSqFt * 4) / 324 : 0;
  const gravelYards = areaSqFt > 0 ? (areaSqFt * 6) / 324 : 0;
  const sealerGallons = areaSqFt > 0 ? areaSqFt / 80 : 0;
  const gradeClass = grade > 6 ? "text-red-600 bg-red-50" : grade > 2 ? "text-yellow-700 bg-yellow-50" : "text-green-700 bg-green-50";
  const gradeLabel = grade > 6 ? "Steep — drainage needed" : grade > 2 ? "Moderate slope" : "Good drainage";

  return (
    <div className="flex flex-col lg:flex-row gap-0 border rounded-lg overflow-hidden" style={{ height: "calc(100vh - 140px)" }}>
      {/* Canvas area */}
      <div className="flex-1 overflow-auto bg-slate-900 relative" ref={containerRef}>
        <canvas
          ref={canvasRef}
          onClick={handleClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: "top left",
            display: "block",
            cursor: activeTool ? "crosshair" : "default",
          }}
        />
        <div className="absolute bottom-3 right-3 flex flex-col gap-1.5 z-10">
          {[
            { icon: <ZoomIn className="w-4 h-4" />, action: () => setZoom(z => Math.min(z * 1.25, 8)) },
            { icon: <Maximize2 className="w-4 h-4" />, action: fitToScreen },
            { icon: <ZoomOut className="w-4 h-4" />, action: () => setZoom(z => Math.max(z / 1.25, 0.1)) },
          ].map(({ icon, action }, i) => (
            <button key={i} onClick={action}
              className="w-8 h-8 rounded-md bg-slate-800/80 border border-white/20 text-slate-200 flex items-center justify-center hover:bg-blue-600/60 transition-colors">
              {icon}
            </button>
          ))}
        </div>
        {toastVisible && (
          <div className="absolute bottom-14 left-1/2 -translate-x-1/2 bg-slate-800 text-slate-100 px-4 py-2 rounded-full text-sm shadow-lg z-20 pointer-events-none">
            {toast}
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div className="w-full lg:w-72 border-l bg-card flex flex-col overflow-y-auto">
        {/* Tools */}
        <div className="p-4 border-b">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">Tools</div>
          <div className="flex flex-wrap gap-2">
            <Button variant={activeTool === "scale" ? "default" : "outline"} size="sm"
              onClick={() => setActiveTool(activeTool === "scale" ? null : "scale")} className="flex-1">
              <Ruler className="w-4 h-4 mr-1.5" /> Scale
            </Button>
            <Button variant={activeTool === "perimeter" ? "default" : "outline"} size="sm"
              onClick={() => setActiveTool(activeTool === "perimeter" ? null : "perimeter")} className="flex-1">
              <Pencil className="w-4 h-4 mr-1.5" /> Area
            </Button>
            <Button variant={activeTool === "slope" ? "default" : "outline"} size="sm"
              onClick={() => setActiveTool(activeTool === "slope" ? null : "slope")} className="flex-1">
              <TrendingUp className="w-4 h-4 mr-1.5" /> Slope
            </Button>
          </div>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" size="sm" onClick={handleUndo} className="flex-1">
              <Undo className="w-3.5 h-3.5 mr-1" /> Undo
            </Button>
            <Button variant="outline" size="sm" onClick={handleClearTool} className="flex-1">
              <Trash2 className="w-3.5 h-3.5 mr-1" /> Clear
            </Button>
          </div>
          <div className="text-xs text-muted-foreground mt-2 min-h-[16px]">
            {activeTool === "scale" && !scaleStart && "Click first endpoint of known distance"}
            {activeTool === "scale" && scaleStart && !scaleEnd && "Click second endpoint"}
            {activeTool === "scale" && scaleStart && scaleEnd && "Scale set ✓"}
            {activeTool === "perimeter" && perimeterPoints.length === 0 && "Click to add polygon points"}
            {activeTool === "perimeter" && perimeterPoints.length > 0 && !areaClosed && perimeterPoints.length < 3 && `${perimeterPoints.length} point(s) — need ${3 - perimeterPoints.length} more`}
            {activeTool === "perimeter" && perimeterPoints.length >= 3 && !areaClosed && "Click near first point (green) to close"}
            {activeTool === "perimeter" && areaClosed && `Polygon closed (${perimeterPoints.length} pts)`}
            {activeTool === "slope" && !slopeStart && "Click start of slope run"}
            {activeTool === "slope" && slopeStart && !slopeEnd && "Click end of slope run"}
            {!activeTool && "Select a tool above · Ctrl+Z undo · Esc cancel"}
          </div>
        </div>

        {/* Scale input prompt */}
        {showScaleInput && (
          <div className="p-4 border-b bg-green-50 dark:bg-green-950/20">
            <label className="text-sm font-medium block mb-2">Real-world distance between your two points:</label>
            <div className="flex gap-2">
              <Input type="number" value={tempScaleLength}
                onChange={(e) => setTempScaleLength(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleScaleSubmit()}
                step="0.1" min="0.1" className="flex-1" />
              <span className="text-sm self-center text-muted-foreground">ft</span>
              <Button onClick={handleScaleSubmit} size="sm">Set</Button>
            </div>
          </div>
        )}

        {/* Scale status */}
        <div className="p-4 border-b">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Scale Reference</div>
          {scalePixels > 0 && scaleLengthFeet ? (
            <div className="text-sm text-green-700 dark:text-green-400 font-medium">
              ✓ {scaleLengthFeet} ft = {Math.round(scalePixels)} px
              <div className="text-xs text-muted-foreground mt-0.5">{ftPerPixel.toFixed(4)} ft/pixel</div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Not set — use Scale tool</div>
          )}
        </div>

        {/* Area */}
        <div className="p-4 border-b">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Area</div>
          <div className="bg-background rounded-lg p-3">
            <div className="text-3xl font-bold">
              {perimeterPoints.length < 3 ? "—" : areaSqFt > 0
                ? areaSqFt.toFixed(1)
                : Math.round(areaPixels).toLocaleString()}
              <span className="text-sm text-muted-foreground ml-1">
                {perimeterPoints.length >= 3 ? (areaSqFt > 0 ? "sq ft" : "px²") : ""}
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {perimeterPoints.length < 3
                ? "Draw at least 3 points"
                : areaSqFt === 0
                  ? "Set scale for sq ft"
                  : areaClosed
                    ? `${perimeterPoints.length}-point polygon`
                    : "Close polygon for final area"}
            </div>
          </div>
        </div>

        {/* Slope */}
        <div className="p-4 border-b">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Slope / Grade</div>
          <div className="bg-background rounded-lg p-3 mb-2">
            <div className="text-3xl font-bold">
              {grade > 0 ? `${grade.toFixed(2)}%` : "—"}
              {grade > 0 && <span className="ml-2 text-base">{getGradeEmoji(grade)}</span>}
            </div>
            {grade > 0 ? (
              <span className={cn("inline-block text-xs px-2 py-0.5 rounded-full mt-1 font-medium", gradeClass)}>
                {gradeLabel}
              </span>
            ) : (
              <div className="text-xs text-muted-foreground mt-1">
                {!slopeStart ? "Draw slope line" : !slopeEnd ? "Click end of run" : "Enter rise below"}
              </div>
            )}
          </div>
          {slopeStart && slopeEnd && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap">Rise (in):</span>
              <Input type="number" value={slopeRiseInches || ""}
                onChange={(e) => setSlopeRise(parseFloat(e.target.value) || 0)}
                placeholder="e.g. 3" min="0" step="0.25" className="h-8 text-sm" />
            </div>
          )}
          {runFeet > 0 && (
            <div className="text-xs text-muted-foreground mt-1.5">Run: {runFeet.toFixed(1)} ft</div>
          )}
        </div>

        {/* Materials */}
        <div className="p-4 border-b">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">Material Estimates</div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Asphalt (3")', value: asphaltTons, unit: "tons" },
              { label: 'Concrete (4")', value: concreteYards, unit: "yd³" },
              { label: 'Gravel base (6")', value: gravelYards, unit: "yd³" },
              { label: "Sealer", value: sealerGallons, unit: "gal" },
            ].map(({ label, value, unit }) => (
              <div key={label} className="bg-background rounded-lg p-2">
                <div className="text-xs text-muted-foreground">{label}</div>
                <div className="font-semibold text-sm mt-0.5">
                  {value > 0 ? value.toFixed(2) : "—"}
                  {value > 0 && <span className="text-xs text-muted-foreground font-normal ml-1">{unit}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tips */}
        <div className="p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <Info className="w-3.5 h-3.5 text-muted-foreground" />
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Accuracy Tips</div>
          </div>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
            <li>Longer scale reference = better accuracy</li>
            <li>Overhead photos minimize perspective distortion</li>
            <li>Include tape measure or known object in photo</li>
            <li>Verify critical measurements on-site</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
