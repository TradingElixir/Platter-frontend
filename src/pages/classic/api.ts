import axios from 'src/lib/api';

type Payload = {
  wallet: any;
  chain: any;
};

export async function getTokenBalances({ chain, wallet }: Payload) {
  if (!wallet) return [];
  const response = await axios.get('/tokenBalances', {
    params: {
      address: wallet,
      chain: chain,
    },
  });
  return processTokens(response?.data);
}

export async function getNativeData({ chain, wallet }: Payload) {
  const response = await axios.get('http://localhost:8080/nativeBalance', {
    params: {
      address: wallet,
      chain: chain,
    },
  });

  return calculateNativeBalanceAndNativeValue(response?.data);
}

const calculateNativeBalanceAndNativeValue = (response: any) => {
  if (!response || Object.keys(response).length === 0)
    return { balance: '0', value: '0' };
  const { balance = 0, usd = 0 } = response ?? {};
  const nativeBalance = (Number(balance) / 1e18).toFixed(3);
  const nativeValue = ((Number(balance) / 1e18) * Number(usd)).toFixed(2);
  return { balance: nativeBalance, value: nativeValue };
};

function processTokens(tokensList: any[]) {
  if (!Array.isArray(tokensList)) return [];
  const tokens = tokensList.map((token: any) => ({
    ...token,
    bal: (Number(token.balance) / Number(`1E${token.decimals}`)).toFixed(3), //1E18
    val: (
      (Number(token.balance) / Number(`1E${token.decimals}`)) *
      Number(token.usd)
    ).toFixed(2),
  }));
  return tokens;
}

export const formatDigitUptoDecimalPlaces = (
  num: number,
  decimalPlaces = 2
) => {
  if (!num) return '0';
  return num.toLocaleString('en-US', {
    maximumFractionDigits: decimalPlaces,
    minimumFractionDigits: decimalPlaces,
  });
};

export const calculatePortfolioBalance = (tokens: any[], nativeValue: string) => tokens.length === 0 ? '$' + formatDigitUptoDecimalPlaces(+nativeValue, 2) :
  '$' +
  formatDigitUptoDecimalPlaces(
    tokens.reduce((acc, current, index) => {
      if (index === tokens.length - 1) {
        return acc + Number(current?.val) + Number(nativeValue);
      }
      return acc + Number(current?.val);
    }, 0),
    2
  );
