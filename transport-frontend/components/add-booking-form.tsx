'use client'

import { useState } from 'react'
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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { AlertCircle, CheckCircle2, Plus } from 'lucide-react'
import { FieldGroup, FieldLabel } from '@/components/ui/field'

const LOCATIONS = [
  'Westend',
  'Delta',
  'Riverside',
  'Two Rivers',
]

const ROUTES = [
  'Jogoo Road',
  'Thika Road',
  'Ngong Road',
  'Mombasa Road',
  'Waiyaki Way',
  'Lower Kabete',
  'Kiambu Road',
  'Kamiti Road',
  'Limuru Road',
]

const PROCESSES = ['BT', 'wynZ', 'BD', 'BT Safety', 'Vinted', 'Caption Call']

const SHIFTS = [
  '12:00 - 21:00',
  '13:00 - 21:30/22:00',
  '13:30/14:00 - 23:00',
  '14:30/15:00 - 00:00',
  '15:30 - 00:30',
  '16:00 - 01:00',
  '16:30 - 01:30',
  '16:30/17:00 - 02:00',
  '18:00 - 03:00',
  '18:30/19:00 - 04:00',
  '20:00 - 05:00',
  '21:00 - 06:00',
  '21:30/22:00 - 07:00',
  '23:00 - 08:00',
  '00:00 - 09:00',
]

export function AddBookingForm({ onBookingAdded }: { onBookingAdded?: () => void }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState<{
    type: 'error' | 'success'
    message: string
  } | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    staffNumber: '',
    phoneNumber: '',
    location: '',
    routes: [] as string[],
    shift: '',
    date: new Date().toISOString().split('T')[0],
    address: '',
    process: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setAlert(null)

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          route: formData.routes.join(', '),
        }),
      })

      if (response.status === 409) {
        setAlert({
          type: 'error',
          message:
            '⚠️ You already have a booking for this shift on this date.',
        })
        return
      }

      if (!response.ok) {
        throw new Error('Failed to add booking')
      }

      setAlert({
        type: 'success',
        message: '✅ Booking confirmed successfully',
      })

      setFormData({
        name: '',
        staffNumber: '',
        phoneNumber: '',
        location: '',
        routes: [],
        shift: '',
        date: new Date().toISOString().split('T')[0],
        address: '',
        process: '',
      })

      setTimeout(() => {
        setOpen(false)
        setAlert(null)
        onBookingAdded?.()
      }, 2000)
    } catch (error) {
      console.error('Error adding booking:', error)
      setAlert({
        type: 'error',
        message: 'Failed to add booking. Please try again.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="lg"
        className="gap-2 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-lg hover:shadow-xl transition-all"
      >
        <Plus className="w-5 h-5" />
        Add Booking
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Add New Booking</DialogTitle>
            <DialogDescription>
              Fill in the details to create a new transport booking
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Alert Messages */}
            {alert && (
              <Alert
                variant={alert.type === 'error' ? 'destructive' : 'default'}
                className={
                  alert.type === 'success'
                    ? 'bg-green-50 border-green-200 text-green-900'
                    : ''
                }
              >
                {alert.type === 'error' ? (
                  <AlertCircle className="h-4 w-4" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                <AlertDescription>{alert.message}</AlertDescription>
              </Alert>
            )}

            {/* Personal Information */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-4">
                Personal Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FieldGroup>
                  <FieldLabel>Full Name</FieldLabel>
                  <Input
                    placeholder="First Name Last Name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    disabled={loading}
                  />
                </FieldGroup>

                <FieldGroup>
                  <FieldLabel>Staff Number</FieldLabel>
                  <Input
                    placeholder="MJK 1234"
                    value={formData.staffNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, staffNumber: e.target.value })
                    }
                    required
                    disabled={loading}
                  />
                </FieldGroup>

                <FieldGroup>
                  <FieldLabel>Phone Number</FieldLabel>
                  <Input
                    type="tel"
                    placeholder="0712345678"
                    value={formData.phoneNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, phoneNumber: e.target.value })
                    }
                    required
                    disabled={loading}
                  />
                </FieldGroup>

                <FieldGroup>
                  <FieldLabel>Date</FieldLabel>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    required
                    disabled={loading}
                  />
                </FieldGroup>
              </div>
            </div>

            {/* Booking Details */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-4">
                Booking Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FieldGroup>
                  <FieldLabel>Location</FieldLabel>
                  <Select
                    value={formData.location}
                    onValueChange={(value) =>
                      setFormData({ ...formData, location: value })
                    }
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {LOCATIONS.map((loc) => (
                        <SelectItem key={loc} value={loc}>
                          {loc}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldGroup>

                <FieldGroup className="sm:col-span-2">
                  <FieldLabel>
                    Route
                    {formData.routes.length > 0 && (
                      <span className="ml-2 text-xs font-normal text-primary">
                        {formData.routes.length} selected
                      </span>
                    )}
                  </FieldLabel>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {ROUTES.map((route) => (
                      <label
                        key={route}
                        className="flex items-center gap-2 cursor-pointer select-none"
                      >
                        <Checkbox
                          checked={formData.routes.includes(route)}
                          onCheckedChange={(checked) => {
                            setFormData({
                              ...formData,
                              routes: checked
                                ? [...formData.routes, route]
                                : formData.routes.filter((r) => r !== route),
                            })
                          }}
                          disabled={loading}
                        />
                        <span className="text-sm text-slate-700">{route}</span>
                      </label>
                    ))}
                  </div>
                </FieldGroup>

                <FieldGroup>
                  <FieldLabel>Shift</FieldLabel>
                  <Select
                    value={formData.shift}
                    onValueChange={(value) =>
                      setFormData({ ...formData, shift: value })
                    }
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select shift" />
                    </SelectTrigger>
                    <SelectContent>
                      {SHIFTS.map((shift) => (
                        <SelectItem key={shift} value={shift}>
                          {shift}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldGroup>

                <FieldGroup>
                  <FieldLabel>Process</FieldLabel>
                  <Select
                    value={formData.process}
                    onValueChange={(value) =>
                      setFormData({ ...formData, process: value })
                    }
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select process" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROCESSES.map((proc) => (
                        <SelectItem key={proc} value={proc}>
                          {proc}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldGroup>
              </div>
            </div>

            {/* Address */}
            <FieldGroup>
              <FieldLabel>Address</FieldLabel>
              <Textarea
                placeholder="Enter full address..."
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                required
                disabled={loading}
                rows={3}
              />
            </FieldGroup>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
                className="flex-1"
              >
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
        </DialogContent>
      </Dialog>
    </>
  )
}
