"use client";

import Link from "next/link";
import { AlertTriangle, X } from "lucide-react";
import { toast } from "sonner";

interface OutbidContentProps {
  listingId: string;
  listingTitle?: string;
  toastId: string | number;
}

function OutbidContent({ listingId, listingTitle, toastId }: OutbidContentProps) {
  const handleBidLagi = () => {
    toast.dismiss(toastId);
    const bidForm = document.getElementById("bid-form");
    if (bidForm) {
      bidForm.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 shadow-lg">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-amber-900">Anda dikalahkan!</p>
        {listingTitle && (
          <p className="mt-0.5 truncate text-xs text-amber-700">{listingTitle}</p>
        )}
        <p className="mt-0.5 text-xs text-amber-600">
          Ada penawaran baru yang lebih tinggi. Naikkan bid Anda sekarang!
        </p>
        <div className="mt-2.5 flex items-center gap-2">
          <Link
            href={`/catalog/${listingId}`}
            onClick={handleBidLagi}
            className="inline-flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-600"
          >
            Bid lagi
          </Link>
          <button
            onClick={() => toast.dismiss(toastId)}
            className="text-xs text-amber-600 hover:underline"
          >
            Tutup
          </button>
        </div>
      </div>
      <button
        onClick={() => toast.dismiss(toastId)}
        className="ml-1 shrink-0 text-amber-400 hover:text-amber-600"
        aria-label="Tutup"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function showOutbidToast(listingId: string, listingTitle?: string) {
  return toast.custom(
    (id) => (
      <OutbidContent listingId={listingId} listingTitle={listingTitle} toastId={id} />
    ),
    { duration: 10_000, id: `outbid-${listingId}` }
  );
}
