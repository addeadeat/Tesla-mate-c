"use client";
import { formatDate, formatNumber, type TeslaMateClient } from "@z/api-client";
import { useVehicleData } from "@/lib/use-vehicle-data";
import { LoadingState, EmptyState, ErrorState } from "@/components/states";
import { PageHeading } from "@/components/page-heading";
const read = (api: TeslaMateClient, id: number, signal: AbortSignal) =>
  api.drives(id, signal);

export default function DrivesPage() {
  const {
    data,
    car,
    loading,
    error,
    refreshing,
    cooldown,
    refresh,
    fetchedAt,
  } = useVehicleData(read);
  return (
    <>
      <PageHeading
        eyebrow="ON THE ROAD"
        title="行程记录"
        subtitle="每一段路，留下清晰的足迹。"
        fetchedAt={fetchedAt}
        refresh={refresh}
        disabled={loading || refreshing || cooldown}
      />
      {error && (
        <ErrorState
          message={error}
          retry={refresh}
          disabled={cooldown || refreshing}
        />
      )}
      {loading ? (
        <LoadingState />
      ) : !car && !error ? (
        <EmptyState />
      ) : data?.length === 0 ? (
        <EmptyState
          title="还没有行程记录"
          description="完成一次出行后，记录会显示在这里。"
        />
      ) : (
        data && (
          <>
            <div className="list-meta">
              <span>{car?.name}</span>
              <span>最近 {data.length} 条 · 最多 20 条</span>
            </div>
            {error && <p className="stale-note">以下为上次成功读取的数据。</p>}
            <ol className="records">
              {data.map((d) => (
                <li className="panel record" key={d.id}>
                  <div className="record-head">
                    <time>{formatDate(d.startedAt)}</time>
                    <span>{formatNumber(d.durationMin)} 分钟</span>
                  </div>
                  <div className="route">
                    <p className="route-from">{d.from ?? "起点未知"}</p>
                    <p className="route-to">{d.to ?? "终点未知"}</p>
                  </div>
                  <div className="record-metrics">
                    <div>
                      <span>行驶距离</span>
                      <strong>
                        {formatNumber(d.distanceKm, 1)}
                        <small> km</small>
                      </strong>
                    </div>
                    <div>
                      <span>平均电耗</span>
                      <strong>
                        {formatNumber(d.consumptionWhKm)}
                        <small> Wh/km</small>
                      </strong>
                    </div>
                  </div>
                  {d.consumptionWhKm === null && (
                    <p className="record-footnote">暂无可用电耗数据</p>
                  )}
                </li>
              ))}
            </ol>
            <p className="list-end">最近的旅程，都在这里。</p>
          </>
        )
      )}
    </>
  );
}
