import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase, getSupabaseClient } from '@/lib/supabase';
import { Expense, RoomMember } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Header } from '@/components/layout/Header';
import { toast } from 'sonner';
import { Plus, Users, IndianRupee, Trash2, LogOut, ArrowLeft, Copy } from 'lucide-react';

interface ExpenseWithUser extends Expense {
  user_email?: string;
  user_name?: string;
}

export function RoomView() {
  const { roomId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [roomName, setRoomName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [members, setMembers] = useState<(RoomMember & { username?: string; email?: string })[]>([]);
  const [expenses, setExpenses] = useState<ExpenseWithUser[]>([]);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showSplitHierarchy, setShowSplitHierarchy] = useState(false);
  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRoomData();
    
    const channel = getSupabaseClient()
      .channel(`room-${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses', filter: `room_id=eq.${roomId}` }, () => {
        loadExpenses();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_members', filter: `room_id=eq.${roomId}` }, () => {
        loadMembers();
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [roomId]);

  const loadRoomData = async () => {
    try {
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .select('room_name,room_code')
        .eq('id', roomId)
        .single();

      if (roomError) throw roomError;
      setRoomName(room.room_name);
      setRoomCode(room.room_code || '');

      await Promise.all([loadMembers(), loadExpenses()]);
    } catch (error: any) {
      toast.error(error.message);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async () => {
    // Fetch room_members first, then batch-fetch profiles by user_id
    const { data: membersData, error: membersError } = await supabase
      .from('room_members')
      .select('id,room_id,user_id,joined_at')
      .eq('room_id', roomId);

    if (membersError) {
      toast.error(membersError.message);
      return;
    }

    const membersList = membersData || [];
    const userIds = Array.from(new Set(membersList.map((m: any) => m.user_id).filter(Boolean)));

    let profilesMap: Record<string, { username?: string; name?: string; email?: string }> = {};
    if (userIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id,username,name,email')
        .in('id', userIds as any);

      if (!profilesError && profiles) {
        profilesMap = (profiles as any[]).reduce((acc, p) => {
          acc[p.id] = { username: p.username, name: (p as any).name, email: p.email };
          return acc;
        }, {} as Record<string, { username?: string; name?: string; email?: string }>);
      }
    }

    const mapped = membersList.map((m: any) => ({
      id: m.id,
      room_id: m.room_id,
      user_id: m.user_id,
      joined_at: m.joined_at,
      username: profilesMap[m.user_id]?.username || profilesMap[m.user_id]?.name,
      email: profilesMap[m.user_id]?.email,
    }));

    setMembers(mapped);
  };

  const loadExpenses = async () => {
    const { data: expensesData, error: expensesError } = await supabase
      .from('expenses')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false });

    if (expensesError) {
      toast.error(expensesError.message);
      return;
    }

    const list = expensesData || [];
    const userIds = Array.from(new Set(list.map((e: any) => e.user_id).filter(Boolean)));

    let profilesMap: Record<string, { username?: string; email?: string }> = {};
    if (userIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id,username,email')
        .in('id', userIds as any);

      if (!profilesError && profiles) {
        profilesMap = (profiles as any[]).reduce((acc, p) => {
          acc[p.id] = { username: p.username, email: p.email };
          return acc;
        }, {} as Record<string, { username?: string; email?: string }>);
      }
    }

    const mapped = (list as any[]).map((e) => ({
      ...e,
      user_name: profilesMap[e.user_id]?.username,
      email: profilesMap[e.user_id]?.email,
    }));

    setExpenses(mapped);
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase
        .from('expenses')
        .insert({
          room_id: roomId,
          user_id: user?.id,
          product_name: productName,
          price: parseFloat(price),
        });

      if (error) throw error;

      toast.success('Expense added successfully');
      setProductName('');
      setPrice('');
      setShowAddExpense(false);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId)
        .eq('user_id', user?.id);

      if (error) throw error;
      toast.success('Expense deleted successfully');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleLeaveRoom = async () => {
    try {
      const { error } = await supabase
        .from('room_members')
        .delete()
        .eq('room_id', roomId)
        .eq('user_id', user?.id);

      if (error) throw error;
      toast.success('Left room successfully');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const userExpenses = expenses.filter(e => e.user_id === user?.id);
  const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.price.toString()), 0);
  const userTotal = userExpenses.reduce((sum, e) => sum + parseFloat(e.price.toString()), 0);
  const perPersonShare = members.length > 0 ? totalExpenses / members.length : 0;
  const balance = userTotal - perPersonShare;

  type Transfer = { fromUserId: string; toUserId: string; amount: number };

  const { transfersByCreditor, transfers, totalByCreditor } = useMemo(() => {
    const memberUserIds = members.map((m) => m.user_id).filter(Boolean);
    const safeMemberUserIds = Array.from(new Set(memberUserIds));

    const paidByUserId = safeMemberUserIds.reduce((acc, userId) => {
      acc[userId] = 0;
      return acc;
    }, {} as Record<string, number>);

    for (const expense of expenses) {
      const userId = expense.user_id;
      if (!userId) continue;
      paidByUserId[userId] = (paidByUserId[userId] || 0) + parseFloat(expense.price.toString());
    }

    const share = safeMemberUserIds.length > 0 ? totalExpenses / safeMemberUserIds.length : 0;
    const balances = safeMemberUserIds.map((userId) => ({
      userId,
      balance: (paidByUserId[userId] || 0) - share,
    }));

    const epsilon = 0.01;
    const creditors = balances
      .filter((b) => b.balance > epsilon)
      .sort((a, b) => b.balance - a.balance)
      .map((c) => ({ ...c }));
    const debtors = balances
      .filter((b) => b.balance < -epsilon)
      .sort((a, b) => a.balance - b.balance)
      .map((d) => ({ ...d }));

    const computedTransfers: Transfer[] = [];
    let creditorIndex = 0;
    let debtorIndex = 0;

    while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
      const creditor = creditors[creditorIndex];
      const debtor = debtors[debtorIndex];

      const amount = Math.min(creditor.balance, -debtor.balance);
      if (amount > epsilon) {
        computedTransfers.push({
          fromUserId: debtor.userId,
          toUserId: creditor.userId,
          amount,
        });
        creditor.balance -= amount;
        debtor.balance += amount;
      }

      if (creditor.balance <= epsilon) creditorIndex += 1;
      if (debtor.balance >= -epsilon) debtorIndex += 1;
    }

    const byCreditor: Record<string, Transfer[]> = {};
    const totals: Record<string, number> = {};
    for (const t of computedTransfers) {
      (byCreditor[t.toUserId] ||= []).push(t);
      totals[t.toUserId] = (totals[t.toUserId] || 0) + t.amount;
    }

    return {
      transfersByCreditor: byCreditor,
      transfers: computedTransfers,
      totalByCreditor: totals,
    };
  }, [members, expenses, totalExpenses]);

  const getMemberName = (userId: string) => {
    if (userId === user?.id) return 'You';
    return members.find((m) => m.user_id === userId)?.username || 'Guest';
  };
  const formatINR = (value: number) => {
    try {
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(value);
    } catch {
      return `₹${value.toFixed(2)}`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-soft">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">Loading...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-soft">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6 animate-fade-in">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" className="p-1" onClick={() => navigate('/')} aria-label="Back to home">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold mb-2">{roomName}</h1>
                <div className="flex items-center gap-3">
                  <p className="text-muted-foreground">{members.length} members</p>
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <span className="px-2 py-1 bg-muted/10 rounded font-mono text-xs">Code: {roomCode || roomId}</span>
                    <Button variant="ghost" size="sm" onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(roomCode || roomId || '');
                        toast.success('Room code copied');
                      } catch (err) {
                        toast.error('Failed to copy');
                      }
                    }}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Leave Room
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Leave room?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You will be removed from this room and its expense list. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={handleLeaveRoom}
                  >
                    Leave Room
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-6 animate-slide-up">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Expenses</CardDescription>
                <CardTitle className="text-2xl">{formatINR(totalExpenses)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Your Expenses</CardDescription>
                <CardTitle className="text-2xl">{formatINR(userTotal)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Your Share (equal split per person)</CardDescription>
                <CardTitle className="text-2xl">{formatINR(perPersonShare)}</CardTitle>
                <div className="text-sm text-muted-foreground mt-1">
                  {balance === 0 ? (
                    'Settled — no one owes anything'
                  ) : (
                    <>
                      Balance: {balance > 0 ? '+' : '-'}₹{Math.abs(balance).toFixed(2)} — {balance > 0 ? 'others owe you' : 'you owe others'}
                    </>
                  )}
                </div>
              </CardHeader>
            </Card>
          </div>

          <div className="flex justify-end mb-6">
            <Button
              variant="outline"
              onClick={() => setShowSplitHierarchy(true)}
              aria-pressed={showSplitHierarchy}
            >
              <IndianRupee className="h-4 w-4 mr-2" />
              Hierarchical Split Expense
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="animate-slide-up">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-bold">Expenses</h2>
                <Button onClick={() => setShowAddExpense(!showAddExpense)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Expense
                </Button>
              </div>

              {showAddExpense && (
                <Card className="mb-4">
                  <CardContent className="pt-6">
                    <form onSubmit={handleAddExpense} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="productName">Product/Service</Label>
                        <Input
                          id="productName"
                          placeholder="Groceries, Utilities, etc."
                          value={productName}
                          onChange={(e) => setProductName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="price">Amount (₹)</Label>
                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          required
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" className="flex-1">Add</Button>
                        <Button type="button" variant="outline" onClick={() => setShowAddExpense(false)}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-2">
                {expenses.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      No expenses yet. Add your first expense!
                    </CardContent>
                  </Card>
                ) : (
                  expenses.map((expense) => (
                    <Card key={expense.id} className={expense.user_id === user?.id ? 'border-primary' : ''}>
                      <CardContent className="py-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{expense.product_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {expense.user_id === user?.id ? 'You' : (members.find(m => m.user_id === expense.user_id)?.username || expense.user_name || 'Guest')}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-lg font-bold">{formatINR(parseFloat(expense.price.toString()))}</div>
                            {expense.user_id === user?.id && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteExpense(expense.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>

            <div className="animate-slide-down">
              <h2 className="text-xl font-bold mb-4">Members</h2>
              <div className="space-y-2">
                {members.map((member) => (
                  <Card key={member.id}>
                    <CardContent className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">
                            {member.user_id === user?.id ? 'You' : (member.username || 'Guest')}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Joined {new Date(member.joined_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
        </main>

        {showSplitHierarchy && (
          <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm flex items-center justify-center">
            <div className="w-full max-w-2xl mx-4">
              <Card className="shadow-xl border-primary/30">
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                  <div>
                    <CardTitle>Hierarchical Split</CardTitle>
                    <CardDescription>
                      Equal-split settlement — who pays whom in this room
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setShowSplitHierarchy(false)}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                </CardHeader>
                <CardContent>
                  {members.length === 0 ? (
                    <div className="text-sm text-muted-foreground">Add members to calculate splits.</div>
                  ) : transfers.length === 0 ? (
                    <div className="text-sm text-muted-foreground">All settled — nobody owes anybody.</div>
                  ) : (
                    <Accordion type="single" collapsible>
                      {Object.keys(transfersByCreditor)
                        .sort((a, b) => (totalByCreditor[b] || 0) - (totalByCreditor[a] || 0))
                        .map((creditorId) => (
                          <AccordionItem key={creditorId} value={creditorId}>
                            <AccordionTrigger>
                              <div className="flex w-full items-center justify-between pr-2">
                                <span className="font-medium">{getMemberName(creditorId)}</span>
                                <span className="text-primary font-semibold">
                                  +{formatINR(totalByCreditor[creditorId] || 0)}
                                </span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-2">
                                {(transfersByCreditor[creditorId] || []).map((t, idx) => (
                                  <div
                                    key={`${t.fromUserId}-${idx}`}
                                    className="flex items-center justify-between rounded-md bg-muted/20 px-3 py-2"
                                  >
                                    <div className="text-sm">
                                      <span className="font-medium text-destructive">{getMemberName(t.fromUserId)}</span>
                                      <span className="text-muted-foreground"> pays </span>
                                      <span className="font-medium">{getMemberName(t.toUserId)}</span>
                                    </div>
                                    <div className="text-sm font-semibold">{formatINR(t.amount)}</div>
                                  </div>
                                ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                    </Accordion>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
  );
}
