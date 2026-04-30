"use client";

import { useEffect, useRef } from "react";
import { useDepositStore } from "@/store/finance/deposit-store";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useConfigStore } from "@/store/config";
import { useSearchParams } from "next/navigation";
import { wsManager } from "@/services/ws-manager";
import { useTranslations } from "next-intl";
import { fadeInUp } from "./components/deposit-helpers";

// Components
import { WalletTypeSelector } from "./components/WalletTypeSelector";
import { CurrencySelector } from "./components/CurrencySelector";
import { DepositMethodSelector } from "./components/DepositMethodSelector";
import { FiatDeposit } from "./components/FiatDeposit";
import { SpotDeposit } from "./components/SpotDeposit";
import { EcoDeposit } from "./components/EcoDeposit";
import { DepositSuccess } from "./components/DepositSuccess";
import { DepositError } from "./components/DepositError";


export function DepositForm() {
  const t = useTranslations("common");
  const tComponentsBlocks = useTranslations("components_blocks");
  const searchParams = useSearchParams();
  const initialType = searchParams?.get("type");
  const initialCurrency = searchParams?.get("currency");
  const { settings, extensions } = useConfigStore();

  const isSpotEnabled = settings?.spotWallets === true || settings?.spotWallets === "true";
  const isFiatEnabled = settings?.fiatWallets === true || settings?.fiatWallets === "true";
  const isEcosystemEnabled = extensions?.includes("ecosystem");

  const {
    step,
    selectedWalletType,
    selectedCurrency,
    selectedDepositMethod,
    depositAddress,
    currencies,
    depositMethods,
    loading,
    error,
    deposit,
    countdownActive,
    setStep,
    setSelectedWalletType,
    setSelectedCurrency,
    setSelectedDepositMethod,
    setDepositAmount,
    setDeposit,
    setError,
    fetchCurrencies,
    fetchDepositMethods,
    fetchDepositAddress,
    unlockDepositAddress,
    setTransactionHash,
    setCountdownActive,
    retryFetchDepositAddress,
    reset,
  } = useDepositStore();

  // Track previous wallet/method for ECO address unlocking
  const prevWalletRef = useRef({
    walletType: selectedWalletType?.value,
    currency: selectedCurrency,
    method: selectedDepositMethod?.id,
    address: depositAddress?.address,
    countdownActive,
  });

  // Initialize
  useEffect(() => {
    reset();
    if (initialType) {
      const walletType = {
        value: initialType.toUpperCase(),
        label: initialType.charAt(0).toUpperCase() + initialType.slice(1).toLowerCase(),
      };
      setSelectedWalletType(walletType);
      if (initialCurrency) setSelectedCurrency(initialCurrency);
    }
  }, []);

  // Fetch currencies on wallet type change
  useEffect(() => {
    if (selectedWalletType) fetchCurrencies();
  }, [selectedWalletType]);

  // Fetch deposit methods on currency change
  useEffect(() => {
    if (selectedWalletType && selectedCurrency) fetchDepositMethods();
  }, [selectedWalletType, selectedCurrency]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      wsManager.close("eco-deposit");
      wsManager.close("spot-deposit");
      const state = useDepositStore.getState();
      if (
        state.selectedWalletType?.value === "ECO" &&
        state.selectedDepositMethod?.contractType === "NO_PERMIT" &&
        state.depositAddress?.address &&
        state.countdownActive
      ) {
        state.unlockDepositAddress(state.depositAddress.address);
      }
    };
  }, []);

  // Handle wallet/method changes - unlock ECO address when switching
  useEffect(() => {
    const prev = prevWalletRef.current;
    const current = {
      walletType: selectedWalletType?.value,
      currency: selectedCurrency,
      method: selectedDepositMethod?.id,
      address: depositAddress?.address,
      countdownActive,
    };

    if (
      prev.walletType === "ECO" &&
      selectedDepositMethod?.contractType === "NO_PERMIT" &&
      prev.address &&
      prev.countdownActive &&
      (current.walletType !== prev.walletType ||
        current.currency !== prev.currency ||
        current.method !== prev.method)
    ) {
      unlockDepositAddress(prev.address);
      setCountdownActive(false);
    }
    prevWalletRef.current = current;
  }, [selectedWalletType, selectedCurrency, selectedDepositMethod, depositAddress, countdownActive]);

  // Event handlers
  const handleWalletSelect = (walletType: any) => {
    if (selectedWalletType && selectedWalletType.value !== walletType.value) {
      wsManager.close("eco-deposit");
      reset();
    }
    setSelectedWalletType(walletType);
  };

  const handleCurrencySelect = (currency: string) => {
    setSelectedCurrency(currency);
    setSelectedDepositMethod(null);
    setDepositAmount(0);
    setTransactionHash("");
    setDeposit(null);
    setError(null);
    setStep(3);
  };

  const handleMethodSelect = async (method: any) => {
    // Unsubscribe from previous ECO WebSocket if switching
    if (
      selectedWalletType?.value === "ECO" &&
      selectedDepositMethod &&
      depositAddress &&
      (selectedDepositMethod.chain !== method.chain || selectedDepositMethod.id !== method.id)
    ) {
      wsManager.sendMessage({
        action: "UNSUBSCRIBE",
        payload: {
          currency: selectedCurrency,
          chain: selectedDepositMethod?.chain || selectedDepositMethod?.id,
          address: (typeof depositAddress === "string" ? depositAddress : depositAddress?.address)?.toLowerCase(),
        },
      }, "eco-deposit");
    }

    setSelectedDepositMethod(method);

    // For SPOT/ECO, fetch deposit address immediately
    if (selectedWalletType?.value === "SPOT" || selectedWalletType?.value === "ECO") {
      try {
        const result = await fetchDepositAddress();
        if (!result.success) {
          toast.error(result.error || "Failed to generate deposit address");
        } else {
          setStep(4);
        }
      } catch {
        toast.error("Failed to generate deposit address");
      }
    } else {
      // FIAT goes to amount input
      setStep(4);
    }
  };

  // Available wallets
  const availableWallets = [
    ...(isFiatEnabled ? [{ value: "FIAT", label: "Fiat" }] : []),
    ...(isSpotEnabled ? [{ value: "SPOT", label: "Spot" }] : []),
    ...(isEcosystemEnabled ? [{ value: "ECO", label: "Eco" }] : []),
  ];

  // --- Render priority states (full-screen takeovers) ---

  // Deposit confirmed (ECO/SPOT crypto success)
  if (deposit?.confirmed) {
    return (
      <DepositSuccess
        deposit={deposit}
        selectedCurrency={selectedCurrency}
        selectedWalletType={selectedWalletType}
        onReset={() => { setDeposit(null); reset(); }}
      />
    );
  }

  // Error state
  if (error) {
    return (
      <DepositError
        error={error}
        onRetry={() => { setError(null); setDeposit(null); setStep(1); }}
        onCancel={() => { setError(null); setDeposit(null); }}
      />
    );
  }

  // --- Wallet-type-specific deposit flows (steps 4-6) ---

  // FIAT deposit flow (amount input, gateway buttons, manual form, manual success)
  if (selectedWalletType?.value === "FIAT" && (step === 4 || step === 5 || step === 6)) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <DepositPageHeader />
        <ErrorAlert error={error} selectedWalletType={selectedWalletType} loading={loading} retryFetchDepositAddress={retryFetchDepositAddress} t={t} tComponentsBlocks={tComponentsBlocks} />
        <FiatDeposit />
      </div>
    );
  }

  // SPOT deposit flow (address + tx hash + monitoring)
  if (selectedWalletType?.value === "SPOT" && (step === 4 || step === 5)) {
    return <SpotDeposit />;
  }

  // ECO deposit flow (address + WS monitoring + confirmations)
  if (selectedWalletType?.value === "ECO" && step === 4) {
    return <EcoDeposit />;
  }

  // --- Main step-by-step form (steps 1-3) ---
  try {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <DepositPageHeader />
        <ErrorAlert error={error} selectedWalletType={selectedWalletType} loading={loading} retryFetchDepositAddress={retryFetchDepositAddress} t={t} tComponentsBlocks={tComponentsBlocks} />

        {/* Step 1: Wallet Type */}
        <WalletTypeSelector
          selectedWalletType={selectedWalletType}
          onSelect={handleWalletSelect}
          availableWallets={availableWallets}
        />

        {/* Step 2: Currency */}
        <AnimatePresence>
          {selectedWalletType && currencies.length > 0 && (
            <CurrencySelector
              currencies={currencies}
              selectedCurrency={selectedCurrency}
              onSelect={handleCurrencySelect}
            />
          )}
        </AnimatePresence>

        {/* Step 3: Deposit Method */}
        <AnimatePresence>
          {selectedCurrency && (
            <DepositMethodSelector
              walletType={selectedWalletType?.value || ""}
              selectedCurrency={selectedCurrency}
              depositMethods={depositMethods}
              selectedDepositMethod={selectedDepositMethod}
              loading={loading}
              onMethodSelect={handleMethodSelect}
            />
          )}
        </AnimatePresence>

        {/* Reset */}
        <div className="flex justify-center">
          <Button
            variant="ghost"
            onClick={reset}
            className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            {t("start_over")}
          </Button>
        </div>
      </div>
    );
  } catch (err) {
    console.error("Error rendering deposit form:", err);
    return (
      <DepositError
        error={t("an_error_occurred_while_loading_the")}
        onRetry={() => window.location.reload()}
        onCancel={() => reset()}
      />
    );
  }
}

