import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Users, Plus, DoorOpen, Wallet } from 'lucide-react';
import { supabase } from '@/lib/supabase';

function useAnimatedNumber(target: number, duration = 800) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start: number | null = null;
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      setValue(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return value;
}

export function Landing() {
  const [targetRooms, setTargetRooms] = useState(0);
  const [targetUsers, setTargetUsers] = useState(0);
  const [targetExpenses, setTargetExpenses] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);

  const rooms = useAnimatedNumber(targetRooms);
  const users = useAnimatedNumber(targetUsers);
  const expenses = useAnimatedNumber(targetExpenses);
  const [showPreview, setShowPreview] = useState(false);

  const formatINR = (val: number) => {
    try {
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
    } catch {
      return `₹${val}`;
    }
  };

  useEffect(() => {
    const fetchCounts = async () => {
      setStatsLoading(true);
      try {
        // Prefer using the RPC which returns aggregated stats regardless of table RLS
        const { data, error } = await supabase.rpc('get_site_stats');
        if (error) {
          console.warn('get_site_stats rpc error', error);
        }
        if (data) {
          // data may be an object or array depending on client; handle both
          const row = Array.isArray(data) ? data[0] : data;
          const roomsCount = row?.rooms_count ?? row?.rooms_count_int ?? 0;
          const usersCount = row?.users_count ?? row?.users_count_int ?? 0;
          const expensesSum = row?.expenses_sum ?? row?.sum ?? 0;
          setTargetRooms(Number(roomsCount) || 0);
          setTargetUsers(Number(usersCount) || 0);
          setTargetExpenses(Math.round(Number(expensesSum) || 0));
        }
      } catch (err) {
        console.warn('Failed to fetch landing stats', err);
      } finally {
        setStatsLoading(false);
      }
    };
    fetchCounts();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-soft px-4 py-12 relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-5 dark:opacity-20"
        style={{ backgroundImage: 'url("https://ik.imagekit.io/b45loridy/Roommate%20(1).jpeg")' }}
      />
      <div className="relative max-w-5xl w-full">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="text-center md:text-left">
            <img src="https://ik.imagekit.io/d2msyju70/free_image_upscaler_qkjzcz4bbg0mgn7t1oka.png?updatedAt=1772086050485" alt="RoomMate Ledger" className="w-20 h-20 rounded-xl object-contain mb-4 inline-block" />
            <h1 className="text-4xl font-extrabold mb-3">RoomMate Ledger</h1>
            <p className="text-lg text-muted-foreground mb-6">Track and manage shared expenses with your roommates. Create rooms, log expenses, and keep transparent records for easy splitting.</p>

            <div className="flex items-center gap-3 mb-6 justify-center md:justify-start">
              <Link to="/signin">
                <Button className="px-6">Sign In</Button>
              </Link>
              <Link to="/signup">
                <Button variant="outline" className="px-6">Sign Up</Button>
              </Link>
              <Button variant="ghost" onClick={() => setShowPreview(true)}>Preview</Button>
            </div>

            <div className="flex gap-6 mt-6 justify-center md:justify-start">
              <div className="text-center">
                <div className="text-2xl font-bold">{statsLoading ? '...' : rooms}</div>
                <div className="text-sm text-muted-foreground">Rooms</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{statsLoading ? '...' : users}</div>
                <div className="text-sm text-muted-foreground">Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{statsLoading ? '...' : formatINR(expenses)}</div>
                <div className="text-sm text-muted-foreground">Expenses</div>
              </div>
            </div>
          </div>

          <div>
            <div className="grid grid-cols-1 gap-4">
              <div className="p-6 rounded-lg bg-card card-hover">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-lg bg-gradient-primary flex items-center justify-center">
                    <Plus className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Create Rooms</h3>
                    <p className="text-sm text-muted-foreground">Start a room for rent, utilities, groceries or trips and invite your roommates.</p>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-lg bg-card card-hover">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-lg bg-gradient-primary flex items-center justify-center">
                    <DoorOpen className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Join & Collaborate</h3>
                    <p className="text-sm text-muted-foreground">Easily join rooms with a code and collaborate on expense tracking in real time.</p>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-lg bg-card card-hover">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-lg bg-gradient-primary flex items-center justify-center">
                    <Wallet className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Split Bills</h3>
                    <p className="text-sm text-muted-foreground">Log expenses and automatically split amounts among members with clear history.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>After signing in you'll be taken to your dashboard to manage rooms and expenses.</p>
        </div>

        <div className="mt-6 text-center">
          <ThemeToggle />
        </div>
      </div>

      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowPreview(false)}></div>
          <div className="relative z-10 w-[90%] max-w-2xl p-6 bg-card rounded-lg">
            <h3 className="text-xl font-bold mb-2">Quick Preview</h3>
            <p className="text-sm text-muted-foreground mb-4">This is a preview of the dashboard layout. Sign in to access real data.</p>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="p-3 bg-background rounded">Room A</div>
              <div className="p-3 bg-background rounded">Room B</div>
              <div className="p-3 bg-background rounded">Room C</div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowPreview(false)}>Close</Button>
              <Link to="/signin"><Button>Sign In</Button></Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Landing;
