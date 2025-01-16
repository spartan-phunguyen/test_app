'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Upload, Undo, Redo } from 'lucide-react'
import { NumericInputModal } from './numeric-input-modal'

interface Point {
  x: number
  y: number
}

interface Line {
  start: Point
  end: Point
  text: string
  color: string
}

const colorOptions = [
  '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF',
  '#00FFFF', '#FFA500', '#800080', '#008000', '#FFC0CB'
]

export default function PerspectiveTransformConfigure() {
  const [imageName, setImageName] = useState<string>('')
  const [image, setImage] = useState<string | null>(null)
  const [height, setHeight] = useState<number>(0)
  const [pitch, setPitch] = useState<number>(0)
  const [yaw, setYaw] = useState<number>(0)
  const [roll, setRoll] = useState<number>(0)
  const [isDrawing, setIsDrawing] = useState<boolean>(false)
  const [lines, setLines] = useState<Line[]>([])
  const [currentLine, setCurrentLine] = useState<Line | null>(null)
  // const [lineText, setLineText] = useState<string>('')
  const [history, setHistory] = useState<Line[][]>([[]])
  const [historyIndex, setHistoryIndex] = useState<number>(0)
  const [, setScaleFactor] = useState<number>(1)
  const [lineThickness, setLineThickness] = useState<number>(2)
  const [fontSize, setFontSize] = useState<number>(14)
  const [selectedColor, setSelectedColor] = useState<string>(colorOptions[0])
  const [fx, setFx] = useState<number>(1)
  const [fy, setFy] = useState<number>(1)
  const [cx, setCx] = useState<number>(0)
  const [cy, setCy] = useState<number>(0)
  const [rightImagePosition, setRightImagePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isDrawingMode, setIsDrawingMode] = useState<boolean>(false);
  const [drawingStep, setDrawingStep] = useState<number>(0);
  const [previewLine, setPreviewLine] = useState<Line | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const leftCanvasRef = useRef<HTMLCanvasElement>(null)
  const rightCanvasRef = useRef<HTMLCanvasElement>(null)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const maxDimension = Math.max(img.width, img.height)
          const newScaleFactor = Math.max(1, maxDimension / 1000)
          setScaleFactor(newScaleFactor)
          setLineThickness(Math.max(2, Math.round(2 * newScaleFactor)))
          setFontSize(Math.max(14, Math.round(14 * newScaleFactor)))
          setImage(img.src)
          setImageName(file.name)
          setLines([])
          setHistory([[]])
          setHistoryIndex(0)
          setRightImagePosition({ x: 0, y: 0 })
        }
        img.src = e.target?.result as string
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingMode || !rightCanvasRef.current) return;

    const rect = rightCanvasRef.current.getBoundingClientRect();
    const scaleX = rightCanvasRef.current.width / rect.width;
    const scaleY = rightCanvasRef.current.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX - rightImagePosition.x;
    const y = (e.clientY - rect.top) * scaleY - rightImagePosition.y;

    if (drawingStep === 0) {
      setCurrentLine({ start: { x, y }, end: { x, y }, text: '', color: selectedColor });
      setDrawingStep(1);
    } else if (drawingStep === 1) {
      if (currentLine) {
        const newLine = { ...currentLine, end: { x, y } };
        setCurrentLine(newLine);
        setIsModalOpen(true);
      }
    }
  }

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingMode || !rightCanvasRef.current) return;

    const rect = rightCanvasRef.current.getBoundingClientRect();
    const scaleX = rightCanvasRef.current.width / rect.width;
    const scaleY = rightCanvasRef.current.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX - rightImagePosition.x;
    const y = (e.clientY - rect.top) * scaleY - rightImagePosition.y;

    if (drawingStep === 1 && currentLine) {
      setPreviewLine({ ...currentLine, end: { x, y } });
    }
  }

  const handleSave = () => {
    const data = {
      imageName,
      height,
      pitch,
      yaw,
      roll,
      fx,
      fy,
      cx,
      cy,
      lines
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `perspective_transform_${imageName}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const updateHistory = (newLines: Line[]) => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(newLines)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      setLines(history[historyIndex - 1])
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      setLines(history[historyIndex + 1])
    }
  }

  const handleNewImage = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => handleImageUpload(e as unknown as React.ChangeEvent<HTMLInputElement>)
    input.click()
  }

  const handleReset = () => {
    setHeight(0);
    setPitch(0);
    setYaw(0);
    setRoll(0);
    setFx(1);
    setFy(1);
    setCx(0);
    setCy(0);
    setIsDrawingMode(false);
    setIsDrawing(false);
    setRightImagePosition({ x: 0, y: 0 });
    if (image && rightCanvasRef.current) {
      const ctx = rightCanvasRef.current.getContext('2d');
      if (ctx) {
        const img = new Image();
        img.src = image;
        img.onload = () => {
          ctx.drawImage(img, 0, 0);
        };
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDrawingMode) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - rightImagePosition.x, y: e.clientY - rightImagePosition.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || isDrawingMode) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    setRightImagePosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleModalClose = (value: number | null) => {
    if (value !== null && currentLine) {
      const newLine = { ...currentLine, text: value.toString() };
      setLines([...lines, newLine]);
      updateHistory([...lines, newLine]);
    }
    setCurrentLine(null);
    setPreviewLine(null);
    setDrawingStep(0);
    setIsDrawingMode(false);
    setIsDrawing(false);
    setIsModalOpen(false);
  };

  useEffect(() => {
    if (!image) return

    const leftCanvas = leftCanvasRef.current
    const rightCanvas = rightCanvasRef.current
    if (!leftCanvas || !rightCanvas) return

    const leftCtx = leftCanvas.getContext('2d')
    const rightCtx = rightCanvas.getContext('2d')
    if (!leftCtx || !rightCtx) return

    const img = new Image()
    img.src = image
    img.onload = () => {
      leftCanvas.width = img.width
      leftCanvas.height = img.height
      rightCanvas.width = img.width
      rightCanvas.height = img.height

      leftCtx.drawImage(img, 0, 0)

      rightCtx.save();
      rightCtx.clearRect(0, 0, rightCanvas.width, rightCanvas.height);
      rightCtx.translate(rightImagePosition.x, rightImagePosition.y);
      rightCtx.drawImage(img, 0, 0);

      const transformedImageData = applyPerspectiveTransform(
        rightCtx.getImageData(0, 0, img.width, img.height),
        height,
        pitch,
        yaw,
        roll,
        fx,
        fy,
        cx,
        cy
      )
      rightCtx.putImageData(transformedImageData, 0, 0)

      lines.forEach(line => {
        rightCtx.beginPath()
        rightCtx.strokeStyle = line.color
        rightCtx.lineWidth = lineThickness
        rightCtx.moveTo(line.start.x, line.start.y)
        rightCtx.lineTo(line.end.x, line.end.y)
        rightCtx.stroke()

        if (line.text) {
          const midX = (line.start.x + line.end.x) / 2
          const midY = (line.start.y + line.end.y) / 2
          rightCtx.save()
          rightCtx.fillStyle = 'white'
          rightCtx.font = `${fontSize}px Arial`
          const textMetrics = rightCtx.measureText(line.text)
          const textWidth = textMetrics.width
          const textHeight = textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent
          rightCtx.fillRect(midX - textWidth / 2 - 5, midY - textHeight / 2 - 5, textWidth + 10, textHeight + 10)
          rightCtx.fillStyle = 'black'
          rightCtx.textAlign = 'center'
          rightCtx.textBaseline = 'middle'
          rightCtx.fillText(line.text, midX, midY)
          rightCtx.restore()
        }
      })

      if (currentLine) {
        rightCtx.beginPath();
        rightCtx.strokeStyle = currentLine.color;
        rightCtx.lineWidth = lineThickness;
        rightCtx.moveTo(currentLine.start.x, currentLine.start.y);
        rightCtx.lineTo(currentLine.end.x, currentLine.end.y);
        rightCtx.stroke();
      }

      if (previewLine) {
        rightCtx.beginPath();
        rightCtx.strokeStyle = previewLine.color;
        rightCtx.lineWidth = lineThickness;
        rightCtx.setLineDash([5, 5]);
        rightCtx.moveTo(previewLine.start.x, previewLine.start.y);
        rightCtx.lineTo(previewLine.end.x, previewLine.end.y);
        rightCtx.stroke();
        rightCtx.setLineDash([]);
      }

      rightCtx.restore();
    }
  }, [image, height, pitch, yaw, roll, fx, fy, cx, cy, lines, currentLine, previewLine, lineThickness, fontSize, rightImagePosition])

  return (
    <div className="p-4 space-y-4 max-h-screen overflow-y-auto">
      <div className="text-center">
        <div className="text-xl font-medium">
          {imageName ? `Image: ${imageName}` : 'No image uploaded'}
        </div>
      </div>

      <div className="flex space-x-4">
        <div className="w-1/2 space-y-2">
          <h3 className="text-lg font-semibold text-center">Source</h3>
          {!image ? (
            <label className="flex items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-1 text-sm text-gray-600">Click or drag image to upload</p>
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
              />
            </label>
          ) : (
            <canvas ref={leftCanvasRef} className="w-full border rounded-lg" />
          )}
        </div>
        <div className="w-1/2 space-y-2">
          <h3 className="text-lg font-semibold text-center">Destination</h3>
          <canvas
            ref={rightCanvasRef}
            className={`w-full border rounded-lg ${isDrawingMode ? 'cursor-crosshair' : 'cursor-move'}`}
            onClick={handleCanvasClick}
            onMouseDown={handleMouseDown}
            onMouseMove={isDrawingMode ? handleCanvasMouseMove : handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="height-slider">Height (h)</Label>
          <div className="flex items-center space-x-4">
            <Slider
              id="height-slider"
              min={0}
              max={50}
              step={1}
              value={[height]}
              onValueChange={(value) => setHeight(value[0])}
              className="flex-1"
            />
            <Input
              type="number"
              value={height}
              onChange={(e) => setHeight(parseFloat(e.target.value) || 0)}
              onFocus={(e) => e.target.value = ''}
              onBlur={(e) => e.target.value = height.toString()}
              className="w-20"
              step="0.1"
            />
          </div>
        </div>
        {['pitch', 'yaw', 'roll'].map((angle) => (
          <div key={angle} className="space-y-2">
            <Label htmlFor={`${angle}-slider`} className="capitalize">{angle}</Label>
            <div className="flex items-center space-x-4">
              <Slider
                id={`${angle}-slider`}
                min={-180}
                max={180}
                step={0.01}
                value={[angle === 'pitch' ? pitch : angle === 'yaw' ? yaw : roll]}
                onValueChange={(value) => {
                  if (angle === 'pitch') setPitch(value[0])
                  else if (angle === 'yaw') setYaw(value[0])
                  else setRoll(value[0])
                }}
                className="flex-1"
              />
              <Input
                type="number"
                value={angle === 'pitch' ? pitch : angle === 'yaw' ? yaw : roll}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0
                  if (angle === 'pitch') setPitch(value)
                  else if (angle === 'yaw') setYaw(value)
                  else setRoll(value)
                }}
                onFocus={(e) => e.target.value = ''}
                onBlur={(e) => {
                  const value = angle === 'pitch' ? pitch : angle === 'yaw' ? yaw : roll
                  e.target.value = value.toString()
                }}
                className="w-20"
                step="0.01"
              />
            </div>
          </div>
        ))}
        {['fx', 'fy', 'cx', 'cy'].map((param) => (
          <div key={param} className="space-y-2">
            <Label htmlFor={`${param}-slider`} className="capitalize">{param}</Label>
            <div className="flex items-center space-x-4">
              <Slider
                id={`${param}-slider`}
                min={param === 'cx' || param === 'cy' ? 0 : -5}
                max={param === 'cx' || param === 'cy' ? 2000 : 5}
                step={param === 'cx' || param === 'cy' ? 1 : 0.01}
                value={[param === 'fx' ? fx : param === 'fy' ? fy : param === 'cx' ? cx : cy]}
                onValueChange={(value) => {
                  if (param === 'fx') setFx(value[0])
                  else if (param === 'fy') setFy(value[0])
                  else if (param === 'cx') setCx(value[0])
                  else setCy(value[0])
                }}
                className="flex-1"
              />
              <Input
                type="number"
                value={param === 'fx' ? fx : param === 'fy' ? fy : param === 'cx' ? cx : cy}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0
                  if (param === 'fx') setFx(value)
                  else if (param === 'fy') setFy(value)
                  else if (param === 'cx') setCx(value)
                  else setCy(value)
                }}
                onFocus={(e) => e.target.value = ''}
                onBlur={(e) => {
                  const value = param === 'fx' ? fx : param === 'fy' ? fy : param === 'cx' ? cx : cy
                  e.target.value = value.toString()
                }}
                className="w-20"
                step={param === 'cx' || param === 'cy' ? "1" : "0.01"}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center space-x-2">
        {colorOptions.map((color) => (
          <button
            key={color}
            className={`w-8 h-8 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-black ${
              selectedColor === color ? 'ring-2 ring-offset-2 ring-offset-gray-100 ring-black' : ''
            }`}
            style={{ backgroundColor: color }}
            onClick={() => setSelectedColor(color)}
          />
        ))}
      </div>

      <div className="flex justify-center space-x-4">
        <Button onClick={handleNewImage}>
          New Image
        </Button>
        <Button
          onClick={() => {
            setIsDrawingMode(!isDrawingMode);
            setIsDrawing(!isDrawing);
            setDrawingStep(0);
            setCurrentLine(null);
            setPreviewLine(null);
          }}
          disabled={!image}
        >
          {isDrawingMode ? 'Cancel Drawing' : 'Draw Line'}
        </Button>
        <Button onClick={undo} disabled={historyIndex <= 0}>
          <Undo className="w-4 h-4 mr-2" />
          Undo
        </Button>
        <Button onClick={redo} disabled={historyIndex >= history.length - 1}>
          <Redo className="w-4 h-4 mr-2" />
          Redo
        </Button>
        <Button onClick={handleReset} disabled={!image}>
          Reset
        </Button>
        <Button onClick={handleSave} disabled={!image}>
          Save
        </Button>
      </div>
      <NumericInputModal isOpen={isModalOpen} onClose={handleModalClose} />
    </div>
  )
}

function applyPerspectiveTransform(
  imageData: ImageData,
  height: number,
  pitch: number,
  yaw: number,
  roll: number,
  fx: number,
  fy: number,
  cx: number,
  cy: number
): ImageData {
  const width = imageData.width;
  const heightImg = imageData.height;
  const inputData = imageData.data;

  const toRadians = (angle: number) => (angle * Math.PI) / 180;

  const pitchRad = toRadians(pitch);
  const yawRad = toRadians(yaw);
  const rollRad = toRadians(roll);

  const Rx = [
    [1, 0, 0],
    [0, Math.cos(pitchRad), -Math.sin(pitchRad)],
    [0, Math.sin(pitchRad), Math.cos(pitchRad)],
  ];

  const Ry = [
    [Math.cos(yawRad), 0, Math.sin(yawRad)],
    [0, 1, 0],
    [-Math.sin(yawRad), 0, Math.cos(yawRad)],
  ];

  const Rz = [
    [Math.cos(rollRad), -Math.sin(rollRad), 0],
    [Math.sin(rollRad), Math.cos(rollRad), 0],
    [0, 0, 1],
  ];

  const multiplyMatrices = (a: number[][], b: number[][]): number[][] =>
    a.map((row, i) =>
      b[0].map((_, j) => row.reduce((sum, _, k) => sum + a[i][k] * b[k][j], 0))
    );

  const R = multiplyMatrices(multiplyMatrices(Rz, Ry), Rx);

  const P = [
    [...R[0], fx],
    [...R[1], fy],
    [...R[2], height],
  ];

  const applyMatrix = (x: number, y: number): [number, number] => {
    const z = 1;
    const transformed = [
      P[0][0] * x + P[0][1] * y + P[0][2] * z + P[0][3] + cx,
      P[1][0] * x + P[1][1] * y + P[1][2] * z + P[1][3] + cy,
      P[2][0] * x + P[2][1] * y + P[2][2] * z + P[2][3],
    ];
    const w = transformed[2];
    return [transformed[0] / w, transformed[1] / w];
  };

  const outputData = new Uint8ClampedArray(inputData.length);

  for (let y = 0; y < heightImg; y++) {
    for (let x = 0; x < width; x++) {
      const [newX, newY] = applyMatrix(x, y);

      const srcIdx = (y * width + x) * 4;

      const newXInt = Math.round(newX);
      const newYInt = Math.round(newY);

      if (newXInt >= 0 && newXInt < width && newYInt >= 0 && newYInt < heightImg) {
        const dstIdx = (newYInt * width + newXInt) * 4;

        outputData[dstIdx] = inputData[srcIdx];
        outputData[dstIdx + 1] = inputData[srcIdx + 1];
        outputData[dstIdx + 2] = inputData[srcIdx + 2];
        outputData[dstIdx + 3] = inputData[srcIdx + 3];
      }
    }
  }

  return new ImageData(outputData, width, heightImg);
}

