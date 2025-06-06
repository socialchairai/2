import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { TIERS } from "@/data/mockData";
import { CheckCircle, Users, Calendar, DollarSign } from "lucide-react";

interface OnboardingScreenProps {
  onComplete: () => void;
}

export default function OnboardingScreen({
  onComplete,
}: OnboardingScreenProps) {
  const { user, chapter, role } = useAuth();

  if (!user || !chapter || !role) {
    return null;
  }

  const currentTier = TIERS[user.tier as keyof typeof TIERS];

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl mx-auto bg-white">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl">
            Welcome to Chi Psi Social Assistant!
          </CardTitle>
          <CardDescription>
            Your account has been set up successfully. Here's your chapter
            information:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* User Info */}
          <div className="text-center">
            <h3 className="text-lg font-semibold">
              {user.first_name} {user.last_name}
            </h3>
            <p className="text-muted-foreground">{user.email}</p>
          </div>

          <Separator />

          {/* Chapter Info */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-500" />
                <h4 className="font-medium">Chapter Details</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">School:</span>{" "}
                  {chapter.school_name}
                </div>
                <div>
                  <span className="font-medium">Fraternity:</span>{" "}
                  {chapter.fraternity_name}
                </div>
                <div>
                  <span className="font-medium">Chapter:</span>{" "}
                  {chapter.chapter_code}
                </div>
                <div>
                  <span className="font-medium">Your Role:</span>
                  <Badge variant="secondary" className="ml-2">
                    {role.name}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-green-500" />
                <h4 className="font-medium">Current Plan</h4>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">{currentTier.name}</Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-2">Included features:</p>
                  <ul className="space-y-1">
                    {currentTier.features.map((feature, index) => (
                      <li key={index} className="flex items-center space-x-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Role Permissions */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-purple-500" />
              <h4 className="font-medium">Your Permissions</h4>
            </div>
            <div className="text-sm text-muted-foreground">
              <p>{role.description}</p>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">What's Next?</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Explore your dashboard to see upcoming events</li>
              <li>• Create your first event or manage existing ones</li>
              <li>• Invite other chapter members to join the platform</li>
              <li>• Set up your chapter's budget tracking (Pro feature)</li>
            </ul>
          </div>

          <Button onClick={onComplete} className="w-full" size="lg">
            Get Started
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
