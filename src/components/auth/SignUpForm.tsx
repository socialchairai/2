import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import {
  Eye,
  EyeOff,
  AlertCircle,
  Users,
  GraduationCap,
  Building2,
  Loader2,
  Search,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const signUpSchema = z
  .object({
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    lastName: z.string().min(2, "Last name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    universityId: z.string().min(1, "Please select a university"),
    organizationId: z.string().min(1, "Please select an organization"),
    chapterId: z.string().min(1, "Please select a chapter"),
    roleName: z.string().default("Social Chair"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type SignUpFormData = z.infer<typeof signUpSchema>;

interface University {
  id: string;
  name: string;
  location?: string;
}

interface Organization {
  id: string;
  name: string;
  type: "fraternity" | "sorority";
}

interface Chapter {
  id: string;
  name: string;
  university_id: string;
  organization_id: string;
}

interface SignUpFormProps {
  onSwitchToLogin: () => void;
}

export default function SignUpForm({ onSwitchToLogin }: SignUpFormProps) {
  const { signUp, signIn, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmationMessage, setShowConfirmationMessage] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");

  // Data states
  const [universities, setUniversities] = useState<University[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);

  // Loading states
  const [loadingUniversities, setLoadingUniversities] = useState(true);
  const [loadingOrganizations, setLoadingOrganizations] = useState(false);
  const [loadingChapters, setLoadingChapters] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      roleName: "Social Chair",
    },
  });

  const selectedUniversityId = watch("universityId");
  const selectedOrganizationId = watch("organizationId");

  // Fetch universities on component mount
  useEffect(() => {
    const fetchUniversities = async () => {
      try {
        setLoadingUniversities(true);
        const { data, error } = await supabase
          .from("universities")
          .select("id, name, location")
          .order("name");

        if (error) throw error;
        setUniversities(data || []);
      } catch (error) {
        console.error("Error fetching universities:", error);
        setError("Failed to load universities. Please try again.");
      } finally {
        setLoadingUniversities(false);
      }
    };

    fetchUniversities();
  }, []);

  // Fetch organizations when university is selected
  useEffect(() => {
    if (!selectedUniversityId) {
      setOrganizations([]);
      return;
    }

    const fetchOrganizations = async () => {
      try {
        setLoadingOrganizations(true);
        const { data, error } = await supabase
          .from("university_organizations")
          .select(
            `
            organizations (
              id,
              name,
              type
            )
          `,
          )
          .eq("university_id", selectedUniversityId);

        if (error) throw error;

        const orgs =
          data?.map((item) => item.organizations).filter(Boolean) || [];
        setOrganizations(orgs as Organization[]);

        // Reset organization and chapter selections
        setValue("organizationId", "");
        setValue("chapterId", "");
        setChapters([]);
      } catch (error) {
        console.error("Error fetching organizations:", error);
        setError("Failed to load organizations. Please try again.");
      } finally {
        setLoadingOrganizations(false);
      }
    };

    fetchOrganizations();
  }, [selectedUniversityId, setValue]);

  // Fetch chapters when organization is selected
  useEffect(() => {
    if (!selectedUniversityId || !selectedOrganizationId) {
      setChapters([]);
      return;
    }

    const fetchChapters = async () => {
      try {
        setLoadingChapters(true);
        const { data, error } = await supabase
          .from("new_chapters")
          .select("id, name, university_id, organization_id")
          .eq("university_id", selectedUniversityId)
          .eq("organization_id", selectedOrganizationId)
          .eq("is_active", true)
          .order("name");

        if (error) throw error;
        setChapters(data || []);

        // Reset chapter selection
        setValue("chapterId", "");
      } catch (error) {
        console.error("Error fetching chapters:", error);
        setError("Failed to load chapters. Please try again.");
      } finally {
        setLoadingChapters(false);
      }
    };

    fetchChapters();
  }, [selectedUniversityId, selectedOrganizationId, setValue]);

  const onSubmit = async (data: SignUpFormData) => {
    setError(null);

    // Find the selected university, organization, and chapter names
    const university = universities.find((u) => u.id === data.universityId);
    const organization = organizations.find(
      (o) => o.id === data.organizationId,
    );

    // Handle both database chapters and the default "Rho Delta" option
    let chapterName = "";
    if (data.chapterId === "rho-delta") {
      chapterName = "Rho Delta";
    } else {
      const chapter = chapters.find((c) => c.id === data.chapterId);
      chapterName = chapter?.name || "";
    }

    if (!university || !organization || !chapterName) {
      setError("Please select all required information");
      return;
    }

    const { error: signUpError, needsConfirmation } = await signUp({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: data.password,
      schoolName: university.name,
      fraternityName: organization.name,
      chapterCode: chapterName,
      roleName: data.roleName,
    });

    if (signUpError) {
      setError(signUpError);
      return;
    }

    if (needsConfirmation) {
      // Show confirmation message instead of trying to sign in
      setUserEmail(data.email);
      setShowConfirmationMessage(true);
      return;
    }

    // If no confirmation needed, redirect to dashboard
    navigate("/dashboard");
  };

  if (loadingUniversities) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto bg-white/95 backdrop-blur-sm shadow-2xl animate-pulse">
          <CardHeader className="text-center py-12">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Loading Universities...
            </CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              🏫 Fetching university information
            </CardDescription>
            <div className="mt-6 space-y-2">
              <div className="h-2 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="h-2 bg-gray-200 rounded-full animate-pulse w-3/4 mx-auto"></div>
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Show confirmation message after successful signup
  if (showConfirmationMessage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <Card className="w-full max-w-lg mx-auto bg-white/95 backdrop-blur-sm shadow-2xl border-0 animate-in slide-in-from-bottom-6 duration-700">
          <CardHeader className="text-center space-y-4 pb-6">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full shadow-lg">
                <svg
                  className="h-8 w-8 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Check Your Email!
            </CardTitle>
            <CardDescription className="text-gray-600 text-base leading-relaxed">
              We've sent a confirmation link to <strong>{userEmail}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert className="border-blue-200 bg-blue-50">
              <svg
                className="h-4 w-4 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <AlertDescription className="text-blue-800">
                <strong>Next Steps:</strong>
                <ol className="list-decimal list-inside mt-2 space-y-1">
                  <li>Check your email inbox (and spam folder)</li>
                  <li>Click the confirmation link in the email</li>
                  <li>Return here to sign in to your account</li>
                </ol>
              </AlertDescription>
            </Alert>

            <div className="text-center space-y-4">
              <p className="text-sm text-gray-600">
                Didn't receive the email? Check your spam folder or contact
                support.
              </p>

              <Button
                onClick={onSwitchToLogin}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
              >
                Go to Sign In
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  setShowConfirmationMessage(false);
                  setUserEmail("");
                  reset();
                }}
                className="w-full"
              >
                Sign Up Different Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-lg mx-auto space-y-6">
        {/* Callout Banner */}
        <Alert className="border-blue-200 bg-blue-50 shadow-sm animate-in slide-in-from-top-4 duration-500">
          <Users className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Social Chairs Only:</strong> This form is exclusively for
            Social Chairs to create accounts. Executive Board members should
            request view-only access separately.
          </AlertDescription>
        </Alert>

        <Card className="bg-white/95 backdrop-blur-sm shadow-2xl border-0 animate-in slide-in-from-bottom-6 duration-700">
          <CardHeader className="text-center space-y-3 pb-6">
            <div className="flex justify-center mb-3">
              <div className="p-4 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full shadow-lg">
                <GraduationCap className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Join Social Chair Assistant
            </CardTitle>
            <CardDescription className="text-gray-600 text-base">
              Create your account to manage chapter events and activities
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <Alert
                  variant="destructive"
                  className="animate-in slide-in-from-top-2"
                >
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Personal Information */}
              <div className="space-y-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 bg-blue-100 rounded-md">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-lg">
                    Personal Information
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="firstName"
                      className="text-sm font-medium text-gray-700"
                    >
                      First Name
                    </Label>
                    <Input
                      id="firstName"
                      {...register("firstName")}
                      placeholder="John"
                      className="h-11 transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400"
                    />
                    {errors.firstName && (
                      <p className="text-sm text-red-500 animate-in slide-in-from-top-1 duration-200">
                        {errors.firstName.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="lastName"
                      className="text-sm font-medium text-gray-700"
                    >
                      Last Name
                    </Label>
                    <Input
                      id="lastName"
                      {...register("lastName")}
                      placeholder="Doe"
                      className="h-11 transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400"
                    />
                    {errors.lastName && (
                      <p className="text-sm text-red-500 animate-in slide-in-from-top-1 duration-200">
                        {errors.lastName.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-sm font-medium text-gray-700"
                  >
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    {...register("email")}
                    placeholder="john.doe@university.edu"
                    className="h-11 transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400"
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500 animate-in slide-in-from-top-1 duration-200">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="text-sm font-medium text-gray-700"
                  >
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      {...register("password")}
                      placeholder="••••••••"
                      className="h-11 pr-12 transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-11 px-3 hover:bg-gray-100 transition-colors duration-200"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-500" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-500" />
                      )}
                    </Button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-red-500 animate-in slide-in-from-top-1 duration-200">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="confirmPassword"
                    className="text-sm font-medium text-gray-700"
                  >
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      {...register("confirmPassword")}
                      placeholder="••••••••"
                      className="h-11 pr-12 transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-11 px-3 hover:bg-gray-100 transition-colors duration-200"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-500" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-500" />
                      )}
                    </Button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-red-500 animate-in slide-in-from-top-1 duration-200">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </div>

              <Separator className="my-8" />

              {/* Chapter Information */}
              <div className="space-y-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 bg-indigo-100 rounded-md">
                    <Building2 className="h-4 w-4 text-indigo-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-lg">
                    Chapter Information
                  </h3>
                </div>

                {/* University Selection */}
                <div className="space-y-2">
                  <Label
                    htmlFor="universityId"
                    className="text-sm font-medium text-gray-700 flex items-center gap-2"
                  >
                    <GraduationCap className="h-4 w-4 text-blue-600" />
                    University
                  </Label>
                  <Select
                    onValueChange={(value) => {
                      setValue("universityId", value);
                    }}
                  >
                    <SelectTrigger className="h-11 transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400">
                      <SelectValue placeholder="🔍 Search and select your university" />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {universities.map((university) => (
                        <SelectItem key={university.id} value={university.id}>
                          <div className="flex flex-col py-1">
                            <span className="font-medium text-gray-900">
                              {university.name}
                            </span>
                            {university.location && (
                              <span className="text-sm text-gray-500">
                                📍 {university.location}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.universityId && (
                    <p className="text-sm text-red-500 animate-in slide-in-from-top-1 duration-200">
                      {errors.universityId.message}
                    </p>
                  )}
                </div>

                {/* Organization Selection */}
                <div className="space-y-2">
                  <Label
                    htmlFor="organizationId"
                    className="text-sm font-medium text-gray-700 flex items-center gap-2"
                  >
                    <Users className="h-4 w-4 text-indigo-600" />
                    Organization
                  </Label>
                  <Select
                    onValueChange={(value) => {
                      setValue("organizationId", value);
                    }}
                    disabled={!selectedUniversityId || loadingOrganizations}
                  >
                    <SelectTrigger className="h-11 transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 disabled:opacity-60">
                      <SelectValue
                        placeholder={
                          !selectedUniversityId
                            ? "👆 Select university first"
                            : loadingOrganizations
                              ? "⏳ Loading organizations..."
                              : "🔍 Select your fraternity or sorority"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingOrganizations ? (
                        <div className="flex items-center justify-center p-6">
                          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                          <span className="ml-2 text-sm text-gray-600">
                            Loading...
                          </span>
                        </div>
                      ) : (
                        organizations.map((organization) => (
                          <SelectItem
                            key={organization.id}
                            value={organization.id}
                            className="py-3"
                          >
                            <div className="flex items-center gap-3">
                              <span className="font-medium text-gray-900">
                                {organization.name}
                              </span>
                              <Badge
                                variant={
                                  organization.type === "fraternity"
                                    ? "default"
                                    : "secondary"
                                }
                                className="text-xs font-medium"
                              >
                                {organization.type === "fraternity"
                                  ? "🏛️ Fraternity"
                                  : "🌸 Sorority"}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {errors.organizationId && (
                    <p className="text-sm text-red-500 animate-in slide-in-from-top-1 duration-200">
                      {errors.organizationId.message}
                    </p>
                  )}
                </div>

                {/* Chapter Selection */}
                <div className="space-y-2">
                  <Label
                    htmlFor="chapterId"
                    className="text-sm font-medium text-gray-700 flex items-center gap-2"
                  >
                    <Building2 className="h-4 w-4 text-purple-600" />
                    Chapter
                  </Label>
                  <Select
                    onValueChange={(value) => {
                      setValue("chapterId", value);
                    }}
                    disabled={!selectedOrganizationId || loadingChapters}
                  >
                    <SelectTrigger className="h-11 transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 disabled:opacity-60">
                      <SelectValue
                        placeholder={
                          !selectedOrganizationId
                            ? "👆 Select organization first"
                            : loadingChapters
                              ? "⏳ Loading chapters..."
                              : "🔍 Select your specific chapter"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingChapters ? (
                        <div className="flex items-center justify-center p-6">
                          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                          <span className="ml-2 text-sm text-gray-600">
                            Loading...
                          </span>
                        </div>
                      ) : (
                        <>
                          {/* Default Rho Delta chapter option */}
                          <SelectItem value="rho-delta" className="py-3">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">🏛️</span>
                              <span className="font-medium text-gray-900">
                                Rho Delta Chapter
                              </span>
                            </div>
                          </SelectItem>

                          {/* Database chapters */}
                          {chapters.length > 0 &&
                            chapters.map((chapter) => (
                              <SelectItem
                                key={chapter.id}
                                value={chapter.id}
                                className="py-3"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">🏛️</span>
                                  <span className="font-medium text-gray-900">
                                    {chapter.name} Chapter
                                  </span>
                                </div>
                              </SelectItem>
                            ))}

                          {chapters.length === 0 && (
                            <div className="p-6 text-center">
                              <div className="text-gray-400 mb-2">📭</div>
                              <p className="text-sm text-gray-500">
                                No additional chapters found for this
                                combination
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  {errors.chapterId && (
                    <p className="text-sm text-red-500 animate-in slide-in-from-top-1 duration-200">
                      {errors.chapterId.message}
                    </p>
                  )}
                </div>

                {/* Role Selection (Disabled) */}
                <div className="space-y-2">
                  <Label
                    htmlFor="roleName"
                    className="text-sm font-medium text-gray-700 flex items-center gap-2"
                  >
                    <div className="p-1 bg-green-100 rounded">
                      <Users className="h-3 w-3 text-green-600" />
                    </div>
                    Your Role
                  </Label>
                  <Select value="Social Chair" disabled>
                    <SelectTrigger className="h-11 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 cursor-not-allowed">
                      <SelectValue placeholder="🎉 Social Chair" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Social Chair">
                        <div className="py-2">
                          <div className="font-medium text-green-700 flex items-center gap-2">
                            🎉 Social Chair
                          </div>
                          <div className="text-sm text-green-600 mt-1">
                            Can create/edit/delete events, manage guest lists,
                            view budgets
                          </div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded-md">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Only Social Chairs can sign up at this time</span>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
                disabled={authLoading}
                size="lg"
              >
                {authLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creating Your Account...
                  </>
                ) : (
                  <>
                    <span>🚀 Create Account</span>
                  </>
                )}
              </Button>

              <div className="text-center pt-6">
                <Button
                  type="button"
                  variant="link"
                  onClick={onSwitchToLogin}
                  className="text-sm text-gray-600 hover:text-blue-600 transition-colors duration-300 font-medium"
                >
                  Already have an account?{" "}
                  <span className="text-blue-600 underline">Sign in</span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
