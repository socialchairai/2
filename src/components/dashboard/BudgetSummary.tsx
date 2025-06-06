import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { BudgetWithExpenses } from "@/types/database";
import { useToast } from "@/components/ui/use-toast";

interface BudgetItem {
  category: string;
  allocated: number;
  spent: number;
  remaining: number;
  percentUsed: number;
}

interface BudgetSummaryProps {
  totalBudget?: number;
  totalSpent?: number;
  budgetItems?: BudgetItem[];
  trendingUp?: boolean;
  percentChange?: number;
}

// Extract data fetching logic
const fetchBudgetData = async (
  chapterId: string,
): Promise<BudgetWithExpenses | null> => {
  const { data: budgetData, error: budgetError } = await supabase
    .from("budgets")
    .select("*")
    .eq("chapter_id", chapterId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (budgetError && budgetError.code !== "PGRST116") {
    throw new Error(`Budget fetch error: ${budgetError.message}`);
  }

  if (!budgetData) return null;

  const { data: expenses, error: expenseError } = await supabase
    .from("expenses")
    .select("*")
    .eq("budget_id", budgetData.id)
    .eq("status", "approved");

  if (expenseError) {
    throw new Error(`Expenses fetch error: ${expenseError.message}`);
  }

  const total_spent = (expenses || []).reduce(
    (sum, expense) => sum + expense.amount,
    0,
  );
  const remaining_budget = budgetData.total_budget - total_spent;

  return {
    ...budgetData,
    expenses: expenses || [],
    total_spent,
    remaining_budget,
  };
};

// Loading state component
const LoadingState = () => (
  <Card className="w-full h-full bg-white shadow-sm">
    <CardHeader className="pb-2">
      <CardTitle className="text-lg font-semibold">Budget Summary</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-20 bg-gray-200 rounded"></div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-4 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    </CardContent>
  </Card>
);

// Empty state component
const EmptyState = () => (
  <Card className="w-full h-full bg-white shadow-sm">
    <CardHeader className="pb-2">
      <CardTitle className="text-lg font-semibold">Budget Summary</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-center py-8">
        <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Budget Found</h3>
        <p className="text-gray-600">
          Create a budget to start tracking your spending.
        </p>
      </div>
    </CardContent>
  </Card>
);

// Budget overview component
const BudgetOverview = ({
  totalBudget,
  totalSpent,
  totalRemaining,
  percentUsed,
  trendingUp,
  percentChange,
  budgetItems,
}: {
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  percentUsed: number;
  trendingUp: boolean;
  percentChange: number;
  budgetItems: BudgetItem[];
}) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total Budget</span>
          <span className="text-xl font-bold">
            ${totalBudget.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Spent</span>
          <span className="text-lg">${totalSpent.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Remaining</span>
          <span className="text-lg text-green-600">
            ${totalRemaining.toLocaleString()}
          </span>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center">
        <div className="relative w-24 h-24">
          <svg className="w-24 h-24" viewBox="0 0 100 100">
            <circle
              className="text-muted stroke-current"
              strokeWidth="10"
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
            />
            <circle
              className="text-primary stroke-current"
              strokeWidth="10"
              strokeLinecap="round"
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              strokeDasharray={`${percentUsed * 2.51} 251`}
              transform="rotate(-90 50 50)"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold">
              {Math.round(percentUsed)}%
            </span>
            <span className="text-xs text-muted-foreground">Used</span>
          </div>
        </div>
        <div className="flex items-center mt-2 text-sm">
          <span
            className={`flex items-center ${
              trendingUp ? "text-red-500" : "text-green-500"
            }`}
          >
            {trendingUp ? (
              <ArrowUpRight className="w-4 h-4 mr-1" />
            ) : (
              <ArrowDownRight className="w-4 h-4 mr-1" />
            )}
            {percentChange}%
          </span>
          <span className="ml-1 text-muted-foreground">vs last month</span>
        </div>
      </div>
    </div>

    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm font-medium">
        <span>Top Spending Categories</span>
        <span>Usage</span>
      </div>
      {budgetItems.slice(0, 3).map((item, index) => (
        <div key={index} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span>{item.category}</span>
            <span>
              ${item.spent.toLocaleString()} / $
              {item.allocated.toLocaleString()}
            </span>
          </div>
          <Progress value={item.percentUsed} className="h-2" />
        </div>
      ))}
    </div>
  </div>
);

// Budget details component
const BudgetDetails = ({ budgetItems }: { budgetItems: BudgetItem[] }) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <BarChart3 className="w-5 h-5 mr-2 text-muted-foreground" />
        <span className="font-medium">Budget Breakdown</span>
      </div>
      <button className="text-sm text-primary hover:underline">
        View Full Report
      </button>
    </div>

    <div className="space-y-3">
      {budgetItems.map((item, index) => (
        <div key={index} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span>{item.category}</span>
            <div className="flex items-center space-x-2">
              <span className="text-green-600">
                ${item.remaining.toLocaleString()} left
              </span>
              <span className="text-muted-foreground">
                ${item.spent.toLocaleString()} / $
                {item.allocated.toLocaleString()}
              </span>
            </div>
          </div>
          <Progress value={item.percentUsed} className="h-2" />
        </div>
      ))}
    </div>

    <div className="flex justify-center mt-4">
      <button className="flex items-center text-sm text-primary hover:underline">
        <DollarSign className="w-4 h-4 mr-1" />
        Manage Budget Allocations
      </button>
    </div>
  </div>
);

const BudgetSummary = ({
  totalBudget: propTotalBudget,
  totalSpent: propTotalSpent,
  budgetItems: propBudgetItems = [],
  trendingUp = false,
  percentChange = 12.5,
}: BudgetSummaryProps) => {
  const [budget, setBudget] = useState<BudgetWithExpenses | null>(null);
  const [loading, setLoading] = useState(true);
  const { chapter } = useAuth();
  const { toast } = useToast();

  // Use props if provided, otherwise use fetched data
  const totalBudget = propTotalBudget ?? budget?.total_budget ?? 0;
  const totalSpent = propTotalSpent ?? budget?.total_spent ?? 0;
  const budgetItems = propBudgetItems;

  useEffect(() => {
    const loadBudgetData = async () => {
      if (!chapter?.id || propTotalBudget !== undefined) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const budgetData = await fetchBudgetData(chapter.id);
        setBudget(budgetData);
      } catch (error) {
        console.error("Error fetching budget data:", error);
        toast({
          title: "Error",
          description: "Failed to load budget data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadBudgetData();
  }, [chapter?.id, propTotalBudget, toast]);

  // Early returns for loading and empty states
  if (loading) return <LoadingState />;
  if (!budget && !propTotalBudget) return <EmptyState />;

  const totalRemaining = totalBudget - totalSpent;
  const percentUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  return (
    <Card className="w-full h-full bg-white shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Budget Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <BudgetOverview
              totalBudget={totalBudget}
              totalSpent={totalSpent}
              totalRemaining={totalRemaining}
              percentUsed={percentUsed}
              trendingUp={trendingUp}
              percentChange={percentChange}
              budgetItems={budgetItems}
            />
          </TabsContent>

          <TabsContent value="details">
            <BudgetDetails budgetItems={budgetItems} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default BudgetSummary;
