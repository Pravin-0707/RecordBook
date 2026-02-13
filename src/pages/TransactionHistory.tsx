import { useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getAllTransactions, getCustomers } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

const TransactionHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const transactions = useMemo(() => {
    if (!user) return [];
    return getAllTransactions(user.id);
  }, [user]);

  const customers = useMemo(() => {
    if (!user) return {};
    const list = getCustomers(user.id);
    return Object.fromEntries(list.map((c) => [c.id, c]));
  }, [user]);

  const formatAmount = (n: number) => "₹" + Math.abs(n).toLocaleString("en-IN");

  return (
    <div className="lg:pb-0 pb-20">
      <div className="bg-primary px-4 lg:px-8 pt-6 pb-8 text-primary-foreground">
        <h1 className="text-xl lg:text-3xl font-extrabold">Transaction History</h1>
        <p className="text-sm lg:text-base opacity-80">All transactions</p>
      </div>

      <div className="px-4 lg:px-8 mt-4 lg:mt-6 space-y-3">
        {transactions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg font-semibold">No transactions yet</p>
          </div>
        ) : (
          transactions.map((t) => {
            const customer = customers[t.customerId];
            return (
              <Card
                key={t.id}
                className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/customer/${t.customerId}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                          {customer?.name[0]?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <p className="font-semibold">{customer?.name || "Unknown"}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(t.date), "dd MMM yyyy, hh:mm a")}
                          </p>
                        </div>
                      </div>
                      {t.note && <p className="text-sm text-muted-foreground ml-10">{t.note}</p>}
                    </div>
                    <div className="text-right ml-4">
                      <p className={`font-extrabold text-lg ${t.type === "got" ? "text-got" : "text-gave"}`}>
                        {t.type === "got" ? "+" : "-"}{formatAmount(t.amount)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t.type === "gave" ? "You Gave" : "You Got"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TransactionHistory;
