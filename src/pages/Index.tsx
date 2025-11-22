import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

const Index = () => {
  const [savedUsername, setSavedUsername] = useState("");
  const [showUsernameSetup, setShowUsernameSetup] = useState(false);
  const [tempUsername, setTempUsername] = useState("");
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

  // Load saved username on mount
  useEffect(() => {
    const stored = localStorage.getItem('telegramUsername');
    if (stored) {
      setSavedUsername(stored);
    } else {
      setShowUsernameSetup(true);
    }
  }, []);

  const handleSaveUsername = () => {
    if (!tempUsername.trim()) {
      toast.error("Please enter your username");
      return;
    }
    const username = tempUsername.startsWith('@') ? tempUsername : `@${tempUsername}`;
    localStorage.setItem('telegramUsername', username);
    setSavedUsername(username);
    setShowUsernameSetup(false);
    toast.success(`Username saved: ${username}`);
  };

  const handleChangeUsername = () => {
    setTempUsername(savedUsername);
    setShowUsernameSetup(true);
  };

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
    if (!savedUsername) {
      toast.error("Please set your username first");
      setShowUsernameSetup(true);
      return;
    }
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
      
      // Send to Telegram with saved username
      const { data: telegramData, error: telegramError } = await supabase.functions.invoke('send-telegram-message', {
        body: {
          username: savedUsername.replace('@', ''),
          amount,
          type,
          gamePlus,
          options,
          balance: "₹28.00",
        },
      });

      if (telegramError) throw telegramError;

      // Save to MongoDB
      const tableData = {
        username: savedUsername,
        amount,
        type,
        gamePlus: gamePlus || "0",
        options,
        balance: "₹28.00",
        timestamp: new Date().toISOString(),
      };

      const { data: mongoData, error: mongoError } = await supabase.functions.invoke('mongodb-operations', {
        body: {
          operation: 'insert',
          collection: 'tables',
          data: tableData,
        },
      });

      if (mongoError) {
        console.error('MongoDB save error:', mongoError);
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
        {/* Username Setup Modal */}
        {showUsernameSetup && (
          <Card className="p-4 bg-primary/5 border-primary/20">
            <div className="space-y-3">
              <div className="text-center space-y-1">
                <h3 className="text-sm font-semibold">👤 Set Your Username</h3>
                <p className="text-xs text-muted-foreground">
                  This will be used automatically for all tables
                </p>
              </div>
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Enter username (with or without @)"
                  value={tempUsername}
                  onChange={(e) => setTempUsername(e.target.value)}
                  className="h-9 text-sm"
                  onKeyPress={(e) => e.key === 'Enter' && handleSaveUsername()}
                />
                <Button 
                  onClick={handleSaveUsername}
                  className="w-full h-9 text-sm"
                >
                  💾 Save Username
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Current Username Display */}
        {savedUsername && !showUsernameSetup && (
          <Card className="p-2.5 bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Sending as:</span>
                <span className="text-sm font-medium">{savedUsername}</span>
              </div>
              <Button 
                onClick={handleChangeUsername}
                variant="ghost" 
                size="sm" 
                className="h-7 text-xs"
              >
                ✏️ Change
              </Button>
            </div>
          </Card>
        )}

        {/* Balance */}
        <div className="flex justify-between items-center border-b border-border pb-1.5">
          <h3 className="text-sm font-semibold">Table Details</h3>
          <div className="text-[11px] font-medium text-green-600">
            💵 Balance: ₹28.00
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
