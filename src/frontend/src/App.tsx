import { Toaster } from "@/components/ui/sonner";
import { useState } from "react";
import AdminPage from "./pages/AdminPage";
import HomePage from "./pages/HomePage";

export type Page = "home" | "admin";

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("home");

  return (
    <>
      <Toaster richColors position="top-right" />
      {currentPage === "home" && (
        <HomePage onNavigateAdmin={() => setCurrentPage("admin")} />
      )}
      {currentPage === "admin" && (
        <AdminPage onNavigateHome={() => setCurrentPage("home")} />
      )}
    </>
  );
}
