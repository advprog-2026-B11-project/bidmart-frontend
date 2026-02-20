"use client";
import { useState, useEffect } from "react";

interface Wallet {
  id: string;
  username: string;
  balance: number;
}

export default function Home() {
  const [wallets, setWallets] = useState<Wallet[]>([]);

  const fetchWallets = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/wallet"); 
      if (!response.ok) throw new Error("Gagal mengambil data");
      const data = await response.json();
      setWallets(data);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const createDummy = async () => {
    try {
      await fetch("http://localhost:8080/api/wallet/init-dummy?username=PengujiLokal", {
        method: "POST"
      });
      fetchWallets(); 
    } catch (error) {
      console.error("Error menambah data:", error);
    }
  };

  useEffect(() => {
    fetchWallets();
  }, []);

  return (
    <div style={{ padding: "40px", fontFamily: "sans-serif", maxWidth: "600px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "20px" }}>
        Demo Integrasi BidMart
      </h1>
      
      <div style={{ padding: "20px", border: "1px solid #ccc", borderRadius: "8px", marginBottom: "20px" }}>
        <p style={{ marginBottom: "15px" }}>Tekan tombol di bawah untuk menambah data dompet dummy dari Frontend ke Database Neon.</p>
        <button 
          onClick={createDummy} 
          style={{ padding: "10px 20px", backgroundColor: "#0070f3", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}
        >
          + Tambah Dompet Dummy
        </button>
      </div>

      <h3>Data Dompet di Database (Neon DB):</h3>
      <ul style={{ marginTop: "10px", paddingLeft: "20px" }}>
        {wallets.length === 0 ? <p style={{ color: "gray" }}>Belum ada data...</p> : null}
        {wallets.map((wallet: Wallet) => (
          <li key={wallet.id} style={{ marginBottom: "8px" }}>
            <strong>{wallet.username}</strong> - Saldo: Rp {wallet.balance}
          </li>
        ))}
      </ul>
    </div>
  );
}
