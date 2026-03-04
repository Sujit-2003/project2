import CryptoJS from 'crypto-js'

const SECRET_KEY = CryptoJS.enc.Utf8.parse('12345678901234567890123456789012')
const FIXED_IV = CryptoJS.enc.Utf8.parse('abcdefghijklmnop')

export function encrypt(text) {
  const encrypted = CryptoJS.AES.encrypt(text, SECRET_KEY, {
    iv: FIXED_IV,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  })
  return encrypted.toString()
}

export function decrypt(cipherText) {
  try {
    const decrypted = CryptoJS.AES.decrypt(cipherText, SECRET_KEY, {
      iv: FIXED_IV,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    })
    const result = decrypted.toString(CryptoJS.enc.Utf8)
    // If decryption returns empty or garbage, return original text
    return result || cipherText
  } catch {
    // Not encrypted or invalid — return as-is (plain text like admin@gmail.com)
    return cipherText
  }
}

export function decryptSafe(text) {
  if (!text) return '-'
  // If it looks like a normal email (contains @), it's already plain text
  if (text.includes('@')) return text
  // Otherwise try to decrypt
  return decrypt(text)
}

export function decryptField(text) {
  if (!text) return '-'
  return decrypt(text)
}

export function encryptEmail(email) {
  return encrypt(email.toLowerCase())
}
