// Local storage based data store for Khatabook clone

export interface User {
  id: string;
  email: string;
  password: string;
  businessName: string;
  phone: string;
  address?: string;
  gstNumber?: string;
}

export interface Customer {
  id: string;
  userId: string;
  name: string;
  phone: string;
  notes: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  customerId: string;
  userId: string;
  amount: number;
  type: "gave" | "got";
  note: string;
  date: string;
  createdAt: string;
  paymentMethod?: "cash" | "gpay" | "card";
}

export interface SaleItem {
  name: string;
  quantity: number;
  price: number;
  gst?: number;
}

export interface SaleBill {
  id: string;
  invoiceNumber: string;
  customerId: string;
  userId: string;
  items: SaleItem[];
  subtotal: number;
  gstAmount: number;
  total: number;
  roundOff: number;
  finalTotal: number;
  paid: number;
  date: string;
  createdAt: string;
  transactionId?: string;
  paymentMethod?: "cash" | "gpay" | "card";
}

export interface Expense {
  id: string;
  userId: string;
  category: string;
  amount: number;
  description: string;
  date: string;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  userId: string;
  name: string;
  quantity: number;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  lowStockAlert: number;
  createdAt: string;
}

export interface Reminder {
  id: string;
  customerId: string;
  userId: string;
  amount: number;
  dueDate: string;
  message: string;
  sent: boolean;
  createdAt: string;
}

const KEYS = {
  users: "kb_users",
  currentUser: "kb_current_user",
  customers: "kb_customers",
  transactions: "kb_transactions",
  reminders: "kb_reminders",
  saleBills: "kb_sale_bills",
  expenses: "kb_expenses",
  inventory: "kb_inventory",
};

function get<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

function set<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function getNextInvoiceNumber(userId: string): string {
  const bills = get<SaleBill>(KEYS.saleBills).filter(b => b.userId === userId);
  const year = new Date().getFullYear().toString().slice(-2);
  const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
  const count = bills.length + 1;
  return `INV${year}${month}${count.toString().padStart(4, '0')}`;
}

// Auth
export function signup(email: string, password: string, businessName: string): User | null {
  const users = get<User>(KEYS.users);
  if (users.find((u) => u.email === email)) return null;
  const user: User = { id: genId(), email, password, businessName, phone: "" };
  users.push(user);
  set(KEYS.users, users);
  localStorage.setItem(KEYS.currentUser, JSON.stringify(user));
  return user;
}

export function login(email: string, password: string): User | null {
  const users = get<User>(KEYS.users);
  const user = users.find((u) => u.email === email && u.password === password);
  if (user) localStorage.setItem(KEYS.currentUser, JSON.stringify(user));
  return user || null;
}

export function logout() {
  localStorage.removeItem(KEYS.currentUser);
}

export function getCurrentUser(): User | null {
  try {
    const u = localStorage.getItem(KEYS.currentUser);
    return u ? JSON.parse(u) : null;
  } catch {
    return null;
  }
}

export function updateProfile(updates: Partial<Pick<User, "businessName" | "phone" | "address" | "gstNumber">>): User | null {
  const user = getCurrentUser();
  if (!user) return null;
  const users = get<User>(KEYS.users);
  const idx = users.findIndex((u) => u.id === user.id);
  if (idx === -1) return null;
  Object.assign(users[idx], updates);
  set(KEYS.users, users);
  localStorage.setItem(KEYS.currentUser, JSON.stringify(users[idx]));
  return users[idx];
}

// Customers
export function getCustomers(userId: string): Customer[] {
  return get<Customer>(KEYS.customers).filter((c) => c.userId === userId);
}

export function addCustomer(userId: string, name: string, phone: string, notes: string): Customer {
  const customers = get<Customer>(KEYS.customers);
  const c: Customer = { id: genId(), userId, name, phone, notes, createdAt: new Date().toISOString() };
  customers.push(c);
  set(KEYS.customers, customers);
  return c;
}

