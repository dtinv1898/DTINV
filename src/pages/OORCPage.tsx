import DashboardLayout from "@/components/DashboardLayout";
import OORCPGSDashboard from "@/components/OORCPGSDashboard";

export default function OORCPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-heading font-bold text-sky-900 dark:text-sky-100">OORC Performance</h1>
        <p className="text-muted-foreground">Organizational Outcomes and Report Cards</p>
        <OORCPGSDashboard divisionCode={''} divisionId={'company'} hideTabs initialTab="oorc" />
      </div>
    </DashboardLayout>
  );
}
