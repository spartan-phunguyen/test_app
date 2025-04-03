'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Upload, Undo, Redo } from 'lucide-react'

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
  const [lineText, setLineText] = useState<string>('')
  const [history, setHistory] = useState<Line[][]>([[]])
  const [historyIndex, setHistoryIndex] = useState<number>(0)
  const [scaleFactor, setScaleFactor] = useState<number>(1)
  const [lineThickness, setLineThickness] = useState<number>(2)
  const [fontSize, setFontSize] = useState<number>(14)
  const [selectedColor, setSelectedColor] = useState<string>(colorOptions[0])
  const [fx, setFx] = useState<number>(1)
  const [fy, setFy] = useState<number>(1)
  const [cx, setCx] = useState<number>(0)
  const [cy, setCy] = useState<number>(0)

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
        }
        img.src = e.target?.result as string
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !rightCanvasRef.current) return

    const rect = rightCanvasRef.current.getBoundingClientRect();
    const scaleX = rightCanvasRef.current.width / rect.width;
    const scaleY = rightCanvasRef.current.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    console.log(`Scaled mouse position: ${x}, ${y}`);
    console.log(`Mouse position: ${x}, ${y}`);
    console.log(`Canvas size: ${rightCanvasRef.current.width}x${rightCanvasRef.current.height}`);
    console.log(`Bounding rect:`, rect);

    if (!currentLine) {
      setCurrentLine({ start: { x, y }, end: { x, y }, text: '', color: selectedColor })
    } else {
      const newLine = { ...currentLine, end: { x, y } }
      setCurrentLine(newLine)
      setIsDrawing(false)
      const text = prompt('Enter a number for the line:')
      if (text !== null) {
        const numericText = parseFloat(text)
        if (!isNaN(numericText)) {
          setLines([...lines, { ...newLine, text: numericText.toString() }])
          updateHistory([...lines, { ...newLine, text: numericText.toString() }])
        } else {
          alert('Please enter a valid number.')
        }
      } else {
        setLines([...lines, newLine])
        updateHistory([...lines, newLine])
      }
      setCurrentLine(null)
    }
  }

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentLine || !rightCanvasRef.current) return

    const rect = rightCanvasRef.current.getBoundingClientRect();
    const scaleX = rightCanvasRef.current.width / rect.width;
    const scaleY = rightCanvasRef.current.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    setCurrentLine({ ...currentLine, end: { x, y } })
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
    input.onchange = (e) => handleImageUpload(e as React.ChangeEvent<HTMLInputElement>)
    input.click()
  }

  const handleReset = () => {
    setHeight(0)
    setPitch(0)
    setYaw(0)
    setRoll(0)
    setFx(1)
    setFy(1)
    if (image && rightCanvasRef.current) {
      const ctx = rightCanvasRef.current.getContext('2d')
      if (ctx) {
        const img = new Image()
        img.src = image
        img.onload = () => {
          ctx.drawImage(img, 0, 0)
        }
      }
    }
  }

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
      rightCtx.drawImage(img, 0, 0)

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
        rightCtx.beginPath()
        rightCtx.strokeStyle = currentLine.color
        rightCtx.lineWidth = lineThickness
        rightCtx.moveTo(currentLine.start.x, currentLine.start.y)
        rightCtx.lineTo(currentLine.end.x, currentLine.end.y)
        rightCtx.stroke()
      }
    }
  }, [image, height, pitch, yaw, roll, fx, fy, cx, cy, lines, currentLine, lineThickness, fontSize])

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
            className="w-full border rounded-lg cursor-crosshair"
            onClick={handleCanvasClick}
            onMouseMove={handleCanvasMouseMove}
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
                step={1}
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
                className="w-20"
                step="1"
              />
            </div>
          </div>
        ))}
        <div className="space-y-2">
          <Label htmlFor="fx-slider">Fx</Label>
          <div className="flex items-center space-x-4">
            <Slider
              id="fx-slider"
              min={-3}
              max={3}
              step={0.01}
              value={[fx]}
              onValueChange={(value) => setFx(value[0])}
              className="flex-1"
            />
            <Input
              type="number"
              value={fx}
              onChange={(e) => setFx(parseFloat(e.target.value) || 0)}
              className="w-20"
              step="0.01"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="fy-slider">Fy</Label>
          <div className="flex items-center space-x-4">
            <Slider
              id="fy-slider"
              min={-3}
              max={3}
              step={0.01}
              value={[fy]}
              onValueChange={(value) => setFy(value[0])}
              className="flex-1"
            />
            <Input
              type="number"
              value={fy}
              onChange={(e) => setFy(parseFloat(e.target.value) || 0)}
              className="w-20"
              step="0.01"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="cx-slider">Cx (Translation X)</Label>
          <div className="flex items-center space-x-4">
            <Slider
              id="cx-slider"
              min={0}
              max={2000}
              step={1}
              value={[cx]}
              onValueChange={(value) => setCx(value[0])}
              className="flex-1"
            />
            <Input
              type="number"
              value={cx}
              onChange={(e) => setCx(parseFloat(e.target.value) || 0)}
              className="w-20"
              step="1"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="cy-slider">Cy (Translation Y)</Label>
          <div className="flex items-center space-x-4">
            <Slider
              id="cy-slider"
              min={0}
              max={2000}
              step={1}
              value={[cy]}
              onValueChange={(value) => setCy(value[0])}
              className="flex-1"
            />
            <Input
              type="number"
              value={cy}
              onChange={(e) => setCy(parseFloat(e.target.value) || 0)}
              className="w-20"
              step="1"
            />
          </div>
        </div>
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
        <Button onClick={() => setIsDrawing(true)} disabled={!image || isDrawing}>
          DrawLine
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

    </div>
  )
}

