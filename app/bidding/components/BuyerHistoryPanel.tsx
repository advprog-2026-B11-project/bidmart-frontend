import { Bid } from "../lib/types";
import { formatCurrency, formatDate, shortId } from "../lib/format";
import styles from "../bidding.module.css";
import { Card } from "./Card";

interface BuyerHistoryPanelProps {
  bids: Bid[];
  buyerId: string;
  loading: boolean;
}

export function BuyerHistoryPanel({ bids, buyerId, loading }: BuyerHistoryPanelProps) {
  return (
    <Card title="Riwayat Buyer" subtitle="Endpoint: GET /api/bids/buyer/{buyerId}">
      {!buyerId ? <p className={styles.mutedText}>Isi buyer ID untuk melihat histori bid.</p> : null}
      {loading ? <p className={styles.mutedText}>Memuat histori buyer...</p> : null}

      {!loading && buyerId && bids.length === 0 ? <p className={styles.mutedText}>Buyer belum pernah melakukan bid.</p> : null}

      {!loading && bids.length > 0 ? (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Listing</th>
                <th>Bid</th>
                <th>Waktu</th>
              </tr>
            </thead>
            <tbody>
              {bids.map((bid, index) => (
                <tr key={bid.bidId ?? `${bid.listingId}-${index}`}>
                  <td className={styles.monoText}>{shortId(bid.listingId)}</td>
                  <td>{formatCurrency(bid.bidAmount)}</td>
                  <td>{formatDate(bid.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {buyerId ? <p className={styles.helperText}>Buyer aktif: <span className={styles.monoText}>{shortId(buyerId)}</span></p> : null}
    </Card>
  );
}
