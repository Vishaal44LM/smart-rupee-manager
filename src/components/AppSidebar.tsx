import {
  LayoutDashboard,
  Scissors,
  Plane,
  BarChart3,
  Target,
  Tv,
  Lightbulb,
  Sparkles,
  Brain,
  Activity,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Expense Splitter", url: "/splitter", icon: Scissors },
  { title: "Trip Tracker", url: "/trips", icon: Plane },
  { title: "Budget Checker", url: "/budget", icon: BarChart3 },
  { title: "Savings Goal", url: "/savings", icon: Target },
  { title: "Subscriptions", url: "/subscriptions", icon: Tv },
  { title: "Priority Scheduler", url: "/optimizer", icon: Lightbulb },
  { title: "Budget Optimizer", url: "/knapsack", icon: Sparkles },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="pt-4">
        {!collapsed && (
          <div className="px-4 pb-4 mb-2 border-b border-sidebar-border">
            <h2 className="text-lg font-bold text-sidebar-primary-foreground tracking-tight">
              💰 Smart Finance
            </h2>
          </div>
        )}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="hover:bg-sidebar-accent/60"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-semibold"
                    >
                      <item.icon className="mr-2 h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
