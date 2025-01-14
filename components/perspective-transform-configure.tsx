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
}

export default function PerspectiveTransformConfigure() {
  const [imageName, setImageName] = useState<string>('')
  const [image, setImage] = useState<string | null>(null)
  const [height, setHeight] = useState<number>(25)
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
    const scaleX = rightCanvasRef.current.width / rect.width; // Tỷ lệ chiều ngang
    const scaleY = rightCanvasRef.current.height / rect.height; // Tỷ lệ chiều dọc

    const x = (e.clientX - rect.left) * scaleX; // Tọa độ X tính theo canvas nội bộ
    const y = (e.clientY - rect.top) * scaleY;  // Tọa độ Y tính theo canvas nội bộ

    console.log(`Scaled mouse position: ${x}, ${y}`);
    console.log(`Mouse position: ${x}, ${y}`);
    console.log(`Canvas size: ${rightCanvasRef.current.width}x${rightCanvasRef.current.height}`);
    console.log(`Bounding rect:`, rect);

    if (!currentLine) {
      setCurrentLine({ start: { x, y }, end: { x, y }, text: '' })
    } else {
      const newLine = { ...currentLine, end: { x, y } }
      setCurrentLine(newLine)
      setIsDrawing(false)
      // Prompt for text input
      const text = prompt('Enter text for the line:')
      if (text) {
        setLines([...lines, { ...newLine, text }])
        updateHistory([...lines, { ...newLine, text }])
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
    const scaleX = rightCanvasRef.current.width / rect.width; // Tỷ lệ chiều ngang
    const scaleY = rightCanvasRef.current.height / rect.height; // Tỷ lệ chiều dọc

    const x = (e.clientX - rect.left) * scaleX; // Tọa độ X tính theo canvas nội bộ
    const y = (e.clientY - rect.top) * scaleY;  // Tọa độ Y tính theo canvas nội bộ

    setCurrentLine({ ...currentLine, end: { x, y } })
  }

  const handleSave = () => {
    const data = {
      imageName,
      height,
      pitch,
      yaw,
      roll,
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

      // Apply perspective transform to right canvas
      const transformedImageData = applyPerspectiveTransform(rightCtx.getImageData(0, 0, img.width, img.height), height, pitch, yaw, roll)
      rightCtx.putImageData(transformedImageData, 0, 0)

      // Draw all lines
      lines.forEach(line => {
        rightCtx.beginPath()
        rightCtx.lineWidth = lineThickness
        rightCtx.moveTo(line.start.x, line.start.y)
        rightCtx.lineTo(line.end.x, line.end.y)
        rightCtx.stroke()

        // Draw the text on the line
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

      // Draw current line if exists
      if (currentLine) {
        rightCtx.beginPath()
        rightCtx.lineWidth = lineThickness
        rightCtx.moveTo(currentLine.start.x, currentLine.start.y)
        rightCtx.lineTo(currentLine.end.x, currentLine.end.y)
        rightCtx.stroke()
      }
    }
  }, [image, height, pitch, yaw, roll, lines, currentLine, lineThickness, fontSize])

  return (
    <div className="p-4 space-y-4 max-h-screen overflow-y-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Perspective Transform Configure</h2>
        <div className="text-sm font-medium">
          Image: {imageName || 'No image uploaded'}
        </div>
      </div>

      <div className="flex space-x-4">
        <div className="w-1/2 space-y-2">
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
              onChange={(e) => setHeight(Number(e.target.value))}
              className="w-20"
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
                  const value = Number(e.target.value)
                  if (angle === 'pitch') setPitch(value)
                  else if (angle === 'yaw') setYaw(value)
                  else setRoll(value)
                }}
                className="w-20"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex space-x-4">
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
        <Button onClick={handleSave} disabled={!image}>
          Save
        </Button>
      </div>

    </div>
  )
}

function applyPerspectiveTransform(
  imageData: ImageData,
  height: number,
  pitch: number,
  yaw: number,
  roll: number
): ImageData {
  const width = imageData.width;
  const heightImg = imageData.height;
  const inputData = imageData.data;

  // Chuyển đổi độ sang radian
  const toRadians = (angle: number) => (angle * Math.PI) / 180;

  const pitchRad = toRadians(pitch);
  const yawRad = toRadians(yaw);
  const rollRad = toRadians(roll);

  // Ma trận xoay quanh X (pitch)
  const Rx = [
    [1, 0, 0],
    [0, Math.cos(pitchRad), -Math.sin(pitchRad)],
    [0, Math.sin(pitchRad), Math.cos(pitchRad)],
  ];

  // Ma trận xoay quanh Y (yaw)
  const Ry = [
    [Math.cos(yawRad), 0, Math.sin(yawRad)],
    [0, 1, 0],
    [-Math.sin(yawRad), 0, Math.cos(yawRad)],
  ];

  // Ma trận xoay quanh Z (roll)
  const Rz = [
    [Math.cos(rollRad), -Math.sin(rollRad), 0],
    [Math.sin(rollRad), Math.cos(rollRad), 0],
    [0, 0, 1],
  ];

  // Tổ hợp ma trận xoay: R = Rz * Ry * Rx
  const multiplyMatrices = (a: number[][], b: number[][]): number[][] =>
    a.map((row, i) =>
      b[0].map((_, j) => row.reduce((sum, _, k) => sum + a[i][k] * b[k][j], 0))
    );

  const R = multiplyMatrices(multiplyMatrices(Rz, Ry), Rx);

  // Ma trận phối cảnh (thêm Height)
  const P = [
    [...R[0], 0],
    [...R[1], 0],
    [...R[2], height],
  ];

  // Hàm áp dụng ma trận phối cảnh vào điểm
  const applyMatrix = (x: number, y: number): [number, number] => {
    const z = 1; // Chọn z mặc định
    const transformed = [
      P[0][0] * x + P[0][1] * y + P[0][2] * z + P[0][3],
      P[1][0] * x + P[1][1] * y + P[1][2] * z + P[1][3],
      P[2][0] * x + P[2][1] * y + P[2][2] * z + P[2][3],
    ];
    const w = transformed[2];
    return [transformed[0] / w, transformed[1] / w];
  };

  // Tạo một mảng dữ liệu mới cho hình ảnh sau biến đổi
  const outputData = new Uint8ClampedArray(inputData.length);

  // Duyệt qua từng pixel trong ảnh
  for (let y = 0; y < heightImg; y++) {
    for (let x = 0; x < width; x++) {
      // Tính tọa độ mới sau khi áp dụng phối cảnh
      const [newX, newY] = applyMatrix(x, y);

      // Lấy chỉ số của pixel gốc
      const srcIdx = (y * width + x) * 4;

      // Làm tròn tọa độ mới và kiểm tra trong biên ảnh
      const newXInt = Math.round(newX);
      const newYInt = Math.round(newY);

      if (newXInt >= 0 && newXInt < width && newYInt >= 0 && newYInt < heightImg) {
        const dstIdx = (newYInt * width + newXInt) * 4;

        // Gán giá trị pixel từ ảnh gốc sang ảnh mới
        outputData[dstIdx] = inputData[srcIdx]; // R
        outputData[dstIdx + 1] = inputData[srcIdx + 1]; // G
        outputData[dstIdx + 2] = inputData[srcIdx + 2]; // B
        outputData[dstIdx + 3] = inputData[srcIdx + 3]; // A
      }
    }
  }

  // Trả về ImageData mới
  return new ImageData(outputData, width, heightImg);
}


