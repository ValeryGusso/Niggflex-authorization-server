import UserService from '../service/user.js'
import TokenService from '../service/token.js'
import UserModel from '../models/user.js'
import MailService from '../service/mail.js'
import { validationResult } from 'express-validator'
import UserDTO from '../user-dto.js'
import bcrypt from 'bcrypt'
import fs from 'fs'

export async function registration(req, res) {
	try {
		const errors = validationResult(req)

		if (!errors.isEmpty()) {
			return res.status(400).json(errors.array())
		}

		const { email, password } = req.body
		const user = await UserService.registration(email, password)

		return res.json(user)
	} catch (err) {
		if (err.message === 'Пользователь с таким адресом уже существует') {
			return res.status(409).json({ msg: err.message })
		}
		return res.status(500).json({ msg: err.message })
	}
}

export async function activate(req, res) {
	try {
		const { id, key } = req.body
		const { user, tokens } = await UserService.activate(id, key)
		res.cookie('refreshToken', user.refresh, {
			maxAge: 30 * 24 * 3600 * 1000,
			httpOnly: true,
			secure: true,
			SameSite: 'none',
			sameSite: 'none',
			domain: process.env.COOKIE_DOMAIN,
		})
		return res.json({ user, access: tokens.access })
	} catch (err) {
		return res.status(500).json({ message: err.message })
	}
}

export async function login(req, res) {
	try {
		const { email, password } = req.body
		const { user, tokens } = await UserService.login(email, password)

		res.cookie('refreshToken', tokens.refresh, {
			maxAge: 30 * 24 * 3600 * 1000,
			httpOnly: true,
			secure: true,
			SameSite: 'none',
			sameSite: 'none',
			domain: process.env.COOKIE_DOMAIN,
		})

		return res.json({ user, access: tokens.access })
	} catch (err) {
		res.status(501).json({ message: err.message })
	}
}

export async function logout(req, res) {
	try {
		const { refreshToken } = req.cookies

		const success = await UserService.logout(refreshToken)

		res.clearCookie('refreshToken')
		return res.json(success)
	} catch (err) {
		return res.status(500).json({ success: false, message: err.message })
	}
}

export async function refresh(req, res) {
	try {
		const { refreshToken } = req.cookies

		const { user, access, refresh } = await TokenService.refresh(refreshToken)

		res.cookie('refreshToken', refresh, {
			maxAge: 30 * 24 * 3600 * 1000,
			httpOnly: true,
			secure: true,
			SameSite: 'none',
			sameSite: 'none',
			domain: process.env.COOKIE_DOMAIN,
		})

		return res.json({ user, access })
	} catch (err) {
		res.status(401).json({ success: false, message: err.message })
	}
}

export async function checkAuth(req, res, next) {
	try {
		const token = req.headers.authorization.replace(/Bearer\s?/, '')

		if (!token) {
			return res.status(401).json({ message: 'Нет токена авторизации' })
		}

		const verify = await TokenService.verifyAccess(token)

		if (!verify) {
			return res.status(401).json({ message: 'Токен авторизации невалиден' })
		}

		req.user = verify
		next()
	} catch (err) {
		return res.status(401).json({ message: 'Пользователь не авторизован' })
	}
}

export async function getMe(req, res) {
	try {
		const user = await UserModel.findById(req.user.id)
		const userDTO = new UserDTO(user)
		return res.json({ ...userDTO })
	} catch (err) {
		return res.status(401).json({ message: 'Пользователь не авторизован' })
	}
}

export async function addFavorite(req, res) {
	try {
		const user = await UserModel.findById(req.user.id)

		if (!user.favorite.includes(req.body.id)) {
			user.favorite.push(req.body.id)

			await user.save()

			const userDTO = new UserDTO(user)

			return res.json({ user: userDTO })
		} else {
			res.status(500).json({ message: 'Позиция уже существует' })
		}
	} catch (err) {
		res.status(500).json({ message: 'Не удалось добавить в список избранного' })
	}
}

export async function addViewed(req, res) {
	try {
		const user = await UserModel.findById(req.user.id)

		if (!user.viewed.includes(req.body.id)) {
			user.viewed.push(req.body.id)

			await user.save()

			const userDTO = new UserDTO(user)

			return res.json({ user: userDTO })
		} else {
			res.status(500).json({ message: 'Позиция уже существует' })
		}
	} catch (err) {
		res.status(500).json({ message: 'Не удалось добавить в список просмотренного' })
	}
}

export async function removeFavorite(req, res) {
	try {
		const user = await UserModel.findById(req.user.id)

		if (user.favorite.includes(req.body.id)) {
			const filtred = user.favorite.filter(el => el !== req.body.id)
			user.favorite = filtred

			await user.save()

			const userDTO = new UserDTO(user)

			return res.json({ user: userDTO })
		} else {
			res.status(500).json({ message: 'Позиция не существует' })
		}
	} catch (err) {
		res.status(500).json({ message: 'Не удалось удалить из списка избранного' })
	}
}

export async function removeViewed(req, res) {
	try {
		const user = await UserModel.findById(req.user.id)

		if (user.viewed.includes(req.body.id)) {
			const filtred = user.viewed.filter(el => el !== req.body.id)
			user.viewed = filtred

			await user.save()

			const userDTO = new UserDTO(user)

			return res.json({ user: userDTO })
		} else {
			res.status(500).json({ message: 'Позиция не существует' })
		}
	} catch (err) {
		res.status(500).json({ message: 'Не удалось удалить из списка просмотренного' })
	}
}

export async function update(req, res) {
	try {
		const user = await UserModel.findById(req.user.id)
		const { name, sex, avatar, password, confirm } = req.body

		if (name && name !== user.name) {
			user.name = name
		}

		if (sex && sex !== user.sex) {
			user.sex = sex
		}

		if (avatar && avatar !== user.avatar) {
			user.avatar = avatar
		}

		if (password && confirm && password === confirm) {
			const salt = await bcrypt.genSalt(12)
			const passHash = await bcrypt.hash(password, salt)
			user.password = passHash
		}

		await user.save()
		getMe(req, res)
	} catch (err) {
		return res.status(500).json({ message: 'Не удалось обновить информацию' })
	}
}

export async function resendCode(req, res) {
	try {
		const { email } = req.body

		const user = await UserModel.findOne({ email })

		const { sended } = await MailService.sendCode(email, user.key)

		return res.json(sended)
	} catch (error) {
		return res.status(500).json({ message: 'Не удалось отправить письмо' })
	}
}

export async function uploadImage(req, res) {
	try {
		const user = await UserModel.findById(req.user.id)

		let prevAvatar = user.avatar.match(/\/uploads\/[\w\d]+\.\w+/gi) || ''
		if (prevAvatar) {
			prevAvatar = prevAvatar[0].replace('/uploads/', '')
		}

		user.avatar = `${process.env.SERVER_URL}/uploads/${req.file.originalname}`
		await user.save()

		if (fs.existsSync(`./uploads/${prevAvatar}`)) {
			fs.rm('./uploads/' + prevAvatar, { recursive: true }, err => {
				if (err) {
					res.status(500).json({ message: 'Ошибка фс' })
				}
			})
		}
		const userDTO = new UserDTO(user)
		return res.json({ ...userDTO })
	} catch (error) {
		res.status(500).json({ message: 'Ошибка на сервера' })
	}
}
