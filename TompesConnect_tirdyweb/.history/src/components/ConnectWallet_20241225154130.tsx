import React, { useState, useEffect } from "react";
import {
  useWalletConnect,
  useMetamask,
  useTrustWallet,
  useAddress,
  useDisconnect,
} from "@thirdweb-dev/react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./ConnectWallet.css";

const API_URL = "https://f883-24-150-119-126.ngrok-free.app/wallet";

const ConnectWallet: React.FC = () => {
  const connectWithWalletConnect = useWalletConnect();
  const connectWithMetamask = useMetamask();
  const connectWithTrustWallet = useTrustWallet();
  const disconnect = useDisconnect();
  const address = useAddress();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [telegramId, setTelegramId] = useState<number | null>(null);

  useEffect(() => {
    // Получение Telegram ID из URL
    const urlParams = new URLSearchParams(window.location.search);
    const telegramIdParam = urlParams.get("telegram_id");
    if (telegramIdParam) {
      setTelegramId(Number(telegramIdParam));
    }
  }, []);

  const saveUserData = async (telegramId: number, walletAddress: string) => {
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ telegram_id: telegramId, wallet_address: walletAddress }),
      });

      if (!response.ok) {
        const errorDetails = await response.text();
        throw new Error(`Server responded with status ${response.status}: ${errorDetails}`);
      }

      toast.success("Data saved to server successfully!");
    } catch (error) {
      console.error("Error saving data to server:", error);
      toast.error(`Failed to save data: ${(error as Error).message}`);
    }
  };

  useEffect(() => {
    if (telegramId && address) {
      saveUserData(telegramId, address);
    }
  }, [telegramId, address]);

  const handleConnect = async (walletType: "metamask" | "trustwallet" | "walletconnect") => {
    setIsLoading(true);
    setError(null);

    try {
      if (walletType === "metamask") {
        await connectWithMetamask(); // Вызываем метод подключения Metamask
      } else if (walletType === "trustwallet") {
        await connectWithTrustWallet();
      } else if (walletType === "walletconnect") {
        await connectWithWalletConnect();
      }
      toast.success(`Connected with ${walletType} successfully!`);
    } catch (err) {
      console.error("Connection failed:", err);
      setError(`Failed to connect with ${walletType}. ${(err as Error).message}`);
      toast.error(`Failed to connect with ${walletType}.`);
    } finally {
      setIsLoading(false);
    }
  };

  const shortenAddress = (addr: string | undefined): string =>
    addr ? `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}` : "";

  return (
    <div className="wrapper">
      <div className="container">
        <h1>Connect Your Wallet</h1>
        {!address ? (
          <div>
            <button onClick={() => handleConnect("metamask")} disabled={isLoading}>
              {isLoading ? "Connecting..." : "Connect with Metamask"}
            </button>
            <button onClick={() => handleConnect("walletconnect")} disabled={isLoading}>
              {isLoading ? "Connecting..." : "Connect with WalletConnect"}
            </button>
            <button onClick={() => handleConnect("trustwallet")} disabled={isLoading}>
              {isLoading ? "Connecting..." : "Connect with Trust Wallet"}
            </button>
          </div>
        ) : (
          <div>
            <p>
              Wallet Connected: <strong>{shortenAddress(address)}</strong>
            </p>
            <button onClick={disconnect}>Disconnect</button>
          </div>
        )}
        <ToastContainer position="top-right" autoClose={5000} />
        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
};

export default ConnectWallet;
