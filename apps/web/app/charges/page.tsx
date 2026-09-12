"use client";
import { formatDate, formatNumber, type TeslaMateClient } from "@z/api-client";
import { useVehicleData } from "@/lib/use-vehicle-data";
import { LoadingState, EmptyState, ErrorState } from "@/components/states";
import { PageHeading } from "@/components/page-heading";
import { Icon } from "@/components/icons";
const read = (api: TeslaMateClient, id: number, signal: AbortSignal) =>
  api.charges(id, signal);

export default function ChargesPage() {
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
        eyebrow="READY FOR THE NEXT"
        title="充电记录"
        subtitle="补足电量，准备下一次出发。"
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
          title="还没有充电记录"
          description="完成一次充电后，补能记录会显示在这里。"
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
              {data.map((c) => (
                <li className="panel record" key={c.id}>
                  <div className="record-head">
                    <time>{formatDate(c.startedAt)}</time>
                    <span>{formatNumber(c.durationMin)} 分钟</span>
                  </div>
                  <div className="charge-location">
                    <span className="shortcut-icon">
                      <Icon name="charge" />
                    </span>
                    <h2>{c.location ?? "地点未知"}</h2>
                  </div>
                  <div className="charge-levels">
                    <span>{formatNumber(c.startBattery)}%</span>
                    <div className="charge-line">
                      <span
                        style={{
                          width: `${Math.min(100, Math.max(0, c.endBattery ?? 0))}%`,
                        }}
                      />
                    </div>
                    <strong>{formatNumber(c.endBattery)}%</strong>
                  </div>
                  <div className="charge-energy">
                    <span>补充电量</span>
                    <strong>
                      +{formatNumber(c.energyAddedKWh, 1)}
                      <small> kWh</small>
                    </strong>
                  </div>
                </li>
              ))}
            </ol>
            <p className="list-end">电量为充入电池的记录，不等于电表用电。</p>
          </>
        )
      )}
    </>
  );
}
