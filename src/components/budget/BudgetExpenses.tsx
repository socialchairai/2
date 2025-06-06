import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DollarSign,
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  Calendar,
  Search,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Budget, ExpenseWithDetails, Expense } from "@/types/database";
import { useToast } from "@/components/ui/use-toast";

interface BudgetExpensesProps {
  selectedBudget?: Budget | null;
  onBudgetChange?: (budget: Budget) => void;
}

const BudgetExpenses = ({
  selectedBudget = null,
  onBudgetChange,
}: BudgetExpensesProps = {}) => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [expenses, setExpenses] = useState<ExpenseWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    amount: 0,
    category: "misc" as "alcohol" | "venue" | "decor" | "security" | "misc",
  });

  const { user, chapter, role } = useAuth();
  const { toast } = useToast();

  // Permission checks
  const isSocialChair = role?.name === "Social Chair";
  const canEdit = isSocialChair;
  const canApprove = isSocialChair;
  const canDelete = isSocialChair;
  const canAdd = true; // All users can add expenses

  useEffect(() => {
    if (chapter?.id) {
      fetchBudgets();
    }
  }, [chapter?.id]);

  useEffect(() => {
    if (selectedBudget?.id) {
      fetchExpenses();
    }
  }, [selectedBudget?.id]);

  const fetchBudgets = async () => {
    if (!chapter?.id) return;

    try {
      const { data, error } = await supabase
        .from("budgets")
        .select("*")
        .eq("chapter_id", chapter.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBudgets(data || []);

      // Auto-select first budget if none selected
      if (!selectedBudget && data && data.length > 0) {
        onBudgetChange?.(data[0]);
      }
    } catch (error) {
      console.error("Error fetching budgets:", error);
      toast({
        title: "Error",
        description: "Failed to load budgets",
        variant: "destructive",
      });
    }
  };

  const fetchExpenses = async () => {
    if (!selectedBudget?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("expenses")
        .select(
          `
          *,
          submitter:users!expenses_submitted_by_fkey(first_name, last_name),
          reviewer:users!expenses_reviewed_by_fkey(first_name, last_name)
        `,
        )
        .eq("budget_id", selectedBudget.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      toast({
        title: "Error",
        description: "Failed to load expenses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async () => {
    if (!user?.id || !chapter?.id || !selectedBudget?.id) return;
    if (!formData.title || formData.amount <= 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      const { error } = await supabase.from("expenses").insert({
        budget_id: selectedBudget.id,
        chapter_id: chapter.id,
        submitted_by: user.id,
        title: formData.title,
        description: formData.description || null,
        amount: formData.amount,
        category: formData.category,
        date_incurred: format(new Date(), "yyyy-MM-dd"),
        status: "pending",
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Expense added successfully",
      });

      setFormData({ title: "", description: "", amount: 0, category: "misc" });
      setShowAddDialog(false);
      fetchExpenses();
    } catch (error) {
      console.error("Error adding expense:", error);
      toast({
        title: "Error",
        description: "Failed to add expense",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditExpense = async () => {
    if (!editingExpense?.id) return;
    if (!formData.title || formData.amount <= 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      const { error } = await supabase
        .from("expenses")
        .update({
          title: formData.title,
          description: formData.description || null,
          amount: formData.amount,
          category: formData.category,
        })
        .eq("id", editingExpense.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Expense updated successfully",
      });

      setShowEditDialog(false);
      setEditingExpense(null);
      fetchExpenses();
    } catch (error) {
      console.error("Error updating expense:", error);
      toast({
        title: "Error",
        description: "Failed to update expense",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!canDelete) return;

    try {
      const { error } = await supabase
        .from("expenses")
        .delete()
        .eq("id", expenseId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Expense deleted successfully",
      });

      fetchExpenses();
    } catch (error) {
      console.error("Error deleting expense:", error);
      toast({
        title: "Error",
        description: "Failed to delete expense",
        variant: "destructive",
      });
    }
  };

  const handleApproveExpense = async (expenseId: string) => {
    if (!canApprove || !user?.id) return;

    try {
      const { error } = await supabase
        .from("expenses")
        .update({
          status: "approved",
          reviewed_by: user.id,
        })
        .eq("id", expenseId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Expense approved successfully",
      });

      fetchExpenses();
    } catch (error) {
      console.error("Error approving expense:", error);
      toast({
        title: "Error",
        description: "Failed to approve expense",
        variant: "destructive",
      });
    }
  };

  const handleRejectExpense = async (expenseId: string) => {
    if (!canApprove || !user?.id) return;

    try {
      const { error } = await supabase
        .from("expenses")
        .update({
          status: "rejected",
          reviewed_by: user.id,
        })
        .eq("id", expenseId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Expense rejected",
      });

      fetchExpenses();
    } catch (error) {
      console.error("Error rejecting expense:", error);
      toast({
        title: "Error",
        description: "Failed to reject expense",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      title: expense.title,
      description: expense.description || "",
      amount: expense.amount,
      category: expense.category,
    });
    setShowEditDialog(true);
  };

  const resetForm = () => {
    setFormData({ title: "", description: "", amount: 0, category: "misc" });
  };

  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearch =
      expense.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || expense.status === statusFilter;
    const matchesCategory =
      categoryFilter === "all" || expense.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
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

  const categoryOptions = [
    { value: "alcohol", label: "Alcohol" },
    { value: "venue", label: "Venue" },
    { value: "decor", label: "Decorations" },
    { value: "security", label: "Security" },
    { value: "misc", label: "Miscellaneous" },
  ];

  if (budgets.length === 0) {
    return (
      <Card className="bg-white">
        <CardContent className="p-8 text-center">
          <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Budgets Available</h3>
          <p className="text-gray-600">
            A budget must be created before expenses can be managed.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!selectedBudget) {
    return (
      <Card className="bg-white">
        <CardContent className="p-8 text-center">
          <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Select a Budget</h3>
          <p className="text-gray-600">
            Please select a budget to view and manage its expenses.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 bg-white">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Budget Expenses</h2>
          <p className="text-gray-600">
            Manage expenses for {selectedBudget.period_label}
          </p>
        </div>
        <div className="flex gap-2">
          {budgets.length > 1 && (
            <Select
              value={selectedBudget.id}
              onValueChange={(value) => {
                const budget = budgets.find((b) => b.id === value);
                if (budget) onBudgetChange?.(budget);
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {budgets.map((budget) => (
                  <SelectItem key={budget.id} value={budget.id}>
                    {budget.period_label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {canAdd && (
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Expense
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Expense</DialogTitle>
                  <DialogDescription>
                    Add a new expense to {selectedBudget.period_label}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Title *
                    </label>
                    <Input
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      placeholder="e.g., DJ for Spring Formal"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Amount ($) *
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          amount: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Category
                    </label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) =>
                        setFormData({ ...formData, category: value as any })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Description
                    </label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      placeholder="Additional details..."
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowAddDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleAddExpense} disabled={submitting}>
                    {submitting ? "Adding..." : "Add Expense"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <Card>
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
          </div>

          {/* Table */}
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Expenses Found</h3>
              <p className="text-gray-600">
                {expenses.length === 0
                  ? "No expenses have been added to this budget yet."
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
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.map((expense) => (
                    <TableRow key={expense.id}>
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
                          {format(
                            new Date(expense.date_incurred),
                            "MMM d, yyyy",
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {expense.submitter
                          ? `${expense.submitter.first_name} ${expense.submitter.last_name}`
                          : "Unknown"}
                      </TableCell>
                      <TableCell>{getStatusBadge(expense.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {expense.receipt_url && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                window.open(expense.receipt_url, "_blank")
                              }
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                          {canEdit && expense.status === "pending" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(expense)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {canDelete && expense.status === "pending" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteExpense(expense.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                          {canApprove && expense.status === "pending" && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleApproveExpense(expense.id)}
                                className="text-green-600 hover:text-green-700"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRejectExpense(expense.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
            <DialogDescription>Update the expense details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title *</label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="e.g., DJ for Spring Formal"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Amount ($) *
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    amount: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value as any })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Description
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Additional details..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditExpense} disabled={submitting}>
              {submitting ? "Updating..." : "Update Expense"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BudgetExpenses;
