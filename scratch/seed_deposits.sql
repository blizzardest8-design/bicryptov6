INSERT INTO deposit_method (id, title, instructions, fixedFee, percentageFee, minAmount, maxAmount, status, createdAt, updatedAt) 
VALUES 
(UUID(), 'Bitcoin Manual', 'Please send BTC to: bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', 0, 0, 10, 1000000, 1, NOW(), NOW()),
(UUID(), 'Ethereum Manual', 'Please send ETH to: 0x71C7656EC7ab88b098defB751B7401B5f6d8976F', 0, 0, 10, 1000000, 1, NOW(), NOW());
