'use client'

import {useState, useCallback, useEffect} from 'react'
import {GoogleMap, InfoWindow, Polyline, useJsApiLoader} from '@react-google-maps/api'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Upload } from 'lucide-react'

const containerStyle = {
  width: '100%',
  height: '400px'
}

const defaultCenter = {
  lat: 0,
  lng: 0
}

// Định nghĩa kiểu cho tọa độ và dữ liệu tuyến đường
type Coordinate = { lat: number; lng: number }
type Traffic = {
  id: number
  color: string
  // traffic_color: string
  // road_color:string
  coordinates: Coordinate[]
}

interface JSONData {
  Device: string;
  side_id: string;
  camera_name: string;
  source_rtsp: string;
  port: string;
  longitude: string;
  latitude: string;
}

export default function RightPanel() {
  const [jsonData, setJsonData] = useState<JSONData | null>(null)
  const [center, setCenter] = useState(defaultCenter)
  const [lat, setLat] = useState<string>('')
  const [lng, setLng] = useState<string>('')
  const [trafficData, setTrafficData] = useState<Traffic[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null) // Lưu id được chọn
  const getRandomColor = () => {
    const random = window.crypto.getRandomValues(new Uint8Array(3)); // Tạo mảng 3 số ngẫu nhiên (RGB)
    return `#${Array.from(random).map((b) => b.toString(16).padStart(2, '0')).join('')}`;
  };



  // Tải dữ liệu từ file JSON mới
  useEffect(() => {
    fetch('current_traffic_status.json') // Đặt đường dẫn chính xác tới file JSON của bạn
      .then((res) => res.json())
      .then((data) => {
        if (data?.traffic) {
          const updatedTrafficData = data.traffic.map((traffic: Traffic) => ({
            ...traffic,
            color: getRandomColor(),
          }))
          setTrafficData(updatedTrafficData)
        }
      })
  }, [])

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
  })

  const onMapLoad = useCallback((map: google.maps.Map) => {
    // You can perform any additional setup here
  }, [])

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target?.result as string)
          setJsonData(json)
          updateMapCenter(parseFloat(json.latitude), parseFloat(json.longitude))
        } catch (error) {
          console.error('Error parsing JSON:', error)
          alert('Error parsing JSON file. Please ensure it\'s a valid JSON.')
        }
      }
      reader.readAsText(file)
    }
  }

  const updateMapCenter = (lat: number, lng: number) => {
    if (!isNaN(lat) && !isNaN(lng)) {
      setCenter({ lat, lng })
    }
  }

  return (
    <div className="p-4">
      <div className="mb-4">
        <Label htmlFor="json-upload" className="block mb-2">Upload JSON File</Label>
        <div className="flex items-center gap-2">
          <Input
            id="json-upload"
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button asChild>
            <label htmlFor="json-upload" className="cursor-pointer">
              <Upload className="w-4 h-4 mr-2" />
              Upload JSON
            </label>
          </Button>
          {jsonData && <span className="text-sm text-green-600">File uploaded successfully</span>}
        </div>
      </div>

      {jsonData && (
        <div className="mb-4 p-4 bg-gray-100 rounded-md">
          <h3 className="font-bold mb-2">Uploaded Data:</h3>
          <p><strong>Device:</strong> {jsonData.Device}</p>
          <p><strong>Side ID:</strong> {jsonData.side_id}</p>
          <p><strong>Camera Name:</strong> {jsonData.camera_name}</p>
          <p><strong>Source RTSP:</strong> {jsonData.source_rtsp}</p>
          <p><strong>Port:</strong> {jsonData.port}</p>
          <p><strong>Longitude:</strong> {jsonData.longitude}</p>
          <p><strong>Latitude:</strong> {jsonData.latitude}</p>
        </div>
      )}

      {isLoaded ? (
        <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={15}>
          {/* Render các tuyến đường từ trafficData */}
          {trafficData.map((traffic) => (
            <Polyline
              key={traffic.id}
              path={traffic.coordinates}
              options={{
                strokeColor: traffic.color, // Tạo màu ngẫu nhiên
                strokeOpacity: 0.8,
                strokeWeight: 4,
              }}
              onClick={() => setSelectedId(traffic.id)} // Xử lý chọn tuyến đường
            />
          ))}

          {/* Hiển thị InfoWindow trên tuyến đường được chọn */}
          {selectedId !== null && (
            <InfoWindow
              position={
                trafficData.find((t) => t.id === selectedId)?.coordinates[0] // Hiển thị tại điểm đầu tiên
              }
              onCloseClick={() => setSelectedId(null)}
            >
              <div>ID: {selectedId}</div>
            </InfoWindow>
          )}
        </GoogleMap>
      ) : (
        <div>Loading...</div>
      )}
    </div>
  )
}

