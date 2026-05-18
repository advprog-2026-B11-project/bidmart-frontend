import { FormEvent, useState } from "react";
import { Wallet } from "../lib/types";
import { formatCurrency, formatDate } from "../lib/format";
import styles from "../bidding.module.css";
import { Card } from "./Card";

interface WalletPanelProps {
  wallet: Wallet | null;
  buyerId: string;
  loading: boolean;
  updating: boolean;
  onRefresh: () => void;
  onUpdate: (balance: number) => Promise<void>;
}

export function WalletPanel({ wallet, buyerId, loading, updating, onRefresh, onUpdate }: WalletPanelProps) {
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const formData = new FormData(event.currentTarget);
    const rawBalance = formData.get("balance");
    const balance = Number(typeof rawBalance === "string" ? rawBalance : "");

    if (!Number.isFinite(balance) || balance < 0) {
      setFormError("Saldo wallet harus angka 0 atau lebih.");
      return;
    }

    if (!buyerId) {
      setFormError("Buyer ID wajib diisi.");
      return;
    }

    await onUpdate(balance);
  }

  return (
    <Card
      title="Wallet Buyer"
      subtitle="Endpoint mock: GET/PUT /api/bids/mocks/wallets/{buyerId}"
      actions={
        <button type="button" className={styles.buttonGhost} onClick={onRefresh} disabled={!buyerId || loading}>
          {loading ? "Memuat..." : "Refresh"}
        </button>
      }
    >
      {!buyerId ? <p className={styles.mutedText}>Isi buyer ID untuk melihat wallet.</p> : null}
      {loading ? <p className={styles.mutedText}>Memuat wallet...</p> : null}

      {!loading && buyerId && !wallet ? <p className={styles.mutedText}>Wallet buyer tidak ditemukan di mock data.</p> : null}

      {!loading && wallet ? (
        <div className={styles.detailList}>
          <div>
            <span>Saldo Saat Ini</span>
            <strong>{formatCurrency(wallet.balance)}</strong>
          </div>
          <div>
            <span>Terakhir Update</span>
            <strong>{formatDate(wallet.updatedAt)}</strong>
          </div>
        </div>
      ) : null}

      <form className={styles.formColumn} onSubmit={handleSubmit}>
        <label className={styles.field}>
          <span>Set Saldo Baru (IDR)</span>
          <input
            key={wallet ? `${wallet.buyerId}-${wallet.balance}` : "empty-wallet"}
            name="balance"
            inputMode="numeric"
            defaultValue={wallet ? String(wallet.balance) : ""}
            placeholder="Contoh: 500000"
          />
        </label>

        {formError ? <p className={styles.inlineError}>{formError}</p> : null}

        <button type="submit" className={styles.buttonSecondary} disabled={!buyerId || updating}>
          {updating ? "Mengupdate..." : "Update Wallet"}
        </button>
      </form>
    </Card>
  );
}