const invertMatrix = (matrix: number[][]): number[][] => {
  const det =
    matrix[0][0] * (matrix[1][1] * matrix[2][2] - matrix[1][2] * matrix[2][1]) -
    matrix[0][1] * (matrix[1][0] * matrix[2][2] - matrix[1][2] * matrix[2][0]) +
    matrix[0][2] * (matrix[1][0] * matrix[2][1] - matrix[1][1] * matrix[2][0]);

  if (Math.abs(det) < 1e-10) throw new Error("Matrix is not invertible");

  const inv = [
    [
      (matrix[1][1] * matrix[2][2] - matrix[1][2] * matrix[2][1]) / det,
      (matrix[0][2] * matrix[2][1] - matrix[0][1] * matrix[2][2]) / det,
      (matrix[0][1] * matrix[1][2] - matrix[0][2] * matrix[1][1]) / det,
    ],
    [
      (matrix[1][2] * matrix[2][0] - matrix[1][0] * matrix[2][2]) / det,
      (matrix[0][0] * matrix[2][2] - matrix[0][2] * matrix[2][0]) / det,
      (matrix[0][2] * matrix[1][0] - matrix[0][0] * matrix[1][2]) / det,
    ],
    [
      (matrix[1][0] * matrix[2][1] - matrix[1][1] * matrix[2][0]) / det,
      (matrix[0][1] * matrix[2][0] - matrix[0][0] * matrix[2][1]) / det,
      (matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0]) / det,
    ],
  ];
  return inv;
};


const multiplyMatrices = (a: number[][], b: number[][]): number[][] =>
  a.map((row, i) =>
    b[0].map((_, j) => row.reduce((sum, _, k) => sum + a[i][k] * b[k][j], 0))
  );

