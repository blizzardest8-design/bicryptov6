import { $fetch } from "@/lib/api";
import type { DepositResult } from "./types";

const ENDPOINT = "/api/finance";
const POPUP_WIDTH = 600;
const POPUP_HEIGHT = 700;
const PAYMENT_TIMEOUT = 10 * 60 * 1000; // 10 minutes

/**
 * Initiate a gateway payment by calling the backend
 */
export async function initiateGatewayPayment(
  gateway: string,
  amount: number,
  currency: string,
  additionalData?: Record<string, any>
) {
  const { data, error } = await $fetch({
    url: `${ENDPOINT}/deposit/fiat/${gateway}`,
    method: "POST",
    silent: true,
    body: { amount, currency, ...additionalData },
  });

  if (error) {
    throw new Error(error || `Failed to initiate ${gateway} payment`);
  }

  return data;
}

/**
 * Verify a gateway payment by calling the verify endpoint
 */
export async function verifyGatewayPayment(
  gateway: string,
  params: Record<string, string>,
  method: "GET" | "POST" = "POST"
) {
  const { data, error } = await $fetch({
    url: `${ENDPOINT}/deposit/fiat/${gateway}/verify`,
    method,
    silent: true,
    ...(method === "GET" ? { params } : { body: params }),
  });

  if (error) {
    throw new Error(error || `Failed to verify ${gateway} payment`);
  }

  return data;
}

/**
 * Open a payment gateway in a popup window
 */
export function openGatewayPopup(
  url: string,
  name: string = "paymentPopup"
): Window | null {
  return window.open(
    url,
    name,
    `width=${POPUP_WIDTH},height=${POPUP_HEIGHT},scrollbars=yes,resizable=yes`
  );
}

/**
 * Monitor a popup window and call onClose when it closes
 * Returns a cleanup function
 */
export function monitorPopup(
  popup: Window,
  onClose: () => void,
  timeoutMs: number = PAYMENT_TIMEOUT
): () => void {
  let closed = false;

  const checkInterval = setInterval(() => {
    try {
      if (popup.closed && !closed) {
        closed = true;
        clearInterval(checkInterval);
        onClose();
      }
    } catch {
      // Ignore cross-origin errors
    }
  }, 1000);

  const timeout = setTimeout(() => {
    if (!closed) {
      closed = true;
      clearInterval(checkInterval);
      try {
        if (!popup.closed) popup.close();
      } catch {}
      onClose();
    }
  }, timeoutMs);

  return () => {
    closed = true;
    clearInterval(checkInterval);
    clearTimeout(timeout);
  };
}

/**
 * Extract a nested field value from an object using dot notation
 * e.g., getNestedValue(data, "data.checkoutUrl")
 */
export function getNestedValue(obj: any, path: string): any {
  if (!obj) return undefined;
  const parts = path.split(".");
  let current = obj;
  for (const part of parts) {
    if (current == null) return undefined;
    current = current[part];
  }
  return current;
}

/**
 * Extract the first available URL from data using a list of possible field paths
 */
export function extractUrl(data: any, fieldPaths: string[]): string | null {
  for (const path of fieldPaths) {
    const value = getNestedValue(data, path);
    if (value && typeof value === "string") return value;
  }
  return null;
}

/**
 * Extract the first available payment ID from data using a list of possible field paths
 */
export function extractPaymentId(data: any, fieldPaths: string[]): string | null {
  for (const path of fieldPaths) {
    const value = getNestedValue(data, path);
    if (value != null) return String(value);
  }
  return null;
}

/**
 * Format a verify response into a standardized DepositResult
 */
export function formatDepositResult(
  data: any,
  gateway: string,
  fallbackAmount?: number,
  fallbackCurrency?: string
): DepositResult {
  return {
    confirmed: true,
    status: "COMPLETED",
    id: data?.transaction?.id || data?.id || "",
    amount: data?.transaction?.amount || data?.amount || fallbackAmount || 0,
    currency: data?.transaction?.currency || data?.currency || fallbackCurrency || "",
    method: data?.method || gateway,
    transactionHash: data?.transaction?.referenceId || data?.referenceId || data?.transactionId || "",
    referenceId: data?.transaction?.referenceId || data?.referenceId || "",
    balance: data?.balance,
    transaction: data?.transaction,
    fee: data?.transaction?.fee || data?.fee,
    description: data?.transaction?.description || data?.description || `${gateway} deposit`,
  };
}

/**
 * Load an external script dynamically
 * Returns a promise that resolves when the script is loaded
 */
export function loadExternalScript(
  src: string,
  id: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.getElementById(id);
    if (existing) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.id = id;
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.body.appendChild(script);
  });
}

/**
 * Remove an external script by ID
 */
export function removeExternalScript(id: string): void {
  const existing = document.getElementById(id);
  if (existing) existing.remove();
}

/**
 * Create a hidden form and auto-submit it in a popup window
 * Used by form POST gateways (PayFast, PayU, etc.)
 */
export function submitFormInPopup(
  actionUrl: string,
  formData: Record<string, string>,
  popupName: string = "paymentPopup"
): Window | null {
  // Open a blank popup first
  const popup = window.open("about:blank", popupName,
    `width=${POPUP_WIDTH},height=${POPUP_HEIGHT},scrollbars=yes,resizable=yes`
  );

  if (!popup) return null;

  // Create and submit a form targeting the popup
  const form = document.createElement("form");
  form.method = "POST";
  form.action = actionUrl;
  form.target = popupName;
  form.style.display = "none";

  for (const [key, value] of Object.entries(formData)) {
    if (value == null) continue;
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = String(value);
    form.appendChild(input);
  }

  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);

  return popup;
}

/**
 * Check if a verify response indicates success
 */
export function isPaymentSuccessful(data: any): boolean {
  return (
    data?.status === "completed" ||
    data?.status === "COMPLETED" ||
    data?.confirmed === true ||
    data?.success === true ||
    data?.data?.status === "COMPLETED"
  );
}
