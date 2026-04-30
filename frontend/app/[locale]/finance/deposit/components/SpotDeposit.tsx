"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader } from "@/components/ui/loader";
import { Countdown } from "@/components/ui/countdown";
import {
  Copy, CheckCircle, AlertTriangle, ChevronLeft, RefreshCw, Clock,
} from "lucide-react";
import { toast } from "sonner";
import { QRCodeCanvas } from "qrcode.react";
import { useTranslations } from "next-intl";
import { useDepositStore } from "@/store/finance/deposit-store";
import { useUserStore } from "@/store/user";
import { wsManager, ConnectionStatus } from "@/services/ws-manager";
import {
  fadeInUp, extractAmountValue, copyToClipboard,
} from "./deposit-helpers";

const DEPOSIT_TIME_LIMIT = 30 * 60;

export function SpotDeposit() {
  const t = useTranslations("common");
  const tExt = useTranslations("ext");
  const tExtAdmin = useTranslations("ext_admin");
  const tComponentsBlocks = useTranslations("components_blocks");
  const { user } = useUserStore();

  const {
    step,
    selectedCurrency,
    selectedDepositMethod,
    depositAddress,
    transactionHash,
    transactionSent,
    loading,
    deposit,
    countdownActive,
    depositStartTime,
    setStep,
    setDeposit,
    setCountdownActive,
    setTransactionHash,
    shouldShowCountdown,
    handleCountdownExpire,
    sendTransactionHash,
    reset,
  } = useDepositStore();

  // WebSocket for SPOT deposit monitoring
  useEffect(() => {
    if (
      transactionSent &&
      transactionHash &&
      user?.id &&
      selectedCurrency &&
      selectedDepositMethod
    ) {
      const connectionId = "spot-deposit";
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const isDev = process.env.NODE_ENV === "development";
      const backendPort = process.env.NEXT_PUBLIC_BACKEND_PORT || "4000";
      const host = isDev ? `${window.location.hostname}:${backendPort}` : window.location.host;
      const wsUrl = `${protocol}//${host}/api/finance/deposit/spot?userId=${user.id}`;

      wsManager.connect(wsUrl, connectionId);

      const handleUpdate = (data: any) => {
        switch (data?.status) {
          case 200:
          case 201: {
            toast.success(data.message || "Deposit confirmed!");
            setDeposit({
              confirmed: true,
              status: data?.transaction?.status || "COMPLETED",
              id: data?.transaction?.id,
              amount: data?.transaction?.amount,
              currency: data?.currency || selectedCurrency,
              method: data?.method || "Wallet Transfer",
              fee: data?.transaction?.fee || 0,
              balance: data?.balance,
              transactionHash,
              chain: data?.chain,
            });
            setCountdownActive(false);
            break;
          }
          case 400: case 401: case 403: case 404: case 500:
            toast.error(data.message || "Deposit failed");
            setCountdownActive(false);
            break;
        }
      };

      wsManager.subscribe("verification", handleUpdate, connectionId);

      const handleStatus = (status: ConnectionStatus) => {
        if (status === ConnectionStatus.CONNECTED) {
          wsManager.sendMessage({
            action: "SUBSCRIBE",
            payload: { trx: transactionHash },
          }, connectionId);
        }
      };
      wsManager.addStatusListener(handleStatus, connectionId);

      return () => {
        wsManager.unsubscribe("verification", handleUpdate, connectionId);
        wsManager.removeStatusListener(handleStatus, connectionId);
        wsManager.close(connectionId);
      };
    }
  }, [transactionSent, transactionHash, user?.id, selectedCurrency, selectedDepositMethod]);

  // Prevent page navigation when monitoring
  useEffect(() => {
    if (transactionSent && !deposit?.confirmed) {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = "Your deposit is being processed. Are you sure you want to leave?";
        return e.returnValue;
      };
      const handlePopState = (e: PopStateEvent) => {
        if (!confirm("Your deposit is being processed. Are you sure you want to leave?")) {
          e.preventDefault();
          window.history.pushState(null, "", window.location.href);
        }
      };
      window.addEventListener("beforeunload", handleBeforeUnload);
      window.addEventListener("popstate", handlePopState);
      window.history.pushState(null, "", window.location.href);
      return () => {
        window.removeEventListener("beforeunload", handleBeforeUnload);
        window.removeEventListener("popstate", handlePopState);
      };
    }
  }, [transactionSent, deposit?.confirmed]);

  // Step 5: Monitoring after hash submitted
  if (step === 5 && transactionSent) {
    return (
      <AnimatePresence>
        <motion.div {...fadeInUp}>
          <Card className="w-full max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <Clock className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <CardTitle className="text-blue-600 dark:text-blue-400">
                {t("monitoring_your_deposit")}
              </CardTitle>
              <p className="text-zinc-600 dark:text-zinc-400 mt-2">
                {t("were_monitoring_the_your_transaction")}
              </p>
              <p className="text-zinc-600 dark:text-zinc-400">
                {t("youll_be_notified_is_confirmed")}
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">{t("transaction_hash")}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-zinc-900 dark:text-zinc-100">
                      {transactionHash.slice(0, 16)}...
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(transactionHash, toast)} className="h-8 w-8 p-0">
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">{t("currency")}</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">{selectedCurrency}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">{t("network")}</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {selectedDepositMethod?.chain || selectedDepositMethod?.id}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">{t("status")}</span>
                  <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                    {t("pending_confirmation")}
                  </Badge>
                </div>
              </div>

              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="w-12 h-12 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin"></div>
                </div>
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100 mb-2">{t("please_wait")}</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {t("deposit_confirmation_can_network_congestion")}
                  </p>
                </div>
              </div>

              {shouldShowCountdown() && countdownActive && (
                <CountdownTimer depositStartTime={depositStartTime} onExpire={handleCountdownExpire} t={t} />
              )}

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={reset} className="flex-1 h-12">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {t("new_deposit")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Step 4: Address display + tx hash input
  if (step !== 4 || !depositAddress) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div {...fadeInUp}>
        <Card className="border-zinc-200 dark:border-zinc-800">
          <CardHeader className="text-center pb-4">
            <CardTitle className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 justify-center text-xl">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500 text-white text-sm font-semibold">4</span>
              {`Deposit ${selectedCurrency} to Your Wallet`}
            </CardTitle>
            <p className="text-zinc-600 dark:text-zinc-400 mt-2">
              {`Send ${selectedCurrency} to the address below. Your deposit will be credited after network confirmation.`}
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Address display */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">{t("scan_qr_code")}</h3>
                  <div className="flex justify-center">
                    <div className="bg-white p-6 rounded-2xl shadow-lg border">
                      <QRCodeCanvas
                        value={depositAddress?.address || depositAddress}
                        size={256} level="M" includeMargin bgColor="#FFFFFF" fgColor="#000000"
                      />
                    </div>
                  </div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-3">{t("scan_with_your_crypto_wallet_app")}</p>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">{t("deposit_address")}</h3>
                <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4 space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{selectedCurrency} Address</label>
                    <div className="relative">
                      <div className="font-mono text-sm bg-white dark:bg-zinc-900 p-4 rounded-lg border break-all pr-12">
                        {depositAddress?.address || depositAddress}
                      </div>
                      <Button
                        variant="ghost" size="sm"
                        onClick={() => copyToClipboard(depositAddress?.address || depositAddress, toast)}
                        className="absolute right-2 top-2 h-8 w-8 p-0 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-zinc-200 dark:border-zinc-700">
                    <div>
                      <span className="text-sm text-zinc-600 dark:text-zinc-400">Network</span>
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">
                        {depositAddress?.network || selectedDepositMethod?.chain}
                      </div>
                    </div>
                    {depositAddress?.balance !== undefined && (
                      <div>
                        <span className="text-sm text-zinc-600 dark:text-zinc-400">{t("current_balance")}</span>
                        <div className="font-medium text-zinc-900 dark:text-zinc-100">
                          {depositAddress.balance} {selectedCurrency}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Important info */}
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl p-6 border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-3">{t("important_information")}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-yellow-800 dark:text-yellow-200">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-yellow-600 dark:bg-yellow-400 rounded-full"></div>
                        <span>{t("only_send")} <strong>{selectedCurrency}</strong> {t("to_this_address")}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-yellow-600 dark:bg-yellow-400 rounded-full"></div>
                        <span>{t("network")}: <strong>{depositAddress?.network || selectedDepositMethod?.chain}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-yellow-600 dark:bg-yellow-400 rounded-full"></div>
                        <span>{tExt("minimum")}: <strong>{extractAmountValue(selectedDepositMethod?.limits?.deposit?.min, selectedCurrency)} {selectedCurrency}</strong></span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {shouldShowCountdown() && (
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                          <span>{t("this_address_expires_in")} <strong>{`30 ${t('minutes')}`}</strong></span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-yellow-600 dark:bg-yellow-400 rounded-full"></div>
                        <span>{t("deposits_are_credited_after_network_confirmation")}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-yellow-600 dark:bg-yellow-400 rounded-full"></div>
                        <span>{t("do_not_send_from_exchange_accounts")}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {shouldShowCountdown() && countdownActive && (
              <CountdownTimer depositStartTime={depositStartTime} onExpire={handleCountdownExpire} t={t} />
            )}

            {/* Transaction hash input */}
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 border border-red-200 dark:border-red-800">
              <div className="flex items-start gap-3 mb-4">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-red-900 dark:text-red-100 mb-2">{t("transaction_hash_required")}</h4>
                  <div className="text-sm text-red-800 dark:text-red-200 space-y-1">
                    <p><strong>{tExtAdmin("critical")}</strong> {t("your_deposit_will_transaction_hash")}</p>
                    <p>{t("this_is_mandatory_for_all_spot_deposits")}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 border">
                  <h5 className="font-medium text-zinc-900 dark:text-zinc-100 mb-3">
                    {t("after_sending_your")} {selectedCurrency} {t("to_the_deposit_your_wallet")}
                  </h5>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                    {t("without_this_your_and_processed")}
                  </p>
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      {t("transaction_hash")} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Input
                        type="text"
                        value={transactionHash}
                        onChange={(e) => setTransactionHash(e.target.value)}
                        placeholder="0x..."
                        className="font-mono text-sm pr-20"
                        disabled={loading || transactionSent}
                      />
                      {transactionHash && (
                        <Button
                          variant="ghost" size="sm"
                          onClick={() => setTransactionHash("")}
                          className="absolute right-2 top-2 h-8 w-8 p-0"
                          disabled={loading || transactionSent}
                        >
                          ×
                        </Button>
                      )}
                    </div>
                    <Button
                      onClick={sendTransactionHash}
                      disabled={!transactionHash || loading || transactionSent}
                      className="w-full h-12 bg-green-600 hover:bg-green-700 text-white"
                    >
                      {loading ? (
                        <><Loader className="w-4 h-4 mr-2 animate-spin" />{t("submitting")}</>
                      ) : (
                        <><CheckCircle className="w-4 h-4 mr-2" />{t("submit_transaction_hash")}</>
                      )}
                    </Button>
                  </div>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium mb-2">
                    {t("deposit_will_need_transaction_hash")}
                  </p>
                  <div className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                    <p className="font-medium">{t("how_to_find_your_transaction_hash")}</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>{t("check_your_wallets_transaction_history")}</li>
                      <li>{t("look_for_the_recent")} {selectedCurrency} {t("transaction")}</li>
                      <li>{t("copy_the_hash_starting_with_0x")}</li>
                      <li>{t("paste_it_in_the_field_above")}</li>
                    </ul>
                    <p className="font-medium mt-2">{t("you_must_submit_your_deposit")}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button variant="outline" onClick={() => setStep(3)} className="flex-1 h-12" disabled={transactionSent}>
                <ChevronLeft className="w-4 h-4 mr-2" />{t("back_to_networks")}
              </Button>
              <Button onClick={reset} className="flex-1 h-12">
                <RefreshCw className="w-4 h-4 mr-2" />{t("new_deposit")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

function CountdownTimer({ depositStartTime, onExpire, t }: { depositStartTime: number | null; onExpire: () => void; t: any }) {
  const tCommon = useTranslations("common");
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
      <div className="flex items-center justify-center gap-4">
        <div className="text-center">
          <div className="text-sm text-blue-700 dark:text-blue-300 mb-2">{tCommon("time_remaining")}</div>
          <Countdown
            initialTimeInSeconds={depositStartTime ? Math.max(0, DEPOSIT_TIME_LIMIT - Math.floor((Date.now() - depositStartTime) / 1000)) : DEPOSIT_TIME_LIMIT}
            onExpire={onExpire}
            className="text-3xl font-mono font-bold text-blue-600 dark:text-blue-400"
          />
        </div>
        <div className="w-16 h-16 relative">
          <div className="w-full h-full bg-blue-200 dark:bg-blue-800 rounded-full"></div>
          <div className="absolute inset-2 bg-blue-50 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      </div>
    </div>
  );
}
