import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Menu,
  User,
  Calendar,
  CheckSquare,
  DollarSign,
  Settings,
  LogOut,
  Bell,
  Handshake,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Toaster } from "@/components/ui/toaster";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const { user, chapter, role, signOut } = useAuth();

  if (!user || !chapter || !role) {
    return null;
  }

  // Mock data for organizations - in real implementation this would come from API
  const organizations = [
    {
      id: chapter.id,
      name: `${chapter.fraternity_name} ${chapter.chapter_code}`,
    },
  ];
  const [selectedOrg] = useState(organizations[0]);

  const navigationItems = [
    { name: "Dashboard", icon: <Calendar className="h-5 w-5" />, href: "/" },
    {
      name: "Events",
      icon: <Calendar className="h-5 w-5" />,
      href: "/events",
    },
    {
      name: "Budget",
      icon: <DollarSign className="h-5 w-5" />,
      href: "/budget",
    },
    {
      name: "Tasks",
      icon: <CheckSquare className="h-5 w-5" />,
      href: "/tasks",
    },
    {
      name: "Sponsorships",
      icon: <Handshake className="h-5 w-5" />,
      href: "/sponsorships",
    },
  ];

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-card border-r border-border">
        <div className="p-4 border-b border-border">
          <h2 className="text-xl font-bold">Social Chair Assistant</h2>
        </div>

        <div className="p-4 border-b border-border">
          <div className="w-full p-2 border rounded-md bg-background">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{selectedOrg.name}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {chapter.school_name}
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navigationItems.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className="flex items-center p-2 rounded-md hover:bg-accent text-foreground hover:text-accent-foreground transition-colors"
            >
              {item.icon}
              <span className="ml-3">{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center">
            <Avatar>
              <AvatarImage src={user.avatar_url} alt={user.first_name} />
              <AvatarFallback>
                {user.first_name.charAt(0)}
                {user.last_name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="ml-3">
              <p className="text-sm font-medium">
                {user.first_name} {user.last_name}
              </p>
              <p className="text-xs text-muted-foreground">{role.name}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Navigation */}
      <Sheet open={isMobileNavOpen} onOpenChange={setIsMobileNavOpen}>
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4">
            <div className="flex items-center">
              <SheetTrigger asChild className="lg:hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMobileNavOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <h1 className="text-xl font-semibold ml-2 lg:ml-0">Dashboard</h1>
            </div>

            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar>
                      <AvatarImage
                        src={user.avatar_url}
                        alt={user.first_name}
                      />
                      <AvatarFallback>
                        {user.first_name.charAt(0)}
                        {user.last_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-auto p-4 sm:p-6 bg-background">
            {children}
          </main>
          <Toaster />
        </div>

        <SheetContent side="left" className="w-64 p-0">
          <div className="p-4 border-b border-border">
            <h2 className="text-xl font-bold">Social Chair Assistant</h2>
          </div>

          <div className="p-4 border-b border-border">
            <div className="w-full p-2 border rounded-md bg-background">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{selectedOrg.name}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {chapter.school_name}
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="flex items-center p-2 rounded-md hover:bg-accent text-foreground hover:text-accent-foreground transition-colors"
                onClick={() => setIsMobileNavOpen(false)}
              >
                {item.icon}
                <span className="ml-3">{item.name}</span>
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-border">
            <div className="flex items-center">
              <Avatar>
                <AvatarImage src={user.avatar_url} alt={user.first_name} />
                <AvatarFallback>
                  {user.first_name.charAt(0)}
                  {user.last_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="ml-3">
                <p className="text-sm font-medium">
                  {user.first_name} {user.last_name}
                </p>
                <p className="text-xs text-muted-foreground">{role.name}</p>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default DashboardLayout;
