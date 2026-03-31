import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/AppLayout";
import Dashboard from "./pages/Dashboard";
import ExpenseSplitter from "./pages/ExpenseSplitter";
import TripTracker from "./pages/TripTracker";
import BudgetChecker from "./pages/BudgetChecker";
import SavingsGoal from "./pages/SavingsGoal";
import Subscriptions from "./pages/Subscriptions";
import ExpensePriorityScheduler from "./pages/ExpensePriorityScheduler";
import BudgetOptimizer from "./pages/BudgetOptimizer";
import FinancialAdvisor from "./pages/FinancialAdvisor";
import FinancialHealth from "./pages/FinancialHealth";
import MeansEndPlanner from "./pages/MeansEndPlanner";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/splitter" element={<ExpenseSplitter />} />
            <Route path="/trips" element={<TripTracker />} />
            <Route path="/budget" element={<BudgetChecker />} />
            <Route path="/savings" element={<SavingsGoal />} />
            <Route path="/subscriptions" element={<Subscriptions />} />
            <Route path="/optimizer" element={<ExpensePriorityScheduler />} />
            <Route path="/knapsack" element={<BudgetOptimizer />} />
            <Route path="/advisor" element={<FinancialAdvisor />} />
            <Route path="/health" element={<FinancialHealth />} />
            <Route path="/means-end" element={<MeansEndPlanner />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
