"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./bidding.module.css";
import { BidForm } from "./components/BidForm";
import { BidListPanel } from "./components/BidListPanel";
import { BuyerHistoryPanel } from "./components/BuyerHistoryPanel";
import { HighestBidPanel } from "./components/HighestBidPanel";
import { ListingPanel } from "./components/ListingPanel";
import { StatusAlert } from "./components/StatusAlert";
import { WalletPanel } from "./components/WalletPanel";
import {
  createMockListing,
  fetchBuyerBids,
  fetchHighestBid,
  fetchListingBids,
  fetchMockListings,
  fetchWallet,
  getErrorMessage,
  submitBid,
  updateWallet,
} from "./lib/api";
import { BID_API_BASE_URL, DEFAULT_BUYER_ID, DEFAULT_LISTING_ID } from "./lib/config";
import { ApiStatus, Bid, Listing, Wallet } from "./lib/types";

export default function BiddingModule() {
  const [status, setStatus] = useState<ApiStatus | null>(null);

  const [listings, setListings] = useState<Listing[]>([]);
  const [selectedListingId, setSelectedListingId] = useState<string>(DEFAULT_LISTING_ID);
  const [buyerId, setBuyerId] = useState<string>(DEFAULT_BUYER_ID);

  const [listingBids, setListingBids] = useState<Bid[]>([]);
  const [highestBid, setHighestBid] = useState<Bid | null>(null);
  const [buyerBids, setBuyerBids] = useState<Bid[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);

  const [loadingListings, setLoadingListings] = useState(false);
  const [refreshingListing, setRefreshingListing] = useState(false);
  const [refreshingBuyer, setRefreshingBuyer] = useState(false);
  const [submittingBid, setSubmittingBid] = useState(false);
  const [creatingMock, setCreatingMock] = useState(false);
  const [updatingWallet, setUpdatingWallet] = useState(false);

  const selectedListing = useMemo(
    () => listings.find((listing) => listing.listingId === selectedListingId) ?? null,
    [listings, selectedListingId],
  );

  const loadListings = useCallback(async (notify = false) => {
    setLoadingListings(true);
    try {
      const fetchedListings = await fetchMockListings();
      setListings(fetchedListings);

      const activeListingExists = fetchedListings.some((item) => item.listingId === selectedListingId);
      if (!activeListingExists && fetchedListings.length > 0) {
        setSelectedListingId(fetchedListings[0].listingId);
      }

      if (notify) {
        setStatus({
          kind: "success",
          message: `Daftar mock listing berhasil dimuat (${fetchedListings.length} data).`,
        });
      }
    } catch (error) {
      setStatus({ kind: "error", message: `Gagal mengambil mock listing. ${getErrorMessage(error)}` });
    } finally {
      setLoadingListings(false);
    }
  }, [selectedListingId]);

  const loadListingData = useCallback(async (targetListingId: string, notify = false) => {
    if (!targetListingId) {
      setListingBids([]);
      setHighestBid(null);
      return;
    }

    setRefreshingListing(true);
    try {
      const [bids, highest] = await Promise.all([
        fetchListingBids(targetListingId),
        fetchHighestBid(targetListingId),
      ]);

      setListingBids(bids);
      setHighestBid(highest);

      if (notify) {
        setStatus({ kind: "success", message: "Data listing berhasil diperbarui." });
      }
    } catch (error) {
      setStatus({ kind: "error", message: `Gagal mengambil data listing. ${getErrorMessage(error)}` });
    } finally {
      setRefreshingListing(false);
    }
  }, []);

  const loadBuyerData = useCallback(async (targetBuyerId: string, notify = false) => {
    if (!targetBuyerId) {
      setBuyerBids([]);
      setWallet(null);
      return;
    }

    setRefreshingBuyer(true);
    try {
      const [bids, walletData] = await Promise.all([fetchBuyerBids(targetBuyerId), fetchWallet(targetBuyerId)]);

      setBuyerBids(bids);
      setWallet(walletData);

      if (notify) {
        setStatus({ kind: "success", message: "Data buyer berhasil diperbarui." });
      }
    } catch (error) {
      setStatus({ kind: "error", message: `Gagal mengambil data buyer. ${getErrorMessage(error)}` });
    } finally {
      setRefreshingBuyer(false);
    }
  }, []);

  const handleSubmitBid = useCallback(async (amount: number) => {
    if (!selectedListingId || !buyerId) {
      setStatus({ kind: "error", message: "Listing ID dan Buyer ID wajib diisi sebelum submit bid." });
      return;
    }

    setSubmittingBid(true);
    try {
      await submitBid({
        listingId: selectedListingId,
        buyerId,
        bidAmount: amount,
      });

      await Promise.all([loadListingData(selectedListingId), loadBuyerData(buyerId)]);
      setStatus({ kind: "success", message: "Bid berhasil dikirim." });
    } catch (error) {
      setStatus({ kind: "error", message: `Gagal submit bid. ${getErrorMessage(error)}` });
    } finally {
      setSubmittingBid(false);
    }
  }, [buyerId, loadBuyerData, loadListingData, selectedListingId]);

  const handleCreateMockListing = useCallback(async () => {
    setCreatingMock(true);
    try {
      const created = await createMockListing();
      await loadListings();

      if (created?.listingId) {
        setSelectedListingId(created.listingId);
      }

      setStatus({ kind: "success", message: "Mock listing baru berhasil dibuat." });
    } catch (error) {
      setStatus({ kind: "error", message: `Gagal membuat mock listing. ${getErrorMessage(error)}` });
    } finally {
      setCreatingMock(false);
    }
  }, [loadListings]);

  const handleUpdateWallet = useCallback(async (balance: number) => {
    if (!buyerId) {
      setStatus({ kind: "error", message: "Buyer ID wajib diisi sebelum update wallet." });
      return;
    }

    setUpdatingWallet(true);
    try {
      const updatedWallet = await updateWallet({ buyerId, balance });
      if (updatedWallet) {
        setWallet(updatedWallet);
      }

      await loadBuyerData(buyerId);
      setStatus({ kind: "success", message: "Wallet buyer berhasil diperbarui." });
    } catch (error) {
      setStatus({ kind: "error", message: `Gagal update wallet. ${getErrorMessage(error)}` });
    } finally {
      setUpdatingWallet(false);
    }
  }, [buyerId, loadBuyerData]);

  useEffect(() => {
    void loadListings();
  }, [loadListings]);

  useEffect(() => {
    void loadListingData(selectedListingId);
  }, [loadListingData, selectedListingId]);

  useEffect(() => {
    void loadBuyerData(buyerId);
  }, [buyerId, loadBuyerData]);

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <h1 className={styles.title}>BidMart Bidding Module</h1>
        <p className={styles.subtitle}>
          Front-end ini menampilkan alur utama bidding dari endpoint backend: listing mock, submit bid, highest bid,
          histori buyer, dan wallet mock buyer.
        </p>
        <p className={styles.metaLine}>
          Base URL Backend: <span className={styles.monoText}>{BID_API_BASE_URL}</span>
        </p>
      </header>

      <div className={styles.alertContainer}>
        <StatusAlert status={status} />
      </div>

      <section className={styles.gridLayout}>
        <div className={styles.mainColumn}>
          <ListingPanel
            listings={listings}
            selectedListing={selectedListing}
            selectedListingId={selectedListingId}
            buyerId={buyerId}
            loadingListings={loadingListings}
            refreshingListing={refreshingListing}
            refreshingBuyer={refreshingBuyer}
            creatingMock={creatingMock}
            onListingIdChange={setSelectedListingId}
            onBuyerIdChange={setBuyerId}
            onRefreshListings={() => void loadListings(true)}
            onRefreshListing={() => void loadListingData(selectedListingId, true)}
            onRefreshBuyer={() => void loadBuyerData(buyerId, true)}
            onCreateMockListing={() => void handleCreateMockListing()}
          />

          <BidForm
            listingId={selectedListingId}
            buyerId={buyerId}
            isSubmitting={submittingBid}
            onSubmit={handleSubmitBid}
          />

          <BidListPanel bids={listingBids} listingId={selectedListingId} loading={refreshingListing} />
        </div>

        <div className={styles.sideColumn}>
          <HighestBidPanel highestBid={highestBid} loading={refreshingListing} />
          <BuyerHistoryPanel bids={buyerBids} buyerId={buyerId} loading={refreshingBuyer} />
          <WalletPanel
            wallet={wallet}
            buyerId={buyerId}
            loading={refreshingBuyer}
            updating={updatingWallet}
            onRefresh={() => void loadBuyerData(buyerId, true)}
            onUpdate={handleUpdateWallet}
          />
        </div>
      </section>
    </main>
  );
}
