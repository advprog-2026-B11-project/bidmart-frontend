import styles from "../bidding.module.css";
import { ApiStatus } from "../lib/types";

interface StatusAlertProps {
  status: ApiStatus | null;
}

export function StatusAlert({ status }: StatusAlertProps) {
  if (!status) {
    return null;
  }

  const classNameByKind: Record<ApiStatus["kind"], string> = {
    success: styles.alertSuccess,
    error: styles.alertError,
    info: styles.alertInfo,
  };

  return (
    <div className={`${styles.alert} ${classNameByKind[status.kind]}`} role="status" aria-live="polite">
      {status.message}
    </div>
  );
}
