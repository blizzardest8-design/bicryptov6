-- Disable all ecosystem tokens first
UPDATE ecosystem_token SET status = 0;

-- Enable the most important/traded tokens
UPDATE ecosystem_token SET status = 1 WHERE currency IN (
    'BTC', 'ETH', 'USDT', 'USDC', 'BNB', 'SOL', 'ADA', 'XRP', 'DOT', 'DOGE', 'LTC', 'MATIC', 'TRX', 'LINK', 'UNI', 'AVAX'
);

-- Ensure their status is explicitly '1' (in case some use boolean-like strings)
UPDATE ecosystem_token SET status = 1 WHERE status = '1' OR status = true;
