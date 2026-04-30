SELECT table_name, update_time FROM information_schema.tables WHERE table_schema = 'v4' ORDER BY update_time DESC LIMIT 10;
