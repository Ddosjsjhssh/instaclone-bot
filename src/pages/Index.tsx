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
    <div className="min-h-screen bg-background w-full">
      {/* Header */}
      <header className="border-b border-border bg-card py-2 px-3">
        <div className="flex items-center justify-between">
          <button className="text-xl">✕</button>
          <h1 className="text-base font-semibold">DeepNightClubBot</h1>
          <div className="flex gap-1.5">
            <button className="text-xl">⌄</button>
            <button className="text-xl">⋮</button>
          </div>
        </div>
      </header>

      {/* Club Header */}
      <div className="border-b border-border bg-card py-2.5 px-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
            <span className="text-xs">🎲</span>
          </div>
          <h2 className="text-base font-bold">DEEP NIGHT LUDO CLUB</h2>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-3 space-y-3 w-full mx-auto">
        {/* Balance */}
        <div className="flex justify-between items-center border-b border-border pb-2">
          <h3 className="text-base font-semibold">Table Details</h3>
          <div className="text-xs font-medium text-green-600">
            💵 Balance: ₹28.00
          </div>
        </div>

        {/* Last Table Request Card */}
        <Card className="p-3 bg-muted/50 space-y-2">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <span className="text-sm">🕐</span>
            <h4 className="text-sm font-medium text-foreground">Last Table Request</h4>
          </div>
          <div className="space-y-0.5 text-xs">
            <div>💰 ₹600.00 🃏 Full 📉 0</div>
            <div>⚙️ Options: None</div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" className="flex-1 h-8 text-xs" onClick={handleCopyTable}>
              🔄 Copy Table
            </Button>
            <Button variant="secondary" size="sm" className="flex-1 h-8 text-xs" onClick={handleEditTable}>
              ✏️ Edit Table
            </Button>
          </div>
        </Card>

        {/* Amount Section */}
        <div className="space-y-2">
          <label className="text-xs font-medium flex items-center gap-1">
            💰 Amount
          </label>
          <Input
            type="number"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="h-9 text-sm"
          />
          <div className="flex flex-wrap gap-1.5">
            {amountButtons.map((value) => (
              <Button
                key={value}
                variant="outline"
                size="sm"
                className="h-7 text-xs px-2"
                onClick={() => setAmount(value.toString())}
              >
                ₹{value}
              </Button>
            ))}
          </div>
        </div>

        {/* Type Section */}
        <div className="space-y-2">
          <label className="text-xs font-medium flex items-center gap-1">
            🃏 Type
          </label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="h-9 text-sm">
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
        <div className="space-y-2">
          <label className="text-xs font-medium flex items-center gap-1">
            📈 Game+
          </label>
          <Input
            type="number"
            placeholder="Enter Game+"
            value={gamePlus}
            onChange={(e) => setGamePlus(e.target.value)}
            className="h-9 text-sm"
          />
          <div className="flex flex-wrap gap-1.5">
            {gamePlusButtons.map((value) => (
              <Button
                key={value}
                variant="outline"
                size="sm"
                className="h-7 text-xs px-2"
                onClick={() => setGamePlus(value.toString())}
              >
                {value}+
              </Button>
            ))}
          </div>
        </div>

        {/* Options Section */}
        <div className="space-y-2">
          <label className="text-xs font-medium flex items-center gap-1">
            ⚙️ Options
          </label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="freshId"
                checked={options.freshId}
                onCheckedChange={() => handleOptionChange("freshId")}
                className="h-4 w-4"
              />
              <label htmlFor="freshId" className="text-xs cursor-pointer">
                Fresh Id
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="codeAapDoge"
                checked={options.codeAapDoge}
                onCheckedChange={() => handleOptionChange("codeAapDoge")}
                className="h-4 w-4"
              />
              <label htmlFor="codeAapDoge" className="text-xs cursor-pointer">
                Code aap doge
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="noIphone"
                checked={options.noIphone}
                onCheckedChange={() => handleOptionChange("noIphone")}
                className="h-4 w-4"
              />
              <label htmlFor="noIphone" className="text-xs cursor-pointer">
                No iPhone
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="noKingPass"
                checked={options.noKingPass}
                onCheckedChange={() => handleOptionChange("noKingPass")}
                className="h-4 w-4"
              />
              <label htmlFor="noKingPass" className="text-xs cursor-pointer">
                No king pass
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="autoLoss"
                checked={options.autoLoss}
                onCheckedChange={() => handleOptionChange("autoLoss")}
                className="h-4 w-4"
              />
              <label htmlFor="autoLoss" className="text-xs cursor-pointer">
                Auto loss
              </label>
            </div>
          </div>
        </div>

        {/* Agreement */}
        <div className="flex items-center gap-2 text-xs text-foreground">
          <Checkbox
            id="agree"
            checked={agreedToRules}
            onCheckedChange={(checked) => setAgreedToRules(checked as boolean)}
            className="h-4 w-4"
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
          className="w-full h-11 text-sm font-medium bg-primary hover:bg-primary/90"
        >
          ✅ Send Table
        </Button>
      </div>
    </div>
  );
};

export default Index;
