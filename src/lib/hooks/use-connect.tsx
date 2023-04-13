import { useEffect, useState, createContext, ReactNode, useMemo } from 'react';
import Web3Modal from 'web3modal';
import {
  getTokenBalances,
  getNativeData,
  calculatePortfolioBalance,
} from 'src/pages/classic/api';
import { ethers } from 'ethers';

const web3modalStorageKey = 'WEB3_CONNECT_CACHED_PROVIDER';

export const WalletContext = createContext<any>({});

const DEFAULT_CHAIN = '0xfa';

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [address, setAddress] = useState<string | undefined>(undefined);
  const [balance, setBalance] = useState<string | undefined>(undefined);
  const [tokenBalances, setTokenBalances] = useState<any[]>([]);
  const [nativeData, setNativeData] = useState<{
    balance: string;
    value: string;
  }>({ balance: '0', value: '0' });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const web3Modal =
    typeof window !== 'undefined' && new Web3Modal({ cacheProvider: true });

  /* This effect will fetch wallet address if user has already connected his/her wallet */
  useEffect(() => {
    async function checkConnection() {
      try {
        if (window && window.ethereum) {
          // Check if web3modal wallet connection is available on storage
          if (localStorage.getItem(web3modalStorageKey)) {
            await connectToWallet();
          }
        } else {
          console.log('window or window.ethereum is not available');
        }
      } catch (error) {
        console.log(error, 'Catch error Account is not connected');
      }
    }
    checkConnection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (address) {
      getNativeData({ wallet: address, chain: DEFAULT_CHAIN }).then((data) => {
        setNativeData(data);
      });
      getTokenBalances({ wallet: address, chain: DEFAULT_CHAIN }).then(
        (data) => {
          setTokenBalances(data);
        }
      );
    }
  }, [address]);

  const portfolioBalance = useMemo(() => {
    if (tokenBalances && nativeData) {
      return calculatePortfolioBalance(
        tokenBalances ?? [],
        nativeData?.value ?? 0
      );
    }
    return 0;
  }, [tokenBalances, nativeData]);

  console.log({
    portfolioBalance,
    tokenBalances,
    nativeData
  });

  const setWalletAddress = async (provider: any) => {
    try {
      const signer = provider.getSigner();
      if (signer) {
        const web3Address = await signer.getAddress();
        setAddress(web3Address);
        getBalance(provider, web3Address);
      }
    } catch (error) {
      console.log(
        'Account not connected; logged from setWalletAddress function'
      );
    }
  };

  const getBalance = async (provider: any, walletAddress: string) => {
    const walletBalance = await provider.getBalance(walletAddress);
    const balanceInEth = ethers.utils.formatEther(walletBalance);
    setBalance(balanceInEth);
  };

  const disconnectWallet = () => {
    setAddress(undefined);
    web3Modal && web3Modal.clearCachedProvider();
  };

  const checkIfExtensionIsAvailable = () => {
    if (
      (window && window.web3 === undefined) ||
      (window && window.ethereum === undefined)
    ) {
      setError(true);
      web3Modal && web3Modal.toggleModal();
    }
  };

  const connectToWallet = async () => {
    try {
      setLoading(true);
      checkIfExtensionIsAvailable();
      const connection = web3Modal && (await web3Modal.connect());
      const provider = new ethers.providers.Web3Provider(connection);
      await subscribeProvider(connection);

      setWalletAddress(provider);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.log(
        error,
        'got this error on connectToWallet catch block while connecting the wallet'
      );
    }
  };

  const subscribeProvider = async (connection: any) => {
    connection.on('close', () => {
      disconnectWallet();
    });
    connection.on('accountsChanged', async (accounts: string[]) => {
      if (accounts?.length) {
        setAddress(accounts[0]);
        const provider = new ethers.providers.Web3Provider(connection);
        getBalance(provider, accounts[0]);
      } else {
        disconnectWallet();
      }
    });
  };

  return (
    <WalletContext.Provider
      value={{
        address,
        balance,
        loading,
        error,
        tokenBalances,
        nativeData,
        portfolioBalance,
        connectToWallet,
        disconnectWallet,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};
