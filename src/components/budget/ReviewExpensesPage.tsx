import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle,
  XCircle,
  Eye,
  ExternalLink,
  Calendar,
  DollarSign,
  User,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { ExpenseWithDetails } from "@/types/database";
import { useToast } from "@/components/ui/use-toast";
import ExpensesTable from "./ExpensesTable";

const ReviewExpensesPage = () => {
  const [selectedExpense, setSelectedExpense] =
    useState<ExpenseWithDetails | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [processing, setProcessing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { user, role } = useAuth();
  const { toast } = useToast();

  const canReviewExpenses =
    role?.name === "Social Chair" ||
    role?.name === "Treasurer" ||
    role?.name === "President";

  const handleExpenseReview = async (
    expenseId: string,
    status: "approved" | "rejected",
  ) => {
    if (!user?.id || !canReviewExpenses) return;

    try {
      setProcessing(true);

      const { error } = await supabase
        .from("expenses")
        .update({
          status,
          reviewed_by: user.id,
        })
        .eq("id", expenseId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Expense ${status} successfully`,
      });

      setSelectedExpense(null);
      setReviewNote("");
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Error reviewing expense:", error);
      toast({
        title: "Error",
        description: "Failed to review expense",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
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

  if (!canReviewExpenses) {
    return (
      <div className="space-y-6 bg-white p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to review expenses. Only Social Chairs,
            Treasurers, and Presidents can review expense submissions.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-white">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Review Expenses</h2>
          <p className="text-gray-600">
            Review and approve or reject expense submissions
          </p>
        </div>
      </div>

      <ExpensesTable
        key={refreshKey}
        showActions={true}
        onExpenseSelect={setSelectedExpense}
      />

      {/* Expense Review Dialog */}
      <Dialog
        open={!!selectedExpense}
        onOpenChange={(open) => !open && setSelectedExpense(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Review Expense
            </DialogTitle>
          </DialogHeader>

          {selectedExpense && (
            <div className="space-y-6">
              {/* Expense Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Title
                  </label>
                  <p className="text-lg font-semibold">
                    {selectedExpense.title}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Amount
                  </label>
                  <p className="text-lg font-semibold text-green-600">
                    ${selectedExpense.amount.toFixed(2)}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Category
                  </label>
                  <div className="mt-1">
                    <Badge variant="outline">
                      {getCategoryLabel(selectedExpense.category)}
                    </Badge>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Date Incurred
                  </label>
                  <div className="flex items-center gap-1 mt-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>
                      {format(
                        new Date(selectedExpense.date_incurred),
                        "MMMM d, yyyy",
                      )}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Submitted By
                  </label>
                  <div className="flex items-center gap-1 mt-1">
                    <User className="h-4 w-4 text-gray-400" />
                    <span>
                      {selectedExpense.submitter
                        ? `${selectedExpense.submitter.first_name} ${selectedExpense.submitter.last_name}`
                        : "Unknown"}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Budget
                  </label>
                  <p className="mt-1">
                    {selectedExpense.budget?.period_label || "Unknown"}
                  </p>
                </div>
              </div>

              {/* Description */}
              {selectedExpense.description && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Description
                  </label>
                  <p className="mt-1 p-3 bg-gray-50 rounded-md">
                    {selectedExpense.description}
                  </p>
                </div>
              )}

              {/* Receipt */}
              {selectedExpense.receipt_url && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Receipt
                  </label>
                  <div className="mt-1">
                    <Button
                      variant="outline"
                      onClick={() =>
                        window.open(selectedExpense.receipt_url, "_blank")
                      }
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View Receipt
                    </Button>
                  </div>
                </div>
              )}

              {/* Current Status */}
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Current Status
                </label>
                <div className="mt-1">
                  {selectedExpense.status === "pending" && (
                    <Badge variant="secondary">Pending Review</Badge>
                  )}
                  {selectedExpense.status === "approved" && (
                    <Badge
                      variant="default"
                      className="bg-green-100 text-green-800"
                    >
                      Approved
                    </Badge>
                  )}
                  {selectedExpense.status === "rejected" && (
                    <Badge variant="destructive">Rejected</Badge>
                  )}
                </div>
              </div>

              {/* Review Actions - Only show for pending expenses */}
              {selectedExpense.status === "pending" && (
                <div className="space-y-4 pt-4 border-t">
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Review Note (Optional)
                    </label>
                    <Textarea
                      value={reviewNote}
                      onChange={(e) => setReviewNote(e.target.value)}
                      placeholder="Add a note about your decision..."
                      className="mt-1"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={() =>
                        handleExpenseReview(selectedExpense.id, "approved")
                      }
                      disabled={processing}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {processing ? "Processing..." : "Approve"}
                    </Button>

                    <Button
                      onClick={() =>
                        handleExpenseReview(selectedExpense.id, "rejected")
                      }
                      disabled={processing}
                      variant="destructive"
                      className="flex-1"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      {processing ? "Processing..." : "Reject"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Already reviewed */}
              {selectedExpense.status !== "pending" && (
                <div className="pt-4 border-t">
                  <Alert>
                    <AlertDescription>
                      This expense has already been {selectedExpense.status}.
                      {selectedExpense.reviewer && (
                        <span className="block mt-1">
                          Reviewed by: {selectedExpense.reviewer.first_name}{" "}
                          {selectedExpense.reviewer.last_name}
                        </span>
                      )}
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReviewExpensesPage;
