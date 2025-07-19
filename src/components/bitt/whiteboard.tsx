
'use client';

import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Eraser } from 'lucide-react';

export function Whiteboard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // For high-DPI screens
    const scale = window.devicePixelRatio;
    canvas.width = canvas.offsetWidth * scale;
    canvas.height = canvas.offsetHeight * scale;

    const context = canvas.getContext('2d');
    if (!context) return;
    
    context.scale(scale, scale);
    context.lineCap = 'round';
    context.strokeStyle = brushColor;
    context.lineWidth = brushSize;
    contextRef.current = context;
  }, [brushColor, brushSize]);

  const startDrawing = ({ nativeEvent }: React.MouseEvent<HTMLCanvasElement>) => {
    const { offsetX, offsetY } = nativeEvent;
    contextRef.current?.beginPath();
    contextRef.current?.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const finishDrawing = () => {
    contextRef.current?.closePath();
    setIsDrawing(false);
  };

  const draw = ({ nativeEvent }: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = nativeEvent;
    contextRef.current?.lineTo(offsetX, offsetY);
    contextRef.current?.stroke();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (canvas && context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  return (
    <Card className="w-full mx-auto shadow-lg">
      <CardHeader className="text-center">
        <CardTitle>Tepantor</CardTitle>
        <CardDescription>Let your creativity flow. Start drawing on the canvas below.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseUp={finishDrawing}
          onMouseMove={draw}
          onMouseLeave={finishDrawing}
          className="bg-white border-2 border-primary rounded-lg cursor-crosshair w-full h-96"
        />
        <div className="flex flex-wrap justify-center items-center gap-4">
            <div className='flex items-center gap-2'>
                <label htmlFor="brushColor" className="text-sm font-medium">Color:</label>
                <input
                    id="brushColor"
                    type="color"
                    value={brushColor}
                    onChange={(e) => setBrushColor(e.target.value)}
                    className="w-10 h-10 p-0 border-none cursor-pointer rounded-md"
                />
            </div>
            <div className='flex items-center gap-2'>
                <label htmlFor="brushSize" className="text-sm font-medium">Size:</label>
                <input
                    id="brushSize"
                    type="range"
                    min="1"
                    max="50"
                    value={brushSize}
                    onChange={(e) => setBrushSize(parseInt(e.target.value))}
                    className="w-32 cursor-pointer"
                />
            </div>
          <Button onClick={clearCanvas} variant="destructive">
            <Eraser className="mr-2" /> Clear
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
