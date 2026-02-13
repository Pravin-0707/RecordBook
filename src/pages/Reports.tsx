import { useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getAllTransactions, getCustomers, getCustomerBalance, getSaleBills } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO, subMonths } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { TrendingUp, TrendingDown, Users, FileText, IndianRupee } from "lucide-react";

const Reports = () => {
  const { user } = useAuth();
  const [fromDate, setFromDate] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [toDate, setToDate] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"));

  const transactions = useMemo(() => {
    if (!user) return [];
    return getAllTransactions(user.id);
  }, [user]);

  const customers = useMemo(() => {
    if (!user) return [];
    return getCustomers(user.id);
  }, [user]);

  const saleBills = useMemo(() => {
    if (!user) return [];
    return customers.flatMap((c) => getSaleBills(c.id));
  }, [customers]);

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const d = parseISO(t.date);
      return isWithinInterval(d, { start: parseISO(fromDate), end: parseISO(toDate) });
    });
  }, [transactions, fromDate, toDate]);

  const summary = useMemo(() => {
    let gave = 0, got = 0;
    filtered.forEach((t) => {
      if (t.type === "gave") gave += t.amount;
      else got += t.amount;
    });
    return { gave, got };
  }, [filtered]);

  const analytics = useMemo(() => {
    const totalReceivable = customers.reduce((sum, c) => {
      const bal = getCustomerBalance(c.id);
      return sum + (bal > 0 ? bal : 0);
    }, 0);
    
    const totalPayable = customers.reduce((sum, c) => {
      const bal = getCustomerBalance(c.id);
      return sum + (bal < 0 ? Math.abs(bal) : 0);
    }, 0);

    const totalSales = saleBills.reduce((sum, b) => sum + b.total, 0);
    const totalGST = saleBills.reduce((sum, b) => sum + b.gstAmount, 0);

    const topCustomers = customers
      .map((c) => ({ name: c.name, balance: Math.abs(getCustomerBalance(c.id)) }))
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 5);

    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(new Date(), 5 - i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      
      const monthTxns = transactions.filter((t) => 
        isWithinInterval(parseISO(t.date), { start: monthStart, end: monthEnd })
      );
      
      const gave = monthTxns.filter((t) => t.type === "gave").reduce((s, t) => s + t.amount, 0);
      const got = monthTxns.filter((t) => t.type === "got").reduce((s, t) => s + t.amount, 0);
      
      return {
        month: format(date, "MMM"),
        gave,
        got,
      };
    });

    return { totalReceivable, totalPayable, totalSales, totalGST, topCustomers, last6Months };
  }, [customers, saleBills, transactions]);

  const formatAmount = (n: number) => "₹" + n.toLocaleString("en-IN");
  const COLORS = ["#10b981", "#ef4444", "#3b82f6", "#f59e0b", "#8b5cf6"];

  return (
    <div className="lg:pb-0 pb-20">
      <div className="bg-primary px-4 lg:px-8 pt-6 pb-8 text-primary-foreground">
        <h1 className="text-xl lg:text-3xl font-extrabold">Analytics Dashboard</h1>
        <p className="text-sm lg:text-base opacity-80">Business insights & reports</p>
      </div>

      {/* Key Metrics */}
      <div className="px-4 lg:px-8 -mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-got" />
              <p className="text-xs font-semibold text-muted-foreground">Receivable</p>
            </div>
            <p className="text-xl lg:text-2xl font-extrabold text-got">{formatAmount(analytics.totalReceivable)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-4 w-4 text-gave" />
              <p className="text-xs font-semibold text-muted-foreground">Payable</p>
            </div>
            <p className="text-xl lg:text-2xl font-extrabold text-gave">{formatAmount(analytics.totalPayable)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-primary" />
              <p className="text-xs font-semibold text-muted-foreground">Total Sales</p>
            </div>
            <p className="text-xl lg:text-2xl font-extrabold">{formatAmount(analytics.totalSales)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <IndianRupee className="h-4 w-4 text-primary" />
              <p className="text-xs font-semibold text-muted-foreground">Total GST</p>
            </div>
            <p className="text-xl lg:text-2xl font-extrabold">{formatAmount(analytics.totalGST)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="px-4 lg:px-8 mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly Trend */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-base">6-Month Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={analytics.last6Months}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatAmount(Number(value))} />
                <Line type="monotone" dataKey="got" stroke="#10b981" strokeWidth={2} name="Received" />
                <Line type="monotone" dataKey="gave" stroke="#ef4444" strokeWidth={2} name="Given" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Customers */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-base">Top 5 Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={analytics.topCustomers}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => formatAmount(Number(value))} />
                <Bar dataKey="balance" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Period Filter */}
      <div className="px-4 lg:px-8 mt-6">
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-base">Transaction Report</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1 space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">From</label>
                <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              </div>
              <div className="flex-1 space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">To</label>
                <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gave/10 rounded-lg">
                <p className="text-xs text-muted-foreground font-semibold">Total Given</p>
                <p className="text-lg font-extrabold text-gave">{formatAmount(summary.gave)}</p>
              </div>
              <div className="p-3 bg-got/10 rounded-lg">
                <p className="text-xs text-muted-foreground font-semibold">Total Received</p>
                <p className="text-lg font-extrabold text-got">{formatAmount(summary.got)}</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase">{filtered.length} Transactions</p>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {filtered.map((t) => {
                  const customer = customers.find((c) => c.id === t.customerId);
                  return (
                    <div key={t.id} className="p-3 bg-muted/50 rounded-lg flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold">{customer?.name || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(t.date), "dd MMM yyyy")} · {t.type === "gave" ? "You Gave" : "You Got"}
                        </p>
                      </div>
                      <p className={`font-extrabold ${t.type === "got" ? "text-got" : "text-gave"}`}>
                        {formatAmount(t.amount)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Reports;
