import React, { createContext, useContext, useEffect, useState } from "react";
import { User as SupabaseUser, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { User, Chapter, Role, UserChapterLink } from "@/types/database";

interface AuthContextType {
  // Auth state
  user: User | null;
  supabaseUser: SupabaseUser | null;
  session: Session | null;
  loading: boolean;

  // User data
  chapter: Chapter | null;
  role: Role | null;
  userChapterLink: UserChapterLink | null;

  // Auth methods
  signUp: (
    data: SignUpData,
  ) => Promise<{ error?: string; needsConfirmation?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

interface SignUpData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  schoolName: string;
  fraternityName: string;
  chapterCode: string;
  roleName: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [userChapterLink, setUserChapterLink] =
    useState<UserChapterLink | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile and related data
  const fetchUserData = async (userId: string) => {
    try {
      console.log("Fetching user data for:", userId);

      // Add timeout for individual fetch operations
      const fetchWithTimeout = async (
        promise: Promise<any>,
        timeoutMs: number = 5000,
      ) => {
        return Promise.race([
          promise,
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Fetch timeout")), timeoutMs),
          ),
        ]);
      };

      // Fetch user profile
      const { data: userData, error: userError } = await fetchWithTimeout(
        supabase.from("users").select("*").eq("id", userId).single(),
      );

      if (userError) {
        console.error("Error fetching user profile:", userError);
        // Clear user data on error
        setUser(null);
        setChapter(null);
        setRole(null);
        setUserChapterLink(null);
        setLoading(false);
        return;
      }

      console.log("User data fetched:", userData);
      setUser(userData);

      // Fetch user's chapter and role
      const { data: linkData, error: linkError } = await fetchWithTimeout(
        supabase
          .from("user_chapter_links")
          .select(
            `
            *,
            chapters(*),
            roles(*)
          `,
          )
          .eq("user_id", userId)
          .eq("is_active", true)
          .eq("is_primary", true)
          .single(),
      );

      if (linkError) {
        if (linkError.code !== "PGRST116") {
          console.error("Error fetching user chapter link:", linkError);
        }
        console.log(
          "No chapter link found, user can still access basic features",
        );
        // User might not have a chapter link yet, which is okay
        // Keep the user data but clear chapter/role data
        setChapter(null);
        setRole(null);
        setUserChapterLink(null);
        setLoading(false);
        return;
      }

      if (linkData) {
        console.log("Chapter link data fetched:", linkData);
        setUserChapterLink(linkData);
        setChapter(linkData.chapters);
        setRole(linkData.roles);
      }

      // All data fetched successfully
      setLoading(false);
    } catch (error) {
      console.error("Error fetching user data:", error);
      // Clear all data on unexpected error
      setUser(null);
      setChapter(null);
      setRole(null);
      setUserChapterLink(null);
      setLoading(false);
    }
  };

  // Sign up function
  const signUp = async (
    data: SignUpData,
  ): Promise<{ error?: string; needsConfirmation?: boolean }> => {
    try {
      setLoading(true);

      // 1. Create auth user with email confirmation enabled
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
            school_name: data.schoolName,
            fraternity_name: data.fraternityName,
            chapter_code: data.chapterCode,
            role_name: data.roleName,
          },
        },
      });

      if (authError) {
        // Handle specific OAuth configuration errors
        if (
          authError.message.includes(
            "OAuth authorization request does not exist",
          ) ||
          authError.message.includes(
            "Failed to fetch details for API authorization request",
          )
        ) {
          return {
            error:
              "Authentication configuration error. Please contact support or try again later. If you're the administrator, check your Supabase Auth settings.",
          };
        }
        return { error: authError.message };
      }
      if (!authData.user) return { error: "Failed to create user" };

      // Check if email confirmation is required (data.session will be null)
      const needsConfirmation = !authData.session;

      console.log("Signup result:", {
        hasSession: !!authData.session,
        hasUser: !!authData.user,
        emailConfirmed: authData.user?.email_confirmed_at,
        needsConfirmation,
      });

      // If email confirmation is required, don't create profile yet
      if (needsConfirmation) {
        console.log(
          "Email confirmation required - profile will be created after confirmation",
        );
        return { needsConfirmation: true };
      }

      // If no confirmation needed, create profile immediately
      console.log("No email confirmation needed - creating profile now");
      await createUserProfile(authData.user.id, data);
      return { needsConfirmation: false };
    } catch (error) {
      console.error("Signup error:", error);
      return { error: "An unexpected error occurred" };
    } finally {
      setLoading(false);
    }
  };

  // Helper function to create user profile and chapter links
  const createUserProfile = async (userId: string, data: SignUpData) => {
    // 1. Create user profile
    const { error: profileError } = await supabase.from("users").insert({
      id: userId,
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      tier: "free",
    });

    if (profileError) throw new Error(profileError.message);

    // 2. Find or create chapter
    let chapterId: string;
    const { data: existingChapter } = await supabase
      .from("chapters")
      .select("id")
      .eq("school_name", data.schoolName)
      .eq("fraternity_name", data.fraternityName)
      .eq("chapter_code", data.chapterCode)
      .single();

    if (existingChapter) {
      chapterId = existingChapter.id;
    } else {
      const { data: newChapter, error: chapterError } = await supabase
        .from("chapters")
        .insert({
          school_name: data.schoolName,
          fraternity_name: data.fraternityName,
          chapter_code: data.chapterCode,
        })
        .select("id")
        .single();

      if (chapterError) throw new Error(chapterError.message);
      chapterId = newChapter.id;
    }

    // 3. Find role
    const { data: roleData, error: roleError } = await supabase
      .from("roles")
      .select("id")
      .eq("name", data.roleName)
      .single();

    if (roleError) throw new Error(`Role '${data.roleName}' not found`);

    // 4. Create user-chapter link
    const { error: linkError } = await supabase
      .from("user_chapter_links")
      .insert({
        user_id: userId,
        chapter_id: chapterId,
        role_id: roleData.id,
        is_primary: true,
      });

    if (linkError) throw new Error(linkError.message);
  };

  // Sign in function
  const signIn = async (
    email: string,
    password: string,
  ): Promise<{ error?: string }> => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Handle specific OAuth configuration errors
        if (
          error.message.includes(
            "OAuth authorization request does not exist",
          ) ||
          error.message.includes(
            "Failed to fetch details for API authorization request",
          )
        ) {
          return {
            error:
              "Authentication configuration error. Please contact support or try again later. If you're the administrator, check your Supabase Auth settings.",
          };
        }
        // Check if it's an email confirmation error
        if (error.message.includes("Email not confirmed")) {
          return {
            error:
              "Please check your email and click the confirmation link before signing in.",
          };
        }
        return { error: error.message };
      }

      // If user signed in but doesn't have a profile yet (confirmed after signup)
      if (data.user && data.session) {
        const { data: existingUser } = await supabase
          .from("users")
          .select("id")
          .eq("id", data.user.id)
          .single();

        if (!existingUser) {
          // User confirmed email but profile wasn't created during signup
          // This can happen if they signed up and confirmed later
          console.log(
            "User confirmed but profile missing - will be created on next auth state change",
          );
        }
      }

      return {};
    } catch (error) {
      return { error: "An unexpected error occurred" };
    } finally {
      setLoading(false);
    }
  };

  // Sign out function
  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setSupabaseUser(null);
    setSession(null);
    setChapter(null);
    setRole(null);
    setUserChapterLink(null);
    setLoading(false);
  };

  // Refresh user data
  const refreshUserData = async () => {
    if (supabaseUser) {
      await fetchUserData(supabaseUser.id);
    }
  };

  // Initialize auth state
  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    // Add a timeout to prevent infinite loading
    const setLoadingTimeout = () => {
      timeoutId = setTimeout(() => {
        if (mounted) {
          console.warn(
            "Auth initialization timed out, falling back to login screen",
          );
          setLoading(false);
          setUser(null);
          setChapter(null);
          setRole(null);
          setUserChapterLink(null);
        }
      }, 10000); // 10 second timeout
    };

    // Get initial session
    const initializeAuth = async () => {
      try {
        setLoading(true);
        setLoadingTimeout();

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Error getting session:", error);
          if (mounted) {
            clearTimeout(timeoutId);
            setLoading(false);
          }
          return;
        }

        if (mounted) {
          setSession(session);
          setSupabaseUser(session?.user ?? null);

          if (session?.user) {
            // Fetch user data but don't set loading to false here
            // fetchUserData will handle setting loading to false
            try {
              await fetchUserData(session.user.id);
              clearTimeout(timeoutId);
            } catch (fetchError) {
              console.error("Error fetching user data:", fetchError);
              clearTimeout(timeoutId);
              setLoading(false);
            }
          } else {
            // No session, clear everything and stop loading
            clearTimeout(timeoutId);
            setUser(null);
            setChapter(null);
            setRole(null);
            setUserChapterLink(null);
            setLoading(false);
          }
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        if (mounted) {
          clearTimeout(timeoutId);
          setUser(null);
          setChapter(null);
          setRole(null);
          setUserChapterLink(null);
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.id);

      if (!mounted) return;

      setSession(session);
      setSupabaseUser(session?.user ?? null);

      if (session?.user) {
        // Check if this is a newly confirmed user who needs profile creation
        if (event === "SIGNED_IN" && session.user.email_confirmed_at) {
          const { data: existingUser } = await supabase
            .from("users")
            .select("id")
            .eq("id", session.user.id)
            .single();

          // If user doesn't have a profile yet, create it from metadata
          if (!existingUser && session.user.user_metadata) {
            try {
              console.log(
                "Creating profile for confirmed user:",
                session.user.id,
              );
              const metadata = session.user.user_metadata;
              await createUserProfile(session.user.id, {
                firstName: metadata.first_name || "",
                lastName: metadata.last_name || "",
                email: session.user.email || "",
                password: "", // Not needed for profile creation
                schoolName: metadata.school_name || "",
                fraternityName: metadata.fraternity_name || "",
                chapterCode: metadata.chapter_code || "",
                roleName: metadata.role_name || "Social Chair",
              });
              console.log("Profile created successfully for confirmed user");
            } catch (error) {
              console.error(
                "Error creating user profile after confirmation:",
                error,
              );
            }
          }
        }

        // User signed in, fetch their data
        await fetchUserData(session.user.id);
      } else {
        // User signed out, clear all user-related state
        setUser(null);
        setChapter(null);
        setRole(null);
        setUserChapterLink(null);
        setLoading(false);
      }
    });

    // Cleanup function
    return () => {
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    user,
    supabaseUser,
    session,
    loading,
    chapter,
    role,
    userChapterLink,
    signUp,
    signIn,
    signOut,
    refreshUserData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
