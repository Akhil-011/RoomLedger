import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Header } from '@/components/layout/Header';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';

export function CreateRoom() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [roomName, setRoomName] = useState('');
  const [password, setPassword] = useState('');
  const [maxMembers, setMaxMembers] = useState(4);
  const [loading, setLoading] = useState(false);
  const [profileChecked, setProfileChecked] = useState(false);

  // Check and create profile if needed
  useEffect(() => {
    const ensureProfile = async () => {
      if (!user?.id) return;

      try {
        // Check if profile exists
        const { data: profile, error: selectError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single();

        if (selectError && selectError.code === 'PGRST116') {
          // Profile doesn't exist, create it
          console.log('Profile not found, creating...');
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email,
              // store display name under both `username` and `name` for compatibility
              username: user.username,
              name: user.username,
            });

          if (insertError) {
            console.error('Failed to create profile:', insertError);
            toast.error('Profile setup failed. Please sign out and sign in again.');
            return;
          }
          
          console.log('Profile created successfully');
          toast.success('Profile set up successfully!');
        } else if (profile) {
          console.log('Profile exists:', profile.id);
        }

        setProfileChecked(true);
      } catch (error) {
        console.error('Profile check error:', error);
      }
    };

    ensureProfile();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profileChecked) {
      toast.error('Please wait while we set up your profile...');
      return;
    }

    setLoading(true);

    try {
      // Step 1: Verify authentication
      console.log('🔍 Step 1: Verifying session...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('❌ Session error:', sessionError);
        throw new Error('Session error: ' + sessionError.message);
      }

      if (!session?.user) {
        console.error('❌ No session user found');
        throw new Error('Session expired. Please sign in again.');
      }

      console.log('✅ Session verified. User ID:', session.user.id);

      if (!user?.id) {
        console.error('❌ No user in context');
        throw new Error('You must be logged in to create a room');
      }

      // Step 2: Double-check profile exists
      console.log('🔍 Step 2: Verifying profile exists...');
      const { data: profileCheck, error: profileError } = await supabase
        .from('profiles')
        .select('id, name, email')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('❌ Profile check failed:', profileError);
        throw new Error('Profile verification failed: ' + profileError.message);
      }

      console.log('✅ Profile verified:', profileCheck);

      // Step 3: Create room with numeric room_code
      console.log('🔍 Step 3: Creating room...');
      const passwordHash = btoa(password);

      // generate a 5-digit numeric code and ensure uniqueness
      const generateCode = () => Math.floor(10000 + Math.random() * 90000).toString();
      let roomCode = generateCode();
      for (let i = 0; i < 5; i++) {
        const { data: existing } = await supabase.from('rooms').select('id').eq('room_code', roomCode).single();
        if (!existing) break;
        roomCode = generateCode();
      }

      const roomData: any = {
        room_name: roomName,
        room_password_hash: passwordHash,
        owner_id: user.id,
        max_members: maxMembers,
        room_code: roomCode,
      };

      console.log('Room data to insert:', roomData);

      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .insert(roomData)
        .select()
        .single();

      if (roomError) {
        console.error('❌ Room creation error:', roomError);
        console.error('Error code:', roomError.code);
        console.error('Error details:', roomError.details);
        console.error('Error hint:', roomError.hint);
        
        if (roomError.code === '42501') {
          throw new Error('Permission denied: RLS policy violation. Your user ID: ' + user.id);
        }
        
        throw new Error('Room creation failed: ' + roomError.message);
      }

      console.log('✅ Room created successfully:', room);

      // Step 4: Add owner as first member
      console.log('🔍 Step 4: Adding you as first member...');
      const memberData = {
        room_id: room.id,
        user_id: user.id,
      };
      console.log('Member data to insert:', memberData);

      const { error: memberError } = await supabase
        .from('room_members')
        .insert(memberData);

      if (memberError) {
        console.error('❌ Member insert error:', memberError);
        console.error('Error code:', memberError.code);
        console.error('Error details:', memberError.details);
        throw new Error('Failed to add you as member: ' + memberError.message);
      }

      console.log('✅ Member added successfully');
      console.log('🎉 Room creation complete!');
      
      toast.success('Room created successfully!');
      navigate(`/room/${room.id}`);
    } catch (error: any) {
      console.error('💥 Create room error:', error);
      toast.error(error.message || 'Failed to create room');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-soft">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle>Create Room</CardTitle>
              <CardDescription>Set up a new expense tracking room</CardDescription>
            </CardHeader>
            <CardContent>
              {!profileChecked ? (
                <div className="py-8 text-center text-muted-foreground">
                  Setting up your profile...
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="roomName">Room Name</Label>
                    <Input
                      id="roomName"
                      placeholder="My Apartment"
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Room Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                    />
                    <p className="text-xs text-muted-foreground">
                      Share this password with roommates to let them join
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxMembers">Maximum Members</Label>
                    <Input
                      id="maxMembers"
                      type="number"
                      min={2}
                      max={20}
                      value={maxMembers}
                      onChange={(e) => setMaxMembers(parseInt(e.target.value))}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1" disabled={loading}>
                      <Plus className="h-4 w-4 mr-2" />
                      {loading ? 'Creating...' : 'Create Room'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate('/dashboard')}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
