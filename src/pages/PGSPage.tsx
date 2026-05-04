import DashboardLayout from "@/components/DashboardLayout";
import OORCPGSDashboard from "@/components/OORCPGSDashboard";

export default function PGSPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-heading font-bold text-sky-900 dark:text-sky-100">PGS Scorecard</h1>
        <p className="text-muted-foreground">Performance Governance System</p>
        <OORCPGSDashboard divisionCode={''} divisionId={'company'} hideTabs initialTab="pgs" />
      </div>
    </DashboardLayout>
  );
}
