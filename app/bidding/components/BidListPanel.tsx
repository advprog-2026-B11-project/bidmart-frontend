import { Bid } from "../lib/types";
import { formatCurrency, formatDate, shortId } from "../lib/format";
import styles from "../bidding.module.css";
import { Card } from "./Card";

interface BidListPanelProps {
  bids: Bid[];
  listingId: string;
  loading: boolean;
}

export function BidListPanel({ bids, listingId, loading }: BidListPanelProps) {
  return (
    <Card title="Riwayat Bid per Listing" subtitle="Endpoint: GET /api/bids/listing/{listingId}">
      {!listingId ? <p className={styles.mutedText}>Pilih listing untuk melihat riwayat bid.</p> : null}
      {loading ? <p className={styles.mutedText}>Memuat riwayat bid...</p> : null}

      {!loading && listingId && bids.length === 0 ? (
        <p className={styles.mutedText}>Belum ada bid di listing ini.</p>
      ) : null}

      {!loading && bids.length > 0 ? (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Bid</th>
                <th>Buyer</th>
                <th>Waktu</th>
              </tr>
            </thead>
            <tbody>
              {bids.map((bid, index) => (
                <tr key={bid.bidId ?? `${bid.listingId}-${bid.buyerId}-${index}`}>
                  <td>{formatCurrency(bid.bidAmount)}</td>
                  <td className={styles.monoText}>{shortId(bid.buyerId)}</td>
                  <td>{formatDate(bid.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </Card>
  );
}
