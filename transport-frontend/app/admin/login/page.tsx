'use client';

import { useState, useActionState } from 'react';
import { loginAction } from '../actions';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Bus, KeyRound } from 'lucide-react';
import { Navbar } from '@/components/navbar';

const initialState = {
  error: '',
};

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  return (
    <div className="min-h-screen flex flex-col bg-muted/40">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-sm shadow-lg border-primary/10">
          <CardHeader className="space-y-1 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
              <Bus className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">Admin Login</CardTitle>
            <CardDescription>
              Enter the administrator password to access the dashboard
            </CardDescription>
          </CardHeader>
          <form action={formAction}>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <KeyRound className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    className="pl-9"
                  />
                </div>
              </div>
              {state?.error && (
                <div className="text-sm text-destructive font-medium text-center">
                  {state.error}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button className="w-full" type="submit" disabled={isPending}>
                {isPending ? 'Logging in...' : 'Sign In'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
