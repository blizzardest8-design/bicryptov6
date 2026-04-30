"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Countdown } from "@/components/ui/countdown";
import {
  Copy, AlertTriangle, AlertCircle, ChevronLeft, ChevronRight,
  RefreshCw, Clock, DollarSign, QrCode,
} from "lucide-react";
import { toast } from "sonner";
import { QRCodeCanvas } from "qrcode.react";
import { useTranslations } from "next-intl";
import { useDepositStore } from "@/store/finance/deposit-store";
import { useUserStore } from "@/store/user";
import { wsManager, ConnectionStatus } from "@/services/ws-manager";
import {
  fadeInUp, extractAmountValue, copyToClipboard,
  getRequiredConfirmations, getBlockchainExplorerUrl, getEstimatedTime,
} from "./deposit-helpers";

const DEPOSIT_TIME_LIMIT = 30 * 60;

export function EcoDeposit() {
  const t = useTranslations("common");
  const tCommon = useTranslations("common");
  const tExt = useTranslations("ext");
  const tExtAdmin = useTranslations("ext_admin");
  const { user } = useUserStore();

  const {
    step,
    selectedCurrency,
    selectedDepositMethod,
    depositAddress,
    deposit,
    countdownActive,
    depositStartTime,
    setStep,
    setDeposit,
    setCountdownActive,
    unlockDepositAddress,
    shouldShowCountdown,
    handleCountdownExpire,
    reset,
  } = useDepositStore();

  // WebSocket for ECO deposit monitoring
  useEffect(() => {
    if (depositAddress && user?.id && selectedCurrency && selectedDepositMethod) {
      const connectionId = "eco-deposit";
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const isDev = process.env.NODE_ENV === "development";
      const backendPort = process.env.NEXT_PUBLIC_BACKEND_PORT || "4000";
      const host = isDev ? `${window.location.hostname}:${backendPort}` : window.location.host;
      const wsUrl = `${protocol}//${host}/api/ecosystem/deposit?userId=${user.id}`;

      wsManager.connect(wsUrl, connectionId);

      const handleUpdate = (data: any) => {
        const shouldUnlockAddress =
          selectedDepositMethod?.contractType === "NO_PERMIT" && depositAddress?.address;

        // Pending confirmations
        if (data?.type === "pending_confirmation" || data?.confirmations !== undefined) {
          const confirmations = data?.confirmations || 0;
          const required = data?.requiredConfirmations || getRequiredConfirmations(selectedDepositMethod?.chain);
          const txHash = data?.transactionHash || data?.txHash || data?.hash;

          if (confirmations < required) {
            toast.info(
              <div>
                <div>{t("transaction_detected")}</div>
                <div className="text-sm mt-1">{t("confirmations")}: {confirmations}/{required}</div>
                {txHash && (
                  <a
                    href={getBlockchainExplorerUrl(selectedDepositMethod?.chain, txHash)}
                    target="_blank" rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:underline mt-1 inline-block"
                  >
                    {t("view_on_blockchain")}
                  </a>
                )}
              </div>,
              { duration: 10000, id: `pending-tx-${txHash}` }
            );

            setDeposit({
              confirmed: false, status: "PENDING",
              id: data?.transaction?.id || txHash,
              amount: data?.transaction?.amount || data?.trx?.amount || data?.amount,
              currency: data?.currency || selectedCurrency,
              method: data?.method || selectedDepositMethod?.name || selectedDepositMethod?.chain,
              fee: data?.transaction?.fee || data?.trx?.fee || 0,
              balance: data?.balance || data?.wallet?.balance,
              transactionHash: txHash,
              confirmations, requiredConfirmations: required,
              blockNumber: data?.trx?.blockNumber || data?.blockNumber,
              from: data?.trx?.from || data?.from,
              to: data?.trx?.to || data?.to,
              chain: selectedDepositMethod?.chain,
            });
          }
          return;
        }

        switch (data?.status) {
          case 200: case 201: {
            toast.success(data.message || "Deposit confirmed!");
            setDeposit({
              confirmed: true,
              status: data?.transaction?.status || "COMPLETED",
              id: data?.transaction?.id,
              amount: data?.transaction?.amount || data?.trx?.amount,
              currency: data?.currency || selectedCurrency,
              method: data?.method || selectedDepositMethod?.name || selectedDepositMethod?.chain,
              fee: data?.transaction?.fee || data?.trx?.fee || 0,
              balance: data?.balance || data?.wallet?.balance,
              transactionHash: data?.transaction?.trxId || data?.trx?.hash,
              blockNumber: data?.trx?.blockNumber,
              gasUsed: data?.trx?.gasUsed,
              from: data?.trx?.from, to: data?.trx?.to,
              chain: selectedDepositMethod?.chain,
            });
            if (shouldUnlockAddress) {
              unlockDepositAddress(depositAddress.address);
              setCountdownActive(false);
            }
            break;
          }
          case 400: case 401: case 403: case 404: case 500:
            toast.error(data.message || "Deposit failed");
            if (shouldUnlockAddress) {
              unlockDepositAddress(depositAddress.address);
              setCountdownActive(false);
            }
            break;
        }
      };

      wsManager.subscribe("verification", handleUpdate, connectionId);

      const handleStatus = (status: ConnectionStatus) => {
        if (status === ConnectionStatus.CONNECTED) {
          wsManager.sendMessage({
            action: "SUBSCRIBE",
            payload: {
              currency: selectedCurrency,
              chain: selectedDepositMethod?.chain || selectedDepositMethod?.id,
              address: (typeof depositAddress === "string" ? depositAddress : depositAddress?.address)?.toLowerCase(),
            },
          }, connectionId);
        }
      };
      wsManager.addStatusListener(handleStatus, connectionId);

      return () => {
        wsManager.sendMessage({
          action: "UNSUBSCRIBE",
          payload: {
            currency: selectedCurrency,
            chain: selectedDepositMethod?.chain || selectedDepositMethod?.id,
            address: (typeof depositAddress === "string" ? depositAddress : depositAddress?.address)?.toLowerCase(),
          },
        }, connectionId);
        wsManager.unsubscribe("verification", handleUpdate, connectionId);
        wsManager.removeStatusListener(handleStatus, connectionId);
      };
    }
  }, [depositAddress, user?.id, selectedCurrency, selectedDepositMethod]);

  if (step !== 4 || !depositAddress) return null;

  const isPending = deposit?.status === "PENDING" && deposit?.confirmations !== undefined;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div {...fadeInUp}>
        <Card className="border-zinc-200 dark:border-zinc-800">
          <CardHeader className="text-center pb-4">
            <CardTitle className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 justify-center text-xl">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500 text-white text-sm font-semibold">4</span>
              {isPending ? `Processing ${selectedCurrency} Deposit` : `Deposit ${selectedCurrency} to Your Wallet`}
            </CardTitle>
            <p className="text-zinc-600 dark:text-zinc-400 mt-2">
              {isPending
                ? "Your transaction has been detected and is being confirmed on the blockchain."
                : `Send ${selectedCurrency} to the address below. Your deposit will be credited after network confirmation.`}
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {isPending ? (
              <PendingTransactionView
                deposit={deposit}
                selectedCurrency={selectedCurrency}
                selectedDepositMethod={selectedDepositMethod}
                t={t} tExtAdmin={tExtAdmin}
              />
            ) : (
              <AddressDisplay
                depositAddress={depositAddress}
                selectedCurrency={selectedCurrency}
                selectedDepositMethod={selectedDepositMethod}
                t={t}
              />
            )}

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
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-center gap-4">
                  <div className="text-center">
                    <div className="text-sm text-blue-700 dark:text-blue-300 mb-2">{tCommon("time_remaining")}</div>
                    <Countdown
                      initialTimeInSeconds={depositStartTime ? Math.max(0, DEPOSIT_TIME_LIMIT - Math.floor((Date.now() - depositStartTime) / 1000)) : DEPOSIT_TIME_LIMIT}
                      onExpire={handleCountdownExpire}
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
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button variant="outline" onClick={() => setStep(3)} className="flex-1 h-12">
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

function AddressDisplay({ depositAddress, selectedCurrency, selectedDepositMethod, t }: any) {
  return (
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
  );
}

function PendingTransactionView({ deposit, selectedCurrency, selectedDepositMethod, t, tExtAdmin }: any) {
  const required = deposit.requiredConfirmations || getRequiredConfirmations(selectedDepositMethod?.chain);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl p-6 border border-yellow-200 dark:border-yellow-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100">{t("transaction_pending")}</h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">{t("waiting_for_blockchain_confirmations")}</p>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-yellow-800 dark:text-yellow-200">Confirmations</span>
            <span className="font-mono font-semibold text-yellow-900 dark:text-yellow-100">
              {deposit.confirmations} / {required}
            </span>
          </div>
          <div className="relative">
            <div className="w-full bg-yellow-200 dark:bg-yellow-800 rounded-full h-3 overflow-hidden">
              <motion.div
                className="bg-gradient-to-r from-yellow-400 to-orange-400 dark:from-yellow-500 dark:to-orange-500 h-full rounded-full flex items-center justify-end pr-2"
                initial={{ width: "0%" }}
                animate={{ width: `${Math.min(100, (deposit.confirmations / required) * 100)}%` }}
                transition={{ duration: 0.5 }}
              >
                {deposit.confirmations > 0 && <div className="w-2 h-2 bg-white rounded-full animate-pulse" />}
              </motion.div>
            </div>
          </div>
          <p className="text-xs text-yellow-700 dark:text-yellow-300">
            {deposit.confirmations < required
              ? `Your deposit needs ${required - deposit.confirmations} more confirmations`
              : "Processing your deposit..."}
          </p>
        </div>
      </div>

      <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-6 space-y-4">
        <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-500" />{t("transaction_details")}
        </h4>
        <div className="space-y-3">
          {deposit.transactionHash && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">{t("transaction_hash")}</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-zinc-900 dark:text-zinc-100 max-w-[200px] truncate">
                  {deposit.transactionHash}
                </span>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(deposit.transactionHash, toast)} className="h-6 w-6 p-0">
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">Amount</span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">{deposit.amount} {selectedCurrency}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">Network</span>
            <span className="text-sm text-zinc-900 dark:text-zinc-100">{deposit.chain || selectedDepositMethod?.chain}</span>
          </div>
          {deposit.fee !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">{t("network_fee")}</span>
              <span className="text-sm text-zinc-900 dark:text-zinc-100">{deposit.fee} {selectedCurrency}</span>
            </div>
          )}
        </div>
        {deposit.transactionHash && (
          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-700">
            <a
              href={getBlockchainExplorerUrl(deposit.chain || selectedDepositMethod?.chain, deposit.transactionHash)}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            >
              <QrCode className="w-4 h-4" />{tExtAdmin("view_on_blockchain_explorer")}<ChevronRight className="w-4 h-4" />
            </a>
          </div>
        )}
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <p className="font-medium">{t("what_happens_next")}</p>
            <ul className="space-y-1">
              <li>{t("your_transaction_is_being_verified_on_the")} {deposit.chain || selectedDepositMethod?.chain} blockchain</li>
              <li>{t("once")} {required} {t("confirmations_are_reached_your_funds_will")}</li>
              <li>{t("this_usually_takes")} {getEstimatedTime(selectedDepositMethod?.chain)} {t("depending_on_network_congestion")}</li>
              <li>{t("you_can_safely_leave_this_page")}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
