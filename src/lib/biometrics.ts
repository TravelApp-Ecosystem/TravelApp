/**
 * Biometric Authentication Helper using WebAuthn Platform Authenticator
 * (Touch ID / Face ID / Android Fingerprint)
 */

export interface BiometricCredentials {
  email: string;
  credentialId: string;
  registeredAt: number;
}

const STORAGE_KEY_BIOMETRIC_CRED = "travelapp_biometric_credential";
const STORAGE_KEY_LAST_EMAIL = "travelapp_last_email";

/**
 * Check if the current browser and hardware support platform biometric authentication
 */
export async function isBiometricsAvailable(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!window.PublicKeyCredential) return false;
  
  try {
    const isAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    return Boolean(isAvailable);
  } catch (error) {
    console.warn("Error checking platform authenticator availability:", error);
    return false;
  }
}

/**
 * Check if the user has already registered biometric credentials on this device
 */
export function hasBiometricCredentials(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(localStorage.getItem(STORAGE_KEY_BIOMETRIC_CRED));
}

/**
 * Get the saved biometric credential email
 */
export function getSavedBiometricEmail(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const data = localStorage.getItem(STORAGE_KEY_BIOMETRIC_CRED);
    if (!data) return localStorage.getItem(STORAGE_KEY_LAST_EMAIL);
    const parsed: BiometricCredentials = JSON.parse(data);
    return parsed.email || localStorage.getItem(STORAGE_KEY_LAST_EMAIL);
  } catch {
    return localStorage.getItem(STORAGE_KEY_LAST_EMAIL);
  }
}

/**
 * Register biometric credentials for the given email
 */
export async function registerBiometric(email: string): Promise<boolean> {
  if (typeof window === "undefined" || !window.PublicKeyCredential) return false;

  try {
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const userId = new Uint8Array(16);
    window.crypto.getRandomValues(userId);

    const creationOptions: CredentialCreationOptions = {
      publicKey: {
        challenge,
        rp: {
          name: "TravelApp Ecosystem",
          id: window.location.hostname === "localhost" ? "localhost" : window.location.hostname,
        },
        user: {
          id: userId,
          name: email,
          displayName: email.split("@")[0],
        },
        pubKeyCredParams: [
          { alg: -7, type: "public-key" },  // ES256
          { alg: -257, type: "public-key" }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform", // Native device biometrics (FaceID, TouchID, Android Fingerprint)
          userVerification: "required",
          requireResidentKey: false,
        },
        timeout: 60000,
        attestation: "none",
      },
    };

    const credential = (await navigator.credentials.create(creationOptions)) as PublicKeyCredential | null;
    if (!credential) return false;

    const credData: BiometricCredentials = {
      email,
      credentialId: credential.id,
      registeredAt: Date.now(),
    };

    localStorage.setItem(STORAGE_KEY_BIOMETRIC_CRED, JSON.stringify(credData));
    localStorage.setItem(STORAGE_KEY_LAST_EMAIL, email);
    return true;
  } catch (error: any) {
    console.error("Error registering biometrics:", error);
    if (error.name !== "NotAllowedError") {
      localStorage.setItem(STORAGE_KEY_LAST_EMAIL, email);
    }
    return false;
  }
}

/**
 * Verify identity using native device biometrics (Touch ID / Face ID / Fingerprint)
 */
export async function verifyBiometric(): Promise<{ success: boolean; email?: string }> {
  if (typeof window === "undefined" || !window.PublicKeyCredential) {
    return { success: false };
  }

  const savedEmail = getSavedBiometricEmail();
  if (!savedEmail) {
    return { success: false };
  }

  try {
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const getOptions: CredentialRequestOptions = {
      publicKey: {
        challenge,
        rpId: window.location.hostname === "localhost" ? "localhost" : window.location.hostname,
        userVerification: "required",
        timeout: 60000,
      },
    };

    const assertion = await navigator.credentials.get(getOptions);
    if (assertion) {
      return { success: true, email: savedEmail };
    }
    return { success: false };
  } catch (error: any) {
    console.error("Biometric verification error:", error);
    return { success: false };
  }
}

/**
 * Remove registered biometric credentials
 */
export function clearBiometrics(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY_BIOMETRIC_CRED);
}
