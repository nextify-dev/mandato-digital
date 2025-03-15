const admin = require('firebase-admin')
require('dotenv').config()

let serviceAccount
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
} else {
  serviceAccount = require('./serviceAccountKey.json')
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL
})

const db = admin.database()

module.exports = { db, admin }
