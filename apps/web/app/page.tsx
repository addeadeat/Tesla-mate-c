"use client";
import Link from "next/link";
import {
  formatDate,
  formatNumber,
  pollDelay,
  type StatusView,
  type TeslaMateClient,
} from "@z/api-client";
import { useVehicleData } from "@/lib/use-vehicle-data";
import { LoadingState, EmptyState, ErrorState } from "@/components/states";
import { PageHeading } from "@/components/page-heading";
import { Icon } from "@/components/icons";

const read = (api: TeslaMateClient, id: number, signal: AbortSignal) =>
  api.status(id, signal);
const interval = (data: StatusView | null, failures: number) =>
  pollDelay(data?.state ?? null, failures);
const labels: Record<string, string> = {
  online: "在线",
  asleep: "休眠中",
  charging: "充电中",
  driving: "行驶中",
  offline: "离线",
  suspended: "暂停记录",
};

export default function HomePage() {
  const result = useVehicleData(read, interval);
  const {
    data,
    car,
    loading,
    error,
    refreshing,
    cooldown,
    refresh,
    fetchedAt,
  } = result;
  return (
    <>
      <PageHeading
        eyebrow="YOUR EVERYDAY, ELECTRIC"
        title="车辆近况"
        subtitle="看看电量，然后安心出发。"
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
      ) : (
        data && (
          <>
            <section
              className={`battery-card ${error ? "stale" : ""}`}
              aria-label="当前电量"
            >
              <div className="battery-top">
                <div>
                  <p className="muted-on-dark">{car?.model ?? "我的车辆"}</p>
                  <h2>{car?.name}</h2>
                </div>
                <span className="state-pill">
                  <Icon name={data.state === "charging" ? "charge" : "moon"} />
                  {labels[data.state ?? ""] ?? "状态未知"}
                </span>
              </div>
              <p className="battery-value">
                {formatNumber(data.batteryLevel)}
                <span>%</span>
              </p>
              <p className="muted-on-dark">剩余电量</p>
              <div
                className="battery-track"
                role="meter"
                aria-label="剩余电量"
                aria-valuenow={data.batteryLevel ?? undefined}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuetext={
                  data.batteryLevel === null
                    ? "暂无数据"
                    : `${data.batteryLevel}%`
                }
              >
                <span style={{ width: `${data.batteryLevel ?? 0}%` }} />
              </div>
              <div className="battery-bottom">
                <span>预估续航</span>
                <strong>
                  {formatNumber(data.estimatedRangeKm)}
                  <small> km</small>
                </strong>
              </div>
              {data.batteryLevel === null && (
                <p className="missing-dark">暂无电量数据</p>
              )}
            </section>
            <section className="metric-grid" aria-label="车辆信息">
              <article className="panel">
                <span className="metric-label">连接充电枪</span>
                <strong className="metric-value">
                  {data.pluggedIn === null
                    ? "暂无数据"
                    : data.pluggedIn
                      ? "已连接"
                      : "未连接"}
                </strong>
                <span className="metric-note">
                  {data.pluggedIn === true
                    ? "已插枪不代表正在充电"
                    : "充电连接状态"}
                </span>
              </article>
              <article className="panel">
                <span className="metric-label">车辆状态</span>
                <strong className="metric-value">
                  {labels[data.state ?? ""] ?? "未知"}
                </strong>
                <span className="metric-note">{data.state ?? "暂无数据"}</span>
              </article>
            </section>
            <div className="quiet-note">
              <Icon name="moon" />
              <p>
                {data.state === "asleep"
                  ? "让车安心休息。休眠时每 15 分钟读取一次记录。"
                  : "页面读取已记录的数据，不向车辆发送唤醒请求。"}
                {data.stateSince && (
                  <span>状态开始于 {formatDate(data.stateSince)}</span>
                )}
              </p>
            </div>
            {error && <p className="stale-note">以上为上次成功读取的数据。</p>}
            <h2 className="section-title">每一次出发，都有记录</h2>
            <Link className="panel shortcut" href="/drives">
              <span className="shortcut-icon">
                <Icon name="drive" />
              </span>
              <div>
                <strong>最近行程</strong>
                <p>路程、时长与电耗</p>
              </div>
              <Icon name="arrow" />
            </Link>
            <Link className="panel shortcut" href="/charges">
              <span className="shortcut-icon">
                <Icon name="charge" />
              </span>
              <div>
                <strong>最近充电</strong>
                <p>补充的电量，一眼明了</p>
              </div>
              <Icon name="arrow" />
            </Link>
          </>
        )
      )}
    </>
  );
}
