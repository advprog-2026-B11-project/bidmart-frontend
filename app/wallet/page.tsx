"use client";
import { useState, useEffect } from "react";

interface Wallet {
    id: string;
    userId: string;
    balanceAvailable: number;
}

export default function WalletDemo() {
    const [wallets, setWallets] = useState<Wallet[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const API_URL = "http://localhost:8080";
    // const API_URL = "https://bidmart-backend-wn6p.onrender.com";

    const fetchWallets = async () => {
        try {
            const response = await fetch(`${API_URL}/api/wallet/list`);
            if (!response.ok) throw new Error("Gagal ambil data");
            const data = await response.json();
            setWallets(data);
        } catch (error) {
            console.error("Error Fetch:", error);
        }
    };

    const createDummyWallet = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/wallet/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: crypto.randomUUID()
                }),
            });

            if (response.ok) {
                alert("Berhasil Register!");
                await fetchWallets();
            }
        } catch (error) {
            console.error("Register Error:", error);
            alert("Gagal! Cek apakah @CrossOrigin sudah ada di BE.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleTopUp = async (userId: string) => {
        try {
            const response = await fetch(`${API_URL}/api/wallet/${userId}/top-up`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    amount: 50000
                }),
            });

            if (response.ok) {
                const updatedWallet = await response.json();
                alert(`Top Up Berhasil! Saldo sekarang: Rp ${updatedWallet.balanceAvailable}`);
                await fetchWallets();
            } else {
                const errorText = await response.text();
                console.error("Gagal dari Server:", errorText);
                alert("Gagal Top Up: User tidak ditemukan atau nominal salah.");
            }
        } catch (error) {
            console.error("Top Up Gagal total (Network Error):", error);
            alert("Koneksi ke Backend terputus.");
        }
    };

    useEffect(() => {
        fetchWallets();
    }, []);

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h1 style={styles.title}>BidMart Wallet</h1>

                <button
                    onClick={createDummyWallet}
                    disabled={isLoading}
                    style={styles.primaryButton}
                >
                    {isLoading ? "Loading..." : "+ Register New Wallet"}
                </button>

                <div style={{ marginTop: "20px" }}>
                    {wallets.map((w) => (
                        <div key={w.id} style={styles.walletItem}>
                            <div>
                                <p style={{ fontSize: "12px", color: "#888", margin: 0 }}>User: {w.userId.substring(0,8)}</p>
                                <h2 style={{ margin: 0, color: "#10b981" }}>
                                    Rp {w.balanceAvailable.toLocaleString("id-ID")}
                                </h2>
                            </div>
                            <button onClick={() => handleTopUp(w.userId)} style={styles.topUpButton}>
                                +50k
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

const styles: { [key: string]: React.CSSProperties } = {
    container: { minHeight: "100vh", backgroundColor: "#0f172a", padding: "40px", color: "white", fontFamily: "sans-serif" },
    card: { maxWidth: "500px", margin: "0 auto", background: "#1e293b", padding: "30px", borderRadius: "20px" },
    title: { textAlign: "center", marginBottom: "30px" },
    primaryButton: { width: "100%", padding: "12px", backgroundColor: "#3b82f6", color: "white", border: "none", borderRadius: "10px", fontWeight: "bold", cursor: "pointer" },
    walletItem: { display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#0f172a", padding: "15px", borderRadius: "12px", marginTop: "10px" },
    topUpButton: { backgroundColor: "#10b981", color: "white", border: "none", padding: "8px 15px", borderRadius: "8px", cursor: "pointer" }
};