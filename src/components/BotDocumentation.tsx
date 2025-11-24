import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

export const BotDocumentation = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card py-4 px-6 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="text-3xl">🎲</div>
            <div>
              <h1 className="text-2xl font-bold">Deep Night Ludo Club Bot</h1>
              <p className="text-sm text-muted-foreground">Complete Overview & Documentation</p>
            </div>
          </div>
        </div>
      </header>

      <ScrollArea className="h-[calc(100vh-88px)]">
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          
          {/* Introduction */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>📖</span> Introduction
              </CardTitle>
              <CardDescription>Deep Night Ludo Club Bot ke bare mein</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm">
                Deep Night Ludo Club Bot ek Telegram Mini App hai jo users ko ludo game tables create aur manage karne mein madad karta hai. 
                Ye bot paise ki betting ke saath ludo games organize karta hai aur users ki balances ko manage karta hai.
              </p>
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p className="text-sm font-semibold">Key Features:</p>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li>Telegram Mini App integration</li>
                  <li>Real-time balance updates</li>
                  <li>Table creation with multiple options</li>
                  <li>Admin panel for user management</li>
                  <li>Automated fund management</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* How It Works */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>⚙️</span> Kaise Kaam Karta Hai
              </CardTitle>
              <CardDescription>Bot ka workflow samjhiye</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-semibold text-sm mb-2">1. User Registration 👤</h4>
                  <p className="text-sm text-muted-foreground">
                    Jab koi user pehli baar bot use karta hai, uska account automatically create ho jata hai. 
                    Telegram se user ki details (username, user ID, first name) automatically fetch ho jati hain.
                  </p>
                </div>

                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-semibold text-sm mb-2">2. Balance Management 💰</h4>
                  <p className="text-sm text-muted-foreground">
                    Har user ka ek balance hota hai jo admin add/deduct kar sakta hai. 
                    Balance real-time update hota hai - matlab agar admin balance add kare to turant user ko notification milta hai.
                  </p>
                </div>

                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-semibold text-sm mb-2">3. Table Creation 🎲</h4>
                  <p className="text-sm text-muted-foreground">
                    User apne balance se table create kar sakta hai. Table mein amount, game type (Full/Quick), 
                    Game+ value, aur special options (Fresh ID, Code required, etc.) select kar sakta hai.
                  </p>
                </div>

                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-semibold text-sm mb-2">4. Telegram Group Integration 📢</h4>
                  <p className="text-sm text-muted-foreground">
                    Jab user table send karta hai, to wo message Telegram group mein post ho jata hai 
                    taaki dusre users usse join kar sakein. Message mein user ki details aur table ki puri information hoti hai.
                  </p>
                </div>

                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-semibold text-sm mb-2">5. Admin Controls 👑</h4>
                  <p className="text-sm text-muted-foreground">
                    Admin panel se admins sab users ko dekh sakte hain, unke balances manage kar sakte hain, 
                    aur "Place New Table" button ko group mein pin kar sakte hain.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Features */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>👤</span> User Features
              </CardTitle>
              <CardDescription>Regular users ke liye available features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="bg-muted p-3 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2">💵 Balance Display</h4>
                  <p className="text-sm text-muted-foreground">
                    Apna current balance dekh sakte hain jo real-time update hota hai. 
                    Jab admin balance add kare to notification aata hai.
                  </p>
                </div>

                <div className="bg-muted p-3 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2">🎲 Table Creation</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Table create karne ke liye ye options available hain:
                  </p>
                  <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                    <li><strong>Amount:</strong> 1000, 2000, 3000, 5000, 7000, 8000, 10000</li>
                    <li><strong>Type:</strong> Full ya Quick game</li>
                    <li><strong>Game+:</strong> 100, 200, 500, 1000 (extra amount)</li>
                    <li><strong>Options:</strong> Fresh ID, Code required, No iPhone, No King Pass, Auto Loss</li>
                  </ul>
                </div>

                <div className="bg-muted p-3 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2">🕐 Last Table</h4>
                  <p className="text-sm text-muted-foreground">
                    Apni last table request ko dekh sakte hain aur usse copy ya edit kar sakte hain. 
                    Ye feature repeat tables banane mein madad karta hai.
                  </p>
                </div>

                <div className="bg-muted p-3 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2">⏱️ Cooldown System</h4>
                  <p className="text-sm text-muted-foreground">
                    Spam prevent karne ke liye 10 second ka cooldown hai. 
                    Matlab ek table send karne ke baad 10 seconds wait karna padega next table ke liye.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Admin Features */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>👑</span> Admin Features
              </CardTitle>
              <CardDescription>Admins ke liye special features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="bg-primary/5 border border-primary/20 p-3 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2">👥 View All Users</h4>
                  <p className="text-sm text-muted-foreground">
                    Sare registered users ki list dekh sakte hain with unke username, name, aur balance. 
                    Search functionality se kisi bhi user ko jaldi se dhundh sakte hain.
                  </p>
                </div>

                <div className="bg-primary/5 border border-primary/20 p-3 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2">💰 Add Funds</h4>
                  <p className="text-sm text-muted-foreground">
                    Kisi bhi user ke account mein funds add kar sakte hain. 
                    User ko real-time notification milega aur uska balance turant update ho jayega.
                  </p>
                </div>

                <div className="bg-primary/5 border border-primary/20 p-3 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2">📌 Send Pin Button</h4>
                  <p className="text-sm text-muted-foreground">
                    Telegram group mein "Place New Table" button send kar sakte hain jo users click karke 
                    mini app open kar sakte hain. Ye button group mein pin bhi ho jata hai.
                  </p>
                </div>

                <div className="bg-primary/5 border border-primary/20 p-3 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2">🔄 Real-time Updates</h4>
                  <p className="text-sm text-muted-foreground">
                    Admin panel automatically refresh hota hai jab bhi koi user ka balance change hota hai. 
                    Refresh button se manually bhi reload kar sakte hain.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bot Commands */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>⌨️</span> Bot Commands
              </CardTitle>
              <CardDescription>Telegram bot commands ki list</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="bg-muted p-3 rounded-lg">
                  <div className="flex items-start gap-2">
                    <code className="text-sm font-mono bg-background px-2 py-1 rounded">/viewusers</code>
                    <p className="text-sm text-muted-foreground flex-1">
                      Sab users aur unke balances dekhne ke liye
                    </p>
                  </div>
                </div>

                <div className="bg-muted p-3 rounded-lg">
                  <div className="flex items-start gap-2">
                    <code className="text-sm font-mono bg-background px-2 py-1 rounded">/checkbalance [user_id]</code>
                    <p className="text-sm text-muted-foreground flex-1">
                      Kisi specific user ka balance check karne ke liye
                    </p>
                  </div>
                </div>

                <div className="bg-muted p-3 rounded-lg">
                  <div className="flex items-start gap-2">
                    <code className="text-sm font-mono bg-background px-2 py-1 rounded">/addfund [user_id] [amount]</code>
                    <p className="text-sm text-muted-foreground flex-1">
                      User ke account mein funds add karne ke liye
                    </p>
                  </div>
                </div>

                <div className="bg-muted p-3 rounded-lg">
                  <div className="flex items-start gap-2">
                    <code className="text-sm font-mono bg-background px-2 py-1 rounded">/deductfund [user_id] [amount]</code>
                    <p className="text-sm text-muted-foreground flex-1">
                      User ke account se funds deduct karne ke liye
                    </p>
                  </div>
                </div>

                <div className="bg-muted p-3 rounded-lg">
                  <div className="flex items-start gap-2">
                    <code className="text-sm font-mono bg-background px-2 py-1 rounded">/makeadmin [user_id]</code>
                    <p className="text-sm text-muted-foreground flex-1">
                      Kisi user ko admin banana
                    </p>
                  </div>
                </div>

                <div className="bg-muted p-3 rounded-lg">
                  <div className="flex items-start gap-2">
                    <code className="text-sm font-mono bg-background px-2 py-1 rounded">/sendpinbutton</code>
                    <p className="text-sm text-muted-foreground flex-1">
                      Group mein "Place New Table" button send karna
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="bg-primary/5 border border-primary/20 p-3 rounded-lg">
                <h4 className="font-semibold text-sm mb-2">📝 Example Usage:</h4>
                <div className="space-y-1 font-mono text-xs">
                  <p>/checkbalance 123456789</p>
                  <p>/addfund 123456789 500</p>
                  <p>/deductfund 123456789 200</p>
                  <p>/makeadmin 123456789</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Database Structure */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>🗄️</span> Database Structure
              </CardTitle>
              <CardDescription>Backend database ki jankari</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="bg-muted p-3 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2">👥 Users Table</h4>
                  <p className="text-sm text-muted-foreground mb-2">User information store karta hai:</p>
                  <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                    <li>telegram_user_id: Unique Telegram ID</li>
                    <li>username: Telegram username</li>
                    <li>telegram_first_name: User ka first name</li>
                    <li>balance: Current balance (default: 0)</li>
                    <li>created_at & updated_at: Timestamps</li>
                  </ul>
                </div>

                <div className="bg-muted p-3 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2">👑 Admins Table</h4>
                  <p className="text-sm text-muted-foreground mb-2">Admin users ki list:</p>
                  <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                    <li>telegram_user_id: Admin ka Telegram ID</li>
                    <li>username: Admin ka username</li>
                    <li>created_at: Admin banane ka time</li>
                  </ul>
                </div>

                <div className="bg-muted p-3 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2">🎲 Tables Table</h4>
                  <p className="text-sm text-muted-foreground mb-2">Game tables ki history:</p>
                  <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                    <li>creator_telegram_user_id: Table banane wale ka ID</li>
                    <li>amount: Table ka amount</li>
                    <li>game_type: Full ya Quick</li>
                    <li>options: Selected options (Game+, Fresh ID, etc.)</li>
                    <li>status: open, accepted, completed</li>
                    <li>table_number: Random generated number</li>
                    <li>message_id: Telegram message ID</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Technical Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>🔧</span> Technical Architecture
              </CardTitle>
              <CardDescription>Technical implementation details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="bg-muted p-3 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2">Frontend</h4>
                  <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                    <li>React + TypeScript</li>
                    <li>Telegram Mini App SDK</li>
                    <li>Tailwind CSS for styling</li>
                    <li>Shadcn UI components</li>
                  </ul>
                </div>

                <div className="bg-muted p-3 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2">Backend</h4>
                  <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                    <li>Supabase (Database + Auth)</li>
                    <li>Edge Functions for bot logic</li>
                    <li>Real-time subscriptions</li>
                    <li>Telegram Bot API integration</li>
                  </ul>
                </div>

                <div className="bg-muted p-3 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2">Edge Functions</h4>
                  <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                    <li>send-telegram-message: Tables ko group mein send karta hai</li>
                    <li>telegram-webhook: Bot commands handle karta hai</li>
                    <li>send-pin-button: Pin button group mein send karta hai</li>
                  </ul>
                </div>

                <div className="bg-muted p-3 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2">Security Features</h4>
                  <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                    <li>Telegram authentication</li>
                    <li>Admin-only commands</li>
                    <li>Balance validation</li>
                    <li>Rate limiting (10s cooldown)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Support & Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>📞</span> Support & Contact
              </CardTitle>
              <CardDescription>Help aur support ke liye</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg text-center space-y-2">
                <p className="text-sm font-semibold">Agar koi problem ho ya help chahiye:</p>
                <p className="text-sm text-muted-foreground">Bot ke admin se contact karein</p>
                <p className="text-xs text-muted-foreground">Ya Telegram group mein message karein</p>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center py-6 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Deep Night Ludo Club Bot - Complete Documentation
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              © 2024 Deep Night Ludo Club. All rights reserved.
            </p>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};
