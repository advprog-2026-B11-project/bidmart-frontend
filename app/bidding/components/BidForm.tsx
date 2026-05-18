import { FormEvent, useState } from "react";
import styles from "../bidding.module.css";
import { Card } from "./Card";

interface BidFormProps {
  listingId: string;
  buyerId: string;
  isSubmitting: boolean;
  onSubmit: (amount: number) => Promise<void>;
}

export function BidForm({ listingId, buyerId, isSubmitting, onSubmit }: BidFormProps) {
  const [amountInput, setAmountInput] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const amount = Number(amountInput);
    if (!Number.isFinite(amount) || amount <= 0) {
      setFormError("Nominal bid harus lebih dari 0.");
      return;
    }

    if (!listingId || !buyerId) {
      setFormError("Listing ID dan Buyer ID wajib diisi.");
      return;
    }

    await onSubmit(amount);
    setAmountInput("");
  }

  return (
    <Card title="Submit Bid" subtitle="Kirim bid baru ke endpoint POST /api/bids.">
      <form onSubmit={handleSubmit} className={styles.formColumn}>
        <label className={styles.field}>
          <span>Nominal Bid (IDR)</span>
          <input
            inputMode="numeric"
            value={amountInput}
            onChange={(event) => setAmountInput(event.target.value)}
            placeholder="Contoh: 200000"
          />
        </label>

        {formError ? <p className={styles.inlineError}>{formError}</p> : null}

        <button type="submit" className={styles.buttonPrimary} disabled={isSubmitting}>
          {isSubmitting ? "Mengirim Bid..." : "Kirim Bid"}
        </button>
      </form>
    </Card>
  );
}
