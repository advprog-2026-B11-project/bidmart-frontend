import { Bid } from "../lib/types";
import { formatCurrency, formatDate, shortId } from "../lib/format";
import styles from "../bidding.module.css";
import { Card } from "./Card";

interface HighestBidPanelProps {
  highestBid: Bid | null;
  loading: boolean;
}

export function HighestBidPanel({ highestBid, loading }: HighestBidPanelProps) {
  return (
    <Card title="Highest Bid" subtitle="Endpoint: GET /api/bids/listing/{listingId}/highest">
      {loading ? <p className={styles.mutedText}>Memuat data highest bid...</p> : null}

      {!loading && !highestBid ? <p className={styles.mutedText}>Belum ada bid untuk listing ini.</p> : null}

      {!loading && highestBid ? (
        <div className={styles.detailList}>
          <div>
            <span>Nominal</span>
            <strong>{formatCurrency(highestBid.bidAmount)}</strong>
          </div>
          <div>
            <span>Buyer</span>
            <strong className={styles.monoText}>{shortId(highestBid.buyerId)}</strong>
          </div>
          <div>
            <span>Waktu</span>
            <strong>{formatDate(highestBid.createdAt)}</strong>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
