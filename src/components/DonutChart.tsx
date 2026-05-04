import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { fmtPercentNumber, fmtNumber } from "@/lib/format";

interface DonutDatum {
  name: string;
  value: number;
  rawCount?: number;
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null;
  const item = payload[0];
  const { name, value } = item.payload;
  const total = item.payload.__total ?? payload.reduce((s: number, p: any) => s + (p.payload?.value ?? 0), 0);
  const pct = total > 0 ? value / total : 0;
  return (
    <div className="rounded border bg-background p-3 text-xs shadow">
      <div className="font-medium mb-1">{name}</div>
      <div className="text-muted-foreground">{fmtPercentNumber(pct * 100)} ({fmtNumber(value)} of {fmtNumber(total)})</div>
    </div>
  );
}

export default function DonutChart({ data, title, colors = ["hsl(217,91%,50%)", "hsl(160,60%,45%)", "hsl(35,92%,55%)"], noCard = false, showCenterLabel = false, centerLabel, showLegend = false }: { data: DonutDatum[]; title?: string; colors?: string[]; noCard?: boolean; showCenterLabel?: boolean; centerLabel?: string; showLegend?: boolean }) {
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);
  const total = data.reduce((s, d) => s + (d.value ?? 0), 0);
  // attach total to each payload for tooltip convenience
  const annotated = data.map((d) => ({ ...d, __total: total }));
  const content = (
    <div style={{ width: "100%", display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '100%', height: 240, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={annotated}
              dataKey="value"
              nameKey="name"
              innerRadius="72%"
              outerRadius="90%"
              paddingAngle={0}
              stroke="none"
              labelLine={false}
              cx="50%"
              cy="50%"
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {annotated.map((_, i) => (
                <Cell key={i} fill={colors[i % colors.length]} />
              ))}
            </Pie>
            {!showCenterLabel && <Tooltip content={<CustomTooltip />} offset={45} />}
          </PieChart>
        </ResponsiveContainer>

        {showCenterLabel && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            {activeIndex !== null ? (
              <div className="text-center animate-in fade-in zoom-in-95 duration-200">
                <div className="text-xs font-medium text-muted-foreground">{annotated[activeIndex].name}</div>
                <div className="text-xl font-bold" style={{ color: colors[activeIndex % colors.length] }}>
                  {total > 0 ? fmtPercentNumber((annotated[activeIndex].value / total) * 100) : fmtPercentNumber(0)}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{fmtNumber(annotated[activeIndex].value)}</div>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-lg font-semibold">{centerLabel ? centerLabel : (total > 0 ? fmtPercentNumber((annotated[0].value / total) * 100) : fmtPercentNumber(0))}</div>
                <div className="text-xs text-muted-foreground">of total</div>
              </div>
            )}
          </div>
        )}
      </div>

      {showLegend && (
        <div style={{ width: '100%', marginTop: 12, display: 'flex', justifyContent: 'center' }}>
          <div style={{ maxWidth: 420 }}>
            <ul className="text-xs space-y-1">
              {annotated.map((d, i) => (
                <li key={d.name} className="flex items-center gap-2">
                  <span style={{ width: 10, height: 10, background: colors[i % colors.length], display: 'inline-block', borderRadius: 2 }} />
                  <span className="text-xs">{d.name}: {total > 0 ? fmtPercentNumber((d.value / total) * 100) : fmtPercentNumber(0)} ({fmtNumber(d.rawCount ?? d.value)})</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );

  if (noCard) {
    return content;
  }

  return (
    <Card>
      {title && (
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        {content}
      </CardContent>
    </Card>
  );
}
