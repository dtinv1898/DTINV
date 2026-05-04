import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import UpdatePasswordPage from "./pages/UpdatePasswordPage";
import OORCPage from "./pages/OORCPage";
import PGSPage from "./pages/PGSPage";
import UploadsList from "./pages/UploadsList";
import DivisionPage from "./pages/DivisionPage";
import PersonPage from "./pages/PersonPage";
import FormZPage from "./pages/FormZPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/update-password" element={<UpdatePasswordPage />} />
            <Route path="/" element={<OORCPage />} />
            <Route path="/oorc" element={<OORCPage />} />
            <Route path="/pgs" element={<PGSPage />} />
            <Route path="/division/:code" element={<DivisionPage />} />
            <Route path="/person/:id" element={<PersonPage />} />
            <Route path="/person/:id/form/:form" element={<FormZPage />} />

            {/* Protected Routes */}
            <Route path="/uploads" element={<ProtectedRoute requireSuperAdmin><UploadsList /></ProtectedRoute>} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
