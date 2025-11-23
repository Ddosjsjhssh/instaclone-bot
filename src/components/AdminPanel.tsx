import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

interface User {
  id: string;
  telegram_user_id: number;
  telegram_first_name: string;
  username: string;
  balance: number;
}

export const AdminPanel = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [fundAmount, setFundAmount] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadUsers();
    
    // Subscribe to real-time balance updates
    const setupRealtimeSubscription = async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      
      const channel = supabase
        .channel('admin-balance-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'users'
          },
          (payload) => {
            console.log('User balance updated:', payload);
            // Reload users when any balance changes
            loadUsers();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    setupRealtimeSubscription();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (data) {
        setUsers(data);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleAddFunds = async () => {
    if (!selectedUser || !fundAmount) {
      toast.error("Please select a user and enter amount");
      return;
    }

    const amount = parseFloat(fundAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    try {
      const { supabase } = await import("@/integrations/supabase/client");
      
      const newBalance = (selectedUser.balance || 0) + amount;
      
      const { error } = await supabase
        .from('users')
        .update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq('telegram_user_id', selectedUser.telegram_user_id);

      if (error) throw error;

      toast.success(`Added ₹${amount} to ${selectedUser.username}'s account`);
      setFundAmount("");
      setSelectedUser(null);
      loadUsers();
    } catch (error) {
      console.error('Error adding funds:', error);
      toast.error("Failed to add funds");
    }
  };

  const filteredUsers = users.filter(user => 
    user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.telegram_first_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background w-full">
      {/* Header */}
      <header className="border-b border-border bg-card py-3 px-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold">👑 Admin Panel</h1>
          <Button 
            variant="outline" 
            size="sm"
            onClick={loadUsers}
            disabled={loading}
          >
            🔄 Refresh
          </Button>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Search */}
        <Input
          placeholder="🔍 Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-10"
        />

        {/* Add Funds Card */}
        {selectedUser && (
          <Card className="p-4 bg-primary/5 border-primary space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{selectedUser.username}</h3>
                <p className="text-sm text-muted-foreground">
                  Current Balance: ₹{selectedUser.balance || 0}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedUser(null)}
              >
                ✕
              </Button>
            </div>
            <div className="space-y-2">
              <Input
                type="number"
                placeholder="Enter amount to add"
                value={fundAmount}
                onChange={(e) => setFundAmount(e.target.value)}
              />
              <div className="flex gap-2">
                {[100, 500, 1000, 5000].map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    onClick={() => setFundAmount(amount.toString())}
                  >
                    ₹{amount}
                  </Button>
                ))}
              </div>
              <Button
                onClick={handleAddFunds}
                className="w-full"
              >
                💰 Add Funds
              </Button>
            </div>
          </Card>
        )}

        {/* Users List */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Users ({filteredUsers.length})
          </h2>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading users...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No users found
            </div>
          ) : (
            filteredUsers.map((user) => (
              <Card
                key={user.id}
                className="p-3 cursor-pointer hover:bg-accent transition-colors"
                onClick={() => setSelectedUser(user)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">@{user.username}</div>
                    <div className="text-sm text-muted-foreground">
                      {user.telegram_first_name}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-green-600">
                      ₹{user.balance || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Balance
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
