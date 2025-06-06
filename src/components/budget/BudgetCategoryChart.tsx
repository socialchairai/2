import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, DollarSign } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Expense, Budget } from "@/types/database";
import { useToast } from "@/components/ui/use-toast";

interface CategoryData {
  category: string;
  amount: number;
  count: number;
  color: string;
  label: string;
}

interface BudgetCategoryChartProps {
  className?: string;
}

const BudgetCategoryChart = ({ className = "" }: BudgetCategoryChartProps) => {
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentBudget, setCurrentBudget] = useState<Budget | null>(null);
  const { chapter } = useAuth();
  const { toast } = useToast();

  const categoryConfig = {
    alcohol: { label: "Alcohol", color: "bg-red-500" },
    venue: { label: "Venue", color: "bg-blue-500" },
    decor: { label: "Decorations", color: "bg-purple-500" },
    security: { label: "Security", color: "bg-green-500" },
    misc: { label: "Miscellaneous", color: "bg-gray-500" },
  };

  useEffect(() => {
    if (chapter?.id) {
      fetchCategoryData();
    }
  }, [chapter?.id]);

  const fetchCategoryData = async () => {
    if (!chapter?.id) return;

    try {
      setLoading(true);

      // Get the most recent budget for the chapter
      const { data: budgetData, error: budgetError } = await supabase
        .from("budgets")
        .select("*")
        .eq("chapter_id", chapter.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (budgetError && budgetError.code !== "PGRST116") {
        console.error("Error fetching budget:", budgetError);
        return;
      }

      setCurrentBudget(budgetData);

      // Get approved expenses for the current budget
      const { data: expensesData, error: expensesError } = await supabase
        .from("expenses")
        .select("category, amount")
        .eq("chapter_id", chapter.id)
        .eq("status", "approved")
        .eq("budget_id", budgetData?.id || "")
        .order("created_at", { ascending: false });

      if (expensesError) {
        console.error("Error fetching expenses:", expensesError);
        toast({
          title: "Error",
          description: "Failed to load expense data",
          variant: "destructive",
        });
        return;
      }

      // Group expenses by category
      const categoryTotals: Record<string, { amount: number; count: number }> =
        {};
      let total = 0;

      (expensesData || []).forEach((expense) => {
        const category = expense.category;
        if (!categoryTotals[category]) {
          categoryTotals[category] = { amount: 0, count: 0 };
        }
        categoryTotals[category].amount += expense.amount;
        categoryTotals[category].count += 1;
        total += expense.amount;
      });

      setTotalSpent(total);

      // Convert to chart data
      const chartData = Object.entries(categoryTotals)
        .map(([category, data]) => ({
          category,
          amount: data.amount,
          count: data.count,
          color:
            categoryConfig[category as keyof typeof categoryConfig]?.color ||
            "bg-gray-400",
          label:
            categoryConfig[category as keyof typeof categoryConfig]?.label ||
            category,
        }))
        .sort((a, b) => b.amount - a.amount);

      setCategoryData(chartData);
    } catch (error) {
      console.error("Error fetching category data:", error);
      toast({
        title: "Error",
        description: "Failed to load spending data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className={`bg-white ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Spending by Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-8 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentBudget) {
    return (
      <Card className={`bg-white ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Spending by Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Budget Found</h3>
            <p className="text-gray-600">
              Create a budget to start tracking spending by category.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (categoryData.length === 0) {
    return (
      <Card className={`bg-white ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Spending by Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Expenses Yet</h3>
            <p className="text-gray-600">
              Start logging expenses to see spending breakdown by category.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxAmount = Math.max(...categoryData.map((d) => d.amount));

  return (
    <Card className={`bg-white ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Spending by Category
          </div>
          <Badge variant="outline" className="text-sm">
            {currentBudget.period_label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Total Spending Summary */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm text-gray-600">Total Spent</p>
              <p className="text-2xl font-bold">${totalSpent.toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Budget</p>
              <p className="text-lg font-semibold">
                ${currentBudget.total_budget.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500">
                {((totalSpent / currentBudget.total_budget) * 100).toFixed(1)}%
                used
              </p>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Category Breakdown</h4>
            <div className="space-y-3">
              {categoryData.map((category, index) => {
                const percentage =
                  maxAmount > 0 ? (category.amount / maxAmount) * 100 : 0;
                const budgetPercentage =
                  currentBudget.total_budget > 0
                    ? (category.amount / currentBudget.total_budget) * 100
                    : 0;

                return (
                  <div key={category.category} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-3 h-3 rounded-full ${category.color}`}
                        ></div>
                        <span className="font-medium">{category.label}</span>
                        <Badge variant="secondary" className="text-xs">
                          {category.count} expense
                          {category.count !== 1 ? "s" : ""}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold">
                          ${category.amount.toFixed(2)}
                        </span>
                        <span className="text-gray-500 ml-2">
                          ({budgetPercentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>

                    {/* Stacked Bar */}
                    <div className="relative">
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all duration-300 ${category.color}`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-sm text-gray-600">
                <TrendingUp className="h-4 w-4" />
                Top Category
              </div>
              <p className="font-semibold text-lg">
                {categoryData[0]?.label || "None"}
              </p>
              <p className="text-sm text-gray-500">
                ${categoryData[0]?.amount.toFixed(2) || "0.00"}
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-sm text-gray-600">
                <BarChart3 className="h-4 w-4" />
                Categories
              </div>
              <p className="font-semibold text-lg">{categoryData.length}</p>
              <p className="text-sm text-gray-500">
                {categoryData.reduce((sum, cat) => sum + cat.count, 0)} total
                expenses
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BudgetCategoryChart;
