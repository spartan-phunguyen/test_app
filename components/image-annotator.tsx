'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import ColorPicker from './color-picker'
import PolygonList from './polygon-list'
import { Undo, Redo, Type, Upload, RefreshCw } from 'lucide-react'

interface Point {
  x: number
  y: number
}

interface Polygon {
  id: string
  points: Point[]
  color: string
  fields: string[]
  thickness: number
  fontSize: number
}

// function getContrastColor(hexcolor: string): string {
//   const r = parseInt(hexcolor.slice(1, 3), 16)
//   const g = parseInt(hexcolor.slice(3, 5), 16)
//   const b = parseInt(hexcolor.slice(5, 7), 16)
//   const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000
//   return (yiq >= 128) ? 'black' : 'white'
// }

export default function ImageAnnotator() {
  const [image, setImage] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [isDrawing, setIsDrawing] = useState(false)
  const [selectedColor, setSelectedColor] = useState('#FF0000')
  const [currentPolygon, setCurrentPolygon] = useState<Point[]>([])
  const [polygons, setPolygons] = useState<Polygon[]>([])
  const [mousePosition, setMousePosition] = useState<Point | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [history, setHistory] = useState<Polygon[][]>([[]])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [lineThickness, setLineThickness] = useState(2)
  const [fontSize, setFontSize] = useState(16)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setImage(e.target?.result as string)
        setTitle(file.name)
      }
      reader.readAsDataURL(file)
    }
  }

  const getCanvasPoint = (e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const img = new Image();
    img.src = image ?? '';

    const scale = Math.min(rect.width / canvas.width, rect.height / canvas.height);
    const imageWidth = canvas.width * scale;
    const imageHeight = canvas.height * scale;

    const offsetX = (rect.width - imageWidth) / 2;
    const offsetY = (rect.height - imageHeight) / 2;

    const x = (e.clientX - rect.left - offsetX) / scale;
    const y = (e.clientY - rect.top - offsetY) / scale;
    return { x, y };
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const point = getCanvasPoint(e)
    console.log('Mouse Position:', {
      clientX: e.clientX,
      clientY: e.clientY,
    });
    console.log('Canvas Position:', point);

    if (currentPolygon.length === 0) {
      setCurrentPolygon([point])
    } else if (currentPolygon.length > 2) {
      const firstPoint = currentPolygon[0]
      const distance = Math.hypot(point.x - firstPoint.x, point.y - firstPoint.y)

      if (distance < 20) {
        completePolygon()
      } else {
        setCurrentPolygon(prev => [...prev, point])
      }
    } else {
      setCurrentPolygon(prev => [...prev, point])
    }
  }

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    setMousePosition(getCanvasPoint(e))
  }

  const handleCanvasMouseLeave = () => {
    setMousePosition(null)
  }

  const completePolygon = () => {
    if (currentPolygon.length > 2) {
      const newPolygon: Polygon = {
        id: `ID${polygons.length + 1}`,
        points: currentPolygon,
        color: selectedColor,
        fields: [''],
        thickness: lineThickness,
        fontSize: fontSize
      }
      const newPolygons = [...polygons, newPolygon]
      setPolygons(newPolygons)
      updateHistory(newPolygons)
      setCurrentPolygon([])
      setIsDrawing(false)
      changeColor()
    }
  }

  const changeColor = () => {
    const colors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#8B00FF', '#FF1493', '#00FFFF', '#FF69B4', '#1E90FF']
    const currentIndex = colors.indexOf(selectedColor)
    const nextIndex = (currentIndex + 1) % colors.length
    setSelectedColor(colors[nextIndex])
  }

  const updateHistory = (newPolygons: Polygon[]) => {
    const newHistory = history.slice(0, historyIndex + 1).concat([newPolygons])
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  const startDrawing = () => {
    setIsDrawing(true)
    setCurrentPolygon([])
  }

  const cancelDrawing = () => {
    setIsDrawing(false)
    setCurrentPolygon([])
  }

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      setPolygons(history[historyIndex - 1])
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      setPolygons(history[historyIndex + 1])
    }
  }

  const handleNewImage = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setImage(e.target?.result as string)
          setTitle(file.name)
          setPolygons([])
          setHistory([[]])
          setHistoryIndex(0)
        }
        reader.readAsDataURL(file)
      }
    }
    input.click()
  }

  const handleReset = () => {
    setPolygons([])
    setHistory([[]])
    setHistoryIndex(0)
  }

  const handleSave = () => {
    const jsonData = polygons.map(polygon => ({
      Polygon_id: polygon.id,
      Polygon_coordinates: polygon.points.map(point => ({
        x: point.x,
        y: point.y,
      })),
      Road_segment_id: polygon.fields,
    }));

    console.log('Saved Data:', JSON.stringify(jsonData, null, 2));

    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const imageName = title.split('.').slice(0, -1).join('.') || 'untitled';
    link.download = `ROI_${imageName}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !image) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = image
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)

      polygons.forEach(polygon => {
        ctx.beginPath()
        ctx.strokeStyle = polygon.color
        ctx.fillStyle = `${polygon.color}33`
        ctx.lineWidth = polygon.thickness

        polygon.points.forEach((point, i) => {
          if (i === 0) ctx.moveTo(point.x, point.y)
          else ctx.lineTo(point.x, point.y)
        })

        ctx.fill()
        ctx.stroke()

        const center = getPolygonCenter(polygon.points)

        // Draw white background for text
        ctx.fillStyle = 'white'
        ctx.fillRect(center.x - 40, center.y - polygon.fontSize / 2 - 5, 80, polygon.fontSize + 10)

        // Draw ID text
        ctx.fillStyle = 'black'
        ctx.font = `${polygon.fontSize}px Arial`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(polygon.id, center.x, center.y)
      })

      if (currentPolygon.length > 0) {
        ctx.beginPath()
        ctx.strokeStyle = selectedColor
        ctx.lineWidth = lineThickness

        currentPolygon.forEach((point, i) => {
          if (i === 0) ctx.moveTo(point.x, point.y)
          else ctx.lineTo(point.x, point.y)
        })

        if (mousePosition && currentPolygon.length > 0) {
          const lastPoint = currentPolygon[currentPolygon.length - 1]
          ctx.moveTo(lastPoint.x, lastPoint.y)
          ctx.lineTo(mousePosition.x, mousePosition.y)
        }

        ctx.stroke()

        currentPolygon.forEach((point, index) => {
          ctx.beginPath()
          ctx.fillStyle = index === 0 ? '#00FF00' : selectedColor
          ctx.arc(point.x, point.y, 4, 0, Math.PI * 2)
          ctx.fill()
        })

        if (mousePosition && currentPolygon.length > 2) {
          const firstPoint = currentPolygon[0]
          const distance = Math.hypot(
            mousePosition.x - firstPoint.x,
            mousePosition.y - firstPoint.y
          )

          if (distance < 20) {
            ctx.beginPath()
            ctx.strokeStyle = selectedColor
            ctx.setLineDash([5, 5])
            ctx.arc(firstPoint.x, firstPoint.y, 20, 0, Math.PI * 2)
            ctx.stroke()
            ctx.setLineDash([])
          }
        }
      }
    }
  }, [image, polygons, currentPolygon, mousePosition, selectedColor, lineThickness, fontSize])

  return (
    <div className="flex flex-col min-h-full">
      <div className="p-4 border-b border-border">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Image Title"
          className="text-lg font-medium"
        />
      </div>

      <div className="relative flex-1">
        {!image ? (
          <label className="flex items-center justify-center w-full h-full border-2 border-dashed border-border rounded-lg cursor-pointer">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Click or drag image to upload</p>
            </div>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleImageUpload}
            />
          </label>
        ) : (
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            onMouseMove={handleCanvasMouseMove}
            onMouseLeave={handleCanvasMouseLeave}
            className="w-full h-full object-contain"
          />
        )}
      </div>

      <div className="p-4 border-t border-border">
        <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
          <Button
            variant={isDrawing ? "secondary" : "outline"}
            onClick={isDrawing ? cancelDrawing : startDrawing}
          >
            {isDrawing ? 'Cancel' : 'Draw'}
          </Button>
          <Button variant="outline" onClick={handleNewImage}>
            <Upload className="w-4 h-4 mr-2" />
            New
          </Button>
          <Button variant="outline" onClick={handleReset}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          {isDrawing && (
            <Button
              variant="outline"
              onClick={completePolygon}
              disabled={currentPolygon.length < 3}
            >
              Complete Polygon
            </Button>
          )}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={undo}
              disabled={historyIndex <= 0}
            >
              <Undo className="w-4 h-4 mr-2" />
              Undo
            </Button>
            <Button
              variant="outline"
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
            >
              <Redo className="w-4 h-4 mr-2" />
              Redo
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">Thickness:</span>
            <Slider
              value={[lineThickness]}
              onValueChange={(value) => setLineThickness(value[0])}
              min={1}
              max={10}
              step={1}
              className="w-32"
            />
          </div>
          <div className="flex items-center gap-2">
            <Type className="w-4 h-4" />
            <Slider
              value={[fontSize]}
              onValueChange={(value) => setFontSize(value[0])}
              min={12}
              max={24}
              step={1}
              className="w-32"
            />
          </div>
          <ColorPicker
            color={selectedColor}
            onChange={setSelectedColor}
          />
        </div>

        <div>
          <PolygonList polygons={polygons} setPolygons={setPolygons} />
          <div className="mt-4 flex justify-end">
            <Button onClick={handleSave} disabled={!image}>
              Done
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function getPolygonCenter(points: Array<{ x: number; y: number }>) {
  const x = points.reduce((sum, p) => sum + p.x, 0) / points.length
  const y = points.reduce((sum, p) => sum + p.y, 0) / points.length
  return { x, y }
}