export function updateCustomer(id: string, updates: Partial<Pick<Customer, "name" | "phone" | "notes">>): Customer | null {
  const customers = get<Customer>(KEYS.customers);
  const idx = customers.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  Object.assign(customers[idx], updates);
  set(KEYS.customers, customers);
  return customers[idx];
}

export function deleteCustomer(id: string) {
  set(KEYS.customers, get<Customer>(KEYS.customers).filter((c) => c.id !== id));
  set(KEYS.transactions, get<Transaction>(KEYS.transactions).filter((t) => t.customerId !== id));
  set(KEYS.reminders, get<Reminder>(KEYS.reminders).filter((r) => r.customerId !== id));
}

// Transactions
export function getTransactions(customerId: string): Transaction[] {
  return get<Transaction>(KEYS.transactions)
    .filter((t) => t.customerId === customerId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getAllTransactions(userId: string): Transaction[] {
  return get<Transaction>(KEYS.transactions)
    .filter((t) => t.userId === userId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function addTransaction(customerId: string, userId: string, amount: number, type: "gave" | "got", note: string, date: string): Transaction {
  const txns = get<Transaction>(KEYS.transactions);
  const t: Transaction = { id: genId(), customerId, userId, amount, type, note, date, createdAt: new Date().toISOString() };
  txns.push(t);
  set(KEYS.transactions, txns);
  return t;
}

export function updateTransaction(id: string, updates: Partial<Pick<Transaction, "amount" | "type" | "note" | "date">>): Transaction | null {
  const txns = get<Transaction>(KEYS.transactions);
  const idx = txns.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  Object.assign(txns[idx], updates);
  set(KEYS.transactions, txns);
  return txns[idx];
}

export function deleteTransaction(id: string) {
  set(KEYS.transactions, get<Transaction>(KEYS.transactions).filter((t) => t.id !== id));
}

export function getCustomerBalance(customerId: string): number {
  const txns = get<Transaction>(KEYS.transactions).filter((t) => t.customerId === customerId);
  return txns.reduce((bal, t) => bal + (t.type === "got" ? t.amount : -t.amount), 0);
}

// Reminders
export function getReminders(userId: string): Reminder[] {
  return get<Reminder>(KEYS.reminders)
    .filter((r) => r.userId === userId)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
}

export function addReminder(customerId: string, userId: string, amount: number, dueDate: string, message: string): Reminder {
  const reminders = get<Reminder>(KEYS.reminders);
  const r: Reminder = { id: genId(), customerId, userId, amount, dueDate, message, sent: false, createdAt: new Date().toISOString() };
  reminders.push(r);
  set(KEYS.reminders, reminders);
  return r;
}

export function deleteReminder(id: string) {
  set(KEYS.reminders, get<Reminder>(KEYS.reminders).filter((r) => r.id !== id));
}

export function markReminderSent(id: string) {
  const reminders = get<Reminder>(KEYS.reminders);
  const idx = reminders.findIndex((r) => r.id === id);
  if (idx !== -1) {
    reminders[idx].sent = true;
    set(KEYS.reminders, reminders);
  }
}

// Expenses
export function getExpenses(userId: string): Expense[] {
  return get<Expense>(KEYS.expenses)
    .filter((e) => e.userId === userId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function addExpense(userId: string, category: string, amount: number, description: string, date: string): Expense {
  const expenses = get<Expense>(KEYS.expenses);
  const expense: Expense = { id: genId(), userId, category, amount, description, date, createdAt: new Date().toISOString() };
  expenses.push(expense);
  set(KEYS.expenses, expenses);
  return expense;
}

export function deleteExpense(id: string) {
  set(KEYS.expenses, get<Expense>(KEYS.expenses).filter((e) => e.id !== id));
}

// Inventory
export function getInventory(userId: string): InventoryItem[] {
  return get<InventoryItem>(KEYS.inventory).filter((i) => i.userId === userId);
}

export function addInventoryItem(userId: string, name: string, quantity: number, unit: string, costPrice: number, sellingPrice: number, lowStockAlert: number): InventoryItem {
  const inventory = get<InventoryItem>(KEYS.inventory);
  const item: InventoryItem = { id: genId(), userId, name, quantity, unit, costPrice, sellingPrice, lowStockAlert, createdAt: new Date().toISOString() };
  inventory.push(item);
  set(KEYS.inventory, inventory);
  return item;
}

export function updateInventoryItem(id: string, updates: Partial<Omit<InventoryItem, "id" | "userId" | "createdAt">>): InventoryItem | null {
  const inventory = get<InventoryItem>(KEYS.inventory);
  const idx = inventory.findIndex((i) => i.id === id);
  if (idx === -1) return null;
  Object.assign(inventory[idx], updates);
  set(KEYS.inventory, inventory);
  return inventory[idx];
}

export function deleteInventoryItem(id: string) {
  set(KEYS.inventory, get<InventoryItem>(KEYS.inventory).filter((i) => i.id !== id));
}

// Sale Bills
export function getSaleBills(customerId: string): SaleBill[] {
  return get<SaleBill>(KEYS.saleBills)
    .filter((b) => b.customerId === customerId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function addSaleBill(customerId: string, userId: string, items: SaleItem[], paid: number, date: string, applyRoundOff: boolean = false): SaleBill {
  const bills = get<SaleBill>(KEYS.saleBills);
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  const gstAmount = items.reduce((sum, item) => {
    const itemTotal = item.quantity * item.price;
    return sum + (itemTotal * (item.gst || 0) / 100);
  }, 0);
  const total = subtotal + gstAmount;
  const roundOff = applyRoundOff ? Math.round(total) - total : 0;
  const finalTotal = total + roundOff;
  const invoiceNumber = getNextInvoiceNumber(userId);
  
  const bill: SaleBill = { 
    id: genId(), 
    invoiceNumber,
    customerId, 
    userId, 
    items, 
    subtotal, 
    gstAmount, 
    total, 
    roundOff,
    finalTotal,
    paid, 
    date, 
    createdAt: new Date().toISOString() 
  };
  
  if (paid < finalTotal) {
    const txn = addTransaction(customerId, userId, finalTotal - paid, "gave", "Invoice " + invoiceNumber, date);
    bill.transactionId = txn.id;
  }
  
  bills.push(bill);
  set(KEYS.saleBills, bills);
  return bill;
}

export function deleteSaleBill(id: string) {
  const bills = get<SaleBill>(KEYS.saleBills);
  const bill = bills.find((b) => b.id === id);
  if (bill?.transactionId) {
    deleteTransaction(bill.transactionId);
  }
  set(KEYS.saleBills, bills.filter((b) => b.id !== id));
}

export function updateSaleBillPaid(id: string, paid: number): SaleBill | null {
  const bills = get<SaleBill>(KEYS.saleBills);
  const idx = bills.findIndex((b) => b.id === id);
  if (idx === -1) return null;
  
  const bill = bills[idx];
  const oldPaid = bill.paid;
  bill.paid = paid;
  
  const newDue = bill.total - paid;
  const oldDue = bill.total - oldPaid;
  
  if (bill.transactionId) {
    if (newDue > 0) {
      updateTransaction(bill.transactionId, { amount: newDue });
    } else {
      deleteTransaction(bill.transactionId);
      bill.transactionId = undefined;
    }
  } else if (newDue > 0) {
    const txn = addTransaction(bill.customerId, bill.userId, newDue, "gave", "Sale Bill #" + bill.id.slice(-6), bill.date);
    bill.transactionId = txn.id;
  }
  
  set(KEYS.saleBills, bills);
  return bills[idx];
}
