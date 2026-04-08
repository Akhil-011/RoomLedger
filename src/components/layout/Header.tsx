import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { authService } from '@/lib/auth-service';
import { Button } from '@/components/ui/button';
import { Home, User, Users, Info, LogOut } from 'lucide-react';
import { toast } from 'sonner';

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await authService.signOut();
      logout();
      navigate('/signin');
      toast.success('Logged out successfully');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (!user) return null;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/dashboard" className="flex items-center space-x-2">
            <img src="https://ik.imagekit.io/d2msyju70/free_image_upscaler_qkjzcz4bbg0mgn7t1oka.png?updatedAt=1772086050485" alt="RoomMate Ledger" className="h-8 w-8 rounded-xl object-contain" />
            <span className="font-bold text-xl hidden sm:inline-block">RoomMate Ledger</span>
          </Link>

          {!location.pathname.startsWith('/room') && (
            <nav className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard">
                <Home className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Home</span>
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/profile">
                <User className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Profile</span>
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/about">
                <Info className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">About</span>
              </Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
            </nav>
          )}
        </div>
      </div>
    </header>
  );
}
