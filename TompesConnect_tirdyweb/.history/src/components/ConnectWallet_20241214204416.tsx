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
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const clientId = "78350d5d008b63f1ad65d9337eaa9a3d";

const ConnectWallet: React.FC = () => {
  const connectWithWalletConnect = useWalletConnect();
  const connectWithMetamask = useMetamask();
  const connectWithTrustWallet = useTrustWallet();
  const disconnect = useDisconnect();
  const address = useAddress();

  const [isLoading, setIsLoading] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
      navigator.userAgent.toLowerCase()
    );
    setIsDesktop(!isMobileDevice);
  }, []);

  useEffect(() => {
    console.log("Address on render:", address); // Лог адреса при рендере
  }, [address]);

  const fetchWallets = async () => {
    try {
      const response = await fetch("http://localhost:5000/get-wallets", {
        method: "GET",
      });
      const result = await response.json();
      if (response.ok) {
        console.log("Wallets from server:", result.wallets);
        toast.success("Fetched wallet addresses successfully!");
      } else {
        throw new Error(result.error || "Failed to fetch wallet addresses.");
      }
    } catch (err) {
      console.error("Error fetching wallets:", err);
      toast.error(`Error fetching wallets: ${(err as Error).message}`);
    }
  };

  const handleConnect = async (walletType: "metamask" | "trustwallet" | "walletconnect") => {
    setIsLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams(window.location.search);
      const token = queryParams.get("token");

      if (!token) {
        throw new Error("Missing token for wallet linking.");
      }

      console.log("handleConnect called with walletType:", walletType);

      if (walletType === "metamask") {
        await connectWithMetamask();
      } else if (walletType === "trustwallet") {
        await connectWithTrustWallet();
      } else if (walletType === "walletconnect") {
        await connectWithWalletConnect();
      }

    } catch (err) {
      setError(`Failed to connect with ${walletType}. ${(err as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const shortenAddress = (addr: string | undefined) =>
    addr ? `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}` : "";

  return (
    <div className="wrapper">
      <div className="container">
        <img
          className="info-image"
          src="https://firebasestorage.googleapis.com/v0/b/fortunetrust-bank.appspot.com/o/banner%20wp-1.png?alt=media&token=60ad5859-db9b-4ef7-a1e8-30e5d9d4b628"
          alt="Info"
        />
        {!address ? (
          <>
            <h1 className="title">Connect Your Wallet</h1>
            <p className="description">
              To access the application, connect your wallet by clicking a button below.
            </p>
          </>
        ) : (
          <div className="connected-info">
            <h2 className="title">Connected Successfully!</h2>
            <p className="connected-text">
              Wallet connected: <strong>{shortenAddress(address)}</strong>
            </p>
            <p className="connected-text">
              Click "Continue" to enjoy Tompes to the fullest!
            </p>
            <div className="buttons-row">
              <button className="disconnect-button" onClick={disconnect}>
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
        {!address && (
          <div className="wallet-buttons">
            <button
              className="walletconnect-button"
              onClick={() => handleConnect("walletconnect")}
              disabled={isLoading}
            >
              {isLoading ? "Connecting..." : "WalletConnect"}
            </button>
            {isDesktop && (
              <>
                <button
                  className="wallet-button-metamask"
                  onClick={() => handleConnect("metamask")}
                  disabled={isLoading}
                >
                  {isLoading ? "Connecting..." : "Metamask"}
                </button>
                <button
                  className="wallet-button-trustwallet"
                  onClick={() => handleConnect("trustwallet")}
                  disabled={isLoading}
                >
                  {isLoading ? "Connecting..." : "Trust Wallet"}
                </button>
              </>
            )}
            <button
              className="fetch-wallets-button"
              onClick={fetchWallets}
            >
              Fetch Wallets
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const App = () => (
  <ThirdwebProvider clientId={clientId}>
    <ConnectWallet />
  </ThirdwebProvider>
);

export default App;
