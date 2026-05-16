'use client';

import { useActionState } from 'react';
import { Bus, Loader2 } from 'lucide-react';
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

  return (
    <div className="min-h-screen flex flex-col bg-muted/40">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="space-y-2 text-center pb-6">
            <div className="flex justify-center mb-2">
              <div className="bg-primary/10 p-3 rounded-full">
                <Bus className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">Staff Portal</CardTitle>
            <CardDescription className="text-base">
              Enter your Staff Number to manage your bookings
            </CardDescription>
          </CardHeader>
          <form action={formAction}>
            <CardContent className="space-y-4">
              {state?.error && (
                <Alert variant="destructive">
                  <AlertDescription>{state.error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="staffNumber">Staff Number</Label>
                <Input
                  id="staffNumber"
                  name="staffNumber"
                  type="text"
                  placeholder="e.g. MJK001"
                  required
                  disabled={isPending}
                  className="h-11"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full h-11 text-base font-medium"
                type="submit"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  'Login'
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
