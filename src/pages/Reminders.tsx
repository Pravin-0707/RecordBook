import { useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getReminders, getCustomers, addReminder, deleteReminder, Reminder } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Send } from "lucide-react";
import { format, parseISO, isPast } from "date-fns";

const Reminders = () => {
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [selCustomer, setSelCustomer] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [message, setMessage] = useState("");

  const reminders = useMemo(() => {
    if (!user) return [];
    return getReminders(user.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, refreshKey]);

  const customers = useMemo(() => {
    if (!user) return [];
    return getCustomers(user.id);
  }, [user]);

  const customerMap = useMemo(() => {
    const m: Record<string, string> = {};
    customers.forEach((c) => (m[c.id] = c.name));
    return m;
  }, [customers]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selCustomer || !amount) return;
    addReminder(selCustomer, user.id, parseFloat(amount), dueDate, message);
    setSelCustomer("");
    setAmount("");
    setMessage("");
    setShowAdd(false);
    setRefreshKey((k) => k + 1);
  };

  const sendWhatsApp = (r: Reminder) => {
    const cust = customers.find((c) => c.id === r.customerId);
    const msg = r.message || `Reminder: ₹${r.amount} is due on ${format(parseISO(r.dueDate), "dd MMM yyyy")}.`;
    window.open(`https://wa.me/${cust?.phone?.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`);
  };

  return (
    <div className="pb-20">
      <div className="bg-primary px-4 pt-6 pb-4 text-primary-foreground flex items-center justify-between">
        <h1 className="text-xl font-extrabold">Reminders</h1>
        <Button size="sm" variant="ghost" className="text-primary-foreground gap-1" onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>

      <div className="px-4 mt-4 space-y-2">
        {reminders.length === 0 ? (
          <p className="text-center py-12 text-muted-foreground text-sm">No reminders set</p>
        ) : (
          reminders.map((r) => {
            const overdue = isPast(parseISO(r.dueDate));
            return (
              <Card key={r.id} className={`border-0 shadow-sm ${overdue ? "border-l-4 border-l-gave" : ""}`}>
                <CardContent className="p-3 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">{customerMap[r.customerId] || "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">
                      Due: {format(parseISO(r.dueDate), "dd MMM yyyy")}
                      {overdue && <span className="text-gave ml-1 font-bold">OVERDUE</span>}
                    </p>
                    {r.message && <p className="text-xs text-muted-foreground mt-0.5">{r.message}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="font-extrabold text-gave">₹{r.amount.toLocaleString("en-IN")}</p>
                    <button onClick={() => sendWhatsApp(r)} className="p-1 text-got hover:text-got/80">
                      <Send className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => { deleteReminder(r.id); setRefreshKey((k) => k + 1); }}
                      className="p-1 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <Dialog open={showAdd} onOpenChange={(v) => !v && setShowAdd(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Reminder</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-1">
              <Label>Customer *</Label>
              <Select value={selCustomer} onValueChange={setSelCustomer}>
                <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Amount *</Label>
              <Input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="₹ 0" required />
            </div>
            <div className="space-y-1">
              <Label>Due Date</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Message</Label>
              <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Reminder message" />
            </div>
            <Button type="submit" className="w-full font-bold h-11">Set Reminder</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Reminders;
