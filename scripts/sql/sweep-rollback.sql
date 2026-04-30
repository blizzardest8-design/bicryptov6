-- ROLLBACK SCRIPT — generated 2026-04-30T21:15:56.816Z
  -- Restores the railway DB to the exact state it was in BEFORE running sweep-forward.sql.
  -- Paste into Railway → MySQL plugin → Data → Query and run if you need to undo.
  -- Safe to re-run.

  START TRANSACTION;

  -- restore extension.status
  UPDATE extension SET status=0 WHERE id='07001dca-4535-4ea8-86d2-ab420d469729';
UPDATE extension SET status=0 WHERE id='0b28503d-89e5-42d4-848e-b897a439c6a2';
UPDATE extension SET status=0 WHERE id='1facdb6a-4909-4f70-89fd-b388891e2589';
UPDATE extension SET status=0 WHERE id='4084d90a-dea9-4e51-80b1-0feb17bce164';
UPDATE extension SET status=0 WHERE id='489085af-8af1-4fbc-97ba-97c223bbd689';
UPDATE extension SET status=0 WHERE id='566ba2a0-1ad2-4904-8c9c-7981067beb79';
UPDATE extension SET status=0 WHERE id='5b801a7b-8831-4f34-b3cf-03eb13f08d17';
UPDATE extension SET status=0 WHERE id='6c083ad0-d5e9-46d7-9ec1-b531433217a8';
UPDATE extension SET status=0 WHERE id='758357b5-916f-49e0-b697-d84e33300c49';
UPDATE extension SET status=0 WHERE id='7affa682-068e-4da4-830d-419f53afc366';
UPDATE extension SET status=0 WHERE id='7cb1e87a-f78a-4cc0-953f-265b0f74ee5f';
UPDATE extension SET status=0 WHERE id='ab0f8067-9825-40b9-9168-cbca83a95446';
UPDATE extension SET status=0 WHERE id='b0cf450b-4a9b-478a-8bca-e93f45eb3d9b';
UPDATE extension SET status=0 WHERE id='b44a89c5-eef7-461d-80e1-7871ee66c670';
UPDATE extension SET status=0 WHERE id='b61b92a7-ef82-4159-84a3-0a44920cd6c1';
UPDATE extension SET status=0 WHERE id='c2a359ef-e844-4750-8fd6-306e5b3239fc';
UPDATE extension SET status=0 WHERE id='c6c76908-89b9-4c93-a296-b53b249b5324';
UPDATE extension SET status=0 WHERE id='e88b6318-d958-498a-bcb2-a677b0550499';
UPDATE extension SET status=0 WHERE id='f0b8e501-3ad4-4697-bae3-b32c493601d3';

-- restore exchange.status
UPDATE exchange SET status=0 WHERE id='1d771aa1-7598-4932-bfb3-5952246333d4';
UPDATE exchange SET status=0 WHERE id='cba407c3-dfc3-4b49-8456-f6a04e83cb9f';
UPDATE exchange SET status=0 WHERE id='cf45a9d7-2210-4300-b266-7c4979e894ab';

-- restore deposit_gateway.status
UPDATE deposit_gateway SET status=0 WHERE id='2checkout';
UPDATE deposit_gateway SET status=0 WHERE id='4b120597-a6d4-4844-8e53-b61aa950c0eb';
UPDATE deposit_gateway SET status=0 WHERE id='520dd572-3523-4876-b392-3542734021f9';
UPDATE deposit_gateway SET status=0 WHERE id='adyen';
UPDATE deposit_gateway SET status=0 WHERE id='authorizenet';
UPDATE deposit_gateway SET status=0 WHERE id='dlocal';
UPDATE deposit_gateway SET status=0 WHERE id='eway';
UPDATE deposit_gateway SET status=0 WHERE id='ipay88';
UPDATE deposit_gateway SET status=0 WHERE id='klarna';
UPDATE deposit_gateway SET status=0 WHERE id='mollie';
UPDATE deposit_gateway SET status=0 WHERE id='payfast';
UPDATE deposit_gateway SET status=0 WHERE id='paypal';
UPDATE deposit_gateway SET status=0 WHERE id='paysafe';
UPDATE deposit_gateway SET status=0 WHERE id='paystack';
UPDATE deposit_gateway SET status=0 WHERE id='stripe';

-- restore currency.status (only the rows the forward script touches)
UPDATE currency SET status=0 WHERE id='USD';
UPDATE currency SET status=0 WHERE id='EUR';
UPDATE currency SET status=0 WHERE id='GBP';
UPDATE currency SET status=0 WHERE id='JPY';
UPDATE currency SET status=0 WHERE id='AUD';

-- wipe the rows we INSERTed (these tables had 0 rows before)
DELETE FROM exchange_market;
DELETE FROM exchange_currency;
DELETE FROM settings;

COMMIT;
-- end of rollback
