"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Coins, Landmark } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  fadeInUp,
  extractFeeValue,
  extractAmountValue,
  getNetworkDisplayName,
  getNetworkSubtitle,
} from "./deposit-helpers";

interface DepositMethodSelectorProps {
  walletType: string;
  selectedCurrency: string;
  depositMethods: any;
  selectedDepositMethod: any;
  loading: boolean;
  onMethodSelect: (method: any) => void;
}

export function DepositMethodSelector({
  walletType,
  selectedCurrency,
  depositMethods,
  selectedDepositMethod,
  loading,
  onMethodSelect,
}: DepositMethodSelectorProps) {
  const t = useTranslations("common");
  const tExtAdmin = useTranslations("ext_admin");
  const tExtGateway = useTranslations("ext_gateway");

  // Loading skeleton
  if (loading && (!depositMethods || (Array.isArray(depositMethods) && depositMethods.length === 0))) {
    return (
      <motion.div {...fadeInUp}>
        <Card className="border-zinc-200 dark:border-zinc-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-sm font-semibold">
                3
              </span>
              {t("select_deposit_method")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
              {walletType === "FIAT" ? "Loading Payment Methods..." : "Loading Blockchain Networks..."}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="p-4 rounded-xl border-2 border-zinc-200 dark:border-zinc-700 animate-pulse">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-full bg-zinc-200 dark:bg-zinc-700">
                        <div className="h-4 w-4 bg-zinc-300 dark:bg-zinc-600 rounded"></div>
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-24"></div>
                        <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-16"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mt-6">
              <div className="flex items-center justify-center space-x-2 text-zinc-600 dark:text-zinc-400">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <span className="text-sm">
                  {walletType === "FIAT" ? "Loading payment methods..." : "Loading blockchain networks..."}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (!depositMethods) return null;

  return (
    <motion.div {...fadeInUp}>
      <Card className="border-zinc-200 dark:border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-sm font-semibold">
              3
            </span>
            {t("select_deposit_method")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* FIAT: Payment Gateways */}
          {walletType === "FIAT" &&
            (depositMethods as any)?.gateways?.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                  {t("payment_gateways")}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(depositMethods as any).gateways.map((gateway: any) => (
                    <MethodCard
                      key={gateway.id}
                      method={gateway}
                      isSelected={selectedDepositMethod?.id === gateway.id}
                      selectedCurrency={selectedCurrency}
                      onSelect={() => onMethodSelect(gateway)}
                      extractFeeValue={extractFeeValue}
                      extractAmountValue={extractAmountValue}
                      tExtGateway={tExtGateway}
                      tExtAdmin={tExtAdmin}
                      t={t}
                    />
                  ))}
                </div>
              </div>
            )}

          {/* FIAT: Manual Methods */}
          {walletType === "FIAT" &&
            (depositMethods as any)?.methods?.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                  {t("manual_transfer_methods")}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(depositMethods as any).methods.map((method: any) => (
                    <ManualMethodCard
                      key={method.id}
                      method={method}
                      isSelected={selectedDepositMethod?.id === method.id}
                      selectedCurrency={selectedCurrency}
                      onSelect={() => onMethodSelect(method)}
                      extractFeeValue={extractFeeValue}
                      extractAmountValue={extractAmountValue}
                      tExtGateway={tExtGateway}
                      tExtAdmin={tExtAdmin}
                      t={t}
                    />
                  ))}
                </div>
              </div>
            )}

          {/* SPOT/ECO: Blockchain Networks */}
          {(walletType === "SPOT" || walletType === "ECO") &&
            Array.isArray(depositMethods) &&
            depositMethods.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                  {t("select_blockchain_network")}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {depositMethods.map((chain: any) => (
                    <motion.button
                      key={chain.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onMethodSelect(chain)}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        selectedDepositMethod?.id === chain.id
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                          : "border-zinc-200 dark:border-zinc-700 hover:border-blue-400/50"
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-full ${
                            selectedDepositMethod?.id === chain.id
                              ? "bg-blue-500 text-white"
                              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                          }`}>
                            <Coins className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">
                              {getNetworkDisplayName(chain)}
                            </h4>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                              {getNetworkSubtitle(chain, selectedCurrency)}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-zinc-600 dark:text-zinc-400">{t("network_fee")}</span>
                            <span className="font-medium text-orange-600 dark:text-orange-400">
                              {(() => {
                                if (!chain.fee) return `0 ${selectedCurrency}`;
                                if (typeof chain.fee === "object") {
                                  return `${chain.fee?.percentage || chain.fee?.min || 0}%`;
                                }
                                return `${chain.fee} ${selectedCurrency}`;
                              })()}
                            </span>
                          </div>
                          {(chain.limits?.withdraw?.min || chain.limits?.deposit?.min) && (
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-zinc-600 dark:text-zinc-400">{t("min_amount")}</span>
                              <span className="font-medium">
                                {extractAmountValue(
                                  chain.limits?.withdraw?.min || chain.limits?.deposit?.min,
                                  selectedCurrency
                                )} {selectedCurrency}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Gateway card sub-component
function MethodCard({ method, isSelected, selectedCurrency, onSelect, extractFeeValue, extractAmountValue, tExtGateway, tExtAdmin, t }: any) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={`p-6 rounded-xl border-2 transition-all text-left ${
        isSelected
          ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
          : "border-zinc-200 dark:border-zinc-700 hover:border-blue-400/50"
      }`}
    >
      <div className="flex items-start space-x-4">
        {method.image && (
          <img src={method.image} alt={method.title} className="w-12 h-12 object-contain rounded" />
        )}
        <div className="flex-1">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
            {typeof method.title === 'string' ? method.title : (method.name || 'Payment Gateway')}
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            {(() => {
              if (typeof method.description === 'string') return method.description;
              if (typeof method.description === 'object' && method.description !== null) {
                if (method.description[selectedCurrency]) return method.description[selectedCurrency];
                return `${method.title} payment gateway`;
              }
              return method.title ? `${method.title} payment gateway` : "Payment gateway";
            })()}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-xs">
              {(() => {
                try {
                  const fixed = extractFeeValue(method.fixedFee, selectedCurrency);
                  const pct = extractFeeValue(method.percentageFee, selectedCurrency);
                  return `${fixed} + ${pct}% ${t("fee")}`;
                } catch { return `${t("fee")} ${tExtGateway("not_available")}`; }
              })()}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {(() => {
                try {
                  const min = extractAmountValue(method.minAmount, selectedCurrency);
                  const max = extractAmountValue(method.maxAmount, selectedCurrency);
                  return `${min} - ${max || "∞"} ${selectedCurrency}`;
                } catch { return `${tExtAdmin("amount_range")} ${tExtGateway("not_available")}`; }
              })()}
            </Badge>
          </div>
        </div>
      </div>
    </motion.button>
  );
}

// Manual method card sub-component
function ManualMethodCard({ method, isSelected, selectedCurrency, onSelect, extractFeeValue, extractAmountValue, tExtGateway, tExtAdmin, t }: any) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={`p-6 rounded-xl border-2 transition-all text-left ${
        isSelected
          ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
          : "border-zinc-200 dark:border-zinc-700 hover:border-blue-400/50"
      }`}
    >
      <div className="flex items-start space-x-4">
        {method.image ? (
          <img src={method.image} alt={method.title} className="w-12 h-12 object-contain rounded" />
        ) : (
          <div className={`p-3 rounded-full ${
            isSelected ? "bg-blue-500 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
          }`}>
            <Landmark className="h-5 w-5" />
          </div>
        )}
        <div className="flex-1">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
            {typeof method.title === 'string' ? method.title : (method.name || 'Payment Method')}
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            {typeof method.description === 'string'
              ? method.description
              : typeof method.description === 'object' && method.description !== null
                ? JSON.stringify(method.description)
                : "Manual transfer method"}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-xs">
              {(() => {
                try {
                  const fixed = extractFeeValue(method.fixedFee, selectedCurrency);
                  const pct = extractFeeValue(method.percentageFee, selectedCurrency);
                  return `${fixed} + ${pct}% ${t("fee")}`;
                } catch { return `${t("fee")} ${tExtGateway("not_available")}`; }
              })()}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {(() => {
                try {
                  const min = extractAmountValue(method.minAmount, selectedCurrency);
                  const max = extractAmountValue(method.maxAmount, selectedCurrency);
                  return `${min} - ${max || "∞"} ${selectedCurrency}`;
                } catch { return `${tExtAdmin("amount_range")} ${tExtGateway("not_available")}`; }
              })()}
            </Badge>
          </div>
        </div>
      </div>
    </motion.button>
  );
}
