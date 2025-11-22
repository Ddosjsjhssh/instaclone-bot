import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

const Index = () => {
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

  const amountButtons = [1000, 2000, 3000, 5000, 7000, 8000, 10000];
  const gamePlusButtons = [100, 200, 500, 1000];

  const handleSendTable = () => {
    if (!amount) {
      toast.error("Please enter an amount");
      return;
    }
    if (!agreedToRules) {
      toast.error("Please agree to the game rules");
      return;
    }
    
    const selectedOptions = Object.entries(options)
      .filter(([_, value]) => value)
      .map(([key]) => key)
      .join(", ") || "None";

    toast.success("Table request sent successfully!", {
      description: `Amount: ₹${amount}, Type: ${type}, Game+: ${gamePlus || 0}, Options: ${selectedOptions}`,
    });
  };

  const handleOptionChange = (key: keyof typeof options) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card py-4 px-4">
        <div className="flex items-center justify-between">
          <button className="text-2xl">✕</button>
          <h1 className="text-xl font-semibold">DeepNightClubBot</h1>
          <div className="flex gap-2">
            <button className="text-2xl">⌄</button>
            <button className="text-2xl">⋮</button>
          </div>
        </div>
      </header>

      {/* Club Header */}
      <div className="border-b border-border bg-card py-4 px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <span className="text-sm">🎲</span>
          </div>
          <h2 className="text-lg font-bold">DEEP NIGHT LUDO CLUB</h2>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-4 max-w-2xl mx-auto">
        {/* Balance */}
        <div className="flex justify-between items-center border-b border-border pb-3">
          <h3 className="text-lg font-semibold">Table Details</h3>
          <div className="text-sm font-medium text-green-600">
            💵 Balance: ₹28.00
          </div>
        </div>

        {/* Last Table Request Card */}
        <Card className="p-4 bg-muted/50 space-y-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>🕐</span>
            <h4 className="font-medium text-foreground">Last Table Request</h4>
          </div>
          <div className="space-y-1 text-sm">
            <div>💰 ₹600.00 🃏 Full 📉 0</div>
            <div>⚙️ Options: None</div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1">
              🔄 Copy Table
            </Button>
            <Button variant="secondary" className="flex-1">
              ✏️ Edit Table
            </Button>
          </div>
        </Card>

        {/* Amount Section */}
        <div className="space-y-3">
          <label className="text-sm font-medium flex items-center gap-1">
            💰 Amount
          </label>
          <Input
            type="number"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="h-12"
          />
          <div className="flex flex-wrap gap-2">
            {amountButtons.map((value) => (
              <Button
                key={value}
                variant="outline"
                size="sm"
                onClick={() => setAmount(value.toString())}
              >
                ₹{value}
              </Button>
            ))}
          </div>
        </div>

        {/* Type Section */}
        <div className="space-y-3">
          <label className="text-sm font-medium flex items-center gap-1">
            🃏 Type
          </label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Full">Full</SelectItem>
              <SelectItem value="Half">Half</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Game+ Section */}
        <div className="space-y-3">
          <label className="text-sm font-medium flex items-center gap-1">
            📈 Game+
          </label>
          <Input
            type="number"
            placeholder="Enter Game+"
            value={gamePlus}
            onChange={(e) => setGamePlus(e.target.value)}
            className="h-12"
          />
          <div className="flex flex-wrap gap-2">
            {gamePlusButtons.map((value) => (
              <Button
                key={value}
                variant="outline"
                size="sm"
                onClick={() => setGamePlus(value.toString())}
              >
                {value}+
              </Button>
            ))}
          </div>
        </div>

        {/* Options Section */}
        <div className="space-y-3">
          <label className="text-sm font-medium flex items-center gap-1">
            ⚙️ Options
          </label>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="freshId"
                checked={options.freshId}
                onCheckedChange={() => handleOptionChange("freshId")}
              />
              <label htmlFor="freshId" className="text-sm cursor-pointer">
                Fresh Id
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="codeAapDoge"
                checked={options.codeAapDoge}
                onCheckedChange={() => handleOptionChange("codeAapDoge")}
              />
              <label htmlFor="codeAapDoge" className="text-sm cursor-pointer">
                Code aap doge
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="noIphone"
                checked={options.noIphone}
                onCheckedChange={() => handleOptionChange("noIphone")}
              />
              <label htmlFor="noIphone" className="text-sm cursor-pointer">
                No iPhone
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="noKingPass"
                checked={options.noKingPass}
                onCheckedChange={() => handleOptionChange("noKingPass")}
              />
              <label htmlFor="noKingPass" className="text-sm cursor-pointer">
                No king pass
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="autoLoss"
                checked={options.autoLoss}
                onCheckedChange={() => handleOptionChange("autoLoss")}
              />
              <label htmlFor="autoLoss" className="text-sm cursor-pointer">
                Auto loss
              </label>
            </div>
          </div>
        </div>

        {/* Agreement */}
        <div className="text-sm text-foreground">
          I am agree with the{" "}
          <a href="#" className="text-accent underline">
            Game Rules
          </a>
        </div>

        {/* Send Button */}
        <Button
          onClick={handleSendTable}
          disabled={!agreedToRules}
          className="w-full h-14 text-lg font-medium bg-primary hover:bg-primary/90"
        >
          ✅ Send Table
        </Button>

        {/* Hidden agreement checkbox for demo */}
        <div className="flex items-center space-x-2 pt-2">
          <Checkbox
            id="agree"
            checked={agreedToRules}
            onCheckedChange={(checked) => setAgreedToRules(checked as boolean)}
          />
          <label htmlFor="agree" className="text-xs text-muted-foreground cursor-pointer">
            I agree to the terms (required to send)
          </label>
        </div>
      </div>
    </div>
  );
};

export default Index;
