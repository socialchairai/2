import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DollarSign, TrendingUp, TrendingDown, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Budget, BudgetWithExpenses } from "@/types/database";
import { useToast } from "@/components/ui/use-toast";

interface BudgetOverviewProps {
  onCreateBudget?: () => void;
}

const BudgetOverview = ({ onCreateBudget }: BudgetOverviewProps = {}) => {
  const [budgets, setBudgets] = useState<BudgetWithExpenses[]>([]);
  const [selectedBudget, setSelectedBudget] =
    useState<BudgetWithExpenses | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, chapter, role } = useAuth();
  const { toast } = useToast();

  const canCreateBudget =
    role?.name === "Social Chair" || role?.name === "Treasurer";

  useEffect(() => {
    if (chapter?.id) {
      fetchBudgets();
    }
  }, [chapter?.id]);

  const fetchBudgets = async () => {
    if (!chapter?.id) return;

    try {
      setLoading(true);
      const { data: budgetData, error: budgetError } = await supabase
        .from("budgets")
        .select("*")
        .eq("chapter_id", chapter.id)
        .order("created_at", { ascending: false });

      if (budgetError) throw budgetError;

      const budgetsWithExpenses = await Promise.all(
        (budgetData || []).map(async (budget) => {
          const { data: expenses, error: expenseError } = await supabase
            .from("expenses")
            .select("*")
            .eq("budget_id", budget.id);

          if (expenseError) {
            console.error("Error fetching expenses:", expenseError);
            return {
              ...budget,
              expenses: [],
              total_spent: 0,
              remaining_budget: budget.total_budget,
            };
          }

          const approvedExpenses =
            expenses?.filter((e) => e.status === "approved") || [];
          const total_spent = approvedExpenses.reduce(
            (sum, expense) => sum + expense.amount,
            0,
          );
          const remaining_budget = budget.total_budget - total_spent;

          return {
            ...budget,
            expenses: expenses || [],
            total_spent,
            remaining_budget,
          };
        }),
      );

      setBudgets(budgetsWithExpenses);
      if (budgetsWithExpenses.length > 0 && !selectedBudget) {
        setSelectedBudget(budgetsWithExpenses[0]);
      }
    } catch (error) {
      console.error("Error fetching budgets:", error);
      toast({
        title: "Error",
        description: "Failed to load budget data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 bg-gray-200 rounded animate-pulse"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  if (budgets.length === 0) {
    return (
      <Card className="bg-white">
        <CardContent className="p-8 text-center">
          <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Budgets Found</h3>
          <p className="text-gray-600 mb-4">
            {canCreateBudget
              ? "Create your first budget to start tracking expenses."
              : "No budgets have been created for this chapter yet."}
          </p>
          {canCreateBudget && onCreateBudget && (
            <Button onClick={onCreateBudget}>
              <Plus className="h-4 w-4 mr-2" />
              Create Budget
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  const budget = selectedBudget;
  if (!budget) return null;

  const spentPercentage =
    budget.total_budget > 0
      ? (budget.total_spent! / budget.total_budget) * 100
      : 0;
  const isOverBudget = budget.remaining_budget! < 0;

  return (
    <div className="space-y-6 bg-white">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Budget Overview</h2>
          <p className="text-gray-600">
            Track your chapter's spending and budget allocation
          </p>
        </div>
        <div className="flex gap-2">
          {budgets.length > 1 && (
            <Select
              value={budget.id}
              onValueChange={(value) => {
                const selected = budgets.find((b) => b.id === value);
                if (selected) setSelectedBudget(selected);
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {budgets.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.period_label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {canCreateBudget && onCreateBudget && (
            <Button onClick={onCreateBudget}>
              <Plus className="h-4 w-4 mr-2" />
              New Budget
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${budget.total_budget.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {budget.period_label}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${budget.total_spent!.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {spentPercentage.toFixed(1)}% of budget
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${isOverBudget ? "text-red-600" : "text-green-600"}`}
            >
              ${Math.abs(budget.remaining_budget!).toFixed(2)}
              {isOverBudget && (
                <Badge variant="destructive" className="ml-2 text-xs">
                  Over Budget
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {isOverBudget ? "Over by" : "Remaining"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Budget Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Spent: ${budget.total_spent!.toFixed(2)}</span>
              <span>Budget: ${budget.total_budget.toFixed(2)}</span>
            </div>
            <Progress
              value={Math.min(spentPercentage, 100)}
              className={`h-3 ${isOverBudget ? "bg-red-100" : ""}`}
            />
            {isOverBudget && (
              <p className="text-sm text-red-600 font-medium">
                Warning: You have exceeded your budget by $
                {Math.abs(budget.remaining_budget!).toFixed(2)}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BudgetOverview;
