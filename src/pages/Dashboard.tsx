import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { Room } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Layout from '@/components/layout/Layout';
import { Plus, Users, DoorOpen, Trash2 } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { toast } from 'sonner';

export function Dashboard() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      const { data: memberData, error: memberError } = await supabase
        .from('room_members')
        .select('room_id')
        .eq('user_id', user?.id);

      if (memberError) throw memberError;

      if (memberData && memberData.length > 0) {
        const roomIds = memberData.map(m => m.room_id);
        const { data: roomsData, error: roomsError } = await supabase
          .from('rooms')
          .select('*')
          .in('id', roomIds)
          .order('created_at', { ascending: false });

        if (roomsError) throw roomsError;
        setRooms(roomsData || []);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!confirm('Are you sure you want to delete this room? All expenses will be lost.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('id', roomId)
        .eq('owner_id', user?.id);

      if (error) throw error;
      toast.success('Room deleted successfully');
      loadRooms();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 animate-fade-in">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Welcome, {user?.username}!</h1>
              <p className="text-muted-foreground">Manage your shared expenses with ease</p>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-8 animate-slide-up">
          <Card className="card-hover cursor-pointer" asChild>
            <Link to="/create-room">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-gradient-primary flex items-center justify-center">
                    <Plus className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle>Create Room</CardTitle>
                    <CardDescription>Start a new expense room</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Link>
          </Card>

          <Card className="card-hover cursor-pointer" asChild>
            <Link to="/join-room">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-gradient-primary flex items-center justify-center">
                    <DoorOpen className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle>Join Room</CardTitle>
                    <CardDescription>Enter an existing room</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Link>
          </Card>
        </div>

        <div className="animate-slide-down">
          <h2 className="text-2xl font-bold mb-4">Your Rooms</h2>
          {loading ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">Loading rooms...</CardContent>
            </Card>
          ) : rooms.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">No rooms yet. Create or join a room to get started!</CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {rooms.map((room) => (
                <Card key={room.id} className="card-hover">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{room.room_name}</CardTitle>
                          <CardDescription>
                            Max {room.max_members} members
                            {room.owner_id === user?.id && ' • You are the owner'}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button asChild>
                          <Link to={`/room/${room.id}`}>View</Link>
                        </Button>
                        {room.owner_id === user?.id && (
                          <Button variant="destructive" size="icon" onClick={() => handleDeleteRoom(room.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
