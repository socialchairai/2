import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Filter,
  ExternalLink,
  Calendar,
  DollarSign,
} from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { ExpenseWithDetails, Budget } from "@/types/database";
import { useToast } from "@/components/ui/use-toast";

interface ExpensesTableProps {
  showActions?: boolean;
  onExpenseSelect?: (expense: ExpenseWithDetails) => void;
}

const ExpensesTable = ({
  showActions = false,
  onExpenseSelect,
}: ExpensesTableProps = {}) => {
  const [expenses, setExpenses] = useState<ExpenseWithDetails[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [budgetFilter, setBudgetFilter] = useState<string>("all");
  const { user, chapter } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (chapter?.id) {
      fetchData();
    }
  }, [chapter?.id]);

  const fetchData = async () => {
    if (!chapter?.id) return;

    try {
      setLoading(true);

      // Fetch budgets
      const { data: budgetData, error: budgetError } = await supabase
        .from("budgets")
        .select("*")
        .eq("chapter_id", chapter.id);

      if (budgetError) throw budgetError;
      setBudgets(budgetData || []);

      // Fetch expenses with user details
      const { data: expenseData, error: expenseError } = await supabase
        .from("expenses")
        .select(
          `
          *,
          submitter:users!expenses_submitted_by_fkey(first_name, last_name),
          reviewer:users!expenses_reviewed_by_fkey(first_name, last_name)
        `,
        )
        .eq("chapter_id", chapter.id)
        .order("created_at", { ascending: false });

      if (expenseError) throw expenseError;

      // Add budget info to expenses
      const expensesWithBudgets = (expenseData || []).map((expense) => ({
        ...expense,
        budget: budgetData?.find((b) => b.id === expense.budget_id),
      }));

      setExpenses(expensesWithBudgets);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load expenses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearch =
      expense.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.submitter?.first_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      expense.submitter?.last_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || expense.status === statusFilter;
    const matchesCategory =
      categoryFilter === "all" || expense.category === categoryFilter;
    const matchesBudget =
      budgetFilter === "all" || expense.budget_id === budgetFilter;

    return matchesSearch && matchesStatus && matchesCategory && matchesBudget;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Approved
          </Badge>
        );
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels = {
      alcohol: "Alcohol",
      venue: "Venue",
      decor: "Decorations",
      security: "Security",
      misc: "Miscellaneous",
    };
    return labels[category as keyof typeof labels] || category;
  };

  if (loading) {
    return (
      <Card className="bg-white">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Expenses ({filteredExpenses.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="alcohol">Alcohol</SelectItem>
              <SelectItem value="venue">Venue</SelectItem>
              <SelectItem value="decor">Decorations</SelectItem>
              <SelectItem value="security">Security</SelectItem>
              <SelectItem value="misc">Miscellaneous</SelectItem>
            </SelectContent>
          </Select>

          {budgets.length > 1 && (
            <Select value={budgetFilter} onValueChange={setBudgetFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Budgets</SelectItem>
                {budgets.map((budget) => (
                  <SelectItem key={budget.id} value={budget.id}>
                    {budget.period_label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Table */}
        {filteredExpenses.length === 0 ? (
          <div className="text-center py-8">
            <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Expenses Found</h3>
            <p className="text-gray-600">
              {expenses.length === 0
                ? "No expenses have been logged yet."
                : "No expenses match your current filters."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Submitted By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Budget</TableHead>
                  {showActions && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.map((expense) => (
                  <TableRow
                    key={expense.id}
                    className={
                      onExpenseSelect ? "cursor-pointer hover:bg-gray-50" : ""
                    }
                    onClick={() => onExpenseSelect?.(expense)}
                  >
                    <TableCell>
                      <div>
                        <div className="font-medium">{expense.title}</div>
                        {expense.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {expense.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      ${expense.amount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getCategoryLabel(expense.category)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        {format(new Date(expense.date_incurred), "MMM d, yyyy")}
                      </div>
                    </TableCell>
                    <TableCell>
                      {expense.submitter
                        ? `${expense.submitter.first_name} ${expense.submitter.last_name}`
                        : "Unknown"}
                    </TableCell>
                    <TableCell>{getStatusBadge(expense.status)}</TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {expense.budget?.period_label || "Unknown"}
                      </span>
                    </TableCell>
                    {showActions && (
                      <TableCell>
                        <div className="flex gap-2">
                          {expense.receipt_url && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(expense.receipt_url, "_blank");
                              }}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ExpensesTable;
