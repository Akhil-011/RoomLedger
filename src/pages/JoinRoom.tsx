import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Header } from '@/components/layout/Header';
import { toast } from 'sonner';
import { DoorOpen } from 'lucide-react';

export function JoinRoom() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [roomName, setRoomName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Log current session user for debugging RLS issues
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) console.warn('Session fetch error:', sessionError);
      console.log('Attempting join. session.user.id:', session?.user?.id, 'context user.id:', user?.id);
      let room: any = null;

      if (roomId) {
        // if numeric, search by room_code, otherwise treat as id
        const isNumeric = /^\d+$/.test(roomId);
        if (isNumeric) {
          const { data, error } = await supabase
            .from('rooms')
            .select('*')
            .eq('room_code', roomId)
            .single();
          if (error) throw new Error('Invalid room code');
          room = data;
        } else {
          const { data, error } = await supabase
            .from('rooms')
            .select('*')
            .eq('id', roomId)
            .single();
          if (error) throw new Error('Invalid room id');
          room = data;
        }
      } else {
        if (!roomName) throw new Error('Please provide room name or room id');
        const { data, error } = await supabase
          .from('rooms')
          .select('*')
          .eq('room_name', roomName)
          .single();
        if (error) throw new Error('Invalid room name');
        room = data;
      }

      const { data: existingMember } = await supabase
        .from('room_members')
        .select('*')
        .eq('room_id', room.id)
        .eq('user_id', user?.id)
        .single();

      if (existingMember) {
        toast.info('You are already a member of this room');
        navigate(`/room/${room.id}`);
        return;
      }

      const { data: memberCount } = await supabase
        .from('room_members')
        .select('*', { count: 'exact', head: true })
        .eq('room_id', room.id);

      if (memberCount && (memberCount as any).count >= room.max_members) {
        throw new Error('Room is full');
      }

      const { error: joinError } = await supabase
        .from('room_members')
        .insert({
          room_id: room.id,
          user_id: user?.id,
        });

      if (joinError) {
        console.error('Join insert error:', joinError);
        console.error('Join error code:', (joinError as any).code);
        console.error('Join error details:', (joinError as any).details);
        console.error('Join error hint:', (joinError as any).hint);
        throw joinError;
      }

      toast.success('Joined room successfully');
      navigate(`/room/${room.id}`);
    } catch (error: any) {
      toast.error(error.message);
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
              <CardTitle>Join Room</CardTitle>
              <CardDescription>Enter room credentials to join</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="roomId">Room ID</Label>
                  <Input
                    id="roomId"
                    placeholder="Enter room id (from room page)"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="roomName">Room Name</Label>
                  <Input
                    id="roomName"
                    placeholder="My Apartment"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    // optional when using Room ID
                    disabled={loading}
                  />
                </div>

                {/* password removed — joining by Room ID or Room Name only */}

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1" disabled={loading}>
                    <DoorOpen className="h-4 w-4 mr-2" />
                    {loading ? 'Joining...' : 'Join Room'}
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
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
