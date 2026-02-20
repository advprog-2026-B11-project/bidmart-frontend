"use client";
import { useState, useEffect } from "react";

interface Wallet {
  id: number; 
  username: string;
  balance: number;
}

export default function Home() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const API_URL = "https://bidmart-backend-wn6p.onrender.com"; 

  const fetchWallets = async () => {
    try {
      const response = await fetch(`${API_URL}/api/wallet`); 
      if (!response.ok) throw new Error("Gagal mengambil data");
      const data = await response.json();
      setWallets(data);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const createDummy = async () => {
    setIsLoading(true); 
    try {
      const response = await fetch(`${API_URL}/api/wallet/init-dummy?username=PengujiVercel`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      await fetchWallets();
    } catch (error) {
      console.error("Error menambah data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWallets();
  }, []);

  return (
    <div style={{ padding: "40px", fontFamily: "sans-serif", maxWidth: "600px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "20px" }}>
        Demo Integrasi BidMart - B11
      </h1>
      
      <div style={{ padding: "20px", border: "1px solid #ccc", borderRadius: "8px", marginBottom: "20px" }}>
        <p style={{ marginBottom: "15px" }}>Klik untuk menambah data Wallet</p>
        <button 
          onClick={createDummy} 
          disabled={isLoading}
          style={{ 
            padding: "10px 20px", 
            backgroundColor: isLoading ? "#ccc" : "#0070f3", 
            color: "white", 
            border: "none", 
            borderRadius: "5px", 
            cursor: isLoading ? "not-allowed" : "pointer", 
            fontWeight: "bold" 
          }}
        >
          {isLoading ? "Menyimpan ke DB..." : "+ Tambah Dompet Dummy"}
        </button>
      </div>

      <h3>Data Wallet Saat Ini:</h3>
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