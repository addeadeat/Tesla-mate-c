import { formatDate } from "@z/api-client";
import { Icon } from "./icons";
export function PageHeading({
  eyebrow,
  title,
  subtitle,
  fetchedAt,
  refresh,
  disabled,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  fetchedAt: string | null;
  refresh: () => void;
  disabled: boolean;
}) {
  return (
    <header className="page-heading">
      <p className="eyebrow">{eyebrow}</p>
      <div className="heading-row">
        <h1>{title}</h1>
        <button
          className="icon-button"
          aria-label="刷新数据"
          title="刷新数据"
          onClick={refresh}
          disabled={disabled}
        >
          <Icon name="refresh" />
        </button>
      </div>
      <p>{subtitle}</p>
      {fetchedAt && (
        <p className="timestamp">
          读取于 {formatDate(fetchedAt, true)} · 香港时间
        </p>
      )}
    </header>
  );
}
