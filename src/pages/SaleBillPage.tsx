import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { getCustomers, getSaleBills, updateSaleBillPaid, deleteSaleBill } from "@/lib/store";
import { Button } from "@/components/ui/button";
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
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Download, Share2, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import html2canvas from "html2canvas";

const SaleBillPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showEditPaid, setShowEditPaid] = useState(false);
  const [editPaidAmount, setEditPaidAmount] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const allBills = useMemo(() => {
    if (!user) return [];
    const customers = getCustomers(user.id);
    return customers.flatMap((c) => getSaleBills(c.id).map((b) => ({ ...b, customer: c })));
  }, [user, refreshKey]);

  const bill = useMemo(() => allBills.find((b) => b.id === id), [allBills, id]);

  if (!bill) return null;

  const formatAmount = (n: number) => "₹" + Math.abs(n).toLocaleString("en-IN");

  const handlePrint = () => window.print();

  const handleEditPaid = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !editPaidAmount) return;
    updateSaleBillPaid(id, parseFloat(editPaidAmount));
    setShowEditPaid(false);
    setRefreshKey((k) => k + 1);
  };

  const handleDelete = () => {
    if (!id) return;
    deleteSaleBill(id);
    navigate(-1);
  };

  const handleWhatsApp = async () => {
    const billElement = document.getElementById("bill-content");
    if (!billElement) return;

    try {
      const canvas = await html2canvas(billElement, {
        scale: 2,
        backgroundColor: "#ffffff",
      });
      
      canvas.toBlob((blob) => {
        if (!blob) return;
        const file = new File([blob], "bill.jpg", { type: "image/jpeg" });
        
        if (navigator.share && navigator.canShare({ files: [file] })) {
          navigator.share({
            files: [file],
            title: `Sale Bill #${bill?.id.slice(-6)}`,
          });
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `bill-${bill?.id.slice(-6)}.jpg`;
          a.click();
          URL.revokeObjectURL(url);
        }
      }, "image/jpeg", 0.95);
    } catch (error) {
      console.error("Error generating image:", error);
    }
  };

  return (
    <div className="lg:pb-0 pb-20">
      <div className="bg-primary px-4 lg:px-8 pt-4 pb-4 text-primary-foreground flex items-center gap-3 print:hidden">
        <button onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-extrabold flex-1">Sale Bill</h1>
        <Button size="icon" variant="ghost" onClick={handlePrint} className="text-primary-foreground">
          <Download className="h-5 w-5" />
        </Button>
        <Button size="icon" variant="ghost" onClick={handleWhatsApp} className="text-primary-foreground">
          <Share2 className="h-5 w-5" />
        </Button>
        {bill.paid < bill.total && (
          <Button
            size="icon"
            variant="ghost"
            onClick={() => {
              setEditPaidAmount(bill.paid.toString());
              setShowEditPaid(true);
            }}
            className="text-primary-foreground"
          >
            <Edit className="h-5 w-5" />
          </Button>
        )}
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setShowDeleteConfirm(true)}
          className="text-primary-foreground"
        >
          <Trash2 className="h-5 w-5" />
        </Button>
      </div>

      <div className="px-4 lg:px-8 mt-4 lg:mt-6 max-w-3xl mx-auto" id="bill-content">
        <div className="border rounded-lg p-6 lg:p-8 bg-card">
          <div className="text-center border-b pb-4 mb-4">
            <h2 className="text-2xl font-extrabold">{user?.businessName || "Business"}</h2>
            {user?.phone && <p className="text-sm text-muted-foreground">{user.phone}</p>}
            {user?.address && <p className="text-sm text-muted-foreground">{user.address}</p>}
            {user?.gstNumber && <p className="text-sm text-muted-foreground">GST: {user.gstNumber}</p>}
            <p className="text-sm text-muted-foreground mt-2">Sale Invoice</p>
            <p className="text-xs text-muted-foreground mt-1">{bill.invoiceNumber || `Bill #${bill.id.slice(-6)}`}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm mb-6">
            <div>
              <p className="font-semibold">Customer</p>
              <p>{bill.customer.name}</p>
              {bill.customer.phone && <p className="text-muted-foreground">{bill.customer.phone}</p>}
            </div>
            <div className="text-right">
              <p className="font-semibold">Date</p>
              <p>{format(new Date(bill.date), "dd MMM yyyy")}</p>
            </div>
          </div>

          <table className="w-full text-sm border-collapse mb-6">
            <thead>
              <tr className="border-b-2">
                <th className="text-left py-3 font-semibold">Item</th>
                <th className="text-center py-3 font-semibold">Qty</th>
                <th className="text-right py-3 font-semibold">Price</th>
                <th className="text-right py-3 font-semibold">GST%</th>
                <th className="text-right py-3 font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {bill.items.map((item, idx) => {
                const itemTotal = item.quantity * item.price;
                const gstAmount = itemTotal * (item.gst || 0) / 100;
                return (
                  <tr key={idx} className="border-b border-dashed">
                    <td className="py-3">{item.name}</td>
                    <td className="py-3 text-center">{item.quantity}</td>
                    <td className="py-3 text-right">₹{item.price.toFixed(2)}</td>
                    <td className="py-3 text-right">{item.gst || 0}%</td>
                    <td className="py-3 text-right font-semibold">₹{(itemTotal + gstAmount).toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="space-y-2 border-t-2 pt-4">
            <div className="flex justify-between items-center">
              <p className="font-semibold">Subtotal</p>
              <p className="font-semibold">₹{bill.subtotal.toFixed(2)}</p>
            </div>
            <div className="flex justify-between items-center">
              <p className="font-semibold">CGST</p>
              <p className="font-semibold">₹{(bill.gstAmount / 2).toFixed(2)}</p>
            </div>
            <div className="flex justify-between items-center">
              <p className="font-semibold">SGST</p>
              <p className="font-semibold">₹{(bill.gstAmount / 2).toFixed(2)}</p>
            </div>
            <div className="flex justify-between items-center text-lg border-t pt-2">
              <p className="font-bold">Total</p>
              <p className="font-extrabold">₹{bill.total.toFixed(2)}</p>
            </div>
            <div className="flex justify-between items-center text-got">
              <p className="font-semibold">Paid</p>
              <p className="font-bold">₹{bill.paid.toFixed(2)}</p>
            </div>
            {bill.paid < bill.total && (
              <div className="flex justify-between items-center text-gave text-lg">
                <p className="font-bold">Balance Due</p>
                <p className="font-extrabold">₹{(bill.total - bill.paid).toFixed(2)}</p>
              </div>
            )}
          </div>

          {bill.paid >= bill.total && (
            <div className="mt-6 text-center">
              <p className="text-got font-bold text-lg">✓ PAID IN FULL</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Paid Amount Dialog */}
      <Dialog open={showEditPaid} onOpenChange={setShowEditPaid}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Update Paid Amount</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditPaid} className="space-y-4">
            <div className="space-y-1">
              <Label>Total: {formatAmount(bill?.total || 0)}</Label>
            </div>
            <div className="space-y-1">
              <Label>Paid Amount *</Label>
              <Input
                type="number"
                min="0"
                max={bill?.total}
                step="0.01"
                value={editPaidAmount}
                onChange={(e) => setEditPaidAmount(e.target.value)}
                placeholder="₹ 0"
                className="text-xl font-bold h-12"
                required
              />
            </div>
            <Button type="submit" className="w-full font-bold h-12">
              Update Payment
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Sale Bill?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this sale bill and its linked transaction. This action cannot be undone.
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
  );
};

export default SaleBillPage;