function computeBirdseyeHomography(
  cameraHeight: number,
  pitch: number,
  yaw: number,
  roll: number,
  fx: number,
  fy: number,
  principalPoint: [number, number]
): number[][] {
  // Convert degrees to radians
  const theta = (pitch * Math.PI) / 180;
  const yawRad = (yaw * Math.PI) / 180;
  const rollRad = (roll * Math.PI) / 180;
  const [cx, cy] = principalPoint;
  
  // Ma trận nội tại K
  const K = [
    [fx, 0, cx],
    [0, fx, cy],
    [0, 0, 1]
  ];

  // Ma trận xoay R (chỉ xoay theo góc tilt)
  const Rx = [
    [1, 0, 0],
    [0, Math.cos(theta), -Math.sin(theta)],
    [0, Math.sin(theta), Math.cos(theta)]
  ];

  const Ry = [
    [Math.cos(yawRad), 0, Math.sin(yawRad)],
    [0, 1, 0],
    [-Math.sin(yawRad), 0, Math.cos(yawRad)]
  ];

  const Rz = [
    [Math.cos(rollRad), -Math.sin(rollRad), 0],
    [Math.sin(rollRad), Math.cos(rollRad), 0],
    [0, 0, 1],
  ];

  // Tính H = K * R * K^(-1)
  const K_inv = invertMatrix(K);
  const R = multiplyMatrices(Rz, multiplyMatrices(Ry, Rx));
  const KR = multiplyMatrices(K, R);
  const H = multiplyMatrices(KR, K_inv);

  return H;
}

function getTransformedBounds(
  width: number, 
  height: number, 
  H: number[][]
): {newWidth: number; newHeight: number; adjustedH: number[][]} {
  const corners = [
    [0, 0, 1],
    [width, 0, 1],
    [0, height, 1],
    [width, height, 1]
  ];

  // Transform corners
  const transformedPoints = corners.map(point => {
    const transformed = multiplyMatrices(H, [[point[0]], [point[1]], [point[2]]]);
    return [
      transformed[0][0] / transformed[2][0],
      transformed[1][0] / transformed[2][0]
    ];
  });

  // Find bounds
  const xCoords = transformedPoints.map(p => p[0]);
  const yCoords = transformedPoints.map(p => p[1]);
  const xMin = Math.min(...xCoords);
  const xMax = Math.max(...xCoords);
  const yMin = Math.min(...yCoords);
  const yMax = Math.max(...yCoords);

  // Calculate new dimensions
  const newWidth = Math.ceil(xMax - xMin);
  const newHeight = Math.ceil(yMax - yMin);

  // Translation matrix to adjust coordinates
  const translationMatrix = [
    [1, 0, -xMin],
    [0, 1, -yMin],
    [0, 0, 1]
  ];

  const adjustedH = multiplyMatrices(translationMatrix, H);

  return { newWidth, newHeight, adjustedH };
}

function applyPerspectiveTransform(
  imageData: ImageData,
  cameraHeight: number,
  pitch: number,
  yaw: number,
  roll: number,
  fx: number,
  fy: number,
  cx: number,
  cy: number
): ImageData {
  const width = imageData.width;
  const height = imageData.height;
  const principalPoint: [number, number] = [width / 2, height / 2];

  // Compute homography matrix
  const H = computeBirdseyeHomography(
    cameraHeight,
    pitch,
    yaw,
    roll,
    fx,
    fy,
    principalPoint
  );

  // Get transformed bounds
  const { newWidth, newHeight, adjustedH } = getTransformedBounds(width, height, H);
  console.log(newWidth, newHeight);
  // Create output buffer
  const outputData = new Uint8ClampedArray(newWidth * newHeight * 4);
  const inputData = imageData.data;

  // Warp perspective
  for (let y = 0; y < newHeight; y++) {
    for (let x = 0; x < newWidth; x++) {
      const H_inv = invertMatrix(adjustedH);
      const srcPoint = multiplyMatrices(H_inv, [[x], [y], [1]]);
      
      const srcX = Math.round(srcPoint[0][0] / srcPoint[2][0]);
      const srcY = Math.round(srcPoint[1][0] / srcPoint[2][0]);

      if (srcX >= 0 && srcX < width && srcY >= 0 && srcY < height) {
        const srcIdx = (srcY * width + srcX) * 4;
        const dstIdx = (y * newWidth + x) * 4;
        outputData[dstIdx] = inputData[srcIdx];
        outputData[dstIdx + 1] = inputData[srcIdx + 1];
        outputData[dstIdx + 2] = inputData[srcIdx + 2];
        outputData[dstIdx + 3] = inputData[srcIdx + 3];
      }
    }
  }
    

  return new ImageData(outputData, newWidth, newHeight);
}

