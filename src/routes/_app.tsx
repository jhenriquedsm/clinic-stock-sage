import { createFileRoute, Outlet, Navigate } from "@tanstack/react-router";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_app")({ component: AppLayout });

function AppLayout() {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Carregando…</div>;
  if (!user) return <Navigate to="/login" />;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <SidebarInset className="flex-1">
          <header className="sticky top-0 z-10 flex h-[69px] items-center gap-2 border-b bg-background/90 px-5 backdrop-blur">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <div className="h-4 w-px bg-border" />
            <span className="text-xs font-medium text-muted-foreground">Laboratório</span>
          </header>
          <main className="flex-1 p-7">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
