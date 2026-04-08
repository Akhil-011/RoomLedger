import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/lib/auth';
import { Users, Shield, Zap, Heart } from 'lucide-react';

export function About() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-soft">
      {user && <Header />}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8 animate-fade-in">
            <img src="https://ik.imagekit.io/d2msyju70/free_image_upscaler_qkjzcz4bbg0mgn7t1oka.png?updatedAt=1772086050485" alt="RoomMate Ledger" className="w-16 h-16 rounded-xl object-contain mb-4 inline-block" />
            <h1 className="text-4xl font-bold mb-2">RoomMate Ledger</h1>
            <p className="text-lg text-muted-foreground">
              Transparent expense tracking for shared living
            </p>
          </div>

          <div className="grid gap-6 animate-slide-up">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Secure & Private
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Your data is protected with row-level security. You can only edit your own expenses,
                  ensuring complete transparency without the risk of accidental changes.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Real-Time Updates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  See expenses as they're added. All roommates stay in sync with instant updates
                  powered by Supabase Realtime.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Easy Collaboration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Create password-protected rooms, invite roommates, and track expenses together.
                  Everyone can see the full picture while maintaining individual accountability.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-primary" />
                  Built for Roommates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Designed specifically for bachelors and roommates who want to keep track of
                  individual expenses without the complexity of bill-splitting apps.
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6 animate-slide-down">
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-1">1. Create or Join a Room</h3>
                <p className="text-sm text-muted-foreground">
                  Set up a new room or join an existing one using the room name and password.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-1">2. Add Your Expenses</h3>
                <p className="text-sm text-muted-foreground">
                  Log your personal expenses like groceries, utilities, or other shared costs.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-1">3. Stay Transparent</h3>
                <p className="text-sm text-muted-foreground">
                  Everyone can view all expenses, but you can only edit your own entries.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-1">4. Track Together</h3>
                <p className="text-sm text-muted-foreground">
                  See total expenses, individual contributions, and fair share calculations in real-time.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
