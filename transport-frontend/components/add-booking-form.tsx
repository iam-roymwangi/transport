'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/spinner'
import { Plus, MapPin, Navigation, ExternalLink, Compass } from 'lucide-react'
import { FieldGroup, FieldLabel } from '@/components/ui/field'
import { Badge } from '@/components/ui/badge'
import {
  LOCATIONS,
  ROUTES,
  PROCESSES,
  STAFF_ROLES,
  StaffRole,
  DEFAULT_ROLE_SHIFTS,
  ROLE_INFO,
} from '@/lib/booking-options'
import { extractCoordinates, buildGoogleMapsUrl, calculateDistanceToHub } from '@/lib/googleMaps'
import { getSystemStatus } from '@/app/admin/settings-actions'

export interface BookingInitialData {
  name?: string
  bmsNumber?: string
  staffNumber?: string
  phoneNumber?: string
  role?: string
  location?: string
  route?: string
  routes?: string[]
  address?: string
  pinLocation?: string
  latitude?: number | null
  longitude?: number | null
  googleMapsUrl?: string
  currentShift?: string
}

function RequiredLabel({ children }: { children: React.ReactNode }) {
  return <FieldLabel>{children} <span className="text-red-500">*</span></FieldLabel>
}

function BookingFormBody({
  onClose,
  onBookingAdded,
  initialData,
}: {
  onClose: () => void
  onBookingAdded?: () => void
  initialData?: BookingInitialData
}) {
  const [loading, setLoading] = useState(false)
  const [geoLocating, setGeoLocating] = useState(false)

  const initialRole = (initialData?.role as StaffRole) || 'Agent'
  const initialRoutes = initialData?.routes || (initialData?.route ? initialData.route.split(',').map((r) => r.trim()) : [])

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    bmsNumber: initialData?.bmsNumber || '',
    staffNumber: initialData?.staffNumber || '',
    phoneNumber: initialData?.phoneNumber || '',
    role: initialRole,
    location: initialData?.location || '',
    routes: initialRoutes,
    shift: initialData?.currentShift || '17:00 - 02:00',
    date: new Date().toISOString().split('T')[0],
    address: initialData?.address || '',
    process: '',
    pinLocation: initialData?.pinLocation || '',
    latitude: initialData?.latitude?.toString() || '',
    longitude: initialData?.longitude?.toString() || '',
    googleMapsUrl: initialData?.googleMapsUrl || '',
  })

  // Get shifts list for the currently selected role
  const roleShifts = DEFAULT_ROLE_SHIFTS[formData.role as StaffRole] || DEFAULT_ROLE_SHIFTS.Agent

  // Update URL if lat/lng are entered manually
  const handleCoordChange = (latVal: string, lngVal: string) => {
    setFormData((prev) => {
      const lat = parseFloat(latVal)
      const lng = parseFloat(lngVal)
      let url = prev.googleMapsUrl
      let pin = prev.pinLocation
      if (!isNaN(lat) && !isNaN(lng)) {
        url = buildGoogleMapsUrl(lat, lng)
        pin = `${lat.toFixed(6)}, ${lng.toFixed(6)}`
      }
      return { ...prev, latitude: latVal, longitude: lngVal, googleMapsUrl: url, pinLocation: pin }
    })
  }

  // Handle Google Maps URL paste & auto extract coordinates
  const handleMapsUrlChange = (url: string) => {
    const coords = extractCoordinates(url)
    setFormData((prev) => ({
      ...prev,
      googleMapsUrl: url,
      latitude: coords ? coords.latitude.toString() : prev.latitude,
      longitude: coords ? coords.longitude.toString() : prev.longitude,
      pinLocation: coords ? `${coords.latitude}, ${coords.longitude}` : prev.pinLocation,
    }))
    if (coords) {
      toast.success(`Coordinates extracted: ${coords.latitude}, ${coords.longitude}`)
    }
  }

  // GPS geolocation button
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser')
      return
    }
    setGeoLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(6))
        const lng = parseFloat(pos.coords.longitude.toFixed(6))
        const mapsUrl = buildGoogleMapsUrl(lat, lng)
        const pin = `${lat}, ${lng}`
        setFormData((prev) => ({
          ...prev,
          latitude: lat.toString(),
          longitude: lng.toString(),
          pinLocation: pin,
          googleMapsUrl: mapsUrl,
        }))
        setGeoLocating(false)
        toast.success('Current location detected successfully!')
      },
      (err) => {
        setGeoLocating(false)
        toast.error('Could not get GPS location. Please check browser permissions.')
      },
      { timeout: 10000, enableHighAccuracy: true }
    )
  }

  // Distance estimation to chosen hub
  const distanceInfo =
    formData.latitude && formData.longitude && formData.location
      ? calculateDistanceToHub(
          {
            latitude: parseFloat(formData.latitude),
            longitude: parseFloat(formData.longitude),
          },
          formData.location
        )
      : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.location) { toast.error('Please select a destination/pickup location.'); return }
    if (formData.routes.length === 0) { toast.error('Please select at least one route.'); return }
    if (!formData.shift) { toast.error('Please select a shift.'); return }
    if (!formData.process) { toast.error('Please select a process.'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          route: formData.routes.join(', '),
          latitude: formData.latitude ? parseFloat(formData.latitude) : null,
          longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        }),
      })
      if (res.status === 403) {
        toast.error('Bookings are currently closed by the administrator.')
        return
      }
      if (res.status === 409) {
        toast.warning('Duplicate booking — this staff member already has a booking for this shift on this date.')
        return
      }
      if (!res.ok) throw new Error()
      toast.success('Booking confirmed successfully.')
      onClose()
      onBookingAdded?.()
    } catch {
      toast.error('Failed to add booking. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Personal & Role Information */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-900">Personal &amp; Role Details</h3>
          <Badge variant="outline" className={ROLE_INFO[formData.role as StaffRole]?.badgeColor || ''}>
            {formData.role}
          </Badge>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FieldGroup>
            <RequiredLabel>Full Name</RequiredLabel>
            <Input placeholder="First Name Last Name" value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })} required disabled={loading} />
          </FieldGroup>
          <FieldGroup>
            <RequiredLabel>BMS Number (7-Digit)</RequiredLabel>
            <Input placeholder="e.g. 6142719" value={formData.bmsNumber}
              maxLength={7}
              onChange={(e) => setFormData({ ...formData, bmsNumber: e.target.value })} required disabled={loading} />
          </FieldGroup>
          <FieldGroup>
            <RequiredLabel>Role</RequiredLabel>
            <Select
              value={formData.role}
              onValueChange={(val: StaffRole) => setFormData({ ...formData, role: val })}
              disabled={loading}
            >
              <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
              <SelectContent>
                {STAFF_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r} — {ROLE_INFO[r]?.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldGroup>
          <FieldGroup>
            <RequiredLabel>Phone Number</RequiredLabel>
            <Input type="tel" placeholder="0712345678" value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })} required disabled={loading} />
          </FieldGroup>
          <FieldGroup className="sm:col-span-2">
            <RequiredLabel>Date</RequiredLabel>
            <Input type="date" value={formData.date} min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })} required disabled={loading} />
          </FieldGroup>
        </div>
      </div>

      {/* Shift & Process Details */}
      <div>
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Shift &amp; Project Process</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FieldGroup>
            <RequiredLabel>Shift for {formData.role}</RequiredLabel>
            <Select value={formData.shift} onValueChange={(v) => setFormData({ ...formData, shift: v })} disabled={loading}>
              <SelectTrigger><SelectValue placeholder="Select shift" /></SelectTrigger>
              <SelectContent>
                {roleShifts.map((s) => (
                  <SelectItem key={s.shift} value={s.shift}>
                    {s.shift} {s.isOvernight ? '🌙 (Overnight)' : ''} — {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldGroup>
          <FieldGroup>
            <RequiredLabel>Process</RequiredLabel>
            <Select value={formData.process} onValueChange={(v) => setFormData({ ...formData, process: v })} disabled={loading}>
              <SelectTrigger><SelectValue placeholder="Select process" /></SelectTrigger>
              <SelectContent>{PROCESSES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
            </Select>
          </FieldGroup>
        </div>
      </div>

      {/* Shared Transport Details */}
      <div className="rounded-xl border p-4 bg-slate-50/50 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-slate-900">Shared Transport &amp; Destination Details</h3>
          </div>
          <span className="text-xs text-muted-foreground">Used for route planning &amp; Google Maps distance</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FieldGroup>
            <RequiredLabel>Pickup / Destination Hub</RequiredLabel>
            <Select value={formData.location} onValueChange={(v) => setFormData({ ...formData, location: v })} disabled={loading}>
              <SelectTrigger><SelectValue placeholder="Select hub location" /></SelectTrigger>
              <SelectContent>{LOCATIONS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
            </Select>
          </FieldGroup>

          <FieldGroup>
            <RequiredLabel>Address / Landmark</RequiredLabel>
            <Input
              placeholder="e.g. Roysambu Lumumba Dr, Nairobi"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
              disabled={loading}
            />
          </FieldGroup>
        </div>

        <FieldGroup>
          <RequiredLabel>
            Route{formData.routes.length > 0 && (
              <span className="ml-2 text-xs font-normal text-primary">{formData.routes.length} selected</span>
            )}
          </RequiredLabel>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
            {ROUTES.map((route) => (
              <label key={route} className="flex items-center gap-2 cursor-pointer select-none text-xs">
                <Checkbox
                  checked={formData.routes.includes(route)}
                  onCheckedChange={(checked) => setFormData({
                    ...formData,
                    routes: checked ? [...formData.routes, route] : formData.routes.filter((r) => r !== route),
                  })}
                  disabled={loading}
                />
                <span className="text-slate-700">{route}</span>
              </label>
            ))}
          </div>
        </FieldGroup>

        {/* Google Maps Pin & Coordinates */}
        <div className="border-t pt-3 space-y-3">
          <div className="flex items-center justify-between">
            <FieldLabel className="text-xs font-semibold text-slate-700">
              Google Maps Pin Location &amp; Coordinates (Exact Destination)
            </FieldLabel>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGetLocation}
              disabled={geoLocating || loading}
              className="h-7 text-xs gap-1"
            >
              {geoLocating ? <Spinner className="w-3 h-3" /> : <Compass className="w-3 h-3 text-primary" />}
              Use My GPS
            </Button>
          </div>

          <FieldGroup>
            <Input
              placeholder="Paste Google Maps link (e.g. https://maps.google.com/?q=-1.2612,36.8044)"
              value={formData.googleMapsUrl}
              onChange={(e) => handleMapsUrlChange(e.target.value)}
              disabled={loading}
              className="text-xs font-mono"
            />
          </FieldGroup>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[11px] text-muted-foreground">Latitude</span>
              <Input
                type="number"
                step="any"
                placeholder="-1.261200"
                value={formData.latitude}
                onChange={(e) => handleCoordChange(e.target.value, formData.longitude)}
                disabled={loading}
                className="text-xs font-mono"
              />
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground">Longitude</span>
              <Input
                type="number"
                step="any"
                placeholder="36.804400"
                value={formData.longitude}
                onChange={(e) => handleCoordChange(formData.latitude, e.target.value)}
                disabled={loading}
                className="text-xs font-mono"
              />
            </div>
          </div>

          {/* Distance calculation preview */}
          {distanceInfo && (
            <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <span className="flex items-center gap-1">
                <Navigation className="w-3.5 h-3.5" />
                Est. distance to {distanceInfo.hubName}: <strong>{distanceInfo.distanceKm} km</strong>
              </span>
              {formData.googleMapsUrl && (
                <a
                  href={formData.googleMapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 hover:underline text-xs"
                >
                  View on Map <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="flex-1">
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="flex-1 gap-2 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
        >
          {loading && <Spinner className="w-4 h-4" />}
          {loading ? 'Adding...' : 'Add Booking'}
        </Button>
      </div>
    </form>
  )
}

export function BookingDialog({
  open,
  onOpenChange,
  onBookingAdded,
  initialData,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onBookingAdded?: () => void
  initialData?: BookingInitialData
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Add New Transport Booking</DialogTitle>
          <DialogDescription>
            Book transport with role-specific shifts and shared destination coordinates.
          </DialogDescription>
        </DialogHeader>
        <BookingFormBody onClose={() => onOpenChange(false)} onBookingAdded={onBookingAdded} initialData={initialData} />
      </DialogContent>
    </Dialog>
  )
}

export function AddBookingForm({ 
  onBookingAdded,
  initialData
}: { 
  onBookingAdded?: () => void
  initialData?: BookingInitialData
}) {
  const [open, setOpen] = useState(false)
  const [checking, setChecking] = useState(false)

  const handleOpenClick = async () => {
    setChecking(true)
    const status = await getSystemStatus()
    setChecking(false)
    if (status) {
      setOpen(true)
    } else {
      toast.error('Bookings are currently closed by the administrator.')
    }
  }

  return (
    <>
      <Button onClick={handleOpenClick} size="sm" disabled={checking}
        className="gap-2 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-sm transition-all">
        {checking ? <Spinner className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        Add Booking
      </Button>
      <BookingDialog open={open} onOpenChange={setOpen} onBookingAdded={onBookingAdded} initialData={initialData} />
    </>
  )
}
