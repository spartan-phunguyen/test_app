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

function getTransformedBounds(
  width: number,
  height: number,
  H: number[][]
): { newWidth: number; newHeight: number; adjustedH: number[][] } {
  // Tạo các góc của ảnh
  const corners = [
    [0, 0, 1],
    [width, 0, 1],
    [0, height, 1],
    [width, height, 1]
  ];

  // Transform các góc
  const transformedCorners = corners.map(point => {
    const transformed = H.map(row =>
      point.reduce((sum, val, i) => sum + row[i] * val, 0)
    );
    // Normalize
    return [
      transformed[0] / transformed[2],
      transformed[1] / transformed[2]
    ];
  });

  // Tìm bounds
  const xCoords = transformedCorners.map(p => p[0]);
  const yCoords = transformedCorners.map(p => p[1]);
  const xMin = Math.min(...xCoords);
  const xMax = Math.max(...xCoords);
  const yMin = Math.min(...yCoords);
  const yMax = Math.max(...yCoords);

  // Tính kích thước mới
  const newWidth = Math.ceil(xMax - xMin);
  const newHeight = Math.ceil(yMax - yMin);

  // Ma trận dịch chuyển
  const translationMatrix = [
    [1, 0, -xMin],
    [0, 1, -yMin],
    [0, 0, 1]
  ];

  // Tính adjusted H
  const adjustedH = multiplyMatrices(translationMatrix, H);

  return { newWidth, newHeight, adjustedH };
}

function cropOrResize(
  imageData: ImageData,
  maxWidth: number,
  maxHeight: number
): ImageData {
  const width = imageData.width;
  const height = imageData.height;
  const scale = Math.min(maxWidth / width, maxHeight / height);

  if (scale < 1) {
    // Resize image
    const newWidth = Math.floor(width * scale);
    const newHeight = Math.floor(height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = newWidth;
    canvas.height = newHeight;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) throw new Error('Could not get canvas context');
    
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    
    if (!tempCtx) throw new Error('Could not get temp canvas context');
    
    // Put original image data
    tempCtx.putImageData(imageData, 0, 0);
    
    // Draw scaled version
    ctx.drawImage(tempCanvas, 0, 0, width, height, 0, 0, newWidth, newHeight);
    
    return ctx.getImageData(0, 0, newWidth, newHeight);
  }

  return imageData;
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

  // Tính điểm chính (principal point)
  // const cx = width / 2;
  // const cy = heightImg / 2;

  // 1. Ma trận nội tại K (Intrinsic Matrix)
  const K = [
    [fx, 0, cx],
    [0, fy, cy],
    [0, 0, 1]
  ];

  // Convert degrees to radians
  const toRadians = (angle: number) => (angle * Math.PI) / 180;
  const pitchRad = toRadians(pitch);
  const yawRad = toRadians(yaw);
  const rollRad = toRadians(roll);

  // 2. Các ma trận xoay
  const Rx = [
    [1, 0, 0],
    [0, Math.cos(pitchRad), -Math.sin(pitchRad)],
    [0, Math.sin(pitchRad), Math.cos(pitchRad)]
  ];

  const Ry = [
    [Math.cos(yawRad), 0, Math.sin(yawRad)],
    [0, 1, 0],
    [-Math.sin(yawRad), 0, Math.cos(yawRad)]
  ];

  const Rz = [
    [Math.cos(rollRad), -Math.sin(rollRad), 0],
    [Math.sin(rollRad), Math.cos(rollRad), 0],
    [0, 0, 1]
  ];

  // Thay đổi thứ tự nhân ma trận: R = Ry * Rx * Rz

  // const R = multiplyMatrices(multiplyMatrices(Rz, Ry), Rx);

  const R = multiplyMatrices(multiplyMatrices(Rz, Ry), Rx);

  // 3. Tính H = K * R * K^(-1)
  const K_inv = invertMatrix(K);
  const KR = multiplyMatrices(K, R);
  const H = multiplyMatrices(KR, K_inv);

    // const R = multiplyMatrices(Ry,Rx);

  // Scale height theo kích thước ảnh
  // const scale = Math.max(width, heightImg) / 100;
  
  // 3. Vector dịch chuyển T với height được scale
  // const T = [0, -height, 0];
  // const T = [0, 0, height];

  // 4. Tạo ma trận ngoại tại [R|T]

  // const K_inv = invertMatrix(K);

  // 5. Tính ma trận Perspective Transform P = K * [R|T]
  // const P = multiplyMatrices(K, RT);
  // const KR = multiplyMatrices(K, R);
  // const P = multiplyMatrices(KR, K_inv);


  // 4. Get transformed bounds
  const { newWidth, newHeight, adjustedH } = getTransformedBounds(width, heightImg, H);

  // 5. Tạo output buffer với kích thước mới
  const outputData = new Uint8ClampedArray(newWidth * newHeight * 4);

  // 6. Warp perspective với adjusted H
  for (let y = 0; y < newHeight; y++) {
    for (let x = 0; x < newWidth; x++) {
      // Tính điểm nguồn bằng ma trận nghịch đảo của adjusted H
      const H_inv = invertMatrix(adjustedH);
      const srcPoint = multiplyMatrices(H_inv, [[x], [y], [1]]);
      
      // Normalize tọa độ nguồn
      const srcX = Math.round(srcPoint[0][0] / srcPoint[2][0]);
      const srcY = Math.round(srcPoint[1][0] / srcPoint[2][0]);

      // Copy pixel nếu nằm trong bounds
      if (srcX >= 0 && srcX < width && srcY >= 0 && srcY < heightImg) {
        const srcIdx = (srcY * width + srcX) * 4;
        const dstIdx = (y * newWidth + x) * 4;
        outputData[dstIdx] = inputData[srcIdx];
        outputData[dstIdx + 1] = inputData[srcIdx + 1];
        outputData[dstIdx + 2] = inputData[srcIdx + 2];
        outputData[dstIdx + 3] = inputData[srcIdx + 3];
      }
    }
  }

  // 7. Tạo ImageData với kích thước mới
  let result = new ImageData(outputData, newWidth, newHeight);

  // 8. Crop hoặc resize để fit màn hình
  const maxWidth = 1080;  // Có thể điều chỉnh
  const maxHeight = 720;  // Có thể điều chỉnh
  result = cropOrResize(result, maxWidth, maxHeight);

  return result;
}

