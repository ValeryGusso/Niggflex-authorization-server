import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import { uploadMiddleware } from './service/image.js'
import * as userController from './controllers/user.js'
import { regValidation } from './validation.js'
dotenv.config()

mongoose
	.connect(process.env.MONGODB_URI)
	.then(() => console.log('Connected with DB up'))
	.catch(err => console.log('Connect with DB failed', err))

const app = express()

const defaultOptions = {
	credentials: true,
	origin: process.env.CLIENT_URL,
}

// app.use(
// 	cors({
// 		credentials: true,
// 		origin: process.env.CLIENT_URL,
// 	})
// )

app.use(express.json())
app.use(cookieParser())
app.use('/uploads', express.static('uploads'))

app.options('*', cors(defaultOptions))
app.post('/registration', cors(defaultOptions), regValidation, userController.registration)
app.post('/activate', cors(defaultOptions), userController.activate)
app.post('/resend', cors(defaultOptions), userController.resendCode)
app.post('/login', cors(defaultOptions), userController.login)
app.get('/logout', cors(defaultOptions), userController.logout)
app.get('/refresh', cors(defaultOptions), userController.refresh)
app.get('/me', cors(defaultOptions), userController.checkAuth, userController.getMe)
app.patch('/favorite', cors(defaultOptions), userController.checkAuth, userController.addFavorite)
app.delete('/favorite', cors(defaultOptions), userController.checkAuth, userController.removeFavorite)
app.patch('/viewed', cors(defaultOptions), userController.checkAuth, userController.addViewed)
app.delete('/viewed', cors(defaultOptions), userController.checkAuth, userController.removeViewed)
app.patch('/update', cors(defaultOptions), userController.checkAuth, userController.update)
app.post(
	'/image',
	cors({ origin: '*', credentials: false }),
	userController.checkAuth,
	uploadMiddleware,
	userController.uploadImage
)

app.listen(process.env.PORT, err => {
	if (err) console.log('Server ERROR: ', err)
	console.log('Server UP')
})
