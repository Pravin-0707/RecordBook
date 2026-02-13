import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getCustomers, getCustomerBalance, Customer } from "@/lib/store";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Search, ArrowDownLeft, ArrowUpRight, Users, BookOpen } from "lucide-react";
import AddCustomerDialog from "@/components/AddCustomerDialog";
import BottomNav from "@/components/BottomNav";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const customers = useMemo(() => {
    if (!user) return [];
    return getCustomers(user.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, refreshKey]);

  const customerBalances = useMemo(() => {
    const map: Record<string, number> = {};
    customers.forEach((c) => {
      map[c.id] = getCustomerBalance(c.id);
    });
    return map;
  }, [customers]);

  const totals = useMemo(() => {
    let willGet = 0;
    let willGive = 0;
    Object.values(customerBalances).forEach((b) => {
      if (b > 0) willGet += b;
      else willGive += Math.abs(b);
    });
    return { willGet, willGive, net: willGet - willGive };
  }, [customerBalances]);

  const filtered = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase();
    return customers.filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(q));
  }, [customers, search]);

  const formatAmount = (n: number) => "₹" + Math.abs(n).toLocaleString("en-IN");

  return (
    <div className="lg:pb-0 pb-4 animate-fade-in">
      {/* Header */}
      <div className="gradient-primary px-4 lg:px-8 pt-8 pb-24 text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <BookOpen className="h-8 w-8 lg:h-10 lg:w-10" />
              <div>
                <h1 className="text-2xl lg:text-4xl font-extrabold animate-slide-up">{user?.businessName || "RecordBook"}</h1>
                <p className="text-sm lg:text-base opacity-90 animate-slide-up" style={{animationDelay: '0.1s'}}>Manage your business finances</p>
              </div>
            </div>
            <BottomNav />
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="px-4 lg:px-8 -mt-16 grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-6 relative z-20">
        <Card className="border-0 shadow-lg card-hover animate-scale-in bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-got/20 rounded-lg">
                <ArrowDownLeft className="h-4 w-4 lg:h-5 lg:w-5 text-got" />
              </div>
              <span className="text-xs lg:text-sm font-semibold text-got">You'll Get</span>
            </div>
            <p className="text-2xl lg:text-3xl font-extrabold text-got">{formatAmount(totals.willGet)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg card-hover animate-scale-in bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950 dark:to-rose-950" style={{animationDelay: '0.1s'}}>
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-gave/20 rounded-lg">
                <ArrowUpRight className="h-4 w-4 lg:h-5 lg:w-5 text-gave" />
              </div>
              <span className="text-xs lg:text-sm font-semibold text-gave">You'll Give</span>
            </div>
            <p className="text-2xl lg:text-3xl font-extrabold text-gave">{formatAmount(totals.willGive)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg card-hover animate-scale-in bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 col-span-2 lg:col-span-1" style={{animationDelay: '0.2s'}}>
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-primary/20 rounded-lg">
                <span className="text-xs lg:text-sm font-semibold text-primary">Net Balance</span>
              </div>
            </div>
            <p className={`text-2xl lg:text-3xl font-extrabold ${totals.net >= 0 ? "text-got" : "text-gave"}`}>
              {formatAmount(totals.net)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search + Add */}
      <div className="px-4 lg:px-8 mt-6 lg:mt-8 flex gap-2 animate-slide-up" style={{animationDelay: '0.3s'}}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-11 border-2 focus:border-primary transition-colors"
          />
        </div>
        <Button onClick={() => setShowAdd(true)} className="gap-2 font-bold h-11 px-6 shadow-lg hover:shadow-xl transition-all">
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>

      {/* Customer List */}
      <div className="px-4 lg:px-8 mt-4 lg:mt-6 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 lg:gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full text-center py-16 text-muted-foreground animate-fade-in">
            <div className="inline-block p-4 bg-muted/50 rounded-full mb-4">
              <Users className="h-12 w-12" />
            </div>
            <p className="text-lg font-semibold">No customers yet</p>
            <p className="text-sm mt-1">Click "Add" to create your first customer</p>
          </div>
        ) : (
          filtered.map((c, idx) => {
            const bal = customerBalances[c.id] || 0;
            return (
              <Card
                key={c.id}
                className="cursor-pointer card-hover border-0 shadow-md hover:shadow-xl transition-all animate-scale-in"
                style={{animationDelay: `${idx * 0.05}s`}}
                onClick={() => navigate(`/customer/${c.id}`)}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-primary font-bold text-lg ring-2 ring-primary/20">
                      {c.name[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-base">{c.name}</p>
                      {c.phone && <p className="text-xs text-muted-foreground">{c.phone}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-extrabold text-lg ${bal >= 0 ? "text-got" : "text-gave"}`}>
                      {formatAmount(bal)}
                    </p>
                    <p className="text-xs text-muted-foreground font-medium">
                      {bal > 0 ? "To get" : bal < 0 ? "To give" : "Settled"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <AddCustomerDialog
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onAdded={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  );
};

export default Dashboard;
