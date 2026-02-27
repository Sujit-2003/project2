import CryptoJS from 'crypto-js'

const SECRET_KEY = CryptoJS.enc.Utf8.parse('12345678901234567890123456789012')
const FIXED_IV = CryptoJS.enc.Utf8.parse('abcdefghijklmnop')

export function encrypt(password) {
  const encrypted = CryptoJS.AES.encrypt(password, SECRET_KEY, {
    iv: FIXED_IV,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  })
  return encrypted.toString()
}
