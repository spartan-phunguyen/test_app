'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ImageAnnotator from '@/components/image-annotator'
import RightPanel from '@/components/right-panel'
import PerspectiveTransformConfigure from '@/components/perspective-transform-configure'

export default function Page() {
  return (
    <Tabs defaultValue="roi" className="w-full h-screen flex flex-col">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="roi">ROI Configuration</TabsTrigger>
        <TabsTrigger value="perspective">Perspective Transform Configure</TabsTrigger>
      </TabsList>
      <TabsContent value="roi" className="flex-1 overflow-hidden">
        <main className="flex h-[calc(100vh-2.5rem)]">
          <div className="w-2/3 border-r border-border overflow-auto">
            <ImageAnnotator />
          </div>
          <div className="w-1/3 overflow-auto">
            <RightPanel />
          </div>
        </main>
      </TabsContent>
      <TabsContent value="perspective">
        <PerspectiveTransformConfigure />
      </TabsContent>
    </Tabs>
  )
}

