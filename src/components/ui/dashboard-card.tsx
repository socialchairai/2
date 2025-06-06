import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DashboardCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  children: React.ReactNode;
  maxHeight?: string;
  minWidth?: string;
  headerAction?: React.ReactNode;
}

const DashboardCard = React.forwardRef<HTMLDivElement, DashboardCardProps>(
  (
    {
      className,
      title,
      description,
      children,
      maxHeight = "h-full",
      minWidth = "min-w-0",
      headerAction,
      ...props
    },
    ref,
  ) => {
    return (
      <Card
        ref={ref}
        className={cn(
          "bg-white shadow-sm border border-border",
          maxHeight,
          minWidth,
          className,
        )}
        {...props}
      >
        {(title || headerAction) && (
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              {title && (
                <CardTitle className="text-lg font-semibold">{title}</CardTitle>
              )}
              {description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {description}
                </p>
              )}
            </div>
            {headerAction && <div>{headerAction}</div>}
          </CardHeader>
        )}
        <CardContent className={cn(title || headerAction ? "pt-0" : "")}>
          {children}
        </CardContent>
      </Card>
    );
  },
);

DashboardCard.displayName = "DashboardCard";

export { DashboardCard };
