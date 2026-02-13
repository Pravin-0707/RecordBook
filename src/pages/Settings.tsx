import { useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Download, Upload, AlertCircle, Moon, Sun, Smartphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/components/ThemeProvider";
import LZString from "lz-string";

const Settings = () => {
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [businessName, setBusinessName] = useState(user?.businessName || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [address, setAddress] = useState(user?.address || "");
  const [gstNumber, setGstNumber] = useState(user?.gstNumber || "");
  const [saved, setSaved] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useState(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ 
      businessName: businessName.trim(), 
      phone: phone.trim(),
      address: address.trim(),
      gstNumber: gstNumber.trim()
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleExport = () => {
    try {
      const data = {
        users: localStorage.getItem("kb_users"),
        currentUser: localStorage.getItem("kb_current_user"),
        customers: localStorage.getItem("kb_customers"),
        transactions: localStorage.getItem("kb_transactions"),
        reminders: localStorage.getItem("kb_reminders"),
        saleBills: localStorage.getItem("kb_sale_bills"),
        exportDate: new Date().toISOString(),
      };

      const jsonStr = JSON.stringify(data);
      const compressed = LZString.compressToBase64(jsonStr);
      const blob = new Blob([compressed], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ledger-backup-${new Date().toISOString().split("T")[0]}.dlb`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Backup Created",
        description: "Your data has been exported successfully.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to create backup file.",
        variant: "destructive",
      });
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const compressed = event.target?.result as string;
        const jsonStr = LZString.decompressFromBase64(compressed);
        if (!jsonStr) throw new Error("Invalid backup file");

        const data = JSON.parse(jsonStr);
        
        if (confirm("This will replace all current data. Continue?")) {
          if (data.users) localStorage.setItem("kb_users", data.users);
          if (data.currentUser) localStorage.setItem("kb_current_user", data.currentUser);
          if (data.customers) localStorage.setItem("kb_customers", data.customers);
          if (data.transactions) localStorage.setItem("kb_transactions", data.transactions);
          if (data.reminders) localStorage.setItem("kb_reminders", data.reminders);
          if (data.saleBills) localStorage.setItem("kb_sale_bills", data.saleBills);

          toast({
            title: "Backup Restored",
            description: "Your data has been imported successfully.",
          });

          setTimeout(() => window.location.reload(), 1000);
        }
      } catch (error) {
        toast({
          title: "Import Failed",
          description: "Invalid or corrupted backup file.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  return (
    <div className="lg:pb-0 pb-20">
      <div className="bg-primary px-4 lg:px-8 pt-6 pb-4 text-primary-foreground">
        <h1 className="text-xl lg:text-3xl font-extrabold">Settings</h1>
      </div>

      <div className="px-4 lg:px-8 mt-4 max-w-2xl mx-auto space-y-4">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Business Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-3">
              <div className="space-y-1">
                <Label>Business Name</Label>
                <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Phone Number</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Your phone number" />
              </div>
              <div className="space-y-1">
                <Label>Address (Optional)</Label>
                <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Business address" />
              </div>
              <div className="space-y-1">
                <Label>GST Number (Optional)</Label>
                <Input value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} placeholder="GST registration number" />
              </div>
              <div className="space-y-1">
                <Label>Email</Label>
                <Input value={user?.email || ""} disabled className="opacity-60" />
              </div>
              <Button type="submit" className="w-full font-bold">
                {saved ? "✓ Saved" : "Save Changes"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Appearance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Theme</Label>
              <div className="flex gap-2">
                <Button
                  variant={theme === "light" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTheme("light")}
                >
                  <Sun className="h-4 w-4" />
                </Button>
                <Button
                  variant={theme === "dark" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTheme("dark")}
                >
                  <Moon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Install App</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
              <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Install RecordBook as an app on your device for quick access and offline support.
              </p>
            </div>
            {deferredPrompt ? (
              <Button onClick={handleInstallApp} variant="outline" className="w-full font-bold">
                <Smartphone className="h-4 w-4 mr-2" /> Install App
              </Button>
            ) : (
              <div className="text-sm text-muted-foreground text-center py-2">
                App already installed or not available on this device
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Backup & Restore</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
              <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Export your data to a compressed backup file (.dlb). Import to restore data on any device.
              </p>
            </div>
            <Button onClick={handleExport} variant="outline" className="w-full font-bold">
              <Download className="h-4 w-4 mr-2" /> Export Backup
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".dlb"
              onChange={handleImport}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="w-full font-bold"
            >
              <Upload className="h-4 w-4 mr-2" /> Import Backup
            </Button>
          </CardContent>
        </Card>

        <Button
          variant="outline"
          className="w-full h-12 text-destructive border-destructive/30 font-bold"
          onClick={() => { logout(); navigate("/auth"); }}
        >
          <LogOut className="h-4 w-4 mr-2" /> Sign Out
        </Button>
      </div>
    </div>
  );
};

export default Settings;
