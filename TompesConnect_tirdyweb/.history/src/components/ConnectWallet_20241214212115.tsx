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

  useEffect(() => {
    // Определение устройства
    const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
      navigator.userAgent.toLowerCase()
    );
    setIsDesktop(!isMobileDevice);

    // Получение Telegram ID
    if (window.Telegram?.WebApp?.initDataUnsafe) {
      const tgData = window.Telegram.WebApp.initDataUnsafe;
      if (tgData?.user?.id) {
        setTelegramId(tgData.user.id);
      }
    }
  }, []);

  useEffect(() => {
    console.log("Address on render:", address); // Лог адреса при рендере
  }, [address]);

  const handleConnect = async (walletType: "metamask" | "trustwallet" | "walletconnect") => {
    setIsLoading(true);
    setError(null);
  
    try {
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
        {telegramId && (
          <div className="telegram-info">
            <p>
              <strong>Telegram ID:</strong> {telegramId}
            </p>
          </div>
        )}
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
