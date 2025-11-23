import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { AdminPanel } from "@/components/AdminPanel";

// Declare Telegram WebApp types
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
          };
        };
        ready: () => void;
        expand: () => void;
      };
    };
  }
}

const Index = () => {
  const [telegramUsername, setTelegramUsername] = useState<string>("");
  const [telegramUser, setTelegramUser] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("Full");
  const [gamePlus, setGamePlus] = useState("");
  const [options, setOptions] = useState({
    freshId: false,
    codeAapDoge: false,
    noIphone: false,
    noKingPass: false,
    autoLoss: false,
  });
  const [agreedToRules, setAgreedToRules] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [userBalance, setUserBalance] = useState(0);

  // Initialize Telegram Mini App and get user data
  useEffect(() => {
    const initializeApp = async () => {
      console.log('🚀 Initializing mini app...');
      console.log('📱 Telegram WebApp available:', !!window.Telegram?.WebApp);
      
      if (window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();

        const user = tg.initDataUnsafe?.user;
        console.log('👤 Telegram user data:', user);
        
        if (user) {
          setTelegramUser(user);
          if (user.username) {
            setTelegramUsername(user.username);
            console.log('✅ Telegram user detected:', user.username, 'ID:', user.id);
          } else {
            console.log('Telegram user has no username');
            toast.info(`Welcome ${user.first_name}! (No username set in Telegram)`);
          }

          // Check if user is admin
          console.log('🔍 Checking admin status...');
          const adminResult = await checkAdminStatus(user.id);
          console.log('👑 Is admin:', adminResult);
          
          // Get user balance - CRITICAL STEP
          console.log('💰 Fetching user balance for ID:', user.id);
          const balance = await getUserBalance(user.id);
          console.log('✅ Balance loaded:', balance);
          
          if (balance > 0) {
            toast.success(`Welcome! Your balance: ₹${balance.toFixed(2)}`);
          }
        } else {
          console.log('❌ Not running in Telegram Mini App - no user data');
          toast.info("Open this app in Telegram for automatic username detection");
          setCheckingAdmin(false);
        }
      } else {
        console.log('❌ Telegram WebApp not available');
        setCheckingAdmin(false);
      }
    };

    initializeApp();
  }, []);

  const checkAdminStatus = async (telegramUserId: number) => {
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      
      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .eq('telegram_user_id', telegramUserId)
        .maybeSingle();

      if (!error && data) {
        setIsAdmin(true);
        console.log('✅ Admin access granted');
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Error checking admin status:', error);
      return false;
    } finally {
      setCheckingAdmin(false);
    }
  };

  const getUserBalance = async (telegramUserId: number) => {
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      
      const { data, error } = await supabase
        .from('users')
        .select('balance')
        .eq('telegram_user_id', telegramUserId)
        .maybeSingle();

      console.log('💰 Fetching balance for user:', telegramUserId);

      if (!error && data) {
        const balance = typeof data.balance === 'number' ? data.balance : parseFloat(data.balance || '0');
        console.log('✅ Balance loaded:', balance);
        setUserBalance(balance);
        return balance;
      } else if (error) {
        console.error('❌ Error fetching balance:', error);
      }
      return 0;
    } catch (error) {
      console.error('❌ Error getting user balance:', error);
      return 0;
    }
  };

  // Auto-refresh balance every 10 seconds
  useEffect(() => {
    if (!telegramUser?.id) return;

    console.log('⏰ Setting up auto-refresh for balance every 10 seconds');
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing balance...');
      getUserBalance(telegramUser.id);
    }, 10000); // Refresh every 10 seconds

    return () => {
      console.log('⏰ Clearing auto-refresh interval');
      clearInterval(interval);
    };
  }, [telegramUser?.id]);

  // Subscribe to real-time balance updates
  useEffect(() => {
    if (!telegramUser?.id) {
      console.log('No telegram user, skipping real-time subscription');
      return;
    }

    const setupRealtimeSubscription = async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      
      console.log('🔄 Setting up real-time balance subscription for user:', telegramUser.id);
      
      const channel = supabase
        .channel(`balance-changes-${telegramUser.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'users',
            filter: `telegram_user_id=eq.${telegramUser.id}`
          },
          (payload) => {
            console.log('✅ Balance updated in real-time!', payload);
            if (payload.new && 'balance' in payload.new) {
              const newBalance = typeof payload.new.balance === 'number' 
                ? payload.new.balance 
                : parseFloat(payload.new.balance || '0');
              console.log('💰 New balance:', newBalance);
              setUserBalance(newBalance);
              toast.success(`💰 Balance Updated: ₹${newBalance.toFixed(2)}`, {
                description: 'Your balance has been updated by admin'
              });
            }
          }
        )
        .subscribe((status) => {
          console.log('📡 Real-time subscription status:', status);
        });

      return () => {
        console.log('🔌 Cleaning up real-time subscription');
        supabase.removeChannel(channel);
      };
    };

    const cleanup = setupRealtimeSubscription();
    return () => {
      cleanup.then(fn => fn && fn());
    };
  }, [telegramUser?.id]);

  // Last table request data
  const lastTableRequest = {
    amount: "600",
    type: "Full",
    gamePlus: "0",
    options: {
      freshId: false,
      codeAapDoge: false,
      noIphone: false,
      noKingPass: false,
      autoLoss: false,
    }
  };

  const amountButtons = [1000, 2000, 3000, 5000, 7000, 8000, 10000];
  const gamePlusButtons = [100, 200, 500, 1000];

  const handleCopyTable = () => {
    setAmount(lastTableRequest.amount);
    setType(lastTableRequest.type);
    setGamePlus(lastTableRequest.gamePlus);
    setOptions(lastTableRequest.options);
    toast.success("Last table request copied to form");
  };

  const handleEditTable = () => {
    setAmount(lastTableRequest.amount);
    setType(lastTableRequest.type);
    setGamePlus(lastTableRequest.gamePlus);
    setOptions(lastTableRequest.options);
    toast.success("Ready to edit - modify the form and send");
  };

  const handleSendTable = async () => {
    if (!amount) {
      toast.error("Please enter an amount");
      return;
    }
    if (!agreedToRules) {
      toast.error("Please agree to the game rules");
      return;
    }

    try {
      const { supabase } = await import("@/integrations/supabase/client");
      
      // Send to Telegram with auto-detected username
      const { data: telegramData, error: telegramError } = await supabase.functions.invoke('send-telegram-message', {
        body: {
          username: telegramUsername || 'Anonymous',
          telegram_user_id: telegramUser?.id,
          telegram_first_name: telegramUser?.first_name,
          amount,
          type,
          gamePlus,
          options,
          balance: `₹${userBalance.toFixed(2)}`,
        },
      });

      if (telegramError) throw telegramError;

      // Save to Supabase tables
      const tableData = {
        creator_telegram_user_id: telegramUser?.id,
        amount: parseFloat(amount),
        game_type: type,
        options: gamePlus ? `Game+: ${gamePlus}` : null,
        status: 'open',
        table_number: Math.floor(Math.random() * 9000) + 1000,
      };

      const { error: dbError } = await supabase
        .from('tables')
        .insert(tableData);

      if (dbError) {
        console.error('Database save error:', dbError);
        toast.warning("Sent to Telegram but failed to save to database");
      }

      const selectedOptions = Object.entries(options)
        .filter(([_, value]) => value)
        .map(([key]) => key)
        .join(", ") || "None";

      toast.success("Table sent successfully!", {
        description: `Sent to Telegram and saved to database. Amount: ₹${amount}`,
      });
    } catch (error) {
      console.error('Error:', error);
      toast.error("Failed to send table", {
        description: "Please check configuration",
      });
    }
  };

  const handleOptionChange = (key: keyof typeof options) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (checkingAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="text-2xl mb-2">⏳</div>
          <div className="text-sm text-muted-foreground">Loading your account...</div>
          <div className="text-xs text-muted-foreground">Connecting to Telegram...</div>
        </div>
      </div>
    );
  }

  if (isAdmin) {
    return <AdminPanel />;
  }

  return (
    <div className="min-h-screen bg-background w-full">
      {/* Header */}
      <header className="border-b border-border bg-card py-1.5 px-2.5">
        <div className="flex items-center justify-between">
          <button className="text-lg">✕</button>
          <h1 className="text-sm font-semibold">DeepNightClubBot</h1>
          <div className="flex gap-1">
            <button className="text-lg">⌄</button>
            <button className="text-lg">⋮</button>
          </div>
        </div>
      </header>

      {/* Club Header */}
      <div className="border-b border-border bg-card py-1.5 px-2.5">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
            <span className="text-xs">🎲</span>
          </div>
          <h2 className="text-sm font-bold">DEEP NIGHT LUDO CLUB</h2>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-2.5 space-y-2.5 w-full mx-auto">
        {/* User Info */}
        {telegramUsername && (
          <Card className="p-2.5 bg-primary/5 border-primary/20">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Sending as:</span>
              <span className="text-sm font-medium">@{telegramUsername}</span>
              <span className="ml-auto text-xs text-green-600">✓ Auto-detected</span>
            </div>
          </Card>
        )}

        {/* Balance */}
        <div className="flex justify-between items-center border-b border-border pb-1.5">
          <h3 className="text-sm font-semibold">Table Details</h3>
          <div className="text-[11px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded">
            💵 Balance: ₹{userBalance?.toFixed(2) || '0.00'}
          </div>
        </div>

        {/* Last Table Request Card */}
        <Card className="p-2 bg-muted/50 space-y-1.5">
          <div className="flex items-center gap-1 text-muted-foreground">
            <span className="text-xs">🕐</span>
            <h4 className="text-xs font-medium text-foreground">Last Table Request</h4>
          </div>
          <div className="space-y-0.5 text-[11px]">
            <div>💰 ₹600.00 🃏 Full 📉 0</div>
            <div>⚙️ Options: None</div>
          </div>
          <div className="flex gap-1.5">
            <Button variant="secondary" size="sm" className="flex-1 h-7 text-[11px] px-2" onClick={handleCopyTable}>
              🔄 Copy Table
            </Button>
            <Button variant="secondary" size="sm" className="flex-1 h-7 text-[11px] px-2" onClick={handleEditTable}>
              ✏️ Edit Table
            </Button>
          </div>
        </Card>

        {/* Amount Section */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium flex items-center gap-1">
            💰 Amount
          </label>
          <Input
            type="number"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="h-8 text-xs"
          />
          <div className="flex flex-wrap gap-1">
            {amountButtons.map((value) => (
              <Button
                key={value}
                variant="outline"
                size="sm"
                className="h-6 text-[11px] px-1.5"
                onClick={() => setAmount(value.toString())}
              >
                ₹{value}
              </Button>
            ))}
          </div>
        </div>

        {/* Type Section */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium flex items-center gap-1">
            🃏 Type
          </label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              <SelectItem value="Full">Full</SelectItem>
              <SelectItem value="Ulta">Ulta</SelectItem>
              <SelectItem value="Popular">Popular</SelectItem>
              <SelectItem value="3 Goti">3 Goti</SelectItem>
              <SelectItem value="2 Goti">2 Goti</SelectItem>
              <SelectItem value="1 Goti">1 Goti</SelectItem>
              <SelectItem value="1 Goti Quick">1 Goti Quick</SelectItem>
              <SelectItem value="Snake">Snake</SelectItem>
              <SelectItem value="Ulta Snake">Ulta Snake</SelectItem>
              <SelectItem value="Snake Re-Roll">Snake Re-Roll</SelectItem>
              <SelectItem value="Not Cut">Not Cut</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Game+ Section */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium flex items-center gap-1">
            📈 Game+
          </label>
          <Input
            type="number"
            placeholder="Enter Game+"
            value={gamePlus}
            onChange={(e) => setGamePlus(e.target.value)}
            className="h-8 text-xs"
          />
          <div className="flex flex-wrap gap-1">
            {gamePlusButtons.map((value) => (
              <Button
                key={value}
                variant="outline"
                size="sm"
                className="h-6 text-[11px] px-1.5"
                onClick={() => setGamePlus(value.toString())}
              >
                {value}+
              </Button>
            ))}
          </div>
        </div>

        {/* Options Section */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium flex items-center gap-1">
            ⚙️ Options
          </label>
          <div className="space-y-1.5">
            <div className="flex items-center space-x-1.5">
              <Checkbox
                id="freshId"
                checked={options.freshId}
                onCheckedChange={() => handleOptionChange("freshId")}
                className="h-3.5 w-3.5"
              />
              <label htmlFor="freshId" className="text-[11px] cursor-pointer">
                Fresh Id
              </label>
            </div>
            <div className="flex items-center space-x-1.5">
              <Checkbox
                id="codeAapDoge"
                checked={options.codeAapDoge}
                onCheckedChange={() => handleOptionChange("codeAapDoge")}
                className="h-3.5 w-3.5"
              />
              <label htmlFor="codeAapDoge" className="text-[11px] cursor-pointer">
                Code aap doge
              </label>
            </div>
            <div className="flex items-center space-x-1.5">
              <Checkbox
                id="noIphone"
                checked={options.noIphone}
                onCheckedChange={() => handleOptionChange("noIphone")}
                className="h-3.5 w-3.5"
              />
              <label htmlFor="noIphone" className="text-[11px] cursor-pointer">
                No iPhone
              </label>
            </div>
            <div className="flex items-center space-x-1.5">
              <Checkbox
                id="noKingPass"
                checked={options.noKingPass}
                onCheckedChange={() => handleOptionChange("noKingPass")}
                className="h-3.5 w-3.5"
              />
              <label htmlFor="noKingPass" className="text-[11px] cursor-pointer">
                No king pass
              </label>
            </div>
            <div className="flex items-center space-x-1.5">
              <Checkbox
                id="autoLoss"
                checked={options.autoLoss}
                onCheckedChange={() => handleOptionChange("autoLoss")}
                className="h-3.5 w-3.5"
              />
              <label htmlFor="autoLoss" className="text-[11px] cursor-pointer">
                Auto loss
              </label>
            </div>
          </div>
        </div>

        {/* Agreement */}
        <div className="flex items-center gap-1.5 text-[11px] text-foreground">
          <Checkbox
            id="agree"
            checked={agreedToRules}
            onCheckedChange={(checked) => setAgreedToRules(checked as boolean)}
            className="h-3.5 w-3.5"
          />
          <label htmlFor="agree" className="cursor-pointer">
            I am agree with the{" "}
            <a href="#" className="text-accent underline">
              Game Rules
            </a>
          </label>
        </div>

        {/* Send Button */}
        <Button
          onClick={handleSendTable}
          disabled={!agreedToRules}
          className="w-full h-9 text-xs font-medium bg-primary hover:bg-primary/90"
        >
          ✅ Send Table
        </Button>
      </div>
    </div>
  );
};

export default Index;
