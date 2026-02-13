import { useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getCustomers, getSaleBills } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";
import { Download, FileText } from "lucide-react";

const GSTReports = () => {
  const { user } = useAuth();
  const [fromDate, setFromDate] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [toDate, setToDate] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"));

  const customers = useMemo(() => {
    if (!user) return [];
    return getCustomers(user.id);
  }, [user]);

  const allBills = useMemo(() => {
    return customers.flatMap((c) => 
      getSaleBills(c.id).map((b) => ({ ...b, customerName: c.name }))
    );
  }, [customers]);

  const filteredBills = useMemo(() => {
    return allBills.filter((b) => {
      const d = parseISO(b.date);
      return isWithinInterval(d, { start: parseISO(fromDate), end: parseISO(toDate) });
    });
  }, [allBills, fromDate, toDate]);

  const gstSummary = useMemo(() => {
    const totalSales = filteredBills.reduce((sum, b) => sum + b.subtotal, 0);
    const totalGST = filteredBills.reduce((sum, b) => sum + b.gstAmount, 0);
    const cgst = totalGST / 2;
    const sgst = totalGST / 2;
    const totalInvoiceValue = filteredBills.reduce((sum, b) => sum + b.total, 0);

    const gstByRate: Record<number, { taxable: number; cgst: number; sgst: number; total: number }> = {};
    
    filteredBills.forEach((bill) => {
      bill.items.forEach((item) => {
        const rate = item.gst || 0;
        const taxableValue = item.quantity * item.price;
        const itemGST = taxableValue * rate / 100;
        
        if (!gstByRate[rate]) {
          gstByRate[rate] = { taxable: 0, cgst: 0, sgst: 0, total: 0 };
        }
        
        gstByRate[rate].taxable += taxableValue;
        gstByRate[rate].cgst += itemGST / 2;
        gstByRate[rate].sgst += itemGST / 2;
        gstByRate[rate].total += itemGST;
      });
    });

    return { totalSales, totalGST, cgst, sgst, totalInvoiceValue, gstByRate };
  }, [filteredBills]);

  const formatAmount = (n: number) => "₹" + n.toFixed(2);

  const handleExport = () => {
    let csv = "GST Report\n";
    csv += `Period: ${format(parseISO(fromDate), "dd MMM yyyy")} to ${format(parseISO(toDate), "dd MMM yyyy")}\n\n`;
    csv += "Summary\n";
    csv += `Total Taxable Value,${gstSummary.totalSales.toFixed(2)}\n`;
    csv += `Total CGST,${gstSummary.cgst.toFixed(2)}\n`;
    csv += `Total SGST,${gstSummary.sgst.toFixed(2)}\n`;
    csv += `Total GST,${gstSummary.totalGST.toFixed(2)}\n`;
    csv += `Total Invoice Value,${gstSummary.totalInvoiceValue.toFixed(2)}\n\n`;
    
    csv += "GST Rate-wise Breakdown\n";
    csv += "GST Rate,Taxable Value,CGST,SGST,Total GST\n";
    Object.entries(gstSummary.gstByRate).forEach(([rate, data]) => {
      csv += `${rate}%,${data.taxable.toFixed(2)},${data.cgst.toFixed(2)},${data.sgst.toFixed(2)},${data.total.toFixed(2)}\n`;
    });

    csv += "\nDetailed Bills\n";
    csv += "Date,Bill No,Customer,Taxable Value,CGST,SGST,Total\n";
    filteredBills.forEach((bill) => {
      csv += `${format(parseISO(bill.date), "dd/MM/yyyy")},${bill.id.slice(-6)},${bill.customerName},${bill.subtotal.toFixed(2)},${(bill.gstAmount / 2).toFixed(2)},${(bill.gstAmount / 2).toFixed(2)},${bill.total.toFixed(2)}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gst-report-${fromDate}-to-${toDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="lg:pb-0 pb-20">
      <div className="bg-primary px-4 lg:px-8 pt-6 pb-8 text-primary-foreground">
        <h1 className="text-xl lg:text-3xl font-extrabold">GST Tax Reports</h1>
        <p className="text-sm lg:text-base opacity-80">Tax summaries & compliance</p>
      </div>

      <div className="px-4 lg:px-8 mt-4 max-w-4xl mx-auto space-y-4">
        {/* Date Filter */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex gap-2 items-end">
              <div className="flex-1 space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">From Date</label>
                <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              </div>
              <div className="flex-1 space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">To Date</label>
                <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
              </div>
              <Button onClick={handleExport} className="gap-2">
                <Download className="h-4 w-4" /> Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground font-semibold">Taxable Value</p>
              <p className="text-lg lg:text-xl font-extrabold">{formatAmount(gstSummary.totalSales)}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground font-semibold">CGST</p>
              <p className="text-lg lg:text-xl font-extrabold text-primary">{formatAmount(gstSummary.cgst)}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground font-semibold">SGST</p>
              <p className="text-lg lg:text-xl font-extrabold text-primary">{formatAmount(gstSummary.sgst)}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground font-semibold">Total GST</p>
              <p className="text-lg lg:text-xl font-extrabold text-primary">{formatAmount(gstSummary.totalGST)}</p>
            </CardContent>
          </Card>
        </div>

        {/* GST Rate-wise Breakdown */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-base">GST Rate-wise Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-semibold">GST Rate</th>
                    <th className="text-right py-2 font-semibold">Taxable Value</th>
                    <th className="text-right py-2 font-semibold">CGST</th>
                    <th className="text-right py-2 font-semibold">SGST</th>
                    <th className="text-right py-2 font-semibold">Total GST</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(gstSummary.gstByRate).map(([rate, data]) => (
                    <tr key={rate} className="border-b">
                      <td className="py-2">{rate}%</td>
                      <td className="text-right py-2">{formatAmount(data.taxable)}</td>
                      <td className="text-right py-2">{formatAmount(data.cgst)}</td>
                      <td className="text-right py-2">{formatAmount(data.sgst)}</td>
                      <td className="text-right py-2 font-semibold">{formatAmount(data.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Bills */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-base">Detailed Bills ({filteredBills.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredBills.map((bill) => (
                <div key={bill.id} className="p-3 bg-muted/50 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-semibold">Bill #{bill.id.slice(-6)}</p>
                      <p className="text-xs text-muted-foreground">
                        {bill.customerName} · {format(parseISO(bill.date), "dd MMM yyyy")}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{formatAmount(bill.total)}</p>
                    <p className="text-xs text-muted-foreground">GST: {formatAmount(bill.gstAmount)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GSTReports;
