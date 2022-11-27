import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import * as userController from './controllers/user.js'
import { regValidation } from './validation.js'
dotenv.config()

mongoose
	.connect(process.env.MONGODB_URI)
	.then(() => console.log('Connected with DB up'))
	.catch(err => console.log('Connect with DB failed', err))

const app = express()

app.use(
	cors({
		credentials: true,
		origin: true,
	})
)
app.use(express.json())
app.use(cookieParser())

app.post('/registration', regValidation, userController.registration)
app.post('/activate', userController.activate)
app.post('/login', userController.login)
app.get('/logout', userController.logout)
app.get('/refresh', userController.refresh)
app.get('/me', userController.checkAuth, userController.getMe)
app.patch('/favorite', userController.checkAuth, userController.addFavorite)
app.delete('/favorite', userController.checkAuth, userController.removeFavorite)
app.patch('/viewed', userController.checkAuth, userController.addViewed)
app.delete('/viewed', userController.checkAuth, userController.removeViewed)
app.patch('/update', userController.checkAuth, userController.update)

app.listen(process.env.PORT, err => {
	if (err) console.log('Server ERROR: ', err)
	console.log('Server UP')
})
