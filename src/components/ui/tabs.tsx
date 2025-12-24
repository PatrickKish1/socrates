"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

interface TabsProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root> {
  children?: React.ReactNode;
  className?: string;
}

const Tabs = React.forwardRef<React.ElementRef<typeof TabsPrimitive.Root>, TabsProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <TabsPrimitive.Root
        ref={ref}
        data-slot="tabs"
        className={cn("flex flex-col gap-2", className)}
        {...props}
      >
        {children}
      </TabsPrimitive.Root>
    );
  }
);
Tabs.displayName = "Tabs";

interface TabsListProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> {
  children?: React.ReactNode;
  className?: string;
}

const TabsList = React.forwardRef<React.ElementRef<typeof TabsPrimitive.List>, TabsListProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <TabsPrimitive.List
        ref={ref}
        data-slot="tabs-list"
        className={cn(
          "bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px]",
          className
        )}
        {...props}
      >
        {children}
      </TabsPrimitive.List>
    );
  }
);
TabsList.displayName = "TabsList";

interface TabsTriggerProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> {
  children?: React.ReactNode;
  className?: string;
}

const TabsTrigger = React.forwardRef<React.ElementRef<typeof TabsPrimitive.Trigger>, TabsTriggerProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <TabsPrimitive.Trigger
        ref={ref}
        data-slot="tabs-trigger"
        className={cn(
          "data-[state=active]:bg-background dark:data-[state=active]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 text-foreground dark:text-muted-foreground inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
          className
        )}
        {...props}
      >
        {children}
      </TabsPrimitive.Trigger>
    );
  }
);
TabsTrigger.displayName = "TabsTrigger";

interface TabsContentProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content> {
  children?: React.ReactNode;
  className?: string;
}

const TabsContent = React.forwardRef<React.ElementRef<typeof TabsPrimitive.Content>, TabsContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <TabsPrimitive.Content
        ref={ref}
        data-slot="tabs-content"
        className={cn("flex-1 outline-none", className)}
        {...props}
      >
        {children}
      </TabsPrimitive.Content>
    );
  }
);
TabsContent.displayName = "TabsContent";

export { Tabs, TabsList, TabsTrigger, TabsContent }
