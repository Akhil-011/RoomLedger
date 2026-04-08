import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext, mapSupabaseUser } from './lib/auth';
import { supabase } from './lib/supabase';
import { AuthUser } from './types';
import { SignIn } from './pages/SignIn';
import { SignUp } from './pages/SignUp';
import { ForgotPassword } from './pages/ForgotPassword';
import { Dashboard } from './pages/Dashboard';
import { CreateRoom } from './pages/CreateRoom';
import { JoinRoom } from './pages/JoinRoom';
import { RoomView } from './pages/RoomView';
import { Profile } from './pages/Profile';
import { About } from './pages/About';
import { Landing } from './pages/Landing';
import { Toaster } from 'sonner';

function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) setUser(mapSupabaseUser(session.user));
      setLoading(false);
    }).catch((err) => {
      console.error('Error fetching session:', err);
      if (mounted) setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(mapSupabaseUser(session.user));
        setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoading(false);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        setUser(mapSupabaseUser(session.user));
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Enrich user with profile data when user id is present
  useEffect(() => {
    let mounted = true;
    const enrich = async () => {
      if (!user?.id) return;
      try {
        const { data: profile, error: profileError } = await supabase.from('profiles').select('username,name,email').eq('id', user.id).single();
        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Profile fetch error:', {
            message: profileError.message,
            status: (profileError as any).status,
            code: profileError.code,
            details: (profileError as any).details,
            hint: (profileError as any).hint,
          });
        }

        if (mounted && profile) {
          const profileUsername = (profile as any).username || (profile as any).name;
          setUser(prev => prev ? { ...prev, username: profileUsername || prev.username, email: profile.email || prev.email } : prev);
        } else {
          // profile missing — create it so other users can see the display name
          try {
            const usernameToSet = user.username || (user.email ? user.email.split('@')[0] : null);
            const { error: insertErr } = await supabase.from('profiles').insert({ id: user.id, email: user.email, username: usernameToSet });
            if (insertErr) {
              console.error('Profile insert error:', {
                message: insertErr.message,
                status: (insertErr as any).status,
                code: insertErr.code,
                details: (insertErr as any).details,
                hint: (insertErr as any).hint,
              });
            } else if (mounted) {
              setUser(prev => prev ? { ...prev, username: usernameToSet || prev.username } : prev);
            }
          } catch (insertEx) {
            console.warn('Failed to create profile during enrichment:', insertEx);
          }
        }
      } catch (err) {
        console.warn('Profile enrichment failed:', err);
      }
    };
    enrich();
    return () => { mounted = false; };
  }, [user?.id]);

  const login = (authUser: AuthUser) => {
    setUser(authUser);
  };

  const logout = () => {
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-soft">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      <BrowserRouter>
        <Routes>
          <Route path="/signin" element={user ? <Navigate to="/dashboard" /> : <SignIn />} />
          <Route path="/signup" element={user ? <Navigate to="/dashboard" /> : <SignUp />} />
          <Route path="/forgot-password" element={user ? <Navigate to="/dashboard" /> : <ForgotPassword />} />
          <Route path="/about" element={<About />} />
          <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/signin" />} />
          <Route path="/profile" element={user ? <Profile /> : <Navigate to="/signin" />} />
          <Route path="/create-room" element={user ? <CreateRoom /> : <Navigate to="/signin" />} />
          <Route path="/join-room" element={user ? <JoinRoom /> : <Navigate to="/signin" />} />
          <Route path="/room/:roomId" element={user ? <RoomView /> : <Navigate to="/signin" />} />
          <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Landing />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-center" richColors />
    </AuthContext.Provider>
  );
}

export default App;
