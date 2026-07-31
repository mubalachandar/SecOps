import React, { useState } from 'react';
import SectionHeader from '../components/ui/SectionHeader';
import AlertTrendChart from '../components/dashboard/AlertTrendChart';
import SeverityChart from '../components/dashboard/SeverityChart';
import AttackVectorsChart from '../components/analytics/AttackVectorsChart';
import GeographicChart from '../components/analytics/GeographicChart';
import MTTRCard from '../components/analytics/MTTRCard';
import TopIPsTable from '../components/analytics/TopIPsTable';
import {
  useAlertTrend, useSeverityDistribution, useAttackVectors,
  useMTTR, useGeographicDistribution, useTopSourceIPs
} from '../hooks/useAnalytics';

export default function AnalyticsPage() {
  const [trendDays, setTrendDays] = useState(7);
  const [mttrDays, setMttrDays] = useState(30);

  const { data: trendData, isLoading: trendLoading } = useAlertTrend(trendDays);
  const { data: severityData, isLoading: severityLoading } = useSeverityDistribution();
  const { data: attackVectors, isLoading: vectorsLoading } = useAttackVectors();
  const { data: topIPs, isLoading: ipsLoading } = useTopSourceIPs(10);
  const { data: mttrData, isLoading: mttrLoading } = useMTTR(mttrDays);
  const { data: geoData, isLoading: geoLoading } = useGeographicDistribution();

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Analytics"
        subtitle="Security metrics and threat intelligence overview"
        level="page"
      />
      {/* Row 1: Alert Trend */}
      <AlertTrendChart
        data={trendData?.trend || []}
        isLoading={trendLoading}
        days={trendDays}
        onDaysChange={setTrendDays}
      />
      {/* Row 2: MTTR + Attack Vectors */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1">
          <MTTRCard mttr={mttrData?.mttr || null} isLoading={mttrLoading} />
        </div>
        <div className="lg:col-span-2">
          <AttackVectorsChart data={attackVectors?.attackVectors || []} isLoading={vectorsLoading} />
        </div>
      </div>
      {/* Row 3: Severity + Geographic */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1">
          <SeverityChart data={severityData?.distribution || []} isLoading={severityLoading} />
        </div>
        <div className="lg:col-span-2">
          <GeographicChart data={geoData?.regions || []} isLoading={geoLoading} />
        </div>
      </div>
      {/* Row 4: Top IPs */}
      <TopIPsTable ips={topIPs?.topIPs || []} isLoading={ipsLoading} />
    </div>
  );
}
