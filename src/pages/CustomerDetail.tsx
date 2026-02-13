import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  getCustomers,
  getTransactions,
  getCustomerBalance,
  addTransaction,
  deleteTransaction,
  deleteCustomer,
  addSaleBill,
  getSaleBills,
  SaleItem,
} from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Trash2, Plus, FileText, Send, Search, ArrowUpDown } from "lucide-react";
import { format } from "date-fns";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CustomerDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);
  const [showTxn, setShowTxn] = useState<"gave" | "got" | "sale" | null>(null);
  const [txnAmount, setTxnAmount] = useState("");
  const [txnNote, setTxnNote] = useState("");
  const [txnDate, setTxnDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [saleItems, setSaleItems] = useState<SaleItem[]>([{ name: "", quantity: 1, price: 0, gst: 0 }]);
  const [salePaid, setSalePaid] = useState("");
  const [applyRoundOff, setApplyRoundOff] = useState(false);
  const [roundOffAmount, setRoundOffAmount] = useState("0");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "gpay" | "card">("cash");

  const customer = useMemo(() => {
    if (!user || !id) return null;
    return getCustomers(user.id).find((c) => c.id === id) || null;
  }, [user, id, refreshKey]);

  const transactions = useMemo(() => {
    if (!id) return [];
    return getTransactions(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, refreshKey]);

  const saleBills = useMemo(() => {
    if (!id) return [];
    let bills = getSaleBills(id);
    
    if (search.trim()) {
      const q = search.toLowerCase();
      bills = bills.filter(b => 
        b.invoiceNumber?.toLowerCase().includes(q) ||
        b.items.some(item => item.name.toLowerCase().includes(q)) ||
        b.total.toString().includes(q) ||
        b.paid.toString().includes(q)
      );
    }
    
    bills.sort((a, b) => {
      if (sortBy === "date") {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      return b.total - a.total;
    });
    
    return bills;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, refreshKey, search, sortBy]);

  const balance = useMemo(() => (id ? getCustomerBalance(id) : 0), [id, refreshKey]);

  if (!customer) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground">Customer not found</p>
        <Button variant="ghost" onClick={() => navigate("/")} className="mt-2">Go back</Button>
      </div>
    );
  }

  const handleAddTxn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id || !showTxn || !txnAmount) return;
    addTransaction(id, user.id, parseFloat(txnAmount), showTxn, txnNote, txnDate);
    setTxnAmount("");
    setTxnNote("");
    setTxnDate(format(new Date(), "yyyy-MM-dd"));
    setShowTxn(null);
    setRefreshKey((k) => k + 1);
  };

  const handleAddSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id) return;
    const validItems = saleItems.filter((i) => i.name && i.quantity > 0 && i.price > 0);
    if (validItems.length === 0) return;
    
    const subtotal = validItems.reduce((sum, i) => sum + i.quantity * i.price, 0);
    const gstAmount = validItems.reduce((sum, i) => sum + (i.quantity * i.price * (i.gst || 0) / 100), 0);
    const total = subtotal + gstAmount;
    const roundOff = applyRoundOff ? parseFloat(roundOffAmount) : 0;
    const finalTotal = total + roundOff;
    
    const bills = JSON.parse(localStorage.getItem("kb_sale_bills") || "[]");
    const year = new Date().getFullYear().toString().slice(-2);
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
    const count = bills.filter((b: any) => b.userId === user.id).length + 1;
    const invoiceNumber = `INV${year}${month}${count.toString().padStart(4, '0')}`;
    
    const bill = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      invoiceNumber,
      customerId: id,
      userId: user.id,
      items: validItems,
      subtotal,
      gstAmount,
      total,
      roundOff,
      finalTotal,
      paid: parseFloat(salePaid || "0"),
      date: txnDate,
      createdAt: new Date().toISOString(),
      paymentMethod
    };
    bills.push(bill);
    localStorage.setItem("kb_sale_bills", JSON.stringify(bills));
    
    setSaleItems([{ name: "", quantity: 1, price: 0, gst: 0 }]);
    setSalePaid("");
    setApplyRoundOff(false);
    setRoundOffAmount("0");
    setPaymentMethod("cash");
    setTxnDate(format(new Date(), "yyyy-MM-dd"));
    setShowTxn(null);
    setRefreshKey((k) => k + 1);
  };

  const handleDelete = () => {
    if (!id) return;
    deleteCustomer(id);
    navigate("/");
  };

  const formatAmount = (n: number) => "₹" + Math.abs(n).toLocaleString("en-IN");

  const shareOnWhatsApp = () => {
    const msg = `Hi ${customer.name}, your current balance is ${formatAmount(balance)} (${balance >= 0 ? "you owe" : "I owe"}).`;
    window.open(`https://wa.me/${customer.phone?.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`);
  };

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="bg-primary px-4 pt-4 pb-6 text-primary-foreground">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate("/")} className="p-1">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-extrabold">{customer.name}</h1>
            {customer.phone && <p className="text-xs opacity-80">{customer.phone}</p>}
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="p-2 rounded-lg hover:bg-primary-foreground/10">
                <Trash2 className="h-4 w-4" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {customer.name}?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will delete all transactions for this customer. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Balance */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase">
                {balance >= 0 ? "You'll Get" : "You'll Give"}
              </p>
              <p className={`text-2xl font-extrabold ${balance >= 0 ? "text-got" : "text-gave"}`}>
                {formatAmount(balance)}
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="icon" variant="outline" onClick={shareOnWhatsApp} title="WhatsApp">
                <Send className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="outline" onClick={() => navigate(`/bill/${id}`)} title="View Bill">
                <FileText className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="px-4 mt-4 grid grid-cols-3 gap-2">
        <Button
          onClick={() => setShowTxn("gave")}
          className="h-12 font-bold text-sm bg-gave hover:bg-gave/90 text-gave-foreground"
        >
          You Gave ₹
        </Button>
        <Button
          onClick={() => setShowTxn("got")}
          className="h-12 font-bold text-sm bg-got hover:bg-got/90 text-got-foreground"
        >
          You Got ₹
        </Button>
        <Button
          onClick={() => setShowTxn("sale")}
          className="h-12 font-bold text-sm bg-primary hover:bg-primary/90"
        >
          Sale Bill
        </Button>
      </div>

      {/* Search & Sort */}
      <div className="px-4 mt-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search bills, items, amounts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
          <SelectTrigger className="w-[140px]">
            <ArrowUpDown className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Date</SelectItem>
            <SelectItem value="amount">Amount</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Transactions */}
      <div className="px-4 mt-4 space-y-2">
        <h2 className="font-bold text-sm text-muted-foreground uppercase">Sale Bills</h2>
        {saleBills.length === 0 ? (
          <p className="text-center py-4 text-muted-foreground text-sm">No sale bills yet</p>
        ) : (
          saleBills.map((bill) => (
            <Card key={bill.id} className="border-0 shadow-sm">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold">{bill.invoiceNumber || `Bill #${bill.id.slice(-6)}`}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(bill.date), "dd MMM yyyy")}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="font-extrabold text-primary">{formatAmount(bill.total)}</p>
                      {bill.paid < bill.total && (
                        <p className="text-xs text-gave">Due: {formatAmount(bill.total - bill.paid)}</p>
                      )}
                    </div>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => navigate(`/bill/sale/${bill.id}`)}
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {bill.items.length} item{bill.items.length > 1 ? "s" : ""}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Transactions */}
      <div className="px-4 mt-4 space-y-2">
        <h2 className="font-bold text-sm text-muted-foreground uppercase">Other Transactions</h2>
        {transactions.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground text-sm">No transactions yet</p>
        ) : (
          transactions.map((t) => (
            <Card key={t.id} className="border-0 shadow-sm">
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">
                    {t.type === "gave" ? "You Gave" : "You Got"}
                  </p>
                  {t.note && <p className="text-xs text-muted-foreground">{t.note}</p>}
                  <p className="text-xs text-muted-foreground">{format(new Date(t.date), "dd MMM yyyy")}</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className={`font-extrabold ${t.type === "got" ? "text-got" : "text-gave"}`}>
                    {formatAmount(t.amount)}
                  </p>
                  <button
                    onClick={() => {
                      deleteTransaction(t.id);
                      setRefreshKey((k) => k + 1);
                    }}
                    className="p-1 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add Transaction Dialog */}
      <Dialog open={showTxn === "gave" || showTxn === "got"} onOpenChange={(v) => !v && setShowTxn(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className={`text-lg font-bold ${showTxn === "got" ? "text-got" : "text-gave"}`}>
              {showTxn === "gave" ? "You Gave ₹" : "You Got ₹"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddTxn} className="space-y-4">
            <div className="space-y-1">
              <Label>Amount *</Label>
              <Input
                type="number"
                min="1"
                step="0.01"
                value={txnAmount}
                onChange={(e) => setTxnAmount(e.target.value)}
                placeholder="₹ 0"
                className="text-2xl font-bold h-14"
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Date</Label>
              <Input type="date" value={txnDate} onChange={(e) => setTxnDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Note</Label>
              <Input value={txnNote} onChange={(e) => setTxnNote(e.target.value)} placeholder="Description (optional)" />
            </div>
            <Button
              type="submit"
              className={`w-full font-bold h-12 ${showTxn === "got" ? "bg-got hover:bg-got/90" : "bg-gave hover:bg-gave/90"}`}
            >
              Save Entry
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Sale Bill Dialog */}
      <Dialog open={showTxn === "sale"} onOpenChange={(v) => !v && setShowTxn(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Create Sale Bill</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddSale} className="space-y-4">
            <div className="space-y-1">
              <Label>Date</Label>
              <Input type="date" value={txnDate} onChange={(e) => setTxnDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Items</Label>
              <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-muted-foreground mb-1">
                <div className="col-span-4">Item Name</div>
                <div className="col-span-2">Qty</div>
                <div className="col-span-2">Price</div>
                <div className="col-span-2">GST%</div>
                <div className="col-span-2"></div>
              </div>
              {saleItems.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2">
                  <Input
                    placeholder="Item name"
                    value={item.name}
                    onChange={(e) => {
                      const updated = [...saleItems];
                      updated[idx].name = e.target.value;
                      setSaleItems(updated);
                    }}
                    className="col-span-4"
                  />
                  <Input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={item.quantity}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const updated = [...saleItems];
                      updated[idx].quantity = parseInt(e.target.value) || 1;
                      setSaleItems(updated);
                    }}
                    className="col-span-2"
                  />
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Price"
                    value={item.price}
                    onChange={(e) => {
                      const updated = [...saleItems];
                      updated[idx].price = parseFloat(e.target.value) || 0;
                      setSaleItems(updated);
                    }}
                    className="col-span-2"
                  />
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder="GST%"
                    value={item.gst || 0}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const updated = [...saleItems];
                      updated[idx].gst = parseFloat(e.target.value) || 0;
                      setSaleItems(updated);
                    }}
                    className="col-span-2"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setSaleItems(saleItems.filter((_, i) => i !== idx))}
                    className="col-span-2"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => setSaleItems([...saleItems, { name: "", quantity: 1, price: 0, gst: 0 }])}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" /> Add Item
              </Button>
            </div>
            <div className="space-y-1">
              <Label>Subtotal: ₹{saleItems.reduce((sum, i) => sum + i.quantity * i.price, 0).toFixed(2)}</Label>
              <Label>GST: ₹{saleItems.reduce((sum, i) => sum + (i.quantity * i.price * (i.gst || 0) / 100), 0).toFixed(2)}</Label>
              <Label className="text-lg font-bold">Total: ₹{(saleItems.reduce((sum, i) => sum + i.quantity * i.price, 0) + saleItems.reduce((sum, i) => sum + (i.quantity * i.price * (i.gst || 0) / 100), 0)).toFixed(2)}</Label>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <Label htmlFor="roundoff" className="cursor-pointer">Apply Round Off</Label>
              <Switch id="roundoff" checked={applyRoundOff} onCheckedChange={setApplyRoundOff} />
            </div>
            {applyRoundOff && (() => {
              const total = saleItems.reduce((sum, i) => sum + i.quantity * i.price, 0) + saleItems.reduce((sum, i) => sum + (i.quantity * i.price * (i.gst || 0) / 100), 0);
              const decimal = total - Math.floor(total);
              const roundUp = (1 - decimal).toFixed(2);
              const roundDown = (-decimal).toFixed(2);
              
              return (
                <div className="space-y-3">
                  <Label>Select Round Off:</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant={roundOffAmount === roundDown ? "default" : "outline"}
                      onClick={() => setRoundOffAmount(roundDown)}
                      className="h-16 flex-col"
                    >
                      <span className="text-xs text-muted-foreground">Round Down</span>
                      <span className="text-lg font-bold">{roundDown}</span>
                    </Button>
                    <Button
                      type="button"
                      variant={roundOffAmount === roundUp ? "default" : "outline"}
                      onClick={() => setRoundOffAmount(roundUp)}
                      className="h-16 flex-col"
                    >
                      <span className="text-xs text-muted-foreground">Round Up</span>
                      <span className="text-lg font-bold">+{roundUp}</span>
                    </Button>
                  </div>
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Label className="text-sm">Round Off: ₹{roundOffAmount}</Label>
                    <Label className="text-xl font-bold text-primary block mt-1">Final Total: ₹{(total + parseFloat(roundOffAmount || "0")).toFixed(2)}</Label>
                  </div>
                </div>
              );
            })()}
            <div className="space-y-1">
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="gpay">GPay</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Amount Paid</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={salePaid}
                onChange={(e) => setSalePaid(e.target.value)}
                placeholder="₹ 0"
              />
            </div>
            <Button type="submit" className="w-full font-bold h-12">
              Create Bill
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerDetail;
