'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Eraser, Trash2, Download, Upload, Undo, Redo } from 'lucide-react';

interface DrawingCanvasProps {
  teamNumber: number;
  initialDrawing?: string;
  onSave: (dataURL: string) => void;
}

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
  color: string;
  width: number;
  isEraser: boolean;
}

const COLORS = [
  { name: 'Red Alliance', value: '#ef4444', bg: 'bg-red-500' },
  { name: 'Blue Alliance', value: '#3b82f6', bg: 'bg-blue-500' },
  { name: 'Yellow', value: '#eab308', bg: 'bg-yellow-500' },
  { name: 'Green', value: '#22c55e', bg: 'bg-green-500' },
  { name: 'Purple', value: '#a855f7', bg: 'bg-purple-500' },
  { name: 'White', value: '#ffffff', bg: 'bg-white' },
];

export default function DrawingCanvas({ teamNumber, initialDrawing, onSave }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [color, setColor] = useState(COLORS[0].value);
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [history, setHistory] = useState<Stroke[][]>([]);
  const [historyStep, setHistoryStep] = useState(0);
  const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null);

  // Load initial drawing
  useEffect(() => {
    if (initialDrawing && canvasRef.current) {
      const img = new Image();
      img.onload = () => {
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
        }
      };
      img.src = initialDrawing;
    }
  }, [initialDrawing]);

  // Redraw canvas
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#0a0e17';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw background image
    if (backgroundImage) {
      ctx.globalAlpha = 0.3;
      ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 1;
    }

    // Draw grid
    ctx.strokeStyle = '#2a3547';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.3;
    for (let i = 0; i < canvas.width; i += 50) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
    for (let i = 0; i < canvas.height; i += 50) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Draw all strokes
    strokes.forEach(stroke => {
      if (stroke.points.length < 2) return;

      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (stroke.isEraser) {
        ctx.globalCompositeOperation = 'destination-out';
      } else {
        ctx.globalCompositeOperation = 'source-over';
      }

      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    });

    ctx.globalCompositeOperation = 'source-over';
  }, [strokes, backgroundImage]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const getTouchPos = (e: React.TouchEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    };
  };

  const startDrawing = (point: Point) => {
    setIsDrawing(true);
    setCurrentStroke([point]);
  };

  const draw = (point: Point) => {
    if (!isDrawing) return;
    setCurrentStroke(prev => [...prev, point]);

    // Draw immediately for smooth feedback
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || currentStroke.length === 0) return;

    ctx.strokeStyle = tool === 'eraser' ? '#0a0e17' : color;
    ctx.lineWidth = tool === 'eraser' ? 20 : strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
    }

    const lastPoint = currentStroke[currentStroke.length - 1];
    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();

    ctx.globalCompositeOperation = 'source-over';
  };

  const stopDrawing = () => {
    if (!isDrawing || currentStroke.length === 0) return;

    const newStroke: Stroke = {
      points: currentStroke,
      color: tool === 'eraser' ? '#0a0e17' : color,
      width: tool === 'eraser' ? 20 : strokeWidth,
      isEraser: tool === 'eraser',
    };

    const newStrokes = [...strokes, newStroke];
    setStrokes(newStrokes);
    setCurrentStroke([]);
    setIsDrawing(false);

    // Update history
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(newStrokes);
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);

    // Auto-save
    setTimeout(() => saveDrawing(newStrokes), 100);
  };

  const handleUndo = () => {
    if (historyStep > 0) {
      setHistoryStep(historyStep - 1);
      setStrokes(history[historyStep - 1] || []);
    }
  };

  const handleRedo = () => {
    if (historyStep < history.length - 1) {
      setHistoryStep(historyStep + 1);
      setStrokes(history[historyStep + 1]);
    }
  };

  const handleClear = () => {
    if (confirm('Clear all drawings? This cannot be undone.')) {
      setStrokes([]);
      setHistory([[]]);
      setHistoryStep(0);
      onSave('');
    }
  };

  const saveDrawing = (strokesToSave: Stroke[] = strokes) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataURL = canvas.toDataURL('image/png');
    onSave(dataURL);
  };

  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataURL = canvas.toDataURL('image/png', 1.0);
    const link = document.createElement('a');
    link.download = `team-${teamNumber}-scouting.png`;
    link.href = dataURL;
    link.click();
  };

  const handleImportBackground = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setBackgroundImage(img);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="cyber-card">
        <div className="flex flex-wrap items-center gap-4">
          {/* Drawing Tools */}
          <div className="flex gap-2">
            <button
              onClick={() => setTool('pen')}
              className={`px-3 py-2 rounded transition-all ${
                tool === 'pen' 
                  ? 'bg-cyber-blue text-cyber-darker' 
                  : 'bg-cyber-gray text-gray-300 hover:bg-opacity-70'
              }`}
            >
              Pen
            </button>
            <button
              onClick={() => setTool('eraser')}
              className={`px-3 py-2 rounded transition-all flex items-center gap-2 ${
                tool === 'eraser' 
                  ? 'bg-cyber-blue text-cyber-darker' 
                  : 'bg-cyber-gray text-gray-300 hover:bg-opacity-70'
              }`}
            >
              <Eraser className="w-4 h-4" />
              Eraser
            </button>
          </div>

          <div className="w-px h-8 bg-cyber-border"></div>

          {/* Colors */}
          <div className="flex gap-2">
            {COLORS.map((c) => (
              <button
                key={c.value}
                onClick={() => setColor(c.value)}
                className={`w-8 h-8 rounded-full ${c.bg} transition-all ${
                  color === c.value 
                    ? 'ring-2 ring-cyber-blue ring-offset-2 ring-offset-cyber-dark scale-110' 
                    : 'opacity-70 hover:opacity-100'
                }`}
                title={c.name}
              />
            ))}
          </div>

          <div className="w-px h-8 bg-cyber-border"></div>

          {/* Stroke Width */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Size:</span>
            <input
              type="range"
              min="1"
              max="10"
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(Number(e.target.value))}
              className="w-24"
            />
            <span className="text-sm text-cyber-blue font-mono w-6">{strokeWidth}</span>
          </div>

          <div className="w-px h-8 bg-cyber-border"></div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleUndo}
              disabled={historyStep <= 0}
              className="cyber-button-secondary disabled:opacity-30 disabled:cursor-not-allowed"
              title="Undo"
            >
              <Undo className="w-4 h-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyStep >= history.length - 1}
              className="cyber-button-secondary disabled:opacity-30 disabled:cursor-not-allowed"
              title="Redo"
            >
              <Redo className="w-4 h-4" />
            </button>
            <button
              onClick={handleClear}
              className="cyber-button-secondary text-red-400 hover:text-red-300"
              title="Clear Canvas"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="w-px h-8 bg-cyber-border"></div>

          {/* Import/Export */}
          <div className="flex gap-2">
            <label className="cyber-button-secondary cursor-pointer flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Background
              <input
                type="file"
                accept="image/*"
                onChange={handleImportBackground}
                className="hidden"
              />
            </label>
            <button
              onClick={handleExport}
              className="cyber-button-secondary flex items-center gap-2"
              title="Export Drawing"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="cyber-card">
        <div className="bg-cyber-darker rounded-lg overflow-hidden">
          <canvas
            ref={canvasRef}
            width={1200}
            height={800}
            className="w-full h-auto cursor-crosshair"
            onMouseDown={(e) => startDrawing(getMousePos(e))}
            onMouseMove={(e) => draw(getMousePos(e))}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={(e) => {
              e.preventDefault();
              startDrawing(getTouchPos(e));
            }}
            onTouchMove={(e) => {
              e.preventDefault();
              draw(getTouchPos(e));
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              stopDrawing();
            }}
          />
        </div>
      </div>

      <p className="text-xs text-gray-500 text-center">
        Drawings are automatically saved to localStorage
      </p>
    </div>
  );
}
