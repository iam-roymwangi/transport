'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { MapPin, Navigation, Compass, ExternalLink, Save, CheckCircle2 } from 'lucide-react';
import { LOCATIONS, ROUTES, ROLE_INFO, StaffRole } from '@/lib/booking-options';
import { extractCoordinates, buildGoogleMapsUrl, calculateDistanceToHub } from '@/lib/googleMaps';
import { updateMyTransportDetailsAction } from '../../actions';

interface ProfileClientProps {
  staff: {
    id: string;
    name: string;
    bmsNumber?: string | null;
    staffNumber: string;
    phoneNumber?: string | null;
    role: string;
    location?: string | null;
    route?: string | null;
    address?: string | null;
    pinLocation?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    googleMapsUrl?: string | null;
    currentShift?: string | null;
    process?: string | null;
  };
}

export function ProfileClient({ staff }: ProfileClientProps) {
  const [loading, setLoading] = useState(false);
  const [geoLocating, setGeoLocating] = useState(false);

  const [formData, setFormData] = useState({
    phoneNumber: staff.phoneNumber || '',
    location: staff.location || '',
    route: staff.route || '',
    address: staff.address || '',
    latitude: staff.latitude?.toString() || '',
    longitude: staff.longitude?.toString() || '',
    googleMapsUrl: staff.googleMapsUrl || '',
    pinLocation: staff.pinLocation || '',
  });

  const role = (staff.role as StaffRole) || 'Agent';
  const roleMeta = ROLE_INFO[role] || ROLE_INFO.Agent;

  // Handle URL change with auto extraction
  const handleUrlChange = (url: string) => {
    const coords = extractCoordinates(url);
    setFormData((prev) => ({
      ...prev,
      googleMapsUrl: url,
      latitude: coords ? coords.latitude.toString() : prev.latitude,
      longitude: coords ? coords.longitude.toString() : prev.longitude,
      pinLocation: coords ? `${coords.latitude}, ${coords.longitude}` : prev.pinLocation,
    }));
    if (coords) {
      toast.success(`Coordinates found: ${coords.latitude}, ${coords.longitude}`);
    }
  };

  const handleCoordChange = (latVal: string, lngVal: string) => {
    setFormData((prev) => {
      const lat = parseFloat(latVal);
      const lng = parseFloat(lngVal);
      let url = prev.googleMapsUrl;
      let pin = prev.pinLocation;
      if (!isNaN(lat) && !isNaN(lng)) {
        url = buildGoogleMapsUrl(lat, lng);
        pin = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      }
      return {
        ...prev,
        latitude: latVal,
        longitude: lngVal,
        googleMapsUrl: url,
        pinLocation: pin,
      };
    });
  };

  const handleUseGps = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    setGeoLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));
        const mapsUrl = buildGoogleMapsUrl(lat, lng);
        const pin = `${lat}, ${lng}`;
        setFormData((prev) => ({
          ...prev,
          latitude: lat.toString(),
          longitude: lng.toString(),
          pinLocation: pin,
          googleMapsUrl: mapsUrl,
        }));
        setGeoLocating(false);
        toast.success('Current GPS coordinates detected!');
      },
      () => {
        setGeoLocating(false);
        toast.error('Could not detect location. Please grant location permissions in browser.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const distanceInfo =
    formData.latitude && formData.longitude && formData.location
      ? calculateDistanceToHub(
          {
            latitude: parseFloat(formData.latitude),
            longitude: parseFloat(formData.longitude),
          },
          formData.location
        )
      : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await updateMyTransportDetailsAction({
        phoneNumber: formData.phoneNumber,
        location: formData.location,
        route: formData.route,
        address: formData.address,
        googleMapsUrl: formData.googleMapsUrl,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        pinLocation: formData.pinLocation,
      });

      if (res.success) {
        toast.success('Transport profile updated successfully!');
      } else {
        toast.error(res.error || 'Failed to update transport details');
      }
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Role & Staff Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-secondary/10 border border-primary/20">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{staff.name}</h1>
            <Badge variant="outline" className={roleMeta.badgeColor}>
              {role}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            BMS Number: <span className="font-semibold text-primary font-mono">{staff.bmsNumber || 'N/A'}</span> &bull; Staff ID: <span className="font-semibold text-slate-700">{staff.staffNumber}</span> &bull; {roleMeta.description}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {formData.latitude && formData.longitude ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              GPS Coordinates Synced
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 text-amber-800 text-xs font-medium">
              <Compass className="w-4 h-4 text-amber-600" />
              Pin Not Set Yet
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Shared Transport Details Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              <CardTitle>Destination &amp; Transport Details</CardTitle>
            </div>
            <CardDescription>
              All roles (Agents, Supervisors, QAs, IT, OAM, OM) share the same transport profile. Keep your coordinates updated for precise routing and distance calculation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Assigned Office / Pickup Hub</Label>
                <Select
                  value={formData.location}
                  onValueChange={(val) => setFormData({ ...formData, location: val })}
                  disabled={loading}
                >
                  <SelectTrigger id="location">
                    <SelectValue placeholder="Select office hub" />
                  </SelectTrigger>
                  <SelectContent>
                    {LOCATIONS.map((loc) => (
                      <SelectItem key={loc} value={loc}>
                        {loc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="route">Transport Route</Label>
                <Select
                  value={formData.route}
                  onValueChange={(val) => setFormData({ ...formData, route: val })}
                  disabled={loading}
                >
                  <SelectTrigger id="route">
                    <SelectValue placeholder="Select primary route" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROUTES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Contact Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  placeholder="0712345678"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Physical Address / Landmark</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. Roysambu, Lumumba Drive Apt 4"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Google Maps Location & Distance section */}
            <div className="p-4 rounded-xl border bg-slate-50/50 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">Google Maps Exact Destination Pin</h4>
                  <p className="text-xs text-muted-foreground">
                    Paste a Google Maps link or use your device GPS to record exact latitude and longitude.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleUseGps}
                  disabled={geoLocating || loading}
                  className="gap-1.5 self-start sm:self-auto text-xs"
                >
                  {geoLocating ? <Spinner className="w-3.5 h-3.5" /> : <Compass className="w-3.5 h-3.5 text-primary" />}
                  Auto-Detect My GPS
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mapsUrl" className="text-xs">Google Maps Pin URL</Label>
                <Input
                  id="mapsUrl"
                  value={formData.googleMapsUrl}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder="https://maps.google.com/?q=-1.2612,36.8044"
                  className="font-mono text-xs"
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="lat" className="text-xs text-muted-foreground">Latitude</Label>
                  <Input
                    id="lat"
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => handleCoordChange(e.target.value, formData.longitude)}
                    placeholder="-1.261200"
                    className="font-mono text-xs"
                    disabled={loading}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="lng" className="text-xs text-muted-foreground">Longitude</Label>
                  <Input
                    id="lng"
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => handleCoordChange(formData.latitude, e.target.value)}
                    placeholder="36.804400"
                    className="font-mono text-xs"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Distance Display to Office */}
              {distanceInfo && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20 text-xs text-primary font-medium">
                  <div className="flex items-center gap-2">
                    <Navigation className="w-4 h-4" />
                    <span>
                      Estimated distance to <strong>{distanceInfo.hubName}</strong>: <strong>{distanceInfo.distanceKm} km</strong>
                    </span>
                  </div>
                  {formData.googleMapsUrl && (
                    <a
                      href={formData.googleMapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 hover:underline"
                    >
                      Open in Google Maps <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              )}
            </div>

            <Button type="submit" disabled={loading} className="gap-2">
              {loading ? <Spinner className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              Save Transport Details
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
