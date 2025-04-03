'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Upload, Undo, Redo } from 'lucide-react'
import { NumericInputModal } from './numeric-input-modal'

The command:

./gradlew app:api-application:run

does the following:

    Uses the Gradle Wrapper (./gradlew)

        Ensures that the correct version of Gradle is used without requiring a global Gradle installation.

    Targets the app:api-application module

        From the folder structure in your screenshot, app is the root module, and api-application is a submodule inside it.

    Runs the run task

        This is typically used in applications built with the Gradle Application Plugin (id 'application' in build.gradle).

        It executes the main class specified in build.gradle.

Expected Outcome

If api-application is configured correctly with an application plugin, the command will:

    Compile the source code (src/main/kotlin/c0x12c.app)

    Resolve dependencies

    Execute the main entry point of the application

Potential Issues

    If application plugin is missing, run may not be available.

    If mainClassName is not defined in build.gradle, Gradle may fail to locate the entry point.

Would you like me to check if your build.gradle is configured correctly?
You said:
how to fix that: " Could not resolve com.fasterxml.jackson.dataformat:jackson-dataformat-yaml:2.17.2."
ChatGPT said:

The error "Could not resolve com.fasterxml.jackson.dataformat:jackson-dataformat-yaml:2.17.2." means that Gradle cannot find this dependency. Here’s how to fix it:
1. Check if the Dependency is Correct

Make sure your build.gradle (or build.gradle.kts if using Kotlin DSL) includes:
For Groovy DSL (build.gradle)

dependencies {
    implementation 'com.fasterxml.jackson.dataformat:jackson-dataformat-yaml:2.17.2'
}

For Kotlin DSL (build.gradle.kts)

dependencies {
    implementation("com.fasterxml.jackson.dataformat:jackson-dataformat-yaml:2.17.2")
}

2. Ensure You Have the Correct Repositories

Make sure your repositories block includes Maven Central, since Jackson libraries are hosted there:
For Groovy DSL

repositories {
    mavenCentral()
}

For Kotlin DSL

repositories {
    mavenCentral()
}

3. Refresh Dependencies

Run the following command to force Gradle to refresh dependencies:

./gradlew build --refresh-dependencies

4. Check Internet Connection & Proxy

If you are behind a firewall or using a proxy:

    Ensure Gradle can access https://repo1.maven.org/maven2/

    Try running:

    ./gradlew build --refresh-dependencies --info

    This provides more details on why Gradle is failing to resolve the dependency.

5. Manually Check Dependency Availability

Verify if the dependency exists on Maven Central:

    Open Maven Repository: Jackson Dataformat YAML

    If version 2.17.2 is not available, try using an older stable version like 2.16.1:

    implementation 'com.fasterxml.jackson.dataformat:jackson-dataformat-yaml:2.16.1'

6. Delete Cached Gradle Files

If the dependency is corrupted in Gradle's cache, delete it and re-download:

rm -rf ~/.gradle/caches
./gradlew build

7. Check for Gradle Version Compatibility

Run:

./gradlew --version

If Gradle is outdated, update it in gradle-wrapper.properties or manually update your Gradle installation.
Try these steps and let me know if the issue persists! 🚀
You said:
Error starting Micronaut server: Bean definition [c0x12c.app.controller.$UserPreferencesController$Definition$Intercepted] could not be loaded: Error instantiating bean of type  [c0x12c.database.runtime.DatabaseContext]
ChatGPT said:

Your Micronaut server fails to start because the DatabaseContext bean cannot be instantiated. Let's go step by step to diagnose and fix this.
1. Check the DatabaseContext Bean Definition

    Ensure DatabaseContext is annotated correctly:

@Singleton
class DatabaseContext {
    // Database logic here
}

If it depends on configuration properties, ensure you have:

    @Singleton
    @Requires(property = "database.url")
    class DatabaseContext(@Property(name = "database.url") val dbUrl: String) {
        init {
            println("Database URL: $dbUrl")
        }
    }

    Fix: If a required property (e.g., database.url) is missing, add it to application.yml or .env.

2. Check for Missing Dependencies

    If DatabaseContext relies on external libraries like JDBC or an ORM (Hibernate, JPA), ensure they are included in build.gradle.

For Groovy DSL (build.gradle)

dependencies {
    implementation("io.micronaut.data:micronaut-data-hibernate-jpa")
    runtimeOnly("org.postgresql:postgresql") // Change based on your database
}

For Kotlin DSL (build.gradle.kts)

dependencies {
    implementation("io.micronaut.data:micronaut-data-hibernate-jpa")
    runtimeOnly("org.postgresql:postgresql") // Adjust for your database
}

Run:

./gradlew build --refresh-dependencies

to ensure dependencies are resolved.
3. Validate Configuration (application.yml or application.properties)

Check if DatabaseContext is expecting a property that isn't set.
Example application.yml

datasources:
  default:
    url: jdbc:postgresql://localhost:5432/mydb
    driverClassName: org.postgresql.Driver
    username: user
    password: pass
    dialect: POSTGRES

Example application.properties

datasources.default.url=jdbc:postgresql://localhost:5432/mydb
datasources.default.driverClassName=org.postgresql.Driver
datasources.default.username=user
datasources.default.password=pass
datasources.default.dialect=POSTGRES

Fix: If DatabaseContext relies on datasources.default, ensure these values exist.
4. Check for Constructor Issues

    If DatabaseContext has dependencies, check if they are injectable:

    @Singleton
    class DatabaseContext(private val config: DataSource) {
        init {
            println("Database initialized: ${config.url}")
        }
    }

    If config cannot be injected, make sure DataSource is defined as a bean.

5. Run in Debug Mode

Use:

./gradlew run --debug

This will show detailed stack traces and indicate what exactly is failing.
6. Delete Gradle Cache & Restart

Try:

rm -rf ~/.gradle/caches
./gradlew clean build
./gradlew run

If a corrupted dependency or cache is causing the issue, this will fix it.
7. Check Logs for More Details

If the error persists, run:

./gradlew run --stacktrace

and share the full error output.
Try these steps and let me know if it works! 🚀

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
        pitch,
        yaw,
        roll,
        fx,
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
  pitch: number,
  yaw: number,
  roll: number,
  focalLength: number,
  principalPoint: [number, number]
): number[][] {
  // Convert degrees to radians
  const theta = (pitch * Math.PI) / 180;
  const yawRad = (yaw * Math.PI) / 180;
  const rollRad = (roll * Math.PI) / 180;
  const [cx, cy] = principalPoint;
  
  // Ma trận nội tại K
  const K = [
    [focalLength, 0, cx],
    [0, focalLength, cy],
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
  pitch: number,
  yaw: number,
  roll: number,
  focalLength: number,
): ImageData {
  const width = imageData.width;
  const height = imageData.height;
  const principalPoint: [number, number] = [width / 2, height / 2];
  // Compute homography matrix
  const H = computeBirdseyeHomography(
    pitch,
    yaw,
    roll,
    focalLength,
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

