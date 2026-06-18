import PageHeader from "../components/PageHeader";
import LogsTable from "../components/LogsTable";

export default function LogsPage() {
  return (
    <div className="page">
      <PageHeader
        title="Traffic Logs"
        description="Paginated history of analyzed network flows."
      />
      <LogsTable />
    </div>
  );
}
