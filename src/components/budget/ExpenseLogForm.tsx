import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Upload, DollarSign, FileImage, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Budget } from "@/types/database";
import { useToast } from "@/components/ui/use-toast";

const expenseSchema = z.object({
  budget_id: z.string().min(1, "Budget is required"),
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be less than 100 characters"),
  description: z.string().optional(),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  category: z.enum(["alcohol", "venue", "decor", "security", "misc"]),
  date_incurred: z.date({
    required_error: "Date is required",
  }),
  receipt_url: z.string().url().optional().or(z.literal("")),
  receipt_file: z.any().optional(),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

interface ExpenseLogFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const ExpenseLogForm = ({ onSuccess, onCancel }: ExpenseLogFormProps = {}) => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const { user, chapter } = useAuth();
  const { toast } = useToast();

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      title: "",
      description: "",
      amount: 0,
      category: "misc",
      receipt_url: "",
    },
  });

  // Auto-link budget based on category
  const selectedCategory = form.watch("category");
  useEffect(() => {
    if (selectedCategory && budgets.length > 0) {
      // Auto-select the most recent budget for the category
      const relevantBudget =
        budgets.find(
          (budget) =>
            budget.period_label.toLowerCase().includes(selectedCategory) ||
            budget.period_label.toLowerCase().includes("general"),
        ) || budgets[0];

      if (relevantBudget && !form.getValues("budget_id")) {
        form.setValue("budget_id", relevantBudget.id);
      }
    }
  }, [selectedCategory, budgets, form]);

  useEffect(() => {
    if (chapter?.id) {
      fetchBudgets();
    }
  }, [chapter?.id]);

  const fetchBudgets = async () => {
    if (!chapter?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("budgets")
        .select("*")
        .eq("chapter_id", chapter.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBudgets(data || []);

      // Auto-select the most recent budget if only one exists
      if (data && data.length === 1) {
        form.setValue("budget_id", data[0].id);
      }
    } catch (error) {
      console.error("Error fetching budgets:", error);
      toast({
        title: "Error",
        description: "Failed to load budgets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
        toast({
          title: "Invalid file type",
          description: "Please upload an image or PDF file",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 5MB",
          variant: "destructive",
        });
        return;
      }

      setUploadedFile(file);

      // Create preview for images
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setUploadPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setUploadPreview(null);
      }
    }
  };

  const removeUploadedFile = () => {
    setUploadedFile(null);
    setUploadPreview(null);
  };

  const onSubmit = async (data: ExpenseFormData) => {
    if (!user?.id || !chapter?.id) return;

    try {
      setSubmitting(true);

      let receiptUrl = data.receipt_url || null;

      // If there's an uploaded file, we would normally upload it to storage
      // For now, we'll just use a placeholder URL
      if (uploadedFile) {
        // In a real implementation, you would upload to Supabase Storage:
        // const { data: uploadData, error: uploadError } = await supabase.storage
        //   .from('receipts')
        //   .upload(`${user.id}/${Date.now()}-${uploadedFile.name}`, uploadedFile);
        // receiptUrl = uploadData?.path;

        receiptUrl = `placeholder-receipt-${Date.now()}.${uploadedFile.name.split(".").pop()}`;
      }

      const { error } = await supabase.from("expenses").insert({
        budget_id: data.budget_id,
        chapter_id: chapter.id,
        submitted_by: user.id,
        title: data.title,
        description: data.description || null,
        amount: data.amount,
        category: data.category,
        date_incurred: format(data.date_incurred, "yyyy-MM-dd"),
        receipt_url: receiptUrl,
        status: "pending",
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Expense submitted successfully and is pending review",
      });

      form.reset();
      setUploadedFile(null);
      setUploadPreview(null);
      onSuccess?.();
    } catch (error) {
      console.error("Error submitting expense:", error);
      toast({
        title: "Error",
        description: "Failed to submit expense",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-white">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (budgets.length === 0) {
    return (
      <Card className="bg-white">
        <CardContent className="p-8 text-center">
          <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Budgets Available</h3>
          <p className="text-gray-600">
            A budget must be created before expenses can be logged.
          </p>
        </CardContent>
      </Card>
    );
  }

  const categoryOptions = [
    { value: "alcohol", label: "Alcohol" },
    { value: "venue", label: "Venue" },
    { value: "decor", label: "Decorations" },
    { value: "security", label: "Security" },
    { value: "misc", label: "Miscellaneous" },
  ];

  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Log New Expense
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="budget_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Budget</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a budget" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {budgets.map((budget) => (
                        <SelectItem key={budget.id} value={budget.id}>
                          {budget.period_label} - $
                          {budget.total_budget.toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expense Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., DJ for Spring Formal"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categoryOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date_incurred"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date Incurred</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground",
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional details about this expense..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="receipt_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Receipt URL (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder="https://example.com/receipt.pdf"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="text-center text-sm text-gray-500">or</div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Receipt (Optional)
                </label>
                {!uploadedFile ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="receipt-upload"
                    />
                    <label
                      htmlFor="receipt-upload"
                      className="cursor-pointer flex flex-col items-center"
                    >
                      <Upload className="h-8 w-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600">
                        Click to upload or drag and drop
                      </span>
                      <span className="text-xs text-gray-500 mt-1">
                        PNG, JPG, PDF up to 5MB
                      </span>
                    </label>
                  </div>
                ) : (
                  <div className="border border-gray-300 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {uploadPreview ? (
                            <img
                              src={uploadPreview}
                              alt="Receipt preview"
                              className="h-12 w-12 object-cover rounded"
                            />
                          ) : (
                            <div className="h-12 w-12 bg-gray-100 rounded flex items-center justify-center">
                              <FileImage className="h-6 w-6 text-gray-500" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {uploadedFile.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={removeUploadedFile}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={submitting} className="flex-1">
                {submitting ? "Submitting..." : "Submit Expense"}
              </Button>
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default ExpenseLogForm;
