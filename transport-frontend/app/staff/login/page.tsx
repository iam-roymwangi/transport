'use client';

import { useActionState, useState } from 'react';
import { Bus, Loader2, Eye, EyeOff, KeyRound, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { staffLoginAction } from '../actions';
import { Navbar } from '@/components/navbar';

const initialState = {
  error: '',
};

export default function StaffLoginPage() {
  const [state, formAction, isPending] = useActionState(staffLoginAction, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-muted/40">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg border-primary/20">
          <CardHeader className="space-y-2 text-center pb-6">
            <div className="flex justify-center mb-2">
              <div className="bg-primary/10 p-3 rounded-full">
                <Bus className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">Staff Portal</CardTitle>
            <CardDescription className="text-sm">
              Sign in with your 7-digit BMS Number and password to manage your transport bookings
            </CardDescription>
          </CardHeader>
          <form action={formAction}>
            <CardContent className="space-y-4">
              {state?.error && (
                <Alert variant="destructive">
                  <AlertDescription>{state.error}</AlertDescription>
                </Alert>
              )}
              
              {/* BMS Number Input */}
              <div className="space-y-2">
                <Label htmlFor="bmsNumber" className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  BMS Number
                </Label>
                <Input
                  id="bmsNumber"
                  name="bmsNumber"
                  type="text"
                  placeholder="e.g. 6142719"
                  required
                  autoFocus
                  disabled={isPending}
                  className="h-11 font-mono text-base"
                />
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Password
                  </Label>
                  <span className="text-[11px] text-muted-foreground">Default: Your BMS No</span>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter password (default is BMS number)"
                    required
                    disabled={isPending}
                    className="h-11 pr-10 font-mono"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-11 px-3 py-2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Informational Tip */}
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 text-xs text-muted-foreground flex items-start gap-2.5">
                <KeyRound className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-800">Password Notice</div>
                  <div>Your initial password is your <strong>7-digit BMS Number</strong> (e.g. <code>6142719</code>).</div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full h-11 text-base font-medium shadow-sm bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
                type="submit"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="mr-2 h-5 w-5" />
                    Login with BMS
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
