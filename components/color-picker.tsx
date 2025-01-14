import React from 'react'

interface ColorPickerProps {
  color: string
  onChange: (color: string) => void
}

const colors = [
  '#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF',
  '#8B00FF', '#FF1493', '#00FFFF', '#FF69B4', '#1E90FF'
]

export default function ColorPicker({ color, onChange }: ColorPickerProps) {
  return (
    <div className="flex items-center space-x-2">
      {colors.map((c) => (
        <button
          key={c}
          className={`w-6 h-6 rounded-full ${
            color === c ? 'ring-2 ring-offset-2 ring-primary' : ''
          }`}
          style={{ backgroundColor: c }}
          onClick={() => onChange(c)}
        />
      ))}
    </div>
  )
}

