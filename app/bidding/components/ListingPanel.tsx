import { Listing } from "../lib/types";
import { formatCurrency, shortId } from "../lib/format";
import styles from "../bidding.module.css";
import { Card } from "./Card";

interface ListingPanelProps {
  listings: Listing[];
  selectedListing: Listing | null;
  selectedListingId: string;
  buyerId: string;
  loadingListings: boolean;
  refreshingListing: boolean;
  refreshingBuyer: boolean;
  creatingMock: boolean;
  onListingIdChange: (value: string) => void;
  onBuyerIdChange: (value: string) => void;
  onRefreshListings: () => void;
  onRefreshListing: () => void;
  onRefreshBuyer: () => void;
  onCreateMockListing: () => void;
}

export function ListingPanel({
  listings,
  selectedListing,
  selectedListingId,
  buyerId,
  loadingListings,
  refreshingListing,
  refreshingBuyer,
  creatingMock,
  onListingIdChange,
  onBuyerIdChange,
  onRefreshListings,
  onRefreshListing,
  onRefreshBuyer,
  onCreateMockListing,
}: ListingPanelProps) {
  const hasListings = listings.length > 0;

  return (
    <Card title="Kontrol Bidding" subtitle="Pilih listing dan buyer untuk simulasi alur bidding.">
      <div className={styles.formGrid}>
        <label className={styles.field}>
          <span>Mock Listing</span>
          <select
            value={selectedListingId}
            onChange={(event) => onListingIdChange(event.target.value)}
            disabled={loadingListings || !hasListings}
          >
            {!hasListings ? <option value="">Belum ada listing mock</option> : null}
            {listings.map((listing) => (
              <option key={listing.listingId} value={listing.listingId}>
                {listing.title} ({shortId(listing.listingId)})
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          <span>Buyer ID</span>
          <input
            value={buyerId}
            onChange={(event) => onBuyerIdChange(event.target.value.trim())}
            placeholder="Masukkan UUID buyer"
          />
        </label>
      </div>

      {selectedListing ? (
        <p className={styles.helperText}>
          Listing aktif: <strong>{selectedListing.title}</strong> | Starting {formatCurrency(selectedListing.startingPrice)}
        </p>
      ) : (
        <p className={styles.helperText}>Pilih listing atau isi listing ID dari data mock backend.</p>
      )}

      <div className={styles.actions}>
        <button type="button" className={styles.buttonSecondary} onClick={onRefreshListings} disabled={loadingListings}>
          {loadingListings ? "Memuat..." : "Refresh Mock Listings"}
        </button>
        <button type="button" className={styles.buttonSecondary} onClick={onCreateMockListing} disabled={creatingMock}>
          {creatingMock ? "Membuat..." : "Tambah Mock Listing"}
        </button>
        <button
          type="button"
          className={styles.buttonGhost}
          onClick={onRefreshListing}
          disabled={!selectedListingId || refreshingListing}
        >
          {refreshingListing ? "Refresh..." : "Refresh Data Listing"}
        </button>
        <button type="button" className={styles.buttonGhost} onClick={onRefreshBuyer} disabled={!buyerId || refreshingBuyer}>
          {refreshingBuyer ? "Refresh..." : "Refresh Data Buyer"}
        </button>
      </div>
    </Card>
  );
}
