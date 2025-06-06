import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  DollarSign,
  Building2,
  Mail,
  Phone,
  Edit,
  Trash2,
  Search,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Sponsorship } from "@/types/database";
import { useToast } from "@/components/ui/use-toast";

const sponsorSchema = z.object({
  sponsor_name: z.string().min(1, "Sponsor name is required"),
  amount: z.number().min(0, "Amount must be positive"),
  contact_email: z.string().email("Invalid email").optional().or(z.literal("")),
  contact_phone: z.string().optional(),
  logo_url: z.string().url("Invalid URL").optional().or(z.literal("")),
  status: z.enum(["active", "pending", "expired"]),
  notes: z.string().optional(),
});

type SponsorFormData = z.infer<typeof sponsorSchema>;

interface SponsorPanelProps {
  className?: string;
}

const SponsorPanel = ({ className = "" }: SponsorPanelProps) => {
  const [sponsors, setSponsors] = useState<Sponsorship[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState<Sponsorship | null>(
    null,
  );
  const { user, chapter } = useAuth();
  const { toast } = useToast();

  const form = useForm<SponsorFormData>({
    resolver: zodResolver(sponsorSchema),
    defaultValues: {
      sponsor_name: "",
      amount: 0,
      contact_email: "",
      contact_phone: "",
      logo_url: "",
      status: "active",
      notes: "",
    },
  });

  useEffect(() => {
    if (chapter?.id) {
      fetchSponsors();
    }
  }, [chapter?.id]);

  const fetchSponsors = async () => {
    if (!chapter?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("sponsorships")
        .select("*")
        .eq("chapter_id", chapter.id)
        .order("amount", { ascending: false });

      if (error) throw error;
      setSponsors(data || []);
    } catch (error) {
      console.error("Error fetching sponsors:", error);
      toast({
        title: "Error",
        description: "Failed to load sponsors",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: SponsorFormData) => {
    if (!chapter?.id) return;

    try {
      if (editingSponsor) {
        // Update existing sponsor
        const { error } = await supabase
          .from("sponsorships")
          .update({
            sponsor_name: data.sponsor_name,
            amount: data.amount,
            contact_email: data.contact_email || null,
            contact_phone: data.contact_phone || null,
            logo_url: data.logo_url || null,
            status: data.status,
            notes: data.notes || null,
          })
          .eq("id", editingSponsor.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Sponsor updated successfully",
        });
      } else {
        // Create new sponsor
        const { error } = await supabase.from("sponsorships").insert({
          chapter_id: chapter.id,
          sponsor_name: data.sponsor_name,
          amount: data.amount,
          contact_email: data.contact_email || null,
          contact_phone: data.contact_phone || null,
          logo_url: data.logo_url || null,
          status: data.status,
          notes: data.notes || null,
        });

        if (error) throw error;

        toast({
          title: "Success",
          description: "Sponsor added successfully",
        });
      }

      form.reset();
      setEditingSponsor(null);
      setIsDialogOpen(false);
      fetchSponsors();
    } catch (error) {
      console.error("Error saving sponsor:", error);
      toast({
        title: "Error",
        description: "Failed to save sponsor",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (sponsor: Sponsorship) => {
    setEditingSponsor(sponsor);
    form.reset({
      sponsor_name: sponsor.sponsor_name,
      amount: sponsor.amount,
      contact_email: sponsor.contact_email || "",
      contact_phone: sponsor.contact_phone || "",
      logo_url: sponsor.logo_url || "",
      status: sponsor.status,
      notes: sponsor.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (sponsorId: string) => {
    if (!confirm("Are you sure you want to delete this sponsor?")) return;

    try {
      const { error } = await supabase
        .from("sponsorships")
        .delete()
        .eq("id", sponsorId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Sponsor deleted successfully",
      });
      fetchSponsors();
    } catch (error) {
      console.error("Error deleting sponsor:", error);
      toast({
        title: "Error",
        description: "Failed to delete sponsor",
        variant: "destructive",
      });
    }
  };

  const filteredSponsors = sponsors.filter((sponsor) =>
    sponsor.sponsor_name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const totalAmount = sponsors
    .filter((s) => s.status === "active")
    .reduce((sum, sponsor) => sum + sponsor.amount, 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Active
          </Badge>
        );
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "expired":
        return <Badge variant="outline">Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card className={`bg-white ${className}`}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-white ${className}`}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Sponsor Management
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Total Active Sponsorship: ${totalAmount.toLocaleString()}
            </p>
          </div>
          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                setEditingSponsor(null);
                form.reset();
              }
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Sponsor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingSponsor ? "Edit Sponsor" : "Add New Sponsor"}
                </DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="sponsor_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sponsor Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Company Name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
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

                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="expired">Expired</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="contact_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Email (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="contact@company.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contact_phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Phone (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="(555) 123-4567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="logo_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Logo URL (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="url"
                            placeholder="https://example.com/logo.png"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Additional notes about this sponsor..."
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-3 pt-4">
                    <Button type="submit" className="flex-1">
                      {editingSponsor ? "Update Sponsor" : "Add Sponsor"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search sponsors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Sponsors Table */}
        {filteredSponsors.length === 0 ? (
          <div className="text-center py-8">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Sponsors Found</h3>
            <p className="text-gray-600">
              {sponsors.length === 0
                ? "Add your first sponsor to get started."
                : "No sponsors match your search."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sponsor</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSponsors.map((sponsor) => (
                  <TableRow key={sponsor.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        {sponsor.logo_url ? (
                          <img
                            src={sponsor.logo_url}
                            alt={sponsor.sponsor_name}
                            className="h-8 w-8 rounded object-cover"
                          />
                        ) : (
                          <div className="h-8 w-8 bg-gray-100 rounded flex items-center justify-center">
                            <Building2 className="h-4 w-4 text-gray-500" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium">
                            {sponsor.sponsor_name}
                          </div>
                          {sponsor.notes && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {sponsor.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <DollarSign className="h-3 w-3 text-gray-400 mr-1" />
                        {sponsor.amount.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(sponsor.status)}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {sponsor.contact_email && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Mail className="h-3 w-3 mr-1" />
                            {sponsor.contact_email}
                          </div>
                        )}
                        {sponsor.contact_phone && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="h-3 w-3 mr-1" />
                            {sponsor.contact_phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(sponsor)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(sponsor.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
  );
};

export default SponsorPanel;
