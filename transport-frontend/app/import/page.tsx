'use client'

import { useState, useRef } from 'react'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react'

interface ImportResult {
  success: boolean
  inserted: number
  duplicates: { staffNumber: string; date: string; shift: string; name: string }[]
}

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null
    setFile(selected)
    setResult(null)
    setError(null)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const dropped = e.dataTransfer.files[0]
    if (dropped && dropped.name.endsWith('.xlsx')) {
      setFile(dropped)
      setResult(null)
      setError(null)
    }
  }

  const handleSubmit = async () => {
    if (!file) return
    setLoading(true)
    setError(null)
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/import-bookings', { method: 'POST', body: formData })
      const data: ImportResult = await res.json()
      if (!res.ok) throw new Error((data as { message?: string }).message ?? 'Import failed')
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        {/* Drop zone */}
        <Card
          className="border-2 border-dashed border-slate-200 hover:border-primary/50 transition-colors cursor-pointer"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              {file ? (
                <FileSpreadsheet className="w-8 h-8 text-primary" />
              ) : (
                <Upload className="w-8 h-8 text-primary" />
              )}
            </div>
            {file ? (
              <div className="text-center">
                <p className="font-semibold text-slate-900">{file.name}</p>
                <p className="text-sm text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <div className="text-center">
                <p className="font-semibold text-slate-900">Drop your Excel file here</p>
                <p className="text-sm text-slate-500">or click to browse — .xlsx only</p>
              </div>
            )}
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={handleFileChange}
            />
          </CardContent>
        </Card>

        <Button
          onClick={handleSubmit}
          disabled={!file || loading}
          size="lg"
          className="w-full gap-2 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
        >
          {loading ? <Spinner className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
          {loading ? 'Importing...' : 'Import Bookings'}
        </Button>

        {/* Error */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success result */}
        {result && (
          <div className="space-y-4">
            <Alert className="bg-green-50 border-green-200 text-green-900">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Successfully imported <strong>{result.inserted}</strong> booking{result.inserted !== 1 ? 's' : ''}.
                {result.duplicates.length > 0 && ` ${result.duplicates.length} duplicate(s) skipped.`}
              </AlertDescription>
            </Alert>

            {result.duplicates.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm font-semibold text-slate-700 mb-3">Skipped duplicates</p>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {result.duplicates.map((d, i) => (
                      <div key={i} className="text-sm text-slate-600 flex gap-2 py-1 border-b border-slate-100 last:border-0">
                        <span className="font-medium">{d.name}</span>
                        <span className="text-slate-400">·</span>
                        <span>{d.staffNumber}</span>
                        <span className="text-slate-400">·</span>
                        <span>{d.shift}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Column mapping reference */}
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-semibold text-slate-700 mb-3">Expected Excel columns</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {[
                ['Name', 'name'],
                ['Staff Number', 'staffNumber'],
                ['Phone Number', 'phoneNumber'],
                ['Location', 'location'],
                ['Route', 'route'],
                ['Pickup/Dropoff time', 'shift'],
                ['Pickup/Dropoff date', 'date'],
                ['Address', 'address'],
                ['Process', 'process'],
              ].map(([form, model]) => (
                <div key={model} className="flex gap-2">
                  <span className="text-slate-500">{form}</span>
                  <span className="text-slate-300">→</span>
                  <span className="font-mono text-primary text-xs">{model}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
