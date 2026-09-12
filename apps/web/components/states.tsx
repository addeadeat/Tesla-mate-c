import { Icon } from "./icons";

export function LoadingState() {
  return (
    <section className="panel state-panel" role="status" aria-live="polite">
      <span className="spinner" />
      <h2>正在读取记录</h2>
      <p>稍等片刻，数据马上就好。</p>
    </section>
  );
}
export function EmptyState({
  title = "还没有车辆",
  description = "连接数据后，车辆信息会显示在这里。",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <section className="panel state-panel">
      <span className="state-icon">
        <Icon name="drive" />
      </span>
      <h2>{title}</h2>
      <p>{description}</p>
    </section>
  );
}
export function ErrorState({
  message,
  retry,
  disabled,
}: {
  message: string;
  retry: () => void;
  disabled: boolean;
}) {
  return (
    <section className="error-panel" role="alert">
      <h2>暂时没能读取数据</h2>
      <p>{message}</p>
      <button className="button" onClick={retry} disabled={disabled}>
        {disabled ? "稍后可重试" : "重新读取"}
      </button>
    </section>
  );
}
