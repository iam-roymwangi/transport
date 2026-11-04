'use client';

import { useActionState, useState } from 'react';
import { ShieldCheck, UserCheck, Eye, EyeOff, ArrowRight, Bus } from 'lucide-react';
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
import { supervisorLoginAction } from '../actions';
import { Navbar } from '@/components/navbar';
import Link from 'next/link';

const initialState = {
  error: '',
};

export default function SupervisorLoginPage() {
  const [state, formAction, isPending] = useActionState(supervisorLoginAction, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border-purple-200/80 dark:border-purple-900/50">
          <CardHeader className="space-y-2 text-center pb-6">
            <div className="flex justify-center mb-2">
              <div className="bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 p-3.5 rounded-2xl shadow-inner">
                <UserCheck className="h-8 w-8" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Supervisor Portal
            </CardTitle>
            <CardDescription className="text-sm">
              Sign in with your BMS Number or Staff ID to review agent shift edit requests and manage transport details.
            </CardDescription>
          </CardHeader>

          <form action={formAction}>
            <CardContent className="space-y-4">
              {state?.error && (
                <Alert variant="destructive">
                  <AlertDescription>{state.error}</AlertDescription>
                </Alert>
              )}

              {/* BMS Number or Staff Number Input */}
              <div className="space-y-2">
                <Label htmlFor="bmsNumber" className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Supervisor BMS or Staff ID
                </Label>
                <Input
                  id="bmsNumber"
                  name="bmsNumber"
                  type="text"
                  placeholder="e.g. 6142753 or MJK041"
                  required
                  autoFocus
                  disabled={isPending}
                  className="h-11 font-mono text-base"
                />
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Password
                  </Label>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    required
                    disabled={isPending}
                    className="h-11 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-11 w-11 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Default password is your 7-digit BMS Number.
                </p>
              </div>

              <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200/60 text-xs text-purple-900 dark:text-purple-300 space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Supervisor Access Only
                </div>
                <p className="text-[11px] text-purple-700 dark:text-purple-400">
                  Only staff accounts with the <strong>Supervisor</strong> role can access this portal to approve shift edits and manage agent transport.
                </p>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4 pt-2">
              <Button
                type="submit"
                className="w-full h-11 text-base bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-800 hover:to-indigo-700 shadow-md gap-2"
                disabled={isPending}
              >
                {isPending ? 'Authenticating...' : 'Sign In as Supervisor'}
                <ArrowRight className="w-4 h-4" />
              </Button>

              <div className="flex items-center justify-between w-full text-xs text-muted-foreground pt-2 border-t">
                <Link href="/staff/login" className="hover:text-foreground hover:underline">
                  Agent / Staff Portal &rarr;
                </Link>
                <Link href="/admin/login" className="hover:text-foreground hover:underline">
                  Admin Portal &rarr;
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