// --- Small helper sub-components ---

function DepositPageHeader() {
  const t = useTranslations("common");
  const tExt = useTranslations("ext");
  return (
    <div className="text-center space-y-4">
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
        {tExt("deposit_funds")}
      </h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        {t("add_funds_to_your_wallet_quickly_and_securely")}
      </p>
    </div>
  );
}

function ErrorAlert({ error, selectedWalletType, loading, retryFetchDepositAddress, t, tComponentsBlocks }: any) {
  if (!error) return null;

  return (
    <AnimatePresence>
      <motion.div {...fadeInUp}>
        <Alert className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertTitle className="text-red-800 dark:text-red-300">Error</AlertTitle>
          <AlertDescription className="text-red-700 dark:text-red-400">
            {error}
            {selectedWalletType?.value === "ECO" &&
              (error.includes("custodial wallets are currently in use") ||
                error.includes("All custodial wallets") ||
                error.includes("try again")) && (
                <div className="mt-3">
                  <Button
                    onClick={retryFetchDepositAddress}
                    disabled={loading}
                    size="sm"
                    variant="outline"
                    className="border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/20"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500 mr-2"></div>
                        {tComponentsBlocks("retrying")}.
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        {t("try_again")}
                      </>
                    )}
                  </Button>
                </div>
              )}
          </AlertDescription>
        </Alert>
      </motion.div>
    </AnimatePresence>
  );
}
