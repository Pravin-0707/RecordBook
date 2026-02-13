import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { getCustomers, getTransactions, getCustomerBalance } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Share2 } from "lucide-react";
import { format } from "date-fns";

const BillPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const customer = useMemo(() => {
    if (!user || !id) return null;
    return getCustomers(user.id).find((c) => c.id === id) || null;
  }, [user, id]);

  const transactions = useMemo(() => (id ? getTransactions(id) : []), [id]);
  const balance = useMemo(() => (id ? getCustomerBalance(id) : 0), [id]);

  if (!customer) return null;

  const formatAmount = (n: number) => "₹" + Math.abs(n).toLocaleString("en-IN");

  const handlePrint = () => window.print();

  const handleWhatsApp = () => {
    let msg = `*${user?.businessName || "Business"} - Statement*\nCustomer: ${customer.name}\n\n`;
    transactions.forEach((t) => {
      msg += `${format(new Date(t.date), "dd/MM/yy")} | ${t.type === "gave" ? "You Gave" : "You Got"} | ₹${t.amount}${t.note ? " | " + t.note : ""}\n`;
    });
    msg += `\n*Balance: ${formatAmount(balance)} (${balance >= 0 ? "To receive" : "To pay"})*`;
    window.open(`https://wa.me/${customer.phone?.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`);
  };

  return (
    <div className="pb-20">
      <div className="bg-primary px-4 pt-4 pb-4 text-primary-foreground flex items-center gap-3 print:hidden">
        <button onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-extrabold flex-1">Bill / Statement</h1>
        <Button size="icon" variant="ghost" onClick={handlePrint} className="text-primary-foreground">
          <Download className="h-5 w-5" />
        </Button>
        <Button size="icon" variant="ghost" onClick={handleWhatsApp} className="text-primary-foreground">
          <Share2 className="h-5 w-5" />
        </Button>
      </div>

      {/* Printable Bill */}
      <div className="px-4 mt-4 max-w-lg mx-auto" id="bill-content">
        <div className="border rounded-lg p-6 bg-card">
          <div className="text-center border-b pb-4 mb-4">
            <h2 className="text-xl font-extrabold">{user?.businessName || "Business"}</h2>
            <p className="text-sm text-muted-foreground">Statement of Account</p>
          </div>

          <div className="flex justify-between text-sm mb-4">
            <div>
              <p className="font-semibold">Customer</p>
              <p>{customer.name}</p>
              {customer.phone && <p className="text-muted-foreground">{customer.phone}</p>}
            </div>
            <div className="text-right">
              <p className="font-semibold">Date</p>
              <p>{format(new Date(), "dd MMM yyyy")}</p>
            </div>
          </div>

          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 font-semibold">Date</th>
                <th className="text-left py-2 font-semibold">Details</th>
                <th className="text-right py-2 font-semibold text-gave">You Gave</th>
                <th className="text-right py-2 font-semibold text-got">You Got</th>
              </tr>
            </thead>
            <tbody>
              {[...transactions].reverse().map((t) => (
                <tr key={t.id} className="border-b border-dashed">
                  <td className="py-2">{format(new Date(t.date), "dd/MM/yy")}</td>
                  <td className="py-2">{t.note || "-"}</td>
                  <td className="py-2 text-right text-gave">{t.type === "gave" ? formatAmount(t.amount) : ""}</td>
                  <td className="py-2 text-right text-got">{t.type === "got" ? formatAmount(t.amount) : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 pt-4 border-t flex justify-between items-center">
            <p className="font-bold">Balance</p>
            <p className={`text-xl font-extrabold ${balance >= 0 ? "text-got" : "text-gave"}`}>
              {formatAmount(balance)}
              <span className="text-xs ml-1 text-muted-foreground">
                {balance >= 0 ? "(to receive)" : "(to pay)"}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillPage;
