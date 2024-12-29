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
  const [isDesktop, setIsDesktop] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [telegramId, setTelegramId] = useState<number | null>(null);

  // Use environment variable for API URL
  const API_URL = process.env.REACT_APP_API_URL || "https://5f23-24-150-119-126.ngrok-free.app";

  useEffect(() => {
    const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
      navigator.userAgent.toLowerCase()
    );
    setIsDesktop(!isMobileDevice);

    const urlParams = new URLSearchParams(window.location.search);
    const telegramIdParam = urlParams.get("telegram_id");
    if (telegramIdParam) {
      setTelegramId(Number(telegramIdParam));
    }
  }, []);

  const saveUserData = async (telegramId: number, walletAddress: string) => {
    try {
      console.log("Sending data to server:", { telegramId, walletAddress });
      
      const response = await fetch(`${API_URL}/wallet`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          telegram_id: telegramId,
          wallet_address: walletAddress
        }),
        credentials: 'include', // Include credentials if needed
      });

      if (!response.ok) {
        const errorDetails = await response.text();
        console.error("Server Error Details:", errorDetails);
        throw new Error(`Server responded with status ${response.status}: ${errorDetails}`);
      }

      const data = await response.json();
      console.log("Response received successfully:", data);
      toast.success("Wallet connected successfully!");
    } catch (error) {
      console.error("Error saving data to server:", error);
      toast.error(`Failed to save data: ${(error as Error).message}`);
      throw error;
    }
  };

  useEffect(() => {
    if (telegramId && address) {
      saveUserData(telegramId, address).catch((error) => {
        console.error("Failed to save user data:", error);
      });
    }
  }, [telegramId, address]);

  const handleConnect = async (walletType: "metamask" | "trustwallet" | "walletconnect") => {
    setIsLoading(true);
    setError(null);

    try {
      console.log("Attempting to connect with:", walletType);
      
      switch (walletType) {
        case "metamask":
          await connectWithMetamask();
          break;
        case "trustwallet":
          await connectWithTrustWallet();
          break;
        case "walletconnect":
          await connectWithWalletConnect();
          break;
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
            <p className="description">
              To access the application, connect your wallet by clicking a button below.
            </p>
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
            </div>
          </div>
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
      </div>
      <ToastContainer />
    </div>
  );
};

const App = () => (
  <ThirdwebProvider clientId={clientId}>
    <ConnectWallet />
    <ToastContainer
      position="top-right"
      autoClose={5000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
    />
  </ThirdwebProvider>
);

export default App;
