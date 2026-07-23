import {
  startRegistration,
  startAuthentication,
  browserSupportsWebAuthn,
} from '@simplewebauthn/browser';
import { apiFetch } from '@/lib/apiFetch';

export function isBiometricSupported() {
  return browserSupportsWebAuthn();
}

export async function registerBiometricDevice(apiUrl, token, deviceName) {
  if (!browserSupportsWebAuthn()) {
    throw new Error(
      'Your browser or device does not support WebAuthn / biometrics.'
    );
  }

  const optionsJSON = await apiFetch(
    `${apiUrl}/auth/webauthn/register/options`,
    token,
    {
      method: 'POST',
    }
  );

  const registrationResponse = await startRegistration({ optionsJSON });

  const verifiedCredential = await apiFetch(
    `${apiUrl}/auth/webauthn/register/verify`,
    token,
    {
      method: 'POST',
      body: JSON.stringify({
        response: registrationResponse,
        device_name: deviceName || null,
      }),
    }
  );

  return verifiedCredential;
}

export async function loginWithBiometrics(apiUrl, email) {
  if (!browserSupportsWebAuthn()) {
    throw new Error(
      'Your browser or device does not support WebAuthn / biometrics.'
    );
  }

  if (!email) {
    throw new Error('Please enter your email address to log in with biometrics.');
  }

  const optionsJSON = await apiFetch(
    `${apiUrl}/auth/webauthn/login/options`,
    null,
    {
      method: 'POST',
      body: JSON.stringify({ email }),
    }
  );

  const authResponse = await startAuthentication({ optionsJSON });

  const tokenData = await apiFetch(
    `${apiUrl}/auth/webauthn/login/verify`,
    null,
    {
      method: 'POST',
      body: JSON.stringify({
        email,
        response: authResponse,
      }),
    }
  );

  return tokenData;
}

export async function getUserBiometricCredentials(apiUrl, token) {
  return await apiFetch(`${apiUrl}/auth/webauthn/credentials`, token, {
    method: 'GET',
  });
}

export async function deleteBiometricCredential(apiUrl, token, credentialId) {
  return await apiFetch(
    `${apiUrl}/auth/webauthn/credentials/${credentialId}`,
    token,
    {
      method: 'DELETE',
    }
  );
}
