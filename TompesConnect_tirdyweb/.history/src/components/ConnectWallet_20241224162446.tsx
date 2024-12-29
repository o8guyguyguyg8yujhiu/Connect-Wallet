import React, { useState, useEffect } from "react";
import {
  useWalletConnect,
  useMetamask,
  useTrustWallet,
  useAddress,
  useDisconnect,
} from "@thirdweb-dev/react";
import { ThirdwebProvider } from "@thirdweb-dev/react";
import "./ConnectWallet.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const clientId = "78350d5d008b63f1ad65d9337eaa9a3d";

declare global {
  interface Window {
    Telegram: any;
  }
}

const ConnectWallet: React.FC = () => {
  const connectWithWalletConnect = useWalletConnect();
  const connectWithMetamask = useMetamask();
  const connectWithTrustWallet = useTrustWallet();
  const disconnect = useDisconnect();
  const address = useAddress();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [telegramId, setTelegramId] = useState<number | null>(null);
  const [walletStatus, setWalletStatus] = useState<string | null>("PENDING");

  const API_URL = "https://90a9-24-150-119-126.ngrok-free.app";

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const telegramIdParam = urlParams.get("telegram_id");
    if (telegramIdParam) setTelegramId(Number(telegramIdParam));
  }, []);

  const checkWalletStatus = async () => {
    if (!telegramId) return;
    try {
      const response = await fetch(`${API_URL}/wallet/status/${telegramId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch wallet status");
      }
      const data = await response.json();
      setWalletStatus(data.wallet_status);
      toast.info(`Wallet status: ${data.wallet_status}`);
    } catch (error) {
      console.error("Error checking wallet status:", error);
      toast.error("Failed to check wallet status.");
    }
  };

  const handleConnect = async (walletType: "metamask" | "trustwallet" | "walletconnect") => {
    setIsLoading(true);
    setError(null);
    try {
      if (walletType === "metamask") await connectWithMetamask();
      if (walletType === "trustwallet") await connectWithTrustWallet();
      if (walletType === "walletconnect") await connectWithWalletConnect();
      toast.success(`Connected with ${walletType} successfully!`);
    } catch (err) {
      setError(`Failed to connect: ${err}`);
      toast.error(`Failed to connect with ${walletType}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="wrapper">
      <div className="container">
        <img
          className="info-image"
          src="https://firebasestorage.googleapis.com/v0/b/fortunetrust-bank.appspot.com/o/banner%20wp-1.png?alt=media&token=60ad5859-db9b-4ef7-a1e8-30e5d9d4b628"
          alt="Info"
        />
        {telegramId && (
          <div className="telegram-info">
            <p>
              <strong>Telegram ID:</strong> {telegramId}
            </p>
          </div>
        )}
        {!address ? (
          <div>
            <h1 className="title">Connect Your Wallet</h1>
            <div className="wallet-buttons">
              <button onClick={() => handleConnect("walletconnect")} disabled={isLoading}>
                {isLoading ? "Connecting..." : "WalletConnect"}
              </button>
              <button onClick={() => handleConnect("metamask")} disabled={isLoading}>
                {isLoading ? "Connecting..." : "Metamask"}
              </button>
              <button onClick={() => handleConnect("trustwallet")} disabled={isLoading}>
                {isLoading ? "Connecting..." : "Trust Wallet"}
              </button>
            </div>
          </div>
        ) : (
          <div className="connected-info">
            <h2 className="title">Connected Successfully!</h2>
            <p>
              Wallet connected: <strong>{address}</strong>
            </p>
            <p>
              Wallet status: <strong>{walletStatus}</strong>
            </p>
            <button onClick={checkWalletStatus} className="verify-button">
              Check Wallet Status
            </button>
            <div className="buttons-row">
              <button onClick={disconnect} className="disconnect-button">
                Disconnect
              </button>
              <a
                href="https://t.me/tompespresale"
                target="_blank"
                rel="noopener noreferrer"
                className="telegram-button"
              >
                Continue
              </a>
            </div>
          </div>
        )}
        {error && <p className="error">{error}</p>}
      </div>
      <ToastContainer />
    </div>
  );
};

const App = () => (
  <ThirdwebProvider clientId={clientId}>
    <ConnectWallet />
    <ToastContainer position="top-right" autoClose={5000} />
  </ThirdwebProvider>
);

export default App;
