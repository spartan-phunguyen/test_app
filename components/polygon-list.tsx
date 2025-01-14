import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, X } from 'lucide-react'

interface Polygon {
  id: string
  points: Array<{ x: number; y: number }>
  color: string
  fields: string[]
  thickness: number
  fontSize: number
}

interface PolygonListProps {
  polygons: Polygon[]
  setPolygons: (polygons: Polygon[]) => void
}

export default function PolygonList({ polygons, setPolygons }: PolygonListProps) {
  const addField = (polygonId: string) => {
    setPolygons(
      polygons.map(p =>
        p.id === polygonId
          ? { ...p, fields: [...p.fields, ''] }
          : p
      )
    )
  }

  const updateField = (polygonId: string, index: number, value: string) => {
    setPolygons(
      polygons.map(p =>
        p.id === polygonId
          ? { ...p, fields: p.fields.map((f, i) => i === index ? value : f) }
          : p
      )
    )
  }

  const removeField = (polygonId: string, index: number) => {
    setPolygons(
      polygons.map(p =>
        p.id === polygonId
          ? { ...p, fields: p.fields.filter((_, i) => i !== index) }
          : p
      )
    )
  }

  return (
    <div className="space-y-4">
      {polygons.map((polygon) => (
        <div
          key={polygon.id}
          className="flex items-center gap-4 p-2 rounded-lg"
          style={{ backgroundColor: `${polygon.color}11` }}
        >
          <div className="font-medium bg-white text-black px-2 py-1 rounded">
            {polygon.id}
          </div>
          <div className="flex-1 flex items-center gap-2 overflow-x-auto">
            {polygon.fields.map((field, index) => (
              <div key={index} className="flex items-center gap-1">
                <Input
                  value={field}
                  onChange={(e) => updateField(polygon.id, index, e.target.value)}
                  className="w-24"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => removeField(polygon.id, index)}
                  className="border border-gray-300 rounded-md"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="icon"
              onClick={() => addField(polygon.id)}
              className="border border-gray-300 rounded-md"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}

