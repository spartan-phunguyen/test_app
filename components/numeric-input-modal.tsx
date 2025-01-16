import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface NumericInputModalProps {
  isOpen: boolean
  onClose: (value: number | null) => void
}

export function NumericInputModal({ isOpen, onClose }: NumericInputModalProps) {
  const [inputValue, setInputValue] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setInputValue('')
      setError(null)
    }
  }, [isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const numericValue = parseFloat(inputValue)
    if (!isNaN(numericValue)) {
      onClose(numericValue)
    } else {
      setError('Please enter a valid number')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold mb-4">Enter a number for the line</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <Label htmlFor="lineNumber" className="block mb-2">
              Line Number
            </Label>
            <Input
              id="lineNumber"
              type="text"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value)
                setError(null)
              }}
              className={error ? 'border-red-500' : ''}
              autoFocus
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
          <div className="flex justify-end">
            <Button type="submit">Submit</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

