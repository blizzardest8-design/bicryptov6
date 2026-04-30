-- PHASE 2 ROLLBACK — restores the empty state of every table phase 2 touched.
  -- Run this from Railway → MySQL → Data → Query if you need to undo phase 2.
  START TRANSACTION;
  DELETE FROM binary_market;
  DELETE FROM binary_duration;
  DELETE FROM settings WHERE `key`='binarySettings';
  DELETE FROM futures_market;
  DELETE FROM investment_plan_duration;
  DELETE FROM investment_plan;
  DELETE FROM investment_duration;
  DELETE FROM ai_investment_plan_duration;
  DELETE FROM ai_investment_plan;
  DELETE FROM ai_investment_duration;
  DELETE FROM forex_plan_duration;
  DELETE FROM forex_plan;
  DELETE FROM forex_duration;
  DELETE FROM staking_pools;
  DELETE FROM p2p_payment_methods WHERE isGlobal=1;
  DELETE FROM nft_category;
  DELETE FROM ecommerce_category;
  COMMIT;
  -- end of phase 2 rollback
  