export const formatMoney = (
  amount,
  currencyCode = 'PLN',
  preserveSign = false
) => {
  const numericAmount = parseFloat(amount);
  const amountToFormat = preserveSign ? numericAmount : Math.abs(numericAmount);

  const value = new Intl.NumberFormat('pl-PL', {
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(amountToFormat);

  const code = (currencyCode || 'PLN').toUpperCase();

  const formats = {
    PLN: `${value} zł`,
    EUR: `${value} €`,
    USD: `$${value}`,
    GBP: `£${value}`,
    JPY: `¥${value}`,
    CNY: `¥${value}`,
    INR: `₹${value}`,
    KRW: `₩${value}`,
    RUB: `₽${value}`,
    BRL: `R$${value}`,
    CAD: `C$${value}`,
    AUD: `A$${value}`,
    CHF: `CHF ${value}`,
    SEK: `${value} kr`,
    NOK: `${value} kr`,
    DKK: `${value} kr`,
    ZAR: `R ${value}`,
    SGD: `S$${value}`,
    HKD: `HK$${value}`,
    NZD: `NZ$${value}`,
    MXN: `$${value} MXN`,
    TRY: `${value} ₺`,
    CZK: `${value} Kč`,
    THB: `฿${value}`,
    HUF: `${value} Ft`,
    UAH: `${value} ₴`,
    ISK: `${value} kr`,
    RON: `${value} lei`,
    ILS: `₪${value}`,
    CLP: `$${value} CLP`,
    PHP: `₱${value}`,
    MYR: `RM${value}`,
    IDR: `Rp ${value}`,
    XDR: `${value} SDR`,
  };

  return formats[code] || `${value} ${code}`;
};
